import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import BarLoader from '../../components/BarLoader'

export default function VerifyEmailPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [isResending, setIsResending] = useState(false)

  useEffect(() => {
    const verifyEmail = async () => {
      const { token, email, verified } = router.query

      // If already verified (redirected from API), show success immediately
      if (verified === 'true') {
        setStatus('success')
        setMessage('Your email has been verified successfully!')
        // Auto-redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
        return
      }

      if (!token || !email) {
        setStatus('error')
        setMessage('Missing verification parameters')
        return
      }

      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}&email=${email}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Your email has been verified successfully!')
          // Auto-redirect to dashboard after 3 seconds
          setTimeout(() => {
            router.push('/dashboard')
          }, 3000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
        }
      } catch (error) {
        setStatus('error')
        setMessage('An error occurred during verification')
      }
    }

    if (router.isReady) {
      verifyEmail()
    }
  }, [router.isReady, router.query])

  const handleResendVerification = async () => {
    const { email } = router.query
    
    if (!email) return

    setIsResending(true)
    
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
        alert('Verification email sent! Please check your inbox.')
      } else {
        alert(data.error || 'Failed to send verification email')
      }
    } catch (error) {
      alert('An error occurred while sending verification email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <>
      <Head>
        <title>Email Verification - Best UGC</title>
        <meta name="description" content="Verify your email address" />
      </Head>
      
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto p-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-8">Email Verification</h1>
            
            <div className="rounded-[20px] border border-gray-700 p-8" style={{ backgroundColor: '#111827' }}>
              {status === 'loading' && (
                <div className="text-center">
                  <div className="mx-auto mb-4 flex justify-center"><BarLoader size="md" /></div>
                  <p className="text-gray-400">Verifying your email...</p>
                </div>
              )}
              
              {status === 'success' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-green-400 mb-2">Success!</h2>
                  <p className="text-gray-300 mb-4">{message}</p>
                  <div className="mb-6">
                    <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                      <div className="bg-orange-500 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                    </div>
                    <p className="text-sm text-gray-400">Redirecting to dashboard in 3 seconds...</p>
                  </div>
                  <Link
                    href="/auth/signin"
                    className="btn-primary inline-block px-6 py-3 text-center"
                  >
                    Continue to Sign In
                  </Link>
                </div>
              )}
              
              {status === 'error' && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                  <h2 className="text-xl font-semibold text-red-400 mb-2">Verification Failed</h2>
                  <p className="text-gray-300 mb-6">{message}</p>
                  
                  <div className="space-y-4">
                    <button
                      onClick={handleResendVerification}
                      disabled={isResending || !router.query.email}
                      className="btn-primary w-full px-6 py-3 disabled:opacity-50"
                    >
                      {isResending ? 'Sending...' : 'Resend Verification Email'}
                    </button>
                    
                    <Link
                      href="/auth/signin"
                      className="block text-orange-400 hover:text-orange-300 text-sm transition-colors"
                    >
                      Back to Sign In
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}