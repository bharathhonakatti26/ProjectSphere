import { Box, Container, Grid, Stack, Title, Text } from '@mantine/core';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParticleBackground } from '../components/3d';
import { Logo } from '../components/common';

const AuthLayout = () => {
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
      {/* 3D Background */}
      <ParticleBackground />

      {/* Content */}
      <Box style={{ position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex' }}>
        {/* Left Side - Branding - Desktop only */}
        <Box
          display={{ base: 'none', md: 'block' }}
          style={{ 
            width: '42%', 
            padding: '60px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Logo size="30"/>
            <Stack gap="xl" mt="xl">
              
              <Stack gap="md">
                <Title
                  order={2}
                  size={36}
                  fw={700}
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #8B5CF6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Collaborate.
                  <br />
                  Create.
                  <br />
                  Succeed.
                </Title>
                <Text size="lg" c="dimmed">
                  The ultimate platform for classroom project collaboration
                  and evaluation. Connect teachers and students like never before.
                </Text>
              </Stack>

              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  ✓ Real-time team collaboration
                </Text>
                <Text size="sm" c="dimmed">
                  ✓ Comprehensive evaluation system
                </Text>
                <Text size="sm" c="dimmed">
                  ✓ Multiple project workflows
                </Text>
                <Text size="sm" c="dimmed">
                  ✓ Role-based access control
                </Text>
              </Stack>
            </Stack>
          </motion.div>
        </Box>

        {/* Right Side - Form - Desktop */}
        <Box
          display={{ base: 'none', md: 'flex' }}
          style={{
            marginLeft: 'auto',
            width: '58%',
            alignItems: 'flex-start',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.02)',
            backdropFilter: 'blur(10px)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '40px',
            paddingBottom: '20px',
            paddingLeft: '16px',
            paddingRight: '16px',
            minHeight: '100vh',
          }}
        >
          <Container 
            size="xs" 
            p={0}
            style={{ width: '100%', maxWidth: '400px' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </Container>
        </Box>

        {/* Mobile View */}
        <Box
          display={{ base: 'flex', md: 'none' }}
          style={{
            width: '100%',
            alignItems: 'flex-start',
            justifyContent: 'center',
            paddingTop: '40px',
            paddingBottom: '20px',
            paddingLeft: '16px',
            paddingRight: '16px',
            minHeight: '100vh',
          }}
        >
          <Container 
            size="xs" 
            p={0}
            style={{ width: '100%', maxWidth: '400px' }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Box mb="sm" ta="center">
                <Logo size="sm" />
              </Box>
              <Outlet />
            </motion.div>
          </Container>
        </Box>
      </Box>
    </Box>
  );
};

export default AuthLayout;
