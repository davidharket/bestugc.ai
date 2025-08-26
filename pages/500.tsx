// pages/500.tsx
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Custom500() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Server Error - Best UGC</title>
        <meta name="description" content="Something went wrong on our end. We're working to fix it." />
      </Head>
      
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Large 500 */}
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-orange-500 mb-4">500</h1>
              <div className="w-32 h-1 bg-orange-500 mx-auto rounded-full mb-8"></div>
            </div>

            {/* Error Message */}
            <div className="mb-12">
              <h2 className="text-4xl font-semibold text-white mb-4">
                Something went wrong
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed mb-6">
                We're experiencing some technical difficulties. Our team has been notified and is working to fix the issue.
              </p>
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-[15px] p-4 max-w-md mx-auto">
                <p className="text-orange-400 font-medium">
                  🔧 The app will be back soon
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary px-8 py-4 text-lg font-normal"
              >
                Try Again
              </button>
              
              <Link href="/dashboard">
                <button className="btn-secondary px-8 py-4 text-lg font-normal">
                  Go to Dashboard
                </button>
              </Link>
            </div>

            {/* Status Updates */}
            <div className="bg-gray-900 border border-gray-700 rounded-[15px] p-8 max-w-2xl mx-auto mb-16">
              <h3 className="text-xl font-semibold text-white mb-6">
                What's happening?
              </h3>
              <div className="space-y-4 text-left">
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Server Issue Detected</p>
                    <p className="text-gray-400 text-sm">Our monitoring systems have identified the problem</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Team Notified</p>
                    <p className="text-gray-400 text-sm">Our engineers are working on a fix</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-2 h-2 bg-gray-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-white font-medium">Resolution in Progress</p>
                    <p className="text-gray-400 text-sm">We're working to restore full service</p>
                  </div>
                </div>
              </div>
            </div>

            {/* What you can do */}
            <div className="mb-16">
              <h3 className="text-xl font-semibold text-white mb-6">
                What you can do:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <div className="bg-gray-900 border border-gray-700 rounded-[15px] p-6">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-[15px] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">Wait a few minutes</h4>
                  <p className="text-gray-400 text-sm">The issue might resolve itself automatically</p>
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-[15px] p-6">
                  <div className="w-12 h-12 bg-green-500/20 rounded-[15px] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-white font-medium mb-2">Check back later</h4>
                  <p className="text-gray-400 text-sm">We're working hard to fix this quickly</p>
                </div>
              </div>
            </div>

            {/* Contact Support */}
            <div className="pt-8 border-t border-gray-800">
              <p className="text-gray-400 mb-4">
                Need immediate assistance?
              </p>
              <Link href="/help">
                <button className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                  Contact Support →
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}