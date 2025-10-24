# 베베가이드 배포 가이드 📝

## ⚠️ 보안 중요 사항

**즉시 수행하세요!**
1. OpenAI 대시보드(https://platform.openai.com/api-keys)에 접속
2. 현재 사용 중인 API 키 **즉시 삭제**
3. 새로운 API 키 발급
4. 새 API 키를 Cloudflare Worker 환경 변수에만 저장 (코드에 직접 넣지 말 것!)

---

## 📋 배포 순서

### 1단계: Cloudflare Worker 배포 (GPT 챗봇)

#### 1.1 Cloudflare 계정 생성
1. https://dash.cloudflare.com/ 접속
2. 무료 계정 가입 (이메일 인증)

#### 1.2 Worker 생성
1. 좌측 메뉴에서 **Workers & Pages** 클릭
2. **Create application** 버튼 클릭
3. **Create Worker** 선택
4. Worker 이름 입력 (예: `bebeguide-chatbot`)
5. **Deploy** 클릭

#### 1.3 Worker 코드 업로드
1. 배포된 Worker 클릭
2. 우측 상단 **Quick edit** 버튼 클릭
3. 기존 코드 전체 삭제
4. `C:\Users\hee\website\cloudflare-worker.js` 파일 내용 전체 복사
5. 붙여넣기
6. **Save and deploy** 클릭

#### 1.4 환경 변수 설정 (중요!)
1. Worker 대시보드에서 **Settings** 탭 클릭
2. **Variables** 섹션에서 **Add variable** 클릭
3. 변수 추가:
   - Variable name: `OPENAI_API_KEY`
   - Value: `새로 발급받은 API 키`
   - Type: **Secret** (암호화됨) ✅
4. **Save and deploy** 클릭

⚠️ **중요**: Worker 코드에서 `const OPENAI_API_KEY = 'sk-proj-...'` 라인을 삭제하고, 대신 이렇게 수정:
```javascript
// 환경 변수에서 가져오기
const OPENAI_API_KEY = env.OPENAI_API_KEY;
```

그리고 `addEventListener` 부분을 다음과 같이 수정:
```javascript
export default {
  async fetch(request, env, ctx) {
    return handleRequest(request, env);
  }
};

async function handleRequest(request, env) {
  const OPENAI_API_KEY = env.OPENAI_API_KEY;
  // ... 나머지 코드
}
```

#### 1.5 Worker URL 확인
1. Worker 대시보드 상단에서 URL 확인
   - 형식: `https://bebeguide-chatbot.YOUR-SUBDOMAIN.workers.dev`
2. 이 URL을 복사하세요!

---

### 2단계: 웹사이트 코드 업데이트

#### 2.1 Worker URL 연결
`C:\Users\hee\website\js\script.js` 파일 열기:
- 1044번째 줄 찾기:
  ```javascript
  const WORKER_URL = 'https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev';
  ```
- Worker URL로 교체:
  ```javascript
  const WORKER_URL = 'https://bebeguide-chatbot.YOUR-SUBDOMAIN.workers.dev';
  ```

#### 2.2 변경사항 저장

---

### 3단계: 웹사이트 호스팅 (Cloudflare Pages)

#### 3.1 GitHub 저장소 생성 (선택사항)
1. https://github.com 접속
2. **New repository** 클릭
3. Repository 이름: `bebeguide-website`
4. **Create repository** 클릭

#### 3.2 코드 업로드 (방법 1: GitHub)
```bash
cd C:\Users\hee\website
git init
git add .
git commit -m "Initial commit: 베베가이드 웹사이트"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/bebeguide-website.git
git push -u origin main
```

#### 3.3 Cloudflare Pages 배포
1. Cloudflare 대시보드 → **Workers & Pages** → **Create application**
2. **Pages** 탭 선택 → **Connect to Git** 클릭
3. GitHub 연동 후 `bebeguide-website` 저장소 선택
4. 빌드 설정:
   - **Build command**: 비워두기 (정적 사이트)
   - **Build output directory**: `/` (루트)
5. **Save and Deploy** 클릭

#### 3.4 커스텀 도메인 설정 (선택사항)
1. Pages 프로젝트 → **Custom domains** 탭
2. **Set up a domain** 클릭
3. 도메인 입력 (예: `bebeguide.com`)
4. DNS 설정 지침 따라 진행

---

### 4단계: Formspree 이메일 폼 테스트

#### 4.1 Formspree 설정 확인
1. https://formspree.io 로그인
2. Form ID `xzzjgpdw` 확인
3. 이메일 수신 주소 설정 확인

#### 4.2 테스트
1. 웹사이트 접속
2. 하단 "문의/구독" 섹션에서 폼 작성
3. 제출 후 이메일 수신 확인

---

## ✅ 최종 체크리스트

- [ ] OpenAI API 키 새로 발급 및 환경 변수 설정
- [ ] Cloudflare Worker 배포 완료
- [ ] Worker URL을 `script.js`에 업데이트
- [ ] Cloudflare Pages로 웹사이트 배포
- [ ] 챗봇 테스트 (GPT 응답 확인)
- [ ] Formspree 이메일 폼 테스트
- [ ] 예방접종 스케줄 표시 확인
- [ ] 월령별 체크리스트 확인
- [ ] 모바일 반응형 확인

---

## 🔧 트러블슈팅

### 챗봇이 응답하지 않는 경우
1. 브라우저 콘솔(F12) 확인
2. Worker URL이 올바른지 확인
3. Cloudflare Worker 로그 확인:
   - Worker 대시보드 → **Logs** 탭
4. OpenAI API 키 유효성 확인

### CORS 에러 발생 시
- Worker 코드의 `corsHeaders` 설정 확인
- `Access-Control-Allow-Origin: *` 포함되어 있는지 확인

### API 비용 관리
1. OpenAI 대시보드 → **Usage** 확인
2. 월 사용량 제한 설정 (Settings → Limits)
3. GPT-4o-mini 모델 사용 (저렴함)

---

## 💰 예상 비용

### Cloudflare
- **Workers**: 무료 (일 10만 요청까지)
- **Pages**: 무료 (월 500 빌드, 무제한 대역폭)

### OpenAI API (GPT-4o-mini)
- **입력**: $0.150 / 1M 토큰
- **출력**: $0.600 / 1M 토큰
- **예상**: 월 100명 사용자 × 10회 대화 ≈ $3-5

### Formspree
- **무료 플랜**: 월 50개 제출
- **유료**: $10/월 (무제한)

---

## 📞 지원

문제 발생 시:
1. Cloudflare 문서: https://developers.cloudflare.com/workers/
2. OpenAI 문서: https://platform.openai.com/docs/
3. Formspree 문서: https://help.formspree.io/

---

**배포 완료 후 이 파일은 삭제하거나 `.gitignore`에 추가하세요!**
