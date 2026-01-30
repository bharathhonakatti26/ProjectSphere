import { Avatar as MantineAvatar, Tooltip } from '@mantine/core';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const getColorFromString = (str) => {
  const colors = [
    'violet',
    'cyan',
    'blue',
    'indigo',
    'grape',
    'pink',
    'teal',
    'green',
    'lime',
    'yellow',
    'orange',
    'red',
  ];
  let hash = 0;
  for (let i = 0; i < str?.length || 0; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const UserAvatar = ({
  user,
  size = 'md',
  showTooltip = true,
  radius = 'xl',
  ...props
}) => {
  const name = user?.name || user?.email || 'User';
  const initials = getInitials(name);
  const color = getColorFromString(user?._id || user?.email || name);

  const avatar = (
    <MantineAvatar
      src={user?.avatar}
      alt={name}
      radius={radius}
      size={size}
      color={color}
      variant="filled"
      style={{
        border: '2px solid rgba(139, 92, 246, 0.3)',
      }}
      {...props}
    >
      {initials}
    </MantineAvatar>
  );

  if (showTooltip) {
    return (
      <Tooltip label={name} position="top" withArrow>
        {avatar}
      </Tooltip>
    );
  }

  return avatar;
};

export default UserAvatar;
