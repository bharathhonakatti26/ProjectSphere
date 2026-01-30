import { notifications } from '@mantine/notifications';
import { IconCheck, IconX, IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';

const defaultOptions = {
  position: 'top-right',
  autoClose: 4000,
  withCloseButton: true,
  withBorder: true,
  radius: 'md',
  styles: {
    root: {
      background: 'rgba(26, 27, 30, 0.95)',
      backdropFilter: 'blur(10px)',
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
};

export const showSuccess = (message, title = 'Success') => {
  notifications.show({
    ...defaultOptions,
    title,
    message,
    color: 'green',
    icon: <IconCheck size={18} />,
  });
};

export const showError = (message, title = 'Error') => {
  notifications.show({
    ...defaultOptions,
    title,
    message,
    color: 'red',
    icon: <IconX size={18} />,
    autoClose: 6000,
  });
};

export const showWarning = (message, title = 'Warning') => {
  notifications.show({
    ...defaultOptions,
    title,
    message,
    color: 'yellow',
    icon: <IconAlertTriangle size={18} />,
  });
};

export const showInfo = (message, title = 'Info') => {
  notifications.show({
    ...defaultOptions,
    title,
    message,
    color: 'blue',
    icon: <IconInfoCircle size={18} />,
  });
};

// For API error handling
export const showApiError = (error) => {
  const message = error?.response?.data?.message || error?.message || 'Something went wrong';
  showError(message);
};

export default {
  success: showSuccess,
  error: showError,
  warning: showWarning,
  info: showInfo,
  apiError: showApiError,
};
