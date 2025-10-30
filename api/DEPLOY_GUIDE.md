# 🚀 베베가이드 Cloudflare Worker 배포 가이드

이 가이드는 **자동 이메일 회신 시스템**을 Cloudflare Workers에 배포하는 방법을 안내합니다.

---

## 📋 목차

1. [준비 사항](#1-준비-사항)
2. [Cloudflare 계정 설정](#2-cloudflare-계정-설정)
3. [로컬 환경 설정](#3-로컬-환경-설정)
4. [Worker 배포](#4-worker-배포)
5. [환경 변수 설정](#5-환경-변수-설정)
6. [프론트엔드 연결](#6-프론트엔드-연결)
7. [테스트 및 확인](#7-테스트-및-확인)
8. [문제 해결](#8-문제-해결)

---

## 1. 준비 사항

### 필수 요구사항

- ✅ **Node.js** 18.x 이상 설치
- ✅ **npm** 또는 **yarn** 설치
- ✅ **Cloudflare 계정** (무료 가입 가능)
- ✅ **이메일 발신 도메인** (선택사항, MailChannels 사용 시)

### 선택 사항

- Slack Webhook URL (운영자 알림용)
- Custom Domain (예: api.bebe-guide.com)

---

## 2. Cloudflare 계정 설정

### 2.1 계정 생성

1. https://dash.cloudflare.com 접속
2. 무료 계정 생성 (이메일 인증 필수)
3. 로그인 후 Dashboard 접속

### 2.2 Workers 활성화

1. Dashboard 좌측 메뉴에서 **"Workers & Pages"** 클릭
2. **"Create Application"** 클릭
3. Workers 플랜 확인 (Free: 월 100,000 요청 무료)

---

## 3. 로컬 환경 설정

### 3.1 Wrangler CLI 설치

터미널에서 다음 명령어 실행:

```bash
npm install -g wrangler
```

설치 확인:

```bash
wrangler --version
```

### 3.2 Cloudflare 로그인

```bash
wrangler login
```

브라우저가 자동으로 열리고 인증 완료 후 터미널로 돌아옵니다.

### 3.3 프로젝트 디렉토리 이동

```bash
cd C:\Users\hee\website\api
```

---

## 4. Worker 배포

### 4.1 로컬 테스트 (선택사항)

배포 전 로컬에서 먼저 테스트:

```bash
wrangler dev
```

로컬 서버가 `http://localhost:8787`에서 실행됩니다.

테스트 요청 보내기 (PowerShell):

```powershell
$body = @{
    email = "test@example.com"
    name = "테스트 부모"
    baby_age = "6"
    request_type = "PDF_CHECKLIST"
    requested_month = "6"
}

Invoke-WebRequest -Uri "http://localhost:8787" -Method POST -Body $body
```

### 4.2 프로덕션 배포

```bash
wrangler deploy
```

배포 성공 시 다음과 같은 메시지가 표시됩니다:

```
Published bebeguide-api (0.1s)
  https://bebeguide-api.YOUR-SUBDOMAIN.workers.dev
```

🎉 **배포 완료!** Worker URL을 복사해두세요.

---

## 5. 환경 변수 설정

### 5.1 Dashboard에서 환경 변수 설정

1. https://dash.cloudflare.com 접속
2. **Workers & Pages** > **bebeguide-api** 클릭
3. **Settings** 탭 클릭
4. **Variables** 섹션에서 **Add variable** 클릭

### 5.2 필수 변수 설정

| 변수 이름 | 값 예시 | 설명 |
|----------|---------|------|
| `SENDER_EMAIL` | `noreply@bebe-guide.com` | 발신자 이메일 주소 |
| `SENDER_NAME` | `베베가이드` | 발신자 이름 |

### 5.3 선택 변수 설정

| 변수 이름 | 값 예시 | 설명 |
|----------|---------|------|
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` | Slack 알림 webhook |

**⚠️ 주의:** 환경 변수 설정 후 **Save** 버튼을 꼭 클릭하세요!

### 5.4 변수 확인

터미널에서 확인:

```bash
wrangler secret list
```

---

## 6. 프론트엔드 연결

### 6.1 index.html 수정

`C:\Users\hee\website\index.html` 파일의 555번 줄 수정:

**변경 전:**
```html
<form id="contactForm" action="https://formspree.io/f/xzzjgpdw" method="POST">
```

**변경 후:**
```html
<form id="contactForm" action="https://bebeguide-api.YOUR-SUBDOMAIN.workers.dev" method="POST">
```

**⚠️ 중요:** `YOUR-SUBDOMAIN` 부분을 실제 배포된 Worker URL로 변경하세요!

### 6.2 script.js 확인

`C:\Users\hee\website\js\script.js` 1368번 줄 확인:

```javascript
const API_ENDPOINT = contactForm.action || 'https://formspree.io/f/xzzjgpdw';
```

이 코드는 `contactForm.action`에서 자동으로 Worker URL을 가져옵니다.
index.html만 수정하면 자동으로 연결됩니다.

---

## 7. 테스트 및 확인

### 7.1 웹사이트에서 폼 제출 테스트

1. `C:\Users\hee\website\index.html`을 브라우저로 열기
2. "문의/구독" 섹션으로 스크롤
3. 폼 작성 후 제출
4. "요청이 접수되었습니다..." 알림 확인

### 7.2 이메일 수신 확인

- 입력한 이메일 주소로 자동 회신 메일 확인
- 제목: `[베베가이드] N개월 아기 자료 요청 확인`
- 본문에 법적 안전 문구 포함 확인

### 7.3 Slack 알림 확인 (선택사항)

- Slack webhook 설정 시 새 요청 알림 확인

### 7.4 Worker 로그 확인

Cloudflare Dashboard:

1. **Workers & Pages** > **bebeguide-api**
2. **Logs** 탭에서 실시간 로그 확인

터미널:

```bash
wrangler tail
```

---

## 8. 문제 해결

### 8.1 CORS 에러

**증상:**
```
Access to fetch at '...' from origin '...' has been blocked by CORS policy
```

**해결:**
Worker 코드에 CORS 헤더가 포함되어 있는지 확인. 이미 포함되어 있으므로 문제가 없어야 합니다.

### 8.2 이메일 발송 실패

**원인:**
- MailChannels에서 발신자 도메인 검증 실패
- `SENDER_EMAIL` 변수 미설정

**해결:**
1. Dashboard > Variables에서 `SENDER_EMAIL` 확인
2. 유효한 이메일 주소 사용 (예: Gmail, 자체 도메인)

**MailChannels 도메인 검증:**

MailChannels는 검증된 도메인에서만 이메일 발송을 허용합니다.
자체 도메인이 있다면 SPF/DKIM 레코드 설정 필요.

**대체 솔루션:**
- **Resend.com** (월 3,000통 무료)
- **SendGrid** (월 100통 무료)
- **AWS SES**

### 8.3 Worker 배포 실패

**증상:**
```bash
wrangler deploy
# Error: Authentication error
```

**해결:**
```bash
wrangler logout
wrangler login
```

### 8.4 환경 변수가 적용되지 않음

**해결:**
1. Dashboard에서 변수 저장 확인
2. Worker 재배포:
   ```bash
   wrangler deploy
   ```

---

## 🎯 다음 단계

### 추가 기능 구현

1. **PDF 자동 생성 및 첨부**
   - `jsPDF` 라이브러리 사용
   - 월령별 체크리스트 PDF 생성
   - 이메일에 첨부

2. **예방접종 리마인더**
   - Cloudflare Durable Objects 또는 D1 Database 사용
   - 구독자 정보 저장
   - Cron Triggers로 정기 알림 발송

3. **Analytics 추가**
   - 요청 건수 추적
   - 월령별 인기 통계
   - Cloudflare Analytics 연동

### 보안 강화

1. **Rate Limiting**
   - 동일 IP에서 과도한 요청 차단
   - Cloudflare Rate Limiting Rules 활용

2. **Captcha 추가**
   - Cloudflare Turnstile (무료)
   - 스팸 방지

3. **이메일 검증**
   - 실제 존재하는 이메일인지 검증
   - 일회용 이메일 차단

---

## 📞 지원

문제가 계속되면:

- **Cloudflare Docs:** https://developers.cloudflare.com/workers/
- **MailChannels Docs:** https://mailchannels.zendesk.com/hc/en-us
- **베베가이드 문의:** info@bebe-guide.com

---

## 📝 체크리스트

배포 완료 전 확인:

- [ ] Cloudflare 계정 생성 완료
- [ ] Wrangler CLI 설치 및 로그인
- [ ] Worker 배포 성공
- [ ] 환경 변수 설정 (`SENDER_EMAIL`, `SENDER_NAME`)
- [ ] index.html의 form action 수정
- [ ] 웹사이트에서 폼 제출 테스트
- [ ] 자동 회신 이메일 수신 확인
- [ ] Worker 로그 확인

모든 항목 체크 시 **배포 완료**! 🎉

---

**작성일:** 2024-01-XX
**버전:** 1.0.0
**작성자:** Claude AI + 베베가이드 팀
