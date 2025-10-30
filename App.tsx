
import React, { useState, useEffect } from 'react';
import { Feature } from './types';
import TextGeneration from './features/TextGeneration';
import StreamingText from './features/StreamingText';
import Chat from './features/Chat';
import Multimodal from './features/Multimodal';
import ImageGeneration from './features/ImageGeneration';
import VideoGeneration from './features/VideoGeneration';
import LiveConversation from './features/LiveConversation';
import SearchGrounding from './features/SearchGrounding';
import MapsGrounding from './features/MapsGrounding';
import { MenuIcon, XIcon } from './components/Icons';

const featureComponents: Record<Feature, React.ComponentType> = {
  [Feature.Text]: TextGeneration,
  [Feature.StreamingText]: StreamingText,
  [Feature.Chat]: Chat,
  [Feature.Multimodal]: Multimodal,
  [Feature.Image]: ImageGeneration,
  [Feature.Video]: VideoGeneration,
  [Feature.Live]: LiveConversation,
  [Feature.Search]: SearchGrounding,
  [Feature.Maps]: MapsGrounding,
};

const ApiKeyForm: React.FC<{ onKeySubmit: (key: string) => void }> = ({ onKeySubmit }) => {
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            onKeySubmit(key.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700 w-full max-w-md">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4">Enter Your Gemini API Key</h2>
                <p className="text-gray-400 mb-6">
                    To use this application in the browser, you need to provide your own Google Gemini API key. Your key is stored only in your browser's session storage and is cleared when you close the tab.
                </p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Enter your API key"
                        className="w-full p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition mb-4"
                        autoFocus
                    />
                    <button
                        type="submit"
                        className="w-full bg-cyan-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 transition-colors"
                        disabled={!key.trim()}
                    >
                        Save and Continue
                    </button>
                </form>
                <p className="text-xs text-gray-500 mt-4 text-center">
                    You can get a key from{" "}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline hover:text-cyan-400">
                        Google AI Studio
                    </a>.
                </p>
            </div>
        </div>
    );
};


const App: React.FC = () => {
    const [activeFeature, setActiveFeature] = useState<Feature>(Feature.Text);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [apiKey, setApiKey] = useState<string | null>(null);

    useEffect(() => {
        const storedKey = sessionStorage.getItem('gemini-api-key');
        if (storedKey) {
            setApiKey(storedKey);
        }
    }, []);

    const handleKeySubmit = (key: string) => {
        sessionStorage.setItem('gemini-api-key', key);
        setApiKey(key);
    };

    if (!apiKey) {
        return <ApiKeyForm onKeySubmit={handleKeySubmit} />;
    }

    const ActiveComponent = featureComponents[activeFeature];

    const NavLink: React.FC<{ feature: Feature }> = ({ feature }) => (
        <button
            onClick={() => {
                setActiveFeature(feature);
                setIsSidebarOpen(false);
            }}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                activeFeature === feature
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
            }`}
        >
            {feature}
        </button>
    );

    return (
        <div className="flex h-screen bg-gray-900 text-gray-100">
            {/* Sidebar */}
            <aside
                className={`bg-gray-800/80 backdrop-blur-sm border-r border-gray-700/50 w-64 min-w-[256px] p-4 flex-col fixed inset-y-0 left-0 z-20 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
                    isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold text-white">Gemini Showcase</h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
                        <XIcon />
                    </button>
                </div>
                <nav className="flex flex-col space-y-2">
                    {Object.values(Feature).map((feature) => (
                        <NavLink key={feature} feature={feature} />
                    ))}
                </nav>
            </aside>
            
            {/* Main Content */}
            <main className="flex-1 flex flex-col lg:ml-64">
                <header className="bg-gray-800/50 backdrop-blur-sm p-4 flex items-center lg:hidden sticky top-0 z-10 border-b border-gray-700">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-gray-300 hover:text-white mr-4">
                        <MenuIcon />
                    </button>
                    <h2 className="text-xl font-semibold">{activeFeature}</h2>
                </header>
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                    <ActiveComponent />
                </div>
            </main>
        </div>
    );
};

export default App;