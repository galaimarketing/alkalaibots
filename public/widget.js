(function() {
  const style = document.createElement('style');
  style.textContent = `
    #alkalai-chat-widget {
      position: fixed;
      bottom: 20px;
      right: 20px;
      z-index: 9999;
      pointer-events: none;
    }
    #alkalai-chat-widget iframe {
      border: none;
      pointer-events: auto;
      background: transparent;
    }
  `;
  document.head.appendChild(style);

  window.alkalaiChat = function(action, botId) {
    if (action === 'init') {
      const iframe = document.createElement('iframe');
      iframe.src = `https://your-domain.com/bot/${botId}`;
      iframe.style.width = '400px';
      iframe.style.height = '600px';
      iframe.style.border = 'none';
      document.getElementById('alkalai-chat-widget').appendChild(iframe);
    }
  };
})(); 