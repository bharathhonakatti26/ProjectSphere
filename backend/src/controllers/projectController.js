const asyncHandler = require('express-async-handler');
const { Project, User, Classroom, Team } = require('../models');
const {
  ApiResponse,
  notFound,
  badRequest,
  forbidden,
  parsePagination,
  generateInviteToken,
} = require('../utils');

/**
 * @desc    Create project
 * @route   POST /api/projects
 * @access  Private
 */
const createProject = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    shortDescription,
    type,
    visibility,
    classroomId,
    teamId,
    tags,
    technologies,
    timeline,
  } = req.body;

  // Validate type-specific requirements
  if (type === 'CLASSROOM_BASED') {
    if (!classroomId || !teamId) {
      throw badRequest('Classroom and team are required for classroom-based projects');
    }

    const classroom = await Classroom.findOne({ _id: classroomId, isDeleted: false });
    if (!classroom) {
      throw notFound('Classroom not found');
    }

    const team = await Team.findOne({ _id: teamId, isDeleted: false });
    if (!team) {
      throw notFound('Team not found');
    }

    // Check if user is part of the team or is the teacher
    if (!team.isMember(req.userId) && !classroom.isTeacher(req.userId)) {
      throw forbidden('You must be a team member or the classroom teacher');
    }
  }

  const project = await Project.create({
    title,
    description,
    shortDescription,
    creator: req.userId,
    creatorRole: req.userRole,
    type,
    visibility: visibility || 'PRIVATE',
    classroom: classroomId || null,
    team: teamId || null,
    tags,
    technologies,
    timeline,
    members: [{ user: req.userId, role: 'ADMIN' }],
  });

  // Link project to team if classroom-based
  if (type === 'CLASSROOM_BASED' && teamId) {
    await Team.findByIdAndUpdate(teamId, { project: project._id });
  }

  await project.populate([
    { path: 'creator', select: 'firstName lastName email avatar' },
    { path: 'members.user', select: 'firstName lastName email avatar' },
  ]);

  return ApiResponse.created(res, { project }, 'Project created successfully');
});

/**
 * @desc    Get all projects for user
 * @route   GET /api/projects
 * @access  Private
 */
const getMyProjects = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { status, type } = req.query;

  const query = {
    isDeleted: false,
    $or: [
      { creator: req.userId },
      { 
        members: { 
          $elemMatch: { 
            user: req.userId, 
            status: 'ACTIVE' 
          } 
        } 
      },
      { 
        mentors: { 
          $elemMatch: { 
            user: req.userId, 
            status: 'ACTIVE' 
          } 
        } 
      },
    ],
  };

  if (status) {
    query.status = status;
  }

  if (type) {
    query.type = type;
  }

  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('creator', 'firstName lastName email avatar')
      .populate('members.user', 'firstName lastName email avatar')
      .populate('mentors.user', 'firstName lastName email avatar')
      .populate('classroom', 'name subject')
      .populate('team', 'name')
      .skip(skip)
      .limit(limit)
      .sort({ updatedAt: -1 }),
    Project.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, projects, { page, limit, total });
});

/**
 * @desc    Get public projects
 * @route   GET /api/projects/public
 * @access  Public (with optional auth)
 */
const getPublicProjects = asyncHandler(async (req, res) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { search, tags, technologies } = req.query;

    const query = {
      visibility: 'PUBLIC',
      isDeleted: false,
    };

    // If user is authenticated, exclude projects they've already joined or created
    if (req.userId) {
      query.creator = { $ne: req.userId };
      query['members.user'] = { $ne: req.userId };
    }

    if (search && search.trim()) {
      // Use regex search instead of $text for simplicity
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags && tags.trim()) {
      const tagList = tags.split(',').filter(t => t.trim());
      if (tagList.length > 0) {
        query.tags = { $in: tagList };
      }
    }

    if (technologies && technologies.trim()) {
      const techList = technologies.split(',').filter(t => t.trim());
      if (techList.length > 0) {
        query.technologies = { $in: techList };
      }
    }

    console.log('Public projects query:', JSON.stringify(query));

    const projects = await Project.find(query)
      .populate('creator', 'firstName lastName avatar')
      .populate('members.user', 'firstName lastName avatar')
      .select('title shortDescription description creator members tags technologies status visibility createdAt type')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean();

    const total = await Project.countDocuments(query);

    console.log('Found public projects:', projects.length);

    return ApiResponse.paginated(res, projects, { page, limit, total });
  } catch (error) {
    console.error('Error in getPublicProjects:', error);
    throw error;
  }
});

/**
 * @desc    Get project by ID
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false })
    .populate('creator', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar')
    .populate('mentors.user', 'firstName lastName email avatar')
    .populate('classroom', 'name subject')
    .populate('team', 'name');

  if (!project) {
    throw notFound('Project not found');
  }

  // Check visibility and access
  if (project.visibility === 'PUBLIC') {
    return ApiResponse.success(res, { project });
  }

  if (!req.user) {
    throw forbidden('You must be logged in to view this project');
  }

  const hasAccess = project.hasAccess(req.userId);

  if (!hasAccess && project.visibility !== 'PUBLIC') {
    // Check class access
    if (project.visibility === 'CLASS_ONLY' && project.classroom) {
      const classroom = await Classroom.findById(project.classroom);
      if (classroom && (classroom.isTeacher(req.userId) || classroom.isStudentMember(req.userId))) {
        return ApiResponse.success(res, { project });
      }
    }

    // Check team access
    if (project.visibility === 'TEAM_ONLY' && project.team) {
      const team = await Team.findById(project.team);
      if (team && team.isMember(req.userId)) {
        return ApiResponse.success(res, { project });
      }
    }

    throw forbidden('You do not have access to this project');
  }

  return ApiResponse.success(res, { project });
});

/**
 * @desc    Update project
 * @route   PUT /api/projects/:id
 * @access  Private (Project Admin only)
 */
const updateProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (!project) {
    throw notFound('Project not found');
  }

  if (!project.isAdmin(req.userId)) {
    throw forbidden('Only project admins can update the project');
  }

  const allowedFields = [
    'title',
    'description',
    'shortDescription',
    'visibility',
    'status',
    'tags',
    'technologies',
    'links',
    'timeline',
  ];

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      project[field] = req.body[field];
    }
  });

  await project.save();
  await project.populate([
    { path: 'creator', select: 'firstName lastName email avatar' },
    { path: 'members.user', select: 'firstName lastName email avatar' },
  ]);

  return ApiResponse.success(res, { project }, 'Project updated successfully');
});

/**
 * @desc    Delete project
 * @route   DELETE /api/projects/:id
 * @access  Private (Project Admin only)
 */
const deleteProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (!project) {
    throw notFound('Project not found');
  }

  if (!project.isAdmin(req.userId)) {
    throw forbidden('Only project admins can delete the project');
  }

  await project.softDelete();

  return ApiResponse.success(res, null, 'Project deleted successfully');
});

/**
 * @desc    Add member to project
 * @route   POST /api/projects/:id/members
 * @access  Private (Project Admin only)
 */
const addMember = asyncHandler(async (req, res) => {
  const { userId, role } = req.body;

  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (!project) {
    throw notFound('Project not found');
  }

  if (!project.isAdmin(req.userId)) {
    throw forbidden('Only project admins can add members');
  }

  await project.addMember(userId, role || 'MEMBER');
  await project.populate('members.user', 'firstName lastName email avatar');

  return ApiResponse.success(res, { project }, 'Member added successfully');
});

/**
 * @desc    Remove member from project
 * @route   DELETE /api/projects/:id/members/:memberId
 * @access  Private (Project Admin only)
 */
const removeMember = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (!project) {
    throw notFound('Project not found');
  }

  if (!project.isAdmin(req.userId)) {
    throw forbidden('Only project admins can remove members');
  }

  if (project.creator.toString() === req.params.memberId) {
    throw badRequest('Cannot remove the project creator');
  }

  await project.removeMember(req.params.memberId);

  return ApiResponse.success(res, { project }, 'Member removed successfully');
});

/**
 * @desc    Update member role
 * @route   PUT /api/projects/:id/members/:memberId/role
 * @access  Private (Project Admin only)
 */
const updateMemberRole = asyncHandler(async (req, res) => {
  const { role } = req.body;

  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (!project) {
    throw notFound('Project not found');
  }

  if (!project.isAdmin(req.userId)) {
    throw forbidden('Only project admins can update member roles');
  }

  const member = project.members.find(
    (m) => m.user.toString() === req.params.memberId && m.status === 'ACTIVE'
  );

  if (!member) {
    throw notFound('Member not found');
  }

  member.role = role;
  await project.save();
  await project.populate('members.user', 'firstName lastName email avatar');

  return ApiResponse.success(res, { project }, 'Member role updated successfully');
});

/**
 * @desc    Add mentor to project
 * @route   POST /api/projects/:id/mentors
 * @access  Private (Project Admin only)
 */
const addMentor = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (!project) {
    throw notFound('Project not found');
  }

  if (!project.isAdmin(req.userId)) {
    throw forbidden('Only project admins can add mentors');
  }

  // Check if user is a teacher
  const user = await User.findById(userId);
  if (!user || user.role !== 'TEACHER') {
    throw badRequest('Only teachers can be added as mentors');
  }

  await project.addMentor(userId);
  await project.populate('mentors.user', 'firstName lastName email avatar');

  return ApiResponse.success(res, { project }, 'Mentor added successfully');
});

/**
 * @desc    Request to join project
 * @route   POST /api/projects/:id/join-request
 * @access  Private
 */
const requestToJoin = asyncHandler(async (req, res) => {
  const { message } = req.body;

  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (!project) {
    throw notFound('Project not found');
  }

  if (project.visibility === 'PRIVATE') {
    throw forbidden('Cannot request to join a private project');
  }

  if (project.hasAccess(req.userId)) {
    throw badRequest('You already have access to this project');
  }

  await project.requestToJoin(req.userId, message);

  return ApiResponse.success(res, null, 'Join request sent successfully');
});

/**
 * @desc    Process join request
 * @route   PUT /api/projects/:id/join-request/:requestId
 * @access  Private (Project Admin only)
 */
const processJoinRequest = asyncHandler(async (req, res) => {
  const { status } = req.body;

  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (!project) {
    throw notFound('Project not found');
  }

  if (!project.isAdmin(req.userId)) {
    throw forbidden('Only project admins can process join requests');
  }

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw badRequest('Invalid status');
  }

  await project.processJoinRequest(req.params.requestId, status, req.userId);
  await project.populate([
    { path: 'joinRequests.user', select: 'firstName lastName email avatar' },
    { path: 'members.user', select: 'firstName lastName email avatar' },
  ]);

  return ApiResponse.success(res, { project }, `Join request ${status.toLowerCase()}`);
});

/**
 * @desc    Get join requests
 * @route   GET /api/projects/:id/join-requests
 * @access  Private (Project Admin only)
 */
const getJoinRequests = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false })
    .populate('joinRequests.user', 'firstName lastName email avatar');

  if (!project) {
    throw notFound('Project not found');
  }

  if (!project.isAdmin(req.userId)) {
    throw forbidden('Only project admins can view join requests');
  }

  const pendingRequests = project.joinRequests.filter((r) => r.status === 'PENDING');

  return ApiResponse.success(res, { requests: pendingRequests });
});

/**
 * @desc    Leave project
 * @route   POST /api/projects/:id/leave
 * @access  Private
 */
const leaveProject = asyncHandler(async (req, res) => {
  const project = await Project.findOne({ _id: req.params.id, isDeleted: false });

  if (!project) {
    throw notFound('Project not found');
  }

  if (project.creator.toString() === req.userId.toString()) {
    throw badRequest('Project creator cannot leave. Transfer ownership or delete the project.');
  }

  if (!project.isMember(req.userId) && !project.isMentor(req.userId)) {
    throw badRequest('You are not a member of this project');
  }

  // Remove from members
  const member = project.members.find(
    (m) => m.user.toString() === req.userId.toString()
  );
  if (member) {
    member.status = 'LEFT';
  }

  // Remove from mentors
  const mentor = project.mentors.find(
    (m) => m.user.toString() === req.userId.toString()
  );
  if (mentor) {
    mentor.status = 'LEFT';
  }

  await project.save();

  return ApiResponse.success(res, null, 'Left project successfully');
});

module.exports = {
  createProject,
  getMyProjects,
  getPublicProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  updateMemberRole,
  addMentor,
  requestToJoin,
  processJoinRequest,
  getJoinRequests,
  leaveProject,
};
