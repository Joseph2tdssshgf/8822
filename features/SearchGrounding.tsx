
import React, { useState } from 'react';
import FeatureCard from '../components/FeatureCard';
import { generateWithSearch } from '../services/geminiService';
import { GroundingSource } from '../types';
import Spinner from '../components/Spinner';

const SearchGrounding: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('Who won the latest Formula 1 race?');
    const [result, setResult] = useState<string>('');
    const [sources, setSources] = useState<GroundingSource[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!prompt || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResult('');
        setSources([]);
        try {
            const response = await generateWithSearch(prompt);
            setResult(response.text);
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingChunks) {
                const webSources = groundingChunks
                    .map((chunk: any) => chunk.web)
                    .filter(Boolean) as GroundingSource[];
                setSources(webSources);
            }
        } catch (e: any) {
            setError(e.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FeatureCard
            title="Search Grounding"
            description="Ask questions about recent events. Gemini will use Google Search to find the most current information and provide sources."
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
                {isLoading ? <Spinner /> : 'Search and Generate'}
            </button>
            
            {error && <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

            {result && (
                <div className="mt-4 p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">Result</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{result}</p>
                    
                    {sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                            <h4 className="font-semibold text-gray-200 mb-2">Sources:</h4>
                            <ul className="list-disc list-inside space-y-1">
                                {sources.map((source, index) => (
                                    <li key={index} className="text-sm">
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                                            {source.title || source.uri}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </FeatureCard>
    );
};

export default SearchGrounding;
