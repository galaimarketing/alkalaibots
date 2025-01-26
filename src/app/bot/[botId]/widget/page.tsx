import ChatbotPreview from '@/components/ChatbotPreview';

export default function WidgetPage({ params }: { params: { botId: string } }) {
  return (
    <div style={{ 
      background: 'transparent', 
      width: '100%', 
      height: '100%', 
      overflow: 'hidden',
      margin: 0,
      padding: 0
    }}>
      <ChatbotPreview params={params} isPreview={false} />
    </div>
  );
} 