import ChatbotPageClient from '@/components/ChatbotPageClient';

interface Props {
  params: { botId: string };
}

export default function BotPage({ params }: Props) {
  return <ChatbotPageClient params={params} />;
}