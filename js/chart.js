// 베베가이드 성장 그래프 기능

(function initGrowthChart() {
  const form = document.getElementById('growthDataForm');
  const chartCanvas = document.getElementById('growthChart');
  const savedDataContainer = document.getElementById('savedGrowthData');
  const clearBtn = document.getElementById('clearGrowthData');
  const chartTabs = document.querySelectorAll('.chart-tab');

  if (!form || !chartCanvas) return;

  let currentChart = null;
  let currentChartType = 'height'; // 'height' or 'weight'


  // localStorage에서 데이터 가져오기
  function getGrowthData() {
    const data = localStorage.getItem('baby_growth_data');
    return data ? JSON.parse(data) : [];
  }

  // localStorage에 데이터 저장
  function saveGrowthData(data) {
    localStorage.setItem('baby_growth_data', JSON.stringify(data));
  }

  // 데이터 추가
  function addGrowthRecord(month, height, weight) {
    const data = getGrowthData();
    const record = {
      id: Date.now(),
      month: parseInt(month),
      height: parseFloat(height),
      weight: parseFloat(weight),
      date: new Date().toLocaleDateString('ko-KR')
    };
    data.push(record);
    // 월령순으로 정렬
    data.sort((a, b) => a.month - b.month);
    saveGrowthData(data);
    return record;
  }

  // 데이터 삭제
  function deleteGrowthRecord(id) {
    let data = getGrowthData();
    data = data.filter(record => record.id !== id);
    saveGrowthData(data);
  }

  // 모든 데이터 삭제
  function clearAllData() {
    if (confirm('모든 성장 기록을 삭제하시겠습니까?')) {
      localStorage.removeItem('baby_growth_data');
      updateSavedDataList();
      updateChart();
      showNotification('모든 기록이 삭제되었습니다', 'success');
    }
  }

  // 저장된 데이터 목록 업데이트
  function updateSavedDataList() {
    const data = getGrowthData();
    const exportJSONBtn = document.getElementById('exportGrowthJSON');
    const exportCSVBtn = document.getElementById('exportGrowthCSV');
    const importLabel = document.querySelector('label[for="importGrowthJSON"]');

    if (data.length === 0) {
      savedDataContainer.innerHTML = '<p class="no-data">아직 저장된 기록이 없습니다. 위에서 데이터를 추가해보세요!</p>';
      clearBtn.style.display = 'none';
      if (exportJSONBtn) exportJSONBtn.style.display = 'none';
      if (exportCSVBtn) exportCSVBtn.style.display = 'none';
      if (importLabel) importLabel.style.display = 'inline-flex'; // 복원 버튼은 항상 표시
      return;
    }

    clearBtn.style.display = 'block';
    if (exportJSONBtn) exportJSONBtn.style.display = 'inline-flex';
    if (exportCSVBtn) exportCSVBtn.style.display = 'inline-flex';
    if (importLabel) importLabel.style.display = 'inline-flex';

    savedDataContainer.innerHTML = data.map(record => `
      <div class="growth-record-card">
        <div class="record-header">
          <span class="record-month">${record.month}개월</span>
          <button class="delete-record-btn" data-id="${record.id}" title="삭제">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="record-details">
          <div class="record-item">
            <i class="fas fa-ruler-vertical"></i>
            <span>키: ${record.height}cm</span>
          </div>
          <div class="record-item">
            <i class="fas fa-weight"></i>
            <span>몸무게: ${record.weight}kg</span>
          </div>
        </div>
        <div class="record-date">${record.date} 기록</div>
      </div>
    `).join('');

    // 삭제 버튼 이벤트
    document.querySelectorAll('.delete-record-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        deleteGrowthRecord(id);
        updateSavedDataList();
        updateChart();
        showNotification('기록이 삭제되었습니다', 'success');
      });
    });
  }

  // 차트 업데이트
  function updateChart() {
    const data = getGrowthData();

    if (currentChart) {
      currentChart.destroy();
    }

    // 입력된 기록만 연결해 변화 흐름을 보여줍니다.
    // 성별·재태주수·정확한 측정법이 없는 단순 평균선은 진단 오해를 만들 수 있어 표시하지 않습니다.
    const allMonths = [...new Set(data.map(d => d.month))].sort((a, b) => a - b);

    const ctx = chartCanvas.getContext('2d');
    currentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: allMonths,
        datasets: [
          {
            label: currentChartType === 'height' ? '우리 아기 키 (cm)' : '우리 아기 몸무게 (kg)',
            data: allMonths.map(m => {
              const record = data.find(d => d.month === m);
              return record ? (currentChartType === 'height' ? record.height : record.weight) : null;
            }),
            borderColor: '#ff69b4',
            backgroundColor: 'rgba(255, 105, 180, 0.1)',
            borderWidth: 3,
            pointRadius: 6,
            pointBackgroundColor: '#ff69b4',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            tension: 0.4,
            fill: true
          
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y + (currentChartType === 'height' ? 'cm' : 'kg');
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            title: {
              display: true,
              text: '월령 (개월)',
              font: { size: 14, weight: 'bold' }
            },
            grid: {
              display: false
            }
          },
          y: {
            title: {
              display: true,
              text: currentChartType === 'height' ? '키 (cm)' : '몸무게 (kg)',
              font: { size: 14, weight: 'bold' }
            },
            beginAtZero: false,
            grid: {
              color: 'rgba(0, 0, 0, 0.05)'
            }
          }
        }
      }
    });
  }

  // 폼 제출 이벤트
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const month = document.getElementById('growth_month').value;
    const height = document.getElementById('growth_height').value;
    const weight = document.getElementById('growth_weight').value;

    if (!month || !height || !weight) {
      showNotification('모든 항목을 입력해주세요', 'error');
      return;
    }

    addGrowthRecord(month, height, weight);
    updateSavedDataList();
    updateChart();
    form.reset();
    showNotification('성장 기록이 저장되었습니다! 📈', 'success');
  });

  // 차트 탭 전환
  chartTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      chartTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentChartType = tab.getAttribute('data-chart');
      updateChart();
    });
  });

  // 모든 데이터 삭제 버튼
  clearBtn?.addEventListener('click', clearAllData);

  // 데이터 내보내기 기능
  const exportJSONBtn = document.getElementById('exportGrowthJSON');
  const exportCSVBtn = document.getElementById('exportGrowthCSV');

  function downloadFile(content, filename, type) {
    const blob = new Blob([content], { type: type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportGrowthToJSON() {
    const data = getGrowthData();
    if (data.length === 0) {
      showNotification('내보낼 데이터가 없습니다', 'error');
      return;
    }
    const dataStr = JSON.stringify(data, null, 2);
    const today = new Date().toISOString().split('T')[0];
    downloadFile(dataStr, `베베가이드_성장기록_${today}.json`, 'application/json');
    showNotification('성장 기록을 JSON으로 내보냈습니다!', 'success');
  }

  function exportGrowthToCSV() {
    const data = getGrowthData();
    if (data.length === 0) {
      showNotification('내보낼 데이터가 없습니다', 'error');
      return;
    }

    // CSV 헤더
    let csv = '월령,키(cm),몸무게(kg),기록일\n';

    // CSV 데이터 행
    data.forEach(record => {
      const row = [
        record.month + '개월',
        record.height,
        record.weight,
        record.date
      ];
      csv += row.join(',') + '\n';
    });

    // BOM 추가 (엑셀 한글 깨짐 방지)
    const BOM = '\uFEFF';
    const today = new Date().toISOString().split('T')[0];
    downloadFile(BOM + csv, `베베가이드_성장기록_${today}.csv`, 'text/csv;charset=utf-8');
    showNotification('성장 기록을 CSV로 내보냈습니다!', 'success');
  }

  exportJSONBtn?.addEventListener('click', exportGrowthToJSON);
  exportCSVBtn?.addEventListener('click', exportGrowthToCSV);

  // 데이터 복원 기능
  const importJSONInput = document.getElementById('importGrowthJSON');

  function importGrowthFromJSON(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);

        // 데이터 유효성 검증
        if (!Array.isArray(importedData)) {
          showNotification('올바른 성장 데이터 형식이 아닙니다', 'error');
          return;
        }

        // 기본 필드 검증 (month, height, weight 필수)
        const isValid = importedData.every(record =>
          record.hasOwnProperty('month') &&
          record.hasOwnProperty('height') &&
          record.hasOwnProperty('weight')
        );

        if (!isValid) {
          showNotification('데이터 형식이 올바르지 않습니다', 'error');
          return;
        }

        // 기존 데이터 확인
        const existingData = getGrowthData();
        if (existingData.length > 0) {
          if (!confirm('기존 데이터가 있습니다. 병합하시겠습니까?\n(취소하면 기존 데이터를 덮어씁니다)')) {
            // 덮어쓰기
            saveGrowthData(importedData);
            updateSavedDataList();
            updateChart();
            showNotification(`${importedData.length}개의 성장 기록이 복원되었습니다`, 'success');
            return;
          }
        }

        // 병합 (중복 제거: ID 기준, 없으면 month 기준)
        const mergedData = [...existingData];
        let newCount = 0;
        importedData.forEach(record => {
          const exists = mergedData.find(e =>
            (e.id && record.id && e.id === record.id) ||
            (e.month === record.month && e.height === record.height && e.weight === record.weight)
          );
          if (!exists) {
            // ID가 없으면 새로 생성
            if (!record.id) record.id = Date.now() + newCount;
            mergedData.push(record);
            newCount++;
          }
        });

        // 월령순 정렬
        mergedData.sort((a, b) => a.month - b.month);

        saveGrowthData(mergedData);
        updateSavedDataList();
        updateChart();
        showNotification(`${newCount}개의 새로운 성장 기록이 추가되었습니다 (총 ${mergedData.length}개)`, 'success');
      } catch (error) {
        showNotification('파일을 읽는 중 오류가 발생했습니다', 'error');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  }

  importJSONInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      importGrowthFromJSON(file);
      // 파일 입력 초기화
      e.target.value = '';
    }
  });

  // 초기 로드
  updateSavedDataList();
  updateChart();
})();

// ==================== 예방접종 관리 기능 ====================

console.log("🍼 베베가이드 chart.js 로드 완료");