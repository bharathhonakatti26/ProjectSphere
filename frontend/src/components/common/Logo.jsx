import { Group, Text, Box } from '@mantine/core';
import { motion } from 'framer-motion';

const Logo = ({ size = 'md', showText = true, animated = true }) => {
  const sizes = {
    sm: { icon: 24, text: 'md' },
    md: { icon: 32, text: 'xl' },
    lg: { icon: 48, text: 32 },
    xl: { icon: 64, text: 42 },
  };

  const currentSize = sizes[size] || sizes.md;

  const LogoIcon = () => (
    <svg
      width={currentSize.icon}
      height={currentSize.icon}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon */}
      <motion.path
        d="M32 4L56 18V46L32 60L8 46V18L32 4Z"
        stroke="url(#gradient1)"
        strokeWidth="2"
        fill="none"
        initial={animated ? { pathLength: 0 } : { pathLength: 1 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeInOut' }}
      />
      {/* Inner sphere/circle */}
      <motion.circle
        cx="32"
        cy="32"
        r="16"
        stroke="url(#gradient2)"
        strokeWidth="2"
        fill="rgba(139, 92, 246, 0.1)"
        initial={animated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
      />
      {/* Orbit ring */}
      <motion.ellipse
        cx="32"
        cy="32"
        rx="22"
        ry="8"
        stroke="url(#gradient3)"
        strokeWidth="1.5"
        fill="none"
        transform="rotate(-30 32 32)"
        initial={animated ? { opacity: 0 } : { opacity: 1 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 1 }}
      />
      {/* Connection dots */}
      <motion.circle
        cx="18"
        cy="24"
        r="3"
        fill="#8B5CF6"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.2 }}
      />
      <motion.circle
        cx="46"
        cy="24"
        r="3"
        fill="#06B6D4"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.3 }}
      />
      <motion.circle
        cx="32"
        cy="48"
        r="3"
        fill="#8B5CF6"
        initial={animated ? { scale: 0 } : { scale: 1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 1.4 }}
      />
      {/* Gradients */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.3" />
          <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );

  const Wrapper = animated ? motion.div : 'div';
  const wrapperProps = animated
    ? {
        whileHover: { scale: 1.05 },
        whileTap: { scale: 0.95 },
      }
    : {};

  return (
    <Wrapper {...wrapperProps}>
      <Group gap="xs" align="center">
        <Box>
          <LogoIcon />
        </Box>
        {showText && (
          <Text
            size={currentSize.text}
            fw={700}
            variant="gradient"
            gradient={{ from: 'violet', to: 'cyan', deg: 45 }}
            style={{ letterSpacing: '-0.02em' }}
          >
            ProjectSphere
          </Text>
        )}
      </Group>
    </Wrapper>
  );
};

export default Logo;
