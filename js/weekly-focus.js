(function initWeeklyFocusModule() {
  'use strict';

  const STORAGE_KEY = 'bebe_weekly_focus_v1';
  const STORAGE_VERSION = 1;
  const DEFAULT_AGE = '0';
  const AGE_LABELS = {
    0: '출생~2개월',
    3: '3~5개월',
    6: '6~8개월',
    9: '9~11개월',
    12: '12~17개월',
    18: '18~23개월',
    24: '24~29개월',
    30: '30~35개월',
    36: '36개월'
  };

  // 기존 검수된 월령별 목록 중 안전·건강·공식 일정 항목을 먼저 보여줍니다.
  const FOCUS_ORDER = {
    0: [0, 4, 5],
    3: [0, 2, 5],
    6: [0, 2, 3],
    9: [0, 1, 5],
    12: [0, 1, 4],
    18: [0, 2, 5],
    24: [1, 5, 6],
    30: [0, 1, 6],
    36: [0, 4, 6]
  };

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function getWeekStart(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const daysSinceMonday = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - daysSinceMonday);
    return start;
  }

  function getWeekKey(date) {
    const start = getWeekStart(date);
    return `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  }

  function getNextMondayLabel(date) {
    const nextMonday = getWeekStart(date);
    nextMonday.setDate(nextMonday.getDate() + 7);
    return `${nextMonday.getMonth() + 1}월 ${nextMonday.getDate()}일`;
  }

  function isKnownAge(value) {
    return Object.prototype.hasOwnProperty.call(AGE_LABELS, String(value));
  }

  function createFreshState(age, weekKey) {
    return {
      version: STORAGE_VERSION,
      age: isKnownAge(age) ? String(age) : DEFAULT_AGE,
      weekKey,
      checks: {}
    };
  }

  function start() {
    if (typeof CHECKLIST !== 'object' || !CHECKLIST) return;

    const ageSelect = document.getElementById('weeklyAgeSelect');
    const listElement = document.getElementById('weeklyFocusList');
    const statusElement = document.getElementById('weeklyFocusStatus');
    const privacyElement = document.getElementById('weeklyFocusPrivacy');
    const resetButton = document.getElementById('weeklyFocusReset');
    const openAllButton = document.getElementById('weeklyFocusOpenAll');
    const fullAgeSelect = document.getElementById('ageSelect');
    const showChecklistButton = document.getElementById('showChecklist');

    if (!ageSelect || !listElement || !statusElement || !privacyElement || !resetButton || !openAllButton) return;

    const today = new Date();
    const currentWeekKey = getWeekKey(today);
    let storageAvailable = true;

    function readState() {
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return createFreshState(fullAgeSelect ? fullAgeSelect.value : DEFAULT_AGE, currentWeekKey);

        const saved = JSON.parse(raw);
        if (!saved || saved.version !== STORAGE_VERSION || saved.weekKey !== currentWeekKey) {
          return createFreshState(saved && saved.age, currentWeekKey);
        }

        return {
          version: STORAGE_VERSION,
          age: isKnownAge(saved.age) ? String(saved.age) : DEFAULT_AGE,
          weekKey: currentWeekKey,
          checks: saved.checks && typeof saved.checks === 'object' ? saved.checks : {}
        };
      } catch (_) {
        storageAvailable = false;
        return createFreshState(fullAgeSelect ? fullAgeSelect.value : DEFAULT_AGE, currentWeekKey);
      }
    }

    let state = readState();

    function saveState() {
      if (!storageAvailable) return;
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (_) {
        storageAvailable = false;
      }
    }

    function getFocusItems(age) {
      const source = CHECKLIST[age] || CHECKLIST[DEFAULT_AGE] || [];
      const preferred = FOCUS_ORDER[age] || FOCUS_ORDER[DEFAULT_AGE];
      return preferred
        .filter(index => typeof source[index] === 'string')
        .slice(0, 3)
        .map(index => ({ index, text: source[index] }));
    }

    function getAgeChecks(age) {
      if (!state.checks[age] || typeof state.checks[age] !== 'object') {
        state.checks[age] = {};
      }
      return state.checks[age];
    }

    function render() {
      const age = isKnownAge(state.age) ? state.age : DEFAULT_AGE;
      const items = getFocusItems(age);
      const checks = getAgeChecks(age);
      const checkedCount = items.filter(item => checks[item.index] === true).length;

      ageSelect.value = age;
      listElement.replaceChildren();

      items.forEach((item, position) => {
        const listItem = document.createElement('li');
        listItem.className = 'weekly-focus-item';
        if (checks[item.index] === true) listItem.classList.add('is-done');

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.id = `weekly-focus-${age}-${item.index}`;
        input.checked = checks[item.index] === true;

        const label = document.createElement('label');
        label.htmlFor = input.id;

        const number = document.createElement('span');
        number.className = 'weekly-focus-number';
        number.setAttribute('aria-hidden', 'true');
        number.textContent = String(position + 1);

        const text = document.createElement('span');
        text.className = 'weekly-focus-text';
        text.textContent = item.text;

        label.append(number, text);
        input.addEventListener('change', () => {
          getAgeChecks(age)[item.index] = input.checked;
          saveState();
          render();
        });

        listItem.append(input, label);
        listElement.appendChild(listItem);
      });

      if (checkedCount === items.length && items.length === 3) {
        statusElement.textContent = '3개 확인 완료 · 더 채우려 하지 않아도 됩니다.';
        statusElement.classList.add('is-complete');
      } else {
        statusElement.textContent = `${checkedCount}/3 확인 · ${getNextMondayLabel(today)} 다시 시작`;
        statusElement.classList.remove('is-complete');
      }

      resetButton.disabled = checkedCount === 0;
      privacyElement.textContent = storageAvailable
        ? '정확한 생년월일·이름은 받지 않습니다. 월령 범위와 체크 상태만 이 브라우저에 저장되며 매주 월요일 자동으로 초기화됩니다.'
        : '브라우저 저장을 사용할 수 없어 체크 상태가 자동 저장되지 않습니다. 이 화면을 닫기 전까지만 확인하세요.';
    }

    ageSelect.addEventListener('change', () => {
      state.age = isKnownAge(ageSelect.value) ? ageSelect.value : DEFAULT_AGE;
      if (fullAgeSelect) fullAgeSelect.value = state.age;
      saveState();
      render();
    });

    if (fullAgeSelect) {
      fullAgeSelect.addEventListener('change', () => {
        if (!isKnownAge(fullAgeSelect.value)) return;
        state.age = fullAgeSelect.value;
        saveState();
        render();
      });
    }

    resetButton.addEventListener('click', () => {
      state.checks[state.age] = {};
      saveState();
      render();
      statusElement.textContent = '이번 주 체크를 초기화했습니다.';
    });

    openAllButton.addEventListener('click', () => {
      if (fullAgeSelect) fullAgeSelect.value = state.age;
      if (showChecklistButton) {
        showChecklistButton.click();
      } else {
        const ageSection = document.getElementById('age');
        if (ageSection) ageSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    window.addEventListener('storage', event => {
      if (event.key !== STORAGE_KEY) return;
      state = readState();
      render();
    });

    saveState();
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
