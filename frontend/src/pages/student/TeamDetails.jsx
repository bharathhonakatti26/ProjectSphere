import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Avatar,
  Paper,
  ScrollArea,
  ActionIcon,
  Tabs,
  Loader,
  Center,
  Divider,
  Tooltip,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { motion } from 'framer-motion';
import {
  IconUsers,
  IconArrowLeft,
  IconMessage,
  IconSend,
  IconFolder,
  IconCrown,
  IconUser,
  IconMail,
  IconCalendar,
  IconSettings,
  IconLogout,
  IconUserPlus,
  IconCheck,
  IconX,
} from '@tabler/icons-react';
import { GlassCard, EmptyState, UserAvatar, StatusBadge } from '../../components/common';
import { teamAPI, chatAPI } from '../../api';
import { showSuccess, showApiError } from '../../components/common/notifications';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

const TeamDetails = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { sendMessage: sendChatMessage, joinRoom, leaveRoom } = useChatStore();
  
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [leaveOpened, { open: openLeave, close: closeLeave }] = useDisclosure(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [processingRequest, setProcessingRequest] = useState(null);
  
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchTeamDetails();
  }, [teamId]);

  useEffect(() => {
    // Scroll to bottom on new messages
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchTeamDetails = async () => {
    try {
      setLoading(true);
      const response = await teamAPI.getById(teamId);
      if (response.data.success) {
        setTeam(response.data.data.team);
        // Fetch team chat
        fetchTeamChat();
        // Fetch join requests if leader
        const teamData = response.data.data.team;
        const userId = user?.id || user?._id;
        const leaderId = teamData.leader?._id || teamData.leader;
        if (leaderId?.toString() === userId?.toString()) {
          fetchJoinRequests();
        }
      }
    } catch (error) {
      console.error('Failed to fetch team:', error);
      showApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamChat = async () => {
    try {
      setLoadingChat(true);
      const response = await chatAPI.getTeamInternalChat(teamId);
      if (response.data.success) {
        setChatRoom(response.data.data.room);
        // Fetch messages for this room
        if (response.data.data.room?._id) {
          const messagesRes = await chatAPI.getMessages(response.data.data.room._id);
          if (messagesRes.data.success) {
            setMessages(messagesRes.data.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch team chat:', error);
    } finally {
      setLoadingChat(false);
    }
  };

  const fetchJoinRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await teamAPI.getJoinRequests(teamId);
      if (response.data.success) {
        setJoinRequests(response.data.data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch join requests:', error);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleProcessJoinRequest = async (requestId, status) => {
    try {
      setProcessingRequest(requestId);
      const response = await teamAPI.processJoinRequest(teamId, requestId, status);
      if (response.data.success) {
        showSuccess(`Request ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully`);
        fetchJoinRequests();
        fetchTeamDetails(); // Refresh team members
      }
    } catch (error) {
      showApiError(error);
    } finally {
      setProcessingRequest(null);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatRoom) return;
    
    setSendingMessage(true);
    try {
      const response = await chatAPI.sendMessage(chatRoom._id, { content: newMessage.trim() });
      if (response.data.success) {
        setMessages(prev => [...prev, response.data.data.message]);
        setNewMessage('');
      }
    } catch (error) {
      showApiError(error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeaveTeam = async () => {
    try {
      await teamAPI.leave(teamId);
      showSuccess('Left team', 'You have left the team successfully');
      navigate('/app/student/teams');
    } catch (error) {
      showApiError(error);
    }
  };

  const isLeader = team?.leader?._id === user?.id || team?.leader?._id === user?._id || 
                   team?.leader === user?.id || team?.leader === user?._id;

  const activeMembers = team?.members?.filter(m => m.status === 'ACTIVE') || [];

  if (loading) {
    return (
      <Center h={400}>
        <Loader color="violet" size="lg" />
      </Center>
    );
  }

  if (!team) {
    return (
      <GlassCard>
        <EmptyState
          icon={IconUsers}
          title="Team not found"
          description="This team doesn't exist or you don't have access to it"
        />
        <Center mt="md">
          <Button onClick={() => navigate('/app/student/teams')} variant="light">
            Back to Teams
          </Button>
        </Center>
      </GlassCard>
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
          <Group>
            <ActionIcon 
              variant="subtle" 
              size="lg" 
              onClick={() => navigate('/app/student/teams')}
            >
              <IconArrowLeft size={20} />
            </ActionIcon>
            <Stack gap={4}>
              <Group gap="md">
                <Title order={2}>{team.name}</Title>
                <StatusBadge status={team.status || 'ACTIVE'} />
              </Group>
              <Text c="dimmed" size="sm">
                {team.classroom?.name || 'Personal Team'} • {activeMembers.length} members
              </Text>
            </Stack>
          </Group>
          
          <Group>
            {!isLeader && (
              <Button 
                variant="subtle" 
                color="red" 
                leftSection={<IconLogout size={16} />}
                onClick={openLeave}
              >
                Leave Team
              </Button>
            )}
          </Group>
        </Group>
      </motion.div>

      <Grid gutter="lg">
        {/* Team Info & Members */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Stack gap="lg">
            {/* Team Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <GlassCard>
                <Stack gap="md">
                  <Group>
                    <Box
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 12,
                        background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.3), rgba(139, 92, 246, 0.3))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <IconUsers size={28} />
                    </Box>
                    <Box>
                      <Text size="lg" fw={600}>{team.name}</Text>
                      <Text size="sm" c="dimmed">Team</Text>
                    </Box>
                  </Group>

                  <Divider />

                  {/* Project Info */}
                  {team.project && (
                    <Group gap="sm">
                      <IconFolder size={18} color="gray" />
                      <Box>
                        <Text size="sm" c="dimmed">Project</Text>
                        <Text size="sm" fw={500}>{team.project.title}</Text>
                      </Box>
                    </Group>
                  )}

                  {/* Created Date */}
                  <Group gap="sm">
                    <IconCalendar size={18} color="gray" />
                    <Box>
                      <Text size="sm" c="dimmed">Created</Text>
                      <Text size="sm" fw={500}>
                        {new Date(team.createdAt).toLocaleDateString()}
                      </Text>
                    </Box>
                  </Group>

                  {/* Supervisor Info */}
                  {team.classroom?.teacher && (
                    <>
                      <Divider />
                      <Group gap="sm">
                        <Avatar
                          src={team.classroom.teacher.avatar}
                          size="md"
                          radius="xl"
                          color="violet"
                        >
                          {team.classroom.teacher.firstName?.[0]}
                        </Avatar>
                        <Box>
                          <Text size="sm" c="dimmed">Supervisor</Text>
                          <Text size="sm" fw={500}>
                            {team.classroom.teacher.firstName} {team.classroom.teacher.lastName}
                          </Text>
                        </Box>
                      </Group>
                    </>
                  )}
                </Stack>
              </GlassCard>
            </motion.div>

            {/* Members Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <GlassCard>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={600}>Team Members</Text>
                    <Badge variant="light" color="cyan">{activeMembers.length}</Badge>
                  </Group>

                  <Stack gap="sm">
                    {activeMembers.map((member) => {
                      const memberUser = member.user || member;
                      const memberId = memberUser._id || memberUser.id;
                      const isTeamLeader = team.leader?._id === memberId || team.leader === memberId;
                      
                      return (
                        <Group key={memberId} justify="space-between">
                          <Group gap="sm">
                            <Avatar
                              src={memberUser.avatar}
                              size="md"
                              radius="xl"
                              color="cyan"
                            >
                              {memberUser.firstName?.[0]}
                            </Avatar>
                            <Box>
                              <Group gap={4}>
                                <Text size="sm" fw={500}>
                                  {memberUser.firstName} {memberUser.lastName}
                                </Text>
                                {isTeamLeader && (
                                  <Tooltip label="Team Leader">
                                    <IconCrown size={14} color="#fbbf24" />
                                  </Tooltip>
                                )}
                              </Group>
                              <Text size="xs" c="dimmed">{member.role || 'Member'}</Text>
                            </Box>
                          </Group>
                        </Group>
                      );
                    })}
                  </Stack>
                </Stack>
              </GlassCard>
            </motion.div>

            {/* Join Requests Card - Only for Team Leader */}
            {isLeader && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <GlassCard>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <IconUserPlus size={18} />
                        <Text fw={600}>Join Requests</Text>
                      </Group>
                      {joinRequests.length > 0 && (
                        <Badge variant="filled" color="orange">{joinRequests.length}</Badge>
                      )}
                    </Group>

                    {loadingRequests ? (
                      <Center py="md">
                        <Loader size="sm" color="violet" />
                      </Center>
                    ) : joinRequests.length > 0 ? (
                      <Stack gap="sm">
                        {joinRequests.map((request) => {
                          const requestUser = request.user || {};
                          return (
                            <Paper
                              key={request._id}
                              p="sm"
                              style={{
                                background: 'rgba(255, 255, 255, 0.03)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                              }}
                            >
                              <Group justify="space-between">
                                <Group gap="sm">
                                  <Avatar
                                    src={requestUser.avatar}
                                    size="md"
                                    radius="xl"
                                    color="orange"
                                  >
                                    {requestUser.firstName?.[0]}
                                  </Avatar>
                                  <Box>
                                    <Text size="sm" fw={500}>
                                      {requestUser.firstName} {requestUser.lastName}
                                    </Text>
                                    <Text size="xs" c="dimmed">{requestUser.email}</Text>
                                    {request.message && (
                                      <Text size="xs" c="dimmed" fs="italic" mt={2}>
                                        "{request.message}"
                                      </Text>
                                    )}
                                  </Box>
                                </Group>
                                <Group gap="xs">
                                  <Tooltip label="Approve">
                                    <ActionIcon
                                      variant="light"
                                      color="green"
                                      size="lg"
                                      onClick={() => handleProcessJoinRequest(request._id, 'APPROVED')}
                                      loading={processingRequest === request._id}
                                    >
                                      <IconCheck size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                  <Tooltip label="Reject">
                                    <ActionIcon
                                      variant="light"
                                      color="red"
                                      size="lg"
                                      onClick={() => handleProcessJoinRequest(request._id, 'REJECTED')}
                                      loading={processingRequest === request._id}
                                    >
                                      <IconX size={16} />
                                    </ActionIcon>
                                  </Tooltip>
                                </Group>
                              </Group>
                            </Paper>
                          );
                        })}
                      </Stack>
                    ) : (
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        No pending join requests
                      </Text>
                    )}
                  </Stack>
                </GlassCard>
              </motion.div>
            )}
          </Stack>
        </Grid.Col>

        {/* Team Chat */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
              {/* Chat Header */}
              <Group justify="space-between" mb="md">
                <Group gap="sm">
                  <IconMessage size={20} />
                  <Text fw={600}>Team Chat</Text>
                </Group>
                <Badge variant="light" color="green">
                  {messages.length} messages
                </Badge>
              </Group>

              <Divider mb="md" />

              {/* Messages Area */}
              <ScrollArea 
                style={{ flex: 1 }} 
                ref={scrollRef}
                offsetScrollbars
              >
                {loadingChat ? (
                  <Center h={300}>
                    <Loader color="violet" />
                  </Center>
                ) : messages.length > 0 ? (
                  <Stack gap="md" pr="md">
                    {messages.map((message, index) => {
                      const sender = message.sender || {};
                      const senderId = sender._id || sender.id;
                      const currentUserId = user?.id || user?._id;
                      const isOwnMessage = senderId === currentUserId;

                      return (
                        <Box
                          key={message._id || index}
                          style={{
                            display: 'flex',
                            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                          }}
                        >
                          <Group 
                            gap="sm" 
                            align="flex-start"
                            style={{ 
                              flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                              maxWidth: '80%',
                            }}
                          >
                            {!isOwnMessage && (
                              <Avatar
                                src={sender.avatar}
                                size="sm"
                                radius="xl"
                                color="cyan"
                              >
                                {sender.firstName?.[0]}
                              </Avatar>
                            )}
                            <Box>
                              {!isOwnMessage && (
                                <Text size="xs" c="dimmed" mb={2}>
                                  {sender.firstName} {sender.lastName}
                                </Text>
                              )}
                              <Paper
                                p="sm"
                                radius="lg"
                                style={{
                                  background: isOwnMessage 
                                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3))'
                                    : 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                              >
                                <Text size="sm">{message.content}</Text>
                              </Paper>
                              <Text size="xs" c="dimmed" mt={2} style={{ textAlign: isOwnMessage ? 'right' : 'left' }}>
                                {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </Text>
                            </Box>
                          </Group>
                        </Box>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </Stack>
                ) : (
                  <Center h={300}>
                    <Stack align="center" gap="sm">
                      <IconMessage size={48} color="gray" />
                      <Text c="dimmed">No messages yet</Text>
                      <Text size="sm" c="dimmed">Start the conversation with your team!</Text>
                    </Stack>
                  </Center>
                )}
              </ScrollArea>

              <Divider my="md" />

              {/* Message Input */}
              <Group gap="sm">
                <TextInput
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  style={{ flex: 1 }}
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                  }}
                  disabled={!chatRoom}
                />
                <ActionIcon
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'cyan' }}
                  onClick={handleSendMessage}
                  loading={sendingMessage}
                  disabled={!newMessage.trim() || !chatRoom}
                >
                  <IconSend size={18} />
                </ActionIcon>
              </Group>
            </GlassCard>
          </motion.div>
        </Grid.Col>
      </Grid>

      {/* Leave Team Modal */}
      <Modal
        opened={leaveOpened}
        onClose={closeLeave}
        title={<Text size="lg" fw={600}>Leave Team</Text>}
        centered
      >
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Are you sure you want to leave <strong>{team.name}</strong>? 
            You will lose access to the team chat and project.
          </Text>

          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeLeave}>
              Cancel
            </Button>
            <Button color="red" onClick={handleLeaveTeam}>
              Leave Team
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
};

export default TeamDetails;
