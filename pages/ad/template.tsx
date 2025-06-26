// pages/ad/template.tsx
import { useRouter } from 'next/router';
import { useAdCreation } from '../../components/AdCreationContext';
import { TEMPLATE_LIBRARY, VideoTemplate } from '../../lib/templates'; // Import your library
import { useState } from 'react';

// A component to display a single template card
const TemplateCard: React.FC<{
  template: VideoTemplate;
  isSelected: boolean;
  onSelect: () => void;
}> = ({ template, isSelected, onSelect }) => (
  <div
    onClick={onSelect}
    className={`p-6 rounded-xl cursor-pointer transition-all duration-200 hover:scale-105 ${
      isSelected 
        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25' 
        : 'bg-gray-900 border border-gray-700 text-white hover:border-orange-500/50 hover:bg-gray-800'
    }`}
  >
    <h3 className="font-bold text-lg mb-2">{template.name}</h3>
    <p className={`text-sm leading-relaxed ${isSelected ? 'text-orange-100' : 'text-gray-400'}`}>
      {template.description}
    </p>
  </div>
);

export default function SelectTemplatePage() {
    const router = useRouter();
    const { adData, setAdData } = useAdCreation();
    // This line is now correct, as it's initializing with a string ID.
    const [selectedTemplateId, setSelectedTemplateId] = useState(adData.templateId || TEMPLATE_LIBRARY[0].id);
  
    const handleNext = () => {
      // This is now correctly saving a string to the context.
      setAdData({ templateId: selectedTemplateId });
      router.push('/ad/render');
    };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Choose a Template</h1>
          <p className="text-gray-400">Select a video style. The length will be determined by your script's audio.</p>
        </div>

        {/* Template Grid */}
        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Available Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TEMPLATE_LIBRARY.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                isSelected={selectedTemplateId === template.id}
                onSelect={() => setSelectedTemplateId(template.id)}
              />
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            className="btn-secondary"
            onClick={() => router.back()}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <button
            className={`btn-primary ${!selectedTemplateId ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleNext}
            disabled={!selectedTemplateId}
          >
            Continue to Final Step
            <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}