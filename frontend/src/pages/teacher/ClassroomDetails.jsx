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
  Switch,
  NumberInput,
  ActionIcon,
  Avatar,
  Tooltip,
  CopyButton,
  Loader,
  Center,
  Modal,
  Select,
  Progress,
  Card,
  RingProgress,
  SimpleGrid,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';
import {
  IconArrowLeft,
  IconUsers,
  IconUsersGroup,
  IconChartBar,
  IconSettings,
  IconKey,
  IconCopy,
  IconCheck,
  IconTrash,
  IconMail,
  IconSchool,
  IconFolder,
  IconMessage,
  IconUserMinus,
  IconRefresh,
} from '@tabler/icons-react';
import { GlassCard, EmptyState, UserAvatar, StatusBadge } from '../../components/common';
import { showSuccess, showApiError } from '../../components/common/notifications';
import { classroomAPI, teamAPI } from '../../api';

const ClassroomDetails = () => {
  const { classroomId } = useParams();
  const navigate = useNavigate();
  const [classroom, setClassroom] = useState(null);
  const [students, setStudents] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('students');
  const [removeModalOpened, { open: openRemoveModal, close: closeRemoveModal }] = useDisclosure(false);
  const [studentToRemove, setStudentToRemove] = useState(null);

  const settingsForm = useForm({
    initialValues: {
      name: '',
      subject: '',
      description: '',
      maxTeamSize: 5,
      minTeamSize: 2,
      allowStudentTeamCreation: true,
      allowLateSubmissions: false,
      allowStudentChat: true,
      allowStudentToTeacherChat: true,
      allowStudentToStudentChat: true,
      allowTeamChat: true,
      allowClassroomAnnouncements: true,
      allowStudentProjectCreation: false,
      requireMentorApproval: true,
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
        // Handle both response formats: data.classroom or data directly
        const classroomData = classroomRes.data.data.classroom || classroomRes.data.data;
        setClassroom(classroomData);
        settingsForm.setValues({
          name: classroomData.name || '',
          subject: classroomData.subject || '',
          description: classroomData.description || '',
          maxTeamSize: classroomData.settings?.maxTeamSize || 5,
          minTeamSize: classroomData.settings?.minTeamSize || 2,
          allowStudentTeamCreation: classroomData.settings?.allowStudentTeamCreation ?? true,
          allowLateSubmissions: classroomData.settings?.allowLateSubmissions ?? false,
          allowStudentChat: classroomData.settings?.allowStudentChat ?? true,
          allowStudentToTeacherChat: classroomData.settings?.allowStudentToTeacherChat ?? true,
          allowStudentToStudentChat: classroomData.settings?.allowStudentToStudentChat ?? true,
          allowTeamChat: classroomData.settings?.allowTeamChat ?? true,
          allowClassroomAnnouncements: classroomData.settings?.allowClassroomAnnouncements ?? true,
          allowStudentProjectCreation: classroomData.settings?.allowStudentProjectCreation ?? false,
          requireMentorApproval: classroomData.settings?.requireMentorApproval ?? true,
        });
        
        // Also set teams from classroom response if available
        if (classroomRes.data.data.teams) {
          setTeams(classroomRes.data.data.teams);
        }
      }

      if (studentsRes.data.success) {
        // Students come as array of { user, joinedAt, status } - extract user data
        const studentsData = studentsRes.data.data.students || studentsRes.data.data || [];
        const formattedStudents = studentsData.map(s => ({
          ...s.user,
          joinedAt: s.joinedAt,
          status: s.status,
        }));
        setStudents(formattedStudents);
      }

      if (teamsRes.data.success) {
        const teamsData = teamsRes.data.data.teams || teamsRes.data.data || [];
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      }
    } catch (error) {
      console.error('Failed to fetch classroom data:', error);
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (values) => {
    setSaving(true);
    try {
      const updateData = {
        name: values.name,
        subject: values.subject,
        description: values.description,
        settings: {
          maxTeamSize: values.maxTeamSize,
          minTeamSize: values.minTeamSize,
          allowStudentTeamCreation: values.allowStudentTeamCreation,
          allowLateSubmissions: values.allowLateSubmissions,
          allowStudentChat: values.allowStudentChat,
          allowStudentToTeacherChat: values.allowStudentToTeacherChat,
          allowStudentToStudentChat: values.allowStudentToStudentChat,
          allowTeamChat: values.allowTeamChat,
          allowClassroomAnnouncements: values.allowClassroomAnnouncements,
          allowStudentProjectCreation: values.allowStudentProjectCreation,
          requireMentorApproval: values.requireMentorApproval,
        },
      };

      const response = await classroomAPI.update(classroomId, updateData);
      if (response.data.success) {
        showSuccess('Classroom settings updated successfully!');
        setClassroom(response.data.data);
      }
    } catch (error) {
      showApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    
    try {
      await classroomAPI.removeStudent(classroomId, studentToRemove._id);
      showSuccess('Student removed from classroom');
      closeRemoveModal();
      setStudentToRemove(null);
      fetchClassroomData();
    } catch (error) {
      showApiError(error);
    }
  };

  const confirmRemoveStudent = (student) => {
    setStudentToRemove(student);
    openRemoveModal();
  };

  // Calculate statistics
  const stats = {
    totalStudents: students.length,
    totalTeams: teams.length,
    studentsInTeams: teams.reduce((acc, team) => acc + (team.members?.length || 0), 0),
    studentsWithoutTeam: students.length - teams.reduce((acc, team) => acc + (team.members?.length || 0), 0),
  };

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
            <Button variant="light" color="violet" onClick={() => navigate('/app/teacher/classrooms')}>
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
              onClick={() => navigate('/app/teacher/classrooms')}
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

          {/* Classroom Code */}
          <Paper
            p="sm"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <Group gap="md">
              <Group gap="xs">
                <IconKey size={18} />
                <Text fw={600} style={{ letterSpacing: '0.15em', fontSize: '1.1rem' }}>
                  {classroom.code}
                </Text>
              </Group>
              <CopyButton value={classroom.code} timeout={2000}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? 'Copied!' : 'Copy invite code'}>
                    <ActionIcon
                      variant="light"
                      color={copied ? 'green' : 'violet'}
                      onClick={copy}
                    >
                      {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Paper>
        </Group>
      </motion.div>

      {/* Tabs */}
      <GlassCard>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="xl">
            <Tabs.Tab value="students" leftSection={<IconUsers size={16} />}>
              Students ({stats.totalStudents})
            </Tabs.Tab>
            <Tabs.Tab value="teams" leftSection={<IconUsersGroup size={16} />}>
              Teams ({stats.totalTeams})
            </Tabs.Tab>
            <Tabs.Tab value="statistics" leftSection={<IconChartBar size={16} />}>
              Statistics
            </Tabs.Tab>
            <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
              Settings
            </Tabs.Tab>
          </Tabs.List>

          {/* Students Tab */}
          <Tabs.Panel value="students">
            {students.length > 0 ? (
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Student</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Team</Table.Th>
                    <Table.Th>Joined</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {students.map((student) => {
                    const studentTeam = teams.find(t => 
                      t.members?.some(m => (m.user?._id || m.user) === student._id)
                    );
                    return (
                      <Table.Tr key={student._id}>
                        <Table.Td>
                          <Group gap="sm">
                            <UserAvatar user={student} size="sm" />
                            <Text size="sm" fw={500}>
                              {student.firstName} {student.lastName}
                            </Text>
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">{student.email}</Text>
                        </Table.Td>
                        <Table.Td>
                          {studentTeam ? (
                            <Badge color="violet" variant="light">
                              {studentTeam.name}
                            </Badge>
                          ) : (
                            <Badge color="gray" variant="light">No Team</Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {new Date(student.joinedAt || student.createdAt).toLocaleDateString()}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Tooltip label="Send message">
                              <ActionIcon variant="subtle" color="blue" size="sm">
                                <IconMail size={14} />
                              </ActionIcon>
                            </Tooltip>
                            <Tooltip label="Remove from classroom">
                              <ActionIcon 
                                variant="subtle" 
                                color="red" 
                                size="sm"
                                onClick={() => confirmRemoveStudent(student)}
                              >
                                <IconUserMinus size={14} />
                              </ActionIcon>
                            </Tooltip>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            ) : (
              <EmptyState
                icon="users"
                title="No students yet"
                description={`Share the code "${classroom.code}" with your students to let them join.`}
              />
            )}
          </Tabs.Panel>

          {/* Teams Tab */}
          <Tabs.Panel value="teams">
            {teams.length > 0 ? (
              <Grid gutter="lg">
                {teams.map((team) => (
                  <Grid.Col key={team._id} span={{ base: 12, sm: 6, lg: 4 }}>
                    <Paper
                      p="md"
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                      onClick={() => navigate(`/app/teacher/teams/${team._id}`)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(139, 92, 246, 0.1)';
                        e.currentTarget.style.borderColor = 'rgba(139, 92, 246, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-4px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Text fw={600}>{team.name}</Text>
                          <StatusBadge status={team.status || 'ACTIVE'} />
                        </Group>
                        <Text size="sm" c="dimmed" lineClamp={2}>
                          {team.description || 'No description'}
                        </Text>
                        <Divider />
                        <Text size="xs" c="dimmed">Members ({team.members?.length || 0})</Text>
                        <Group gap="xs">
                          {team.members?.slice(0, 5).map((member) => (
                            <Tooltip 
                              key={member._id || member.user?._id} 
                              label={member.user?.firstName ? `${member.user.firstName} ${member.user.lastName}` : 'Member'}
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
                        {team.project && (
                          <>
                            <Divider />
                            <Group gap="xs">
                              <IconFolder size={14} />
                              <Text size="sm">{team.project.title || 'Project'}</Text>
                            </Group>
                          </>
                        )}
                      </Stack>
                    </Paper>
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <EmptyState
                icon="team"
                title="No teams yet"
                description="Teams will appear here once students create them."
              />
            )}
          </Tabs.Panel>

          {/* Statistics Tab */}
          <Tabs.Panel value="statistics">
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg" mb="xl">
              <Paper
                p="lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(139, 92, 246, 0.05))',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                }}
              >
                <Group justify="space-between">
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total Students</Text>
                    <Title order={2}>{stats.totalStudents}</Title>
                  </Box>
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
                    <IconUsers size={24} />
                  </Box>
                </Group>
              </Paper>

              <Paper
                p="lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(6, 182, 212, 0.05))',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                }}
              >
                <Group justify="space-between">
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Total Teams</Text>
                    <Title order={2}>{stats.totalTeams}</Title>
                  </Box>
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(6, 182, 212, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconUsersGroup size={24} />
                  </Box>
                </Group>
              </Paper>

              <Paper
                p="lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.05))',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <Group justify="space-between">
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>In Teams</Text>
                    <Title order={2}>{stats.studentsInTeams}</Title>
                  </Box>
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(16, 185, 129, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconCheck size={24} />
                  </Box>
                </Group>
              </Paper>

              <Paper
                p="lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                <Group justify="space-between">
                  <Box>
                    <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Without Team</Text>
                    <Title order={2}>{stats.studentsWithoutTeam < 0 ? 0 : stats.studentsWithoutTeam}</Title>
                  </Box>
                  <Box
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      background: 'rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IconSchool size={24} />
                  </Box>
                </Group>
              </Paper>
            </SimpleGrid>

            {/* Team Formation Progress */}
            <GlassCard>
              <Text fw={600} mb="md">Team Formation Progress</Text>
              <Progress.Root size="xl" radius="xl">
                <Tooltip label={`${stats.studentsInTeams} students in teams`}>
                  <Progress.Section 
                    value={stats.totalStudents > 0 ? (stats.studentsInTeams / stats.totalStudents) * 100 : 0} 
                    color="green"
                  >
                    <Progress.Label>In Teams</Progress.Label>
                  </Progress.Section>
                </Tooltip>
                <Tooltip label={`${stats.studentsWithoutTeam < 0 ? 0 : stats.studentsWithoutTeam} students without teams`}>
                  <Progress.Section 
                    value={stats.totalStudents > 0 ? ((stats.studentsWithoutTeam < 0 ? 0 : stats.studentsWithoutTeam) / stats.totalStudents) * 100 : 0} 
                    color="yellow"
                  >
                    <Progress.Label>Unassigned</Progress.Label>
                  </Progress.Section>
                </Tooltip>
              </Progress.Root>
            </GlassCard>
          </Tabs.Panel>

          {/* Settings Tab */}
          <Tabs.Panel value="settings">
            <form onSubmit={settingsForm.onSubmit(handleSaveSettings)}>
              <Stack gap="xl">
                {/* Basic Info */}
                <Box>
                  <Text fw={600} size="lg" mb="md">Basic Information</Text>
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TextInput
                        label="Classroom Name"
                        placeholder="e.g., Web Development 101"
                        {...settingsForm.getInputProps('name')}
                        styles={{
                          input: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, md: 6 }}>
                      <TextInput
                        label="Subject"
                        placeholder="e.g., Computer Science"
                        {...settingsForm.getInputProps('subject')}
                        styles={{
                          input: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />
                    </Grid.Col>
                    <Grid.Col span={12}>
                      <Textarea
                        label="Description"
                        placeholder="Brief description of the classroom"
                        rows={3}
                        {...settingsForm.getInputProps('description')}
                        styles={{
                          input: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                </Box>

                <Divider />

                {/* Team Settings */}
                <Box>
                  <Text fw={600} size="lg" mb="md">Team Settings</Text>
                  <Stack gap="md">
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label="Minimum Team Size"
                          min={1}
                          max={5}
                          {...settingsForm.getInputProps('minTeamSize')}
                          styles={{
                            input: {
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, md: 6 }}>
                        <NumberInput
                          label="Maximum Team Size"
                          min={2}
                          max={10}
                          {...settingsForm.getInputProps('maxTeamSize')}
                          styles={{
                            input: {
                              background: 'rgba(255, 255, 255, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.1)',
                            },
                          }}
                        />
                      </Grid.Col>
                    </Grid>
                    <Switch
                      label="Allow students to create teams"
                      description="If disabled, only teachers can create teams"
                      {...settingsForm.getInputProps('allowStudentTeamCreation', { type: 'checkbox' })}
                    />
                    <Switch
                      label="Allow late submissions"
                      description="Allow students to submit work after deadlines"
                      {...settingsForm.getInputProps('allowLateSubmissions', { type: 'checkbox' })}
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Chat Permissions */}
                <Box>
                  <Text fw={600} size="lg" mb="md" component="div">
                    <Group gap="xs">
                      <IconMessage size={20} />
                      Chat Permissions
                    </Group>
                  </Text>
                  <Stack gap="md">
                    <Switch
                      label="Enable student chat"
                      description="Allow students to use the classroom chat feature"
                      {...settingsForm.getInputProps('allowStudentChat', { type: 'checkbox' })}
                    />
                    <Switch
                      label="Allow student-to-teacher chat"
                      description="Students can send direct messages to the teacher"
                      {...settingsForm.getInputProps('allowStudentToTeacherChat', { type: 'checkbox' })}
                    />
                    <Switch
                      label="Allow student-to-student chat"
                      description="Students can send direct messages to each other"
                      {...settingsForm.getInputProps('allowStudentToStudentChat', { type: 'checkbox' })}
                    />
                    <Switch
                      label="Enable team chat"
                      description="Allow team members to chat within their teams"
                      {...settingsForm.getInputProps('allowTeamChat', { type: 'checkbox' })}
                    />
                    <Switch
                      label="Allow classroom announcements"
                      description="Teacher can post announcements to all students"
                      {...settingsForm.getInputProps('allowClassroomAnnouncements', { type: 'checkbox' })}
                    />
                  </Stack>
                </Box>

                <Divider />

                {/* Project Permissions */}
                <Box>
                  <Text fw={600} size="lg" mb="md" component="div">
                    <Group gap="xs">
                      <IconFolder size={20} />
                      Project Permissions
                    </Group>
                  </Text>
                  <Stack gap="md">
                    <Switch
                      label="Allow students to create projects"
                      description="If disabled, only teachers can create projects for teams"
                      {...settingsForm.getInputProps('allowStudentProjectCreation', { type: 'checkbox' })}
                    />
                    <Switch
                      label="Require mentor approval"
                      description="Projects need mentor approval before becoming active"
                      {...settingsForm.getInputProps('requireMentorApproval', { type: 'checkbox' })}
                    />
                  </Stack>
                </Box>

                <Divider />

                <Group justify="flex-end">
                  <Button
                    variant="subtle"
                    color="gray"
                    leftSection={<IconRefresh size={16} />}
                    onClick={() => settingsForm.reset()}
                  >
                    Reset Changes
                  </Button>
                  <Button
                    type="submit"
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                    loading={saving}
                  >
                    Save Settings
                  </Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>
        </Tabs>
      </GlassCard>

      {/* Remove Student Modal */}
      <Modal
        opened={removeModalOpened}
        onClose={closeRemoveModal}
        title="Remove Student"
        centered
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
        <Stack gap="md">
          <Text>
            Are you sure you want to remove{' '}
            <Text span fw={600}>
              {studentToRemove?.firstName} {studentToRemove?.lastName}
            </Text>{' '}
            from this classroom?
          </Text>
          <Text size="sm" c="dimmed">
            This action will remove the student from all teams in this classroom as well.
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={closeRemoveModal}>
              Cancel
            </Button>
            <Button color="red" onClick={handleRemoveStudent}>
              Remove Student
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default ClassroomDetails;
