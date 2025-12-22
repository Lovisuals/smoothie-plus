import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  // 1. Security Check (Only allow POST messages)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { question, context } = req.body;

  // 2. The Constraint (The "Health-Only" Firewall)
  const systemPrompt = `
    You are the SmoothiePlus+ Bio-Analyst.
    CONTEXT: ${JSON.stringify(context)}
    RULES:
    1. You analyze smoothies based on their ingredients/color.
    2. STRICTLY answer only health/nutrition questions.
    3. If asked about anything else (politics, code, life), reply: "UPLINK ERROR: SUBJECT IRRELEVANT."
    4. Keep answers short (max 2 sentences). Cyberpunk tone.
  `;

  try {
    // 3. The Thought Process
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question },
      ],
      model: "gpt-3.5-turbo",
      max_tokens: 60,
    });

    // 4. The Answer
    const answer = completion.choices[0].message.content;
    return res.status(200).json({ answer: answer });

  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({ answer: "NEURAL CORE OFFLINE. CHECK CONNECTION." });
  }
}
