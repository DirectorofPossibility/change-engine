'use client'

import { useState, useEffect } from 'react'
import { MessageCircle, X, Minus } from 'lucide-react'
import { LibraryChat } from './LibraryChat'

export function ChanceChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)

  // Lock body scroll when chat is open on mobile
  useEffect(function () {
    if (isOpen && !isMinimized) {
      const width = window.innerWidth
      if (width < 640) {
        document.body.style.overflow = 'hidden'
      }
    } else {
      document.body.style.overflow = ''
    }
    return function () { document.body.style.overflow = '' }
  }, [isOpen, isMinimized])

  function handleOpen() {
    setIsOpen(true)
    setIsMinimized(false)
    setHasOpened(true)
  }

  function handleClose() {
    setIsOpen(false)
    setIsMinimized(false)
  }

  function handleMinimize() {
    setIsMinimized(true)
  }

  // Floating button (hidden when chat is fully open)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 group"
        aria-label="Chat with Chance"
      >
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-brand-accent shadow-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
            <MessageCircle size={24} className="text-white" />
          </div>
          {/* Pulse ring */}
          {!hasOpened && (
            <span className="absolute inset-0 rounded-full bg-brand-accent/30 animate-ping" />
          )}
          {/* Label */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-brand-text text-white text-xs font-medium rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-md pointer-events-none">
            Chat with Chance
            <div className="absolute top-full right-4 w-2 h-2 bg-brand-text rotate-45 -mt-1" />
          </div>
        </div>
      </button>
    )
  }

  // Minimized bar
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50">
        <button
          onClick={function () { setIsMinimized(false) }}
          className="flex items-center gap-2 bg-brand-accent text-white px-4 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        >
          <MessageCircle size={16} />
          <span className="text-sm font-medium">Chance</span>
        </button>
      </div>
    )
  }

  // Full chat popup
  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="sm:hidden fixed inset-0 bg-black/40 z-50"
        onClick={handleClose}
      />

      {/* Chat window */}
      <div className="fixed z-50
        sm:bottom-6 sm:right-6 sm:w-[400px] sm:h-[600px] sm:max-h-[80vh]
        inset-0 sm:inset-auto
        flex flex-col
        bg-white sm:rounded-2xl sm:shadow-2xl sm:border sm:border-brand-border
        overflow-hidden
        animate-in sm:animate-none"
      >
        {/* Custom header with minimize/close */}
        <div className="px-4 py-3 border-b border-brand-border flex items-center justify-between bg-gradient-to-r from-brand-accent to-brand-accent/90 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <div>
              <h2 className="font-serif font-bold text-white text-sm">Chat with Chance</h2>
              <p className="text-[10px] text-white/70">Your neighborhood guide</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleMinimize}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors hidden sm:block"
              aria-label="Minimize"
            >
              <Minus size={16} />
            </button>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat content — reuse LibraryChat but remove its built-in header */}
        <div className="flex-1 min-h-0">
          <ChatContent />
        </div>
      </div>
    </>
  )
}

/**
 * Inline version of LibraryChat without the header — since we have our own.
 * We render LibraryChat inside a wrapper that hides its header via CSS.
 */
function ChatContent() {
  return (
    <div className="h-full [&>div]:h-full [&>div]:border-0 [&>div]:rounded-none [&>div>div:first-child]:hidden">
      <LibraryChat />
    </div>
  )
}
