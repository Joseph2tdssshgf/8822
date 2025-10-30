
import React, { useState, useRef, useEffect } from 'react';
import FeatureCard from '../components/FeatureCard';
import { createChat } from '../services/geminiService';
import { ChatMessage } from '../types';
import Spinner from '../components/Spinner';
import type { Chat } from '@google/genai';

const ChatComponent: React.FC = () => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setChat(createChat());
    }, []);

    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async () => {
        if (!userInput.trim() || isLoading || !chat) return;

        const newUserMessage: ChatMessage = { role: 'user', text: userInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);
        setError(null);

        try {
            let modelResponseText = '';
            const stream = await chat.sendMessageStream({ message: userInput });
            
            // Add a placeholder for the model's response
            setMessages(prev => [...prev, { role: 'model', text: '' }]);

            for await (const chunk of stream) {
                modelResponseText += chunk.text;
                setMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1] = { role: 'model', text: modelResponseText };
                    return newMessages;
                });
            }
        } catch (e: any) {
            setError(e.message || 'An error occurred during the chat.');
            setMessages(prev => prev.slice(0, -1)); // Remove user message on error
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <FeatureCard
            title="Chat"
            description="Have a conversation with Gemini. It remembers the context of your discussion."
        >
            <div 
                ref={chatContainerRef} 
                className="h-96 overflow-y-auto p-4 bg-gray-700/50 border border-gray-600 rounded-lg flex flex-col space-y-4"
            >
                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${
                            msg.role === 'user' 
                                ? 'bg-cyan-600 text-white rounded-br-none' 
                                : 'bg-gray-600 text-gray-200 rounded-bl-none'
                        }`}>
                            <p className="whitespace-pre-wrap">{msg.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                         <div className="max-w-lg p-3 rounded-2xl bg-gray-600 text-gray-200 rounded-bl-none flex items-center">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-2"></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse mr-2 delay-150"></div>
                            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse delay-300"></div>
                        </div>
                    </div>
                )}
            </div>

            {error && <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type your message..."
                    className="flex-1 p-3 bg-gray-700 rounded-lg border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition"
                    disabled={isLoading}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !userInput.trim()}
                    className="bg-cyan-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 transition-colors"
                >
                    Send
                </button>
            </div>
        </FeatureCard>
    );
};

export default ChatComponent;

