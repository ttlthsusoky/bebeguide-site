document.documentElement.classList.add('js');

// Mobile Navigation Toggle
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');
const mobileMenuQuery = window.matchMedia('(max-width: 768px)');

function setMobileMenu(open) {
    if (!mobileMenu || !navMenu) return;
    const expanded = mobileMenuQuery.matches && open;
    mobileMenu.classList.toggle('active', expanded);
    navMenu.classList.toggle('active', expanded);
    mobileMenu.setAttribute('aria-expanded', String(expanded));
    mobileMenu.setAttribute('aria-label', expanded ? '메뉴 닫기' : '메뉴 열기');

    if (mobileMenuQuery.matches) {
        navMenu.toggleAttribute('inert', !expanded);
        navMenu.setAttribute('aria-hidden', String(!expanded));
    } else {
        navMenu.removeAttribute('inert');
        navMenu.removeAttribute('aria-hidden');
    }
}

if (mobileMenu && navMenu) {
    setMobileMenu(false);

    mobileMenu.addEventListener('click', () => {
        const willOpen = !navMenu.classList.contains('active');
        setMobileMenu(willOpen);

        if (willOpen) {
            navMenu.querySelector('.nav-link')?.focus();
        }
    });

    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => setMobileMenu(false));
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && navMenu.classList.contains('active')) {
            setMobileMenu(false);
            mobileMenu.focus();
        }
    });

    mobileMenuQuery.addEventListener('change', () => setMobileMenu(false));
}

// Compact homepage navigation: keep core guidance visible and reveal one detailed tool at a time.
const onDemandSections = Array.from(document.querySelectorAll('.on-demand-section'));
const sectionStatus = document.getElementById('section-status');

function getSectionLabel(section) {
    const heading = section.querySelector('h2');
    return heading ? heading.textContent.trim() : '상세 내용';
}

function updateSectionControls(openSectionId = '') {
    document.querySelectorAll('[data-open-section]').forEach(control => {
        control.setAttribute('aria-expanded', String(control.dataset.openSection === openSectionId));
    });
}

function revealDetails(target) {
    if (!target) return;
    const details = target.matches('details') ? target : target.closest('details');
    if (details) details.open = true;
}

function scrollToTarget(target) {
    if (!target) return;
    const navbar = document.querySelector('.navbar');
    const navHeight = navbar ? navbar.offsetHeight : 0;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    requestAnimationFrame(() => {
        const targetPosition = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
        window.scrollTo({
            top: Math.max(0, targetPosition),
            behavior: reduceMotion ? 'auto' : 'smooth'
        });
    });
}

function openOnDemandSection(sectionId, target = null, updateHash = true) {
    const section = document.getElementById(sectionId);
    if (!section || !section.classList.contains('on-demand-section')) return false;

    onDemandSections.forEach(item => item.classList.toggle('is-open', item === section));
    updateSectionControls(sectionId);
    revealDetails(target);

    if (updateHash) {
        const hashTarget = target && target.id ? target.id : sectionId;
        history.pushState(null, '', `#${hashTarget}`);
    }

    if (sectionStatus) sectionStatus.textContent = `${getSectionLabel(section)} 영역을 열었습니다.`;
    return true;
}

function closeOnDemandSections(moveToFinder = true) {
    onDemandSections.forEach(section => section.classList.remove('is-open'));
    updateSectionControls();
    if (sectionStatus) sectionStatus.textContent = '상세 영역을 닫았습니다.';

    if (moveToFinder) {
        const finder = document.getElementById('quick-find');
        history.pushState(null, '', '#quick-find');
        if (finder) {
            finder.focus({ preventScroll: true });
            scrollToTarget(finder);
        }
    }
}

onDemandSections.forEach(section => {
    const toolbar = document.createElement('div');
    toolbar.className = 'panel-toolbar';
    toolbar.innerHTML = `
        <div class="panel-toolbar-inner">
            <span><i class="fas fa-layer-group" aria-hidden="true"></i> 선택한 상세 영역</span>
            <button type="button" data-close-section aria-label="${getSectionLabel(section)} 닫고 빠른 찾기로 돌아가기">
                <i class="fas fa-xmark" aria-hidden="true"></i> 닫기
            </button>
        </div>
    `;
    section.insertBefore(toolbar, section.firstChild);
});

document.addEventListener('click', event => {
    const opener = event.target.closest('[data-open-section]');
    if (opener) {
        event.preventDefault();
        const sectionId = opener.dataset.openSection;
        const section = document.getElementById(sectionId);
        if (openOnDemandSection(sectionId)) scrollToTarget(section);
        setMobileMenu(false);
        return;
    }

    const closer = event.target.closest('[data-close-section]');
    if (closer) {
        event.preventDefault();
        closeOnDemandSections(true);
        return;
    }

    const anchor = event.target.closest('a[href^="#"]');
    if (!anchor) return;
    const href = anchor.getAttribute('href');
    if (!href || href === '#') return;

    let target;
    try {
        target = document.getElementById(decodeURIComponent(href.slice(1)));
    } catch (error) {
        return;
    }
    if (!target) return;

    event.preventDefault();
    const section = target.classList.contains('on-demand-section')
        ? target
        : target.closest('.on-demand-section');

    if (section) {
        openOnDemandSection(section.id, target, false);
    } else {
        closeOnDemandSections(false);
        revealDetails(target);
    }

    history.pushState(null, '', href);
    scrollToTarget(target);
});

function openSectionFromHash() {
    if (!window.location.hash || window.location.hash === '#') {
        closeOnDemandSections(false);
        return;
    }
    const target = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!target) return;
    const section = target.classList.contains('on-demand-section')
        ? target
        : target.closest('.on-demand-section');

    if (section) {
        openOnDemandSection(section.id, target, false);
    } else {
        closeOnDemandSections(false);
        revealDetails(target);
    }
    scrollToTarget(target);
}

window.addEventListener('hashchange', openSectionFromHash);
window.addEventListener('popstate', openSectionFromHash);
openSectionFromHash();

// Site-only question search: no network request and no query storage.
const siteSearchForm = document.getElementById('siteSearchForm');
const siteSearchInput = document.getElementById('siteSearchInput');
const siteSearchAge = document.getElementById('siteSearchAge');
const siteSearchStatus = document.getElementById('siteSearchStatus');
const siteSearchOutput = document.getElementById('siteSearchOutput');
const siteSearchResults = document.getElementById('siteSearchResults');
const developmentTimingCard = document.getElementById('developmentTimingCard');

const SITE_SEARCH_ITEMS = [
    {
        category: '발달·언어·행동',
        title: '2~36개월 대표 발달 모습과 K-DST',
        summary: '언어·관계·놀이·움직임을 월령별로 확인하고, 한 항목만으로 장애나 지연을 판정하지 않는 기준입니다.',
        action: '대표 모습 확인 → 걱정 기록 → 선별검사·상담 순서',
        href: 'blog/development-kdst-guide.html#milestones',
        keywords: '발달 늦음 느림 지연 말 언어 단어 옹알이 발음 대화 이름반응 눈맞춤 가리키기 걷기 기기 앉기 뛰기 놀이 행동 자폐 장애 kdst'
    },
    {
        category: '발달·상담 준비',
        title: '걱정될 때 기다리지 않고 확인하는 순서',
        summary: '하던 기술의 상실, 여러 영역의 지속적인 걱정, 보호자·교사의 반복 우려를 상담으로 가져가는 방법입니다.',
        action: '변화·걱정·응급을 나누고 의료진에게 구체적으로 설명하기',
        href: 'blog/development-kdst-guide.html#act',
        keywords: '발달 상담 병원 검사 선별검사 kdst 기술 상실 퇴행 기다리기 걱정 어린이집 교사'
    },
    {
        category: '이유식·유아식',
        title: '이유식 시작·질감·알레르기와 식단 구성',
        summary: '대부분 6개월 무렵의 준비 신호, 질감 진행, 알레르기 식품 도입과 3일 유아식 구성 예시를 확인합니다.',
        action: '고정 섭취량보다 준비 신호·질감 능력·반응 확인하기',
        href: 'blog/complementary-feeding-allergy-guide.html',
        keywords: '이유식 유아식 식단 편식 안먹어요 안 먹어요 거부 질감 토함 헛구역질 알레르기 계란 땅콩 철분 간식'
    },
    {
        category: '발열·응급',
        title: '아기 열이 날 때 먼저 볼 진료·응급 기준',
        summary: '체온 숫자 하나가 아니라 연령, 호흡, 반응, 수분, 경련 등 상태를 함께 확인합니다.',
        action: '3개월 미만 38도·호흡곤란·반응 저하는 바로 의료 도움',
        href: 'blog/baby-fever-cold-guide.html',
        keywords: '열 발열 고열 체온 해열제 감기 기침 콧물 경련 응급실 119 병원 진료 38도'
    },
    {
        category: '안전수면',
        title: '1세 미만 안전수면 기준',
        summary: '모든 낮잠과 밤잠에 적용할 등 자세, 별도 수면면, 빈 수면 공간과 밤중 수유 뒤 행동을 확인합니다.',
        action: '수면교육보다 자세·수면면·주변 물건부터 확인하기',
        href: 'blog/baby-safe-sleep-guide.html',
        keywords: '잠 수면 밤잠 낮잠 안자요 자주깨요 뒤집기 엎드림 침대 범퍼 베개 이불 sids 수유'
    },
    {
        category: '예방접종',
        title: '2026 예방접종 기록과 다음 일정 확인',
        summary: '사이트의 고정표보다 예방접종도우미에서 아이별 실제 기록과 다음 일정을 확인하는 순서입니다.',
        action: '공식 기록 조회 → 접종기관 예진 → 일정 확인',
        href: 'blog/vaccination-schedule.html',
        keywords: '예방접종 백신 주사 일정 늦음 놓침 기록 다음 접종 국가접종'
    },
    {
        category: '이번 주 행동',
        title: '월령별 생활·안전 체크리스트',
        summary: '월령 범위를 고르면 지금 확인할 생활 환경과 공식 일정 7개를 보여줍니다.',
        action: '이미 하는 것부터 체크하고 이번 주 3개로 줄여 보기',
        href: '#age',
        keywords: '월령 체크리스트 오늘 이번주 할일 해야할일 중요 준비 안전 생활'
    },
    {
        category: '기록 도구',
        title: '수유·식사·수면·하루 기록',
        summary: '회원가입 없이 현재 기기에만 수유와 식사, 수면 흐름과 하루 메모를 남깁니다.',
        action: '진단용 점수 대신 상담할 때 보여줄 관찰 기록 남기기',
        href: '#daily-tools',
        keywords: '기록 수유 식사 이유식 수면 배변 일기 다이어리 타이머 패턴 병원 상담'
    },
    {
        category: '부모 마음건강',
        title: '지금 위험·오늘 상담·부담 줄이기',
        summary: '기간을 기다리는 대신 현재 위험 여부와 오늘 연결할 공공 상담 경로를 먼저 확인합니다.',
        action: '즉시 위험은 112·119, 그 밖의 지속되는 어려움은 오늘 상담',
        href: '#parent-health',
        keywords: '엄마 우울 불안 산후우울 힘들어요 지침 스트레스 마음건강 상담 자해 위험'
    },
    {
        category: '용품 선택',
        title: '광고보다 조건을 먼저 보는 용품 가이드',
        summary: '확인된 제품만 조건부로 다루고, 인증·설치·세대가 불명확한 고위험 품목의 추천은 보류합니다.',
        action: '아이 상황과 안전 조건 확인 후 제품 후보 비교하기',
        href: 'market/',
        keywords: '육아용품 국민템 추천 카시트 체온계 하이체어 안전문 헬멧 칫솔 장난감 광고 쿠팡'
    }
];

const DEVELOPMENT_MILESTONES = [
    { age: 2, social: '얼굴을 바라보고 말을 걸거나 웃어 주면 미소 짓습니다.', language: '울음 외의 소리를 내고 큰 소리에 반응합니다.', cognition: '움직이는 사람을 눈으로 따라봅니다.', movement: '엎드렸을 때 머리를 들어 올립니다.' },
    { age: 4, social: '관심을 끌려고 스스로 웃거나 소리·움직임을 보입니다.', language: '아·우 같은 소리를 내고 보호자가 말하면 소리로 답합니다.', cognition: '보호자 목소리가 나는 쪽으로 고개를 돌립니다.', movement: '안고 있을 때 머리를 안정적으로 가누고 손을 입으로 가져갑니다.' },
    { age: 6, social: '익숙한 사람을 알고 웃습니다.', language: '보호자와 번갈아 소리를 냅니다.', cognition: '원하는 장난감에 손을 뻗고 물건을 입으로 탐색합니다.', movement: '엎드린 자세에서 바로 눕거나 앉아 손으로 몸을 지지합니다.' },
    { age: 9, social: '이름을 부르면 바라보고 낯선 사람에게 경계 반응을 보일 수 있습니다.', language: '마마마·바바바처럼 여러 음절을 이어 냅니다.', cognition: '보이지 않게 떨어진 물건을 찾고 두 물건을 서로 두드립니다.', movement: '혼자 앉고 한 손의 물건을 다른 손으로 옮깁니다.' },
    { age: 12, social: '보호자와 짝짜꿍 같은 간단한 놀이를 합니다.', language: '손을 흔들어 인사하고 보호자를 특별한 이름으로 부르며 안 돼에 잠시 멈춥니다.', cognition: '컵에 블록을 넣거나 숨기는 것을 본 장난감을 찾습니다.', movement: '잡고 일어서며 가구를 붙잡고 걷습니다.' },
    { age: 15, social: '좋아하는 물건을 보여 주거나 다른 아이의 놀이를 따라 합니다.', language: '엄마·아빠 외 한두 단어를 말하려 하고 도움을 요청하려 손가락으로 가리킵니다.', cognition: '물건을 용도에 맞게 써 보고 작은 물건 두 개를 쌓습니다.', movement: '혼자 몇 걸음을 걷고 손가락으로 음식을 집어 먹습니다.' },
    { age: 18, social: '흥미로운 것을 보여 주려고 가리키고 탐색하다 보호자가 가까이 있는지 확인합니다.', language: '엄마·아빠 외 세 단어 이상을 말하려 하고 몸짓 없이 한 단계 지시를 따릅니다.', cognition: '집안일을 흉내 내고 장난감 자동차를 미는 식으로 놉니다.', movement: '붙잡지 않고 걷고 끼적이며 숟가락 사용을 시도합니다.' },
    { age: 24, social: '다른 사람이 속상한 것을 알아차리고 새 상황에서 보호자 표정을 살핍니다.', language: '두 단어 이상을 붙여 말하고 물어보면 신체 부위를 두 곳 이상 가리킵니다.', cognition: '장난감 음식과 접시처럼 두 가지 이상을 연결해 놉니다.', movement: '달리고 공을 차며 숟가락으로 먹습니다.' },
    { age: 30, social: '다른 아이 옆에서 놀고 때로는 함께 놀며 간단한 일과를 따릅니다.', language: '약 50개 단어를 말하고 동작 단어가 든 두 단어 이상 문장을 사용합니다.', cognition: '상상놀이를 하고 두 단계 지시를 따릅니다.', movement: '두 발로 뛰고 책장을 한 장씩 넘깁니다.' },
    { age: 36, social: '다른 아이를 알아차리고 함께 놀이에 참여합니다.', language: '말을 두 번 이상 주고받고 누구·무엇·어디·왜 질문을 하며 이름을 말합니다.', cognition: '시범을 보여 주면 원을 그립니다.', movement: '큰 구슬 같은 물건을 끈에 꿰고, 헐렁한 옷을 일부 입으며 포크를 사용합니다.' }
];

const SEARCH_ALIAS_GROUPS = [
    ['말', '언어', '단어', '옹알이', '발음', '대화'],
    ['걷기', '걷지', '걸어요', '기기', '앉기', '뛰기', '움직임', '운동'],
    ['눈맞춤', '이름반응', '이름', '가리키기', '놀이', '행동', '자폐', '관계'],
    ['이유식', '유아식', '식단', '질감', '편식', '거부', '알레르기', '먹어요'],
    ['열', '발열', '고열', '체온', '해열제', '감기', '기침', '경련'],
    ['잠', '수면', '밤잠', '낮잠', '자주깨요', '안자요', '뒤집기'],
    ['접종', '예방접종', '백신', '주사', '일정'],
    ['늦음', '늦는', '늦어요', '느림', '느려요', '지연', '못해요']
];

function normalizeSiteSearch(value) {
    return String(value || '')
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^0-9a-z가-힣\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function getSiteSearchTerms(query) {
    const normalized = normalizeSiteSearch(query);
    const stopwords = new Set(['아기', '아이', '아직', '그런데', '계속', '이제', '정말', '언제', '어떻게', '하나요', '해요', '인가요', '인데']);
    const terms = new Set(normalized.split(' ').filter(term => term && !stopwords.has(term) && (term.length > 1 || ['말', '열', '잠'].includes(term))));

    SEARCH_ALIAS_GROUPS.forEach(group => {
        if (group.some(term => normalized.includes(term))) {
            group.forEach(term => terms.add(term));
        }
    });
    return { normalized, terms: Array.from(terms) };
}

function searchSiteContent(query) {
    const search = getSiteSearchTerms(query);
    return SITE_SEARCH_ITEMS
        .map((item, order) => {
            const title = normalizeSiteSearch(item.title);
            const body = normalizeSiteSearch([item.category, item.summary, item.action, item.keywords].join(' '));
            let score = 0;
            if (search.normalized.length > 1 && (title.includes(search.normalized) || body.includes(search.normalized))) score += 12;
            search.terms.forEach(term => {
                if (title.includes(term)) score += 5;
                if (body.includes(term)) score += 2;
            });
            return { item, score, order };
        })
        .filter(result => result.score > 0)
        .sort((a, b) => b.score - a.score || a.order - b.order)
        .slice(0, 5)
        .map(result => result.item);
}

function resolveSearchAge(query) {
    const explicit = siteSearchAge ? siteSearchAge.value.trim() : '';
    let age = explicit === '' ? null : Number(explicit);

    if (age === null) {
        const monthMatch = String(query).match(/(\d{1,2})\s*(?:개월|달)/);
        const yearMatch = String(query).match(/(\d)\s*살/);
        if (monthMatch) age = Number(monthMatch[1]);
        else if (yearMatch) age = Number(yearMatch[1]) * 12;
    }

    if (!Number.isInteger(age)) return null;
    return { value: age, supported: age >= 0 && age <= 36 };
}

function isDevelopmentQuestion(query) {
    const normalized = normalizeSiteSearch(query);
    return /(발달|말|언어|단어|옹알|발음|대화|이름|눈맞춤|가리|걷|걸|기어|앉|뛰|움직|놀이|행동|자폐|장애|늦|느리|지연|못해)/.test(normalized);
}

function getDevelopmentDomains(query) {
    const normalized = normalizeSiteSearch(query);
    const domains = [];
    if (/(말|언어|단어|옹알|발음|대화)/.test(normalized)) domains.push('language');
    if (/(걷|걸|기어|앉|뛰|움직|운동)/.test(normalized)) domains.push('movement');
    if (/(눈맞춤|이름|가리|관계|자폐|친구|사회)/.test(normalized)) domains.push('social');
    if (/(놀이|흉내|생각|지시|인지)/.test(normalized)) domains.push('cognition');
    return domains.length ? domains : ['social', 'language', 'cognition', 'movement'];
}

function appendSearchResult(item) {
    const link = document.createElement('a');
    link.className = 'site-search-result';
    link.href = item.href;

    const category = document.createElement('span');
    category.className = 'site-search-result-category';
    category.textContent = item.category;

    const title = document.createElement('strong');
    title.textContent = item.title;

    const summary = document.createElement('p');
    summary.textContent = item.summary;

    const action = document.createElement('span');
    action.className = 'site-search-result-action';
    action.textContent = '지금 할 일 · ' + item.action;

    link.append(category, title, summary, action);
    siteSearchResults.appendChild(link);
}

function renderDevelopmentTiming(query, ageInfo) {
    if (!developmentTimingCard || !ageInfo || !ageInfo.supported || !isDevelopmentQuestion(query)) {
        if (developmentTimingCard) developmentTimingCard.hidden = true;
        return false;
    }

    const age = ageInfo.value;
    const checkpoint = DEVELOPMENT_MILESTONES.filter(item => item.age <= age).pop() || DEVELOPMENT_MILESTONES[0];
    const nextCheckpoint = DEVELOPMENT_MILESTONES.find(item => item.age > age);
    const domains = getDevelopmentDomains(query);
    const labels = { social: '관계·행동', language: '언어·소리', cognition: '놀이·생각', movement: '움직임' };

    developmentTimingCard.replaceChildren();
    developmentTimingCard.hidden = false;

    const head = document.createElement('div');
    head.className = 'development-timing-head';
    const badge = document.createElement('span');
    badge.textContent = '늦은지 확인';
    const title = document.createElement('h3');
    title.id = 'developmentTimingTitle';
    title.textContent = age + '개월은 합격·마감선으로 판정하지 않습니다';
    head.append(badge, title);

    const intro = document.createElement('p');
    const timingText = age < 2
        ? 'CDC의 첫 발달 이정표 목록은 2개월부터 시작합니다.'
        : (age === checkpoint.age
            ? '선택한 월령과 같은 CDC 관찰 시점입니다.'
            : age + '개월에 가장 가까운 이전 CDC 관찰 시점은 ' + checkpoint.age + '개월입니다.' + (nextCheckpoint ? ' 다음 목록은 ' + nextCheckpoint.age + '개월입니다.' : ''));
    intro.textContent = timingText + ' 이정표는 해당 나이 아동의 약 75% 이상이 보이는 대표 모습이며 진단선이 아닙니다.';

    const list = document.createElement('ul');
    list.className = 'development-milestone-list';
    domains.forEach(domain => {
        const item = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = labels[domain] + ' · ';
        item.append(strong, document.createTextNode(checkpoint[domain]));
        list.appendChild(item);
    });

    const nextAction = document.createElement('div');
    nextAction.className = 'development-next-action';
    const actionTitle = document.createElement('strong');
    actionTitle.textContent = '지금 할 일';
    const actionText = document.createElement('span');
    actionText.textContent = '해당 모습이 아직 보이지 않거나 걱정이 이어지면 더 기다려 보자로 끝내지 말고, 의료진에게 구체적인 상황을 알려 K-DST 같은 발달선별검사를 상의하세요. 하던 기술을 잃었거나 여러 영역의 걱정이 겹치면 월령과 관계없이 상담하세요.';
    nextAction.append(actionTitle, actionText);

    const links = document.createElement('div');
    links.className = 'development-timing-links';
    const guideLink = document.createElement('a');
    guideLink.href = 'blog/development-kdst-guide.html#milestones';
    guideLink.textContent = '월령별 전체 모습 보기';
    const kdcaLink = document.createElement('a');
    kdcaLink.href = 'https://kdca.go.kr/kdca/2861/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGa2RjYSUyRjU1JTJGMjI3NjExJTJGYXJ0Y2xWaWV3LmRvJTNG';
    kdcaLink.target = '_blank';
    kdcaLink.rel = 'noopener noreferrer';
    kdcaLink.textContent = '질병관리청 K-DST 원문';
    links.append(guideLink, kdcaLink);

    developmentTimingCard.append(head, intro, list, nextAction, links);
    return true;
}

function runSiteSearch(query) {
    if (!siteSearchOutput || !siteSearchResults || !siteSearchStatus) return;
    const cleanQuery = String(query || '').trim();
    if (!cleanQuery) {
        siteSearchOutput.hidden = true;
        siteSearchStatus.textContent = '궁금한 점을 한 문장으로 입력해 주세요.';
        siteSearchInput?.focus();
        return;
    }

    const ageInfo = resolveSearchAge(cleanQuery);
    const timingShown = renderDevelopmentTiming(cleanQuery, ageInfo);
    let results = searchSiteContent(cleanQuery);
    if (!results.length) results = SITE_SEARCH_ITEMS.slice(0, 3);

    siteSearchResults.replaceChildren();
    results.forEach(appendSearchResult);
    siteSearchOutput.hidden = false;

    let status = results.length + '개의 관련 내용을 찾았습니다.';
    if (ageInfo && !ageInfo.supported) status += ' 발달 시점 안내는 현재 0~36개월까지만 제공합니다.';
    else if (isDevelopmentQuestion(cleanQuery) && !ageInfo) status += ' 월령을 함께 입력하면 늦은지 확인하는 기준도 보여드립니다.';
    else if (timingShown) status += ' 월령별 대표 모습은 진단이나 합격선이 아닙니다.';
    siteSearchStatus.textContent = status;
    siteSearchOutput.focus({ preventScroll: true });
}

if (siteSearchForm && siteSearchInput) {
    siteSearchForm.addEventListener('submit', event => {
        event.preventDefault();
        runSiteSearch(siteSearchInput.value);
    });

    document.querySelectorAll('[data-search-example]').forEach(button => {
        button.addEventListener('click', () => {
            siteSearchInput.value = button.dataset.searchExample || '';
            if (siteSearchAge) siteSearchAge.value = button.dataset.searchAge || '';
            runSiteSearch(siteSearchInput.value);
        });
    });
}

// Navbar Background on Scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.background = 'rgba(255, 255, 255, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    } else {
        navbar.style.background = 'rgba(255, 255, 255, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Counter Animation for Statistics
function animateCounters() {
    const counters = document.querySelectorAll('.stat-number');
    
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-target'));
        const increment = target / 200;
        let current = 0;
        
        const updateCounter = () => {
            if (current < target) {
                current += increment;
                counter.textContent = Math.ceil(current);
                setTimeout(updateCounter, 10);
            } else {
                counter.textContent = target;
            }
        };
        
        updateCounter();
    });
}

// Intersection Observer for Animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('show');
            
            // Trigger counter animation when stats section is visible
            if (entry.target.querySelector('.stat-number')) {
                animateCounters();
            }
        }
    });
}, observerOptions);

// Add fade-in class to elements and observe them
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.section-header, .service-card, .portfolio-item, .feature-item, .contact-item, .about-text, .stats');
    
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
});

// Portfolio Filter Functionality
const filterButtons = document.querySelectorAll('.filter-btn');
const portfolioItems = document.querySelectorAll('.portfolio-item');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Remove active class from all buttons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // Add active class to clicked button
        button.classList.add('active');
        
        const filterValue = button.getAttribute('data-filter');
        
        portfolioItems.forEach(item => {
            // Add hide class first for smooth transition
            item.classList.add('hide');
            
            setTimeout(() => {
                if (filterValue === 'all' || item.getAttribute('data-category') === filterValue) {
                    item.style.display = 'block';
                    item.classList.remove('hide');
                } else {
                    item.style.display = 'none';
                }
            }, 150);
        });
    });
});



// Notification System
function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : '#ef4444'};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 400px;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
        margin-right: 20px;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s ease;
    `;
    
    // Add to page
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Close functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => notification.remove(), 300);
    });
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Back to Top Button
const backToTopButton = document.getElementById('backToTop');

window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
        backToTopButton.classList.add('show');
    } else {
        backToTopButton.classList.remove('show');
    }
});

backToTopButton.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Parallax Effect for Hero Section
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroCards = document.querySelectorAll('.floating-card');
    
    if (hero && scrolled < hero.offsetHeight) {
        // Move floating cards at different speeds
        heroCards.forEach((card, index) => {
            const speed = (index + 1) * 0.5;
            card.style.transform = `translateY(${scrolled * speed}px)`;
        });
    }
});

// Typing Effect for Hero Title
function typeWriter(element, text, speed = 100) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    
    type();
}

// 제목은 보조기술과 저속 기기에서도 즉시 읽히도록 애니메이션 없이 유지합니다.

// Add smooth reveal animations for service cards
document.addEventListener('DOMContentLoaded', () => {
    const serviceCards = document.querySelectorAll('.service-card');
    
    serviceCards.forEach((card, index) => {
        card.style.animationDelay = `${index * 0.2}s`;
    });
});

// Theme switcher (optional feature)
function createThemeToggle() {
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.style.cssText = `
        position: fixed;
        top: 50%;
        right: 20px;
        transform: translateY(-50%);
        width: 50px;
        height: 50px;
        background: var(--gradient);
        color: white;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.2rem;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: var(--shadow);
    `;
    
    document.body.appendChild(themeToggle);
    
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const icon = themeToggle.querySelector('i');
        
        if (document.body.classList.contains('dark-theme')) {
            icon.className = 'fas fa-sun';
            localStorage.setItem('theme', 'dark');
        } else {
            icon.className = 'fas fa-moon';
            localStorage.setItem('theme', 'light');
        }
    });
    
    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.querySelector('i').className = 'fas fa-sun';
    }
}

// Initialize theme toggle
// createThemeToggle();

// Add loading screen
function showLoadingScreen() {
    const loader = document.createElement('div');
    loader.className = 'loading-screen';
    loader.innerHTML = `
        <div class="loader">
            <div class="loader-spinner"></div>
            <p>로딩 중...</p>
        </div>
    `;
    
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        transition: opacity 0.5s ease;
    `;
    
    loader.querySelector('.loader').style.cssText = `
        text-align: center;
        color: var(--primary-color);
    `;
    
    loader.querySelector('.loader-spinner').style.cssText = `
        width: 50px;
        height: 50px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 20px;
    `;
    
    document.body.appendChild(loader);
    
    window.addEventListener('load', () => {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => loader.remove(), 500);
        }, 1000);
    });
}

// 로딩 화면은 정보 접근을 지연시키므로 사용하지 않습니다.

// Add custom cursor (optional)
function createCustomCursor() {
    const cursor = document.createElement('div');
    cursor.className = 'custom-cursor';
    cursor.style.cssText = `
        position: fixed;
        width: 20px;
        height: 20px;
        background: var(--primary-color);
        border-radius: 50%;
        pointer-events: none;
        z-index: 10000;
        transition: transform 0.1s ease;
        mix-blend-mode: difference;
    `;
    
    document.body.appendChild(cursor);
    
    document.addEventListener('mousemove', (e) => {
        cursor.style.left = e.clientX - 10 + 'px';
        cursor.style.top = e.clientY - 10 + 'px';
    });
    
    // Scale cursor on hover
    document.addEventListener('mouseenter', (e) => {
        if (e.target.matches('a, button, .btn')) {
            cursor.style.transform = 'scale(2)';
        }
    });
    
    document.addEventListener('mouseleave', (e) => {
        if (e.target.matches('a, button, .btn')) {
            cursor.style.transform = 'scale(1)';
        }
    });
}

// Initialize custom cursor (uncomment to enable)
// createCustomCursor();

// Performance optimization: Lazy loading for images
function lazyLoadImages() {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                observer.unobserve(img);
            }
        });
    });
    
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Initialize lazy loading
lazyLoadImages();

// === 육아 팁 카드 펼치기 기능 === //
document.addEventListener('DOMContentLoaded', () => {
  const expandableCards = document.querySelectorAll('.service-card.expandable');

  expandableCards.forEach(card => {
    const title = card.querySelector('h3');
    const details = card.querySelector('.service-details');
    const icon = card.querySelector('.expand-icon');

    if (title && details) {
      title.style.cursor = 'pointer';
      title.setAttribute('role', 'button');
      title.setAttribute('tabindex', '0');
      title.setAttribute('aria-expanded', String(details.style.display !== 'none'));

      const toggleDetails = () => {
        const isVisible = details.style.display !== 'none';
        details.style.display = isVisible ? 'none' : 'block';
        title.setAttribute('aria-expanded', String(!isVisible));
        if (icon) icon.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
      };

      title.addEventListener('click', toggleDetails);
      title.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          toggleDetails();
        }
      });
    }
  });
});

console.log('🍼 베베가이드 사이트가 성공적으로 로드되었습니다!');


console.log("🍼 베베가이드 main.js 로드 완료");
