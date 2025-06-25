import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import UserList from './UserList'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import SupabaseTest from '../Debug/SupabaseTest' // Add this
import { LogOut, User } from 'lucide-react'

const ChatApp = () => {
  const [selectedUser, setSelectedUser] = useState(null)
  const [showDebug, setShowDebug] = useState(false) // Add this
  const { user, signOut } = useAuth()

  return (
    <div className="chat-app">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-content">
          <h1 className="chat-title">Chat App</h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="logout-btn"
            >
              Debug
            </button>
            <div className="user-info">
              <User size={20} />
              <span>{user?.email}</span>
            </div>
            <button onClick={signOut} className="logout-btn">
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div style={{ padding: '20px' }}>
          <SupabaseTest />
        </div>
      )}

      {/* Main Content */}
      <div className="chat-main">
        {/* Users List */}
        <div className="chat-sidebar">
          <UserList
            onSelectUser={setSelectedUser}
            selectedUserId={selectedUser?.id}
          />
        </div>

        {/* Chat Area */}
        <div className="chat-content">
          <MessageList selectedUser={selectedUser} />
          <MessageInput selectedUser={selectedUser} />
        </div>
      </div>
    </div>
  )
}

export default ChatApp