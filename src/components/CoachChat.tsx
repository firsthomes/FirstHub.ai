import { useState, useEffect, useRef } from 'react'
import type { DayLog, Phase, ChatMessage } from '../types'
import { getChatMessages, saveChatMessages, getSettings } from '../utils/storage'
import { answerCoachQuestion, generateDayReview } from '../utils/coach'
import { streamCoachReply, hasApiKey } from '../utils/anthropic'

interface Props {
  day: DayLog
  phase: Phase
}

export default function CoachChat({ day, phase }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [streaming, setStreaming] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const settings = getSettings()
  const aiMode = hasApiKey(settings.apiKey)

  useEffect(() => {
    setMessages(getChatMessages())
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, streamingText])

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
      timestamp: Date.now(),
    }

    const baseMessages = [...messages, userMsg]
    setMessages(baseMessages)
    setInput('')
    setError(null)

    if (aiMode) {
      setStreaming(true)
      setStreamingText('')
      try {
        const fullText = await streamCoachReply(
          settings.apiKey,
          messages,
          trimmed,
          day,
          phase,
          (token) => setStreamingText(prev => prev + token)
        )
        const coachMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'coach',
          text: fullText,
          timestamp: Date.now(),
        }
        const updated = [...baseMessages, coachMsg]
        setMessages(updated)
        saveChatMessages(updated)
      } catch (e: unknown) {
        const errMsg = e instanceof Error ? e.message : 'Unknown error'
        setError(`AI call failed: ${errMsg}. Falling back to rules.`)
        const response = answerCoachQuestion(trimmed, day, phase)
        const coachMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'coach',
          text: response,
          timestamp: Date.now(),
        }
        const updated = [...baseMessages, coachMsg]
        setMessages(updated)
        saveChatMessages(updated)
      } finally {
        setStreaming(false)
        setStreamingText('')
      }
    } else {
      const response = answerCoachQuestion(trimmed, day, phase)
      const coachMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'coach',
        text: response,
        timestamp: Date.now(),
      }
      const updated = [...baseMessages, coachMsg]
      setMessages(updated)
      saveChatMessages(updated)
    }
  }

  function quickReview() {
    if (aiMode) {
      sendMessage('Review today')
      return
    }
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: 'Review today',
      timestamp: Date.now(),
    }
    const review = generateDayReview(day, phase)
    const coachMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'coach',
      text: review,
      timestamp: Date.now(),
    }
    const updated = [...messages, userMsg, coachMsg]
    setMessages(updated)
    saveChatMessages(updated)
  }

  function clearChat() {
    setMessages([])
    saveChatMessages([])
    setError(null)
  }

  const quickQuestions = [
    'Review today',
    'Can I have dessert today?',
    'What should I eat?',
    'I went for a walk, am I still in surplus?',
    'I feel flat',
    'Going out for sushi, what do I order?',
  ]

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="coach-intro">
            <h2>Food Coach</h2>
            <p>
              {aiMode
                ? 'Ask me anything — I have your full day in context.'
                : 'Built-in rules mode. Add an API key in Settings for smarter answers.'}
            </p>
            <div className="quick-questions">
              {quickQuestions.map(q => (
                <button
                  key={q}
                  className="quick-question-btn"
                  onClick={() => q === 'Review today' ? quickReview() : sendMessage(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`chat-bubble ${msg.role === 'user' ? 'user' : 'coach'}`}>
            {msg.text}
          </div>
        ))}

        {streaming && (
          <div className="chat-bubble coach">
            {streamingText || <span style={{ opacity: 0.6 }}>thinking…</span>}
          </div>
        )}

        {error && (
          <div style={{
            padding: '8px 12px',
            background: 'var(--red-dim)',
            color: 'var(--red)',
            borderRadius: 8,
            fontSize: 12,
            margin: '8px 0',
            textAlign: 'center',
          }}>
            {error}
          </div>
        )}

        {messages.length > 0 && (
          <div style={{ textAlign: 'center', padding: '8px 0' }}>
            <button
              onClick={clearChat}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Clear chat
            </button>
          </div>
        )}
      </div>

      <div className="chat-input-bar">
        <input
          className="chat-input"
          placeholder={streaming ? 'Coach is typing...' : 'Ask your coach...'}
          value={input}
          onChange={e => setInput(e.target.value)}
          disabled={streaming}
          onKeyDown={e => {
            if (e.key === 'Enter') sendMessage(input)
          }}
        />
        <button
          className="chat-send"
          onClick={() => sendMessage(input)}
          disabled={streaming || !input.trim()}
          style={streaming ? { opacity: 0.5 } : {}}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
