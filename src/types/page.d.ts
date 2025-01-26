import { ChatbotData } from '@/types/chatbot';

declare module 'next' {
  interface PageProps {
    params: { botId: string };
    previewConfig?: ChatbotData;
    searchParams?: { [key: string]: string | string[] | undefined };
  }
} 