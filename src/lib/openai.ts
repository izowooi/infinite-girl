import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCombination(
  nameA: string,
  nameB: string
): Promise<{ name: string; emoji: string }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `당신은 창의적인 단어 조합 게임 어시스턴트입니다.
두 한국어 원소를 조합하여 새로운 원소를 만드세요.

규칙:
- 결과는 반드시 한국어 명사
- 1~6글자로 간결하게
- 두 원소의 개념을 창의적으로 융합
- 반드시 JSON만 응답: {"name": "결과명", "emoji": "이모지1개"}
- 이모지는 결과 개념을 가장 잘 표현하는 것으로 1개만`,
      },
      {
        role: 'user',
        content: `원소1: ${nameA}\n원소2: ${nameB}`,
      },
    ],
    response_format: { type: 'json_object' },
    max_tokens: 100,
    temperature: 0.8,
  });

  const content = response.choices[0].message.content;
  if (!content) throw new Error('OpenAI 응답이 비어 있습니다');

  const parsed = JSON.parse(content) as { name: string; emoji: string };
  if (!parsed.name || !parsed.emoji) {
    throw new Error('OpenAI 응답 형식이 잘못되었습니다');
  }

  return parsed;
}
