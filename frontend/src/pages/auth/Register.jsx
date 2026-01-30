import { useState } from 'react';
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  Anchor,
  Divider,
  SegmentedControl,
  Center,
  Group,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { IconMail, IconLock, IconSchool, IconUser, IconAt } from '@tabler/icons-react';
import { useAuthStore } from '../../store/authStore';
import { showSuccess, showApiError } from '../../components/common/notifications';

const Register = () => {
  const navigate = useNavigate();
  const { register, isLoading } = useAuthStore();
  const [role, setRole] = useState('STUDENT');

  const form = useForm({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      firstName: (value) => (value.length >= 2 ? null : 'First name must be at least 2 characters'),
      lastName: (value) => (value.length >= 2 ? null : 'Last name must be at least 2 characters'),
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) => {
        if (value.length < 8) return 'Password must be at least 8 characters';
        if (!/[A-Z]/.test(value)) return 'Password must contain uppercase letter';
        if (!/[a-z]/.test(value)) return 'Password must contain lowercase letter';
        if (!/[0-9]/.test(value)) return 'Password must contain a number';
        return null;
      },
      confirmPassword: (value, values) =>
        value === values.password ? null : 'Passwords do not match',
    },
  });

  const handleSubmit = async (values) => {
    try {
      console.log('Registering with:', { 
        firstName: values.firstName, 
        lastName: values.lastName, 
        email: values.email, 
        password: values.password, 
        role 
      });
      await register({ 
        firstName: values.firstName, 
        lastName: values.lastName, 
        email: values.email, 
        password: values.password, 
        role 
      });
      showSuccess('Account created successfully!', 'Please login to continue');
      console.log('Registration successful, navigating to /login');
      window.location.href = '/login';
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      showApiError(error);
    }
  };

  return (
    <Paper
      radius="lg"
      p={{ base: 'sm', sm: 'xl' }}
      style={{
        background: 'rgba(255, 255, 255, 0.03)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        width: '100%',
      }}
    >
      <Stack gap={{ base: 'sm', sm: 'lg' }}>
        <Stack gap={4}>
          <Title order={2} ta="center" size={{ base: 'h4', sm: 'h2' }}>
            Create an account
          </Title>
          <Text size="xs" c="dimmed" ta="center">
            Join ProjectSphere and start collaborating
          </Text>
        </Stack>

        <SegmentedControl
          value={role}
          onChange={setRole}
          fullWidth
          data={[
            {
              value: 'STUDENT',
              label: (
                <Center gap="xs">
                  <IconUser size={16} />
                  <span>Student</span>
                </Center>
              ),
            },
            {
              value: 'TEACHER',
              label: (
                <Center gap="xs">
                  <IconSchool size={16} />
                  <span>Teacher</span>
                </Center>
              ),
            },
          ]}
          styles={{
            root: {
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
          }}
        />

        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Group grow>
              <TextInput
                label="First Name"
                placeholder="John"
                leftSection={<IconUser size={16} />}
                {...form.getInputProps('firstName')}
                styles={{
                  input: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  },
                }}
              />
              <TextInput
                label="Last Name"
                placeholder="Doe"
                leftSection={<IconUser size={16} />}
                {...form.getInputProps('lastName')}
                styles={{
                  input: {
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                  },
                }}
              />
            </Group>

            <TextInput
              label="Email"
              placeholder="your@email.com"
              leftSection={<IconMail size={16} />}
              {...form.getInputProps('email')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />

            <PasswordInput
              label="Password"
              placeholder="Create a password"
              leftSection={<IconLock size={16} />}
              {...form.getInputProps('password')}
              styles={{
                input: {
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                },
              }}
            />

            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              leftSection={<IconLock size={16} />}
              {...form.getInputProps('confirmPassword')}
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

            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button
                type="submit"
                fullWidth
                size="md"
                loading={isLoading}
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                radius="md"
              >
                Create Account
              </Button>
            </motion.div>
          </Stack>
        </form>

        <Divider
          label="or continue with"
          labelPosition="center"
          styles={{ label: { color: 'var(--mantine-color-dimmed)' } }}
        />

        <Group grow>
          <Button
            variant="outline"
            color="gray"
            radius="md"
            leftSection={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            }
          >
            Google
          </Button>
          <Button
            variant="outline"
            color="gray"
            radius="md"
            leftSection={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            }
          >
            GitHub
          </Button>
        </Group>

        <Text size="sm" ta="center" c="dimmed">
          Already have an account?{' '}
          <Anchor component={Link} to="/login" fw={600} c="violet">
            Sign in
          </Anchor>
        </Text>
      </Stack>
    </Paper>
  );
};

export default Register;
