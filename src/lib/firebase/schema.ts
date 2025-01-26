// Firebase Schema Organization

interface Product {
  name: string;
  price: string;
  description: string;
}

interface ChatMessage {
  timestamp: string;
  role: 'user' | 'assistant';
  content: string;
  messageId: string; // Unique ID for each message
}

interface ChatbotDocument {
  id: string;
  name: string;
  userId: string;
  config: {
    behaviourPrompt: string;
    taskPrompt: string;
    welcomeMessage: string;
    // ... other config
  };
  training: {
    type: 'file' | 'url';
    content: string;
    sources: {
      urls?: string[];
      file?: {
        name: string;
        content: string;
        type: string;
      };
    };
    products?: Product[];
  };
  conversations: {
    [sessionId: string]: {
      messages: ChatMessage[];
      metadata: {
        lastMessageAt: string;
        sessionId: string;
        deviceInfo: {
          userAgent: string;
          platform: string;
        };
        status: 'active' | 'closed';
        customerName?: string;
        customerPhone?: string;
      };
    };
  };
  reservations: {
    [reservationId: string]: {
      customerName: string;
      customerPhone: string;
      service: string;
      requestedDate: string;
      status: 'pending' | 'confirmed' | 'cancelled';
      notes: string;
      createdAt: string;
    };
  };
  createdAt: string;
  updatedAt: string;
} 