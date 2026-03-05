'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Send, RotateCcw, FileText, MapPin, Users, Building2,
  Newspaper, Landmark, MessageCircle,
} from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

interface ChatSource {
  source_type: string
  source_id: string
  title: string
  link: string
  score: number
  metadata: Record<string, unknown>
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  isStreaming?: boolean
}

interface LibraryChatProps {
  /** Optional document ID to scope questions to a single document */
  documentContext?: { id: string; title: string }
}

const SOURCE_ICONS: Record<string, typeof FileText> = {
  kb_document: FileText,
  service: MapPin,
  organization: Building2,
  content: Newspaper,
  official: Landmark,
}

const SOURCE_LABELS: Record<string, string> = {
  kb_document: 'Library',
  service: 'Service',
  organization: 'Organization',
  content: 'Content',
  official: 'Official',
}

const CHANCE_WELCOME = "Hi there! I'm Chance, your neighborhood guide to Houston's resources and community information. Ask me anything about services, organizations, elected officials, community research, and more."

const STARTER_QUESTIONS = [
  'What community resources are available in Houston?',
  'Who are my elected officials?',
  'What health services are nearby?',
  'What programs support youth development?',
]

export function LibraryChat({ documentContext }: LibraryChatProps) {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const docParam = searchParams.get('doc')

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(function () {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Pre-load document context from URL param
  useEffect(function () {
    if (docParam && !documentContext && messages.length === 0) {
      handleSend(`Tell me about document ${docParam}`)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docParam])

  const handleSend = useCallback(async function (messageText?: string) {
    const text = (messageText || input).trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = { role: 'user', content: text }
    setMessages(function (prev) { return [...prev, userMessage] })
    setInput('')
    setIsLoading(true)

    // Add placeholder streaming message
    const streamingMsg: ChatMessage = { role: 'assistant', content: '', isStreaming: true }
    setMessages(function (prev) { return [...prev, streamingMsg] })

    try {
      const res = await fetch('/api/library/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: documentContext
            ? `Regarding the document "${documentContext.title}": ${text}`
            : text,
          session_id: sessionId,
          stream: true,
        }),
      })

      if (!res.ok) throw new Error(`Chat failed: ${res.status}`)

      const contentType = res.headers.get('content-type') || ''

      if (contentType.includes('text/event-stream') && res.body) {
        // Handle SSE streaming
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let accText = ''
        let sources: ChatSource[] = []

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const jsonStr = line.slice(6).trim()

            try {
              const event = JSON.parse(jsonStr)

              if (event.type === 'session') {
                if (event.session_id) setSessionId(event.session_id)
              } else if (event.type === 'text_delta') {
                accText += event.text
                setMessages(function (prev) {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: accText, isStreaming: true }
                  }
                  return updated
                })
              } else if (event.type === 'sources') {
                sources = event.sources || []
              } else if (event.type === 'done') {
                setMessages(function (prev) {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, content: accText, sources, isStreaming: false }
                  }
                  return updated
                })
              } else if (event.type === 'error') {
                setMessages(function (prev) {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = {
                      ...last,
                      content: accText || "I'm sorry, something went wrong. Please try again.",
                      isStreaming: false,
                    }
                  }
                  return updated
                })
              }
            } catch { /* skip malformed events */ }
          }
        }

        // Ensure streaming is marked done
        setMessages(function (prev) {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last && last.isStreaming) {
            updated[updated.length - 1] = { ...last, sources, isStreaming: false }
          }
          return updated
        })
      } else {
        // Non-streaming JSON fallback
        const data = await res.json()
        if (data.session_id) setSessionId(data.session_id)

        setMessages(function (prev) {
          const updated = [...prev]
          updated[updated.length - 1] = {
            role: 'assistant',
            content: data.message || "I'm sorry, something went wrong.",
            sources: data.sources,
          }
          return updated
        })
      }
    } catch {
      setMessages(function (prev) {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last && last.role === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            content: "I'm sorry, something went wrong. Please try again.",
            isStreaming: false,
          }
        }
        return updated
      })
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, sessionId, documentContext])

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

  // Dedupe sources by source_id
  function dedupeSourcesByType(sources: ChatSource[]): ChatSource[] {
    const seen = new Map<string, ChatSource>()
    for (const s of sources) {
      const key = `${s.source_type}:${s.source_id}`
      if (!seen.has(key)) seen.set(key, s)
    }
    return Array.from(seen.values()).slice(0, 6)
  }

  return (
    <div className="flex flex-col h-[650px] max-h-[85vh] bg-white rounded-xl border border-brand-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between bg-gradient-to-r from-brand-accent/5 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center">
            <MessageCircle size={16} className="text-brand-accent" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-brand-text text-sm">
              {documentContext ? t('library.ask_about_doc') : t('chat.title')}
            </h2>
            <p className="text-[11px] text-brand-muted">{t('chat.subtitle')}</p>
          </div>
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
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-14 h-14 rounded-full bg-brand-accent/10 flex items-center justify-center mb-4">
              <MessageCircle size={24} className="text-brand-accent" />
            </div>
            <p className="text-brand-text font-serif text-lg font-bold mb-2">
              {t('chat.welcome_title')}
            </p>
            <p className="text-brand-muted text-sm mb-6 max-w-md leading-relaxed">
              {CHANCE_WELCOME}
            </p>
            {!documentContext && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {STARTER_QUESTIONS.map(function (q) {
                  return (
                    <button
                      key={q}
                      onClick={function () { handleSend(q) }}
                      className="text-left text-sm px-3 py-2.5 rounded-lg border border-brand-border hover:border-brand-accent hover:bg-brand-accent/5 text-brand-muted hover:text-brand-text transition-colors"
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

                  {/* Streaming cursor */}
                  {msg.isStreaming && (
                    <span className="inline-block w-1.5 h-4 bg-brand-accent/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
                  )}

                  {/* Source citations as cards */}
                  {msg.sources && msg.sources.length > 0 && !msg.isStreaming && (
                    <div className="mt-3 pt-3 border-t border-brand-border/50">
                      <p className="text-[11px] font-semibold text-brand-muted mb-2">
                        {t('library.sources')}:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {dedupeSourcesByType(msg.sources).map(function (source) {
                          const Icon = SOURCE_ICONS[source.source_type] || FileText
                          const label = SOURCE_LABELS[source.source_type] || source.source_type
                          return (
                            <Link
                              key={source.source_type + ':' + source.source_id}
                              href={source.link}
                              className="flex items-start gap-2 px-2.5 py-2 rounded-lg border border-brand-border/50 hover:border-brand-accent/40 hover:bg-brand-accent/5 transition-colors group"
                            >
                              <Icon size={13} className="text-brand-muted group-hover:text-brand-accent mt-0.5 flex-shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-brand-text truncate group-hover:text-brand-accent">
                                  {source.title}
                                </p>
                                <p className="text-[10px] text-brand-muted">{label}</p>
                              </div>
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

        {/* Loading indicator (only when waiting for first token) */}
        {isLoading && messages.length > 0 && messages[messages.length - 1]?.role === 'assistant' && messages[messages.length - 1]?.content === '' && (
          <div className="flex justify-start">
            <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-brand-accent/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-brand-accent/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-brand-accent/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-[11px] text-brand-muted italic">Chance is thinking...</span>
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
            placeholder={t('chat.placeholder')}
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
