(function initDeviceDataManager() {
  'use strict';

  const CHECKLIST_KEYS = ['0', '3', '6', '9', '12', '18', '24', '30', '36']
    .map(month => `checklist_${month}`);

  const DATA_GROUPS = [
    {
      id: 'weekly-focus',
      label: '이번 주 3개',
      description: '선택한 월령 범위와 이번 주 체크 상태',
      keys: ['bebe_weekly_focus_v1'],
      countType: 'checked'
    },
    {
      id: 'age-checklist',
      label: '월령별 체크리스트',
      description: '9개 월령 범위에서 확인한 항목',
      keys: CHECKLIST_KEYS,
      countType: 'checked'
    },
    {
      id: 'vaccination',
      label: '예방접종 확인',
      description: '직접 표시한 접종 확인 상태',
      keys: ['baby_vaccination'],
      countType: 'checked'
    },
    {
      id: 'diary',
      label: '성장 다이어리',
      description: '작성한 하루 기록',
      keys: ['baby_diary'],
      countType: 'records'
    },
    {
      id: 'growth',
      label: '키·몸무게 기록',
      description: '입력한 성장 측정 기록',
      keys: ['baby_growth_data'],
      countType: 'records'
    },
    {
      id: 'feeding',
      label: '수유·이유식 기록',
      description: '타이머로 남긴 수유·이유식 기록',
      keys: ['feedingRecords'],
      countType: 'records'
    },
    {
      id: 'bedtime',
      label: '취침 전 체크',
      description: '안전 수면 환경 체크 상태',
      keys: ['bedtimeChecklist'],
      countType: 'checked'
    },
    {
      id: 'preferences',
      label: '화면·분석 설정',
      description: '화면 테마와 개인정보 선택 상태',
      keys: ['theme', 'bebe_privacy_consent_v1'],
      countType: 'settings'
    }
  ];

  const listElement = document.getElementById('deviceDataList');
  const selectAllInput = document.getElementById('deviceDataSelectAll');
  const deleteButton = document.getElementById('deviceDataDelete');
  const confirmPanel = document.getElementById('deviceDataConfirm');
  const confirmSummary = document.getElementById('deviceDataConfirmSummary');
  const confirmDeleteButton = document.getElementById('deviceDataConfirmDelete');
  const cancelButton = document.getElementById('deviceDataCancel');
  const statusElement = document.getElementById('deviceDataStatus');
  const unavailableNote = document.getElementById('deviceDataUnavailable');

  if (!listElement || !selectAllInput || !deleteButton || !confirmPanel ||
      !confirmSummary || !confirmDeleteButton || !cancelButton || !statusElement) return;

  function getStorage() {
    try {
      const storage = window.localStorage;
      storage.getItem('bebe_weekly_focus_v1');
      return storage;
    } catch (_) {
      return null;
    }
  }

  const storage = getStorage();
  const groupState = new Map();
  let pendingGroupIds = [];

  function countTrueValues(value) {
    if (!value || typeof value !== 'object') return 0;
    return Object.values(value).reduce((total, item) => {
      if (item === true) return total + 1;
      if (item && typeof item === 'object') return total + countTrueValues(item);
      return total;
    }, 0);
  }

  function inspectGroup(group) {
    const presentValues = [];

    try {
      group.keys.forEach(key => {
        const rawValue = storage.getItem(key);
        if (rawValue !== null) presentValues.push({ key, rawValue });
      });
    } catch (_) {
      return { hasData: false, unavailable: true, status: '확인할 수 없음' };
    }

    if (presentValues.length === 0) {
      return { hasData: false, unavailable: false, status: '저장된 내용 없음' };
    }

    if (group.countType === 'settings') {
      return {
        hasData: true,
        unavailable: false,
        status: `저장됨 · ${presentValues.length}개 설정`
      };
    }

    let count = 0;
    let unreadable = false;

    presentValues.forEach(({ rawValue }) => {
      try {
        const parsedValue = JSON.parse(rawValue);
        if (group.countType === 'records') {
          if (Array.isArray(parsedValue)) count += parsedValue.length;
          else unreadable = true;
        } else {
          if (parsedValue && typeof parsedValue === 'object') count += countTrueValues(parsedValue);
          else unreadable = true;
        }
      } catch (_) {
        unreadable = true;
      }
    });

    if (unreadable) {
      return { hasData: true, unavailable: false, status: '저장됨 · 형식 확인 필요' };
    }

    const unit = group.countType === 'records' ? '개 기록' : '개 체크';
    return { hasData: true, unavailable: false, status: `저장됨 · ${count}${unit}` };
  }

  function makeRow(group, state) {
    const row = document.createElement('div');
    row.className = 'device-data-row';
    if (!state.hasData) row.classList.add('is-empty');

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.id = `device-data-${group.id}`;
    input.name = 'device-data-kind';
    input.value = group.id;
    input.disabled = !state.hasData || state.unavailable;
    input.dataset.deviceDataGroup = group.id;

    const label = document.createElement('label');
    label.htmlFor = input.id;

    const copy = document.createElement('span');
    copy.className = 'device-data-copy';

    const title = document.createElement('strong');
    title.textContent = group.label;

    const description = document.createElement('small');
    description.textContent = group.description;

    copy.append(title, description);

    const stateText = document.createElement('span');
    stateText.className = 'device-data-state';
    stateText.textContent = state.status;

    label.append(copy, stateText);
    row.append(input, label);
    return row;
  }

  function getSelectableInputs() {
    return Array.from(listElement.querySelectorAll('input[data-device-data-group]:not(:disabled)'));
  }

  function getSelectedInputs() {
    return getSelectableInputs().filter(input => input.checked);
  }

  function closeConfirmation(moveFocus) {
    pendingGroupIds = [];
    confirmPanel.hidden = true;
    confirmSummary.textContent = '';
    if (moveFocus) deleteButton.focus();
  }

  function updateSelectionControls() {
    const selectableInputs = getSelectableInputs();
    const selectedInputs = getSelectedInputs();

    deleteButton.disabled = selectedInputs.length === 0;
    selectAllInput.disabled = selectableInputs.length === 0;
    selectAllInput.checked = selectableInputs.length > 0 && selectedInputs.length === selectableInputs.length;
    selectAllInput.indeterminate = selectedInputs.length > 0 && selectedInputs.length < selectableInputs.length;

    if (!confirmPanel.hidden) closeConfirmation(false);
  }

  function render() {
    listElement.replaceChildren();
    groupState.clear();

    if (!storage) {
      selectAllInput.disabled = true;
      deleteButton.disabled = true;
      if (unavailableNote) unavailableNote.hidden = false;
      statusElement.textContent = '이 브라우저에서는 저장 내용을 확인할 수 없습니다.';
      return;
    }

    DATA_GROUPS.forEach(group => {
      const state = inspectGroup(group);
      groupState.set(group.id, state);
      listElement.append(makeRow(group, state));
    });

    if (unavailableNote) unavailableNote.hidden = true;
    updateSelectionControls();
  }

  listElement.addEventListener('change', event => {
    if (!event.target.matches('input[data-device-data-group]')) return;
    updateSelectionControls();
  });

  selectAllInput.addEventListener('change', () => {
    getSelectableInputs().forEach(input => {
      input.checked = selectAllInput.checked;
    });
    updateSelectionControls();
  });

  deleteButton.addEventListener('click', () => {
    const selectedInputs = getSelectedInputs();
    if (selectedInputs.length === 0) return;

    pendingGroupIds = selectedInputs.map(input => input.dataset.deviceDataGroup);
    const selectedLabels = pendingGroupIds
      .map(groupId => DATA_GROUPS.find(group => group.id === groupId))
      .filter(Boolean)
      .map(group => group.label);

    confirmSummary.textContent = `${selectedLabels.join(', ')}을(를) 이 브라우저에서 삭제합니다. 삭제한 기록은 되돌릴 수 없습니다.`;
    confirmPanel.hidden = false;
    confirmDeleteButton.focus();
  });

  cancelButton.addEventListener('click', () => closeConfirmation(true));

  confirmDeleteButton.addEventListener('click', () => {
    if (!storage || pendingGroupIds.length === 0) return;

    const pendingGroups = pendingGroupIds
      .map(groupId => DATA_GROUPS.find(group => group.id === groupId))
      .filter(Boolean);

    try {
      pendingGroups.forEach(group => {
        group.keys.forEach(key => storage.removeItem(key));
      });
    } catch (_) {
      statusElement.textContent = '일부 내용을 삭제하지 못했습니다. 브라우저의 사이트 데이터 설정을 확인해 주세요.';
      closeConfirmation(false);
      return;
    }

    confirmDeleteButton.disabled = true;
    cancelButton.disabled = true;
    statusElement.textContent = `${pendingGroups.length}개 종류를 삭제했습니다. 화면을 안전하게 다시 불러옵니다.`;
    history.replaceState(null, '', '#device-data');

    window.setTimeout(() => {
      window.location.reload();
    }, 800);
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !confirmPanel.hidden) closeConfirmation(true);
  });

  render();
})();
