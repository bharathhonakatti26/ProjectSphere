const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const { User, Classroom, Team, Project } = require('../models');
const { ChatRoom, Message } = require('../models/Chat');

/**
 * Initialize Socket.IO
 */
const initializeSocket = (server, corsOrigin) => {
  const io = new Server(server, {
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return next(new Error('Invalid or expired token'));
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive || user.isDeleted) {
        return next(new Error('User not found or inactive'));
      }

      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.user = {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
      };

      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    // Join user's personal room
    socket.join(`user:${socket.userId}`);

    // Join all user's chat rooms
    joinUserRooms(socket);

    // Handle joining a specific room
    socket.on('join-room', async (roomId) => {
      try {
        const room = await ChatRoom.findById(roomId);
        if (room) {
          const canAccess = await room.canAccess(socket.userId, socket.userRole);
          if (canAccess) {
            socket.join(`room:${roomId}`);
            console.log(`User ${socket.userId} joined room ${roomId}`);
          }
        }
      } catch (error) {
        console.error('Error joining room:', error);
      }
    });

    // Handle leaving a room
    socket.on('leave-room', (roomId) => {
      socket.leave(`room:${roomId}`);
      console.log(`User ${socket.userId} left room ${roomId}`);
    });

    // Handle sending a message
    socket.on('send-message', async (data) => {
      try {
        const { roomId, content, type, attachments } = data;

        const room = await ChatRoom.findById(roomId);
        if (!room) {
          socket.emit('error', { message: 'Chat room not found' });
          return;
        }

        const canAccess = await room.canAccess(socket.userId, socket.userRole);
        if (!canAccess) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Additional check for classroom chat
        if (room.type === 'CLASSROOM_CHAT') {
          const classroom = await Classroom.findById(room.classroom);
          if (!classroom.isTeacher(socket.userId)) {
            socket.emit('error', { message: 'Only the teacher can send messages in classroom chat' });
            return;
          }
        }

        // Create message
        const message = await Message.create({
          chatRoom: roomId,
          sender: socket.userId,
          content,
          type: type || 'TEXT',
          attachments: attachments || [],
          readBy: [{ user: socket.userId }],
        });

        await message.populate('sender', 'firstName lastName email avatar');

        // Update room's last message
        await room.updateLastMessage(content, socket.userId);

        // Broadcast to room
        io.to(`room:${roomId}`).emit('new-message', {
          roomId,
          message,
        });

        // Notify room participants
        const participants = await getRoomParticipants(room);
        participants.forEach((participantId) => {
          if (participantId !== socket.userId) {
            io.to(`user:${participantId}`).emit('message-notification', {
              roomId,
              message,
            });
          }
        });
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicator
    socket.on('typing-start', (roomId) => {
      socket.to(`room:${roomId}`).emit('user-typing', {
        roomId,
        user: socket.user,
      });
    });

    socket.on('typing-stop', (roomId) => {
      socket.to(`room:${roomId}`).emit('user-stopped-typing', {
        roomId,
        userId: socket.userId,
      });
    });

    // Handle message read
    socket.on('mark-read', async (data) => {
      try {
        const { roomId, messageIds } = data;

        await Message.updateMany(
          {
            _id: { $in: messageIds },
            chatRoom: roomId,
            'readBy.user': { $ne: socket.userId },
          },
          {
            $addToSet: { readBy: { user: socket.userId } },
          }
        );

        socket.to(`room:${roomId}`).emit('messages-read', {
          roomId,
          userId: socket.userId,
          messageIds,
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle message edit
    socket.on('edit-message', async (data) => {
      try {
        const { messageId, content } = data;

        const message = await Message.findOne({
          _id: messageId,
          sender: socket.userId,
          isDeleted: false,
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found or access denied' });
          return;
        }

        message.content = content;
        message.isEdited = true;
        message.editedAt = new Date();
        await message.save();

        await message.populate('sender', 'firstName lastName email avatar');

        io.to(`room:${message.chatRoom}`).emit('message-edited', {
          roomId: message.chatRoom,
          message,
        });
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Failed to edit message' });
      }
    });

    // Handle message delete
    socket.on('delete-message', async (data) => {
      try {
        const { messageId } = data;

        const message = await Message.findOne({
          _id: messageId,
          sender: socket.userId,
          isDeleted: false,
        });

        if (!message) {
          socket.emit('error', { message: 'Message not found or access denied' });
          return;
        }

        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        io.to(`room:${message.chatRoom}`).emit('message-deleted', {
          roomId: message.chatRoom,
          messageId,
        });
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
};

/**
 * Join all rooms the user has access to
 */
async function joinUserRooms(socket) {
  try {
    const userId = socket.userId;
    const userRole = socket.userRole;

    // Direct messages
    const directMessages = await ChatRoom.find({
      type: 'DIRECT_MESSAGE',
      participants: userId,
      isDeleted: false,
    });

    directMessages.forEach((room) => {
      socket.join(`room:${room._id}`);
    });

    if (userRole === 'TEACHER') {
      // Classroom chats
      const classrooms = await Classroom.find({ teacher: userId, isDeleted: false });
      const classroomIds = classrooms.map((c) => c._id);

      const classroomChats = await ChatRoom.find({
        type: 'CLASSROOM_CHAT',
        classroom: { $in: classroomIds },
        isDeleted: false,
      });

      classroomChats.forEach((room) => {
        socket.join(`room:${room._id}`);
      });

      // Team review chats
      const teams = await Team.find({ classroom: { $in: classroomIds }, isDeleted: false });
      const teamIds = teams.map((t) => t._id);

      const teamReviewChats = await ChatRoom.find({
        type: 'TEAM_REVIEW_CHAT',
        team: { $in: teamIds },
        isDeleted: false,
      });

      teamReviewChats.forEach((room) => {
        socket.join(`room:${room._id}`);
      });

      // Project chats for teachers (as mentors)
      const teacherProjects = await Project.find({
        $or: [
          { 'mentors.user': userId, 'mentors.status': 'ACTIVE' },
        ],
        isDeleted: false,
      });
      const teacherProjectIds = teacherProjects.map((p) => p._id);

      const teacherProjectChats = await ChatRoom.find({
        type: 'PROJECT_CHAT',
        project: { $in: teacherProjectIds },
        isDeleted: false,
      });

      teacherProjectChats.forEach((room) => {
        socket.join(`room:${room._id}`);
      });
    } else {
      // Student classroom chats
      const classrooms = await Classroom.find({
        'students.user': userId,
        'students.status': 'ACTIVE',
        isDeleted: false,
      });
      const classroomIds = classrooms.map((c) => c._id);

      const classroomChats = await ChatRoom.find({
        type: 'CLASSROOM_CHAT',
        classroom: { $in: classroomIds },
        isDeleted: false,
      });

      classroomChats.forEach((room) => {
        socket.join(`room:${room._id}`);
      });

      // Team chats
      const teams = await Team.find({
        'members.user': userId,
        'members.status': 'ACTIVE',
        isDeleted: false,
      });
      const teamIds = teams.map((t) => t._id);

      const teamChats = await ChatRoom.find({
        type: { $in: ['TEAM_INTERNAL_CHAT', 'TEAM_REVIEW_CHAT'] },
        team: { $in: teamIds },
        isDeleted: false,
      });

      teamChats.forEach((room) => {
        socket.join(`room:${room._id}`);
      });

      // Project chats - join rooms for projects user is member of
      const projects = await Project.find({
        $or: [
          { creator: userId },
          { 'members.user': userId, 'members.status': 'ACTIVE' },
          { 'mentors.user': userId, 'mentors.status': 'ACTIVE' },
        ],
        isDeleted: false,
      });
      const projectIds = projects.map((p) => p._id);

      const projectChats = await ChatRoom.find({
        type: 'PROJECT_CHAT',
        project: { $in: projectIds },
        isDeleted: false,
      });

      projectChats.forEach((room) => {
        socket.join(`room:${room._id}`);
      });
    }
  } catch (error) {
    console.error('Error joining user rooms:', error);
  }
}

/**
 * Get room participants for notifications
 */
async function getRoomParticipants(room) {
  const participants = [];

  switch (room.type) {
    case 'DIRECT_MESSAGE':
      room.participants.forEach((p) => participants.push(p.toString()));
      break;

    case 'CLASSROOM_CHAT': {
      const classroom = await Classroom.findById(room.classroom);
      if (classroom) {
        participants.push(classroom.teacher.toString());
        classroom.students
          .filter((s) => s.status === 'ACTIVE')
          .forEach((s) => participants.push(s.user.toString()));
      }
      break;
    }

    case 'TEAM_INTERNAL_CHAT': {
      const team = await Team.findById(room.team);
      if (team) {
        team.members
          .filter((m) => m.status === 'ACTIVE')
          .forEach((m) => participants.push(m.user.toString()));
      }
      break;
    }

    case 'TEAM_REVIEW_CHAT': {
      const team = await Team.findById(room.team).populate('classroom');
      if (team) {
        const classroom = team.classroom;
        participants.push(classroom.teacher.toString());
        team.members
          .filter((m) => m.status === 'ACTIVE')
          .forEach((m) => participants.push(m.user.toString()));
      }
      break;
    }

    case 'PROJECT_CHAT': {
      const project = await Project.findById(room.project);
      if (project) {
        // Add creator
        participants.push(project.creator.toString());
        // Add active members
        (project.members || [])
          .filter((m) => m.status === 'ACTIVE')
          .forEach((m) => participants.push(m.user.toString()));
        // Add active mentors
        (project.mentors || [])
          .filter((m) => m.status === 'ACTIVE')
          .forEach((m) => participants.push(m.user.toString()));
      }
      break;
    }
  }

  return [...new Set(participants)];
}

module.exports = { initializeSocket };
