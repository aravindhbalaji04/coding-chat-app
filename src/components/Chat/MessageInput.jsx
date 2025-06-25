import React, { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Send, Code, Type } from 'lucide-react'
import toast from 'react-hot-toast'

const MessageInput = ({ selectedUser }) => {
  const [message, setMessage] = useState('')
  const [isCodeMode, setIsCodeMode] = useState(false)
  const [codeLanguage, setCodeLanguage] = useState('python')
  const [sending, setSending] = useState(false)
  const { user } = useAuth()

  const sendMessage = async (e) => {
    e.preventDefault()
    if (!message.trim() || !selectedUser || sending) return

    setSending(true)
    console.log('Sending message:', {
      sender_id: user.id,
      receiver_id: selectedUser.id,
      content: message.trim(),
      message_type: isCodeMode ? 'code' : 'text',
      code_language: isCodeMode ? codeLanguage : null
    })

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([
          {
            sender_id: user.id,
            receiver_id: selectedUser.id,
            content: message.trim(),
            message_type: isCodeMode ? 'code' : 'text',
            code_language: isCodeMode ? codeLanguage : null
          }
        ])
        .select()

      if (error) {
        console.error('Error sending message:', error)
        throw error
      }

      console.log('Message sent successfully:', data)
      setMessage('')
      toast.success('Message sent!')
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error(`Failed to send message: ${error.message}`)
    } finally {
      setSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(e)
    }
  }

  if (!selectedUser) return null

  return (
    <div className="message-input-container">
      <div className="input-mode-buttons">
        <button
          onClick={() => setIsCodeMode(false)}
          className={`mode-btn ${!isCodeMode ? 'active' : 'inactive'}`}
        >
          <Type size={16} />
          Text
        </button>
        <button
          onClick={() => setIsCodeMode(true)}
          className={`mode-btn ${isCodeMode ? 'active' : 'inactive'}`}
        >
          <Code size={16} />
          Code
        </button>
        {isCodeMode && (
          <select
            value={codeLanguage}
            onChange={(e) => setCodeLanguage(e.target.value)}
            className="language-select"
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
          </select>
        )}
      </div>

      <form onSubmit={sendMessage} className="message-input-form">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={isCodeMode ? 'Enter your code...' : 'Type a message...'}
          className={`message-textarea ${isCodeMode ? 'code-mode' : ''}`}
          rows={isCodeMode ? 4 : 1}
        />
        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="send-btn"
        >
          {sending ? (
            <div className="spinner-small"></div>
          ) : (
            <Send size={20} />
          )}
        </button>
      </form>
    </div>
  )
}

export default MessageInput