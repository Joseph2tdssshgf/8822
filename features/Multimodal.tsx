
import React, { useState, useRef } from 'react';
import FeatureCard from '../components/FeatureCard';
import { generateFromImage } from '../services/geminiService';
import { fileToBase64 } from '../utils/helpers';
import Spinner from '../components/Spinner';

const Multimodal: React.FC = () => {
    const [prompt, setPrompt] = useState<string>('What is in this image?');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [result, setResult] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async () => {
        if (!prompt || !imageFile || isLoading) return;
        setIsLoading(true);
        setError(null);
        setResult('');

        try {
            const imageBase64 = await fileToBase64(imageFile);
            const response = await generateFromImage(prompt, imageBase64, imageFile.type);
            setResult(response);
        } catch (e: any) {
            setError(e.message || 'An error occurred.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <FeatureCard
            title="Multimodal"
            description="Combine text and images in your prompt. Upload an image and ask Gemini about it."
        >
            <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center cursor-pointer hover:border-cyan-500 transition"
            >
                {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="max-h-full max-w-full object-contain rounded-lg" />
                ) : (
                    <p className="text-gray-400">Click to upload an image</p>
                )}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                />
            </div>
            
            <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter your prompt here..."
                rows={3}
                className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                disabled={isLoading}
            />

            <button
                onClick={handleSubmit}
                disabled={isLoading || !prompt || !imageFile}
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

export default Multimodal;
