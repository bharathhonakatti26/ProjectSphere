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
  Avatar,
  Loader,
  Center,
  Tooltip,
  Paper,
  Divider,
} from '@mantine/core';
import { motion } from 'framer-motion';
import {
  IconSearch,
  IconUsersGroup,
  IconFolder,
  IconCrown,
} from '@tabler/icons-react';
import { GlassCard, EmptyState, StatusBadge } from '../../components/common';
import { teamAPI } from '../../api';
import { showApiError } from '../../components/common/notifications';
import { useAuthStore } from '../../store/authStore';

const TeacherTeams = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getMyTeams();
      if (response.data.success) {
        const teamsData = response.data.data.teams || response.data.data || [];
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTeams = teams.filter((team) => {
    const searchLower = search.toLowerCase();
    return (
      team.name?.toLowerCase().includes(searchLower) ||
      team.description?.toLowerCase().includes(searchLower) ||
      team.classroom?.name?.toLowerCase().includes(searchLower)
    );
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
            <Title order={1}>Teams</Title>
            <Text c="dimmed" mt="xs">
              View and manage all teams across your classrooms
            </Text>
          </Box>
          <Badge size="xl" variant="light" color="violet">
            {teams.length} {teams.length === 1 ? 'Team' : 'Teams'}
          </Badge>
        </Group>
      </motion.div>

      {/* Search */}
      <GlassCard>
        <TextInput
          placeholder="Search teams by name, description, or classroom..."
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

      {/* Teams Grid */}
      {filteredTeams.length > 0 ? (
        <Grid gutter="lg">
          {filteredTeams.map((team) => (
            <Grid.Col key={team._id} span={{ base: 12, sm: 6, lg: 4 }}>
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
                  <Stack gap="md">
                    {/* Header */}
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
                          <Text fw={600}>{team.name}</Text>
                          <Text size="xs" c="dimmed">
                            {team.members?.length || 0} members
                          </Text>
                        </Box>
                      </Group>
                      <StatusBadge status={team.status || 'ACTIVE'} />
                    </Group>

                    {/* Description */}
                    {team.description && (
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {team.description}
                      </Text>
                    )}

                    <Divider />

                    {/* Classroom */}
                    {team.classroom && (
                      <Group gap="xs">
                        <IconFolder size={14} />
                        <Text size="sm">{team.classroom.name}</Text>
                      </Group>
                    )}

                    {/* Members Avatars */}
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">Members:</Text>
                      <Group gap={4}>
                        {team.members?.slice(0, 5).map((member, idx) => {
                          const memberUser = member.user || member;
                          const isLeader = team.leader?._id === memberUser._id || 
                                          team.leader === memberUser._id;
                          return (
                            <Tooltip
                              key={idx}
                              label={
                                memberUser.firstName
                                  ? `${memberUser.firstName} ${memberUser.lastName}${isLeader ? ' (Leader)' : ''}`
                                  : 'Member'
                              }
                            >
                              <Avatar size="sm" radius="xl" color={isLeader ? 'yellow' : 'violet'}>
                                {isLeader && <IconCrown size={12} />}
                                {!isLeader && (memberUser.firstName?.[0] || 'M')}
                              </Avatar>
                            </Tooltip>
                          );
                        })}
                        {(team.members?.length || 0) > 5 && (
                          <Avatar size="sm" radius="xl" color="gray">
                            +{team.members.length - 5}
                          </Avatar>
                        )}
                      </Group>
                    </Group>

                    {/* Project */}
                    {team.project && (
                      <>
                        <Divider />
                        <Paper
                          p="xs"
                          style={{
                            background: 'rgba(6, 182, 212, 0.1)',
                            border: '1px solid rgba(6, 182, 212, 0.2)',
                          }}
                        >
                          <Group gap="xs">
                            <IconFolder size={14} />
                            <Text size="sm" fw={500}>
                              {team.project.title || 'Project'}
                            </Text>
                          </Group>
                        </Paper>
                      </>
                    )}
                  </Stack>
                </Paper>
              </motion.div>
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <GlassCard>
          <EmptyState
            icon="team"
            title={search ? 'No teams found' : 'No teams yet'}
            description={
              search
                ? 'Try adjusting your search criteria'
                : 'Teams from your classrooms will appear here'
            }
          />
        </GlassCard>
      )}
    </Stack>
  );
};

export default TeacherTeams;
