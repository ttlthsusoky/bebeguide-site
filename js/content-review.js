// 기존 글·체크리스트의 검수 상태를 모든 페이지에서 같은 방식으로 안내합니다.
(function showContentReviewNotice() {
  const path = window.location.pathname.replace(/\\/g, '/');
  const isChecklist = path.includes('/checklist/');
  const isBlog = path.includes('/blog/');
  if (!isChecklist && !isBlog) return;

  const isBlogIndex = /\/blog\/?(?:index\.html)?$/.test(path);
  const notice = document.createElement('aside');
  notice.className = `bebe-review-notice ${isChecklist ? 'is-retired' : 'is-reviewing'}`;
  notice.setAttribute('aria-label', '콘텐츠 검수 상태');

  if (isChecklist) {
    notice.innerHTML = `
      <div class="bebe-review-inner">
        <span class="bebe-review-status">과거 버전 사용 중단</span>
        <h1>이 월령별 구매 목록은 새 체크리스트로 대체되었습니다</h1>
        <p>고정된 월령과 물건 수량을 모든 아이에게 적용하지 않습니다. 아래 최신 생활·안전 체크리스트에서 아이의 월령 범위를 다시 선택해 주세요.</p>
        <div class="bebe-review-actions">
          <a class="bebe-review-primary" href="../index.html#age">최신 체크리스트로 이동</a>
          <a href="../index.html#about">베베가이드 기준 보기</a>
        </div>
        <small>기존 페이지는 재검수 자료로만 보관하며 검색 노출을 중단했습니다.</small>
      </div>`;
    const legacy = document.querySelector('body > .container');
    if (legacy) {
      legacy.classList.add('legacy-checklist-content');
      legacy.setAttribute('aria-hidden', 'true');
    }
  } else if (isBlogIndex) {
    notice.innerHTML = `
      <div class="bebe-review-inner">
        <span class="bebe-review-status">콘텐츠 재검수 진행 중</span>
        <h2>기존 글을 2026 공식 기준 체계로 다시 확인하고 있습니다</h2>
        <p>날짜와 1차 출처가 확인된 글부터 순차 공개합니다. 각 글 상단의 검수 상태를 먼저 확인해 주세요.</p>
        <div class="bebe-review-actions">
          <a class="bebe-review-primary" href="../index.html#development-guide">현재 확인된 핵심 기준</a>
          <a href="../index.html#about">출처 등급·편집 원칙</a>
        </div>
      </div>`;
  } else {
    notice.innerHTML = `
      <div class="bebe-review-inner">
        <span class="bebe-review-status">재검수 중 · 검색 노출 중단</span>
        <h2>이 글은 2026 공식 기준 체계로 다시 확인 중입니다</h2>
        <p>출처 링크·검토일이 명확하지 않은 숫자나 표현은 진단, 약 용량, 수유량, 예방접종 결정에 사용하지 마세요. 급한 증상은 온라인 글보다 119 또는 의료기관 판단을 우선하세요.</p>
        <div class="bebe-review-actions">
          <a class="bebe-review-primary" href="../index.html#development-guide">검수 완료 핵심 기준 보기</a>
          <a href="../index.html#about">베베가이드 편집 원칙</a>
        </div>
        <small>검수 완료 후 1차 출처와 마지막 검토일을 표시하고 검색 노출을 다시 검토합니다.</small>
      </div>`;
  }

  document.body.prepend(notice);
  document.body.classList.add('has-bebe-review-notice');

  document.querySelectorAll('.source-badge .fa-check-circle').forEach((icon) => {
    icon.classList.remove('fa-check-circle');
    icon.classList.add('fa-clock');
  });
})();