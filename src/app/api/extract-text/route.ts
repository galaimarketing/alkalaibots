import { NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let text = '';
    const buffer = await file.arrayBuffer();

    switch (file.type) {
      case 'application/pdf':
        // Handle PDF
        const pdfDoc = await pdfjsLib.getDocument({ data: buffer }).promise;
        const numPages = pdfDoc.numPages;
        let pdfText = '';
        
        for (let i = 1; i <= numPages; i++) {
          const page = await pdfDoc.getPage(i);
          const content = await page.getTextContent();
          pdfText += content.items.map((item: any) => item.str).join(' ') + '\n';
        }
        text = pdfText;
        break;

      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      case 'application/msword':
        // Handle DOC/DOCX
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        text = result.value;
        break;

      case 'text/plain':
        // Handle TXT
        text = new TextDecoder().decode(buffer);
        break;

      case 'image/png':
      case 'image/jpeg':
      case 'image/jpg':
        // Handle images using Tesseract
        const worker = await createWorker('eng');
        await worker.load();
        const imageBuffer = Buffer.from(buffer);
        const { data: { text: ocrText } } = await worker.recognize(imageBuffer);
        await worker.terminate();
        text = ocrText;
        break;

      default:
        throw new Error('Unsupported file type');
    }

    // Clean up the extracted text
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n');

    console.log('Extracted text:', text);
    return NextResponse.json({ text });

  } catch (error) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      { error: 'Failed to extract text from file' },
      { status: 500 }
    );
  }
} 