# 🍼 베베가이드 (BeBe Guide)

초보 부모를 위한 월령별 육아 가이드 웹 서비스

## 📋 주요 기능

- **월령별 맞춤 체크리스트**: 0~12개월 아기에게 필요한 준비물 안내
- **예방접종 일정 요약**: 질병관리청 기준 예방접종 스케줄
- **응급 상황 안내**: 즉시 119 또는 병원 방문이 필요한 증상 가이드
- **PDF 자동 생성**: 브라우저에서 jsPDF로 맞춤형 PDF 생성 및 이메일 전송
- **예방접종 리마인더**: 옵트인 구독자에게 주기적 알림 (예정)

## 🛠️ 기술 스택

### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- jsPDF (PDF 생성)
- Google Analytics 4 (트래킹)

### Backend
- Cloudflare Workers (Serverless)
- Cloudflare KV (구독자 저장)
- MailChannels API (이메일 발송)

## 📦 프로젝트 구조

```
website/
├── index.html              # 메인 페이지
├── privacy.html            # 개인정보 처리방침
├── css/
│   └── style.css          # 스타일시트
├── js/
│   └── script.js          # 메인 JavaScript (jsPDF, 폼 처리)
├── api/
│   ├── bebeguide-worker.js # Cloudflare Worker (이메일 발송)
│   ├── wrangler.toml       # Worker 설정
│   └── package.json        # 의존성
└── README.md              # 이 파일
```

## 🚀 배포 가이드

### 1. 사전 준비

**필수 항목:**
- Cloudflare 계정
- 도메인 (MailChannels 발신자 인증용)
- 쿠팡 파트너스 계정 (선택)

### 2. Cloudflare Worker 배포

```bash
cd api
npm install
wrangler login
wrangler deploy
```

배포 완료! 실제 Worker URL:
```
https://bebeguide-api.ttlthsusoky.workers.dev
```

### 3. 환경 변수 설정

**Cloudflare Dashboard → Workers → bebeguide-api → Settings → Variables**

| 변수명 | 예시 값 | 설명 |
|--------|---------|------|
| `SENDER_EMAIL` | `noreply@bebe-guide.com` | 발신자 이메일 (필수) |
| `SENDER_NAME` | `베베가이드` | 발신자 이름 (권장) |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | Slack 알림 (선택) |

### 4. KV 네임스페이스 생성

**Cloudflare Dashboard → Workers → KV → Create namespace**

1. 네임스페이스 이름: `bebeguide-reminder-users`
2. 생성 후 ID 복사
3. `wrangler.toml` 수정 (이미 완료됨):
   ```toml
   kv_namespaces = [
     { binding = "REMINDER_USERS", id = "8bfc983ed4f64b678b39c684afc614bb" }
   ]
   ```

### 5. MailChannels 도메인 검증

**Cloudflare DNS 설정에 다음 레코드 추가:**

```
SPF 레코드:
Type: TXT
Name: @
Content: v=spf1 include:mailchannels.net ~all

DKIM 레코드:
(MailChannels 문서 참고)

DMARC 레코드:
Type: TXT
Name: _dmarc
Content: v=DMARC1; p=quarantine; rua=mailto:dmarc@bebe-guide.com
```

### 6. index.html 수정

**Line 584 - Worker URL (이미 연결됨):**
```html
<form id="contactForm" action="https://bebeguide-api.ttlthsusoky.workers.dev" method="POST">
```

### 7. 쿠팡 파트너스 링크 교체 (선택)

**js/script.js - Line 853:**
```javascript
// 실제 쿠팡 파트너스 링크로 교체
const affiliateLink = `https://www.coupang.com/np/search?q=${searchKeyword}&subid=YOUR_PARTNER_ID`;
```

### 8. 프론트엔드 배포

**옵션 A: Cloudflare Pages**
```bash
# GitHub 연동 후 자동 배포
```

**옵션 B: 직접 호스팅**
- `index.html`, `css/`, `js/` 폴더를 웹 서버에 업로드

## 🧪 테스트 체크리스트

- [ ] 정상 케이스: PDF 첨부된 이메일 수신
- [ ] 응급 케이스: "호흡곤란" 입력 시 응급 안내 메일 수신
- [ ] VACCINE_REMINDER: 체크박스 선택 시 KV 저장 확인
- [ ] 제휴 링크: 클릭 시 GA4 이벤트 발생 확인
- [ ] PDF 내용: 법적 고지 3종 모두 포함 확인

## ⚖️ 법적 고지

### 포함된 안전 문구
모든 채널(웹사이트, PDF, 이메일)에 다음 문구가 포함됩니다:

1. **의료 면책**: "일반 정보 제공 목적이며 의료진의 진단을 대체하지 않음"
2. **응급 안내**: "호흡곤란, 고열 등 응급 시 즉시 119 또는 병원"
3. **제휴 고지**: "쿠팡 파트너스 활동으로 수수료 발생 가능"
4. **정보 기준일**: "2025-10-28 업데이트"
5. **옵트아웃 안내**: "이메일 중단 요청 가능"

## 📞 문의

- 웹사이트: https://bebe-guide.com
- 이메일: info@bebe-guide.com

## 📄 라이선스

Copyright © 2025 베베가이드. All rights reserved.

---

**주의**: 이 프로젝트는 교육 및 정보 제공 목적입니다. 의료 조언이 아닙니다.
