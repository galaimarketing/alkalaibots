export const generateEmbedCode = (botId: string) => {
  const domain = process.env.NEXT_PUBLIC_DOMAIN_URL || window.location.origin;
  return `<!-- AlkalaiBots Chat Widget -->
<script>
  window.alkalaiBotConfig = {
    botId: "${botId}"
  };
</script>
<script 
  src="${domain}/api/embed" 
  defer
  data-bot-id="${botId}"
></script>`;
}; 