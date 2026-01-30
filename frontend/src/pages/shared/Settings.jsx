import { useState } from 'react';
import {
  Title,
  Text,
  Stack,
  Paper,
  Group,
  Button,
  TextInput,
  PasswordInput,
  Tabs,
  Switch,
  Divider,
  Avatar,
  FileButton,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';
import {
  IconUser,
  IconLock,
  IconBell,
  IconPalette,
  IconUpload,
} from '@tabler/icons-react';
import { GlassCard, UserAvatar } from '../../components/common';
import { showSuccess, showApiError } from '../../components/common/notifications';
import { useAuthStore } from '../../store/authStore';
import api from '../../api';

const Settings = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);

  const profileForm = useForm({
    initialValues: {
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
    },
    validate: {
      name: (value) => (value.length >= 2 ? null : 'Name must be at least 2 characters'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
    },
  });

  const passwordForm = useForm({
    initialValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    validate: {
      currentPassword: (value) => (value.length >= 6 ? null : 'Required'),
      newPassword: (value) => {
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Must contain uppercase letter';
        if (!/[a-z]/.test(value)) return 'Must contain lowercase letter';
        if (!/[0-9]/.test(value)) return 'Must contain a number';
        return null;
      },
      confirmPassword: (value, values) =>
        value === values.newPassword ? null : 'Passwords do not match',
    },
  });

  const handleProfileUpdate = async (values) => {
    setSaving(true);
    try {
      const response = await api.users.updateProfile(values);
      if (response.data.success) {
        setUser(response.data.data.user);
        showSuccess('Profile updated successfully!');
      }
    } catch (error) {
      showApiError(error);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (values) => {
    setSaving(true);
    try {
      await api.users.changePassword(values);
      showSuccess('Password changed successfully!');
      passwordForm.reset();
    } catch (error) {
      showApiError(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack gap="xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Title order={2}>Settings</Title>
        <Text c="dimmed">Manage your account preferences</Text>
      </motion.div>

      {/* Settings Tabs */}
      <GlassCard>
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List>
            <Tabs.Tab value="profile" leftSection={<IconUser size={16} />}>
              Profile
            </Tabs.Tab>
            <Tabs.Tab value="security" leftSection={<IconLock size={16} />}>
              Security
            </Tabs.Tab>
            <Tabs.Tab value="notifications" leftSection={<IconBell size={16} />}>
              Notifications
            </Tabs.Tab>
            <Tabs.Tab value="appearance" leftSection={<IconPalette size={16} />}>
              Appearance
            </Tabs.Tab>
          </Tabs.List>

          {/* Profile Tab */}
          <Tabs.Panel value="profile" pt="xl">
            <form onSubmit={profileForm.onSubmit(handleProfileUpdate)}>
              <Stack gap="lg">
                {/* Avatar Section */}
                <Group>
                  <UserAvatar user={user} size="xl" showTooltip={false} />
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>Profile Picture</Text>
                    <FileButton onChange={setFile} accept="image/*">
                      {(props) => (
                        <Button
                          variant="light"
                          size="sm"
                          leftSection={<IconUpload size={14} />}
                          {...props}
                        >
                          Upload Image
                        </Button>
                      )}
                    </FileButton>
                  </Stack>
                </Group>

                <Divider />

                {/* Profile Fields */}
                <TextInput
                  label="Full Name"
                  placeholder="Your name"
                  {...profileForm.getInputProps('name')}
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                  }}
                />

                <TextInput
                  label="Email"
                  placeholder="your@email.com"
                  disabled
                  {...profileForm.getInputProps('email')}
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.05)',
                    },
                  }}
                />

                <TextInput
                  label="Bio"
                  placeholder="Tell us about yourself"
                  {...profileForm.getInputProps('bio')}
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                  }}
                />

                <Group justify="flex-end">
                  <Button
                    type="submit"
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                    loading={saving}
                  >
                    Save Changes
                  </Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>

          {/* Security Tab */}
          <Tabs.Panel value="security" pt="xl">
            <form onSubmit={passwordForm.onSubmit(handlePasswordChange)}>
              <Stack gap="lg">
                <Text size="lg" fw={600}>Change Password</Text>

                <PasswordInput
                  label="Current Password"
                  placeholder="Enter current password"
                  {...passwordForm.getInputProps('currentPassword')}
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                  }}
                />

                <PasswordInput
                  label="New Password"
                  placeholder="Enter new password"
                  {...passwordForm.getInputProps('newPassword')}
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                  }}
                />

                <PasswordInput
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                  {...passwordForm.getInputProps('confirmPassword')}
                  styles={{
                    input: {
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    },
                  }}
                />

                <Text size="xs" c="dimmed">
                  Password must be at least 8 characters with uppercase, lowercase, and number.
                </Text>

                <Group justify="flex-end">
                  <Button
                    type="submit"
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                    loading={saving}
                  >
                    Change Password
                  </Button>
                </Group>
              </Stack>
            </form>
          </Tabs.Panel>

          {/* Notifications Tab */}
          <Tabs.Panel value="notifications" pt="xl">
            <Stack gap="lg">
              <Text size="lg" fw={600}>Notification Preferences</Text>

              <Paper
                p="md"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>Email Notifications</Text>
                    <Text size="xs" c="dimmed">Receive updates via email</Text>
                  </Stack>
                  <Switch defaultChecked color="violet" />
                </Group>
              </Paper>

              <Paper
                p="md"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>Chat Notifications</Text>
                    <Text size="xs" c="dimmed">Get notified about new messages</Text>
                  </Stack>
                  <Switch defaultChecked color="violet" />
                </Group>
              </Paper>

              <Paper
                p="md"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>Project Updates</Text>
                    <Text size="xs" c="dimmed">Notifications about project milestones</Text>
                  </Stack>
                  <Switch defaultChecked color="violet" />
                </Group>
              </Paper>

              <Paper
                p="md"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>Deadline Reminders</Text>
                    <Text size="xs" c="dimmed">Get reminded before deadlines</Text>
                  </Stack>
                  <Switch defaultChecked color="violet" />
                </Group>
              </Paper>
            </Stack>
          </Tabs.Panel>

          {/* Appearance Tab */}
          <Tabs.Panel value="appearance" pt="xl">
            <Stack gap="lg">
              <Text size="lg" fw={600}>Appearance Settings</Text>

              <Paper
                p="md"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>Dark Mode</Text>
                    <Text size="xs" c="dimmed">Use dark theme (always on for premium experience)</Text>
                  </Stack>
                  <Switch defaultChecked disabled color="violet" />
                </Group>
              </Paper>

              <Paper
                p="md"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>Animations</Text>
                    <Text size="xs" c="dimmed">Enable UI animations</Text>
                  </Stack>
                  <Switch defaultChecked color="violet" />
                </Group>
              </Paper>

              <Paper
                p="md"
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                }}
              >
                <Group justify="space-between">
                  <Stack gap={2}>
                    <Text size="sm" fw={500}>3D Background</Text>
                    <Text size="xs" c="dimmed">Show particle effects on landing page</Text>
                  </Stack>
                  <Switch defaultChecked color="violet" />
                </Group>
              </Paper>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </GlassCard>
    </Stack>
  );
};

export default Settings;
