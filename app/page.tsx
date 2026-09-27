import type { Metadata } from 'next'
import { HomeExperience } from '@/components/home/home-experience'

export const metadata: Metadata = {
  title: 'BallKnowledge — The Game, Decoded',
  description:
    'Step onto a live digital pitch and experience real-time football intelligence, tactical cues, and match analysis from BallKnowledge.',
}

export default function HomePage() {
  return <HomeExperience />
}
