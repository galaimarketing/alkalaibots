import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  if (!process.env.NEXT_PUBLIC_DOMAIN_URL) {
    throw new Error('NEXT_PUBLIC_DOMAIN_URL environment variable is not set');
  }

  // Basic Embed Script (No special positioning or pointer-events)
  const embedScript = `
(function() {
  const container = document.createElement('div');
  container.id = 'alkalaibots-chat-widget';
  container.style.cssText = 'position: fixed; z-index: 999999; bottom: 20px; right: 20px;';
  document.body.appendChild(container);

  const iframe = document.createElement('iframe');
  const botId = document.currentScript?.getAttribute('data-bot-id') || window.alkalaiBotConfig?.botId;
  
  if (!botId) {
    console.error('AlkalaiBots: Missing bot ID');
    return;
  }

  iframe.src = '${process.env.NEXT_PUBLIC_DOMAIN_URL}/bot/' + botId + '/widget';
  iframe.style.cssText = 'position: fixed; bottom: 80px; right: 20px; width: 400px; height: 600px; border: none; border-radius: 10px; background: transparent; display: none;';
  iframe.allowTransparency = 'true';
  iframe.frameBorder = '0';
  container.appendChild(iframe);

  const toggleButton = document.createElement('button');
  toggleButton.style.cssText = \`
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: rgb(159, 127, 60);
    color: white;
    border: none;
    cursor: pointer;
    box-shadow: rgba(0, 0, 0, 0.15) 0px 2px 8px;
    z-index: 1000000;
    transition: opacity 0.3s;
  \`;

  // Basic SVG icons
  const chatIcon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>';
  const closeIcon = '<svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>';

  toggleButton.innerHTML = chatIcon;
  toggleButton.onmouseover = () => { toggleButton.style.opacity = '0.8'; };
  toggleButton.onmouseleave = () => { toggleButton.style.opacity = '1'; };
  container.appendChild(toggleButton);

  let isChatOpen = false;
  
  toggleButton.addEventListener('click', function() {
    isChatOpen = !isChatOpen;
    iframe.style.display = isChatOpen ? 'block' : 'none';
    toggleButton.innerHTML = isChatOpen ? closeIcon : chatIcon;
  });

  window.addEventListener('message', function(event) {
    if (event.data === 'closeChatWidget') {
      iframe.style.display = 'none';
      toggleButton.innerHTML = chatIcon;
      isChatOpen = false;
    } else if (event.data === 'openChatWidget') {
      iframe.style.display = 'block';
      toggleButton.innerHTML = closeIcon;
      isChatOpen = true;
    }
  });
})();
`;

  return NextResponse.json(embedScript, {
    headers: {
      'Content-Type': 'application/javascript',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
