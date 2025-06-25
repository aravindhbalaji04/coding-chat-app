import React, { useState, useEffect, useRef } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import MessageItem from './MessageItem'
import { MessageCircle } from 'lucide-react'

const MessageList = ({ selectedUser }) => {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const messagesEndRef = useRef(null)
  const subscriptionRef = useRef(null)

  useEffect(() => {
    if (selectedUser) {
      fetchMessages()
      setupRealtimeSubscription()
    }

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [selectedUser, user])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(display_name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('Error fetching messages:', error)
        throw error
      }
      
      console.log('Fetched messages:', data)
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    // Unsubscribe from any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    console.log('Setting up realtime subscription for user:', user.id, 'and selected user:', selectedUser.id)

    // Create a more specific channel name
    const channelName = `messages:${Math.min(user.id, selectedUser.id)}-${Math.max(user.id, selectedUser.id)}`
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
          // Remove the filter from here - we'll filter in the callback
        },
        async (payload) => {
          console.log('Received realtime message:', payload)
          
          // Check if this message is relevant to the current conversation
          const newMessage = payload.new
          const isRelevant = 
            (newMessage.sender_id === user.id && newMessage.receiver_id === selectedUser.id) ||
            (newMessage.sender_id === selectedUser.id && newMessage.receiver_id === user.id)
          
          if (!isRelevant) {
            console.log('Message not relevant to current conversation')
            return
          }
          
          try {
            // Fetch the complete message with sender info
            const { data: messageWithSender, error } = await supabase
              .from('messages')
              .select(`
                *,
                sender:profiles!messages_sender_id_fkey(display_name, avatar_url)
              `)
              .eq('id', newMessage.id)
              .single()

            if (error) {
              console.error('Error fetching new message details:', error)
              return
            }

            if (messageWithSender) {
              console.log('Adding new message to state:', messageWithSender)
              setMessages(prev => {
                // Check if message already exists to avoid duplicates
                const exists = prev.some(msg => msg.id === messageWithSender.id)
                if (exists) {
                  console.log('Message already exists, skipping')
                  return prev
                }
                return [...prev, messageWithSender]
              })
            }
          } catch (error) {
            console.error('Error processing new message:', error)
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to realtime messages')
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to realtime messages')
        }
      })

    subscriptionRef.current = channel
  }

  // ...existing code...
  if (!selectedUser) {
    return (
      <div className="no-user-selected">
        <div>
          <MessageCircle size={48} style={{ color: '#cbd5e0', margin: '0 auto 1rem' }} />
          <p style={{ color: '#a0aec0' }}>Select a user to start chatting</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="chat-header-user">
        <img
          src={selectedUser.avatar_url}
          alt={selectedUser.display_name}
          className="chat-avatar"
        />
        <div>
          <h3 className="chat-user-name">{selectedUser.display_name}</h3>
          <p className="chat-user-email">{selectedUser.email}</p>
        </div>
      </div>

      <div className="messages-container custom-scrollbar">
        {messages.length === 0 ? (
          <div className="no-messages">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              isOwn={message.sender_id === user.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}

export default MessageList