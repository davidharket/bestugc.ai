import { useRouter } from 'next/router'

export default function AuthError() {
  const router = useRouter()
  const { error } = router.query

  return (
    <div>
      <h1>Authentication Error</h1>
      <p>There was an error during the authentication process.</p>
      {error && <pre>{JSON.stringify(JSON.parse(error as string), null, 2)}</pre>}
    </div>
  )
}
