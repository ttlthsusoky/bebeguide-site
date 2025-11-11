// 베베가이드 체크리스트 및 예방접종 관리

(function initAgeChecklist(){
  const ageSel = document.getElementById('ageSelect');
  const btnShow = document.getElementById('showChecklist');
  const box     = document.getElementById('checklistResult');
  if(!ageSel || !btnShow || !box) return;

  // 로컬스토리지에서 체크 상태 불러오기
  function loadChecklistState(month) {
    const saved = localStorage.getItem(`checklist_${month}`);
    return saved ? JSON.parse(saved) : {};
  }

  // 로컬스토리지에 체크 상태 저장하기
  function saveChecklistState(month, itemIndex, checked) {
    const state = loadChecklistState(month);
    state[itemIndex] = checked;
    localStorage.setItem(`checklist_${month}`, JSON.stringify(state));
  }

  btnShow.addEventListener('click', ()=>{
    const m = ageSel.value;
    const list = CHECKLIST[m] || CHECKLIST[0];
    const monthText = m == 0 ? '신생아' : `${m}개월`;
    const savedState = loadChecklistState(m);

    // 월령별 테마 클래스 결정
    const monthNum = parseInt(m);
    let themeClass = '';
    if (monthNum <= 6) {
      themeClass = 'age-theme-0-6';
    } else if (monthNum <= 12) {
      themeClass = 'age-theme-7-12';
    } else if (monthNum <= 24) {
      themeClass = 'age-theme-13-24';
    } else if (monthNum <= 36) {
      themeClass = 'age-theme-25-36';
    } else {
      themeClass = 'age-theme-0-6'; // 기본값
    }

    // Info bar 추가
    let infoBar = `
      <div class="checklist-info-bar" style="background:#e3f2fd; padding:12px; border-radius:8px; margin-bottom:20px; font-size:0.9rem; color:#1976d2;">
        <i class="fas fa-info-circle"></i> 이 체크리스트는 브라우저에 저장됩니다. 준비 완료한 항목에 체크하세요!
      </div>
    `;

    // 진행률 계산
    const progress = calculateProgress(m);

    // Add header with month info and progress bar
    let headerHTML = `
      <div class="checklist-header ${themeClass}">
        <h2>${monthText} 필수 준비물 체크리스트</h2>
        <p>${monthText} 아기에게 꼭 필요한 용품들을 정리했습니다. 안전하고 검증된 제품을 선택하세요.</p>

        <div class="progress-container">
          <div class="progress-header">
            <span class="progress-label">준비 진행률</span>
            <span class="progress-stats">${progress.checkedCount}/${progress.totalItems} 완료</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress.percentage}%">
              <span class="progress-text">${progress.percentage}%</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create checklist items with checkbox
    let itemsHTML = list.map((item, index) => {
      const isChecked = savedState[index] || false;
      const doneClass = isChecked ? 'done' : '';

      // 제휴 링크 생성 (실제 쿠팡 파트너스 링크로 교체 필요)
      const searchKeyword = encodeURIComponent(item.replace(/\([^)]*\)/g, '').trim());
      const affiliateLink = `https://www.coupang.com/np/search?q=${searchKeyword}&subid=AF8186321`;

      return `
      <div class="service-card checklist-item ${themeClass} ${doneClass}" data-index="${index}">
        <div class="checkbox-wrapper">
          <input type="checkbox" id="check-${m}-${index}" ${isChecked ? 'checked' : ''}
                 onchange="window.toggleChecklistItem(${m}, ${index}, this.checked)">
          <label for="check-${m}-${index}"></label>
        </div>
        <div class="service-icon">
          <i class="fas ${getCategoryIcon(item)}"></i>
          <span class="item-number">${index + 1}</span>
        </div>
        <h3>${item}</h3>
        <p>${getItemDescription(item, m)}</p>

        <div class="affiliate-box">
          <span class="affiliate-headline">[광고]</span>
          <span class="affiliate-desc">
            이 추천은 쿠팡 파트너스 활동의 일환으로, 해당 링크를 통해 구매 시
            판매자로부터 일정액의 수수료를 제공받습니다.
          </span>

          <div class="affiliate-buttons">
            <a class="affiliate-link-btn"
               href="${affiliateLink}"
               target="_blank"
               rel="noopener noreferrer"
               data-product="${item.replace(/"/g, '&quot;')}"
               data-month="${m}"
               onclick="trackAffiliateClick(event)">
              <i class="fas fa-shopping-cart"></i> 쿠팡에서 보기
            </a>
          </div>

          <div class="affiliate-price-note price-info">
            <strong>💰 최저가 확인 중...</strong><br>
            (가격/재고/배송비 등은 실시간으로 변동될 수 있어요)
          </div>
        </div>
      </div>
    `}).join('');

    box.innerHTML = infoBar + headerHTML + itemsHTML;
    box.scrollIntoView({behavior:'smooth', block:'start'});

    // 예방접종 스케줄도 해당 월령으로 업데이트 (하이라이트)
    renderVaccinationSchedule(m);
  });

  // 진행률 계산 함수
  function calculateProgress(month) {
    const list = CHECKLIST[month] || CHECKLIST[0];
    const totalItems = list.length;
    const savedState = loadChecklistState(month);

    let checkedCount = 0;
    for (let i = 0; i < totalItems; i++) {
      if (savedState[i]) checkedCount++;
    }

    const percentage = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
    return { checkedCount, totalItems, percentage };
  }

  // 진행률 UI 업데이트 함수
  function updateProgressUI(month) {
    const progress = calculateProgress(month);
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const progressStats = document.querySelector('.progress-stats');

    if (progressBar) {
      progressBar.style.width = `${progress.percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `${progress.percentage}%`;
    }

    if (progressStats) {
      progressStats.textContent = `${progress.checkedCount}/${progress.totalItems} 완료`;
    }

    // 100% 달성 시 축하 메시지 표시
    if (progress.percentage === 100) {
      showCongratulationsModal(month);
    }
  }

  // 축하 메시지 모달 표시 함수
  function showCongratulationsModal(month) {
    const monthText = month == 0 ? '신생아' : `${month}개월`;

    // 기존 모달이 있으면 제거
    const existingModal = document.querySelector('.congratulations-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'congratulations-modal';
    modal.innerHTML = `
      <div class="congratulations-content">
        <div class="confetti-container">
          ${generateConfetti()}
        </div>
        <div class="congratulations-icon">🎉</div>
        <h2>축하합니다! 🎊</h2>
        <p class="congrats-message">
          <strong>${monthText} 준비물을 모두 체크하셨습니다!</strong>
        </p>
        <p class="congrats-sub-message">
          아기를 맞이할 준비가 완벽하게 되었네요.<br>
          사랑스러운 육아의 시작을 응원합니다! 💕
        </p>
        <button class="congrats-close-btn" onclick="closeCongratulationsModal()">
          <i class="fas fa-check"></i> 확인
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // 애니메이션 시작
    setTimeout(() => {
      modal.classList.add('show');
    }, 100);
  }

  // Confetti 생성 함수
  function generateConfetti() {
    let confetti = '';
    const colors = ['#ff9aa2', '#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea'];
    const emojis = ['🎈', '🎉', '🎊', '🌟', '✨', '💕', '🍼', '👶', '❤️'];

    for (let i = 0; i < 50; i++) {
      const isEmoji = Math.random() > 0.7;
      const content = isEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : '';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const animationDelay = Math.random() * 3;
      const animationDuration = 3 + Math.random() * 2;

      confetti += `<div class="confetti ${isEmoji ? 'confetti-emoji' : ''}"
        style="left: ${left}%;
               background-color: ${color};
               animation-delay: ${animationDelay}s;
               animation-duration: ${animationDuration}s;">
        ${content}
      </div>`;
    }
    return confetti;
  }

  // 모달 닫기 함수 (전역)
  window.closeCongratulationsModal = function() {
    const modal = document.querySelector('.congratulations-modal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  };

  // 전역으로 체크 토글 함수 노출
  window.toggleChecklistItem = function(month, itemIndex, checked) {
    saveChecklistState(month, itemIndex, checked);

    // UI 업데이트
    const item = document.querySelector(`.checklist-item[data-index="${itemIndex}"]`);
    if (item) {
      if (checked) {
        item.classList.add('done');
      } else {
        item.classList.remove('done');
      }
    }

    // 진행률 업데이트
    updateProgressUI(month);
  };

  // Helper function to determine icon based on item category
  function getCategoryIcon(item) {
    const itemLower = item.toLowerCase();

    // 수유/먹기 관련
    if (itemLower.includes('젖병') || itemLower.includes('수유') || itemLower.includes('분유') ||
        itemLower.includes('이유식') || itemLower.includes('턱받이') || itemLower.includes('식탁') ||
        itemLower.includes('먹') || itemLower.includes('🍼') || itemLower.includes('🍽️')) {
      return 'fa-bottle-baby';
    }

    // 수면 관련
    if (itemLower.includes('침대') || itemLower.includes('수면') || itemLower.includes('침구') ||
        itemLower.includes('속싸개') || itemLower.includes('담요') || itemLower.includes('낮잠') ||
        itemLower.includes('💤') || itemLower.includes('🛏️')) {
      return 'fa-moon';
    }

    // 건강/의료 관련
    if (itemLower.includes('체온계') || itemLower.includes('예방접종') || itemLower.includes('건강') ||
        itemLower.includes('병원') || itemLower.includes('약') || itemLower.includes('크림') ||
        itemLower.includes('💉') || itemLower.includes('🌡️') || itemLower.includes('❤️')) {
      return 'fa-heart-pulse';
    }

    // 놀이/발달 관련
    if (itemLower.includes('장난감') || itemLower.includes('놀이') || itemLower.includes('그림책') ||
        itemLower.includes('도서') || itemLower.includes('발달') || itemLower.includes('퍼즐') ||
        itemLower.includes('블록') || itemLower.includes('🧸') || itemLower.includes('🎨') ||
        itemLower.includes('📚') || itemLower.includes('🎭')) {
      return 'fa-puzzle-piece';
    }

    // 안전 관련
    if (itemLower.includes('안전') || itemLower.includes('카시트') || itemLower.includes('보호대') ||
        itemLower.includes('잠금') || itemLower.includes('가드') || itemLower.includes('🚗') ||
        itemLower.includes('🚸')) {
      return 'fa-shield-halved';
    }

    // 위생/목욕 관련
    if (itemLower.includes('기저귀') || itemLower.includes('목욕') || itemLower.includes('욕조') ||
        itemLower.includes('로션') || itemLower.includes('샴푸') || itemLower.includes('물티슈') ||
        itemLower.includes('🛁')) {
      return 'fa-bath';
    }

    // 치아 관리
    if (itemLower.includes('치아') || itemLower.includes('칫솔') || itemLower.includes('치약') ||
        itemLower.includes('치과') || itemLower.includes('🦷')) {
      return 'fa-tooth';
    }

    // 의류/신발
    if (itemLower.includes('옷') || itemLower.includes('저고리') || itemLower.includes('신발') ||
        itemLower.includes('양말') || itemLower.includes('모자') || itemLower.includes('👕')) {
      return 'fa-shirt';
    }

    // 이동/외출
    if (itemLower.includes('유모차') || itemLower.includes('아기띠') || itemLower.includes('외출') ||
        itemLower.includes('걸음마') || itemLower.includes('🏃')) {
      return 'fa-baby-carriage';
    }

    // 학습/교육
    if (itemLower.includes('언어') || itemLower.includes('학습') || itemLower.includes('교육') ||
        itemLower.includes('유치원') || itemLower.includes('어린이집') || itemLower.includes('🎒')) {
      return 'fa-graduation-cap';
    }

    // 기본 아이콘
    return 'fa-baby';
  }

  // Helper function to provide context for items
  function getItemDescription(item, month) {
    const monthNum = parseInt(month);

    // 월령별 기본 설명
    let baseDesc = '';
    if (monthNum <= 6) {
      baseDesc = '초기 안전/수유/수면 루틴을 정비하세요.';
    } else if (monthNum <= 12) {
      baseDesc = '이유식·낮잠 전환·예방접종 일정에 유의하세요.';
    } else if (monthNum <= 24) {
      baseDesc = '언어·사회성 발달을 돕는 놀이를 권장합니다.';
    } else if (monthNum <= 36) {
      baseDesc = '규칙/순서 놀이와 안전교육을 병행하세요.';
    } else {
      baseDesc = '발달 수준에 맞춘 놀이와 안전 환경을 유지하세요.';
    }

    // 아이템별 상세 설명
    if (item.includes('기저귀')) return '아기 체중에 맞는 사이즈 선택이 중요합니다. 새는 것을 방지하고 편안함을 위해 정기적으로 교체하세요.';
    if (item.includes('체온계')) return '발열 체크용 필수품입니다. 디지털 체온계나 귀 적외선 체온계 모두 괜찮습니다.';
    if (item.includes('카시트')) return '법적 의무사항이며 생명과 직결된 안전용품입니다. 반드시 신품 구매를 권장합니다.';
    if (item.includes('이유식')) return '아기의 첫 고형식 도입 시기입니다. 알레르기 반응을 주의 깊게 관찰하세요.';
    if (item.includes('안전')) return '아기가 활동 반경이 넓어지면서 꼭 필요한 안전용품입니다.';
    if (item.includes('장난감') || item.includes('놀이')) return '월령에 맞는 발달 자극용 장난감입니다. 안전 인증 제품을 선택하세요.';
    if (item.includes('걸음마') || item.includes('신발')) return '아기의 대근육 발달에 도움이 되지만 과도한 사용은 피하세요.';
    if (item.includes('치아') || item.includes('칫솔') || item.includes('치과')) return '유치 관리의 시작입니다. 정기 검진과 올바른 양치 습관이 중요합니다.';
    if (item.includes('그림책') || item.includes('도서')) return '언어 발달과 정서 안정에 도움이 됩니다. 매일 일정 시간 함께 읽어주세요.';
    if (item.includes('유치원') || item.includes('어린이집')) return '사회성 발달의 중요한 시기입니다. 아이의 준비 상태를 확인하세요.';
    if (item.includes('퍼즐') || item.includes('블록')) return '소근육과 문제해결 능력 발달에 도움이 됩니다. 월령에 맞는 난이도를 선택하세요.';

    return baseDesc + ' 제품 구매 전 안전 인증을 확인하세요.';
  }
})();

// === 제휴마케팅 링크 관리 === //
function trackAffiliateClick(e) {
  try {
    const el = e.currentTarget;
    const product = el.getAttribute('data-product') || 'unknown';
    const month   = el.getAttribute('data-month') || 'unknown';

    // GA 이벤트 전송
    if (typeof gtag === 'function') {
      gtag('event', 'affiliate_click', {
        event_category: 'commerce',
        event_label: product,
        value: 1,
        baby_month: month
      });
    }

    // 추후(선택): Worker에 로그 쌓고 싶으면 여기서 fetch('/log-click', {...})
    // -> 그건 리마인더 저장과 유사한 방식으로 처리 가능
  } catch (err) {
    // 굳이 사용자에게 오류 표시할 필요는 없음
  }
}

// 자동 가격 정보 업데이트 (API 연동 준비)
async function updatePriceInfo() {
  const priceElements = document.querySelectorAll('.price-info');

  priceElements.forEach(async (element) => {
    try {
      // 현재: placeholder 상태
      element.textContent = '💰 최저가 비교 중...';

      // 향후 API 연결 시 활성화할 코드
      // const itemCard = element.closest('.checklist-item');
      // const itemName = itemCard.querySelector('h3').textContent;
      //
      // // 예시: 쿠팡 파트너스 또는 네이버쇼핑 API
      // const response = await fetch(`/api/price?item=${encodeURIComponent(itemName)}`);
      // const data = await response.json();
      //
      // if (data.success && data.price) {
      //   element.textContent = `💰 최저가: ${data.price.toLocaleString()}원`;
      // } else {
      //   element.textContent = '💰 가격 정보 없음';
      // }
    } catch (error) {
      console.error('가격 정보 업데이트 실패:', error);
      element.textContent = '💰 가격 확인 불가';
    }
  });
}

// 체크리스트 표시 후 가격 정보 업데이트
document.addEventListener('DOMContentLoaded', () => {
  // 페이지 로드 시 가격 정보 업데이트
  setTimeout(updatePriceInfo, 2000);
});


/* ===============================
   베베가이드 미니 챗봇 (토글 + 자동응답)
   =============================== */

const chatWidget    = document.getElementById("chatWidget");
function highlightIfMatch(month, ageText) {
  if (!month && month !== 0) return '';
  const monthNum = parseInt(month);

  // 0개월 = 신생아 = "출생"
  if (monthNum === 0 && ageText.includes("출생")) {
    return 'highlight';
  }

  // 일반 월령 매칭
  if (ageText.includes(`${monthNum}개월`)) {
    return 'highlight';
  }

  return '';
}

function renderVaccinationSchedule(month = null) {
  const wrap = document.getElementById('vaccinationSchedule');
  if (!wrap) return;

  wrap.innerHTML = VACCINATION_SCHEDULE.map(block => {
    const isHighlight = highlightIfMatch(month, block.age);
    const highlightClass = isHighlight ? 'vaccination-row highlight' : 'vaccination-row';

    const items = block.vaccines.map(v => `
      <li>
        <strong>${v.name}</strong>
        <span>${v.note || ''}</span>
      </li>`).join('');

    return `
      <div class="${highlightClass}">
        <div class="vaccine-age">${block.age}${isHighlight ? ' ⭐' : ''}</div>
        <ul class="vaccine-list">${items}</ul>
      </div>`;
  }).join('') + `
    <div class="vaccination-disclaimer">
      ※ 실제 접종 가능 시기(일/주 단위 조정)는 소아과마다 다를 수 있습니다.
      일정 확정 전 반드시 병원에서 확인하세요. (질병관리청 예방접종도우미 기준)
    </div>`;
}

// 페이지 로드 시 초기 렌더링
(function initVaccinationSchedule() {
  renderVaccinationSchedule();
})();

// === 0개월 상세 가이드 확장 기능 === //
// 월령 선택 시 0개월이면 상세 돌봄 가이드도 함께 표시
const originalShowChecklist = document.getElementById('showChecklist');
if (originalShowChecklist) {
  originalShowChecklist.addEventListener('click', function() {
    const ageSelect = document.getElementById('ageSelect');
    const selectedAge = ageSelect ? ageSelect.value : null;

    // 0개월 선택 시 상세 가이드 추가 표시
    if (selectedAge === '0') {
      setTimeout(() => {
        showNewbornCareGuide();
      }, 500);
    }
  });
}

function showNewbornCareGuide() {
  const resultBox = document.getElementById('checklistResult');
  if (!resultBox) return;

  let guideHTML = '<div class="newborn-care-section"><h2 style="margin-top:40px;text-align:center;">👶 신생아(0개월) 상세 돌봄 가이드</h2>';

  for (const category in NEWBORN_CARE) {
    guideHTML += `<div class="care-category"><h3>${category}</h3><div class="services-grid">`;

    NEWBORN_CARE[category].forEach(section => {
      guideHTML += `
        <div class="service-card newborn-care-card">
          <div class="service-icon">
            <i class="fas ${getCareIcon(section.title)}"></i>
          </div>
          <h4>${section.title}</h4>
          <ul class="care-list">
            ${section.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
    });

    guideHTML += '</div></div>';
  }

  guideHTML += '</div>';
  resultBox.insertAdjacentHTML('beforeend', guideHTML);
}

function getCareIcon(title) {
  const icons = {
    '모유수유': 'fa-baby',
    '분유수유': 'fa-bottle-baby',
    '기저귀 갈기': 'fa-diaper',
    '목욕': 'fa-bath',
    '수면 패턴': 'fa-moon',
    '환경 관리': 'fa-house',
    '성장 발달': 'fa-chart-line',
    '주의 증상': 'fa-triangle-exclamation'
  };
  return icons[title] || 'fa-info-circle';
}

document.addEventListener('DOMContentLoaded', () => {
  const contactForm    = document.getElementById('contactForm');
  const submitBtn      = document.getElementById('contactSubmitBtn');
  const statusBox      = document.getElementById('contactStatus');
  const reminderOptIn  = document.getElementById('reminderOptIn');

  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1) 버튼 비활성화
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '전송 중...';
    }

    // 2) 상태 초기화
    if (statusBox) {
      statusBox.style.color = '#555';
      statusBox.textContent = '';
    }

    const endpoint = contactForm.action;
    const formData = new FormData(contactForm);

    // 3) 실제 전송
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (res.ok && data.ok) {
        if (statusBox) {
          statusBox.style.color = '#10b981';
          statusBox.textContent =
            '요청이 접수되었습니다. 이메일을 확인해 주세요! (응급 증상은 즉시 119 또는 소아청소년과 진료를 받으셔야 합니다.)';
        }

        contactForm.reset();

        if (reminderOptIn) reminderOptIn.checked = false;

        if (typeof showNotification === 'function') {
          showNotification('요청이 정상적으로 접수되었어요 💌', 'success');
        }
      } else {
        if (statusBox) {
          statusBox.style.color = '#ef4444';
          statusBox.textContent =
            '전송에 실패했습니다. 다시 시도해 주세요. (응급이면 즉시 119 또는 소아청소년과 진료를 받으셔야 합니다.)';
        }

        if (typeof showNotification === 'function') {
          showNotification('전송에 문제가 발생했어요. 다시 시도해주세요.', 'error');
        }
      }
    } catch (err) {
      if (statusBox) {
        statusBox.style.color = '#ef4444';
        statusBox.textContent =
          '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. (응급이면 바로 119 또는 응급실로 가셔야 합니다.)';
      }

      if (typeof showNotification === 'function') {
        showNotification('네트워크 오류가 발생했습니다.', 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '보내주세요';
      }
    }
  });
});

// === 육아 팁 카드 펼치기 기능 === //

console.log("🍼 베베가이드 checklist.js 로드 완료");