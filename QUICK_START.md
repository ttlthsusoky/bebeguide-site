# 🚀 베베가이드 챗봇 - 빠른 시작 가이드

## ✅ 이미 완료된 작업

1. ✅ Cloudflare Worker 배포 완료!
   - URL: **https://bebeguide-chatbot.ttlthsusoky.workers.dev**

2. ✅ 웹사이트 코드 준비 완료!
   - 챗봇 UI, OpenAI 연동, 참고사이트 정보 포함

---

## 🔑 지금 해야 할 일 (단 1가지!)

### OpenAI API 키 설정

#### 1단계: OpenAI API 키 발급 (5분)

1. **OpenAI 가입**
   - 링크: https://platform.openai.com/signup
   - 이메일 인증 필요

2. **API 키 생성**
   - 로그인 후: https://platform.openai.com/api-keys
   - `Create new secret key` 버튼 클릭
   - 이름: "bebeguide-chatbot" (선택사항)
   - 키 복사: `sk-proj-xxxxx...` (⚠️ 한 번만 표시됨!)

3. **결제 정보 등록** (필수!)
   - https://platform.openai.com/account/billing/overview
   - `Add payment method` 클릭
   - 신용카드 등록
   - 최소 $5 충전 권장
   - **예상 비용**: 대화 1,000건당 약 $1 (1,300원)

#### 2단계: API 키 설정 (1분)

**방법 A: PowerShell에서 직접 설정 (추천)**

```powershell
# 1. PowerShell 열기 (관리자 권한 불필요)

# 2. 프로젝트 폴더로 이동
cd C:\Users\hee\website

# 3. API 키 설정 (아래 명령어 실행)
wrangler secret put OPENAI_API_KEY --config wrangler-chatbot.toml

# 4. 프롬프트가 나오면 API 키 입력:
# Enter a secret value: sk-proj-xxxxx...
# (입력하면 화면에 표시 안 됨 - 정상입니다!)
```

**방법 B: Cloudflare Dashboard에서 설정**

1. https://dash.cloudflare.com 접속
2. 왼쪽: `Workers & Pages`
3. `bebeguide-chatbot` 클릭
4. 상단 탭: `Settings` → `Variables`
5. `Add variable` 클릭:
   - Variable name: `OPENAI_API_KEY`
   - Value: `sk-proj-xxxxx...` (복사한 키)
   - ✅ `Encrypt` 체크 (중요!)
6. `Save and deploy` 클릭

---

## 🧪 테스트 방법

### 방법 1: 로컬 테스트 (간단!)

```powershell
# 1. 프로젝트 폴더에서
cd C:\Users\hee\website

# 2. 로컬 서버 실행 (방법 선택)
# Python이 있다면:
python -m http.server 8000

# 또는 Node.js가 있다면:
npx serve

# 3. 브라우저에서 접속
# http://localhost:8000
```

### 방법 2: 직접 테스트

1. **챗봇 열기**
   - 웹사이트 오른쪽 하단 "상담하기" 버튼 클릭

2. **기본 질문 테스트**
   - "0개월 체크리스트"
   - "예방접종 일정"
   - "분유 얼마나 줘요?"

3. **응급 상황 테스트**
   - "아기가 고열이에요"
   - "호흡이 힘들어 보여요"
   → 즉시 119/병원 안내 확인

4. **참고사이트 확인**
   - 답변에 "KDCA 기준", "WHO 권장" 등 출처 포함 확인

---

## ⚡ 명령어 요약

```powershell
# API 키 설정
cd C:\Users\hee\website
wrangler secret put OPENAI_API_KEY --config wrangler-chatbot.toml

# 로컬 서버 실행
python -m http.server 8000
# 또는
npx serve

# Worker 재배포 (필요시)
wrangler deploy --config wrangler-chatbot.toml

# Worker 로그 확인
wrangler tail --config wrangler-chatbot.toml
```

---

## 🔍 문제 해결

### "OpenAI API 키가 설정되지 않았습니다" 오류

→ 2단계(API 키 설정) 다시 확인

### "챗봇 응답 생성 중 오류" 메시지

→ OpenAI 결제 정보 등록 확인
→ API 키 유효성 확인 (https://platform.openai.com/api-keys)

### 챗봇이 안 보임

→ 브라우저 캐시 삭제 (Ctrl+Shift+R)
→ script.js, styles.css 로딩 확인 (F12 → Console)

---

## 💰 비용 안내

### OpenAI API (GPT-4o-mini)
- 대화 1회: 약 $0.001 (1원)
- 대화 100회: 약 $0.10 (130원)
- 대화 1,000회/월: 약 $1 (1,300원)

### Cloudflare Workers
- 하루 10만 요청까지 무료
- 초과 시: 100만 요청당 $0.50

**총 예상**: 월 1,000명 사용 시 **$2-3 (2,600-3,900원)**

---

## 📋 체크리스트

- [ ] OpenAI 계정 생성
- [ ] API 키 발급 (`sk-proj-xxxxx...`)
- [ ] 결제 정보 등록 (최소 $5 충전)
- [ ] API 키 설정 (wrangler 또는 Dashboard)
- [ ] 로컬 테스트 실행
- [ ] 챗봇 기능 테스트

---

## 🎉 완료 후

모든 설정이 끝나면:
1. 웹사이트를 GitHub Pages, Cloudflare Pages 등에 업로드
2. 실제 도메인에서 작동 확인
3. 사용자 피드백 수집

---

## 📞 도움말

- OpenAI 문서: https://platform.openai.com/docs
- Cloudflare Workers: https://developers.cloudflare.com/workers
- 이 프로젝트 문서: C:\Users\hee\website\CHATBOT_SETUP.md

**문제가 있으면 언제든 물어보세요!** 😊
