import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Auth from './components/Auth'
import Accounts from './components/Accounts'
import Workbench from './components/Workbench'
import BillLibrary from './components/BillLibrary'
import Notes from './components/Notes'

// Define Account interface here or import it
interface Account {
  id: string
  name: string
  current_balance: number
  is_liability: boolean
  sort_order: number
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentNetWorth, setCurrentNetWorth] = useState(0)
  const [refreshWorkbench, setRefreshWorkbench] = useState(0)
  const [showCreditCardWorkbench, setShowCreditCardWorkbench] = useState(false)
  
  // State to hold account balances
  const [accounts, setAccounts] = useState<Account[]>([])

  useEffect(() => {
    console.log('App mounted, checking session...')
    
    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Error getting session:', error)
          setError(error.message)
        } else {
          console.log('Session retrieved:', data.session ? 'Found' : 'None')
          setSession(data.session)
        }
      } catch (err: any) {
        console.error('Unexpected error checking session:', err)
        setError(err.message || 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event)
      setSession(session)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Helper to find account balance by name (case-insensitive partial match)
  const getAccountBalance = (namePart: string): number => {
    const account = accounts.find(a => a.name.toLowerCase().includes(namePart.toLowerCase()))
    if (account) {
      return account.is_liability ? -Math.abs(account.current_balance) : account.current_balance
    }
    return 0
  }

  if (error) {
    return (
      <div className="p-4 text-red-600">
        <h1>Fatal Error</h1>
        <p>{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl text-gray-600">Loading... (Check Console)</div>
      </div>
    )
  }

  if (!session) {
    return <Auth />
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 md:mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Budget Workbench</h1>
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <span className="text-xs md:text-sm text-gray-600 truncate max-w-[150px]">{session.user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200 md:border-transparent"
            >
              Sign Out
            </button>
          </div>
        </div>
        
        <Accounts 
          userId={session.user.id} 
          onBalanceChange={setCurrentNetWorth}
          onAccountsUpdate={setAccounts} 
        />
        
        <div className="flex justify-end mb-4">
          <button
            onClick={() => setShowCreditCardWorkbench(!showCreditCardWorkbench)}
            className="text-xs md:text-sm bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 transition shadow-sm w-full md:w-auto"
          >
            {showCreditCardWorkbench ? 'Hide Credit Card Workbenches' : 'Show Credit Card Workbenches'}
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Workbench Area (Takes up 3/4 width on desktop, full on mobile) */}
          <div className="lg:col-span-3 space-y-8 order-2 lg:order-1">
            <Workbench 
              userId={session.user.id} 
              startingBalance={currentNetWorth}
              refreshTrigger={refreshWorkbench}
              title="Main Cash Flow"
            />

            {showCreditCardWorkbench && (
              <>
                <Workbench 
                  userId={session.user.id} 
                  startingBalance={getAccountBalance('CMW')} 
                  refreshTrigger={refreshWorkbench}
                  title="Credit Card - CMW (3619)"
                  filterTag="cc_1"
                />
                <Workbench 
                  userId={session.user.id} 
                  startingBalance={getAccountBalance('JGW')} 
                  refreshTrigger={refreshWorkbench}
                  title="Credit Card - JGW (9299)"
                  filterTag="cc_2"
                />
                <Workbench 
                  userId={session.user.id} 
                  startingBalance={getAccountBalance('SAMS')} 
                  refreshTrigger={refreshWorkbench}
                  title="Credit Card - SAMS (1261)"
                  filterTag="cc_3"
                />
              </>
            )}
          </div>

          {/* Sidebar: Bill Library (Takes up 1/4 width on desktop, full on mobile) */}
          <div className="lg:col-span-1 order-1 lg:order-2">
            <BillLibrary 
              userId={session.user.id}
              onTransactionAdded={() => setRefreshWorkbench(prev => prev + 1)}
            />
          </div>
        </div>

        {/* Notes Section (Full Width at Bottom) */}
        <div className="mt-8">
          <Notes userId={session.user.id} />
        </div>
      </div>
    </div>
  )
}

export default App