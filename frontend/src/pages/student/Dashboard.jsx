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
  Progress,
  List,
  ThemeIcon,
  Badge,
  Box,
} from '@mantine/core';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IconSchool,
  IconUsers,
  IconFolder,
  IconMessage,
  IconClock,
  IconCheck,
  IconArrowRight,
  IconPlus,
} from '@tabler/icons-react';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import { GlassCard, StatsCard, StatusBadge, EmptyState } from '../../components/common';
import { dashboardAPI } from '../../api';

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, token } = useAuthStore();
  const { connect, unreadCount } = useChatStore();
  const [stats, setStats] = useState({
    classrooms: 0,
    teams: 0,
    projects: 0,
    pendingTasks: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Connect to chat socket
    if (token) {
      connect(token);
    }

    // Fetch dashboard data
    const fetchDashboard = async () => {
      try {
        const response = await dashboardAPI.getStudentDashboard();
        if (response.data.success) {
          const data = response.data.data;
          setStats({
            classrooms: data.stats?.totalClassrooms || 0,
            teams: data.stats?.totalTeams || 0,
            projects: data.stats?.totalProjects || 0,
            pendingTasks: data.stats?.completedProjects || 0,
          });
          setRecentActivity(data.projects || []);
          setUpcomingDeadlines(data.teams || []);
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
      title: 'My Classrooms',
      value: stats.classrooms,
      icon: IconSchool,
      color: 'violet',
      path: '/app/student/classrooms',
    },
    {
      title: 'My Teams',
      value: stats.teams,
      icon: IconUsers,
      color: 'cyan',
      path: '/app/student/teams',
    },
    {
      title: 'Active Projects',
      value: stats.projects,
      icon: IconFolder,
      color: 'blue',
      path: '/app/student/projects',
    },
    {
      title: 'Unread Messages',
      value: unreadCount,
      icon: IconMessage,
      color: 'green',
      path: '/app/student/chat',
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
              Welcome back,{' '}
              <Text
                span
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
              >
                {user?.name?.split(' ')[0]}!
              </Text>
            </Title>
            <Text c="dimmed">
              Here's what's happening with your projects today.
            </Text>
          </Stack>
          <Button
            variant="gradient"
            gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
            leftSection={<IconPlus size={16} />}
            onClick={() => navigate('/app/student/classrooms')}
          >
            Join Classroom
          </Button>
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
        {/* Upcoming Deadlines */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <GlassCard>
              <Stack gap="md">
                <Group justify="space-between">
                  <Title order={4}>Upcoming Deadlines</Title>
                  <Badge variant="light" color="yellow">
                    {upcomingDeadlines.length} pending
                  </Badge>
                </Group>

                {upcomingDeadlines.length > 0 ? (
                  <Stack gap="sm">
                    {upcomingDeadlines.slice(0, 4).map((deadline, index) => (
                      <Paper
                        key={index}
                        p="sm"
                        style={{
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                        }}
                      >
                        <Group justify="space-between">
                          <Box>
                            <Text size="sm" fw={500}>{deadline.title}</Text>
                            <Text size="xs" c="dimmed">{deadline.projectName}</Text>
                          </Box>
                          <Stack gap={2} align="flex-end">
                            <Group gap="xs">
                              <IconClock size={14} />
                              <Text size="xs" c="dimmed">
                                {new Date(deadline.dueDate).toLocaleDateString()}
                              </Text>
                            </Group>
                            <StatusBadge status={deadline.status} size="xs" />
                          </Stack>
                        </Group>
                      </Paper>
                    ))}
                  </Stack>
                ) : (
                  <EmptyState
                    icon="folder"
                    title="No deadlines"
                    description="You're all caught up!"
                  />
                )}

                <Button
                  variant="subtle"
                  rightSection={<IconArrowRight size={14} />}
                  onClick={() => navigate('/app/student/projects')}
                >
                  View all projects
                </Button>
              </Stack>
            </GlassCard>
          </motion.div>
        </Grid.Col>

        {/* Recent Activity */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <GlassCard>
              <Stack gap="md">
                <Title order={4}>Recent Activity</Title>

                {recentActivity.length > 0 ? (
                  <List spacing="sm" size="sm" center>
                    {recentActivity.slice(0, 5).map((activity, index) => (
                      <List.Item
                        key={index}
                        icon={
                          <ThemeIcon
                            color={activity.type === 'completed' ? 'green' : 'violet'}
                            size={24}
                            radius="xl"
                          >
                            {activity.type === 'completed' ? (
                              <IconCheck size={14} />
                            ) : (
                              <IconClock size={14} />
                            )}
                          </ThemeIcon>
                        }
                      >
                        <Text size="sm">{activity.message}</Text>
                        <Text size="xs" c="dimmed">
                          {new Date(activity.createdAt).toLocaleDateString()}
                        </Text>
                      </List.Item>
                    ))}
                  </List>
                ) : (
                  <EmptyState
                    icon="folder"
                    title="No recent activity"
                    description="Your activity will appear here"
                  />
                )}
              </Stack>
            </GlassCard>
          </motion.div>
        </Grid.Col>

        {/* Progress Overview */}
        <Grid.Col span={12}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <GlassCard>
              <Stack gap="md">
                <Title order={4}>Project Progress Overview</Title>

                <SimpleGrid cols={{ base: 1, sm: 3 }}>
                  <Paper
                    p="md"
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.2)',
                    }}
                  >
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">Planning</Text>
                      <Progress value={100} color="violet" size="sm" />
                      <Text size="xs" c="dimmed">All projects started</Text>
                    </Stack>
                  </Paper>

                  <Paper
                    p="md"
                    style={{
                      background: 'rgba(6, 182, 212, 0.1)',
                      border: '1px solid rgba(6, 182, 212, 0.2)',
                    }}
                  >
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">In Progress</Text>
                      <Progress value={stats.projects > 0 ? 60 : 0} color="cyan" size="sm" />
                      <Text size="xs" c="dimmed">{stats.projects} active projects</Text>
                    </Stack>
                  </Paper>

                  <Paper
                    p="md"
                    style={{
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.2)',
                    }}
                  >
                    <Stack gap="xs">
                      <Text size="sm" c="dimmed">Completed</Text>
                      <Progress value={0} color="green" size="sm" />
                      <Text size="xs" c="dimmed">Keep going!</Text>
                    </Stack>
                  </Paper>
                </SimpleGrid>
              </Stack>
            </GlassCard>
          </motion.div>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default StudentDashboard;
