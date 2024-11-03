'use server';

export async function create() {
  const options = {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}`, 'Content-Type': 'application/json' },
    body: '{"model":{"provider":"openai","model":"gpt-4","messages":[{"role":"system","content":"You\'re a product tour assistant. The user will ask about the product, you\'ll explain. When they\'re done, you\'ll redirect them to pricing."}]},"firstMessage":"Hi, I\'m the product tour assistant. What feature would you like to try?","firstMessageMode":"assistant-speaks-first"}',
  };

  const data = await fetch('https://api.vapi.ai/assistant', options);
  const assistantId = await data.json();

  return assistantId;
}
