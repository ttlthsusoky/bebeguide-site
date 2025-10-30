# 📄 베베가이드 맞춤형 PDF 자동화 설계

**목적**: 월령별로 개인화된 "그 아기 전용 가이드" PDF를 자동 생성하여 부모에게 제공

**작성일**: 2025-10-28
**버전**: 1.0.0

---

## 📋 목표

현재는 정적 PDF 링크(`/pdf/checklist-6m.pdf`)를 이메일에 넣는 방식입니다.

다음 단계로 **동적 PDF 생성**을 통해:
1. 아기 월령에 맞춘 개인화 콘텐츠
2. 예방접종 일정 요약
3. 응급 시 행동 지침
4. 제휴 고지 및 법적 면책
5. 정보 기준일 명시

→ 부모에게 "우리 아기 전용 자료"라는 가치를 제공하고, 브랜드 자산으로 활용

---

## 🎯 필수 섹션 (법적 안전성 포함)

모든 PDF에는 다음 섹션이 **반드시** 포함되어야 합니다:

### 1. 월령별 준비물 체크리스트
- 필수 준비물 (안전 관련)
- 선택 준비물 (편의성)
- 각 항목별 간단한 설명

### 2. 예방접종 스케줄 요약
- 해당 월령에 맞아야 할 예방접종
- 다음 예방접종 일정
- 예방접종 후 주의사항

### 3. 응급 시 행동 지침 ⚠️
```
⚠️ 즉시 119 또는 응급실로 가야 하는 증상:
- 고열 (39도 이상)
- 호흡곤란 (숨을 헐떡거림, 파랗게 변함)
- 경련 또는 발작
- 의식 저하 (깨워도 안 깨어남)
- 심한 탈수 (기저귀가 6시간 이상 마름)

이 문서는 일반적인 육아 정보이며, 의료진의 진단이나 치료를 대체할 수 없습니다.
```

### 4. 제휴 고지
```
📌 제휴 고지
이 문서에는 쿠팡 파트너스 제휴 링크가 포함될 수 있으며,
해당 링크를 통해 구매 시 판매자로부터 일정액의 수수료를 제공받을 수 있습니다.
구매자에게 추가 비용은 발생하지 않습니다.
```

### 5. 정보 기준일 및 면책
```
📅 정보 기준일: 2025-10-28

예방접종 권장 시기와 의학적 기준은 변경될 수 있으므로,
최신 내용은 반드시 소아청소년과 전문의 또는 질병관리청 공지에서 확인하세요.

본 자료는 교육 및 정보 제공 목적으로만 사용되어야 하며,
전문적인 의료 상담, 진단 또는 치료를 대신할 수 없습니다.
```

---

## 🏗️ 구현 방식 (2가지 옵션)

### 옵션 A: 브라우저에서 생성 (jsPDF)

**흐름**:
```
사용자 클릭 → script.js에서 jsPDF로 PDF 생성
→ Blob 생성 → FormData에 첨부 → Worker로 전송
→ Worker가 이메일에 첨부파일로 추가
```

**장점**:
- ✅ 서버 부담 없음
- ✅ 개인화 용이 (이름, 시각 등)
- ✅ 브라우저에서 미리보기 가능

**단점**:
- ❌ 모바일 성능 이슈 가능
- ❌ PDF 용량 제한 (이메일 첨부 크기)

**구현 예시**:
```javascript
// script.js
import jsPDF from 'jspdf';

async function generatePersonalizedPDF(month, babyName) {
  const doc = new jsPDF();

  // 1. 타이틀
  doc.setFontSize(20);
  doc.text(`${babyName}의 ${month}개월 가이드`, 20, 20);

  // 2. 준비물 체크리스트
  doc.setFontSize(14);
  doc.text('필수 준비물', 20, 40);
  CHECKLIST[month].forEach((item, idx) => {
    doc.text(`${idx + 1}. ${item}`, 25, 50 + (idx * 10));
  });

  // 3. 응급 경고
  doc.setTextColor(255, 0, 0);
  doc.text('⚠️ 응급 증상은 즉시 119 또는 응급실', 20, 100);
  doc.setTextColor(0, 0, 0);

  // 4. 제휴 고지 및 면책
  doc.setFontSize(10);
  doc.text('제휴 고지: 쿠팡 파트너스 활동...', 20, 200);
  doc.text('정보 기준일: 2025-10-28', 20, 210);

  // Blob 생성
  const blob = doc.output('blob');
  return blob;
}

// 폼 제출 시
const pdfBlob = await generatePersonalizedPDF(selectedMonth, babyName);
formData.append('pdf_attachment', pdfBlob, `bebeguide-${selectedMonth}m.pdf`);
```

**Worker 수정 필요**:
```javascript
// bebeguide-worker.js
const pdfAttachment = formData.get('pdf_attachment');
if (pdfAttachment) {
  // MailChannels attachments 필드에 추가
  emailPayload.attachments = [
    {
      filename: `bebeguide-${data.requested_month}m.pdf`,
      content: await pdfAttachment.arrayBuffer(),
      type: 'application/pdf'
    }
  ];
}
```

---

### 옵션 B: Worker에서 생성 (서버 사이드)

**흐름**:
```
사용자 클릭 → Worker가 요청 받음
→ Worker에서 PDF 생성 (jsPDF 또는 html-to-pdf)
→ R2 스토리지에 업로드
→ R2 Public URL을 이메일에 링크로 삽입
```

**장점**:
- ✅ 클라이언트 성능 무관
- ✅ PDF를 R2에 저장하여 재사용 가능
- ✅ 모바일 친화적

**단점**:
- ❌ Worker CPU 시간 제한 (10ms CPU time)
- ❌ R2 스토리지 비용 발생 (매우 저렴)
- ❌ Cloudflare Workers에서 Canvas API 제한

**구현 예시**:
```javascript
// bebeguide-worker.js
import { jsPDF } from 'jspdf'; // Workers 환경에서 작동 여부 확인 필요

async function generatePDFOnServer(data, env) {
  const doc = new jsPDF();

  // PDF 내용 생성 (옵션 A와 동일)
  doc.text(`${data.name}의 ${data.requested_month}개월 가이드`, 20, 20);
  // ... (생략)

  const pdfBuffer = doc.output('arraybuffer');

  // R2에 업로드
  const filename = `bebeguide-${data.email}-${data.requested_month}m-${Date.now()}.pdf`;
  await env.PDF_BUCKET.put(filename, pdfBuffer, {
    httpMetadata: {
      contentType: 'application/pdf'
    }
  });

  // Public URL 반환
  return `https://cdn.bebe-guide.com/pdfs/${filename}`;
}

// 이메일 전송 시
const pdfUrl = await generatePDFOnServer(data, env);
// 이메일 템플릿에 pdfUrl 링크 삽입
```

**wrangler.toml에 R2 바인딩 추가**:
```toml
[[r2_buckets]]
binding = "PDF_BUCKET"
bucket_name = "bebeguide-pdfs"
```

---

## 🔒 보안 및 법적 고려사항

### 1. 개인정보 보호
- ❌ PDF 파일명에 개인 식별 정보(이메일, 이름) 노출 금지
- ✅ 랜덤 UUID 사용 권장: `${uuidv4()}.pdf`
- ✅ R2 Public URL에 쿼리 파라미터로 토큰 추가: `?token=xxx`

### 2. 법적 면책
- **모든 페이지**에 하단에 다음 문구 반복:
  ```
  "이 정보는 의료 조언이 아닙니다. 응급 시 즉시 119 또는 병원"
  ```

### 3. 저작권 및 브랜딩
- PDF 헤더에 "베베가이드" 로고 및 URL 삽입
- 푸터에 "© 2025 베베가이드. All rights reserved."

### 4. 접근 제어
- R2 URL에 **시간 제한 서명** 추가 (7일 후 만료)
- 또는 R2 Private + Cloudflare Worker로 프록시

---

## 📊 구현 우선순위

### Phase 1 (현재 - 유지)
- ✅ 정적 PDF 링크 (`/pdf/checklist-6m.pdf`)
- 13개 PDF 파일 수동 생성 (0m ~ 12m)

### Phase 2 (다음 단계 - 권장)
- 🔄 옵션 A (브라우저 jsPDF)로 시작
- 기본 레이아웃 + 월령별 콘텐츠 자동 렌더링
- 법적 면책 문구 자동 삽입
- 이메일 첨부파일로 전송

### Phase 3 (장기 - 고도화)
- 🚀 옵션 B (Worker + R2)로 전환
- 개인화 심화 (아기 이름, 생년월일, 맞춤 추천)
- PDF 템플릿 디자인 개선 (폰트, 색상, 레이아웃)
- 다운로드 통계 수집 (GA 이벤트)

---

## 🛠️ 필요한 라이브러리

### 옵션 A (브라우저)
```bash
npm install jspdf
```

### 옵션 B (Worker)
```bash
npm install jspdf
# 또는
npm install html-pdf-node  # Node.js 기반이라 Workers에서 작동 안 할 수 있음
```

**주의**: Cloudflare Workers는 순수 JavaScript 환경이므로, Canvas API나 Node.js 네이티브 모듈이 필요한 라이브러리는 작동하지 않을 수 있습니다.

---

## ✅ 체크리스트 (PDF 생성 전 검증)

- [ ] 모든 법적 면책 문구 포함 확인
- [ ] 응급 경고 섹션 눈에 띄게 표시 (빨간색)
- [ ] 제휴 고지 명확히 표기
- [ ] 정보 기준일 업데이트
- [ ] PDF 파일 크기 확인 (이메일 첨부: <5MB 권장)
- [ ] 모바일에서 가독성 테스트
- [ ] 인쇄 시 레이아웃 확인 (부모가 프린트할 가능성)

---

## 📚 참고 자료

- **jsPDF 공식 문서**: https://github.com/parallax/jsPDF
- **Cloudflare R2 문서**: https://developers.cloudflare.com/r2/
- **MailChannels Attachments**: https://mailchannels.zendesk.com/hc/en-us/articles/4565898358413

---

**다음 단계**: Phase 2 구현 시작 (옵션 A - 브라우저 jsPDF)
