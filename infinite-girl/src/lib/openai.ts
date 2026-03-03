import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCombination(
  nameA: string,
  nameB: string
): Promise<{ name: string; emoji: string }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini-2025-08-07',
    messages: [
      {
        role: 'developer',
        content: `당신은 단어 조합 게임의 심판이다.
두 단어를 받으면, 그 둘을 결합한 결과 단어 1개와 이모지 1개를 반환한다.

## 좋은 결과란?
- "A와 B를 합치면?" 물었을 때 "아, 그거!" 하고 무릎을 칠 만한 단어
- 구체적이고 시각적인 이미지가 떠오르는 단어
- 일상에서 실제로 쓰이는 자연스러운 한국어 명사
- 1~6글자로 간결하게

## 나쁜 결과 (절대 하지 마)
- 두 단어의 한자를 기계적으로 합친 것 (물+나무→수목 ❌, 불+바람→화풍 ❌)
- 사전에서나 볼 법한 딱딱한 한자 학술어
- 지나치게 뻔한 동어반복 (물+물→큰물 ❌)
- 두 단어를 단순히 이어붙인 것 (물+나무→물나무 ❌)

## 사고 방식
1. 두 개념이 만나는 구체적인 장면이나 사물을 떠올려라
2. "이 둘이 같은 공간에 있다면 뭐가 될까?"를 상상해라
3. 재치 있는 비유나 연상도 좋다

## 예시
- 물 + 나무 → 버드나무 🌿
- 물 + 불 → 증기 💨
- 나무 + 불 → 모닥불 🔥
- 바람 + 모래 → 사막 🏜️
- 땅 + 물 → 늪 🌊
- 불 + 땅 → 용암 🌋
- 바람 + 물 → 파도 🌊
- 눈 + 바람 → 눈보라 ❄️`,
      },
      {
        role: 'user',
        content: `${nameA} + ${nameB}`,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'word_combination',
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
    reasoning_effort: 'low',
    max_completion_tokens: 2000,
  });

  // 디버깅 로그
  const choice = response.choices[0];
  console.log('[OpenAI] finish_reason:', choice.finish_reason);
  console.log('[OpenAI] message:', JSON.stringify(choice.message));

  const message = choice.message;
  if (message.refusal) throw new Error(`OpenAI 거부 응답: ${message.refusal}`);
  if (choice.finish_reason === 'length') throw new Error('OpenAI 응답이 토큰 제한으로 잘렸습니다');
  if (!message.content) throw new Error(`OpenAI 응답이 비어 있습니다 (finish_reason: ${choice.finish_reason})`);

  const parsed = JSON.parse(message.content) as { name: string; emoji: string };
  if (!parsed.name || !parsed.emoji) {
    throw new Error('OpenAI 응답 형식이 잘못되었습니다');
  }

  return parsed;
}
