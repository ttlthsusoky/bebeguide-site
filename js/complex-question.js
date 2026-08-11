(() => {
    const originalRunSiteSearch = runSiteSearch;

    const SOURCES = {
        emergency: ['119 안전신고센터', 'https://www.119.go.kr/Center119/main.do'],
        seriousIllness: ['NHS 영유아 중증 신호', 'https://www.nhs.uk/baby/health/is-your-baby-or-toddler-seriously-ill/'],
        seizureAap: ['AAP 열성경련', 'https://www.healthychildren.org/English/health-issues/conditions/fever/pages/Febrile-Seizures.aspx'],
        seizureNhs: ['NHS 열성경련 행동 순서', 'https://www.nhs.uk/conditions/febrile-seizures/'],
        choking: ['2025 AHA 소아 질식 지침', 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/pediatric-basic-life-support'],
        chokingNhs: ['NHS 영유아 질식 응급처치', 'https://www.nhs.uk/baby/first-aid-and-safety/first-aid/how-to-stop-a-child-from-choking/'],
        drowning: ['AHA·AAP 익수 소생술 지침', 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-and-pediatric-special-circumstances-of-resuscitation'],
        drowningAap: ['AAP 물에 빠진 뒤 심폐소생술 안내', 'https://www.healthychildren.org/English/news/Pages/cpr-for-drowning-updated-guidance.aspx'],
        childCpr: ['NHS 영유아 심폐소생술', 'https://www.nhs.uk/baby/first-aid-and-safety/first-aid/how-to-resuscitate-a-child/'],
        childAccident: ['NHS 영유아 사고 응급처치', 'https://www.nhs.uk/baby/first-aid-and-safety/first-aid/what-to-do-if-your-child-has-an-accident/'],
        burns: ['NHS 화상·열탕화상', 'https://www.nhs.uk/conditions/burns-and-scalds/'],
        eyeChemical: ['AAP 눈에 화학물질이 들어갔을 때', 'https://www.healthychildren.org/English/tips-tools/Symptom-Checker/IFrame/Pages/symptomviewer.aspx?symptom=Chemical+in+eye'],
        infantFever: ['AAP 3개월 이하 아기 발열', 'https://www.healthychildren.org/English/health-issues/conditions/fever/Pages/Fever-and-Your-Baby.aspx'],
        buttonBattery: ['NHS 버튼형 건전지 안전', 'https://www.gosh.nhs.uk/conditions-and-treatments/conditions-we-treat/button-batteries-using-them-safely/'],
        poison: ['AAP 중독 예방·대처', 'https://www.healthychildren.org/English/safety-prevention/all-around/Pages/Poison-Prevention.aspx'],
        head: ['AAP 영유아 머리 충격', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/concussions-in-babies-what-to-do-if-your-infant-or-toddler-hits-their-head.aspx'],
        allergy: ['NHS 영유아 식품 알레르기', 'https://www.nhs.uk/baby/weaning-and-feeding/food-allergies-in-babies-and-young-children/'],
        breathing: ['AAP 영유아 크루프', 'https://www.healthychildren.org/English/health-issues/conditions/chest-lungs/Pages/Croup-Treatment.aspx'],
        bronchiolitis: ['질병관리청 세기관지염', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6736'],
        gastro: ['질병관리청 급성 바이러스 위장관염', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6756'],
        dehydration: ['NHS 탈수 신호', 'https://www.nhs.uk/conditions/dehydration/'],
        rash: ['NHS 영유아 발진 위험 신호', 'https://www.nhs.uk/symptoms/rashes-babies-and-children/'],
        roseola: ['AAP 돌발진', 'https://www.healthychildren.org/English/health-issues/conditions/skin/Pages/Roseola-Infantum.aspx'],
        hfmd: ['AAP 수족구병', 'https://www.healthychildren.org/English/health-issues/conditions/infections/Pages/Hand-Foot-and-Mouth-Disease.aspx'],
        crying: ['AAP 3개월 이후 원인 모를 울음', 'https://www.healthychildren.org/English/tips-tools/symptom-checker/Pages/symptomviewer.aspx?symptom=Crying+Child+-+3+Months+and+Older'],
        cryingNhs: ['NHS 아기 울음 달래기·위험 신호', 'https://www.nhs.uk/baby/caring-for-a-newborn/soothing-a-crying-baby/'],
        teething: ['AAP 이앓이 불편과 피해야 할 방법', 'https://www.healthychildren.org/English/ages-stages/baby/teething-tooth-care/Pages/Teething-Pain.aspx']
    };

    const GENERAL_CHECKS = [
        { id: 'breathing', prompt: '숨쉬기가 편하고 입술·피부색이 평소와 같은가요?', noLevel: 'emergency' },
        { id: 'response', prompt: '깨우거나 부르면 평소처럼 반응하나요?', noLevel: 'emergency' },
        { id: 'hydration', prompt: '물을 마시거나 수유하고 소변도 평소처럼 보나요?', noLevel: 'today' }
    ];

    function isNegated(text, word) {
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`${escaped}.{0,5}(없|아니|안\\s*해|안\\s*나|괜찮)`).test(text);
    }

    function makeScenario(data, ageInfo) {
        const ageMonths = Number.isInteger(ageInfo?.value) ? ageInfo.value : null;
        return { ageMonths, checks: GENERAL_CHECKS, patterns: [], ...data };
    }

    function analyzeComplexQuestion(query, ageInfo = null) {
        const text = normalizeSiteSearch(query);
        if (!text) return null;

        if (/(열성?\s*경련|열경련|경련|발작|몸.{0,8}(떨|뻣뻣)|눈.{0,6}(돌아|뒤집)|의식.{0,6}(잃|없))/.test(text)) {
            return makeScenario({
                id: 'febrile-seizure',
                badge: '경련 행동 순서',
                title: '경련 중이면 시간을 재고 다치지 않게 한 뒤 119 기준을 확인하세요',
                lead: '열성경련은 주로 생후 6개월~5세에 나타나지만, 화면만으로 열성경련인지 다른 경련인지 구분할 수 없습니다. 처음 경련이라면 멈췄어도 의료진 평가가 필요합니다.',
                clues: ['경련·발작 표현', /(열|발열|체온)/.test(text) ? '열 동반 가능성' : '체온 정보 없음'],
                steps: [
                    ['시간 재기', '시작 시각을 보고 경련이 몇 분 이어지는지 잽니다.'],
                    ['다치지 않게 하기', '바닥이나 침대의 평평한 곳에 두고 주변 단단한 물건을 치운 뒤 머리를 보호하고 얼굴·몸을 옆으로 향하게 합니다.'],
                    ['호흡과 회복 보기', '입술색·숨쉬기와 경련 뒤 평소처럼 깨어나는지를 봅니다. 입에 손가락·물·약·숟가락을 넣지 말고 몸을 누르지 마세요.']
                ],
                emergency: '처음 경련, 5분 이상 지속, 숨쉬기 어려움·청색 변화, 몸 한쪽만 떨림, 24시간 안에 반복, 경련 뒤 1시간 넘게 평소보다 매우 졸리거나 회복하지 못하면 119를 이용하세요.',
                today: '경련이 5분 안에 멈추고 회복해도 처음 경련이거나 열의 원인이 불분명하면 같은 날 의료진에게 확인받으세요.',
                home: '경련 중 찬물로 닦거나 옷을 모두 벗겨 열을 급히 내리지 마세요. 해열제는 불편을 줄일 수 있지만 열성경련을 확실히 예방하지는 못합니다. 처방받은 경련 계획이 있다면 그 계획을 우선하세요.',
                checks: [],
                links: [SOURCES.seizureAap, SOURCES.seizureNhs, SOURCES.emergency],
                relatedHrefs: ['blog/baby-fever-cold-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(물에\s*빠|물속에\s*(잠|가라앉)|욕조.{0,12}(잠|빠|가라앉)|수영장.{0,12}(잠|빠|가라앉)|익수|물\s*먹고.{0,12}(기침|숨|처|파래))/.test(text)) {
            return makeScenario({
                id: 'drowning',
                badge: '물에 빠졌을 때 행동 순서',
                title: '물에서 안전하게 나온 뒤 반응과 정상 호흡을 확인하고 바로 119에 연결하세요',
                lead: '물에 빠진 뒤에는 겉으로 깨어 보여도 호흡 문제가 이어질 수 있습니다. 구조자가 다시 위험해지지 않는 범위에서 물 밖으로 옮기고, 물을 빼려 하기보다 호흡을 먼저 봅니다.',
                clues: ['물에 빠짐·물 흡입 표현', /(기침|숨|파래|처짐)/.test(text) ? '호흡·반응 변화 언급' : '현재 호흡 정보 없음'],
                steps: [
                    ['안전하게 물 밖으로', '구조자가 위험한 물에 직접 들어가지 말고 구조 장비나 주변 도움을 우선합니다. 물 밖으로 나온 아이를 단단하고 평평한 곳에 둡니다.'],
                    ['반응·호흡 10초 이내 확인', '부르거나 발바닥을 가볍게 자극해 반응을 보고, 정상적으로 숨 쉬는지 10초를 넘기지 않고 확인합니다. 헐떡임은 정상 호흡이 아닙니다.'],
                    ['119 지시에 따라 소생술', '반응이 없고 정상 호흡이 없으면 119를 스피커폰으로 연결해 즉시 심폐소생술을 시작합니다. 익수 심정지는 가능하면 인공호흡을 포함한 소생술이 중요합니다.']
                ],
                emergency: '반응 없음, 정상 호흡 없음·헐떡임, 파래짐, 심한 호흡곤란은 즉시 119입니다. 인공호흡이나 심폐소생술이 한 번이라도 필요했다면 회복해 보여도 병원 평가가 필요합니다.',
                today: '계속되는 기침·빠른 숨·가슴 통증·구토·이상한 졸림 또는 행동 변화가 있으면 바로 응급실에서 확인받으세요.',
                home: '아이를 거꾸로 들거나 배를 눌러 물을 빼려 하지 마세요. 정상 호흡이 있고 반응하면 옆으로 눕혀 호흡을 계속 확인하고 젖은 옷을 벗겨 따뜻하게 합니다.',
                checks: [],
                links: [SOURCES.drowning, SOURCES.drowningAap, SOURCES.childCpr, SOURCES.emergency],
                relatedHrefs: ['blog/baby-safety-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(질식|기도.{0,5}(막|폐쇄)|목에.{0,8}(걸|막)|음식.{0,8}(걸|막)|숨.{0,5}못.{0,3}쉬|울음.{0,5}소리.{0,5}(안|못))/.test(text)) {
            const underOne = Number.isInteger(ageInfo?.value) && ageInfo.value < 12;
            return makeScenario({
                id: 'choking',
                badge: '질식 행동 순서',
                title: '소리 내어 기침하지 못하고 숨·울음이 막히면 바로 질식 응급처치를 시작하세요',
                lead: '크게 기침하거나 울 수 있으면 기침을 계속하게 지켜봅니다. 기침이 조용하거나 숨·말·울음이 나오지 않고 파래지면 심한 기도 막힘으로 보고 즉시 행동합니다.',
                clues: ['질식·목 막힘 표현', underOne ? '12개월 미만 방법 적용' : '개월 수에 맞는 방법 확인'],
                steps: [
                    ['119 연결', '주변에 도움을 요청하고 휴대전화를 스피커폰으로 켜 119 안내를 받습니다.'],
                    ['등 두드리기 5회', '아이를 앞으로 기울여 견갑골 사이를 손바닥 아랫부분으로 최대 5회 두드립니다.'],
                    ['나이에 맞게 5회', underOne ? '12개월 미만은 가슴 밀어올리기 5회를 번갈아 반복합니다. 배를 밀어올리지 마세요.' : '12개월 이상은 배 밀어올리기 5회를 번갈아 반복합니다. 의식을 잃으면 단단한 바닥에서 119 지시에 따라 심폐소생술을 시작합니다.']
                ],
                emergency: '숨·말·울음이 나오지 않음, 파래짐, 축 늘어짐은 즉시 119입니다. 물건이 나오거나 구조대가 올 때까지 5회씩 번갈아 시행합니다.',
                today: '물건이 나온 뒤에도 남은 조각이나 처치 중 손상이 있을 수 있어 의료진 확인을 받으세요.',
                home: '소리 내어 기침하는 아이의 입을 억지로 벌리거나 보이지 않는 물건을 손가락으로 휘젓지 마세요. 흡인 기구가 표준 응급처치를 늦추게 하지 마세요.',
                checks: [],
                links: [SOURCES.choking, SOURCES.chokingNhs, SOURCES.emergency],
                relatedHrefs: ['blog/complementary-feeding-allergy-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(감전|전기.{0,10}(닿|먹|통|찌릿)|콘센트.{0,12}(손|젓|만지|감전)|(전선|전기\s*코드|충전기).{0,12}(물|입|물어|감전)|번개.{0,8}(맞|감전))/.test(text)) {
            return makeScenario({
                id: 'electric-shock',
                badge: '감전 행동 순서',
                title: '전원을 끄기 전에는 아이를 직접 만지지 말고 안전이 확보된 뒤 호흡을 확인하세요',
                lead: '전기는 겉에 작은 자국만 보여도 몸 안에 손상을 줄 수 있습니다. 먼저 구조자가 감전되지 않게 전원을 차단해야 합니다.',
                clues: ['감전·전기 접촉 표현', /(화상|그을|탄|입|입술)/.test(text) ? '화상 가능성 언급' : '화상 정보 없음'],
                steps: [
                    ['전원부터 차단', '차단기·플러그로 전원을 끕니다. 전원이 확실히 끊기기 전에는 아이·전선·젖은 바닥을 손으로 만지지 않습니다.'],
                    ['반응·호흡 확인', '안전해진 뒤 아이를 부르고 정상 호흡을 확인합니다. 반응이 없거나 정상적으로 숨 쉬지 않으면 119를 스피커폰으로 연결합니다.'],
                    ['119 지시 따르기', '정상 호흡이 없으면 119 지시에 따라 심폐소생술을 시작하고, 보이는 화상은 마른 깨끗한 천으로 느슨하게 덮습니다.']
                ],
                emergency: '반응 없음·호흡 이상, 경련, 가슴 통증·두근거림, 고압 전기·번개, 얼굴·입안 화상 또는 큰 화상은 즉시 119입니다.',
                today: '가정용 전기에 닿은 뒤에도 통증·저림·화상·힘 빠짐·평소와 다른 행동이 있으면 바로 의료진 평가를 받으세요.',
                home: '전기가 연결된 아이를 맨손이나 젖은 물건으로 떼어내지 마세요. 화상에 얼음·연고·치약을 바르거나 입안 전기 화상 자국을 건드리지 마세요.',
                checks: [],
                links: [SOURCES.childAccident, SOURCES.childCpr, SOURCES.emergency],
                relatedHrefs: ['blog/baby-safety-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(화상|데였|뜨거운.{0,12}(물|국|커피|차|냄비|기름).{0,8}(쏟|닿|엎)|불에.{0,8}(닿|탔)|열탕)/.test(text)) {
            return makeScenario({
                id: 'burn-scald',
                badge: '화상·데임 행동 순서',
                title: '옷을 벗기느라 늦추지 말고 화상 부위를 흐르는 시원한 물로 20분 식히세요',
                lead: '처음 20분의 흐르는 물 냉각이 가장 중요합니다. 아이 전체가 차가워지지 않게 화상 부위만 식히고, 피부에 붙은 옷은 떼지 않습니다.',
                clues: ['화상·뜨거운 물 접촉 표현', /(얼굴|목|손|발|성기|관절|넓|물집)/.test(text) ? '중요 부위·물집 가능성 언급' : '부위·크기 정보 없음'],
                steps: [
                    ['열원에서 벗어나기', '불·뜨거운 물·기름에서 안전하게 벗어나고, 피부에 붙지 않은 옷·기저귀·장신구는 조심히 제거합니다.'],
                    ['흐르는 물 20분', '화상 부위를 흐르는 시원한 수돗물로 20분 식힙니다. 아이의 나머지 몸은 담요 등으로 따뜻하게 해 저체온을 막습니다.'],
                    ['식힌 뒤 느슨하게 덮기', '깨끗하고 보풀이 없는 천이나 랩을 상처 위에 느슨하게 올립니다. 얼굴에는 랩을 사용하지 않고, 물집은 터뜨리지 않습니다.']
                ],
                emergency: '호흡곤란·연기 흡입, 전기·화학 화상, 희거나 검게 탄 깊은 화상, 넓은 화상, 얼굴·목·손·발·성기·큰 관절 화상은 119·응급실을 우선하세요.',
                today: '아이 손바닥보다 크거나 물집이 생김, 통증이 심함, 부위·깊이를 판단하기 어려우면 냉각 후 당일 의료진에게 확인받으세요.',
                home: '얼음·얼음물, 버터·치약·된장·연고·오일을 바르지 말고 붙은 옷을 떼거나 물집을 터뜨리지 마세요.',
                checks: [],
                links: [SOURCES.burns, SOURCES.childAccident, SOURCES.emergency],
                relatedHrefs: ['blog/baby-safety-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(눈|눈동자|안구).{0,12}(세제|락스|표백제|세정제|샴푸|비누|화학|약품|스프레이|접착제).{0,12}(들어|튀|묻|닿)|(세제|락스|표백제|세정제|화학|약품).{0,12}(눈|안구).{0,8}(들어|튀|묻)/.test(text)) {
            const mildEyeProduct = /(샴푸|비누)/.test(text) && !/(락스|표백제|세정제|화학|약품|접착제)/.test(text);
            return makeScenario({
                id: 'eye-chemical',
                badge: '눈에 화학물질 행동 순서',
                title: mildEyeProduct ? '샴푸·비누가 눈에 들어갔다면 미지근한 흐르는 물로 바로 충분히 씻으세요' : '무슨 제품인지 찾기 전에 눈을 미지근한 흐르는 물로 바로 씻기 시작하세요',
                lead: mildEyeProduct ? '샴푸·비누는 대개 충분히 씻어내면 좋아지지만 통증·눈물·시야 이상이 남는지 확인해야 합니다.' : '강한 산·알칼리나 정체를 모르는 물질은 시력을 손상시킬 수 있어 즉시 세척이 우선입니다. 제품 확인 때문에 물로 씻는 일을 늦추지 않습니다.',
                clues: ['눈에 세제·화학물질 노출 표현', '제품·통증·시야 확인 필요'],
                steps: [
                    ['즉시 물로 씻기', mildEyeProduct ? '눈꺼풀을 가능한 범위에서 벌리고 미지근한 흐르는 물로 몇 분간 충분히 씻습니다.' : '눈꺼풀을 가능한 범위에서 벌리고 미지근한 흐르는 물로 20분 충분히 씻습니다.'],
                    ['다른 눈으로 흐르지 않게', '다친 눈을 아래쪽으로 향하게 하고 물이 코 쪽에서 바깥쪽으로 흐르게 합니다. 콘택트렌즈는 쉽게 빠질 때만 제거합니다.'],
                    ['제품 들고 진료', '용기·성분표를 가져가되 세척을 중단하지 않습니다. 강한 세정제·배수관/오븐 세정제 또는 모르는 물질이면 세척 뒤 바로 응급실로 갑니다.']
                ],
                emergency: '시야 흐림·심한 통증, 눈을 뜨지 못함, 강한 산·알칼리·정체 불명 화학물질 노출은 씻으면서 119 안내를 받고 응급실로 가세요.',
                today: '충분히 씻은 뒤에도 통증·눈물·깜박임·시야 이상이 남거나 붉음이 심하면 바로 의료진에게 확인받으세요.',
                home: '눈을 비비거나 중화하려고 다른 액체를 넣지 마세요. 임의 안약·식염수 준비 때문에 수돗물 세척을 늦추지 마세요.',
                checks: [],
                links: [SOURCES.eyeChemical, SOURCES.emergency],
                relatedHrefs: ['blog/baby-safety-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/((약|세제|락스|세정제|살충제|화장품|니코틴|전자담배|건전지|배터리|자석).{0,14}(먹|마시|삼키|삼켰|삼킴|빨|입에)|중독|잘못.{0,8}(먹|삼켰))/.test(text)) {
            const battery = /(버튼형?\s*건전지|단추형?\s*건전지|배터리|건전지)/.test(text);
            return makeScenario({
                id: 'poisoning',
                badge: '중독·삼킴 행동 순서',
                title: battery ? '버튼형 건전지·배터리는 증상이 없어도 바로 응급실로 가세요' : '무엇을 얼마나 삼켰는지 몰라도 토하게 하지 말고 바로 119에 문의하세요',
                lead: '중독은 제품마다 대처가 다릅니다. 증상이 생길 때까지 기다리지 말고 제품 용기와 성분표를 확보해 119 안내를 받으세요.',
                clues: [battery ? '건전지·배터리 가능성' : '약·생활제품 삼킴 가능성', '제품·양·시각 확인 필요'],
                steps: [
                    ['입에서 치우기', '남은 물질을 뱉게 하고 입 주변을 닦되, 목 안을 손가락으로 휘젓지 않습니다.'],
                    ['제품 확보', '용기·제품명·성분·남은 양과 발견 시각을 사진 또는 실물로 준비합니다.'],
                    ['119 문의', '아이 개월 수·몸무게, 물질·예상 양·시각, 현재 호흡과 반응을 말하고 안내를 따릅니다.']
                ],
                emergency: '의식 저하·호흡 이상·경련은 즉시 119입니다. 버튼형 건전지는 아무 증상이 없어도 식도 손상 위험 때문에 바로 응급실 평가가 필요합니다.',
                today: '무엇을 삼켰는지 불명확하거나 약·세제·니코틴·자석 가능성이 있으면 증상을 기다리지 말고 즉시 전문 안내를 받으세요.',
                home: '억지로 토하게 하거나 우유·물·소금물·민간요법을 임의로 먹이지 마세요. 제품별로 조치가 달라 119 지시를 우선합니다.',
                checks: [],
                links: [SOURCES.poison, SOURCES.emergency],
                relatedHrefs: ['blog/baby-safety-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/((코|콧구멍|귀|귓구멍).{0,14}(이물|이물질|뭔가|무언가|뭘|구슬|콩|장난감|휴지|건전지|배터리|자석).{0,8}(들어|넣|박|끼)|((이물|이물질|뭔가|무언가|구슬|콩|장난감|휴지|건전지|배터리|자석).{0,12}(코|콧구멍|귀|귓구멍).{0,8}(들어|넣|박|끼)))/.test(text)) {
            const battery = /(건전지|배터리)/.test(text);
            return makeScenario({
                id: 'nose-ear-object',
                badge: '코·귀 이물질 행동 순서',
                title: battery ? '코나 귀에 건전지가 들어갔다면 증상이 없어도 바로 응급실로 가세요' : '코나 귀에 단단히 들어간 물건은 집에서 빼려 하지 말고 그대로 진료받으세요',
                lead: '핀셋·면봉으로 잡으려 하면 더 깊이 밀리거나 손상될 수 있습니다. 특히 버튼형 건전지는 짧은 시간에도 화학 화상을 만들 수 있습니다.',
                clues: [battery ? '건전지·배터리 가능성' : '코·귀 이물질 표현', '위치·물건·시각 확인 필요'],
                steps: [
                    ['더 밀지 않기', '보이는 물건을 핀셋·면봉·손가락으로 건드리거나 아이가 코를 세게 들이마시게 하지 않습니다.'],
                    ['호흡과 출혈 확인', '코가 막혔다면 입으로 숨 쉬게 하고, 숨쉬기 어려움·심한 출혈·통증이 있는지 확인합니다.'],
                    ['그대로 의료기관으로', '물건을 넣은 시각과 종류를 확인하고 가까운 응급실이나 진료기관에서 제거받습니다. 건전지는 포장이나 같은 제품을 가져갑니다.']
                ],
                emergency: battery ? '버튼형 건전지·배터리는 코나 귀에 있어도 즉시 응급실입니다. 호흡곤란·심한 출혈·의식 변화가 있으면 119를 부르세요.' : '호흡곤란, 물건이 기도로 넘어간 의심, 심한 출혈·극심한 통증은 즉시 119·응급실을 우선하세요.',
                today: '단단히 끼었거나 보이지 않음, 통증·냄새 나는 분비물·출혈이 있으면 같은 날 의료진에게 제거받으세요.',
                home: '물·기름·접착제를 넣거나 자석으로 빼려 하지 마세요. 성공할 것 같아도 여러 번 시도하지 말고 아이가 물건을 더 밀지 않게 지켜보세요.',
                checks: [],
                links: battery ? [SOURCES.childAccident, SOURCES.buttonBattery, SOURCES.emergency] : [SOURCES.childAccident, SOURCES.emergency],
                relatedHrefs: ['blog/baby-safety-guide.html', '#daily-tools']
            }, ageInfo);
        }

        const dayAgeMatch = text.match(/(?:생후\s*)?(\d{1,3})\s*일\s*(?:된|째|아기|아이)?/);
        const youngInfant = Number.isInteger(ageInfo?.value)
            ? ageInfo.value < 3
            : /(신생아|생후\s*(?:0|1|2)\s*개월|(?:0|1|2)\s*개월\s*(?:아기|아이))/.test(text)
                || (dayAgeMatch && Number(dayAgeMatch[1]) < 90);
        if (youngInfant && /(열|발열|고열|체온|뜨거워|뜨거운)/.test(text) && !isNegated(text, '열') && !isNegated(text, '체온')) {
            return makeScenario({
                id: 'young-infant-fever',
                badge: '3개월 미만 발열 행동 순서',
                title: '3개월 미만 아기가 38.0°C 이상이면 다른 증상이 없어도 바로 의료진 평가가 필요합니다',
                lead: '어린 아기는 겉으로 괜찮아 보여도 심한 감염을 구분하기 어려울 수 있습니다. 손으로 만진 느낌보다 체온계로 잰 값과 현재 상태를 확인합니다.',
                clues: ['3개월 미만', /38(?:\.0)?|38도/.test(text) ? '38°C 언급' : '정확한 체온 정보 없음'],
                steps: [
                    ['체온과 시각 기록', '체온계로 잰 값·측정 부위·측정 시각을 적고, 예방접종 시각과 복용한 약이 있다면 함께 확인합니다.'],
                    ['호흡·반응·수유 확인', '숨쉬기, 입술색, 깨웠을 때 반응, 수유량·구토와 마지막 젖은 기저귀 시각을 봅니다.'],
                    ['바로 의료진에게 연락', '38.0°C 이상이면 밤이나 다른 증상 유무와 관계없이 바로 소아 진료기관·응급실에 연락해 평가받습니다.']
                ],
                emergency: '숨쉬기 어려움·청색 변화, 깨우기 어려움·축 늘어짐, 경련, 눌러도 사라지지 않는 자주색 발진은 즉시 119입니다.',
                today: '3개월 미만에서 체온 38.0°C 이상은 해열 뒤 기다리는 항목이 아니라 바로 의료진 평가를 받아야 하는 기준입니다.',
                home: '찬물 목욕·알코올 마사지로 열을 내리지 마세요. 의료진과 상의하기 전 임의 해열제 용량을 정하거나 열이 내려가는지 보려고 진료를 미루지 마세요.',
                checks: [],
                links: [SOURCES.infantFever, SOURCES.seriousIllness, SOURCES.emergency],
                relatedHrefs: ['blog/baby-fever-cold-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(머리|이마|뒤통수|정수리).{0,16}(부딪|찧|다치|충격|혹)|넘어.{0,14}(머리|이마|뒤통수)/.test(text)) {
            return makeScenario({
                id: 'head-injury',
                badge: '머리 충격 행동 순서',
                title: '머리를 다친 뒤에는 잠을 못 자게 하기보다 반응·구토·행동 변화를 확인하세요',
                lead: '영아는 아픈 곳을 말하기 어려워 보호자가 본 평소와 다른 행동이 중요합니다. 충격 높이 하나만으로 괜찮다고 단정하지 않습니다.',
                clues: ['머리 충격·넘어짐 표현', /(토|구토)/.test(text) ? '구토 언급' : '구토 정보 없음', /(졸|잠|깨우)/.test(text) ? '졸림·깨우기 언급' : '반응 정보 없음'],
                steps: [
                    ['움직임 멈추기', '안전한 곳에 두고 목을 억지로 움직이지 않은 채 호흡과 반응을 봅니다.'],
                    ['변화 기록', '다친 시각·높이·바닥, 의식 소실 여부, 구토 횟수와 평소와 다른 행동을 적습니다.'],
                    ['계속 관찰', '잠드는 것 자체보다 깨웠을 때 평소처럼 반응하는지, 움직임·동공·말·보행이 평소와 같은지 봅니다.']
                ],
                emergency: '의식 소실, 깨우기 어려움, 경련, 한쪽 힘 빠짐, 반복 구토, 동공 크기 차이, 코·귀에서 피나 맑은 액, 심한 출혈은 119·응급실을 우선하세요.',
                today: '영아가 달래지지 않게 계속 울거나 먹지 못함, 행동이 평소와 다름, 구토·두통이 심해지면 바로 의료진 평가를 받으세요.',
                home: '억지로 계속 깨워 두거나 흔들지 마세요. 얼음은 천에 싸서 짧게 대고, 약은 의료진·약사에게 개월과 몸무게를 확인한 뒤 사용하세요.',
                links: [SOURCES.head, SOURCES.emergency],
                relatedHrefs: ['blog/baby-safety-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(심한\s*출혈|피가.{0,12}(안\s*멈|멈추지|계속|많이|솟|분수)|상처.{0,12}(피|출혈).{0,10}(안\s*멈|멈추지|계속|많)|베였.{0,10}(피|출혈)|찢어졌.{0,10}(피|출혈)|유리.{0,10}(박|찔)|깊게.{0,8}(베|찢))/.test(text)) {
            const embedded = /(유리|못|칼|가시|물체).{0,12}(박|찔|꽂)/.test(text);
            return makeScenario({
                id: 'severe-bleeding',
                badge: '심한 출혈 행동 순서',
                title: '깨끗한 천으로 상처를 계속 세게 눌러 지혈하면서 119 기준을 확인하세요',
                lead: '피가 많이 날 때는 상처를 반복해서 들춰보지 말고 지속적인 압박이 우선입니다. 박힌 물체는 뽑으면 출혈이 더 심해질 수 있습니다.',
                clues: ['계속되거나 많은 출혈 표현', embedded ? '박힌 물체 가능성' : '박힌 물체 정보 없음'],
                steps: [
                    ['눕히고 압박', embedded ? '아이를 안전하게 눕히고 박힌 물체를 누르지 않도록 주변을 깨끗한 천으로 단단히 압박합니다.' : '아이를 안전하게 눕히고 상처 위에 깨끗하고 보풀이 적은 천을 대어 손바닥으로 단단히 누릅니다.'],
                    ['계속 누르기', '중간에 천을 들어 확인하지 말고 계속 압박합니다. 피가 배어나오면 기존 천을 떼지 말고 그 위에 새 천을 더 댑니다.'],
                    ['119 연결', '피가 솟거나 빠르게 천을 적심, 계속 압박해도 멈추지 않음, 창백·식은땀·축 처짐이 있으면 119를 부릅니다.']
                ],
                emergency: '분수처럼 솟는 피, 빠르게 젖는 천, 절단, 목·가슴·배의 깊은 상처, 창백·차고 축축한 피부·반응 저하는 즉시 119입니다.',
                today: '상처가 벌어짐·깊음, 얼굴·손·관절 부위, 유리 등 이물이 남음, 사람·동물에게 물림, 오염된 상처는 당일 진료와 파상풍 접종 확인이 필요합니다.',
                home: '박힌 물체를 빼거나 상처 깊숙이 소독약을 붓지 마세요. 지혈대를 임의로 사용하지 말고 119 지시가 있다면 그대로 따르세요.',
                checks: [],
                links: [SOURCES.childAccident, SOURCES.emergency],
                relatedHrefs: ['blog/baby-safety-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(알레르기|두드러기|입술.{0,6}붓|혀.{0,6}붓|목.{0,6}(붓|조여)|얼굴.{0,6}붓|아나필락시스)/.test(text)) {
            return makeScenario({
                id: 'allergic-reaction',
                badge: '알레르기 행동 순서',
                title: '입술·혀·목이 붓거나 숨쉬기 어렵고 축 늘어지면 아나필락시스 가능성으로 119입니다',
                lead: '심한 알레르기 반응은 피부 발진 없이도 나타날 수 있습니다. 새 음식·약 뒤 빠르게 생긴 호흡·부종·반응 변화를 먼저 봅니다.',
                clues: ['알레르기·부종·두드러기 표현', /(음식|먹|이유식|약)/.test(text) ? '음식·약 노출 가능성' : '노출 물질 정보 없음'],
                steps: [
                    ['노출 중단', '먹던 음식·약·제품을 치우고 시작 시각과 노출 물질을 확인합니다.'],
                    ['처방 계획 실행', '의료진이 준 아드레날린 자가주사와 행동 계획이 있다면 지시에 따라 즉시 사용합니다.'],
                    ['119 연결', '호흡·목·혀 부종, 반복 구토와 축 늘어짐 등 전신 반응이면 좋아지는지 기다리지 말고 119를 부릅니다.']
                ],
                emergency: '숨쉬기 힘듦·쌕쌕거림, 목·혀 부종, 삼키기 어려움, 창백·축 늘어짐·의식 저하는 즉시 119입니다.',
                today: '피부 증상만 있더라도 빠르게 번지거나 새 음식·약 뒤 발생했으면 당일 의료진에게 확인하고 다음 노출 계획을 정하세요.',
                home: '심한 반응을 항히스타민만 먹이고 기다리지 마세요. 임의로 다시 먹여 확인하지 말고 제품·음식 포장과 발생 시각을 보관하세요.',
                links: [SOURCES.allergy, SOURCES.rash, SOURCES.emergency],
                relatedHrefs: ['blog/complementary-feeding-allergy-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(숨|호흡|쌕쌕|천명|개\s*짖는|컹컹|크루프|갈비뼈|콧구멍).{0,18}(힘들|가쁘|빠르|소리|들어|꺼져|벌렁|이상)|청색|파랗/.test(text) && !isNegated(text, '숨')) {
            return makeScenario({
                id: 'breathing-distress',
                badge: '호흡 행동 순서',
                title: '갈비뼈가 들어가거나 파래지고 먹기 힘들 정도면 감기보다 호흡 상태가 먼저입니다',
                lead: '돌 전후에는 세기관지염·크루프·폐렴 등 여러 원인이 비슷하게 시작할 수 있어 기침 소리만으로 병명을 정하지 않습니다.',
                clues: ['호흡 이상 표현', /(개\s*짖|컹컹|크루프)/.test(text) ? '개 짖는 듯한 기침·크루프 단서' : '원인 미확정'],
                steps: [
                    ['아이를 진정시키기', '울면 숨소리가 더 심해질 수 있어 편한 자세로 안고 조용히 진정시킵니다.'],
                    ['호흡 보기', '가만히 있을 때 갈비뼈 사이·목 아래가 들어가는지, 콧구멍 벌렁임·숨 멈춤·입술색을 봅니다.'],
                    ['수유 가능 확인', '숨 때문에 마시지 못하는지, 소변이 줄고 축 처지는지 함께 확인합니다.']
                ],
                emergency: '심한 가슴 함몰, 파란 입술·피부, 숨 멈춤, 깨우기 어려움, 숨 때문에 울거나 먹지 못함은 즉시 119입니다.',
                today: '쌕쌕거림·거친 들숨 소리가 가만히 있을 때도 나거나 숨이 평소보다 빠르고 수유가 줄면 당일 진료를 우선하세요.',
                home: '코막힘은 생리식염수와 부드러운 코 관리가 도움 될 수 있습니다. 뜨거운 증기·임의 감기약·진정제를 사용하거나 억지로 눕히지 마세요.',
                links: [SOURCES.bronchiolitis, SOURCES.breathing, SOURCES.seriousIllness, SOURCES.emergency],
                relatedHrefs: ['blog/baby-fever-cold-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(구토|토해|토했|설사|묽은\s*변).{0,28}(소변|기저귀|눈물|못\s*먹|안\s*먹|축\s*처|졸|탈수)|(소변|기저귀|눈물).{0,20}(줄|없|안).{0,20}(구토|설사)/.test(text)) {
            return makeScenario({
                id: 'gastro-dehydration',
                badge: '구토·설사 행동 순서',
                title: '구토·설사 때는 횟수보다 마실 수 있는지와 소변·반응을 먼저 보세요',
                lead: '돌 전후 영유아는 구토·설사로 탈수가 빨리 진행될 수 있습니다. 병명을 맞히기보다 수분을 유지할 수 있는지 확인합니다.',
                clues: ['구토·설사 표현', '수분·소변·반응 걱정'],
                steps: [
                    ['조금씩 자주', '토한 뒤 잠깐 쉬었다가 경구수분보충액이나 평소 수유를 한 번에 많이 말고 조금씩 자주 줍니다.'],
                    ['들어오고 나간 것 기록', '마신 양, 구토·설사 횟수, 마지막 소변 시각과 눈물·입 마름·반응을 적습니다.'],
                    ['위험한 색 확인', '초록색 구토, 피 섞인 구토·변, 심하게 불러오거나 아픈 배가 있는지 봅니다.']
                ],
                emergency: '깨우기 어려움, 매우 창백·파래짐, 숨이 빠르고 힘듦, 축 늘어져 마시지 못함은 119·응급실을 우선하세요.',
                today: '소변이 뚜렷하게 줄거나 눈물 없음·입 마름, 마시는 것마다 토함, 초록색 구토·혈변·심한 복통이 있으면 당일 진료를 받으세요.',
                home: '과일주스·탄산음료는 설사를 악화시킬 수 있습니다. 지사제·구토약·전해질 분말 농도를 임의로 정하지 말고 제품 표시와 의료진 안내를 따르세요.',
                links: [SOURCES.gastro, SOURCES.dehydration, SOURCES.seriousIllness],
                relatedHrefs: ['blog/complementary-feeding-allergy-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(열|발열|고열|체온).{0,30}(발진|반점|수포|두드러기)|(발진|반점|수포).{0,24}(열|발열|고열)/.test(text)) {
            return makeScenario({
                id: 'fever-rash',
                badge: '열·발진 행동 순서',
                title: '열과 발진이 함께 있으면 발진 이름보다 반응·호흡·눌렀을 때 색을 먼저 보세요',
                lead: '돌발진·수족구·다른 바이러스 발진처럼 흔한 원인도 있지만 사진만으로 구분하지 않습니다. 아이가 아파 보이는 정도와 위험 신호가 우선입니다.',
                clues: ['열 표현', '발진·반점·수포 표현'],
                steps: [
                    ['반응·호흡 확인', '깨우면 평소처럼 반응하는지, 숨이 힘들거나 입술·혀가 붓지 않는지 봅니다.'],
                    ['투명컵으로 눌러 보기', '붉거나 자주색 반점이 투명컵으로 눌러도 흐려지지 않는지 확인합니다.'],
                    ['위치와 순서 기록', '열이 먼저였는지 발진이 먼저였는지, 입안·손·발·몸통 중 어디서 시작했는지 적습니다.']
                ],
                emergency: '눌러도 사라지지 않는 자주색·멍 같은 발진과 아픈 모습, 목 경직·빛을 싫어함, 호흡곤란·입술·혀 부종, 깨우기 어려움은 즉시 119입니다.',
                today: '잘 마시지 못함·소변 감소, 입안 통증 때문에 수분을 못 먹음, 고열과 처짐, 빠르게 번지는 발진은 당일 진료를 우선하세요.',
                home: '돌발진은 흔히 고열 뒤 열이 내리며 몸통 발진이 나타나고, 수족구는 입안·손·발 수포가 단서가 될 수 있지만 이 패턴만으로 확진하지 마세요.',
                patterns: [
                    ['돌발진', '6개월~2세에 흔하며 3~5일 고열 뒤 열이 내리면서 몸통 중심 발진이 나타날 수 있습니다.'],
                    ['수족구', '열·목 불편 뒤 입안, 손바닥·발바닥·엉덩이에 작은 수포가 나타날 수 있습니다. 수분 섭취가 핵심입니다.']
                ],
                links: [SOURCES.rash, SOURCES.roseola, SOURCES.hfmd, SOURCES.emergency],
                relatedHrefs: ['blog/baby-fever-cold-guide.html', '#daily-tools']
            }, ageInfo);
        }

        if (/(첫\s*돌|돌\s*전후|돌\s*무렵|12\s*개월).{0,24}(질환|질병|병|아프|감염|자주)/.test(text)) {
            return makeScenario({
                id: 'around-one-illness',
                badge: '돌 전후 질환 길잡이',
                title: '돌 전후에는 병 이름보다 숨·반응·수분 상태를 먼저 확인하세요',
                lead: '6~24개월에는 돌발진·수족구·크루프·세기관지염·장염처럼 흔한 감염을 자주 겪을 수 있습니다. 증상이 겹치므로 검색만으로 병명을 확정하지 않습니다.',
                clues: ['첫돌·12개월 전후', '흔한 질환과 행동 순서 질문'],
                steps: [
                    ['숨', '갈비뼈가 들어감·파래짐·숨 멈춤·가만히 있어도 거친 숨소리가 있는지 봅니다.'],
                    ['반응', '깨우면 평소처럼 보고 움직이는지, 경련·심한 처짐·달래지지 않는 울음이 있는지 봅니다.'],
                    ['수분', '마실 수 있는지, 마지막 소변 시각과 눈물·입 마름, 반복 구토·설사를 확인합니다.']
                ],
                emergency: '호흡곤란·청색 변화, 깨우기 어려움, 첫 경련·5분 이상 경련, 심한 알레르기, 눌러도 사라지지 않는 자주색 발진은 119를 우선하세요.',
                today: '잘 먹지 못하고 소변이 줄거나, 고열과 처짐, 가만히 있어도 거친 숨, 초록색 구토·혈변·심한 통증이 있으면 당일 진료를 받으세요.',
                home: '체온·시작 시각·수유/물·소변·구토/설사·발진 위치를 짧게 기록하세요. 항생제·해열제 용량과 병명을 카페 사진만으로 정하지 마세요.',
                patterns: [
                    ['돌발진', '3~5일 고열 뒤 열이 내리며 몸통 중심 발진이 나타날 수 있습니다.'],
                    ['수족구', '입안 통증과 손·발·엉덩이 수포가 나타날 수 있어 수분 섭취를 봅니다.'],
                    ['크루프', '개 짖는 듯한 기침·쉰 목소리·들이쉴 때 거친 소리가 단서입니다. 가만히 있어도 소리가 나면 진료를 서두릅니다.'],
                    ['세기관지염', '콧물·기침 뒤 쌕쌕거림·빠른 숨·가슴 함몰·수유 감소가 나타날 수 있습니다.'],
                    ['바이러스 장염', '구토·설사 때 소변 감소·눈물 없음·처짐 같은 탈수를 우선 확인합니다.']
                ],
                links: [SOURCES.seriousIllness, SOURCES.roseola, SOURCES.hfmd, SOURCES.breathing, SOURCES.bronchiolitis, SOURCES.gastro],
                relatedHrefs: ['blog/baby-fever-cold-guide.html', 'blog/complementary-feeding-allergy-guide.html', '#daily-tools']
            }, ageInfo);
        }

        const suddenCrying = /(갑자기|갑작스럽|느닷없이|평소와\s*다르).{0,30}(울|보채|칭얼)|(울|보채|칭얼).{0,24}(갑자기|심하|계속|멈추지|안\s*멈|달래도|달래지)/.test(text);
        if (suddenCrying) {
            const teething = /(이앓|윗니|아랫니|첫니|젖니|이가\s*(?:나|났|날|올라)|이빨\s*(?:나|났)|치아\s*(?:나|났|올라)|잇몸\s*(?:붓|아프|간지))/.test(text);
            const fed = /(밥|이유식|분유|모유|수유|우유).{0,10}(먹|했|마셨)|먹고/.test(text);
            const slept = /(잠|낮잠|밤잠).{0,10}(잤|자고|들었|잠)|잤어/.test(text);
            const clues = ['갑자기 심하게 울음'];
            if (teething) clues.push('이가 나는 중');
            if (fed) clues.push('이미 먹음');
            if (slept) clues.push('이미 잠을 잠');
            return makeScenario({
                id: 'sudden-crying',
                badge: '갑작스러운 울음 행동 순서',
                title: '갑자기 심하게 울면 원인을 맞히기보다 위험 신호부터 확인하세요',
                lead: (fed && slept ? '먹고 잠도 잤다는 정보는 도움이 되지만 다른 불편을 완전히 제외할 수는 없습니다. ' : '') + (teething ? '이가 나는 중이면 가벼운 잇몸 불편이 겹칠 수 있지만 심하거나 달래지지 않는 울음을 이앓이로만 돌리지 마세요.' : '울음만으로 원인을 하나로 정할 수는 없습니다.'),
                clues,
                steps: [
                    ['달래지는지 보기', '안아 주거나 조용한 곳으로 옮겼을 때 잠깐이라도 멈추는지 봅니다.'],
                    ['몸 전체 확인', '체온·숨·피부색·반응, 구토·발진·소변, 다친 일과 옷·기저귀·손발가락의 조임을 확인합니다.'],
                    ['시작과 지속 기록', '언제 시작했고 얼마나 이어지는지, 만지거나 움직일 때 더 아파하는 곳이 있는지 적습니다.']
                ],
                emergency: '숨쉬기 힘듦·파랗거나 매우 창백함, 축 늘어짐·깨우기 어려움, 경련 또는 큰 부상이 의심되면 바로 119를 이용하세요.',
                today: '평소와 다른 울음이 달래지지 않거나 2시간 이상 계속됨, 통증 의심, 잘 마시지 못함·소변 감소, 열·반복 구토·새 발진이 있으면 당일 진료를 우선하세요.',
                home: teething ? '조용히 안아 달래고 잇몸은 깨끗한 손가락으로 부드럽게 문지르거나 냉장고에서 차갑게 한 치발기를 써볼 수 있습니다. 목걸이·마취 젤·임의 진통제 용량은 피하세요.' : '한 번에 한 가지 방법으로 달래고, 보호자가 감당하기 어려우면 아이를 안전한 수면 공간에 눕힌 뒤 다른 어른에게 도움을 요청하세요. 절대 흔들지 마세요.',
                links: teething ? [SOURCES.crying, SOURCES.cryingNhs, SOURCES.teething, SOURCES.emergency] : [SOURCES.crying, SOURCES.cryingNhs, SOURCES.emergency],
                relatedHrefs: teething ? ['blog/baby-fever-cold-guide.html', 'market/toddler-toothbrush-guide.html#standard', '#daily-tools'] : ['blog/baby-fever-cold-guide.html', '#daily-tools']
            }, ageInfo);
        }

        return null;
    }

    function addTextElement(parent, tag, className, text) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        element.textContent = text;
        parent.appendChild(element);
        return element;
    }

    function renderChecks(container, scenario, answerState) {
        if (!scenario.checks.length) return;
        const panel = document.createElement('section');
        panel.className = 'urgent-check-panel';
        panel.setAttribute('aria-labelledby', 'urgentCheckTitle');
        addTextElement(panel, 'h4', '', '빠진 정보 3가지만 확인해 주세요').id = 'urgentCheckTitle';
        const result = addTextElement(panel, 'p', 'urgent-check-result', '선택하면 지금 도움 수준을 다시 표시합니다.');
        result.setAttribute('aria-live', 'polite');

        function updateResult() {
            const values = [...answerState.values()];
            if (values.some(value => value === 'emergency')) {
                result.className = 'urgent-check-result urgent-check-result--emergency';
                result.textContent = '하나라도 숨·색·반응이 평소와 다르면 온라인 확인을 멈추고 119 도움을 우선하세요.';
            } else if (values.some(value => value === 'today')) {
                result.className = 'urgent-check-result urgent-check-result--today';
                result.textContent = '마시기·소변이 평소와 다르면 오늘 의료진에게 확인하는 쪽이 안전합니다.';
            } else if (answerState.size === scenario.checks.length) {
                result.className = 'urgent-check-result urgent-check-result--checked';
                result.textContent = '세 항목은 평소와 같다고 선택했습니다. 그래도 상태가 악화되거나 보호자가 위험하다고 느끼면 진료를 우선하세요.';
            } else {
                result.className = 'urgent-check-result';
                result.textContent = '선택하면 지금 도움 수준을 다시 표시합니다.';
            }
        }

        scenario.checks.forEach(check => {
            const row = document.createElement('div');
            row.className = 'urgent-check-row';
            const prompt = addTextElement(row, 'span', 'urgent-check-prompt', check.prompt);
            const options = document.createElement('div');
            options.className = 'urgent-check-options';
            options.setAttribute('role', 'group');
            options.setAttribute('aria-label', check.prompt);
            [['네', 'yes'], ['아니요', check.noLevel]].forEach(([label, value]) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = label;
                button.setAttribute('aria-pressed', 'false');
                button.addEventListener('click', () => {
                    [...options.children].forEach(option => option.setAttribute('aria-pressed', 'false'));
                    button.setAttribute('aria-pressed', 'true');
                    answerState.set(check.id, value);
                    updateResult();
                });
                options.appendChild(button);
            });
            row.append(prompt, options);
            panel.appendChild(row);
        });
        container.appendChild(panel);
    }

    function renderScenarioCard(query, scenario) {
        developmentTimingCard.replaceChildren();
        developmentTimingCard.hidden = false;
        developmentTimingCard.classList.add('development-timing-card--direct', 'development-timing-card--urgent');
        developmentTimingCard.classList.remove('development-timing-card--scope');

        const head = document.createElement('div');
        head.className = 'development-timing-head';
        const badge = addTextElement(head, 'span', '', scenario.badge + (Number.isInteger(scenario.ageMonths) ? ' · ' + scenario.ageMonths + '개월' : ''));
        const title = addTextElement(head, 'h3', '', scenario.title);
        title.id = 'developmentTimingTitle';
        developmentTimingCard.appendChild(head);
        addTextElement(developmentTimingCard, 'p', 'official-answer-lead', scenario.lead);

        const understood = document.createElement('section');
        understood.className = 'urgent-understood';
        addTextElement(understood, 'strong', '', '제가 이해한 상황');
        const chips = document.createElement('div');
        chips.className = 'urgent-clue-list';
        scenario.clues.forEach(clue => addTextElement(chips, 'span', 'urgent-clue-chip', clue));
        understood.appendChild(chips);
        developmentTimingCard.appendChild(understood);

        const sequence = document.createElement('section');
        sequence.className = 'urgent-sequence';
        addTextElement(sequence, 'h4', '', '지금은 이 순서로 확인하세요');
        const list = document.createElement('ol');
        list.className = 'urgent-action-sequence';
        scenario.steps.forEach(([stepTitle, text], index) => {
            const item = document.createElement('li');
            item.className = 'urgent-action-step';
            addTextElement(item, 'span', 'urgent-step-number', String(index + 1));
            const content = document.createElement('div');
            addTextElement(content, 'strong', '', stepTitle);
            addTextElement(content, 'p', '', text);
            item.appendChild(content);
            list.appendChild(item);
        });
        sequence.appendChild(list);
        developmentTimingCard.appendChild(sequence);

        const tiers = document.createElement('div');
        tiers.className = 'urgent-tier-stack';
        [['바로 119', scenario.emergency, 'urgent-tier--emergency'], ['오늘 진료·상담', scenario.today, 'urgent-tier--today'], ['집에서 지킬 것', scenario.home, 'urgent-tier--home']].forEach(([tierTitle, text, className]) => {
            const section = document.createElement('section');
            section.className = 'urgent-tier ' + className;
            addTextElement(section, 'h4', '', tierTitle);
            addTextElement(section, 'p', '', text);
            tiers.appendChild(section);
        });
        developmentTimingCard.appendChild(tiers);

        const answerState = new Map();
        renderChecks(developmentTimingCard, scenario, answerState);

        if (scenario.patterns.length) {
            const details = document.createElement('details');
            details.className = 'urgent-details';
            addTextElement(details, 'summary', '', '돌 전후 흔한 증상 묶음 보기 · 병명 확정 아님');
            const patternList = document.createElement('div');
            patternList.className = 'urgent-pattern-list';
            scenario.patterns.forEach(([name, text]) => {
                const item = document.createElement('p');
                const strong = document.createElement('strong');
                strong.textContent = name + ' · ';
                item.append(strong, document.createTextNode(text));
                patternList.appendChild(item);
            });
            details.appendChild(patternList);
            developmentTimingCard.appendChild(details);
        }

        const copyArea = document.createElement('div');
        copyArea.className = 'urgent-copy-area';
        const copyButton = addTextElement(copyArea, 'button', 'urgent-copy-button', '의료진에게 보여줄 내용 복사');
        copyButton.type = 'button';
        const copyStatus = addTextElement(copyArea, 'span', 'urgent-copy-status', '아이 이름 없이 현재 기기에서만 만듭니다.');
        copyStatus.setAttribute('aria-live', 'polite');
        copyButton.addEventListener('click', async () => {
            const checkText = scenario.checks.map(check => {
                const value = answerState.get(check.id);
                return `${check.prompt} ${value === 'yes' ? '네' : value ? '아니요' : '미선택'}`;
            }).join(' / ');
            const summary = `${Number.isInteger(scenario.ageMonths) ? scenario.ageMonths + '개월 / ' : ''}${scenario.badge} / 확인된 단서: ${scenario.clues.join(', ')}${checkText ? ' / ' + checkText : ''} / 시작 시각·체온·지속 시간·먹은 양·마지막 소변·복용약은 보호자가 추가 확인`;
            try {
                await navigator.clipboard.writeText(summary);
                copyStatus.textContent = '복사했습니다. 진료 전에 실제 시각·체온·복용약을 확인해 주세요.';
            } catch {
                copyStatus.textContent = '자동 복사가 되지 않았습니다. 화면 내용을 캡처하거나 직접 적어 주세요.';
            }
        });
        developmentTimingCard.appendChild(copyArea);

        const sourceDetails = document.createElement('details');
        sourceDetails.className = 'urgent-details urgent-source-details';
        addTextElement(sourceDetails, 'summary', '', '공식 출처와 안내 범위 보기');
        const links = document.createElement('div');
        links.className = 'development-timing-links';
        scenario.links.forEach(([label, href]) => {
            const link = addTextElement(links, 'a', '', label);
            link.href = href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        });
        sourceDetails.appendChild(links);
        developmentTimingCard.appendChild(sourceDetails);
        appendOfficialAnswerTrustNote(developmentTimingCard);
    }

    function showComplexQuestionResults(query, scenario) {
        renderScenarioCard(query, scenario);
        const preferred = new Set(scenario.relatedHrefs || []);
        const results = SITE_SEARCH_ITEMS.filter(item => preferred.has(item.href)).slice(0, 3);
        siteSearchResults.replaceChildren();
        results.forEach(appendSearchResult);
        siteSearchOutput.hidden = false;
        if (siteSearchResultHeading) siteSearchResultHeading.textContent = results.length ? '이어서 볼 검수된 상세 글' : '추가 확인';
        siteSearchStatus.textContent = '입력한 여러 단서를 함께 읽고, 병명보다 먼저 해야 할 행동 순서로 안내했습니다.';
        siteSearchOutput.focus({ preventScroll: true });
    }

    function complexAwareRunSiteSearch(query) {
        const cleanQuery = String(query || '').trim();
        const ageInfo = resolveSearchAge(cleanQuery);
        const scenario = analyzeComplexQuestion(cleanQuery, ageInfo);
        if (!scenario) {
            developmentTimingCard?.classList.remove('development-timing-card--urgent');
            return originalRunSiteSearch(query);
        }
        showComplexQuestionResults(cleanQuery, scenario);
    }

    runSiteSearch = complexAwareRunSiteSearch;
    window.BebeGuideComplexQuestion = Object.freeze({ analyze: analyzeComplexQuestion });
})();
