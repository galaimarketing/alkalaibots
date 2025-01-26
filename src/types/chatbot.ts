export interface IChatbotData {
  userId: string;
  config: {
    name: string;
    welcomeMessage: string;
    primaryColor: string;
    backgroundColor: string;
    botTextColor: string;
    botMessageBg: string;
    userTextColor: string;
    userMessageBg: string;
    behaviourPrompt: string;
    taskPrompt: string;
    botIconColor?: string;
    inputFieldBg?: string;
    inputTextColor?: string;
    buttonColor?: string;
  };
  training?: {
    type: 'file' | 'url';
    content: string;
    sources: {
      urls?: string[];
      file?: { name: string; content: string; type: string; } | null;
    };
  };
}

export interface ChatbotPageProps {
  params: { botId: string };
  previewConfig?: IChatbotData;
  isPreview?: boolean;
  containerClassName?: string;
}

export interface ProductData {
  name: string;
  price: string;
  description: string;
}

export interface TrainingData {
  type: 'file' | 'url';
  content: string;
  originalContent?: any;
  sources: {
    file?: { name: string; content: string; type: string; } | null;
    urls: string[];
  };
  products?: ProductData[];
} 