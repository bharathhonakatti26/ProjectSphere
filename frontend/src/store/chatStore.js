import { create } from 'zustand';
import { io } from 'socket.io-client';
import { useAuthStore } from './authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useChatStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  rooms: [],
  activeRoom: null,
  messages: [],
  typingUsers: {},
  unreadCounts: {},
  isLoading: false,

  // Initialize socket connection
  connect: () => {
    // Prevent duplicate connections
    const existingSocket = get().socket;
    if (existingSocket?.connected) {
      console.log('Socket already connected');
      return;
    }
    
    // Disconnect existing socket if any
    if (existingSocket) {
      existingSocket.removeAllListeners();
      existingSocket.disconnect();
    }

    const token = useAuthStore.getState().accessToken;
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socket.on('connect', () => {
      console.log('Socket connected');
      set({ isConnected: true });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
      set({ isConnected: false });
    });

    socket.on('new-message', (data) => {
      const { roomId, message } = data;
      const activeRoom = get().activeRoom;

      if (activeRoom?._id === roomId) {
        // Check if message already exists to prevent duplicates
        const currentMessages = get().messages;
        const messageExists = currentMessages.some(m => m._id === message._id);
        if (!messageExists) {
          set((state) => ({
            messages: [...state.messages, message],
          }));
        }
      } else {
        // Increment unread count
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [roomId]: (state.unreadCounts[roomId] || 0) + 1,
          },
        }));
      }

      // Update room's last message
      set((state) => ({
        rooms: state.rooms.map((room) =>
          room._id === roomId
            ? { ...room, lastMessage: { content: message.content, sender: message.sender, timestamp: message.createdAt } }
            : room
        ),
      }));
    });

    socket.on('message-notification', (data) => {
      const { roomId } = data;
      const activeRoom = get().activeRoom;

      if (activeRoom?._id !== roomId) {
        set((state) => ({
          unreadCounts: {
            ...state.unreadCounts,
            [roomId]: (state.unreadCounts[roomId] || 0) + 1,
          },
        }));
      }
    });

    socket.on('user-typing', (data) => {
      const { roomId, user } = data;
      set((state) => ({
        typingUsers: {
          ...state.typingUsers,
          [roomId]: { ...state.typingUsers[roomId], [user.id]: user },
        },
      }));
    });

    socket.on('user-stopped-typing', (data) => {
      const { roomId, userId } = data;
      set((state) => {
        const roomTyping = { ...state.typingUsers[roomId] };
        delete roomTyping[userId];
        return {
          typingUsers: {
            ...state.typingUsers,
            [roomId]: roomTyping,
          },
        };
      });
    });

    socket.on('message-edited', (data) => {
      const { message } = data;
      set((state) => ({
        messages: state.messages.map((m) =>
          m._id === message._id ? message : m
        ),
      }));
    });

    socket.on('message-deleted', (data) => {
      const { messageId } = data;
      set((state) => ({
        messages: state.messages.filter((m) => m._id !== messageId),
      }));
    });

    socket.on('messages-read', (data) => {
      const { userId, messageIds } = data;
      set((state) => ({
        messages: state.messages.map((m) =>
          messageIds.includes(m._id)
            ? { ...m, readBy: [...m.readBy, { user: userId }] }
            : m
        ),
      }));
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    set({ socket });
  },

  // Disconnect socket
  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      set({ socket: null, isConnected: false });
    }
  },

  // Join a room
  joinRoom: (roomId) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('join-room', roomId);
    }
  },

  // Leave a room
  leaveRoom: (roomId) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('leave-room', roomId);
    }
  },

  // Send a message
  sendMessage: (roomId, content, type = 'TEXT', attachments = []) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('send-message', { roomId, content, type, attachments });
    }
  },

  // Start typing
  startTyping: (roomId) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('typing-start', roomId);
    }
  },

  // Stop typing
  stopTyping: (roomId) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('typing-stop', roomId);
    }
  },

  // Mark messages as read
  markAsRead: (roomId, messageIds) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('mark-read', { roomId, messageIds });
    }
    set((state) => ({
      unreadCounts: {
        ...state.unreadCounts,
        [roomId]: 0,
      },
    }));
  },

  // Edit message
  editMessage: (messageId, content) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('edit-message', { messageId, content });
    }
  },

  // Delete message
  deleteMessage: (messageId) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('delete-message', { messageId });
    }
  },

  // Set rooms
  setRooms: (rooms) => set({ rooms }),

  // Set active room
  setActiveRoom: (room) => set({ activeRoom: room }),

  // Set messages
  setMessages: (messages) => set({ messages }),

  // Add messages (for pagination)
  addMessages: (newMessages) => set((state) => ({
    messages: [...newMessages, ...state.messages],
  })),

  // Clear messages
  clearMessages: () => set({ messages: [] }),

  // Set loading
  setLoading: (isLoading) => set({ isLoading }),
}));
