(() => {
    const originalRunSiteSearch = runSiteSearch;

    const SOURCES = {
        emergency: ['119 안전신고센터', 'https://www.119.go.kr/Center119/main.do'],
        seriousIllness: ['NHS 영유아 중증 신호', 'https://www.nhs.uk/baby/health/is-your-baby-or-toddler-seriously-ill/'],
        seizureAap: ['AAP 열성경련', 'https://www.healthychildren.org/English/health-issues/conditions/fever/pages/Febrile-Seizures.aspx'],
        seizureNhs: ['NHS 열성경련 행동 순서', 'https://www.nhs.uk/conditions/febrile-seizures/'],
        choking: ['2025 AHA 소아 질식 지침', 'https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/pediatric-basic-life-support'],
        chokingNhs: ['NHS 영유아 질식 응급처치', 'https://www.nhs.uk/baby/first-aid-and-safety/first-aid/how-to-stop-a-child-from-choking/'],
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
