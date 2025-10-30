# 🚀 베베가이드 배포 가이드 (빠른 시작)

> **목표**: 로컬 파일만 있는 상태 → Cloudflare 기반 실제 서비스 완성

---

## 📋 사전 준비

- [x] Cloudflare 계정 생성 완료
- [x] wrangler CLI 설치 (`npm install -g wrangler`)
- [x] wrangler login 완료
- [ ] 도메인 준비 (MailChannels 사용 시 필요)

---

## 🎯 배포 단계 (10단계)

### 1️⃣ 프로젝트 폴더로 이동

```powershell
cd C:\Users\hee\website\api
dir
```

**성공 기준**: `wrangler.toml`, `bebeguide-worker.js` 파일이 보임

---

### 2️⃣ KV 네임스페이스 생성

```powershell
wrangler kv:namespace create "REMINDER_USERS"
```

**출력 예시**:
```
✨ Created namespace with id: abcd1234efgh5678
✨ Add the following to your wrangler.toml:
kv_namespaces = [
  { binding = "REMINDER_USERS", id = "abcd1234efgh5678" }
]
```

> ⚠️ **중요**: 출력된 `id`와 `preview_id`를 복사해두세요!

---

### 3️⃣ wrangler.toml 수정

`C:\Users\hee\website\api\wrangler.toml` 파일을 열고:

**수정 전**:
```toml
kv_namespaces = [
  { binding = "REMINDER_USERS", id = "YOUR_PRODUCTION_NAMESPACE_ID", preview_id = "YOUR_PREVIEW_NAMESPACE_ID" }
]
```

**수정 후** (2단계에서 받은 ID 입력):
```toml
kv_namespaces = [
  { binding = "REMINDER_USERS", id = "abcd1234efgh5678", preview_id = "wxyz9876..." }
]
```

---

### 4️⃣ Worker 배포

```powershell
wrangler deploy
```

**성공 시 출력**:
```
✨ Uploaded bebeguide-api
✨ Published bebeguide-api
   https://bebeguide-api.계정명.workers.dev
```

> 📋 **중요**: 이 URL을 복사해두세요! (index.html에서 사용)

**성공 기준**:
- Cloudflare 대시보드 → Workers & Pages에 `bebeguide-api` 나타남
- 에러 없이 URL 출력됨

---

### 5️⃣ Cloudflare 대시보드 환경 변수 설정

**경로**: Cloudflare 대시보드 → Workers & Pages → `bebeguide-api` → Settings → Variables

**추가할 변수**:

| 변수명 | 값 예시 | 설명 |
|--------|---------|------|
| `SENDER_EMAIL` | `noreply@bebe-guide.com` | 발신자 이메일 (필수) |
| `SENDER_NAME` | `베베가이드` | 발신자 이름 (선택) |
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/...` | Slack 알림 (선택) |
| `INFO_DATE` | `2025-10-28` | 정보 기준일 (선택) |

**KV 바인딩 추가**:
- Settings → KV Namespace Bindings
- Variable name: `REMINDER_USERS`
- KV namespace: (3단계에서 생성한 것 선택)

---

### 6️⃣ index.html Worker URL 연결

`C:\Users\hee\website\index.html` 파일 580번째 줄:

**수정 전**:
```html
<form id="contactForm" action="https://bebeguide-api.YOUR-SUBDOMAIN.workers.dev" method="POST">
```

**수정 후** (4단계에서 받은 URL 입력):
```html
<form id="contactForm" action="https://bebeguide-api.계정명.workers.dev" method="POST">
```

---

### 7️⃣ 메일 신뢰성 설정 (SPF)

> ⚠️ 이 단계는 실제 도메인이 있을 때만 가능합니다.

**Cloudflare DNS 설정**:

1. Cloudflare 대시보드 → DNS → Records
2. 다음 TXT 레코드 추가:

| Type | Name | Content |
|------|------|---------|
| TXT | `@` | `v=spf1 include:_spf.mailchannels.net ~all` |

**효과**: Gmail, 네이버 등에서 스팸으로 분류되지 않음

---

### 8️⃣ 로컬 테스트

1. `C:\Users\hee\website\index.html`을 브라우저로 열기
2. 월령 선택 → "PDF 받기(이메일)" 클릭
3. 이메일 입력 → "보내주세요" 클릭

**성공 기준**:
- ✅ "요청이 접수되었습니다" 메시지 표시
- ✅ 이메일로 PDF 첨부된 자동 회신 도착
- ✅ 메일 본문에 5가지 법적 문구 포함:
  1. 응급 안내 (119, 응급실)
  2. 의료 면책
  3. 제휴 고지 (쿠팡 파트너스)
  4. 정보 기준일
  5. 구독 중단 안내

---

### 9️⃣ GitHub 업로드

```powershell
cd C:\Users\hee\website

# Git 초기화 (처음이라면)
git init
git add .
git commit -m "베베가이드 초기 배포 완료"

# GitHub 연결
git remote add origin https://github.com/본인계정명/bebeguide.git
git branch -M main
git push -u origin main
```

> ✅ `.gitignore`에 이미 민감한 파일들이 제외되어 있습니다.

---

### 🔟 프론트엔드 배포 (Cloudflare Pages)

**옵션 A: GitHub 연동 자동 배포** (권장)

1. Cloudflare 대시보드 → Workers & Pages → Create Application
2. "Connect to Git" 선택
3. GitHub 저장소 선택
4. 빌드 설정:
   - Framework preset: `None`
   - Build output directory: `/` (루트)
5. Deploy 클릭

**결과**: `https://bebeguide.pages.dev` 같은 URL 생성

**옵션 B: 직접 업로드**

```powershell
cd C:\Users\hee\website
npx wrangler pages deploy . --project-name bebeguide
```

---

## ✅ 최종 점검 체크리스트

배포가 완료되면 다음을 확인하세요:

### 기능 테스트
- [ ] 월령 선택 후 체크리스트 표시
- [ ] PDF 이메일 발송 정상 작동
- [ ] PDF 첨부 파일 열림
- [ ] 이메일 스팸함이 아닌 받은편지함 도착

### 법적 문구 확인
- [ ] **응급 안내**: "즉시 119 또는 응급실" (웹/이메일/PDF)
- [ ] **의료 면책**: "일반 정보이며 의료진 진단 대체 불가" (웹/이메일/PDF)
- [ ] **제휴 고지**: "쿠팡 파트너스 수수료" (웹/이메일/PDF)
- [ ] **정보 기준일**: "2025-10-28 업데이트" (웹/이메일/PDF)
- [ ] **구독 중단**: "원치 않으면 중단 요청 가능" (이메일)

### 성능 확인
- [ ] 페이지 로딩 속도 3초 이내
- [ ] 모바일 반응형 정상 작동
- [ ] Cloudflare Analytics 데이터 수집

---

## 🐛 문제 해결

### "KV binding not found" 에러
→ 5단계 KV 바인딩 확인

### 이메일이 안 옴
→ 5단계 `SENDER_EMAIL` 환경 변수 확인
→ 7단계 SPF 레코드 확인

### Worker URL 404 에러
→ 4단계 배포 성공 여부 확인
→ 6단계 URL 정확히 입력했는지 확인

### PDF가 비어있음
→ `js/script.js`의 `generateChecklistPDF()` 함수 로그 확인
→ 브라우저 콘솔에서 에러 메시지 확인

---

## 📚 추가 자료

- [Cloudflare Workers 문서](https://developers.cloudflare.com/workers/)
- [MailChannels 설정 가이드](https://support.mailchannels.com/)
- [jsPDF 공식 문서](https://github.com/parallax/jsPDF)

---

## 🎉 완료!

축하합니다! 이제 베베가이드가 실제 서비스로 작동합니다.

**다음 단계**:
- Google Analytics 설정 (index.html 29, 35번 줄)
- 쿠팡 파트너스 링크 추가 (선택)
- 예방접종 리마인더 크론 작업 설정 (고급)

---

**문서 작성일**: 2025-01-29
**최종 수정**: Claude Code SuperClaude Framework
