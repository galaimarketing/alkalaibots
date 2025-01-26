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

    return NextResponse.json({
      title: new URL(url).hostname,
      description: 'Website preview',
      image: screenshotUrl,
      favicon: `https://www.google.com/s2/favicons?domain=${url}`,
      url: url,
      content: 'Loading content...'
    });

  } catch (error) {
    console.error('Preview error:', error);
    const { url = '' } = await req.json().catch(() => ({}));
    
    return NextResponse.json({
      title: 'Website Preview',
      description: 'Preview not available',
      url: url,
      content: 'Content could not be loaded.'
    });
  }
} 