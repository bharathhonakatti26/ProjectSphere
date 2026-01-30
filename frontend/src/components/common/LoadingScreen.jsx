import { Center, Loader, Stack, Text } from '@mantine/core';

const LoadingScreen = ({ message = 'Loading...' }) => {
  return (
    <Center h="100vh" bg="dark.9">
      <Stack align="center" gap="md">
        <Loader size="xl" color="violet" type="bars" />
        <Text c="dimmed" size="sm">
          {message}
        </Text>
      </Stack>
    </Center>
  );
};

export default LoadingScreen;
