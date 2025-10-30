
import React, { useState, useRef, useEffect, useCallback } from 'react';
import FeatureCard from '../components/FeatureCard';
import { connectLiveSession, createPcmBlob } from '../services/geminiService';
import { decode, encode, decodeAudioData } from '../utils/helpers';
import { MicIcon, StopIcon } from '../components/Icons';
import type { LiveSession, LiveServerMessage } from '@google/genai';

const LiveConversation: React.FC = () => {
    const [isSessionActive, setIsSessionActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [transcripts, setTranscripts] = useState<{ user: string, model: string }[]>([]);
    const [currentTurn, setCurrentTurn] = useState({ user: '', model: '' });

    const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
    const inputAudioContextRef = useRef<AudioContext | null>(null);
    const outputAudioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
    const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
    const nextStartTimeRef = useRef<number>(0);

    const cleanup = useCallback(() => {
        sessionPromiseRef.current?.then(session => session.close());
        sessionPromiseRef.current = null;

        scriptProcessorRef.current?.disconnect();
        scriptProcessorRef.current = null;

        inputAudioContextRef.current?.close();
        outputAudioContextRef.current?.close();
        inputAudioContextRef.current = null;
        outputAudioContextRef.current = null;

        mediaStreamRef.current?.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;

        sourcesRef.current.forEach(source => source.stop());
        sourcesRef.current.clear();
        nextStartTimeRef.current = 0;
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    const handleToggleSession = async () => {
        if (isSessionActive) {
            setIsSessionActive(false);
            cleanup();
            return;
        }

        setError(null);
        setTranscripts([]);
        setCurrentTurn({user: '', model: ''});
        setIsSessionActive(true);

        try {
            inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
            outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });

            sessionPromiseRef.current = connectLiveSession({
                onopen: () => {
                    const source = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
                    const scriptProcessor = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
                        const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
                        const pcmBlob = createPcmBlob(inputData, encode);
                        sessionPromiseRef.current?.then((session) => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputAudioContextRef.current!.destination);
                    scriptProcessorRef.current = scriptProcessor;
                },
                onmessage: async (message: LiveServerMessage) => {
                    if (message.serverContent?.outputTranscription) {
                        setCurrentTurn(prev => ({...prev, model: prev.model + message.serverContent!.outputTranscription!.text}));
                    }
                    if (message.serverContent?.inputTranscription) {
                         setCurrentTurn(prev => ({...prev, user: prev.user + message.serverContent!.inputTranscription!.text}));
                    }
                    if (message.serverContent?.turnComplete) {
                        setTranscripts(prev => [...prev, currentTurn]);
                        setCurrentTurn({ user: '', model: '' });
                    }
                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (audioData) {
                        const outCtx = outputAudioContextRef.current!;
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), outCtx, 24000, 1);
                        const source = outCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outCtx.destination);
                        source.addEventListener('ended', () => sourcesRef.current.delete(source));
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }
                },
                onerror: (e: ErrorEvent) => {
                    console.error('Session error:', e);
                    setError(e.message || 'An unknown error occurred.');
                    setIsSessionActive(false);
                    cleanup();
                },
                onclose: () => {
                    setIsSessionActive(false);
                    cleanup();
                },
            });

        } catch (e: any) {
            setError(e.message || 'Failed to start session.');
            setIsSessionActive(false);
            cleanup();
        }
    };
    
    return (
        <FeatureCard
            title="Live Conversation"
            description="Speak directly with Gemini in a real-time voice conversation. Press the microphone to start."
        >
            <div className="flex flex-col items-center justify-center space-y-6">
                <button
                    onClick={handleToggleSession}
                    className={`rounded-full p-6 transition-all duration-300 ease-in-out flex items-center justify-center
                    ${isSessionActive ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-500/50' : 'bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/50'}`}
                >
                    {isSessionActive ? <StopIcon /> : <MicIcon />}
                </button>
                <p className={`text-lg font-semibold ${isSessionActive ? 'text-green-400 animate-pulse' : 'text-gray-400'}`}>
                    {isSessionActive ? 'Session Active - Listening...' : 'Session Inactive'}
                </p>
            </div>
            
            {error && <div className="p-4 bg-red-900/50 text-red-300 border border-red-700 rounded-lg">{error}</div>}

            <div className="h-80 overflow-y-auto p-4 bg-gray-700/50 border border-gray-600 rounded-lg flex flex-col space-y-4">
                {transcripts.map((turn, index) => (
                    <React.Fragment key={index}>
                        {turn.user && <div className="text-right"><span className="p-2 bg-cyan-800 rounded-lg inline-block">{turn.user}</span></div>}
                        {turn.model && <div className="text-left"><span className="p-2 bg-gray-600 rounded-lg inline-block">{turn.model}</span></div>}
                    </React.Fragment>
                ))}
                 {currentTurn.user && <div className="text-right"><span className="p-2 bg-cyan-800/70 rounded-lg inline-block">{currentTurn.user}</span></div>}
                 {currentTurn.model && <div className="text-left"><span className="p-2 bg-gray-600/70 rounded-lg inline-block">{currentTurn.model}</span></div>}
            </div>
        </FeatureCard>
    );
};

export default LiveConversation;
