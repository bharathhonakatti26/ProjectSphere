import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Title,
  Text,
  Stack,
  Grid,
  Group,
  TextInput,
  Badge,
  Box,
  Loader,
  Center,
  Tabs,
  Paper,
} from '@mantine/core';
import { motion } from 'framer-motion';
import {
  IconSearch,
  IconFolder,
  IconSchool,
  IconBulb,
} from '@tabler/icons-react';
import { GlassCard, EmptyState, StatusBadge } from '../../components/common';
import { projectAPI } from '../../api';
import { showApiError } from '../../components/common/notifications';

const TeacherProjects = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await projectAPI.getMyProjects();
      if (response.data.success) {
        const projectsData = response.data.data?.projects || response.data.data || [];
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      project.title?.toLowerCase().includes(searchLower) ||
      project.description?.toLowerCase().includes(searchLower) ||
      project.classroom?.name?.toLowerCase().includes(searchLower);

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'classroom') {
      return matchesSearch && (project.type === 'CLASSROOM_BASED' || project.classroom);
    }
    if (activeTab === 'mentoring') {
      return matchesSearch && project.mentors?.some(m => m.user?._id || m.user);
    }
    return matchesSearch;
  });

  if (loading) {
    return (
      <Center style={{ height: '50vh' }}>
        <Loader color="violet" size="lg" />
      </Center>
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
          <Box>
            <Title order={1}>Projects</Title>
            <Text c="dimmed" mt="xs">
              View and manage projects across your classrooms
            </Text>
          </Box>
          <Badge size="xl" variant="light" color="violet">
            {projects.length} {projects.length === 1 ? 'Project' : 'Projects'}
          </Badge>
        </Group>
      </motion.div>

      {/* Search */}
      <GlassCard>
        <TextInput
          placeholder="Search projects by title, description, or classroom..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="md"
          styles={{
            input: {
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
      </GlassCard>

      {/* Tabs */}
      <GlassCard>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List mb="xl">
            <Tabs.Tab value="all" leftSection={<IconFolder size={16} />}>
              All Projects ({projects.length})
            </Tabs.Tab>
            <Tabs.Tab value="classroom" leftSection={<IconSchool size={16} />}>
              Classroom Projects ({projects.filter(p => p.type === 'CLASSROOM_BASED' || p.classroom).length})
            </Tabs.Tab>
            <Tabs.Tab value="mentoring" leftSection={<IconBulb size={16} />}>
              Mentoring ({projects.filter(p => p.mentors?.some(m => m.user)).length})
            </Tabs.Tab>
          </Tabs.List>

          {['all', 'classroom', 'mentoring'].map((tab) => (
            <Tabs.Panel key={tab} value={tab}>
              {filteredProjects.length > 0 ? (
                <Grid gutter="lg">
                  {filteredProjects.map((project) => (
                    <Grid.Col key={project._id} span={{ base: 12, md: 6, lg: 4 }}>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Paper
                          p="lg"
                          style={{
                            background: 'rgba(255, 255, 255, 0.03)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            height: '100%',
                          }}
                          onClick={() => navigate(`/app/teacher/projects/${project._id}`)}
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
                          <Stack gap="md">
                            {/* Header */}
                            <Group justify="space-between" align="flex-start">
                              <Box style={{ flex: 1 }}>
                                <Text fw={600} lineClamp={1}>
                                  {project.title}
                                </Text>
                                {project.classroom && (
                                  <Text size="xs" c="dimmed">
                                    {project.classroom.name}
                                  </Text>
                                )}
                              </Box>
                              <StatusBadge status={project.status || 'PLANNING'} />
                            </Group>

                            {/* Description */}
                            <Text size="sm" c="dimmed" lineClamp={3}>
                              {project.description || project.shortDescription || 'No description'}
                            </Text>

                            {/* Technologies */}
                            {project.technologies && project.technologies.length > 0 && (
                              <Group gap={4}>
                                {project.technologies.slice(0, 3).map((tech, idx) => (
                                  <Badge key={idx} size="xs" variant="outline" color="cyan">
                                    {tech}
                                  </Badge>
                                ))}
                                {project.technologies.length > 3 && (
                                  <Badge size="xs" variant="outline" color="gray">
                                    +{project.technologies.length - 3}
                                  </Badge>
                                )}
                              </Group>
                            )}

                            {/* Team Info */}
                            {project.team && (
                              <Paper
                                p="xs"
                                style={{
                                  background: 'rgba(6, 182, 212, 0.1)',
                                  border: '1px solid rgba(6, 182, 212, 0.2)',
                                }}
                              >
                                <Text size="xs" fw={500}>
                                  Team: {project.team.name || 'Team Project'}
                                </Text>
                              </Paper>
                            )}

                            {/* Stats */}
                            <Group gap="xl">
                              <Box>
                                <Text size="xs" c="dimmed">Members</Text>
                                <Text size="sm" fw={500}>
                                  {project.members?.length || 0}
                                </Text>
                              </Box>
                              {project.mentors && project.mentors.length > 0 && (
                                <Box>
                                  <Text size="xs" c="dimmed">Mentors</Text>
                                  <Text size="sm" fw={500}>
                                    {project.mentors.length}
                                  </Text>
                                </Box>
                              )}
                            </Group>
                          </Stack>
                        </Paper>
                      </motion.div>
                    </Grid.Col>
                  ))}
                </Grid>
              ) : (
                <EmptyState
                  icon="project"
                  title={search ? 'No projects found' : 'No projects yet'}
                  description={
                    search
                      ? 'Try adjusting your search criteria'
                      : 'Projects from your classrooms will appear here'
                  }
                />
              )}
            </Tabs.Panel>
          ))}
        </Tabs>
      </GlassCard>
    </Stack>
  );
};

export default TeacherProjects;
