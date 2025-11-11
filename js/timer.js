// 베베가이드 타이머 시스템 (수유, 이유식, 취침 체크리스트)

// Feeding Timer & Meal Timer System
// ============================================
(function() {
  // Tab switching
  const timerTabs = document.querySelectorAll('.timer-tab');
  const timerContents = document.querySelectorAll('.timer-content');

  timerTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;

      // Update active tab
      timerTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active content
      timerContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${targetTab}-tab`) {
          content.classList.add('active');
        }
      });

      // Load history if history tab
      if (targetTab === 'history') {
        renderFeedingHistory();
      }
    });
  });

  // Feeding Timer
  let feedingTimerInterval = null;
  let feedingStartTime = null;
  let feedingElapsedSeconds = 0;
  let feedingPaused = false;

  const feedingTimerDisplay = document.getElementById('feedingTimer');
  const startFeedingBtn = document.getElementById('startFeedingBtn');
  const pauseFeedingBtn = document.getElementById('pauseFeedingBtn');
  const stopFeedingBtn = document.getElementById('stopFeedingBtn');
  const formulaAmountDiv = document.getElementById('formulaAmount');
  const feedingTypeInputs = document.querySelectorAll('input[name="feeding_type"]');

  // Show/hide formula amount based on type
  feedingTypeInputs.forEach(input => {
    input.addEventListener('change', (e) => {
      if (e.target.value === 'formula') {
        formulaAmountDiv.style.display = 'block';
      } else {
        formulaAmountDiv.style.display = 'none';
      }
    });
  });

  startFeedingBtn?.addEventListener('click', () => {
    feedingStartTime = Date.now() - (feedingElapsedSeconds * 1000);
    feedingPaused = false;

    feedingTimerInterval = setInterval(() => {
      if (!feedingPaused) {
        feedingElapsedSeconds = Math.floor((Date.now() - feedingStartTime) / 1000);
        updateTimerDisplay(feedingTimerDisplay, feedingElapsedSeconds);
      }
    }, 1000);

    startFeedingBtn.style.display = 'none';
    pauseFeedingBtn.style.display = 'inline-flex';
    stopFeedingBtn.style.display = 'inline-flex';
  });

  pauseFeedingBtn?.addEventListener('click', () => {
    feedingPaused = !feedingPaused;
    pauseFeedingBtn.innerHTML = feedingPaused
      ? '<i class="fas fa-play"></i> 계속'
      : '<i class="fas fa-pause"></i> 일시정지';
  });

  stopFeedingBtn?.addEventListener('click', () => {
    clearInterval(feedingTimerInterval);

    const feedingType = document.querySelector('input[name="feeding_type"]:checked').value;
    const formulaMl = document.getElementById('formula_ml')?.value || '';
    const feedingNote = document.getElementById('feeding_note')?.value || '';

    // Save to localStorage
    const record = {
      id: Date.now(),
      type: 'feeding',
      feedingType: feedingType === 'breast' ? '모유' : '분유',
      duration: feedingElapsedSeconds,
      amount: feedingType === 'formula' ? formulaMl + 'ml' : '',
      note: feedingNote,
      timestamp: new Date().toISOString()
    };

    saveFeedingRecord(record);

    // Reset
    feedingElapsedSeconds = 0;
    updateTimerDisplay(feedingTimerDisplay, 0);
    document.getElementById('formula_ml').value = '';
    document.getElementById('feeding_note').value = '';

    startFeedingBtn.style.display = 'inline-flex';
    pauseFeedingBtn.style.display = 'none';
    stopFeedingBtn.style.display = 'none';

    showNotification('수유 기록이 저장되었습니다! 🍼', 'success');
  });

  // Meal Timer
  let mealTimerInterval = null;
  let mealStartTime = null;
  let mealElapsedSeconds = 0;
  let mealPaused = false;

  const mealTimerDisplay = document.getElementById('mealTimer');
  const startMealBtn = document.getElementById('startMealBtn');
  const pauseMealBtn = document.getElementById('pauseMealBtn');
  const stopMealBtn = document.getElementById('stopMealBtn');

  startMealBtn?.addEventListener('click', () => {
    mealStartTime = Date.now() - (mealElapsedSeconds * 1000);
    mealPaused = false;

    mealTimerInterval = setInterval(() => {
      if (!mealPaused) {
        mealElapsedSeconds = Math.floor((Date.now() - mealStartTime) / 1000);
        updateTimerDisplay(mealTimerDisplay, mealElapsedSeconds);
      }
    }, 1000);

    startMealBtn.style.display = 'none';
    pauseMealBtn.style.display = 'inline-flex';
    stopMealBtn.style.display = 'inline-flex';
  });

  pauseMealBtn?.addEventListener('click', () => {
    mealPaused = !mealPaused;
    pauseMealBtn.innerHTML = mealPaused
      ? '<i class="fas fa-play"></i> 계속'
      : '<i class="fas fa-pause"></i> 일시정지';
  });

  stopMealBtn?.addEventListener('click', () => {
    clearInterval(mealTimerInterval);

    const mealStage = document.getElementById('meal_stage')?.value || '';
    const mealAmount = document.getElementById('meal_amount')?.value || '';
    const mealMenu = document.getElementById('meal_menu')?.value || '';
    const mealNote = document.getElementById('meal_note')?.value || '';

    // Save to localStorage
    const record = {
      id: Date.now(),
      type: 'meal',
      stage: mealStage,
      duration: mealElapsedSeconds,
      amount: mealAmount + '%',
      menu: mealMenu,
      note: mealNote,
      timestamp: new Date().toISOString()
    };

    saveFeedingRecord(record);

    // Reset
    mealElapsedSeconds = 0;
    updateTimerDisplay(mealTimerDisplay, 0);
    document.getElementById('meal_amount').value = '100';
    document.getElementById('meal_menu').value = '';
    document.getElementById('meal_note').value = '';

    startMealBtn.style.display = 'inline-flex';
    pauseMealBtn.style.display = 'none';
    stopMealBtn.style.display = 'none';

    showNotification('이유식 기록이 저장되었습니다! 🥄', 'success');
  });

  // Helper functions
  function updateTimerDisplay(displayElement, seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    displayElement.textContent = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  function saveFeedingRecord(record) {
    const records = JSON.parse(localStorage.getItem('feedingRecords') || '[]');
    records.unshift(record); // Add to beginning
    localStorage.setItem('feedingRecords', JSON.stringify(records));
  }

  function getFeedingRecords() {
    return JSON.parse(localStorage.getItem('feedingRecords') || '[]');
  }

  function renderFeedingHistory() {
    const records = getFeedingRecords();
    const historyList = document.getElementById('feedingHistoryList');

    // Calculate today's stats
    const today = new Date().toDateString();
    const todayRecords = records.filter(r => new Date(r.timestamp).toDateString() === today);

    const feedingCount = todayRecords.filter(r => r.type === 'feeding').length;
    const mealCount = todayRecords.filter(r => r.type === 'meal').length;
    const totalFeedingTime = todayRecords
      .filter(r => r.type === 'feeding')
      .reduce((sum, r) => sum + r.duration, 0);

    document.getElementById('todayFeedingCount').textContent = feedingCount;
    document.getElementById('todayMealCount').textContent = mealCount;
    document.getElementById('totalFeedingTime').textContent = Math.floor(totalFeedingTime / 60) + '분';

    if (records.length === 0) {
      historyList.innerHTML = `
        <div class="no-history">
          <i class="fas fa-calendar-times"></i>
          <p>아직 기록이 없습니다</p>
        </div>
      `;
      return;
    }

    historyList.innerHTML = records.map(record => {
      const date = new Date(record.timestamp);
      const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });

      if (record.type === 'feeding') {
        const duration = Math.floor(record.duration / 60);
        return `
          <div class="history-item">
            <div class="history-item-header">
              <div class="history-item-type">
                <i class="fas fa-bottle"></i> ${record.feedingType}
              </div>
              <div class="history-item-time">${dateStr} ${timeStr}</div>
            </div>
            <div class="history-item-details">
              ⏱️ ${duration}분 ${record.duration % 60}초
              ${record.amount ? ` | 📏 ${record.amount}` : ''}
            </div>
            ${record.note ? `<div class="history-item-note">${record.note}</div>` : ''}
          </div>
        `;
      } else {
        const duration = Math.floor(record.duration / 60);
        return `
          <div class="history-item">
            <div class="history-item-header">
              <div class="history-item-type">
                <i class="fas fa-utensils"></i> 이유식 (${record.stage})
              </div>
              <div class="history-item-time">${dateStr} ${timeStr}</div>
            </div>
            <div class="history-item-details">
              ⏱️ ${duration}분 ${record.duration % 60}초 | 📊 섭취량 ${record.amount}
              ${record.menu ? ` | 🍽️ ${record.menu}` : ''}
            </div>
            ${record.note ? `<div class="history-item-note">${record.note}</div>` : ''}
          </div>
        `;
      }
    }).join('');
  }

  // Clear history
  document.getElementById('clearFeedingHistory')?.addEventListener('click', () => {
    if (confirm('모든 수유/이유식 기록을 삭제하시겠습니까?')) {
      localStorage.removeItem('feedingRecords');
      renderFeedingHistory();
      showNotification('모든 기록이 삭제되었습니다', 'success');
    }
  });

  // Initial load
  renderFeedingHistory();
})();

// ============================================
// Bedtime Checklist System
// ============================================
(function() {
  const checkboxes = document.querySelectorAll('.bedtime-check');
  const progressText = document.getElementById('checklistProgress');
  const progressBar = document.getElementById('checklistProgressBar');
  const resetBtn = document.getElementById('resetChecklistBtn');

  // Load saved state
  function loadChecklistState() {
    const saved = JSON.parse(localStorage.getItem('bedtimeChecklist') || '{}');
    checkboxes.forEach(checkbox => {
      if (saved[checkbox.id]) {
        checkbox.checked = true;
      }
    });
    updateProgress();
  }

  // Save state
  function saveChecklistState() {
    const state = {};
    checkboxes.forEach(checkbox => {
      state[checkbox.id] = checkbox.checked;
    });
    localStorage.setItem('bedtimeChecklist', JSON.stringify(state));
  }

  // Update progress
  function updateProgress() {
    const total = checkboxes.length;
    const checked = document.querySelectorAll('.bedtime-check:checked').length;
    const percentage = Math.round((checked / total) * 100);

    progressText.textContent = `${checked}/${total}`;
    progressBar.style.width = `${percentage}%`;

    if (percentage === 100) {
      showNotification('모든 준비 완료! 아기가 편안한 밤을 보낼 수 있어요 🌙', 'success');
    }
  }

  // Event listeners
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      saveChecklistState();
      updateProgress();
    });
  });

  resetBtn?.addEventListener('click', () => {
    checkboxes.forEach(checkbox => checkbox.checked = false);
    saveChecklistState();
    updateProgress();
    showNotification('체크리스트가 초기화되었습니다', 'info');
  });

  // Initialize
  loadChecklistState();
})();

console.log("🍼 베베가이드 timer.js 로드 완료");