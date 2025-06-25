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
    if (selectedUser && user) {
      fetchMessages()
      setupRealtimeSubscription()
    }

    return () => {
      if (subscriptionRef.current) {
        console.log('Unsubscribing from channel')
        subscriptionRef.current.unsubscribe()
      }
    }
  }, [selectedUser?.id, user?.id]) // Add .id to dependencies

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    if (!user || !selectedUser) return
    
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
        return
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
    if (!user || !selectedUser) return

    // Unsubscribe from any existing subscription
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe()
    }

    console.log('Setting up realtime subscription for user:', user.id, 'and selected user:', selectedUser.id)

    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        async (payload) => {
          console.log('Received realtime message:', payload)
          
          const newMessage = payload.new
          
          // Check if this message is relevant to the current conversation
          // Convert to strings for comparison to handle UUID properly
          const isRelevant = 
            (String(newMessage.sender_id) === String(user.id) && String(newMessage.receiver_id) === String(selectedUser.id)) ||
            (String(newMessage.sender_id) === String(selectedUser.id) && String(newMessage.receiver_id) === String(user.id))
          
          console.log('Message relevance check:', {
            newMessage_sender: newMessage.sender_id,
            newMessage_receiver: newMessage.receiver_id,
            current_user: user.id,
            selected_user: selectedUser.id,
            isRelevant
          })
          
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
                const newMessages = [...prev, messageWithSender]
                console.log('Updated messages count:', newMessages.length)
                return newMessages
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