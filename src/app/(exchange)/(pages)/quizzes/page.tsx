import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumb } from '@/components/exchange/Breadcrumb'
import { IndexPageHero } from '@/components/exchange/IndexPageHero'
import { IndexWayfinder } from '@/components/exchange/IndexWayfinder'
import { Landmark, Clock3, Vote, Compass, BookOpen, Search } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Civic Quizzes — Community Exchange',
  description: 'How well do you know your city? Short quizzes on government, history, voting, and civic engagement. Free. Actually interesting.',
}

const QUIZ_TYPES = [
  {
    title: 'Know Your Government',
    description: 'Who does what at city, county, state, and federal levels. Test your knowledge of the structures that shape daily life in Houston.',
    icon: Landmark,
    color: '#3182ce',
    questions: 15,
    minutes: 5,
  },
  {
    title: 'Houston History',
    description: 'The people, places, and moments that shaped this city. From founding to flood recovery, how much do you know?',
    icon: Clock3,
    color: '#d69e2e',
    questions: 12,
    minutes: 4,
  },
  {
    title: 'Voting and Elections',
    description: 'Your rights, the process, and how it all works. From registration deadlines to ballot structure, see where you stand.',
    icon: Vote,
    color: '#38a169',
    questions: 10,
    minutes: 3,
  },
  {
    title: 'Civic Superpower',
    description: 'What kind of civic person are you? Answer a few questions to discover your strengths and where your energy can make the most impact.',
    icon: Compass,
    color: '#805ad5',
    questions: 8,
    minutes: 3,
  },
]

export default function QuizzesPage() {
  return (
    <div>
      <IndexPageHero
        color="#d69e2e"
        pattern="seed"
        title="How Well Do You Know Your City?"
        subtitle="Short quizzes. Free. Actually interesting."
        intro="Civic engagement starts with civic knowledge. Pick a quiz. Take five minutes. Walk away knowing something you did not know before."
        stats={[
          { value: '4', label: 'Quizzes' },
          { value: '45', label: 'Questions' },
          { value: '~15 min', label: 'Total Time' },
        ]}
      />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Quizzes' }]} />

        <div className="flex flex-col lg:flex-row gap-8 mt-4">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Section label */}
            <div className="mb-6">
              <p className="text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted">
                Available Quizzes
              </p>
            </div>

            {/* Quiz Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {QUIZ_TYPES.map(function (quiz) {
                const Icon = quiz.icon
                return (
                  <div
                    key={quiz.title}
                    className="relative border-2 border-brand-border rounded-[0.75rem] overflow-hidden bg-white"
                    style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
                  >
                    <div className="flex">
                      <div className="w-1.5 flex-shrink-0" style={{ backgroundColor: quiz.color }} />
                      <div className="p-5 flex-1">
                        {/* Coming Soon badge */}
                        <div className="flex items-center justify-between mb-3">
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: quiz.color + '15' }}
                          >
                            <Icon size={20} style={{ color: quiz.color }} />
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 border-2 border-brand-border rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider text-brand-muted bg-brand-bg">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse" />
                            Coming Soon
                          </span>
                        </div>

                        <h3 className="font-serif text-lg font-bold text-brand-text mb-2">
                          {quiz.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-brand-muted mb-4">
                          {quiz.description}
                        </p>

                        {/* Meta info */}
                        <div className="flex items-center gap-4 text-[11px] font-mono text-brand-muted-light">
                          <span>{quiz.questions} questions</span>
                          <span className="w-1 h-1 rounded-full bg-brand-border" />
                          <span>~{quiz.minutes} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Status note */}
            <div className="mt-8 border-2 border-brand-border rounded-[0.75rem] bg-brand-bg p-5">
              <p className="text-sm leading-relaxed text-brand-muted">
                Quizzes are being developed with input from civic educators, local historians,
                and community partners. Each quiz will include sources and further reading so
                every question becomes a doorway to deeper understanding.
              </p>
            </div>

            {/* Explore Instead CTA */}
            <div className="mt-10 border-t-2 border-brand-border pt-8">
              <h2 className="font-serif text-2xl font-bold text-brand-text mb-2">
                Start Learning Now
              </h2>
              <p className="text-sm leading-relaxed text-brand-muted max-w-2xl mb-6">
                While quizzes are on the way, you can explore civic knowledge through the
                Knowledge Graph and Library today.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  href="/knowledge-graph"
                  className="group border-2 border-brand-border rounded-[0.75rem] bg-white p-5 hover:translate-y-[-2px] transition-all duration-200"
                  style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-brand-bg">
                      <Search size={18} className="text-brand-accent" />
                    </div>
                    <h3 className="font-serif text-base font-bold text-brand-text group-hover:text-brand-accent transition-colors">
                      Knowledge Graph
                    </h3>
                  </div>
                  <p className="text-[12px] leading-relaxed text-brand-muted">
                    Explore the connections between officials, policies, organizations, and the issues that matter to you.
                  </p>
                </Link>

                <Link
                  href="/library"
                  className="group border-2 border-brand-border rounded-[0.75rem] bg-white p-5 hover:translate-y-[-2px] transition-all duration-200"
                  style={{ boxShadow: '3px 3px 0 #D5D0C8' }}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-brand-bg">
                      <BookOpen size={18} className="text-brand-accent" />
                    </div>
                    <h3 className="font-serif text-base font-bold text-brand-text group-hover:text-brand-accent transition-colors">
                      Library
                    </h3>
                  </div>
                  <p className="text-[12px] leading-relaxed text-brand-muted">
                    Curated explainers, guides, and reference documents on civic topics written at an accessible reading level.
                  </p>
                </Link>
              </div>
            </div>
          </div>

          {/* Wayfinder sidebar */}
          <div className="hidden lg:block lg:w-[280px] flex-shrink-0">
            <div className="sticky top-24">
              <IndexWayfinder
                currentPage="quizzes"
                color="#d69e2e"
                related={[
                  { label: 'Knowledge Graph', href: '/knowledge-graph', color: '#d69e2e' },
                  { label: 'Library', href: '/library', color: '#3182ce' },
                  { label: 'Learning Paths', href: '/learning-paths', color: '#38a169' },
                  { label: 'Guides', href: '/guides', color: '#805ad5' },
                  { label: 'Glossary', href: '/glossary', color: '#C75B2A' },
                ]}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
