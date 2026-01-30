const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [200, 'Project title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Creator is required'],
    },
    creatorRole: {
      type: String,
      enum: ['STUDENT', 'TEACHER'],
      required: true,
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'TEAM_ONLY', 'CLASS_ONLY', 'PUBLIC'],
      default: 'PRIVATE',
    },
    status: {
      type: String,
      enum: ['PLANNING', 'IN_PROGRESS', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
      default: 'PLANNING',
    },
    type: {
      type: String,
      enum: ['STUDENT_INITIATED', 'TEACHER_INITIATED', 'CLASSROOM_BASED'],
      required: true,
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      default: null,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['ADMIN', 'MEMBER', 'VIEWER'],
        default: 'MEMBER',
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['ACTIVE', 'REMOVED', 'LEFT', 'PENDING'],
        default: 'ACTIVE',
      },
    }],
    mentors: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['ACTIVE', 'REMOVED', 'LEFT'],
        default: 'ACTIVE',
      },
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    technologies: [{
      type: String,
      trim: true,
    }],
    links: {
      github: String,
      demo: String,
      documentation: String,
      other: [{ title: String, url: String }],
    },
    timeline: {
      startDate: Date,
      endDate: Date,
      milestones: [{
        title: String,
        description: String,
        dueDate: Date,
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedAt: Date,
      }],
    },
    joinRequests: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      message: String,
      requestedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
      },
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      processedAt: Date,
    }],
    invites: [{
      email: String,
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['MEMBER', 'VIEWER'],
        default: 'MEMBER',
      },
      invitedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      invitedAt: {
        type: Date,
        default: Date.now,
      },
      status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'EXPIRED'],
        default: 'PENDING',
      },
      token: String,
      expiresAt: Date,
    }],
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
projectSchema.virtual('activeMemberCount').get(function () {
  return (this.members || []).filter((m) => m.status === 'ACTIVE').length;
});

projectSchema.virtual('activeMentorCount').get(function () {
  return (this.mentors || []).filter((m) => m.status === 'ACTIVE').length;
});

// Indexes
projectSchema.index({ creator: 1 });
projectSchema.index({ visibility: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ type: 1 });
projectSchema.index({ classroom: 1 });
projectSchema.index({ team: 1 });
projectSchema.index({ 'members.user': 1 });
projectSchema.index({ 'mentors.user': 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ isDeleted: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Methods
projectSchema.methods.isAdmin = function (userId) {
  if (this.creator.toString() === userId.toString()) {
    return true;
  }
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString() && m.status === 'ACTIVE'
  );
  return member && member.role === 'ADMIN';
};

projectSchema.methods.isMember = function (userId) {
  return this.members.some(
    (m) => m.user.toString() === userId.toString() && m.status === 'ACTIVE'
  );
};

projectSchema.methods.isMentor = function (userId) {
  return this.mentors.some(
    (m) => m.user.toString() === userId.toString() && m.status === 'ACTIVE'
  );
};

projectSchema.methods.hasAccess = function (userId) {
  return (
    this.isAdmin(userId) ||
    this.isMember(userId) ||
    this.isMentor(userId)
  );
};

projectSchema.methods.addMember = async function (userId, role = 'MEMBER') {
  const existingMember = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );

  if (existingMember) {
    if (existingMember.status !== 'ACTIVE') {
      existingMember.status = 'ACTIVE';
      existingMember.role = role;
      existingMember.joinedAt = new Date();
    }
  } else {
    this.members.push({ user: userId, role });
  }

  await this.save();
};

projectSchema.methods.removeMember = async function (userId) {
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );

  if (member) {
    member.status = 'REMOVED';
    await this.save();
  }
};

projectSchema.methods.addMentor = async function (userId) {
  const existingMentor = this.mentors.find(
    (m) => m.user.toString() === userId.toString()
  );

  if (!existingMentor) {
    this.mentors.push({ user: userId });
    await this.save();
  } else if (existingMentor.status !== 'ACTIVE') {
    existingMentor.status = 'ACTIVE';
    existingMentor.joinedAt = new Date();
    await this.save();
  }
};

projectSchema.methods.updateVisibility = async function (visibility) {
  this.visibility = visibility;
  await this.save();
};

projectSchema.methods.requestToJoin = async function (userId, message) {
  const existingRequest = this.joinRequests.find(
    (r) => r.user.toString() === userId.toString() && r.status === 'PENDING'
  );

  if (existingRequest) {
    throw new Error('You already have a pending join request');
  }

  this.joinRequests.push({ user: userId, message });
  await this.save();
};

projectSchema.methods.processJoinRequest = async function (
  requestId,
  status,
  processedBy
) {
  const request = this.joinRequests.id(requestId);

  if (!request) {
    throw new Error('Join request not found');
  }

  request.status = status;
  request.processedBy = processedBy;
  request.processedAt = new Date();

  if (status === 'APPROVED') {
    await this.addMember(request.user);
  }

  await this.save();
};

projectSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

// Static methods
projectSchema.statics.findActive = function (query = {}) {
  return this.find({ ...query, isDeleted: false });
};

projectSchema.statics.findPublic = function () {
  return this.find({ visibility: 'PUBLIC', isDeleted: false });
};

projectSchema.statics.findByUser = function (userId) {
  return this.find({
    isDeleted: false,
    $or: [
      { creator: userId },
      { 'members.user': userId, 'members.status': 'ACTIVE' },
      { 'mentors.user': userId, 'mentors.status': 'ACTIVE' },
    ],
  });
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
