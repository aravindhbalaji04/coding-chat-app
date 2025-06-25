import React, { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Play, Loader2, Copy, Check } from 'lucide-react'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-javascript'
import toast from 'react-hot-toast'

const MessageItem = ({ message, isOwn }) => {
  const [executing, setExecuting] = useState(false)
  const [output, setOutput] = useState('')
  const [copied, setCopied] = useState(false)

  const executeCode = async () => {
    setExecuting(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: message.content,
          language: message.code_language
        }),
      })

      const result = await response.json()
      setOutput(result.output || result.error || 'No output')
    } catch (error) {
      setOutput(`Error: ${error.message}`)
    } finally {
      setExecuting(false)
    }
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)
      toast.success('Code copied to clipboard!')
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast.error('Failed to copy code')
    }
  }

  const renderCodeMessage = () => {
    const highlightedCode = Prism.highlight(
      message.content,
      Prism.languages[message.code_language] || Prism.languages.javascript,
      message.code_language
    )

    return (
      <div className="code-block">
        <div className="code-header">
          <span className="code-language">{message.code_language}</span>
          <div className="code-actions">
            <button
              onClick={copyCode}
              className="copy-btn"
              title="Copy code"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button
              onClick={executeCode}
              disabled={executing}
              className="code-btn run-btn"
            >
              {executing ? (
                <Loader2 size={12} className="spinner-small" />
              ) : (
                <Play size={12} />
              )}
              Run
            </button>
          </div>
        </div>
        <pre className="code-content">
          <code
            className={`language-${message.code_language}`}
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
          />
        </pre>
        {output && (
          <div className="code-output">
            <div className="code-output-label">Output:</div>
            <pre className="code-output-text">{output}</pre>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={`message-item ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        {!isOwn && (
          <div className="message-sender">
            <img
              src={message.sender?.avatar_url}
              alt={message.sender?.display_name}
              className="message-avatar"
            />
            <span className="message-sender-name">{message.sender?.display_name}</span>
          </div>
        )}
        <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
          {message.message_type === 'code' ? (
            renderCodeMessage()
          ) : (
            <p className="message-text">{message.content}</p>
          )}
        </div>
        <div className="message-time">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}

export default MessageItem