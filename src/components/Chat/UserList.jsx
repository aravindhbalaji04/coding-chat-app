import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Users, Search } from 'lucide-react'

const UserList = ({ onSelectUser, selectedUserId }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const { user } = useAuth()

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('display_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredUsers = users.filter(u =>
    u.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="users-header">
        <Users size={20} />
        <h2 className="users-title">Users</h2>
      </div>

      <div className="search-container">
        <Search className="search-icon" size={16} />
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="users-list custom-scrollbar">
        {filteredUsers.map((userItem) => (
          <div
            key={userItem.id}
            onClick={() => onSelectUser(userItem)}
            className={`user-item ${selectedUserId === userItem.id ? 'selected' : ''}`}
          >
            <img
              src={userItem.avatar_url}
              alt={userItem.display_name}
              className="user-avatar"
            />
            <div className="user-info-container">
              <p className="user-name">
                {userItem.display_name}
              </p>
              <p className="user-email">
                {userItem.email}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default UserList