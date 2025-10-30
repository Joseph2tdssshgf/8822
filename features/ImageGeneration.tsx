
import React, { useState } from 'react';
import FeatureCard from '../components/FeatureCard';
import { generateImage } from '../services/geminiService';
import Spinner from '../components/Spinner';

const aspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];

const ImageGeneration: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('A photorealistic image of an astronaut riding a horse on Mars.');
    const [aspectRatio, setAspectRatio] = useState<string>('1:1');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!prompt || isLoading) return;
        setIsLoading(true);
        setError(null);
        setGeneratedImage(null);
        try {
            const imageUrl = await generateImage(prompt, aspectRatio);
            setGeneratedImage(imageUrl);
        } catch (e: any) {
            setError(e.message || 'An error occurred during image generation.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FeatureCard
            title="Image Generation"
            description="Create high-quality images from text descriptions using the Imagen model."
        >
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a detailed description for the image..."
                rows={3}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                disabled={isLoading}
            />
            
            <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
                <div className="flex flex-wrap gap-2">
                    {aspectRatios.map(ratio => (
                        <button
                            key={ratio}
                            onClick={() => setAspectRatio(ratio)}
                            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                                aspectRatio === ratio 
                                ? 'bg-cyan-600 text-white' 
                                : 'bg-gray-600 hover:bg-gray-500'
                            }`}
                            disabled={isLoading}
                        >
                            {ratio}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt}
                className="w-full flex justify-center items-center bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 transition-colors"
            >
                {isLoading ? <Spinner /> : 'Generate Image'}
            </button>
            
            {error && <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

            {isLoading && (
                <div className="flex flex-col items-center justify-center p-6 bg-gray-700/50 rounded-lg">
                    <Spinner />
                    <p className="mt-2 text-gray-300">Generating image... this may take a moment.</p>
                </div>
            )}
            
            {generatedImage && (
                <div className="mt-4 p-2 bg-gray-700/50 border border-gray-600 rounded-lg">
                    <h3 className="text-lg font-semibold text-cyan-400 mb-2 p-2">Result</h3>
                    <img src={generatedImage} alt="Generated" className="w-full rounded-md" />
                </div>
            )}
        </FeatureCard>
    );
};

export default ImageGeneration;
