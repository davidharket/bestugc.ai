// pages/affiliate-dashboard.tsx
import { useEffect } from 'react'
import AffiliateDashboard from '../components/AffiliateDashboard'
import { useAffiliateTracking } from '../lib/affiliate-middleware'
import { useAffiliateAttribution } from '../hooks/useAffiliateAttribution'

export default function AffiliateDashboardPage() {
  // Track affiliate clicks and attribution
  useAffiliateTracking()
  useAffiliateAttribution()

  return <AffiliateDashboard />
}