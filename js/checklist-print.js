(function initChecklistPrint() {
  'use strict';

  const REVIEW_DATE = '2026.07.15';
  const NEXT_REVIEW_DATE = '2026.10.15';
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

  const ageSelect = document.getElementById('ageSelect');
  const showChecklistButton = document.getElementById('showChecklist');
  const checklistResult = document.getElementById('checklistResult');
  const ageSectionContainer = document.querySelector('#age > .container');

  if (!ageSelect || !showChecklistButton || !checklistResult || !ageSectionContainer ||
      typeof CHECKLIST !== 'object' || !CHECKLIST) return;

  const printSheet = document.createElement('section');
  printSheet.id = 'checklistPrintSheet';
  printSheet.className = 'checklist-print-sheet';
  printSheet.setAttribute('aria-hidden', 'true');
  ageSectionContainer.append(printSheet);

  let activePrintButton = null;
  let printInProgress = false;

  function readChecklistState(age) {
    try {
      const saved = window.localStorage.getItem(`checklist_${age}`);
      const parsed = saved ? JSON.parse(saved) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_) {
      return {};
    }
  }

  function formatPrintDate(date) {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }

  function appendTextElement(parent, tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    element.textContent = text;
    parent.append(element);
    return element;
  }

  function renderPrintSheet(age) {
    const list = Array.isArray(CHECKLIST[age]) ? CHECKLIST[age] : CHECKLIST[0];
    const state = readChecklistState(age);
    const ageLabel = AGE_LABELS[age] || `${age}개월`;
    const checkedCount = list.reduce((total, _, index) => total + (state[index] === true ? 1 : 0), 0);

    printSheet.replaceChildren();

    const header = document.createElement('header');
    header.className = 'checklist-print-header';

    const brandRow = document.createElement('div');
    brandRow.className = 'checklist-print-brand';
    appendTextElement(brandRow, 'strong', '', '베베가이드');
    appendTextElement(brandRow, 'span', '', '공식자료 우선 · 생활·안전 참고용');
    header.append(brandRow);

    appendTextElement(header, 'h1', '', `${ageLabel} 생활·안전 체크리스트`);
    appendTextElement(
      header,
      'p',
      'checklist-print-intro',
      '아이의 속도와 가정 환경에 따라 필요한 항목은 다릅니다. 체크 수는 점수나 발달 평가가 아닙니다.'
    );

    const meta = document.createElement('div');
    meta.className = 'checklist-print-meta';
    appendTextElement(meta, 'span', '', `현재 확인 ${checkedCount}/${list.length}`);
    appendTextElement(meta, 'span', '', `인쇄일 ${formatPrintDate(new Date())}`);
    appendTextElement(meta, 'span', '', `내용 검토 ${REVIEW_DATE}`);
    header.append(meta);
    printSheet.append(header);

    const printList = document.createElement('ol');
    printList.className = 'checklist-print-list';

    list.forEach((item, index) => {
      const checked = state[index] === true;
      const listItem = document.createElement('li');
      listItem.className = checked ? 'is-checked' : '';

      const marker = document.createElement('span');
      marker.className = 'checklist-print-marker';
      marker.textContent = checked ? '✓' : '';
      marker.setAttribute('aria-hidden', 'true');

      const number = document.createElement('span');
      number.className = 'checklist-print-number';
      number.textContent = String(index + 1);

      const itemText = document.createElement('strong');
      itemText.textContent = item;

      const status = document.createElement('span');
      status.className = 'checklist-print-item-status';
      status.textContent = checked ? '확인함' : '확인 전';

      listItem.append(marker, number, itemText, status);
      printList.append(listItem);
    });

    printSheet.append(printList);

    const boundary = document.createElement('aside');
    boundary.className = 'checklist-print-boundary';
    appendTextElement(boundary, 'strong', '', '이 목록의 범위');
    appendTextElement(
      boundary,
      'p',
      '',
      '일반적인 생활·안전 확인용이며 진단·치료·접종 일정을 대신하지 않습니다. 갑자기 상태가 나빠지거나 응급 신호가 있으면 119 또는 의료기관을 이용하세요.'
    );
    printSheet.append(boundary);

    const footer = document.createElement('footer');
    footer.className = 'checklist-print-footer';
    appendTextElement(footer, 'span', '', '예방접종: nip.kdca.go.kr');
    appendTextElement(footer, 'span', '', '건강정보: health.kdca.go.kr');
    appendTextElement(footer, 'span', '', `다음 점검 ${NEXT_REVIEW_DATE}`);
    appendTextElement(footer, 'span', '', 'be-be-guide.com');
    printSheet.append(footer);
  }

  function cleanUpPrintState(message) {
    if (!printInProgress) return;
    const statusMessage = typeof message === 'string'
      ? message
      : '인쇄 창을 닫았습니다. 체크 상태는 그대로 유지됩니다.';

    printInProgress = false;
    document.body.classList.remove('is-printing-checklist');
    printSheet.setAttribute('aria-hidden', 'true');

    if (activePrintButton) {
      activePrintButton.disabled = false;
      activePrintButton.focus({ preventScroll: true });
      const status = document.getElementById('checklistPrintStatus');
      if (status) status.textContent = statusMessage;
    }
  }

  function openPrintDialog(button) {
    const age = String(ageSelect.value);
    const status = document.getElementById('checklistPrintStatus');

    renderPrintSheet(age);
    activePrintButton = button;
    printInProgress = true;
    button.disabled = true;
    printSheet.setAttribute('aria-hidden', 'false');
    document.body.classList.add('is-printing-checklist');
    if (status) status.textContent = '인쇄 창을 여는 중입니다. PDF로 저장할 수도 있습니다.';

    window.setTimeout(() => {
      try {
        window.print();
      } catch (_) {
        cleanUpPrintState('인쇄 창을 열지 못했습니다. 브라우저 메뉴의 인쇄 기능을 이용해 주세요.');
      }
    }, 0);
  }

  function addPrintTools() {
    const checklistHeader = checklistResult.querySelector('.checklist-header');
    if (!checklistHeader || checklistResult.querySelector('.checklist-print-tools')) return;

    const tools = document.createElement('div');
    tools.className = 'checklist-print-tools';
    tools.setAttribute('role', 'region');
    tools.setAttribute('aria-label', '체크리스트 인쇄');

    const copy = document.createElement('div');
    copy.className = 'checklist-print-tools-copy';
    appendTextElement(copy, 'strong', '', '광고 없이 한 장으로 보관');
    appendTextElement(copy, 'p', '', '선택한 월령의 7개 문장과 현재 체크 상태만 A4에 담습니다. 아이 이름과 생년월일은 넣지 않습니다.');
    const status = appendTextElement(copy, 'p', 'checklist-print-status', '');
    status.id = 'checklistPrintStatus';
    status.setAttribute('aria-live', 'polite');

    const button = document.createElement('button');
    button.id = 'printAgeChecklist';
    button.className = 'checklist-print-button';
    button.type = 'button';
    button.setAttribute('aria-describedby', 'checklistPrintStatus');

    const icon = document.createElement('i');
    icon.className = 'fas fa-print';
    icon.setAttribute('aria-hidden', 'true');
    button.append(icon, document.createTextNode(' 한 장으로 인쇄'));
    button.addEventListener('click', () => openPrintDialog(button));

    tools.append(copy, button);
    checklistHeader.insertAdjacentElement('afterend', tools);
  }

  showChecklistButton.addEventListener('click', addPrintTools);
  window.addEventListener('afterprint', cleanUpPrintState);
})();
