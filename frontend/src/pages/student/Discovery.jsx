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
  Modal,
  Textarea,
  MultiSelect,
  Avatar,
  Tooltip,
  Loader,
  Center,
  Divider,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { motion } from 'framer-motion';
import {
  IconSearch,
  IconUsers,
  IconSend,
  IconEye,
  IconMessage,
  IconRocket,
  IconUserPlus,
  IconClock,
  IconWorld,
} from '@tabler/icons-react';
import { GlassCard, EmptyState } from '../../components/common';
import { projectAPI, chatAPI } from '../../api';
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

const Discovery = () => {
  const { user } = useAuthStore();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ technologies: [], tags: [] });
  
  // Modals
  const [joinOpened, { open: openJoin, close: closeJoin }] = useDisclosure(false);
  const [viewOpened, { open: openView, close: closeView }] = useDisclosure(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [filters.technologies, filters.tags, user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.technologies.length > 0) {
        params.technologies = filters.technologies.join(',');
      }
      if (filters.tags.length > 0) {
        params.tags = filters.tags.join(',');
      }
      const response = await projectAPI.getPublicProjects(params);
      // Backend now filters out user's own projects and projects they've already joined
      const allProjects = response.data.data || [];
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestToJoin = async () => {
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      await projectAPI.requestToJoin(selectedProject._id, joinMessage);
      showSuccess('Request sent!', 'The project owner will review your request');
      closeJoin();
      setJoinMessage('');
      setSelectedProject(null);
    } catch (error) {
      showApiError(error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartChat = async (userId) => {
    try {
      const response = await chatAPI.createDirectMessage(userId);
      showSuccess('Chat started!', 'You can now message this user');
      // Navigate to chat would go here
    } catch (error) {
      showApiError(error);
    }
  };

  const openJoinModal = (project) => {
    setSelectedProject(project);
    openJoin();
  };

  const openViewModal = (project) => {
    setSelectedProject(project);
    openView();
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title?.toLowerCase().includes(search.toLowerCase()) ||
      project.shortDescription?.toLowerCase().includes(search.toLowerCase());
    return matchesSearch;
  });

  const renderProjectCard = (project, index) => (
    <Grid.Col key={project._id} span={{ base: 12, sm: 6, lg: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
        whileHover={{ scale: 1.02 }}
      >
        <GlassCard style={{ height: '100%' }}>
          <Stack gap="md" h="100%">
            {/* Header */}
            <Group justify="space-between" align="flex-start">
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
                <IconRocket size={24} />
              </Box>
              <Group gap="xs">
                <Badge 
                  variant="light" 
                  color={project.visibility === 'PUBLIC' ? 'green' : 'gray'}
                  leftSection={<IconWorld size={12} />}
                >
                  {project.visibility}
                </Badge>
              </Group>
            </Group>

            {/* Title & Description */}
            <Box style={{ flex: 1 }}>
              <Text size="lg" fw={600} mb={4}>{project.title}</Text>
              <Text size="sm" c="dimmed" lineClamp={2}>
                {project.shortDescription || project.description || 'No description'}
              </Text>
            </Box>

            {/* Creator */}
            <Group gap="xs">
              <Avatar 
                src={project.creator?.avatar} 
                size="sm" 
                radius="xl"
                color="violet"
              >
                {project.creator?.firstName?.[0]}
              </Avatar>
              <Text size="sm" c="dimmed">
                {project.creator?.firstName} {project.creator?.lastName}
              </Text>
            </Group>

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
                  {project.activeMemberCount || project.members?.length || 0} members
                </Text>
              </Group>
              <Group gap={4}>
                <IconClock size={14} color="gray" />
                <Text size="xs" c="dimmed">
                  {new Date(project.createdAt).toLocaleDateString()}
                </Text>
              </Group>
            </Group>

            {/* Actions */}
            <Group gap="xs">
              <Button
                variant="light"
                color="violet"
                size="xs"
                leftSection={<IconEye size={14} />}
                onClick={() => openViewModal(project)}
                style={{ flex: 1 }}
              >
                View
              </Button>
              <Button
                variant="filled"
                color="violet"
                size="xs"
                leftSection={<IconUserPlus size={14} />}
                onClick={() => openJoinModal(project)}
                style={{ flex: 1 }}
              >
                Join
              </Button>
            </Group>
          </Stack>
        </GlassCard>
      </motion.div>
    </Grid.Col>
  );

  return (
    <Stack gap="xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Stack gap="xs">
          <Title order={2}>Discover Projects</Title>
          <Text c="dimmed">Find projects to join and contribute to</Text>
        </Stack>
      </motion.div>

      {/* Search and Filters */}
      <Group gap="md">
        <TextInput
          placeholder="Search projects..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
          styles={{
            input: {
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
        <MultiSelect
          placeholder="Technologies"
          data={TECH_OPTIONS}
          value={filters.technologies}
          onChange={(value) => setFilters({ ...filters, technologies: value })}
          clearable
          searchable
          maxValues={5}
          w={200}
          styles={{
            input: {
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />
      </Group>

      {/* Projects Grid */}
      {loading ? (
        <Center py="xl">
          <Loader color="violet" />
        </Center>
      ) : filteredProjects.length > 0 ? (
        <Grid gutter="lg">
          {filteredProjects.map((project, index) => renderProjectCard(project, index))}
        </Grid>
      ) : (
        <EmptyState
          icon={IconSearch}
          title="No projects found"
          description="No public projects available right now. Check back later or create your own in the Projects page!"
        />
      )}

      {/* Join Request Modal */}
      <Modal
        opened={joinOpened}
        onClose={closeJoin}
        title={<Text size="lg" fw={600}>Request to Join</Text>}
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Send a join request to <strong>{selectedProject?.title}</strong>. 
            The project owner will review your request.
          </Text>

          <Textarea
            label="Message (optional)"
            placeholder="Tell them why you want to join and what skills you bring..."
            minRows={3}
            value={joinMessage}
            onChange={(e) => setJoinMessage(e.target.value)}
          />

          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeJoin}>
              Cancel
            </Button>
            <Button
              onClick={handleRequestToJoin}
              loading={submitting}
              leftSection={<IconSend size={16} />}
            >
              Send Request
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* View Project Modal */}
      <Modal
        opened={viewOpened}
        onClose={closeView}
        title={<Text size="lg" fw={600}>{selectedProject?.title}</Text>}
        size="lg"
        centered
      >
        {selectedProject && (
          <Stack gap="md">
            {/* Creator */}
            <Group gap="md">
              <Avatar 
                src={selectedProject.creator?.avatar} 
                size="lg" 
                radius="xl"
                color="violet"
              >
                {selectedProject.creator?.firstName?.[0]}
              </Avatar>
              <Box>
                <Text fw={600}>
                  {selectedProject.creator?.firstName} {selectedProject.creator?.lastName}
                </Text>
                <Text size="sm" c="dimmed">Project Creator</Text>
              </Box>
              <Button
                variant="light"
                size="xs"
                leftSection={<IconMessage size={14} />}
                onClick={() => handleStartChat(selectedProject.creator?._id)}
                ml="auto"
              >
                Message
              </Button>
            </Group>

            <Divider />

            {/* Description */}
            <Box>
              <Text size="sm" fw={600} mb="xs">Description</Text>
              <Text size="sm" c="dimmed">
                {selectedProject.description || selectedProject.shortDescription || 'No description provided'}
              </Text>
            </Box>

            {/* Technologies */}
            {selectedProject.technologies?.length > 0 && (
              <Box>
                <Text size="sm" fw={600} mb="xs">Technologies</Text>
                <Group gap={4}>
                  {selectedProject.technologies.map((tech) => (
                    <Badge key={tech} variant="light" color="cyan">
                      {tech}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}

            {/* Tags */}
            {selectedProject.tags?.length > 0 && (
              <Box>
                <Text size="sm" fw={600} mb="xs">Tags</Text>
                <Group gap={4}>
                  {selectedProject.tags.map((tag) => (
                    <Badge key={tag} variant="outline" color="violet">
                      {tag}
                    </Badge>
                  ))}
                </Group>
              </Box>
            )}

            {/* Members */}
            <Box>
              <Text size="sm" fw={600} mb="xs">
                Team Members ({selectedProject.members?.length || 0})
              </Text>
              <Group gap="xs">
                {selectedProject.members?.filter(m => m.status === 'ACTIVE').map((member) => (
                  <Tooltip key={member.user?._id} label={`${member.user?.firstName} ${member.user?.lastName}`}>
                    <Avatar 
                      src={member.user?.avatar} 
                      size="md" 
                      radius="xl"
                      color="violet"
                    >
                      {member.user?.firstName?.[0]}
                    </Avatar>
                  </Tooltip>
                ))}
              </Group>
            </Box>

            {/* Actions */}
            {(selectedProject.creator?._id || selectedProject.creator?.id) !== (user?.id || user?._id) && (
              <Group justify="flex-end" mt="md">
                <Button
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'cyan' }}
                  leftSection={<IconUserPlus size={16} />}
                  onClick={() => {
                    closeView();
                    openJoinModal(selectedProject);
                  }}
                >
                  Request to Join
                </Button>
              </Group>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default Discovery;
