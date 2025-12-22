// api/webhook.js
export default async function handler(req, res) {
    // 1. VERIFY TOKEN (The Handshake)
    if (req.method === 'GET') {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode && token) {
            if (mode === 'subscribe' && token === process.env.VERIFY_TOKEN) {
                console.log('WEBHOOK_VERIFIED');
                return res.status(200).send(challenge);
            } else {
                return res.status(403).json({ error: 'Forbidden' });
            }
        }
        return res.status(400).json({ error: 'Bad Request' });
    }

    // 2. HANDLE MESSAGES (The Chat)
    if (req.method === 'POST') {
        const body = req.body;
        console.log('Incoming Webhook:', JSON.stringify(body, null, 2));

        if (body.object) {
            if (
                body.entry &&
                body.entry[0].changes &&
                body.entry[0].changes[0] &&
                body.entry[0].changes[0].value.messages &&
                body.entry[0].changes[0].value.messages[0]
            ) {
                const msg = body.entry[0].changes[0].value.messages[0];
                const from = msg.from;
                
                // SIMPLE REPLY
                await sendWhatsApp(from, "Hello Commander. Systems Online. 🟢");
            }
            return res.status(200).send('EVENT_RECEIVED');
        } else {
            return res.status(404).send('Not found');
        }
    }

    return res.status(405).send('Method Not Allowed');
}

async function sendWhatsApp(to, text) {
    const token = process.env.WHATSAPP_TOKEN;
    const url = `https://graph.facebook.com/v17.0/me/messages`;

    const payload = {
        messaging_product: "whatsapp",
        to: to,
        text: { body: text }
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log("Message Sent:", data);
    } catch (e) {
        console.error("Send Error:", e);
    }
}
