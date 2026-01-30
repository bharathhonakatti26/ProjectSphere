const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Team name is required'],
      trim: true,
      maxlength: [100, 'Team name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    classroom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Classroom',
      required: [true, 'Classroom is required'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
    leader: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Team leader is required'],
    },
    members: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['LEADER', 'MEMBER'],
        default: 'MEMBER',
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
    evaluation: {
      marks: {
        type: Number,
        min: 0,
        max: 100,
        default: null,
      },
      remarks: {
        type: String,
        maxlength: [1000, 'Remarks cannot exceed 1000 characters'],
      },
      evaluatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      evaluatedAt: {
        type: Date,
      },
      isLocked: {
        type: Boolean,
        default: false,
      },
      lockedAt: {
        type: Date,
      },
    },
    submission: {
      status: {
        type: String,
        enum: ['NOT_SUBMITTED', 'SUBMITTED', 'RESUBMIT_REQUESTED', 'FINAL'],
        default: 'NOT_SUBMITTED',
      },
      submittedAt: {
        type: Date,
      },
      files: [{
        name: String,
        url: String,
        type: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      }],
      notes: {
        type: String,
        maxlength: [2000, 'Submission notes cannot exceed 2000 characters'],
      },
    },
    joinRequests: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      message: {
        type: String,
        maxlength: [500, 'Message cannot exceed 500 characters'],
      },
      status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED'],
        default: 'PENDING',
      },
      requestedAt: {
        type: Date,
        default: Date.now,
      },
      processedAt: {
        type: Date,
      },
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
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
teamSchema.virtual('activeMemberCount').get(function () {
  if (!this.members || !Array.isArray(this.members)) return 0;
  return this.members.filter((m) => m.status === 'ACTIVE').length;
});

teamSchema.virtual('activeMembers').get(function () {
  if (!this.members || !Array.isArray(this.members)) return [];
  return this.members.filter((m) => m.status === 'ACTIVE');
});

// Indexes
teamSchema.index({ classroom: 1 });
teamSchema.index({ project: 1 });
teamSchema.index({ leader: 1 });
teamSchema.index({ 'members.user': 1 });
teamSchema.index({ isDeleted: 1 });
teamSchema.index({ 'evaluation.isLocked': 1 });

// Methods
teamSchema.methods.addMember = async function (userId, role = 'MEMBER') {
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

teamSchema.methods.removeMember = async function (userId) {
  const member = this.members.find(
    (m) => m.user.toString() === userId.toString()
  );

  if (member) {
    member.status = 'REMOVED';
    await this.save();
  }
};

teamSchema.methods.isMember = function (userId) {
  if (!this.members || !Array.isArray(this.members)) return false;
  return this.members.some(
    (m) => {
      const memberId = m.user?._id || m.user;
      return memberId?.toString() === userId?.toString() && m.status === 'ACTIVE';
    }
  );
};

teamSchema.methods.isLeader = function (userId) {
  const leaderId = this.leader?._id || this.leader;
  return leaderId?.toString() === userId?.toString();
};

teamSchema.methods.evaluate = async function (marks, remarks, evaluatorId) {
  if (this.evaluation.isLocked) {
    throw new Error('Evaluation is locked and cannot be modified');
  }

  this.evaluation = {
    ...this.evaluation,
    marks,
    remarks,
    evaluatedBy: evaluatorId,
    evaluatedAt: new Date(),
  };

  await this.save();
};

teamSchema.methods.lockEvaluation = async function () {
  this.evaluation.isLocked = true;
  this.evaluation.lockedAt = new Date();
  await this.save();
};

teamSchema.methods.submit = async function (files, notes) {
  this.submission = {
    status: 'SUBMITTED',
    submittedAt: new Date(),
    files: files || this.submission.files,
    notes: notes || this.submission.notes,
  };
  await this.save();
};

teamSchema.methods.finalSubmit = async function () {
  this.submission.status = 'FINAL';
  await this.save();
};

teamSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

// Static methods
teamSchema.statics.findActive = function (query = {}) {
  return this.find({ ...query, isDeleted: false });
};

teamSchema.statics.findByClassroom = function (classroomId) {
  return this.find({ classroom: classroomId, isDeleted: false });
};

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;
