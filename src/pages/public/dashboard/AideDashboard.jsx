import React, { useState, useEffect, useRef } from 'react'
import { Bot, User, Smile, Frown, Mic, MicOff, SendHorizontal, Printer } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import api from '../../../services/api'
import '../../../styles/public/dashboard.css'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import logoGsEmmanuel from '../../../assets/images/logo_gsemmanuel.png'

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
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem('ai_chat_history')
    if (saved) {
      try {
        return JSON.parse(saved)
      } catch (e) { }
    }
    return [
      { id: 1, text: "Bonjour ! Je suis l'assistant IA de Gs Emmanuel. Comment puis-je vous aider aujourd'hui ?", sender: 'bot', time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) }
    ]
  })
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const messagesEndRef = useRef(null)

  // Speech Recognition setup
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  const recognition = SpeechRecognition ? new SpeechRecognition() : null

  if (recognition) {
    recognition.continuous = false
    recognition.lang = 'fr-FR'
    recognition.interimResults = false

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      setInput((prev) => prev + (prev ? ' ' : '') + transcript)
      setIsListening(false)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }
  }

  const toggleListening = () => {
    if (!recognition) {
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur.')
      return
    }
    if (isListening) {
      recognition.stop()
      setIsListening(false)
    } else {
      recognition.start()
      setIsListening(true)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  useEffect(() => {
    sessionStorage.setItem('ai_chat_history', JSON.stringify(messages))
  }, [messages])

  const handlePrint = (msgId) => {
    const bubbleEl = document.getElementById(`chat-bubble-${msgId}`)
    if (!bubbleEl) return

    const printWindow = window.open('', '_blank', 'width=800,height=600')
    if (!printWindow) {
      alert('Veuillez autoriser les fenêtres contextuelles pour imprimer cette réponse.')
      return
    }

    let htmlContent = bubbleEl.innerHTML

    const literalText1 = 'Si vous voulez, je peux aussi vous faire le même format pour la 4e, 5e et 6e primaire si elles existent.'
    htmlContent = htmlContent.replace(literalText1, '')

    const regex1 = /Si vous voulez,\s*je peux aussi vous faire le même format pour la\s*4[eè](?:me|ème)?,\s*5[eè](?:me|ème)?\s*et\s*6[eè](?:me|ème)?\s*primaire\s*si\s*elles\s*existent\.?/gi
    htmlContent = htmlContent.replace(regex1, '')

    const literalText2 = 'Si vous voulez, je peux aussi vous faire un format imprimable propre avec seulement les noms et les dates.'
    htmlContent = htmlContent.replace(literalText2, '')

    const regex2 = /Si vous voulez,\s*je peux aussi vous faire un format imprimable propre avec seulement les noms et les dates\.?/gi
    htmlContent = htmlContent.replace(regex2, '')

    htmlContent = htmlContent.replace(/<p>\s*<\/p>/gi, '')

    printWindow.document.write(`
      <html>
        <head>
          <title>Impression - Réponse Assistant</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              padding: 40px;
              color: #1f2937;
              line-height: 1.6;
              background-color: #ffffff;
            }
            .print-header {
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 12px;
              margin-bottom: 24px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              font-size: 0.875rem;
              color: #4b5563;
            }
            .print-logo-container {
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .print-logo-img {
              width: 40px;
              height: 40px;
              object-fit: contain;
            }
            .print-logo {
              font-weight: 700;
              font-size: 1.1rem;
              color: #0f172a;
            }
            .print-content {
              font-size: 1rem;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
              font-size: 0.875rem;
            }
            th, td {
              border: 1px solid #e5e7eb;
              padding: 10px 12px;
              text-align: left;
            }
            th {
              background-color: #f9fafb;
              font-weight: 600;
              color: #111827;
            }
            tr:nth-child(even) td {
              background-color: #f9fafb;
            }
            ul, ol {
              padding-left: 20px;
              margin: 10px 0;
            }
            li {
              margin-bottom: 4px;
            }
            p {
              margin: 0 0 12px 0;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #111827;
              margin-top: 24px;
              margin-bottom: 12px;
              font-weight: 600;
            }
            h1 { font-size: 1.5rem; }
            h2 { font-size: 1.25rem; }
            h3 { font-size: 1.125rem; }
            strong {
              color: #111827;
            }
            pre {
              background: #f3f4f6;
              padding: 12px;
              border-radius: 6px;
              overflow-x: auto;
              border: 1px solid #e5e7eb;
            }
            code {
              font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
              background: #f3f4f6;
              padding: 2px 4px;
              border-radius: 4px;
              font-size: 0.875em;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <div class="print-logo-container">
              <img class="print-logo-img" src="${logoGsEmmanuel}" alt="Logo GS Emmanuel" />
              <span class="print-logo">Gs Emmanuel</span>
            </div>
            <span>Rapport d'assistance - ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div class="print-content">
            ${htmlContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 250);
            };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

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
        .slice(-20)
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
                  <div id={`chat-bubble-${msg.id}`} className={`chat-app-bubble ${isUser ? 'chat-app-bubble-user' : 'chat-app-bubble-bot'}`}>
                    {isUser ? msg.text : <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>}
                  </div>
                  {!isUser && !msg.error && (
                    <div className='chat-app-reactions'>
                      {index > 0 && (
                        <>
                          <Frown size={16} className='reaction-icon' />
                          <Smile size={16} className='reaction-icon active' />
                        </>
                      )}
                      <button
                        type='button'
                        onClick={() => handlePrint(msg.id)}
                        className='chat-app-reaction-btn'
                        title='Imprimer cette réponse'
                      >
                        <Printer size={16} />
                      </button>
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
            <button
              type='button'
              onClick={toggleListening}
              className={`chat-app-mic-btn ${isListening ? 'listening' : ''}`}
              title='Commande vocale'
              style={{
                background: isListening ? '#ef4444' : 'transparent',
                color: isListening ? 'white' : 'var(--color-text-light)',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isListening ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button type='submit' disabled={isLoading || !input.trim()} className='chat-app-send-btn'>
              <SendHorizontal size={18} className='chat-app-send-icon' />
              <span className='chat-app-send-label'>Envoyer</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AideDashboard
