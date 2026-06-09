export const tokens = {
  fonts: {
    display: 'var(--font-display)',
    body: 'var(--font-archivo)',
  },
  colors: {
    black: '#0A0A0A',
    white: '#FAFAFA',
    gray: {
      100: '#F5F5F5',
      200: '#E5E5E5',
      400: '#A3A3A3',
      600: '#525252',
      800: '#262626',
    },
    accent: '#E63946',
  },
  spacing: {
    xs: '4px', sm: '8px', md: '16px',
    lg: '24px', xl: '48px', xxl: '96px',
  },
  radius: {
    sm: '4px', md: '8px', lg: '16px', pill: '9999px',
  },
  transition: {
    fast: '150ms ease',
    base: '300ms ease',
    slow: '600ms ease',
  },
} as const
