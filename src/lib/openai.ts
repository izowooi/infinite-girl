import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCombination(
  nameA: string,
  nameB: string
): Promise<{ name: string; emoji: string }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano-2025-08-07',
    messages: [
      {
        role: 'developer',
        content: `당신은 창의적인 단어 조합 게임 어시스턴트입니다.
두 한국어 원소를 조합하여 새로운 원소를 만드세요.

규칙:
- 결과는 반드시 한국어 명사
- 1~6글자로 간결하게
- 두 원소의 개념을 창의적으로 융합
- 이모지는 결과 개념을 가장 잘 표현하는 것으로 1개만`,
      },
      {
        role: 'user',
        content: `원소1: ${nameA}\n원소2: ${nameB}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'element_combination',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            emoji: { type: 'string' },
          },
          required: ['name', 'emoji'],
          additionalProperties: false,
        },
      },
    },
    max_completion_tokens: 8192,
  });

  const message = response.choices[0].message;
  if (message.refusal) throw new Error(`OpenAI 거부 응답: ${message.refusal}`);
  if (!message.content) throw new Error('OpenAI 응답이 비어 있습니다');

  const parsed = JSON.parse(message.content) as { name: string; emoji: string };
  if (!parsed.name || !parsed.emoji) {
    throw new Error('OpenAI 응답 형식이 잘못되었습니다');
  }

  return parsed;
}
