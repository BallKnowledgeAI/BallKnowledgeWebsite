import type { Metadata } from 'next'
import { HomeExperience } from '@/components/home/home-experience'

export const metadata: Metadata = {
  title: 'BallKnowledge - Matchday',
  description: 'Walk out of the tunnel onto a live pitch and read the match the way the Ball Knowledge model does.',
}

export default function MatchdayPage() {
  return <HomeExperience />
}
