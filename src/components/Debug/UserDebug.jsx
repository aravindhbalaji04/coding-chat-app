import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const UserDebug = () => {
  const [debugInfo, setDebugInfo] = useState({})
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const checkUserData = async () => {
    setLoading(true)
    const info = {}

    // Check authenticated user
    info.authUser = user ? {
      id: user.id,
      email: user.email,
      created_at: user.created_at
    } : 'No authenticated user'

    // Check if profile exists
    if (user) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        info.profile = profileError ? `Error: ${profileError.message}` : profile
      } catch (error) {
        info.profile = `Error: ${error.message}`
      }

      // Check all profiles to see if there's a data mismatch
      try {
        const { data: allProfiles, error: allError } = await supabase
          .from('profiles')
          .select('id, email, display_name')

        info.allProfiles = allError ? `Error: ${allError.message}` : allProfiles
      } catch (error) {
        info.allProfiles = `Error: ${error.message}`
      }
    }

    setDebugInfo(info)
    setLoading(false)
  }

  const createProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .upsert([
          {
            id: user.id,
            email: user.email,
            display_name: user.user_metadata?.display_name || user.email.split('@')[0],
            avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${user.email}`
          }
        ])

      if (error) throw error

      alert('Profile created successfully!')
      checkUserData() // Refresh debug info
    } catch (error) {
      alert(`Error creating profile: ${error.message}`)
    }
  }

  useEffect(() => {
    if (user) {
      checkUserData()
    }
  }, [user])

  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#f5f5f5', 
      margin: '20px', 
      borderRadius: '8px',
      fontFamily: 'monospace',
      fontSize: '12px'
    }}>
      <h3>User Debug Information</h3>
      <button onClick={checkUserData} disabled={loading} style={{ marginRight: '10px' }}>
        {loading ? 'Checking...' : 'Refresh Data'}
      </button>
      <button onClick={createProfile} disabled={!user} style={{ marginRight: '10px' }}>
        Create/Update Profile
      </button>
      
      <div style={{ marginTop: '20px' }}>
        <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
      </div>
    </div>
  )
}

export default UserDebug