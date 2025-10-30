# 🚀 베베가이드 배포 전 최종 체크리스트

**배포 준비 상태:** 실행 준비 완료
**작성일:** 2024-01-XX

---

## ✅ 1단계: 법적 안전성 확보 (완료)

### 1.1 광고/제휴 마케팅 고지
- [x] **섹션 단위 고지** (index.html)
  - 위치: 월령별 체크리스트 섹션 하단
  - 내용: "📢 제휴 마케팅 고지: 본 페이지의 상품 링크를 통해 구매 시 일정 수수료를 제공받을 수 있습니다."

- [x] **개별 카드 고지** (script.js:869-874)
  - 각 체크리스트 아이템마다 affiliate-box 포함
  - [광고] 헤드라인 + "일정 수수료를 제공받을 수 있습니다" 명시
  - 쿠팡에서 보기 버튼과 함께 배치

- [x] **CSS 스타일링** (styles.css:2109-2182)
  - .affiliate-box, .affiliate-headline, .affiliate-desc 스타일 정의
  - 시각적으로 명확하게 구분

**✅ 법적 준수:** 한국 공정거래위원회 표시광고법 준수

---

### 1.2 의료/건강 책임 고지
- [x] **페이지 하단 고지** (index.html)
  - "베베가이드는 의학적 조언을 대체할 수 없습니다. 반드시 소아과 전문의와 상담하십시오."

- [x] **예방접종 섹션 안전 안내**
  - 접종 전 상태 확인, 접종 후 관찰 안내
  - 고열(38.5도 이상) 등 응급 증상 시 즉시 병원 방문 안내

- [x] **챗봇 웰컴 메시지** (script.js:1157-1159)
  - "⚠️ 중요 안내: 응급 증상(고열, 호흡 곤란 등)은 즉시 119 또는 소아과 진료를 받으세요."
  - "이 대화는 의료 진단이 아닙니다."

- [x] **챗봇 안전 가드** (script.js:1082-1102)
  - safetyGuardReply() 함수 구현
  - 15개 응급 키워드 감지 (열, 38, 39, 40, 발열, 고열, 호흡, 숨, 청색, 경련, 의식, 토혈, 혈변, 피, 탈수)
  - 응급 키워드 감지 시 자동 경고 메시지

**✅ 법적 안전:** 의료법 준수, 책임 회피 문구 포함

---

### 1.3 개인정보 보호
- [x] **개인정보처리방침** (privacy.html)
  - 수집 항목 명시: 이메일, 이름, 아기 월령
  - 수집 목적: 체크리스트 발송, 문의 응대, 서비스 개선
  - 보유 기간: 최대 1년, 구독 해지 시까지
  - 제3자 제공 없음 명시
  - 처리 위탁: Cloudflare, MailChannels

- [x] **개인정보 동의 체크박스** (index.html:597-599)
  - contactForm에 필수 동의 체크박스
  - privacy.html 링크 포함

- [x] **Footer 링크** (index.html:650)
  - 개인정보처리방침 링크
  - 의료 면책 조항 링크

**✅ 법적 준수:** 개인정보보호법 준수

---

## ✅ 2단계: 자동 회신 시스템 (완료)

### 2.1 Cloudflare Worker
- [x] **Worker 코드** (api/bebeguide-worker.js)
  - FormData POST 요청 수신
  - 이메일 유효성 검사
  - Slack 알림 전송 (선택)
  - MailChannels로 자동 회신 메일 발송
  - 법적 안전 문구 포함
  - CORS 설정

- [x] **배포 설정** (api/wrangler.toml)
  - 프로젝트명: bebeguide-api
  - 환경 변수 가이드 포함

- [x] **배포 가이드** (api/DEPLOY_GUIDE.md)
  - 8단계 상세 가이드
  - 준비 사항, 계정 설정, 배포 방법, 테스트 방법, 문제 해결

- [x] **API 문서** (api/README.md)
  - API 스펙, 작동 흐름, 성능 및 제한, 보안 고려사항

### 2.2 프론트엔드 연동
- [x] **script.js 수정** (script.js:1359-1422)
  - API_ENDPOINT 변수로 유연한 설정
  - JSON 응답 처리
  - 에러 핸들링
  - 폼 리셋 및 hidden 필드 초기화

**⚠️ 배포 후 작업 필요:**
- index.html:555 - contactForm action을 Worker URL로 변경

---

## 🔄 3단계: 배포 실행

### 3.1 Cloudflare Workers 배포

#### Step 1: Wrangler 설치 및 로그인
```bash
# Wrangler CLI 설치
npm install -g wrangler

# Cloudflare 로그인
wrangler login

# 프로젝트 디렉토리 이동
cd C:\Users\hee\website\api
```

#### Step 2: 로컬 테스트 (선택)
```bash
# 로컬 개발 서버 실행
wrangler dev

# 브라우저에서 http://localhost:8787 접속 확인
```

#### Step 3: 프로덕션 배포
```bash
# Worker 배포
wrangler deploy

# 배포 성공 시 출력:
# Published bebeguide-api (0.1s)
#   https://bebeguide-api.YOUR-SUBDOMAIN.workers.dev
```

**✅ Worker URL 복사:** ___________________________________

---

### 3.2 환경 변수 설정

Cloudflare Dashboard > Workers > bebeguide-api > Settings > Variables

#### 필수 변수
- [ ] `SENDER_EMAIL`: `noreply@bebe-guide.com` (또는 실제 도메인)
- [ ] `SENDER_NAME`: `베베가이드`

#### 선택 변수
- [ ] `SLACK_WEBHOOK_URL`: Slack Incoming Webhook URL (운영자 알림용)

**⚠️ 중요:** 환경 변수 설정 후 반드시 **Save** 클릭!

---

### 3.3 index.html 수정

**파일:** C:\Users\hee\website\index.html
**라인:** 555

**변경 전:**
```html
<form id="contactForm" action="https://formspree.io/f/xzzjgpdw" method="POST">
```

**변경 후:**
```html
<form id="contactForm" action="https://bebeguide-api.YOUR-SUBDOMAIN.workers.dev" method="POST">
```

**⚠️ YOUR-SUBDOMAIN 부분을 실제 Worker URL로 변경!**

---

### 3.4 테스트

#### 1. 웹사이트 열기
```
C:\Users\hee\website\index.html
```

#### 2. contactForm 제출
- "문의/구독" 섹션으로 스크롤
- 이름, 이메일, 월령 입력
- "무료 체크리스트 받기" 클릭

#### 3. 확인 사항
- [ ] "요청이 접수되었습니다..." 성공 알림 표시
- [ ] 입력한 이메일로 자동 회신 메일 수신
- [ ] 메일 제목: "[베베가이드] N개월 아기 자료 요청 확인"
- [ ] 메일 본문에 법적 안전 문구 포함
- [ ] (Slack 설정 시) Slack 알림 수신

#### 4. Worker 로그 확인
```bash
wrangler tail
```

---

## 📝 4단계: 웹사이트 호스팅 (선택)

### 4.1 Cloudflare Pages 배포 (권장)

#### 장점
- 무료 호스팅
- 자동 HTTPS
- Custom Domain 연결 가능
- CDN 자동 적용

#### 배포 방법
```bash
# Cloudflare Pages 배포
npx wrangler pages deploy C:\Users\hee\website --project-name bebeguide
```

### 4.2 대체 호스팅 옵션
- **Vercel:** vercel.com (무료, 자동 배포)
- **Netlify:** netlify.com (무료, 드래그앤드롭)
- **GitHub Pages:** github.io (무료, Git 연동)

---

## 🔍 5단계: 최종 점검

### 5.1 기능 테스트
- [ ] 월령별 체크리스트 표시
- [ ] 예방접종 스케줄 표시
- [ ] PDF 버튼 클릭 시 contactForm으로 스크롤 및 prefill
- [ ] contactForm 제출 및 자동 회신
- [ ] 챗봇 열기/닫기
- [ ] 챗봇 응급 키워드 감지
- [ ] 모바일 반응형 확인

### 5.2 법적 점검
- [ ] 모든 제휴 링크에 [광고] 라벨 표시
- [ ] 의료 면책 조항 명시
- [ ] 개인정보처리방침 링크 확인
- [ ] 쿠팡 파트너스 고지 명시

### 5.3 성능 점검
- [ ] 페이지 로딩 속도 (목표: <3초)
- [ ] 이미지 최적화 확인
- [ ] 모바일 성능 확인
- [ ] Worker 응답 시간 (목표: <200ms)

---

## 🎯 다음 단계 (Phase 2)

### 향후 개선 사항
- [ ] **PDF 자동 생성**
  - jsPDF 라이브러리 사용
  - 월령별 체크리스트 PDF 생성
  - 이메일에 PDF 첨부

- [ ] **예방접종 리마인더**
  - Cloudflare D1 Database로 구독자 저장
  - Cron Triggers로 정기 알림
  - 구독 해지 기능

- [ ] **Analytics 추가**
  - Cloudflare Analytics 연동
  - 요청 건수 추적
  - 월령별 인기 통계

- [ ] **보안 강화**
  - Rate Limiting (동일 IP 과도한 요청 차단)
  - Captcha (Cloudflare Turnstile)
  - 이메일 검증 (일회용 이메일 차단)

---

## 📞 문제 해결

### 자주 발생하는 문제

#### 1. Worker 배포 실패
**증상:** `Error: Authentication error`
**해결:**
```bash
wrangler logout
wrangler login
```

#### 2. 이메일 발송 실패
**원인:** MailChannels 도메인 검증 실패, 환경 변수 미설정
**해결:**
- Dashboard > Variables 확인
- 유효한 이메일 주소 사용
- Worker 로그 확인: `wrangler tail`

#### 3. CORS 에러
**원인:** 프론트엔드와 Worker 도메인 불일치
**해결:** Worker 코드에 CORS 헤더가 이미 포함되어 있으므로 정상 작동해야 함

---

## ✅ 최종 체크리스트 요약

### 코드 완료 사항
- [x] 광고 라벨 및 제휴 고지 (index.html, script.js, styles.css)
- [x] 의료 면책 조항 및 응급 안내 (index.html, script.js)
- [x] 개인정보처리방침 (privacy.html)
- [x] Cloudflare Worker API (api/bebeguide-worker.js)
- [x] Worker 배포 설정 (api/wrangler.toml)
- [x] 배포 가이드 (api/DEPLOY_GUIDE.md)
- [x] API 문서 (api/README.md)
- [x] 프론트엔드 API 연동 (script.js)

### 배포 전 작업 필요
- [ ] Cloudflare 계정 생성
- [ ] Wrangler CLI 설치 및 로그인
- [ ] Worker 배포 (`wrangler deploy`)
- [ ] 환경 변수 설정 (SENDER_EMAIL, SENDER_NAME)
- [ ] index.html의 form action 수정 (Worker URL로)
- [ ] 테스트 (폼 제출, 이메일 수신 확인)
- [ ] (선택) 웹사이트 호스팅 (Cloudflare Pages/Vercel/Netlify)

---

## 🎉 배포 완료 시

모든 체크리스트 완료 후:
1. ✅ 법적 안전성 확보 (광고 고지, 의료 면책, 개인정보 보호)
2. ✅ 자동 회신 시스템 작동
3. ✅ 24시간 자동 서비스 제공
4. ✅ 실제 서비스 운영 가능 상태

**🎊 베베가이드가 실전 서비스로 전환됩니다!**

---

**작성일:** 2024-01-XX
**버전:** 1.0.0
**문의:** info@bebe-guide.com
