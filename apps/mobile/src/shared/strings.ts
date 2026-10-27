// Every user-facing string lives here (ADR-0002: English only, no i18n library in v1).
export const strings = {
  appName: 'Maintenance Tracker',
  health: {
    title: 'API status',
    checking: 'Checking…',
    ok: 'Connected',
    unreachable: 'Unreachable',
    retry: 'Check again',
  },
  errors: {
    network: 'You appear to be offline. Check your connection and try again.',
    unexpected: 'Something went wrong. Please try again.',
  },
} as const;
