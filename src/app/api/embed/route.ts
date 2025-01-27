import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Extract botId from the full URL path
    const botId = request.url.split('/api/embed?botId=')[1];
    
    if (!botId) {
      throw new Error('Bot ID is required');
    }

    const domainUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    const script = `
      (function() {
        const iframe = document.createElement('iframe');
        const toggleBtn = document.createElement('button');
        let isOpen = false;
        const isMobile = window.innerWidth <= 768;

        // Style the iframe
        iframe.id = 'chatbot-iframe';
        iframe.style.position = 'fixed';
        iframe.style.bottom = '100px';
        iframe.style.right = '20px';
        iframe.style.width = '320px';
        iframe.style.height = '500px';
        iframe.style.border = 'none';
        iframe.style.borderRadius = '10px';
        iframe.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        iframe.style.zIndex = '9999';
        iframe.style.display = 'none';
        iframe.style.background = 'transparent';
        iframe.allow = "clipboard-write";

        // Style the toggle button
        toggleBtn.id = 'chatbot-toggle';
        toggleBtn.style.position = 'fixed';
        toggleBtn.style.bottom = '20px';
        toggleBtn.style.right = '20px';
        toggleBtn.style.width = '60px';
        toggleBtn.style.height = '60px';
        toggleBtn.style.borderRadius = '50%';
        toggleBtn.style.border = 'none';
        toggleBtn.style.backgroundColor = '#2563eb';
        toggleBtn.style.color = 'white';
        toggleBtn.style.cursor = 'pointer';
        toggleBtn.style.zIndex = '10000';
        toggleBtn.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        toggleBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>';
        toggleBtn.style.display = 'flex';
        toggleBtn.style.alignItems = 'center';
        toggleBtn.style.justifyContent = 'center';

        // Add hover effect
        toggleBtn.onmouseover = () => toggleBtn.style.opacity = '0.9';
        toggleBtn.onmouseout = () => toggleBtn.style.opacity = '1';

        // Handle toggle click
        toggleBtn.onclick = () => {
          isOpen = !isOpen;
          iframe.style.display = isOpen ? 'block' : 'none';
          
          // Apply mobile styles only when chat is opened
          if (isMobile && isOpen) {
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.top = '0';
            iframe.style.left = '0';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.borderRadius = '0';
            document.body.style.overflow = 'hidden';
          } else if (isMobile) {
            // Reset styles when closed on mobile
            iframe.style.width = '320px';
            iframe.style.height = '500px';
            iframe.style.bottom = '100px';
            iframe.style.right = '20px';
            iframe.style.top = 'auto';
            iframe.style.left = 'auto';
            iframe.style.borderRadius = '10px';
            document.body.style.overflow = '';
          }
        };

        // Listen for messages from iframe
        window.addEventListener('message', function(event) {
          if (event.data.type === 'toggleChat') {
            isOpen = event.data.isOpen;
            iframe.style.display = isOpen ? 'block' : 'none';
            
            // Apply mobile styles only when chat is opened
            if (isMobile && isOpen) {
              iframe.style.width = '100%';
              iframe.style.height = '100%';
              iframe.style.top = '0';
              iframe.style.left = '0';
              iframe.style.right = '0';
              iframe.style.bottom = '0';
              iframe.style.borderRadius = '0';
              document.body.style.overflow = 'hidden';
            } else if (isMobile) {
              // Reset styles when closed
              iframe.style.width = '320px';
              iframe.style.height = '500px';
              iframe.style.bottom = '150px';
              iframe.style.right = '20px';
              iframe.style.top = 'auto';
              iframe.style.left = 'auto';
              iframe.style.borderRadius = '10px';
              document.body.style.overflow = '';
            }
          }
        });

        // Set iframe src with proper URL construction
        iframe.src = "${domainUrl}/widget/${botId}";

        // Append elements to body
        document.body.appendChild(iframe);
        document.body.appendChild(toggleBtn);
      })();
    `;

    return new Response(script, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error: unknown) {
    console.error('Embed script error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(`console.error("Failed to load chatbot widget: ${errorMessage}");`, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
} 
