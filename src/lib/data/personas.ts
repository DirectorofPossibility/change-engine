/**
 * @fileoverview Persona definitions for onboarding.
 * Each persona helps new users find their entry point into the Change Engine.
 * matchedPathways are 0-indexed theme indices mapping to THEME_01–THEME_07.
 */

export interface Persona {
  id: string
  name: string
  question: string
  color: string
  matchedPathways: string[]  // theme IDs like THEME_01
  firstMove: string
  centers: string[]
}

function themeIndex(idx: number): string {
  return 'THEME_0' + (idx + 1)
}

export const PERSONAS: Persona[] = [
  {
    id: 'starter',
    name: 'Starter',
    question: 'Where do I even start?',
    color: '#4A6A8A',
    matchedPathways: [themeIndex(3), themeIndex(6)], // Voice, Bigger We
    firstMove: 'Start with Voice — voter registration and community events are the quickest on-ramp. Then explore The Bigger We for connection.',
    centers: ['Learning', 'Resource'],
  },
  {
    id: 'hard-worker',
    name: 'Hard Worker',
    question: 'I need resources and I want to give back.',
    color: '#7A6E8A',
    matchedPathways: [themeIndex(4), themeIndex(0), themeIndex(1)], // Money, Health, Families
    firstMove: 'Money and Health have the most direct resources. Families offers volunteer opportunities where your experience helps others.',
    centers: ['Resource', 'Action'],
  },
  {
    id: 'next-steps',
    name: 'Next Steps',
    question: 'I just finished something. What now?',
    color: '#A85C3B',
    matchedPathways: [themeIndex(3), themeIndex(2)], // Voice, Neighborhood
    firstMove: 'Voice connects your experience to civic action. Neighborhood shows where local change is happening that you can join.',
    centers: ['Action', 'Learning'],
  },
  {
    id: 'looking',
    name: 'Looking for Answers',
    question: 'Who is in charge? And why?',
    color: '#8B7D3C',
    matchedPathways: [themeIndex(3), themeIndex(2), themeIndex(4)], // Voice, Neighborhood, Money
    firstMove: 'Voice maps the power structure. Neighborhood and Money show where those decisions land in your daily life.',
    centers: ['Accountability', 'Learning'],
  },
  {
    id: 'spark',
    name: 'Spark Plug',
    question: '5 minutes. What can I do?',
    color: '#4A6B52',
    matchedPathways: [themeIndex(3), themeIndex(6)], // Voice, Bigger We
    firstMove: 'Register to vote (2 min). Sign up for a bridge-building conversation (3 min). You are already making a difference.',
    centers: ['Action'],
  },
  {
    id: 'bridge',
    name: 'Bridge Builder',
    question: 'How do we stop talking past each other?',
    color: '#3D7A7A',
    matchedPathways: [themeIndex(6), themeIndex(3), themeIndex(1)], // Bigger We, Voice, Families
    firstMove: 'The Bigger We is your home base. Voice and Families are where bridging skills matter most right now.',
    centers: ['Action', 'Learning'],
  },
  {
    id: 'scout',
    name: 'Scout',
    question: 'I care about everything. Where do I focus?',
    color: '#C65D28',
    matchedPathways: [themeIndex(6), themeIndex(0), themeIndex(5)], // Bigger We, Health, Planet
    firstMove: 'Start at The Bigger We — it connects to every pathway. Then follow the bridges to Health and Planet.',
    centers: ['Learning', 'Action', 'Resource'],
  },
]
