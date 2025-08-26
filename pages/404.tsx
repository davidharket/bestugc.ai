// pages/404.tsx
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';

export default function Custom404() {
  const router = useRouter();

  return (
    <>
      <Head>
        <title>Page Not Found - Best UGC</title>
        <meta name="description" content="The page you're looking for doesn't exist." />
      </Head>
      
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Large 404 */}
            <div className="mb-8">
              <h1 className="text-9xl font-bold text-orange-500 mb-4">404</h1>
              <div className="w-32 h-1 bg-orange-500 mx-auto rounded-full mb-8"></div>
            </div>

            {/* Error Message */}
            <div className="mb-12">
              <h2 className="text-4xl font-semibold text-white mb-4">
                Oops! Page not found
              </h2>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
                The page you're looking for doesn't exist. It might have been moved, deleted, or you entered the wrong URL.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
                <button className="btn-primary px-8 py-4 text-lg font-normal">
                  Go to Dashboard
                </button>
              </Link>
              
              <button 
                onClick={() => router.back()}
                className="btn-secondary px-8 py-4 text-lg font-normal"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
