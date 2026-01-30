const mongoose = require('mongoose');

const classroomSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Classroom name is required'],
      trim: true,
      maxlength: [100, 'Classroom name cannot exceed 100 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [100, 'Subject cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    code: {
      type: String,
      unique: true,
      // Not required - will be auto-generated in pre-validate hook
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Teacher is required'],
    },
    students: [{
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
    semester: {
      type: String,
      trim: true,
    },
    academicYear: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    settings: {
      allowStudentTeamCreation: {
        type: Boolean,
        default: true,
      },
      maxTeamSize: {
        type: Number,
        default: 5,
        min: 2,
        max: 10,
      },
      minTeamSize: {
        type: Number,
        default: 2,
        min: 1,
        max: 5,
      },
      allowLateSubmissions: {
        type: Boolean,
        default: false,
      },
      // Chat permissions
      allowStudentChat: {
        type: Boolean,
        default: true,
      },
      allowStudentToTeacherChat: {
        type: Boolean,
        default: true,
      },
      allowStudentToStudentChat: {
        type: Boolean,
        default: true,
      },
      allowTeamChat: {
        type: Boolean,
        default: true,
      },
      allowClassroomAnnouncements: {
        type: Boolean,
        default: true,
      },
      // Project permissions
      allowStudentProjectCreation: {
        type: Boolean,
        default: false,
      },
      requireMentorApproval: {
        type: Boolean,
        default: true,
      },
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    archivedAt: {
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtuals
classroomSchema.virtual('activeStudentCount').get(function () {
  return this.students.filter((s) => s.status === 'ACTIVE').length;
});

classroomSchema.virtual('teams', {
  ref: 'Team',
  localField: '_id',
  foreignField: 'classroom',
});

// Indexes
classroomSchema.index({ teacher: 1 });
classroomSchema.index({ code: 1 });
classroomSchema.index({ 'students.user': 1 });
classroomSchema.index({ isDeleted: 1 });
classroomSchema.index({ createdAt: -1 });

// Pre-validate middleware to generate unique code (runs before validation)
classroomSchema.pre('validate', async function (next) {
  if (!this.code) {
    this.code = await generateUniqueCode();
  }
  next();
});

// Generate unique classroom code
async function generateUniqueCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;

  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    const existing = await mongoose.model('Classroom').findOne({ code });
    if (!existing) {
      isUnique = true;
    }
  }

  return code;
}

// Methods
classroomSchema.methods.addStudent = async function (userId) {
  const existingStudent = this.students.find(
    (s) => s.user.toString() === userId.toString()
  );

  if (existingStudent) {
    if (existingStudent.status !== 'ACTIVE') {
      existingStudent.status = 'ACTIVE';
      existingStudent.joinedAt = new Date();
    }
  } else {
    this.students.push({ user: userId });
  }

  await this.save();
};

classroomSchema.methods.removeStudent = async function (userId) {
  const student = this.students.find(
    (s) => s.user.toString() === userId.toString()
  );

  if (student) {
    student.status = 'REMOVED';
    await this.save();
  }
};

classroomSchema.methods.isStudentMember = function (userId) {
  return this.students.some(
    (s) => {
      const studentUserId = s.user?._id || s.user;
      return studentUserId?.toString() === userId?.toString() && s.status === 'ACTIVE';
    }
  );
};

classroomSchema.methods.isTeacher = function (userId) {
  // Handle both populated and non-populated teacher field
  const teacherId = this.teacher?._id || this.teacher;
  return teacherId?.toString() === userId?.toString();
};

classroomSchema.methods.archive = async function () {
  this.isArchived = true;
  this.archivedAt = new Date();
  await this.save();
};

classroomSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  await this.save();
};

// Static methods
classroomSchema.statics.findActive = function (query = {}) {
  return this.find({ ...query, isDeleted: false });
};

classroomSchema.statics.findByCode = function (code) {
  return this.findOne({ code, isDeleted: false });
};

const Classroom = mongoose.model('Classroom', classroomSchema);

module.exports = Classroom;
