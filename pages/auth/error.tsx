import { useRouter } from 'next/router'

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  let errorContent: string | null = null
  if (error) {
    if (typeof error === 'string') {
      try {
        errorContent = JSON.stringify(JSON.parse(error), null, 2)
      } catch (e) {
        errorContent = error
      }
    } else {
      errorContent = JSON.stringify(error, null, 2)
    }
  }

  return (
    <div>
      <h1>Authentication Error</h1>
      <p>There was an error during the authentication process.</p>
      {errorContent && <pre>{errorContent}</pre>}
    </div>
  )
}
