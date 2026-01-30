const asyncHandler = require('express-async-handler');
const { Team, Classroom, Project } = require('../models');
const { ChatRoom } = require('../models/Chat');
const {
  ApiResponse,
  notFound,
  badRequest,
  forbidden,
  parsePagination,
  generateCSV,
  generateXLSX,
  formatEvaluationData,
} = require('../utils');

/**
 * @desc    Create team
 * @route   POST /api/teams
 * @access  Private (Student only)
 */
const createTeam = asyncHandler(async (req, res) => {
  const { name, description, classroomId, classroom: classroomParam, project: projectData } = req.body;
  const actualClassroomId = classroomId || classroomParam;

  // Check classroom exists and student is member
  const classroom = await Classroom.findOne({ _id: actualClassroomId, isDeleted: false });

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  if (!classroom.isStudentMember(req.userId)) {
    throw forbidden('You must be a member of this classroom to create a team');
  }

  if (classroom.settings?.allowStudentTeamCreation === false) {
    throw forbidden('Team creation is not allowed in this classroom');
  }

  // Check if student is already in a team
  const existingTeam = await Team.findOne({
    classroom: actualClassroomId,
    'members.user': req.userId,
    'members.status': 'ACTIVE',
    isDeleted: false,
  });

  if (existingTeam) {
    throw badRequest('You are already in a team in this classroom');
  }

  // Create team
  const team = await Team.create({
    name,
    description,
    classroom: actualClassroomId,
    leader: req.userId,
    members: [{ user: req.userId, role: 'LEADER' }],
  });

  // Create project if project data is provided
  if (projectData && projectData.title) {
    const project = await Project.create({
      title: projectData.title,
      description: projectData.description || '',
      team: team._id,
      classroom: actualClassroomId,
      creator: req.userId,
      creatorRole: 'STUDENT',
      type: 'CLASSROOM_BASED',
      technologies: projectData.technologies || [],
      repositoryUrl: projectData.repositoryUrl || '',
      members: [{ user: req.userId, role: 'ADMIN' }],
      mentors: [{ user: classroom.teacher }],
      status: 'PLANNING',
    });

    // Link project to team
    team.project = project._id;
    await team.save();
  }

  // Create internal chat room
  await ChatRoom.findOrCreateTeamInternalChat(team._id);

  await team.populate([
    { path: 'leader', select: 'firstName lastName email avatar' },
    { path: 'members.user', select: 'firstName lastName email avatar' },
    { path: 'classroom', select: 'name subject' },
    { path: 'project', select: 'title description technologies status' },
  ]);

  return ApiResponse.created(res, { team }, 'Team created successfully');
});

/**
 * @desc    Get team by ID
 * @route   GET /api/teams/:id
 * @access  Private
 */
const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, isDeleted: false })
    .populate('leader', 'firstName lastName email avatar')
    .populate('members.user', 'firstName lastName email avatar studentId')
    .populate({
      path: 'classroom',
      select: 'name subject teacher students',
      populate: {
        path: 'teacher',
        select: 'firstName lastName email avatar'
      }
    })
    .populate('project', 'title status')
    .populate('evaluation.evaluatedBy', 'firstName lastName');

  if (!team) {
    throw notFound('Team not found');
  }

  // Check access
  const isLeader = team.isLeader(req.userId);
  const isMember = team.isMember(req.userId);
  
  // Check if user is classroom teacher
  const classroomTeacherId = team.classroom?.teacher?._id || team.classroom?.teacher;
  const isTeacher = classroomTeacherId?.toString() === req.userId.toString();

  if (!isTeacher && !isMember && !isLeader) {
    throw forbidden('You do not have access to this team');
  }

  return ApiResponse.success(res, { team });
});

/**
 * @desc    Update team
 * @route   PUT /api/teams/:id
 * @access  Private (Team leader only)
 */
const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, isDeleted: false });

  if (!team) {
    throw notFound('Team not found');
  }

  if (!team.isLeader(req.userId)) {
    throw forbidden('Only the team leader can update the team');
  }

  const { name, description } = req.body;

  if (name) team.name = name;
  if (description !== undefined) team.description = description;

  await team.save();
  await team.populate([
    { path: 'leader', select: 'firstName lastName email avatar' },
    { path: 'members.user', select: 'firstName lastName email avatar' },
  ]);

  return ApiResponse.success(res, { team }, 'Team updated successfully');
});

/**
 * @desc    Delete team
 * @route   DELETE /api/teams/:id
 * @access  Private (Team leader or Teacher)
 */
const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, isDeleted: false })
    .populate('classroom');

  if (!team) {
    throw notFound('Team not found');
  }

  const classroom = await Classroom.findById(team.classroom._id);
  const isTeacher = classroom.isTeacher(req.userId);
  const isLeader = team.isLeader(req.userId);

  if (!isTeacher && !isLeader) {
    throw forbidden('Only the team leader or teacher can delete this team');
  }

  await team.softDelete();

  return ApiResponse.success(res, null, 'Team deleted successfully');
});

/**
 * @desc    Add member to team
 * @route   POST /api/teams/:id/members
 * @access  Private (Team leader only)
 */
const addMember = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const team = await Team.findOne({ _id: req.params.id, isDeleted: false });

  if (!team) {
    throw notFound('Team not found');
  }

  if (!team.isLeader(req.userId)) {
    throw forbidden('Only the team leader can add members');
  }

  // Check classroom settings
  const classroom = await Classroom.findById(team.classroom);

  if (team.activeMemberCount >= classroom.settings.maxTeamSize) {
    throw badRequest(`Team cannot have more than ${classroom.settings.maxTeamSize} members`);
  }

  // Check if user is in classroom
  if (!classroom.isStudentMember(userId)) {
    throw badRequest('User is not a member of this classroom');
  }

  // Check if user is already in a team
  const existingTeam = await Team.findOne({
    classroom: team.classroom,
    'members.user': userId,
    'members.status': 'ACTIVE',
    isDeleted: false,
  });

  if (existingTeam) {
    throw badRequest('User is already in a team in this classroom');
  }

  await team.addMember(userId);
  await team.populate('members.user', 'firstName lastName email avatar');

  return ApiResponse.success(res, { team }, 'Member added successfully');
});

/**
 * @desc    Remove member from team
 * @route   DELETE /api/teams/:id/members/:memberId
 * @access  Private (Team leader or Teacher)
 */
const removeMember = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, isDeleted: false });

  if (!team) {
    throw notFound('Team not found');
  }

  const classroom = await Classroom.findById(team.classroom);
  const isTeacher = classroom.isTeacher(req.userId);
  const isLeader = team.isLeader(req.userId);

  if (!isTeacher && !isLeader) {
    throw forbidden('Only the team leader or teacher can remove members');
  }

  if (team.leader.toString() === req.params.memberId) {
    throw badRequest('Cannot remove the team leader');
  }

  await team.removeMember(req.params.memberId);

  return ApiResponse.success(res, { team }, 'Member removed successfully');
});

/**
 * @desc    Leave team
 * @route   POST /api/teams/:id/leave
 * @access  Private
 */
const leaveTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, isDeleted: false });

  if (!team) {
    throw notFound('Team not found');
  }

  if (!team.isMember(req.userId)) {
    throw badRequest('You are not a member of this team');
  }

  if (team.isLeader(req.userId)) {
    throw badRequest('Team leader cannot leave. Transfer leadership first or delete the team.');
  }

  const member = team.members.find(
    (m) => m.user.toString() === req.userId.toString()
  );
  member.status = 'LEFT';
  await team.save();

  return ApiResponse.success(res, null, 'Left team successfully');
});

/**
 * @desc    Transfer leadership
 * @route   PUT /api/teams/:id/transfer-leadership
 * @access  Private (Team leader only)
 */
const transferLeadership = asyncHandler(async (req, res) => {
  const { newLeaderId } = req.body;

  const team = await Team.findOne({ _id: req.params.id, isDeleted: false });

  if (!team) {
    throw notFound('Team not found');
  }

  if (!team.isLeader(req.userId)) {
    throw forbidden('Only the team leader can transfer leadership');
  }

  if (!team.isMember(newLeaderId)) {
    throw badRequest('New leader must be a team member');
  }

  // Update old leader role
  const oldLeader = team.members.find(
    (m) => m.user.toString() === req.userId.toString()
  );
  oldLeader.role = 'MEMBER';

  // Update new leader
  const newLeader = team.members.find(
    (m) => m.user.toString() === newLeaderId.toString()
  );
  newLeader.role = 'LEADER';

  team.leader = newLeaderId;
  await team.save();

  await team.populate('leader', 'firstName lastName email avatar');

  return ApiResponse.success(res, { team }, 'Leadership transferred successfully');
});

/**
 * @desc    Submit team work
 * @route   POST /api/teams/:id/submit
 * @access  Private (Team leader only)
 */
const submitWork = asyncHandler(async (req, res) => {
  const { files, notes } = req.body;

  const team = await Team.findOne({ _id: req.params.id, isDeleted: false });

  if (!team) {
    throw notFound('Team not found');
  }

  if (!team.isLeader(req.userId)) {
    throw forbidden('Only the team leader can submit work');
  }

  if (team.submission.status === 'FINAL') {
    throw badRequest('Final submission already made');
  }

  await team.submit(files, notes);

  return ApiResponse.success(res, { team }, 'Work submitted successfully');
});

/**
 * @desc    Final submit
 * @route   POST /api/teams/:id/final-submit
 * @access  Private (Team leader only)
 */
const finalSubmit = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, isDeleted: false });

  if (!team) {
    throw notFound('Team not found');
  }

  if (!team.isLeader(req.userId)) {
    throw forbidden('Only the team leader can make final submission');
  }

  if (team.submission.status !== 'SUBMITTED') {
    throw badRequest('Please submit work before final submission');
  }

  await team.finalSubmit();

  return ApiResponse.success(res, { team }, 'Final submission made successfully');
});

/**
 * @desc    Evaluate team
 * @route   POST /api/teams/:id/evaluate
 * @access  Private (Teacher only)
 */
const evaluateTeam = asyncHandler(async (req, res) => {
  const { marks, remarks } = req.body;

  const team = await Team.findOne({ _id: req.params.id, isDeleted: false });

  if (!team) {
    throw notFound('Team not found');
  }

  const classroom = await Classroom.findById(team.classroom);
  if (!classroom.isTeacher(req.userId)) {
    throw forbidden('Only the classroom teacher can evaluate teams');
  }

  if (team.evaluation.isLocked) {
    throw badRequest('Evaluation is locked and cannot be modified');
  }

  await team.evaluate(marks, remarks, req.userId);

  await team.populate('evaluation.evaluatedBy', 'firstName lastName');

  return ApiResponse.success(res, { team }, 'Team evaluated successfully');
});

/**
 * @desc    Lock evaluation
 * @route   POST /api/teams/:id/lock-evaluation
 * @access  Private (Teacher only)
 */
const lockEvaluation = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ _id: req.params.id, isDeleted: false });

  if (!team) {
    throw notFound('Team not found');
  }

  const classroom = await Classroom.findById(team.classroom);
  if (!classroom.isTeacher(req.userId)) {
    throw forbidden('Only the classroom teacher can lock evaluations');
  }

  if (!team.evaluation.marks && team.evaluation.marks !== 0) {
    throw badRequest('Please evaluate the team before locking');
  }

  await team.lockEvaluation();

  return ApiResponse.success(res, { team }, 'Evaluation locked successfully');
});

/**
 * @desc    Export classroom evaluations
 * @route   GET /api/classrooms/:id/export
 * @access  Private (Teacher only)
 */
const exportEvaluations = asyncHandler(async (req, res) => {
  const { format } = req.query; // csv or xlsx

  const classroom = await Classroom.findOne({ _id: req.params.id, isDeleted: false });

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  if (!classroom.isTeacher(req.userId)) {
    throw forbidden('Only the classroom teacher can export evaluations');
  }

  const teams = await Team.find({ classroom: req.params.id, isDeleted: false })
    .populate('members.user', 'firstName lastName email studentId')
    .populate('evaluation.evaluatedBy', 'firstName lastName');

  const data = formatEvaluationData(teams);

  if (format === 'xlsx') {
    const buffer = await generateXLSX(data, 'Evaluations');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${classroom.name}_evaluations.xlsx"`);
    return res.send(buffer);
  }

  // Default to CSV
  const headers = Object.keys(data[0] || {});
  const csv = generateCSV(data, headers);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${classroom.name}_evaluations.csv"`);
  return res.send(csv);
});

/**
 * @desc    Get teams by classroom
 * @route   GET /api/classrooms/:classroomId/teams
 * @access  Private
 */
const getTeamsByClassroom = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);

  const classroom = await Classroom.findOne({ _id: req.params.classroomId, isDeleted: false });

  if (!classroom) {
    throw notFound('Classroom not found');
  }

  const isTeacher = classroom.isTeacher(req.userId);
  const isStudent = classroom.isStudentMember(req.userId);

  if (!isTeacher && !isStudent) {
    throw forbidden('You do not have access to this classroom');
  }

  const query = { classroom: req.params.classroomId, isDeleted: false };

  const [teams, total] = await Promise.all([
    Team.find(query)
      .populate('leader', 'firstName lastName email avatar')
      .populate('members.user', 'firstName lastName email avatar')
      .populate('project', 'title status')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Team.countDocuments(query),
  ]);

  return ApiResponse.paginated(res, teams, { page, limit, total });
});

/**
 * @desc    Get user's teams
 * @route   GET /api/teams
 * @access  Private
 */
const getMyTeams = asyncHandler(async (req, res) => {
  const userId = req.userId;

  const teams = await Team.find({
    'members.user': userId,
    isDeleted: false,
  })
    .populate('classroom', 'name subject')
    .populate('project', 'title status')
    .populate('members.user', 'firstName lastName email avatar')
    .populate('leader', 'firstName lastName email avatar')
    .sort({ createdAt: -1 })
    .lean();

  // Filter to only include teams where user is active member
  const activeTeams = teams.filter(team => {
    const member = team.members?.find(m => {
      const memberId = m.user?._id?.toString() || m.user?.toString();
      return memberId === userId.toString();
    });
    return member && member.status === 'ACTIVE';
  });

  return ApiResponse.success(res, { teams: activeTeams });
});

/**
 * @desc    Request to join a team
 * @route   POST /api/teams/:id/join-request
 * @access  Private (Students)
 */
const requestToJoin = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const userId = req.userId;
  const teamId = req.params.id;

  const team = await Team.findById(teamId).populate('classroom');
  if (!team || team.isDeleted) {
    throw notFound('Team not found');
  }

  // Check if user is a student in the classroom
  const classroom = await Classroom.findById(team.classroom._id || team.classroom);
  if (!classroom) {
    throw notFound('Classroom not found');
  }

  const isStudent = classroom.students.some(
    s => s.user.toString() === userId.toString() && s.status === 'ACTIVE'
  );

  if (!isStudent) {
    throw forbidden('You must be a student in this classroom to request to join a team');
  }

  // Check if already a member
  const isMember = team.members.some(m => m.user.toString() === userId.toString());
  if (isMember) {
    throw badRequest('You are already a member of this team');
  }

  // Check if already has a pending request
  const existingRequest = team.joinRequests?.find(
    r => r.user.toString() === userId.toString() && r.status === 'PENDING'
  );
  if (existingRequest) {
    throw badRequest('You already have a pending request to join this team');
  }

  // Check team capacity
  const maxMembers = classroom.settings?.maxTeamSize || 5;
  const activeMembers = team.members.filter(m => m.status === 'ACTIVE').length;
  if (activeMembers >= maxMembers) {
    throw badRequest('This team is already at full capacity');
  }

  // Add join request
  team.joinRequests = team.joinRequests || [];
  team.joinRequests.push({
    user: userId,
    message: message || '',
    status: 'PENDING',
    requestedAt: new Date(),
  });

  await team.save();

  return ApiResponse.success(res, { message: 'Join request sent successfully' }, 201);
});

/**
 * @desc    Get join requests for a team
 * @route   GET /api/teams/:id/join-requests
 * @access  Private (Team leader or Teacher)
 */
const getJoinRequests = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const teamId = req.params.id;

  const team = await Team.findById(teamId)
    .populate('joinRequests.user', 'firstName lastName email avatar')
    .populate('classroom');

  if (!team || team.isDeleted) {
    throw notFound('Team not found');
  }

  // Check authorization - must be team leader or classroom teacher
  const isLeader = team.leader.toString() === userId.toString();
  const classroom = await Classroom.findById(team.classroom._id || team.classroom);
  const isTeacher = classroom && (
    (classroom.teacher._id || classroom.teacher).toString() === userId.toString()
  );

  if (!isLeader && !isTeacher) {
    throw forbidden('Only team leader or classroom teacher can view join requests');
  }

  const pendingRequests = team.joinRequests?.filter(r => r.status === 'PENDING') || [];

  return ApiResponse.success(res, { requests: pendingRequests });
});

/**
 * @desc    Process a join request (approve/reject)
 * @route   PUT /api/teams/:id/join-requests/:requestId
 * @access  Private (Team leader or Teacher)
 */
const processJoinRequest = asyncHandler(async (req, res) => {
  const { status } = req.body; // 'APPROVED' or 'REJECTED'
  const userId = req.userId;
  const { id: teamId, requestId } = req.params;

  if (!['APPROVED', 'REJECTED'].includes(status)) {
    throw badRequest('Status must be APPROVED or REJECTED');
  }

  const team = await Team.findById(teamId).populate('classroom');
  if (!team || team.isDeleted) {
    throw notFound('Team not found');
  }

  // Check authorization - must be team leader or classroom teacher
  const isLeader = team.leader.toString() === userId.toString();
  const classroom = await Classroom.findById(team.classroom._id || team.classroom);
  const isTeacher = classroom && (
    (classroom.teacher._id || classroom.teacher).toString() === userId.toString()
  );

  if (!isLeader && !isTeacher) {
    throw forbidden('Only team leader or classroom teacher can process join requests');
  }

  // Find the request
  const request = team.joinRequests?.id(requestId);
  if (!request) {
    throw notFound('Join request not found');
  }

  if (request.status !== 'PENDING') {
    throw badRequest('This request has already been processed');
  }

  request.status = status;
  request.processedAt = new Date();
  request.processedBy = userId;

  // If approved, add user to team
  if (status === 'APPROVED') {
    const maxMembers = classroom.settings?.maxTeamSize || 5;
    const activeMembers = team.members.filter(m => m.status === 'ACTIVE').length;
    
    if (activeMembers >= maxMembers) {
      throw badRequest('Team is at full capacity. Cannot add more members.');
    }

    team.members.push({
      user: request.user,
      role: 'MEMBER',
      status: 'ACTIVE',
      joinedAt: new Date(),
    });

    // Also add user to the team's project if it exists
    if (team.project) {
      await Project.findByIdAndUpdate(
        team.project,
        {
          $push: {
            members: {
              user: request.user,
              role: 'MEMBER',
              status: 'ACTIVE',
              joinedAt: new Date(),
            }
          }
        }
      );
    }
  }

  await team.save();

  const action = status === 'APPROVED' ? 'approved' : 'rejected';
  return ApiResponse.success(res, { message: `Join request ${action} successfully` });
});

/**
 * @desc    Cancel my join request
 * @route   DELETE /api/teams/:id/join-request
 * @access  Private (Students)
 */
const cancelJoinRequest = asyncHandler(async (req, res) => {
  const userId = req.userId;
  const teamId = req.params.id;

  const team = await Team.findById(teamId);
  if (!team || team.isDeleted) {
    throw notFound('Team not found');
  }

  const requestIndex = team.joinRequests?.findIndex(
    r => r.user.toString() === userId.toString() && r.status === 'PENDING'
  );

  if (requestIndex === -1 || requestIndex === undefined) {
    throw notFound('No pending join request found');
  }

  team.joinRequests.splice(requestIndex, 1);
  await team.save();

  return ApiResponse.success(res, { message: 'Join request cancelled successfully' });
});

module.exports = {
  createTeam,
  getTeam,
  getMyTeams,
  updateTeam,
  deleteTeam,
  addMember,
  removeMember,
  leaveTeam,
  transferLeadership,
  submitWork,
  finalSubmit,
  evaluateTeam,
  lockEvaluation,
  exportEvaluations,
  getTeamsByClassroom,
  requestToJoin,
  getJoinRequests,
  processJoinRequest,
  cancelJoinRequest,
};
