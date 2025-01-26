import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    // Simple text-based scraping
    const response = await fetch(url);
    const text = await response.text();

    // Basic text cleaning
    const cleanText = text
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim()
      .slice(0, 1000);         // Limit length

    return NextResponse.json({
      summary: cleanText,
      url: url
    });

  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ 
      error: 'Failed to scrape website' 
    }, { status: 500 });
  }
}