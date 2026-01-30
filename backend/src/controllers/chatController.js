const asyncHandler = require('express-async-handler');
const { ChatRoom, Message } = require('../models/Chat');
const { Classroom, Team, User, Project } = require('../models');
const {
  ApiResponse,
  notFound,
  badRequest,
  forbidden,
  parsePagination,
} = require('../utils');

/**
 * @desc    Get user's chat rooms
 * @route   GET /api/chat/rooms
 * @access  Private
 */
const getChatRooms = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const userRole = req.userRole;

  let rooms = [];

  // Get direct messages
  const directMessages = await ChatRoom.find({
    type: 'DIRECT_MESSAGE',
    participants: userId,
    isDeleted: false,
  })
    .populate('participants', 'firstName lastName email avatar')
    .populate('lastMessage.sender', 'firstName lastName')
    .sort({ 'lastMessage.timestamp': -1 });

  rooms = [...directMessages];

  if (userRole === 'TEACHER') {
    // Get classroom chats for teacher
    const classrooms = await Classroom.find({ teacher: userId, isDeleted: false });
    const classroomIds = classrooms.map((c) => c._id);

    const classroomChats = await ChatRoom.find({
      type: 'CLASSROOM_CHAT',
      classroom: { $in: classroomIds },
      isDeleted: false,
    })
      .populate('classroom', 'name subject')
      .populate('lastMessage.sender', 'firstName lastName');

    // Get team chats for teacher (both internal and review)
    const teams = await Team.find({ classroom: { $in: classroomIds }, isDeleted: false });
    const teamIds = teams.map((t) => t._id);

    const teamInternalChats = await ChatRoom.find({
      type: 'TEAM_INTERNAL_CHAT',
      team: { $in: teamIds },
      isDeleted: false,
    })
      .populate('team', 'name')
      .populate('lastMessage.sender', 'firstName lastName');

    const teamReviewChats = await ChatRoom.find({
      type: 'TEAM_REVIEW_CHAT',
      team: { $in: teamIds },
      isDeleted: false,
    })
      .populate('team', 'name')
      .populate('lastMessage.sender', 'firstName lastName');

    rooms = [...rooms, ...classroomChats, ...teamInternalChats, ...teamReviewChats];
  } else {
    // Get classroom chats for student
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
    })
      .populate('classroom', 'name subject')
      .populate('lastMessage.sender', 'firstName lastName');

    // Get team chats for student
    const teams = await Team.find({
      'members.user': userId,
      'members.status': 'ACTIVE',
      isDeleted: false,
    });
    const teamIds = teams.map((t) => t._id);

    const teamInternalChats = await ChatRoom.find({
      type: 'TEAM_INTERNAL_CHAT',
      team: { $in: teamIds },
      isDeleted: false,
    })
      .populate('team', 'name')
      .populate('lastMessage.sender', 'firstName lastName');

    const teamReviewChats = await ChatRoom.find({
      type: 'TEAM_REVIEW_CHAT',
      team: { $in: teamIds },
      isDeleted: false,
    })
      .populate('team', 'name')
      .populate('lastMessage.sender', 'firstName lastName');

    rooms = [...rooms, ...classroomChats, ...teamInternalChats, ...teamReviewChats];
  }

  // Sort by last message timestamp
  rooms.sort((a, b) => {
    const aTime = a.lastMessage?.timestamp || a.createdAt;
    const bTime = b.lastMessage?.timestamp || b.createdAt;
    return new Date(bTime) - new Date(aTime);
  });

  return ApiResponse.success(res, { rooms });
});

/**
 * @desc    Get chat room by ID
 * @route   GET /api/chat/rooms/:id
 * @access  Private
 */
const getChatRoom = asyncHandler(async (req, res) => {
  const room = await ChatRoom.findOne({ _id: req.params.id, isDeleted: false })
    .populate('participants', 'firstName lastName email avatar')
    .populate('classroom', 'name subject teacher')
    .populate('team', 'name leader members');

  if (!room) {
    throw notFound('Chat room not found');
  }

  const canAccess = await room.canAccess(req.userId, req.userRole);
  if (!canAccess) {
    throw forbidden('You do not have access to this chat room');
  }

  return ApiResponse.success(res, { room });
});

/**
 * @desc    Get messages in a chat room
 * @route   GET /api/chat/rooms/:id/messages
 * @access  Private
 */
const getMessages = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { before } = req.query;

  const room = await ChatRoom.findOne({ _id: req.params.id, isDeleted: false });

  if (!room) {
    throw notFound('Chat room not found');
  }

  const canAccess = await room.canAccess(req.userId, req.userRole);
  if (!canAccess) {
    throw forbidden('You do not have access to this chat room');
  }

  const query = { chatRoom: req.params.id, isDeleted: false };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const [messages, total] = await Promise.all([
    Message.find(query)
      .populate('sender', 'firstName lastName email avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments(query),
  ]);

  // Mark messages as read
  await Message.updateMany(
    {
      chatRoom: req.params.id,
      'readBy.user': { $ne: req.userId },
    },
    {
      $addToSet: { readBy: { user: req.userId } },
    }
  );

  return ApiResponse.paginated(res, messages.reverse(), { page, limit, total });
});

/**
 * @desc    Send message (REST fallback, Socket.IO preferred)
 * @route   POST /api/chat/rooms/:id/messages
 * @access  Private
 */
const sendMessage = asyncHandler(async (req, res) => {
  const { content, type, attachments } = req.body;

  const room = await ChatRoom.findOne({ _id: req.params.id, isDeleted: false });

  if (!room) {
    throw notFound('Chat room not found');
  }

  const canAccess = await room.canAccess(req.userId, req.userRole);
  if (!canAccess) {
    throw forbidden('You do not have access to this chat room');
  }

  // Additional check for classroom chat - only teacher can send
  if (room.type === 'CLASSROOM_CHAT') {
    const classroom = await Classroom.findById(room.classroom);
    if (!classroom.isTeacher(req.userId)) {
      throw forbidden('Only the teacher can send messages in classroom chat');
    }
  }

  const message = await Message.create({
    chatRoom: req.params.id,
    sender: req.userId,
    content,
    type: type || 'TEXT',
    attachments: attachments || [],
    readBy: [{ user: req.userId }],
  });

  await room.updateLastMessage(content, req.userId);

  await message.populate('sender', 'firstName lastName email avatar');

  return ApiResponse.created(res, { message }, 'Message sent successfully');
});

/**
 * @desc    Create or get direct message room
 * @route   POST /api/chat/direct
 * @access  Private
 */
const createDirectMessage = asyncHandler(async (req, res) => {
  const { recipientId } = req.body;

  if (recipientId === req.userId.toString()) {
    throw badRequest('Cannot create a chat with yourself');
  }

  const recipient = await User.findOne({ _id: recipientId, isDeleted: false, isActive: true });
  if (!recipient) {
    throw notFound('Recipient not found');
  }

  // Validate direct message rules:
  // - Student can only DM teachers
  // - Teacher can DM students in their classrooms
  if (req.userRole === 'STUDENT') {
    if (recipient.role !== 'TEACHER') {
      throw forbidden('Students can only send direct messages to teachers');
    }
  } else if (req.userRole === 'TEACHER') {
    if (recipient.role === 'STUDENT') {
      // Check if student is in any of teacher's classrooms
      const classrooms = await Classroom.find({
        teacher: req.userId,
        'students.user': recipientId,
        'students.status': 'ACTIVE',
        isDeleted: false,
      });

      if (classrooms.length === 0) {
        throw forbidden('You can only message students from your classrooms');
      }
    }
  }

  const room = await ChatRoom.findOrCreateDirectMessage(req.userId, recipientId);
  await room.populate('participants', 'firstName lastName email avatar');

  return ApiResponse.success(res, { room });
});

/**
 * @desc    Create or get team review chat
 * @route   POST /api/chat/team-review/:teamId
 * @access  Private
 */
const createTeamReviewChat = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.teamId, isDeleted: false })
    .populate('classroom');

  if (!team) {
    throw notFound('Team not found');
  }

  const classroom = await Classroom.findById(team.classroom);
  const isTeacher = classroom.isTeacher(req.userId);
  const isMember = team.isMember(req.userId);

  if (!isTeacher && !isMember) {
    throw forbidden('Only the teacher or team members can create a review chat');
  }

  const room = await ChatRoom.findOrCreateTeamReviewChat(req.params.teamId, req.userId);
  await room.populate('team', 'name');

  return ApiResponse.success(res, { room });
});

/**
 * @desc    Get team internal chat
 * @route   GET /api/chat/team-internal/:teamId
 * @access  Private (Team members and classroom teacher)
 */
const getTeamInternalChat = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.teamId, isDeleted: false }).populate('classroom');

  if (!team) {
    throw notFound('Team not found');
  }

  const classroom = team.classroom;
  const isTeacher = classroom.isTeacher(req.userId);
  const isMember = team.isMember(req.userId);

  if (!isTeacher && !isMember) {
    throw forbidden('Only team members and classroom teacher can access the internal chat');
  }

  const room = await ChatRoom.findOrCreateTeamInternalChat(req.params.teamId);
  await room.populate('team', 'name');

  return ApiResponse.success(res, { room });
});

/**
 * @desc    Get classroom chat
 * @route   GET /api/chat/classroom/:classroomId
 * @access  Private
 */
const getClassroomChat = asyncHandler(async (req, res) => {
  const classroom = await Classroom.findOne({ _id: req.params.classroomId, isDeleted: false });

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  const isTeacher = classroom.isTeacher(req.userId);
  const isStudent = classroom.isStudentMember(req.userId);

  if (!isTeacher && !isStudent) {
    throw forbidden('You do not have access to this classroom');
  }

  const room = await ChatRoom.findOrCreateClassroomChat(req.params.classroomId);
  await room.populate('classroom', 'name subject');

  return ApiResponse.success(res, { room });
});

/**
 * @desc    Delete message
 * @route   DELETE /api/chat/messages/:id
 * @access  Private
 */
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findOne({ _id: req.params.id, isDeleted: false });

  if (!message) {
    throw notFound('Message not found');
  }

  if (message.sender.toString() !== req.userId.toString()) {
    throw forbidden('You can only delete your own messages');
  }

  message.isDeleted = true;
  message.deletedAt = new Date();
  await message.save();

  return ApiResponse.success(res, null, 'Message deleted successfully');
});

/**
 * @desc    Edit message
 * @route   PUT /api/chat/messages/:id
 * @access  Private
 */
const editMessage = asyncHandler(async (req, res) => {
  const { content } = req.body;

  const message = await Message.findOne({ _id: req.params.id, isDeleted: false });

  if (!message) {
    throw notFound('Message not found');
  }

  if (message.sender.toString() !== req.userId.toString()) {
    throw forbidden('You can only edit your own messages');
  }

  message.content = content;
  message.isEdited = true;
  message.editedAt = new Date();
  await message.save();

  await message.populate('sender', 'firstName lastName email avatar');

  return ApiResponse.success(res, { message }, 'Message edited successfully');
});

/**
 * @desc    Get project chat
 * @route   GET /api/chat/project/:projectId
 * @access  Private (Project members only)
 */
const getProjectChat = asyncHandler(async (req, res) => {
  console.log('Getting project chat for:', req.params.projectId);
  console.log('User ID:', req.userId);
  
  const project = await Project.findOne({ _id: req.params.projectId, isDeleted: false });

  if (!project) {
    console.log('Project not found');
    throw notFound('Project not found');
  }

  console.log('Project found:', project.title);
  console.log('Project creator:', project.creator);
  console.log('Project members:', project.members);

  // Check if user has access to project chat
  const userId = req.userId;
  const isCreator = project.creator.toString() === userId.toString();
  const isMember = project.members?.some(
    m => m.user.toString() === userId.toString() && m.status === 'ACTIVE'
  );
  const isMentor = project.mentors?.some(
    m => m.user.toString() === userId.toString() && m.status === 'ACTIVE'
  );

  console.log('Access check - isCreator:', isCreator, 'isMember:', isMember, 'isMentor:', isMentor);

  if (!isCreator && !isMember && !isMentor) {
    throw forbidden('Only project members can access the project chat');
  }

  const room = await ChatRoom.findOrCreateProjectChat(req.params.projectId);
  await room.populate('project', 'title');

  console.log('Chat room created/found:', room._id);

  return ApiResponse.success(res, { room });
});

module.exports = {
  getChatRooms,
  getChatRoom,
  getMessages,
  sendMessage,
  createDirectMessage,
  createTeamReviewChat,
  getTeamInternalChat,
  getClassroomChat,
  getProjectChat,
  deleteMessage,
  editMessage,
};
