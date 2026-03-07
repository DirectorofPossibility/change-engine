import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { Landmark, Clock3, Vote, Compass } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Civic Quizzes — Community Exchange',
  description: 'How well do you know your city? Short quizzes. Free. Actually interesting.',
}

const QUIZ_TYPES = [
  {
    title: 'Know Your Government',
    description: 'Who does what at city, county, state, and federal levels.',
    icon: Landmark,
    color: '#3182ce',
  },
  {
    title: 'Houston History',
    description: 'The people, places, and moments that shaped this city.',
    icon: Clock3,
    color: '#d69e2e',
  },
  {
    title: 'Voting & Elections',
    description: 'Your rights, the process, and how it all works.',
    icon: Vote,
    color: '#38a169',
  },
  {
    title: 'Civic Superpower',
    description: 'What kind of civic person are you? Find out.',
    icon: Compass,
    color: '#805ad5',
  },
]

export default function QuizzesPage() {
  return (
    <div>
      <Breadcrumb items={[{ label: 'Quizzes' }]} />

      {/* Hero */}
      <section className="max-w-[800px] mx-auto px-4 sm:px-8 pt-16 pb-12 text-center border-b-2 border-brand-border">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-5">
          You know more than you think. Let&apos;s find out.
        </p>
        <h1 className="font-serif text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.1] text-brand-text mb-5">
          How well do you know your city?
        </h1>
        <p className="text-lg leading-relaxed text-brand-muted max-w-[560px] mx-auto mb-8">
          Short quizzes. Free. Actually interesting.
        </p>
        <p className="text-base leading-relaxed text-brand-muted max-w-[560px] mx-auto">
          Civic engagement starts with civic knowledge. And the best way to learn is to test yourself.
          <br /><br />
          Pick a quiz. Take five minutes. Walk away knowing something you didn&apos;t before.
        </p>
      </section>

      {/* Quiz Types */}
      <section className="max-w-[800px] mx-auto px-4 sm:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {QUIZ_TYPES.map(function (quiz) {
            const Icon = quiz.icon
            return (
              <div
                key={quiz.title}
                className="border-2 border-brand-border rounded-lg overflow-hidden bg-white"
                style={{ boxShadow: '3px 3px 0 #E2DDD5' }}
              >
                <div className="h-1.5" style={{ backgroundColor: quiz.color }} />
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: quiz.color + '15' }}
                    >
                      <Icon size={20} style={{ color: quiz.color }} />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-brand-text">{quiz.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-brand-muted">{quiz.description}</p>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-10">
          <span className="inline-flex items-center gap-2 bg-brand-bg border-2 border-brand-border rounded-lg px-5 py-3 text-sm text-brand-muted">
            <span className="w-2 h-2 rounded-full bg-brand-accent animate-pulse" />
            Quizzes launching soon. Check back.
          </span>
        </div>
      </section>
    </div>
  )
}
