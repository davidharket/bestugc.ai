import { useSession, signIn } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') return <div>Loading...</div>

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-3xl font-bold mb-4">AI Video Ad Generator</h1>
      <p className="mb-8">Sign in to start creating AI-powered ads for your products.</p>
      <button
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => signIn()}
      >
        Sign in
      </button>
    </div>
  )
} 