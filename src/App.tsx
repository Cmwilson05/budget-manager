import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import type { Session } from '@supabase/supabase-js'
import Auth from './components/Auth'
import Accounts from './components/Accounts'
import Workbench from './components/Workbench'
import BillSchedule from './components/BillSchedule'
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
  const [screenshotMode, setScreenshotMode] = useState(false)
  
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
  // Added isLiability param to be more specific and avoid issues when reordering
  const getAccountBalance = (namePart: string, isLiability: boolean = false): number => {
    // Try to find a match that also matches the liability status
    let account = accounts.find(a => 
      a.name.toLowerCase().includes(namePart.toLowerCase()) && 
      a.is_liability === isLiability
    )
    
    // Fallback to just name match if strict match fails (though for CCs we expect strict match)
    if (!account) {
      account = accounts.find(a => a.name.toLowerCase().includes(namePart.toLowerCase()))
    }

    if (account) {
      return account.is_liability ? -Math.abs(account.current_balance) : account.current_balance
    }
    return 0
  }

  // Helper to find account ID by name (case-insensitive partial match)
  const getAccountId = (namePart: string, isLiability: boolean = false): string | undefined => {
    let account = accounts.find(a => 
      a.name.toLowerCase().includes(namePart.toLowerCase()) && 
      a.is_liability === isLiability
    )
    
    if (!account) {
      account = accounts.find(a => a.name.toLowerCase().includes(namePart.toLowerCase()))
    }
    
    return account?.id
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
    <div className={`min-h-screen bg-gray-100 p-4 md:p-8 ${screenshotMode ? 'screenshot-mode' : ''}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Budget Manager</h1>
            {screenshotMode && (
              <p className="text-sm text-gray-500 mt-1">
                Financial Report • {new Date().toLocaleDateString(undefined, { dateStyle: 'long' })}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2 w-full md:w-auto">
            <div className="flex items-center gap-4 justify-between md:justify-end w-full">
              <span className="text-xs md:text-sm text-gray-600 truncate max-w-[150px] hide-in-screenshot">{session.user.email}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setScreenshotMode(!screenshotMode)}
                  className={`px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm rounded-md transition-colors border shadow-sm ${
                    screenshotMode 
                      ? 'bg-blue-600 text-white border-blue-600 font-medium' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {screenshotMode ? 'Exit Clean View' : 'Clean View for Screenshot'}
                </button>
                <button
                  onClick={() => supabase.auth.signOut()}
                  className="px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors border border-red-200 md:border-transparent hide-in-screenshot"
                >
                  Sign Out
                </button>
              </div>
            </div>
            {screenshotMode && (
              <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
                <span className="text-xs text-gray-500 uppercase font-bold mr-2">Net Worth:</span>
                <span className={`text-xl font-bold ${currentNetWorth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${currentNetWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>
        </div>
        
        {/* Main Layout: Grid with Accounts/Workbench on Left, Bill Schedule on Right */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area (Takes up 2/3 space on large screens) */}
          <div className="lg:col-span-2 space-y-8">
            <Accounts 
              userId={session.user.id} 
              onBalanceChange={(val) => {
                console.log('Net worth update:', val)
                setCurrentNetWorth(val)
              }}
              onAccountsUpdate={setAccounts} 
            />
            
            <div className="flex justify-between items-center hide-in-screenshot">
              <h2 className="text-xl font-semibold text-gray-800">Workbench</h2>
              <button
                onClick={() => setShowCreditCardWorkbench(!showCreditCardWorkbench)}
                className="text-xs md:text-sm bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded hover:bg-gray-50 transition shadow-sm w-full md:w-auto"
              >
                {showCreditCardWorkbench ? 'Hide Credit Card Workbenches' : 'Show Credit Card Workbenches'}
              </button>
            </div>

            <Workbench 
              userId={session.user.id} 
              startingBalance={currentNetWorth}
              refreshTrigger={refreshWorkbench}
              title="Main Cash Flow"
            />

            {showCreditCardWorkbench && (
              <div className="space-y-8 screenshot-break-before">
                <Workbench 
                  userId={session.user.id} 
                  startingBalance={getAccountBalance('CMW', true)} 
                  refreshTrigger={refreshWorkbench}
                  title="Credit Card - CMW (3619)"
                  filterTag="cc_1"
                  accountId={getAccountId('CMW', true)}
                />
                <Workbench 
                  userId={session.user.id} 
                  startingBalance={getAccountBalance('JGW', true)} 
                  refreshTrigger={refreshWorkbench}
                  title="Credit Card - JGW (9299)"
                  filterTag="cc_2"
                  accountId={getAccountId('JGW', true)}
                />
                <Workbench 
                  userId={session.user.id} 
                  startingBalance={getAccountBalance('SAMS', true)} 
                  refreshTrigger={refreshWorkbench}
                  title="Credit Card - SAMS (1261)"
                  filterTag="cc_3"
                  accountId={getAccountId('SAMS', true)}
                />
              </div>
            )}
          </div>

          {/* Bill Schedule & Notes (Takes up 1/3 space on large screens) */}
          <div className="lg:col-span-1 space-y-8">
            <div className="lg:sticky lg:top-8 space-y-8 h-fit">
              <BillSchedule
                userId={session.user.id}
                onTransactionAdded={() => setRefreshWorkbench(prev => prev + 1)}
                workbenchOptions={[
                  { title: 'Main Cash Flow' },
                  { title: 'CMW (3619)', tag: 'cc_1' },
                  { title: 'JGW (9299)', tag: 'cc_2' },
                  { title: 'SAMS (1261)', tag: 'cc_3' },
                ]}
              />
              <Notes userId={session.user.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App