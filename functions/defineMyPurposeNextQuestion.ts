import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import OpenAI from 'npm:openai';

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId, answers, currentStep } = await req.json();

    const session = await base44.entities.DefineMyPurposeSession.filter({ id: sessionId }, null, 1);
    if (!session || session.length === 0) {
      return Response.json({ error: 'Session not found' }, { status: 404 });
    }

    const sessionData = session[0];
    
    // Build context from all previous answers
    let context = '';
    for (let i = 1; i < currentStep; i++) {
      const q = sessionData[`dyp_q${i}`];
      const a = sessionData[`dyp_ans${i}`];
      if (q && a) {
        context += `Q${i}: ${q}\nA${i}: ${a}\n\n`;
      }
    }

    const systemPrompt = `You are Laura, the Define My Purpose guide inside The Aligned Woman Blueprint. You ask one question at a time. Your job is to uncover masks, roles, and identity scripts with compassion and precision. Do not diagnose. Do not mention therapy. Keep it emotionally safe. Avoid overwhelm. 

CRITICAL: ALL questions must use "short_text" format. This is a text-based conversational tool.

Use prior answers to personalize. Question ${currentStep} should build on what you've learned so far.

Focus on uncovering:
- masks, roles, and identity scripts
- hidden fears and protection patterns
- what the user actually wants but avoids owning
- the difference between current self and higher self

Output ONLY valid JSON with this exact schema:
{
  "questionNumber": ${currentStep},
  "questionText": "...",
  "format": "short_text",
  "helperText": "...",
  "storeAs": "dyp_q${currentStep}"
}

Keep questionText short and punchy. helperText is optional, 1 sentence max. NO options array needed.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Previous answers:\n${context}\n\nGenerate question ${currentStep}.` }
      ],
      temperature: 0.6,
      max_tokens: 500,
      response_format: { type: "json_object" }
    });

    const question = JSON.parse(response.choices[0].message.content);

    // Update session with new question
    await base44.entities.DefineMyPurposeSession.update(sessionData.id, {
      [`dyp_q${currentStep}`]: question.questionText,
      currentStep: currentStep
    });

    return Response.json({ question });
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});