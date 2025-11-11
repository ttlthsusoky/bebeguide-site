# 베베가이드 자동화 도구 가이드

이 문서는 베베가이드 성능 최적화 과정에서 생성된 8개의 Python 자동화 도구 사용법을 설명합니다.

---

## 📋 도구 목록

| 도구 | 기능 | 출력 |
|------|------|------|
| `split-modules.py` | JavaScript 모듈 분할 | 7개 JS 모듈 |
| `analyze-css.py` | CSS 분석 | 최적화 리포트 |
| `optimize-css.py` | CSS 자동 최적화 | 최적화된 CSS |
| `convert-to-webp.py` | 이미지 WebP 변환 | WebP 파일 |
| `minify-assets.py` | CSS/JS Minification | .min 파일 |
| `analyze-performance.py` | 성능 분석 | Lighthouse 요약 |
| `compare-performance.py` | 성능 비교 | Before/After 리포트 |
| `compare-all-performance.py` | 전체 여정 비교 | 완전한 성능 추이 |

---

## 🔧 필수 환경

### Python 버전
- Python 3.6 이상

### 필수 패키지
```bash
pip install Pillow  # 이미지 변환용 (convert-to-webp.py)
```

### 기타 도구
- Lighthouse CLI (성능 측정용)
```bash
npm install -g lighthouse
```

---

## 📖 도구별 상세 가이드

### 1. split-modules.py
**목적**: 단일 JavaScript 파일을 여러 모듈로 자동 분할

**사용법**:
```bash
python split-modules.py
```

**입력**: `js/script.js` (기존 단일 파일)

**출력**:
- `js/main.js` - UI & 네비게이션
- `js/data.js` - 데이터 상수
- `js/checklist.js` - 체크리스트 & 예방접종
- `js/chart.js` - 성장 그래프
- `js/diary.js` - 내 아기 다이어리
- `js/timer.js` - 타이머
- `js/chatbot.js` - AI 챗봇

**결과**: 콘솔에 각 파일의 라인 수 표시

**주의사항**:
- 기존 `script.js` 백업 권장
- 라인 번호 기반 분할이므로 원본 파일 구조 유지 필요

---

### 2. analyze-css.py
**목적**: CSS 파일 분석 및 최적화 기회 탐지

**사용법**:
```bash
python analyze-css.py
```

**입력**: `css/styles.css`

**출력** (콘솔):
- 총 라인 수
- 색상 사용 통계 (unique colors, 빈도 Top 10)
- 자주 사용되는 속성 (display, border-radius, box-shadow 등)
- Media queries 개수
- 폰트 크기 사용 통계
- 최적화 기회 (optimization score)
- 예상 절감 라인 수

**활용**:
- CSS 리팩토링 전 현황 파악
- 변수화 대상 색상 식별
- 중복 패턴 발견

---

### 3. optimize-css.py
**목적**: CSS 자동 최적화 (변수 추출, 패턴 통일)

**사용법**:
```bash
python optimize-css.py
```

**입력**: `css/styles.css`

**출력**:
- 수정된 `css/styles.css` (원본 덮어쓰기)
- 콘솔에 최적화 통계 표시

**수행 작업**:
1. 색상 변수화 (3회 이상 사용된 색상 → `:root` 변수)
2. `border-radius` 통일
3. `box-shadow` 통일
4. `transition` 통일
5. 유틸리티 클래스 추가 (`.flex-center`, `.shadow` 등)

**주의사항**:
- 원본 파일을 덮어쓰므로 Git commit 후 실행 권장
- 수동 검토 필요 (일부 변경이 의도와 다를 수 있음)

---

### 4. convert-to-webp.py
**목적**: PNG/JPG 이미지를 WebP로 자동 변환

**사용법**:
```bash
python convert-to-webp.py
```

**입력**: `images/` 디렉토리의 PNG/JPG 파일

**출력**:
- 각 이미지의 `.webp` 버전 생성
- 콘솔에 변환 통계 표시

**옵션**:
- Quality: 85 (기본값, 코드 수정으로 변경 가능)
- Method: 6 (최고 압축)

**변환 과정**:
1. PNG/JPG 파일 탐색
2. 이미 WebP가 있으면 스킵
3. RGBA → RGB 변환 (투명도 처리)
4. WebP로 저장 (Quality 85)
5. 파일 크기 비교 표시

**결과 예시**:
```
favicon-512.png
  Original: 10.7 KB
  WebP: 2.1 KB
  Reduction: 80.6%
```

---

### 5. minify-assets.py
**목적**: CSS/JavaScript 파일 자동 minification

**사용법**:
```bash
python minify-assets.py
```

**입력**:
- `css/styles.css`
- `js/*.js` (7개 모듈 파일)

**출력**:
- `css/styles.min.css`
- `js/*.min.js` (7개 minified 파일)

**Minification 기법**:
- **CSS**:
  - 주석 제거
  - 공백/줄바꿈 제거
  - 선택자 주변 공백 최적화
- **JavaScript**:
  - 주석 제거 (URL 보존)
  - 공백/줄바꿈 제거
  - 연산자 주변 공백 최적화
  - **변수명 유지** (안전성 확보)

**결과 통계**:
```
Total files processed: 8
Total original size: 170.3 KB
Total minified size: 126.9 KB
Total reduction: 25.5%
Total saved: 43.4 KB
```

**주의사항**:
- 변수명을 바꾸지 않으므로 UglifyJS보다 압축률 낮음
- 하지만 안전하게 동작 보장
- `index.html`에서 `.min.css`, `.min.js` 경로로 수동 변경 필요

---

### 6. analyze-performance.py
**목적**: Lighthouse JSON 리포트 분석 및 요약

**사용법**:
```bash
# 1. Lighthouse 실행
npx lighthouse https://be-be-guide.com --output json --output-path ./lighthouse-report --only-categories=performance

# 2. 분석 스크립트 실행
python analyze-performance.py
```

**입력**: `lighthouse-report.report.json`

**출력** (콘솔):
- 전체 성능 점수
- Core Web Vitals (FCP, LCP, TBT, CLS, Speed Index)
- 개선 기회 Top 5 (잠재적 절약 시간 포함)
- 진단 정보 (페이지 크기, DOM 요소 수, 메인 스레드 작업 시간)

**출력 파일**: `performance-summary.json` (요약 데이터)

**활용**:
- Lighthouse HTML 리포트 대신 콘솔에서 빠르게 확인
- CI/CD 파이프라인 통합 가능
- 핵심 지표만 추출

---

### 7. compare-performance.py
**목적**: Before/After 성능 비교

**사용법**:
```bash
# 1. Before 측정
npx lighthouse https://be-be-guide.com --output json --output-path ./lighthouse-report --only-categories=performance

# 2. 최적화 작업 수행

# 3. After 측정
npx lighthouse https://be-be-guide.com --output json --output-path ./lighthouse-after --only-categories=performance

# 4. 비교 스크립트 실행
python compare-performance.py
```

**입력**:
- `lighthouse-report.report.json` (Before)
- `lighthouse-after.report.json` (After)

**출력** (콘솔):
- 전체 성능 점수 변화
- Core Web Vitals 비교 (Before vs After)
- 페이지 크기 변화
- 주요 개선 사항 요약

**활용**:
- 최적화 효과 정량적 측정
- 개선/악화 지표 한눈에 파악

---

### 8. compare-all-performance.py
**목적**: 전체 최적화 여정 비교 (3단계)

**사용법**:
```bash
# 여러 단계 Lighthouse 리포트 필요
# - lighthouse-report.report.json (Before)
# - lighthouse-after.report.json (After Images)
# - lighthouse-final.report.json (Final)

python compare-all-performance.py
```

**입력**:
- `lighthouse-report.report.json` (Stage 1: Before)
- `lighthouse-after.report.json` (Stage 2: After Images)
- `lighthouse-final.report.json` (Stage 3: Final)

**출력** (콘솔):
- 3단계 성능 점수 evolution
- Core Web Vitals 여정 (각 단계별 값)
- 페이지 크기 evolution
- 적용된 최적화 요약

**활용**:
- 전체 프로젝트 성과 시각화
- 각 단계별 기여도 파악
- 최종 보고서 작성

---

## 🔄 일반적인 워크플로우

### 신규 프로젝트 최적화

1. **현황 파악**
```bash
# CSS 분석
python analyze-css.py

# 성능 측정
npx lighthouse https://your-site.com --output json --output html --output-path ./lighthouse-before
python analyze-performance.py
```

2. **CSS 최적화**
```bash
python optimize-css.py
```

3. **이미지 최적화**
```bash
python convert-to-webp.py
# HTML에서 이미지 경로 .webp로 변경
```

4. **Minification**
```bash
python minify-assets.py
# index.html에서 .min.css, .min.js로 경로 변경
```

5. **성능 재측정**
```bash
npx lighthouse https://your-site.com --output json --output html --output-path ./lighthouse-after
python compare-performance.py
```

---

## ⚠️ 주의사항

### 백업
- 모든 스크립트 실행 전 Git commit 권장
- 특히 `optimize-css.py`는 원본 파일 덮어쓰기

### 수동 검토 필요
- `optimize-css.py`: 일부 변경사항이 의도와 다를 수 있음
- `minify-assets.py`: HTML에서 경로 수동 변경 필요

### 환경 의존성
- `convert-to-webp.py`: Pillow 라이브러리 필요
- 성능 측정 스크립트: Lighthouse CLI 필요

### Windows 호환성
- 모든 스크립트는 Windows에서 테스트됨
- 한글 출력 처리 (cp949 인코딩 이슈 해결됨)

---

## 🐛 트러블슈팅

### Pillow 설치 오류
```bash
# Windows
pip install --upgrade pip
pip install Pillow

# macOS/Linux
pip3 install Pillow
```

### Lighthouse 설치 오류
```bash
# Node.js 먼저 설치 (https://nodejs.org)
npm install -g lighthouse
```

### 한글 출력 오류 (Windows)
- 스크립트는 이미 cp949 인코딩 이슈 해결됨
- 만약 문제 발생 시: `chcp 65001` (UTF-8 설정)

### WebP 변환 실패
- 투명도 있는 PNG: 자동으로 흰 배경 처리
- P 모드 이미지: 자동으로 RGBA 변환 후 처리

---

## 📚 추가 자료

### Lighthouse 문서
- [Lighthouse 공식 문서](https://developer.chrome.com/docs/lighthouse/)
- [Performance scoring](https://web.dev/performance-scoring/)

### WebP 문서
- [WebP 공식 사이트](https://developers.google.com/speed/webp)
- [Pillow 문서](https://pillow.readthedocs.io/)

### 성능 최적화 가이드
- [web.dev - Performance](https://web.dev/learn/#performance)
- [Core Web Vitals](https://web.dev/vitals/)

---

## 🤝 기여

이 도구들은 베베가이드 프로젝트에서 생성되었지만, 다른 프로젝트에도 재사용 가능합니다.

개선 제안:
1. GitHub Issues에 등록
2. Pull Request 제출
3. 사용 후기 공유

---

**마지막 업데이트**: 2025-11-11
**버전**: 1.0
**작성자**: Claude Code
