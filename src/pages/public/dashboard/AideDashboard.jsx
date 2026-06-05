import React, { useState } from 'react'
import { Send, Bot, User } from 'lucide-react'
import api from '../../../services/api'
import '../../../styles/public/dashboard.css'

const AideDashboard = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Bonjour ! Je suis l'assistant IA de Tresoria. Comment puis-je vous aider aujourd'hui ?", sender: 'bot' }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async (e) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage = { id: Date.now(), text: input, sender: 'user' }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const response = await api.post('/api/aide', { message: userMessage.text })
      const botMessage = { id: Date.now() + 1, text: response.data?.reply || 'Une erreur est survenue.', sender: 'bot' }
      setMessages(prev => [...prev, botMessage])
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now() + 1, text: 'Désolé, je ne suis pas disponible pour le moment.', sender: 'bot', error: true }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='dashboard-page'>
      <header className='dashboard-header'>
        <h1>Aide (Assistant IA)</h1>
        <p>Posez vos questions concernant l'application, je vous répondrai en fonction de vos droits d'accès.</p>
      </header>

      <div className='chat-container'>
        <div className='chat-messages'>
          {messages.map(msg => (
            <div key={msg.id} className={`chat-message-row ${msg.sender === 'user' ? 'chat-message-row--user' : 'chat-message-row--bot'}`}>
              {msg.sender === 'bot' && (
                <div className='chat-avatar chat-avatar--bot'>
                  <Bot size={20} />
                </div>
              )}

              <div className={`chat-bubble ${msg.sender === 'user' ? 'chat-bubble--user' : 'chat-bubble--bot'}`}>
                {msg.text}
              </div>

              {msg.sender === 'user' && (
                <div className='chat-avatar chat-avatar--user'>
                  <User size={20} />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className='chat-message-row chat-message-row--bot'>
              <div className='chat-avatar chat-avatar--bot'>
                <Bot size={20} />
              </div>
              <div className='chat-bubble chat-bubble--bot chat-bubble--loading'>
                L'assistant réfléchit...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSend} className='chat-input-form'>
          <input
            type='text'
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder='Écrivez votre message...'
            className='chat-input-field'
            disabled={isLoading}
          />
          <button type='submit' disabled={isLoading || !input.trim()} className='chat-send-button'>
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  )
}

export default AideDashboard
