
import React, { useState, useEffect } from 'react';
import FeatureCard from '../components/FeatureCard';
import ApiKeySelector from '../components/ApiKeySelector';
import { generateVideo, pollVideoOperation } from '../services/geminiService';
import Spinner from '../components/Spinner';
import type { VideosOperation, GenerateVideosResponse } from '@google/genai';


const aspectRatios = ["16:9", "9:16"];
const resolutions = ["720p", "1080p"];

const VideoGeneration: React.FC = () => {
    const [apiKeySelected, setApiKeySelected] = useState(false);
    const [prompt, setPrompt] = useState<string>('A cinematic shot of a futuristic city at sunset, with flying cars.');
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [resolution, setResolution] = useState<string>('720p');
    const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [loadingMessage, setLoadingMessage] = useState<string>('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const checkApiKey = async () => {
            if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === 'function') {
                const hasKey = await window.aistudio.hasSelectedApiKey();
                setApiKeySelected(hasKey);
            }
        };
        checkApiKey();
    }, []);

    const resetToSelectKey = () => {
        setApiKeySelected(false);
        setIsLoading(false);
        setLoadingMessage('');
    }

    const handleSubmit = async () => {
        if (!prompt || isLoading) return;
        setIsLoading(true);
        setError(null);
        setGeneratedVideoUrl(null);
        
        try {
            setLoadingMessage('Starting video generation...');
            let operation: VideosOperation<GenerateVideosResponse> = await generateVideo(prompt, aspectRatio, resolution);

            setLoadingMessage('Processing video... This may take a few minutes. Polling for results.');
            while (!operation.done) {
                await new Promise(resolve => setTimeout(resolve, 10000));
                operation = await pollVideoOperation(operation);
            }

            setLoadingMessage('Fetching video data...');
            const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (downloadLink) {
                 // The API key is appended for authentication
                const videoUrlWithKey = `${downloadLink}&key=${process.env.API_KEY}`;
                setGeneratedVideoUrl(videoUrlWithKey);
            } else {
                throw new Error('Video generation finished, but no download link was provided.');
            }

        } catch (e: any) {
             if(e.message?.includes('Requested entity was not found')) {
                setError("API Key not found or invalid. Please select a valid key.");
                resetToSelectKey();
            } else {
                setError(e.message || 'An error occurred during video generation.');
            }
        } finally {
            setIsLoading(false);
            setLoadingMessage('');
        }
    };
    
    if (!apiKeySelected) {
        return (
             <FeatureCard title="Video Generation" description="Create stunning videos from text prompts using the Veo model.">
                 <ApiKeySelector onKeySelected={() => setApiKeySelected(true)} />
            </FeatureCard>
        );
    }

    return (
        <FeatureCard
            title="Video Generation"
            description="Create stunning videos from text prompts using the Veo model."
        >
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a detailed description for the video..."
                rows={3}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                disabled={isLoading}
            />
            
            <div className='flex flex-col md:flex-row gap-6'>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                    <div className="flex flex-wrap gap-2">
                        {aspectRatios.map(ratio => (
                            <button key={ratio} onClick={() => setAspectRatio(ratio)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${aspectRatio === ratio ? 'bg-cyan-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`} disabled={isLoading}>
                                {ratio}
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Resolution</label>
                    <div className="flex flex-wrap gap-2">
                        {resolutions.map(res => (
                            <button key={res} onClick={() => setResolution(res)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${resolution === res ? 'bg-cyan-600 text-white' : 'bg-gray-600 hover:bg-gray-500'}`} disabled={isLoading}>
                                {res}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt}
                className="w-full flex justify-center items-center bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 transition-colors"
            >
                {isLoading ? <Spinner /> : 'Generate Video'}
            </button>
            
            {error && <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

            {isLoading && (
                <div className="flex flex-col items-center justify-center p-6 bg-gray-700/50 rounded-lg">
                    <Spinner />
                    <p className="mt-2 text-gray-300">{loadingMessage}</p>
                </div>
            )}
            
            {generatedVideoUrl && (
                <div className="mt-4 p-2 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2 p-2">Result</h3>
                    <video controls src={generatedVideoUrl} className="w-full rounded-md" />
                </div>
            )}
        </FeatureCard>
    );
};

export default VideoGeneration;
