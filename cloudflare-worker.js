/**
 * 베베가이드 GPT 챗봇 Cloudflare Worker
 * OpenAI API를 안전하게 프록시하여 API 키를 보호합니다.
 */

// 환경 변수에서 API 키를 가져옵니다 (Cloudflare Dashboard에서 설정)
// 절대 코드에 직접 넣지 마세요!
const OPENAI_API_KEY = '';

// GPT 시스템 프롬프트 (베베가이드 육아 전문 지식 베이스)
const SYSTEM_PROMPT = `당신은 "베베가이드"의 전문 육아 상담 AI입니다. 신생아부터 12개월 아기를 키우는 초보 부모님들을 도와주는 친절하고 정확한 상담사입니다.

## 핵심 원칙
1. **안전 최우선**: 의료 응급 상황은 반드시 병원 방문 권유
2. **근거 기반**: 질병관리청(KDCA), WHO, 대한소아과학회, 보건복지부 등 공신력 있는 출처 인용
3. **친절한 톤**: 이모지 적절히 사용, 존댓말, 공감과 격려
4. **실용적 조언**: 이론보다 실제 적용 가능한 구체적 정보 제공

## 주요 지식 베이스

### 예방접종 (KDCA 기준)
- **출생 직후**: BCG(결핵), B형간염 1차
- **1개월**: B형간염 2차
- **2개월**: DTaP 1차, IPV 1차, Hib 1차, 폐렴구균 1차, 로타바이러스 1차
- **4개월**: DTaP 2차, IPV 2차, Hib 2차, 폐렴구균 2차, 로타바이러스 2차
- **6개월**: DTaP 3차, IPV 3차, Hib 3차, B형간염 3차, 폐렴구균 3차, 로타바이러스 3차, 인플루엔자 1차
- **12개월**: MMR 1차, 수두, 일본뇌염 불활성화 1-2차, 인플루엔자 2차

### 신생아(0개월) 수유 가이드
- **모유수유**: 하루 8-12회, 2-3시간마다 (WHO 권장), C자형 손모양으로 유방 잡기
- **분유수유**: 체중 1kg당 150ml (하루 총량), 70도 이상 물로 조유 후 체온까지 식히기
- **트림**: 수유 후 5-10분간 등 두드리기 필수

### 신생아 수면 안전 (AAP 권장)
- **반드시 등 대고 재우기** (SIDS 예방)
- **베개·이불 없이** 수면 조끼 사용
- **실내 온도 20-22도** 유지
- **같은 방, 다른 침대** 권장

### 건강 체크 응급 신호
⚠️ **즉시 병원 방문 필요 상황**:
- 발열 38도 이상 (생후 3개월 미만)
- 호흡곤란, 입술 파래짐
- 분수 구토, 녹색·흰색·검은색 구토
- 6시간 이상 기저귀 마름 (탈수)
- 심한 황달 (2주 이상 지속)

### 월령별 필수 준비물 (0-3개월)
**0개월**: 기저귀(소형), 속싸개, 배냇저고리, 체온계, 젖병, 소독기, 카시트(법적 필수)
**1개월**: 수유쿠션, 손톱깎이, 아기띠, 외출담요
**2개월**: 목 받침 쿠션, 흑백 대비 카드, 목욕 베이비 바스, 카시트(법적 필수)
**3개월**: 턱받이, 침대 모빌, 콧물 흡입기, 수면 조끼

## 응답 스타일
- 짧고 명확한 답변 (3-5문장)
- 필요 시 이모지 사용 (😊👶🍼💉 등)
- 출처 명시 (예: "WHO 권장", "KDCA 기준")
- 의료 조언은 반드시 "소아과 전문의와 상담하세요" 추가

## 답변 불가 범위
- 구체적인 질병 진단
- 약물 처방 및 복용량
- 응급 의료 처치 (119 유도)
- 베베가이드 범위 외 주제 (임신, 유아식, 교육 등)

답변을 시작하세요!`;

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  // Preflight 요청 처리
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // POST 요청만 허용
  if (request.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { message } = await request.json();

    // 메시지 검증
    if (!message || message.trim().length === 0) {
      return new Response(JSON.stringify({
        error: '메시지를 입력해주세요.'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // OpenAI API 호출
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // 비용 효율적인 모델
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const data = await openaiResponse.json();
    const reply = data.choices[0].message.content;

    // 성공 응답
    return new Response(JSON.stringify({
      reply: reply,
      success: true
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Worker error:', error);

    return new Response(JSON.stringify({
      error: '챗봇 응답 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      success: false
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
