import { useEffect, useState } from 'react';
import {
  Title,
  Text,
  Stack,
  Grid,
  Paper,
  Group,
  Button,
  SimpleGrid,
  RingProgress,
  Table,
  ActionIcon,
  Badge,
  Box,
  Tooltip,
} from '@mantine/core';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IconSchool,
  IconUsers,
  IconFolder,
  IconMessage,
  IconPlus,
  IconEye,
  IconDownload,
  IconChartBar,
  IconClipboardCheck,
} from '@tabler/icons-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { GlassCard, StatsCard, StatusBadge, EmptyState } from '../../components/common';
import { dashboardAPI } from '../../api';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { connect, unreadCount } = useChatStore();
  const [stats, setStats] = useState({
    classrooms: 0,
    totalStudents: 0,
    activeProjects: 0,
    pendingEvaluations: 0,
  });
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [classroomStats, setClassroomStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to chat socket
    if (token) {
      connect(token);
    }

    // Fetch dashboard data
    const fetchDashboard = async () => {
      try {
        const response = await dashboardAPI.getTeacherDashboard();
        if (response.data.success) {
          const data = response.data.data;
          setStats({
            classrooms: data.stats?.totalClassrooms || 0,
            totalStudents: data.stats?.totalStudents || 0,
            activeProjects: data.stats?.mentoringProjects || 0,
            pendingEvaluations: data.stats?.pendingEvaluations || 0,
          });
          setRecentSubmissions(data.pendingEvaluations || []);
          setClassroomStats(data.classrooms || []);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [token, connect]);

  const statsData = [
    {
      title: 'Classrooms',
      value: stats.classrooms,
      icon: IconSchool,
      color: 'violet',
      path: '/app/teacher/classrooms',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: IconUsers,
      color: 'cyan',
      path: '/app/teacher/classrooms',
    },
    {
      title: 'Active Projects',
      value: stats.activeProjects,
      icon: IconFolder,
      color: 'blue',
      path: '/app/teacher/projects',
    },
    {
      title: 'Pending Evaluations',
      value: stats.pendingEvaluations,
      icon: IconClipboardCheck,
      color: 'yellow',
      path: '/app/teacher/projects',
    },
  ];

  return (
    <Stack gap="xl">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Title order={2}>
              Welcome,{' '}
              <Text
                span
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
              >
                {user?.name?.split(' ')[0]}!
              </Text>
            </Title>
            <Text c="dimmed">
              Manage your classrooms and track student progress.
            </Text>
          </Stack>
          <Group>
            <Button
              variant="outline"
              color="gray"
              leftSection={<IconDownload size={16} />}
            >
              Export Report
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
              leftSection={<IconPlus size={16} />}
              onClick={() => navigate('/app/teacher/classrooms/create')}
            >
              Create Classroom
            </Button>
          </Group>
        </Group>
      </motion.div>

      {/* Stats Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(stat.path)}
            style={{ cursor: 'pointer' }}
          >
            <StatsCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              delay={index * 0.1}
            />
          </motion.div>
        ))}
      </SimpleGrid>

      {/* Main Content Grid */}
      <Grid gutter="xl">
        {/* Recent Submissions */}
        <Grid.Col span={{ base: 12, lg: 8 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlassCard>
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={4}>Recent Submissions</Title>
                  <Button
                    variant="subtle"
                    size="xs"
                    onClick={() => navigate('/app/teacher/projects')}
                  >
                    View all
                  </Button>
                </Group>

                {recentSubmissions.length > 0 ? (
                  <Table.ScrollContainer minWidth={500}>
                    <Table verticalSpacing="sm" highlightOnHover>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Project</Table.Th>
                          <Table.Th>Team</Table.Th>
                          <Table.Th>Submitted</Table.Th>
                          <Table.Th>Status</Table.Th>
                          <Table.Th>Action</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {recentSubmissions.slice(0, 5).map((submission, index) => (
                          <Table.Tr key={index}>
                            <Table.Td>
                              <Text size="sm" fw={500}>
                                {submission.projectName}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">
                                {submission.teamName}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm" c="dimmed">
                                {new Date(submission.submittedAt).toLocaleDateString()}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <StatusBadge status={submission.status} />
                            </Table.Td>
                            <Table.Td>
                              <Group gap="xs">
                                <Tooltip label="View Details">
                                  <ActionIcon
                                    variant="subtle"
                                    color="violet"
                                    onClick={() => navigate(`/app/teacher/projects/${submission.projectId}`)}
                                  >
                                    <IconEye size={16} />
                                  </ActionIcon>
                                </Tooltip>
                                <Tooltip label="Evaluate">
                                  <ActionIcon
                                    variant="subtle"
                                    color="cyan"
                                  >
                                    <IconClipboardCheck size={16} />
                                  </ActionIcon>
                                </Tooltip>
                              </Group>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                ) : (
                  <EmptyState
                    icon="folder"
                    title="No submissions yet"
                    description="Student submissions will appear here"
                  />
                )}
              </Stack>
            </GlassCard>
          </motion.div>
        </Grid.Col>

        {/* Classroom Overview */}
        <Grid.Col span={{ base: 12, lg: 4 }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <GlassCard style={{ height: '100%' }}>
              <Stack gap="md">
                <Title order={4}>Classroom Overview</Title>

                {classroomStats.length > 0 ? (
                  <Stack gap="sm">
                    {classroomStats.slice(0, 4).map((classroom, index) => (
                      <Paper
                        key={index}
                        p="sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <Group justify="space-between">
                          <Box style={{ flex: 1 }}>
                            <Text size="sm" fw={500}>{classroom.name}</Text>
                            <Text size="xs" c="dimmed">
                              {classroom.studentCount} students • {classroom.projectCount} projects
                            </Text>
                          </Box>
                          <RingProgress
                            size={50}
                            thickness={4}
                            roundCaps
                            sections={[
                              { value: classroom.completionRate || 0, color: 'violet' },
                            ]}
                            label={
                              <Text size="xs" ta="center" fw={600}>
                                {classroom.completionRate || 0}%
                              </Text>
                            }
                          />
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <Stack align="center" py="xl">
                    <IconSchool size={48} stroke={1.5} color="gray" />
                    <Text size="sm" c="dimmed" ta="center">
                      Create your first classroom to get started
                    </Text>
                    <Button
                      variant="light"
                      color="violet"
                      size="sm"
                      onClick={() => navigate('/app/teacher/classrooms/create')}
                    >
                      Create Classroom
                    </Button>
                  </Stack>
                )}
              </Stack>
            </GlassCard>
          </motion.div>
        </Grid.Col>

        {/* Quick Actions */}
        <Grid.Col span={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassCard>
              <Stack gap="md">
                <Title order={4}>Quick Actions</Title>
                <SimpleGrid cols={{ base: 2, sm: 4 }}>
                  <Button
                    variant="light"
                    color="violet"
                    size="lg"
                    leftSection={<IconSchool size={20} />}
                    onClick={() => navigate('/app/teacher/classrooms/create')}
                    style={{ height: 'auto', padding: '20px' }}
                  >
                    <Stack gap={4} align="center">
                      <Text size="sm" fw={500}>New Classroom</Text>
                      <Text size="xs" c="dimmed">Create & invite students</Text>
                    </Stack>
                  </Button>

                  <Button
                    variant="light"
                    color="cyan"
                    size="lg"
                    leftSection={<IconFolder size={20} />}
                    onClick={() => navigate('/app/teacher/projects/create')}
                    style={{ height: 'auto', padding: '20px' }}
                  >
                    <Stack gap={4} align="center">
                      <Text size="sm" fw={500}>New Project</Text>
                      <Text size="xs" c="dimmed">Assign to classroom</Text>
                    </Stack>
                  </Button>

                  <Button
                    variant="light"
                    color="blue"
                    size="lg"
                    leftSection={<IconChartBar size={20} />}
                    onClick={() => navigate('/app/teacher/projects')}
                    style={{ height: 'auto', padding: '20px' }}
                  >
                    <Stack gap={4} align="center">
                      <Text size="sm" fw={500}>View Analytics</Text>
                      <Text size="xs" c="dimmed">Track progress</Text>
                    </Stack>
                  </Button>

                  <Button
                    variant="light"
                    color="green"
                    size="lg"
                    leftSection={<IconMessage size={20} />}
                    onClick={() => navigate('/app/teacher/chat')}
                    style={{ height: 'auto', padding: '20px' }}
                  >
                    <Stack gap={4} align="center">
                      <Text size="sm" fw={500}>Messages</Text>
                      <Text size="xs" c="dimmed">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'View chats'}
                      </Text>
                    </Stack>
                  </Button>
                </SimpleGrid>
              </Stack>
            </GlassCard>
          </motion.div>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default TeacherDashboard;
