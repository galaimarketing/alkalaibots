import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_DOMAIN_URL) {
    throw new Error('NEXT_PUBLIC_DOMAIN_URL environment variable is not set');
  }

  // Read the embed.js content
  const embedScript = `
(function() {
  // Create chat widget container
  const container = document.createElement('div');
  container.id = 'alkalaibots-chat-widget';
  container.style.cssText = 'position: fixed; z-index: 999999; bottom: 20px; right: 15px; width: 0; height: 0; overflow: visible; background: transparent; pointer-events: none;';
  document.body.appendChild(container);

  // Create iframe for the chat
  const iframe = document.createElement('iframe');
  const botId = document.currentScript?.getAttribute('data-bot-id') || window.alkalaiBotConfig?.botId;
  
  if (!botId) {
    console.error('AlkalaiBots: Missing bot ID');
    return;
  }

  // First fetch bot configuration
  fetch(\`${process.env.NEXT_PUBLIC_DOMAIN_URL}/api/bot-config/\${botId}\`)
    .then(response => response.json())
    .then(botConfig => {
      // Create toggle button with bot's colors
      const toggleButton = document.createElement('button');
      toggleButton.style.cssText = \`
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: \${botConfig.botIconColor || botConfig.primaryColor};
        color: \${botConfig.botTextColor};
        border: none;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 1000000;
        pointer-events: auto;
        transition: opacity 0.3s ease;
      \`;

      // Define both SVG icons
      const chatIcon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>';
      const closeIcon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';
      
      toggleButton.innerHTML = chatIcon;
      toggleButton.onmouseover = () => { toggleButton.style.opacity = '0.8'; };
      toggleButton.onmouseleave = () => { toggleButton.style.opacity = '1'; };
      container.appendChild(toggleButton);

      // Use the injected domain URL
      const domain = "${process.env.NEXT_PUBLIC_DOMAIN_URL}";
      iframe.src = \`\${domain}/bot/\${botId}/widget\`;
      iframe.style.cssText = 'position: absolute; bottom: -20px; right: -15px; width: 400px; height: 600px; border: none; border-radius: 10px; background: transparent; transition: all 0.3s ease; pointer-events: auto; display: none;';
      iframe.setAttribute('allowtransparency', 'true');
      iframe.setAttribute('frameBorder', '0');

      container.appendChild(iframe);

      // Add debug log for initialization
      console.log('Chat widget initialized with botId:', botId);
      console.log('Widget URL:', iframe.src);

      let isChatOpen = false;
      
      // Toggle chat on button click
      toggleButton.addEventListener('click', function() {
        isChatOpen = !isChatOpen;
        iframe.style.display = isChatOpen ? 'block' : 'none';
        toggleButton.innerHTML = isChatOpen ? closeIcon : chatIcon;
        console.log('Chat toggled:', isChatOpen);
      });

      // Add message listener for iframe communication
      window.addEventListener('message', function(event) {
        // Add debug logs
        console.log('Message received:', event.data);
        console.log('Message origin:', event.origin);
        
        if (event.data === 'closeChatWidget') {
          console.log('Closing chat widget');
          iframe.style.display = 'none';
          toggleButton.innerHTML = chatIcon;
          isChatOpen = false;
        } else if (event.data === 'openChatWidget') {
          console.log('Opening chat widget');
          iframe.style.display = 'block';
          toggleButton.innerHTML = closeIcon;
          isChatOpen = true;
        }
      });
    })
    .catch(error => {
      console.error('Failed to fetch bot configuration:', error);
    });
})();`;
  
  return new NextResponse(embedScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*',
    },
  });
} 
