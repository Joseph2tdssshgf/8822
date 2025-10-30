
import { GoogleGenAI, GenerateContentResponse, Chat, Modality, VideosOperation, GenerateVideosResponse, LiveSession, LiveServerMessage, Blob } from '@google/genai';

// IMPORTANT: This assumes process.env.API_KEY is available in the environment.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Text Generation
export const generateText = async (prompt: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
    return response.text;
};

// Streaming Text Generation
export const generateTextStream = async (prompt: string) => {
    const ai = getAI();
    return ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: prompt,
    });
};

// Chat
export const createChat = (): Chat => {
    const ai = getAI();
    return ai.chats.create({
        model: 'gemini-2.5-flash',
    });
};

// Multimodal (Text + Image)
export const generateFromImage = async (prompt: string, imageBase64: string, mimeType: string): Promise<string> => {
    const ai = getAI();
    const imagePart = {
        inlineData: {
            mimeType,
            data: imageBase64,
        },
    };
    const textPart = { text: prompt };
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
    });
    return response.text;
};

// Image Generation
export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
    const ai = getAI();
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt,
        config: {
            numberOfImages: 1,
            outputMimeType: 'image/png',
            aspectRatio: aspectRatio as "1:1" | "3:4" | "4:3" | "9:16" | "16:9",
        },
    });
    const base64ImageBytes = response.generatedImages[0].image.imageBytes;
    return `data:image/png;base64,${base64ImageBytes}`;
};


// Video Generation
export const generateVideo = async (prompt: string, aspectRatio: string, resolution: string): Promise<VideosOperation<GenerateVideosResponse>> => {
    // A new instance must be created right before the call to use the latest selected key.
    const ai = getAI();
    return ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt,
        config: {
            numberOfVideos: 1,
            resolution: resolution as '720p' | '1080p',
            aspectRatio: aspectRatio as '16:9' | '9:16',
        },
    });
};

export const pollVideoOperation = async (operation: VideosOperation<GenerateVideosResponse>): Promise<VideosOperation<GenerateVideosResponse>> => {
    const ai = getAI();
    return ai.operations.getVideosOperation({ operation });
};

// Live Conversation
export const connectLiveSession = async (
    callbacks: {
        onopen: () => void;
        onmessage: (message: LiveServerMessage) => Promise<void>;
        onerror: (e: ErrorEvent) => void;
        onclose: (e: CloseEvent) => void;
    }
): Promise<LiveSession> => {
    const ai = getAI();
    return ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: callbacks,
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: 'You are a friendly and helpful conversational AI. Keep your responses concise.',
        },
    });
};

export const createPcmBlob = (inputData: Float32Array, encodeFn: (bytes: Uint8Array) => string): Blob => {
    const l = inputData.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = inputData[i] * 32768;
    }
    return {
        data: encodeFn(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
};

// Search Grounding
export const generateWithSearch = async (prompt: string) => {
    const ai = getAI();
    return ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
};
