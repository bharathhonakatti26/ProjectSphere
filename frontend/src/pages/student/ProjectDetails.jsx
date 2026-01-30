import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Title,
  Text,
  Stack,
  Group,
  Badge,
  Box,
  Grid,
  Tabs,
  TextInput,
  Textarea,
  Button,
  ActionIcon,
  ScrollArea,
  Loader,
  Center,
  Paper,
  Modal,
  Select,
  TagsInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { motion } from 'framer-motion';
import {
  IconArrowLeft,
  IconSend,
  IconMessage,
  IconFolder,
  IconCrown,
  IconDoorExit,
  IconSettings,
  IconTrash,
  IconEdit,
  IconUserMinus,
} from '@tabler/icons-react';
import { GlassCard, UserAvatar, StatusBadge } from '../../components/common';
import { showSuccess, showApiError } from '../../components/common/notifications';
import { projectAPI, chatAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chat');
  
  // Chat state - use Zustand store for real-time
  const [chatRoom, setChatRoom] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const chatRoomRef = useRef(null); // Track current chat room for cleanup

  // Get socket functions from chat store
  const { 
    isConnected, 
    connect, 
    joinRoom, 
    leaveRoom, 
    sendMessage: socketSendMessage,
    messages,
    setMessages,
    clearMessages,
    setActiveRoom,
  } = useChatStore();

  // Edit modal state
  const [editModalOpened, { open: openEditModal, close: closeEditModal }] = useDisclosure(false);
  const [editForm, setEditForm] = useState({
    title: '',
    shortDescription: '',
    description: '',
    tags: [],
    technologies: [],
    visibility: 'PUBLIC',
    status: 'PLANNING',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  // Connect to socket when component mounts
  useEffect(() => {
    // Connect only once
    connect();
    
    return () => {
      // Leave room and clear messages when unmounting
      if (chatRoomRef.current?._id) {
        leaveRoom(chatRoomRef.current._id);
        setActiveRoom(null);
        clearMessages();
      }
    };
  }, []);

  // Join chat room when it's available and set as active room
  useEffect(() => {
    if (chatRoom?._id && isConnected) {
      chatRoomRef.current = chatRoom; // Store ref for cleanup
      setActiveRoom(chatRoom); // Important: set active room so socket updates work
      joinRoom(chatRoom._id);
      
      return () => {
        // Leave previous room when changing rooms
        leaveRoom(chatRoom._id);
      };
    }
  }, [chatRoom?._id, isConnected]);

  useEffect(() => {
    if (project && activeTab === 'chat') {
      fetchProjectChat();
    }
  }, [project, activeTab]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchProject = async () => {
    try {
      const response = await projectAPI.getById(projectId);
      console.log('Project response:', response.data);
      if (response.data.success) {
        const projectData = response.data.data.project || response.data.data;
        console.log('Project data:', projectData);
        setProject(projectData);
        // Initialize edit form
        setEditForm({
          title: projectData.title || '',
          shortDescription: projectData.shortDescription || '',
          description: projectData.description || '',
          tags: projectData.tags || [],
          technologies: projectData.technologies || [],
          visibility: projectData.visibility || 'PUBLIC',
          status: projectData.status || 'PLANNING',
        });
      }
    } catch (error) {
      console.error('Failed to fetch project:', error);
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectChat = async () => {
    try {
      const response = await chatAPI.getProjectChat(projectId);
      if (response.data.success) {
        const room = response.data.data.room;
        setChatRoom(room);
        if (room?._id) {
          fetchMessages(room._id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch project chat:', error);
    }
  };

  const fetchMessages = async (roomId) => {
    setLoadingMessages(true);
    try {
      const response = await chatAPI.getMessages(roomId, { limit: 100 });
      if (response.data.success) {
        // Paginated response returns data directly as array - DON'T reverse, API already returns in correct order
        const messagesData = response.data.data || [];
        // Set messages in chat store (messages come oldest first from API after reverse in controller)
        setMessages(Array.isArray(messagesData) ? messagesData : []);
        // Scroll to bottom after messages load
        setTimeout(() => scrollToBottom(), 150);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoom?._id || sendingMessage || !isConnected) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX
    setSendingMessage(true);
    
    try {
      // Use socket to send message for real-time delivery
      socketSendMessage(chatRoom._id, messageContent);
      // Scroll to bottom after sending
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      showApiError(error);
      setNewMessage(messageContent); // Restore message if failed
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLeaveProject = async () => {
    if (!confirm('Are you sure you want to leave this project?')) return;
    
    try {
      await projectAPI.leave(projectId);
      showSuccess('Left project successfully');
      navigate('/app/student/teams');
    } catch (error) {
      showApiError(error);
    }
  };

  const handleSaveProject = async () => {
    setSaving(true);
    try {
      const response = await projectAPI.update(projectId, editForm);
      if (response.data.success) {
        showSuccess('Project updated successfully');
        setProject(prev => ({ ...prev, ...editForm }));
        closeEditModal();
      }
    } catch (error) {
      console.error('Failed to update project:', error);
      showApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member from the project?')) return;
    
    try {
      await projectAPI.removeMember(projectId, memberId);
      showSuccess('Member removed successfully');
      // Refresh project data
      fetchProject();
    } catch (error) {
      console.error('Failed to remove member:', error);
      showApiError(error);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return;
    
    try {
      await projectAPI.delete(projectId);
      showSuccess('Project deleted successfully');
      navigate('/app/student/projects');
    } catch (error) {
      console.error('Failed to delete project:', error);
      showApiError(error);
    }
  };

  if (loading) {
    return (
      <Center h={400}>
        <Loader color="violet" size="lg" />
      </Center>
    );
  }

  if (!project) {
    return (
      <Center h={400}>
        <Text c="dimmed">Project not found</Text>
      </Center>
    );
  }

  const creatorId = project.creator?._id || project.creator?.id || project.creator;
  const isAdmin = creatorId === user?.id || creatorId === user?._id;
  // Filter out admin from members list to avoid duplicate, and only show ACTIVE members
  const activeMembers = (project.members || []).filter(m => {
    const memberId = m.user?._id || m.user?.id || m.user;
    return m.status === 'ACTIVE' && memberId !== creatorId;
  });
  const totalMembers = activeMembers.length + 1; // +1 for admin

  return (
    <Stack gap="xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Group justify="space-between" align="flex-start">
          <Group>
            <ActionIcon
              variant="subtle"
              onClick={() => navigate(-1)}
              size="lg"
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Stack gap={4}>
              <Group gap="sm">
                <Title order={2}>{project.title}</Title>
                <StatusBadge status={project.status || 'PLANNING'} />
                <Badge variant="light" color={project.visibility === 'PUBLIC' ? 'green' : 'gray'}>
                  {project.visibility}
                </Badge>
                {isAdmin && (
                  <Badge variant="filled" color="violet">
                    Admin
                  </Badge>
                )}
              </Group>
              <Text c="dimmed" size="sm">
                {project.shortDescription || project.description}
              </Text>
            </Stack>
          </Group>
          
          <Group>
            {isAdmin && (
              <Button
                variant="light"
                color="violet"
                leftSection={<IconEdit size={16} />}
                onClick={openEditModal}
              >
                Edit Project
              </Button>
            )}
            {!isAdmin && (
              <Button
                variant="light"
                color="red"
                leftSection={<IconDoorExit size={16} />}
                onClick={handleLeaveProject}
              >
                Leave Project
              </Button>
            )}
          </Group>
        </Group>
      </motion.div>

      {/* Main Content */}
      <Grid gutter="lg">
        {/* Left Column - Project Info & Members */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            {/* Team Members */}
            <GlassCard>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" fw={600} c="dimmed">TEAM MEMBERS</Text>
                  <Badge variant="light" color="violet">
                    {totalMembers} {totalMembers === 1 ? 'member' : 'members'}
                  </Badge>
                </Group>

                <Stack gap="xs">
                  {/* Admin (Creator) */}
                  <Paper
                    p="sm"
                    style={{
                      background: 'rgba(139, 92, 246, 0.1)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                      borderRadius: 8,
                    }}
                  >
                    <Group justify="space-between">
                      <Group gap="sm">
                        <UserAvatar user={project.creator} size="sm" />
                        <Box>
                          <Text size="sm" fw={500}>
                            {project.creator?.firstName} {project.creator?.lastName}
                          </Text>
                          <Text size="xs" c="violet">Admin</Text>
                        </Box>
                      </Group>
                      <IconCrown size={16} color="#f59e0b" />
                    </Group>
                  </Paper>

                  {/* Members */}
                  {activeMembers.map((member) => (
                    <Paper
                      key={member._id}
                      p="sm"
                      style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: 8,
                      }}
                    >
                      <Group justify="space-between">
                        <Group gap="sm">
                          <UserAvatar user={member.user} size="sm" />
                          <Box>
                            <Text size="sm" fw={500}>
                              {member.user?.firstName} {member.user?.lastName}
                            </Text>
                            <Text size="xs" c="dimmed">{member.role || 'Member'}</Text>
                          </Box>
                        </Group>
                        {isAdmin && (
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => handleRemoveMember(member._id)}
                            title="Remove member"
                          >
                            <IconUserMinus size={14} />
                          </ActionIcon>
                        )}
                      </Group>
                    </Paper>
                  ))}

                  {activeMembers.length === 0 && (
                    <Text size="sm" c="dimmed" ta="center" py="md">
                      No other members yet
                    </Text>
                  )}
                </Stack>
              </Stack>
            </GlassCard>

            {/* Technologies */}
            {project.technologies?.length > 0 && (
              <GlassCard>
                <Stack gap="md">
                  <Text size="sm" fw={600} c="dimmed">TECHNOLOGIES</Text>
                  <Group gap="xs">
                    {project.technologies.map((tech, i) => (
                      <Badge key={i} variant="outline" color="cyan">
                        {tech}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              </GlassCard>
            )}

            {/* Tags */}
            {project.tags?.length > 0 && (
              <GlassCard>
                <Stack gap="md">
                  <Text size="sm" fw={600} c="dimmed">TAGS</Text>
                  <Group gap="xs">
                    {project.tags.map((tag, i) => (
                      <Badge key={i} variant="light" color="violet">
                        {tag}
                      </Badge>
                    ))}
                  </Group>
                </Stack>
              </GlassCard>
            )}

            {/* Admin Actions */}
            {isAdmin && (
              <GlassCard>
                <Stack gap="md">
                  <Text size="sm" fw={600} c="dimmed">ADMIN ACTIONS</Text>
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={handleDeleteProject}
                    fullWidth
                  >
                    Delete Project
                  </Button>
                </Stack>
              </GlassCard>
            )}
          </Stack>
        </Grid.Col>

        {/* Right Column - Chat & Details */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <GlassCard style={{ height: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Tabs value={activeTab} onChange={setActiveTab} style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <Tabs.List style={{ flexShrink: 0 }}>
                <Tabs.Tab value="chat" leftSection={<IconMessage size={16} />}>
                  Team Chat
                </Tabs.Tab>
                <Tabs.Tab value="details" leftSection={<IconFolder size={16} />}>
                  Project Details
                </Tabs.Tab>
                {isAdmin && (
                  <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                    Settings
                  </Tabs.Tab>
                )}
              </Tabs.List>

              <Tabs.Panel value="chat" pt="md" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                {/* Messages Container */}
                <Box style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
                  <ScrollArea
                    h="100%"
                    type="auto"
                    offsetScrollbars
                    styles={{
                      root: { height: '100%' },
                      viewport: { height: '100%' },
                    }}
                  >
                    <Stack gap="sm" p="md">
                      {loadingMessages ? (
                        <Center py="xl">
                          <Loader color="violet" size="sm" />
                        </Center>
                      ) : messages.length === 0 ? (
                        <Center py="xl">
                          <Text c="dimmed" ta="center">
                            No messages yet. Start the conversation!
                          </Text>
                        </Center>
                      ) : (
                        messages.map((message) => {
                          const senderId = message.sender?._id || message.sender?.id;
                          const currentUserId = user?.id || user?._id;
                          const isOwn = senderId === currentUserId;
                          return (
                            <Box
                              key={message._id}
                              style={{
                                display: 'flex',
                                justifyContent: isOwn ? 'flex-end' : 'flex-start',
                              }}
                            >
                              <Group gap="xs" align="flex-end" style={{ maxWidth: '70%' }}>
                                {!isOwn && <UserAvatar user={message.sender} size="sm" />}
                                <Paper
                                  p="sm"
                                  style={{
                                    background: isOwn
                                      ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.2))'
                                      : 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: 12,
                                    borderTopRightRadius: isOwn ? 4 : 12,
                                    borderTopLeftRadius: isOwn ? 12 : 4,
                                  }}
                                >
                                  {!isOwn && (
                                    <Text size="xs" fw={600} c="cyan" mb={4}>
                                      {message.sender?.firstName} {message.sender?.lastName}
                                    </Text>
                                  )}
                                  <Text size="sm" style={{ wordBreak: 'break-word' }}>{message.content}</Text>
                                  <Text size="xs" c="dimmed" ta="right" mt={4}>
                                    {new Date(message.createdAt).toLocaleTimeString([], { 
                                      hour: '2-digit', 
                                      minute: '2-digit' 
                                    })}
                                  </Text>
                                </Paper>
                              </Group>
                            </Box>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </Stack>
                  </ScrollArea>
                </Box>

                {/* Message Input - Fixed at bottom */}
                <Box p="md" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)', flexShrink: 0 }}>
                  {/* Connection status indicator */}
                  {!isConnected && (
                    <Text size="xs" c="yellow" ta="center" mb="xs">
                      ⚠️ Reconnecting to chat server...
                    </Text>
                  )}
                  <Group gap="sm">
                    <TextInput
                      placeholder={isConnected ? "Type a message..." : "Connecting..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      disabled={!isConnected}
                      style={{ flex: 1 }}
                      styles={{
                        input: {
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                        },
                      }}
                    />
                    <ActionIcon
                      variant="gradient"
                      gradient={{ from: 'violet', to: 'cyan' }}
                      size="lg"
                      onClick={handleSendMessage}
                      loading={sendingMessage}
                      disabled={!newMessage.trim() || !isConnected}
                    >
                      <IconSend size={18} />
                    </ActionIcon>
                  </Group>
                </Box>
              </Tabs.Panel>

              <Tabs.Panel value="details" pt="md">
                <ScrollArea style={{ height: 'calc(70vh - 60px)' }}>
                  <Stack gap="md" p="md">
                    <Box>
                      <Text size="sm" fw={600} c="dimmed" mb="xs">DESCRIPTION</Text>
                      <Text>{project.description || 'No description provided.'}</Text>
                    </Box>

                    {project.objectives?.length > 0 && (
                      <Box>
                        <Text size="sm" fw={600} c="dimmed" mb="xs">OBJECTIVES</Text>
                        <Stack gap="xs">
                          {project.objectives.map((obj, i) => (
                            <Text key={i} size="sm">• {obj}</Text>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <Box>
                      <Text size="sm" fw={600} c="dimmed" mb="xs">PROJECT TYPE</Text>
                      <Badge variant="light" color="blue">{project.type || 'STUDENT_INITIATED'}</Badge>
                    </Box>

                    <Box>
                      <Text size="sm" fw={600} c="dimmed" mb="xs">CREATED</Text>
                      <Text size="sm">{new Date(project.createdAt).toLocaleDateString()}</Text>
                    </Box>
                  </Stack>
                </ScrollArea>
              </Tabs.Panel>

              {isAdmin && (
                <Tabs.Panel value="settings" pt="md">
                  <ScrollArea style={{ height: 'calc(70vh - 60px)' }}>
                    <Stack gap="md" p="md">
                      <Text size="lg" fw={600}>Project Settings</Text>
                      <Text size="sm" c="dimmed">
                        As the admin, you have full control over this project. You can edit all settings, 
                        manage members, and delete the project.
                      </Text>

                      <TextInput
                        label="Project Title"
                        value={editForm.title}
                        onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                        styles={{
                          input: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />

                      <TextInput
                        label="Short Description"
                        value={editForm.shortDescription}
                        onChange={(e) => setEditForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                        styles={{
                          input: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />

                      <Textarea
                        label="Full Description"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        minRows={4}
                        styles={{
                          input: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />

                      <TagsInput
                        label="Tags"
                        placeholder="Add tags..."
                        value={editForm.tags}
                        onChange={(value) => setEditForm(prev => ({ ...prev, tags: value }))}
                        styles={{
                          input: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />

                      <TagsInput
                        label="Technologies"
                        placeholder="Add technologies..."
                        value={editForm.technologies}
                        onChange={(value) => setEditForm(prev => ({ ...prev, technologies: value }))}
                        styles={{
                          input: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />

                      <Select
                        label="Visibility"
                        value={editForm.visibility}
                        onChange={(value) => setEditForm(prev => ({ ...prev, visibility: value }))}
                        data={[
                          { value: 'PUBLIC', label: 'Public - Anyone can see this project' },
                          { value: 'PRIVATE', label: 'Private - Only members can see' },
                          { value: 'CLASS_ONLY', label: 'Class Only - Classroom members only' },
                          { value: 'TEAM_ONLY', label: 'Team Only - Team members only' },
                        ]}
                        styles={{
                          input: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />

                      <Select
                        label="Status"
                        value={editForm.status}
                        onChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
                        data={[
                          { value: 'PLANNING', label: 'Planning' },
                          { value: 'IN_PROGRESS', label: 'In Progress' },
                          { value: 'REVIEW', label: 'Under Review' },
                          { value: 'COMPLETED', label: 'Completed' },
                          { value: 'ON_HOLD', label: 'On Hold' },
                        ]}
                        styles={{
                          input: {
                            background: 'rgba(255, 255, 255, 0.05)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                          },
                        }}
                      />

                      <Button
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'cyan' }}
                        onClick={handleSaveProject}
                        loading={saving}
                        mt="md"
                      >
                        Save Changes
                      </Button>
                    </Stack>
                  </ScrollArea>
                </Tabs.Panel>
              )}
            </Tabs>
          </GlassCard>
        </Grid.Col>
      </Grid>

      {/* Edit Modal (alternative quick edit) */}
      <Modal
        opened={editModalOpened}
        onClose={closeEditModal}
        title="Edit Project"
        size="lg"
        styles={{
          header: { background: 'rgba(26, 27, 30, 0.95)' },
          content: { background: 'rgba(26, 27, 30, 0.95)' },
        }}
      >
        <Stack gap="md">
          <TextInput
            label="Project Title"
            value={editForm.title}
            onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
          />

          <TextInput
            label="Short Description"
            value={editForm.shortDescription}
            onChange={(e) => setEditForm(prev => ({ ...prev, shortDescription: e.target.value }))}
          />

          <Textarea
            label="Full Description"
            value={editForm.description}
            onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
            minRows={3}
          />

          <TagsInput
            label="Tags"
            value={editForm.tags}
            onChange={(value) => setEditForm(prev => ({ ...prev, tags: value }))}
          />

          <TagsInput
            label="Technologies"
            value={editForm.technologies}
            onChange={(value) => setEditForm(prev => ({ ...prev, technologies: value }))}
          />

          <Select
            label="Visibility"
            value={editForm.visibility}
            onChange={(value) => setEditForm(prev => ({ ...prev, visibility: value }))}
            data={[
              { value: 'PUBLIC', label: 'Public' },
              { value: 'PRIVATE', label: 'Private' },
              { value: 'CLASS_ONLY', label: 'Class Only' },
              { value: 'TEAM_ONLY', label: 'Team Only' },
            ]}
          />

          <Select
            label="Status"
            value={editForm.status}
            onChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}
            data={[
              { value: 'PLANNING', label: 'Planning' },
              { value: 'IN_PROGRESS', label: 'In Progress' },
              { value: 'REVIEW', label: 'Under Review' },
              { value: 'COMPLETED', label: 'Completed' },
              { value: 'ON_HOLD', label: 'On Hold' },
            ]}
          />

          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={closeEditModal}>
              Cancel
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'violet', to: 'cyan' }}
              onClick={handleSaveProject}
              loading={saving}
            >
              Save Changes
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default ProjectDetails;
