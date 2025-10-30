import React from 'react';

interface ApiKeySelectorProps {
    onKeySelected: () => void;
}

// Fix: Define an interface for the aistudio object to avoid conflicting global declarations.
interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
}

declare global {
    interface Window {
        aistudio: AIStudio;
    }
}

const ApiKeySelector: React.FC<ApiKeySelectorProps> = ({ onKeySelected }) => {
    const handleSelectKey = async () => {
        if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
            try {
                await window.aistudio.openSelectKey();
                // Assume success after the dialog is closed, to handle potential race conditions.
                onKeySelected();
            } catch (error) {
                console.error("Error opening API key selection:", error);
                // Optionally show an error message to the user
            }
        } else {
            console.error("aistudio API not available.");
        }
    };
    
    return (
        <div className="bg-yellow-900/30 border border-yellow-600 rounded-lg p-6 text-center">
            <h3 className="text-xl font-semibold text-yellow-300 mb-2">API Key Required for Video Generation</h3>
            <p className="text-yellow-400 mb-4">
                The Veo video generation model requires you to select an API key. Your project must be configured for billing.
            </p>
            <p className="text-sm text-yellow-500 mb-6">
                For more information, please visit the{" "}
                <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-yellow-300"
                >
                    billing documentation
                </a>.
            </p>
            <button
                onClick={handleSelectKey}
                className="bg-yellow-500 text-gray-900 font-bold py-2 px-6 rounded-lg hover:bg-yellow-400 transition-colors"
            >
                Select API Key
            </button>
        </div>
    );
};

export default ApiKeySelector;
