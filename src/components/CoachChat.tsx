import { useState, useEffect, useRef } from 'react'
import type { DayLog, Phase, ChatMessage } from '../types'
import { getChatMessages, saveChatMessages } from '../utils/storage'
import { answerCoachQuestion, generateDayReview } from '../utils/coach'

interface Props {
  day: DayLog
  phase: Phase
}

export default function CoachChat({ day, phase }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(getChatMessages())
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  function sendMessage(text: string) {
    if (!text.trim()) return
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    }

    const response = answerCoachQuestion(text, day, phase)
    const coachMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'coach',
      text: response,
      timestamp: Date.now(),
    }

    const updated = [...messages, userMsg, coachMsg]
    setMessages(updated)
    saveChatMessages(updated)
    setInput('')
  }

  function quickReview() {
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
  }

  const quickQuestions = [
    'Review today',
    'What should I eat?',
    'How much do I have left?',
    'What are my targets?',
    'Will extra carbs go to my waist?',
    'I feel flat',
  ]

  return (
    <div className="chat-container">
      <div className="chat-messages" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="coach-intro">
            <h2>Food Coach</h2>
            <p>Ask me anything about your nutrition, training, or how you're tracking today.</p>
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
          placeholder="Ask your coach..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') sendMessage(input)
          }}
        />
        <button className="chat-send" onClick={() => sendMessage(input)}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
