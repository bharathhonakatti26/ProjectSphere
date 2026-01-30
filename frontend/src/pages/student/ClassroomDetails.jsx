import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Title,
  Text,
  Stack,
  Grid,
  Paper,
  Group,
  Button,
  TextInput,
  Textarea,
  Badge,
  Box,
  Tabs,
  Table,
  ActionIcon,
  Avatar,
  Tooltip,
  Loader,
  Center,
  Modal,
  MultiSelect,
  Divider,
  Card,
  SimpleGrid,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';
import {
  IconArrowLeft,
  IconUsers,
  IconUsersGroup,
  IconFolder,
  IconPlus,
  IconSchool,
  IconMail,
  IconMessage,
  IconBrandGithub,
  IconWorld,
  IconCode,
  IconUserPlus,
  IconCheck,
} from '@tabler/icons-react';
import { GlassCard, EmptyState, UserAvatar, StatusBadge } from '../../components/common';
import { showSuccess, showApiError } from '../../components/common/notifications';
import { classroomAPI, teamAPI, projectAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';

const TECHNOLOGY_OPTIONS = [
  'React', 'Vue.js', 'Angular', 'Next.js', 'Node.js', 'Express.js',
  'Python', 'Django', 'Flask', 'FastAPI',
  'Java', 'Spring Boot', 'Kotlin',
  'Go', 'Rust', 'C++', 'C#', '.NET',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Firebase',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'TensorFlow', 'PyTorch', 'Machine Learning', 'AI',
  'React Native', 'Flutter', 'Swift', 'Kotlin Android',
  'GraphQL', 'REST API', 'WebSocket', 'gRPC',
  'TypeScript', 'JavaScript', 'HTML', 'CSS', 'Tailwind CSS',
];

const StudentClassroomDetails = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classroom, setClassroom] = useState(null);
  const [classmates, setClassmates] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('classmates');
  const [createTeamOpened, { open: openCreateTeam, close: closeCreateTeam }] = useDisclosure(false);
  const [creating, setCreating] = useState(false);
  const [myTeam, setMyTeam] = useState(null);

  const createTeamForm = useForm({
    initialValues: {
      name: '',
      description: '',
      projectTitle: '',
      projectDescription: '',
      technologies: [],
      repositoryUrl: '',
    },
    validate: {
      name: (value) => (value.length >= 3 ? null : 'Team name must be at least 3 characters'),
      projectTitle: (value) => (value.length >= 3 ? null : 'Project title is required'),
      technologies: (value) => (value.length > 0 ? null : 'Select at least one technology'),
    },
  });

  useEffect(() => {
    fetchClassroomData();
  }, [classroomId]);

  const fetchClassroomData = async () => {
    setLoading(true);
    try {
      const [classroomRes, studentsRes, teamsRes] = await Promise.all([
        classroomAPI.getById(classroomId),
        classroomAPI.getStudents(classroomId).catch(() => ({ data: { success: true, data: { students: [] } } })),
        classroomAPI.getTeams(classroomId).catch(() => ({ data: { success: true, data: { teams: [] } } })),
      ]);

      if (classroomRes.data.success) {
        const classroomData = classroomRes.data.data.classroom || classroomRes.data.data;
        setClassroom(classroomData);
        
        if (classroomRes.data.data.teams) {
          const teamsData = classroomRes.data.data.teams;
          setTeams(Array.isArray(teamsData) ? teamsData : []);
          findMyTeam(teamsData);
        }
      }

      if (studentsRes.data.success) {
        const studentsData = studentsRes.data.data.students || studentsRes.data.data || [];
        const formattedStudents = studentsData.map(s => ({
          ...(s.user || s),
          joinedAt: s.joinedAt,
          status: s.status,
        }));
        setClassmates(formattedStudents);
      }

      if (teamsRes.data.success) {
        const teamsData = teamsRes.data.data.teams || teamsRes.data.data || [];
        setTeams(Array.isArray(teamsData) ? teamsData : []);
        findMyTeam(teamsData);
      }
    } catch (error) {
      console.error('Failed to fetch classroom data:', error);
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const findMyTeam = (teamsData) => {
    const userId = user?.id || user?._id;
    const team = teamsData.find(t => 
      t.members?.some(m => {
        const memberId = m.user?._id || m.user?.id || m.user || m._id;
        return memberId?.toString() === userId?.toString();
      }) ||
      (t.leader?._id || t.leader?.id || t.leader)?.toString() === userId?.toString()
    );
    setMyTeam(team || null);
  };

  const handleCreateTeam = async (values) => {
    setCreating(true);
    try {
      // Create team with project
      const teamData = {
        name: values.name,
        description: values.description,
        classroom: classroomId,
        project: {
          title: values.projectTitle,
          description: values.projectDescription,
          technologies: values.technologies,
          repositoryUrl: values.repositoryUrl,
        },
      };

      const response = await teamAPI.create(teamData);
      if (response.data.success) {
        showSuccess('Team created successfully! You are the team leader.');
        closeCreateTeam();
        createTeamForm.reset();
        fetchClassroomData();
      }
    } catch (error) {
      showApiError(error);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async (teamId) => {
    try {
      const response = await teamAPI.requestToJoin(teamId);
      if (response.data.success) {
        showSuccess('Join request sent! The team leader will review your request.');
        fetchClassroomData();
      }
    } catch (error) {
      showApiError(error);
    }
  };

  const currentUserId = user?.id || user?._id;

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Loader color="violet" size="lg" />
      </Center>
    );
  }

  if (!classroom) {
    return (
      <GlassCard>
        <EmptyState
          icon="error"
          title="Classroom not found"
          description="The classroom you're looking for doesn't exist or you don't have access."
          action={
            <Button variant="light" color="violet" onClick={() => navigate('/app/student/classrooms')}>
              Back to Classrooms
            </Button>
          }
        />
      </GlassCard>
    );
  }

  return (
    <Stack gap="xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Group justify="space-between" align="flex-start">
          <Group gap="md">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="lg"
              onClick={() => navigate('/app/student/classrooms')}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Box>
              <Group gap="md" align="center">
                <Title order={2}>{classroom.name}</Title>
                <Badge color="violet" variant="light">{classroom.subject}</Badge>
              </Group>
              <Text c="dimmed" size="sm" mt={4}>{classroom.description}</Text>
            </Box>
          </Group>

          {/* Teacher Info */}
          <Paper
            p="sm"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <Group gap="sm">
              <UserAvatar user={classroom.teacher} size="sm" />
              <Box>
                <Text size="xs" c="dimmed">Supervised by</Text>
                <Text size="sm" fw={500}>
                  {classroom.teacher?.firstName} {classroom.teacher?.lastName}
                </Text>
              </Box>
            </Group>
          </Paper>
        </Group>
      </motion.div>

      {/* My Team Banner */}
      {myTeam && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Paper
            p="lg"
            style={{
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <Group justify="space-between">
              <Group gap="md">
                <Box
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: 'rgba(139, 92, 246, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconUsersGroup size={24} />
                </Box>
                <Box>
                  <Text size="xs" c="dimmed">Your Team</Text>
                  <Text size="lg" fw={600}>{myTeam.name}</Text>
                </Box>
              </Group>
              <Group gap="md">
                <Box ta="center">
                  <Text size="xs" c="dimmed">Members</Text>
                  <Text fw={600}>{myTeam.members?.length || 1}</Text>
                </Box>
                {myTeam.project && (
                  <Box ta="center">
                    <Text size="xs" c="dimmed">Project</Text>
                    <Text fw={500} size="sm">{myTeam.project?.title || 'In Progress'}</Text>
                  </Box>
                )}
                <Button
                  variant="light"
                  color="violet"
                  onClick={() => navigate(`/app/student/teams/${myTeam._id}`)}
                >
                  View Team
                </Button>
              </Group>
            </Group>
          </Paper>
        </motion.div>
      )}

      {/* Tabs */}
      <GlassCard>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="xl">
            <Tabs.Tab value="classmates" leftSection={<IconUsers size={16} />}>
              Classmates ({classmates.length})
            </Tabs.Tab>
            <Tabs.Tab value="teams" leftSection={<IconUsersGroup size={16} />}>
              Teams ({teams.length})
            </Tabs.Tab>
          </Tabs.List>

          {/* Classmates Tab */}
          <Tabs.Panel value="classmates">
            <Stack gap="md">
              {!myTeam && classroom.settings?.allowStudentTeamCreation !== false && (
                <Group justify="flex-end">
                  <Button
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                    leftSection={<IconPlus size={16} />}
                    onClick={openCreateTeam}
                  >
                    Create Team
                  </Button>
                </Group>
              )}

              {classmates.length > 0 ? (
                <Grid gutter="md">
                  {classmates.map((classmate) => {
                    const classmateId = classmate._id || classmate.id;
                    const isMe = classmateId === currentUserId;
                    const classmateTeam = teams.find(t => 
                      t.members?.some(m => {
                        const memberId = m.user?._id || m.user?.id || m.user || m._id;
                        return memberId?.toString() === classmateId?.toString();
                      })
                    );

                    return (
                      <Grid.Col key={classmateId} span={{ base: 12, sm: 6, lg: 4 }}>
                        <Paper
                          p="md"
                          style={{
                            background: isMe 
                              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isMe 
                              ? '1px solid rgba(139, 92, 246, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <Group justify="space-between">
                            <Group gap="sm">
                              <UserAvatar user={classmate} size="md" />
                              <Box>
                                <Group gap="xs">
                                  <Text fw={500}>
                                    {classmate.firstName} {classmate.lastName}
                                  </Text>
                                  {isMe && (
                                    <Badge size="xs" color="violet" variant="light">You</Badge>
                                  )}
                                </Group>
                                <Text size="xs" c="dimmed">{classmate.email}</Text>
                                {classmateTeam && (
                                  <Badge size="xs" color="cyan" variant="light" mt={4}>
                                    {classmateTeam.name}
                                  </Badge>
                                )}
                              </Box>
                            </Group>
                            {!isMe && classroom.settings?.allowStudentToStudentChat !== false && (
                              <Tooltip label="Send message">
                                <ActionIcon variant="subtle" color="violet">
                                  <IconMessage size={16} />
                                </ActionIcon>
                              </Tooltip>
                            )}
                          </Group>
                        </Paper>
                      </Grid.Col>
                    );
                  })}
                </Grid>
              ) : (
                <EmptyState
                  icon="users"
                  title="No classmates yet"
                  description="You're the first one here! Invite others to join using the classroom code."
                />
              )}
            </Stack>
          </Tabs.Panel>

          {/* Teams Tab */}
          <Tabs.Panel value="teams">
            <Stack gap="md">
              {!myTeam && classroom.settings?.allowStudentTeamCreation !== false && (
                <Group justify="flex-end">
                  <Button
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                    leftSection={<IconPlus size={16} />}
                    onClick={openCreateTeam}
                  >
                    Create Team
                  </Button>
                </Group>
              )}

              {teams.length > 0 ? (
                <Grid gutter="lg">
                  {teams.map((team) => {
                    const isMyTeam = myTeam?._id === team._id;
                    const isFull = (team.members?.length || 0) >= (classroom.settings?.maxTeamSize || 5);
                    
                    return (
                      <Grid.Col key={team._id} span={{ base: 12, sm: 6 }}>
                        <Paper
                          p="lg"
                          style={{
                            background: isMyTeam
                              ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(6, 182, 212, 0.15))'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: isMyTeam
                              ? '1px solid rgba(139, 92, 246, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.1)',
                          }}
                        >
                          <Stack gap="md">
                            <Group justify="space-between">
                              <Group gap="sm">
                                <Box
                                  style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 10,
                                    background: 'rgba(139, 92, 246, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <IconUsersGroup size={20} />
                                </Box>
                                <Box>
                                  <Group gap="xs">
                                    <Text fw={600}>{team.name}</Text>
                                    {isMyTeam && (
                                      <Badge size="xs" color="violet">Your Team</Badge>
                                    )}
                                  </Group>
                                  <Text size="xs" c="dimmed">
                                    {team.members?.length || 1} / {classroom.settings?.maxTeamSize || 5} members
                                  </Text>
                                </Box>
                              </Group>
                              <StatusBadge status={team.status || 'ACTIVE'} />
                            </Group>

                            {team.description && (
                              <Text size="sm" c="dimmed" lineClamp={2}>
                                {team.description}
                              </Text>
                            )}

                            {/* Project Info */}
                            {team.project && (
                              <Paper
                                p="sm"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.02)',
                                  border: '1px solid rgba(255, 255, 255, 0.05)',
                                }}
                              >
                                <Group gap="xs" mb="xs">
                                  <IconFolder size={14} />
                                  <Text size="sm" fw={500}>{team.project.title}</Text>
                                </Group>
                                {team.project.technologies?.length > 0 && (
                                  <Group gap={4}>
                                    {team.project.technologies.slice(0, 4).map((tech) => (
                                      <Badge key={tech} size="xs" variant="outline" color="cyan">
                                        {tech}
                                      </Badge>
                                    ))}
                                    {team.project.technologies.length > 4 && (
                                      <Badge size="xs" variant="outline" color="gray">
                                        +{team.project.technologies.length - 4}
                                      </Badge>
                                    )}
                                  </Group>
                                )}
                              </Paper>
                            )}

                            {/* Team Members */}
                            <Group gap="xs">
                              <Text size="xs" c="dimmed">Members:</Text>
                              <Group gap={4}>
                                {team.members?.slice(0, 5).map((member, idx) => (
                                  <Tooltip
                                    key={idx}
                                    label={member.user?.firstName 
                                      ? `${member.user.firstName} ${member.user.lastName}${member.role === 'LEADER' ? ' (Leader)' : ''}`
                                      : 'Member'
                                    }
                                  >
                                    <Avatar size="sm" radius="xl" color="violet">
                                      {member.user?.firstName?.[0] || 'M'}
                                    </Avatar>
                                  </Tooltip>
                                ))}
                                {(team.members?.length || 0) > 5 && (
                                  <Avatar size="sm" radius="xl" color="gray">
                                    +{team.members.length - 5}
                                  </Avatar>
                                )}
                              </Group>
                            </Group>

                            {/* Actions */}
                            <Group gap="sm">
                              {isMyTeam ? (
                                <Button
                                  variant="light"
                                  color="violet"
                                  fullWidth
                                  onClick={() => navigate(`/app/student/teams/${team._id}`)}
                                >
                                  View Team Details
                                </Button>
                              ) : !myTeam && !isFull ? (
                                <Button
                                  variant="light"
                                  color="cyan"
                                  fullWidth
                                  leftSection={<IconUserPlus size={16} />}
                                  onClick={() => handleJoinTeam(team._id)}
                                >
                                  Request to Join
                                </Button>
                              ) : isFull ? (
                                <Button variant="light" color="gray" fullWidth disabled>
                                  Team is Full
                                </Button>
                              ) : (
                                <Button variant="light" color="gray" fullWidth disabled>
                                  Already in a Team
                                </Button>
                              )}
                            </Group>
                          </Stack>
                        </Paper>
                      </Grid.Col>
                    );
                  })}
                </Grid>
              ) : (
                <EmptyState
                  icon="team"
                  title="No teams yet"
                  description="Be the first to create a team and start working on your class project!"
                  action={
                    classroom.settings?.allowStudentTeamCreation !== false && (
                      <Button
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                        onClick={openCreateTeam}
                      >
                        Create Team
                      </Button>
                    )
                  }
                />
              )}
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </GlassCard>

      {/* Create Team Modal */}
      <Modal
        opened={createTeamOpened}
        onClose={closeCreateTeam}
        title="Create Team & Project"
        centered
        size="lg"
        styles={{
          content: {
            background: 'rgba(26, 27, 30, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          header: {
            background: 'transparent',
          },
        }}
      >
        <form onSubmit={createTeamForm.onSubmit(handleCreateTeam)}>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Create your team and define your class project. You will be the team leader.
            </Text>

            <Divider label="Team Information" labelPosition="center" />

            <TextInput
              label="Team Name"
              placeholder="e.g., Code Wizards"
              required
              {...createTeamForm.getInputProps('name')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />

            <Textarea
              label="Team Description"
              placeholder="Brief description of your team"
              rows={2}
              {...createTeamForm.getInputProps('description')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />

            <Divider label="Project Details" labelPosition="center" />

            <TextInput
              label="Project Title"
              placeholder="e.g., E-Commerce Platform"
              required
              {...createTeamForm.getInputProps('projectTitle')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />

            <Textarea
              label="Project Description"
              placeholder="Describe what your project will do..."
              rows={3}
              {...createTeamForm.getInputProps('projectDescription')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />

            <MultiSelect
              label="Technologies"
              placeholder="Select technologies you'll be using"
              data={TECHNOLOGY_OPTIONS}
              searchable
              required
              {...createTeamForm.getInputProps('technologies')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />

            <TextInput
              label="Repository URL (Optional)"
              placeholder="https://github.com/username/project"
              leftSection={<IconBrandGithub size={16} />}
              {...createTeamForm.getInputProps('repositoryUrl')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" color="gray" onClick={closeCreateTeam}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                loading={creating}
              >
                Create Team & Project
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
};

export default StudentClassroomDetails;
