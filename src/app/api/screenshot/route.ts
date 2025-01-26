import { NextResponse } from 'next/server';

const API_ENDPOINT = 'https://api.apiflash.com/v1/urltoimage';

export async function POST(req: Request) {
  const ACCESS_KEY = process.env.APIFLASH_ACCESS_KEY;

  if (!ACCESS_KEY) {
    return NextResponse.json({ 
      error: 'Missing APIFLASH_ACCESS_KEY environment variable' 
    }, { status: 500 });
  }

  try {
    const { url } = await req.json();
    
    const params = new URLSearchParams({
      access_key: ACCESS_KEY as string,
      url: url,
      format: 'jpeg',
      quality: '80',
      width: '1280',
      height: '800',
      full_page: 'true',
      fresh: 'true'
    });

    const screenshotUrl = `${API_ENDPOINT}?${params.toString()}`;
    
    // Just return the URL directly
    return NextResponse.json({ 
      imageUrl: screenshotUrl,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      }
    });

  } catch (error) {
    console.error('Screenshot error:', error);
    return NextResponse.json({ 
      error: 'Failed to capture screenshot' 
    }, { status: 500 });
  }
} 