(function () {
  'use strict';

  var STORAGE_KEY = 'bebe_privacy_consent_v1';
  var CLOUDFLARE_TOKEN = 'e908f64e48814299b042e77513ce10b6';
  var analyticsLoaded = false;
  var panel;

  function readChoice() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return value === 'analytics' || value === 'essential' ? value : null;
    } catch (error) {
      return null;
    }
  }

  function saveChoice(value) {
    try {
      window.localStorage.setItem(STORAGE_KEY, value);
    } catch (error) {
      // 저장소가 막혀 있어도 현재 화면에서는 선택을 적용합니다.
    }
  }

  function clearLegacyGoogleCookies() {
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (name.indexOf('_ga') !== 0) return;

      document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
      document.cookie = name + '=; Max-Age=0; path=/; domain=.' + window.location.hostname + '; SameSite=Lax';
    });
  }

  function loadAnalytics() {
    if (analyticsLoaded) return;
    analyticsLoaded = true;

    // Google Analytics는 계정의 보관·삭제·국외 처리 설정 확인 전까지 로드하지 않습니다.
    clearLegacyGoogleCookies();

    if (!document.querySelector('script[data-bebe-analytics="cloudflare"]')) {
      var cloudflareScript = document.createElement('script');
      cloudflareScript.defer = true;
      cloudflareScript.src = 'https://static.cloudflareinsights.com/beacon.min.js';
      cloudflareScript.setAttribute('data-bebe-analytics', 'cloudflare');
      cloudflareScript.setAttribute('data-cf-beacon', JSON.stringify({ token: CLOUDFLARE_TOKEN }));
      cloudflareScript.referrerPolicy = 'strict-origin-when-cross-origin';
      document.head.appendChild(cloudflareScript);
    }
  }

  function statusText() {
    var choice = readChoice();
    if (choice === 'analytics') return '현재 선택: 필수 기능 + Cloudflare 방문 분석 허용';
    if (choice === 'essential') return '현재 선택: 필수 기능만 사용';
    return '아직 선택하지 않았습니다. 어느 쪽을 선택해도 사이트의 핵심 기능은 같습니다.';
  }

  function refreshPanelStatus() {
    if (!panel) return;
    var status = panel.querySelector('[data-privacy-status]');
    if (status) status.textContent = statusText();
  }

  function closePanel() {
    if (panel) panel.hidden = true;
  }

  function openSettings() {
    if (!panel) buildPanel();
    panel.hidden = false;
    refreshPanelStatus();
    var heading = panel.querySelector('h2');
    if (heading) heading.focus();
  }

  function choose(value) {
    var previous = readChoice();
    saveChoice(value);

    if (value === 'analytics') {
      loadAnalytics();
      closePanel();
      return;
    }

    clearLegacyGoogleCookies();
    closePanel();

    if (previous === 'analytics') {
      window.location.reload();
    }
  }

  function buildPanel() {
    panel = document.createElement('section');
    panel.className = 'privacy-consent-panel';
    panel.setAttribute('aria-label', '개인정보 및 방문 분석 설정');
    panel.innerHTML = [
      '<div class="privacy-consent-inner">',
      '  <div class="privacy-consent-copy">',
      '    <h2 tabindex="-1">방문 분석은 선택입니다</h2>',
      '    <p>체크리스트와 기록 기능은 분석을 거부해도 그대로 쓸 수 있습니다. 분석을 허용하면 Cloudflare Web Analytics만 페이지 이용 흐름과 성능 정보를 처리합니다. Google Analytics는 계정 설정 확인 전까지 중지했습니다.</p>',
      '    <p class="privacy-consent-status" data-privacy-status aria-live="polite"></p>',
      '    <a href="privacy-policy.html">처리 항목과 외부 서비스 자세히 보기</a>',
      '  </div>',
      '  <div class="privacy-consent-actions">',
      '    <button type="button" class="privacy-choice-essential" data-privacy-choice="essential">필수만 사용</button>',
      '    <button type="button" class="privacy-choice-analytics" data-privacy-choice="analytics">분석 허용</button>',
      '  </div>',
      '</div>'
    ].join('');

    panel.addEventListener('click', function (event) {
      var button = event.target.closest('[data-privacy-choice]');
      if (button) choose(button.getAttribute('data-privacy-choice'));
    });
    document.body.appendChild(panel);
    refreshPanelStatus();
  }

  function init() {
    buildPanel();

    document.querySelectorAll('[data-privacy-settings]').forEach(function (button) {
      button.addEventListener('click', openSettings);
    });

    var choice = readChoice();
    if (choice === 'analytics') loadAnalytics();
    panel.hidden = Boolean(choice);
  }

  window.BEBE_PRIVACY = {
    getChoice: readChoice,
    openSettings: openSettings,
    loadAnalytics: loadAnalytics
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
}());