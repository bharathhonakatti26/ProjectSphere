import { createTheme } from '@mantine/core';

export const theme = createTheme({
  primaryColor: 'violet',
  primaryShade: { light: 6, dark: 7 },
  
  colors: {
    // Custom violet/purple palette
    violet: [
      '#f3e8ff',
      '#e4ccff',
      '#d4a5ff',
      '#c77dff',
      '#b850ff',
      '#a020f0',
      '#8b17d9',
      '#7613b8',
      '#610f97',
      '#4c0c76',
    ],
    // Custom dark palette for dark theme
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
    // Accent color
    cyan: [
      '#e0fcff',
      '#bef8fd',
      '#87eef8',
      '#54e1f2',
      '#2cd4e9',
      '#18c7d4',
      '#0fb5c3',
      '#089bab',
      '#047f8e',
      '#016571',
    ],
  },

  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  fontFamilyMonospace: 'JetBrains Mono, Monaco, Courier, monospace',
  
  headings: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
    fontWeight: '700',
  },

  defaultRadius: 'md',
  
  shadows: {
    md: '0 4px 8px rgba(0, 0, 0, 0.3)',
    xl: '0 20px 40px rgba(0, 0, 0, 0.4)',
  },

  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
      styles: {
        root: {
          fontWeight: 600,
        },
      },
    },
    Card: {
      defaultProps: {
        shadow: 'md',
        radius: 'lg',
      },
    },
    Paper: {
      defaultProps: {
        radius: 'lg',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
      },
    },
    PasswordInput: {
      defaultProps: {
        size: 'md',
      },
    },
    Select: {
      defaultProps: {
        size: 'md',
      },
    },
    Modal: {
      defaultProps: {
        radius: 'lg',
        centered: true,
      },
    },
    Notification: {
      defaultProps: {
        radius: 'md',
      },
    },
  },
});
