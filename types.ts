
export enum Feature {
  Text = 'Text Generation',
  StreamingText = 'Streaming Text',
  Chat = 'Chat',
  Multimodal = 'Multimodal',
  Image = 'Image Generation',
  Video = 'Video Generation',
  Live = 'Live Conversation',
  Search = 'Search Grounding',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GroundingSource {
    uri: string;
    title: string;
}

// Fix: Moved from ApiKeySelector.tsx to provide a single, global definition for the aistudio object
// and avoid conflicting global declarations.
declare global {
    interface Window {
        aistudio: {
            hasSelectedApiKey: () => Promise<boolean>;
            openSelectKey: () => Promise<void>;
        };
    }
}
