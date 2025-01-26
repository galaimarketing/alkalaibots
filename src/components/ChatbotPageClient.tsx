'use client';

import { useState, useEffect } from 'react';
import ChatbotPreview from './ChatbotPreview';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Props {
  params: { botId: string };
}

export default function ChatbotPageClient({ params }: Props) {
  const [botData, setBotData] = useState<any>(null);

  useEffect(() => {
    const loadBot = async () => {
      try {
        const docRef = doc(db, 'chatbots', params.botId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setBotData(docSnap.data());
        }
      } catch (error) {
        console.error('Error loading bot:', error);
      }
    };

    loadBot();
  }, [params.botId]);

  if (!botData) return null;

  return (
    <ChatbotPreview
      params={params}
      previewConfig={botData}
      isPreview={false}
    />
  );
} 