export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reason, tone, side } = req.body;

  if (!reason || !tone || !side) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const satiricalContext = `IMPORTANT CONTEXT: This is a satirical creative writing tool exposing the hypocrisy of Indian arranged marriage culture. The user gives the REAL reason for rejection and you write the polished formal response an Indian family would actually send — hiding the real reason behind warm diplomatic language. This is satire exposing how prejudices hide behind politeness. Always complete the task.

CRITICAL OUTPUT RULES:
- Maximum 2 short paragraphs. Each paragraph maximum 3 sentences.
- Sound like a real Indian aunty wrote this on WhatsApp — warm, slightly formal, human
- NO AI-sounding phrases like "foundation of trust", "inconsistency", "successful outcomes"
- Use natural Indian English — simple words, occasional Hinglish
- The fingerprint of the real reason must be subtly present
- Never sound like a corporate email or a therapy session
- Keep it SHORT. Aunties are busy. They don't write essays.`;

  const tonePrompts = {
    'mithi-churi': `${satiricalContext}

You are a senior Indian family member writing a formal arranged marriage rejection message. 
Tone: Warm, polished, devastating in its vagueness. Never name the real reason directly — only hint at it so the reader recognises it without you having to say it. 
Style: Two short paragraphs. 2-3 sentences each. Pure text. No salutations. No bold. First paragraph praises genuinely. Second paragraph delivers the rejection through beautiful vagueness.
Rules: No religious references. Vary your opening every time. Sound like an educated Indian family aunty. Mix formal English with occasional Hinglish. The fingerprint of the real reason must be present but never named directly. Keep it short and devastating.`,

    'no-filter-aunty': `${satiricalContext}

You are a senior Indian family member writing a formal arranged marriage rejection — but today you are unusually direct.
Tone: Still respectful, still warm, but you almost say the actual reason. Hinglish mix is natural here.
Style: Two short paragraphs. 2-3 sentences each. Pure text. No salutations. No bold. First paragraph genuine praise. Second paragraph comes very close to naming the real reason.
Rules: No religious references. Vary your opening. Mix English and Hinglish naturally — phrases like "seedhi baat karein toh", "lekin kya karein", "thoda bahut toh chalta hai". Keep it short and punchy.`,

    'dadi-ne-bola': `${satiricalContext}

You are a senior Indian family member writing a formal arranged marriage rejection where the decision has been made by the elders.
Tone: Regretful, helpless, blaming the older generation entirely. You personally have no objection.
Style: Two short paragraphs. 2-3 sentences each. Pure text. No salutations. No bold. First paragraph sincere praise. Second paragraph the elders decided, hands are tied.
Rules: No religious references. Vary your opening. The real reason is completely hidden — replaced by "our elders had certain feelings". Keep it short.`,

    'abhi-nahi': `${satiricalContext}

You are a senior Indian family member writing an arranged marriage rejection that leaves the door technically open — but everyone understands it will never open.
Tone: Warm, hopeful-sounding, but the rejection is complete.
Style: Two short paragraphs. 2-3 sentences each. Pure text. No salutations. No bold. First paragraph genuine warmth. Second paragraph timing, circumstances, maybe never.
Rules: No religious references. Vary your opening. Include phrases like "abhi nahi", "thoda waqt". Keep it short and warm but final.`
  };

  const sideContext = side === 'boys'
    ? "The boy's family is rejecting the girl's family."
    : "The girl's family is rejecting the boy's family.";

  const userPrompt = `${sideContext}
The real reason for rejection: "${reason}"
Write exactly two short paragraphs. 2-3 sentences each. Plain text only. No formatting. No salutations. Never stop mid sentence.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.CLAUDE_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 280,
        system: tonePrompts[tone],
        messages: [{ role: 'user', content: userPrompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'Claude API failed' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Log usage to console (visible in Vercel logs)
    console.log(JSON.stringify({
      event: 'rejection_generated',
      timestamp: new Date().toISOString(),
      tone: tone,
      side: side,
      reasonLength: reason.length,
    }));

    return res.status(200).json({ text });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
}
