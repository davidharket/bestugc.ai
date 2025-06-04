import Head from 'next/head';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

// Re-using a similar layout structure as Settings, can be a shared component
const HelpPageLayout: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  return (
    <>
      <Head>
        <title>{title} - Ad Automation Help</title>
      </Head>
      <div className="min-h-screen bg-gray-100 font-sans">
        <header className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">Help & Support</h1>
            {/* Optional: Link back to dashboard or other main app areas */}
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Sign Out
            </button>
          </div>
        </header>
        <main className="max-w-4xl mx-auto py-8 sm:px-6 lg:px-8">
          <div className="bg-white p-6 sm:p-8 rounded-[20px] shadow-md">
            {children}
          </div>
        </main>
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
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 font-sans">Loading...</div>;
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
      question: "What if I run out of credits?",
      answer: "If you don't have enough credits to create an ad (10 credits needed), the creation buttons on the dashboard will be disabled. You can purchase additional credits through the 'Top-up Credits' options on your dashboard."
    }
  ];

  return (
    <HelpPageLayout title="Help & Support">
      <div className="prose prose-sm max-w-none">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Frequently Asked Questions</h2>
        {faqs.map((faq, index) => (
          <FAQItem key={index} question={faq.question} answer={faq.answer} />
        ))}

        <hr className="my-8 border-gray-200" />

        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Contact Support</h2>
        <p className="text-sm text-gray-600 mb-1">
          If you can't find the answer to your question in our FAQs, please feel free to reach out to our support team.
        </p>
        <p className="text-sm text-gray-600">
          <strong>Email:</strong> <a href="mailto:support@example.com" className="text-indigo-600 hover:text-indigo-800">support@example.com</a> (Placeholder)
        </p>
        <p className="text-sm text-gray-600 mt-1">
          <strong>Phone:</strong> +1 (555) 123-4567 (Placeholder)
        </p>
         <p className="text-sm text-gray-600 mt-1">
          We aim to respond to all inquiries within 24-48 business hours.
        </p>
      </div>
    </HelpPageLayout>
  );
} 