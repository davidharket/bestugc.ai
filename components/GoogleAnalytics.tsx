import Script from 'next/script'
import { useEffect, useState } from 'react'

declare global {
  interface Window {
    dataLayer: any[]
    gtag: (...args: any[]) => void
  }
}

const GA_TRACKING_ID = 'G-SQ0H3LR4YQ'

export default function GoogleAnalytics() {
  const [consentGiven, setConsentGiven] = useState(false)
  const [bannerVisible, setBannerVisible] = useState(false)

  useEffect(() => {
    // Check if user has already given consent
    const consent = localStorage.getItem('ga-consent')
    if (consent === 'granted') {
      setConsentGiven(true)
      updateConsent('granted')
    } else if (consent === 'denied') {
      setConsentGiven(false)
    } else {
      // Show banner for first-time visitors
      setBannerVisible(true)
    }
  }, [])

  const updateConsent = (value: 'granted' | 'denied') => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('consent', 'update', {
        'ad_storage': value,
        'ad_user_data': value,
        'ad_personalization': value,
        'analytics_storage': value
      })
    }
  }

  const acceptAll = () => {
    setConsentGiven(true)
    setBannerVisible(false)
    localStorage.setItem('ga-consent', 'granted')
    updateConsent('granted')
  }

  const rejectAll = () => {
    setConsentGiven(false)
    setBannerVisible(false)
    localStorage.setItem('ga-consent', 'denied')
    updateConsent('denied')
  }

  return (
    <>
      {/* Google Analytics Scripts */}
      <Script id="gtag-consent-default">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          
          gtag('consent', 'default', {
            'ad_storage': 'denied',
            'ad_user_data': 'denied', 
            'ad_personalization': 'denied',
            'analytics_storage': 'denied'
          });
        `}
      </Script>

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        strategy="afterInteractive"
      />

      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_TRACKING_ID}');
        `}
      </Script>

      {/* Cookie Consent Banner */}
      {bannerVisible && (
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-700 p-3 z-50">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-white text-xs flex-1">
              <strong className="text-orange-500">Cookie Consent</strong>
              <p className="mt-1">We use cookies to enhance your experience and analyze our traffic. Choose your preferences below.</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={rejectAll}
                className="px-2 py-1 text-xs bg-gray-800 text-gray-300 border border-gray-600 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Reject All
              </button>
              <button
                onClick={acceptAll}
                className="px-2 py-1 text-xs bg-orange-500 text-white border border-orange-500 rounded-lg hover:bg-orange-600 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
