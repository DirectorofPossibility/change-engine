export const THEMES = {
  THEME_01: { name: 'Our Health', color: '#e53e3e', slug: 'our-health', emoji: '🏥' },
  THEME_02: { name: 'Our Families', color: '#dd6b20', slug: 'our-families', emoji: '👨‍👩‍👧‍👦' },
  THEME_03: { name: 'Our Neighborhood', color: '#d69e2e', slug: 'our-neighborhood', emoji: '🏘️' },
  THEME_04: { name: 'Our Voice', color: '#38a169', slug: 'our-voice', emoji: '📢' },
  THEME_05: { name: 'Our Money', color: '#3182ce', slug: 'our-money', emoji: '💰' },
  THEME_06: { name: 'Our Planet', color: '#319795', slug: 'our-planet', emoji: '🌍' },
  THEME_07: { name: 'The Bigger We', color: '#805ad5', slug: 'the-bigger-we', emoji: '🤝' },
} as const;

export const CENTERS: Record<string, { question: string; emoji: string; slug: string }> = {
  Learning:       { question: 'How can I understand?', emoji: '📚', slug: 'learning' },
  Action:         { question: 'How can I help?', emoji: '✊', slug: 'action' },
  Resource:       { question: "What's available to me?", emoji: '📋', slug: 'resources' },
  Accountability: { question: 'Who makes decisions?', emoji: '🏛️', slug: 'accountability' },
};

export const BRAND = {
  name: 'The Change Engine',
  tagline: 'Community Life, Organized',
  background: '#F5F1EB',
  text: '#2C2C2C',
  accent: '#C75B2A',
  muted: '#8B7E74',
  border: '#E8E3DB',
  cardBg: '#FFFFFF',
  success: '#38a169',
  warning: '#d69e2e',
  danger: '#e53e3e',
} as const;

export const PERSONAS = [
  { id: 'starter', name: 'Starter', tagline: 'I want to get involved but don\'t know where to begin.' },
  { id: 'hard-worker', name: 'Hard Worker', tagline: 'I need resources and I want to give back.' },
  { id: 'next-steps', name: 'Next Steps', tagline: 'I\'m already active. What\'s next?' },
  { id: 'looking-for-answers', name: 'Looking for Answers', tagline: 'I have a specific question or need.' },
  { id: 'spark-plug', name: 'Spark Plug', tagline: 'I want to lead and organize.' },
  { id: 'bridge-builder', name: 'Bridge Builder', tagline: 'I want to connect across divides.' },
  { id: 'scout', name: 'Scout', tagline: 'I want to explore what\'s out there.' },
  { id: 'register', name: 'Register', tagline: 'I want to vote and participate in democracy.' },
] as const;
