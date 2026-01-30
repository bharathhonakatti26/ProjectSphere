import { Stack, Text, ThemeIcon } from '@mantine/core';
import { motion } from 'framer-motion';
import { IconFolderOff, IconUsers, IconMessage, IconSchool, IconInbox } from '@tabler/icons-react';

const icons = {
  folder: IconFolderOff,
  users: IconUsers,
  message: IconMessage,
  classroom: IconSchool,
  inbox: IconInbox,
};

const EmptyState = ({
  icon = 'folder',
  title = 'No items found',
  description = 'There are no items to display at the moment.',
  action,
}) => {
  const Icon = icons[icon] || icons.folder;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Stack align="center" gap="md" py="xl">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <ThemeIcon
            size={80}
            radius="xl"
            variant="light"
            color="gray"
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
            }}
          >
            <Icon size={40} stroke={1.5} />
          </ThemeIcon>
        </motion.div>

        <Stack align="center" gap="xs">
          <Text size="lg" fw={600} c="dimmed">
            {title}
          </Text>
          <Text size="sm" c="dimmed" ta="center" maw={300}>
            {description}
          </Text>
        </Stack>

        {action && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {action}
          </motion.div>
        )}
      </Stack>
    </motion.div>
  );
};

export default EmptyState;
