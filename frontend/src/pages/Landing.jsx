import { Container, Title, Text, Button, Group, Stack, Box, Grid, SimpleGrid, ThemeIcon, Badge } from '@mantine/core';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  IconUsers,
  IconCode,
  IconMessage,
  IconChartBar,
  IconShield,
  IconRocket,
  IconSchool,
  IconBrandGithub,
  IconArrowRight,
  IconChevronDown,
  IconMouse,
} from '@tabler/icons-react';
import { FloatingPolyhedrons, ParticleBackground } from '../components/3d';
import { GlassCard, Logo } from '../components/common';

const features = [
  {
    icon: IconSchool,
    title: 'Classroom Management',
    description: 'Create and manage virtual classrooms with ease. Invite students and organize projects seamlessly.',
  },
  {
    icon: IconUsers,
    title: 'Team Collaboration',
    description: 'Form teams, assign roles, and collaborate in real-time with integrated chat and file sharing.',
  },
  {
    icon: IconCode,
    title: 'Project Workflows',
    description: 'Support for student-initiated, teacher-initiated, and classroom mini-projects with milestones.',
  },
  {
    icon: IconMessage,
    title: 'Real-time Chat',
    description: 'Dedicated chat channels for classrooms, teams, reviews, and direct messaging.',
  },
  {
    icon: IconChartBar,
    title: 'Evaluation System',
    description: 'Comprehensive grading with remarks, weightage, and CSV/XLSX export functionality.',
  },
  {
    icon: IconShield,
    title: 'Role-based Access',
    description: 'Project-scoped admin rights. Teachers manage their classrooms, students manage their teams.',
  },
];

const stats = [
  { value: '99.9%', label: 'Uptime' },
  { value: '50K+', label: 'Students' },
  { value: '1000+', label: 'Classrooms' },
  { value: '24/7', label: 'Support' },
];

const MotionBox = motion.create(Box);
const MotionTitle = motion.create(Title);
const MotionText = motion.create(Text);

const Landing = () => {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <Box
      style={{
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
      }}
    >
      {/* Particle Background */}
      <ParticleBackground />

      {/* Floating Polyhedrons */}
      <FloatingPolyhedrons />

      {/* Navigation */}
      <Box
        component={motion.div}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          padding: '1rem 2rem',
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Container size="xl">
          <Group justify="space-between">
            <Logo size="md" />
            <Group gap="md">
              <Button
                variant="subtle"
                color="gray"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
              <Button
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
            </Group>
          </Group>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box style={{ position: 'relative', zIndex: 1, paddingTop: '120px' }}>
        <Container size="xl" py={80}>
          <motion.div style={{ y, opacity }}>
            <Stack align="center" gap="xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 100, delay: 0.2 }}
              >
                <Badge
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'cyan' }}
                  radius="xl"
                  px="xl"
                >
                  🚀 Modern Project Collaboration
                </Badge>
              </motion.div>

              <MotionTitle
                order={1}
                ta="center"
                size={60}
                fw={800}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                style={{
                  background: 'linear-gradient(135deg, #ffffff 0%, #8B5CF6 50%, #06B6D4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  lineHeight: 1.2,
                }}
              >
                Classroom Project
                <br />
                Collaboration Platform
              </MotionTitle>

              <MotionText
                size="xl"
                c="dimmed"
                ta="center"
                maw={600}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Empower educators and students with a comprehensive platform for
                project management, team collaboration, and real-time evaluation.
              </MotionText>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Group gap="md" mt="xl">
                  <Button
                    size="xl"
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                    radius="xl"
                    rightSection={<IconArrowRight size={20} />}
                    onClick={() => navigate('/register')}
                  >
                    Start Free Trial
                  </Button>
                  <Button
                    size="xl"
                    variant="outline"
                    color="gray"
                    radius="xl"
                    leftSection={<IconBrandGithub size={20} />}
                  >
                    View on GitHub
                  </Button>
                </Group>
              </motion.div>

              {/* Scroll Indicator */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                style={{ marginTop: '80px', cursor: 'pointer' }}
                onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
              >
                <Stack align="center" gap="sm">
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Text size="sm" c="dimmed" tt="uppercase" fw={500} style={{ letterSpacing: 3 }}>
                      Discover More
                    </Text>
                  </motion.div>
                  
                  {/* Triple bouncing arrows */}
                  <Box style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
                    <motion.div
                      animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                    >
                      <IconChevronDown size={28} style={{ color: '#8B5CF6' }} />
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.15 }}
                      style={{ marginTop: -12 }}
                    >
                      <IconChevronDown size={28} style={{ color: '#7C3AED' }} />
                    </motion.div>
                    <motion.div
                      animate={{ y: [0, 10, 0], opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                      style={{ marginTop: -12 }}
                    >
                      <IconChevronDown size={28} style={{ color: '#06B6D4' }} />
                    </motion.div>
                  </Box>
                </Stack>
              </motion.div>
            </Stack>
          </motion.div>
        </Container>

        {/* Features Section */}
        <Container size="xl" py={80} style={{ marginTop: -580 }}>
          <Stack gap={60}>
            <Stack align="center" gap="sm">
              <Badge variant="light" color="violet" size="lg">
                Features
              </Badge>
              <Title order={2} ta="center" size={40} fw={700}>
                Everything you need
              </Title>
              <Text size="lg" c="dimmed" ta="center" maw={500}>
                A complete suite of tools designed for modern classroom collaboration
              </Text>
            </Stack>

            <Grid gutter="xl">
              {features.map((feature, index) => (
                <Grid.Col key={feature.title} span={{ base: 12, sm: 6, md: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    viewport={{ once: true }}
                    style={{ height: '100%' }}
                  >
                    <GlassCard style={{ height: '100%' }} hover>
                      <Stack gap="md">
                        <ThemeIcon
                          size={50}
                          radius="md"
                          variant="gradient"
                          gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                        >
                          <feature.icon size={26} />
                        </ThemeIcon>
                        <Text size="lg" fw={600}>
                          {feature.title}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {feature.description}
                        </Text>
                      </Stack>
                    </GlassCard>
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Container>

        {/* Stats Section */}
        <Container size="lg" py={60}>
          <GlassCard>
            <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="xl">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Stack align="center" gap="xs">
                    <Text
                      size="xl"
                      fw={700}
                      variant="gradient"
                      gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                      style={{ fontSize: '2.5rem' }}
                    >
                      {stat.value}
                    </Text>
                    <Text size="sm" c="dimmed" tt="uppercase">
                      {stat.label}
                    </Text>
                  </Stack>
                </motion.div>
              ))}
            </SimpleGrid>
          </GlassCard>
        </Container>

        {/* CTA Section */}
        <Container size="md" py={80}>
          <GlassCard>
            <Stack align="center" gap="xl" py="xl">
              <ThemeIcon
                size={80}
                radius="xl"
                variant="gradient"
                gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
              >
                <IconRocket size={40} />
              </ThemeIcon>
              <Title order={2} ta="center" size={36}>
                Ready to transform your classroom?
              </Title>
              <Text size="lg" c="dimmed" ta="center" maw={500}>
                Join thousands of educators and students already using ProjectSphere
                to collaborate and succeed.
              </Text>
              <Group gap="md">
                <Button
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
                  radius="xl"
                  onClick={() => navigate('/register')}
                >
                  Create Free Account
                </Button>
                <Button
                  size="lg"
                  variant="subtle"
                  color="gray"
                  radius="xl"
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
              </Group>
            </Stack>
          </GlassCard>
        </Container>

        {/* Footer */}
        <Box
          py="xl"
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            background: 'rgba(10, 10, 15, 0.5)',
          }}
        >
          <Container size="xl">
            <Group justify="space-between">
              <Logo size="sm" />
              <Text size="sm" c="dimmed">
                © 2024 ProjectSphere. All rights reserved.
              </Text>
            </Group>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default Landing;
