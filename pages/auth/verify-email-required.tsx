import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function VerifyEmailRequiredPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [isResending, setIsResending] = useState(false)
  const [resendMessage, setResendMessage] = useState('')

  useEffect(() => {
    // Get email from query params
    const { email: queryEmail } = router.query
    if (queryEmail && typeof queryEmail === 'string') {
      setEmail(queryEmail)
    }
  }, [router.query])

  const handleResendVerification = async () => {
    if (!email) return

    setIsResending(true)
    setResendMessage('')
    
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setResendMessage('Verification email sent! Please check your inbox.')
      } else {
        setResendMessage(data.error || 'Failed to send verification email')
      }
    } catch (error) {
      setResendMessage('An error occurred while sending verification email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <>
      <Head>
        <title>Email Verification Required - Best UGC</title>
        <meta name="description" content="Please verify your email address to continue" />
      </Head>
      
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-8">Email Verification Required</h1>
            
            <div className="rounded-[20px] border border-gray-700 p-8" style={{ backgroundColor: '#111827' }}>
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-orange-400 mb-2">Check Your Email</h2>
                <p className="text-gray-300 mb-4">
                  We've sent a verification email to:
                </p>
                {email && (
                  <p className="text-white font-semibold mb-4 bg-gray-800 px-3 py-2 rounded-lg">
                    {email}
                  </p>
                )}
                <p className="text-gray-400 text-sm mb-6">
                  Please click the verification link in your email to activate your account and continue to the dashboard.
                </p>
                
                <div className="space-y-4">
                  <button
                    onClick={handleResendVerification}
                    disabled={isResending || !email}
                    className="btn-primary w-full px-6 py-3 disabled:opacity-50"
                  >
                    {isResending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                  
                  {resendMessage && (
                    <p className={`text-sm ${resendMessage.includes('sent') ? 'text-green-400' : 'text-red-400'}`}>
                      {resendMessage}
                    </p>
                  )}
                  
                  <Link
                    href="/auth/signin"
                    className="block text-orange-400 hover:text-orange-300 text-sm transition-colors"
                  >
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}