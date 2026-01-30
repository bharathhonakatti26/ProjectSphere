import { useEffect, useState } from 'react';
import {
  Title,
  Text,
  Stack,
  Grid,
  Group,
  Button,
  TextInput,
  Modal,
  Badge,
  Box,
  Avatar,
  AvatarGroup,
  Tabs,
  Loader,
  Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IconUsers,
  IconSearch,
  IconPlus,
  IconArrowRight,
  IconFolder,
  IconSchool,
} from '@tabler/icons-react';
import { GlassCard, EmptyState, StatusBadge, UserAvatar } from '../../components/common';
import { showSuccess, showApiError } from '../../components/common/notifications';
import { teamAPI, projectAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';

const StudentTeams = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [classroomTeams, setClassroomTeams] = useState([]);
  const [projectTeams, setProjectTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('projects');

  useEffect(() => {
    fetchAllTeams();
  }, []);

  const fetchAllTeams = async () => {
    setLoading(true);
    try {
      // Fetch both classroom teams and projects user is member of
      const [teamsRes, projectsRes] = await Promise.all([
        teamAPI.getMyTeams().catch(() => ({ data: { success: true, data: { teams: [] } } })),
        projectAPI.getMyProjects().catch(() => ({ data: { success: true, data: [] } } )),
      ]);

      if (teamsRes.data.success) {
        setClassroomTeams(teamsRes.data.data.teams || teamsRes.data.data || []);
      }

      if (projectsRes.data.success) {
        // Get projects where user is a member (these act as teams for collaboration)
        const projects = projectsRes.data.data || [];
        console.log('Fetched projects:', projects);
        setProjectTeams(projects);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredClassroomTeams = classroomTeams.filter(
    (team) => team.name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProjectTeams = projectTeams.filter(
    (project) => project.title?.toLowerCase().includes(search.toLowerCase())
  );

  const renderClassroomTeamCard = (team, index) => (
    <Grid.Col key={team._id} span={{ base: 12, sm: 6, lg: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ scale: 1.02 }}
      >
        <GlassCard
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/app/student/teams/${team._id}`)}
        >
          <Stack gap="md">
            <Group justify="space-between">
              <Box
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconSchool size={24} />
              </Box>
              <StatusBadge status={team.status || 'ACTIVE'} />
            </Group>

            <Box>
              <Text size="lg" fw={600}>{team.name}</Text>
              <Text size="sm" c="dimmed">{team.classroom?.name || 'Classroom Team'}</Text>
            </Box>

            <Group gap="xs">
              <AvatarGroup>
                {team.members?.slice(0, 4).map((member) => (
                  <UserAvatar
                    key={member._id || member.user?._id}
                    user={member.user || member}
                    size="sm"
                    showTooltip
                  />
                ))}
              </AvatarGroup>
              {team.members?.length > 4 && (
                <Text size="sm" c="dimmed">
                  +{team.members.length - 4} more
                </Text>
              )}
            </Group>

            <Button
              variant="light"
              color="cyan"
              rightSection={<IconArrowRight size={14} />}
              fullWidth
            >
              View Team
            </Button>
          </Stack>
        </GlassCard>
      </motion.div>
    </Grid.Col>
  );

  const renderProjectTeamCard = (project, index) => {
    const activeMembers = project.members?.filter(m => m.status === 'ACTIVE') || [];
    
    return (
      <Grid.Col key={project._id} span={{ base: 12, sm: 6, lg: 4 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          whileHover={{ scale: 1.02 }}
        >
          <GlassCard
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/app/student/projects/${project._id}`)}
          >
            <Stack gap="md">
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
                  <Badge variant="light" color={project.visibility === 'PUBLIC' ? 'green' : 'gray'}>
                    {project.visibility}
                  </Badge>
                  <StatusBadge status={project.status || 'PLANNING'} />
                </Group>
              </Group>

              <Box>
                <Text size="lg" fw={600}>{project.title}</Text>
                <Text size="sm" c="dimmed" lineClamp={1}>
                  {project.shortDescription || project.description || 'Project Team'}
                </Text>
              </Box>

              <Group gap="xs">
                <AvatarGroup>
                  {activeMembers.slice(0, 4).map((member) => (
                    <UserAvatar
                      key={member._id || member.user?._id}
                      user={member.user || member}
                      size="sm"
                      showTooltip
                    />
                  ))}
                </AvatarGroup>
                {activeMembers.length > 4 && (
                  <Text size="sm" c="dimmed">
                    +{activeMembers.length - 4} more
                  </Text>
                )}
              </Group>

              <Button
                variant="light"
                color="violet"
                rightSection={<IconArrowRight size={14} />}
                fullWidth
              >
                View Project Team
              </Button>
            </Stack>
          </GlassCard>
        </motion.div>
      </Grid.Col>
    );
  };

  if (loading) {
    return (
      <Center h={400}>
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
          <Stack gap="xs">
            <Title order={2}>My Teams</Title>
            <Text c="dimmed">View your project and classroom teams</Text>
          </Stack>
        </Group>
      </motion.div>

      {/* Search */}
      <TextInput
        placeholder="Search teams..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        styles={{
          input: {
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />

      {/* Tabs */}
      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>
          <Tabs.Tab value="projects" leftSection={<IconFolder size={16} />}>
            Project Teams ({filteredProjectTeams.length})
          </Tabs.Tab>
          <Tabs.Tab value="classrooms" leftSection={<IconSchool size={16} />}>
            Classroom Teams ({filteredClassroomTeams.length})
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="projects" pt="lg">
          {filteredProjectTeams.length > 0 ? (
            <Grid gutter="lg">
              {filteredProjectTeams.map((project, index) => renderProjectTeamCard(project, index))}
            </Grid>
          ) : (
            <GlassCard>
              <EmptyState
                icon={IconFolder}
                title="No project teams yet"
                description="Join a public project from the Discovery page or create your own project to collaborate with others!"
              />
            </GlassCard>
          )}
        </Tabs.Panel>

        <Tabs.Panel value="classrooms" pt="lg">
          {filteredClassroomTeams.length > 0 ? (
            <Grid gutter="lg">
              {filteredClassroomTeams.map((team, index) => renderClassroomTeamCard(team, index))}
            </Grid>
          ) : (
            <GlassCard>
              <EmptyState
                icon={IconSchool}
                title="No classroom teams yet"
                description="You'll see your classroom teams here once you join a classroom and get assigned to a team"
              />
            </GlassCard>
          )}
        </Tabs.Panel>
      </Tabs>
    </Stack>
  );
};

export default StudentTeams;
