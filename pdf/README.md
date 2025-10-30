# 📄 베베가이드 월령별 PDF 폴더

이 폴더에는 부모에게 자동 발송할 월령별 체크리스트 PDF 파일이 저장됩니다.

---

## 📁 파일 목록

### 필수 파일 (13개)
```
checklist-0m.pdf   → 신생아 (0개월)
checklist-1m.pdf   → 1개월
checklist-2m.pdf   → 2개월
checklist-3m.pdf   → 3개월
checklist-4m.pdf   → 4개월
checklist-5m.pdf   → 5개월
checklist-6m.pdf   → 6개월
checklist-7m.pdf   → 7개월
checklist-8m.pdf   → 8개월
checklist-9m.pdf   → 9개월
checklist-10m.pdf  → 10개월
checklist-11m.pdf  → 11개월
checklist-12m.pdf  → 12개월
```

---

## 🔗 작동 원리

1. **부모 요청:** contactForm에서 아기 월령 선택 (예: 6개월)
2. **Worker 처리:** `requested_month=6` 값을 받음
3. **이메일 발송:** 자동 회신 메일에 PDF 링크 포함
   ```
   https://bebe-guide.com/pdf/checklist-6m.pdf
   ```
4. **PDF 다운로드:** 부모가 이메일에서 링크 클릭 → PDF 다운로드

---

## 📝 PDF 생성 방법

**상세 가이드:** [PDF_CREATION_GUIDE.md](./PDF_CREATION_GUIDE.md) 참고

### 빠른 시작
1. Canva 또는 Word로 PDF 생성
2. 필수 고지 3개 포함:
   - 제휴 마케팅 고지
   - 의료 면책 조항
   - 개인정보/사용 안내
3. 파일명: `checklist-{month}m.pdf` 형식
4. 이 폴더에 저장

---

## ⚠️ 중요 안내

### 필수 포함 사항
모든 PDF에 다음 3개 고지 문구를 **반드시 포함**해야 합니다:

#### 1. 제휴 고지
```
⚠️ 제휴 마케팅 고지
이 문서에는 제휴 링크가 포함될 수 있으며,
해당 링크를 통해 구매 시 일정 수수료를 제공받을 수 있습니다.
```

#### 2. 의료 면책
```
⚠️ 의료 면책 조항
이 문서는 일반적인 육아 정보를 제공합니다.
고열(38.5℃ 이상), 호흡 곤란, 경련 등 응급 증상은
즉시 119 또는 소아청소년과 진료를 받으세요.
본 안내는 의료진의 진단·치료를 대체하지 않습니다.
```

#### 3. 사용 안내
```
📋 사용 안내
• 본 자료는 요청하신 보호자에게만 제공됩니다.
• 무단 배포는 금지되며 개인 사용 목적으로만 이용 가능합니다.
• 최신 정보는 항상 의료기관 또는 질병관리청 공식 지침을 확인하세요.
```

---

## 📤 배포

### Cloudflare Pages
- PDF 파일은 Cloudflare Pages 배포 시 자동으로 호스팅됩니다.
- 접근 URL: `https://bebe-guide.com/pdf/checklist-{month}m.pdf`

### 로컬 테스트
```bash
# 브라우저에서 로컬 파일 열기
file:///C:/Users/hee/website/pdf/checklist-6m.pdf
```

---

## ✅ 체크리스트

배포 전 확인:
- [ ] 13개 PDF 파일 모두 생성 완료
- [ ] 각 PDF에 3개 법적 고지 포함
- [ ] 파일명 형식 확인 (`checklist-Nm.pdf`)
- [ ] 예방접종 일정 정확성 확인
- [ ] 응급 증상 안내 명확히 표시
- [ ] PDF 파일 크기 확인 (1-5MB)
- [ ] Cloudflare Pages 배포 완료
- [ ] 실제 다운로드 링크 테스트

---

## 📞 문의

info@bebe-guide.com

**작성일:** 2024-01-XX
