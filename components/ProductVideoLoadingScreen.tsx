import React from 'react';
import SimpleLoader from './SimpleLoader';
import BarLoader from './BarLoader';

interface ProductVideoLoadingScreenProps {
  currentStep?: number;
  onComplete?: () => void;
}

const ProductVideoLoadingScreen: React.FC<ProductVideoLoadingScreenProps> = ({ 
  currentStep = 1,
  onComplete 
}) => {
  const steps = [
    { id: 1, label: 'Preparing product video...' },
    { id: 2, label: 'Generating video...' },
    { id: 3, label: 'Combining with avatar video...' }
  ];

  return (
    <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-50">
      <div className="text-center max-w-lg mx-auto px-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8 whitespace-nowrap">Generating your video</h1>
        
        {/* Loader */}
        <div className="mx-auto mb-6">
          <BarLoader size="xl" />
        </div>
        
        {/* Current stage text */}
        <p className="text-lg md:text-xl text-gray-300 leading-relaxed">
          {steps.find(step => step.id === currentStep)?.label || 'Getting started...'}
        </p>
      </div>
    </div>
  );
};

export default ProductVideoLoadingScreen;