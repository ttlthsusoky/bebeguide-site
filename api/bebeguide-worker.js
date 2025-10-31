// ============================================================================
// 베베가이드 자동 회신 Cloudflare Worker
// ============================================================================
// 기능:
// 1. contactForm 제출 시 POST 요청 수신
// 2. 운영자에게 Slack 알림 전송 (선택)
// 3. 부모에게 자동 회신 메일 발송 (Resend)
// 4. 월령별 체크리스트 웹페이지 링크 제공
// 5. 법적 안전 문구 포함 (의료 진단 아님, 응급 시 119)
// ============================================================================

export default {
  async fetch(request, env) {
    // CORS preflight 처리
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    // POST 요청만 허용
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Only POST method allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    try {
      // 폼 데이터 파싱 (JSON 또는 FormData 지원)
      const contentType = request.headers.get('content-type') || '';
      let data;
      let hp_check = null;
      let pdfFile = null;

      if (contentType.includes('application/json')) {
        // JSON 요청 처리
        const jsonData = await request.json();
        data = {
          email: jsonData.email,
          name: jsonData.name || '고객님',
          baby_age: jsonData.baby_age,
          message: jsonData.message || '',
          request_type: jsonData.request_type || 'GENERAL_INQUIRY',
          requested_month: jsonData.requested_month || jsonData.baby_age
        };
        hp_check = jsonData.hp_check;
      } else {
        // FormData 요청 처리
        const formData = await request.formData();
        data = {
          email: formData.get('email'),
          name: formData.get('name') || '고객님',
          baby_age: formData.get('baby_age'),
          message: formData.get('message') || '',
          request_type: formData.get('request_type') || 'GENERAL_INQUIRY',
          requested_month: formData.get('requested_month') || formData.get('baby_age')
        };
        hp_check = formData.get('hp_check');
        pdfFile = formData.get('checklist_pdf'); // PDF 파일 (FormData만)
      }

      // Honeypot 스팸 차단 (봇이 채울 가능성 높은 숨겨진 필드)
      if (hp_check) {
        return new Response(JSON.stringify({
          ok: true,
          message: '요청이 정상적으로 접수되었습니다.'
        }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 이메일 필수 검증
      if (!data.email || !isValidEmail(data.email)) {
        return new Response(JSON.stringify({
          error: '유효한 이메일 주소를 입력해주세요.'
        }), {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // 응급 키워드 감지 (위험 문의 대응)
      const urgentKeywords = [
        "숨을", "호흡이", "파래", "파랗", "경련", "痙攣", "발작", "의식이 없음",
        "깨워도", "안 깨어", "119", "응급", "고열", "40도", "39도", "호흡곤란"
      ];
      const isEmergencyLike = data.message && urgentKeywords.some(k => data.message.includes(k));

      // 리마인더 구독자 KV에 저장 (VACCINE_REMINDER 동의자만)
      if (data.request_type === 'VACCINE_REMINDER' && env.REMINDER_USERS) {
        try {
          const record = {
            email: data.email,
            name: data.name,
            baby_age: data.baby_age,
            requested_month: data.requested_month,
            consent_at: new Date().toISOString()
          };

          // 이메일을 key로 저장 (동일 이메일은 덮어쓰기)
          // TTL: 1년(31536000초) 유지
          await env.REMINDER_USERS.put(
            data.email,
            JSON.stringify(record),
            { expirationTtl: 60 * 60 * 24 * 365 }
          );
        } catch (kvError) {
          console.error('KV 저장 실패:', kvError);
          // KV 저장 실패해도 이메일 전송은 계속 진행
        }
      }

      // 1) 운영자에게 Slack 알림 (선택사항)
      if (env.SLACK_WEBHOOK_URL) {
        await sendSlackNotification(env.SLACK_WEBHOOK_URL, data, isEmergencyLike);
      }

      // 2) 부모에게 자동 회신 이메일 발송
      // (서버 측에서 PDF 생성하므로 pdfFile 인자 제거)
      const emailSent = await sendAutoReplyEmail(env, data, isEmergencyLike);

      if (!emailSent) {
        console.error('Failed to send email');
      }

      // 3) 성공 응답
      return new Response(JSON.stringify({
        ok: true,
        message: '요청이 접수되었습니다. 곧 이메일로 답변을 보내드릴게요!'
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: '요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * 이메일 유효성 검사
 */
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * 월령별 체크리스트 웹페이지 URL 생성
 */
function getChecklistUrl(babyMonth) {
  const baseUrl = "https://be-be-guide.com";
  return `${baseUrl}/checklist/${babyMonth}m.html`;
}

/**
 * Slack 알림 전송
 */
async function sendSlackNotification(webhookUrl, data, isEmergency = false) {
  try {
    const slackMessage = {
      text: isEmergency ? `⚠️ 응급 의심 문의` : `🍼 베베가이드 새 요청`,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: isEmergency ? '⚠️ 응급 의심 문의가 들어왔습니다!' : '🍼 새로운 문의가 들어왔습니다!'
          }
        },
        {
          type: 'section',
          fields: [
            {
              type: 'mrkdwn',
              text: `*이름:*\n${data.name}`
            },
            {
              type: 'mrkdwn',
              text: `*이메일:*\n${data.email}`
            },
            {
              type: 'mrkdwn',
              text: `*아기 월령:*\n${data.baby_age || data.requested_month}개월`
            },
            {
              type: 'mrkdwn',
              text: `*요청 유형:*\n${data.request_type}`
            }
          ]
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*문의 내용:*\n${data.message || '(없음)'}`
          }
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `📅 ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}`
            }
          ]
        }
      ]
    };

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    });

    return true;
  } catch (error) {
    console.error('Slack notification failed:', error);
    return false;
  }
}

/**
 * 자동 회신 이메일 발송 (Resend API 사용)
 *
 * ENV 변수 필요:
 * - RESEND_API_KEY (필수, Resend API 키)
 * - SENDER_EMAIL (발신자 이메일, 예: noreply@be-be-guide.com)
 * - SENDER_NAME (발신자 이름, 예: 베베가이드)
 */
/**
 * 자동 회신 이메일 발송
 * - 부모에게 맞춤 회신을 보낸다.
 * - 응급 의심 케이스면 즉시 119/응급실 안내 위주의 메일
 * - 일반 케이스면 월령별 가이드 + 면책 + 제휴 고지
 * - 서버 측에서 PDF 생성하여 첨부
 */
async function sendAutoReplyEmail(env, data, isEmergency) {

  // 0. 안전한 기본값 처리
  const toEmail = data.email;
  const parentName = data.name || "보호자님";
  const babyAge = data.baby_age || data.requested_month || "0";
  const requestedMonth = data.requested_month || babyAge;
  const requestType = data.request_type || "GENERAL_INQUIRY";

  const senderEmail = env.SENDER_EMAIL || "noreply@example.com";
  const senderName = env.SENDER_NAME || "베베가이드";

  // 안내 기준일 (사이트/문서/메일 통일)
  const INFO_DATE = "정보 기준일: 2025-10-28 업데이트";

  // 월령별 체크리스트 웹페이지 URL 생성
  const checklistUrl = getChecklistUrl(requestedMonth);

  // 1. 응급 / 일반에 따라 제목과 본문 구분
  let subject;
  let htmlBody;
  let textBody;

  if (isEmergency) {
    subject = `⚠️ 즉시 확인 필요: 아기 응급 의심 증상 안내 (119 / 응급실 권고)`;
    htmlBody = `
      <div style="font-family: 'Noto Sans KR', system-ui, sans-serif; line-height:1.6; color:#333;">
        <h2 style="color:#dc2626;">⚠️ 긴급 안내</h2>
        <p><strong>${parentName}</strong>님, 메시지 내용에서 응급이 의심되는 표현이 확인되었어요.</p>

        <p style="background:#fff5f5;border-left:4px solid #dc2626;padding:12px 16px;border-radius:6px;">
          <strong>아기가 아래 증상 중 하나라도 해당된다면</strong><br>
          · 호흡이 힘들거나 숨이 가빠 보임 / 입술·얼굴이 파래짐<br>
          · 38.5℃ 이상의 고열 (특히 생후 3개월 미만)<br>
          · 경련 또는 늘어진 듯 깨어나지 않음 / 의식 저하<br>
          · 계속 토하고, 젖/분유를 전혀 못 먹고, 기저귀가 6시간 이상 마르거나(탈수 의심)<br>
          · 몸이 축 늘어지고 반응이 둔함<br><br>

          👉 <strong>즉시 119로 연락하거나 가까운 응급실(소아 진료 가능) 또는 소아청소년과 진료를 받으세요.</strong><br>
        </p>

        <p>이 안내는 일반적인 응급 기준을 토대로 자동 제공되는 정보입니다. 실제 진료·진단은 반드시 의료진이 직접 해야 합니다.</p>

        <hr style="margin:24px 0;border:none;border-top:1px solid #eee;">

        <p style="font-size:13px;color:#555;">
          <strong>법적/안전 안내</strong><br>
          · 본 메일은 일반적인 정보 제공 목적이며, 의료인의 직접 진단·치료를 대체할 수 없습니다.<br>
          · 아기의 상태가 급하거나 위급해 보인다면 스스로 판단하지 말고 즉시 119 또는 응급실로 이동하세요.<br>
        </p>

        <p style="font-size:13px;color:#555;">
          ${INFO_DATE}
        </p>

        <p style="font-size:12px;color:#777;">
          본 메일의 일부 내용에는 제휴 링크(쿠팡 파트너스 등)가 포함될 수 있으며,
          해당 링크를 통해 구매 시 일정 수수료를 제공받을 수 있습니다.
          보호자에게 추가 비용은 발생하지 않습니다.
        </p>

        <p style="font-size:12px;color:#777;">
          더 이상 반복적인 알림/안내 메일을 원치 않으시면,
          이 메일에 회신으로 "중단 요청"이라고 남겨주세요. 즉시 반영하겠습니다.
        </p>
      </div>
    `;

    textBody = `
[긴급 안내]

${parentName}님,
아기에게 응급이 의심되는 표현이 감지되었습니다.

아기가 아래에 해당하면 즉시 119 또는 응급실 / 소아청소년과 진료를 받으세요:
- 숨쉬기 힘들어함 / 입술·얼굴이 파래짐
- 38.5℃ 이상의 고열 (특히 생후 3개월 미만)
- 경련, 축 늘어짐, 깨워도 반응 없음
- 계속 토하거나 전혀 못 먹고 기저귀가 6시간 이상 마름(탈수)
- 의식 저하 등 위급해 보임

이 메일은 일반 정보이며 의료진의 직접 진단을 대체할 수 없습니다.
위급하다고 느껴지면 지체하지 말고 119 또는 응급실로 이동하세요.

${INFO_DATE}

[제휴 안내]
본 메일에는 제휴 링크(쿠팡 파트너스 등)가 포함될 수 있으며,
해당 링크로 구매 시 일정 수수료를 제공받을 수 있습니다.
보호자에게 추가 비용은 없습니다.

[중단 안내]
반복 안내 메일이 불필요하시면 이 메일에 "중단 요청"이라고 회신해 주세요.
    `.trim();

  } else {
    // 일반 케이스
    subject = `[베베가이드] ${requestedMonth}개월 아기 기본 체크리스트 & 주의사항`;

    const safetyBlockHTML = `
      <p style="font-size:13px;color:#555;margin-top:16px;">
        <strong>⚠️ 안전 / 의료 안내</strong><br>
        · 본 안내는 일반적인 육아 정보이며 의료인의 직접 진단·치료를 대체할 수 없습니다.<br>
        · 아기가 호흡이 힘들어 하거나, 38.5℃ 이상의 고열(특히 생후 3개월 미만), 경련, 깨워도 반응 없음 등
          응급 신호가 보이면 <strong>즉시 119 또는 응급실 / 소아청소년과</strong> 진료를 받으세요.<br>
      </p>
    `;

    const affiliateBlockHTML = `
      <p style="font-size:12px;color:#777;">
        📢 제휴 마케팅 고지<br>
        본 메일(및 첨부 PDF)에는 제휴 링크(쿠팡 파트너스 등)가 포함될 수 있으며,
        해당 링크를 통해 구매 시 일정 수수료를 제공받을 수 있습니다.
        보호자에게 추가 비용은 발생하지 않습니다.
      </p>
    `;

    const optoutBlockHTML = `
      <p style="font-size:12px;color:#777;">
        🔄 알림 중단 안내<br>
        예방접종 알림 등 반복 안내를 더 이상 원하지 않으시면,
        이 메일에 "중단 요청"이라고 회신해 주세요. 즉시 반영하겠습니다.
      </p>
    `;

    htmlBody = `
      <div style="font-family: 'Noto Sans KR', system-ui, sans-serif; line-height:1.6; color:#333; max-width:600px; margin:0 auto;">
        <h2 style="color:#FF8E8E;">🍼 ${parentName}님, ${requestedMonth}개월 아기 체크리스트</h2>
        <p>
          ${requestedMonth}개월 아기에게 특히 중요한 핵심 포인트를 정리했습니다.<br>
          자세한 준비물 목록, 예방접종 일정, 돌봄 주의사항은 아래 링크에서 확인하세요.
        </p>

        <div style="text-align:center; margin:30px 0;">
          <a href="${checklistUrl}"
             style="display:inline-block; background:#FF8E8E; color:white; padding:16px 32px;
                    text-decoration:none; border-radius:8px; font-weight:bold; font-size:16px;">
            📋 ${requestedMonth}개월 체크리스트 보기
          </a>
        </div>

        <h3 style="color:#333; margin-top:30px;">💡 핵심 포인트</h3>
        <ul style="font-size:14px; line-height:1.8; background:#f9f9f9; padding:20px; border-radius:8px;">
          <li><strong>수유/수면 루틴</strong>: 수유 후 충분한 트림, 아기는 반드시 등을 대고 재우기 (질식 예방)</li>
          <li><strong>예방접종</strong>: 질병관리청(KDCA) 일정에 맞춰 접종하며, 접종 후 고열·과도한 무기력은 바로 진료 권고</li>
          <li><strong>응급 신호</strong>: 숨이 빠르거나 힘들어 보임, 깨워도 늘어져 있으면 지체 없이 119 또는 응급실</li>
        </ul>

        ${safetyBlockHTML}

        <p style="font-size:13px;color:#555; background:#e3f2fd; padding:15px; border-radius:8px; margin-top:20px;">
          📅 ${INFO_DATE}<br>
          ※ 최신 지침은 항상 소아청소년과 / 보건소에서 최종 확인해 주세요.
        </p>

        ${affiliateBlockHTML}
        ${optoutBlockHTML}

        <p style="font-size:12px;color:#999;margin-top:24px; text-align:center; padding-top:20px; border-top:1px solid #eee;">
          이 메일은 보호자님이 요청하신 아기 월령 자료에 대한 자동 회신입니다.<br>
          베베가이드 팀 | <a href="https://be-be-guide.com" style="color:#FF8E8E;">be-be-guide.com</a>
        </p>
      </div>
    `;

    textBody = `
[베베가이드] ${requestedMonth}개월 아기 체크리스트 안내

${parentName}님,

${requestedMonth}개월 아기에게 중요한 체크리스트를 준비했습니다.
아래 링크에서 자세한 준비물, 예방접종 일정, 돌봄 주의사항을 확인하세요.

🔗 체크리스트 보기: ${checklistUrl}

핵심 포인트:
- 수유/수면: 수유 후 트림 필수, 아기는 반드시 등을 대고 재우기
- 예방접종: KDCA(질병관리청) 권장 일정에 맞춰 접종. 접종 후 고열/무기력은 바로 진료
- 응급 신호: 숨쉬기 힘들어함, 38.5℃ 이상 고열(특히 3개월 미만), 경련, 깨워도 늘어짐 → 즉시 119 또는 응급실/소아청소년과

⚠️ 안전 / 의료 안내:
이 메일은 일반적인 육아 정보를 제공합니다.
의료진의 직접 진단·치료를 대체하지 않습니다.
아기가 급해 보이면 즉시 119 또는 응급실로 가세요.

${INFO_DATE}
※ 최신 지침은 항상 소아청소년과 / 보건소에서 최종 확인하세요.

[제휴 고지]
본 메일과 웹사이트에는 제휴 링크(쿠팡 파트너스 등)가 포함될 수 있으며,
해당 링크를 통해 구매 시 일정 수수료를 제공받을 수 있습니다.
보호자에게 추가 비용은 없습니다.

[알림 중단 안내]
예방접종/중요 일정 알림을 중단하고 싶으시면
이 메일에 "중단 요청"이라고 회신해 주세요.

---
베베가이드 팀
https://be-be-guide.com
    `.trim();
  }

  // 2. Resend API용 payload 구성 (첨부 파일 없음, 웹페이지 링크만 포함)
  const mailPayload = {
    "from": `${senderName} <${senderEmail}>`,
    "to": [toEmail],
    "subject": subject,
    "html": htmlBody,
    "text": textBody
  };

  // 4. Resend API로 실제 전송
  try {
    const resendApiKey = env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not set");
      return false;
    }

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(mailPayload)
    });

    if (resp.ok) {
      const result = await resp.json();
      console.log("Resend email sent successfully:", result.id);
      return true;
    } else {
      const errorText = await resp.text();
      console.error("Resend send failed:", resp.status, errorText);
      return false;
    }
  } catch (err) {
    console.error("Resend exception:", err);
    return false;
  }
}

/**
 * 요청 유형 텍스트 변환
 */
function getRequestTypeText(requestType) {
  const types = {
    'PDF_CHECKLIST': 'PDF 체크리스트 요청',
    'VACCINE_REMINDER': '예방접종 리마인더 신청',
    'GENERAL_INQUIRY': '일반 문의',
    'CONSULTATION': '육아 상담'
  };
  return types[requestType] || '일반 문의';
}
