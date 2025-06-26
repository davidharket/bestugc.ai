// pages/landing.tsx
import { useSession, signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Layout } from '../components/Layout'; // Import the new Layout

// You can populate this array with the paths to your best avatar videos
const showcaseVideos = [
  '/avatars/female-brunette-adult-inside.mp4',
  '/avatars/male-brunette-adult-inside.mp4',
  '/avatars/female-blonde-senior-inside.mp4',
  '/avatars/female-blonde2-adult-inside.mp4',
];

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div className="text-gray-800">
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
              Never overpay for UGC again
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Transform your product link into dozens of high-converting video ads in minutes, not weeks.
            </p>
            <ul className="space-y-4 text-lg text-gray-600">
              <li className="flex items-start">
                <span className="text-2xl mr-4">🖍️</span>
                <span>Enter your product link → Create a UGC ad in minutes</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-4">👸</span>
                <span>Choose from a variety of characters and voices</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-4">💖</span>
                <span>Pick and choose from our set of proven converting templates</span>
              </li>
              <li className="flex items-start">
                <span className="text-2xl mr-4">🔬</span>
                <span>Experiment faster to see what content works for your business</span>
              </li>
            </ul>
          </div>

          <div className="flex items-center justify-center">
             <div className="bg-gray-50 p-8 rounded-2xl shadow-xl border border-gray-200 w-full max-w-md">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
                    Get Started for Free
                </h2>
                <button
                    onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                    className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200"
                >
                    <svg className="h-6 w-6 mr-3" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path><path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path><path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path><path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C41.38,36.331,44,30.651,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path></svg>
                    Sign in with Google
                </button>
             </div>
          </div>
        </div>
      </div>

      {/* New Video Showcase Section */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">See Our AI Avatars in Action</h2>
            <p className="mt-4 text-lg text-gray-600">
              Lifelike, diverse, and ready to be the face of your brand.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {showcaseVideos.map((videoSrc, index) => (
              <div key={index} className="rounded-lg overflow-hidden shadow-lg transform hover:scale-105 transition-transform duration-300">
                <video
                  src={videoSrc}
                  className="w-full h-full object-cover aspect-[9/16]"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}