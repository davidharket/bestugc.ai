import Head from 'next/head';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';

// Re-using a similar layout structure as Settings, but with dark theme
const HelpPageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <>
      <Head>
        <title>{title} - Ageco.ai Help</title>
      </Head>
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </div>
    </>
  );
};

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  // Basic accordion-like structure could be added here with useState if needed
  return (
    <div className="mb-4">
      <h3 className="text-md font-semibold text-gray-800 mb-1">{question}</h3>
      <p className="text-sm text-gray-600 whitespace-pre-line">{answer}</p>
    </div>
  );
};

export default function HelpPage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-orange-500"></div>
      </div>
    );
  }
  
  // Only render if authenticated (or adjust if help page should be public)
  if (status !== 'authenticated') {
      return null; // Or a more specific message/redirect if preferred for unauth access to help
  }

  const faqs = [
    {
      question: "How do I create a new ad?",
      answer: "Navigate to the Dashboard and click on either 'Start with URL' after entering a product link, or 'Create Ad From Scratch'. Follow the on-screen steps to add product details, assets, choose formatting, script, and avatar, then render your video."
    },
    {
      question: "How are credits used?",
      answer: "Each video ad creation costs 10 credits. You receive credits with your initial plan and can purchase more via the 'Top-up Credits' section on your Dashboard."
    },
    {
      question: "How do I change my subscription plan?",
      answer: "You can manage your subscription, including changing or canceling your plan, through the Stripe Customer Portal. Access it via the 'Manage Subscription' button on your Dashboard."
    },
    {
      question: "What video formats and durations are supported?",
      answer: "Currently, we support Landscape (16:9) and Portrait (9:16) formats, and durations of 15, 30, or 60 seconds. You can select these options during the 'Format Video' step of ad creation."
    },
    {
      question: "Can I edit the generated script?",
      answer: "Yes! During the script selection step, you can choose from AI-generated scripts or write your own custom script. All scripts can be edited before proceeding to the next step."
    },
    {
      question: "How long does video rendering take?",
      answer: "Video rendering typically takes 2-5 minutes depending on the complexity and length of your ad. You'll receive a notification when your video is ready."
    },
    {
      question: "What languages are supported?",
      answer: "We currently support Norwegian, Danish, Swedish, and English for video narration and script generation."
    },
    {
      question: "Can I download my completed videos?",
      answer: "Yes! Once your video is completed, you can download it directly from your 'My Creations' page or from the Dashboard."
    }
  ];

  return (
    <HelpPageLayout title="Help & Support">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
            <p className="text-gray-400">Find answers to common questions about creating AI video ads</p>
          </div>
          <Link
            href="/dashboard"
            className="btn-primary"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link href="/dashboard" className="card-interactive text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="font-semibold text-white mb-2">Create New Ad</h3>
          <p className="text-gray-400 text-sm">Start creating your next video ad</p>
        </Link>

        <Link href="/creations" className="card-interactive text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="font-semibold text-white mb-2">My Creations</h3>
          <p className="text-gray-400 text-sm">View and manage your videos</p>
        </Link>

        <Link href="/settings" className="card-interactive text-center">
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="font-semibold text-white mb-2">Account Settings</h3>
          <p className="text-gray-400 text-sm">Manage your account and subscription</p>
        </Link>
      </div>

      {/* FAQ Section */}
      <div className="card">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="border-b border-gray-800 pb-6 last:border-b-0">
              <h3 className="text-lg font-semibold text-white mb-3">{faq.question}</h3>
              <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="card mt-8 text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Still Need Help?</h3>
        <p className="text-gray-400 mb-4">
          Can't find what you're looking for? Our support team is here to help.
        </p>
        <a
          href="mailto:support@ageco.ai"
          className="btn-primary inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Contact Support
        </a>
      </div>
    </HelpPageLayout>
  );
} 