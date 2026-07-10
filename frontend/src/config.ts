export const QUALITY_THRESHOLDS = {
  LATENCY_GOOD: 100,
  LATENCY_UNSTABLE: 300,
  LOSS_UNSTABLE: 5,
  LOSS_POOR: 15,
  CHECK_INTERVAL: 5000,
} as const;

export const QUALITY_MESSAGES = {
  good: 'Good',
  unstable: 'Unstable connection',
  poor: 'Poor connection. Try turning off your camera.',
} as const;
