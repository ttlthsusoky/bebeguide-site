// 베베가이드 제휴 링크 중앙 설정
// 상품 링크는 이 파일에서 검증 상태를 통과한 범주만 만들 수 있습니다.
(function initAffiliateConfig(root) {
  'use strict';

  const DISCLOSURE = '이 페이지는 쿠팡 파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받을 수 있습니다. 구매 가격에는 영향을 주지 않으며, 제휴 여부는 선정 기준과 노출 순서에 영향을 주지 않습니다.';

  const provider = Object.freeze({
    id: 'coupang-partners',
    label: '쿠팡',
    partnerId: 'AF8186321',
    channelId: 'bebeguide',
    linksEnabled: true,
    connectionStatus: 'account-and-channel-verified',
    verifiedAt: '2026-07-15',
    nextReviewAt: '2026-10-15',
    officialLinks: Object.freeze({
      'small-toothbrush': 'https://link.coupang.com/a/fnEHykvTq0',
      'board-book': 'https://link.coupang.com/a/fnEIarROi4',
      'age-labelled-puzzle': 'https://link.coupang.com/a/fnEIOe7cTQ'
    })
  });

  const productRules = Object.freeze([
    {
      key: 'rear-facing-car-seat',
      terms: ['카시트'],
      label: '영아용 뒤보기 카시트',
      query: '영아 뒤보기 카시트 안전인증',
      risk: 'high',
      status: 'hold',
      holdReason: '정확한 모델의 현재 안전인증·리콜, 아이·차량 적합성, 제품·차량 설명서와 충돌 이력을 확인해야 해 검색 링크를 열지 않습니다.'
    },
    {
      key: 'baby-thermometer',
      terms: ['체온계'],
      label: '영유아 체온계',
      query: '영유아 체온계',
      risk: 'high',
      status: 'hold',
      holdReason: '식약처 허가 모델·측정 부위·사용 연령·위생 방법이 제품마다 달라 모델별 검증 전에는 검색 링크를 열지 않습니다.'
    },
    {
      key: 'high-chair',
      terms: ['하이체어'],
      label: '유아용 하이체어',
      query: '유아 하이체어 안전띠',
      risk: 'high',
      status: 'hold',
      holdReason: '현재 안전확인·리콜, 잠금·안정성과 트레이와 별개인 안전띠를 모델별로 확인해야 해 검색 링크를 열지 않습니다.'
    },
    {
      key: 'safety-gate',
      terms: ['안전문'],
      label: '유아용 안전문',
      query: '유아 안전문',
      risk: 'high',
      status: 'hold',
      holdReason: '계단 위 나사 고정, 어린이용 용도, 문틀 치수·틈·잠금·밀림과 리콜을 모델별로 확인해야 해 검색 링크를 열지 않습니다.'
    },
    {
      key: 'small-toothbrush',
      terms: ['칫솔'],
      label: '유아용 작은 칫솔',
      query: '유아용 작은 칫솔 연령표시',
      risk: 'low',
      status: 'search-only'
    },
    {
      key: 'board-book',
      terms: ['그림책', '보드북'],
      label: '유아 보드북 그림책',
      query: '유아 보드북 그림책 연령표시',
      risk: 'low',
      status: 'search-only'
    },
    {
      key: 'age-labelled-puzzle',
      terms: ['퍼즐'],
      label: '연령 표시 유아 퍼즐',
      query: '유아 연령표시 퍼즐 큰조각',
      risk: 'moderate',
      status: 'search-only'
    },
    {
      key: 'child-helmet',
      terms: ['헬멧'],
      label: '유아용 자전거 헬멧',
      query: '유아 자전거 헬멧 안전인증',
      risk: 'high',
      status: 'hold',
      holdReason: '활동 용도 인증, 머리둘레와 실제 맞음, 충격 이력과 놀이터 끈 걸림 경계를 모델별로 확인해야 해 검색 링크를 열지 않습니다.'
    }
  ]);

  function isReviewCurrent(asOf = new Date()) {
    const deadline = Date.parse(`${provider.nextReviewAt}T23:59:59+09:00`);
    const current = new Date(asOf).getTime();
    return Number.isFinite(deadline) && Number.isFinite(current) && current <= deadline;
  }

  function getOfferForText(text, asOf = new Date()) {
    const source = String(text || '');
    const rule = productRules.find(({ terms }) => terms.some((term) => source.includes(term)));
    if (!rule) return null;

    const officialUrl = provider.officialLinks[rule.key] || '';
    const enabled = provider.linksEnabled && isReviewCurrent(asOf) && rule.status === 'search-only' && Boolean(officialUrl);
    return Object.freeze({
      key: rule.key,
      label: rule.label,
      risk: rule.risk,
      status: rule.status,
      enabled,
      holdReason: rule.holdReason || '',
      url: enabled ? officialUrl : '',
      providerLabel: provider.label,
      disclosure: DISCLOSURE
    });
  }

  function syncPageLinks(asOf = new Date()) {
    const reviewCurrent = isReviewCurrent(asOf);
    document.querySelectorAll('[data-affiliate-link]').forEach((link) => {
      const key = link.dataset.affiliateCategory || '';
      const rule = productRules.find((item) => item.key === key);
      const officialUrl = provider.officialLinks[key] || '';
      const enabled = Boolean(rule && provider.linksEnabled && reviewCurrent && rule.status === 'search-only' && officialUrl);

      if (!enabled) {
        link.removeAttribute('href');
        link.removeAttribute('target');
        link.setAttribute('aria-disabled', 'true');
        link.classList.add('is-disabled');
        link.textContent = '현재 제휴 검색 중지';
        return;
      }

      link.setAttribute('href', officialUrl);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'sponsored nofollow noopener noreferrer');
      link.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      link.removeAttribute('aria-disabled');
      link.classList.remove('is-disabled');
    });
  }

  function syncAffiliateStatus(asOf = new Date()) {
    const reviewCurrent = isReviewCurrent(asOf);
    const activeCount = productRules.filter((rule) => rule.status === 'search-only' && provider.officialLinks[rule.key]).length;
    const nextReviewLabel = provider.nextReviewAt.replaceAll('-', '.');

    document.querySelectorAll('[data-affiliate-status]').forEach((status) => {
      const title = status.querySelector('strong');
      const detail = status.querySelector('span');
      if (!title || !detail) return;

      if (provider.linksEnabled && reviewCurrent) {
        title.textContent = `제휴 검색 ${activeCount}개 · 점검 완료`;
        detail.textContent = `${nextReviewLabel}까지 유효 · 기한이 지나면 자동 중지`;
        return;
      }

      title.textContent = '제휴 검색 일시 중지';
      detail.textContent = reviewCurrent
        ? '운영자가 전체 링크를 중지했습니다'
        : `${nextReviewLabel} 정기 점검 기한이 지나 다시 확인 중입니다`;
    });
  }

  root.BEBE_AFFILIATE = Object.freeze({
    disclosure: DISCLOSURE,
    provider,
    productRules,
    isReviewCurrent,
    getOfferForText,
    syncPageLinks,
    syncAffiliateStatus
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      syncPageLinks();
      syncAffiliateStatus();
    }, { once: true });
  } else {
    syncPageLinks();
    syncAffiliateStatus();
  }

})(window);
