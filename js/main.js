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
        summary: '언어·소리, 관계·행동, 놀이·생각, 움직임을 개월 수에 따라 확인하고 바로 해볼 놀이와 주의점도 함께 봅니다.',
        action: '관찰할 모습 확인 → 아이 신호를 따른 놀이 → 걱정 기록·상담',
        href: 'blog/development-kdst-guide.html#milestones',
        keywords: '발달 늦음 느림 지연 말 언어 단어 옹알이 발음 대화 이름반응 눈맞춤 가리키기 걷기 기기 앉기 뛰기 놀이 행동 자폐 장애 kdst 놀이방법 발달놀이 상호작용 도와주는법 주의 유의'
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
        category: '치아·양치',
        title: '첫니 전후 양치 시작과 불소치약 사용',
        summary: '이가 나기 전에는 젖은 거즈, 첫 치아가 난 뒤에는 작은 유아용 칫솔과 쌀알만큼의 불소치약으로 관리하는 공식 기준입니다.',
        action: '이가 났는지 확인 → 하루 2번 보호자가 닦기 → 이상이 보이면 치과 상담',
        href: 'market/toddler-toothbrush-guide.html#standard',
        keywords: '양치 양치를 칫솔 칫솔질 치약 불소 불소치약 치아 이빨 첫니 젖니 잇몸 구강 충치 언제 시작 지금부터 닦기 닦아요'
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
        title: '아이 개월 수에 맞춘 생활·안전 체크',
        summary: '아이의 개월 범위를 고르면 지금 확인할 생활 환경과 공식 일정 7개를 보여줍니다.',
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
    {
        age: 2,
        social: '얼굴을 바라보고 말을 걸거나 웃어 주면 미소 짓습니다.',
        language: '울음 외의 소리를 내고 큰 소리에 반응합니다.',
        cognition: '움직이는 사람을 눈으로 따라봅니다.',
        movement: '엎드렸을 때 머리를 들어 올립니다.',
        play: ['얼굴을 마주 보고 아이 소리와 표정을 천천히 따라 하기', '깨어 있을 때 보호자가 지켜보며 짧게 엎드려 놀기'],
        method: '소리나 미소에 답한 뒤 잠시 기다려 아이가 다시 반응할 시간을 주세요.',
        caution: '고개를 돌리거나 하품·보챔이 보이면 쉬세요. 엎드려 놀이는 깨어 있고 지켜볼 때만 하며 잠은 등을 대고 재웁니다.'
    },
    {
        age: 4,
        social: '관심을 끌려고 스스로 웃거나 소리·움직임을 보입니다.',
        language: '아·우 같은 소리를 내고 보호자가 말하면 소리로 답합니다.',
        cognition: '보호자 목소리가 나는 쪽으로 고개를 돌립니다.',
        movement: '안고 있을 때 머리를 안정적으로 가누고 손을 입으로 가져갑니다.',
        play: ['아이가 낸 소리를 따라 한 뒤 차례를 기다리는 소리 놀이', '바닥에서 안전한 장난감을 보고 손 뻗고 발차기 해보기'],
        method: '아이가 바라보는 것을 짧은 말로 알려 주고, 반응하면 같은 놀이를 한 번 더 해주세요.',
        caution: '입으로 탐색하므로 작거나 날카롭고 뜨거운 물건은 치우세요. 의자·그네에 오래 두지 말고 안전한 바닥 놀이 시간을 주세요.'
    },
    {
        age: 6,
        social: '익숙한 사람을 알고 웃습니다.',
        language: '보호자와 번갈아 소리를 냅니다.',
        cognition: '원하는 장난감에 손을 뻗고 물건을 입으로 탐색합니다.',
        movement: '엎드린 자세에서 바로 눕거나 앉아 손으로 몸을 지지합니다.',
        play: ['그림책의 큰 그림을 함께 보며 사물 이름 말하기', '안전한 장난감을 조금 떨어뜨려 손 뻗어 보기'],
        method: '아이가 내는 소리를 따라 하고, 관심을 보이는 물건 하나만 천천히 이름 붙여 주세요.',
        caution: '질식할 크기의 물건과 음식은 닿지 않게 하고, 피곤하거나 몸을 피하면 멈추세요. 자세를 억지로 만들지 않습니다.'
    },
    {
        age: 9,
        social: '이름을 부르면 바라보고 낯선 사람에게 경계 반응을 보일 수 있습니다.',
        language: '마마마·바바바처럼 여러 음절을 이어 냅니다.',
        cognition: '보이지 않게 떨어진 물건을 찾고 두 물건을 서로 두드립니다.',
        movement: '혼자 앉고 한 손의 물건을 다른 손으로 옮깁니다.',
        play: ['천 뒤에 얼굴이나 장난감을 숨겼다 찾는 까꿍 놀이', '큰 물건을 안전한 통에 넣고 꺼내기'],
        method: '아이가 보고 만지는 행동을 짧게 말해 주고, 옹알이를 따라 하며 번갈아 반응하세요.',
        caution: '이동이 늘어나는 시기라 작은 물건·계단·가구 넘어짐 위험을 먼저 막고 가까이에서 지켜보세요. 기기나 서기를 강요하지 않습니다.'
    },
    {
        age: 12,
        social: '보호자와 짝짜꿍 같은 간단한 놀이를 합니다.',
        language: '손을 흔들어 인사하고 보호자를 특별한 이름으로 부르며 안 돼에 잠시 멈춥니다.',
        cognition: '컵에 블록을 넣거나 숨기는 것을 본 장난감을 찾습니다.',
        movement: '잡고 일어서며 가구를 붙잡고 걷습니다.',
        play: ['짝짜꿍·빠이빠이처럼 몸짓을 주고받는 놀이', '큰 블록을 통에 넣고 꺼내거나 숨긴 장난감 찾기'],
        method: '아이가 가리키거나 바라보는 대상을 말해 주고 몇 초 기다린 뒤, 소리·몸짓으로 답하면 바로 반응하세요.',
        caution: '안전하게 탐색할 공간을 만들고 가구를 고정하세요. 걷기나 말하기를 반복 시험하거나 손을 잡아 억지로 시키지 않습니다.'
    },
    {
        age: 15,
        social: '좋아하는 물건을 보여 주거나 다른 아이의 놀이를 따라 합니다.',
        language: '엄마·아빠 외 한두 단어를 말하려 하고 도움을 요청하려 손가락으로 가리킵니다.',
        cognition: '물건을 용도에 맞게 써 보고 작은 물건 두 개를 쌓습니다.',
        movement: '혼자 몇 걸음을 걷고 손가락으로 음식을 집어 먹습니다.',
        play: ['컵으로 마시는 흉내처럼 익숙한 물건 사용 따라 하기', '큰 블록 두세 개 쌓기와 간단한 집안일 돕기'],
        method: '아이의 말·소리·몸짓을 먼저 인정하고 한 단어를 덧붙여 짧게 확장해 주세요.',
        caution: '넘어져도 안전한 탐색 공간을 마련하고 작은 블록은 피하세요. 단어 수나 걷기를 또래와 겨루듯 반복 검사하지 않습니다.'
    },
    {
        age: 18,
        social: '흥미로운 것을 보여 주려고 가리키고 탐색하다 보호자가 가까이 있는지 확인합니다.',
        language: '엄마·아빠 외 세 단어 이상을 말하려 하고 몸짓 없이 한 단계 지시를 따릅니다.',
        cognition: '집안일을 흉내 내고 장난감 자동차를 미는 식으로 놉니다.',
        movement: '붙잡지 않고 걷고 끼적이며 숟가락 사용을 시도합니다.',
        play: ['인형에게 먹이 주기·재우기 같은 짧은 흉내 놀이', '공이나 자동차 굴리기와 그림책에서 익숙한 것 찾기'],
        method: '두 가지 중 고르게 하고, 아이가 한 단어를 말하면 자연스러운 두 단어 표현으로 확장하세요.',
        caution: '눈맞춤·말·배변을 억지로 시키지 말고 싫다는 신호와 쉬는 시간을 존중하세요. 놀잇감 크기와 파손 여부를 확인합니다.'
    },
    {
        age: 24,
        social: '다른 사람이 속상한 것을 알아차리고 새 상황에서 보호자 표정을 살핍니다.',
        language: '두 단어 이상을 붙여 말하고 물어보면 신체 부위를 두 곳 이상 가리킵니다.',
        cognition: '장난감 음식과 접시처럼 두 가지 이상을 연결해 놉니다.',
        movement: '달리고 공을 차며 숟가락으로 먹습니다.',
        play: ['공을 굴리고 차며 서로 차례 주고받기', '옷 입기·요리 흉내와 큰 블록·간단한 퍼즐 놀이'],
        method: '아이 표현을 한두 단어 늘려 말해 주고, 또래 놀이에서는 차례와 필요한 말을 보호자가 직접 보여 주세요.',
        caution: '또래끼리 나눔과 갈등 해결을 혼자 하리라 기대하지 말고 가까이에서 돕습니다. 영상은 사람과의 상호작용을 대신하지 않습니다.'
    },
    {
        age: 30,
        social: '다른 아이 옆에서 놀고 때로는 함께 놀며 간단한 일과를 따릅니다.',
        language: '약 50개 단어를 말하고 동작 단어가 든 두 단어 이상 문장을 사용합니다.',
        cognition: '상상놀이를 하고 두 단계 지시를 따릅니다.',
        movement: '두 발로 뛰고 책장을 한 장씩 넘깁니다.',
        play: ['상자·인형·주방도구로 아이가 이끄는 자유 상상놀이', '크레용 끼적이기·간단한 퍼즐·그림책 질문 놀이'],
        method: '아이가 놀이를 고르게 하고 보호자는 행동을 설명한 뒤 간단한 질문 하나만 덧붙이세요.',
        caution: '놀이 순서를 모두 지시하거나 정답을 요구하지 마세요. 구슬·미술 재료·실외 놀이는 삼킴과 추락 위험을 살피며 함께합니다.'
    },
    {
        age: 36,
        social: '다른 아이를 알아차리고 함께 놀이에 참여합니다.',
        language: '말을 두 번 이상 주고받고 누구·무엇·어디·왜 질문을 하며 이름을 말합니다.',
        cognition: '시범을 보여 주면 원을 그립니다.',
        movement: '큰 구슬 같은 물건을 끈에 꿰고, 헐렁한 옷을 일부 입으며 포크를 사용합니다.',
        play: ['아이 주도의 역할놀이와 밖에서 따라 하기 놀이', '그림·찰흙·짝 맞추기와 책을 보며 다음 장면 이야기하기'],
        method: '아이 생각을 먼저 듣고 감정과 행동을 말로 붙여 주며, 어려움은 바로 해결하기보다 한 단계만 도와주세요.',
        caution: '작은 부품·끈·실외 놀이를 가까이에서 감독하고 발달 효과를 보장하는 훈련처럼 사용하지 마세요. 아이의 의사소통 방식을 존중합니다.'
    }
];

const SEARCH_ALIAS_GROUPS = [
    ['말', '언어', '단어', '옹알이', '발음', '대화'],
    ['걷기', '걷지', '걸어요', '기기', '앉기', '뛰기', '움직임', '운동'],
    ['눈맞춤', '이름반응', '이름', '가리키기', '놀이', '행동', '자폐', '관계'],
    ['이유식', '유아식', '식단', '질감', '편식', '거부', '알레르기', '먹어요'],
    ['열', '발열', '고열', '체온', '해열제', '감기', '기침', '경련'],
    ['잠', '수면', '밤잠', '낮잠', '자주깨요', '안자요', '뒤집기'],
    ['접종', '예방접종', '백신', '주사', '일정'],
    ['양치', '양치를', '칫솔', '칫솔질', '치약', '불소', '치아', '이빨', '첫니', '젖니', '잇몸', '구강', '충치', '닦기'],
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

function isOralCareQuestion(query) {
    const normalized = normalizeSiteSearch(query);
    return /(양치|칫솔|치약|불소|치아|이빨|첫니|젖니|잇몸|구강|충치|이를\s*닦)/.test(normalized);
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

function renderOralCareAnswer(query, ageInfo) {
    if (!developmentTimingCard || !isOralCareQuestion(query)) {
        if (developmentTimingCard) developmentTimingCard.hidden = true;
        return false;
    }

    const age = ageInfo?.value;
    developmentTimingCard.replaceChildren();
    developmentTimingCard.hidden = false;

    const head = document.createElement('div');
    head.className = 'development-timing-head';
    const badge = document.createElement('span');
    badge.textContent = '공식 답변';
    const title = document.createElement('h3');
    title.id = 'developmentTimingTitle';
    title.textContent = Number.isInteger(age)
        ? age + '개월 양치는 이가 났는지부터 보세요'
        : '양치는 이가 났는지부터 보세요';
    head.append(badge, title);

    const intro = document.createElement('p');
    intro.textContent = '네, 지금부터 입안을 관리하는 시기예요. 질병관리청은 젖니가 나기 시작하는 생후 6~12개월 사이에 구강관리를 시작하도록 안내합니다. 중요한 기준은 개월 수 하나가 아니라 이가 났는지입니다.';

    const list = document.createElement('ul');
    list.className = 'development-milestone-list';
    const beforeTooth = document.createElement('li');
    const beforeLabel = document.createElement('strong');
    beforeLabel.textContent = '이가 아직 없어요 · ';
    beforeTooth.append(beforeLabel, document.createTextNode('깨끗한 물에 적신 거즈로 잇몸을 부드럽게 닦아 주세요.'));
    const afterTooth = document.createElement('li');
    const afterLabel = document.createElement('strong');
    afterLabel.textContent = '이가 하나라도 났어요 · ';
    afterTooth.append(afterLabel, document.createTextNode('작고 부드러운 유아용 칫솔로 하루 2번, 특히 자기 전에 보호자가 닦아 주세요.'));
    list.append(beforeTooth, afterTooth);

    const supportPanel = document.createElement('div');
    supportPanel.className = 'development-support-panel';
    const blocks = [
        {
            title: '불소치약은?',
            text: '이가 났다면 1,000~1,500ppm 불소치약을 쌀알만큼만 묻혀 쓰세요. 보호자가 양을 조절하고 삼키지 않도록 지켜봅니다.',
            className: 'development-support-block development-support-method'
        },
        {
            title: '오늘 할 일',
            text: '오늘 저녁 이가 났는지 확인하고, 이가 없으면 젖은 거즈로 잇몸을 닦고 이가 있으면 칫솔질을 시작하세요.',
            className: 'development-support-block'
        },
        {
            title: '주의할 점',
            text: '우유·분유·주스가 든 젖병을 문 채 재우지 마세요. 통증·붓기·계속되는 피, 하얗거나 갈색·검은 부분이 보이면 치과에 문의하세요.',
            className: 'development-support-block development-support-caution'
        }
    ];
    blocks.forEach(block => {
        const section = document.createElement('div');
        section.className = block.className;
        const heading = document.createElement('h4');
        heading.textContent = block.title;
        const text = document.createElement('p');
        text.textContent = block.text;
        section.append(heading, text);
        supportPanel.appendChild(section);
    });

    const links = document.createElement('div');
    links.className = 'development-timing-links';
    const kdcaCareLink = document.createElement('a');
    kdcaCareLink.href = 'https://health.kdca.go.kr/healthinfo/biz/health/ntcnInfo/healthSourc/thtimtCntnts/thtimtCntntsView.do?thtimt_cntnts_sn=131';
    kdcaCareLink.target = '_blank';
    kdcaCareLink.rel = 'noopener noreferrer';
    kdcaCareLink.textContent = '질병관리청 구강관리 원문';
    const kdcaFluorideLink = document.createElement('a');
    kdcaFluorideLink.href = 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6572';
    kdcaFluorideLink.target = '_blank';
    kdcaFluorideLink.rel = 'noopener noreferrer';
    kdcaFluorideLink.textContent = '질병관리청 불소치약 기준';
    const guideLink = document.createElement('a');
    guideLink.href = 'market/toddler-toothbrush-guide.html#standard';
    guideLink.textContent = '양치·칫솔 전체 가이드';
    links.append(kdcaCareLink, kdcaFluorideLink, guideLink);

    developmentTimingCard.append(head, intro, list, supportPanel, links);
    return true;
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
    badge.textContent = '발달 모습 확인';
    const title = document.createElement('h3');
    title.id = 'developmentTimingTitle';
    title.textContent = age + '개월에는 이런 모습을 살펴보세요';
    head.append(badge, title);

    const intro = document.createElement('p');
    const timingText = age < 2
        ? '공식 발달 목록은 2개월부터 있습니다.'
        : (age === checkpoint.age
            ? '선택한 개월 수와 같은 공식 목록입니다.'
            : age + '개월은 ' + checkpoint.age + '개월 내용을 먼저 보고' + (nextCheckpoint ? ', 다음 ' + nextCheckpoint.age + '개월 내용도 함께 참고하세요.' : ' 참고하세요.'));
    intro.textContent = timingText + ' 아래 내용은 아이 4명 중 3명 이상에게 보이는 흔한 모습입니다. 아이마다 나타나는 시기는 다를 수 있고, 이 내용만으로 늦었다거나 장애가 있다고 정하지 않습니다.';

    const list = document.createElement('ul');
    list.className = 'development-milestone-list';
    domains.forEach(domain => {
        const item = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = labels[domain] + ' · ';
        item.append(strong, document.createTextNode(checkpoint[domain]));
        list.appendChild(item);
    });

    const supportPanel = document.createElement('div');
    supportPanel.className = 'development-support-panel';

    const playBlock = document.createElement('div');
    playBlock.className = 'development-support-block';
    const playTitle = document.createElement('h4');
    playTitle.textContent = '오늘 해볼 놀이';
    const playList = document.createElement('ul');
    checkpoint.play.forEach(play => {
        const item = document.createElement('li');
        item.textContent = play;
        playList.appendChild(item);
    });
    playBlock.append(playTitle, playList);

    const methodBlock = document.createElement('div');
    methodBlock.className = 'development-support-block development-support-method';
    const methodTitle = document.createElement('h4');
    methodTitle.textContent = '이렇게 해주세요';
    const methodText = document.createElement('p');
    methodText.textContent = checkpoint.method;
    methodBlock.append(methodTitle, methodText);

    const cautionBlock = document.createElement('div');
    cautionBlock.className = 'development-support-block development-support-caution';
    const cautionTitle = document.createElement('h4');
    cautionTitle.textContent = '주의·유의점';
    const cautionText = document.createElement('p');
    cautionText.textContent = checkpoint.caution;
    cautionBlock.append(cautionTitle, cautionText);

    supportPanel.append(playBlock, methodBlock, cautionBlock);

    const nextAction = document.createElement('div');
    nextAction.className = 'development-next-action';
    const actionTitle = document.createElement('strong');
    actionTitle.textContent = '지금 할 일';
    const actionText = document.createElement('span');
    actionText.textContent = '아직 보이지 않는 모습이 있거나 계속 걱정되면 “조금 더 기다려 보자”로 끝내지 마세요. 언제, 어떤 상황에서 걱정됐는지 의료진에게 말하고 발달을 확인하는 검사(K-DST)가 필요한지 물어보세요. 전에 하던 행동을 하지 않거나 여러 부분이 함께 걱정되면 아이 개월 수와 상관없이 상담하세요.';
    nextAction.append(actionTitle, actionText);

    const links = document.createElement('div');
    links.className = 'development-timing-links';
    const guideLink = document.createElement('a');
    guideLink.href = 'blog/development-kdst-guide.html#play';
    guideLink.textContent = '개월별 놀이·주의점 전체 보기';
    const kdcaLink = document.createElement('a');
    kdcaLink.href = 'https://kdca.go.kr/kdca/2861/subview.do?enc=Zm5jdDF8QEB8JTJGYmJzJTJGa2RjYSUyRjU1JTJGMjI3NjExJTJGYXJ0Y2xWaWV3LmRvJTNG';
    kdcaLink.target = '_blank';
    kdcaLink.rel = 'noopener noreferrer';
    kdcaLink.textContent = '질병관리청 K-DST 원문';
    links.append(guideLink, kdcaLink);

    developmentTimingCard.append(head, intro, list, supportPanel, nextAction, links);
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
    const oralCareShown = renderOralCareAnswer(cleanQuery, ageInfo);
    const timingShown = oralCareShown ? false : renderDevelopmentTiming(cleanQuery, ageInfo);
    let results = searchSiteContent(cleanQuery);
    if (!results.length) results = SITE_SEARCH_ITEMS.slice(0, 3);

    siteSearchResults.replaceChildren();
    results.forEach(appendSearchResult);
    siteSearchOutput.hidden = false;

    let status = results.length + '개의 관련 내용을 찾았습니다.';
    if (oralCareShown) status += ' 공식 구강관리 답변을 먼저 보여드렸습니다.';
    else if (ageInfo && !ageInfo.supported && isDevelopmentQuestion(cleanQuery)) status += ' 발달 모습 안내는 현재 0~36개월까지만 제공합니다.';
    else if (isDevelopmentQuestion(cleanQuery) && !ageInfo) status += ' 아이가 몇 개월인지 함께 입력하면 늦은지 확인하는 기준도 보여드립니다.';
    else if (timingShown) status += ' 가까운 개월 수의 대표 모습을 보여드렸습니다. 한두 가지 모습만으로 늦었다고 정하지 않습니다.';
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
