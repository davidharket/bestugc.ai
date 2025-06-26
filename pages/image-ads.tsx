// pages/image-ads.tsx
import { useState } from 'react';
import { Layout } from '../components/Layout';

export default function ImageAdsPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would add logic to send the email to your mailing list API
    console.log('Waitlist submission:', email);
    setSubmitted(true);
  };

  return (
    <Layout>
      <div className="relative bg-white py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <div className="mx-auto max-w-2xl">
            <p className="text-base font-semibold leading-7 text-indigo-600">Coming Soon</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              The Future of Product Placement: AI Image Ads
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Imagine your product, seamlessly held and showcased by our AI avatars in any setting. Generate lifestyle product photos for your social media, ads, and e-commerce store in seconds.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-4xl">
            <div className="grid grid-cols-1 gap-y-10 md:grid-cols-3 md:gap-x-8 md:gap-y-0">
                <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-indigo-600">1.</div>
                    <p className="mt-2 font-semibold">Upload Your Product</p>
                    <p className="mt-1 text-sm text-gray-500">Provide an image of your product with a transparent background.</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-indigo-600">2.</div>
                    <p className="mt-2 font-semibold">Choose Your Avatar</p>
                    <p className="mt-1 text-sm text-gray-500">Select an avatar and a scene from our growing library.</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="text-3xl font-bold text-indigo-600">3.</div>
                    <p className="mt-2 font-semibold">Generate Image</p>
                    <p className="mt-1 text-sm text-gray-500">Our AI generates a photorealistic image of the avatar using your product.</p>
                </div>
            </div>
          </div>

          <div className="mx-auto mt-20 max-w-lg">
            {submitted ? (
              <p className="text-lg font-medium text-green-600">Thank you! You're on the waitlist.</p>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-x-4">
                <label htmlFor="email-address" className="sr-only">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="min-w-0 flex-auto rounded-md border-gray-300 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  placeholder="Enter your email"
                />
                <button
                  type="submit"
                  className="flex-none rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Join Waitlist
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}