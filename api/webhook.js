import axios from 'axios';

export default async function handler(req, res) {
  // 1. FACEBOOK VERIFICATION (The Handshake)
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Check if the token matches what you set in Vercel
    if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
      return res.status(200).send(challenge);
    }
    return res.status(403).json({ error: 'Forbidden' });
  }

  // 2. INCOMING MESSAGE (The Trigger)
  if (req.method === 'POST') {
    const body = req.body;

    // Check if it's a WhatsApp message
    if (body.object === 'whatsapp_business_account') {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const message = changes?.value?.messages?.[0];

      // Ensure it's a text message from a user
      if (message && message.type === 'text') {
        const userPhone = message.from;
        const userName = message.profile?.name || "Commander"; // Get their WhatsApp Name
        const businessPhoneNumberId = changes.value.metadata.phone_number_id;

        // 3. SEND THE REPLY (The Action)
        try {
          await axios.post(
            `https://graph.facebook.com/v18.0/${businessPhoneNumberId}/messages`,
            {
              messaging_product: "whatsapp",
              to: userPhone,
              type: "interactive",
              interactive: {
                type: "cta_url",
                header: { type: "text", text: "SMOOTHIE PLUS+ OPS" },
                body: { text: `Welcome back, ${userName}. Systems Online.` },
                footer: { text: "Tap below to initialize." },
                action: {
                  name: "cta_url",
                  parameters: {
                    display_text: "🚀 LAUNCH MENU",
                    // YOUR SPECIFIC LINK WITH AUTO-LOGIN CODE:
                    url: `https://lovisuals.github.io/smoothie-plus/?user=${encodeURIComponent(userName)}`
                  }
                }
              }
            },
            {
              headers: {
                // Vercel will pull this from your settings securely
                Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
                "Content-Type": "application/json",
              },
            }
          );
        } catch (error) {
          console.error("Error sending message:", error?.response?.data || error);
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');
  }
}
