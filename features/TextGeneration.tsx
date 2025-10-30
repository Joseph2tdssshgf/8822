
import React, { useState } from 'react';
import FeatureCard from '../components/FeatureCard';
import { generateText } from '../services/geminiService';
import Spinner from '../components/Spinner';

const TextGeneration: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('Write a short story about a robot who discovers music.');
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!prompt || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResult('');
        try {
            const response = await generateText(prompt);
            setResult(response);
        } catch (e: any) {
            setError(e.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FeatureCard
            title="Text Generation"
            description="Provide a text prompt and Gemini will generate a creative and relevant response."
        >
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                rows={4}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                disabled={isLoading}
            />
            <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt}
                className="w-full flex justify-center items-center bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 transition-colors"
            >
                {isLoading ? <Spinner /> : 'Generate'}
            </button>
            
            {error && <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

            {result && (
                <div className="mt-4 p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">Result</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{result}</p>
                </div>
            )}
        </FeatureCard>
    );
};

export default TextGeneration;
