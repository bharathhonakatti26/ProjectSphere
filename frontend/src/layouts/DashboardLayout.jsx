import { useState } from 'react';
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  ScrollArea,
  Text,
  Box,
  Stack,
  Avatar,
  Menu,
  UnstyledButton,
  Divider,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IconDashboard,
  IconSchool,
  IconUsers,
  IconFolder,
  IconMessage,
  IconSettings,
  IconLogout,
  IconChevronRight,
  IconBell,
  IconCompass,
} from '@tabler/icons-react';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Logo, UserAvatar } from '../components/common';
import { showSuccess } from '../components/common/notifications';

const studentNavItems = [
  { icon: IconDashboard, label: 'Dashboard', path: '/app/student' },
  { icon: IconSchool, label: 'My Classrooms', path: '/app/student/classrooms' },
  { icon: IconUsers, label: 'My Teams', path: '/app/student/teams' },
  { icon: IconFolder, label: 'My Projects', path: '/app/student/projects' },
  { icon: IconCompass, label: 'Discovery', path: '/app/student/discovery' },
  { icon: IconMessage, label: 'Chat', path: '/app/student/chat' },
];

const teacherNavItems = [
  { icon: IconDashboard, label: 'Dashboard', path: '/app/teacher' },
  { icon: IconSchool, label: 'Classrooms', path: '/app/teacher/classrooms' },
  { icon: IconUsers, label: 'Teams', path: '/app/teacher/teams' },
  { icon: IconFolder, label: 'Projects', path: '/app/teacher/projects' },
  { icon: IconCompass, label: 'Discovery', path: '/app/teacher/discovery' },
  { icon: IconMessage, label: 'Chat', path: '/app/teacher/chat' },
];

const DashboardLayout = () => {
  const [opened, { toggle }] = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount, disconnect } = useChatStore();

  const navItems = user?.role === 'TEACHER' ? teacherNavItems : studentNavItems;
  const basePath = user?.role === 'TEACHER' ? '/app/teacher' : '/app/student';

  const handleLogout = async () => {
    disconnect();
    await logout();
    showSuccess('See you soon!', 'Logged out');
    navigate('/');
  };

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 260,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
      styles={{
        main: {
          background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
          minHeight: '100vh',
        },
        header: {
          background: 'rgba(10, 10, 15, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        },
        navbar: {
          background: 'rgba(15, 15, 20, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        },
      }}
    >
      {/* Header */}
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Logo size="sm" showText={true} animated={false} />
          </Group>

          <Group gap="md">
            {/* Notifications */}
            <Menu position="bottom-end" offset={10}>
              <Menu.Target>
                <UnstyledButton
                  style={{
                    position: 'relative',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <IconBell size={20} />
                  {unreadCount > 0 && (
                    <Badge
                      size="xs"
                      color="red"
                      variant="filled"
                      style={{
                        position: 'absolute',
                        top: -2,
                        right: -2,
                        padding: '0 4px',
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown
                style={{
                  background: 'rgba(26, 27, 30, 0.98)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Menu.Label>Notifications</Menu.Label>
                <Menu.Item>
                  <Text size="sm" c="dimmed">No new notifications</Text>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>

            {/* User Menu */}
            <Menu position="bottom-end" offset={10}>
              <Menu.Target>
                <UnstyledButton>
                  <Group gap="xs">
                    <UserAvatar user={user} size="sm" showTooltip={false} />
                    <Box visibleFrom="sm">
                      <Text size="sm" fw={500}>{user?.name}</Text>
                      <Text size="xs" c="dimmed">{user?.role}</Text>
                    </Box>
                    <IconChevronRight size={14} />
                  </Group>
                </UnstyledButton>
              </Menu.Target>
              <Menu.Dropdown
                style={{
                  background: 'rgba(26, 27, 30, 0.98)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Menu.Label>Account</Menu.Label>
                <Menu.Item
                  leftSection={<IconSettings size={16} />}
                  onClick={() => navigate(`${basePath}/settings`)}
                >
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Navbar */}
      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Stack gap="xs">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== basePath && location.pathname.startsWith(item.path));

              return (
                <NavLink
                  key={item.path}
                  active={isActive}
                  label={item.label}
                  leftSection={<item.icon size={18} stroke={1.5} />}
                  onClick={() => {
                    navigate(item.path);
                    if (opened) toggle();
                  }}
                  rightSection={
                    item.label === 'Chat' && unreadCount > 0 ? (
                      <Badge size="xs" color="red" variant="filled">
                        {unreadCount}
                      </Badge>
                    ) : null
                  }
                  variant="filled"
                  styles={{
                    root: {
                      borderRadius: '8px',
                      background: isActive
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(6, 182, 212, 0.2))'
                        : 'transparent',
                      border: isActive
                        ? '1px solid rgba(139, 92, 246, 0.3)'
                        : '1px solid transparent',
                      '&:hover': {
                        background: 'rgba(255, 255, 255, 0.05)',
                      },
                    },
                  }}
                />
              );
            })}
          </Stack>
        </AppShell.Section>

        <AppShell.Section>
          <Divider my="sm" color="dark.5" />
          <Box
            p="sm"
            style={{
              background: 'rgba(139, 92, 246, 0.1)',
              borderRadius: '8px',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <Group>
              <UserAvatar user={user} size="md" showTooltip={false} />
              <Box style={{ flex: 1 }}>
                <Text size="sm" fw={500}>{user?.name}</Text>
                <Text size="xs" c="dimmed">{user?.email}</Text>
              </Box>
            </Group>
          </Box>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* Main Content */}
      <AppShell.Main>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </AppShell.Main>
    </AppShell>
  );
};

export default DashboardLayout;
