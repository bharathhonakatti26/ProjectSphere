import { useEffect, useState } from 'react';
import {
  Title,
  Text,
  Stack,
  Grid,
  Paper,
  Group,
  Button,
  TextInput,
  Modal,
  Badge,
  Box,
  Tabs,
  ActionIcon,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IconSchool,
  IconSearch,
  IconPlus,
  IconUsers,
  IconFolder,
  IconArrowRight,
  IconKey,
} from '@tabler/icons-react';
import { GlassCard, EmptyState, StatusBadge } from '../../components/common';
import { showSuccess, showApiError } from '../../components/common/notifications';
import { classroomAPI } from '../../api';

const StudentClassrooms = () => {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getStudentClassrooms();
      if (response.data.success) {
        // Handle both array response and object with classrooms property
        const classroomsData = response.data.data;
        setClassrooms(Array.isArray(classroomsData) ? classroomsData : (classroomsData.classrooms || []));
      }
    } catch (error) {
      console.error('Failed to fetch classrooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClassroom = async () => {
    if (!joinCode.trim()) return;
    
    setJoining(true);
    try {
      const response = await classroomAPI.joinByCode(joinCode.trim());
      if (response.data.success) {
        showSuccess('Successfully joined classroom!');
        close();
        setJoinCode('');
        fetchClassrooms();
      }
    } catch (error) {
      showApiError(error);
    } finally {
      setJoining(false);
    }
  };

  const filteredClassrooms = classrooms.filter(
    (classroom) =>
      classroom.name?.toLowerCase().includes(search.toLowerCase()) ||
      classroom.subject?.toLowerCase().includes(search.toLowerCase())
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
            <Title order={2}>My Classrooms</Title>
            <Text c="dimmed">
              View and manage your enrolled classrooms
            </Text>
          </Stack>
          <Button
            variant="gradient"
            gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
            leftSection={<IconPlus size={16} />}
            onClick={open}
          >
            Join Classroom
          </Button>
        </Group>
      </motion.div>

      {/* Search */}
      <TextInput
        placeholder="Search classrooms..."
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

      {/* Classrooms Grid */}
      {filteredClassrooms.length > 0 ? (
        <Grid gutter="lg">
          {filteredClassrooms.map((classroom, index) => (
            <Grid.Col key={classroom._id} span={{ base: 12, sm: 6, lg: 4 }}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <GlassCard
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/app/student/classrooms/${classroom._id}`)}
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
                        <IconSchool size={24} />
                      </Box>
                      <StatusBadge status="ACTIVE" />
                    </Group>

                    <Box>
                      <Text size="lg" fw={600}>{classroom.name}</Text>
                      <Text size="sm" c="dimmed">{classroom.subject}</Text>
                    </Box>

                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {classroom.description || 'No description provided'}
                    </Text>

                    <Group gap="lg">
                      <Group gap="xs">
                        <IconUsers size={16} color="gray" />
                        <Text size="sm" c="dimmed">
                          {classroom.students?.length || 0} students
                        </Text>
                      </Group>
                      <Group gap="xs">
                        <IconFolder size={16} color="gray" />
                        <Text size="sm" c="dimmed">
                          {classroom.projects?.length || 0} projects
                        </Text>
                      </Group>
                    </Group>

                    <Button
                      variant="light"
                      color="violet"
                      rightSection={<IconArrowRight size={14} />}
                      fullWidth
                    >
                      View Classroom
                    </Button>
                  </Stack>
                </GlassCard>
              </motion.div>
            </Grid.Col>
          ))}
        </Grid>
      ) : (
        <GlassCard>
          <EmptyState
            icon="classroom"
            title="No classrooms yet"
            description="Join a classroom using the invite code from your teacher"
            action={
              <Button
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                onClick={open}
              >
                Join Classroom
              </Button>
            }
          />
        </GlassCard>
      )}

      {/* Join Classroom Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Join Classroom"
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
          <Text size="sm" c="dimmed">
            Enter the classroom invite code provided by your teacher
          </Text>
          <TextInput
            placeholder="Enter invite code"
            leftSection={<IconKey size={16} />}
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            styles={{
              input: {
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              },
            }}
          />
          <Group justify="flex-end">
            <Button variant="subtle" color="gray" onClick={close}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
              loading={joining}
              onClick={handleJoinClassroom}
              disabled={!joinCode.trim()}
            >
              Join
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default StudentClassrooms;
