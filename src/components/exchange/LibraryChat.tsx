'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { Send, BookOpen, RotateCcw, FileText } from 'lucide-react'
import { useTranslation } from '@/lib/i18n'

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: { document_id: string; title: string; page: number | null }[]
}

interface LibraryChatProps {
  /** Optional document ID to scope questions to a single document */
  documentContext?: { id: string; title: string }
}

const STARTER_QUESTIONS = [
  'What community resources are available in Houston?',
  'What are the key findings from recent community assessments?',
  'How is Houston addressing housing accessibility?',
  'What programs support youth development in the city?',
]

export function LibraryChat({ documentContext }: LibraryChatProps) {
  const { t } = useTranslation()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(function () {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(messageText?: string) {
    const text = (messageText || input).trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    setMessages(function (prev) { return [...prev, userMessage] })
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/library/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: documentContext
            ? `Regarding the document "${documentContext.title}": ${text}`
            : text,
          session_id: sessionId,
        }),
      })

      if (!res.ok) throw new Error(`Chat failed: ${res.status}`)
      const data = await res.json()

      if (data.error) {
        setMessages(function (prev) {
          return [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]
        })
      } else {
        if (data.session_id) setSessionId(data.session_id)
        setMessages(function (prev) {
          return [...prev, {
            role: 'assistant',
            content: data.message,
            sources: data.sources,
          }]
        })
      }
    } catch {
      setMessages(function (prev) {
        return [...prev, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }]
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleNewConversation() {
    setMessages([])
    setSessionId(null)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-[600px] max-h-[80vh] bg-white rounded-xl border border-brand-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen size={18} className="text-brand-accent" />
          <h2 className="font-serif font-bold text-brand-text">
            {documentContext ? t('library.ask_about_doc') : t('library.chat_title')}
          </h2>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 text-xs text-brand-muted hover:text-brand-accent transition-colors"
          >
            <RotateCcw size={13} />
            {t('library.new_conversation')}
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen size={40} className="text-brand-muted/40 mb-4" />
            <p className="text-brand-muted font-serif italic mb-6">
              {t('library.chat_welcome')}
            </p>
            {!documentContext && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-md">
                {STARTER_QUESTIONS.map(function (q) {
                  return (
                    <button
                      key={q}
                      onClick={function () { handleSend(q) }}
                      className="text-left text-sm px-3 py-2 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-brand-accent/5 text-brand-muted hover:text-brand-text transition-colors"
                    >
                      {q}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          messages.map(function (msg, i) {
            return (
              <div
                key={i}
                className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}
              >
                <div
                  className={
                    msg.role === 'user'
                      ? 'max-w-[80%] bg-brand-accent text-white rounded-2xl rounded-br-md px-4 py-3 text-sm'
                      : 'max-w-[85%] bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3 text-sm text-brand-text'
                  }
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                  {/* Source citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-brand-border/50">
                      <p className="text-[11px] font-semibold text-brand-muted mb-1">
                        {t('library.sources')}:
                      </p>
                      <div className="space-y-1">
                        {Array.from(
                          new Map(msg.sources.map(s => [s.document_id, s])).values()
                        ).map(function (source) {
                          return (
                            <Link
                              key={source.document_id}
                              href={'/library/' + source.document_id}
                              className="flex items-center gap-1.5 text-[11px] text-brand-accent hover:underline"
                            >
                              <FileText size={11} />
                              {source.title}
                              {source.page && <span className="text-brand-muted">(p. {source.page})</span>}
                            </Link>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-brand-muted/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-brand-muted/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-brand-muted/40 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-brand-border bg-gray-50/50">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={function (e) { setInput(e.target.value) }}
            onKeyDown={handleKeyDown}
            placeholder={t('library.chat_placeholder')}
            rows={1}
            className="flex-1 resize-none text-sm px-4 py-2.5 border border-brand-border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent/40 focus:border-brand-accent placeholder:text-brand-muted/60"
          />
          <button
            onClick={function () { handleSend() }}
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-xl bg-brand-accent text-white disabled:opacity-40 hover:opacity-90 transition-opacity flex-shrink-0"
            aria-label="Send message"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
