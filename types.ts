
export enum Feature {
  Text = 'Text Generation',
  StreamingText = 'Streaming Text',
  Chat = 'Chat',
  Multimodal = 'Multimodal',
  Image = 'Image Generation',
  Video = 'Video Generation',
  Live = 'Live Conversation',
  Search = 'Search Grounding',
  Maps = 'Maps Grounding',
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface GroundingSource {
    uri: string;
    title: string;
}