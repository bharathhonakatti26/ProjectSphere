import { Paper, Group, Stack, Text, ThemeIcon, RingProgress } from '@mantine/core';
import { motion } from 'framer-motion';

const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'violet',
  percentage,
  trend,
  delay = 0,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
    >
      <Paper
        p="lg"
        radius="lg"
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
        }}
      >
        <Group justify="space-between" align="flex-start">
          <Stack gap="xs">
            <Text size="sm" c="dimmed" tt="uppercase" fw={500}>
              {title}
            </Text>
            <Group gap="xs" align="flex-end">
              <Text
                size="xl"
                fw={700}
                variant="gradient"
                gradient={{ from: color, to: 'cyan', deg: 45 }}
                style={{ fontSize: '2rem', lineHeight: 1 }}
              >
                {value}
              </Text>
              {trend && (
                <Text
                  size="sm"
                  c={trend > 0 ? 'green' : trend < 0 ? 'red' : 'dimmed'}
                  fw={500}
                >
                  {trend > 0 ? '+' : ''}{trend}%
                </Text>
              )}
            </Group>
            {subtitle && (
              <Text size="xs" c="dimmed">
                {subtitle}
              </Text>
            )}
          </Stack>

          {percentage !== undefined ? (
            <RingProgress
              size={60}
              thickness={5}
              roundCaps
              sections={[{ value: percentage, color }]}
              label={
                <Text size="xs" ta="center" fw={600}>
                  {percentage}%
                </Text>
              }
            />
          ) : Icon ? (
            <ThemeIcon
              size={48}
              radius="md"
              variant="light"
              color={color}
              style={{
                background: `rgba(139, 92, 246, 0.1)`,
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
            >
              <Icon size={24} stroke={1.5} />
            </ThemeIcon>
          ) : null}
        </Group>
      </Paper>
    </motion.div>
  );
};

export default StatsCard;
