import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: { botId: string } }
) {
  try {
    const botDoc = await getDoc(doc(db, 'chatbots', params.botId));
    
    if (!botDoc.exists()) {
      return new NextResponse(JSON.stringify({ error: 'Bot not found' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const botData = botDoc.data();
    
    return new NextResponse(JSON.stringify(botData.config), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error fetching bot config:', error);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch bot config' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
} 