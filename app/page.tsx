import { Metadata } from 'next'
// Production homepage

export const metadata: Metadata = {
  title: 'Planning Radar | Track Every UK Planning Application',
  description: 'Get ahead with real-time UK planning application intelligence.',
}

export default function Home() {
  return (
    <div>
      <h1>Planning Radar - LIVE!</h1>
      <p>Deployment successful.</p>
    </div>
  )
}