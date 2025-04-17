
export async function sendDiscordWebhook(content: string, data: any = {}) {
  const webhookUrl = 'https://discordapp.com/api/webhooks/1359559916129616034/sHuXXN7aJJQAvrRg97AiI9lQPCLqjF_7rurjsTdhTexlbZh1u66_AVhJeMBuAaSgTEfF';
  
  try {
    const embedData = {
      title: "ICSW Notification",
      description: content,
      color: 16738740, // Pink color
      fields: Object.entries(data).map(([name, value]) => ({
        name,
        value: String(value),
        inline: true,
      })),
      timestamp: new Date().toISOString(),
      footer: {
        text: "ICSW Script Haven"
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        embeds: [embedData]
      }),
    });

    if (!response.ok) {
      console.error('Failed to send webhook', await response.text());
    }
    
    return response.ok;
  } catch (error) {
    console.error('Error sending webhook:', error);
    return false;
  }
}
