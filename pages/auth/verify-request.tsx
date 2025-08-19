import Link from 'next/link';

export default function VerifyRequest() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Check your email</h1>
        <p className="text-gray-600 mb-4">
          A sign-in link has been sent to your email address.
        </p>
        <p className="text-gray-600 mb-8">
          Please check your inbox (and spam folder) and click the link to sign in.
        </p>
        <Link href="/" legacyBehavior>
          <a className="text-indigo-600 hover:text-indigo-800 font-medium">
            Return to homepage
          </a>
        </Link>
      </div>
    </div>
  );
} 