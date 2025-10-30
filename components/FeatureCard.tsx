
import React from 'react';

interface FeatureCardProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, children }) => {
  return (
    <div className="bg-gray-800/50 rounded-2xl shadow-lg p-6 md:p-8 w-full max-w-4xl mx-auto border border-gray-700/50">
      <h2 className="text-3xl font-bold text-cyan-400 mb-2">{title}</h2>
      <p className="text-gray-400 mb-6">{description}</p>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

export default FeatureCard;
