// lib/affiliate-middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function affiliateMiddleware(request: NextRequest) {
  // Check if there's an affiliate code in the URL
  const affiliateCode = request.nextUrl.searchParams.get('ref') || 
                       request.nextUrl.searchParams.get('affiliate') ||
                       request.nextUrl.searchParams.get('aff')

  if (affiliateCode) {
    // Store affiliate code in cookie for attribution
    const response = NextResponse.next()
    
    // Set cookie for 30 days
    response.cookies.set('affiliate_code', affiliateCode, {
      maxAge: 30 * 24 * 60 * 60, // 30 days
      httpOnly: false, // Allow client-side access for tracking
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    // Track the click asynchronously (don't block the response)
    if (typeof window === 'undefined') {
      // Server-side: we can't make fetch calls in middleware, so we'll track this in the component
      response.headers.set('x-affiliate-code', affiliateCode)
      response.headers.set('x-landing-page', request.nextUrl.pathname)
    }

    return response
  }

  return NextResponse.next()
}

// Client-side affiliate tracking hook
export function useAffiliateTracking() {
  if (typeof window === 'undefined') return

  // Check for affiliate code in URL or cookie
  const urlParams = new URLSearchParams(window.location.search)
  const affiliateCode = urlParams.get('ref') || 
                       urlParams.get('affiliate') || 
                       urlParams.get('aff') ||
                       getCookie('affiliate_code')

  if (affiliateCode && !sessionStorage.getItem('affiliate_tracked')) {
    // Track the click
    fetch('/api/affiliate/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        affiliateCode,
        landingPage: window.location.pathname + window.location.search
      })
    }).then(() => {
      // Mark as tracked for this session to avoid duplicate tracking
      sessionStorage.setItem('affiliate_tracked', 'true')
    }).catch(error => {
      console.error('Failed to track affiliate click:', error)
    })

    // Store in cookie if not already there
    if (!getCookie('affiliate_code')) {
      setCookie('affiliate_code', affiliateCode, 30) // 30 days
    }
  }
}

// Helper functions for cookie management
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null
  return null
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`
}

// Get affiliate code for signup attribution
export function getAffiliateCodeForSignup(): string | null {
  if (typeof window === 'undefined') return null
  return getCookie('affiliate_code')
}