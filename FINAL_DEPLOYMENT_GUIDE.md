# 🚀 베베가이드 최종 배포 가이드

**상태:** 코드 100% 완료 → 배포 실행 단계
**작성일:** 2024-01-XX

---

## ✅ 완료된 작업

### 1. 코드 업그레이드 완료
- ✅ **index.html** contactForm 최종 구조 적용
  - parent_name (선택), email (필수), baby_age (필수), message (선택)
  - contactStatus 피드백 영역 추가
  - 의료 면책 문구 폼 내 추가

- ✅ **script.js** Worker 연동 최종 버전
  - async/await 패턴으로 전환
  - contactStatus + showNotification 병행
  - PDF 버튼 핸들러 통합

- ✅ **bebeguide-worker.js** 자동 회신 시스템
  - FormData 처리, 이메일 검증
  - MailChannels 자동 회신
  - Slack 알림 (선택)
  - 법적 안전 문구 포함

- ✅ **privacy.html** 개인정보처리방침
  - 수집 항목, 목적, 보유 기간 명시
  - 제3자 제공 없음 명시
  - 처리 위탁 투명 공개

- ✅ **법적 안전성 확보**
  - 광고 고지 (표시광고법 준수)
  - 의료 면책 (의료법 준수)
  - 개인정보 동의 (개인정보보호법 준수)

---

## 🎯 지금 바로 할 4단계 배포

### 1️⃣ Cloudflare Worker 배포

#### Step 1: Wrangler 설치 및 로그인
```bash
# Wrangler CLI 설치 (전역)
npm install -g wrangler

# Cloudflare 계정 로그인
wrangler login
```

#### Step 2: Worker 배포
```bash
# 프로젝트 api 폴더로 이동
cd C:\Users\hee\website\api

# Worker 배포 실행
wrangler deploy
```

#### Step 3: Worker URL 확인
배포 성공 시 출력되는 URL을 복사하세요:
```
✅ Published bebeguide-api (0.1s)
   https://bebeguide-api.YOUR-SUBDOMAIN.workers.dev
```

**📋 Worker URL 메모:**
```
_______________________________________________
(배포 후 여기에 실제 URL 기록)
```

---

### 2️⃣ Cloudflare Dashboard 환경 변수 설정

#### 접속 경로
1. https://dash.cloudflare.com 로그인
2. **Workers & Pages** 클릭
3. **bebeguide-api** 선택
4. **Settings** 탭 → **Variables** 섹션

#### 설정할 변수

| 변수 이름 | 값 예시 | 필수 여부 |
|----------|--------|----------|
| `SENDER_EMAIL` | `noreply@bebe-guide.com` | ✅ 필수 |
| `SENDER_NAME` | `베베가이드` | ✅ 필수 |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | ⭕ 선택 |

**⚠️ 중요:** 변수 입력 후 반드시 **Save** 버튼 클릭!

---

### 3️⃣ index.html Form Action 교체

#### 파일 위치
`C:\Users\hee\website\index.html`

#### 변경할 라인
**Line 560**

#### 변경 전
```html
<form id="contactForm" action="https://formspree.io/f/xzzjgpdw" method="POST">
```

#### 변경 후
```html
<form id="contactForm" action="https://bebeguide-api.YOUR-SUBDOMAIN.workers.dev" method="POST">
```

**⚠️ YOUR-SUBDOMAIN 부분을 1️⃣에서 받은 실제 Worker URL로 교체!**

#### 변경 방법
```bash
# 텍스트 에디터로 index.html 열기
notepad C:\Users\hee\website\index.html

# Line 560 찾기: Ctrl+G → 560 입력
# action URL을 Worker URL로 변경
# 저장: Ctrl+S
```

---

### 4️⃣ 실제 테스트

#### Step 1: 웹사이트 열기
```bash
# index.html 브라우저에서 열기
start C:\Users\hee\website\index.html
```

#### Step 2: 폼 제출 테스트
1. 페이지 하단 **"문의/구독"** 섹션으로 스크롤
2. 폼 입력:
   - 부모님 성함 (선택)
   - **이메일 주소** (필수) - 본인 이메일 입력
   - **아기 월령** (필수) - 아무 값 선택
   - 추가 문의사항 (선택)
   - ✅ **개인정보 동의 체크박스** 체크
3. **"보내주세요"** 버튼 클릭

#### Step 3: 확인 사항

**✅ 즉시 확인:**
- [ ] 브라우저에 **"✅ 요청이 접수되었습니다..."** 메시지 표시
- [ ] 폼이 자동으로 초기화됨
- [ ] 버튼이 정상 복구됨

**📧 이메일 확인 (1-2분 내):**
- [ ] 입력한 이메일로 자동 회신 메일 도착
- [ ] 제목: `[베베가이드] N개월 아기 자료 요청 확인`
- [ ] 본문에 의료 면책 문구 포함
- [ ] 본문에 광고 고지 포함

**📱 Slack 확인 (Webhook 설정 시):**
- [ ] Slack 채널에 "새 요청 들어왔어요" 알림 도착

#### Step 4: Worker 로그 확인 (선택)
```bash
# Worker 실시간 로그 모니터링
cd C:\Users\hee\website\api
wrangler tail
```

---

## 🎉 배포 완료 후 결과

### 사용자 경험
1. 부모가 월령별 체크리스트 섹션에서 **"PDF 받기"** 버튼 클릭
2. 자동으로 contactForm으로 스크롤 + 월령 자동 선택
3. 이메일만 입력하고 제출
4. 즉시 자동 회신 메일 수신 (24시간 무인 운영)

### 운영자 경험
1. Slack으로 새 요청 실시간 알림 (설정 시)
2. 이메일, 월령, 요청 유형 정보 수신
3. 필요시 개별 follow-up 가능

### 법적 안전성
- ✅ 광고 고지 (표시광고법 준수)
- ✅ 의료 면책 (의료법 준수)
- ✅ 개인정보 동의 (개인정보보호법 준수)
- ✅ 응급 안내 다층 노출 (챗봇, 폼, 이메일)

---

## 🔧 문제 해결

### 1. Worker 배포 실패
**증상:** `Error: Authentication error`

**해결:**
```bash
wrangler logout
wrangler login
wrangler deploy
```

### 2. 이메일 발송 안 됨
**원인:** 환경 변수 미설정 또는 잘못된 이메일 주소

**해결:**
1. Dashboard > Variables 확인
2. SENDER_EMAIL이 유효한 이메일인지 확인
3. Worker 로그 확인: `wrangler tail`

### 3. CORS 에러
**원인:** Worker와 프론트엔드 도메인 불일치

**해결:**
- bebeguide-worker.js에 이미 CORS 헤더 포함되어 있음
- 정상 작동해야 함
- 문제 지속 시 Worker 재배포: `wrangler deploy`

### 4. 폼 제출 후 아무 반응 없음
**원인:** index.html의 form action이 Worker URL로 변경되지 않음

**해결:**
- index.html line 560 확인
- form action이 Worker URL인지 확인
- 브라우저 캐시 클리어: Ctrl+Shift+Delete

---

## 📊 배포 체크리스트

### 배포 전
- [x] bebeguide-worker.js 작성 완료
- [x] wrangler.toml 설정 완료
- [x] privacy.html 작성 완료
- [x] index.html contactForm 최종 구조 적용
- [x] script.js Worker 연동 완료

### 배포 중
- [ ] wrangler CLI 설치
- [ ] Cloudflare 로그인
- [ ] Worker 배포 실행
- [ ] Worker URL 확인 및 기록
- [ ] 환경 변수 설정 (SENDER_EMAIL, SENDER_NAME)
- [ ] index.html form action 변경

### 배포 후
- [ ] 폼 제출 테스트 (본인 이메일)
- [ ] 자동 회신 메일 수신 확인
- [ ] Slack 알림 확인 (설정 시)
- [ ] 챗봇 응급 키워드 테스트
- [ ] 모바일 반응형 확인

---

## 🔮 다음 단계 (Phase 2)

### 선택 기능 A: 월령별 PDF 자동 생성
- jsPDF 라이브러리 사용
- 0-12개월 PDF 템플릿 생성 (`/pdf/checklist-0m.pdf` ~ `/pdf/checklist-12m.pdf`)
- 이메일에 PDF 다운로드 링크 포함
- PDF에도 의료 면책, 광고 고지 포함

### 선택 기능 B: 예방접종 리마인더
- contactForm에 "예방접종 알림 받기" 체크박스 추가
- Cloudflare D1 Database로 구독자 저장
- Cron Triggers로 정기 알림 발송
- 구독 해지 링크 포함

### 선택 기능 C: Slack 알림 포맷 개선
- 요청 시각 (KST)
- baby_age, request_type, email, message
- 한 메시지로 깔끔하게 포맷팅

---

## 📞 지원

### 문서
- [api/DEPLOY_GUIDE.md](./api/DEPLOY_GUIDE.md) - 상세 배포 가이드
- [api/README.md](./api/README.md) - API 문서
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - 배포 체크리스트

### Cloudflare 문서
- https://developers.cloudflare.com/workers/
- https://developers.cloudflare.com/workers/wrangler/

### 이메일
- info@bebe-guide.com

---

**🎊 모든 코드가 완성되었습니다!**
**이제 위의 4단계만 실행하면 베베가이드가 실전 서비스로 전환됩니다.**

**작성일:** 2024-01-XX
**버전:** 1.0.0
