import { useEffect, useState, useRef } from 'react';
import {
  Title,
  Text,
  Stack,
  Grid,
  Group,
  TextInput,
  Paper,
  ScrollArea,
  ActionIcon,
  Badge,
  Box,
  Tabs,
  Loader,
  Center,
} from '@mantine/core';
import { motion } from 'framer-motion';
import {
  IconMessage,
  IconSearch,
  IconSend,
  IconUsers,
  IconSchool,
  IconBriefcase,
} from '@tabler/icons-react';
import { GlassCard, EmptyState, UserAvatar } from '../../components/common';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { chatAPI } from '../../api';

const Chat = () => {
  const { user } = useAuthStore();
  const {
    isConnected,
    connect,
    activeRoom,
    messages,
    typingUsers,
    setActiveRoom,
    setMessages,
    sendMessage,
    joinRoom,
    leaveRoom,
    clearMessages,
  } = useChatStore();
  
  const [search, setSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [chatRooms, setChatRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const scrollRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Connect to socket on mount
  useEffect(() => {
    connect();
    fetchChatRooms();
    
    return () => {
      if (activeRoom?._id) {
        leaveRoom(activeRoom._id);
        setActiveRoom(null);
        clearMessages();
      }
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom on new messages
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchChatRooms = async () => {
    setLoading(true);
    try {
      const response = await chatAPI.getRooms();
      if (response.data.success) {
        setChatRooms(response.data.data.rooms || []);
      }
    } catch (error) {
      console.error('Failed to fetch chat rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (roomId) => {
    setLoadingMessages(true);
    try {
      const response = await chatAPI.getMessages(roomId, { limit: 100 });
      if (response.data.success) {
        const messagesData = response.data.data || [];
        setMessages(Array.isArray(messagesData) ? messagesData : []);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSelectRoom = async (room) => {
    if (activeRoom?._id === room._id) return;
    
    if (activeRoom) {
      leaveRoom(activeRoom._id);
    }
    setActiveRoom(room);
    joinRoom(room._id);
    await fetchMessages(room._id);
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !activeRoom || !isConnected) return;
    sendMessage(activeRoom._id, newMessage.trim());
    setNewMessage('');
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getRoomIcon = (type) => {
    switch (type) {
      case 'CLASSROOM_CHAT':
        return <IconSchool size={16} />;
      case 'TEAM_INTERNAL_CHAT':
      case 'TEAM_REVIEW_CHAT':
        return <IconUsers size={16} />;
      case 'PROJECT_CHAT':
        return <IconBriefcase size={16} />;
      default:
        return <IconMessage size={16} />;
    }
  };

  const filterRoomsByTab = (rooms) => {
    if (activeTab === 'all') return rooms;
    if (activeTab === 'classroom') return rooms.filter(r => r.type === 'CLASSROOM_CHAT');
    if (activeTab === 'team') return rooms.filter(r => r.type === 'TEAM_INTERNAL_CHAT' || r.type === 'TEAM_REVIEW_CHAT');
    if (activeTab === 'project') return rooms.filter(r => r.type === 'PROJECT_CHAT');
    if (activeTab === 'direct') return rooms.filter(r => r.type === 'DIRECT_MESSAGE');
    return rooms;
  };

  const filteredRooms = filterRoomsByTab(chatRooms).filter(
    (room) => room.name?.toLowerCase().includes(search.toLowerCase())
  );

  const currentUserId = user?.id || user?._id;
  const roomTypingUsers = activeRoom ? (typingUsers[activeRoom._id] || {}) : {};
  const typingUsersList = Object.values(roomTypingUsers);

  return (
    <Stack gap="xl" style={{ height: 'calc(100vh - 140px)' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Group justify="space-between">
          <Box>
            <Title order={2}>Chat</Title>
            <Text c="dimmed">Communicate with your team and classmates</Text>
          </Box>
          {!isConnected && (
            <Badge color="yellow" variant="light">Connecting...</Badge>
          )}
        </Group>
      </motion.div>

      {/* Chat Interface */}
      <Grid gutter="lg" style={{ flex: 1, minHeight: 0 }}>
        {/* Chat List */}
        <Grid.Col span={{ base: 12, md: 4 }} style={{ height: '100%' }}>
          <GlassCard style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Stack gap="md" style={{ height: '100%' }}>
              <TextInput
                placeholder="Search chats..."
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

              <Tabs value={activeTab} onChange={setActiveTab} variant="pills">
                <Tabs.List>
                  <Tabs.Tab value="all" size="xs">All</Tabs.Tab>
                  <Tabs.Tab value="classroom" size="xs">Classroom</Tabs.Tab>
                  <Tabs.Tab value="team" size="xs">Team</Tabs.Tab>
                  <Tabs.Tab value="project" size="xs">Project</Tabs.Tab>
                  <Tabs.Tab value="direct" size="xs">Direct</Tabs.Tab>
                </Tabs.List>
              </Tabs>

              <ScrollArea style={{ flex: 1 }}>
                {loading ? (
                  <Center py="xl">
                    <Loader color="violet" size="sm" />
                  </Center>
                ) : (
                  <Stack gap="xs">
                    {filteredRooms.length > 0 ? (
                      filteredRooms.map((room) => (
                        <Paper
                          key={room._id}
                          p="sm"
                          style={{
                            background: activeRoom?._id === room._id
                              ? 'rgba(139, 92, 246, 0.2)'
                              : 'rgba(255, 255, 255, 0.03)',
                            border: activeRoom?._id === room._id
                              ? '1px solid rgba(139, 92, 246, 0.3)'
                              : '1px solid rgba(255, 255, 255, 0.05)',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onClick={() => handleSelectRoom(room)}
                        >
                          <Group justify="space-between">
                            <Group gap="sm">
                              <Box
                                style={{
                                  width: 40,
                                  height: 40,
                                  borderRadius: 8,
                                  background: 'rgba(139, 92, 246, 0.2)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                {getRoomIcon(room.type)}
                              </Box>
                              <Box>
                                <Text size="sm" fw={500}>{room.name}</Text>
                                <Text size="xs" c="dimmed" lineClamp={1}>
                                  {room.lastMessage?.content || 'No messages yet'}
                                </Text>
                              </Box>
                            </Group>
                            {room.unreadCount > 0 && (
                              <Badge size="xs" color="violet" variant="filled">
                                {room.unreadCount}
                              </Badge>
                            )}
                          </Group>
                        </Paper>
                      ))
                    ) : (
                      <Text size="sm" c="dimmed" ta="center" py="xl">
                        No chats found
                      </Text>
                    )}
                  </Stack>
                )}
              </ScrollArea>
            </Stack>
          </GlassCard>
        </Grid.Col>

        {/* Chat Messages */}
        <Grid.Col span={{ base: 12, md: 8 }} style={{ height: '100%' }}>
          <GlassCard style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {activeRoom ? (
              <>
                {/* Chat Header */}
                <Group
                  justify="space-between"
                  pb="md"
                  style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                  <Group>
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        background: 'rgba(139, 92, 246, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getRoomIcon(activeRoom.type)}
                    </Box>
                    <Box>
                      <Text fw={500}>{activeRoom.name}</Text>
                      <Text size="xs" c="dimmed">
                        {activeRoom.participants?.length || 0} members
                      </Text>
                    </Box>
                  </Group>
                </Group>

                {/* Messages */}
                <ScrollArea style={{ flex: 1, padding: '1rem 0' }} viewportRef={scrollRef}>
                  {loadingMessages ? (
                    <Center py="xl">
                      <Loader color="violet" size="sm" />
                    </Center>
                  ) : (
                    <Stack gap="md">
                      {messages.length > 0 ? (
                        messages.map((message, index) => {
                          const senderId = message.sender?._id || message.sender?.id;
                          const isOwn = senderId === currentUserId;
                          return (
                            <Group
                              key={message._id || index}
                              justify={isOwn ? 'flex-end' : 'flex-start'}
                              align="flex-end"
                              gap="xs"
                            >
                              {!isOwn && (
                                <UserAvatar user={message.sender} size="sm" />
                              )}
                              <Paper
                                p="sm"
                                style={{
                                  maxWidth: '70%',
                                  background: isOwn
                                    ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3))'
                                    : 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                }}
                              >
                                {!isOwn && (
                                  <Text size="xs" c="violet" fw={500} mb={4}>
                                    {message.sender?.name}
                                  </Text>
                                )}
                                <Text size="sm">{message.content}</Text>
                                <Text size="xs" c="dimmed" ta="right" mt={4}>
                                  {new Date(message.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </Text>
                              </Paper>
                            </Group>
                          );
                        })
                      ) : (
                        <Text size="sm" c="dimmed" ta="center" py="xl">
                          No messages yet. Start the conversation!
                        </Text>
                      )}

                      {/* Typing Indicator */}
                      {typingUsersList.length > 0 && (
                        <Text size="xs" c="dimmed" fs="italic">
                          {typingUsersList.map((u) => u.name).join(', ')} typing...
                        </Text>
                      )}
                      <div ref={messagesEndRef} />
                    </Stack>
                  )}
                </ScrollArea>

                {/* Message Input */}
                <Group
                  pt="md"
                  style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
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
                  />
                  <ActionIcon
                    size="lg"
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <IconSend size={18} />
                  </ActionIcon>
                </Group>
              </>
            ) : (
              <Box style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState
                  icon="message"
                  title="Select a chat"
                  description="Choose a conversation from the list to start messaging"
                />
              </Box>
            )}
          </GlassCard>
        </Grid.Col>
      </Grid>
    </Stack>
  );
};

export default Chat;
