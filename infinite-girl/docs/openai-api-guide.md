# OpenAI API 완벽 가이드: GPT-5 nano부터 Next.js 통합까지

**GPT-5 nano는 실제로 존재하는 OpenAI의 최저가 독점 모델이다.** 1M 입력 토큰당 **$0.05**, 출력 토큰당 **$0.40**으로 gpt-4o-mini보다 3배 저렴하며, 400K 컨텍스트 윈도우를 지원한다. 이 보고서는 사용자가 요청한 10가지 항목 — 모델 정보, 가격 비교, Chat Completions API 구조, API Key 발급, JSON 출력 강제, 프롬프트 구성, TypeScript SDK, 주요 파라미터, 에러/레이트 리밋, Next.js Edge Runtime 호환성 — 을 공식 문서 기반으로 상세히 다룬다.

---

## 1. GPT-5 nano 모델 상세 스펙

GPT-5 nano는 OpenAI 공식 문서(`developers.openai.com/api/docs/models/gpt-5-nano`)에서 확인된 실제 모델이다. GPT-5 패밀리에서 가장 빠르고 비용 효율적인 모델로, 요약 및 분류 작업에 최적화되어 있다.

| 항목 | 상세 |
|------|------|
| **모델 ID** | `gpt-5-nano` (스냅샷: `gpt-5-nano-2025-08-07`) |
| **컨텍스트 윈도우** | **400,000 토큰** |
| **최대 출력 토큰** | 128,000 토큰 |
| **Knowledge Cutoff** | 2024년 5월 31일 |
| **입력 모달리티** | 텍스트, 이미지 |
| **출력 모달리티** | 텍스트 |
| **추론(Reasoning)** | 지원 (평균 수준) |
| **지원 기능** | Streaming, Function calling, Structured outputs |
| **미지원** | Fine-tuning, Distillation, 오디오/비디오 입력 |

### 가격 (Standard Tier, 1M 토큰 기준)

| 구분 | 가격 |
|------|------|
| **Input** | **$0.05** |
| **Cached Input** | **$0.005** |
| **Output** | **$0.40** |
| Batch Input | $0.025 |
| Batch Output | $0.20 |

GPT-5 nano는 GPT-5 대비 입력 **25배**, 출력 **25배** 저렴하다.

---

## 2. OpenAI 모델 가격 비교: 최저가 순위

독점(proprietary) 모델 중 가장 저렴한 모델부터 정렬한 결과다. 오픈소스 모델인 gpt-oss-20b($0.03)이 절대 최저가이지만, 독점 모델 중에서는 **gpt-5-nano가 가장 저렴**하다.

| 순위 | 모델 | Input/1M | Output/1M | 컨텍스트 |
|------|------|----------|-----------|----------|
| 1 | gpt-oss-20b (오픈소스) | $0.03 | $0.14 | 131K |
| 2 | gpt-oss-120b (오픈소스) | $0.039 | $0.19 | 131K |
| 3 | **gpt-5-nano** | **$0.05** | **$0.40** | **400K** |
| 4 | gpt-4.1-nano | $0.10 | $0.40 | 1,048K |
| 5 | gpt-4o-mini | $0.15 | $0.60 | 128K |
| 6 | gpt-5-mini | $0.25 | $2.00 | 400K |
| 7 | gpt-5.1-codex-mini | $0.25 | $2.00 | 400K |
| 8 | gpt-4.1-mini | $0.40 | $1.60 | 1,048K |
| 9 | gpt-3.5-turbo | $0.50 | $1.50 | 16K |
| 10 | o4-mini / o3-mini | $1.10 | $4.40 | 200K |

gpt-4.1-nano는 입력은 2배 비싸지만 컨텍스트 윈도우가 **1,048K**로 GPT-5 nano의 2.6배다. 용도에 따라 선택이 달라진다. 추론(reasoning) 모델 중 최저가는 **o4-mini**($1.10/$4.40)이며, 플래그십 모델인 gpt-5.2는 $1.75/$14.00, 최고가인 o1-pro는 $150/$600이다.

---

## 3. Chat Completions API 엔드포인트 완전 레퍼런스

### 엔드포인트 URL 및 필수 파라미터

```
POST https://api.openai.com/v1/chat/completions
```

**필수 헤더:**
```
Authorization: Bearer $OPENAI_API_KEY
Content-Type: application/json
```

**필수 파라미터는 단 2개:**

| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `model` | `string` | 사용할 모델 ID (예: `"gpt-5-nano"`) |
| `messages` | `array` | 대화 메시지 배열. 각 객체에 `role`과 `content` 포함 |

### 요청 JSON 구조 (전체 예시)

```json
{
  "model": "gpt-5-nano",
  "messages": [
    {
      "role": "system",
      "content": "당신은 도움이 되는 한국어 어시스턴트입니다."
    },
    {
      "role": "user",
      "content": "양자 컴퓨팅을 간단히 설명해주세요."
    }
  ],
  "temperature": 0.7,
  "max_completion_tokens": 1024,
  "top_p": 1.0,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0,
  "stop": ["\n\n"],
  "n": 1,
  "seed": 42,
  "stream": false,
  "response_format": { "type": "text" },
  "tools": null,
  "tool_choice": "auto"
}
```

### 응답 JSON 구조

```json
{
  "id": "chatcmpl-B9MBs8CjcvOU2jLn4n570S5qMJKcT",
  "object": "chat.completion",
  "created": 1741569952,
  "model": "gpt-5-nano-2025-08-07",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "양자 컴퓨팅은 큐비트를 사용하여...",
        "refusal": null
      },
      "finish_reason": "stop",
      "logprobs": null
    }
  ],
  "usage": {
    "prompt_tokens": 29,
    "completion_tokens": 150,
    "total_tokens": 179,
    "completion_tokens_details": {
      "reasoning_tokens": 0,
      "accepted_prediction_tokens": 0,
      "rejected_prediction_tokens": 0
    },
    "prompt_tokens_details": {
      "cached_tokens": 0
    }
  },
  "system_fingerprint": "fp_50cad350e4",
  "service_tier": "default"
}
```

`finish_reason` 값은 `"stop"` (정상 종료), `"length"` (토큰 한도 도달), `"tool_calls"` (도구 호출), `"content_filter"` (필터링) 중 하나다.

---

## 4. API Key 발급 방법

API Key는 **`https://platform.openai.com/api-keys`** 에서 발급한다. 절차는 다음과 같다:

1. `https://platform.openai.com`에 로그인 (이메일, Google, Microsoft, Apple 계정 지원)
2. 이메일 인증 및 SMS 2FA 완료
3. 좌측 사이드바에서 **"API keys"** 클릭 또는 직접 `https://platform.openai.com/api-keys`로 이동
4. **"Create new secret key"** 버튼 클릭
5. 키 이름 지정, 권한 설정(Full/Restricted), 프로젝트 연결(선택)
6. 생성된 키는 **딱 한 번만 표시**되므로 즉시 복사하여 안전하게 보관
7. 환경 변수로 설정:

```bash
export OPENAI_API_KEY="sk-your-key-here"
```

조직 수준 키는 `https://platform.openai.com/settings/organization/api-keys`, Admin 키는 `https://platform.openai.com/settings/organization/admin-keys`에서 관리한다. `.env` 파일에 저장할 경우 반드시 `.gitignore`에 추가해야 한다.

---

## 5. JSON 출력 강제: Structured Outputs와 JSON Mode

`response_format` 파라미터로 JSON 출력을 강제하는 방법은 두 가지다.

### 방법 1: JSON Mode (`json_object`)

유효한 JSON을 보장하지만 **스키마는 강제하지 않는다**. 반드시 프롬프트에 "JSON으로 응답하라"는 지시를 포함해야 한다.

```json
{
  "model": "gpt-5-nano",
  "messages": [
    {"role": "system", "content": "항상 JSON 형식으로 응답하세요."},
    {"role": "user", "content": "3가지 색상과 HEX 코드를 알려주세요."}
  ],
  "response_format": { "type": "json_object" }
}
```

### 방법 2: Structured Outputs (`json_schema`) — 권장

JSON Schema에 **엄격하게 일치**하는 출력을 보장한다. `strict: true` 설정 시 스키마 준수가 100% 보장된다.

```json
{
  "model": "gpt-5-nano",
  "messages": [
    {"role": "system", "content": "이벤트 정보를 추출하세요."},
    {"role": "user", "content": "Alice와 Bob이 금요일에 과학 박람회에 갑니다."}
  ],
  "response_format": {
    "type": "json_schema",
    "json_schema": {
      "name": "calendar_event",
      "strict": true,
      "schema": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "date": { "type": "string" },
          "participants": {
            "type": "array",
            "items": { "type": "string" }
          }
        },
        "required": ["name", "date", "participants"],
        "additionalProperties": false
      }
    }
  }
}
```

핵심 차이: **`json_object`는 유효한 JSON만 보장**, **`json_schema`(strict)는 유효한 JSON + 스키마 준수 모두 보장**. 새 프로젝트에는 `json_schema`를 사용하는 것이 권장된다.

---

## 6. System prompt와 user prompt 구성 방법

### 메시지 역할(Role) 체계

| Role | 용도 | 비고 |
|------|------|------|
| `system` | 모델 행동 지시 | 기존 모델용 (gpt-4o, gpt-4.1 등) |
| `developer` | 모델 행동 지시 | o1/o3/o4-mini/gpt-5 계열 권장 |
| `user` | 사용자 입력 | 이미지/오디오 콘텐츠 전송 가능 |
| `assistant` | 모델 응답 | 멀티턴 대화 히스토리용 |
| `tool` | 도구 호출 결과 | `tool_call_id` 필수 |

### 기본 구성 예시

```json
{
  "messages": [
    {
      "role": "system",
      "content": "당신은 코딩 전문 어시스턴트입니다. 항상 한국어로 답변하세요."
    },
    {
      "role": "user",
      "content": "피보나치 수열을 계산하는 Python 함수를 작성해주세요."
    }
  ]
}
```

### GPT-5 / o-시리즈에서는 `developer` 역할 사용

```json
{
  "messages": [
    {
      "role": "developer",
      "content": "당신은 코딩 전문 어시스턴트입니다."
    },
    {
      "role": "user",
      "content": "피보나치 수열을 계산하는 Python 함수를 작성해주세요."
    }
  ]
}
```

### 멀티턴 대화 히스토리 포함

```json
{
  "messages": [
    {"role": "system", "content": "당신은 수학 튜터입니다."},
    {"role": "user", "content": "2+2는?"},
    {"role": "assistant", "content": "2 + 2 = 4입니다."},
    {"role": "user", "content": "그것에 3을 곱하면?"}
  ]
}
```

`system`/`developer` 역할은 사용자 메시지보다 **높은 우선순위**를 가지며, 모델의 행동·톤·목표를 지정하는 데 사용한다. 각 메시지에 선택적으로 `name` 필드(최대 64자)를 추가하여 동일 역할의 참여자를 구분할 수 있다.

---

## 7. TypeScript/JavaScript openai npm 패키지 사용법

### 설치 및 초기화

```bash
npm install openai
```

현재 최신 버전은 **v6.25.0**이며, **TypeScript 4.9 이상**을 지원한다.

```typescript
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // 환경변수에서 자동 읽기 (생략 가능)
});
```

### Chat Completions 호출

```typescript
const completion = await client.chat.completions.create({
  model: 'gpt-5-nano',
  messages: [
    { role: 'system', content: '한국어로 간결하게 답변하세요.' },
    { role: 'user', content: '양자 컴퓨팅이란 무엇인가요?' },
  ],
  temperature: 0.7,
  max_completion_tokens: 1024,
});

console.log(completion.choices[0].message.content);
```

### Responses API (신규 프로젝트 권장)

```typescript
const response = await client.responses.create({
  model: 'gpt-5-nano',
  instructions: '한국어로 답변하는 어시스턴트입니다.',
  input: '양자 컴퓨팅이란 무엇인가요?',
});

console.log(response.output_text);
```

### 스트리밍 응답 처리

```typescript
const stream = await client.chat.completions.create({
  model: 'gpt-5-nano',
  messages: [{ role: 'user', content: '긴 이야기를 해주세요.' }],
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.choices[0]?.delta?.content || '');
}
```

### Structured Outputs (Zod 연동)

```typescript
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';

const EventSchema = z.object({
  name: z.string(),
  date: z.string(),
  participants: z.array(z.string()),
});

const completion = await client.beta.chat.completions.parse({
  model: 'gpt-5-nano',
  messages: [
    { role: 'system', content: '이벤트 정보를 추출하세요.' },
    { role: 'user', content: 'Alice와 Bob이 금요일에 과학 박람회에 갑니다.' },
  ],
  response_format: zodResponseFormat(EventSchema, 'event'),
});

const event = completion.choices[0]?.message.parsed;
// event는 { name: string, date: string, participants: string[] } 타입
```

`zod` 패키지(`npm install zod`)가 peer dependency로 필요하다. Zod v3과 v4 모두 지원된다.

### 에러 핸들링

```typescript
try {
  const result = await client.chat.completions.create({ ... });
} catch (err) {
  if (err instanceof OpenAI.APIError) {
    console.log(err.status);      // 400, 401, 429 등
    console.log(err.message);     // 에러 메시지
    console.log(err.request_id);  // 디버깅용 요청 ID
  }
}
```

SDK는 연결 에러, 408, 409, 429, 5xx에 대해 **자동 재시도(기본 2회, 지수 백오프)** 를 수행한다.

---

## 8. 주요 파라미터 상세 설명

| 파라미터 | 타입 | 기본값 | 범위 | 설명 |
|----------|------|--------|------|------|
| **`temperature`** | number | 1 | 0~2 | 출력 랜덤성 제어. **0은 결정론적**, 높을수록 창의적. o-시리즈 추론 모델에서는 미지원 |
| **`max_completion_tokens`** | integer | 모델 최대치 | — | 생성 토큰 상한 (추론 토큰 포함). `max_tokens`의 후속 파라미터 |
| `max_tokens` | integer | — | — | **Deprecated.** `max_completion_tokens` 사용 권장 |
| **`top_p`** | number | 1 | 0~1 | 누적 확률 `top_p`까지의 토큰만 고려. temperature와 동시 조정 비권장 |
| `frequency_penalty` | number | 0 | -2~2 | 토큰 출현 빈도에 비례한 페널티. 양수면 반복 감소 |
| `presence_penalty` | number | 0 | -2~2 | 토큰 출현 여부(이진)에 따른 페널티. 양수면 새 주제 유도 |
| **`stream`** | boolean | false | — | `true`면 SSE로 부분 응답 전송. `data: [DONE]`으로 종료 |
| `stop` | string/array | null | 최대 4개 | 해당 시퀀스 생성 시 중단. 출력에 포함 안됨 |
| `seed` | integer | — | — | 결정론적 출력 시도. `system_fingerprint`로 일관성 확인 |
| `n` | integer | 1 | — | 생성할 응답 수 |
| `tools` | array | — | — | 모델이 호출할 수 있는 함수 정의 배열 |
| `tool_choice` | string/object | `"auto"` | — | `"none"`, `"auto"`, `"required"`, 또는 특정 함수 지정 |
| `response_format` | object | `{"type":"text"}` | — | `"text"`, `"json_object"`, `"json_schema"` 중 선택 |

**핵심 팁:** `temperature`와 `top_p`는 동시에 변경하지 않는 것이 좋다. 추론 모델(o1, o3, o4-mini)에서는 `temperature`, `top_p`, `frequency_penalty`, `presence_penalty`가 지원되지 않으며 `temperature=1`만 허용된다.

---

## 9. 에러 응답 형식 및 Rate Limit

### 에러 응답 JSON 구조

```json
{
  "error": {
    "message": "Rate limit reached for gpt-5-nano on tokens per min (TPM)...",
    "type": "tokens",
    "param": null,
    "code": "rate_limit_exceeded"
  }
}
```

### 주요 HTTP 상태 코드

| 코드 | 타입 | 설명 |
|------|------|------|
| **400** | `invalid_request_error` | 잘못된 파라미터, 토큰 초과 |
| **401** | `authentication_error` | 잘못된 API Key |
| **403** | `permission_error` | 리소스 접근 권한 없음 |
| **404** | `not_found_error` | 존재하지 않는 모델/엔드포인트 |
| **429** | `rate_limit_exceeded` | 레이트 리밋 초과 |
| **500+** | `server_error` | OpenAI 서버 내부 오류 |

### Rate Limit 응답 헤더

모든 API 응답에 다음 헤더가 포함된다:

| 헤더 | 설명 |
|------|------|
| `x-ratelimit-limit-requests` | 분당 최대 요청 수 |
| `x-ratelimit-limit-tokens` | 분당 최대 토큰 수 |
| `x-ratelimit-remaining-requests` | 남은 요청 수 |
| `x-ratelimit-remaining-tokens` | 남은 토큰 수 |
| `x-ratelimit-reset-requests` | 요청 리밋 리셋까지 시간 |
| `x-ratelimit-reset-tokens` | 토큰 리밋 리셋까지 시간 |

### GPT-5 nano Rate Limit (티어별)

| 티어 | RPM | TPM |
|------|-----|-----|
| Tier 1 | 500 | 200,000 |
| Tier 2 | 5,000 | 2,000,000 |
| Tier 3 | 5,000 | 4,000,000 |
| Tier 4 | 10,000 | 10,000,000 |
| Tier 5 | 30,000 | 180,000,000 |

Free 티어에서는 gpt-5-nano를 사용할 수 없다. 429 에러 발생 시 **지수 백오프 + 랜덤 지터**를 적용한 재시도가 권장되며, 실패한 요청도 분당 한도에 카운트되므로 무분별한 재시도는 금물이다.

---

## 10. Next.js Edge Runtime에서 openai 패키지 호환성

**공식 지원된다.** `openai` npm 패키지 v4.0.0 이후(2023년 7월) `axios`에서 네이티브 `fetch` API로 전환되어 Edge Runtime과 완전 호환된다. 패키지 README에 **Vercel Edge Runtime이 공식 지원 환경으로 명시**되어 있다. 과거 서드파티 패키지였던 `openai-edge`는 더 이상 불필요하며, 해당 패키지 제작자도 공식 SDK 사용을 권장하고 있다.

### Edge Runtime Route Handler 예시

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai';

export const runtime = 'edge'; // Edge Runtime 지정

export async function POST(req: Request) {
  const openai = new OpenAI();
  const { messages } = await req.json();

  const response = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages,
    stream: true,
  });

  return new Response(response.toReadableStream());
}
```

### Node.js Runtime (기본값) Route Handler

```typescript
// app/api/chat/route.ts
import OpenAI from 'openai';

export async function POST(req: Request) {
  const openai = new OpenAI();
  const { messages } = await req.json();

  const completion = await openai.chat.completions.create({
    model: 'gpt-5-nano',
    messages,
  });

  return Response.json(completion.choices[0].message);
}
```

### Edge vs Node.js Runtime 선택 기준

| 요소 | Edge Runtime | Node.js Runtime |
|------|-------------|-----------------|
| 콜드 스타트 | ~0ms (항상 웜) | 수 초 소요 가능 |
| 타임아웃 | 30초 (Vercel 기준) | 최대 5분 |
| 스트리밍 | 네이티브 ReadableStream | 양호 |
| Node.js API | 제한적 서브셋 | 전체 접근 |
| 최적 용도 | 채팅 스트리밍, 저지연 | 복잡한 처리, 파일 작업 |

빌드 시 `A Node.js API is used (process.version)` 경고가 나올 수 있으나, 이는 **빌드 경고일 뿐 런타임에는 정상 동작**한다. 대안으로 Vercel AI SDK(`@ai-sdk/openai` + `ai`)를 사용하면 `useChat` 훅 등 프론트엔드 통합이 더 쉬워진다. **`dangerouslyAllowBrowser: true`는 절대 사용하지 말고**, API Key는 반드시 서버 사이드에서만 사용해야 한다.

---

## 결론

GPT-5 nano는 **$0.05/1M 입력, $0.40/1M 출력**이라는 파격적 가격에 **400K 컨텍스트 윈도우**를 제공하는, 현시점에서 OpenAI의 가장 비용 효율적인 독점 모델이다. Chat Completions API는 `model`과 `messages` 두 파라미터만으로 호출 가능하며, `response_format`의 `json_schema` 타입을 사용하면 스키마 수준의 JSON 출력 보장이 가능하다. TypeScript 개발자는 `openai` npm 패키지 v6.25.0을 사용하여 Next.js Edge Runtime에서도 문제없이 스트리밍 응답을 구현할 수 있다. GPT-5 계열부터는 `system` 대신 `developer` 역할을 사용하는 것이 권장되며, 새 프로젝트에서는 Chat Completions 대신 **Responses API**(`client.responses.create()`)를 고려하는 것이 향후 호환성 면에서 유리하다.