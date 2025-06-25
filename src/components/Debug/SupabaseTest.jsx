import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

const SupabaseTest = () => {
  const [testResults, setTestResults] = useState({})
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const runTests = async () => {
    setLoading(true)
    const results = {}

    // Test 1: Basic connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').single()
      results.connection = error ? `Error: ${error.message}` : 'Success'
    } catch (error) {
      results.connection = `Error: ${error.message}`
    }

    // Test 2: User authentication
    results.auth = user ? `Authenticated as: ${user.email}` : 'Not authenticated'

    // Test 3: Realtime status
    try {
      const channel = supabase.channel('test')
      channel.subscribe((status) => {
        results.realtime = `Status: ${status}`
        setTestResults({...results})
      })
      
      setTimeout(() => {
        channel.unsubscribe()
      }, 2000)
    } catch (error) {
      results.realtime = `Error: ${error.message}`
    }

    // Test 4: Messages table access
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('count')
        .limit(1)
      results.messages = error ? `Error: ${error.message}` : 'Success'
    } catch (error) {
      results.messages = `Error: ${error.message}`
    }

    setTestResults(results)
    setLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div style={{ padding: '20px', backgroundColor: '#f5f5f5', margin: '20px', borderRadius: '8px' }}>
      <h3>Supabase Connection Test</h3>
      <button onClick={runTests} disabled={loading}>
        {loading ? 'Testing...' : 'Run Tests'}
      </button>
      <div style={{ marginTop: '20px' }}>
        {Object.entries(testResults).map(([test, result]) => (
          <div key={test} style={{ marginBottom: '10px' }}>
            <strong>{test}:</strong> {result}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SupabaseTest