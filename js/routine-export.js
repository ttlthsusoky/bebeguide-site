(function initRoutineExport() {
  'use strict';

  const FEEDING_STORAGE_KEY = 'feedingRecords';
  const EXPORT_NOTICE = '보호자 참고용 기록이며 진단·치료·투약을 위한 의료기록이 아닙니다.';
  const CSV_NOTICE = '보호자 참고용·의료기록 아님';

  const feedingPanel = document.getElementById('feedingExportPanel');
  const feedingStatus = document.getElementById('feedingExportStatus');
  const feedingCsvButton = document.getElementById('exportFeedingCSV');
  const feedingJsonButton = document.getElementById('exportFeedingJSON');
  const feedingHistoryList = document.getElementById('feedingHistoryList');

  const bedtimeSection = document.getElementById('bedtime-checklist');
  const bedtimeStatus = document.getElementById('bedtimeExportStatus');
  const bedtimeCsvButton = document.getElementById('exportBedtimeCSV');
  const bedtimeJsonButton = document.getElementById('exportBedtimeJSON');

  if (!feedingPanel && !bedtimeSection) return;

  function readFeedingRecords() {
    try {
      const rawValue = window.localStorage.getItem(FEEDING_STORAGE_KEY);
      if (!rawValue) return { ok: true, records: [] };

      const parsedValue = JSON.parse(rawValue);
      if (!Array.isArray(parsedValue)) return { ok: false, records: [] };
      return { ok: true, records: parsedValue };
    } catch (_) {
      return { ok: false, records: [] };
    }
  }

  function asText(value) {
    if (value === null || value === undefined) return '';
    return String(value);
  }

  function safeDuration(value) {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) && numberValue >= 0 ? Math.floor(numberValue) : 0;
  }

  function formatDuration(seconds) {
    const safeSeconds = safeDuration(seconds);
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${minutes}분 ${remainder}초`;
  }

  function parseTimestamp(value) {
    const rawValue = asText(value);
    const date = new Date(rawValue);
    if (!rawValue || Number.isNaN(date.getTime())) {
      return { date: '', time: '', iso: rawValue };
    }

    return {
      date: new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(date),
      time: new Intl.DateTimeFormat('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }).format(date),
      iso: date.toISOString()
    };
  }

  function normalizeFeedingRecord(record) {
    const safeRecord = record && typeof record === 'object' ? record : {};
    const isFeeding = safeRecord.type === 'feeding';
    const timestamp = parseTimestamp(safeRecord.timestamp);
    const durationSeconds = safeDuration(safeRecord.duration);

    return {
      id: asText(safeRecord.id),
      date: timestamp.date,
      time: timestamp.time,
      recordType: isFeeding ? '수유' : '이유식',
      detail: isFeeding ? asText(safeRecord.feedingType) : asText(safeRecord.stage),
      durationSeconds,
      durationText: formatDuration(durationSeconds),
      amount: asText(safeRecord.amount),
      menu: isFeeding ? '' : asText(safeRecord.menu),
      note: asText(safeRecord.note),
      timestamp: timestamp.iso
    };
  }

  function csvCell(value) {
    let text = asText(value).replace(/\r\n|\r|\n/g, ' ');
    if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  }

  function rowsToCsv(rows) {
    return '\uFEFF' + rows.map(row => row.map(csvCell).join(',')).join('\r\n') + '\r\n';
  }

  function fileDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  function updateFeedingPanel() {
    if (!feedingPanel || !feedingCsvButton || !feedingJsonButton || !feedingStatus) return;
    const result = readFeedingRecords();

    if (!result.ok) {
      feedingPanel.hidden = false;
      feedingCsvButton.disabled = true;
      feedingJsonButton.disabled = true;
      feedingStatus.textContent = '저장된 기록 형식을 읽을 수 없습니다. 원문은 표시하지 않았으며 자동으로 삭제하지도 않습니다.';
      return;
    }

    const hasRecords = result.records.length > 0;
    feedingPanel.hidden = !hasRecords;
    feedingCsvButton.disabled = !hasRecords;
    feedingJsonButton.disabled = !hasRecords;
    feedingStatus.textContent = hasRecords ? `${result.records.length}개 기록을 기기 안에서 확인했습니다.` : '';
  }

  function exportFeedingCsv() {
    const result = readFeedingRecords();
    if (!result.ok || result.records.length === 0) {
      updateFeedingPanel();
      return;
    }

    const records = result.records.map(normalizeFeedingRecord);
    const rows = [[
      '날짜',
      '시간',
      '기록 종류',
      '수유 유형·이유식 단계',
      '경과시간(초)',
      '경과시간',
      '섭취량',
      '메뉴',
      '메모',
      '원본 기록시각',
      '용도 안내'
    ]];

    records.forEach(record => {
      rows.push([
        record.date,
        record.time,
        record.recordType,
        record.detail,
        record.durationSeconds,
        record.durationText,
        record.amount,
        record.menu,
        record.note,
        record.timestamp,
        CSV_NOTICE
      ]);
    });

    downloadFile(
      rowsToCsv(rows),
      `베베가이드_수유이유식_${fileDate(new Date())}.csv`,
      'text/csv;charset=utf-8'
    );
    feedingStatus.textContent = `${records.length}개 기록을 CSV로 저장했습니다. 메뉴와 메모가 포함되어 있으니 파일을 안전하게 보관하세요.`;
  }

  function exportFeedingJson() {
    const result = readFeedingRecords();
    if (!result.ok || result.records.length === 0) {
      updateFeedingPanel();
      return;
    }

    const records = result.records.map(normalizeFeedingRecord);
    const payload = {
      format: 'bebeguide-feeding-export-v1',
      exportedAt: new Date().toISOString(),
      notice: EXPORT_NOTICE,
      recordCount: records.length,
      records
    };

    downloadFile(
      JSON.stringify(payload, null, 2),
      `베베가이드_수유이유식_${fileDate(new Date())}.json`,
      'application/json;charset=utf-8'
    );
    feedingStatus.textContent = `${records.length}개 기록을 JSON으로 저장했습니다. 이 파일은 자동으로 서버에 전송되지 않습니다.`;
  }

  function getBedtimeItems() {
    if (!bedtimeSection) return [];
    return Array.from(bedtimeSection.querySelectorAll('.bedtime-check')).map(input => {
      const item = input.closest('.checklist-item');
      const title = item ? item.querySelector('.check-title') : null;
      const description = item ? item.querySelector('.check-desc') : null;
      return {
        id: input.id,
        title: title ? title.textContent.trim() : '',
        description: description ? description.textContent.trim() : '',
        checked: input.checked === true
      };
    });
  }

  function updateBedtimePanel(message) {
    if (!bedtimeCsvButton || !bedtimeJsonButton || !bedtimeStatus) return;
    const items = getBedtimeItems();
    const checkedCount = items.filter(item => item.checked).length;
    const canExport = items.length > 0 && checkedCount > 0;

    bedtimeCsvButton.disabled = !canExport;
    bedtimeJsonButton.disabled = !canExport;
    bedtimeStatus.textContent = typeof message === 'string'
      ? message
      : canExport
        ? `${checkedCount}/${items.length}개 확인 상태를 저장할 수 있습니다.`
        : '항목을 하나 이상 확인하면 현재 상태를 저장할 수 있습니다.';
  }

  function exportBedtimeCsv() {
    const items = getBedtimeItems();
    const checkedCount = items.filter(item => item.checked).length;
    if (items.length === 0 || checkedCount === 0) {
      updateBedtimePanel();
      return;
    }

    const exportedAt = new Date().toISOString();
    const rows = [['항목', '설명', '상태', '내보낸 시각', '용도 안내']];
    items.forEach(item => {
      rows.push([
        item.title,
        item.description,
        item.checked ? '확인함' : '확인 전',
        exportedAt,
        CSV_NOTICE
      ]);
    });

    downloadFile(
      rowsToCsv(rows),
      `베베가이드_취침체크_${fileDate(new Date())}.csv`,
      'text/csv;charset=utf-8'
    );
    updateBedtimePanel(`${items.length}개 항목의 현재 상태를 CSV로 저장했습니다.`);
  }

  function exportBedtimeJson() {
    const items = getBedtimeItems();
    const checkedCount = items.filter(item => item.checked).length;
    if (items.length === 0 || checkedCount === 0) {
      updateBedtimePanel();
      return;
    }

    const payload = {
      format: 'bebeguide-bedtime-check-export-v1',
      exportedAt: new Date().toISOString(),
      notice: EXPORT_NOTICE,
      checkedCount,
      totalCount: items.length,
      items
    };

    downloadFile(
      JSON.stringify(payload, null, 2),
      `베베가이드_취침체크_${fileDate(new Date())}.json`,
      'application/json;charset=utf-8'
    );
    updateBedtimePanel(`${items.length}개 항목의 현재 상태를 JSON으로 저장했습니다.`);
  }

  feedingCsvButton?.addEventListener('click', exportFeedingCsv);
  feedingJsonButton?.addEventListener('click', exportFeedingJson);
  bedtimeCsvButton?.addEventListener('click', exportBedtimeCsv);
  bedtimeJsonButton?.addEventListener('click', exportBedtimeJson);

  if (feedingHistoryList && typeof MutationObserver === 'function') {
    const historyObserver = new MutationObserver(updateFeedingPanel);
    historyObserver.observe(feedingHistoryList, { childList: true, subtree: true });
  }

  bedtimeSection?.addEventListener('change', event => {
    if (event.target.matches('.bedtime-check')) updateBedtimePanel();
  });

  bedtimeSection?.addEventListener('click', event => {
    if (event.target.closest('#resetChecklistBtn')) window.setTimeout(() => updateBedtimePanel(), 0);
  });

  window.addEventListener('storage', event => {
    if (event.key === FEEDING_STORAGE_KEY) updateFeedingPanel();
    if (event.key === 'bedtimeChecklist') updateBedtimePanel();
  });

  updateFeedingPanel();
  updateBedtimePanel();
})();
