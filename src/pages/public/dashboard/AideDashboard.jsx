import React, { useState, useEffect, useRef } from 'react'
import { Bot, User, Smile, Frown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../../services/api'
import '../../../styles/public/dashboard.css'

const getStoredUser = () => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) return null
  try {
    return JSON.parse(storedUser)
  } catch {
    return null
  }
}

const AideDashboard = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getStoredUser())
  const [messages, setMessages] = useState([
    { id: 1, text: "Bonjour ! Je suis l'assistant IA de Gs Emmanuel. Comment puis-je vous aider aujourd'hui ?", sender: 'bot', time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const now = new Date()
    const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const userMessage = { id: Date.now(), text: input, sender: 'user', time: timeString }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const history = messages
        .filter(msg => !msg.error)
        .slice(-8)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))

      const response = await api.post('/api/aide', {
        message: userMessage.text,
        history
      })

      const reply = response.data?.data?.reply || response.data?.reply || 'Une erreur est survenue.'
      const botTime = new Date()
      const botTimeString = `${botTime.getHours().toString().padStart(2, '0')}:${botTime.getMinutes().toString().padStart(2, '0')}`

      const botMessage = { id: Date.now() + 1, text: reply, sender: 'bot', time: botTimeString }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Désolé, je ne suis pas disponible pour le moment.'
      setMessages(prev => [...prev, { id: Date.now() + 1, text: errorMessage, sender: 'bot', error: true, time: timeString }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='dashboard-page'>
      <div className='chat-app-container'>
        <div className='chat-app-header'>
          <h2>Assistant gsemmanuel</h2>
        </div>

        <div className='chat-app-messages'>
          {messages.map((msg, index) => {
            const isUser = msg.sender === 'user'
            return (
              <div key={msg.id} className={`chat-app-row ${isUser ? 'chat-app-row-user' : 'chat-app-row-bot'}`}>
                {!isUser && (
                  <div className='chat-app-avatar chat-app-avatar-bot'>
                    <Bot size={20} />
                  </div>
                )}

                <div className='chat-app-content-wrapper'>
                  <div className={`chat-app-meta ${isUser ? 'chat-app-meta-user' : 'chat-app-meta-bot'}`}>

                    <span className='chat-app-name'>{isUser ? (user?.full_name || 'Vous') : 'Assistant'}</span>
                  </div>
                  <div className={`chat-app-bubble ${isUser ? 'chat-app-bubble-user' : 'chat-app-bubble-bot'}`}>
                    {msg.text}
                  </div>
                  {!isUser && !msg.error && index > 0 && (
                    <div className='chat-app-reactions'>
                      <Frown size={16} className='reaction-icon' />
                      <Smile size={16} className='reaction-icon active' />
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className='chat-app-avatar chat-app-avatar-user'>
                    {user?.photo_url
                      ? (
                        <img src={user.photo_url} alt={user.full_name || 'Utilisateur'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        )
                      : (
                        <User size={20} />
                        )}
                  </div>
                )}
              </div>
            )
          })}

          {isLoading && (
            <div className='chat-app-row chat-app-row-bot'>
              <div className='chat-app-avatar chat-app-avatar-bot'>
                <Bot size={20} />
              </div>
              <div className='chat-app-content-wrapper'>
                <div className='chat-app-meta chat-app-meta-bot'>
                  <span className='chat-app-name'>Assistant</span>
                </div>
                <div className='chat-app-bubble chat-app-bubble-bot chat-app-typing'>
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className='chat-app-input-area'>
          <div className='chat-app-input-wrapper'>
            <input
              type='text'
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder='Posez votre question...'
              className='chat-app-input'
              disabled={isLoading}
            />
            <button type='submit' disabled={isLoading || !input.trim()} className='chat-app-send-btn'>
              Envoyer
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AideDashboard
