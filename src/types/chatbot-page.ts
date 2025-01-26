import { IChatbotData } from '@/types/chatbot';

export interface ChatbotPageProps {
  params: { botId: string };
  previewConfig?: IChatbotData;
  isPreview?: boolean;
  containerClassName?: string;
}

declare module 'next' {
  interface PageProps {
    params: { botId: string };
  }
} 