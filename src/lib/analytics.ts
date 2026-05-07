import posthog from 'posthog-js';

export const initAnalytics = () => {
  if (typeof window === 'undefined') return;
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: 'https://app.posthog.com',
    capture_pageview: true,
    capture_pageleave: true,
    persistence: 'localStorage',
  });
};

export const track = (event: string, properties?: Record<string, any>) => {
  if (typeof window === 'undefined') return;
  posthog.capture(event, properties);
};
