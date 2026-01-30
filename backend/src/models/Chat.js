const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    chatRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ChatRoom',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
    },
    type: {
      type: String,
      enum: ['TEXT', 'FILE', 'IMAGE', 'SYSTEM'],
      default: 'TEXT',
    },
    attachments: [{
      name: String,
      url: String,
      type: String,
      size: Number,
    }],
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      readAt: {
        type: Date,
        default: Date.now,
      },
    }],
    isEdited: {
      type: Boolean,
      default: false,
    },
    editedAt: {
      type: Date,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ chatRoom: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isDeleted: 1 });

const chatRoomSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['CLASSROOM_CHAT', 'TEAM_REVIEW_CHAT', 'TEAM_INTERNAL_CHAT', 'DIRECT_MESSAGE', 'PROJECT_CHAT'],
      required: true,
    },
    name: {
      type: String,
      trim: true,
      maxlength: [100, 'Chat room name cannot exceed 100 characters'],
    },
    // For CLASSROOM_CHAT
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      default: null,
    },
    // For TEAM_REVIEW_CHAT and TEAM_INTERNAL_CHAT
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    // For PROJECT_CHAT
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    // For DIRECT_MESSAGE
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    // Creator of the chat (for TEAM_REVIEW_CHAT)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Last message info for quick access
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
chatRoomSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'chatRoom',
});

// Indexes
chatRoomSchema.index({ type: 1 });
chatRoomSchema.index({ classroom: 1 });
chatRoomSchema.index({ team: 1 });
chatRoomSchema.index({ project: 1 });
chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ isDeleted: 1 });
chatRoomSchema.index({ 'lastMessage.timestamp': -1 });

// Methods
chatRoomSchema.methods.canAccess = async function (userId, userRole) {
  const User = mongoose.model('User');
  const Team = mongoose.model('Team');
  const Classroom = mongoose.model('Classroom');
  const Project = mongoose.model('Project');

  switch (this.type) {
    case 'CLASSROOM_CHAT': {
      const classroom = await Classroom.findById(this.classroom);
      if (!classroom) return false;
      return (
        classroom.isTeacher(userId) ||
        classroom.isStudentMember(userId)
      );
    }

    case 'TEAM_REVIEW_CHAT': {
      const team = await Team.findById(this.team).populate('classroom');
      if (!team) return false;
      const classroom = team.classroom;
      return (
        classroom.isTeacher(userId) ||
        team.isMember(userId)
      );
    }

    case 'TEAM_INTERNAL_CHAT': {
      const team = await Team.findById(this.team).populate('classroom');
      if (!team) return false;
      const classroom = team.classroom;
      // Team leader, members AND classroom teacher (supervisor) can access internal chat
      return team.isLeader(userId) || team.isMember(userId) || classroom.isTeacher(userId);
    }

    case 'PROJECT_CHAT': {
      const project = await Project.findById(this.project);
      if (!project) return false;
      // Project creator, active members, and mentors can access
      const isCreator = project.creator.toString() === userId.toString();
      const isMember = project.members?.some(
        m => m.user.toString() === userId.toString() && m.status === 'ACTIVE'
      );
      const isMentor = project.mentors?.some(
        m => m.user.toString() === userId.toString() && m.status === 'ACTIVE'
      );
      return isCreator || isMember || isMentor;
    }

    case 'DIRECT_MESSAGE': {
      return this.participants.some(
        (p) => p.toString() === userId.toString()
      );
    }

    default:
      return false;
  }
};

chatRoomSchema.methods.updateLastMessage = async function (content, senderId) {
  this.lastMessage = {
    content: content.substring(0, 100),
    sender: senderId,
    timestamp: new Date(),
  };
  await this.save();
};

// Statics
chatRoomSchema.statics.findOrCreateDirectMessage = async function (user1Id, user2Id) {
  let room = await this.findOne({
    type: 'DIRECT_MESSAGE',
    participants: { $all: [user1Id, user2Id] },
    isDeleted: false,
  });

  if (!room) {
    room = await this.create({
      type: 'DIRECT_MESSAGE',
      participants: [user1Id, user2Id],
    });
  }

  return room;
};

chatRoomSchema.statics.findOrCreateClassroomChat = async function (classroomId) {
  let room = await this.findOne({
    type: 'CLASSROOM_CHAT',
    classroom: classroomId,
    isDeleted: false,
  });

  if (!room) {
    const Classroom = mongoose.model('Classroom');
    const classroom = await Classroom.findById(classroomId);
    room = await this.create({
      type: 'CLASSROOM_CHAT',
      classroom: classroomId,
      name: `${classroom.name} - Announcements`,
      createdBy: classroom.teacher,
    });
  }

  return room;
};

chatRoomSchema.statics.findOrCreateTeamInternalChat = async function (teamId) {
  let room = await this.findOne({
    type: 'TEAM_INTERNAL_CHAT',
    team: teamId,
    isDeleted: false,
  });

  if (!room) {
    const Team = mongoose.model('Team');
    const team = await Team.findById(teamId);
    room = await this.create({
      type: 'TEAM_INTERNAL_CHAT',
      team: teamId,
      name: `${team.name} - Internal`,
      createdBy: team.leader,
    });
  }

  return room;
};

chatRoomSchema.statics.findOrCreateTeamReviewChat = async function (teamId, creatorId) {
  let room = await this.findOne({
    type: 'TEAM_REVIEW_CHAT',
    team: teamId,
    isDeleted: false,
  });

  if (!room) {
    const Team = mongoose.model('Team');
    const team = await Team.findById(teamId);
    room = await this.create({
      type: 'TEAM_REVIEW_CHAT',
      team: teamId,
      name: `${team.name} - Review`,
      createdBy: creatorId,
    });
  }

  return room;
};

chatRoomSchema.statics.findOrCreateProjectChat = async function (projectId) {
  let room = await this.findOne({
    type: 'PROJECT_CHAT',
    project: projectId,
    isDeleted: false,
  });

  if (!room) {
    const Project = mongoose.model('Project');
    const project = await Project.findById(projectId);
    room = await this.create({
      type: 'PROJECT_CHAT',
      project: projectId,
      name: `${project.title} - Team Chat`,
      createdBy: project.creator,
    });
  }

  return room;
};

const ChatRoom = mongoose.model('ChatRoom', chatRoomSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { ChatRoom, Message };
