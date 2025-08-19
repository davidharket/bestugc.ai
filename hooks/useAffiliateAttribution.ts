// hooks/useAffiliateAttribution.ts
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { getAffiliateCodeForSignup } from '../lib/affiliate-middleware'

export function useAffiliateAttribution() {
  const { data: session, status } = useSession()

  useEffect(() => {
    // Only run once when user is authenticated and session is loaded
    if (status === 'authenticated' && session?.user?.id) {
      const affiliateCode = getAffiliateCodeForSignup()
      
      if (affiliateCode && !sessionStorage.getItem('affiliate_attribution_processed')) {
        // Process affiliate attribution
        fetch('/api/affiliate/process-signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ affiliateCode })
        }).then(response => response.json())
        .then(data => {
          if (data.success) {
            console.log('Affiliate attribution processed successfully')
          }
          // Mark as processed to avoid duplicate processing
          sessionStorage.setItem('affiliate_attribution_processed', 'true')
        }).catch(error => {
          console.error('Failed to process affiliate attribution:', error)
          // Still mark as processed to avoid infinite retries
          sessionStorage.setItem('affiliate_attribution_processed', 'true')
        })
      }
    }
  }, [status, session?.user?.id])
}