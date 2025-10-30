
import React, { useState, useEffect } from 'react';
import FeatureCard from '../components/FeatureCard';
import { generateWithMaps } from '../services/geminiService';
import { GroundingSource } from '../types';
import Spinner from '../components/Spinner';

interface Location {
    latitude: number;
    longitude: number;
}

interface MapSource extends GroundingSource {
    type: 'place';
}

interface ReviewSnippet {
    uri: string;
    placeName: string;
    text: string;
    type: 'review';
}

type CombinedSource = MapSource | ReviewSnippet;

const MapsGrounding: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('What are some good cafes near me?');
    const [result, setResult] = useState<string>('');
    const [sources, setSources] = useState<CombinedSource[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<Location | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                    setIsLoading(false);
                },
                (err) => {
                    setError(`Geolocation error: ${err.message}. Please allow location access.`);
                    setIsLoading(false);
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
            setIsLoading(false);
        }
    }, []);
    

    const handleSubmit = async () => {
        if (!prompt || isLoading || !location) return;
        if (!location) {
            setError("Location not available. Please enable location services.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setResult('');
        setSources([]);
        try {
            const response = await generateWithMaps(prompt, location.latitude, location.longitude);
            setResult(response.text);
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            
            if (groundingChunks) {
                const combinedSources: CombinedSource[] = [];
                groundingChunks.forEach((chunk: any) => {
                    if (chunk.maps) {
                        combinedSources.push({ ...chunk.maps, type: 'place' });
                        if (chunk.maps.placeAnswerSources?.reviewSnippets) {
                            chunk.maps.placeAnswerSources.reviewSnippets.forEach((snippet: any) => {
                                combinedSources.push({ ...snippet, type: 'review' });
                            });
                        }
                    }
                });
                setSources(combinedSources);
            }

        } catch (e: any) {
            setError(e.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderSource = (source: CombinedSource, index: number) => {
        if (source.type === 'place') {
            return (
                 <li key={index} className="text-sm">
                    <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
                        {source.title || `View on Google Maps`}
                    </a>
                </li>
            );
        }
        if (source.type === 'review') {
            return (
                 <li key={index} className="text-sm bg-gray-700 p-2 rounded-md">
                     <p className='italic text-gray-300'>"{source.text}"</p>
                     <a href={source.uri} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline text-xs">
                         - Review for {source.placeName}
                    </a>
                </li>
            )
        }
        return null;
    }

    return (
        <FeatureCard
            title="Maps Grounding"
            description="Ask location-based questions. Gemini uses Google Maps to provide relevant, geographically-aware answers."
        >
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                rows={4}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                disabled={isLoading || !location}
            />
            <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt || !location}
                className="w-full flex justify-center items-center bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 transition-colors"
            >
                {isLoading && !result ? <Spinner /> : 'Search with Maps'}
            </button>
            
            {error && <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

            {(isLoading && !result) && (
                 <div className="flex flex-col items-center justify-center p-6 bg-gray-700/50 rounded-lg">
                    <Spinner />
                    <p className="mt-2 text-gray-300">{location ? 'Searching for places...' : 'Waiting for location...'}</p>
                </div>
            )}

            {result && (
                <div className="mt-4 p-4 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2">Result</h3>
                    <p className="text-gray-300 whitespace-pre-wrap">{result}</p>
                    
                    {sources.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-600">
                            <h4 className="font-semibold text-gray-200 mb-2">Sources:</h4>
                            <ul className="list-inside space-y-2">
                                {sources.map(renderSource)}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </FeatureCard>
    );
};

export default MapsGrounding;
