# 🍼 베베가이드 자동 회신 API

Cloudflare Workers 기반 서버리스 자동 이메일 회신 시스템

---

## 📁 파일 구조

```
api/
├── bebeguide-worker.js    # Cloudflare Worker 메인 코드
├── wrangler.toml          # Worker 배포 설정 파일
├── DEPLOY_GUIDE.md        # 상세 배포 가이드
└── README.md              # 이 파일
```

---

## ⚡ 주요 기능

### 1. 자동 이메일 회신

- 부모가 contactForm 제출 시 자동으로 회신 메일 발송
- 법적 안전 문구 포함 (의료 진단 아님, 응급 시 119)
- 월령별 맞춤 내용 제공

### 2. 운영자 알림

- Slack Webhook으로 새 요청 실시간 알림
- 요청자 정보, 아기 월령, 요청 유형 포함

### 3. 법적 안전성 확보

#### 의료법 준수
```
⚠️ 중요 안내
본 안내는 일반적인 정보 제공 목적이며,
의료진의 진단이나 치료를 대체할 수 없습니다.

응급 증상 시 즉시 119 또는 소아청소년과 진료를 받으세요.
```

#### 광고 표시
```
본 메일의 상품 링크는 쿠팡 파트너스 활동의 일환으로,
구매 시 일정 수수료를 제공받을 수 있습니다.
```

---

## 🔧 기술 스택

- **플랫폼:** Cloudflare Workers (Serverless)
- **이메일 발송:** MailChannels (무료) / Resend / SendGrid
- **알림:** Slack Webhook
- **언어:** JavaScript (ES6+)
- **배포:** Wrangler CLI

---

## 📊 API 스펙

### 엔드포인트

```
POST https://bebeguide-api.YOUR-SUBDOMAIN.workers.dev
```

### 요청 (FormData)

| 필드 | 타입 | 필수 | 설명 |
|-----|------|-----|------|
| `email` | string | ✅ | 부모 이메일 주소 |
| `name` | string | ❌ | 부모 이름 (기본: "고객님") |
| `baby_age` | string | ❌ | 아기 월령 (0-12) |
| `message` | string | ❌ | 추가 문의 사항 |
| `request_type` | string | ❌ | 요청 유형 (`PDF_CHECKLIST`, `VACCINE_REMINDER`, `GENERAL_INQUIRY`) |
| `requested_month` | string | ❌ | 요청 월령 (hidden 필드) |

### 응답

#### 성공 (200 OK)
```json
{
  "ok": true,
  "message": "요청이 접수되었습니다. 곧 이메일로 답변을 보내드릴게요!"
}
```

#### 실패 (400 Bad Request)
```json
{
  "error": "유효한 이메일 주소를 입력해주세요."
}
```

#### 서버 에러 (500 Internal Server Error)
```json
{
  "error": "요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
}
```

---

## 🔐 환경 변수

Cloudflare Dashboard > Workers > bebeguide-api > Settings > Variables

| 변수 이름 | 필수 | 설명 | 예시 |
|---------|-----|------|------|
| `SENDER_EMAIL` | ✅ | 발신자 이메일 | `noreply@bebe-guide.com` |
| `SENDER_NAME` | ❌ | 발신자 이름 | `베베가이드` |
| `SLACK_WEBHOOK_URL` | ❌ | Slack 알림 webhook | `https://hooks.slack.com/...` |

---

## 🚀 배포 방법

### 빠른 시작

```bash
# 1. Wrangler 설치
npm install -g wrangler

# 2. Cloudflare 로그인
wrangler login

# 3. 프로젝트 디렉토리 이동
cd C:\Users\hee\website\api

# 4. 로컬 테스트 (선택)
wrangler dev

# 5. 프로덕션 배포
wrangler deploy
```

**상세 가이드:** [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) 참고

---

## 📧 이메일 템플릿

### HTML 이메일

- 반응형 디자인 (모바일 최적화)
- 브랜드 컬러 (그라데이션)
- 법적 안전 문구 강조
- CTA 버튼 ("베베가이드 방문하기")

### 텍스트 이메일

- HTML 미지원 클라이언트 대응
- 동일한 내용을 텍스트로 제공

---

## 🔄 작동 흐름

```
1. 부모가 웹사이트 contactForm 제출
   ↓
2. Worker가 POST 요청 수신
   ↓
3. 이메일 유효성 검사
   ↓
4. [선택] Slack으로 운영자 알림
   ↓
5. MailChannels로 자동 회신 메일 발송
   ↓
6. 프론트엔드에 성공 응답 반환
```

---

## 🧪 테스트

### 로컬 테스트

```bash
wrangler dev
```

### cURL로 테스트

```bash
curl -X POST https://bebeguide-api.YOUR-SUBDOMAIN.workers.dev \
  -F "email=test@example.com" \
  -F "name=테스트 부모" \
  -F "baby_age=6" \
  -F "request_type=PDF_CHECKLIST" \
  -F "requested_month=6"
```

### PowerShell로 테스트

```powershell
$body = @{
    email = "test@example.com"
    name = "테스트 부모"
    baby_age = "6"
    request_type = "PDF_CHECKLIST"
}

Invoke-WebRequest -Uri "https://bebeguide-api.YOUR-SUBDOMAIN.workers.dev" `
  -Method POST -Body $body
```

---

## 📈 성능 및 제한

### Cloudflare Workers Free Tier

- **요청 수:** 100,000 요청/일
- **CPU 시간:** 10ms/요청
- **메모리:** 128MB
- **응답 시간:** ~50-200ms

### 이메일 발송 제한

#### MailChannels (무료)
- 검증된 도메인 필요
- 일일 발송 제한 없음 (합리적 사용)

#### Resend (무료)
- 3,000통/월
- 도메인 검증 권장

#### SendGrid (무료)
- 100통/일
- 도메인 검증 필요

---

## 🛡️ 보안 고려사항

### 현재 구현된 보안

- ✅ CORS 헤더 설정
- ✅ 이메일 유효성 검사
- ✅ 에러 핸들링

### 추가 권장 사항

- [ ] Rate Limiting (동일 IP 과도한 요청 차단)
- [ ] Captcha (Cloudflare Turnstile)
- [ ] Honeypot 필드 (스팸 봇 차단)
- [ ] 이메일 도메인 블랙리스트 (일회용 이메일 차단)

---

## 🐛 문제 해결

### 이메일이 발송되지 않음

**원인:**
- `SENDER_EMAIL` 환경 변수 미설정
- MailChannels 도메인 검증 실패

**해결:**
1. Dashboard > Variables 확인
2. 유효한 이메일 주소 사용
3. Worker 로그 확인: `wrangler tail`

### CORS 에러

**원인:**
- 프론트엔드와 Worker 도메인 불일치

**해결:**
Worker 코드에 CORS 헤더가 이미 포함되어 있으므로 정상 작동해야 합니다.

### 느린 응답 시간

**원인:**
- MailChannels API 응답 지연

**해결:**
- 이메일 발송을 비동기로 처리 (현재 구현됨)
- Cloudflare D1 Database에 요청 저장 후 별도 Worker로 발송

---

## 📝 향후 개선 사항

### Phase 2: PDF 자동 생성

- jsPDF 라이브러리 사용
- 월령별 체크리스트 PDF 생성
- 이메일에 PDF 첨부

### Phase 3: 예방접종 리마인더

- Cloudflare D1 Database로 구독자 정보 저장
- Cron Triggers로 정기 알림 발송
- 구독 취소 기능

### Phase 4: Analytics

- 요청 건수 추적
- 월령별 인기 통계
- Cloudflare Analytics 대시보드

---

## 📞 지원 및 문의

- **문서:** [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)
- **Cloudflare Docs:** https://developers.cloudflare.com/workers/
- **이메일:** info@bebe-guide.com

---

## 📄 라이선스

MIT License

Copyright (c) 2024 베베가이드

---

**작성일:** 2024-01-XX
**버전:** 1.0.0
**작성자:** 베베가이드 팀
