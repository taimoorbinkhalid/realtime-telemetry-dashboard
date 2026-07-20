/** English UI strings. Keep user-visible text here rather than hardcoded. */
export default {
  app: {
    title: 'Telemetry Monitor',
    subtitle: 'Live device dashboard',
  },
  actions: {
    signIn: 'Sign in',
    signOut: 'Sign out',
    demoLogin: 'Demo login',
    retry: 'Retry',
    back: 'Back to dashboard',
    toggleTheme: 'Toggle light / dark theme',
  },
  login: {
    heading: 'Sign in to continue',
    email: 'Email',
    password: 'Password',
    demoHint: 'Exploring? Use one-click demo access — no sign-up needed.',
    invalid: 'Invalid email or password.',
    demoUnavailable: 'Demo login is not configured yet.',
  },
  dashboard: {
    heading: 'Devices',
    deviceCount: 'No devices | {count} device | {count} devices',
    empty: 'No devices are reporting yet.',
    emptyHint: 'Run the seeder to start streaming telemetry.',
    loadError: 'Could not load devices.',
  },
  device: {
    notFound: 'Device not found.',
    temperature: 'Temperature',
    humidity: 'Humidity',
    lastSeen: 'Last reading {time}',
    history: 'Recent readings',
    noReadings: 'No readings recorded yet.',
  },
  status: {
    online: 'Online',
    warning: 'Warning',
    offline: 'Offline',
  },
  units: {
    celsius: '°C',
    percent: '%',
  },
} as const
