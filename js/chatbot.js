// 베베가이드 AI 챗봇

const chatContainer = document.getElementById("chatContainer");
const chatInput     = document.getElementById("chat-input");
const sendBtn       = document.getElementById("send-btn");
const chatToggleBtn = document.getElementById("chatToggleBtn");
const chatCloseBtn  = document.getElementById("chatCloseBtn");

// 1. 자주 묻는 질문에 대한 자동응답 사전
const autoResponses = {
  "0개월": `🍼 <b>0개월 아기 체크리스트</b><br>
- 속싸개 3~4장<br>
- 젖병 2개 이상<br>
- 신생아용 기저귀<br>
- 배냇저고리, 손싸개<br>
- 체온계, 비판텐 크림<br><br>
👉 수유 후 20~30분 세워 안기기<br>
👉 하루 8~10회 기저귀 교체`,

  "1개월": `🌙 <b>1개월 아기 돌봄 가이드</b><br>
- 수유 텀 2~3시간<br>
- 낮엔 밝게, 밤엔 어둡게 (낮밤 구분)<br>
- 트림 후 눕히기<br>
- 수면시간 16~18시간 유지`,

  "예방접종": `💉 <b>예방접종 일정 (생후 기준)</b><br>
- B형간염: 출생, 1개월, 6개월<br>
- BCG(결핵): 생후 4주 이내<br>
- DTaP / IPV / Hib: 2, 4, 6개월<br><br>
👉 꼭 소아과에서 최종 확인하세요.`,

  "분유": `🍼 <b>분유 급여 팁</b><br>
- 1회 60~80ml로 시작<br>
- 2~3시간 간격 유지<br>
- 40~45℃ 온도 유지<br>
- 남은 분유 재사용 ❌`,

  "모유": `🤱 <b>모유 수유 팁</b><br>
- 한쪽 충분히 비우고 반대쪽으로 교체<br>
- 수유 후 트림 필수<br>
- 엄마 자세 편한 게 중요 (수유쿠션 도움)`,

  "체온": `🌡️ <b>체온 관리</b><br>
- 정상: 36.5~37.5℃ 정도<br>
- 37.5℃ 이상: 미열일 수 있음<br>
- 38℃ 이상: 열 가능성 → 병원 상담 권장`,

  "기저귀": `🧷 <b>기저귀 교체</b><br>
- 하루 8~10회 교체가 보통<br>
- 발진 나면 무향 크림<br>
- 피부 숨 쉴 시간 잠깐 주는 것도 도움`
};

// 2. 메시지 DOM에 추가
function addMessage(content, sender = "user") {
  const bubble = document.createElement("div");
  bubble.classList.add("message", sender);
  bubble.innerHTML = content;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return bubble; // 로딩 메시지 제거를 위해 요소 반환
}

// 안전 가드: 응급 상황 감지 및 안전 메시지 반환
function safetyGuardReply(userMessage) {
  const urgentKeywords = [
    '열', '38', '39', '40', '발열', '고열',
    '호흡', '숨', '청색', '파랗', '파래',
    '경련', '숨을 못', '숨을 잘 못', '호흡이',
    '의식', '축 늘어', '반응 없', '청백',
    '토혈', '혈변', '피', '탈수'
  ];

  const lowered = userMessage.toLowerCase();
  const isUrgent = urgentKeywords.some(k => lowered.includes(k));

  if (isUrgent) {
    return `⚠️ <b>응급일 수 있어요</b><br><br>
      생후 3개월 미만 아기의 38도 이상 발열, 호흡 곤란, 경련 등은<br>
      <b>즉시 119 또는 응급실, 소아청소년과 진료를 받으세요.</b><br><br>
      온라인 답변은 의료진의 진단을 대체할 수 없습니다.<br>
      📞 응급: 119 / 소아과 상담 우선`;
  }
  return null;
}

// 3. 어떤 응답을 줄지 결정
function getAutoReply(userMessage) {
  const lower = userMessage.toLowerCase();

  // 1차: 안전 가드 체크
  const safetyMsg = safetyGuardReply(userMessage);
  if (safetyMsg) {
    return safetyMsg;
  }

  // 2차: 일반 응답
  for (const key in autoResponses) {
    if (lower.includes(key)) {
      return autoResponses[key];
    }
  }

  // 3차: 기본 안내
  return "👶 아직 등록되지 않은 질문이에요.<br><br>예시 질문:<br>- 0개월 체크리스트<br>- 예방접종 일정<br>- 분유 얼마나 줘요?<br>- 체온 몇 도가 정상이에요?";
}

// 4. 전송 로직 (AI 챗봇)
async function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;

  // 사용자 메시지 표시
  addMessage(`<b>👩‍🍼</b> ${text}`, "user");
  chatInput.value = "";

  // 1차: 응급 상황 체크 (즉시 응답)
  const safetyMsg = safetyGuardReply(text);
  if (safetyMsg) {
    setTimeout(() => {
      addMessage(`<b>🤖 베베봇:</b><br>${safetyMsg}`, "bot");
    }, 500);
    return;
  }

  // 2차: AI 챗봇 응답 (로딩 표시)
  const loadingMsg = addMessage(`<b>🤖 베베봇:</b><br><span class="typing-indicator">답변 생성 중<span class="dots">...</span></span>`, "bot");

  try {
    // OpenAI API 호출 (Cloudflare Worker 경유)
    const response = await fetch('https://bebeguide-chatbot.ttlthsusoky.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
      throw new Error('API 응답 오류');
    }

    const data = await response.json();

    // 로딩 메시지 제거
    loadingMsg.remove();

    if (data.success && data.reply) {
      // AI 응답 표시 (참고사이트 정보 자동 포함됨)
      addMessage(`<b>🤖 베베봇:</b><br>${data.reply}`, "bot");
    } else {
      throw new Error('응답 데이터 없음');
    }

  } catch (error) {
    console.error('챗봇 오류:', error);

    // 로딩 메시지 제거
    loadingMsg.remove();

    // 폴백: 키워드 기반 응답
    const fallbackReply = getAutoReply(text);
    addMessage(`<b>🤖 베베봇:</b><br>${fallbackReply}<br><br><small style="color:#999;">※ AI 서버 연결 중 문제가 발생했습니다. 기본 응답을 제공합니다.</small>`, "bot");
  }
}

// 엔터키, 버튼 둘 다 지원
sendBtn.addEventListener("click", handleSend);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});

// 5. 열기 / 닫기 토글
function openChat() {
  chatWidget.classList.remove("minimized");
  chatInput.focus();

  // 첫 방문 시 웰컴 메시지 표시 (localStorage로 제어)
  const welcomed = localStorage.getItem('bebe_chat_greeted');
  if (!welcomed) {
    setTimeout(() => {
      const welcomeMsg = `
        <b>👋 안녕하세요!</b><br>
        베베가이드 챗봇입니다.<br><br>
        ⚠️ <b><span style="color:#d32f2f;">중요 안내</span></b><br>
        응급 증상(고열, 호흡 곤란 등)은 <b>즉시 119 또는 소아과 진료</b>를 받으세요.<br>
        이 대화는 의료 진단이 아닙니다.<br><br>
        💡 <b>이런 질문을 해보세요:</b><br>
        - "0개월 체크리스트"<br>
        - "예방접종 일정"<br>
        - "분유 얼마나 줘요?"<br>
        - "체온 몇 도가 정상이에요?"<br><br>
        📧 <b>체크리스트를 이메일로 받아보고 싶으신가요?</b><br>
        아래 "문의/구독" 섹션에서 이메일로 링크를 받으실 수 있어요!<br><br>
        궁금한 점이 있으면 언제든 물어보세요! 😊
      `;
      addMessage(welcomeMsg, "bot");
      localStorage.setItem('bebe_chat_greeted', 'true');
    }, 500);
  }
}

function closeChat() {
  chatWidget.classList.add("minimized");
}

if (chatToggleBtn) {
  chatToggleBtn.addEventListener("click", openChat);
}
if (chatCloseBtn) {
  chatCloseBtn.addEventListener("click", closeChat);
}

// 페이지 로드 시에는 닫힌 상태 유지
closeChat();

// === 임신 준비 체크리스트 표시 기능 === //
(function initPregnancyChecklist() {
  const tabBtns = document.querySelectorAll('.pregnancy-tabs .tab-btn');
  const content = document.getElementById('pregnancyContent');

  if (!tabBtns.length || !content) return;

  // 초기 로드 시 첫 번째 카테고리 표시
  showPregnancyCategory('임신 전 준비');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 모든 버튼에서 active 제거
      tabBtns.forEach(b => b.classList.remove('active'));
      // 클릭된 버튼에 active 추가
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');
      showPregnancyCategory(category);
    });
  });

  function showPregnancyCategory(category) {
    const items = PREGNANCY_PREP[category] || [];

    let html = items.map((item, index) => `
      <div class="service-card checklist-item">
        <div class="service-icon">
          <i class="fas ${getCategoryIcon(category)}"></i>
          <span class="item-number">${index + 1}</span>
        </div>
        <h3>${item}</h3>
        <p>${getPregnancyItemDesc(item, category)}</p>
      </div>
    `).join('');

    content.innerHTML = html;
  }

  function getCategoryIcon(category) {
    const icons = {
      '임신 전 준비': 'fa-heart-pulse',
      '산모 용품': 'fa-person-dress',
      '아기 용품': 'fa-baby',
      '출산 준비': 'fa-hospital'
    };
    return icons[category] || 'fa-check-circle';
  }

  function getPregnancyItemDesc(item, category) {
    if (item.includes('엽산')) return '임신 준비 3개월 전부터 하루 400-800μg 복용을 권장합니다.';
    if (item.includes('건강검진')) return '임신 전 필수 검진으로 풍진, 간염, 성병 등을 확인합니다.';
    if (item.includes('카시트')) return '신생아 퇴원 시 법적으로 필수입니다. 안전 인증 제품을 선택하세요.';
    if (item.includes('출산 가방')) return '예정일 3-4주 전에 미리 준비해두면 안심입니다.';
    if (item.includes('젖병')) return '신생아는 작은 용량(120ml)의 젖병을 사용합니다.';

    return '건강한 임신과 출산을 위한 필수 준비물입니다.';
  }
})();

// === 예방접종 스케줄 표시 기능 === //

console.log("🍼 베베가이드 chatbot.js 로드 완료");