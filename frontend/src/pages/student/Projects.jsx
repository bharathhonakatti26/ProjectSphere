import { useEffect, useState } from 'react';
import {
  Title,
  Text,
  Stack,
  Grid,
  Group,
  Button,
  TextInput,
  Badge,
  Box,
  Progress,
  Modal,
  Textarea,
  Select,
  MultiSelect,
  Tabs,
  Loader,
  Center,
  Avatar,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { useDisclosure } from '@mantine/hooks';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IconFolder,
  IconSearch,
  IconArrowRight,
  IconCalendar,
  IconPlus,
  IconRocket,
  IconUsers,
  IconWorld,
  IconLock,
  IconUserPlus,
  IconCheck,
  IconX,
  IconClock,
  IconSchool,
  IconBulb,
} from '@tabler/icons-react';
import { GlassCard, EmptyState, StatusBadge } from '../../components/common';
import api, { projectAPI } from '../../api';
import { showSuccess, showApiError } from '../../components/common/notifications';
import { useAuthStore } from '../../store/authStore';

const TECH_OPTIONS = [
  'React', 'Vue', 'Angular', 'Node.js', 'Python', 'Java', 'C++', 'Go',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Firebase', 'AWS', 'Docker', 'Kubernetes',
  'Machine Learning', 'AI', 'Blockchain', 'IoT', 'Mobile', 'Web', 'DevOps',
];

const TAG_OPTIONS = [
  'Open Source', 'Hackathon', 'Research', 'Academic', 'Startup', 'Social Good',
  'Education', 'Healthcare', 'Finance', 'Entertainment', 'Productivity',
];

const StudentProjects = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('personal');
  const [projects, setProjects] = useState([]);
  const [classroomProjects, setClassroomProjects] = useState([]);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Modals
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);

  // Form for creating project
  const createForm = useForm({
    initialValues: {
      title: '',
      shortDescription: '',
      description: '',
      technologies: [],
      tags: [],
      visibility: 'PUBLIC',
    },
    validate: {
      title: (value) => (value.length >= 3 ? null : 'Title must be at least 3 characters'),
      shortDescription: (value) => (value.length >= 10 ? null : 'Please provide a short description'),
    },
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all user projects first
      const response = await projectAPI.getMyProjects();
      console.log('API Response:', response.data);
      
      // Handle different response formats
      let allProjects = [];
      if (Array.isArray(response.data.data)) {
        allProjects = response.data.data;
      } else if (response.data.data?.projects) {
        allProjects = response.data.data.projects;
      } else if (Array.isArray(response.data)) {
        allProjects = response.data;
      }
      
      console.log('All Projects:', allProjects);
      
      if (activeTab === 'personal') {
        // Filter to only show personal/student-initiated projects (not classroom-based)
        // A personal project is one that is NOT classroom-based
        const personalProjects = allProjects.filter(p => 
          p.type !== 'CLASSROOM_BASED' && !p.classroom
        );
        console.log('Personal Projects:', personalProjects);
        setProjects(personalProjects);
      } else if (activeTab === 'classroom') {
        // Filter to only show classroom projects
        const classProjects = allProjects.filter(p => 
          p.type === 'CLASSROOM_BASED' || p.classroom
        );
        setClassroomProjects(classProjects);
      } else if (activeTab === 'requests') {
        // Fetch projects where user is admin to see join requests
        const userId = user?.id || user?._id;
        const adminProjects = allProjects.filter(p => {
          const creatorId = p.creator?._id || p.creator?.id;
          return creatorId === userId || 
            p.members?.some(m => (m.user?._id || m.user?.id) === userId && m.role === 'ADMIN');
        });
        
        // Fetch join requests for each admin project
        const allRequests = [];
        for (const project of adminProjects) {
          try {
            const reqResponse = await projectAPI.getJoinRequests(project._id);
            if (reqResponse.data.data?.requests) {
              allRequests.push(...reqResponse.data.data.requests.map(r => ({
                ...r,
                project,
              })));
            }
          } catch (err) {
            console.error('Failed to fetch requests for project:', project._id);
          }
        }
        setJoinRequests(allRequests);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (values) => {
    setSubmitting(true);
    try {
      await projectAPI.create({
        ...values,
        type: 'STUDENT_INITIATED',
      });
      showSuccess('Project created!', 'Your project is now live');
      closeCreate();
      createForm.reset();
      fetchData();
    } catch (error) {
      showApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessRequest = async (projectId, requestId, status) => {
    try {
      await projectAPI.processJoinRequest(projectId, requestId, status);
      showSuccess(
        status === 'APPROVED' ? 'Member added!' : 'Request declined',
        status === 'APPROVED' ? 'The user has been added to your project' : 'The request has been declined'
      );
      fetchData();
    } catch (error) {
      showApiError(error);
    }
  };

  const filteredProjects = projects.filter(
    (project) => project.title?.toLowerCase().includes(search.toLowerCase())
  );

  const getProgress = (project) => {
    const milestones = project.timeline?.milestones || project.milestones || [];
    if (milestones.length === 0) return 0;
    const completed = milestones.filter((m) => m.isCompleted || m.status === 'COMPLETED').length;
    return Math.round((completed / milestones.length) * 100);
  };

  const renderJoinRequestCard = (request, index) => (
    <motion.div
      key={request._id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <GlassCard mb="md">
        <Group justify="space-between" wrap="nowrap">
          <Group gap="md">
            <Avatar 
              src={request.user?.avatar} 
              size="lg" 
              radius="xl"
              color="violet"
            >
              {request.user?.firstName?.[0]}
            </Avatar>
            <Box>
              <Text fw={600}>
                {request.user?.firstName} {request.user?.lastName}
              </Text>
              <Text size="sm" c="dimmed">
                Wants to join <strong>{request.project?.title}</strong>
              </Text>
              {request.message && (
                <Text size="sm" c="dimmed" mt={4} style={{ fontStyle: 'italic' }}>
                  "{request.message}"
                </Text>
              )}
              <Text size="xs" c="dimmed" mt={4}>
                <IconClock size={12} style={{ display: 'inline', marginRight: 4 }} />
                {new Date(request.requestedAt).toLocaleDateString()}
              </Text>
            </Box>
          </Group>
          <Group gap="xs">
            <Tooltip label="Accept">
              <ActionIcon
                variant="filled"
                color="green"
                size="lg"
                onClick={() => handleProcessRequest(request.project?._id, request._id, 'APPROVED')}
              >
                <IconCheck size={18} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Decline">
              <ActionIcon
                variant="filled"
                color="red"
                size="lg"
                onClick={() => handleProcessRequest(request.project?._id, request._id, 'REJECTED')}
              >
                <IconX size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </GlassCard>
    </motion.div>
  );

  return (
    <Stack gap="xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Title order={2}>My Projects</Title>
            <Text c="dimmed">Create and manage your projects</Text>
          </Stack>
          <Button
            leftSection={<IconPlus size={18} />}
            variant="gradient"
            gradient={{ from: 'violet', to: 'cyan' }}
            onClick={openCreate}
          >
            Create Project
          </Button>
        </Group>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="personal" leftSection={<IconBulb size={16} />}>
            Personal Projects
          </Tabs.Tab>
          <Tabs.Tab value="classroom" leftSection={<IconSchool size={16} />}>
            Classroom Projects
          </Tabs.Tab>
          <Tabs.Tab value="requests" leftSection={<IconUserPlus size={16} />}>
            Join Requests
            {joinRequests.length > 0 && (
              <Badge size="xs" color="red" ml={8}>
                {joinRequests.length}
              </Badge>
            )}
          </Tabs.Tab>
        </Tabs.List>

        {/* Personal Projects Tab */}
        <Tabs.Panel value="personal" pt="xl">
          {/* Search */}
          <TextInput
            placeholder="Search projects..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            mb="xl"
            styles={{
              input: {
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            }}
          />

          {loading ? (
            <Center py="xl">
              <Loader color="violet" />
            </Center>
          ) : filteredProjects.length > 0 ? (
            <Grid gutter="lg">
              {filteredProjects.map((project, index) => (
                <Grid.Col key={project._id} span={{ base: 12, sm: 6, lg: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <GlassCard style={{ height: '100%' }}>
                      <Stack gap="md" h="100%">
                        <Group justify="space-between">
                          <Box
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 12,
                              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <IconFolder size={24} />
                          </Box>
                          <Group gap="xs">
                            <Badge 
                              variant="light" 
                              color={project.visibility === 'PUBLIC' ? 'green' : 'gray'}
                              size="xs"
                            >
                              {project.visibility === 'PUBLIC' ? <IconWorld size={10} /> : <IconLock size={10} />}
                              {' '}{project.visibility || 'PRIVATE'}
                            </Badge>
                            <StatusBadge status={project.status || 'PLANNING'} />
                          </Group>
                        </Group>

                        <Box style={{ flex: 1 }}>
                          <Text size="lg" fw={600}>{project.title}</Text>
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {project.shortDescription || project.description || 'No description'}
                          </Text>
                        </Box>

                        {/* Technologies */}
                        {project.technologies?.length > 0 && (
                          <Group gap={4}>
                            {project.technologies.slice(0, 3).map((tech) => (
                              <Badge key={tech} size="xs" variant="outline" color="cyan">
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

                        {/* Stats */}
                        <Group gap="lg">
                          <Group gap={4}>
                            <IconUsers size={14} color="gray" />
                            <Text size="xs" c="dimmed">
                              {project.members?.filter(m => m.status === 'ACTIVE').length || 0} members
                            </Text>
                          </Group>
                          {(project.creator?._id || project.creator?.id) === (user?.id || user?._id) && (
                            <Badge size="xs" color="violet">Owner</Badge>
                          )}
                        </Group>

                        {/* Progress */}
                        <Box>
                          <Group justify="space-between" mb="xs">
                            <Text size="sm" c="dimmed">Progress</Text>
                            <Text size="sm" fw={500}>{getProgress(project)}%</Text>
                          </Group>
                          <Progress
                            value={getProgress(project)}
                            color="violet"
                            size="sm"
                            radius="xl"
                          />
                        </Box>

                        <Button
                          variant="light"
                          color="violet"
                          rightSection={<IconArrowRight size={14} />}
                          fullWidth
                          onClick={() => navigate(`/app/student/projects/${project._id}`)}
                        >
                          View Project
                        </Button>
                      </Stack>
                    </GlassCard>
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <EmptyState
              icon={IconBulb}
              title="No personal projects yet"
              description="Create your first project and start building something amazing"
              action={
                <Button onClick={openCreate} leftSection={<IconPlus size={16} />}>
                  Create Project
                </Button>
              }
            />
          )}
        </Tabs.Panel>

        {/* Classroom Projects Tab */}
        <Tabs.Panel value="classroom" pt="xl">
          {/* Search */}
          <TextInput
            placeholder="Search classroom projects..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            mb="xl"
            styles={{
              input: {
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              },
            }}
          />

          {loading ? (
            <Center py="xl">
              <Loader color="violet" />
            </Center>
          ) : classroomProjects.filter(p => p.title?.toLowerCase().includes(search.toLowerCase())).length > 0 ? (
            <Grid gutter="lg">
              {classroomProjects.filter(p => p.title?.toLowerCase().includes(search.toLowerCase())).map((project, index) => (
                <Grid.Col key={project._id} span={{ base: 12, sm: 6, lg: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <GlassCard style={{ height: '100%' }}>
                      <Stack gap="md" h="100%">
                        <Group justify="space-between">
                          <Box
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 12,
                              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(16, 185, 129, 0.3))',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <IconSchool size={24} />
                          </Box>
                          <Group gap="xs">
                            <Badge variant="light" color="blue" size="xs">
                              Classroom
                            </Badge>
                            <StatusBadge status={project.status || 'PLANNING'} />
                          </Group>
                        </Group>

                        <Box style={{ flex: 1 }}>
                          <Text size="lg" fw={600}>{project.title}</Text>
                          <Text size="sm" c="dimmed" lineClamp={1}>
                            {project.classroom?.name || 'Classroom Project'}
                          </Text>
                          <Text size="sm" c="dimmed" lineClamp={2}>
                            {project.shortDescription || project.description || 'No description'}
                          </Text>
                        </Box>

                        {/* Team */}
                        {project.team && (
                          <Group gap={4}>
                            <IconUsers size={14} color="gray" />
                            <Text size="xs" c="dimmed">
                              Team: {project.team?.name || 'Unknown'}
                            </Text>
                          </Group>
                        )}

                        {/* Progress */}
                        <Box>
                          <Group justify="space-between" mb="xs">
                            <Text size="sm" c="dimmed">Progress</Text>
                            <Text size="sm" fw={500}>{getProgress(project)}%</Text>
                          </Group>
                          <Progress
                            value={getProgress(project)}
                            color="blue"
                            size="sm"
                            radius="xl"
                          />
                        </Box>

                        <Button
                          variant="light"
                          color="blue"
                          rightSection={<IconArrowRight size={14} />}
                          fullWidth
                          onClick={() => navigate(`/app/student/projects/${project._id}`)}
                        >
                          View Project
                        </Button>
                      </Stack>
                    </GlassCard>
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>
          ) : (
            <EmptyState
              icon={IconSchool}
              title="No classroom projects"
              description="Projects assigned by teachers in your classrooms will appear here"
            />
          )}
        </Tabs.Panel>

        {/* Join Requests Tab */}
        <Tabs.Panel value="requests" pt="xl">
          {loading ? (
            <Center py="xl">
              <Loader color="violet" />
            </Center>
          ) : joinRequests.length > 0 ? (
            <Box>
              {joinRequests.map((request, index) => renderJoinRequestCard(request, index))}
            </Box>
          ) : (
            <EmptyState
              icon={IconUserPlus}
              title="No pending requests"
              description="When someone wants to join your project, their request will appear here"
            />
          )}
        </Tabs.Panel>
      </Tabs>

      {/* Create Project Modal */}
      <Modal
        opened={createOpened}
        onClose={closeCreate}
        title={<Text size="lg" fw={600}>Create New Project</Text>}
        size="lg"
        centered
      >
        <form onSubmit={createForm.onSubmit(handleCreateProject)}>
          <Stack gap="md">
            <TextInput
              label="Project Title"
              placeholder="My Awesome Project"
              required
              {...createForm.getInputProps('title')}
            />

            <Textarea
              label="Short Description"
              placeholder="A brief summary of your project (displayed in cards)"
              required
              minRows={2}
              {...createForm.getInputProps('shortDescription')}
            />

            <Textarea
              label="Full Description"
              placeholder="Detailed description of your project, goals, and what you're looking for in teammates..."
              minRows={4}
              {...createForm.getInputProps('description')}
            />

            <MultiSelect
              label="Technologies"
              placeholder="Select technologies used"
              data={TECH_OPTIONS}
              searchable
              clearable
              {...createForm.getInputProps('technologies')}
            />

            <MultiSelect
              label="Tags"
              placeholder="Add relevant tags"
              data={TAG_OPTIONS}
              searchable
              clearable
              {...createForm.getInputProps('tags')}
            />

            <Select
              label="Visibility"
              description="Public projects can be discovered by other students"
              data={[
                { value: 'PUBLIC', label: 'Public - Anyone can discover and request to join' },
                { value: 'CLASS_ONLY', label: 'Class Only - Only classmates can see' },
                { value: 'PRIVATE', label: 'Private - Invite only' },
              ]}
              {...createForm.getInputProps('visibility')}
            />

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={closeCreate}>
                Cancel
              </Button>
              <Button
                type="submit"
                loading={submitting}
                leftSection={<IconRocket size={16} />}
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan' }}
              >
                Create Project
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
};

export default StudentProjects;
