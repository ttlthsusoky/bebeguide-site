# 📧 베베가이드 이메일 발신 설정 가이드

**목적**: 자동 회신 이메일이 스팸함으로 가지 않도록 발신 도메인의 신뢰도를 설정하는 가이드

---

## 📋 왜 필요한가?

Cloudflare Worker는 부모에게 자동 회신 이메일을 발송합니다. 하지만 **SPF/DKIM/DMARC 설정이 없으면** 메일이 스팸함에 갈 가능성이 높아집니다.

이 설정을 완료하면:
- ✅ Gmail/네이버/다음 등 주요 메일 서비스에서 신뢰 점수 상승
- ✅ 이메일 전달률(Deliverability) 향상
- ✅ 스팸함 배치 확률 감소
- ✅ 발신자 신원 검증 (이메일 위조 방지)

---

## 🔑 1단계: 발신 이메일 주소 확인

### 현재 설정 확인

`wrangler.toml` 또는 Cloudflare Worker 환경 변수에서:

```toml
[vars]
SENDER_EMAIL = "noreply@bebe-guide.com"
SENDER_NAME = "베베가이드"
```

**중요**: `SENDER_EMAIL`의 도메인 부분(`bebe-guide.com`)은 **반드시 본인이 소유/관리하는 도메인**이어야 합니다.

---

## 🌐 2단계: 메일 발송 서비스 확인

Cloudflare Worker에서 사용 중인 이메일 발송 서비스를 확인하세요:

### 옵션 A: MailChannels (무료, Cloudflare Worker 권장)
- API: `https://api.mailchannels.net/tx/v1/send`
- 현재 `bebeguide-worker.js`에서 사용 중
- **SPF 레코드**: `v=spf1 include:relay.mailchannels.net ~all`

### 옵션 B: Resend
- API: `https://api.resend.com/emails`
- **SPF 레코드**: Resend 대시보드에서 확인

### 옵션 C: AWS SES
- API: AWS SES 엔드포인트
- **SPF 레코드**: `v=spf1 include:amazonses.com ~all`

---

## 📝 3단계: Cloudflare DNS 설정

Cloudflare Dashboard → DNS → Records에서 다음 TXT 레코드를 추가하세요.

### A. SPF 레코드 추가

**목적**: 이메일 발송 서버를 명시하여 위조 메일 차단

| 타입 | 이름 | 내용 | TTL |
|------|------|------|-----|
| TXT | `@` | `v=spf1 include:relay.mailchannels.net ~all` | Auto |

**설명**:
- `v=spf1`: SPF 버전 1
- `include:relay.mailchannels.net`: MailChannels 서버에서 발송 허용
- `~all`: 다른 서버는 소프트 실패 (스팸 표시)

**다른 서비스 사용 시**:
- Resend: `v=spf1 include:_spf.resend.com ~all`
- AWS SES: `v=spf1 include:amazonses.com ~all`

---

### B. DKIM 레코드 추가

**목적**: 이메일 서명을 통한 발신자 인증

#### MailChannels 사용 시:

MailChannels는 자동 DKIM 서명을 지원하지만, 커스텀 도메인 DKIM을 원한다면:

1. DKIM 키 생성 (RSA 2048-bit):
   ```bash
   # Linux/Mac에서 생성 예시
   openssl genrsa -out private.key 2048
   openssl rsa -in private.key -pubout -out public.key
   ```

2. Public Key를 Cloudflare DNS에 추가:

| 타입 | 이름 | 내용 | TTL |
|------|------|------|-----|
| TXT | `mailchannels._domainkey` | `v=DKIM1; k=rsa; p=<YOUR_PUBLIC_KEY>` | Auto |

3. Worker 환경 변수에 Private Key 추가:
   ```bash
   wrangler secret put DKIM_PRIVATE_KEY
   ```

#### Resend/SES 사용 시:
- 각 서비스 대시보드에서 제공하는 DKIM 레코드를 그대로 복사하여 Cloudflare DNS에 추가하세요.

---

### C. DMARC 레코드 추가

**목적**: 이메일 인증 실패 시 처리 정책 및 리포팅

| 타입 | 이름 | 내용 | TTL |
|------|------|------|-----|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc-reports@bebe-guide.com` | Auto |

**설명**:
- `v=DMARC1`: DMARC 버전 1
- `p=none`: 정책 없음 (처음에는 모니터링만)
- `rua=mailto:...`: 리포트 수신 이메일 주소

**단계별 권장 정책**:
1. 초기: `p=none` (모니터링만, 차단 없음)
2. 중기: `p=quarantine` (인증 실패 시 스팸함으로)
3. 최종: `p=reject` (인증 실패 시 완전 차단)

---

## ✅ 4단계: 설정 확인

### DNS 레코드 확인 (최대 24시간 소요)

```bash
# SPF 확인
nslookup -type=TXT bebe-guide.com

# DKIM 확인
nslookup -type=TXT mailchannels._domainkey.bebe-guide.com

# DMARC 확인
nslookup -type=TXT _dmarc.bebe-guide.com
```

### 온라인 검증 도구

1. **MXToolbox**: https://mxtoolbox.com/SuperTool.aspx
   - SPF, DKIM, DMARC 한 번에 검증 가능

2. **Google Admin Toolbox**: https://toolbox.googleapps.com/apps/checkmx/
   - Gmail 수신 가능성 테스트

3. **Mail-Tester**: https://www.mail-tester.com/
   - 실제 이메일 발송하여 스팸 점수 확인

---

## 📧 5단계: Worker 이메일 헤더 설정

`bebeguide-worker.js`에서 From/Reply-To 정리:

```javascript
const emailPayload = {
  personalizations: [{ to: [{ email: data.email, name: data.name }] }],
  from: {
    email: env.SENDER_EMAIL || 'noreply@bebe-guide.com',
    name: env.SENDER_NAME || '베베가이드'
  },
  reply_to: {
    email: 'care@bebe-guide.com',  // 부모가 답장할 수 있는 주소
    name: '베베가이드 고객센터'
  },
  subject: `[베베가이드] ...`,
  content: [ ... ]
};
```

**권장사항**:
- `From`: 자동 발송 전용 (예: `noreply@bebe-guide.com`)
- `Reply-To`: 실제 응답 가능한 주소 (예: `care@bebe-guide.com`)
- 두 주소 모두 같은 도메인 사용 (SPF/DKIM 정합성 유지)

---

## 🚨 문제 해결

### 메일이 스팸함으로 가는 경우

1. **SPF/DKIM/DMARC 재확인**
   - DNS 레코드가 제대로 설정되었는지 확인
   - 최대 24시간 대기 (DNS 전파 시간)

2. **이메일 제목 조정**
   - 지나치게 광고성 문구 제거
   - 예: "지금 바로!", "무료!", "100% 할인" 등

3. **발송량 관리**
   - 초기에는 하루 10-50통으로 시작
   - 점진적으로 증가 (이메일 서비스 신뢰도 축적)

4. **수신자 반응 모니터링**
   - 스팸 신고율 확인
   - 오픈율/클릭률 추적

### 이메일이 아예 안 가는 경우

1. **Worker 로그 확인**
   ```bash
   wrangler tail
   ```

2. **MailChannels API 응답 확인**
   - Worker 코드의 `console.error` 출력 확인

3. **환경 변수 확인**
   ```bash
   wrangler secret list
   ```

---

## 📊 모니터링 및 유지보수

### 정기 점검 사항 (월 1회)

- [ ] DMARC 리포트 확인 (`rua` 주소 확인)
- [ ] 스팸함 배치율 확인
- [ ] 이메일 오픈율 추적
- [ ] DNS 레코드 유효성 재확인

### 경고 신호

- 🚨 오픈율이 갑자기 10% 이하로 하락
- 🚨 스팸 신고가 2건 이상 발생
- 🚨 DMARC 리포트에서 "fail" 항목 발견

---

## 📚 추가 자료

### 공식 문서
- **SPF**: https://www.rfc-editor.org/rfc/rfc7208
- **DKIM**: https://www.rfc-editor.org/rfc/rfc6376
- **DMARC**: https://www.rfc-editor.org/rfc/rfc7489

### MailChannels 문서
- **공식 문서**: https://mailchannels.zendesk.com/hc/en-us
- **DKIM 설정**: https://mailchannels.zendesk.com/hc/en-us/articles/7122849237389

### Cloudflare 문서
- **DNS 관리**: https://developers.cloudflare.com/dns/
- **Workers 이메일 발송**: https://developers.cloudflare.com/workers/examples/send-emails/

---

## ✅ 체크리스트

배포 전 최종 확인:

- [ ] SPF 레코드 추가 완료
- [ ] DKIM 레코드 추가 완료 (서비스별)
- [ ] DMARC 레코드 추가 완료 (`p=none`으로 시작)
- [ ] DNS 전파 완료 (24시간 대기)
- [ ] MXToolbox 검증 통과
- [ ] Worker 환경 변수 (`SENDER_EMAIL`, `SENDER_NAME`) 확인
- [ ] Reply-To 주소 설정 완료
- [ ] 테스트 이메일 발송 및 수신 확인
- [ ] 스팸 점수 확인 (Mail-Tester 8점 이상)

---

**작성일**: 2025-10-28
**버전**: 1.0.0

**문의**: info@bebe-guide.com
