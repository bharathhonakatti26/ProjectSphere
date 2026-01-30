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
  Textarea,
  Modal,
  Badge,
  Box,
  CopyButton,
  Tooltip,
  ActionIcon,
  Menu,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IconSchool,
  IconSearch,
  IconPlus,
  IconUsers,
  IconFolder,
  IconArrowRight,
  IconCopy,
  IconCheck,
  IconDots,
  IconEdit,
  IconTrash,
  IconKey,
} from '@tabler/icons-react';
import { GlassCard, EmptyState, StatusBadge } from '../../components/common';
import { showSuccess, showApiError } from '../../components/common/notifications';
import { classroomAPI } from '../../api';

const TeacherClassrooms = () => {
  const navigate = useNavigate();
  const [opened, { open, close }] = useDisclosure(false);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      subject: '',
      description: '',
    },
    validate: {
      name: (value) => (value.length >= 3 ? null : 'Name must be at least 3 characters'),
      subject: (value) => (value.length >= 2 ? null : 'Subject is required'),
    },
  });

  useEffect(() => {
    fetchClassrooms();
  }, []);

  const fetchClassrooms = async () => {
    try {
      const response = await classroomAPI.getTeacherClassrooms();
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

  const handleCreateClassroom = async (values) => {
    setCreating(true);
    try {
      const response = await classroomAPI.create(values);
      if (response.data.success) {
        showSuccess('Classroom created successfully!');
        close();
        form.reset();
        fetchClassrooms();
      }
    } catch (error) {
      showApiError(error);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteClassroom = async (id) => {
    try {
      await classroomAPI.delete(id);
      showSuccess('Classroom deleted successfully');
      fetchClassrooms();
    } catch (error) {
      showApiError(error);
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
              Create and manage your classrooms
            </Text>
          </Stack>
          <Button
            variant="gradient"
            gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
            leftSection={<IconPlus size={16} />}
            onClick={open}
          >
            Create Classroom
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
                <GlassCard style={{ position: 'relative' }}>
                  {/* Menu */}
                  <Menu position="bottom-end" offset={5}>
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        color="gray"
                        style={{ position: 'absolute', top: 16, right: 16 }}
                      >
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown
                      style={{
                        background: 'rgba(26, 27, 30, 0.98)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                      }}
                    >
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => navigate(`/app/teacher/classrooms/${classroom._id}/edit`)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => handleDeleteClassroom(classroom._id)}
                      >
                        Delete
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>

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
                      <StatusBadge status={classroom.isArchived ? 'ARCHIVED' : 'ACTIVE'} />
                    </Group>

                    <Box>
                      <Text size="lg" fw={600}>{classroom.name}</Text>
                      <Text size="sm" c="dimmed">{classroom.subject}</Text>
                    </Box>

                    {/* Invite Code */}
                    <Paper
                      p="xs"
                      style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                      }}
                    >
                      <Group justify="space-between">
                        <Group gap="xs">
                          <IconKey size={14} />
                          <Text size="sm" fw={500} style={{ letterSpacing: '0.1em' }}>
                            {classroom.code}
                          </Text>
                        </Group>
                        <CopyButton value={classroom.code} timeout={2000}>
                          {({ copied, copy }) => (
                            <Tooltip label={copied ? 'Copied' : 'Copy code'}>
                              <ActionIcon
                                variant="subtle"
                                color={copied ? 'green' : 'gray'}
                                onClick={copy}
                                size="sm"
                              >
                                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                              </ActionIcon>
                            </Tooltip>
                          )}
                        </CopyButton>
                      </Group>
                    </Paper>

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
                      onClick={() => navigate(`/app/teacher/classrooms/${classroom._id}`)}
                    >
                      Manage Classroom
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
            description="Create your first classroom to get started"
            action={
              <Button
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                onClick={open}
              >
                Create Classroom
              </Button>
            }
          />
        </GlassCard>
      )}

      {/* Create Classroom Modal */}
      <Modal
        opened={opened}
        onClose={close}
        title="Create New Classroom"
        centered
        size="md"
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
        <form onSubmit={form.onSubmit(handleCreateClassroom)}>
          <Stack gap="md">
            <TextInput
              label="Classroom Name"
              placeholder="e.g., Web Development 101"
              {...form.getInputProps('name')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />
            <TextInput
              label="Subject"
              placeholder="e.g., Computer Science"
              {...form.getInputProps('subject')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />
            <Textarea
              label="Description"
              placeholder="Brief description of the classroom"
              rows={3}
              {...form.getInputProps('description')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />
            <Group justify="flex-end">
              <Button variant="subtle" color="gray" onClick={close}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                loading={creating}
              >
                Create Classroom
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
};

export default TeacherClassrooms;
