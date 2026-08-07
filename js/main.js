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
const siteSearchResultHeading = document.getElementById('siteSearchResultHeading');
const developmentTimingCard = document.getElementById('developmentTimingCard');

const SITE_SEARCH_ITEMS = [
    {
        category: '발달·언어·행동',
        title: '2~36개월 대표 발달 모습과 K-DST',
        summary: '언어·소리, 관계·행동, 놀이·생각, 움직임을 개월 수에 따라 확인하고 바로 해볼 놀이와 주의점도 함께 봅니다.',
        action: '관찰할 모습 확인 → 아이 신호를 따른 놀이 → 걱정 기록·상담',
        href: 'blog/development-kdst-guide.html#milestones',
        keywords: '발달 늦음 느림 지연 말 언어 단어 옹알이 발음 대화 이름반응 눈맞춤 가리키기 걷기 기기 앉기 뛰기 놀이 행동 자폐 장애 kdst 놀이방법 발달놀이 상호작용 도와주는법 주의 유의 영상 화면 유튜브 미디어 떼쓰기 물기 때리기 배변훈련 기저귀떼기'
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
        keywords: '이유식 유아식 식단 편식 안먹어요 안 먹어요 거부 질감 토함 헛구역질 질식 사레 알레르기 계란 땅콩 철분 간식 생우유 우유 분유 끊기'
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
        keywords: '잠 수면 밤잠 낮잠 안자요 자주깨요 통잠 밤수유 밤중수유 뒤집기 엎드림 침대 범퍼 베개 이불 sids 수유'
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
        keywords: '기록 수유 수유량 분유량 수유텀 수유간격 식사 이유식 수면 배변 변비 응가 일기 다이어리 타이머 패턴 병원 상담'
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
    ['수유량', '분유량', '수유텀', '수유간격', '밤수유', '밤중수유', '모유', '단유', '젖양'],
    ['생우유', '우유', '분유끊기', '분유떼기', '조유', '분유타기'],
    ['헛구역질', '구역질', '질식', '사레', '기도폐쇄'],
    ['영상', '유튜브', '티비', '스크린', '핸드폰', '휴대폰', '미디어'],
    ['배변훈련', '기저귀떼기', '변기', '팬티', '변비', '응가', '설사'],
    ['떼쓰기', '고집', '물기', '때리기', '공격행동', '분리불안', '어린이집'],
    ['열', '발열', '고열', '체온', '해열제', '감기', '기침', '경련', '코막힘'],
    ['잠', '수면', '밤잠', '낮잠', '자주깨요', '안자요', '뒤집기', '속싸개', '등재우기'],
    ['접종', '예방접종', '백신', '주사', '일정', '이상반응'],
    ['양치', '양치를', '칫솔', '칫솔질', '치약', '불소', '치아', '이빨', '첫니', '젖니', '잇몸', '구강', '충치', '닦기', '이앓이'],
    ['발진', '수족구', '기저귀발진', '황달', '트림', '토함', '역류', '배앓이'],
    ['늦음', '늦는', '늦어요', '느림', '느려요', '지연', '못해요']
];

// Questions are selected from recurring themes in Korean parenting-community research
// and public childcare counselling cases. Community posts identify the question only;
// every answer below is written from the linked official or professional guidance.
const COMMON_PARENT_ANSWERS = [
    {
        id: 'mumps-boundary',
        match: /(볼거리|유행성\s*이하선염|mumps|귀밑\s*부음\s*열|턱밑\s*부음\s*열)/,
        title: '볼거리 의심은 턱·귀밑 부음과 열을 사진으로 단정하지 말고 진료·접종 기록을 확인하세요',
        lead: '한쪽 또는 양쪽 턱·귀밑이 붓고 열이 나면 볼거리 등 가능성이 있으나 사이트에서 병명을 확정하지 않습니다. 접종 기록(MMR 등)을 확인하고, 고환·복부 통증·두통·처짐이 있으면 빨리 진료하세요. 등원·격리는 시설·보건 안내를 따릅니다.',
        points: [
            ['관찰', '부은 위치, 열, 통증, 수분 섭취'],
            ['진료', '심한 통증, 구토·두통, 고환 통증, 깨우기 어려움']
        ],
        blocks: [
            ['지금 할 일', '접종 기록과 증상 시작일을 확인하세요.'],
            ['하지 않을 일', '부은 곳을 세게 누르거나 민간 찜질로 미루지 마세요.'],
            ['관련', '홍역·접종 일정 안내를 참고하세요.']
        ],
        links: [
            ['CDC 볼거리', 'https://www.cdc.gov/mumps/'],
            ['질병관리청 감염병', 'https://www.kdca.go.kr/'],
            ['예방접종 일정', 'blog/vaccination-schedule.html']
        ]
    },
    {
        id: 'scarlet-fever-boundary',
        match: /(성홍열|scarlet\s*fever|성홍|모래\s*종이\s*발진|딸기\s*혀|인후통\s*발진\s*열)/,
        title: '목 아픔·열 뒤 모래 같은 발진은 성홍열 등 가능성이 있어 사진으로 단정하지 마세요',
        lead: '인후통·고열 후 몸통에 거친 발진, 딸기 혀 등이 나타날 수 있으나 비슷한 질환이 많습니다. 항생제 필요 여부는 의료진이 진찰 후 정합니다. 사진 앱·댓글 진단·임의 항생제는 하지 않습니다.',
        points: [
            ['의심 시', '진료, 호흡·수분·처짐 확인'],
            ['가정', '손 씻기, 식기·수건 구분, 해열은 의료 안내 성분']
        ],
        blocks: [
            ['지금 할 일', '열·발진 시작 시각과 목 통증을 기록하세요.'],
            ['하지 않을 일', '남은 항생제를 임의로 주지 마세요.'],
            ['관련', '발열·발진 경계 안내를 참고하세요.']
        ],
        links: [
            ['CDC 성홍열(A군 연쇄구균)', 'https://www.cdc.gov/group-a-strep/about/scarlet-fever.html'],
            ['NHS 성홍열', 'https://www.nhs.uk/conditions/scarlet-fever/'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'measles-exposure-boundary',
        match: /(홍역|measles|홍역\s*노출|홍역\s*의심|홍역\s*발진)/,
        title: '홍역이 의심되거나 노출됐으면 사진 진단 없이 보건·의료 안내를 따르세요',
        lead: '홍역은 전염력이 큰 바이러스 질환입니다. 고열·기침·콧물·결막 증상 뒤 발진 등이 나타날 수 있으나 사이트·사진으로 병명을 단정하지 않습니다. 의심·노출 시 미리 연락 후 의료기관·보건소 안내를 따르고, 접종 기록은 예방접종도우미 등에서 확인하세요. 치료 약 용량은 정하지 않습니다.',
        points: [
            ['노출·의심', '사전 연락 후 진료, 다중 이용 시설 자제 안내 따르기'],
            ['예방', '연령별 MMR 등 접종 일정은 공식 도우미·의료진 확인']
        ],
        blocks: [
            ['지금 할 일', '접종 기록과 증상 시작 시각을 확인하세요.'],
            ['하지 않을 일', '사진 SNS로 “홍역 아니다”고 단정하지 마세요.'],
            ['관련', '발열·접종 안내를 참고하세요.']
        ],
        links: [
            ['질병관리청 홍역', 'https://www.kdca.go.kr/'],
            ['CDC 홍역', 'https://www.cdc.gov/measles/'],
            ['예방접종 일정 확인', 'blog/vaccination-schedule.html']
        ]
    },
    {
        id: 'pertussis-boundary',
        match: /(백일해|pertussis|whooping\s*cough|백일\s*해|경련성\s*기침\s*아기|흡기\s*성\s*훅)/,
        title: '백일해가 의심되면 기침 소리만으로 단정하지 말고 진료·접종 기록을 확인하세요',
        lead: '백일해는 심한 기침 발작으로 이어질 수 있으며 영아에게 특히 위험할 수 있습니다. “훅” 소리·무호흡·청색증·수유 곤란이 있으면 바로 의료 평가가 필요합니다. 사진·영상 댓글로 진단하지 말고, 가족 접종·예방은 공식 일정을 따릅니다. 항생제 여부는 의료진이 정합니다.',
        points: [
            ['위험 신호', '영아 무호흡·청색증·처짐, 수유 중단, 기침 후 구토'],
            ['예방', '연령별 접종, 임신·가족 접종은 의료진 안내']
        ],
        blocks: [
            ['지금 할 일', '기침 양상·호흡·수유를 기록하고 진료 연락을 하세요.'],
            ['하지 않을 일', '기침 억제 민간요법에만 의존하지 마세요.'],
            ['관련', 'RSV·호흡·접종 안내를 참고하세요.']
        ],
        links: [
            ['CDC 백일해', 'https://www.cdc.gov/pertussis/'],
            ['질병관리청 백일해', 'https://www.kdca.go.kr/'],
            ['예방접종 일정', 'blog/vaccination-schedule.html']
        ]
    },
    {
        id: 'flu-vaccine-child-boundary',
        match: /(독감\s*접종|독감\s*백신|인플루엔자\s*접종|flu\s*shot|flu\s*vaccine|독감\s*예방접종)/,
        title: '생후 6개월 이상 독감 예방접종 가능 여부는 접종 기관·일정으로 확인하세요',
        lead: '많은 안내가 생후 6개월 이상 어린이 독감 예방접종을 권합니다. 처음 접종 시 두 번이 필요한 연령대가 있을 수 있어 의료진·예방접종도우미 기록을 따릅니다. 접종 후 이상반응 경계는 별도 안내를 보고, 사이트에서 접종 “필수/불필요”를 개인에게 단정하지 않습니다.',
        points: [
            ['확인', '월령, 과거 접종, 알레르기·발열 여부 예진'],
            ['시기', '유행 전 접종 권고가 흔함, 지역·시즌 안내 따름']
        ],
        blocks: [
            ['지금 할 일', '예방접종도우미·수첩에서 독감 접종 기록을 확인하세요.'],
            ['하지 않을 일', '고열·중등도 이상 아플 때 임의로 맞히지 말고 예진을 받으세요.'],
            ['관련', '독감 증상·접종 후 안내를 참고하세요.']
        ],
        links: [
            ['CDC 어린이 독감 백신', 'https://www.cdc.gov/flu/highrisk/children.html'],
            ['예방접종도우미', 'https://nip.kdca.go.kr/'],
            ['접종 일정 글', 'blog/vaccination-schedule.html']
        ]
    },
    {
        id: 'flu-when-to-care',
        match: /(독감|인플루엔자|\bflu\b).*(병원|열|증상|아이|아기|의심)|아이.*독감|아기.*독감|독감\s*의심/,
        title: '독감 의심은 나이·호흡·수분·응급 신호를 보고 진료합니다',
        lead: '어린 아이, 특히 5세 미만은 독감 합병증 위험이 더 큽니다. 열·기침·몸살 같은 증상이 있으면 보호자가 진료 시점을 의논하고, 호흡 곤란·청색증·탈수·경련·처짐 등 응급 신호가 있으면 바로 의료기관을 찾으세요. 항바이러스제·해열제 용량은 사이트에서 정하지 않습니다.',
        points: [
            ['빨리 연락', '5세 미만·만성 질환, 증상 시작 직후 의사와 상담이 권고되는 경우가 많습니다.'],
            ['응급 신호', '빠른 호흡·호흡 곤란, 입술·얼굴 파람, 수분 섭취 불가, 깨우기 어려움, 경련, 12주 미만 발열']
        ],
        blocks: [
            ['지금 할 일', '증상 시작 시각, 체온, 수유·소변, 호흡 모습을 기록하세요.'],
            ['하지 않을 일', '항생제를 독감에 임의로 쓰거나, 해열제 용량을 댓글로 정하지 마세요.'],
            ['예방', '생후 6개월 이상 독감 예방접종 가능 여부는 접종 기관·도우미에서 확인하세요.']
        ],
        links: [
            ['CDC 어린이 독감', 'https://www.cdc.gov/flu/highrisk/children.html'],
            ['CDC 독감 응급 신호', 'https://www.cdc.gov/flu/signs-symptoms/index.html'],
            ['발열·응급 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'vaccine-bath-same-day-boundary',
        match: /(접종\s*후\s*목욕|접종\s*후\s*목욕|예방접종\s*당일\s*샤워|vaccine\s*bath\s*same\s*day)/,
        title: '접종 후 목욕은 의료진·기관 안내를 따르고, 접종 부위를 세게 문지르지 마세요',
        lead: '가벼운 미열은 흔할 수 있습니다. 해열제 용량은 표시·진료를 따르세요.',
        points: [
            ['관리', '부위 청결, 관찰'],
            ['진료', '고열, 처짐, 심한 반응']
        ],
        blocks: [
            ['지금 할 일', '안내문을 읽으세요.'],
            ['하지 않을 일', '부위를 긁지 않게 하세요.'],
            ['관련', '접종 후 안내를 참고하세요.']
        ],
        links: [
            ['접종 가이드', 'blog/baby-vaccination-schedule-guide.html'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'vaccine-aftercare',
        match: /(접종|예방접종|백신|주사).*(후|뒤|이상|열|부음|반응)|접종\s*후|백신\s*후/,
        title: '접종 후 가벼운 반응은 흔하고, 심한 반응은 바로 진료합니다',
        lead: '접종 부위 통증·부음, 미열, 보챔은 일시적으로 나타날 수 있습니다. 접종 직후 15~30분은 접종 기관에서 관찰하고, 고열·호흡 곤란·전신 두드러기·처짐·경련이 있으면 즉시 의료기관을 찾으세요.',
        points: [
            ['흔한 반응', '접종 부위가 빨개지거나 하루 이틀 보채고 열이 날 수 있습니다.'],
            ['즉시 진료', '호흡 곤란, 입술·얼굴 부종, 심한 두드러기, 깨우기 어려움, 경련']
        ],
        blocks: [
            ['지금 할 일', '접종 종류·시간·체온·먹은 양을 적고, 접종 기관이 안내한 관찰 시간을 지키세요.'],
            ['하지 않을 일', '해열제 용량을 인터넷 댓글로 정하거나, 이상반응을 “시간이 지나면 된다”며 방치하지 마세요.'],
            ['신고·상담', '이상반응이 의심되면 의료진과 상의하고 예방접종도우미 등으로 신고 경로를 확인할 수 있습니다.']
        ],
        links: [
            ['예방접종도우미 이상반응 안내', 'https://nip.kdca.go.kr/irhp/infm/goVcntInfo.do?menuLv=1&menuCd=152'],
            ['예방접종 일정 확인 순서', 'blog/vaccination-schedule.html'],
            ['발열·응급 가이드', 'blog/baby-fever-cold-guide.html#urgent']
        ]
    },
    {
        id: 'breath-hold-spell-vs-seizure-boundary',
        match: /(울다\s*기절|울다\s*숨\s*멈|breath\s*holding\s*spell|울음\s*후\s*파래|화내다\s*쓰러)/,
        title: '울음 뒤 숨 참고 파래지거나 기절처럼 보이면 기록을 남기고 진료로 확인하세요',
        lead: '호흡 정지 발작과 경련은 구분이 필요합니다. 응급 신호면 119·진료를 우선하세요. 사진만으로 진단하지 않습니다.',
        points: [
            ['관찰', '유발, 색, 회복'],
            ['응급', '긴 의식 소실, 경련']
        ],
        blocks: [
            ['지금 할 일', '동영상·시간 기록을 남기세요.'],
            ['하지 않을 일', '얼굴을 때리거나 물로 깨우지 마세요.'],
            ['관련', '호흡 정지 발작 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['응급', '#home']
        ]
    },
    {
        id: 'breath-holding-spell-boundary',
        match: /(호흡\s*정지\s*발작|숨\s*참고\s*울|숨을\s*참고\s*울|breath[-\s]?holding|울다\s*파래|울다\s*기절|울다가\s*(파래|기절|창백))/,
        title: '울다 숨을 참고 파래지거나 기절처럼 보이면 기록 후 진료로 원인을 확인하세요',
        lead: '일부 유아는 심하게 운 뒤 잠시 숨을 참고 얼굴이 창백·파래지거나 짧게 의식을 잃는 듯 보일 수 있습니다. 경련·심장·다른 원인과 구분은 의료진이 합니다. 발작 중 입으로 물건을 넣거나 흔들지 마세요. 진단명 단정은 하지 않습니다.',
        points: [
            ['당시', '옆으로 안전하게, 입 안 이물 확인, 시간 기록'],
            ['진료', '첫 발생, 길어짐, 열·외상 동반, 회복 느림']
        ],
        blocks: [
            ['지금 할 일', '영상(가능하면)과 유발 상황(울음·통증)을 적어 두세요.'],
            ['하지 않을 일', '흔들거나 물을 먹이려 억지로 입을 벌리지 마세요.'],
            ['관련', '열성경련·머리 부딪힘 안내를 참고하세요.']
        ],
        links: [
            ['AAP 호흡 정지 발작 개요', 'https://www.healthychildren.org/English/health-issues/conditions/head-neck-nervous-system/Pages/default.aspx'],
            ['NHS breath-holding (영)', 'https://www.nhs.uk/conditions/breath-holding-in-babies-and-children/']
        ]
    },
    {
        id: 'febrile-seizure',
        match: /(열성\s*경련|열\s*경련|발열\s*경련|경련.*(열|발열)|열이?\s*나.*경련|경련.*병원)/,
        title: '열성경련이 의심되면 안전·호흡을 먼저 보고, 용량·진단은 현장에서 정하지 않습니다',
        lead: '열이 나면서 몸을 떨거나 의식을 잃는 듯 보이면 보호자는 아이를 안전하게 눕히고 주변을 치운 뒤 호흡·입술 색·지속 시간을 봅니다. 경련 중에는 입에 손가락·물건을 넣지 마세요. 해열제·항경련제 용량을 사이트·댓글로 정하지 않으며, 첫 경련·5분 이상·호흡 곤란·처짐이 있으면 119 또는 응급실을 우선합니다.',
        points: [
            ['당장', '평평한 곳에 옆으로 또는 안전하게 눕히기, 시계로 시간 확인, 입 안에 아무것도 넣지 않기'],
            ['바로 도움', '5분 이상 지속, 호흡이 이상함, 파랗게 보임, 경련 후 깨우기 어려움, 생후 어린 아기, 첫 경련']
        ],
        blocks: [
            ['지금 할 일', '시작·종료 시각, 체온(가능하면), 전신/부분 경련 여부, 최근 병을 기록하세요.'],
            ['하지 않을 일', '경련 중 물·약을 억지로 먹이거나, 해열제 ml를 인터넷에서 맞춰 반복하지 마세요.'],
            ['진료', '끝난 뒤에도 처지거나 열이 계속되면 의료진 평가를 받으세요. 이 안내는 진단이 아닙니다.']
        ],
        links: [
            ['NHS 열성경련', 'https://www.nhs.uk/conditions/febrile-seizures/'],
            ['AAP 열성경련 안내', 'https://www.healthychildren.org/English/health-issues/conditions/fever/Pages/Febrile-Seizures.aspx'],
            ['발열·응급 가이드', 'blog/baby-fever-cold-guide.html#urgent']
        ]
    },
    {
        id: 'thermometer-method-boundary',
        match: /(체온\s*재|체온계|항문\s*체온|귀\s*체온|이마\s*체온|온도계\s*아기|thermometer)/,
        title: '체온은 측정 부위·방법에 따라 숫자가 달라질 수 있어, 숫자만으로 판단하지 마세요',
        lead: '영아는 올바른 방법으로 측정하는 것이 중요하고, 이마·귀·겨드랑이 값은 상황에 따라 다를 수 있습니다. 제품 설명서를 따르고, 열 여부는 나이·아이 상태와 함께 봅니다. 해열제 용량을 사이트에서 정하지 않습니다.',
        points: [
            ['측정', '설명서 부위, 움직임을 줄인 상태, 반복 확인'],
            ['판단', '숫자+호흡·처짐·수분, 어린 영아 고열은 진료']
        ],
        blocks: [
            ['지금 할 일', '집에 있는 체온계 설명서의 권장 부위를 확인하세요.'],
            ['하지 않을 일', '손등만으로 “열 없다”고 단정하지 마세요.'],
            ['관련', '발열 가이드를 참고하세요.']
        ],
        links: [
            ['AAP 체온 재기', 'https://www.healthychildren.org/English/health-issues/conditions/fever/Pages/How-to-Take-a-Childs-Temperature.aspx'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'kawasaki-when-care-boundary',
        match: /(가와사키|가와사끼|kawasaki|五日熱|닷새\s*이상\s*열\s*발진\s*눈|열\s*5일\s*이상\s*눈\s*빨개)/,
        title: '고열이 며칠 가고 눈 충혈·발진·입술 갈라짐 등이 겹치면 가와사키 등 평가를 위해 진료하세요',
        lead: '가와사키병은 의료진이 진단 기준과 검사로 판단합니다. 사진만으로 단정하지 마세요. 고열이 지속되고 눈·입술·손발·목 림프절 변화가 있으면 소아과·응급실을 미루지 마세요. 치료·약 용량은 사이트에서 정하지 않습니다.',
        points: [
            ['관찰', '열 지속 일수, 눈 충혈, 발진, 입술·혀, 손발 부기'],
            ['행동', '기록 후 진료, 해열제만으로 안심하지 않기']
        ],
        blocks: [
            ['지금 할 일', '열 시작 시각과 동반 증상을 적어 두세요.'],
            ['하지 않을 일', '카페 사진과 비교해 병명을 단정하지 마세요.'],
            ['관련', '발열 진료 시점·발진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가와사키·발열 개요', 'https://www.healthychildren.org/English/health-issues/conditions/heart/Pages/default.aspx'],
            ['CDC 가와사키 개요', 'https://www.cdc.gov/kawasaki/']
        ]
    },
    {
        id: 'fever-recheck-interval-boundary',
        match: /(열\s*재는\s*간격|열\s*몇\s*분\s*마다|fever\s*recheck|체온\s*다시\s*재|열\s*계속\s*재)/,
        title: '열은 증상·처짐과 함께 보고, 너무 자주 재기보다 변화와 위험 신호를 보세요',
        lead: '측정 방법과 연령별 진료 기준이 중요합니다. 해열제 용량은 의료진·표시를 따르고 여기서 숫자를 정하지 않습니다.',
        points: [
            ['관찰', '처짐, 수분, 호흡'],
            ['진료', '연령·고열·이상 신호']
        ],
        blocks: [
            ['지금 할 일', '측정 방법(겨드랑이 등)을 일정하게 하세요.'],
            ['하지 않을 일', '5분마다 재며 불안만 키우지 마세요.'],
            ['관련', '열 안내를 참고하세요.']
        ],
        links: [
            ['열 가이드', 'blog/baby-fever-cold-guide.html'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'fever-free-return-timing-boundary',
        match: /(해열\s*후\s*등원|열\s*떨어지고\s*어린이집|fever\s*free\s*return|해열제\s*먹고\s*등원|열\s*없이\s*몇\s*시간)/,
        title: '등원·등교는 시설 규정과 증상 호전을 함께 보고, 해열제만으로 숨긴 채 보내지 마세요',
        lead: '질환마다 기준이 다릅니다. 해열제 용량은 여기서 정하지 않습니다.',
        points: [
            ['기준', '시설 안내, 전신 상태'],
            ['금지', '약으로 열만 가리기']
        ],
        blocks: [
            ['지금 할 일', '시설 복귀 규칙을 확인하세요.'],
            ['하지 않을 일', '열이 약으로만 떨어졌는데 아프면 보내지 마세요.'],
            ['관련', '열·등원 안내를 참고하세요.']
        ],
        links: [
            ['열 가이드', 'blog/baby-fever-cold-guide.html'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'alternating-fever-meds-boundary',
        match: /(해열제\s*교차\s*복용|해열제\s*교차|타이레놀\s*부루펜\s*번갈아|alternating\s*fever\s*meds)/,
        title: '해열제 교차 복용은 의료진 지시 없이 임의로 하지 말고, 용량은 표시·진료를 따르세요',
        lead: '여기서 ml·mg를 정하지 않습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '의료진·표시'],
            ['금지', '임의 교차·과량']
        ],
        blocks: [
            ['지금 할 일', '체중과 제품 표시를 확인하세요.'],
            ['하지 않을 일', '시간을 기록 없이 반복 투여하지 마세요.'],
            ['관련', '열 안내를 참고하세요.']
        ],
        links: [
            ['열 가이드', 'blog/baby-fever-cold-guide.html'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'fever-triage',
        match: /((열|발열|고열|체온).*(몇\s*도|병원|응급|괜찮|났|나요)|38\s*도)/,
        title: '열은 체온 숫자와 아이 상태를 함께 보세요',
        lead: '생후 3개월 미만에서 38℃ 이상이면 바로 의료기관의 평가를 받아야 합니다. 그보다 큰 아이도 호흡·반응·수분 섭취·경련·발진을 함께 봅니다.',
        points: [
            ['바로 진료', '생후 3개월 미만 38℃ 이상, 평소와 뚜렷하게 다른 처짐이나 수분 섭취 감소'],
            ['즉시 도움', '숨쉬기 힘듦, 파랗게 보임, 깨워도 반응이 매우 약함, 5분 이상 경련은 119 또는 응급실']
        ],
        blocks: [
            ['지금 할 일', '체온을 다시 정확히 재고 아이 나이, 측정 방법, 호흡, 반응, 마신 양과 소변을 함께 기록하세요.'],
            ['하지 않을 일', '체온 숫자만 낮추려고 약을 반복하거나, 성분과 용량을 확인하지 않고 해열제를 번갈아 먹이지 마세요.'],
            ['진료·상담', '보호자가 위험하다고 느끼거나 아이 상태가 빠르게 달라지면 온라인 답보다 진료를 우선하세요.']
        ],
        links: [
            ['발열·응급 전체 가이드', 'blog/baby-fever-cold-guide.html#urgent'],
            ['NICE 5세 미만 발열 지침', 'https://www.nice.org.uk/guidance/ng143/chapter/Recommendations'],
            ['질병관리청 발열 설명', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5285']
        ]
    },
    {
        id: 'wake-to-feed',
        match: /(깨워서|깨워)\s*(먹|수유)|자는데\s*(먹|수유)|통잠.*(먹|수유)|((밤중?\s*수유|밤수유).*(해야|하나요|깨|먹이|간격|몇\s*시간))/,
        title: '자는 아기를 깨워 먹일지는 성장 상태를 먼저 봅니다',
        lead: '모든 아기에게 같은 밤중 수유 종료일은 없습니다. 건강하게 자라고 충분히 먹는 아기는 보통 매번 깨울 필요가 없지만, 신생아 초기와 성장·황달·조산 문제가 있으면 의료진이 정한 간격이 우선입니다.',
        points: [
            ['깨워야 할 수 있어요', '아직 출생 체중을 회복하지 못했거나 조산·황달·수유 곤란이 있거나 의료진에게 수유 계획을 받은 경우'],
            ['그냥 재울 수 있어요', '건강하게 체중이 늘고 잘 먹으며 소변이 평소대로인 아기는 담당 의료진과 확인한 뒤 배고픔 신호에 맞춥니다.']
        ],
        blocks: [
            ['지금 할 일', '최근 체중 변화, 24시간 수유 횟수, 젖은 기저귀와 깨웠을 때 먹는 모습을 적어 두세요.'],
            ['하지 않을 일', '개월 수나 통잠 시간 하나만 보고 밤중 수유를 갑자기 끊거나 반대로 모든 아기를 같은 간격으로 깨우지 마세요.'],
            ['진료·상담', '깨우기 어렵고 너무 처지거나 먹지 못하고 소변이 뚜렷하게 줄면 바로 의료진에게 문의하세요.']
        ],
        links: [
            ['CDC 분유 수유량·간격', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/how-much-and-how-often.html'],
            ['AAP 밤중 수유·수면 안내', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/Sleeping-Through-the-Night.aspx']
        ]
    },
    {
        id: 'night-feed-interval-myth-boundary',
        match: /(야간\s*수유\s*간격\s*단정)/,
        title: '밤 수유 간격을 하나의 숫자로 단정하지 말고, 성장·의료진 계획을 보세요',
        lead: '개인차가 큽니다. 탈수·체중 신호는 진료하세요.',
        points: [
            ['관찰', '체중, 소변, 처짐'],
            ['금지', '고정 시간 강요']
        ],
        blocks: [
            ['지금 할 일', '수유·소변을 기록하세요.'],
            ['하지 않을 일', '인터넷 고정 간격만 따르지 마세요.'],
            ['관련', '밤중 수유 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수유 가이드', 'blog/breastfeeding-guide.html']
        ]
    },
    {
        id: 'feeding-amount',
        match: /(수유\s*텀|수유텀|수유\s*간격|분유\s*량|분유량|수유\s*량|수유량|먹는\s*양.*(괜찮|적당|맞)|얼마나\s*먹)/,
        title: '수유량·간격은 한 번의 숫자로 판정하지 않습니다',
        lead: '먹는 양과 간격은 아이마다 다르고 성장하면서 달라집니다. 제품 표나 평균값보다 배고픔·포만 신호, 24시간 전체 흐름, 소변과 성장 추이를 함께 봐야 합니다.',
        points: [
            ['배고픔 신호', '입을 찾고 손을 입으로 가져가며 몸을 움직이는 초기 신호에 반응하고, 울 때까지 기다리지 않습니다.'],
            ['배부름 신호', '고개를 돌리거나 입을 닫고 빨기를 멈추면 남은 양을 끝까지 먹이려고 강요하지 않습니다.']
        ],
        blocks: [
            ['지금 할 일', '하루 동안 시간·양·먹는 신호·젖은 기저귀를 간단히 기록하고 한 번이 아니라 며칠의 흐름을 보세요.'],
            ['하지 않을 일', '분유를 더 진하거나 묽게 타지 말고 제품에 표시된 물과 분말 비율을 그대로 지키세요.'],
            ['진료·상담', '성장이 정체되거나 먹을 때 숨이 차고 자주 사레들며, 반복 구토·통증·소변 감소가 있으면 상담하세요.']
        ],
        links: [
            ['CDC 분유량·간격 원문', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/how-much-and-how-often.html'],
            ['CDC 분유 조제 원문', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html'],
            ['질병관리청 모유 수유 안내', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586']
        ]
    },
    {
        id: 'breastfeeding-duration',
        match: /(모유).*(언제\s*까지|몇\s*개월|기간|지속|얼마나\s*(해|먹)|언제까지)|모유\s*수유\s*(기간|권장)|완전\s*모유|전적\s*모유|exclusive\s*breast/,
        title: '모유는 “한 날짜에 끊기”보다 단계 권고를 봅니다',
        lead: '특별한 금기가 없으면 생후 약 6개월까지는 모유만(완전 모유)으로 충분하다는 권고가 있고, 6개월 무렵 이유식을 시작하면서 모유를 이어 가며, 엄마와 아기가 원하면 2년 이상까지 지속해도 된다는 안내가 있습니다. 모든 가정에 같은 끊는 날은 없습니다.',
        points: [
            ['약 6개월까지', '물·이유식·다른 우유 없이 모유만으로 충분한 시기로 권고됩니다. 체계적 문헌고찰에서는 완전 모유 6개월이 3~4개월 혼합보다 장 감염 위험이 더 낮다는 근거가 있습니다.'],
            ['6개월 이후', '안전한 이유기 보충식을 시작하면서 모유를 병행하고, 질병관리청은 가능하면 두 돌 전후, WHO·AAP는 2년 이상까지 상호 원할 때 지속을 지지합니다.']
        ],
        blocks: [
            ['지금 할 일', '아이 나이·성장·현재 수유 횟수를 확인하고, 이유식을 시작했다면 모유를 갑자기 끊지 말고 병행 흐름을 유지하세요.'],
            ['하지 않을 일', '개월 수·주변 아이 사례·영상 조회수만 보고 하루아침에 끊거나, 모유 대신 생우유를 첫돌 전에 주된 음료로 바꾸지 마세요.'],
            ['진료·상담', '젖양이 걱정되거나, 성장 정체·심한 통증·유선염 의심, 산모 약·질환으로 수유 가능 여부가 불확실하면 의료진·수유 상담과 개별 계획을 확인하세요.']
        ],
        links: [
            ['질병관리청 성공적인 모유 수유', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586'],
            ['질병관리청 이유기보충식·모유 지속', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5470'],
            ['WHO 모유 수유 권고', 'https://www.who.int/health-topics/breastfeeding'],
            ['AAP 모유 수유 정책 요약', 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/Where-We-Stand-Breastfeeding.aspx'],
            ['Cochrane·WHO ELENA 완전 모유 기간 근거', 'https://www.who.int/tools/elena/review-summaries/exclusive-breastfeeding--optimal-duration-of-exclusive-breastfeeding']
        ]
    },
    {
        id: 'breastfeeding-wean',
        match: /(모유).*(끊|떼|단유|중단\s*하|끊는\s*방법|떼는\s*방법)|단유|젖\s*떼|젖\s*끊(?!\s*병)|수유\s*중단/,
        title: '모유를 줄일 때는 하루아침에 끊지 않는 편이 안전합니다',
        lead: '끊는 날짜는 가정마다 다릅니다. 공식 권고는 “가능하면 오래”이지만, 직장·건강·상호 의사에 따라 줄일 수 있습니다. 한 번에 모두 끊기보다 수유 횟수를 며칠~몇 주 간격으로 줄이면 엄마 유방 울혈과 아이 적응에 도움이 됩니다.',
        points: [
            ['줄이는 순서', '아이가 덜 집착하는 수유 한 번부터 줄이고, 대신 이유식·물(개월에 맞게)·안아 주기·놀이를 이어 갑니다.'],
            ['첫돌 전', '모유를 줄이면 영아용 조제유 등으로 수분을·영양을 채워야 합니다. 생우유를 주된 음료로 쓰지 마세요.']
        ],
        blocks: [
            ['지금 할 일', '줄일 수유 시간과 대체 식사·음료 계획을 적고, 유방이 단단하고 아프면 편안하게 될 정도만 짜 내고 한꺼번에 비우지 마세요.'],
            ['하지 않을 일', '죄책감·비교로 갑작스러운 단유를 강행하거나, 처방 없이 젖말리기 약을 쓰지 마세요.'],
            ['진료·상담', '고열·유방 발적·심한 통증(유선염 의심), 아이 수분 섭취 급감·성장 걱정이 있으면 의료진과 상담하세요.']
        ],
        links: [
            ['질병관리청 모유 수유 안내', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586'],
            ['CDC 12개월 우유 전환', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/cows-milk-and-milk-alternatives.html'],
            ['LLL 단유(점진적 줄이기) 안내', 'https://llli.org/breastfeeding-info/weaning-how-to/']
        ]
    },
    {
        id: 'fluoride-water-infant-boundary',
        match: /(불소\s*수돗물|수돗물\s*불소|fluoride\s*water|불소\s*물\s*아기|수돗물\s*분유\s*불소)/,
        title: '수돗물 불소는 지역마다 다르며, 분유·치약 불소와 합쳐 과도하지 않게 의료·치과 안내를 따르세요',
        lead: '일부 지역 수돗물에는 불소가 들어 있습니다. 분유를 수돗물로 탈 때·치약 사용과 겹치면 반점치 위험이 논의됩니다. 지역 수질·치과 안내를 확인하고, 사이트에서 불소 용량·브랜드를 정하지 않습니다.',
        points: [
            ['확인', '거주 지역 수돗물 불소, 분유 조유 물'],
            ['치아', '치약 완두콩·쌀알 크기 등 연령 안내, 삼킴 줄이기']
        ],
        blocks: [
            ['지금 할 일', '지자체·수도 사업 불소 정보를 확인하세요.'],
            ['하지 않을 일', '성인 고불소 제품을 영아에게 쓰지 마세요.'],
            ['관련', '분유 조유·양치·물 주기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 불소·구강 건강', 'https://www.cdc.gov/fluoridation/'],
            ['AAP 불소·치아 개요', 'https://www.healthychildren.org/English/healthy-living/oral-health/Pages/default.aspx']
        ]
    },
    {
        id: 'infant-water',
        match: /(아기|아이|신생아|영아).*(물[을를]?\s*(줘|주|먹|마시|돼|되)|물은|물\s*언제)|물\s*(언제|얼마나).*(먹|주)|수유\s*중\s*물|모유.*(물)|완전\s*모유.*물|물을?\s*줘도/,
        title: '생후 약 6개월 전에는 물만 따로 주지 않는 것이 원칙입니다',
        lead: '완전 모유 또는 영아용 조제유를 먹는 기간에는 보통 물·차·주스를 추가로 주지 않습니다. 약 6개월 이후 이유식을 시작하면서 소량의 물을 컵으로 연습할 수 있고, 양은 아이·기후·식사에 따라 의료진 안내를 따릅니다.',
        points: [
            ['6개월 전', '모유·조제유가 수분과 영양을 함께 제공합니다. 더위만으로 물을 임의로 많이 주지 마세요.'],
            ['6개월 이후', '이유식과 함께 소량의 물을 천천히 소개하고, 주된 음료를 물·주스로 바꾸지 마세요.']
        ],
        blocks: [
            ['지금 할 일', '아이 개월 수와 현재 수유·이유식 상태를 확인하고, 소변이 평소보다 진하거나 적으면 수유량·수분과 함께 상태를 적어두세요.'],
            ['하지 않을 일', '생후 초기 아기에게 다량의 물을 먹이거나(수분중독 위험), 설탕·꿀이 든 음료를 주지 마세요.'],
            ['진료·상담', '구토·설사·발열과 함께 소변 감소, 처짐이 있으면 탈수 평가를 위해 진료받으세요.']
        ],
        links: [
            ['WHO 완전 모유·보충식', 'https://www.who.int/health-topics/breastfeeding'],
            ['질병관리청 이유기보충식', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5470'],
            ['CDC 이유식·음료 안내', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html']
        ]
    },
    {
        id: 'bedtime-routine-consistency-boundary',
        match: /(취침\s*루틴|잠자리\s*의식|bedtime\s*routine|자기\s*전\s*순서|목욕\s*책\s*재우)/,
        title: '취침 루틴은 짧고 비슷한 순서로 반복하는 편이 적응에 도움이 될 수 있습니다',
        lead: '매일 같은 순서는 수면 신호로 쓰일 수 있습니다. 화면을 루틴 끝에 두지 않는 편이 좋습니다. 특정 제품 필수 주장은 하지 않습니다.',
        points: [
            ['구성', '짧게, 같은 순서'],
            ['피하기', '취침 직전 화면']
        ],
        blocks: [
            ['지금 할 일', '목욕·책·불 끄기처럼 2~3단계를 정해 보세요.'],
            ['하지 않을 일', '매일 전혀 다른 자극으로 끝내지 마세요.'],
            ['관련', '수면·화면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수면 가이드', 'blog/baby-sleep-training.html']
        ]
    },
    {
        id: 'nap-refusal-overtired-boundary',
        match: /(낮잠\s*거부\s*보챔|낮잠\s*거부\s*보챔|낮잠\s*안\s*자\s*보채|nap\s*refusal\s*overtired)/,
        title: '낮잠을 거부해도 과피로 보채면 조용한 휴식 시간을 두고, 무리한 강요를 피하세요',
        lead: '전환기에는 일찍 취침이 도움이 될 수 있습니다.',
        points: [
            ['대안', '조용한 휴식'],
            ['피하기', '장시간 강요']
        ],
        blocks: [
            ['지금 할 일', '어두운 방에서 쉬게 해보세요.'],
            ['하지 않을 일', '안 잔다고 벌을 주지 마세요.'],
            ['관련', '낮잠 전환 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수면 가이드', 'blog/baby-sleep-training.html']
        ]
    },
    {
        id: 'nap-transition-drop-boundary',
        match: /(낮잠\s*줄이|낮잠\s*합치|nap\s*transition|낮잠\s*하나\s*로|낮잠\s*드롭)/,
        title: '낮잠 횟수를 줄일 때는 며칠 적응을 보고, 과도한 보챔·밤 수면 악화가 길면 속도를 조절하세요',
        lead: '낮잠 전환은 월령마다 다릅니다. 고정 개월 수 하나만으로 결정하지 말고 아이 신호를 보세요.',
        points: [
            ['신호', '낮잠 거부, 늦은 취침'],
            ['조절', '점진, 일찍 취침']
        ],
        blocks: [
            ['지금 할 일', '전환 기간 취침을 조금 앞당겨 보세요.'],
            ['하지 않을 일', '하루아침에 낮잠을 모두 없애지 마세요.'],
            ['관련', '수면·낮잠 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수면 가이드', 'blog/baby-sleep-training.html']
        ]
    },
    {
        id: 'weekend-sleep-in-child-boundary',
        match: /(주말\s*늦잠\s*아이|주말\s*늦잠\s*아이|주말\s*수면\s*패턴|weekend\s*sleep\s*in\s*child)/,
        title: '주말 늦잠이 평일 수면을 크게 흔들면 기상·취침 차를 줄여 보세요',
        lead: '개인차가 있습니다. 수면제 추천은 하지 않습니다.',
        points: [
            ['조절', '기상 차 줄이기'],
            ['관찰', '낮잠, 취침']
        ],
        blocks: [
            ['지금 할 일', '평일과 1~2시간 이상 차이 나지 않게 해보세요.'],
            ['하지 않을 일', '주말에 밤을 새우게 두지 마세요.'],
            ['관련', '수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수면 가이드', 'blog/baby-sleep-training.html']
        ]
    },
    {
        id: 'early-wake-boundary',
        match: /(새벽\s*기상|너무\s*일찍\s*깨|early\s*wake|아침\s*5시\s*깨|일찍\s*일어나는\s*아이\s*수면)/,
        title: '너무 이른 기상은 낮잠·취침 시각·빛·소음을 함께 보고, 한 가지 원인으로 단정하지 마세요',
        lead: '이른 기상은 수면 압·환경·발달이 겹칠 수 있습니다. 낮에 과도한 카페인(수유부) 단정은 피하고 패턴을 기록하세요.',
        points: [
            ['점검', '낮잠, 취침, 빛'],
            ['환경', '소음, 온도']
        ],
        blocks: [
            ['지금 할 일', '1~2주 기상 시각을 기록해 보세요.'],
            ['하지 않을 일', '새벽마다 긴 놀이로 보상하지 마세요.'],
            ['관련', '밤중 깨어남·수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수면 가이드', 'blog/baby-sleep-training.html']
        ]
    },
    {
        id: 'daylight-saving-sleep-boundary',
        match: /(썸머타임\s*수면|서머타임\s*수면|daylight\s*saving|일광\s*절약\s*시간\s*수면|시계\s*한\s*시간\s*수면|섬머타임\s*재우)/,
        title: '시계 변경 시기 수면은 며칠에 걸쳐 조금씩 맞추고, 낮 활동을 일정하게 유지하세요',
        lead: '한 시간 시계 이동은 어린이 수면 리듬을 흔들 수 있습니다. 며칠에 걸쳐 취침을 조금씩 옮기고 아침 빛을 활용하세요. 수면제 추천은 하지 않습니다.',
        points: [
            ['조절', '며칠에 걸쳐 10~15분씩'],
            ['낮', '규칙적 활동, 아침 빛']
        ],
        blocks: [
            ['지금 할 일', '취침 시각을 며칠에 나눠 옮기세요.'],
            ['하지 않을 일', '하루아침에 한 시간을 강제하지 마세요.'],
            ['관련', '새벽 기상·취침 루틴 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수면 가이드', 'blog/baby-sleep-training.html']
        ]
    },
    {
        id: 'night-waking',
        match: /(통잠|밤잠|잠투정|자주\s*깨|밤에\s*깨|새벽에\s*깨|안\s*자|잠을\s*안)/,
        title: '밤에 깨는 것만으로 수면 문제가 되지는 않습니다',
        lead: '아기는 수면 주기가 짧아 밤에 잠깐 깨는 일이 흔하고 통잠의 같은 마감 시점은 없습니다. 먼저 통잠 훈련보다 안전한 수면 환경과 아이 상태를 확인하세요.',
        points: [
            ['밤에 할 일', '불빛과 말을 줄이고 배고픔·기저귀·통증·덥거나 추운지 확인한 뒤 차분하게 다시 재웁니다.'],
            ['항상 지킬 것', '첫돌 전 모든 잠은 등을 대고, 단단하고 평평한 별도 수면면에, 베개·이불·범퍼·인형 없이 재웁니다.']
        ],
        blocks: [
            ['오늘 확인', '깨는 시간보다 숨쉬기, 먹는 양, 낮 동안 반응과 안전한 잠자리부터 기록하세요.'],
            ['하지 않을 일', '통잠을 위해 엎어 재우거나 경사진 침대, 수면 포지셔너, 푹신한 침구를 사용하지 마세요.'],
            ['진료·상담', '호흡이 멈추거나 파랗게 보임, 깨우기 어려움, 먹지 못함, 통증·발열이 함께 있으면 의료진에게 문의하세요.']
        ],
        links: [
            ['1세 미만 안전수면 가이드', 'blog/baby-safe-sleep-guide.html'],
            ['CDC 안전수면 원문', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 아기 수면 안내', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/getting-your-baby-to-sleep.aspx']
        ]
    },
    {
        id: 'helium-balloon-safety',
        match: /(헬륨\s*풍선|helium\s*balloon|헬륨\s*흡입|풍선\s*가스\s*마심|헬륨\s*마시고)/,
        title: '헬륨을 들이마시게 하지 말고, 터진 풍선 조각도 치우세요',
        lead: '헬륨을 들이마시면 산소 부족으로 위험할 수 있습니다. 파티 장난으로 흡입하지 마세요. 터진 풍선 조각은 질식 위험이 있어 바로 치웁니다. 라텍스 알레르기도 고려하세요.',
        points: [
            ['금지', '헬륨 흡입, 조각 방치'],
            ['관리', '사용한 풍선 정리, 영아 손 닿지 않게']
        ],
        blocks: [
            ['지금 할 일', '파티 후 풍선 조각을 모두 치우세요.'],
            ['하지 않을 일', '헬륨을 마시고 목소리 장난을 시키지 마세요.'],
            ['관련', '풍선 질식·파티 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 풍선 안전', 'https://www.cpsc.gov/'],
            ['AAP 질식 예방', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx']
        ]
    },
    {
        id: 'balloon-choking',
        match: /(풍선\s*질식|풍선\s*조각|라텍스\s*풍선|풍선\s*터진|풍선\s*삼)/,
        title: '라텍스 풍선 조각은 질식 위험이 커서 어린 아이 주변에 두지 마세요',
        lead: '터진 풍선 조각·미처 불어지지 않은 풍선은 기도에 달라붙어 질식을 일으킬 수 있다는 안전 안내가 많습니다. 어린 아이 파티에서는 보호자가 조각을 바로 치우고, 혼자 풍선을 물지 못하게 하세요. 헬륨 가스 흡입 장난도 위험합니다. 브랜드 추천은 하지 않습니다.',
        points: [
            ['위험', '터진 조각, 불지 않은 풍선, 감독 없는 놀이'],
            ['응급', '숨을 못 쉼·청색증·소리 없는 질식은 응급처치·119']
        ],
        blocks: [
            ['지금 할 일', '집·차 안에 풍선 조각이 남아 있지 않은지 치우세요.'],
            ['하지 않을 일', '영아에게 풍선을 물고 놀게 하지 마세요.'],
            ['관련', '질식·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Choking-Prevention.aspx'],
            ['CDC 질식 위험', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html']
        ]
    },
    {
        id: 'popcorn-nuts-choking',
        match: /(팝콘\s*질식|팝콘\s*아이|견과\s*통째|땅콩\s*통째|호두\s*통째|씨앗\s*통째|하드\s*캔디|사탕\s*질식)/,
        title: '팝콘·통 견과·단단한 사탕은 어린 아이에게 질식 위험이 큽니다',
        lead: '팝콘, 통째 견과, 단단한 사탕·젤리 일부는 어린 아이 질식 위험 식품으로 자주 꼽힙니다. 연령·씹기 능력에 맞게 피하거나 안전하게 바꾸고, 앉아서 먹이며 뛰어다니며 주지 마세요. “몇 살부터 가능” 한 줄만으로 단정하지 말고 아이 상태를 봅니다.',
        points: [
            ['주의 식품', '팝콘, 통 견과, 단단한 사탕, 큼직한 덩어리'],
            ['환경', '앉아서, 보호자 감시, 누워서 금지']
        ],
        blocks: [
            ['지금 할 일', '간식 목록에서 통 견과·팝콘이 있는지 점검하세요.'],
            ['하지 않을 일', '차 뒷좌석에서 통 견과를 혼자 먹게 하지 마세요.'],
            ['관련', '둥근 음식 자르기·질식 안내를 참고하세요.']
        ],
        links: [
            ['CDC 질식 위험 식품', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html'],
            ['이유식·질식 가이드', 'blog/complementary-feeding-allergy-guide.html']
        ]
    },
    {
        id: 'large-cheese-chunk-choking',
        match: /(치즈\s*덩어리|큰\s*치즈\s*조각|cheese\s*chunk|큐브\s*치즈)/,
        title: '큰 치즈 덩어리는 질식 위험이 있어 가늘고 작게 자르세요',
        lead: '단단한 치즈 큐브도 통째면 위험할 수 있습니다. 연령에 맞게 자르세요.',
        points: [
            ['준비', '가늘게, 작게'],
            ['감독', '앉아서']
        ],
        blocks: [
            ['지금 할 일', '한입 크기로 나누세요.'],
            ['하지 않을 일', '큰 큐브를 통째로 주지 마세요.'],
            ['관련', '스트링 치즈·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx']
        ]
    },
    {
        id: 'string-cheese-choking-boundary',
        match: /(스트링\s*치즈|치즈\s*스틱\s*질식|string\s*cheese|치즈\s*막대\s*통째|치즈\s*스틱\s*한\s*입)/,
        title: '치즈 스틱·스트링 치즈는 길게 찢거나 작게 잘라 주세요',
        lead: '통째로 물고 뜯는 치즈 스틱은 덩어리가 되어 질식 위험이 있습니다. 세로로 찢거나 작은 조각으로 주고, 앉아서 먹이세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['자르기', '세로 찢기, 작은 조각, 앉은 자세'],
            ['금지', '뛰어다니며 먹기, 큰 덩어리']
        ],
        blocks: [
            ['지금 할 일', '간식 치즈를 미리 찢어 접시에 담으세요.'],
            ['하지 않을 일', '유모차에서 통째로 물려 두지 마세요.'],
            ['관련', '원형 식품·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식 예방', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CDC 질식 예방', 'https://www.cdc.gov/justrun/choking/']
        ]
    },
    {
        id: 'marshmallow-choking-boundary',
        match: /(마시멜로\s*질식|마시멜로\s*아이|marshmallow\s*chok|솜사탕\s*덩어리\s*먹)/,
        title: '마시멜로·끈적한 큰 덩어리는 질식 위험이 있어 작게 나누고 앉아서 먹이세요',
        lead: '부드러워도 기도를 막을 수 있습니다. 뛰어다니며 먹지 않게 하세요.',
        points: [
            ['준비', '작게, 앉기'],
            ['금지', '통째로, 달리며']
        ],
        blocks: [
            ['지금 할 일', '한 입에 들어갈 크기로 나누세요.'],
            ['하지 않을 일', '누워서 먹이지 마세요.'],
            ['관련', '질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'hot-dog-cut-lengthwise-boundary',
        match: /(핫도그\s*세로|소시지\s*길이\s*방향|hot\s*dog\s*cut\s*length|핫도그\s*자르기\s*방법|비엔나\s*세로)/,
        title: '핫도그·소시지는 길이 방향으로 가른 뒤 작게 자르고, 통째로 주지 마세요',
        lead: '원통 형태는 기도를 막을 수 있습니다. 앉아서 먹이세요.',
        points: [
            ['자르기', '세로로, 작게'],
            ['금지', '통째 원통']
        ],
        blocks: [
            ['지금 할 일', '길이 방향으로 가른 뒤 잘게 자르세요.'],
            ['하지 않을 일', '뛰어다니며 먹이지 마세요.'],
            ['관련', '둥근 음식 질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'cherry-pit-choking-boundary',
        match: /(체리\s*씨|체리\s*씨앗\s*아이|cherry\s*pit\s*child|체리\s*씨\s*빼고|체리\s*통째\s*아이)/,
        title: '체리는 씨를 제거하고 작게 잘라 주고, 통째로 주지 마세요',
        lead: '씨와 둥근 과육이 질식 위험이 될 수 있습니다.',
        points: [
            ['준비', '씨 제거, 작게'],
            ['감독', '앉아서']
        ],
        blocks: [
            ['지금 할 일', '씨 제거 후 주세요.'],
            ['하지 않을 일', '달리며 먹이지 마세요.'],
            ['관련', '둥근 음식 질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'cherry-tomato-cut-boundary',
        match: /(방울토마토\s*자르기|방울토마토\s*자르|체리\s*토마토\s*질식|cherry\s*tomato\s*cut)/,
        title: '방울토마토는 세로로 4등분하는 등 작게 자르고 통째로 주지 마세요',
        lead: '둥근 형태는 기도를 막을 수 있습니다.',
        points: [
            ['자르기', '세로, 작게'],
            ['금지', '통째']
        ],
        blocks: [
            ['지금 할 일', '먹기 전 자르세요.'],
            ['하지 않을 일', '뛰어다니며 먹이지 마세요.'],
            ['관련', '둥근 음식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'round-food-choking-cut',
        match: /(포도|소시지|핫도그|방울\s*토마토).{0,16}(자르|질식|통째)|둥근\s*음식\s*질식|콩\s*통째|포도\s*자르|소시지\s*자르/,
        title: '포도·소시지·방울토마토 등 둥근 음식은 길이로 자르고 통째로 주지 마세요',
        lead: '둥글고 미끄러운 음식은 기도에 맞기 쉽습니다. 포도는 세로로 자르고, 소시지·핫도그는 길이 방향으로 가른 뒤 작게 합니다. 돌 전후 질식 위험 식품 목록을 참고하고, 먹을 때는 앉아서 보호자가 봅니다. “한 가지 자르기 유행만 따르면 된다” 같은 한 가지 유행만 따르지 마세요.',
        points: [
            ['자르기', '둥근 것 반으로·세로로, 통째 금지'],
            ['환경', '앉아서, 뛰어다니며 먹기 금지, 견과 통째 주의']
        ],
        blocks: [
            ['지금 할 일', '오늘 간식 중 둥근 것이 있으면 자르기부터 하세요.'],
            ['하지 않을 일', '누운 채·차 안에서 둥근 간식을 주지 마세요.'],
            ['관련', '질식·이유식 안내를 참고하세요.']
        ],
        links: [
            ['CDC 질식 위험 식품', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html'],
            ['이유식·질식 가이드', 'blog/complementary-feeding-allergy-guide.html']
        ]
    },
    {
        id: 'blanket-fort-suffocation-boundary',
        match: /(이불\s*요새|담요\s*집\s*놀이|blanket\s*fort|이불\s*텐트\s*질식|담요\s*덮고\s*숨)/,
        title: '이불 요새는 통기가 되게 하고, 얼굴을 막거나 비닐을 쓰지 마세요',
        lead: '담요·비닐로 막힌 공간은 질식·과열 위험이 있습니다. 통기가 되고 얼굴이 가려지지 않게 하세요.',
        points: [
            ['구조', '통기, 얼굴 노출'],
            ['금지', '비닐, 혼자 긴 시간']
        ],
        blocks: [
            ['지금 할 일', '입구를 열어 두고 자주 확인하세요.'],
            ['하지 않을 일', '비닐·비닐봉지로 덮지 마세요.'],
            ['관련', '질식·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'plastic-bag-suffocation',
        match: /(비닐봉지|비닐\s*봉투|플라스틱\s*백|드라이\s*클리닝\s*비닐|옷\s*비닐|머리\s*비닐|plastic\s*bag\s*suffocation)/,
        title: '비닐봉지·옷 커버 비닐은 아이 손 닿지 않게 치우세요. 질식 위험이 있습니다',
        lead: '얇은 비닐이 얼굴·머리를 덮으면 질식할 수 있습니다. 쇼핑 비닐, 드라이클리닝 커버, 포장 비닐을 바닥에 두지 말고 묶어서 버리거나 높은 곳에 보관하세요. 장난으로 머리에 씌우지 않습니다.',
        points: [
            ['예방', '사용 직후 묶기·버리기, 침대·놀이 공간에 두지 않기'],
            ['응급', '호흡이 이상하면 즉시 119·응급처치']
        ],
        blocks: [
            ['지금 할 일', '바닥·유모차 아래 비닐을 모아 버리세요.'],
            ['하지 않을 일', '비닐을 이불·장난감처럼 놀이에 쓰지 마세요.'],
            ['관련', '질식·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 질식·가정 안전', 'https://www.cpsc.gov/'],
            ['AAP 질식 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Choking-Prevention.aspx'],
            ['CDC 질식 위험', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html']
        ]
    },
    {
        id: 'toothpick-skewer-boundary',
        match: /(이쑤시개|꼬치\s*나무|toothpick|스큐어|나무\s*꼬치)/,
        title: '이쑤시개·나무 꼬치는 치우고, 음식이 꽂힌 채로 주지 마세요',
        lead: '찔림·삼킴 위험이 큽니다. 파티 음식에서 먼저 제거하세요.',
        points: [
            ['조치', '제거 후 제공'],
            ['위험', '찔림, 삼킴']
        ],
        blocks: [
            ['지금 할 일', '먹기 전 꼬치를 빼 주세요.'],
            ['하지 않을 일', '아이가 이쑤시개를 가지고 놀게 두지 마세요.'],
            ['관련', '생선 가시·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'fish-bone-safety',
        match: /(생선\s*가시|가시\s*목에|fish\s*bone|뼈\s*가시\s*목|닭\s*뼈\s*목|가시\s*걸)/,
        title: '생선·닭 가시가 목에 걸리면 억지로 밥으로 넘기지 말고 호흡을 보세요',
        lead: '가시가 걸린 듯하면 억지로 빵·밥을 삼키게 하지 마세요. 침을 못 삼키고 호흡이 힘들면 응급입니다. 작은 가시 의심이어도 통증이 지속되면 진료하세요. 어린 아이 생선은 가시를 완전히 바르고 줍니다.',
        points: [
            ['예방', '가시 제거, 작은 조각, 식사 감독'],
            ['응급', '호흡 곤란, 침 과다, 통증·출혈']
        ],
        blocks: [
            ['지금 할 일', '호흡·침 흘림·통증 위치를 확인하세요.'],
            ['하지 않을 일', '손가락으로 목 안을 후비거나 밥을 억지로 넘기지 마세요.'],
            ['관련', '질식·둥근 음식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 이물질·응급 개요', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/default.aspx'],
            ['CDC 질식 위험 식품', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html']
        ]
    },
    {
        id: 'christmas-tree-water-pet-child-boundary',
        match: /(크리스마스\s*트리\s*물|트리\s*받침대\s*물|christmas\s*tree\s*water|성탄\s*트리\s*물\s*아이)/,
        title: '크리스마스 트리 받침대 물은 마시지 않게 하고, 장식·전선도 치우세요',
        lead: '트리 물·방부제·떨어진 바늘·전선 질식·감전 위험이 있습니다. 장식 순위는 하지 않습니다.',
        points: [
            ['예방', '물 덮개, 전선 정리'],
            ['장식', '작은 장식 치우기']
        ],
        blocks: [
            ['지금 할 일', '받침대 물이 노출되지 않게 하세요.'],
            ['하지 않을 일', '작은 장식을 바닥에 두지 마세요.'],
            ['관련', '명절 장식 질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'ornament-choking-holiday',
        match: /(크리스마스\s*장식|오너먼트\s*질식|트리\s*장식\s*삼킴|christmas\s*ornament|성탄\s*장식\s*아기|트리\s*전구\s*아기)/,
        title: '트리·명절 장식품은 작은 부품·깨진 조각을 치우고, 아이 손 닿지 않게 하세요',
        lead: '오너먼트·리본·건전지·전구는 질식·열상·감전 위험이 있습니다. 낮은 가지 장식을 줄이고, 깨진 유리는 바로 치우세요. 트리 물을 마시지 않게 하세요. 제품 추천은 하지 않습니다.',
        points: [
            ['위험', '작은 장식, 깨진 유리, 전지, 전선'],
            ['예방', '높은 곳 배치, 매일 바닥 점검']
        ],
        blocks: [
            ['지금 할 일', '아이 손 높이 장식을 치우거나 바꾸세요.'],
            ['하지 않을 일', '작은 장식품을 놀이 소품으로 주지 마세요.'],
            ['관련', '질식·전지·전선 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 명절 장식 안전', 'https://www.cpsc.gov/'],
            ['AAP 질식 예방', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx']
        ]
    },
    {
        id: 'small-toy-choking-marble',
        match: /(구슬\s*삼|마블\s*삼|구슬\s*먹|작은\s*구슬|헤어\s*비즈\s*삼|머리\s*비즈|marble\s*chok|작은\s*장난감\s*삼)/,
        title: '구슬·작은 비즈는 질식 위험이 커서 어린 아이 손에 두지 마세요',
        lead: '구슬·헤어 비즈·작은 부품은 기도에 막힐 수 있습니다. 연령 표시보다 실제 크기·감독이 중요하고, 삼킨 뒤 호흡이 이상하면 즉시 119입니다. 단추전지·자석과 구분해 해당 응급 안내를 우선하세요.',
        points: [
            ['예방', '작은 부품 치우기, 연령 미달 장난감 분리'],
            ['응급', '숨·울음 없음, 파란 입술 → 119·교육받은 처치']
        ],
        blocks: [
            ['지금 할 일', '바닥·소파 아래 작은 구슬·비즈를 치우세요.'],
            ['하지 않을 일', '영아 옆에서 비즈 공예 재료를 펼치지 마세요.'],
            ['관련', '질식·단추전지 안내를 참고하세요.']
        ],
        links: [
            ['CDC 질식 위험', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html'],
            ['CPSC 작은 부품', 'https://www.cpsc.gov/'],
            ['질식 안내', '#home']
        ]
    },
    {
        id: 'gum-swallowing-boundary',
        match: /(껌\s*삼킴|껌\s*먹|chewing\s*gum\s*swallow|아기\s*껌|껌\s*목\s*걸)/,
        title: '어린아이에게 껌을 주지 않는 편이 안전하고, 삼켰을 때는 호흡을 보세요',
        lead: '껌은 질식 위험이 있고 어린아이에게 권장되지 않습니다. 삼킨 뒤 대개 소화되지 않고 배출되는 경우가 많다는 안내가 있으나, 호흡 곤란·침 흘림·가슴 통증이 있으면 응급입니다. 억지로 토하게 하지 마세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '껌·풍선껌 치우기, 형제가 물려 주지 않기'],
            ['응급', '호흡 이상, 청색증, 침 많이 흘림']
        ],
        blocks: [
            ['지금 할 일', '집·차 안 껌을 아이 손 닿지 않게 치우세요.'],
            ['하지 않을 일', '“삼키면 7년” 같은 말로 겁만 주지 말고 호흡을 보세요.'],
            ['관련', '사탕·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식 예방', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CDC 질식 예방', 'https://www.cdc.gov/justrun/choking/']
        ]
    },
    {
        id: 'jelly-cup-choking-boundary',
        match: /(젤리\s*컵\s*질식|미니\s*컵\s*젤리|jelly\s*cup\s*chok|콘작\s*젤리|쏙\s*젤리)/,
        title: '미니 컵·콘약 젤리는 질식 위험이 높아 어린 아이에게 주지 않는 편이 안전합니다',
        lead: '미끄럽고 기도에 맞는 크기인 제품이 문제 된 적이 있습니다. 연령 경고를 확인하세요.',
        points: [
            ['경계', '미니 컵 젤리'],
            ['대안', '잘게 썬 과일 등']
        ],
        blocks: [
            ['지금 할 일', '연령 부적합 젤리는 치우세요.'],
            ['하지 않을 일', '통째로 빨아 먹게 두지 마세요.'],
            ['관련', '딱딱한 사탕·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'hard-candy-choking',
        match: /(단단한\s*사탕|하드\s*캔디|막대\s*사탕|lollipop|hard\s*candy|사탕\s*질식|사탕\s*목|젤리\s*컵\s*질식)/,
        title: '단단한 사탕·막대 사탕은 어린 아이 질식 위험이 커서 주지 않는 편이 안전합니다',
        lead: '둥글고 단단한 사탕·일부 젤리는 기도에 막히기 쉽습니다. 어린 아이에게는 주지 않고, 나이가 되어도 앉아서·한 번에 하나만·감독 아래 먹이세요. 질식 시 등 두드리기·하임리히 등 응급처치는 공인 교육을 따릅니다.',
        points: [
            ['위험', '하드 캔디, 미니 컵 젤리, 둥근 사탕'],
            ['예방', '연령 부적합 간식 치우기, 뛰어다니며 먹지 않기']
        ],
        blocks: [
            ['지금 할 일', '거실·가방 속 사탕을 아이 손 닿지 않게 치우세요.'],
            ['하지 않을 일', '울거나 뛰는 중에 사탕을 물리지 마세요.'],
            ['관련', '질식 식품·구슬·견과 안내를 참고하세요.']
        ],
        links: [
            ['CDC 질식 예방', 'https://www.cdc.gov/justrun/choking/'],
            ['AAP 질식 위험 식품', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx']
        ]
    },
    {
        id: 'puffs-snack-choking-boundary',
        match: /(핑거푸드\s*퍼프|쌀\s*퍼프|baby\s*puffs|녹는\s*과자\s*질식|아기\s*과자\s*목|옥수수\s*퍼프|퍼프\s*질식|아기\s*퍼프|퍼프\s*과자)/,
        title: '녹는 아기 과자·퍼프도 한꺼번에 많이 넣으면 질식 위험이 있습니다',
        lead: '입에서 녹는 스낵도 건조하거나 많이 넣으면 기도에 걸릴 수 있습니다. 앉아서 한 번에 조금씩, 뛰어다니며 먹지 않게 하세요. “녹으니 안전”만 믿지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['방법', '앉은 자세, 소량, 감독'],
            ['위험', '달리기·울면서 먹기, 큰 덩어리']
        ],
        blocks: [
            ['지금 할 일', '스낵을 테이블에 소량만 덜어 주세요.'],
            ['하지 않을 일', '유모차·카시트에서 잔뜩 손에 쥐여 두지 마세요.'],
            ['관련', '질식 식품·원형 식품 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식 예방', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CDC 질식 예방', 'https://www.cdc.gov/justrun/choking/']
        ]
    },
    {
        id: 'teething-biscuit-choking-boundary',
        match: /(이앓이\s*비스킷|티딩\s*비스킷|teething\s*biscuit|이\s*나는\s*과자\s*질식|쌀과자\s*이앓이)/,
        title: '이앓이 비스킷·딱딱한 이 과자는 녹이다 부스러져 질식 위험이 있을 수 있습니다',
        lead: '단단한 이앓이 과자는 깨지며 날카롭거나 큰 조각이 될 수 있습니다. 감독 없이 물리지 말고, 너무 단단하면 피하세요. 호박 목걸이 등 위험 제품과 함께 “이앓이 용품” 과신을 경계합니다. 브랜드 추천은 하지 않습니다.',
        points: [
            ['사용', '앉아서, 감독, 부스러기 확인'],
            ['대안', '차갑게 한 치발기(안전 기준), 잇몸 마사지']
        ],
        blocks: [
            ['지금 할 일', '비스킷이 너무 단단하거나 갈라지는지 확인하세요.'],
            ['하지 않을 일', '누운 채 과자를 물려 두지 마세요.'],
            ['관련', '이앓이·질식·호박 목걸이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 이앓이·질식 개요', 'https://www.healthychildren.org/English/ages-stages/baby/teething-tooth-care/Pages/default.aspx'],
            ['CDC 질식 예방', 'https://www.cdc.gov/justrun/choking/']
        ]
    },
    {
        id: 'smoothie-choking-boundary',
        match: /(스무디\s*질식|smoothie\s*chok|걸쭉\s*음료\s*목|과일\s*퓨레\s*덩이|빨대\s*스무디\s*아기)/,
        title: '걸쭉한 스무디·퓨레도 한 번에 많이 넣으면 사레·질식 위험이 있을 수 있습니다',
        lead: '액체처럼 보여도 점도가 높으면 삼키기 부담이 될 수 있습니다. 앉아서 소량씩, 알갱이가 큰 씨는 제거하세요. 누운 채 빨대로 계속 먹이지 마세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['방법', '앉기, 소량, 점도·알갱이 확인'],
            ['주의', '씨·껍질, 뛰어다니며 마시기']
        ],
        blocks: [
            ['지금 할 일', '스무디를 얇게 하거나 숟가락으로 주세요.'],
            ['하지 않을 일', '누운 채 걸쭉한 음료를 계속 빨리지 마세요.'],
            ['관련', '질식·빨대 컵·주스 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식 예방', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CDC 질식 예방', 'https://www.cdc.gov/justrun/choking/']
        ]
    },
    {
        id: 'pinata-candy-safety',
        match: /(피냐타|pinata|piñata|사탕\s*터뜨리|피나타)/,
        title: '피냐타 사탕을 주울 때는 뛰고 밀치지 않게 하고, 작은 사탕 질식을 보세요',
        lead: '사탕이 흩어지면 충돌과 급히 삼키기가 납니다. 앉아서 줍고 연령 부적합 사탕을 치우세요.',
        points: [
            ['진행', '소수씩, 감독'],
            ['사탕', '작은 딱딱한 것 주의']
        ],
        blocks: [
            ['지금 할 일', '답례 사탕 크기를 미리 고르세요.'],
            ['하지 않을 일', '뛰어 주우게 두지 마세요.'],
            ['관련', '생일 파티·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'birthday-party-choking-safety',
        match: /(생일\s*파티|생일\s*초\s*질식|party\s*favor|생일\s*사탕|파티\s*간식\s*질식|피냐타|답례품\s*사탕)/,
        title: '생일 파티에서는 작은 사탕·동전 초콜릿·풍선 조각을 치우고, 뛰어다니며 먹지 않게 하세요',
        lead: '파티 간식·답례품은 질식 위험이 큰 것이 많습니다. 앉아서 먹이기, 연령 부적합 장난감 답례품 피하기, 풍선 조각 정리가 중요합니다. 업체 추천은 하지 않습니다.',
        points: [
            ['음식', '앉기, 작은 딱딱한 사탕 주의, 견과 통째 금지'],
            ['장난감', '작은 부품, 자석, 풍선']
        ],
        blocks: [
            ['지금 할 일', '답례품 봉지에 작은 부품이 있는지 확인하세요.'],
            ['하지 않을 일', '달리며 사탕을 먹게 두지 마세요.'],
            ['관련', '사탕·풍선·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식 예방', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC 장난감 안전', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'chewing-gum-young-child-boundary',
        match: /(껌\s*아이|어린이\s*껌|chewing\s*gum\s*toddler|껌\s*삼킴\s*아이|유아\s*껌)/,
        title: '어린 아이에게 껌은 삼킴·질식 위험이 있어 주지 않는 편이 안전합니다',
        lead: '씹기·뱉기 능력이 부족하면 삼킬 수 있습니다. 삼켰다고 모두 응급은 아니나 숨 막힘이 있으면 즉시 대응하세요.',
        points: [
            ['원칙', '어린 아이 주지 않기'],
            ['증상', '숨 막힘 → 응급']
        ],
        blocks: [
            ['지금 할 일', '껌·사탕을 아이 손에 두지 마세요.'],
            ['하지 않을 일', '성인 껌을 나눠 주지 마세요.'],
            ['관련', '껌 삼킴·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'nut-butter-spoon-choking-boundary',
        match: /(땅콩버터\s*한\s*숟|피넛버터\s*질식|nut\s*butter\s*spoon|아몬드버터\s*덩어리|버터\s*통째\s*먹)/,
        title: '땅콩버터 등은 얇게 바르거나 섞어 주고, 숟가락 통째 덩어리는 피하세요',
        lead: '끈적한 페이스트는 기도를 막을 수 있습니다. 알레르기 도입 일정과는 별개로 질식 형태를 보세요.',
        points: [
            ['형태', '얇게, 섞기'],
            ['금지', '큰 숟가락 덩어리']
        ],
        blocks: [
            ['지금 할 일', '빵에 얇게 바르거나 요거트에 섞으세요.'],
            ['하지 않을 일', '숟가락으로 통째 떠먹이지 마세요.'],
            ['관련', '질식·알레르기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx']
        ]
    },
    {
        id: 'ice-cube-choking-boundary',
        match: /(얼음\s*조각)/,
        title: '어린 아이에게 큰 각얼음을 통째로 주지 말고, 녹이거나 작게 하세요',
        lead: '미끄럽고 기도에 맞을 수 있습니다.',
        points: [
            ['형태', '작게·녹여서'],
            ['금지', '통째 각얼음']
        ],
        blocks: [
            ['지금 할 일', '음료 속 큰 얼음을 걸러 주세요.'],
            ['하지 않을 일', '얼음을 가지고 놀며 입에 넣게 두지 마세요.'],
            ['관련', '질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'whole-nuts-young-child-boundary',
        match: /(견과류\s*통째|통\s*아몬드\s*아이|whole\s*nuts\s*toddler|땅콩\s*통째\s*유아|호두\s*통째\s*질식)/,
        title: '어린 아이에게 통 견과류는 질식 위험이 커 갈거나 버터 형태로 검토하세요',
        lead: '알레르기 도입과는 별개로 형태가 중요합니다. 연령 기준은 의료진·표준 안내를 보세요.',
        points: [
            ['형태', '갈기, 얇게'],
            ['금지', '통째·달리며']
        ],
        blocks: [
            ['지금 할 일', '통 견과를 간식으로 주지 마세요.'],
            ['하지 않을 일', '뛰어다니며 먹이지 마세요.'],
            ['관련', '질식·알레르기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx']
        ]
    },
    {
        id: 'jelly-bean-choking-boundary',
        match: /(젤리빈\s*아이|젤리빈\s*아이|젤리\s*빈\s*질식|jelly\s*bean\s*chok|콩알\s*젤리\s*유아)/,
        title: '젤리빈 등 작고 단단한 사탕은 어린 아이에게 주지 않는 편이 안전합니다',
        lead: '질식 위험이 큽니다.',
        points: [
            ['원칙', '연령 부적합 치우기'],
            ['감독', '앉아서']
        ],
        blocks: [
            ['지금 할 일', '사탕 그릇을 치우세요.'],
            ['하지 않을 일', '뛰어다니며 먹이지 마세요.'],
            ['관련', '딱딱한 사탕 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'seaweed-sheet-choking-boundary',
        match: /(김\s*말린\s*김\s*질식|김\s*질식|김\s*장\s*아이|seaweed\s*sheet\s*chok|마른\s*김\s*통째)/,
        title: '마른 김은 입천장에 붙거나 질식할 수 있어 작게 부수어 주세요',
        lead: '물과 함께 앉아서 먹이세요.',
        points: [
            ['형태', '작게 부수기'],
            ['감독', '앉아서']
        ],
        blocks: [
            ['지금 할 일', '큰 장을 통째로 주지 마세요.'],
            ['하지 않을 일', '달리며 먹이지 마세요.'],
            ['관련', '질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx']
        ]
    },
    {
        id: 'rice-cake-tteok-choking-boundary',
        match: /(떡\s*질식\s*아이|떡\s*질식|가래떡\s*아이|tteok\s*chok|찰떡\s*유아)/,
        title: '떡은 끈적여 질식 위험이 커 작게 자르고 앉아서 천천히 먹이세요',
        lead: '뛰어다니며 먹이지 마세요.',
        points: [
            ['준비', '작게, 앉기'],
            ['금지', '큰 덩어리']
        ],
        blocks: [
            ['지금 할 일', '한입 크기로 자르세요.'],
            ['하지 않을 일', '누워서 먹이지 마세요.'],
            ['관련', '질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'choking-gagging',
        match: /(헛구역질|구역질|질식|목에\s*걸|사레|컥컥|기도\s*폐쇄)/,
        title: '소리 나는 구역질과 숨을 못 쉬는 질식은 다릅니다',
        lead: '새 질감을 배우며 기침·구역질·뱉기가 나타날 수 있습니다. 하지만 소리·기침·울음·호흡이 나오지 않으면 질식 응급상황으로 봐야 합니다.',
        points: [
            ['구역질 가능성', '소리를 내고 기침하거나 얼굴이 붉어지며 스스로 음식을 밀어내는 모습'],
            ['질식 가능성', '숨·울음·기침 소리가 나오지 않거나 파랗게 변하고 반응이 떨어지는 모습']
        ],
        blocks: [
            ['예방', '똑바로 앉혀 먹이고 발달에 맞게 부드럽고 안전한 크기·모양으로 준비하며 식사 내내 지켜보세요.'],
            ['하지 않을 일', '눕거나 걷거나 차·유모차가 움직일 때 먹이지 말고, 보이지 않는 음식물을 손가락으로 찾지 마세요.'],
            ['즉시 행동', '아이가 숨을 쉬거나 울거나 기침하지 못하면 즉시 119에 연락하고 교육받은 영아·소아 기도폐쇄 응급처치를 시행하세요.']
        ],
        links: [
            ['이유식 질식 예방 전체 보기', 'blog/complementary-feeding-allergy-guide.html#choking'],
            ['CDC 질식 위험 식품', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html'],
            ['CDC 이유식 질감 안내', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html']
        ]
    },
    {
        id: 'shellfish-when-boundary',
        match: /(조개\s*언제|새우\s*언제|갑각류\s*이유식|shellfish\s*baby|해산물\s*알레르기\s*도입|게\s*이유식)/,
        title: '조개·새우 등 갑각류는 알레르기 주의 식품으로, 도입 시기·방법은 진료·공식 안내를 따르세요',
        lead: '해산물·갑각류는 알레르기 위험이 있을 수 있어 한꺼번에 많이 주지 말고, 다른 식품과 구분해 관찰하는 편이 안전합니다. “몇 개월 필수” 마감선·민간 순서를 단정하지 않습니다. 과거 즉시 반응이 있으면 재시도 전 의료진과 상의하세요.',
        points: [
            ['도입', '소량, 낮 시간, 한 번에 한 종류, 증상 관찰'],
            ['응급', '두드러기·부종·호흡 이상 → 응급']
        ],
        blocks: [
            ['지금 할 일', '가족 알레르기 병력과 첫 시도 날짜를 기록하세요.'],
            ['하지 않을 일', '숨긴 채 많은 양을 먹이지 마세요.'],
            ['관련', '알레르기 도입·즉시 반응 안내를 참고하세요.']
        ],
        links: [
            ['AAP 식품 알레르기 도입 개요', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/default.aspx'],
            ['이유식·알레르기 가이드', 'blog/complementary-feeding-allergy-guide.html']
        ]
    },
    {
        id: 'nut-butter-introduce-boundary',
        match: /(견과\s*버터\s*도입|견과\s*버터\s*도입|땅콩버터\s*언제\s*시작|nut\s*butter\s*introduce)/,
        title: '견과 버터 도입은 의료진 계획·형태(얇게)를 지키고, 즉시 반응이면 진료하세요',
        lead: '고위험군은 상담이 우선입니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['형태', '얇게 바르기'],
            ['응급', '호흡·전신 반응']
        ],
        blocks: [
            ['지금 할 일', '반응을 기록하세요.'],
            ['하지 않을 일', '통 견과와 혼동하지 마세요.'],
            ['관련', '알레르기 도입 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['알레르기 가이드', 'blog/complementary-feeding-allergy-guide.html']
        ]
    },
    {
        id: 'allergen-introduction',
        match: /(계란|달걀|땅콩|알레르기\s*식품).*(언제|도입|먹|시작)|알레르기.*(도입|예방|음식|먹)/,
        title: '알레르기 식품은 무조건 늦추지 않습니다',
        lead: '아기가 이유식을 삼킬 준비가 되고 일반 식품을 먹기 시작했다면 충분히 익힌 달걀과 안전하게 묽힌 땅콩을 한 번에 한 가지씩 소량 도입할 수 있습니다.',
        points: [
            ['처음 먹일 때', '아이가 건강한 낮 시간에 이미 먹던 음식과 섞어 소량 제공하고 반응을 관찰합니다.'],
            ['문제없었다면', '몇 달씩 다시 빼지 말고 가족 식단과 아이의 삼키기 능력에 맞춰 꾸준히 포함합니다.']
        ],
        blocks: [
            ['안전한 형태', '달걀은 충분히 익히고, 땅콩은 통알·덩어리 대신 매끈한 버터나 가루를 물 또는 음식에 묽게 섞으세요.'],
            ['먼저 상담', '심한 습진, 진단된 달걀 알레르기, 이전 즉시 반응이 있으면 집에서 시험하지 말고 의료진 계획을 먼저 세우세요.'],
            ['즉시 행동', '먹은 뒤 숨쉬기 어려움, 목소리 변화, 입술·혀 부종, 축 처짐이 나타나면 119를 이용하세요.']
        ],
        links: [
            ['이유식·알레르기 전체 가이드', 'blog/complementary-feeding-allergy-guide.html#allergens'],
            ['질병관리청 이유기보충식', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5470'],
            ['ASCIA 2026 알레르기 예방 지침', 'https://www.allergy.org.au/hp/papers/infant-feeding-and-allergy-prevention']
        ]
    },
    {
        id: 'raw-milk-boundary',
        match: /(비살균\s*우유|살균\s*안\s*된\s*우유|raw\s*milk|생우유\s*비살균|저온\s*살균\s*안|비살균\s*유제품)/,
        title: '비살균(생) 우유·유제품은 영유아에게 주지 마세요',
        lead: '살균하지 않은 우유·치즈·유제품은 세균 감염 위험이 있어 어린이·임산부에게 특히 위험할 수 있습니다. “자연·목장 직송”이라도 비살균이면 안전하지 않습니다. 시판 살균 우유·영아용 조제유 안내와 별개로, 비살균 제품은 피하세요.',
        points: [
            ['피하기', '비살균 우유·연성 치즈 등 안내된 고위험 유제품'],
            ['대안', '살균 표시 제품, 돌 전 주된 음료는 모유·조제유']
        ],
        blocks: [
            ['지금 할 일', '유제품 라벨에 살균·pasteurized 표시가 있는지 확인하세요.'],
            ['하지 않을 일', '비살균 우유를 “영양이 더 좋다”며 주지 마세요.'],
            ['관련', '생우유 전환·분유 조유 안내를 참고하세요.']
        ],
        links: [
            ['CDC 비살균 우유 위험', 'https://www.cdc.gov/foodsafety/rawmilk/raw-milk-index.html'],
            ['FDA 비살균 유제품(영)', 'https://www.fda.gov/food/buy-store-serve-safe-food/raw-milk-misconceptions-and-danger-raw-milk'],
            ['생우유 전환 안내', '#home']
        ]
    },
    {
        id: 'toddler-milk-drink-boundary',
        match: /(토들러\s*밀크|토들러\s*분유|성장\s*분유|다음에\s*단계\s*분유|toddler\s*milk|toddler\s*formula|1\+\s*분유|12개월\s*이후\s*분유)/,
        title: '돌 이후 “성장 분유·토들러 밀크”는 필수가 아니며, 일반 식품·우유 상담을 우선하세요',
        lead: '많은 공식 안내는 돌이 지난 뒤 특수한 경우가 아니면 일반 식품과 (적응되면) 일반 우유로 충분할 수 있다고 설명합니다. “두뇌 발달 필수” 광고만으로 고를 필요는 없습니다. 알레르기·성장 걱정·비건 식단은 의료진과 상의하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '돌 전후 이유식·가족식, 생우유 시점은 별도 안내'],
            ['경계', '마케팅 문구·해외 직구 성분 단정 금지']
        ],
        blocks: [
            ['지금 할 일', '아이가 다양한 고형식을 먹는지부터 점검하세요.'],
            ['하지 않을 일', '분유를 달게 타 “간식 음료”처럼 주지 마세요.'],
            ['관련', '생우유·분유·이유식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 돌 이후 영양 개요', 'https://www.healthychildren.org/English/ages-stages/toddler/nutrition/Pages/default.aspx'],
            ['CDC 유아 영양', 'https://www.cdc.gov/infant-toddler-nutrition/']
        ]
    },
    {
        id: 'plant-milk-under-two-boundary',
        match: /(두유\s*아기|아몬드\s*우유\s*아기|귀리\s*우유|식물성\s*우유|plant[-\s]?based\s*milk|대체\s*우유\s*아기|코코넛\s*밀크\s*아기)/,
        title: '돌 전후 식물성 음료를 주식 우유 대신 쓰기 전에 영양·상담을 확인하세요',
        lead: '두유·아몬드·귀리 등 식물성 음료는 단백질·지방·칼슘·비타민이 제품마다 크게 다릅니다. 영·유아 주식으로 임의 교체하면 영양 부족 위험이 있을 수 있습니다. 알레르기·비건 가정은 의료진·영양 상담을 우선하고, 브랜드 추천은 하지 않습니다.',
        points: [
            ['주의', '돌 전 생우유·대체유 단정 금지, 성분 표기 확인'],
            ['상담', '알레르기, 성장 부진, 특수 식단']
        ],
        blocks: [
            ['지금 할 일', '지금 주는 음료의 월령 표시·영양 성분을 확인하세요.'],
            ['하지 않을 일', '성인용 저열량 대체유를 아기 주식으로 주지 마세요.'],
            ['관련', '생우유·토들러 밀크·알레르기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 우유·음료 개요', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['CDC 유아 영양', 'https://www.cdc.gov/infant-toddler-nutrition/']
        ]
    },
    {
        id: 'cmpa-boundary',
        match: /(우유\s*단백\s*알레르기|cmpa|CMPI|분유\s*알레르기|우유\s*알레르기\s*아기|소\s*우유\s*알레르기)/,
        title: '우유 단백 알레르기 의심은 증상·성장으로 의료진이 판단하며, 임의 제한·특수분유를 단정하지 마세요',
        lead: '구토·혈변·발진·호흡 이상 등이 우유 단백과 관련될 수 있으나 원인 단정은 진료가 필요합니다. 보호자 임의로 장기간 제한하거나 특수분유를 광고만 보고 고르지 마세요. 아나필락시스 의심 시 응급입니다. 브랜드 순위·용량은 하지 않습니다.',
        points: [
            ['신호', '혈변, 심한 구토, 두드러기·부종, 호흡 이상, 성장 부진'],
            ['상담', '수유·분유 변경은 의료진·영양 상담과']
        ],
        blocks: [
            ['지금 할 일', '증상 시점과 섭취 식품을 기록하세요.'],
            ['하지 않을 일', '카페 후기만 보고 분유를 바꾸지 마세요.'],
            ['관련', '알레르기 즉시 반응·분유·생우유 안내를 참고하세요.']
        ],
        links: [
            ['AAP 식품 알레르기 개요', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/Food-Allergies-in-Children.aspx'],
            ['CDC 식품 알레르기', 'https://www.cdc.gov/food-allergies/']
        ]
    },
    {
        id: 'lactose-intolerance-boundary',
        match: /(유당\s*불내|lactose\s*intol|락토스\s*불내|우유\s*마시면\s*설사|유당\s*분해\s*효소)/,
        title: '유당 불내증과 우유 알레르기는 다르며, 원인·식단은 의료진과 상의하세요',
        lead: '우유를 마신 뒤 가스·설사·복통이 있으면 유당 불내 등 가능성이 있으나, 알레르기·감염과 구분은 진료가 필요합니다. 임의로 모든 유제품을 장기간 끊거나 효소제 용량을 정하지 마세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['구분', '알레르기(면역) vs 불내(소화) — 의료진 판단'],
            ['상담', '성장·영양, 대체 식품, 검사 필요 여부']
        ],
        blocks: [
            ['지금 할 일', '증상과 섭취 시각을 기록하세요.'],
            ['하지 않을 일', '카페 후기만 보고 분유·우유를 바꾸지 마세요.'],
            ['관련', '우유 단백 알레르기·생우유·설사 안내를 참고하세요.']
        ],
        links: [
            ['CDC 유당 불내증', 'https://www.cdc.gov/nutrition/'],
            ['AAP 우유·유제품 개요', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx']
        ]
    },
    {
        id: 'cow-milk',
        match: /(생우유|우유).*(언제|먹|마시|시작|바꿔)|분유.*(끊|떼|생우유)/,
        title: '생우유를 주된 음료로 바꾸는 기준은 첫돌 이후입니다',
        lead: '생후 12개월 전에는 모유 또는 영아용 조제유가 주된 우유 음료입니다. 살균 우유는 음식 재료나 요구르트·치즈 형태로는 더 일찍 접할 수 있지만 주된 음료로 대신하지 않습니다.',
        points: [
            ['12개월 전', '모유 또는 영아용 조제유를 계속하고 생우유를 주된 음료로 주지 않습니다.'],
            ['12개월 이후', '무가당 살균 전지우유 등 적절한 음료로 한 번의 수유부터 천천히 바꿀 수 있습니다.']
        ],
        blocks: [
            ['지금 할 일', '아이 나이와 현재 식사·수유 흐름을 확인하고 첫돌 이후라면 한 번의 수유부터 바꿔 반응을 보세요.'],
            ['하지 않을 일', '첫돌 전 영아용 조제유를 생우유나 식물성 음료로 임의 대체하지 마세요.'],
            ['진료·상담', '우유 알레르기, 성장 문제, 빈혈 위험, 제한식이 있으면 대체 음료를 의료진과 정하세요.']
        ],
        links: [
            ['이유식·유아식 전체 가이드', 'blog/complementary-feeding-allergy-guide.html#avoid'],
            ['CDC 12개월 우유 전환', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/cows-milk-and-milk-alternatives.html'],
            ['CDC 이유식 시작 안내', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html']
        ]
    },
    {
        id: 'constipation-solids',
        match: /(이유식|분유|고형식|미음|쌀미음).{0,20}(변비|딱딱한\s*변|응가\s*안)|변비.{0,20}(이유식|분유|시작\s*후|바꾼)/,
        title: '이유식·분유 뒤 변비는 수분·섬유·농도 변경 금지를 함께 봅니다',
        lead: '이유식을 시작하거나 분유를 바꾼 뒤 변이 딱딱해질 수 있습니다. 횟수보다 변 모양·통증·식욕·배가 부은 정도를 보고, 제품 농도·관장·민간 허브를 임의로 바꾸지 마세요. 일반 변비 안내와 겹치면 통증·피가 있으면 진료가 우선입니다.',
        points: [
            ['이유식 맥락', '철 강화 곡물·바나나만 치우치지 말고, 연령에 맞는 물·과일·채소 섬유를 다양하게. 돌 전 생우유를 주된 음료로 쓰지 마세요.'],
            ['분유 맥락', '농도를 진하게 타지 말고 표시 비율을 유지합니다. 분유 종류 변경은 의료진·수유 상담과 상의합니다.']
        ],
        blocks: [
            ['지금 할 일', '최근 식단·분유 제품·수분·변 모양·통증을 며칠 기록하세요.'],
            ['하지 않을 일', '관장·성인 변비약·분유 진하게 타기·검증 안 된 민간 요법을 쓰지 마세요.'],
            ['진료·상담', '혈변, 심한 복부 팽만·구토, 체중 감소, 생후 초기부터 변을 못 보면 바로 진료받으세요.']
        ],
        links: [
            ['미국 NIH 소아 변비', 'https://www.niddk.nih.gov/health-information/digestive-diseases/constipation-children/symptoms-causes'],
            ['질병관리청 변비 설명', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5827'],
            ['CDC 분유 조제(농도 유지)', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html']
        ]
    },
    {
        id: 'one-new-food-at-a-time-boundary',
        match: /(이유식\s*한\s*가지씩|새로운\s*음식\s*하나씩|one\s*new\s*food\s*at\s*a\s*time|새\s*재료\s*하나씩\s*이유식)/,
        title: '새 음식은 반응을 보기 쉽게 간격을 두고 도입하고, 즉시 반응이면 진료하세요',
        lead: '알레르기 고위험은 의료진 계획이 우선입니다. 사진을 보내 병명을 정하지 않습니다.',
        points: [
            ['도입', '간격, 기록'],
            ['응급', '호흡, 전신 두드러기']
        ],
        blocks: [
            ['지금 할 일', '새 음식과 반응을 메모하세요.'],
            ['하지 않을 일', '여러 알레르기 식품을 하루에 한꺼번에 많이 넣지 마세요.'],
            ['관련', '알레르기 도입 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['이유식 가이드', 'blog/complementary-feeding-allergy-guide.html']
        ]
    },
    {
        id: 'solid-start',
        match: /(이유식|보충식).*(언제|시작|몇\s*개월|준비)|첫\s*이유식/,
        title: '이유식은 대체로 6개월 무렵 준비 신호를 보고 시작합니다',
        lead: '개월 수만 보지 않고 머리·목을 가누고 도움받아 앉으며, 음식을 입에서 밖으로 밀기보다 삼키고, 음식에 관심을 보이는 준비 신호를 함께 확인합니다. 4개월 전 시작은 권하지 않습니다.',
        points: [
            ['시작 신호', '머리·목 조절, 도움받아 앉기, 숟가락을 향해 입 열기, 음식을 삼키는 모습'],
            ['계속할 것', '첫돌 전에는 이유식이 늘어도 모유 또는 영아용 조제유를 함께 제공합니다.']
        ],
        blocks: [
            ['첫 시도', '아이가 편안하고 보호자가 여유 있는 낮 시간에 부드러운 질감과 소량으로 시작하세요.'],
            ['하지 않을 일', '빨리 시작하면 잠을 더 잔다는 이유로 병에 곡물가루나 이유식을 넣지 마세요.'],
            ['진료·상담', '조산, 성장 부진, 삼킴 문제, 심한 습진이나 이전 음식 반응이 있으면 개별 시작 계획을 확인하세요.']
        ],
        links: [
            ['이유식 시작·식단 가이드', 'blog/complementary-feeding-allergy-guide.html#start'],
            ['WHO 2023 보충식 지침', 'https://www.who.int/publications/i/item/9789240081864'],
            ['CDC 이유식 시작 신호', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html']
        ]
    },
    {
        id: 'food-throwing-mealtime-boundary',
        match: /(음식\s*던지기|밥\s*집어\s*던|food\s*throw|식사\s*던지|이유식\s*투척|밥상\s*뒤집)/,
        title: '식사 중 음식 던지기는 관심을 과하게 주기보다, 짧게 멈추고 환경을 단순하게 하세요',
        lead: '던지기 놀이가 식사에 섞이기도 합니다. 화를 크게 내기보다 짧게 “식사는 접시에”라고 하고, 계속되면 식사를 종료하는 일관성이 도움이 될 수 있습니다. 강압·협박 수유는 피하세요. “특효 훈육템” 추천은 하지 않습니다.',
        points: [
            ['환경', '작은 양, 흘림 매트, 차분한 반응'],
            ['경계', '음식 보상·처벌 과잉, 스크린으로 달래기 과다']
        ],
        blocks: [
            ['지금 할 일', '한 번에 소량만 접시에 주세요.'],
            ['하지 않을 일', '던질 때마다 크게 웃거나 쫓아다니며 반응하지 마세요.'],
            ['관련', '편식·떼쓰기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 식사·행동 개요', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['편식 안내', '#home']
        ]
    },
    {
        id: 'pressure-feeding-boundary',
        match: /(억지로\s*먹|강압\s*수유|pressure\s*feed|한\s*숟갈\s*더\s*강요|입을\s*벌려\s*억지|밥\s*협박)/,
        title: '억지로 먹이기·협박 수유는 피하고, 규칙적인 식사 환경과 아이 배고픔 신호를 존중하세요',
        lead: '강압 수유는 식사 갈등을 키울 수 있습니다. 보호자는 무엇을·언제 제공할지, 아이는 얼마나 먹을지 나누는 방식이 흔히 권장됩니다. 성장 걱정은 체중 곡선·의료진과 상의하세요. “특효 훈육” 추천은 하지 않습니다.',
        points: [
            ['환경', '정해진 식사 시간, 산만함 줄이기, 소량 제공'],
            ['금지', '협박, 처벌, 입에 억지로 넣기']
        ],
        blocks: [
            ['지금 할 일', '한 끼 양을 줄이고 차분히 끝내 보세요.'],
            ['하지 않을 일', '“다 먹어야 놀이”로 협박하지 마세요.'],
            ['관련', '편식·음식 던지기·성장 안내를 참고하세요.']
        ],
        links: [
            ['AAP 식사·육아 개요', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['편식 안내', '#home']
        ]
    },
    {
        id: 'picky-eating-pressure-boundary',
        match: /(편식\s*강요|안\s*먹는\s*음식\s*억지|picky\s*eating\s*pressure|밥\s*남기면\s*혼|한\s*입만\s*더\s*강요)/,
        title: '편식에는 강요·협박보다 반복 노출과 함께 먹는 모델링이 도움이 될 수 있습니다',
        lead: '성장·탈수·통증 동반은 진료를 검토하세요. 특정 식품 광고를 정답으로 보지 마세요.',
        points: [
            ['접근', '반복 제공, 함께 먹기'],
            ['피하기', '처벌, 장시간 식사']
        ],
        blocks: [
            ['지금 할 일', '같은 음식을 여러 번 부드럽게 노출해 보세요.'],
            ['하지 않을 일', '밤늦게까지 먹이기 전쟁을 하지 마세요.'],
            ['관련', '이유식 거부 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['식사 안내', '#home']
        ]
    },
    {
        id: 'school-lunch-picky-boundary',
        match: /(학교\s*급식\s*편식|급식\s*안\s*먹|school\s*lunch\s*picky|급식\s*남김|어린이집\s*급식\s*거부)/,
        title: '급식 거부가 걱정되면 섭취량·성장·수분과 함께 시설·의료진과 상의하고, 강요를 피하세요',
        lead: '하루 거부가 곧 영양 위기는 아닐 수 있습니다. 지속·체중 감소면 상담하세요.',
        points: [
            ['관찰', '성장, 수분, 간식'],
            ['피하기', '처벌성 강요']
        ],
        blocks: [
            ['지금 할 일', '시설에 식사 모습을 물어보세요.'],
            ['하지 않을 일', '못 먹었다고 벌을 주지 마세요.'],
            ['관련', '편식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['식사 안내', '#home']
        ]
    },
    {
        id: 'hidden-veggie-pressure-boundary',
        match: /(편식\s*숨기기\s*음식|채소\s*숨겨\s*먹이|편식\s*숨기기|hidden\s*veggie\s*pressure)/,
        title: '채소를 숨겨 먹이는 것은 선택이나, 강요·속임수만으로 압박하지 마세요',
        lead: '반복 노출과 함께 먹기가 도움이 될 수 있습니다. 제품 순위는 하지 않습니다.',
        points: [
            ['접근', '반복, 모델링'],
            ['피하기', '처벌, 속임 전쟁']
        ],
        blocks: [
            ['지금 할 일', '함께 요리해 보세요.'],
            ['하지 않을 일', '안 먹는다고 장시간 혼내지 마세요.'],
            ['관련', '편식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['식사 안내', '#home']
        ]
    },
    {
        id: 'food-refusal',
        match: /(이유식|유아식|밥|음식).*(안\s*먹|거부|입을\s*안|뱉|먹기\s*싫)|편식/,
        title: '안 먹는 날이 있어도 억지로 정해진 양을 채우지 않습니다',
        lead: '보호자는 무엇을·언제·어디서 줄지 정하고, 아이는 먹을지와 얼마나 먹을지를 배고픔·포만 신호로 알려 줍니다. 한 끼의 양보다 며칠의 흐름과 성장을 봅니다.',
        points: [
            ['먹기 쉽게', '익숙한 음식과 새 음식 하나를 함께 두고, 현재 삼킬 수 있는 질감과 작은 양으로 반복해서 제안합니다.'],
            ['멈출 신호', '고개를 돌리거나 입을 닫고 밀어내면 그 끼니는 차분히 끝냅니다.']
        ],
        blocks: [
            ['오늘 할 일', '식사 시간을 예측 가능하게 하고 화면을 끈 뒤, 보호자와 함께 앉아 아이의 배고픔·포만 신호에 맞춰 편안하게 끝내세요.'],
            ['하지 않을 일', '쫓아다니며 먹이기, 영상을 보여 주며 무의식적으로 먹이기, 한 숟갈을 조건으로 보상하거나 겁주기를 피하세요.'],
            ['진료·상담', '먹을 때 반복적으로 기침·질식하거나 통증이 있고, 음식 종류가 급격히 줄거나 성장·수분 섭취가 걱정되면 상담하세요.']
        ],
        links: [
            ['이유식·유아식 식단 가이드', 'blog/complementary-feeding-allergy-guide.html#meal-plan'],
            ['WHO 반응적 먹이기 지침', 'https://www.who.int/publications/i/item/9789240081864'],
            ['WHO 보충식 핵심 안내', 'https://www.who.int/health-topics/complementary-feeding']
        ]
    },
    {
        id: 'screen-during-meals-boundary',
        match: /(밥\s*먹으면서\s*영상|식사\s*중\s*유튜브|screen\s*during\s*meal|밥\s*먹으면서\s*티비|식탁에서\s*태블릿)/,
        title: '식사 중 화면은 줄이고, 앉아서 음식에 집중하게 도와주세요',
        lead: '산만하면 과식·질식 위험 관찰이 어려워질 수 있습니다. 앱 순위는 하지 않습니다.',
        points: [
            ['환경', '화면 끄기, 앉기'],
            ['감독', '질식 관찰']
        ],
        blocks: [
            ['지금 할 일', '식탁에서 화면을 치워 보세요.'],
            ['하지 않을 일', '영상에만 집중한 채 떠먹이지 마세요.'],
            ['관련', '스크린·식사 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['질식 안내', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx']
        ]
    },
    {
        id: 'screen-meals-sleep',
        match: /(식사|밥|이유식|수유|재우|잠들|울음|달래).{0,10}(영상|유튜브|티비|tv|핸드폰|휴대폰)|(영상|유튜브|티비|핸드폰|휴대폰).{0,10}(재우|달래|밥|식사|잠)/,
        title: '식사·재우기·울음 달래기에 영상을 기본값으로 두지 마세요',
        lead: 'WHO 등은 영유아의 앉아서 보는 화면 시간을 제한하라고 안내합니다. 특히 식사 중·잠들기 전·울음을 달래는 기본 수단으로 영상·유튜브를 고정하면 수면·언어 상호작용이 줄어들 수 있습니다. 한 상황부터 화면 없이 바꿔 보세요.',
        points: [
            ['피하기', '밥 먹이며 영상, 잠들 때 유튜브, 울 때마다 핸드폰'],
            ['대신', '말 걸기, 짧은 책, 안고 진정, 규칙적인 취침 루틴']
        ],
        blocks: [
            ['지금 할 일', '하루 중 영상이 끼는 상황 한 가지를 골라 화면 없이 해보세요.'],
            ['하지 않을 일', '조회 수 높은 “재우는 영상”을 안전 수면 도구처럼 쓰지 마세요.'],
            ['관련', '전체 화면 시간 권고·안전수면 안내를 함께 보세요.']
        ],
        links: [
            ['WHO 5세 미만 화면·활동', 'https://www.who.int/publications/i/item/9789241550536'],
            ['발달 놀이 안내', 'blog/development-kdst-guide.html#play'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'background-tv-boundary',
        match: /(배경\s*티비|티비\s*틀어\s*놓고|백그라운드\s*TV|TV\s*소음|유튜브\s*틀어\s*놓고\s*놀)/,
        title: '배경으로 계속 틀어 두는 영상·TV는 어린 아이 놀이와 말에 방해가 될 수 있습니다',
        lead: '화면을 “배경 음악”처럼 하루 종일 켜 두면 보호자·아이의 말 주고받기가 줄어들 수 있다는 우려가 있습니다. 두 돌 전은 영상보다 사람과의 놀이가 우선입니다. 켜 둘 때도 내용·시간을 의식하세요. 특정 채널 추천은 하지 않습니다.',
        points: [
            ['우선', '대화·놀이, 화면 끄기 구간'],
            ['경계', '식사·재우기 기본값으로 영상 쓰지 않기']
        ],
        blocks: [
            ['지금 할 일', '하루 중 TV가 켜져 있는 시간을 한 번 적어 보세요.'],
            ['하지 않을 일', '울 때마다 자동으로 영상을 틀지 마세요.'],
            ['관련', '화면 시간·식사 중 영상 안내를 참고하세요.']
        ],
        links: [
            ['WHO 화면·신체활동', 'https://www.who.int/publications/i/item/9789240015128'],
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['화면 시간 안내', '#home']
        ]
    },
    {
        id: 'emf-sticker-myth-boundary',
        match: /(전자파\s*차단\s*스티커|전자파\s*차단\s*스티커|emf\s*sticker|전자파\s*패치\s*아이)/,
        title: '전자파 차단 스티커·패치의 효과를 과신하지 말고, 수면·화면 습관을 우선하세요',
        lead: '과장 광고를 근거로 보지 않습니다. 제품 순위는 하지 않습니다.',
        points: [
            ['우선', '사용 습관, 수면'],
            ['경계', '만병통치 광고']
        ],
        blocks: [
            ['지금 할 일', '화면 시간과 취침을 점검하세요.'],
            ['하지 않을 일', '스티커만 믿고 위험을 무시하지 마세요.'],
            ['관련', '와이파이 전자파 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'wifi-radiation-myth-boundary',
        match: /(와이파이\s*전자파|wifi\s*radiation|공유기\s*전자파\s*아기|전자파\s*공유기|무선\s*공유기\s*유해)/,
        title: '가정 와이파이 전자파를 이유로 육아를 과도히 제한하기 전에, 근거 있는 수면·사고 예방을 우선하세요',
        lead: '가정용 와이파이 전자파에 대한 불안이 많지만, 알려진 생활 위험과 비교해 공식 안내는 수면·질식·감염·사고 예방을 더 강조하는 경우가 많습니다. “공유기 끄면 발달이 보장된다”는 식으로 단정하지 않습니다. 불안이 크면 의료진과 상의하세요. 제품 차폐 광고 순위는 하지 않습니다.',
        points: [
            ['우선', '안전수면, 카시트, 손 씻기, 검증된 접종·검진'],
            ['경계', '고가 차폐 제품 과신, 근거 없는 공포 마케팅']
        ],
        blocks: [
            ['지금 할 일', '침실에서는 수면 환경(온도·이불·자세)을 먼저 점검하세요.'],
            ['하지 않을 일', '전자파만 걱정하며 응급 신호를 미루지 마세요.'],
            ['관련', '스크린·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['WHO 전자기장 개요(영)', 'https://www.who.int/health-topics/electromagnetic-fields'],
            ['AAP 미디어·건강 개요', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx']
        ]
    },
    {
        id: 'blue-light-bedtime-boundary',
        match: /(블루라이트\s*수면|blue\s*light\s*sleep|자기\s*전\s*폰|취침\s*전\s*영상|자기\s*전\s*태블릿)/,
        title: '취침 직전 화면은 수면을 방해할 수 있어, 잠들기 전 스크린을 줄여 보세요',
        lead: '자기 직전 밝은 화면·자극 영상은 잠들기를 어렵게 할 수 있습니다. “블루라이트 차단 안경 필수”로 단정하지 않으며, 취침 루틴과 화면 끄기 시간을 우선하세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['습관', '잠들기 전 화면 줄이기, 일정한 취침'],
            ['대안', '책, 조용한 놀, 희미한 조명']
        ],
        blocks: [
            ['지금 할 일', '취침 30~60분 전 화면을 끄는 실험을 해보세요.'],
            ['하지 않을 일', '침대에서 유튜브를 켜 둔 채 재우지 마세요.'],
            ['관련', '스크린 시간·악몽·수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어·수면 개요', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['CDC 수면 건강', 'https://www.cdc.gov/sleep/']
        ]
    },
    {
        id: 'youtube-kids-boundary',
        match: /(유튜브\s*키즈|youtube\s*kids|키즈\s*영상\s*중독|아이\s*유튜브|자동재생\s*아이들)/,
        title: '유튜브·키즈 영상은 자동재생을 끄고, 보호자가 내용을 함께 보는 편이 안전합니다',
        lead: '키즈 콘텐츠에도 광고·부적절한 영상이 섞일 수 있습니다. 시간 제한, 자동재생 끄기, 함께 보기, 연령에 맞는 선택 이 도움이 됩니다. 앱 추천·“교육 보장” 단정은 하지 않습니다.',
        points: [
            ['설정', '시간 제한, 자동재생 off, 계정 보호'],
            ['상호작용', '혼자 장시간 금지, 내용 확인']
        ],
        blocks: [
            ['지금 할 일', '자동재생과 시청 시간 설정을 확인하세요.'],
            ['하지 않을 일', '밥 먹이며 끝없이 틀어 두지 마세요.'],
            ['관련', '스크린 시간·블루라이트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어 사용 개요', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['CDC 아동 미디어 개요', 'https://www.cdc.gov/ncbddd/']
        ]
    },
    {
        id: 'parenting-app-privacy-boundary',
        match: /(육아\s*일기\s*앱\s*공유|육아\s*앱\s*공유|육아\s*일기\s*유출|parenting\s*app\s*privacy|육아\s*사진\s*클라우드)/,
        title: '육아 앱·클라우드 공유는 계정 보안과 공개 범위를 확인하고, 불필요 공유를 끄세요',
        lead: '앱 순위는 하지 않습니다. 의료 정보는 신중히 다루세요.',
        points: [
            ['보안', '비밀번호, 공유 범위'],
            ['주의', '공개 링크']
        ],
        blocks: [
            ['지금 할 일', '기본 비밀번호를 바꾸세요.'],
            ['하지 않을 일', '모르는 사람과 일기를 공개하지 마세요.'],
            ['관련', '프라이버시·맘카 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx']
        ]
    },
    {
        id: 'nanny-cam-privacy-boundary',
        match: /(맘카|nanny\s*cam|홈캠\s*아이|아기\s*감시\s*카메라|돌봄\s*카메라|홈\s*캠\s*보안)/,
        title: '홈캠·맘카는 비밀번호·펌웨어를 지키고, 돌봄 근로자에게는 녹화를 알리는 것이 좋습니다',
        lead: '카메라는 안전 확인에 쓰이지만 해킹·무단 공유 위험이 있습니다. 기본 비밀번호를 바꾸고, 필요 시 암호화·접근 권한을 관리하세요. 법적·근로 관계는 지역 규정을 따릅니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['보안', '강한 비밀번호, 업데이트, 공유기 보안'],
            ['관계', '돌봄 제공자 고지, 사적 공간 경계']
        ],
        blocks: [
            ['지금 할 일', '카메라 기본 비밀번호를 바꿨는지 확인하세요.'],
            ['하지 않을 일', '영상을 SNS에 올리지 마세요.'],
            ['관련', '베이비 모니터 줄·개인정보 안내를 참고하세요.']
        ],
        links: [
            ['FTC 스마트 기기 보안 개요(영)', 'https://www.ftc.gov/'],
            ['AAP 미디어·가정 개요', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx']
        ]
    },
    {
        id: 'educational-app-limit-boundary',
        match: /(교육\s*앱\s*과다|학습\s*앱\s*오래|educational\s*app\s*limit|영어\s*앱\s*하루\s*종일|교육용\s*영상이면\s*괜찮)/,
        title: '교육 앱·영상이라도 긴 시청은 줄이고, 실제 놀이·대화를 우선하세요',
        lead: '“교육용”만으로 무제한이 되지 않습니다. 연령·상호작용을 보세요. 앱 순위는 하지 않습니다.',
        points: [
            ['원칙', '시간 제한, 함께 보기'],
            ['우선', '사람과의 놀이']
        ],
        blocks: [
            ['지금 할 일', '하루 사용 시간을 정해 보세요.'],
            ['하지 않을 일', '교육용이라며 종일 틀지 마세요.'],
            ['관련', '스크린·유튜브 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'read-aloud-resistance-boundary',
        match: /(책\s*읽어주기\s*거부|책\s*싫어\s*아이|read\s*aloud\s*resist|그림책\s*안\s*봐|독서\s*싫어)/,
        title: '책 읽기를 거부하면 짧게·흥미 있는 그림부터 시작하고, 강요로 싸움을 키우지 마세요',
        lead: '한 번에 많이 읽히기보다 즐거운 경험이 중요합니다. 교재 순위는 하지 않습니다.',
        points: [
            ['방법', '짧게, 선택권'],
            ['피하기', '처벌성 강요']
        ],
        blocks: [
            ['지금 할 일', '아이가 고른 책으로 1~2분만 해 보세요.'],
            ['하지 않을 일', '안 듣는다고 벌을 주지 마세요.'],
            ['관련', '발달·놀이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#play']
        ]
    },
    {
        id: 'video-subtitle-language-boundary',
        match: /(자막\s*영상\s*언어|유튜브\s*자막\s*학습|video\s*subtitle\s*learn|자막\s*보면\s*영어)/,
        title: '자막·교육 영상만으로 언어 발달을 보장하지 않으며, 실제 대화·놀이를 우선하세요',
        lead: '화면은 보조일 뿐입니다. 앱 순위는 하지 않습니다.',
        points: [
            ['우선', '사람과의 대화'],
            ['보조', '짧은 함께 보기']
        ],
        blocks: [
            ['지금 할 일', '본 내용을 함께 말해 보세요.'],
            ['하지 않을 일', '자막 영상이면 하루 종일 틀지 마세요.'],
            ['관련', '스크린·발달 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'homework-screen-time-boundary',
        match: /(숙제\s*화면\s*시간|숙제\s*태블릿|homework\s*screen|온라인\s*숙제\s*눈|숙제\s*컴퓨터\s*오래)/,
        title: '숙제용 화면도 쉬는 간격과 자세를 챙기고, 숙제 아닌 시청과 구분해 관리하세요',
        lead: '교육 목적이라도 장시간 연속 시청은 줄이세요. 앱 순위는 하지 않습니다.',
        points: [
            ['관리', '휴식, 거리, 조명'],
            ['구분', '오락 시청']
        ],
        blocks: [
            ['지금 할 일', '20~30분마다 먼 곳을 보게 하세요.'],
            ['하지 않을 일', '숙제 후에도 바로 긴 영상을 이어 주지 마세요.'],
            ['관련', '스크린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'parent-phone-modeling-boundary',
        match: /(부모\s*휴대폰\s*모델링|부모\s*휴대폰\s*모델링|부모\s*폰\s*보면서\s*육아|parent\s*phone\s*modeling)/,
        title: '아이 앞에서 부모가 휴대폰을 오래 보면 상호작용이 줄 수 있어 의식적으로 내려놓으세요',
        lead: '완벽할 필요는 없습니다. 중요한 순간은 함께 보세요.',
        points: [
            ['습관', '식사·놀이 때 내려놓기'],
            ['대안', '짧은 확인']
        ],
        blocks: [
            ['지금 할 일', '식사 때는 폰을 치워 보세요.'],
            ['하지 않을 일', '아이와 놀 때 계속 스크롤하지 마세요.'],
            ['관련', '스크린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx']
        ]
    },
    {
        id: 'tablet-stand-tipover-boundary',
        match: /(아이\s*태블릿\s*거치대|태블릿\s*거치대\s*아이|아이패드\s*스탠드\s*넘어|tablet\s*stand\s*child)/,
        title: '태블릿 거치대는 전복·줄 걸림을 보고, 높은 가구 가장자리에 두지 마세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['배치', '안정, 낮은 곳'],
            ['금지', '불안정 가장자리']
        ],
        blocks: [
            ['지금 할 일', '줄이 목에 감기지 않게 하세요.'],
            ['하지 않을 일', '침대 위에서 충전하며 재우지 마세요.'],
            ['관련', '가정 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'blue-light-glasses-boundary',
        match: /(취침\s*전\s*블루라이트\s*안경|블루라이트\s*안경\s*아이|청색광\s*안경|blue\s*light\s*glasses\s*child)/,
        title: '블루라이트 안경만으로 수면 문제를 해결한다고 보지 말고, 취침 전 화면을 줄이세요',
        lead: '제품 효과 과장을 근거로 쓰지 않습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '취침 전 화면 줄이기'],
            ['보조', '환경 조명']
        ],
        blocks: [
            ['지금 할 일', '잠자기 전 화면을 끄세요.'],
            ['하지 않을 일', '안경만 믿고 늦게까지 보지 마세요.'],
            ['관련', '취침 화면·수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx']
        ]
    },
    {
        id: 'child-password-hygiene-boundary',
        match: /(아이\s*비밀번호\s*관리|아이\s*비밀번호|계정\s*비밀번호\s*아이|child\s*password|게임\s*계정\s*비번)/,
        title: '아이 게임·학습 계정 비밀번호는 보호자가 관리하고, 쉬운 비밀번호를 피하세요',
        lead: '개인정보 유출·결제를 예방합니다. 서비스 순위는 하지 않습니다.',
        points: [
            ['관리', '보호자 보관'],
            ['금지', '공개 메모']
        ],
        blocks: [
            ['지금 할 일', '결제 비밀번호를 아이만 알게 두지 마세요.'],
            ['하지 않을 일', '학교 계정 정보를 메신저에 올리지 마세요.'],
            ['관련', '스크린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'child-video-chat-friends-boundary',
        match: /(아이\s*화상\s*채팅\s*친구|아이\s*화상\s*채팅\s*친구|키즈\s*영상\s*통화\s*친구|child\s*video\s*chat\s*stranger)/,
        title: '아이 화상 채팅은 아는 사람과 보호자 감독 아래, 낯선 링크는 열지 않게 하세요',
        lead: '온라인 안전 규칙을 짧게 가르치세요. 앱 순위는 하지 않습니다.',
        points: [
            ['규칙', '아는 사람, 감독'],
            ['금지', '낯선 링크']
        ],
        blocks: [
            ['지금 할 일', '통화 상대를 확인하세요.'],
            ['하지 않을 일', '혼자 낯선 채팅방에 두지 마세요.'],
            ['관련', '스크린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx']
        ]
    },
    {
        id: 'online-class-posture-boundary',
        match: /(화상\s*수업\s*자세|화상\s*수업\s*자세|온라인\s*수업\s*목|online\s*class\s*posture)/,
        title: '화상 수업은 쉬는 간격·화면 거리·조명을 챙기고, 수업 밖 시청과 구분하세요',
        lead: '장시간 고정 자세는 불편을 키울 수 있습니다.',
        points: [
            ['환경', '거리, 조명, 휴식'],
            ['구분', '오락 시청']
        ],
        blocks: [
            ['지금 할 일', '20~30분마다 스트레칭을 권하세요.'],
            ['하지 않을 일', '수업 후 바로 긴 영상을 이어 주지 마세요.'],
            ['관련', '스크린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'video-game-time-boundary',
        match: /(아이\s*게임\s*시간|게임\s*시간\s*아이|비디오\s*게임\s*제한|video\s*game\s*time\s*child)/,
        title: '게임 시간은 연령·수면·숙제를 보고 정하고, 폭력·결제를 감독하세요',
        lead: '무제한 허용은 피하세요. 기기 순위는 하지 않습니다.',
        points: [
            ['한도', '수면·숙제 우선'],
            ['감독', '결제, 채팅']
        ],
        blocks: [
            ['지금 할 일', '끝 시각을 미리 알려 주세요.'],
            ['하지 않을 일', '밤늦게 긴 게임을 하게 두지 마세요.'],
            ['관련', '스크린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx']
        ]
    },
    {
        id: 'phone-habit-limit-boundary',
        match: /(아이\s*휴대폰\s*중독|휴대폰\s*중독\s*아이|스마트폰\s*과의존|phone\s*addiction\s*child)/,
        title: '휴대폰 과의존이 걱정되면 규칙·수면 전 금지·대체를 정하고, 급격한 체벌은 피하세요',
        lead: '중독 진단은 의료·상담이 필요합니다. 앱 차단 순위는 하지 않습니다.',
        points: [
            ['규칙', '시간, 장소'],
            ['대안', '놀이, 대화']
        ],
        blocks: [
            ['지금 할 일', '가족 규칙을 짧게 합의하세요.'],
            ['하지 않을 일', '빼앗기만 하고 대안 없이 두지 마세요.'],
            ['관련', '스크린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx']
        ]
    },
    {
        id: 'youtube-algorithm-child-boundary',
        match: /(아이들\s*유튜브\s*알고리즘|youtube\s*algorithm|알고리즘\s*유튜브\s*아이)/,
        title: '유튜브 추천 영상은 함께 보고 시간을 정하며, 자동재생을 끄는 편이 관리에 도움이 됩니다',
        lead: '교육용처럼 보여도 긴 시청은 줄이세요. 앱 순위는 하지 않습니다.',
        points: [
            ['관리', '함께 보기, 시간'],
            ['설정', '자동재생 끄기']
        ],
        blocks: [
            ['지금 할 일', '시청 시간을 미리 정하세요.'],
            ['하지 않을 일', '배경으로 종일 틀지 마세요.'],
            ['관련', '스크린·유튜브 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['스크린 안내', '#home']
        ]
    },
    {
        id: 'sleep-youtube-all-night-boundary',
        match: /(수면\s*유튜브\s*8시간)/,
        title: '자장가 영상을 밤새 큰 볼륨으로 틀기보다 볼륨·거리를 조절하세요',
        lead: '과도한 소음과 화면 빛은 부담이 될 수 있습니다.',
        points: [
            ['조절', '볼륨, 거리, 화면 끄기'],
            ['피하기', '최대 음량']
        ],
        blocks: [
            ['지금 할 일', '화면을 끄고 소리만 검토하세요.'],
            ['하지 않을 일', '스피커를 머리 옆에 두지 마세요.'],
            ['관련', '백색 소음 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx']
        ]
    },
    {
        id: 'screen-time',
        match: /(영상|유튜브|티비|tv|스크린|핸드폰|휴대폰|미디어).*(보여|노출|봐도|시간|괜찮)|영상\s*노출/,
        title: '두 돌 전에는 영상보다 사람과 노는 시간을 우선하세요',
        lead: 'WHO는 1세 미만과 1세의 앉아서 보는 화면 시간을 권하지 않고, 2세는 하루 1시간 이내로 줄이며 더 적을수록 좋다고 안내합니다. 화면은 사람과의 말·놀이·수면을 대신하지 않게 합니다.',
        points: [
            ['1세 미만·1세', 'TV·영상·게임처럼 앉아서 보는 화면 시간을 두지 않는 방향이 권고됩니다.'],
            ['2세·3~4세', '하루 1시간 이내이며 더 적을수록 좋고, 보호자와 함께 보고 대화하는 시간을 우선합니다.']
        ],
        blocks: [
            ['대신할 것', '짧은 그림책, 노래, 얼굴 마주 보기, 바닥 놀이처럼 아이가 반응을 주고받는 활동으로 바꾸세요.'],
            ['줄이는 방법', '식사·잠들기 전·울음을 달래는 기본 수단으로 화면을 고정하지 말고 한 상황부터 화면 없이 해보세요.'],
            ['상담', '화면을 줄일 때 일상 유지가 매우 어렵거나 언어·놀이·수면 걱정이 함께 있으면 그 모습을 기록해 상담하세요.']
        ],
        links: [
            ['개월별 놀이·주의점', 'blog/development-kdst-guide.html#play'],
            ['WHO 5세 미만 화면·활동·수면 지침', 'https://www.who.int/publications/i/item/9789241550536'],
            ['WHO 권고 요약', 'https://www.who.int/news-room/detail/24-04-2019-to-grow-up-healthy-children-need-to-sit-less-and-play-more']
        ]
    },
    {
        id: 'daytime-wetting-boundary',
        match: /(낮\s*소변\s*실수|주간\s*유뇨|daytime\s*wetting|낮에\s*오줌\s*싸|배변훈련\s*후\s*낮\s*실수)/,
        title: '낮 소변 실수가 반복되면 변비를 포함한 원인 평가를 위해 진료를 검토하세요',
        lead: '배변훈련 직후 가끔 실수는 있을 수 있으나, 낮에도 자주 싸거나 급히 못 참고, 이전에 잘하다가 다시 시작하면 의료 평가가 필요할 수 있습니다. 처벌하지 마세요. 약·알람 제품 추천은 하지 않습니다.',
        points: [
            ['관찰', '횟수, 급뇨, 변비, 음료, 감염 증상'],
            ['대응', '혼내지 않기, 쉬운 옷, 정기 배뇨 권유, 진료']
        ],
        blocks: [
            ['지금 할 일', '낮 실수·배변 기록을 며칠 적어 보세요.'],
            ['하지 않을 일', '공개적으로 창피를 주거나 물 Restrict를 하지 마세요.'],
            ['관련', '야뇨·변비·배변훈련 안내를 참고하세요.']
        ],
        links: [
            ['AAP 배뇨·유뇨 개요', 'https://www.healthychildren.org/English/ages-stages/toddler/toilet-training/Pages/default.aspx'],
            ['CDC 아동 발달 개요', 'https://www.cdc.gov/ncbddd/childdevelopment/']
        ]
    },
    {
        id: 'bedwetting-sheet-mattress-boundary',
        match: /(야뇨\s*방수|오줌\s*싸\s*매트리스|bedwetting\s*mattress|방수\s*패드\s*야뇨|야뇨\s*시트|야뇨\s*매트)/,
        title: '야뇨에는 방수 패드·여분 옷으로 부담을 줄이고, 수치심을 주지 마세요',
        lead: '연령에 따라 야뇨는 흔할 수 있습니다. 갑작스런 주간 증상 동반은 진료를 검토하세요. 제품 순위는 하지 않습니다.',
        points: [
            ['실용', '방수, 여분 옷'],
            ['태도', '비난 금지']
        ],
        blocks: [
            ['지금 할 일', '교체 루틴을 함께 정하세요.'],
            ['하지 않을 일', '일부러 그렇다고 혼내지 마세요.'],
            ['관련', '야뇨 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['야뇨 안내', '#home']
        ]
    },
    {
        id: 'bedwetting-boundary',
        match: /(야뇨|오줌\s*싸|밤에\s*오줌|이불\s*오줌|bed\s*wet|야뇨증)/,
        title: '야뇨는 어린 나이에는 흔하고, 혼내지 않으며 낮 증상·통증이 있으면 진료합니다',
        lead: '밤에 오줌을 싸는 일은 발달·수면 깊이와 관련해 흔할 수 있습니다. 수치심을 주거나 체벌하지 마세요. 낮에도 새거나, 통증이 있거나, 갑자기 시작된 뒤 갈증·체중 변화가 크면 의료진과 상의합니다. 약 용량·장비 순위는 하지 않습니다.',
        points: [
            ['가정', '방수 패드, 저녁 수분 과다 주의(강제 제한 금지), 혼내지 않기'],
            ['진료', '낮 실수·통증·갈증·체중 감소·갑작스런 시작']
        ],
        blocks: [
            ['지금 할 일', '언제 시작했는지·낮 증상 여부를 적어 보세요.'],
            ['하지 않을 일', '아이를 창피하게 하거나 물 자체를 금지하지 마세요.'],
            ['관련', '배변훈련·부모 마음건강 안내를 참고하세요.']
        ],
        links: [
            ['AAP 야뇨', 'https://www.healthychildren.org/English/ages-stages/toddler/toilet-training/Pages/Bedwetting.aspx'],
            ['NIDDK 야뇨(영)', 'https://www.niddk.nih.gov/health-information/urologic-diseases/bladder-control-problems-bedwetting-children']
        ]
    },
    {
        id: 'pull-ups-when-boundary',
        match: /(풀업\s*팬티|학습\s*팬티|pull[-\s]?ups|배변\s*팬티|토이렛\s*트레이닝\s*팬티|훈련용\s*기저귀)/,
        title: '학습 팬티는 도구일 뿐이며, 준비 신호와 일관된 배변 습관이 더 중요합니다',
        lead: '풀업·학습 팬티가 모든 아이에게 필수이거나 더 빠른 훈련을 보장하지는 않습니다. 준비 신호, 낮 소변 간격, 관심도를 보고, 제품 광고보다 일관된 루틴을 우선하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['선택', '낮/밤 구분, 옷 벗기 쉬운지, 아이 반응'],
            ['경계', '“며칠 완성” 광고, 수치심 주기']
        ],
        blocks: [
            ['지금 할 일', '낮에 배변 신호를 관찰해 보세요.'],
            ['하지 않을 일', '팬티만 믿고 감독을 끊지 마세요.'],
            ['관련', '배변훈련·야뇨·낮 실수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 배변훈련 개요', 'https://www.healthychildren.org/English/ages-stages/toddler/toilet-training/Pages/default.aspx'],
            ['배변훈련 안내', '#home']
        ]
    },
    {
        id: 'potty-regression-boundary',
        match: /(배변\s*퇴행|토이렛\s*퇴행|potty\s*regression|배변훈련\s*후퇴|잘\s*가다가\s*실수|동생\s*후\s*배변)/,
        title: '배변훈련 후 퇴행은 스트레스·변화와 관련될 수 있어 처벌보다 원인을 살피세요',
        lead: '잘하다가 다시 실수하는 일은 동생 출생·이사·어린이집 등 변화 때 나타날 수 있습니다. 수치심·처벌은 피하고, 변비·감염 여부도 봅니다. “특효 팬티” 추천은 하지 않습니다.',
        points: [
            ['원인', '변화·스트레스, 변비, 관심 요구'],
            ['대응', '차분한 리셋, 쉬운 옷, 성공 인정']
        ],
        blocks: [
            ['지금 할 일', '최근 생활 변화와 배변 통증을 점검하세요.'],
            ['하지 않을 일', '공개적으로 창피를 주지 마세요.'],
            ['관련', '배변훈련·변비·낮 실수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 배변훈련 개요', 'https://www.healthychildren.org/English/ages-stages/toddler/toilet-training/Pages/default.aspx'],
            ['변비 안내', '#home']
        ]
    },
    {
        id: 'public-potty-accident-boundary',
        match: /(밖에서\s*소변\s*실수|공공장소\s*배변\s*실수|mall\s*potty\s*accident|마트에서\s*오줌|외출\s*배변\s*사고)/,
        title: '외출 중 배변·소변 실수는 창피 주기보다 옷 갈아입기·짧은 루틴으로 다루세요',
        lead: '외출 실수는 흔합니다. 여분 옷·물티슈를 준비하고, 혼내지 않으며 담담히 처리하세요. 반복되면 배변 간격·변비·불안을 살핍니다. 제품 추천은 하지 않습니다.',
        points: [
            ['준비', '여분 옷, 지퍼백, 쉬운 옷'],
            ['대응', '짧은 말, 수치심 최소화, 손 씻기']
        ],
        blocks: [
            ['지금 할 일', '외출 가방에 여분 하의·속옷을 넣으세요.'],
            ['하지 않을 일', '사람들 앞에서 크게 혼내지 마세요.'],
            ['관련', '배변훈련·낮 실수·퇴행 안내를 참고하세요.']
        ],
        links: [
            ['AAP 배변훈련 개요', 'https://www.healthychildren.org/English/ages-stages/toddler/toilet-training/Pages/default.aspx'],
            ['CDC 손 씻기', 'https://www.cdc.gov/handwashing/']
        ]
    },
    {
        id: 'potty-reward-overuse-boundary',
        match: /(배변\s*보상\s*과다|소변\s*성공\s*간식|potty\s*reward|배변훈련\s*사탕\s*매번|대변\s*성공\s*선물)/,
        title: '배변 보상은 짧게·단순하게 쓰고, 음식 보상 과다와 처벌은 피하세요',
        lead: '강압·처벌은 역효과를 낼 수 있습니다. 준비 신호를 우선하세요. 브랜드 변기 순위는 하지 않습니다.',
        points: [
            ['보상', '칭찬, 간단한 스티커'],
            ['피하기', '처벌, 과도한 간식']
        ],
        blocks: [
            ['지금 할 일', '성공을 짧게 칭찬하세요.'],
            ['하지 않을 일', '실패했다고 벌을 주지 마세요.'],
            ['관련', '배변훈련 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['배변 안내', '#home']
        ]
    },
    {
        id: 'potty-stool-step-boundary',
        match: /(변기\s*발판|토이렛\s*스툴|potty\s*stool|변기\s*발\s*디딤|화장실\s*발판\s*아이)/,
        title: '변기 발판은 미끄럼 방지·안정된 것을 쓰고, 혼자 높은 곳에 오르지 않게 감독하세요',
        lead: '발판 전복·미끄럼 부상이 납니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['안전', '미끄럼 방지, 감독'],
            ['금지', '불안정한 의자']
        ],
        blocks: [
            ['지금 할 일', '발판이 흔들리지 않는지 보세요.'],
            ['하지 않을 일', '욕조 가장자리에 올리게 두지 마세요.'],
            ['관련', '배변훈련 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'toilet-training',
        match: /(배변\s*훈련|배변훈련|기저귀\s*(떼|빼)|팬티.*언제|변기.*(시작|훈련|앉))/,
        title: '배변훈련은 개월 수보다 준비 신호로 시작합니다',
        lead: '정해진 마감 나이는 없습니다. 많은 아이가 2~3세 사이 시작하지만, 두 시간가량 마른 상태를 유지하고 배변 신호를 알아차리며 간단한 지시와 옷 내리기를 도울 수 있는지를 먼저 봅니다.',
        points: [
            ['준비 신호', '쉬·응가 전 몸짓을 보이고 젖은 기저귀를 불편해하며 변기까지 이동하고 간단한 말을 이해합니다.'],
            ['아직 아니라면', '거부하거나 변을 참거나 큰 생활 변화가 있으면 쉬었다가 다시 시도해도 됩니다.']
        ],
        blocks: [
            ['시작 방법', '편한 변기와 발 받침을 두고 식후 잠깐 앉아 보는 것부터 시작해 결과와 상관없이 시도를 칭찬하세요.'],
            ['하지 않을 일', '실수·야간 기저귀·늦은 시작을 혼내거나 다른 아이와 비교하지 마세요.'],
            ['추가 지원', '발달장애나 운동·의사소통 어려움이 있어도 준비 신호는 같지만 더 늦고 단계적인 지원이 필요할 수 있습니다. 변비·통증을 먼저 해결하세요.']
        ],
        links: [
            ['AAP 배변훈련 시작 기준', 'https://www.healthychildren.org/English/ages-stages/toddler/toilet-training/Pages/the-right-age-to-toilet-train.aspx'],
            ['AAP 특별한 지원이 필요한 아이', 'https://www.healthychildren.org/English/ages-stages/toddler/toilet-training/Pages/Toilet-Training-Children-with-Special-Needs.aspx']
        ]
    },
    {
        id: 'stool-withholding-boundary',
        match: /(변\s*참|대변\s*참|stool\s*withhold|응가\s*참|변기\s*공포\s*변|변비\s*참아서)/,
        title: '변을 참는 행동은 통증이 악순환될 수 있어, 압박 대신 진료·배변 습관을 상의하세요',
        lead: '아픈 배변 경험 후 변을 참으면 변비가 더 심해질 수 있습니다. 혼내거나 오래 앉혀 두지 말고, 수분·식이·배변 신호를 살피며 필요하면 소아과와 상의하세요. 약 용량·관장 방법은 사이트에서 정하지 않습니다.',
        points: [
            ['신호', '발끝 들기, 다리 꼬기, 숨기기, 단단한 변'],
            ['접근', '처벌 금지, 여유 있는 배변, 의료 상담']
        ],
        blocks: [
            ['지금 할 일', '배변 통증·횟수를 기록하세요.'],
            ['하지 않을 일', '변기에서 장시간 혼내며 강요하지 마세요.'],
            ['관련', '변비·배변훈련 안내를 참고하세요.']
        ],
        links: [
            ['AAP 변비 개요', 'https://www.healthychildren.org/English/health-issues/conditions/abdominal/Pages/Constipation.aspx'],
            ['배변훈련 안내', '#home']
        ]
    },
    {
        id: 'constipation-fruit-fiber-boundary',
        match: /(변비\s*과일|변비\s*푸룬|constipation\s*fruit|배변\s*안\s*돼\s*과일|변비에\s*사과)/,
        title: '변비에 수분·섬유 식품이 도움이 될 수 있으나, 통증·혈변·심한 보챔이면 진료하세요',
        lead: '특정 과일만 만병통치로 보지 마세요. 약 용량은 의료진을 따르세요.',
        points: [
            ['기본', '수분, 활동, 섬유'],
            ['진료', '심한 통증, 혈변']
        ],
        blocks: [
            ['지금 할 일', '평소 수분과 식단을 기록하세요.'],
            ['하지 않을 일', '관장을 임의로 반복하지 마세요.'],
            ['관련', '변비 안내를 참고하세요.']
        ],
        links: [
            ['변비 가이드', 'blog/baby-constipation-guide.html'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'constipation',
        match: /(변비|며칠.*(변|응가|똥)|응가.*안|똥.*안|변.*딱딱|딱딱한\s*변)/,
        title: '변비는 며칠 간격보다 변의 모양과 통증을 함께 봅니다',
        lead: '배변 횟수는 아이마다 다릅니다. 딱딱하고 마른 변, 힘주기와 통증, 변을 참는 행동, 배가 붓거나 식욕이 떨어지는지를 함께 기록하세요.',
        points: [
            ['변비 가능성', '토끼똥처럼 단단한 변, 매우 크고 아픈 변, 변을 피하려 까치발·엉덩이 조이기·숨기'],
            ['도움이 되는 습관', '연령에 맞는 물과 식이섬유, 움직임, 식후 짧은 변기 앉기와 발 받침을 사용합니다.']
        ],
        blocks: [
            ['지금 할 일', '며칠 동안 횟수뿐 아니라 변 모양, 통증, 피, 배가 부은 정도와 먹고 마신 것을 적으세요.'],
            ['하지 않을 일', '아이를 혼내거나 오래 변기에 앉히지 말고, 의료진 지시 없이 영아에게 관장·변비약·분유 농도 변경을 하지 마세요.'],
            ['진료·상담', '피가 보이거나 배가 심하게 붓고 계속 아프며 구토·체중 감소가 있거나, 출생 직후부터 문제가 있었다면 바로 진료받으세요.']
        ],
        links: [
            ['미국 NIH 소아 변비 증상', 'https://www.niddk.nih.gov/health-information/digestive-diseases/constipation-children/symptoms-causes'],
            ['질병관리청 변비 설명', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5827']
        ]
    },
    {
        id: 'grandparent-discipline-conflict-boundary',
        match: /(조부모\s*훈육\s*갈등|할머니\s*회초리|grandparent\s*discipline\s*conflict|시부모\s*체벌|할아버지\s*때리)/,
        title: '조부모와 훈육이 다를 때는 아이 안전을 우선하고, 체벌 금지를 분명히 하세요',
        lead: '일관성 있는 규칙이 도움이 됩니다. 체벌·수치심 주기는 피하도록 합의하세요.',
        points: [
            ['합의', '안전 규칙, 체벌 금지'],
            ['태도', '아이 앞 다툼 최소화']
        ],
        blocks: [
            ['지금 할 일', '핵심 규칙 2~3가지를 공유하세요.'],
            ['하지 않을 일', '아이 앞에서 크게 다투지 마세요.'],
            ['관련', '조부모 훈육 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['가족 안내', '#home']
        ]
    },
    {
        id: 'grandparent-snack-rule-boundary',
        match: /(조부모\s*간식\s*규칙|조부모\s*간식\s*규칙|할머니\s*과자\s*몰래|grandparent\s*snack\s*rule)/,
        title: '조부모 간식 규칙이 다르면 핵심 안전(질식·알레르기)을 합의하고 아이 앞에서 다투지 마세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['합의', '알레르기, 질식 식품'],
            ['태도', '아이 앞 갈등 최소화']
        ],
        blocks: [
            ['지금 할 일', '금지 식품 목록을 공유하세요.'],
            ['하지 않을 일', '아이 앞에서 크게 다투지 마세요.'],
            ['관련', '조부모·간식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['질식 안내', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx']
        ]
    },
    {
        id: 'grandparent-discipline',
        match: /(조부모|시부모|시댁|친정|할머니|할아버지).*(훈육|때|체벌|혼내|양육)|체벌|때려서\s*키|손찌검|체벌\s*금지/,
        title: '훈육은 체벌 없이, 조부모와는 아이 앞 갈등보다 공통 규칙을 맞춥니다',
        lead: '아이를 때리거나 모욕하는 체벌은 권하지 않습니다. 조부모·다른 보호자와 양육 방식이 다를 때는 아이 앞에서 큰 소리로 다투기보다, 때리지 않기·위험 행동만 막기 같은 최소 공통 규칙을 먼저 합의하세요. 사이트에서 가정 처방·관계 치료 진단을 하지 않습니다.',
        points: [
            ['원칙', '신체 체벌·모욕 금지, 위험(도로·열·낙하)만 즉시 제지'],
            ['대화', '아이 없는 자리에서 짧게, “때리지 않기·안전”을 공통 선으로']
        ],
        blocks: [
            ['지금 할 일', '가정에서 절대 하지 않을 행동 2~3가지를 적어 공유하세요.'],
            ['하지 않을 일', '아이 앞에서 보호자끼리 큰 싸움을 하거나, 체벌을 “사랑의 매”로 정당화하지 마세요.'],
            ['도움', '가정 폭력·지속 갈등이 있으면 전문 상담·지역 서비스를 연결하세요.']
        ],
        links: [
            ['AAP 체벌에 대한 입장', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/Where-We-Stand-Spanking.aspx'],
            ['CDC 긍정적 양육', 'https://www.cdc.gov/parenting-toddlers/discipline/index.html'],
            ['부모 마음건강 안내', '#home']
        ]
    },
    {
        id: 'process-praise-boundary',
        match: /(결과만\s*칭찬|결과만\s*칭찬|과정\s*칭찬\s*아이|process\s*praise\s*child)/,
        title: '결과만이 아니라 노력·전략을 구체적으로 칭찬하면 도전에 도움이 될 수 있습니다',
        lead: '과장 칭찬만 반복하지 마세요.',
        points: [
            ['방법', '구체적 행동'],
            ['피하기', '막연한 최고']
        ],
        blocks: [
            ['지금 할 일', '무엇을 잘했는지 말하세요.'],
            ['하지 않을 일', '비교 칭찬을 남발하지 마세요.'],
            ['관련', '훈육·동기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx']
        ]
    },
    {
        id: 'sticker-chart-overuse-boundary',
        match: /(칭찬\s*스티커\s*과다|칭찬\s*스티커\s*과다|보상\s*스티커\s*매번|sticker\s*chart\s*overuse)/,
        title: '스티커 보상은 짧게·단순하게 쓰고, 모든 행동을 보상으로만 바꾸지 마세요',
        lead: '내적 동기와 관계를 함께 보세요. 제품 순위는 하지 않습니다.',
        points: [
            ['사용', '짧은 목표'],
            ['피하기', '과도한 물질 보상']
        ],
        blocks: [
            ['지금 할 일', '구체적 행동을 칭찬하세요.'],
            ['하지 않을 일', '실패했다고 벌을 주지 마세요.'],
            ['관련', '보상 차트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['행동 안내', '#home']
        ]
    },
    {
        id: 'reward-chart-boundary',
        match: /(보상\s*차트|스티커\s*차트|reward\s*chart|칭찬\s*도장\s*판|행동\s*보상\s*표)/,
        title: '스티커·보상 차트는 짧게·구체적으로 쓰고, 보상만으로 관계를 대체하지 마세요',
        lead: '작은 목표에 대한 즉각적 피드백은 도움이 될 수 있으나, 과도한 물질 보상은 효과가 떨어질 수 있습니다. 행동 자체를 구체적으로 칭찬하세요. “특효 차트 템플릿” 판매 순위는 하지 않습니다.',
        points: [
            ['방법', '작은 목표, 즉시 칭찬, 짧게 운영'],
            ['경계', '과한 사탕·돈 보상, 처벌 위주 표']
        ],
        blocks: [
            ['지금 할 일', '오늘 칭찬할 행동 한 가지를 정해 보세요.'],
            ['하지 않을 일', '차트 실패를 창피 주기로 쓰지 마세요.'],
            ['관련', '타임아웃·떼쓰기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육·의사소통 개요', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['CDC 긍정적 양육 개요', 'https://www.cdc.gov/parenting/']
        ]
    },
    {
        id: 'timeout-duration-boundary',
        match: /(타임아웃\s*몇\s*분|타임아웃\s*시간|timeout\s*minutes|반성\s*의자\s*몇\s*분|구석\s*서\s*있기)/,
        title: '타임아웃은 짧게·설명 가능하게 쓰고, 장시간 방치나 어두운 감금은 하지 마세요',
        lead: '연령에 맞는 짧은 시간이 일반적 안내입니다. 학대성 고립은 금지입니다. 분 수를 여기서 단정하지 않고 원칙을 안내합니다.',
        points: [
            ['원칙', '짧게, 안전 장소'],
            ['금지', '어두운 감금, 장시간']
        ],
        blocks: [
            ['지금 할 일', '끝난 뒤 짧게 기대 행동을 말하세요.'],
            ['하지 않을 일', '몇 시간씩 가두지 마세요.'],
            ['관련', '타임아웃·훈육 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['행동 안내', '#home']
        ]
    },
    {
        id: 'time-in-comfort-boundary',
        match: /(타임인\s*안아주기|타임인\s*안아주기| tim\s*in\s*육아|time\s*in\s*comfort\s*child)/,
        title: '타임인은 함께 감정을 가라앉히는 방법일 수 있으나, 위험 행동은 먼저 막으세요',
        lead: '모든 상황에 하나의 기법만 쓰지 마세요.',
        points: [
            ['상황', '감정 격앙'],
            ['우선', '안전']
        ],
        blocks: [
            ['지금 할 일', '위험한 행동은 먼저 멈추세요.'],
            ['하지 않을 일', '안아준다고 위험 행동을 허용하지 마세요.'],
            ['관련', '훈육 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['행동 안내', '#home']
        ]
    },
    {
        id: 'timeout-dark-room-boundary',
        match: /(타임아웃\s*방\s*가두기|타임아웃\s*어두운\s*방|반성\s*방\s*가두|timeout\s*dark\s*room)/,
        title: '타임아웃은 안전하고 밝은 곳에서 짧게 하고, 어두운 방에 가두지 마세요',
        lead: '장시간 고립은 해로울 수 있습니다.',
        points: [
            ['원칙', '짧게, 안전'],
            ['금지', '어두운 감금']
        ],
        blocks: [
            ['지금 할 일', '끝난 뒤 짧게 설명하세요.'],
            ['하지 않을 일', '몇 시간씩 가두지 마세요.'],
            ['관련', '타임아웃 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['행동 안내', '#home']
        ]
    },
    {
        id: 'timeout-discipline-boundary',
        match: /(타임\s*아웃|시간\s*제한\s*훈육|구석\s*서\s*있기|timeout|타임아웃\s*몇\s*분)/,
        title: '타임아웃은 짧게·일관되게, 체벌·모욕 없이, 위험한 행동은 즉시 막습니다',
        lead: '일부 훈육 안내에서 짧은 타임아웃이 쓰이지만, 모든 나이·모든 상황에 맞지는 않습니다. 아이를 밀치거나 가두지 말고, 설명은 짧게, 끝난 뒤 관계 회복이 중요합니다. 때리기·모욕은 권하지 않습니다. “나이×1분” 공식을 절대 규칙처럼 단정하지 않습니다.',
        points: [
            ['방법', '안전 공간, 짧은 시간, 차분한 목소리, 위험 행동 즉시 제지'],
            ['금지', '체벌, 장시간 감금, 공포 조성']
        ],
        blocks: [
            ['지금 할 일', '가정에서 안 되는 행동 2~3가지를 미리 합의하세요.'],
            ['하지 않을 일', '화난 김에 오래 방 안에 가두지 마세요.'],
            ['관련', '떼쓰기·조부모 훈육·체벌 금지 안내를 참고하세요.']
        ],
        links: [
            ['CDC 긍정적 양육', 'https://www.cdc.gov/parenting-toddlers/discipline/index.html'],
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/Disciplining-Your-Child.aspx']
        ]
    },
    {
        id: 'toddler-lie-shame-boundary',
        match: /(유아\s*거짓말\s*혼내기|유아\s*거짓말\s*혼|어린\s*아이\s*거짓말\s*혼내|toddler\s*lie\s*shame)/,
        title: '어린 아이 거짓말은 상상·두려움을 구분해 수치심 주기보다 진실을 말해도 안전하다고 가르치세요',
        lead: '위험한 거짓은 단호히 다루세요.',
        points: [
            ['태도', '침착, 안전 강조'],
            ['피하기', '창피 주기']
        ],
        blocks: [
            ['지금 할 일', '사실을 말할 공간을 주세요.'],
            ['하지 않을 일', '거짓말쟁이로 낙인 찍지 마세요.'],
            ['관련', '거짓말 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['행동 안내', '#home']
        ]
    },
    {
        id: 'toddler-lying-boundary',
        match: /(거짓말\s*아이|toddler\s*lying|허풍\s*말|아닌데\s*했다고|유아\s*거짓말|사실이\s*아닌\s*말)/,
        title: '유아의 과장·거짓말은 발달 과정일 수 있어, 창피 주기보다 사실과 감정을 분리해 다루세요',
        lead: '어린 아이는 상상과 사실을 섞거나 처벌을 피하려 말할 수 있습니다. “거짓말쟁이”로 낙인찍기보다 무슨 일이 있었는지 차분히 확인하고, 안전한 정직을 가르칩니다. 심한 반복·다른 문제 행동이 겹치면 상담을 검토하세요.',
        points: [
            ['대응', '비난 최소화, 사실 확인, 대안 말하기'],
            ['경계', '체벌·공개 망신']
        ],
        blocks: [
            ['지금 할 일', '“무슨 일이 있었어?”로 시작하세요.'],
            ['하지 않을 일', '작은 거짓말에 과한 처벌을 하지 마세요.'],
            ['관련', '떼쓰기·훈육 경계 안내를 참고하세요.']
        ],
        links: [
            ['AAP 행동·훈육 개요', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['CDC 아동 발달', 'https://www.cdc.gov/ncbddd/childdevelopment/']
        ]
    },
    {
        id: 'biting-reason-observe-boundary',
        match: /(물기\s*이유\s*파악|물기\s*이유|왜\s*물어\s*아이|biting\s*reason\s*toddler)/,
        title: '물기는 즉시 막고 상황을 기록하며, 언어·피로·좌절을 함께 보세요',
        lead: '때리기 대응은 피하세요.',
        points: [
            ['즉시', '막기, 짧게 말'],
            ['관찰', '유발 상황']
        ],
        blocks: [
            ['지금 할 일', '아픔을 짧게 알려 주세요.'],
            ['하지 않을 일', '이빨로 되받아 물지 마세요.'],
            ['관련', '물기·떼쓰기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['행동 안내', '#home']
        ]
    },
    {
        id: 'sibling-biting-daycare-boundary',
        match: /(어린이집\s*물림|동생\s*물어|형제\s*깨물|daycare\s*biting|친구\s*깨물|물기\s*습관)/,
        title: '물기·깨물기는 흔할 수 있으나, 상처·반복이면 대응 방법을 시설·의료진과 상의하세요',
        lead: '언어가 부족한 시기에 물기가 나타날 수 있습니다. 즉시 중단·짧게 설명·관심을 물기로 보상하지 않기. 피부 상처는 세척 후 감염 징후를 봅니다. “특효 훈육템” 추천은 하지 않습니다.',
        points: [
            ['즉시', '분리, 짧은 말, 상처 세척'],
            ['예방', '피곤·배고픔 신호, 대체 표현']
        ],
        blocks: [
            ['지금 할 일', '물린 시간을 기록하고 시설에 알리세요.'],
            ['하지 않을 일', '맞물어 “가르치지” 마세요.'],
            ['관련', '떼쓰기·물기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물기·공격 행동 개요', 'https://www.healthychildren.org/English/ages-stages/toddler/Pages/default.aspx'],
            ['CDC 아동 발달', 'https://www.cdc.gov/ncbddd/childdevelopment/']
        ]
    },
    {
        id: 'public-tantrum-boundary',
        match: /(마트\s*떼쓰|공공장소\s*떼|public\s*tantrum|밖에서\s*울며\s*뒹굴|가게\s*바닥\s*울음)/,
        title: '공공장소 떼쓰기에는 안전을 먼저 보고, 짧고 일관된 반응을 유지하세요',
        lead: '창피함보다 안전·일관성이 중요합니다. 때리기·수치심 주기는 피하세요.',
        points: [
            ['우선', '안전, 차분한 목소리'],
            ['피하기', '체벌, 긴 설교']
        ],
        blocks: [
            ['지금 할 일', '위험하면 장소를 잠시 이동하세요.'],
            ['하지 않을 일', '때리거나 소리로 제압하지 마세요.'],
            ['관련', '떼쓰기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['행동 안내', '#home']
        ]
    },
    {
        id: 'public-noise-sensitivity-boundary',
        match: /(공공\s*자리\s*소음)/,
        title: '큰 소음에 예민하면 귀마개·짧은 체류·미리 설명을 검토하고, 강제 노출을 피하세요',
        lead: '감각 예민이 심하고 일상을 방해하면 상담을 검토하세요. 제품 순위는 하지 않습니다.',
        points: [
            ['조절', '거리, 시간, 보호'],
            ['피하기', '억지 견디기']
        ],
        blocks: [
            ['지금 할 일', '출구 가까운 자리를 고르세요.'],
            ['하지 않을 일', '울어도 소음 속에 붙잡아 두지 마세요.'],
            ['관련', '감각·떼쓰기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'grocery-snack-tantrum-boundary',
        match: /(마트\s*간식\s*떼|마트\s*간식\s*떼|슈퍼\s*과자\s*울|grocery\s*snack\s*tantrum)/,
        title: '마트 간식 떼쓰기에는 미리 규칙을 정하고 안전을 우선하며 체벌을 피하세요',
        lead: '창피함보다 일관성이 중요합니다.',
        points: [
            ['준비', '미리 규칙'],
            ['피하기', '체벌, 수치']
        ],
        blocks: [
            ['지금 할 일', '들어가기 전 규칙을 말하세요.'],
            ['하지 않을 일', '때리거나 소리로 제압하지 마세요.'],
            ['관련', '떼쓰기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['행동 안내', '#home']
        ]
    },
    {
        id: 'tantrum-aggression',
        match: /(떼쓰|떼를\s*쓰|고집|물어요|무는\s*행동|물기|때려|때리는|밀쳐|소리\s*질러|공격)/,
        title: '떼쓰기는 흔하지만 때리기·물기는 바로 막아야 합니다',
        lead: '1~3세의 떼쓰기는 감정과 말을 조절하는 능력이 자라는 과정에서 흔합니다. 감정은 받아 주되 다치게 하는 행동까지 허용하거나 무시하지는 않습니다.',
        points: [
            ['먼저 안전', '때리거나 물면 짧고 낮은 목소리로 멈추고 아이들을 떨어뜨려 다치지 않게 합니다.'],
            ['가르칠 행동', '진정된 뒤 “화났구나. 때리지 않고 도와줘라고 말해”처럼 감정과 대신할 행동을 짧게 알려 줍니다.']
        ],
        blocks: [
            ['예방', '배고픔·피곤함·전환 상황을 미리 살피고 가능한 선택 두 가지를 주며 잘한 행동을 바로 구체적으로 칭찬하세요.'],
            ['하지 않을 일', '맞서 소리치거나 때리기, 긴 설교, 위험한 행동을 관심 끌기라며 그대로 두기를 피하세요.'],
            ['상담', '공격이 심해 자주 다치거나 여러 장소에서 오래 지속되고, 이전 기술 상실·언어·놀이 걱정이 함께 있거나 가족이 감당하기 어렵다면 상담하세요.']
        ],
        links: [
            ['CDC 2~4세 긍정적 양육', 'https://www.cdc.gov/parenting-toddlers/about/index.html'],
            ['AAP 어린아이 공격 행동', 'https://www.healthychildren.org/English/ages-stages/toddler/Pages/Aggressive-Behavior.aspx'],
            ['발달 걱정·상담 준비', 'blog/development-kdst-guide.html#act']
        ]
    },
    {
        id: 'baby-powder-boundary',
        match: /(베이비\s*파우더|탈크|파우더\s*엉덩|옥수수\s*전분\s*파우더|분말\s*파우더\s*아기)/,
        title: '아기 엉덩이·피부에 파우더를 뿌리는 것은 흡입 위험이 있어 권하지 않습니다',
        lead: '탈크·분말 파우더는 공기 중으로 퍼져 아기가 들이마실 수 있습니다. 기저귀 발진에는 자주 갈아 주기·통풍·보습·보호막이 우선이고, 파우더 사용을 기본으로 두지 마세요. 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '자주 갈아 주기, 건조, 자극 줄이기'],
            ['위험', '분말 흡입, 밀폐된 곳에서 뿌리기']
        ],
        blocks: [
            ['지금 할 일', '파우더 대신 청결·건조·보습 루틴을 점검하세요.'],
            ['하지 않을 일', '아이 얼굴 가까이에서 파우더를 뿌리지 마세요.'],
            ['관련', '기저귀 발진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 기저귀 발진·파우더', 'https://www.healthychildren.org/English/ages-stages/baby/diapers-clothing/Pages/Diaper-Rash.aspx'],
            ['기저귀 발진 안내', '#home']
        ]
    },
    {
        id: 'zinc-oxide-cream-boundary',
        match: /(산화아연\s*연고|징크\s*옥사이드|zinc\s*oxide|기저귀\s*크림\s*두껍|방수\s*발진\s*크림)/,
        title: '산화아연 발진 크림은 표시 용법으로 얇게 바르고, 효과·브랜드를 단정하지 마세요',
        lead: '기저귀 발진에 산화아연 성분이 쓰이기도 합니다. 깨끗한 피부에 표시 용법대로 바르고, 감염 징후(고름·열·번짐)면 진료하세요. 용량·브랜드 순위·“특효” 단정은 하지 않습니다.',
        points: [
            ['사용', '세척·건조 후, 표시 연령, 얇게'],
            ['진료', '악화, 열, 수포·고름, 통증']
        ],
        blocks: [
            ['지금 할 일', '제품 성분과 월령 표시를 확인하세요.'],
            ['하지 않을 일', '여러 연고를 겹겹이 임의로 섞지 마세요.'],
            ['관련', '기저귀 발진·손 씻기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 기저귀 발진 개요', 'https://www.healthychildren.org/English/ages-stages/baby/diapers-clothing/Pages/default.aspx'],
            ['CDC 피부 위생 개요', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'petroleum-jelly-boundary',
        match: /(바셀린\s*아기|페트롤리움\s*젤리|petroleum\s*jelly|바세린\s*발진|바셀린\s*기저귀)/,
        title: '바셀린·페트롤리움 젤리는 건조·마찰 완화에 쓰이기도 하나, 감염 발진은 진료가 우선입니다',
        lead: '깨끗한 피부에 소량 바르는 용도로 안내되는 경우가 있으나, 감염·심한 발진을 치료한다고 단정하지 마세요. 코에 두껍게 바르거나 호흡을 막는 사용은 피합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['사용', '깨끗한 피부, 소량, 표시 용법'],
            ['진료', '고름, 열, 번짐, 통증']
        ],
        blocks: [
            ['지금 할 일', '제품 표시 연령과 용법을 확인하세요.'],
            ['하지 않을 일', '코·입에 잔뜩 바르지 마세요.'],
            ['관련', '기저귀 발진·산화아연 안내를 참고하세요.']
        ],
        links: [
            ['AAP 피부·기저귀 개요', 'https://www.healthychildren.org/English/ages-stages/baby/diapers-clothing/Pages/default.aspx'],
            ['AAP 목욕·피부', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/default.aspx']
        ]
    },
    {
        id: 'sensitive-wipes-boundary',
        match: /(물티슈\s*자극|민감\s*물티슈|baby\s*wipes\s*rash|물티슈\s*발진|물티슈\s*알레르기)/,
        title: '물티슈로 피부가 따갑면 미지근한 물·부드러운 천을 쓰고, 향·알코올 제품을 줄여 보세요',
        lead: '일부 아이는 물티슈 성분에 자극을 받습니다. 가능하면 물로 닦고 잘 말리세요. “무자극 1등” 브랜드 순위는 하지 않으며, 심한 발진·감염 징후는 진료합니다.',
        points: [
            ['대안', '미지근한 물, 부드러운 천, 완전 건조'],
            ['피하기', '강한 향, 알코올, 과도한 문지름']
        ],
        blocks: [
            ['지금 할 일', '물티슈 대신 물 세안을 하루 시도해 보세요.'],
            ['하지 않을 일', '빨간 피부를 세게 문지르지 마세요.'],
            ['관련', '기저귀 발진·손 씻기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 기저귀·피부 개요', 'https://www.healthychildren.org/English/ages-stages/baby/diapers-clothing/Pages/default.aspx'],
            ['CDC 위생 개요', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'diaper-size-fit-leak-boundary',
        match: /(기저귀\s*사이즈\s*맞|기저귀\s*크기\s*고르|diaper\s*size\s*fit|기저귀\s*새는\s*사이즈|기저귀\s*빨간\s*자국\s*조임)/,
        title: '기저귀는 새지 않고 빨간 자국이 심하지 않은 핏을 고르고, 너무 조이면 교체하세요',
        lead: '브랜드 순위는 하지 않습니다. 발진·누수는 교체 빈도·크기와 함께 보세요.',
        points: [
            ['핏', '허리·허벅지, 새지 않음'],
            ['주의', '과도한 조임, 발진']
        ],
        blocks: [
            ['지금 할 일', '체중 표시와 실제 핏을 함께 보세요.'],
            ['하지 않을 일', '새는 채로 오래 두지 마세요.'],
            ['관련', '기저귀 발진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['발진 안내', '#home']
        ]
    },
    {
        id: 'wipe-front-to-back-boundary',
        match: /(배변\s*후\s*닦기)/,
        title: '배변 후 닦을 때는 앞에서 뒤로 닦는 안내가 흔하며, 자극이 있으면 물 세척을 검토하세요',
        lead: '발진·감염이 심하면 진료하세요. 물티슈 브랜드 순위는 하지 않습니다.',
        points: [
            ['방법', '앞에서 뒤로, 부드럽게'],
            ['주의', '강한 마찰']
        ],
        blocks: [
            ['지금 할 일', '접힌 부위도 가볍게 닦으세요.'],
            ['하지 않을 일', '세게 문지르지 마세요.'],
            ['관련', '기저귀 발진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'diaper-rash',
        match: /(기저귀\s*발진|기저귀\s*(빨|짓무|헐)|엉덩이\s*(빨개|발진|짓)|사타구니\s*(발진|빨)|기저귀\s*피부)/,
        title: '기저귀 발진은 자주 갈아 주고 보습·보호막을 먼저 봅니다',
        lead: '많은 아기에게 한 번 이상 생깁니다. 특정 기저귀 브랜드가 “발진 예방 최고”라는 근거는 없습니다. 깨끗이 닦고 말린 뒤 산화아연·바셀린 계열 보호막을 두껍게 바르는 가정 관리가 먼저이고, 2~3일 안 호전·고름·발열이면 진료합니다.',
        points: [
            ['가정에서 할 일', '대소변 후 부드럽게 닦고 완전히 말리며, 공기 쐬기 시간을 두고 보호 연고를 두껍게 바릅니다.'],
            ['더 볼 신호', '가장자리에 좁쌀·고름, 통증으로 울음이 심함, 열, 2~3일 관리에도 악화']
        ],
        blocks: [
            ['지금 할 일', '교체 횟수를 늘리고 알코올·강한 향 물티슈를 줄이며, 연고를 매번 완전히 닦아내지 말고 덧바르는 방식을 시도하세요.'],
            ['하지 않을 일', '스테로이드·항생·항진균 연고를 처방 없이 임의로 바르거나, “카페 추천 크림”만 믿고 진료를 미루지 마세요.'],
            ['진료·상담', '물집·고름·열·처짐이 있거나 가정 관리 2~3일에도 나빠지면 의료진이 칸디다 등 여부를 판단합니다.']
        ],
        links: [
            ['AAP 기저귀 발진 안내', 'https://www.healthychildren.org/English/ages-stages/baby/diapers-clothing/Pages/Diaper-Rash.aspx'],
            ['NHS 기저귀 발진', 'https://www.nhs.uk/baby/caring-for-a-newborn/nappy-rash/'],
            ['발열·응급이 함께 있을 때', 'blog/baby-fever-cold-guide.html#urgent']
        ]
    },
    {
        id: 'new-cosmetic-reaction-child-boundary',
        match: /(새\s*화장품\s*반응)/,
        title: '새 로션·화장품 후 발진·부종이 있으면 사용을 중단하고, 호흡 이상이면 응급 진료하세요',
        lead: '브랜드 순위는 하지 않습니다. 심한 전신 반응은 응급입니다.',
        points: [
            ['즉시', '제품 중단, 세척'],
            ['응급', '호흡·부종']
        ],
        blocks: [
            ['지금 할 일', '제품명을 기록하세요.'],
            ['하지 않을 일', '같은 제품을 계속 바르지 마세요.'],
            ['관련', '알레르기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'pet-allergy-child-boundary',
        match: /(반려동물\s*알레르기)/,
        title: '반려동물 알레르기가 의심되면 증상 기록 후 진료하고, 임의 파양을 성급히 단정하지 마세요',
        lead: '진단은 의료진이 합니다. 약 용량은 여기서 정하지 않습니다.',
        points: [
            ['관찰', '재채기, 피부, 호흡'],
            ['상담', '지속·악화']
        ],
        blocks: [
            ['지금 할 일', '증상과 노출 상황을 적으세요.'],
            ['하지 않을 일', '호흡 곤란을 가볍게 보지 마세요.'],
            ['관련', '알레르기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/healthypets/']
        ]
    },
    {
        id: 'school-meal-allergy-plan-boundary',
        match: /(급식\s*알레르기|학교\s*알레르기\s*플랜|school\s*meal\s*allergy|알레르기\s*긴급\s*주사\s*학교|급식\s*식품\s*알레르기)/,
        title: '학교·어린이집 알레르기는 진단·비상 계획을 시설과 공유하고, 응급 시 안내를 따르세요',
        lead: '약 용량·주사는 의료진 처방을 따릅니다. 여기서 용량을 정하지 않습니다.',
        points: [
            ['공유', '알레르기 목록, 비상 연락'],
            ['응급', '호흡·부종']
        ],
        blocks: [
            ['지금 할 일', '시설에 서면 계획을 전달하세요.'],
            ['하지 않을 일', '간식 나눔을 무심코 허용하지 마세요.'],
            ['관련', '알레르기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['알레르기 안내', '#home']
        ]
    },
    {
        id: 'epinephrine-autoinjector-school-boundary',
        match: /(음식\s*알레르기\s*에피펜|에피펜\s*학교|에피네프린\s*자동\s*주사|epinephrine\s*school\s*child)/,
        title: '에피네프린 자동주사기는 처방·교육대로 시설과 공유하고, 사용 후 응급 진료를 받으세요',
        lead: '용량·사용법은 의료진 교육을 따릅니다. 여기서 사용법을 대체하지 않습니다.',
        points: [
            ['준비', '처방, 시설 공유'],
            ['사용 후', '응급실']
        ],
        blocks: [
            ['지금 할 일', '유효기간을 확인하세요.'],
            ['하지 않을 일', '약이 없다고 알레르기 식품을 시도하지 마세요.'],
            ['관련', '알레르기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['알레르기 안내', '#home']
        ]
    },
    {
        id: 'allergy-reaction-boundary',
        match: /(알레르기).*(반응|증상|즉시|지연|두드러기|부종|아나필)|아나필락|즉시\s*반응|전신\s*두드러기|먹은\s*뒤\s*(두드러기|부어|숨)/,
        title: '알레르기 즉시 반응과 지연 불편을 구분하고, 호흡·부종은 응급입니다',
        lead: '식품을 먹은 직후 두드러기·구토·기침·숨 힘듦·입술·혀 부종·축 처짐은 즉시 반응 쪽으로 보고 응급 조치를 우선합니다. 수 시간~수일 뒤 발진·복통만으로는 원인 식품을 사진·문장으로 단정하지 않습니다. 사이트에서 병명·에피펜 용량·브랜드를 정하지 않습니다.',
        points: [
            ['즉시 쪽', '수분~2시간 안 두드러기·구토·호흡 이상·부종·처짐 → 119·응급실'],
            ['지연·모호', '며칠 뒤 가벼운 발진만 있으면 기록을 남기고 의료진과 재도입·검사를 상의']
        ],
        blocks: [
            ['지금 할 일', '먹은 음식·시각·증상 순서를 적고, 심한 습진·이전 즉시 반응이 있으면 집에서 시험 도입하지 마세요.'],
            ['하지 않을 일', '사진으로 병명을 단정하거나, 처방 없이 강한 연고·항히스타민 용량을 댓글로 정하지 마세요.'],
            ['관련', '알레르기 식품 도입·질식 구분 안내를 함께 보세요.']
        ],
        links: [
            ['이유식·알레르기 가이드', 'blog/complementary-feeding-allergy-guide.html#allergens'],
            ['ASCIA 영아 알레르기 예방', 'https://www.allergy.org.au/hp/papers/infant-feeding-and-allergy-prevention'],
            ['발열·응급 신호', 'blog/baby-fever-cold-guide.html#urgent']
        ]
    },
    {
        id: 'bath-moisturize-within-boundary',
        match: /(목욕\s*후\s*보습|목욕\s*보습|moisturize\s*after\s*bath|아토피\s*보습\s*타이밍|로션\s*목욕\s*직후)/,
        title: '목욕 후 물기를 가볍게 누르고 보습을 빨리 바르는 방법이 피부 건조에 도움이 될 수 있습니다',
        lead: '아토피·건조 피부는 보습이 중요합니다. 약 처방·스테로이드 사용은 의료진을 따르세요. 제품 순위는 하지 않습니다.',
        points: [
            ['순서', '가볍게 누르고 보습'],
            ['진료', '감염 징후, 심한 가려움']
        ],
        blocks: [
            ['지금 할 일', '목욕 직후 보습을 발라 보세요.'],
            ['하지 않을 일', '뜨거운 목욕을 오래 시키지 마세요.'],
            ['관련', '습진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'steroid-cream-fear-boundary',
        match: /(아토피\s*스테로이드\s*공포|스테로이드\s*연고\s*무섭|아토피\s*스테로이드\s*중독|steroid\s*cream\s*fear\s*child)/,
        title: '스테로이드 연고는 의료진 지시에 맞게 쓰는 것이 중요하고, 임의로 중단·과용하지 마세요',
        lead: '공포만으로 치료를 방치하면 악화될 수 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '처방 지시'],
            ['금지', '임의 과용·무단 중단']
        ],
        blocks: [
            ['지금 할 일', '사용 부위를 기록하세요.'],
            ['하지 않을 일', '이웃 처방을 공유하지 마세요.'],
            ['관련', '습진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['피부 안내', '#home']
        ]
    },
    {
        id: 'eczema-care-boundary',
        match: /(아토피|습진|eczema|가려운\s*피부|건조\s*피부\s*아기|태열)/,
        title: '건조·가려운 피부는 보습·자극 줄이기가 기본이고, 사진으로 병명을 단정하지 않습니다',
        lead: '아토피·습진으로 불리는 건조·가려움은 보습, 짧은 미온 목욕, 자극 적은 세제·옷이 기본 관리로 자주 안내됩니다. 사진·댓글로 병명·스테로이드 강도를 정하지 마세요. 감염 징후·수면 방해·번짐이 심하면 진료합니다. 연고 브랜드 순위는 하지 않습니다.',
        points: [
            ['가정', '보습, 손톱 짧게, 긁기 줄이기, 자극 피하기'],
            ['진료', '진물·노란 딱지·발열, 눈 주위, 일상 크게 방해']
        ],
        blocks: [
            ['지금 할 일', '목욕 시간과 보습 시점을 점검하세요.'],
            ['하지 않을 일', '인터넷 사진과 맞춰 약을 사지 마세요.'],
            ['관련', '발진 경계·기저귀 발진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 습진', 'https://www.healthychildren.org/English/health-issues/conditions/skin/Pages/Eczema.aspx'],
            ['질병관리청 아토피 개요', 'https://health.kdca.go.kr/'],
            ['발진 경계 안내', '#home']
        ]
    },
    {
        id: 'impetigo-boundary',
        match: /(농가진|impetigo|꿀\s*딱지|노란\s*딱지\s*피부|피부\s*고름\s*물집)/,
        title: '노란 딱지·물집이 보이면 농가진 등 가능성이 있어 사진 진단 없이 진료를 검토하세요',
        lead: '피부에 물집·노란 딱지가 생기는 모습은 농가진 등 세균 피부 감염으로 설명되기도 하지만, 사진·댓글만으로 병명을 정하지 않습니다. 긁지 않게 하고, 연고·항생제 여부는 의료진이 정합니다. 열이 나거나 빠르게 퍼지면 빨리 진료하세요.',
        points: [
            ['가정', '손 씻기, 수건·침구 구분, 병변 만지지 않기'],
            ['진료', '퍼짐, 발열, 통증, 눈 주위 침범']
        ],
        blocks: [
            ['지금 할 일', '병변 시작 시기와 퍼진 범위를 기록하세요.'],
            ['하지 않을 일', '성인 항생 연고를 임의로 바르지 마세요.'],
            ['관련', '발진 경계·손 씻기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 농가진', 'https://www.cdc.gov/group-a-strep/about/impetigo.html'],
            ['NHS 농가진', 'https://www.nhs.uk/conditions/impetigo/'],
            ['발진 경계 안내', '#home']
        ]
    },
    {
        id: 'scabies-boundary',
        match: /(옴\s*진드기|옴\s*감염|옴\s*의심|scabies|야간\s*가려움\s*전신|손가락\s*사이\s*가려움\s*밤|전신\s*가려움\s*밤)/,
        title: '심한 가려움·밤에 더하면 옴 등이 의심될 수 있어 자가 약 용량을 정하지 마세요',
        lead: '밤에 심해지는 가려움과 특정 부위의 발진은 옴 등 여러 원인일 수 있습니다. 사진으로 단정하지 말고, 치료제·가족 동시 치료는 의료진·약사 안내를 따릅니다. “국민 연고” 추천은 하지 않습니다.',
        points: [
            ['의심 시', '진료·약국 상담, 가족·동거인 증상 확인'],
            ['위생', '옷·침구 세탁·건조, 불필요한 살충 남용 금지']
        ],
        blocks: [
            ['지금 할 일', '가려움 시간대와 가족 여부를 적으세요.'],
            ['하지 않을 일', '성인 약을 아이 몸무게 감으로 바르지 마세요.'],
            ['관련', '발진·머릿니 경계를 참고하세요.']
        ],
        links: [
            ['CDC 옴', 'https://www.cdc.gov/scabies/'],
            ['NHS 옴', 'https://www.nhs.uk/conditions/scabies/']
        ]
    },
    {
        id: 'chickenpox-boundary',
        match: /(수두|chickenpox|varicella|수두\s*접종|수두\s*물집|가려운\s*물집\s*열)/,
        title: '수두 의심은 물집·열을 사진으로 단정하지 말고, 접종·등원은 공식·시설 안내를 따르세요',
        lead: '가려운 물집과 열이 함께 있으면 수두 등 가능성이 있으나 사이트에서 병명을 확정하지 않습니다. 임산부·신생아·면역 저하자 접촉 시 특히 빨리 의료 상담이 필요합니다. 등원·격리 기간은 시설·보건 안내를 확인하고, 아스피린은 주지 마세요(라이 증후군 관련).',
        points: [
            ['돌봄', '긁힘 최소화, 수분, 해열은 의료 안내 성분'],
            ['주의', '임산부·신생아 접촉, 호흡 곤란·처짐·고열 지속']
        ],
        blocks: [
            ['지금 할 일', '접종 기록과 증상 시작일을 확인하세요.'],
            ['하지 않을 일', '아스피린·검증 안 된 민간 목욕제를 쓰지 마세요.'],
            ['관련', '발열·아스피린 경계·접종 안내를 참고하세요.']
        ],
        links: [
            ['CDC 수두', 'https://www.cdc.gov/chickenpox/'],
            ['질병관리청 수두', 'https://www.kdca.go.kr/'],
            ['예방접종 일정', 'blog/vaccination-schedule.html']
        ]
    },
    {
        id: 'fifth-disease-boundary',
        match: /(제5병|파이브스|슬랩트\s*치크|slapped\s*cheek|파르보\s*바이러스|parvovirus\s*b19|홍반\s*감염)/,
        title: '양볼이 빨개 보이는 발진은 여러 원인이 있어 사진으로 제5병을 단정하지 마세요',
        lead: '파르보바이러스 B19(제5병)는 볼이 맞은 듯 빨개 보이거나 그물 모양 발진이 나타날 수 있으나, 알레르기·다른 감염과 구분은 진료가 필요합니다. 임신부가 노출되면 산과 상담이 중요합니다. 약 용량·사진 진단은 하지 않습니다.',
        points: [
            ['관찰', '열, 발진 순서, 전신 상태, 임신 가족 노출'],
            ['상담', '호흡 곤란·처짐·임신 중 노출은 의료진']
        ],
        blocks: [
            ['지금 할 일', '증상 시작 시점과 접촉자를 기록하세요.'],
            ['하지 않을 일', '카페 사진과 비교해 병명을 단정하지 마세요.'],
            ['관련', '발진·돌발진·수두 경계 안내를 참고하세요.']
        ],
        links: [
            ['CDC 파르보바이러스 B19', 'https://www.cdc.gov/parvovirusb19/'],
            ['AAP 발진·감염 개요', 'https://www.healthychildren.org/English/health-issues/conditions/skin/Pages/default.aspx']
        ]
    },
    {
        id: 'roseola-return-boundary',
        match: /(돌발진\s*후\s*등원)/,
        title: '돌발진이 의심·진단되면 등원 시기는 의료진·시설 안내를 따르고, 사진으로 병명을 단정하지 마세요',
        lead: '열·발진 패턴은 개인차가 있습니다. 약 용량은 단정하지 않습니다.',
        points: [
            ['상담', '진단, 시설 규정'],
            ['관찰', '처짐, 수분']
        ],
        blocks: [
            ['지금 할 일', '진료 소견을 확인하세요.'],
            ['하지 않을 일', '사진 검색으로 병명을 정하지 마세요.'],
            ['관련', '돌발진·열 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'roseola-boundary',
        match: /(돌발진|돌\s*발진|장미진|roseola|sixth\s*disease|열\s*내린\s*뒤\s*발진|고열\s*후\s*발진)/,
        title: '고열 뒤 발진은 돌발진 등 여러 가능성이 있어 사진·문장으로 병명을 정하지 않습니다',
        lead: '며칠 고열 뒤 몸·목에 분홍 발진이 나는 패턴은 돌발진(소아 장미진)으로 설명되기도 하지만, 비슷한 경과가 다른 감염에서도 나타날 수 있습니다. 사진 앱·댓글로 병명을 단정하지 말고, 처짐·호흡·수분·경련·발진 모양을 의료진이 봅니다. 해열제 용량은 사이트에서 정하지 않습니다.',
        points: [
            ['관찰', '열 기간, 발진 시작 시점, 수분·활력, 경련 여부'],
            ['진료', '3개월 미만 발열, 깨우기 어려움, 호흡 곤란, 점상출혈성 발진, 탈수']
        ],
        blocks: [
            ['지금 할 일', '열 시작·최고 체온·발진 시각·소변을 기록하세요.'],
            ['하지 않을 일', '사진만 보고 “돌발진이니 괜찮다”고 단정하지 마세요.'],
            ['관련', '발열·발진 경계 안내를 참고하세요.']
        ],
        links: [
            ['CDC 돌발진(roseola) 개요', 'https://www.cdc.gov/roseola/about/index.html'],
            ['NHS 돌발진', 'https://www.nhs.uk/conditions/roseola/'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'ringworm-boundary',
        match: /(백선|ringworm|피부\s*백선|원형\s*탈모\s*백선|곰팡이\s*피부|두부\s*백선|몸\s*백선)/,
        title: '둥근 발진·가려움은 백선 등 여러 원인일 수 있어 사진으로 병명을 정하지 마세요',
        lead: '테두리 있는 둥근 발진은 백선(피부 진균)으로 설명되기도 하지만, 습진·다른 발진과 구분이 필요합니다. 연고·항진균제 종류·기간은 의료진·약사가 정하고, 가족·반려동물 전파 가능성도 상담합니다. 브랜드 순위·사진 진단은 하지 않습니다.',
        points: [
            ['가정', '손 씻기, 수건 구분, 병변 긁지 않기'],
            ['진료', '퍼짐, 통증·고름, 두피 침범, 열이 날 때']
        ],
        blocks: [
            ['지금 할 일', '언제 시작했는지·퍼진 부위를 기록하세요.'],
            ['하지 않을 일', '성인 항진균 연고를 임의 용량으로 바르지 마세요.'],
            ['관련', '발진·농가진 경계를 참고하세요.']
        ],
        links: [
            ['CDC 백선', 'https://www.cdc.gov/ringworm/'],
            ['NHS 백선', 'https://www.nhs.uk/conditions/ringworm/'],
            ['발진 경계 안내', '#home']
        ]
    },
    {
        id: 'herpangina-mouth-sores-boundary',
        match: /(헤르판지나|herpangina|구내염\s*아기|입안\s*물집\s*열|입\s*안\s*궤양\s*열|목\s*안\s*물집)/,
        title: '입안 물집·발열은 헤르판지나 등 여러 원인이 있어 사진으로 병명을 정하지 마세요',
        lead: '열과 함께 입안·목 안 궤양·물집이 있으면 헤르판지나·수족구 등 가능성이 있으나 사이트에서 단정하지 않습니다. 수분 섭취와 처짐을 보고, 탈수·호흡 곤란·생후 어린 영아는 진료를 우선합니다. 약 용량·브랜드 연고 추천은 하지 않습니다.',
        points: [
            ['돌봄', '소량씩 수분, 자극 적은 음식, 손 씻기'],
            ['진료', '탈수, 침만 흘림, 고열·처짐, 3개월 미만']
        ],
        blocks: [
            ['지금 할 일', '소변량·마신 양·열을 기록하세요.'],
            ['하지 않을 일', '성인 구내염 약을 아기에게 바르지 마세요.'],
            ['관련', '수족구·탈수·발열 안내를 참고하세요.']
        ],
        links: [
            ['CDC 엔테로바이러스 개요', 'https://www.cdc.gov/non-polio-enterovirus/'],
            ['NHS 구내염·입 궤양(영)', 'https://www.nhs.uk/conditions/mouth-ulcers/'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'cold-sore-herpes-infant',
        match: /(구순\s*포진|입술\s*헤르페스|cold\s*sore|헤르페스\s*아기|입술\s*물집\s*열|HSV\s*아기)/,
        title: '입술 물집·구순포진 의심 시 영아에게 키스·침 공유를 피하고 진료를 검토하세요',
        lead: '성인 구순포진 바이러스가 신생아·영아에게 전파되면 위험할 수 있습니다. 물집이 있을 때 아기에게 키스하지 말고, 컵·수건을 따로 쓰세요. 아기 입안·몸에 물집·고열·처짐이 있으면 사진 진단 없이 진료하세요. 항바이러스 용량은 사이트에서 정하지 않습니다.',
        points: [
            ['예방', '물집 있을 때 키스 금지, 손 씻기, 침 공유 금지'],
            ['진료', '영아 고열·처짐·수유 거부·광범위 물집']
        ],
        blocks: [
            ['지금 할 일', '가족 중 입술 물집이 있으면 아기 접촉을 줄이세요.'],
            ['하지 않을 일', '입술 물집을 터뜨리거나 민간 약을 아기에게 바르지 마세요.'],
            ['관련', '발진·발열 경계를 참고하세요.']
        ],
        links: [
            ['CDC 헤르페스·구순포진 개요', 'https://www.cdc.gov/herpes/'],
            ['AAP 구순포진·아기', 'https://www.healthychildren.org/English/health-issues/conditions/skin/Pages/Herpes-Simplex-Virus-Cold-Sores.aspx'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'poison-ivy-after-contact-boundary',
        match: /(옻나무\s*접촉\s*후|poison\s*ivy\s*after|옻\s*묻은\s*옷|덩굴옻\s*씻|독담쟁이\s*접촉)/,
        title: '옻나무 접촉 후에는 비누로 피부·옷을 씻고, 심한 발진·얼굴·호흡이면 진료하세요',
        lead: '사진만으로 식물·병명을 단정하지 않습니다. 긁어 상처를 키우지 마세요.',
        points: [
            ['즉시', '비누 세척, 옷 분리'],
            ['진료', '눈·얼굴·호흡']
        ],
        blocks: [
            ['지금 할 일', '노출 부위를 비누로 씻으세요.'],
            ['하지 않을 일', '나뭇잎을 불에 태우며 연기를 마시지 마세요.'],
            ['관련', '옻나무 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/']
        ]
    },
    {
        id: 'poison-ivy-boundary',
        match: /(독담쟁이|포이즌\s*아이비|poison\s*ivy|옻\s*올|식물\s*접촉\s*피부염|덩굴\s*옻)/,
        title: '독성 식물 접촉 후 가려운 발진은 씻어 내고, 심한 부종·호흡 이상은 진료하세요',
        lead: '독담쟁이 등 접촉 피부염은 붉은 선·수포·가려움으로 나타날 수 있습니다. 노출 부위는 비누와 물로 씻고, 옷·도구도 닦으세요. 사진만으로 병명을 단정하지 않으며, 눈·입·숨 이상·넓은 수포는 진료합니다. 연고 용량·브랜드 추천은 하지 않습니다.',
        points: [
            ['즉시', '피부·손 씻기, 옷 분리 세탁'],
            ['진료', '얼굴·생식기, 심한 부종, 감염 징후, 호흡 이상']
        ],
        blocks: [
            ['지금 할 일', '야외 활동 후 노출 가능 피부를 씻으세요.'],
            ['하지 않을 일', '수포를 억지로 짜거나 민간 태워 없애기를 하지 마세요.'],
            ['관련', '발진 진료 시점·벌레 물림 안내를 참고하세요.']
        ],
        links: [
            ['CDC 독성 식물', 'https://www.cdc.gov/niosh/topics/plants/'],
            ['AAP 접촉 피부염 개요', 'https://www.healthychildren.org/English/health-issues/conditions/skin/Pages/default.aspx']
        ]
    },
    {
        id: 'hfmd-return-timing-boundary',
        match: /(수족구\s*등원\s*시기|수족구\s*등원\s*시기|수족구\s*언제\s*어린이집|hfmd\s*return\s*daycare)/,
        title: '수족구 등원 시기는 시설·의료진 안내와 전신 상태를 보고, 사진으로 진단하지 마세요',
        lead: '물집이 남아 있어도 기준이 다를 수 있습니다.',
        points: [
            ['기준', '열 소실, 시설 규정'],
            ['금지', '사진 단정']
        ],
        blocks: [
            ['지금 할 일', '진료 소견을 확인하세요.'],
            ['하지 않을 일', '아파 보이면 무리해 보내지 마세요.'],
            ['관련', '수족구 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['등원 안내', '#home']
        ]
    },
    {
        id: 'hand-foot-mouth-boundary',
        match: /(수족구|손발입|hand\s*foot\s*mouth|hfmd|HFMD|손\s*발\s*입\s*병)/,
        title: '손·발·입 발진과 열이 있으면 수족구 등 가능성이 있어 진료·손 씻기를 우선하세요',
        lead: '손·발·입안 수포성 발진과 발열이 함께 있으면 수족구병 등을 의료진이 판단합니다. 사진만으로 병명을 단정하지 마세요. 수분 섭취·처짐을 보고, 탈수·호흡 이상·생후 어린 영아는 진료가 급합니다. 등원·등원 자제는 시설·공중보건 안내를 따릅니다. 약 용량·연고 추천은 하지 않습니다.',
        points: [
            ['관찰', '열, 입안 통증, 수분·소변, 처짐'],
            ['예방', '손 씻기, 침·장난감 공유 줄이기, 아픈 아이 등원 자제(안내 따름)']
        ],
        blocks: [
            ['지금 할 일', '수분 섭취와 소변 횟수를 기록하세요.'],
            ['하지 않을 일', '카페 사진과 비교해 병명을 단정하지 마세요.'],
            ['관련', '탈수·발열·발진 진료 시점 안내를 참고하세요.']
        ],
        links: [
            ['질병관리청 수족구', 'https://www.kdca.go.kr/'],
            ['CDC Hand, Foot, and Mouth', 'https://www.cdc.gov/hand-foot-mouth/'],
            ['NHS 수족구', 'https://www.nhs.uk/conditions/hand-foot-mouth-disease/']
        ]
    },
    {
        id: 'hemangioma-when-check-boundary',
        match: /(혈관종|딸기\s*반점|hemangioma|빨간\s*점\s*커져|혈관\s*종양\s*아기|유아\s*혈관종)/,
        title: '자라는 빨간 반점·혈관종 의심은 사진으로 단정하지 말고 진료 시점을 상의하세요',
        lead: '영아 혈관종은 생후 초기에 커졌다가 줄어드는 경우가 있으나, 위치·크기·궤양·시야·호흡에 영향을 주면 평가가 필요합니다. 민간 냉동·연고로 없애려 하지 마세요. 진단·치료 여부는 의료진이 정합니다.',
        points: [
            ['관찰', '크기 변화, 궤양, 출혈, 눈·입·기저귀 부위'],
            ['상담', '빠르게 커짐, 여러 개, 기능 부위']
        ],
        blocks: [
            ['지금 할 일', '시작 시점과 크기 변화를 사진·날짜로 기록하세요.'],
            ['하지 않을 일', '가정에서 뽑거나 얼리거나 강한 약을 바르지 마세요.'],
            ['관련', '발진·모반 진료 경계 안내를 참고하세요.']
        ],
        links: [
            ['AAP 혈관종·모반 개요', 'https://www.healthychildren.org/English/health-issues/conditions/skin/Pages/default.aspx'],
            ['발진 진료 시점', '#home']
        ]
    },
    {
        id: 'molluscum-boundary',
        match: /(전염\s*연속종|물사마귀|molluscum|물\s*사마귀|전염성\s*연속종)/,
        title: '물사마귀(전염연속종) 의심은 사진으로 단정하지 말고, 번짐·자극 시 진료를 검토하세요',
        lead: '작고 반짝이는 돌기처럼 보이는 피부 병변이 전염연속종일 수 있으나, 사마귀·다른 발진과 구분은 의료진이 합니다. 억지로 짜거나 민간 산으로 태우지 마세요. 수영장·수건 공유 안내는 시설·의료진을 따릅니다. 약 용량·브랜드 추천은 하지 않습니다.',
        points: [
            ['관리', '긁지 않기, 수건 따로, 상처 나면 덮기'],
            ['진료', '눈 주위, 감염 징후, 면역 저하, 심한 번짐']
        ],
        blocks: [
            ['지금 할 일', '언제 생겼는지·번지는지 기록하세요.'],
            ['하지 않을 일', '바늘로 짜내거나 검증 안 된 제거 키트를 쓰지 마세요.'],
            ['관련', '사마귀·발진 진료 시점 안내를 참고하세요.']
        ],
        links: [
            ['CDC molluscum', 'https://www.cdc.gov/poxvirus/molluscum-contagiosum/'],
            ['AAP 피부 감염 개요', 'https://www.healthychildren.org/English/health-issues/conditions/skin/Pages/default.aspx']
        ]
    },
    {
        id: 'wart-boundary',
        match: /(사마귀\s*아이|보통\s*사마귀|wart\s*child|발\s*사마귀|바이러스\s*사마귀)/,
        title: '사마귀 의심은 사진으로 단정하지 말고, 통증·번짐·얼굴이면 진료를 검토하세요',
        lead: '사마귀는 바이러스성 돌기일 수 있으나 티눈·다른 발진과 구분은 의료진이 합니다. 억지로 깎거나 검증 안 된 산·민간 요법으로 태우지 마세요. 약 용량·브랜드 추천은 하지 않습니다.',
        points: [
            ['관리', '긁지 않기, 수건·발 도구 공유 줄이기'],
            ['진료', '통증, 출혈, 얼굴·생식기, 면역 저하']
        ],
        blocks: [
            ['지금 할 일', '생긴 위치와 변화를 기록하세요.'],
            ['하지 않을 일', '면도칼·바늘로 제거하지 마세요.'],
            ['관련', '물사마귀·발진 진료 시점 안내를 참고하세요.']
        ],
        links: [
            ['CDC 사마귀·HPV 개요', 'https://www.cdc.gov/hpv/'],
            ['AAP 피부 개요', 'https://www.healthychildren.org/English/health-issues/conditions/skin/Pages/default.aspx']
        ]
    },
    {
        id: 'diaper-free-time-boundary',
        match: /(기저귀\s*통풍|기저귀\s*없이|diaper\s*free|엉덩이\s*말리|기저귀\s*프리)/,
        title: '기저귀 발진 예방에 짧은 통풍이 도움이 될 수 있으나, 안전한 바닥에서만 하세요',
        lead: '더러운 바닥·찬 공기·공용 공간을 피하세요. 발진이 심하면 진료를 검토하세요. 브랜드 크림 순위는 하지 않습니다.',
        points: [
            ['방법', '짧게, 안전한 표면'],
            ['주의', '오염, 추위']
        ],
        blocks: [
            ['지금 할 일', '수건을 깔고 짧게 통풍하세요.'],
            ['하지 않을 일', '공공장소 바닥에 그냥 두지 마세요.'],
            ['관련', '기저귀 발진 안내를 참고하세요.']
        ],
        links: [
            ['기저귀 발진', '#home'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'blistering-rash-when-care-boundary',
        match: /(물집\s*발진|수포\s*발진\s*아이|blistering\s*rash\s*child|물집\s*잡힌\s*발진|수포성\s*피부)/,
        title: '물집이 잡힌 발진은 사진으로 단정하지 말고, 범위·발열·통증에 따라 진료를 검토하세요',
        lead: '수두·농가진 등 여러 가능성이 있습니다. 터뜨리지 마세요.',
        points: [
            ['관찰', '발열, 통증, 확산'],
            ['금지', '터뜨리기, 사진 진단']
        ],
        blocks: [
            ['지금 할 일', '발생 시점을 기록하세요.'],
            ['하지 않을 일', '민간 연고를 마구 바르지 마세요.'],
            ['관련', '발진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['발진 안내', '#home']
        ]
    },
    {
        id: 'skin-rash-triage',
        match: /(발진|수족구|두드러기|물집.*(손|발|입|혀)|손가락\s*사이|발가락\s*사이|(손|발).*(빨간|빨개|발진|물집)|(피부|몸).*(빨간\s*점|빨간\s*반|발진)|피부에\s*빨간)/,
        title: '발진은 사진·문장만으로 병명을 정하지 않습니다',
        lead: '손가락 사이·손·발의 빨간 발진도 여러 원인이 있어 사이트에서 한 병명으로 단정하지 않습니다. 열·입안 물집·호흡·수분 섭취·전신 상태를 함께 보고, 의심되면 의료기관에서 직접 확인하세요.',
        points: [
            ['함께 보면 진료가 급한 신호', '숨쉬기 힘듦, 입술·혀 부종, 깨워도 반응이 매우 약함, 고열과 처짐, 피부에 퍼지는 보라·점상 출혈 느낌의 반점'],
            ['손·발·입과 열이 함께 있을 때', '손·발·입안의 수포성 발진과 발열은 수족구병 등 가능성을 의료진이 판단합니다. 질병관리청은 의심 시 진료·손 씻기·등원 자제를 안내합니다.'],
            ['손가락 사이만 빨개 보일 때', '습한 피부 주름 자극(간찰진)·곰팡이·세균·아토피·접촉 피부염 등 여러 가능성이 있어 사진만으로 구별하지 않습니다. 진물·통증·열이면 진료를 미루지 마세요.']
        ],
        blocks: [
            ['지금 할 일', '발진 위치(손가락 사이·손바닥·발·입·기저귀 부위), 물집·진물·가려움, 열·식욕·소변·언제부터인지를 적고 진료 때 설명하세요. 주름은 부드럽게 닦고 말리세요.'],
            ['하지 않을 일', '인터넷 사진과 맞춰 병명을 단정하거나, 처방 없이 스테로이드·항생·항진균 연고를 임의로 바르거나, “곧 나을 것”이라며 수분 섭취 감소를 방치하지 마세요.'],
            ['진료·상담', '생후 3개월 미만 발열, 숨·의식 이상, 마시지 못함·소변 감소, 발진이 빠르게 퍼지거나 고름·심한 통증, 7~10일이 지나도 호전이 없으면 진료받으세요.']
        ],
        links: [
            ['발열·응급 행동 가이드', 'blog/baby-fever-cold-guide.html#urgent'],
            ['질병관리청 엔테로바이러스·발진 안내', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5843'],
            ['NHS 수족구병(손·발·입) 안내', 'https://www.nhs.uk/conditions/hand-foot-mouth-disease/'],
            ['AAFP 간찰진(피부 주름 염증) 개요', 'https://www.aafp.org/pubs/afp/issues/2014/0401/p569.html'],
            ['AAP 기저귀 발진·언제 의사에게', 'https://www.healthychildren.org/English/ages-stages/baby/diapers-clothing/Pages/Diaper-Rash.aspx']
        ]
    },
    {
        id: 'car-sickness-child-boundary',
        match: /(차\s*멀미\s*아이|자동차\s*멀미|car\s*sickness\s*child|차\s*토\s*멀미|카시트\s*멀미)/,
        title: '차멀미에는 전방 시야·환기·가벼운 식사를 돕고, 약 사용은 의료진과 상의하세요',
        lead: '화면을 보며 고개를 숙이면 악화될 수 있습니다. 용량 단정·브랜드 순위는 하지 않습니다.',
        points: [
            ['환경', '환기, 시야, 휴식'],
            ['피하기', '화면, 기름진 과식']
        ],
        blocks: [
            ['지금 할 일', '창밖을 보게 좌석을 조정해 보세요.'],
            ['하지 않을 일', '뒤돌아보며 태블릿만 보지 않게 하세요.'],
            ['관련', '멀미 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'boat-motion-sickness-child-boundary',
        match: /(배\s*멀미\s*아이|배\s*멀미\s*아이|배\s*토\s*아이|boat\s*motion\s*sickness\s*child)/,
        title: '배 멀미에는 수평선 보기·환기·가벼운 식사를 돕고, 약은 의료진과 상의하세요',
        lead: '용량 단정·브랜드 순위는 하지 않습니다.',
        points: [
            ['환경', '환기, 시야'],
            ['피하기', '화면, 과식']
        ],
        blocks: [
            ['지금 할 일', '중앙부 좌석을 검토하세요.'],
            ['하지 않을 일', '성인 멀미약을 주지 마세요.'],
            ['관련', '멀미·보트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'motion-sickness-boundary',
        match: /(멀미|차\s*멀미|배\s*멀미|어지러워\s*토|motion\s*sickness)/,
        title: '멀미는 환기·전방 보기·가벼운 식사로 줄여 보고, 약 용량은 의료진과 정합니다',
        lead: '차·배에서 창밖을 보거나 환기, 급출발을 줄이는 것이 도움이 될 수 있습니다. 어린이 멀미약 사용 여부와 용량은 나이·체중·제품에 따라 달라 사이트에서 정하지 않습니다. 심한 구토·두통·의식 변화가 있으면 진료하세요.',
        points: [
            ['비약물', '전방·수평선 보기, 환기, 읽기 줄이기, 급커브 주의'],
            ['약', '의료진·약사와 연령 확인, 임의 성인 약 금지']
        ],
        blocks: [
            ['지금 할 일', '어느 상황에서 심한지 기록하세요.'],
            ['하지 않을 일', '성인 멀미약을 나눠 주지 마세요.'],
            ['관련', '구토·탈수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 멀미', 'https://www.healthychildren.org/English/health-issues/conditions/head-neck-nervous-system/Pages/Motion-Sickness.aspx'],
            ['CDC 여행 건강 개요', 'https://wwwnc.cdc.gov/travel/']
        ]
    },
    {
        id: 'intussusception-boundary',
        match: /(장중첩|intussusception|간헐\s*복통\s*다리\s*당|주기\s*복통\s*구토\s*혈변|포도\s*젤리\s*변)/,
        title: '간헐적 심한 복통·구토·혈변이 겹치면 장 응급 가능성이 있어 즉시 진료하세요',
        lead: '장중첩증 등은 의료진이 진단합니다. 주기적으로 다리를 당기며 울고, 구토·혈변·처짐이 있으면 응급실을 우선하세요. 사진·증상만으로 병명을 단정하지 않으며, 민간으로 기다리게 두지 마세요.',
        points: [
            ['신호', '간헐 심한 통증, 구토, 혈변·점액변, 처짐'],
            ['행동', '금식 유지 여부는 의료진, 즉시 병원']
        ],
        blocks: [
            ['지금 할 일', '증상 시작 시각과 변 상태를 기록하세요.'],
            ['하지 않을 일', '진통제를 임의로 먹이며 시간을 끌지 마세요.'],
            ['관련', '힘주어 토함·혈변·탈수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 복통·응급 개요', 'https://www.healthychildren.org/English/health-issues/conditions/abdominal/Pages/default.aspx'],
            ['CDC 로타·장 건강 개요', 'https://www.cdc.gov/rotavirus/']
        ]
    },
    {
        id: 'pyloric-stenosis-boundary',
        match: /(유문\s*협착|pyloric\s*stenosis|분수토\s*신생아|생후\s*3\s*주\s*분수\s*토|계속\s*분수\s*토\s*체중)/,
        title: '신생아가 계속 힘주어 분수처럼 토하고 체중이 늘지 않으면 진료를 미루지 마세요',
        lead: '유문협착 등은 의료진이 진찰·영상으로 판단합니다. 생후 수 주경 분수토·공복 후에도 토함·탈수·체중 정체가 있으면 응급실·소아과를 우선하세요. 사이트에서 병명을 단정하지 않습니다.',
        points: [
            ['신호', '반복 분수토, 배고픔 후 또 토함, 탈수, 체중 정체'],
            ['행동', '수유량·체중 기록, 즉시 진료']
        ],
        blocks: [
            ['지금 할 일', '토하는 양·횟수·기저귀·체중을 기록하세요.'],
            ['하지 않을 일', '“토 습관”이라며 며칠을 그냥 두지 마세요.'],
            ['관련', '힘주어 토함·탈수·황달 안내를 참고하세요.']
        ],
        links: [
            ['AAP 구토·유문 개요', 'https://www.healthychildren.org/English/health-issues/conditions/abdominal/Pages/default.aspx'],
            ['탈수 안내', '#home']
        ]
    },
    {
        id: 'vomiting-return-daycare-boundary',
        match: /(토\s*후\s*어린이집)/,
        title: '구토 후 등원은 시설 규정과 마지막 구토 이후 상태·수분을 보고 결정하세요',
        lead: '전염성 장염 가능 기간이 질환마다 다릅니다.',
        points: [
            ['기준', '시설 규칙, 수분'],
            ['금지', '계속 토하는데 보내기']
        ],
        blocks: [
            ['지금 할 일', '시설 복귀 기준을 확인하세요.'],
            ['하지 않을 일', '탈수 신호를 무시하지 마세요.'],
            ['관련', '구토·등원 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['등원 안내', '#home']
        ]
    },
    {
        id: 'forceful-vomiting',
        match: /(분수\s*토|분수토|사출\s*토|사출성\s*구토|힘주어\s*토|계속\s*구토|구토만|토만\s*해요|분출성\s*구토)/,
        title: '힘주어 뿜는 구토·지속 구토는 트림과 구분하고 진료를 봅니다',
        lead: '수유 후 소량 게움과 달리, 분수처럼 힘주어 토하거나 매 수유마다 많은 양을 토하면 유문부 협착 등 평가가 필요할 수 있습니다. 피·초록 토물, 처짐, 소변 감소, 체중 정체가 있으면 미루지 마세요. 사이트에서 병명을 단정하지 않습니다.',
        points: [
            ['기록', '언제·얼마나·색·수유와의 관계·체중'],
            ['응급', '탈수, 호흡 이상, 혈성·담즙성 토물, 깨우기 어려움']
        ],
        blocks: [
            ['지금 할 일', '토한 양상과 기저귀를 적어 진료에 가져가세요.'],
            ['하지 않을 일', '성인 위약·민간 요법을 임의로 쓰지 마세요.'],
            ['관련', '일반 토함·탈수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 토함', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Why-Babies-Spit-Up.aspx'],
            ['발열·응급', 'blog/baby-fever-cold-guide.html#urgent']
        ]
    },
    {
        id: 'reflux-sleep-incline-boundary',
        match: /(역류\s*재우기\s*각도|역류\s*경사\s*쿠션|reflux\s*incline\s*sleep|토\s*해서\s*머리\s*높여\s*재우)/,
        title: '역류가 있어도 경사 수면 제품으로 재우는 것은 위험할 수 있어 등 평평한 수면을 우선하세요',
        lead: '증상 심하면 진료하세요. 제품 순위는 하지 않습니다.',
        points: [
            ['수면', '등, 평평, 빈 침대'],
            ['금지', '경사 쿠션·카시트 수면']
        ],
        blocks: [
            ['지금 할 일', '수면 공간 연한 물건을 치우세요.'],
            ['하지 않을 일', '카시트에 재우지 마세요.'],
            ['관련', '역류·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'spit-up-reflux',
        match: /(토함|토해|게워|역류|뿜|spit)/,
        title: '토함은 흔하지만 힘주어 뿜거나 성장이 안 되면 진료합니다',
        lead: '많은 아기가 수유 뒤 소량을 게웁니다. 잘 자라고 쾌활하면 흔히 역류·미성숙 식도로 설명됩니다. 분수처럼 힘주어 토하거나, 피·초록 토물, 체중 정체, 숨 곤란이 있으면 바로 의료진을 찾으세요.',
        points: [
            ['가정에서 할 일', '수유 후 트림을 돕고 바로 눕히기보다 잠깐 세워 안아 주며, 과도한 흔들기를 줄입니다.'],
            ['바로 진료', '매번 힘주어 뿜음, 피·초록 토물, 처짐, 소변 감소, 체중이 늘지 않음, 수유 때 심한 울음·등 휨']
        ],
        blocks: [
            ['지금 할 일', '언제·얼마나·어떤 색으로 토했는지, 젖은 기저귀와 최근 체중을 기록하세요.'],
            ['하지 않을 일', '처방 없이 성인 위약·농축 분유 임의 변경을 하지 마세요.'],
            ['진료·상담', '호흡이 거칠거나 파랗게 보이면 응급으로 평가받으세요.']
        ],
        links: [
            ['AAP 아기가 토하는 이유', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Why-Babies-Spit-Up.aspx'],
            ['MedlinePlus 영아 역류', 'https://medlineplus.gov/refluxininfants.html']
        ]
    },
    {
        id: 'honey-cough-over-one',
        match: /(돌\s*이후\s*꿀|1세\s*이후\s*꿀|꿀\s*기침|기침\s*꿀|꿀차\s*아이)/,
        title: '돌이 지난 뒤에는 기침에 꿀을 쓰는 논의가 있으나, 돌 전에는 절대 금지입니다',
        lead: '돌 전 꿀은 보툴리눔 위험으로 주지 않습니다. 돌이 지난 아이의 기침에 꿀이 도움될 수 있다는 연구가 있으나, 모든 기침·모든 아이에게 필수는 아닙니다. 용량·상표 추천은 하지 않으며, 호흡 곤란·고열·처짐이면 진료가 우선입니다.',
        points: [
            ['돌 전', '꿀 금지'],
            ['돌 후', '의료 상황 우선, 임의 다량 금지']
        ],
        blocks: [
            ['지금 할 일', '아이 개월 수를 확인하고 돌 전이면 꿀을 치우세요.'],
            ['하지 않을 일', '영아 분유·차에 꿀을 넣지 마세요.'],
            ['관련', '돌 전 꿀 금지·감기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 꿀·보툴리눔', 'https://www.cdc.gov/botulism'],
            ['AAP 기침·감기', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/Coughs-and-Colds-Medicines-or-Home-Remedies.aspx'],
            ['돌 전 꿀 안내', '#home']
        ]
    },
    {
        id: 'sushi-raw-fish-infant-boundary',
        match: /(회\s*아기|스시\s*아기|생선회\s*아이|raw\s*fish\s*baby|사시미\s*아기|날생선\s*이유식)/,
        title: '영·유아에게 생선회·날생선 스시는 식중독·기생충 위험이 있어 권하지 않습니다',
        lead: '날생선·일부 해산물은 세균·기생충 위험이 있어 어린 아이에게는 충분히 익힌 생선을 우선하는 안내가 많습니다. “한 점만”도 예외로 단정하지 마세요. 수은이 높은 생선은 별도 안내를 참고하세요. 식당 추천은 하지 않습니다.',
        points: [
            ['원칙', '익힌 생선 우선, 날것 피하기'],
            ['주의', '임신부·면역 저하 가족도 동일 주의']
        ],
        blocks: [
            ['지금 할 일', '외식 때 아이 메뉴가 익힌 것인지 확인하세요.'],
            ['하지 않을 일', '어른 회를 그대로 주지 마세요.'],
            ['관련', '수은·생선·식중독 안내를 참고하세요.']
        ],
        links: [
            ['FDA 수산물·임신부·어린이 안내(영)', 'https://www.fda.gov/food/consumers/advice-about-eating-fish'],
            ['AAP 식품 안전 개요', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/default.aspx']
        ]
    },
    {
        id: 'raw-egg-cookie-dough',
        match: /(날\s*계란|생계란|쿠키\s*반죽|날\s*반죽|raw\s*cookie|생쿠키|날\s*밀가루)/,
        title: '날계란·날 반죽·날 밀가루는 식중독 위험이 있어 아이에게 주지 마세요',
        lead: '익히지 않은 계란·밀가루 반죽은 살모넬라 등 위험이 있습니다. 베이킹 전 반죽을 맛보거나 생쿠키를 주지 마세요. 완전 가열한 뒤 주세요. 식중독 증상(고열·혈변·처짐)이면 진료합니다.',
        points: [
            ['금지', '날 반죽, 생계란 음료, 덜 익은 반숙을 영아에게 습관적으로'],
            ['안전', '충분히 익히기, 손·도마 위생']
        ],
        blocks: [
            ['지금 할 일', '아이와 베이킹할 때 반죽 맛보기를 그만두세요.'],
            ['하지 않을 일', '“조금은 괜찮다”며 생쿠키를 주지 마세요.'],
            ['관련', '손 씻기·설사 안내를 참고하세요.']
        ],
        links: [
            ['CDC 날계란·반죽', 'https://www.cdc.gov/foodsafety/communication/no-raw-dough.html'],
            ['CDC 살모넬라 개요', 'https://www.cdc.gov/salmonella/']
        ]
    },
    {
        id: 'honey-cookie-under-one-boundary',
        match: /(돌\s*전\s*벌꿀\s*과자|돌\s*전\s*꿀\s*과자|꿀\s*들어\s*과자\s*아기|honey\s*cookie\s*under\s*one)/,
        title: '돌 전 아기에게 꿀이 든 과자·음료를 주지 마세요',
        lead: '보툴리눔 위험 때문입니다. 성분표를 확인하세요.',
        points: [
            ['금지', '돌 전 꿀'],
            ['확인', '성분표']
        ],
        blocks: [
            ['지금 할 일', '간식 성분을 읽으세요.'],
            ['하지 않을 일', '돌 전 꿀을 넣지 마세요.'],
            ['관련', '꿀 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['중독 안내', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'honey-under-one',
        match: /(꿀).*(먹|주|바|넣)|한\s*살\s*(전|미만).*꿀|돌\s*전.*꿀|영아.*꿀|벌꿀/,
        title: '돌 전에는 꿀을 주지 않습니다',
        lead: '생후 12개월 미만 아기에게 꿀(벌꿀)을 먹이면 영아 보툴리눔 중독 위험이 있습니다. 이유식·차·한약·가공 식품에 들어 있는지도 확인하세요.',
        points: [
            ['금지', '돌 전 꿀·꿀이 든 식품·민간 보약에 꿀을 섞어 주지 않습니다.'],
            ['돌 이후', '돌이 지난 뒤에는 일반적으로 꿀을 소량 쓸 수 있으나, 알레르기·당분 과다에 주의합니다.']
        ],
        blocks: [
            ['지금 할 일', '돌 전 식단·간식 성분표를 확인하고 꿀이 있으면 중단하세요.'],
            ['하지 않을 일', '“소량이면 괜찮다”, “가열하면 안전하다”는 말로 돌 전 꿀을 주지 마세요.'],
            ['진료·상담', '꿀을 먹은 뒤 변비·수유 감소·울음 약화·호흡 이상이 있으면 바로 진료받으세요.']
        ],
        links: [
            ['CDC 영아 보툴리눔·꿀', 'https://www.cdc.gov/botulism/prevention/index.html'],
            ['이유식·알레르기 가이드', 'blog/complementary-feeding-allergy-guide.html']
        ]
    },
    {
        id: 'microwave-uneven-heat-boundary',
        match: /(이유식\s*전자레인지\s*반점|데운\s*이유식\s*저어|microwave\s*hot\s*spot|전자레인지\s*이유식\s*온도\s*확인)/,
        title: '전자레인지로 데운 음식은 잘 저어 온도를 확인하고, 뜨거운 반점을 조심하세요',
        lead: '불균일 가열로 입안 화상을 입을 수 있습니다. 손목 안쪽에 온도를 확인하세요.',
        points: [
            ['방법', '젓기, 온도 확인'],
            ['주의', '병·용기 과열']
        ],
        blocks: [
            ['지금 할 일', '데운 뒤 꼭 저어 온도를 보세요.'],
            ['하지 않을 일', '바로 입에 넣지 마세요.'],
            ['관련', '전자레인지·분유 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/']
        ]
    },
    {
        id: 'jarred-baby-food-heat-boundary',
        match: /(병조림\s*이유식\s*데우기|병조림\s*이유식\s*데우|시판\s*이유식\s*전자|jarred\s*baby\s*food\s*heat)/,
        title: '병조림 이유식은 표시대로 데우고 잘 저어 온도를 확인하세요',
        lead: '유리병 전자레인지 여부는 표시를 따릅니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['방법', '저어 온도 확인'],
            ['주의', '뜨거운 반점']
        ],
        blocks: [
            ['지금 할 일', '입 전에 온도를 보세요.'],
            ['하지 않을 일', '표시에 없는 방식으로 과열하지 마세요.'],
            ['관련', '전자레인지 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/']
        ]
    },
    {
        id: 'microwave-baby-food-boundary',
        match: /(전자\s*레인지.*이유식|이유식.*전자\s*레인지|전자렌지\s*데우|전자\s*레인지\s*음식\s*아기|microwave\s*baby\s*food)/,
        title: '이유식·유아식을 전자레인지로 데우면 부분이 과열될 수 있어 고루 저어 온도를 확인하세요',
        lead: '전자레인지는 음식이 고르게 데워지지 않을 수 있습니다. 데운 뒤 충분히 저어 손목 안쪽으로 온도를 확인하고, 뜨거우면 식혀 주세요. 분유·모유 병은 별도 안내(전자레인지 비권고)를 따릅니다. 특정 용기 브랜드 순위는 하지 않습니다.',
        points: [
            ['방법', '저어서 온도 확인, 가운데·가장자리 모두'],
            ['주의', '과열 스팟, 밀폐 뚜껑 폭발 위험']
        ],
        blocks: [
            ['지금 할 일', '데운 음식을 아이 입에 넣기 전 본인이 확인하세요.'],
            ['하지 않을 일', '뜨겁게 데운 채 바로 먹이지 마세요.'],
            ['관련', '분유 전자레인지·화상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 식품 안전·데우기 개요', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/default.aspx'],
            ['CDC 식품 안전', 'https://www.cdc.gov/foodsafety/'],
            ['분유 데우기 안내', '#home']
        ]
    },
    {
        id: 'formula-warmer-boundary',
        match: /(분유\s*워머|보틀\s*워머|병\s*워머|formula\s*warmer|bottle\s*warmer|분유\s*중탕)/,
        title: '분유·모유 워머는 설명서 온도와 위생을 지키고, 전자레인지 대신 고른 온도를 확인하세요',
        lead: '병 워머·중탕은 고른 데우기에 쓰이지만, 과열·세균 번식을 막으려면 제품 안내 시간과 세척이 중요합니다. 데운 뒤 손목으로 온도를 확인하고, 남은 분유를 다시 데워 쓰지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['사용', '설명서 시간·물 높이, 흔들어 온도 확인'],
            ['위생', '부품 세척·건조, 남긴 분유 재사용 금지']
        ],
        blocks: [
            ['지금 할 일', '워머 설명서의 권장 시간과 세척법을 확인하세요.'],
            ['하지 않을 일', '전자레인지로 병을 데우거나 뜨겁게 먹이지 마세요.'],
            ['관련', '분유 조유·전자레인지 안내를 참고하세요.']
        ],
        links: [
            ['CDC 분유 준비·보관', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html'],
            ['AAP 분유 수유', 'https://www.healthychildren.org/English/ages-stages/baby/formula-feeding/Pages/default.aspx']
        ]
    },
    {
        id: 'microwave-bottle-boundary',
        match: /(전자\s*레인지.*분유|전자\s*레인지.*모유|분유.*전자\s*레인지|병\s*데우.*전자|전자렌지\s*분유)/,
        title: '분유·모유를 전자레인지로 데우지 않는 것이 안전합니다',
        lead: '전자레인지는 부분이 과열되어 입안 화상을 일으킬 수 있고, 열이 고르지 않습니다. 중탕·온수 등으로 데우고, 먹이기 전 손목 안쪽에 온도를 확인하세요. 제품별 조유 표시를 따릅니다.',
        points: [
            ['방법', '중탕·온수, 잘 섞기, 온도 확인'],
            ['금지', '전자레인지 과열, 뜨거운 상태로 바로 수유']
        ],
        blocks: [
            ['지금 할 일', '데운 뒤 병 전체를 굴리거나 섞어 온도를 고르게 하세요.'],
            ['하지 않을 일', '전자레인지에 돌린 직후 아이 입에 넣지 마세요.'],
            ['관련', '분유 조유·모유 보관 안내를 참고하세요.']
        ],
        links: [
            ['CDC 분유 준비', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html'],
            ['CDC 모유 보관·데우기', 'https://www.cdc.gov/breastfeeding/php/guidelines-recommendations/handling-breastmilk.html']
        ]
    },
    {
        id: 'raw-fish-pregnancy-breastfeeding-boundary',
        match: /(임산부\s*회\s*수유|임산부\s*회|수유\s*중\s*회|raw\s*fish\s*pregnant|임신\s*초밥)/,
        title: '임신·수유 중 생선 섭취는 수은·생석 위험을 의료진 안내로 조절하세요',
        lead: '여기서 개별 메뉴를 단정하지 않습니다.',
        points: [
            ['상담', '의료진 식단'],
            ['주의', '고수은 생선, 비위생 생석']
        ],
        blocks: [
            ['지금 할 일', '산부인과 안내를 확인하세요.'],
            ['하지 않을 일', '상한 생선을 먹지 마세요.'],
            ['관련', '생선 수은 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/']
        ]
    },
    {
        id: 'deli-meat-listeria-boundary',
        match: /(햄\s*아기|소시지\s*아기|델리\s*미트|deli\s*meat|가공\s*육\s*아기|리스테리아\s*햄|비살균\s*치즈\s*아기)/,
        title: '가공육·델리 미트·일부 연성 치즈는 리스테리아 등 위험이 있어 영아·임신부는 주의하세요',
        lead: '가열하지 않은 델리 미트·일부 연성 치즈 등은 식중독균 위험이 논의됩니다. 영아·임신부에게는 충분히 가열하거나 피하라는 공식 안내가 있습니다. 브랜드 순위·“한 장만” 단정은 하지 않으며, 발열·심한 구토는 진료하세요.',
        points: [
            ['주의', '가열 없이 준 햄·소시지·연성 치즈'],
            ['실천', '충분히 데치기, 유통기한·냉장']
        ],
        blocks: [
            ['지금 할 일', '아이 간식이 가공육인지 확인하세요.'],
            ['하지 않을 일', '상온에 오래 둔 샌드위치 햄을 주지 마세요.'],
            ['관련', '식중독·비살균 유제품 안내를 참고하세요.']
        ],
        links: [
            ['CDC 리스테리아', 'https://www.cdc.gov/listeria/'],
            ['AAP 식품 안전 개요', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/default.aspx']
        ]
    },
    {
        id: 'lunchbox-food-safety-boundary',
        match: /(도시락\s*보관|도시락\s*상했|lunchbox\s*safety|아이스팩\s*도시락|도시락\s*식중독)/,
        title: '도시락은 아이스팩·보온을 맞추고, 상온에 오래 둔 음식은 버리지 말고 다시 주지 마세요',
        lead: '더운 날 상온 방치는 식중독 위험을 키웁니다. 브랜드 도시락 순위는 하지 않습니다.',
        points: [
            ['온도', '아이스팩, 보온병'],
            ['폐기', '오래 방치한 음식']
        ],
        blocks: [
            ['지금 할 일', '냉장 필요 음식에 아이스팩을 넣으세요.'],
            ['하지 않을 일', '더운 차 안에 도시락을 오래 두지 마세요.'],
            ['관련', '방치 음식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'delivery-food-room-temp-boundary',
        match: /(배달\s*음식\s*방치|배달\s*상온\s*오래|delivery\s*food\s*room\s*temp|시킨\s*음식\s*몇\s*시간)/,
        title: '배달 음식을 상온에 오래 둔 뒤 아이에게 다시 주지 말고, 냉장·폐기를 판단하세요',
        lead: '더운 날 위험도가 큽니다. 시간 단정 숫자만으로 모든 음식을 판단하지 말고 상함 신호를 보세요.',
        points: [
            ['원칙', '빠른 냉장'],
            ['폐기', '냄새·외관 이상']
        ],
        blocks: [
            ['지금 할 일', '도착 후 빨리 나눠 담아 냉장하세요.'],
            ['하지 않을 일', '밤새 상온에 둔 것을 주지 마세요.'],
            ['관련', '방치 음식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'baby-food-fridge-storage-boundary',
        match: /(이유식\s*냉장\s*보관|이유식\s*냉장\s*보관|만든\s*이유식\s*며칠|baby\s*food\s*fridge\s*storage)/,
        title: '만든 이유식은 위생적으로 냉장하고, 냄새·외관이 이상하면 버리세요',
        lead: '정확한 일수는 재료·안내를 따르세요. 여기서 하루 숫자를 단정하지 않습니다.',
        points: [
            ['보관', '냉장, 밀폐'],
            ['폐기', '이상 냄새']
        ],
        blocks: [
            ['지금 할 일', '손과 용기를 깨끗이 하세요.'],
            ['하지 않을 일', '상온에 오래 둔 것을 주지 마세요.'],
            ['관련', '방치 음식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'left-out-food-safety',
        match: /(이유식\s*실온|분유\s*방치|음식\s*오래\s*실온|2시간\s*방치|식중독\s*실온|남긴\s*분유)/,
        title: '분유·이유식은 오래 실온에 두지 말고, 남긴 것은 다시 먹이지 않는 편이 안전합니다',
        lead: '데우거나 조제한 분유·이유식은 시간이 지나면 세균이 증식할 수 있습니다. 제품·공식 안내의 보관 시간을 따르고, 아이가 먹다 남긴 것은 버리지 다시 먹이지 않는 것이 일반적입니다. “몇 시간까지 OK”를 사이트에서 단정하지 않고 공식 조유·보관 안내를 우선합니다.',
        points: [
            ['원칙', '만들고 곧 먹이기, 남기면 버리기, 재가열 반복 금지'],
            ['보관', '냉장·해동 안내는 모유·분유 각각 공식 자료']
        ],
        blocks: [
            ['지금 할 일', '조유·이유식 후 시계를 보고 보관 여부를 정하세요.'],
            ['하지 않을 일', '실온에 반나절 둔 우유를 다시 데워 주지 마세요.'],
            ['관련', '분유 조유·모유 보관 안내를 참고하세요.']
        ],
        links: [
            ['CDC 분유 준비·보관', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html'],
            ['CDC 모유 보관', 'https://www.cdc.gov/breastfeeding/php/guidelines-recommendations/handling-breastmilk.html']
        ]
    },
    {
        id: 'cereal-in-bottle-boundary',
        match: /(젖병|분유|보틀).{0,12}(미음|시리얼|쌀가루|곡물)|미음.{0,12}(젖병|분유)|시리얼.{0,12}(분유|젖병)|cereal\s*in\s*bottle|분유에\s*미음/,
        title: '의료진 지시 없이 젖병·분유에 미음·시리얼을 섞지 마세요',
        lead: '통잠·역류를 위해 분유에 곡물을 넣는 방법은 권고되지 않는 경우가 많습니다. 질식·과잉 칼로리·농도 변화 위험이 있고, 필요 시 의료진이 따로 안내합니다. 제품 표시 비율을 지키는 조유가 기본입니다.',
        points: [
            ['기본', '분유는 표시 비율, 이유식은 숟가락·안전한 형태'],
            ['예외', '의료진이 농축·특수 조유를 지시한 경우만']
        ],
        blocks: [
            ['지금 할 일', '젖병에 곡물을 넣고 있다면 중단 여부를 의료진과 상의하세요.'],
            ['하지 않을 일', '통잠을 위해 임의로 진하게 타거나 미음을 섞지 마세요.'],
            ['관련', '분유 조유·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 분유·수유 일반', 'https://www.healthychildren.org/English/ages-stages/baby/formula-feeding/Pages/default.aspx'],
            ['CDC 분유 준비', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'formula-overdilute-boundary',
        match: /(분유).{0,16}(묽게|물\s*많|과희석|너무\s*묽|물만\s*많)|과다\s*수분|물\s*중독\s*아기|formula\s*dilut|분유\s*물을?\s*많이/,
        title: '분유를 임의로 묽게 타면 위험할 수 있습니다. 표시 비율을 지키세요',
        lead: '“더 먹이려고” 물을 많이 넣어 묽게 타면 전해질 불균형·물 중독 위험이 생길 수 있습니다. 진하게 타기도 신장·탈수 부담이 됩니다. 제품 스쿱·물 비율을 그대로 지키고, 특수 조유는 의료진 지시만 따릅니다.',
        points: [
            ['원칙', '설명서 물·분말 비율, 스쿱 기준 유지'],
            ['위험', '임의 희석·농축, 성인 눈대중']
        ],
        blocks: [
            ['지금 할 일', '사용 중인 제품 조유표를 다시 확인하세요.'],
            ['하지 않을 일', '배고프다고 물을 더 넣어 묽게 타지 마세요.'],
            ['관련', '분유 조유·수유량 안내를 참고하세요.']
        ],
        links: [
            ['CDC 분유 준비(비율 유지)', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html'],
            ['AAP 분유 수유', 'https://www.healthychildren.org/English/ages-stages/baby/formula-feeding/Pages/default.aspx'],
            ['분유 조유 안내', '#home']
        ]
    },
    {
        id: 'well-water-nitrate-formula',
        match: /(우물물\s*분유|지하수\s*분유|질산염\s*분유|well\s*water\s*formula|우물\s*물\s*아기|지하수\s*조유)/,
        title: '우물·지하수로 분유를 탈 때는 질산염 등 수질 검사를 확인하세요',
        lead: '일부 우물물은 질산염 등이 높아 영아 분유 조유에 부적합할 수 있습니다. 상수도가 아니면 공인 검사·보건 안내를 확인하세요. 끓인다고 질산염이 모두 없어지지 않을 수 있습니다. 수질·제품 추천은 하지 않습니다.',
        points: [
            ['확인', '수질 검사, 영아 조유 적합 여부'],
            ['대안', '안전한 상수도·안내용 물(의료·보건 안내)']
        ],
        blocks: [
            ['지금 할 일', '조유에 쓰는 물 출처를 확인하세요.'],
            ['하지 않을 일', '검사 안 된 우물물을 임의로 쓰지 마세요.'],
            ['관련', '분유 조유·과희석 안내를 참고하세요.']
        ],
        links: [
            ['CDC 분유·물 안전', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/'],
            ['EPA 질산염·음용수(영)', 'https://www.epa.gov/ground-water-and-drinking-water']
        ]
    },
    {
        id: 'travel-formula-prep-boundary',
        match: /(분유\s*여행\s*조유)/,
        title: '외출·여행 분유는 위생·온도·제품 표시를 지키고, 임의로 묽게 타지 마세요',
        lead: '물·조유 방법은 제품·의료진 안내를 따릅니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['준비', '세척, 표시 비율'],
            ['금지', '과희석']
        ],
        blocks: [
            ['지금 할 일', '조유 전 손과 용기를 확인하세요.'],
            ['하지 않을 일', '표시보다 묽게 타지 마세요.'],
            ['관련', '분유 조유 안내를 참고하세요.']
        ],
        links: [
            ['분유 가이드', 'blog/breastfeeding-formula-guide.html'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'formula-prep',
        match: /(분유).*(타|조유|끓|물\s*온도|소독|농도|진하게|묽)|조유|분유\s*물|분유\s*타/,
        title: '분유는 제품 표시 비율과 위생을 그대로 지킵니다',
        lead: '분유를 더 진하거나 묽게 타지 말고, 깨끗이 손 씻기·기구 세척, 안전한 물과 표시된 물·분말 비율을 따릅니다. “더 배부르게” 농도를 바꾸면 신장·탈수 위험이 있습니다.',
        points: [
            ['조유', '제품 스쿱과 물의 표시 비율을 지키고, 만든 뒤 식혀 체온 근처에서 먹입니다.'],
            ['보관', '남겨 둔 분유를 다음 수유에 다시 쓰지 않는 것이 안전합니다. 제품·지역 안내를 확인하세요.']
        ],
        blocks: [
            ['지금 할 일', '사용 중인 제품 설명서의 물·분말 표와 소독 방법을 다시 확인하세요.'],
            ['하지 않을 일', '임의로 농도를 바꾸거나, 생우유·식물성 음료로 영아용 조제유를 대체하지 마세요.'],
            ['진료·상담', '조유 후 반복 구토·설사·발진·호흡 이상이 있으면 진료받으세요.']
        ],
        links: [
            ['CDC 분유 조제·보관', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html'],
            ['CDC 분유량·간격', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/how-much-and-how-often.html']
        ]
    },
    {
        id: 'jaundice-followup-boundary',
        match: /(황달\s*재진|황달\s*다시\s*검사|jaundice\s*follow\s*up|신생아\s*황달\s*추적|황달\s*수치\s*다시)/,
        title: '신생아 황달은 추적 검사·수유·처짐을 의료진 계획대로 확인하고, 사진만으로 판단하지 마세요',
        lead: '황달은 시기·수치가 중요합니다. 가정 수치 앱만 믿지 말고 진료 연계를 우선하세요.',
        points: [
            ['관찰', '수유, 소변, 처짐'],
            ['진료', '계획된 재검, 악화']
        ],
        blocks: [
            ['지금 할 일', '퇴원 안내의 재방문 일자를 지키세요.'],
            ['하지 않을 일', '사진 비교로 괜찮다고 단정하지 마세요.'],
            ['관련', '황달 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['황달 안내', '#home']
        ]
    },
    {
        id: 'breastfeeding-jaundice-boundary',
        match: /(모유\s*황달|모유\s*황달\s*걱정|breastfeeding\s*jaundice|황달\s*수유\s*부족)/,
        title: '황달이 있으면 수유량·체중·검사를 의료진 계획으로 확인하고, 임의로 수유를 끊지 마세요',
        lead: '원인 구분은 진료가 필요합니다. 사진으로 수치를 짐작하지 마세요.',
        points: [
            ['관찰', '수유, 소변, 체중'],
            ['상담', '재검 일정']
        ],
        blocks: [
            ['지금 할 일', '퇴원 안내의 재방문을 지키세요.'],
            ['하지 않을 일', '황달 있다고 모유를 바로 끊지 마세요.'],
            ['관련', '황달·수유 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['수유 가이드', 'blog/breastfeeding-guide.html']
        ]
    },
    {
        id: 'jaundice-sunbath-myth-boundary',
        match: /(황달\s*햇빛\s*쬐기|황달\s*햇빛\s*쬐|황달\s*일광욕|jaundice\s*sunbath\s*myth)/,
        title: '신생아 황달을 임의 일광욕으로 치료하려 하지 말고 의료진 계획을 따르세요',
        lead: '과열·화상 위험이 있습니다. 사진으로 수치를 짐작하지 마세요.',
        points: [
            ['원칙', '진료·검사'],
            ['금지', '임의 직사광선 치료']
        ],
        blocks: [
            ['지금 할 일', '재검 일정을 지키세요.'],
            ['하지 않을 일', '한낮 직사광선에 오래 두지 마세요.'],
            ['관련', '황달 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['황달 안내', '#home']
        ]
    },
    {
        id: 'jaundice-signs',
        match: /(황달|노랗|피부가\s*노란|눈\s*흰자.*노란|빌리루빈)/,
        title: '황달은 노란 정도·수유·처짐을 함께 보고 진료합니다',
        lead: '신생아 황달은 흔할 수 있으나, 사이트에서 수치나 “며칠이면 괜찮다”를 단정하지 않습니다. 피부가 노랗고 수유가 어렵거나 처지면 기다리지 말고 의료진 평가를 받으세요.',
        points: [
            ['관찰', '얼굴·몸통·눈 흰자의 노란 정도, 24시간 수유·소변·대변 색을 기록합니다.'],
            ['바로 진료', '생후 첫날부터 심한 황달, 수유 거부, 처짐, 고음 울음, 발열']
        ],
        blocks: [
            ['지금 할 일', '출생 일수와 황달이 퍼진 범위, 수유 횟수를 적어 진료에 가져가세요.'],
            ['하지 않을 일', '햇빛만 쬐며 임의로 모유를 오래 끊거나, 카페 수치로 위험도를 판단하지 마세요.'],
            ['진료·상담', '담당 의료진의 검사·추적 계획을 따릅니다.']
        ],
        links: [
            ['질병관리청 신생아 황달', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5723'],
            ['수유량·간격 안내', '#home']
        ]
    },
    {
        id: 'parent-burnout-help-boundary',
        match: /(육아\s*번아웃|육아\s*지침|parent\s*burnout|육아\s*한계|양육\s*소진)/,
        title: '육아 소진이 심하면 아이 정보보다 도움을 먼저 연결하고, 혼자 견디지 마세요',
        lead: '수면 부족·우울·불안은  지원이 필요합니다. 위기면 지역 정신건강·응급 자원을 이용하세요.',
        points: [
            ['즉시', '도움 요청, 휴식 교대'],
            ['위험', '자해·아이 위험 생각']
        ],
        blocks: [
            ['지금 할 일', '믿을 사람에게 교대를 요청하세요.'],
            ['하지 않을 일', '약해 보일까 봐 숨기지 마세요.'],
            ['관련', '부모 정신건강 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['부모 마음 안내', '#home']
        ]
    },
    {
        id: 'postpartum-sleep-deprivation-boundary',
        match: /(산후\s*수면\s*부족|산모\s*잠\s*부족|postpartum\s*sleep\s*depriv|육아\s*수면\s*박탈|새엄마\s*불면증)/,
        title: '산후 수면 부족이 심하면 교대·도움을 요청하고, 우울·불안이 크면 상담 자원을 연결하세요',
        lead: '아이 정보보다 보호자 안전이 우선일 수 있습니다. 위기면 응급·정신건강 경로를 이용하세요.',
        points: [
            ['즉시', '교대, 도움 요청'],
            ['위험', '자해·아이 위험 생각']
        ],
        blocks: [
            ['지금 할 일', '믿을 사람에게 교대를 요청하세요.'],
            ['하지 않을 일', '혼자 견디려 하지 마세요.'],
            ['관련', '부모 정신건강 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['부모 마음', '#home']
        ]
    },
    {
        id: 'postpartum-partner-support-boundary',
        match: /(산후우울\s*배우자|산후우울\s*배우자|남편\s*산후우울\s*도움|postpartum\s*partner\s*support)/,
        title: '산후우울이 의심되면 배우자·가족이 교대·진료 동행 등 실질 도움을 주고 혼잣말로 끝내지 마세요',
        lead: '위기면 응급·정신건강 자원을 이용하세요.',
        points: [
            ['도움', '교대, 진료 연결'],
            ['위험', '자해·아이 위험 생각']
        ],
        blocks: [
            ['지금 할 일', '혼자 두지 말고 도움을 요청하세요.'],
            ['하지 않을 일', '의지를 탓하지 마세요.'],
            ['관련', '부모 정신건강 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['부모 마음', '#home']
        ]
    },
    {
        id: 'parent-anger-pause-boundary',
        match: /(육아\s*분노\s*폭발|육아\s*분노\s*폭발|화나서\s*아이\s*소리|parent\s*anger\s*pause)/,
        title: '화가 극에 달하면 아이를 안전한 곳에 두고 잠시 멈추고, 반복되면 도움을 요청하세요',
        lead: '아이를 다치게 할 것 같으면 즉시 도움을 청하세요.',
        points: [
            ['즉시', '멈추기, 안전'],
            ['도움', '상담, 교대']
        ],
        blocks: [
            ['지금 할 일', '심호흡·자리를 잠시 뜨세요.'],
            ['하지 않을 일', '아이를 밀치거나 때리지 마세요.'],
            ['관련', '부모 마음 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['부모 마음', '#home']
        ]
    },
    {
        id: 'parent-mental-health',
        match: /(산후\s*우울|산후우울|부모\s*마음|육아\s*우울|육아\s*스트레스|번아웃|울고\s*싶)|(엄마|아빠|산모).*(우울|불안|무기력|죄책감|지쳐|힘들어)|우울\s*(증|감).*(산후|육아|엄마)/,
        title: '부모 마음이 무너지면 아이 정보보다 도움을 먼저 연결합니다',
        lead: '출산 뒤 일시적 우울감과 치료가 필요한 상태는 다를 수 있습니다. 진단 척도를 사이트에서 매기지 않습니다. 돌봄·식사·수면이 어렵거나 자해·아기에 대한 위험한 생각이 있으면 2주를 기다리지 말고 도움 전화·의료진을 이용하세요.',
        points: [
            ['오늘 연결', '자살예방 상담 109, 여성긴급전화 1366, 지역 정신건강복지센터·산부인과·정신건강의학과'],
            ['아이와 함께', '아기를 안전한 곳에 두고 보호자 본인이 쉴 사람을 부르세요.']
        ],
        blocks: [
            ['지금 할 일', '혼자 참지 말고 가족·친구·전문 기관 중 하나에 지금 연락하세요.'],
            ['하지 않을 일', '“모성애 부족”으로 자책하거나, 커뮤니티 비교로 치료를 미루지 마세요.'],
            ['응급', '당장 자신을 해치거나 아기를 해칠 것 같으면 119 또는 가까운 응급실을 이용하세요.']
        ],
        links: [
            ['베베가이드 부모 마음건강', '#parent-health'],
            ['질병관리청 우울감 안내', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6788'],
            ['보건복지부 109 안내', 'https://www.mohw.go.kr/board.es?act=view&bid=0027&list_no=1479607&mid=a10503010300']
        ]
    },
    {
        id: 'soft-stool-vs-diarrhea',
        match: /(무른\s*변|묽은\s*변|물기\s*많은\s*변).*(괜찮|정상|이유식|모유|걱정|자주)|이유식.*무른\s*변|모유.*무른\s*변|변\s*무른데\s*괜찮/,
        title: '무른 변은 식단·시기에 흔할 수 있고, 탈수·피가 있으면 설사로 봅니다',
        lead: '모유 변은 무르고 노랗거나 초록일 수 있으며, 이유식 시작 후에도 물기가 많을 수 있습니다. “무르다”만으로 병이라고 단정하지 않습니다. 횟수가 급증하고 수분 섭취·소변이 줄며 처지면 설사·탈수 쪽으로 진료합니다. 흰·혈·검은 변은 바로 진료입니다.',
        points: [
            ['관찰', '평소와 비교한 횟수·냄새·피, 수유·수분, 활력·소변'],
            ['진료', '탈수 징후, 혈변, 고열·심한 복통, 생후 초기 이상 변']
        ],
        blocks: [
            ['지금 할 일', '변 양상과 기저귀·먹은 양을 며칠 기록하세요.'],
            ['하지 않을 일', '인터넷 사진으로 병명을 맞추거나 성인 지사제를 쓰지 마세요.'],
            ['관련', '변 색깔·설사·탈수 안내를 함께 보세요.']
        ],
        links: [
            ['설사·수분 안내', '#home'],
            ['변 색깔 안내', '#home'],
            ['발열·응급', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'rotavirus-boundary',
        match: /(로타\s*바이러스|로타바이러스|rotavirus|로타\s*접종|로타\s*설사)/,
        title: '로타바이러스 설사 의심은 탈수를 보고, 접종 기록은 공식 일정으로 확인하세요',
        lead: '영아 심한 물 설사·구토의 원인 중 하나가 로타바이러스일 수 있으나 사이트에서 균을 단정하지 않습니다. 수분·소변·처짐을 보고, 경구 백신 일정은 예방접종도우미·의료진 안내를 따릅니다. 지사제·항생제 임의 사용은 피하세요.',
        points: [
            ['돌봄', '소량씩 수분, 손 씻기, 기저귀 위생'],
            ['진료', '탈수 신호, 혈변, 고열·처짐, 어린 영아']
        ],
        blocks: [
            ['지금 할 일', '접종 기록과 설사·구토 횟수를 확인하세요.'],
            ['하지 않을 일', '성인 지사제를 주지 마세요.'],
            ['관련', '설사·노로·접종 안내를 참고하세요.']
        ],
        links: [
            ['CDC 로타바이러스', 'https://www.cdc.gov/rotavirus/'],
            ['질병관리청 예방접종', 'https://nip.kdca.go.kr/'],
            ['설사 안내', '#home']
        ]
    },
    {
        id: 'norovirus-gastro-boundary',
        match: /(노로|norovirus|장염|바이러스성\s*장염|식중독\s*설사|토\s*설사\s*유행)/,
        title: '장염·노로 의심은 수분·처짐을 보고, 사진·댓글로 균 이름을 정하지 않습니다',
        lead: '구토·설사가 갑자기 퍼지면 노로바이러스 등 장염 가능성이 있으나, 사이트에서 원인균을 단정하지 않습니다. 탈수 신호(소변 감소·처짐·입 마름)를 보고, 토하게 강제하거나 지사제를 임의로 쓰지 마세요. 손 씻기·표면 청소가 전파 줄이기에 도움이 됩니다. 약 용량은 의료진이 정합니다.',
        points: [
            ['돌봄', '소량씩 수분, 손 씻기, 오염 옷·표면 청소'],
            ['진료', '탈수 신호, 혈변, 고열·처짐, 생후 어린 영아']
        ],
        blocks: [
            ['지금 할 일', '소변·구토 횟수·마신 양을 기록하세요.'],
            ['하지 않을 일', '성인 지사제·항생제를 임의로 주지 마세요.'],
            ['관련', '설사·탈수·손 씻기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 노로바이러스', 'https://www.cdc.gov/norovirus/'],
            ['질병관리청 감염병 정보', 'https://www.kdca.go.kr/'],
            ['설사·탈수 안내', '#home']
        ]
    },
    {
        id: 'diarrhea-diet-restart-boundary',
        match: /(설사\s*후\s*음식|설사\s*뭐\s*먹|diarrhea\s*diet\s*restart|장염\s*후\s*식사|설사\s*금식)/,
        title: '설사 뒤에는 의료진 안내에 따라 수분을 우선하고, 과도한 금식·민간 단식을 피하세요',
        lead: '탈수 신호를 보세요. ORS·식단은 상황에 따라 다릅니다.',
        points: [
            ['우선', '수분, 탈수 관찰'],
            ['피하기', '장시간 금식 강요']
        ],
        blocks: [
            ['지금 할 일', '소변·처짐을 확인하세요.'],
            ['하지 않을 일', '설사가 심한데 음식만 강요하지 마세요.'],
            ['관련', '설사·탈수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['탈수 안내', '#home']
        ]
    },
    {
        id: 'vomit-diarrhea-both-boundary',
        match: /(구토\s*설사\s*동시)/,
        title: '구토와 설사가 같이 있으면 탈수 신호를 보고 수분을 소량씩, 심하면 진료하세요',
        lead: 'ORS 사용은 안내·의료진을 따르세요. 용량 단정은 하지 않습니다.',
        points: [
            ['관찰', '소변, 처짐, 입마름'],
            ['진료', '혈변, 고열, 무뇨']
        ],
        blocks: [
            ['지금 할 일', '소량씩 자주 수분을 주세요.'],
            ['하지 않을 일', '억지로 많이 먹이지 마세요.'],
            ['관련', '탈수·설사 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['탈수 안내', '#home']
        ]
    },
    {
        id: 'diarrhea-dehydration',
        match: /(설사|묽은\s*변|물똥|토하고\s*설사)/,
        title: '설사는 횟수보다 수분·소변·처짐을 함께 봅니다',
        lead: '묽은 변이 나와도 잘 마시고 소변이 나오면 가정에서 경과를 볼 수 있습니다. 마시지 못하고 소변이 줄며 처지면 탈수 위험이 있어 진료가 필요합니다. 약 용량은 사이트에서 정하지 않습니다.',
        points: [
            ['가정 관찰', '평소 먹는 모유·분유·수분, 젖은 기저귀 횟수, 열·구토 동반 여부'],
            ['진료 신호', '피 섞인 변, 담즙성 구토, 심한 복통, 소변 거의 없음, 깨우기 어려움, 생후 3개월 미만 고열']
        ],
        blocks: [
            ['지금 할 일', '먹은 양·소변·변 횟수를 적고, 억지로 고형식만 강요하지 마세요.'],
            ['하지 않을 일', '성인 지사제·항생제를 임의로 먹이지 마세요.'],
            ['진료·상담', '탈수 징후가 보이면 진료·응급 평가를 미루지 마세요.']
        ],
        links: [
            ['발열·응급 가이드', 'blog/baby-fever-cold-guide.html#urgent'],
            ['질병관리청 변비와 구분 참고', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5827']
        ]
    },
    {
        id: 'tonsillitis-strep-when-care-boundary',
        match: /(편도염\s*아이\s*목|편도염\s*아이|목\s*아플\s*열\s*아이|tonsillitis\s*child\s*fever)/,
        title: '목 통증과 열이 있으면 호흡·수분·처짐을 보고 진료를 검토하세요',
        lead: '세균·바이러스 구분은 진료가 필요합니다. 약 용량은 단정하지 않습니다.',
        points: [
            ['관찰', '열, 침 흘림, 호흡'],
            ['진료', '심한 통증, 처짐']
        ],
        blocks: [
            ['지금 할 일', '수분을 소량씩 주세요.'],
            ['하지 않을 일', '성인 목약을 주지 마세요.'],
            ['관련', '인후·편도 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'strep-throat-boundary',
        match: /(연쇄구균|스트렙|strep\s*throat|편도\s*세균|목\s*아픔\s*세균|인후염\s*세균|신속\s*항원\s*목)/,
        title: '목 아픔이 스트렙(연쇄구균)인지 여부는 검사·진료로 확인하고, 남은 항생제를 쓰지 마세요',
        lead: '바이러스 인후통과 연쇄구균 인두는 증상만으로 구분이 어렵습니다. 고열·목 통증·삼킴 어려움·발진 등이 있으면 진료·검사가 필요할 수 있습니다. 항생제 필요 여부와 용량은 의료진이 정합니다. 사진 진단은 하지 않습니다.',
        points: [
            ['관찰', '열, 침 흘림, 호흡, 수분 섭취, 발진'],
            ['경계', '가족 남은 항생제 나눠 먹기 금지']
        ],
        blocks: [
            ['지금 할 일', '증상 시작 시점과 수분·소변을 기록하세요.'],
            ['하지 않을 일', '목 사진을 올려 병명을 단정하지 마세요.'],
            ['관련', '감기·항생제·발열 안내를 참고하세요.']
        ],
        links: [
            ['CDC 연쇄구균 인두염', 'https://www.cdc.gov/group-a-strep/about/strep-throat.html'],
            ['AAP 목 아픔 개요', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/default.aspx']
        ]
    },
    {
        id: 'antibiotic-for-cold-request-boundary',
        match: /(감기\s*항생제\s*요구|감기\s*항생제\s*요구|바이러스\s*항생제|antibiotic\s*for\s*cold)/,
        title: '바이러스 감기에는 항생제가 필요하지 않은 경우가 많아 의료진 판단을 따르세요',
        lead: '세균 감염이 의심될 때만 처방됩니다. 임의 보관을 하지 마세요.',
        points: [
            ['원칙', '진료 판단'],
            ['금지', '남은 항생제 재복용']
        ],
        blocks: [
            ['지금 할 일', '증상을 정확히 말하세요.'],
            ['하지 않을 일', '집에 남은 항생제를 주지 마세요.'],
            ['관련', '항생제 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/antibiotic-use/']
        ]
    },
    {
        id: 'antibiotic-virus-boundary',
        match: /(항생제\s*감기|감기\s*항생|바이러스\s*항생|항생제\s*먹여|꼭\s*항생제)/,
        title: '감기·많은 바이러스 감염에 항생제가 항상 필요하지는 않습니다',
        lead: '항생제는 세균에 쓰는 약이고, 감기·많은 상기도 바이러스에는 도움이 되지 않는 경우가 많습니다. 불필요한 사용은 부작용·내성 위험이 있습니다. 필요 여부는 의료진이 진찰 후 정하며, 사이트에서 처방·용량을 정하지 않습니다.',
        points: [
            ['구분', '바이러스 vs 세균은 진찰·검사가 필요할 수 있음'],
            ['주의', '남은 항생제 임의 복용 금지']
        ],
        blocks: [
            ['지금 할 일', '증상·기간·호흡·수분을 기록해 진료에 가져가세요.'],
            ['하지 않을 일', '집에 남은 항생제를 임의로 먹이지 마세요.'],
            ['관련', '감기·발열·중이염 안내를 참고하세요.']
        ],
        links: [
            ['CDC 항생제·감기', 'https://www.cdc.gov/antibiotic-use/colds.html'],
            ['CDC 항생제 내성 개요', 'https://www.cdc.gov/antibiotic-use/'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'neti-pot-infant-boundary',
        match: /(네티\s*팟|neti\s*pot|코\s*세척\s*주전자|비강\s*세척\s*아기|식염수\s*주전자\s*영아)/,
        title: '영아에게 성인용 네티팟·코 주전자 세척을 임의로 하지 마세요',
        lead: '비강 세척 기구는 연령·방법·물 위생이 중요합니다. 영아에게 성인용 네티팟을 그대로 쓰는 것은 권하지 않으며, 수돗물을 끓이지 않고 쓰면 감염 위험이 있습니다. 방법·기구는 의료진 안내를 따르세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['경계', '성인 기구 그대로, 불안전한 물, 강한 압력'],
            ['대안', '의료진이 안내한 식염수·흡인 방법']
        ],
        blocks: [
            ['지금 할 일', '코 막힘에 쓰는 기구의 월령 표시를 확인하세요.'],
            ['하지 않을 일', '센 물줄기로 영아 코를 밀어 넣지 마세요.'],
            ['관련', '식염수·콧물 흡인·감기 안내를 참고하세요.']
        ],
        links: [
            ['FDA 네티팟·비강 세척 안전(영)', 'https://www.fda.gov/consumers/consumer-updates/rinsing-your-sinuses-neti-pots-safe'],
            ['AAP 코막힘 개요', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/default.aspx']
        ]
    },
    {
        id: 'saline-nose-suction-boundary',
        match: /(콧물\s*흡인|코\s*석션|식염수\s*코|코\s*세척\s*아기|코딱지\s*빼|노즈\s*클리너|saline\s*nose|bulb\s*syringe)/,
        title: '식염수·흡인은 과하게 하지 말고, 호흡이 힘들면 진료를 우선하세요',
        lead: '코막힘으로 수유가 어려울 때 생리식염수 몇 방울과 부드러운 흡인이 도움이 될 수 있다는 안내가 있습니다. 깊이·세게 반복하면 코 점막을 자극할 수 있습니다. 특정 석션 기기 브랜드 순위·사용 횟수 단정은 하지 않으며, 호흡 곤란·처짐·수유 불가는 진료가 먼저입니다.',
        points: [
            ['방법', '손 씻기, 소량 식염수, 부드럽게, 과도 반복 금지'],
            ['진료', '빠른 호흡, 입술 파람, 수유 거부, 고열·어린 영아']
        ],
        blocks: [
            ['지금 할 일', '수유 전 코 상태를 보고 필요 시에만 가볍게 하세요.'],
            ['하지 않을 일', '면봉을 코 깊숙이 넣지 마세요.'],
            ['관련', '감기·RSV 안내를 참고하세요.']
        ],
        links: [
            ['AAP 코·귀·목 일반', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/default.aspx'],
            ['CDC RSV 영아', 'https://www.cdc.gov/rsv/infants-young-children/index.html'],
            ['감기 안내', '#home']
        ]
    },
    {
        id: 'covid-when-to-care-boundary',
        match: /(코로나\s*아이|covid\s*child|covid-19\s*아기|신종\s*코로나\s*열|코로나\s*언제\s*병원)/,
        title: '코로나19 의심 증상은 호흡·수분·연령을 보고, 검사·격리는 보건·의료 안내를 따르세요',
        lead: '발열·기침·호흡 곤란 등은 여러 호흡기 감염과 겹칩니다. 병명을 사진·검색으로 단정하지 말고, 호흡 이상·처짐·탈수·어린 영아는 진료를 우선하세요. 약 용량·치료제 처방은 의료진이 정합니다. 최신 방역 수칙은 공식 기관을 확인하세요.',
        points: [
            ['응급', '호흡 곤란, 청색증, 처짐, 의식 변화'],
            ['일상', '손 씻기, 아플 때 등원 자제, 검사 안내 따르기']
        ],
        blocks: [
            ['지금 할 일', '증상 시작과 호흡·수분 상태를 기록하세요.'],
            ['하지 않을 일', '성인 약을 임의 용량으로 주지 마세요.'],
            ['관련', '발열·RSV·등원 안내를 참고하세요.']
        ],
        links: [
            ['CDC COVID-19', 'https://www.cdc.gov/covid/'],
            ['질병관리청', 'https://www.kdca.go.kr/'],
            ['AAP 호흡기 감염 개요', 'https://www.healthychildren.org/English/health-issues/conditions/chest-lungs/Pages/default.aspx']
        ]
    },
    {
        id: 'smoke-advisory-outdoor-boundary',
        match: /(연기\s*경보\s*외출|연기\s*경보\s*외출|대기\s*질\s*나쁨\s*외출|smoke\s*advisory\s*outdoor)/,
        title: '대기질·연기 경보 때는 야외 활동을 줄이고, 천식·기침이 심하면 진료하세요',
        lead: '마스크 브랜드 순위는 하지 않습니다.',
        points: [
            ['행동', '실내, 창 관리'],
            ['진료', '호흡 악화']
        ],
        blocks: [
            ['지금 할 일', '외출을 미루세요.'],
            ['하지 않을 일', '연기가 심한 곳에서 운동하지 마세요.'],
            ['관련', '산불 연기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 공기', 'https://www.cdc.gov/air-quality/'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'wildfire-smoke-child-boundary',
        match: /(산불\s*연기|산불\s*미세먼지|wildfire\s*smoke|화재\s*연기\s*아이|연기\s*공기질\s*아이)/,
        title: '산불·화재 연기가 심하면 야외 활동을 줄이고, 호흡 이상이 있으면 진료하세요',
        lead: '연기는 어린이 호흡기에 부담이 큽니다. 실내 공기 관리와 외출 자제를 우선하세요. 마스크 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '실내, 창 닫기, 외출 축소'],
            ['진료', '숨가쁨, 천식 악화']
        ],
        blocks: [
            ['지금 할 일', '공기질 경보 시 야외 운동을 미루세요.'],
            ['하지 않을 일', '연기가 심한 곳에서 오래 두지 마세요.'],
            ['관련', '미세먼지·호흡 안내를 참고하세요.']
        ],
        links: [
            ['CDC 공기질', 'https://www.cdc.gov/air-quality/'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'newborn-stuffy-nose-sleep-boundary',
        match: /(신생아\s*코\s*막힘\s*재우기)/,
        title: '코가 막혀도 엎드려 재우지 말고 등 재우기를 유지하며 진료 신호를 보세요',
        lead: '수면 포지셔너·경사는 위험할 수 있습니다.',
        points: [
            ['수면', '등, 빈 침대'],
            ['진료', '호흡 곤란, 수유 저하']
        ],
        blocks: [
            ['지금 할 일', '실내 자극을 줄이세요.'],
            ['하지 않을 일', '엎드려 재우지 마세요.'],
            ['관련', '안전수면·코막힘 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'cold-congestion',
        match: /(감기|코막힘|콧물|기침).*(병원|괜찮|심|밤|수유|숨|호흡|가빠)|코가\s*막|숨\s*(헐떡|가빠)|가래|코\s*막/,
        title: '감기 증상은 호흡·수분·월령을 함께 보고 병원을 정합니다',
        lead: '콧물·가벼운 기침은 흔할 수 있습니다. 숨이 가쁘거나, 입술이 파랗거나, 생후 3개월 미만 발열, 수유·수분 섭취가 크게 줄면 진료합니다. 감기약 용량은 사이트에서 안내하지 않습니다.',
        points: [
            ['가정 관리', '코는 부드럽게 닦고, 수유·수분을 유지하며 연기를 피합니다.'],
            ['바로 진료', '호흡 곤란, 늑간 함몰, 처짐, 3개월 미만 38℃ 이상, 젖을 거의 못 맴']
        ],
        blocks: [
            ['지금 할 일', '호흡 횟수·수유량·체온을 기록하세요.'],
            ['하지 않을 일', '성인 감기약·민간 훈증·과한 가습으로 대체 진료하지 마세요.'],
            ['진료·상담', '상태가 빠르게 나빠지면 응급 평가를 받으세요.']
        ],
        links: [
            ['발열·응급 가이드', 'blog/baby-fever-cold-guide.html'],
            ['NICE 발열 평가(동반 증상)', 'https://www.nice.org.uk/guidance/ng143/chapter/Recommendations']
        ]
    },
    {
        id: 'hip-dysplasia-swaddle-check',
        match: /(고관절\s*탈구|엉덩이\s*탈구|발달성\s*고관절|속싸개\s*다리|다리\s*쭉\s*속싸개|hip\s*dysplasia)/,
        title: '속싸개할 때 다리를 억지로 모으거나 펴지 말고, 엉덩이 움직임 여유를 주세요',
        lead: '속싸개는 팔을 감싸도 다리가 굽히고 벌릴 여유가 있어야 한다는 안내가 있습니다. 다리를 일자로 고정하는 방식은 고관절에 부담이 될 수 있습니다. 뒤집기 시작하면 속싸개를 중단합니다. 진단·보조기 여부는 의료진이 정합니다.',
        points: [
            ['속싸개', '다리 여유, 엉덩이 굴곡·벌림 가능'],
            ['진료', '다리 길이 차이, 움직임 비대칭, 가족력 걱정']
        ],
        blocks: [
            ['지금 할 일', '속싸개 제품이 다리를 너무 조이는지 확인하세요.'],
            ['하지 않을 일', '뒤집기 시작한 아기를 속싸개로 재우지 마세요.'],
            ['관련', '속싸개·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 속싸개·고관절', 'https://www.healthychildren.org/English/ages-stages/baby/diapers-clothing/Pages/Swaddling-Is-it-Safe.aspx'],
            ['국제 고관절 기구 안내(영)', 'https://hipdysplasia.org/'],
            ['속싸개 안내', '#home']
        ]
    },
    {
        id: 'swaddle-transition-arms-out',
        match: /(속싸개\s*팔\s*빼|스와들\s*전환|swaddle\s*transition|속싸개\s*그만\s*뒤집|팔\s*자유\s*싸개)/,
        title: '뒤집기를 시작하면 속싸개 팔을 빼고 전환하며, 뒤집힌 채 싸개로 재우지 마세요',
        lead: '뒤집기 이후 속싸개는 질식·압박 위험이 커질 수 있습니다. 수면 조끼 등으로 전환을 검토하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['시점', '뒤집기 신호'],
            ['전환', '팔 자유, 수면 조끼']
        ],
        blocks: [
            ['지금 할 일', '뒤집기 시작하면 팔을 빼는 전환을 하세요.'],
            ['하지 않을 일', '뒤집힌 아기를 속싸개로 다시 싸지 마세요.'],
            ['관련', '속싸개·수면 조끼 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'sleep-sack-size-fit-boundary',
        match: /(수면\s*조끼\s*사이즈|슬립색\s*크기|sleep\s*sack\s*fit|수면조끼\s*맞|슬리핑백\s*고르)/,
        title: '수면 조끼는 목·팔 구멍이 맞는 사이즈를 쓰고, 헐렁한 이불 대용으로 쓰지 마세요',
        lead: '너무 크면 얼굴이 가려질 수 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['핏', '목·팔 구멍, 무게'],
            ['금지', '얼굴 가림, 과열']
        ],
        blocks: [
            ['지금 할 일', '어깨 끈이 너무 헐렁하지 않은지 보세요.'],
            ['하지 않을 일', '이불을 조끼 위에 더 덮지 마세요.'],
            ['관련', '수면 조끼·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'swaddle-hip-healthy-boundary',
        match: /(속싸개\s*엉덩이|스와들\s*다리\s*펴|swaddle\s*hip\s*healthy|속싸개\s*다리\s*일자|엉덩이\s*압박\s*싸개)/,
        title: '속싸개 때 다리가 일자로 강하게 묶이지 않게 하고, 엉덩이 여유를 확인하세요',
        lead: '고관절 이형성 위험과 관련해 다리 움직임 여유가 강조됩니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['자세', '다리 여유'],
            ['전환', '뒤집기 시 중단']
        ],
        blocks: [
            ['지금 할 일', '다리가 구부려질 여유가 있는지 보세요.'],
            ['하지 않을 일', '다리를 강하게 쭉 펴 묶지 마세요.'],
            ['관련', '속싸개·고관절 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['고관절 안내', '#home']
        ]
    },
    {
        id: 'swaddle-safety',
        match: /(속싸개|스와들|swaddle|싸개).*(언제|그만|뒤집|위험|방법)|뒤집.*속싸개/,
        title: '속싸개는 등을 대고, 뒤집기 시작하면 중단합니다',
        lead: '속싸개를 쓸 때는 항상 등을 대고 재우고, 엉덩이·다리가 너무 조이지 않게 합니다. 아기가 스스로 뒤집기 시작하면 속싸개를 그만두는 것이 안전 수면 권고와 맞습니다.',
        points: [
            ['사용할 때', '단단한 별도 수면면, 등 자세, 얼굴이 가리지 않게, 과열 주의'],
            ['중단', '뒤집기를 시도하면 팔을 가두는 속싸개를 중지합니다.']
        ],
        blocks: [
            ['지금 할 일', '수면 환경이 등·빈 공간·별도 수면면인지 확인하세요.'],
            ['하지 않을 일', '엎드려 싸매거나, 느슨한 이불로 얼굴을 덮지 마세요.'],
            ['더 보기', '1세 미만 안전수면 전체 기준을 확인하세요.']
        ],
        links: [
            ['1세 미만 안전수면 가이드', 'blog/baby-safe-sleep-guide.html'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'intoeing-pigeon-toe-boundary',
        match: /(안짱다리|안짱\s*걸음|발끝\s*안쪽|intoeing|pigeon\s*toe|발가락\s*안쪽\s*걷|발\s*안쪽으로\s*걷)/,
        title: '발끝이 안쪽으로 향하는 걸음은 어릴 때 흔할 수 있으나, 통증·심한 비대칭은 진료하세요',
        lead: '걸음마 전후 안짱걸음(발끝이 안쪽)은 성장하며 좋아지는 경우가 많습니다. 통증, 자주 넘어짐, 한쪽만 심함, 점점 악화면 의료진과 상의하세요. “교정 신발 필수” 브랜드 추천·합격 나이는 단정하지 않습니다.',
        points: [
            ['관찰', '좌우 차이, 통증, 활동 제한, 가족력'],
            ['상담', '심한 절뚝, 3세 이후에도 뚜렷 악화']
        ],
        blocks: [
            ['지금 할 일', '맨발 걷는 모습을 짧게 영상으로 남겨 두세요.'],
            ['하지 않을 일', '광고 교정 용품을 임의로 오래 신기지 마세요.'],
            ['관련', '오다리·신발·발달 안내를 참고하세요.']
        ],
        links: [
            ['AAP 정형·발 모양 개요', 'https://www.healthychildren.org/English/health-issues/conditions/orthopedic/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'flat-foot-toddler-boundary',
        match: /(평발|플랫\s*풋|flat\s*foot|발\s*아치\s*없|아기\s*평발|유연\s*평발)/,
        title: '어린이 평발은 유연한 경우가 많고, 통증·보행 문제가 있을 때 진료를 검토하세요',
        lead: '영·유아는 발 안쪽 아치가 덜 도드라져 보이는 경우가 흔합니다. 통증 없이 잘 뛰면 경과 관찰인 경우가 많고, 통증·피로·심한 안짱·가족력 걱정은 의료진과 상의하세요. 특수 깔창 브랜드 순위는 하지 않습니다.',
        points: [
            ['관찰', '통증, 오래 걷지 못함, 신발 한쪽만 닳음'],
            ['상담', '강직 평발, 신경·근육 증상 동반']
        ],
        blocks: [
            ['지금 할 일', '맨발·신발 신을 때 통증을 말하는지 확인하세요.'],
            ['하지 않을 일', '통증 없는 아이에게 고가 교정 신발을 강요하지 마세요.'],
            ['관련', '오다리·안짱걸음·첫 신발 안내를 참고하세요.']
        ],
        links: [
            ['AAP 발·평발 개요', 'https://www.healthychildren.org/English/health-issues/conditions/orthopedic/Pages/default.aspx'],
            ['첫 신발 안내', '#home']
        ]
    },
    {
        id: 'bow-legs-toddler-boundary',
        match: /(오다리|휜\s*다리|내반슬|bow\s*leg|다리가\s*휘|안짱\s*아님\s*오다리|toddler\s*bow)/,
        title: '걸음마 전후 다리가 휘어 보여도 흔한 경우가 있으나, 심한 비대칭·통증은 진료하세요',
        lead: '걸음마 전후 다리가 바깥으로 휘어 보이는 모습은 성장 과정에서 흔할 수 있습니다. 한쪽에만 심하거나, 통증·절뚝·키 성장 걱정이 있으면 의료진과 상의하세요. “교정 신발 필수” 브랜드 추천·합격 마감선은 하지 않습니다.',
        points: [
            ['관찰', '좌우 차이, 통증, 걷기 회피, 가족력'],
            ['상담', '점점 심해짐, 3세 이후에도 뚜렷, 다른 기형 동반']
        ],
        blocks: [
            ['지금 할 일', '맨발·신발 착용 시 걷는 모습을 짧게 기록하세요.'],
            ['하지 않을 일', '교정 기구를 광고만 보고 임의 구매하지 마세요.'],
            ['관련', '발달·신발·평발 걱정 안내를 참고하세요.']
        ],
        links: [
            ['AAP 다리·발 모양 개요', 'https://www.healthychildren.org/English/health-issues/conditions/orthopedic/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'tummy-time-crying-boundary',
        match: /(터미타임\s*울|엎드려\s*울음|tummy\s*time\s*cry|배\s*엎드려\s*싫어|터미\s*타임\s*거부)/,
        title: '터미타임은 짧게 자주, 깨어 있을 때 하고, 울면 쉬었다가 다시 시도하세요',
        lead: '수면 중 엎드림과 혼동하지 마세요. 안전수면은 등 재우기입니다.',
        points: [
            ['방법', '짧게, 자주, 감독'],
            ['금지', '잠든 채 엎드림']
        ],
        blocks: [
            ['지금 할 일', '가슴 위 엎드림 등 변형으로 시작해 보세요.'],
            ['하지 않을 일', '혼자 두고 긴 시간 엎드리게 하지 마세요.'],
            ['관련', '터미타임 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'newborn-tummy-time-short-boundary',
        match: /(신생아\s*터미\s*분)/,
        title: '신생아 터미타임은 짧게 자주, 깨어 있을 때만 하고 잠든 채 엎드리지 마세요',
        lead: '정확한 분 수 단정보다 신호·감독이 중요합니다.',
        points: [
            ['방법', '짧게, 자주, 감독'],
            ['금지', '수면 중 엎드림']
        ],
        blocks: [
            ['지금 할 일', '가슴 위 엎드림부터 시도해 보세요.'],
            ['하지 않을 일', '혼자 두고 긴 시간 엎드리지 마세요.'],
            ['관련', '터미타임 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'crawling-home-safety-boundary',
        match: /(기어\s*다니기\s*안전)/,
        title: '기기 시작하면 바닥 이물질·전선·작은 물건을 치우고 계단을 막으세요',
        lead: '시야 밖 위험이 늘어납니다. 안전 용품 순위는 하지 않습니다.',
        points: [
            ['점검', '바닥, 전선, 계단'],
            ['감독', '시야 내']
        ],
        blocks: [
            ['지금 할 일', '무릎 높이에서 집을 둘러보세요.'],
            ['하지 않을 일', '작은 부품을 바닥에 두지 마세요.'],
            ['관련', '가정 안전·터미타임 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'tummy-time-after-spit-boundary',
        match: /(터미타임\s*토\s*후|터미타임\s*토\s*후|엎드려\s*토\s*위험|tummy\s*time\s*after\s*spit)/,
        title: '토한 직후 바로 긴 터미타임보다 안정 후 짧게 하고, 잠든 채 엎드리지 마세요',
        lead: '수면은 등 재우기입니다.',
        points: [
            ['때', '안정 후 짧게'],
            ['금지', '수면 중 엎드림']
        ],
        blocks: [
            ['지금 할 일', '보챔이 심하면 미루세요.'],
            ['하지 않을 일', '혼자 두고 엎드리지 마세요.'],
            ['관련', '터미타임 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'tummy-time',
        match: /(엎드|터미\s*타임|tummy|배\s*밀이|목가누).*(시간|언제|방법|해요)|터미타임|엎드려\s*놀/,
        title: '엎드려 놀기는 깨어 있고 보호자가 볼 때만 합니다',
        lead: '목·어깨 힘을 기르기 위해 짧은 엎드려 놀이를 할 수 있습니다. 잠든 아기를 엎드려 재우지 않습니다. 울면 쉬고, 보호자가 지켜보는 깨어 있는 시간에만 합니다.',
        points: [
            ['방법', '단단한 바닥, 짧은 시간부터, 보호자 얼굴 마주 보기'],
            ['금지', '수면 중 엎드림, 소파·침대 가장자리, 혼자 두기']
        ],
        blocks: [
            ['지금 할 일', '기저귀 갈이 후 1~2분부터 시도해 반응을 보세요.'],
            ['하지 않을 일', '울음을 무시하며 오래 엎드리게 하거나 수면 훈련용으로 쓰지 마세요.'],
            ['상담', '한쪽으로만 고개를 돌리거나 움직임이 매우 비대칭이면 진료·상담을 검토하세요.']
        ],
        links: [
            ['개월별 놀이·주의', 'blog/development-kdst-guide.html#play'],
            ['CDC 안전수면(수면은 등)', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'toothpaste-swallow-too-much-boundary',
        match: /(치약\s*삼킴\s*많|치약\s*많이\s*삼켰|toothpaste\s*swallow\s*much|불소\s*치약\s*과다\s*삼킴)/,
        title: '치약을 많이 삼켰다면 제품·양을 확인하고 중독 상담·진료를 검토하세요',
        lead: '평소에는 쌀알·콩알 크기 등 연령 안내를 따릅니다. 여기서 용량을 단정하지 않습니다.',
        points: [
            ['평소', '소량, 뱉기 연습'],
            ['과다', '상담']
        ],
        blocks: [
            ['지금 할 일', '치약 뚜껑을 닫아 두세요.'],
            ['하지 않을 일', '치약을 간식처럼 짜 먹게 두지 마세요.'],
            ['관련', '양치 안내를 참고하세요.']
        ],
        links: [
            ['치아 가이드', 'blog/baby-dental-care.html'],
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'fluoride-varnish-boundary',
        match: /(불소\s*바니시|fluoride\s*varnish|불소\s*도포|치아\s*불소\s*코팅|치과\s*불소)/,
        title: '불소 바니시·도포는 충치 예방에 쓰일 수 있으며, 적용·주기는 치과·의료진 안내를 따르세요',
        lead: '불소 바니시는 소아 치과에서 흔히 사용하는 예방 방법 중 하나입니다. 가정에서 고농도 제품을 임의로 바르지 마세요. 용량·주기·브랜드 순위는 사이트에서 정하지 않습니다.',
        points: [
            ['제공', '치과·소아과 안내, 연령·충치 위험'],
            ['가정', '연령 맞는 치약, 삼킴 줄이기']
        ],
        blocks: [
            ['지금 할 일', '첫 치과 방문과 불소 안내를 물어보세요.'],
            ['하지 않을 일', '성인 고불소 젤을 영아에게 바르지 마세요.'],
            ['관련', '양치·수돗물 불소·첫 치과 안내를 참고하세요.']
        ],
        links: [
            ['CDC 불소·구강 건강', 'https://www.cdc.gov/fluoridation/'],
            ['AAP 구강 건강', 'https://www.healthychildren.org/English/healthy-living/oral-health/Pages/default.aspx']
        ]
    },
    {
        id: 'first-dental-visit',
        match: /(첫\s*치과|소아치과\s*언제|치과\s*처음|치과\s*검진\s*언제|1살\s*치과|돌\s*치과|first\s*dental)/,
        title: '첫 치과 검진은 첫 치아 뒤 또는 첫돌 전후를 목표로 잡는 안내가 많습니다',
        lead: '이가 나기 시작하거나 첫돌 무렵 소아치과·치과에서 입안·습관을 점검하라는 안내가 흔합니다. “이가 다 난 뒤”까지 미룰 필요는 없습니다. 통증·외상·감염 의심이 있으면 일정과 관계없이 진료하세요. 특정 병원·시술 순위는 하지 않습니다.',
        points: [
            ['시기', '첫 치아 후 또는 12개월 전후 목표(개인·의료 안내)'],
            ['준비', '수유·간식·양치 습관, 불소·병 물고 자기 여부']
        ],
        blocks: [
            ['지금 할 일', '이가 났다면 보호자 양치부터 시작하고 가까운 소아치과 일정을 알아보세요.'],
            ['하지 않을 일', '아플 때만 가겠다고 외상·감염 신호를 미루지 마세요.'],
            ['관련', '양치·이앓이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 첫 치과 방문', 'https://www.healthychildren.org/English/ages-stages/baby/teething-tooth-care/Pages/Baby\'s-First-Dental-Visit.aspx'],
            ['CDC 어린이 구강 건강', 'https://www.cdc.gov/oral-health/prevention/oraph-childrens-oral-health.html'],
            ['양치 시작 기준', 'market/toddler-toothbrush-guide.html#standard']
        ]
    },
    {
        id: 'propped-bottle-danger',
        match: /(젖병\s*괴|젖병\s*고정|프로핑|bottle\s*prop|젖병\s*베개|혼자\s*젖병|젖병\s*물려\s*두)/,
        title: '젖병을 베개·받침으로 괴어 두고 혼자 먹이지 마세요',
        lead: '젖병을 고정해 두고 아기가 혼자 빨게 하면 질식·중이염·치아 우식 위험이 커질 수 있습니다. 수유 중에는 안고 살펴보고, 잠든 뒤 입에서 젖병을 빼 주세요. 특정 거치대 추천은 하지 않습니다.',
        points: [
            ['위험', '질식, 중이 압력, 밤에 당분 노출'],
            ['대안', '안아서 수유, 잠들면 병 제거, 돌 이후 컵 연습']
        ],
        blocks: [
            ['지금 할 일', '젖병 거치·베개로 괴는 습관이 있으면 멈추세요.'],
            ['하지 않을 일', '아기를 혼자 둔 채 젖병을 물려 두지 마세요.'],
            ['관련', '밤 젖병·충치·수유 안내를 참고하세요.']
        ],
        links: [
            ['AAP 젖병 수유 안전 개요', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/default.aspx'],
            ['CDC 수유·치아', 'https://www.cdc.gov/oral-health/prevention/index.html']
        ]
    },
    {
        id: 'sippy-cup-tooth-boundary',
        match: /(시피\s*컵|흘림\s*방지\s*컵|sippy\s*cup|흘림방지\s*컵|뚜껑\s*컵\s*주스|뚜껑\s*컵\s*충치)/,
        title: '흘림방지 컵에 단 음료를 오래 물리면 치아에 부담이 될 수 있습니다',
        lead: '뚜껑 컵·흘림방지 컵은 편리하지만, 주스·단 음료를 하루 종일 물리면 충치 위험이 커질 수 있습니다. 물 위주로 쓰고, 잠들며 물리지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['습관', '물 위주, 식사 때, 잠들기 전 끝내기'],
            ['전환', '오픈 컵·빨대 연습']
        ],
        blocks: [
            ['지금 할 일', '컵 속 음료가 물인지 확인하세요.'],
            ['하지 않을 일', '주스 컵을 유모차에 종일 걸어 두지 마세요.'],
            ['관련', '밤 젖병·주스·양치 안내를 참고하세요.']
        ],
        links: [
            ['AAP 구강·음료 개요', 'https://www.healthychildren.org/English/healthy-living/oral-health/Pages/default.aspx'],
            ['CDC 구강 건강', 'https://www.cdc.gov/oral-health/']
        ]
    },
    {
        id: 'night-bottle-caries-boundary',
        match: /(젖병\s*물고\s*자|재우며\s*젖병|밤에\s*젖병|젖병\s*재우|우유\s*병\s*물고|분유\s*병\s*물고\s*자|bottle\s*in\s*bed)/,
        title: '우유·분유·주스가 든 젖병을 문 채 재우지 마세요',
        lead: '잠들며 젖병을 오래 물리면 치아에 당분이 오래 남아 이른 충치 위험이 커질 수 있습니다. 잠들기 전 수유 후 양치·거즈 닦기를 하고, 물만 든 병 외에는 침대에 두지 않는 편이 안전합니다. 하얗거나 갈색 반점이 보이면 치과에 문의하세요.',
        points: [
            ['습관', '재우기 전 수유 끝내기, 병 물고 잠 줄이기'],
            ['관리', '이가 나면 보호자 양치, 이상 부위는 치과']
        ],
        blocks: [
            ['지금 할 일', '밤 젖병을 물·끝내기 루틴으로 바꿔 갈 계획을 세우세요.'],
            ['하지 않을 일', '주스·단 음료를 젖병에 넣어 재우지 마세요.'],
            ['관련', '양치·컵 마시기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 어린이 구강·병 충치 예방', 'https://www.cdc.gov/oral-health/prevention/oraph-childrens-oral-health.html'],
            ['AAP 치아 관리', 'https://www.healthychildren.org/English/ages-stages/baby/teething-tooth-care/Pages/default.aspx'],
            ['양치 시작 기준', 'market/toddler-toothbrush-guide.html#standard']
        ]
    },
    {
        id: 'tooth-eruption-timing',
        match: /(이\s*나는\s*시기|치아\s*맹출\s*시기|첫\s*니\s*언제|언제\s*이\s*나|이\s*몇\s*개월|유치\s*나는\s*순|치아\s*순서)/,
        title: '첫니는 보통 생후 수개월대에 나지만, 개인차가 큽니다',
        lead: '많은 아기가 생후 4~7개월 무렵 아래 앞니부터 나기 시작하지만, 더 이르거나 첫돌 전후에 나기도 합니다. “○개월에 꼭” 표를 합격선처럼 쓰지 마세요. 이가 나면 양치(거즈→칫솔·불소)를 시작하고, 심한 고열·처짐은 이앓이만으로 설명하지 않습니다.',
        points: [
            ['범위', '시기·순서는 개인차. 18개월이 지나도 이가 하나도 없으면 진료에서 확인'],
            ['이가 난 뒤', '보호자 칫솔질, 쌀알만큼 불소치약(해당 기준), 젖병 물고 자기 줄이기']
        ],
        blocks: [
            ['지금 할 일', '잇몸·이가 보이는지 확인하고 양치 기준을 보세요.'],
            ['하지 않을 일', '호박 목걸이 등 질식 위험 제품을 쓰지 마세요.'],
            ['관련', '이앓이 완화·양치 공식 답을 참고하세요.']
        ],
        links: [
            ['양치 시작 공식 기준', 'market/toddler-toothbrush-guide.html#standard'],
            ['AAP 티딩·치아 관리', 'https://www.healthychildren.org/English/ages-stages/baby/teething-tooth-care/Pages/Teething-Pain.aspx'],
            ['질병관리청 구강 건강', 'https://health.kdca.go.kr/']
        ]
    },
    {
        id: 'teething-necklace-danger',
        match: /(호박\s*목걸이|티딩\s*목걸이|이\s*날\s*목걸이|티딩\s*팔찌|teething\s*necklace|호박\s*팔찌)/,
        title: '이 날 때 호박·티딩 목걸이는 질식·줄 감김 위험이 있어 권하지 않습니다',
        lead: '목에 거는 티딩 목걸이·호박 알은 줄이 조이거나 알이 떨어져 질식 위험이 있다는 안전 안내가 많습니다. 이가 날 때는 차갑게 한 치발기·잇몸 마사지 등 감독 가능한 방법을 쓰고, 약은 의료진과 상의하세요. 제품 추천 순위는 하지 않습니다.',
        points: [
            ['위험', '줄 감김, 알 분리 삼킴, 감독 중에도 사고'],
            ['대안', '감독 아래 치발기, 잇몸 마사지, 안전수면 유지']
        ],
        blocks: [
            ['지금 할 일', '목·손목에 걸린 티딩 장신구가 있으면 재우기·혼자 둘 때는 빼 두세요.'],
            ['하지 않을 일', '재울 때 목걸이를 한 채로 두지 마세요.'],
            ['관련', '이 날 때 보챔·양치 안내를 참고하세요.']
        ],
        links: [
            ['AAP 티딩 목걸이 위험', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Teething-Necklaces-and-Beads-A-Caution-for-Parents.aspx'],
            ['CDC 질식 위험', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html'],
            ['이 날 때 안내', '#home']
        ]
    },
    {
        id: 'sleep-bruxism-when-care-boundary',
        match: /(수면\s*이갈이\s*진료|이갈이\s*심해서|sleep\s*bruxism\s*care|이\s*가는\s*소리\s*심|이갈이\s*치아\s*손상)/,
        title: '수면 이갈이가 잦거나 치아·턱 통증이 있으면 치과·의료진 상담을 검토하세요',
        lead: '일시적일 수 있으나 치아 손상·통증이 있으면 평가가 필요합니다. 기구 순위는 하지 않습니다.',
        points: [
            ['관찰', '빈도, 치아 마모'],
            ['상담', '통증, 두통, 잠 방해']
        ],
        blocks: [
            ['지금 할 일', '영상이나 빈도를 기록하세요.'],
            ['하지 않을 일', '입안에 물건을 물려 막지 마세요.'],
            ['관련', '이갈이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['치아 가이드', 'blog/baby-dental-care.html']
        ]
    },
    {
        id: 'teeth-grinding-sleep',
        match: /(이갈이|이를\s*갈|bruxism|자면서\s*이\s*갈|밤\s*이갈)/,
        title: '자면서 이를 가는 일은 아이들에게 있을 수 있고, 치아 손상·통증이 있으면 진료합니다',
        lead: '수면 중 이갈이는 어린이에게 나타날 수 있습니다. 일시적이면 관찰하고, 치아 마모·턱 통증·수면 방해가 크면 소아치과·의료진과 상의하세요. 성인용 장치·약 용량을 사이트에서 정하지 않습니다.',
        points: [
            ['관찰', '소리, 아침 턱 불편, 치아 상태'],
            ['진료', '심한 마모, 통증, 코골이·무호흡 의심과 동반']
        ],
        blocks: [
            ['지금 할 일', '언제 소리가 나는지 짧게 기록하세요.'],
            ['하지 않을 일', '입을 테이프로 막지 마세요.'],
            ['관련', '양치·수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 이갈이', 'https://www.healthychildren.org/English/healthy-living/oral-health/Pages/Bruxism-Teeth-Grinding.aspx'],
            ['양치 기준', 'market/toddler-toothbrush-guide.html#standard']
        ]
    },
    {
        id: 'teething-fever-myth',
        match: /(이\s*나\s*면서\s*고열|이\s*날\s*때\s*열|티딩\s*열|teething\s*fever|이\s*나서\s*38)/,
        title: '이가 난다고 고열·심한 병을 설명하지 마세요. 열은 감염 등 다른 원인을 봅니다',
        lead: '이 날 때 보챔·침·미열처럼 느껴질 수는 있어도, 높은 열·처짐·호흡 이상·발진을 “이 때문”으로만 돌리지 마세요. 열 평가 기준(나이·상태)을 따르고 필요하면 진료합니다. 이 날 때 진통제 용량은 의료진과 정합니다.',
        points: [
            ['이 날 때', '침, 보챔, 잇몸 마사지·차갑게 하기'],
            ['열', '나이·호흡·수분·처짐을 함께, 고열은 다른 원인 검토']
        ],
        blocks: [
            ['지금 할 일', '체온·시작 시각·다른 증상을 기록하세요.'],
            ['하지 않을 일', '고열을 무시하고 “이 나면 가라앉겠지”로 두지 마세요.'],
            ['관련', '발열·이 날 때 보챔 안내를 참고하세요.']
        ],
        links: [
            ['AAP 티딩', 'https://www.healthychildren.org/English/ages-stages/baby/teething-tooth-care/Pages/default.aspx'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html'],
            ['이 날 때 안내', '#home']
        ]
    },
    {
        id: 'benzocaine-teething-boundary',
        match: /(벤조카인|benzocaine|오라젤|이앓이\s*젤|티딩\s*젤|치아\s*겔|잇몸\s*마취\s*젤|마취\s*연고\s*이앓)/,
        title: '벤조카인 등 이앓이 마취 젤은 영아에게 쓰지 않는 것이 안전합니다',
        lead: '벤조카인이 든 이앓이 젤·액체는 심각한 혈액 산소 문제(메트헤모글로빈혈증) 위험으로 어린 아이에게 권고되지 않습니다. 잇몸 마사지·차갑게 한 발육기 등 비약물 방법을 우선하고, 약은 의료진과 상의하세요. 브랜드 순위·용량은 사이트에서 정하지 않습니다.',
        points: [
            ['피하기', '벤조카인 표시 이앓이 젤·액체, 검증 안 된 마취 연고'],
            ['우선', '잇몸 마사지, 차갑게 한 발육기, 필요 시 진료']
        ],
        blocks: [
            ['지금 할 일', '집에 있는 이앓이 젤 성분표를 확인하세요.'],
            ['하지 않을 일', '성인용 구강 마취제를 아기 잇몸에 바르지 마세요.'],
            ['관련', '이앓이 완화·양치 안내를 참고하세요.']
        ],
        links: [
            ['FDA 벤조카인 이앓이 제품 경고', 'https://www.fda.gov/drugs/drug-safety-and-availability/risk-serious-and-potentially-fatal-blood-disorder-prompts-fda-action-oral-over-counter-benzocaine'],
            ['AAP 티딩 통증', 'https://www.healthychildren.org/English/ages-stages/baby/teething-tooth-care/Pages/Teething-Pain.aspx'],
            ['양치 시작 기준', 'market/toddler-toothbrush-guide.html#standard']
        ]
    },
    {
        id: 'dental-extraction-aftercare-boundary',
        match: /(이\s*뽑은\s*후|발치\s*후|tooth\s*extraction|유치\s*뽑고|치과\s*뽑은)/,
        title: '유치 발치 후에는 치과 안내대로 지혈·식사를 하고, 빨대·가글을 함부로 하지 마세요',
        lead: '지시가 병원마다 다를 수 있습니다. 지속 출혈·발열은 연락하세요. 약 용량은 처방·표시를 따릅니다.',
        points: [
            ['준수', '치과 지시, 부드러운 음식'],
            ['주의', '지속 출혈']
        ],
        blocks: [
            ['지금 할 일', '거즈 물기 시간을 지키세요.'],
            ['하지 않을 일', '피를 계속 뱉으며 자극하지 마세요.'],
            ['관련', '치아 외상·치과 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['치아 가이드', 'blog/baby-dental-care.html']
        ]
    },
    {
        id: 'teething-comfort',
        match: /(이앓|이\s*나|치아\s*나|젖니|티딩|teething|잇몸\s*붓|치아\s*맹출)/,
        title: '이 날 때 보챔은 잇몸 마사지·차갑게 하기부터, 약은 의료진과',
        lead: '젖니가 나올 때 침·보챔·잇몸 불편이 있을 수 있습니다. 깨끗한 손가락으로 잇몸을 문지르거나 차갑게 한 치아 발육기를 쓸 수 있습니다. 해열·진통 용량과 겔 처방은 사이트에서 정하지 않습니다.',
        points: [
            ['가정 완화', '잇몸 마사지, 차갑게 한 발육기, 수유·수분 유지'],
            ['진료', '고열·심한 설사·발진·처짐은 이앓이만으로 설명하지 말고 진료']
        ],
        blocks: [
            ['지금 할 일', '이가 났는지 확인하고 양치 기준(거즈→칫솔)을 함께 보세요.'],
            ['하지 않을 일', '목걸이형 호박·비즈 치아 목걸이(질식 위험), 검증 안 된 겔을 임의로 쓰지 마세요.'],
            ['구강 관리', '이가 하나라도 나면 보호자 칫솔질과 불소치약 기준을 따릅니다.']
        ],
        links: [
            ['양치 시작 공식 기준', 'market/toddler-toothbrush-guide.html#standard'],
            ['AAP 티딩 안내', 'https://www.healthychildren.org/English/ages-stages/baby/teething-tooth-care/Pages/Teething-Pain.aspx']
        ]
    },
    {
        id: 'infant-swing-sleep-boundary',
        match: /(스윙.{0,12}(재우|재워|잠)|바운서.{0,12}(재우|재워|잠)|흔들\s*침대.{0,10}(재우|재워)|infant\s*swing\s*sleep|카시트.{0,12}(재우|재워|잠)|스윙\s*바운서)/,
        title: '스윙·바운서·카시트에 잠든 아기는 가능하면 평평한 안전 수면 공간으로 옮기세요',
        lead: '스윙·바운서·카시트 등 기울어진 제품에서 장시간 재우면 기도·질식 위험이 커질 수 있습니다. 이동 중 카시트는 이동 목적에 쓰고, 도착 후 잠든 아기는 등을 대고 평평한 바닥에 눕히는 편이 안전합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['수면', '평평·단단한 바닥, 등 재우기, 부드러운 물건 치우기'],
            ['이동', '카시트는 이동용, 집 안 침대 대용 금지']
        ],
        blocks: [
            ['지금 할 일', '스윙·바운서에서 깊이 잠들면 안전 침대로 옮기세요.'],
            ['하지 않을 일', '스윙을 밤 재우기 장소로 쓰지 마세요.'],
            ['관련', '안전수면·경사 수면 제품 안내를 참고하세요.']
        ],
        links: [
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx'],
            ['CPSC 유아 수면 제품', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'sleep-inclined-devices',
        match: /(수면\s*포지셔너|경사\s*(침대|쿠션|매트|수면)|웨지\s*쿠션|수면\s*벨트|인클라인|inclined|경사\s*재우)/,
        title: '수면 포지셔너·경사진 수면 장치는 쓰지 않는 것이 안전합니다',
        lead: '통잠·역류 완화를 내세운 수면 포지셔너, 경사 쿠션, 벨트형 고정 장치는 질식·끼임 위험으로 권고되지 않습니다. 잠은 평평하고 단단한 별도 수면면에 등을 대고 재웁니다. 제품 브랜드 순위는 안내하지 않습니다.',
        points: [
            ['권고', '평평·단단·빈 공간·등 자세'],
            ['피하기', '경사 수면면, 옆·엎드림 고정 쿠션, 느슨한 이불·범퍼']
        ],
        blocks: [
            ['지금 할 일', '요람·침대에 쿠션·벨트가 있으면 치우세요.'],
            ['하지 않을 일', '카시트·흔들 의자에 오래 재우지 마세요.'],
            ['관련', '안전수면·뒤집기 후 재우기 안내를 보세요.']
        ],
        links: [
            ['1세 미만 안전수면 가이드', 'blog/baby-safe-sleep-guide.html'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 안전수면 요약', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'crib-drop-side-boundary',
        match: /(드롭\s*사이드|드롭사이드|옆판\s*내려|이동식\s*옆판|drop[\s-]?side\s*crib|옆판\s*카시트)/,
        title: '옆판이 내려가는 드롭사이드 아기 침대는 쓰지 마세요',
        lead: '드롭사이드(옆판 이동) 아기 침대는 끼임·이탈 사고로 판매·사용이 제한·금지된 흐름이 있습니다. 중고로 물려받아도 쓰지 않는 편이 안전합니다. 고정 옆판·현재 안전 기준을 만족하는 침대를 안내 기준으로 보고, 브랜드 순위는 하지 않습니다.',
        points: [
            ['피하기', '옆판이 위아래로 움직이는 구형 침대'],
            ['대안', '고정 옆판, 설명서·리콜 여부 확인']
        ],
        blocks: [
            ['지금 할 일', '사용 중 침대 모델·리콜 여부를 확인하세요.'],
            ['하지 않을 일', '중고 드롭사이드를 “아직 튼튼하다”며 쓰지 마세요.'],
            ['관련', '안전수면·범퍼 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 아기 침대 안전', 'https://www.cpsc.gov/'],
            ['AAP 안전수면·침대', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'crib-bumper-boundary',
        match: /(범퍼\s*가드|침대\s*범퍼|crib\s*bumper|메쉬\s*범퍼|아기\s*침대\s*가드|침대\s*가드\s*쿠션)/,
        title: '아기 침대 범퍼·가드 쿠션은 질식 위험이 있어 쓰지 않는 것이 안전합니다',
        lead: '1세 미만 안전수면 안내는 딱딱하고 평평한 빈 수면면을 권합니다. 소프트 범퍼·가드 쿠션·두꺼운 패딩은 질식·끼임 위험이 있어 권하지 않는 안내가 많습니다. 메쉬 제품도 “안전 보장”으로 단정하지 마세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['기본', '등 재우기, 별도 수면면, 이불·인형·범퍼 없이'],
            ['경계', '예쁜 세트·카페 추천만으로 범퍼를 추가하지 않기']
        ],
        blocks: [
            ['지금 할 일', '침대 안에 부드러운 가드·쿠션이 있으면 빼 두세요.'],
            ['하지 않을 일', '낙상 방지 이유로 소프트 범퍼를 끼우지 마세요.'],
            ['관련', '안전수면·포지셔너 금지 안내를 참고하세요.']
        ],
        links: [
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'hotel-crib-safety-boundary',
        match: /(호텔\s*아기\s*침대|호텔\s*아기\s*침대\s*안전|hotel\s*crib|리조트\s*아기\s*침대|숙소\s*침대\s*아기)/,
        title: '호텔 아기 침대는 간격·매트리스·낙하 위험을 점검하고, 불안하면 여행용 침대를 검토하세요',
        lead: '시설 상태가 제각각입니다. 범퍼·인형·기울어진 매트리스를 치우세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['점검', '간격, 잠금, 매트리스'],
            ['치우기', '헐렁한 침구']
        ],
        blocks: [
            ['지금 할 일', '도착 즉시 침대를 흔들어 확인하세요.'],
            ['하지 않을 일', '성인 침대에 방치하지 마세요.'],
            ['관련', '여행용 침대·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'travel-crib-hotel',
        match: /(여행용\s*침대|휴대용\s*침대|팩앤플레이|pack\s*n\s*play|호텔\s*아기\s*침대|접이식\s*아기\s*침대)/,
        title: '여행용·호텔 침대도 빈 수면면·등 자세가 우선이고, 부드러운 침구를 넣지 마세요',
        lead: '집 밖에서도 1세 미만은 등·평평하고 빈 수면면이 기본입니다. 호텔 침대·성인 침대 가드·베개·이불을 아기 잠자리에 넣지 마세요. 휴대용 침대는 설명서대로 조립하고 파손·리콜을 확인합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['수면', '등, 빈 공간, 과열 방지, 같은 방 가능'],
            ['점검', '조립 잠금, 그물·바닥 상태, 설명서']
        ],
        blocks: [
            ['지금 할 일', '여행 전 휴대 침대 부품이 완전한지 확인하세요.'],
            ['하지 않을 일', '소파·성인 침대에 베개 울타리로 재우지 마세요.'],
            ['관련', '안전수면·범퍼 금지 안내를 참고하세요.']
        ],
        links: [
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'weighted-sleep-product-boundary',
        match: /(무게\s*수면|웨이트\s*블랭킷|무게\s*이불|가중\s*수면조끼|weighted\s*(blanket|sleep)|무게\s*조끼\s*아기)/,
        title: '영아에게 무게 이불·가중 수면 제품은 권하지 않습니다',
        lead: '가중 담요·무게 수면조끼 등은 영아 안전수면에 맞지 않을 수 있어 공식 안내에서는 사용을 권하지 않는 경우가 많습니다. 평평하고 단단한 바닥, 부드러운 물건 없이, 등을 대고 재우기를 우선하세요. 특정 제품 추천·순위는 하지 않습니다.',
        points: [
            ['원칙', '단단한 바닥, 등 재우기, 이불·인형·무게 제품 치우기'],
            ['경계', '“숙면 효과” 광고만 보고 영아에게 쓰지 않기']
        ],
        blocks: [
            ['지금 할 일', '아기 침대에 무게 이불·두꺼운 패딩이 있으면 치우세요.'],
            ['하지 않을 일', '성인용 무게 이불을 아이용으로 덮지 마세요.'],
            ['관련', '안전수면·수면조끼 안내를 참고하세요.']
        ],
        links: [
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'disposable-hand-warmer-boundary',
        match: /(일회용\s*핫팩|손난로\s*일회용|hand\s*warmer|포켓\s*핫팩|붙이는\s*핫팩\s*아기|핫팩\s*옷\s*속)/,
        title: '일회용 손난로·붙이는 핫팩을 영아 피부나 옷 속에 직접 붙이지 마세요',
        lead: '일회용 핫팩은 저온 화상을 일으킬 수 있고, 옷 속에 넣어 재우면 과열 위험이 있습니다. 영아 수면 공간·유모차 안 방치를 피하세요. 제품 추천은 하지 않습니다.',
        points: [
            ['위험', '저온 화상, 과열, 질식 우려 있는 방치'],
            ['대안', '겹옷, 방 온도, 담요는 안전수면 원칙 준수']
        ],
        blocks: [
            ['지금 할 일', '유모차·아기띠 안 핫팩을 제거하세요.'],
            ['하지 않을 일', '피부에 바로 붙이거나 이불 속에 넣고 재우지 마세요.'],
            ['관련', '핫팩·전기장판·화상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'heating-pad-infant-boundary',
        match: /(핫팩\s*아기|온열\s*패드\s*아기|heating\s*pad|전기\s*찜질\s*아기|손난로\s*아기|핫팩\s*화상)/,
        title: '핫팩·온열 패드를 영아 피부나 침대에 직접 대지 마세요',
        lead: '핫팩·온열 패드는 저온 화상을 일으킬 수 있고, 영아 수면 공간에 두지 않는 편이 안전합니다. 배앓이·감기 시에도 의료진 안내 없이 뜨겁게 찜질하지 마세요. 제품 추천은 하지 않습니다.',
        points: [
            ['위험', '저온 화상, 과열, 질식·이불 속 방치'],
            ['대안', '얇은 옷, 방 온도, 안아 달래기']
        ],
        blocks: [
            ['지금 할 일', '아기 침대·유모차에 핫팩이 있는지 확인하세요.'],
            ['하지 않을 일', '옷 속에 손난로를 넣고 재우지 마세요.'],
            ['관련', '전기장판·화상·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'electric-blanket-infant-boundary',
        match: /(전기\s*장판\s*아기|전기\s*담요\s*아기|electric\s*blanket|온열\s*매트\s*아기|온수\s*매트\s*영아|전기요\s*아기)/,
        title: '영아 침대에 전기장판·전기담요를 깔고 재우지 마세요',
        lead: '전기장판·온열 매트는 과열·화상·감전·끼임 위험이 있어 영아 안전수면에 맞지 않습니다. 방 온도를 조절하고, 아기는 평평한 매트리스에 등을 대고 재우세요. 특정 제품 추천은 하지 않습니다.',
        points: [
            ['원칙', '단단한 바닥, 등 재우기, 전열 기구 치우기'],
            ['위험', '과열, 화상, 코드·감전']
        ],
        blocks: [
            ['지금 할 일', '아기 침대·요람 아래 전열 매트를 제거하세요.'],
            ['하지 않을 일', '성인용 전기요를 아이 이불 대신 쓰지 마세요.'],
            ['관련', '안전수면·과열 수면 안내를 참고하세요.']
        ],
        links: [
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'lovey-safe-sleep-age-boundary',
        match: /(애착\s*이불\s*수면|로비\s*언제|lovey\s*safe\s*sleep|안아줄\s*수건\s*침대|애착\s*이불\s*침대)/,
        title: '부드러운 애착 물건은 안전수면 연령·지침을 본 뒤 검토하고, 영아 침대에 헐렁한 이불을 넣지 마세요',
        lead: '어린 영아 수면 공간은 비워 두는 것이 원칙에 가깝습니다. 애착 물건 시점은 발달·질식 위험을 함께 보세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '영아 빈 수면면'],
            ['이후', '작·얇은 애착, 감독']
        ],
        blocks: [
            ['지금 할 일', '현재 월령 안전수면 기준을 확인하세요.'],
            ['하지 않을 일', '신생아 침대에 큰 인형·이불을 넣지 마세요.'],
            ['관련', '애착·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'lovey-wash-frequency-boundary',
        match: /(애착\s*인형\s*세탁|애착\s*인형\s*세탁|로비\s*빨래|lovey\s*wash|애착\s*수건\s*빨래)/,
        title: '애착 물건 세탁 때는 같은 질감이 유지되게 하고, 영아 수면 공간에는 넣지 마세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['세탁', '부드럽게, 완전 건조'],
            ['수면', '영아 빈 침대']
        ],
        blocks: [
            ['지금 할 일', '여분을 준비해 보세요.'],
            ['하지 않을 일', '축축한 채 재우지 마세요.'],
            ['관련', '애착·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'security-blanket-lovey-boundary',
        match: /(애착\s*이불|애착\s*인형|security\s*blanket|러비|lovey|담요\s*애착|애착\s*수건)/,
        title: '애착 담요·인형은 질식 위험을 보고, 영아 안전수면 공간에는 넣지 마세요',
        lead: '토들러의 애착 물건은 흔할 수 있으나, 1세 미만 침대에 부드러운 담요·인형을 넣으면 질식 위험이 있습니다. 낮 시간에 짧게 쓰는 것과 수면 공간을 구분하세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['영아', '침대는 비우기, 등 재우기'],
            ['유아', '작은·헐거운 부품 없는 물건, 청결']
        ],
        blocks: [
            ['지금 할 일', '아기 침대에 애착 인형이 있으면 치우세요.'],
            ['하지 않을 일', '줄·단추 달린 인형을 재울 때 두지 마세요.'],
            ['관련', '안전수면·이불·쪽쪽이 안내를 참고하세요.']
        ],
        links: [
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'sleep-sack-blanket-boundary',
        match: /(수면\s*조끼|슬립\s*색|슬립삭|sleep\s*sack|아기\s*침낭|이불\s*덮고\s*재우|담요\s*재우|느슨한\s*이불)/,
        title: '1세 미만은 느슨한 이불보다 맞는 수면조끼·얇은 옷이 안전한 경우가 많습니다',
        lead: '얼굴·몸을 덮는 느슨한 이불·담요는 질식 위험이 있어 권고되지 않는 경우가 많습니다. 적정 두께의 수면조끼(슬립색)나 얇은 옷으로 체온을 조절하고, 모자·두꺼운 이불로 과열되지 않게 합니다. 특정 브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '등 자세, 빈 수면면, 과열 방지'],
            ['피하기', '느슨한 이불·베개·인형·범퍼']
        ],
        blocks: [
            ['지금 할 일', '침대 안 이불·쿠션을 치우고 옷·수면조끼 두께를 점검하세요.'],
            ['하지 않을 일', '이불을 턱까지 덮거나 얼굴을 가리지 마세요.'],
            ['관련', '안전수면·과열 안내를 참고하세요.']
        ],
        links: [
            ['1세 미만 안전수면 가이드', 'blog/baby-safe-sleep-guide.html'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'sleep-room-overheat-boundary',
        match: /(수면\s*방\s*더위|아기\s*방\s*온도\s*높|sleep\s*overheat|재울\s*때\s*더움|땀\s*흘리며\s*잠|수면\s*중\s*온도)/,
        title: '수면 환경이 너무 더우면 옷·이불을 줄이고, 과열 신호를 보세요',
        lead: '과열은 안전수면 위험 요인으로 거론됩니다. 정확한 한 온도만 강요하지 않고 편안·시원함을 봅니다.',
        points: [
            ['조절', '옷 겹, 통풍'],
            ['신호', '땀, 열감, 홍조']
        ],
        blocks: [
            ['지금 할 일', '목 뒤 온도로 더위를 느껴 보세요.'],
            ['하지 않을 일', '두꺼운 이불로 덮어 재우지 마세요.'],
            ['관련', '안전수면·과열 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'newborn-hat-indoors-boundary',
        match: /(신생아\s*모자\s*실내|실내\s*모자\s*재우|newborn\s*hat\s*indoors|모자\s*쓰고\s*재우\s*아기|실내\s*보넷)/,
        title: '실내에서 재울 때 모자는 과열 위험이 있어 보통 쓰지 않는 안내가 많습니다',
        lead: '의료 상황·저체온 우려는 의료진을 따르세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '과열 피하기'],
            ['수면', '등, 빈 침대']
        ],
        blocks: [
            ['지금 할 일', '목 뒤로 더위를 느껴 보세요.'],
            ['하지 않을 일', '두꺼운 모자로 재우지 마세요.'],
            ['관련', '안전수면·과열 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'loose-blanket-swaddle-danger-boundary',
        match: /(신생아\s*스와들\s*담요|헐렁한\s*담요\s*싸서\s*재우|담요\s*속싸개\s*대용|loose\s*blanket\s*swaddle)/,
        title: '헐렁한 담요로 대충 싸서 재우지 말고, 안전수면 원칙을 지키세요',
        lead: '질식·과열 위험이 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '등, 빈 침대'],
            ['금지', '헐렁한 침구']
        ],
        blocks: [
            ['지금 할 일', '수면 공간을 비우세요.'],
            ['하지 않을 일', '느슨한 담요를 얼굴 쪽에 두지 마세요.'],
            ['관련', '안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'safe-sleep-position',
        match: /(등\s*재우|안전\s*수면|엎어\s*재우|SIDS|영아돌연|동일\s*침구|범퍼)/,
        title: '1세 미만 잠은 등·별도 수면면·빈 공간이 기본입니다',
        lead: '모든 잠(낮잠·밤잠)을 등을 대고, 단단하고 평평한 별도 수면면에, 베개·이불·범퍼·인형·경사진 포지셔너 없이 재웁니다. 통잠을 위해 엎어 재우지 마세요.',
        points: [
            ['항상', '등 자세, 별도 수면면, 빈 수면 공간, 과열·연기 피하기'],
            ['피하기', '소파·성인 이불 속 동침, 수면 벨트·경사 쿠션']
        ],
        blocks: [
            ['지금 할 일', '잠자리를 한 번 비우고 등 재우기만 남겼는지 확인하세요.'],
            ['하지 않을 일', '모니터링 기기만 믿고 엎어 재우거나 느슨한 침구를 두지 마세요.'],
            ['더 보기', '상세 안전수면 가이드를 확인하세요.']
        ],
        links: [
            ['1세 미만 안전수면 가이드', 'blog/baby-safe-sleep-guide.html'],
            ['CDC 안전수면 원문', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'vitamin-d-missed-dose-boundary',
        match: /(비타민\s*d\s*까먹|비타민\s*디\s*까먹|vitamin\s*d\s*missed|비타민\s*d\s*빼먹|비타민d\s*하루\s*안)/,
        title: '비타민D를 하루 빼먹었다면 다음 일정은 의료진·표시 안내를 따르고, 임의로 두 배를 주지 마세요',
        lead: '용량은 여기서 정하지 않습니다. 과량도 위험할 수 있습니다.',
        points: [
            ['원칙', '표시·처방 준수'],
            ['금지', '임의 배량']
        ],
        blocks: [
            ['지금 할 일', '평소 복용 시각을 정해 보세요.'],
            ['하지 않을 일', '빼먹었다고 한꺼번에 많이 주지 마세요.'],
            ['관련', '비타민D 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['수유 가이드', 'blog/breastfeeding-guide.html']
        ]
    },
    {
        id: 'vitamin-d-drop-refusal-boundary',
        match: /(비타민\s*d\s*점적\s*거부|비타민\s*디\s*안\s*먹|vitamin\s*d\s*drop\s*refusal|비타민d\s*점적\s*거절)/,
        title: '비타민D 점적을 거부하면 의료진과 투여 방법을 상의하고 임의로 중단하지 마세요',
        lead: '용량은 처방·표시를 따릅니다.',
        points: [
            ['상담', '투여 방법'],
            ['금지', '무단 중단·배량']
        ],
        blocks: [
            ['지금 할 일', '진료 시 거부 상황을 말하세요.'],
            ['하지 않을 일', '두 배로 넣지 마세요.'],
            ['관련', '비타민D 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['수유 가이드', 'blog/breastfeeding-guide.html']
        ]
    },
    {
        id: 'vitamin-d-breastfed',
        match: /(비타민\s*d|비타민d|vitamin\s*d|디\s*비타민).*(모유|수유|아기|아이|먹)|모유.*(비타민|영양제)/,
        title: '모유 수유 아기의 비타민D는 의료진과 용량을 정합니다',
        lead: '완전 모유 수유 영아에게 비타민D 보충이 권고되는 경우가 많습니다. 다만 용량·제품은 아이 상태·지역 권고에 따라 의료진이 정합니다. 사이트에서 ml·IU 숫자를 제시하지 않습니다.',
        points: [
            ['상담', '담당 소아청소년과에 모유·혼합 수유 여부와 보충 필요를 확인하세요.'],
            ['주의', '여러 영양제를 겹쳐 먹이거나 성인 용량을 나눠 주지 마세요.']
        ],
        blocks: [
            ['지금 할 일', '다음 진료 때 “비타민D 보충이 필요한지”를 질문 목록에 적으세요.'],
            ['하지 않을 일', '카페 추천 용량·직구 제품 후기만으로 용량을 정하지 마세요.'],
            ['진료·상담', '과량 섭취 의심(구토·변비·처짐 등) 시 진료받으세요.']
        ],
        links: [
            ['CDC 영아 비타민D 개요', 'https://www.cdc.gov/nutrition/infantandtoddlernutrition/vitamins-minerals/vitamin-d.html'],
            ['질병관리청 모유 수유', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586']
        ]
    },
    {
        id: 'solitary-pretend-play-boundary',
        match: /(상상\s*놀이\s*혼자)/,
        title: '혼자 상상 놀이는 흔할 수 있으나, 또래 접촉이 전무하고 퇴행이 심하면 상담을 검토하세요',
        lead: '상상 친구 자체만으로 문제로 단정하지 않습니다.',
        points: [
            ['관찰', '사회성, 언어'],
            ['상담', '급격한 위축']
        ],
        blocks: [
            ['지금 할 일', '놀이에 잠시 함께 참여해 보세요.'],
            ['하지 않을 일', '상상을 거짓말이라며 혼내지 마세요.'],
            ['관련', '상상 친구 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#play']
        ]
    },
    {
        id: 'imaginary-friend-boundary',
        match: /(상상\s*친구|허구\s*친구|imaginary\s*friend|가상\s*친구|없는\s*친구와\s*대화)/,
        title: '상상 친구는 흔한 놀이일 수 있으며, 일상 기능이 괜찮다면 대개 걱정만으로 단정하지 않습니다',
        lead: '많은 아이가 상상 친구와 놉니다. 강제로 “없다”고 부수기보다 놀이를 인정하되, 현실 규칙(안전·예절)은 지키게 하세요. 환청·공포·일상 붕괴가 의심되면 진료를 검토합니다. 진단 단정은 하지 않습니다.',
        points: [
            ['관찰', '즐거움 vs 공포, 낮 기능, 수면'],
            ['대응', '놀이 인정, 안전 규칙, 과한 조롱 금지']
        ],
        blocks: [
            ['지금 할 일', '상상 친구 이야기를 짧게 들어 보세요.'],
            ['하지 않을 일', '“미쳤다”며 비웃지 마세요.'],
            ['관련', '분리불안·어둠 공포 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이·상상 개요', 'https://www.healthychildren.org/English/ages-stages/toddler/Pages/default.aspx'],
            ['CDC 아동 발달', 'https://www.cdc.gov/ncbddd/childdevelopment/']
        ]
    },
    {
        id: 'library-storytime-boundary',
        match: /(도서관\s*스토리|스토리타임|library\s*storytime|도서관\s*아기\s*프로그램|그림책\s*읽어주는\s*시간)/,
        title: '도서관 스토리타임은 짧게 적응하고, 아이가 힘들어하면 중간에 나와도 됩니다',
        lead: '새로운 공간·소리는 부담이 될 수 있습니다. 강제 착석보다 아이 신호를 보세요. 프로그램 순위는 하지 않습니다.',
        points: [
            ['적응', '짧게, 함께 앉기'],
            ['중단', '울음, 과자극']
        ],
        blocks: [
            ['지금 할 일', '출구 가까운 자리에 앉아 보세요.'],
            ['하지 않을 일', '울어도 끝까지 버티게 강요하지 마세요.'],
            ['관련', '분리불안·외출 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'daycare-dropoff-crying-boundary',
        match: /(등원\s*거부|등원\s*울음|daycare\s*drop\s*off\s*cry|어린이집\s*안\s*가|헤어질\s*때\s*울음)/,
        title: '등원 이별은 짧고 일관되게 하고, 몰래 사라지기보다 인사 후 떠나세요',
        lead: '적응 기간 울음은 흔할 수 있습니다. 지속되는 공포·신체 증상이 있으면 상담하세요.',
        points: [
            ['이별', '짧게, 같은 루틴'],
            ['피하기', '몰래 나가기, 긴 설득']
        ],
        blocks: [
            ['지금 할 일', '같은 인사 말을 정해 보세요.'],
            ['하지 않을 일', '울음이 멈출 때까지 몇 시간 붙잡지 마세요.'],
            ['관련', '분리불안 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['분리불안 안내', '#home']
        ]
    },
    {
        id: 'new-school-year-anxiety-boundary',
        match: /(새\s*학기\s*불안|개학\s*불안|new\s*school\s*year\s*anxiety|입학\s*스트레스|새\s*학년\s*울음)/,
        title: '새 학기 불안에는 루틴·짧게 이별·수면을 돕고, 지속되면 학교·의료진과 상담하세요',
        lead: '적응 기간 울음은 흔할 수 있습니다. 신체 증상·등교 거부가 길면 도움을 요청하세요.',
        points: [
            ['도움', '루틴, 짧은 이별'],
            ['상담', '지속 거부, 복통·두통 반복']
        ],
        blocks: [
            ['지금 할 일', '등원 전 루틴을 미리 연습하세요.'],
            ['하지 않을 일', '몰래 떠나지 마세요.'],
            ['관련', '분리불안·등원 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['분리불안', '#home']
        ]
    },
    {
        id: 'daycare-adjustment-weeks-boundary',
        match: /(어린이집\s*적응\s*기간|어린이집\s*적응\s*기간|적응\s*울음\s*몇\s*주|daycare\s*adjustment\s*period)/,
        title: '어린이집 적응 울음은 일정 기간 흔할 수 있으나, 지속되는 공포·신체 증상은 상담하세요',
        lead: '이별은 짧고 일관되게 하세요.',
        points: [
            ['이별', '짧게, 루틴'],
            ['상담', '지속 거부']
        ],
        blocks: [
            ['지금 할 일', '같은 인사 말을 쓰세요.'],
            ['하지 않을 일', '몰래 사라지지 마세요.'],
            ['관련', '분리불안 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['분리불안', '#home']
        ]
    },
    {
        id: 'separation-anxiety',
        match: /(분리\s*불안|어린이집|유치원).*(적응|울|떼|거부)|엄마\s*떨어|헤어질\s*때\s*울|등원\s*거부/,
        title: '분리 불안·등원 울음은 흔하고, 같은 마감 기간은 없습니다',
        lead: '많은 아이가 보호자와 떨어질 때 울고 매달리며, 어린이집 적응에도 시간이 걸립니다. “○일이면 무조건 적응” 같은 마감선은 없습니다. 짧은 인사, 예측 가능한 루틴, 기관과 협력하되 아이 상태·학대 징후는 따로 봅니다.',
        points: [
            ['도움이 되는 것', '같은 작별 인사, 짧고 확실한 헤어짐, 픽업 시간 지키기, 선생님이 이름을 불러 주는 안정'],
            ['상담', '식사·수면이 무너지고 장기간 극심한 공포, 이전 기술 상실, 학대·괴롭힘 의심']
        ],
        blocks: [
            ['지금 할 일', '등원 전 루틴을 짧게 고정하고, 기관에 달래는 방법을 공유하세요.'],
            ['하지 않을 일', '몰래 사라지기, “울면 안 데리러 와” 협박, 적응 실패로 자책만 하기'],
            ['경계', '시설 규정·질병 유행기 등원은 기관·보건 안내를 따릅니다.']
        ],
        links: [
            ['CDC 유아 긍정적 양육', 'https://www.cdc.gov/parenting-toddlers/about/index.html'],
            ['발달 걱정이 함께일 때', 'blog/development-kdst-guide.html#act']
        ]
    },
    {
        id: 'oven-door-climb-burn',
        match: /(오븐\s*문\s*올라|오븐\s*손잡이\s*잡고|oven\s*door\s*climb|오븐\s*화상\s*아이|오븐\s*앞에\s*서)/,
        title: '오븐 문·손잡이에 올라타거나 기대지 않게 하고, 사용 중·직후 접근을 막으세요',
        lead: '오븐 문은 뜨겁고, 문을 열고 올라타면 전복·화상 위험이 있습니다. 사용 중에는 아이 접근을 막고, 식기 전까지 문을 만지지 않게 하세요. 스토브 손잡이 커버와 함께 주방을 관리합니다. 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '주방 문 차단, 오븐 사용 중 감독, 식힘 확인'],
            ['위험', '화상, 문 전복, 뜨거운 트레이']
        ],
        blocks: [
            ['지금 할 일', '오븐 앞에 발판·의자가 있는지 치우세요.'],
            ['하지 않을 일', '뜨거운 오븐 문을 장난감 선반처럼 쓰지 마세요.'],
            ['관련', '가스레인지·화상·주방 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'dishwasher-door-climb-safety',
        match: /(식기세척기\s*문\s*올라|dishwasher\s*door|식세기\s*문\s*타|식기세척기\s*열고\s*올라)/,
        title: '식기세척기 열린 문에 올라가거나 매달리지 않게 하세요',
        lead: '열린 식기세척기 문은 디딤대가 되어 추락·끼임·화상(뜨거운 식기) 위험이 있습니다. 사용 후 문을 닫고, 아이들이 열고 올라타지 않게 하세요. 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '문 닫기, 주방 감독, 세제는 잠금'],
            ['위험', '추락, 문 끼임, 뜨거운 식기']
        ],
        blocks: [
            ['지금 할 일', '식세기 문이 열린 채 방치되지 않는지 확인하세요.'],
            ['하지 않을 일', '열린 문을 발판 삼아 싱크대에 올라가게 두지 마세요.'],
            ['관련', '오븐 문·세제·주방 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 부상 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC 주방 안전', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'toaster-oven-child-safety',
        match: /(토스터\s*오븐|toaster\s*oven|전기\s*오븐\s*화상|미니\s*오븐\s*아이)/,
        title: '토스터 오븐은 외부가 뜨거울 수 있어 손이 닿지 않게 하고 문을 열 때 주의하세요',
        lead: '문·본체 화상과 넘어뜨림이 납니다. 카운터 가장자리와 코드를 관리하세요.',
        points: [
            ['사용', '감독, 식힌 뒤'],
            ['금지', '혼자 조작']
        ],
        blocks: [
            ['지금 할 일', '사용 중·직후 아이가 만지지 않게 하세요.'],
            ['하지 않을 일', '문을 열고 내부를 만지게 두지 마세요.'],
            ['관련', '화상·주방 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'coffee-maker-burn-boundary',
        match: /(커피머신\s*화상|커피포트\s*아이|coffee\s*maker\s*burn|드립\s*커피\s*아기|온수\s*포트\s*아이)/,
        title: '커피머신·전기포트는 아이 손이 닿지 않게 두고, 뜨거운 물·김을 조심하세요',
        lead: '뜨거운 음료 화상은 흔합니다. 손잡이·코드를 가장자리에 두지 마세요.',
        points: [
            ['배치', '안쪽, 코드 정리'],
            ['사용', '아이 옆에 두지 않기']
        ],
        blocks: [
            ['지금 할 일', '포트는 조리대 안쪽에 두세요.'],
            ['하지 않을 일', '아이를 무릎에 앉히고 뜨거운 커피를 들지 마세요.'],
            ['관련', '화상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'induction-residual-heat-boundary',
        match: /(인덕션\s*잔열|인덕션\s*뜨거|induction\s*hot\s*surface|전기레인지\s*잔열\s*아이)/,
        title: '인덕션·전기 레인지는 끈 뒤에도 잔열이 있을 수 있어 아이가 만지지 않게 하세요',
        lead: '표면이 식을 때까지 접근을 막으세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['확인', '잔열 표시, 차단'],
            ['금지', '바로 만지기']
        ],
        blocks: [
            ['지금 할 일', '요리 후 주방을 비울 때 아이를 막으세요.'],
            ['하지 않을 일', '잔열이 있을 때 장난감을 올리지 마세요.'],
            ['관련', '주방 화상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'stove-knob-safety',
        match: /(가스레인지\s*손잡이|레인지\s*노브|stove\s*knob|가스\s*불\s*아이|주방\s*불\s*잠금|쿡탑\s*손잡이)/,
        title: '가스레인지·쿡탑 손잡이는 아이 손이 닿지 않게 하고, 손잡이 커버를 검토하세요',
        lead: '아이들이 손잡이를 돌려 불을 켜거나 화상을 입을 수 있습니다. 요리 중 아이를 주방에 두지 말고, 손잡이 잠금·커버·뒤쪽 화구 사용 등 가정에 맞는 방법을 쓰세요. 특정 커버 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '손잡이 잠금, 냄비 손잡이 안쪽, 아이 주방 출입 제한'],
            ['비상', '화상 시 흐르는 찬물, 심한 화상은 응급']
        ],
        blocks: [
            ['지금 할 일', '손잡이 높이와 아이 손이 닿는지 확인하세요.'],
            ['하지 않을 일', '불을 켠 채 주방을 비우지 마세요.'],
            ['관련', '화상·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 화상', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Preventing-Burns-at-Home.aspx']
        ]
    },
    {
        id: 'herbal-tea-infant-boundary',
        match: /(허브\s*티\s*아기|허브차\s*영아|캐모마일\s*아기|chamomile\s*baby|한방차\s*아기|약초\s*차\s*영아)/,
        title: '영아에게 허브차·민간 약초 음료를 치료 목적으로 임의로 주지 마세요',
        lead: '캐모마일 등 허브차는 성분·오염·알레르기·보툴리눔(꿀 혼합) 위험이 있을 수 있습니다. “배가 아파서” 민간으로 먹이지 말고, 필요하면 의료진과 상의하세요. 용량·브랜드 추천은 하지 않습니다.',
        points: [
            ['경계', '검증 안 된 약초, 꿀 혼합, 성인 차 소분'],
            ['우선', '수유·수분·위험 신호 시 진료']
        ],
        blocks: [
            ['지금 할 일', '먹이려던 차 성분표를 확인하세요.'],
            ['하지 않을 일', '해외 직구 약초 분말을 임의로 타 주지 마세요.'],
            ['관련', '꿀 금지·그라이프 워터·배앓이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영아 음료·안전 개요', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/default.aspx'],
            ['CDC 영아 영양', 'https://www.cdc.gov/infant-toddler-nutrition/']
        ]
    },
    {
        id: 'simethicone-gas-drops-boundary',
        match: /(시메티콘|가스\s*드롭|simethicone|배앓이\s*방울|가스\s*약\s*아기|풍\s*약\s*영아)/,
        title: '가스 드롭(시메티콘 등)은 효과를 보장하지 않으며, 용량·제품은 의료진·표시를 따르세요',
        lead: '배앓이에 가스 방울약을 찾는 질문이 많지만, 모든 아기에게 필수는 아니고 효과가 개인마다 다릅니다. 용량·브랜드 순위·“먹으면 바로 낫는다” 단정은 하지 않습니다. 심한 울음·탈수·발열은 진료가 우선입니다.',
        points: [
            ['경계', '성인 약 소분, 표시 연령 무시'],
            ['우선', '트림·안고 달래기, 위험 신호 시 진료']
        ],
        blocks: [
            ['지금 할 일', '제품 표시 월령과 용법을 확인하세요.'],
            ['하지 않을 일', '여러 가스약을 한꺼번에 섞어 주지 마세요.'],
            ['관련', '배앓이·그라이프 워터·탈수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 배앓이 개요', 'https://www.healthychildren.org/English/ages-stages/baby/crying-colic/Pages/default.aspx'],
            ['CDC 영아 영양·케어 개요', 'https://www.cdc.gov/infant-toddler-nutrition/']
        ]
    },
    {
        id: 'gripe-water-boundary',
        match: /(그라이프\s*워터|그라이프워터|gripe\s*water|배앓이\s*물|콜릭\s*물약)/,
        title: '그라이프 워터 등은 배앓이 치료제로 단정하지 말고, 성분·연령을 의료진과 확인하세요',
        lead: '배앓이·가스에 쓰는 시판 “그라이프 워터”류는 성분·알코올·허브가 제품마다 다르고, 효과가 확실하지 않거나 해로울 수 있습니다. 용량·브랜드 추천은 하지 않으며, 심한 울음·탈수·발열은 진료가 우선입니다.',
        points: [
            ['경계', '민간·수입 제품 성분 불명, 치료 단정 금지'],
            ['우선', '수유·트림·안고 달래기, 위험 신호 시 진료']
        ],
        blocks: [
            ['지금 할 일', '먹이려던 제품 성분표와 월령 표시를 확인하세요.'],
            ['하지 않을 일', '성인·해외 후기만 보고 임의 용량을 주지 마세요.'],
            ['관련', '배앓이·트림·탈수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 배앓이 개요', 'https://www.healthychildren.org/English/ages-stages/baby/crying-colic/Pages/default.aspx'],
            ['CDC 영아 영양·안전 개요', 'https://www.cdc.gov/infant-toddler-nutrition/']
        ]
    },
    {
        id: 'probiotic-infant-boundary',
        match: /(프로바이오틱\s*아기|유산균\s*아기|probiotic\s*infant|영아\s*유산균|아기\s*유산균|유아\s*유산균)/,
        title: '영아 유산균·프로바이오틱은 “필수”로 단정하지 말고, 필요 여부는 의료진과 상의하세요',
        lead: '배앓이·변비·설사에 유산균을 찾는 질문이 많지만, 모든 아기에게 필수는 아니며 제품·균주·용량이 다릅니다. 효과 보장·브랜드 순위·용량을 사이트에서 정하지 않습니다. 미숙아·면역 저하·심한 증상은 진료가 우선입니다.',
        points: [
            ['경계', '광고 “국민템”, 성인 제품 임의 소분'],
            ['우선', '수유·수분·위험 신호 확인, 의료진 상담']
        ],
        blocks: [
            ['지금 할 일', '지금 주는 제품의 월령·균주 표시를 확인하세요.'],
            ['하지 않을 일', '여러 유산균을 한꺼번에 섞어 주지 마세요.'],
            ['관련', '배앓이·설사·탈수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 배앓이·장 건강 개요', 'https://www.healthychildren.org/English/ages-stages/baby/crying-colic/Pages/default.aspx'],
            ['CDC 영아 영양 개요', 'https://www.cdc.gov/infant-toddler-nutrition/']
        ]
    },
    {
        id: 'gas-colic-comfort',
        match: /(배앓이|배에\s*가스|가스\s*차|장\s*가스|방귀|콜릭|colic|저녁마다\s*울|한없이\s*울|보챔.*저녁)/,
        title: '오래 우는 배앓이형 울음은 원인 하나가 아니고 달래기와 진료 경계를 봅니다',
        lead: '생후 초기 몇 개월 저녁에 오래 우는 일이 있을 수 있습니다. “특효 제품”은 없습니다. 배고픔·트림·더위·피곤·통증을 살피고, 달래기 루틴을 쓰되 열이 있거나 토·혈변·처짐이 있으면 진료합니다.',
        points: [
            ['달래기', '안고 걷기, 흰 소음, 수유·트림 확인, 보호자 교대 휴식'],
            ['진료', '발열, 담즙성 구토, 혈변, 부은 배, 깨우기 어려움, 성장 정체']
        ],
        blocks: [
            ['지금 할 일', '울음 시간대·수유·대변을 3일간 간단히 적으세요.'],
            ['하지 않을 일', '흔들 아기 증후군이 될 정도로 흔들거나, 검증 안 된 차·약초를 먹이지 마세요.'],
            ['보호자', '지치면 아기를 안전한 곳에 두고 잠시 숨을 고른 뒤 도움을 요청하세요.']
        ],
        links: [
            ['AAP 콜릭·울음 안내', 'https://www.healthychildren.org/English/ages-stages/baby/crying-colic/Pages/Colic.aspx'],
            ['부모 마음건강 연결', '#parent-health']
        ]
    },
    {
        id: 'umbilical-hernia-boundary',
        match: /(배꼽\s*탈장|제대\s*탈장|배꼽\s*볼록|울\s*때\s*배꼽|umbilical\s*hernia)/,
        title: '배꼽이 볼록해 보이는 탈장은 흔한 편이며, 끼임·통증·색 변화가 있으면 진료합니다',
        lead: '영아 배꼽 탈장은 울 때 더 볼록해 보일 수 있고 많은 경우 경과를 봅니다. 테이프·동전으로 누르는 민간 요법은 권하지 않습니다. 단단히 끼인 듯 아프고, 토하고, 색이 변하면 응급 평가가 필요합니다. 수술 시점은 의료진이 정합니다.',
        points: [
            ['관찰', '크기 변화, 통증, 환원 여부'],
            ['바로 진료', '끼임 의심, 구토, 처짐, 보라·검은 색']
        ],
        blocks: [
            ['지금 할 일', '언제 볼록해지는지·아픈지 기록하세요.'],
            ['하지 않을 일', '배꼽을 동전·테이프로 누르지 마세요.'],
            ['관련', '탯줄 안내를 참고하세요.']
        ],
        links: [
            ['AAP 배꼽 탈장', 'https://www.healthychildren.org/English/ages-stages/baby/Pages/Umbilical-Cord-Care-and-Umbilical-Hernia.aspx'],
            ['탯줄 안내', '#home']
        ]
    },
    {
        id: 'fontanelle-soft-spot',
        match: /(천문|숨구멍|대천문|솟은\s*숨|들어간\s*숨|숨\s*구멍|fontanelle|소프트\s*스팟)/,
        title: '천문(숨구멍)은 평소 부드럽게 느껴질 수 있고, 볼록·오목과 전신을 함께 봅니다',
        lead: '아기 머리 천문은 아직 뼈가 닫히기 전 부드러운 부분입니다. 평소 약간 맥동하거나 부드럽게 만져질 수 있습니다. 심하게 볼록하고 처지거나, 깊게 들어가며 수분 섭취가 나쁘면 탈수·다른 문제 가능으로 진료를 우선합니다. 만지며 진단하거나 민간으로 “닫히게” 누르지 마세요.',
        points: [
            ['관찰', '평소 모습과 비교, 열·구토·처짐·소변량'],
            ['진료', '갑자기 크게 볼록, 깊게 오목+탈수 신호, 경련·깨우기 어려움']
        ],
        blocks: [
            ['지금 할 일', '수유·소변·열·보챔을 함께 기록하세요.'],
            ['하지 않을 일', '천문을 세게 누르거나 민간 약으로 “닫히게” 하지 마세요.'],
            ['관련', '탈수·발열 안내를 참고하세요.']
        ],
        links: [
            ['NHS 천문(숨구멍)', 'https://www.nhs.uk/conditions/baby/babys-development/babys-appearance/the-soft-spot-on-your-babys-head-fontanelle/'],
            ['AAP 아기 머리·천문 개요', 'https://www.healthychildren.org/English/ages-stages/baby/Pages/default.aspx'],
            ['탈수 신호 안내', '#home']
        ]
    },
    {
        id: 'foreskin-care-boundary',
        match: /(포피|귀두\s*껍질|포피\s*벗|포피\s*뒤집|포피\s*끼|포피\s*관리|foreskin|억지로\s*포피)/,
        title: '포피는 억지로 젖히지 말고, 겉만 부드럽게 씻습니다',
        lead: '자연 상태의 포피는 어릴 때 귀두와 붙어 있는 경우가 많고, 억지로 젖히면 통증·균열·감염이 날 수 있습니다. 목욕 때 겉을 부드럽게 씻고, 빨개짐·부종·소변 이상·고름이 있으면 진료하세요. 수술·약 처방은 의료진이 정합니다.',
        points: [
            ['관리', '겉 세척, 억지 견인 금지, 기저귀 청결'],
            ['진료', '부종·통증·소변 줄기 이상·발열']
        ],
        blocks: [
            ['지금 할 일', '씻을 때 힘주지 않고 물로만 겉을 헹구세요.'],
            ['하지 않을 일', '매일 포피를 강제로 뒤집지 마세요.'],
            ['관련', '목욕·기저귀 발진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 포피 관리', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/Care-for-an-Uncircumcised-Penis.aspx'],
            ['NHS 포피 위생(영)', 'https://www.nhs.uk/conditions/phimosis/']
        ]
    },
    {
        id: 'umbilical-cord-bath-boundary',
        match: /(탯줄\s*떨어지기\s*전\s*목욕|탯줄\s*있을\s*때\s*목욕|umbilical\s*cord\s*bath|배꼽\s*안\s*떨어진\s*목욕)/,
        title: '탯줄이 떨어지기 전 목욕은 의료진 안내를 따르고, 배꼽을 깨끗·건조하게 유지하세요',
        lead: '지역·병원 지침이 다를 수 있습니다. 빨강·고름·냄새면 진료하세요. 소독약 용량은 단정하지 않습니다.',
        points: [
            ['관리', '건조, 청결'],
            ['진료', '감염 징후']
        ],
        blocks: [
            ['지금 할 일', '퇴원 안내의 목욕 방법을 확인하세요.'],
            ['하지 않을 일', '배꼽을 억지로 잡아당기지 마세요.'],
            ['관련', '탯줄 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['목욕 가이드', 'blog/baby-bath-guide.html']
        ]
    },
    {
        id: 'umbilical-granuloma-boundary',
        match: /(배꼽\s*육아종|배꼽\s*살\s*톡|umbilical\s*granuloma|배꼽\s*분홍\s*살점|탯줄\s*후\s*살)/,
        title: '배꼽에 분홍 살점·진물이 계속되면 자가 처치보다 진료를 검토하세요',
        lead: '감염 징후(냄새·빨강·열)면 빨리 연락하세요. 약 처치는 의료진을 따르세요.',
        points: [
            ['관찰', '진물, 냄새, 빨강'],
            ['금지', '임의 부식 처치']
        ],
        blocks: [
            ['지금 할 일', '청결·건조를 유지하세요.'],
            ['하지 않을 일', '집에서 화학 약품을 바르지 마세요.'],
            ['관련', '탯줄 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['탯줄 안내', '#home']
        ]
    },
    {
        id: 'umbilical-alcohol-wipe-boundary',
        match: /(배꼽\s*소독\s*알코올|배꼽\s*알코올\s*소독|탯줄\s*알코올|umbilical\s*alcohol\s*wipe)/,
        title: '탯줄·배꼽 소독 방법은 병원 안내를 따르고, 임의 강한 소독을 반복하지 마세요',
        lead: '감염 징후면 진료하세요. 약 용량은 단정하지 않습니다.',
        points: [
            ['원칙', '병원 안내'],
            ['진료', '냄새, 빨강, 열']
        ],
        blocks: [
            ['지금 할 일', '퇴원 안내를 확인하세요.'],
            ['하지 않을 일', '가정 민간 요법을 과신하지 마세요.'],
            ['관련', '탯줄 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['탯줄 안내', '#home']
        ]
    },
    {
        id: 'umbilical-stump',
        match: /(탯줄|배꼽\s*자국|배꼽\s*관리|탯줄\s*떨어|옴파로)/,
        title: '탯줄은 건조하게 두고, 고름·냄새·발열이 있으면 진료합니다',
        lead: '떨어진 뒤에도 배꼽 주위를 깨끗하고 건조하게 유지합니다. 알코올을 과도하게 문지르라는 옛 습관보다 의료진이 안내한 청결·건조를 따릅니다. 빨갛게 퍼지거나 고름·냄새가 심하고 열이 나면 진료하세요.',
        points: [
            ['관리', '기저귀가 배꼽을 누르지 않게 접고, 씻은 뒤 잘 말립니다.'],
            ['진료', '주변이 빨갛게 퍼짐, 고름·악취, 출혈이 계속, 발열·처짐']
        ],
        blocks: [
            ['지금 할 일', '목욕·기저귀 후 배꼽이 젖은 채로 두지 마세요.'],
            ['하지 않을 일', '민간 가루·이물질을 배꼽에 바르지 마세요.'],
            ['진료·상담', '의심되면 신생아 담당 의료진에게 보이세요.']
        ],
        links: [
            ['AAP 배꼽 관리 안내', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/Umbilical-Cord-Care.aspx']
        ]
    },
    {
        id: 'milk-supply-enough',
        match: /(젖\s*양|젖양|모유\s*부족|젖이\s*부족|잘\s*먹고\s*있|충분히\s*먹|파워\s*펌핑|유축\s*양|젖\s*부족)/,
        title: '젖양은 한 번의 유축량보다 기저귀·성장·먹는 신호로 봅니다',
        lead: '유축 병에 나온 양만으로 “부족”이라고 단정하지 않습니다. 생후 며칠 이후 하루 젖은 기저귀가 충분히 나오고, 체중이 늘며, 수유 뒤 만족해 보이면 대체로 잘 먹고 있는 신호입니다. 부족이 걱정되면 수유 상담·의료진과 확인하세요.',
        points: [
            ['잘 먹는 신호', '규칙적으로 젖은 기저귀, 대변, 수유 중 삼키는 소리, 수유 후 이완, 성장 추이'],
            ['점검이 필요', '소변이 매우 줄고, 처지며, 수유마다 오래 울고, 체중이 늘지 않음']
        ],
        blocks: [
            ['지금 할 일', '24시간 수유 횟수·젖은 기저귀·최근 체중을 적어 주세요.'],
            ['하지 않을 일', '카페 “파워펌핑 표”나 분유 보충을 임의로 고정 규칙처럼 적용하지 마세요. 보충이 필요하면 의료진 계획을 따릅니다.'],
            ['진료·상담', '출생 체중 회복이 늦거나 황달·탈수 징후가 있으면 바로 진료받으세요.']
        ],
        links: [
            ['AAP 충분히 먹는지 신호', 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/How-to-Tell-if-Baby-is-Getting-Enough-Milk.aspx'],
            ['질병관리청 모유 수유', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586'],
            ['수유량·간격 안내', '#home']
        ]
    },
    {
        id: 'breastmilk-refreeze-boundary',
        match: /(모유\s*해동\s*재냉동)/,
        title: '해동한 모유를 다시 얼리는 것은 피하고, 보관·해동 안내는 표준·의료진을 따르세요',
        lead: '시간·온도 규칙은 기관 안내를 확인하세요. 여기서 임의 시간을 단정하지 않습니다.',
        points: [
            ['원칙', '해동 후 재냉동 자제'],
            ['위생', '라벨, 오래된 것']
        ],
        blocks: [
            ['지금 할 일', '해동 시각을 적어두세요.'],
            ['하지 않을 일', '실온에 오래 둔 것을 다시 얼리지 마세요.'],
            ['관련', '모유 보관 안내를 참고하세요.']
        ],
        links: [
            ['수유 가이드', 'blog/breastfeeding-guide.html'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'breast-milk-storage',
        match: /(모유).*(보관|냉동|냉장|해동|저장)|유축.*(보관|냉동)|냉동\s*모유|모유\s*냉장고/,
        title: '모유 보관은 실온·냉장·냉동 시간과 재냉동 금지를 지킵니다',
        lead: 'CDC 안내 기준으로, 갓 짜낸 모유는 실온(약 25℃ 이하) 최대 4시간, 냉장 최대 4일, 냉동은 6개월이 가장 좋고 최대 12개월까지 가능하다고 안내합니다. 해동한 모유는 다시 냉동하지 않습니다.',
        points: [
            ['보관', '냉장고·냉동고 문쪽이 아닌 안쪽, 소량 분병, 날짜 표시'],
            ['해동·수유', '해동 후 냉장 24시간 이내 사용, 수유 후 남은 것은 2시간 이내 사용 후 버림']
        ],
        blocks: [
            ['지금 할 일', '보관 위치와 날짜 라벨을 확인하고, 해동은 미지근한 물·냉장 해동을 쓰세요.'],
            ['하지 않을 일', '전자레인지로 데우거나(뜨거운 점), 완전히 해동된 모유를 다시 얼리지 마세요.'],
            ['참고', '미숙아·입원 아기는 병원 지침이 우선입니다.']
        ],
        links: [
            ['CDC 모유 보관·준비', 'https://www.cdc.gov/breastfeeding/breast-milk-preparation-and-storage/handling-breastmilk.html']
        ]
    },
    {
        id: 'evening-cluster-feeding-boundary',
        match: /(저녁\s*몰아\s*수유|초저녁\s*클러스터\s*수유|evening\s*cluster\s*feed|해질\s*녘\s*몰아\s*수유)/,
        title: '초저녁 몰아 수유는 흔할 수 있으나, 탈수·체중·황달 걱정이 있으면 진료하세요',
        lead: '정상 패턴과 문제 수유를 구분이 필요합니다. 수유량 숫자를 여기서 단정하지 않습니다.',
        points: [
            ['관찰', '소변, 체중, 처짐'],
            ['지원', '수유 상담']
        ],
        blocks: [
            ['지금 할 일', '낮 수유 횟수와 소변을 기록하세요.'],
            ['하지 않을 일', '울 때마다 무조건 보충 분유를 정답으로 보지 마세요.'],
            ['관련', '클러스터 수유 안내를 참고하세요.']
        ],
        links: [
            ['수유 가이드', 'blog/breastfeeding-guide.html'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'growth-spurt-feeding-boundary',
        match: /(성장\s*급등\s*수유|그로쓰\s*스퍼트\s*수유|growth\s*spurt\s*feed|갑자기\s*수유\s*늘|급성장\s*배고파)/,
        title: '갑자기 수유가 늘 수 있으나, 탈수·체중 감소·처짐이 있으면 진료하세요',
        lead: '모든 보챔이 성장 급등은 아닙니다. 수유량 숫자를 여기서 단정하지 않습니다.',
        points: [
            ['관찰', '소변, 체중, 처짐'],
            ['지원', '수유 상담']
        ],
        blocks: [
            ['지금 할 일', '수유·소변 기록을 남기세요.'],
            ['하지 않을 일', '인터넷 개월표만 보고 단정하지 마세요.'],
            ['관련', '클러스터·성장 안내를 참고하세요.']
        ],
        links: [
            ['수유 가이드', 'blog/breastfeeding-guide.html'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'cluster-feeding',
        match: /(클러스터|몰아\s*수유|연속\s*수유|자주\s*보챔.*수유|저녁.*계속\s*먹|수유\s*텀이\s*짧)/,
        title: '짧은 간격으로 자주 먹는 몰아 수유는 초기에 흔할 수 있습니다',
        lead: '특히 저녁에 자주 찾고 텀이 짧아지는 것은 많은 아기에게 나타납니다. 그 자체만으로 젖이 부족하다고 단정하지 않습니다. 다만 소변·체중·처짐을 함께 보고, 성장이 안 되면 진료합니다.',
        points: [
            ['할 일', '배고픔 신호에 맞춰 먹이고, 보호자도 물·휴식을 챙깁니다.'],
            ['점검', '젖은 기저귀 감소, 체중 정체, 지속 처짐·황달 악화']
        ],
        blocks: [
            ['지금 할 일', '24시간 수유 패턴과 기저귀를 기록하세요.'],
            ['하지 않을 일', '몰아 수유를 “고장”으로 보고 분유를 임의로 고정 추가하지 마세요.'],
            ['진료·상담', '수유 통증이 심하거나 유선염 의심·성장 걱정이 있으면 상담하세요.']
        ],
        links: [
            ['CDC 수유 빈도·양', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/how-much-and-how-often.html'],
            ['질병관리청 모유 수유', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586']
        ]
    },
    {
        id: 'energy-drink-child-boundary',
        match: /(에너지\s*음료\s*아이|에너지드링크\s*아이|energy\s*drink\s*child|카페인\s*음료\s*아이|고카페인\s*아이)/,
        title: '에너지 음료는 어린이·청소년에게 권하지 않으며, 카페인 과다 위험이 있습니다',
        lead: '에너지 음료는 카페인·다른 자극 성분이 많아 어린이에게 권장되지 않습니다. 심장 두근거림·불면·초조·탈수 등이 나타날 수 있습니다. “공부·운동 필수” 광고를 따르지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '어린이·청소년 에너지 음료 피하기, 물·우유 우선'],
            ['상담', '많이 마신 뒤 가슴 두근거림·구토·탈수']
        ],
        blocks: [
            ['지금 할 일', '집·차 안 에너지 음료를 아이 손이 닿지 않게 치우세요.'],
            ['하지 않을 일', '운동 전 “각성” 목적으로 주지 마세요.'],
            ['관련', '카페인 수유·스포츠음료 안내를 참고하세요.']
        ],
        links: [
            ['AAP 에너지 음료·카페인', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['CDC 카페인·청소년 개요', 'https://www.cdc.gov/nutrition/']
        ]
    },
    {
        id: 'sports-drink-when-boundary',
        match: /(평소\s*스포츠\s*음료|일상\s*이온\s*음료|sports\s*drink\s*everyday|평소에\s*이온\s*음료|평소\s*게토)/,
        title: '평소에는 물·우유를 우선하고, 스포츠음료는 의료·활동 상황에 맞게 검토하세요',
        lead: '일반 놀이에는 물이 기본입니다. 설사 탈수 시 ORS와 혼동하지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['평소', '물, 연령 맞는 우유'],
            ['특수', '의료진 지시, 장시간 운동']
        ],
        blocks: [
            ['지금 할 일', '평소 간식으로 스포츠음료를 주지 마세요.'],
            ['하지 않을 일', '탈수 때 임의로 진한 음료만 고집하지 마세요.'],
            ['관련', '주스·ORS 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/']
        ]
    },
    {
        id: 'sports-drink-toddler',
        match: /(스포츠\s*음료|이온\s*음료|에너지\s*음료|어린이\s*이온|게토\s*레|포카리)/,
        title: '평소 갈증에는 물·우유(연령에 맞게)를 우선하고, 스포츠·에너지 음료를 일상화하지 마세요',
        lead: '건강한 아이에게 일상적으로 스포츠 음료·에너지 음료를 주는 것은 권하지 않는 안내가 많습니다. 당·카페인·불필요한 전해질 섭취가 될 수 있습니다. 심한 설사·구토 등 의료 상황이 아니면 “이온 음료가 필수”라고 단정하지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['일상', '물, 연령에 맞는 우유·모유·조제유'],
            ['예외', '의료진이 탈수·운동 후 안내한 경우']
        ],
        blocks: [
            ['지금 할 일', '간식으로 스포츠 음료가 습관인지 점검하세요.'],
            ['하지 않을 일', '에너지 음료를 어린이에게 주지 마세요.'],
            ['관련', '주스·탈수·생우유 안내를 참고하세요.']
        ],
        links: [
            ['AAP 음료 안내', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/Choose-Water.aspx'],
            ['CDC 어린이 음료', 'https://www.cdc.gov/nutrition/data-statistics/sugar-sweetened-beverages-intake.html'],
            ['과일 주스 안내', '#home']
        ]
    },
    {
        id: 'unpasteurized-juice-boundary',
        match: /(비살균\s*주스|살균\s*안\s*된\s*주스|생\s*주스\s*아기|unpasteurized\s*juice|착즙\s*생주스|목장\s*생주스)/,
        title: '비살균 주스·착즙 생주스는 영유아에게 주지 마세요',
        lead: '살균하지 않은 과일·채소 주스는 세균 감염 위험이 있어 어린이·임산부에게 특히 위험할 수 있습니다. “신선·착즙”이라도 비살균이면 피하고, 시판 살균 표시를 확인하세요. 돌 전 주스 자체도 권고되지 않는 경우가 많습니다.',
        points: [
            ['피하기', '비살균·pasteurized 미표시 주스'],
            ['대안', '과일은 연령에 맞게 잘라 먹이기, 돌 전 주스 제한']
        ],
        blocks: [
            ['지금 할 일', '주스 라벨의 살균 여부를 확인하세요.'],
            ['하지 않을 일', '길거리 생착즙을 아기 물병으로 주지 마세요.'],
            ['관련', '주스·비살균 우유 안내를 참고하세요.']
        ],
        links: [
            ['CDC 비살균 주스 위험', 'https://www.cdc.gov/foodsafety/communication/juice.html'],
            ['FDA 주스 안전', 'https://www.fda.gov/food/buy-store-serve-safe-food/what-you-need-know-about-juice-safety'],
            ['주스 안내', '#home']
        ]
    },
    {
        id: 'sugar-sweet-limit-boundary',
        match: /(설탕\s*줄이|단\s*간식\s*제한|added\s*sugar|당분\s*섭취\s*아이|과자\s*얼마나|사탕\s*얼마나)/,
        title: '첨가당이 많은 음료·간식은 줄이고, “하루 몇 개” 광고 숫자만 따르지 마세요',
        lead: '어린이 식단에서 첨가당을 줄이는 것이 권장되는 경우가 많습니다. 물·우유·과일을 우선하고, 주스·탄산·단 간식을 습관화하지 마세요. 정확한 g 제한은 연령·지침·의료진 상담에 맡기며 사이트에서 용량을 정하지 않습니다.',
        points: [
            ['우선', '물, 우유(연령 맞을 때), 과일 원형'],
            ['줄이기', '가당 음료, 하루 종일 단 간식']
        ],
        blocks: [
            ['지금 할 일', '냉장고 속 가당 음료를 물로 바꿔 보세요.'],
            ['하지 않을 일', '울 때마다 사탕으로 달래지 마세요.'],
            ['관련', '주스·소금·설탕 이유식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 설탕·음료 개요', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['CDC 첨가당', 'https://www.cdc.gov/nutrition/data-statistics/added-sugars.html']
        ]
    },
    {
        id: 'juice-dilute-not-enough-boundary',
        match: /(유아\s*주스\s*희석)/,
        title: '주스를 물에 희석해도 평소 음료로 많이 주지 않는 편이 낫고, 물을 우선하세요',
        lead: '연령별 주스 안내는 표준을 보세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '물, 과일 자체'],
            ['제한', '과다 주스']
        ],
        blocks: [
            ['지금 할 일', '물 마시는 습관을 들이세요.'],
            ['하지 않을 일', '주스를 종일 물처럼 주지 마세요.'],
            ['관련', '주스 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['주스 안내', '#home']
        ]
    },
    {
        id: 'fruit-juice',
        match: /(주스|과일\s*즙|과즙).*(먹|주|언제|괜찮)|아기\s*주스|유아\s*주스/,
        title: '돌 전에는 과일 주스를 주지 않는 것이 권고입니다',
        lead: 'AAP는 생후 12개월 미만에게 과일 주스를 주지 말 것을 권고합니다. 주스는 모유·분유·물(개월에 맞게)을 대신하지 않으며, 당분·치아·포만 문제를 키울 수 있습니다. 돌 이후에도 양은 제한합니다.',
        points: [
            ['돌 전', '주스 대신 모유·영아용 조제유, 이유식 시기에는 과일 자체'],
            ['돌 이후', '주스보다 생과일을 우선하고, 과도한 주스를 피합니다.']
        ],
        blocks: [
            ['지금 할 일', '식단에서 주스·당 음료를 빼고 수유·물을 확인하세요.'],
            ['하지 않을 일', '설사·탈수 치료 목적으로 주스를 임의로 먹이지 마세요.'],
            ['진료', '성장·치아·설사가 걱정되면 의료진과 상의하세요.']
        ],
        links: [
            ['AAP 주스 권고 요약', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/Where-We-Stand-Fruit-Juice.aspx'],
            ['이유식 가이드', 'blog/complementary-feeding-allergy-guide.html']
        ]
    },
    {
        id: 'in-bed-sleeper-boundary',
        match: /(인베드\s*슬리퍼|침대\s*위\s*아기\s*침대|인\s*베드\s*슬리퍼|in[-\s]?bed\s*sleeper|bedside\s*sleeper|침대\s*부착\s*아기침대)/,
        title: '부모 침대 위·사이 넣는 인베드 슬리퍼는 질식·끼임 위험이 있어 권하지 않는 경우가 많습니다',
        lead: '침대 매트리스 위에 올리거나 성인 침대 사이에 끼우는 수면 제품은 기울어짐·끼임·부드러운 표면 위험이 보고된 바 있습니다. 아기는 별도 안전 기준을 충족한 요람·침대에서 등을 대고 재우는 편이 안전합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '바닥이 평평·단단한 단독 수면 공간'],
            ['주의', '성인 이불·베개·틈새, 기울어진 포켓형 제품']
        ],
        blocks: [
            ['지금 할 일', '아기 수면 공간이 평평하고 비어 있는지 확인하세요.'],
            ['하지 않을 일', '성인 침대 한가운데 패딩 제품에만 맡기고 잠들지 마세요.'],
            ['관련', '안전수면·같은 방 자기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['CPSC 유아 수면 제품', 'https://www.cpsc.gov/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'sofa-co-sleep-danger-boundary',
        match: /(소파\s*함께\s*잠|소파\s*함께\s*잠|소파\s*수유\s*잠|sofa\s*co\s*sleep|소파에서\s*아기\s*재우)/,
        title: '소파·armchair에서 아기와 함께 잠들지 마세요. 끼임·질식 위험이 큽니다',
        lead: '수유 중 졸리면 아기를 안전 수면 공간에 두세요.',
        points: [
            ['금지', '소파·리클라이너 공동 수면'],
            ['대안', '별도 침대 등']
        ],
        blocks: [
            ['지금 할 일', '수유 전 졸음을 인지하세요.'],
            ['하지 않을 일', '소파에 아기를 두고 잠들지 마세요.'],
            ['관련', '침대 공유·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'bed-sharing',
        match: /(같이\s*자|같은\s*침대|동일\s*침|한\s*침대|침대에서\s*자|배드\s*셰어|bed\s*shar|동침|부모\s*침대)/,
        title: '같은 침대에서 자기보다 같은 방·별도 수면면이 권고입니다',
        lead: 'AAP·CDC는 아기를 보호자와 같은 표면에서 재우지 말 것을 권고합니다. 첫 6개월(가능하면 1년)은 같은 방에서, 아기 전용 요람·침대 등 별도 수면면에 등 자세로 재우세요. 수유 중 졸리면 아기를 별도 수면면으로 옮깁니다.',
        points: [
            ['권고', '같은 방 + 별도 단단한 수면면 + 등 + 빈 공간'],
            ['특히 위험', '소파·이불 속, 흡연·음주·약물 후, 부드러운 침구, 4개월 미만']
        ],
        blocks: [
            ['지금 할 일', '아기 전용 수면 공간을 침대 옆에 두는지 확인하세요.'],
            ['하지 않을 일', '통잠을 위해 성인 이불 속에서 같이 자거나 소파에서 재우지 마세요.'],
            ['더 보기', '안전수면 전체 기준을 확인하세요.']
        ],
        links: [
            ['1세 미만 안전수면', 'blog/baby-safe-sleep-guide.html'],
            ['AAP 안전수면 안내', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/a-parents-guide-to-safe-sleep.aspx'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'pacifier-wean',
        match: /(쪽쪽이|공갈\s*젖|노리개\s*젖|pacifier).*(끊|떼|줄이|그만|졸업|중독)|쪽쪽이\s*(끊|떼)/,
        title: '쪽쪽이 줄이기는 서서히, 치아·수면·안전 끈을 함께 봅니다',
        lead: '끊는 시기는 가정마다 다릅니다. 낮에 덜 쓰는 시간부터 줄이고, 잠들 때만 남긴 뒤 천천히 떼는 방식이 흔합니다. 끈·클립을 목에 걸거나 단것을 묻혀 달래지 마세요. 치아 맞물림 걱정이 있으면 소아치과·의료진과 상의합니다.',
        points: [
            ['줄이기', '낮 사용부터 줄이기, 칭찬·다른 안정 수단(안아 주기·책)'],
            ['안전', '파손 쪽쪽이 교체, 목에 거는 끈 금지']
        ],
        blocks: [
            ['지금 할 일', '하루 중 쪽쪽이 쓰는 상황을 적어 한 구간부터 줄여 보세요.'],
            ['하지 않을 일', '갑작스러운 처벌·비교로 강요하지 마세요.'],
            ['관련', '쪽쪽이 수면 사용·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 안전수면·쪽쪽이', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/a-parents-guide-to-safe-sleep.aspx'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'pacifier-cord-danger',
        match: /(쪽쪽이\s*끈|공갈\s*젖꼭지\s*끈|쪽쪽이\s*클립|pacifier\s*clip|쪽쪽이\s*목\s*줄)/,
        title: '쪽쪽이 끈·긴 클립은 감김 위험이 있어 재울 때·혼자 둘 때 빼 두세요',
        lead: '쪽쪽이 자체는 재울 때 도움이 될 수 있지만, 목에 두르는 끈·긴 줄·장식 클립은 감김 위험이 있습니다. 재우거나 혼자 둘 때는 끈을 제거하고, 짧은 클립도 설명서를 지키세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['사용', '감독 아래, 재울 때 끈 제거'],
            ['금지', '긴 목걸이형, 여러 장식 알이 달린 줄']
        ],
        blocks: [
            ['지금 할 일', '침대·카시트에 쪽쪽이 끈이 걸쳐 있지 않은지 확인하세요.'],
            ['하지 않을 일', '끈 달린 채 재우지 마세요.'],
            ['관련', '쪽쪽이·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 쪽쪽이', 'https://www.healthychildren.org/English/ages-stages/baby/crying-colic/Pages/Pacifiers-and-Thumb-Sucking.aspx'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['쪽쪽이 안내', '#home']
        ]
    },
    {
        id: 'pacifier-cleaning-hygiene',
        match: /(쪽쪽이\s*소독|노리개\s*소독|pacifier\s*clean|쪽쪽이\s*씻|쪽쪽이\s*끓|노리개\s*위생)/,
        title: '쪽쪽이는 자주 씻고, 어른 입으로 빨아 닦지 않는 편이 낫습니다',
        lead: '쪽쪽이는 떨어지면 흐르는 물로 씻고, 제품 안내에 따라 소독하세요. 어른이 입으로 빨아 “깨끗이” 하는 습관은 세균을 옮길 수 있습니다. 손상·변색되면 교체합니다. 브랜드 추천은 하지 않습니다.',
        points: [
            ['위생', '흐르는 물, 정기 점검, 분실·더러워지면 교체'],
            ['경계', '입에 넣어 닦기, 단 음료에 찍어 주기']
        ],
        blocks: [
            ['지금 할 일', '금 가거나 끈적한 쪽쪽이가 있으면 버리세요.'],
            ['하지 않을 일', '꿀·잼을 발라 물리지 마세요.'],
            ['관련', '쪽쪽이 수면·끊기·꿀 금지 안내를 참고하세요.']
        ],
        links: [
            ['AAP 쪽쪽이 개요', 'https://www.healthychildren.org/English/ages-stages/baby/Pages/default.aspx'],
            ['CDC 손 씻기·위생', 'https://www.cdc.gov/handwashing/']
        ]
    },
    {
        id: 'pacifier-replace-wear-boundary',
        match: /(쪽쪽이\s*교체|쪽쪽이\s*찢어|pacifier\s*replace|노리개\s*젖꼭지\s*갈|쪽쪽이\s*수명|쪽쪽이\s*위생\s*교체)/,
        title: '쪽쪽이가 찢어지거나 변색되면 교체하고, 끈으로 목에 걸지 마세요',
        lead: '파손 조각 질식 위험이 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['점검', '찢김, 구멍, 변색'],
            ['금지', '목걸이 끈']
        ],
        blocks: [
            ['지금 할 일', '당겨 보았을 때 약하면 버리세요.'],
            ['하지 않을 일', '끈으로 목에 걸지 마세요.'],
            ['관련', '쪽쪽이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'paci-clip-length-boundary',
        match: /(쪽쪽이\s*줄\s*클립\s*길이|쪽쪽이\s*클립\s*길이|노리개\s*줄\s*길이|paci\s*clip\s*length|쪽쪽이\s*스트랩)/,
        title: '쪽쪽이 클립 줄이 너무 길면 감김 위험이 있어 짧게 유지하고 목에 걸지 마세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['길이', '짧게'],
            ['금지', '목 걸이']
        ],
        blocks: [
            ['지금 할 일', '줄 길이를 확인하세요.'],
            ['하지 않을 일', '목걸이형으로 쓰지 마세요.'],
            ['관련', '쪽쪽이 줄 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'pacifier-sleep',
        match: /(쪽쪽이|공갈\s*젖|노리개\s*젖|pacifier|고무\s*젖꼭지).*(재우|잠|언제|써|사용)|잠.*쪽쪽이/,
        title: '쪽쪽이는 재울 때 도움이 될 수 있고, 모유는 자리 잡은 뒤 시작합니다',
        lead: '낮잠·밤잠에 쪽쪽이를 물리면 SIDS 위험을 낮추는 데 도움이 될 수 있다고 안내됩니다. 모유 수유 중이면 수유가 안정된 뒤에 시작하는 편이 좋습니다. 끈·클립을 목에 걸거나 침구에 고정하지 마세요.',
        points: [
            ['사용', '잠들 때 물리고, 잠든 뒤 빠져도 억지로 다시 물리지 않아도 됩니다.'],
            ['모유', '젖양·수유가 안정되기 전 너무 이른 쪽쪽이는 수유에 방해될 수 있습니다.']
        ],
        blocks: [
            ['지금 할 일', '청결을 유지하고, 파손된 쪽쪽이는 교체하세요.'],
            ['하지 않을 일', '끈으로 고정하거나, 단것으로 쪽쪽이를 달지 마세요.'],
            ['상담', '치아·수유 문제가 있으면 의료진과 상의하세요.']
        ],
        links: [
            ['AAP 안전수면·쪽쪽이', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/a-parents-guide-to-safe-sleep.aspx'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'nicotine-liquid-poison',
        match: /(액상\s*니코틴|니코틴\s*액|전자\s*담배\s*액|베이프\s*액|vape\s*juice|니코틴\s*삼|액상\s*삼킴)/,
        title: '전자담배 액상·니코틴 액을 삼키거나 피부에 많이 묻히면 응급입니다',
        lead: '농축 니코틴 액상은 소량만 삼켜도 어린이에게 위험할 수 있습니다. 토하게 하지 말고 중독 상담·응급실 안내를 따르세요. 액상·기기·카트리지는 잠금 수납하고, 간접 노출 안내와 별개로 삼킴·접촉은 즉시 대응합니다. 브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '액상·기기 아이 손 밖, 원래 용기·잠금'],
            ['노출 시', '토하게 강제 금지, 양·제품명 확인, 바로 상담·응급실']
        ],
        blocks: [
            ['지금 할 일', '집·가방에 액상이 열려 있지 않은지 확인하세요.'],
            ['하지 않을 일', '물·민간 해독제로 시간을 끌지 마세요.'],
            ['관련', '전자담배 간접 노출·약 잠금 안내를 참고하세요.']
        ],
        links: [
            ['CDC 니코틴 중독·전자담배', 'https://www.cdc.gov/tobacco/basic_information/e-cigarettes/'],
            ['AAP 전자담배·니코틴', 'https://www.healthychildren.org/English/health-issues/conditions/tobacco/Pages/default.aspx'],
            ['중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'indoor-vaping-child-boundary',
        match: /(실내\s*베이핑|전자담배\s*집\s*안|indoor\s*vaping|아이\s*앞\s*베이프|아파트\s*전자담배|베이핑\s*실내)/,
        title: '아이 앞·실내에서 전자담배를 피우지 말고, 니코틴 액상은 잠가 두세요',
        lead: '간접 노출과 액상 중독이 위험합니다. 금연 환경이 최선입니다.',
        points: [
            ['환경', '실외, 아이 분리'],
            ['보관', '액상 잠금']
        ],
        blocks: [
            ['지금 할 일', '실내·차 안 베이핑을 멈추세요.'],
            ['하지 않을 일', '액상 병을 탁자에 두지 마세요.'],
            ['관련', '간접흡연·니코틴 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/tobacco/']
        ]
    },
    {
        id: 'secondhand-vape',
        match: /(전자\s*담배|액상\s*담배|베이핑|vape|간접\s*전자\s*담배|아이\s*앞에서\s*전자)/,
        title: '전자 담배 연기·에어로졸도 아이 주변에서 피하세요',
        lead: '연소식 담배뿐 아니라 전자 담배의 에어로졸도 실내·차 안 아이 주변에서 피하라는 안내가 있습니다. “냄새만 덜하다”고 안전하다고 보지 마세요. 금연·금베이프 환경이 우선이고, 니코틴 중독·액체 니코틴 삼킴은 응급입니다. 브랜드·기기 추천은 하지 않습니다.',
        points: [
            ['환경', '집·차 안 완전 금연·금베이프, 환기만으로 부족할 수 있음'],
            ['응급', '액상 니코틴 삼킴·피부 다량 접촉은 바로 진료']
        ],
        blocks: [
            ['지금 할 일', '아이 있는 공간의 흡연·베이프 규칙을 가족·손님과 맞추세요.'],
            ['하지 않을 일', '아이 옆에서 “창밖 한 모금”을 반복하지 마세요.'],
            ['관련', '간접흡연 안내를 참고하세요.']
        ],
        links: [
            ['CDC 전자담배·2차 노출', 'https://www.cdc.gov/tobacco/e-cigarettes/'],
            ['간접흡연 안내', '#home']
        ]
    },
    {
        id: 'secondhand-smoke',
        match: /(간접\s*흡연|담배\s*연기|흡연|담배).*(아기|아이|아이\s*앞|수유)|아이\s*앞에서\s*담|연기.*아기/,
        title: '아기 주변의 담배 연기는 호흡기·수면 안전을 해칩니다',
        lead: '간접흡연과 3차 흡연(옷·가구에 남은 연기 성분)은 아기 호흡기 질환·중이염·수면 중 사망 위험과 관련이 있습니다. 집·차 안을 금연 공간으로 두고, 흡연 후에는 손·옷 관리를 하세요.',
        points: [
            ['지금', '아이 있는 공간·차량에서 담배를 피우지 않습니다.'],
            ['수유', '흡연 중이어도 모유 수유 자체는 많은 경우 유익이 있으나, 금연·연기하 노출 최소화가 우선입니다. 상담은 의료진과.']
        ],
        blocks: [
            ['지금 할 일', '집안 금연 규칙을 정하고 방문객에게도 알리세요.'],
            ['하지 않을 일', '환기만으로 “괜찮다”고 아이 앞에서 피우지 마세요.'],
            ['도움', '금연이 필요하면 보건소·금연 상담을 이용하세요.']
        ],
        links: [
            ['CDC 안전수면(연기 노출)', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['질병관리청 금연 관련 안내(포털 검색)', 'https://www.kdca.go.kr/']
        ]
    },
    {
        id: 'bloody-stool-boundary',
        match: /(혈변|피\s*섞인\s*변|변에\s*피|빨간\s*변|검은\s*변|선혈\s*변)/,
        title: '변에 피·검은 변은 식단 색소와 구분하고, 많거나 아이 상태가 나쁘면 진료합니다',
        lead: '빨간 반점·점액·검은 변은 원인이 여러 가지일 수 있습니다. 인터넷 사진으로 병명을 정하지 마세요. 피가 많거나, 보챔·발열·구토·처짐·배가 불러 보이면 바로 진료합니다. 신생아·어린 영아는 특히 의료진 평가를 우선하세요.',
        points: [
            ['기록', '양·색·점액·발열·수유·최근 음식(비트 등)'],
            ['바로 진료', '다량 출혈, 검은 변, 처짐, 탈수, 심한 통증']
        ],
        blocks: [
            ['지금 할 일', '기저귀 사진보다 양·색·전신 상태를 메모하세요.'],
            ['하지 않을 일', '임의 지혈제·민간 약초를 먹이지 마세요.'],
            ['관련', '변 색깔·설사·탈수 안내를 참고하세요.']
        ],
        links: [
            ['NHS 혈변(어린이)', 'https://www.nhs.uk/conditions/blood-in-poo-children/'],
            ['변 색깔 안내', '#home'],
            ['설사·탈수 안내', '#home']
        ]
    },
    {
        id: 'stool-color',
        match: /(초록\s*변|녹색\s*변|변\s*색깔|똥\s*색|흰\s*변|회색\s*변|혈변|피\s*섞인\s*변|검은\s*변)/,
        title: '변 색깔은 식단·시기에 따라 달라지고, 흰·혈·검은 변은 진료합니다',
        lead: '모유·분유·이유식에 따라 노랑·초록·갈색이 나타날 수 있습니다. 초록 변만으로 병이라고 단정하지 않습니다. 하얀·회백색 변, 혈변, 타르처럼 검은 변, 심한 설사·탈수는 진료가 필요합니다.',
        points: [
            ['흔히 관찰', '모유 변의 노랑·초록, 이유식 후 색 변화'],
            ['바로 진료', '흰/회백 변, 많은 피, 검은 타르 변, 탈수·발열·처짐']
        ],
        blocks: [
            ['지금 할 일', '변 색·횟수·수유·발열을 사진보다 글로 기록해 진료에 가져가세요.'],
            ['하지 않을 일', '인터넷 사진과 맞춰 병명을 단정하지 마세요.'],
            ['관련', '변비·설사는 각각의 직접 답도 참고하세요.']
        ],
        links: [
            ['변비 안내', '#home'],
            ['설사·수분', '#home'],
            ['발열·응급', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'earwax-cleaning-boundary',
        match: /(귀지|귀\s*이개|귀\s*파|earwax|면봉\s*귀|귀\s*청소|귀지\s*제거)/,
        title: '귀지는 면봉으로 깊게 파지 말고, 바깥만 닦으세요',
        lead: '귀지는 귀를 보호하는 역할도 있어 면봉을 안쪽으로 넣으면 더 밀어 넣거나 고막을 다칠 수 있습니다. 바깥 입구만 부드러운 천으로 닦고, 통증·분비·청력 걱정·냄새가 있으면 진료하세요. 시중 “귀 청소” 도구 추천·순위는 하지 않습니다.',
        points: [
            ['가정', '바깥만 닦기, 면봉·이개 깊이 금지'],
            ['진료', '통증, 분비물, 청력 변화, 이물감 지속']
        ],
        blocks: [
            ['지금 할 일', '면봉을 쓰지 않는 쪽으로 습관을 바꾸세요.'],
            ['하지 않을 일', '초·민간 도구로 귀 안을 파지 마세요.'],
            ['관련', '귀 만짐·중이염 경계를 참고하세요.']
        ],
        links: [
            ['NHS 귀지', 'https://www.nhs.uk/conditions/earwax-build-up/'],
            ['AAP 귀 관리 개요', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/default.aspx']
        ]
    },
    {
        id: 'ear-pulling',
        match: /(귀).*(잡아|만지|당기)|귀를\s*만/,
        title: '귀를 만진다고 모두 중이염은 아니며, 열·통증·처짐을 함께 봅니다',
        lead: '이가 나거나 습관으로 귀를 만질 수 있습니다. 발열, 잠을 못 이룰 통증, 귀 분비물, 처짐이 있으면 진료하세요. 항생제 필요 여부는 의사가 진찰 후 판단합니다.',
        points: [
            ['가정 관찰', '열, 수유·수면, 귀 분비물, 감기 증상 동반 여부'],
            ['진료', '고열, 심한 보챔, 귀에서 고름, 균형 문제·심한 구토']
        ],
        blocks: [
            ['지금 할 일', '증상 시작 시각과 체온을 적으세요.'],
            ['하지 않을 일', '귀에 민간 오일·약초를 넣거나 항생제를 임의로 쓰지 마세요.'],
            ['진료·상담', '의심되면 소아청소년과에서 귀 진찰을 받으세요.']
        ],
        links: [
            ['발열·응급 가이드', 'blog/baby-fever-cold-guide.html'],
            ['CDC 중이염 개요', 'https://www.cdc.gov/ear-infection/about/index.html']
        ]
    },
    {
        id: 'baby-acne-boundary',
        match: /(신생아\s*여드름|아기\s*여드름|neonatal\s*acne|baby\s*acne|신생아\s*뾰루지|얼굴\s*좁쌀\s*여드름)/,
        title: '신생아 얼굴 뾰루지는 흔할 수 있으나, 사진만으로 병명을 정하지 마세요',
        lead: '생후 초기에 볼·이마에 좁쌀·빨간 발진이 생기는 경우가 있습니다. 세게 짜거나 성인 여드름 약을 바르지 마세요. 고름·열·번짐·가려움이 심하면 진료합니다. 병명 단정·연고 추천은 하지 않습니다.',
        points: [
            ['관리', '순한 물 세안, 오일·자극 화장품 자제'],
            ['진료', '열, 심한 분비, 몸 전체 번짐, 수유 저하']
        ],
        blocks: [
            ['지금 할 일', '짜지 말고, 언제 생겼는지 기록하세요.'],
            ['하지 않을 일', '성인 여드름 약·스테로이드를 임의로 바르지 마세요.'],
            ['관련', '밀리아·발진 진료 시점 안내를 참고하세요.']
        ],
        links: [
            ['AAP 신생아 피부', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/default.aspx'],
            ['발진 진료 시점', '#home']
        ]
    },
    {
        id: 'milia-newborn-boundary',
        match: /(밀리아|하얀\s*좁쌀|코\s*좁쌀|신생아\s*좁쌀|아기\s*얼굴\s*흰\s*점|milia)/,
        title: '신생아 얼굴의 하얀 좁쌀(밀리아)은 흔한 편이며, 짜지 마세요',
        lead: '코·볼 등에 작고 하얀 점이 생기는 밀리아는 많은 신생아에게 나타나며 대개 시간이 지나며 줄어듭니다. 짜거나 강한 스크럽·성인 여드름 약을 쓰지 마세요. 빨갛게 퍼지고 고름·발열·처짐이 있으면 다른 원인을 진료로 확인합니다. 사진만으로 병명을 단정하지 않습니다.',
        points: [
            ['관리', '순한 세정, 짜지 않기, 자극 화장품 금지'],
            ['진료', '염증·고름·발열·급격한 악화']
        ],
        blocks: [
            ['지금 할 일', '세안·보습은 순하게, 손을 대지 마세요.'],
            ['하지 않을 일', '바늘로 짜거나 성인 여드름 약을 바르지 마세요.'],
            ['관련', '땀띠·발진 경계 안내를 참고하세요.']
        ],
        links: [
            ['AAP 신생아 피부', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/default.aspx'],
            ['NHS 밀리아', 'https://www.nhs.uk/conditions/milia/']
        ]
    },
    {
        id: 'heat-rash',
        match: /(땀띠|열꽃|좁쌀\s*발진|빨개진\s*좁쌀|더위\s*발진)/,
        title: '땀띠는 시원·건조하게, 고열·퍼짐·고름이면 진료합니다',
        lead: '더운 환경에서 좁쌀처럼 빨간 발진이 날 수 있습니다. 옷을 얇게 하고 시원하게 말리며, 두꺼운 연고로 막을 덮지 않습니다. 고열·호흡 곤란·빠르게 퍼지거나 고름이 있으면 다른 원인을 진료로 확인하세요.',
        points: [
            ['관리', '시원한 환경, 면 소재, 과도한 로션·밀폐 연고 줄이기'],
            ['진료', '고열, 처짐, 물집·고름, 전신으로 급속 확산']
        ],
        blocks: [
            ['지금 할 일', '실내 온도와 옷 겹침을 줄이세요.'],
            ['하지 않을 일', '사진으로 병명을 단정하거나 스테로이드를 임의로 바르지 마세요.'],
            ['관련', '손발 수포·열이 있으면 수족구 등 가능성도 의료진이 봅니다.']
        ],
        links: [
            ['발진 진료 경계', '#home'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'slow-weight-gain-boundary',
        match: /(체중\s*증가\s*느|몸무게\s*잘\s*안\s*늘|slow\s*weight\s*gain|성장\s*곡선\s*아래|수유\s*후\s*체중)/,
        title: '체중 증가가 더디면 수유량·횟수·탈수 신호를 기록하고 의료진과 곡선으로 상담하세요',
        lead: '한 번의 숫자로 단정하지 않습니다. 보충 수유·검사는 진료 판단을 따릅니다.',
        points: [
            ['기록', '수유, 소변, 체중'],
            ['상담', '지속 저하, 처짐']
        ],
        blocks: [
            ['지금 할 일', '최근 수유·소변 횟수를 적어 가세요.'],
            ['하지 않을 일', '인터넷 목표 체중만 보고 단정하지 마세요.'],
            ['관련', '체중 증가 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['수유 가이드', 'blog/breastfeeding-guide.html']
        ]
    },
    {
        id: 'weight-gain',
        match: /(체중|몸무게|살\s*안\s*찜|성장\s*부진|잘\s*안\s*커|마름|비만).*(아기|아이|걱정)|아기.*(체중|몸무게|성장\s*곡선)/,
        title: '성장은 한 번의 숫자보다 곡선·수유·발달을 함께 봅니다',
        lead: '또래 표의 한 점만으로 “실패”라고 단정하지 않습니다. 담당 의료진의 성장 곡선, 수유·수분, 발달·병력을 함께 봅니다. 급격한 체중 감소·탈수·수유 불가는 바로 진료합니다.',
        points: [
            ['관찰', '며칠~몇 주의 체중 추이, 수유량, 소변, 활력'],
            ['바로 진료', '먹지 못함, 처짐, 소변 감소, 출생 후 과도한 체중 감소']
        ],
        blocks: [
            ['지금 할 일', '최근 체중 기록과 수유 일지를 진료에 가져가세요.'],
            ['하지 않을 일', 'SNS 또래 몸무게와 비교해 분유를 임의 농축하지 마세요.'],
            ['상담', '성장·영양 평가는 소아청소년과에서 합니다.']
        ],
        links: [
            ['CDC 수유량·성장 맥락', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/how-much-and-how-often.html'],
            ['발달 걱정이 함께일 때', 'blog/development-kdst-guide.html']
        ]
    },
    {
        id: 'fish-mercury-boundary',
        match: /(생선\s*수은|수은\s*생선|참치.{0,8}(아기|아이|수은)|아기\s*참치|임산부\s*생선|수은\s*중독\s*생선|mercury\s*fish)/,
        title: '생선은 영양에 도움이 될 수 있으나 수은이 높은 종류는 제한합니다',
        lead: '생선은 단백질·오메가3 공급원이 될 수 있지만, 일부 대형어는 수은이 높아 어린이·임산부 섭취 제한 안내가 있습니다. 종류·양을 공식 안내 범위에서 고르고, 브랜드·횟수 순위를 사이트에서 단정하지 않습니다. 알레르기·질식 형태도 함께 보세요.',
        points: [
            ['선택', '수은이 낮은 편으로 안내된 생선 위주, 다양하게'],
            ['제한', '상어·황새치 등 고수은 어종, 과도한 특정 참치']
        ],
        blocks: [
            ['지금 할 일', '집에 자주 쓰는 생선 종류를 FDA·국내 안내와 맞춰 보세요.'],
            ['하지 않을 일', '날생선·가시·둥근 덩어리 질식 위험을 무시하지 마세요.'],
            ['관련', '이유식·알레르기 도입 안내를 참고하세요.']
        ],
        links: [
            ['FDA·EPA 생선 수은 안내', 'https://www.fda.gov/food/consumers/advice-about-eating-fish'],
            ['CDC 수은과 건강', 'https://www.cdc.gov/mercury/'],
            ['이유식 가이드', 'blog/complementary-feeding-allergy-guide.html']
        ]
    },
    {
        id: 'grandparent-candy-boundary',
        match: /(조부모\s*사탕|할머니\s*과자|할머니\s*사탕|grandpa\s*candy|할아버지\s*간식|할아버지\s*사탕|친정\s*과자)/,
        title: '조부모가 간식을 많이 줄 때는 건강·치아 이유로 경계를 정하고, 아이 앞에서 다투지 마세요',
        lead: '사랑의 표현이 단 간식으로 나타날 수 있습니다. 미리 양·종류 규칙을 정하고, 물·과일 대안을 제안하세요. 아이 앞에서 큰 싸움은 피합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['규칙', '간식 시간, 양, 식사 전 금지'],
            ['소통', '감사 + 이유(치아·배부름) 짧게']
        ],
        blocks: [
            ['지금 할 일', '조부모와 “하루에 한 번” 같은 합의를 해보세요.'],
            ['하지 않을 일', '아이 앞에서 간식을 뺏으며 소리 지르지 마세요.'],
            ['관련', '첨가당·주스·양치 안내를 참고하세요.']
        ],
        links: [
            ['AAP 설탕·영양 개요', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['CDC 첨가당', 'https://www.cdc.gov/nutrition/data-statistics/added-sugars.html']
        ]
    },
    {
        id: 'high-sodium-snack-boundary',
        match: /(나트륨\s*간식|짠\s*과자\s*아이|high\s*sodium\s*snack|라면\s*국물\s*아기|짠\s*음식\s*유아)/,
        title: '어린 아이에게 지나치게 짠 간식·국물은 줄이고, 가족 식사 간을 조절하세요',
        lead: '영유아는 나트륨 부담이 클 수 있습니다. 제품 순위를 매기지 않고 전체 식단을 봅니다.',
        points: [
            ['조절', '짠 국물·가공 간식 줄이기'],
            ['대안', '과일·담백한 음식']
        ],
        blocks: [
            ['지금 할 일', '가공 간식 나트륨을 확인해 보세요.'],
            ['하지 않을 일', '성인 짠 반찬을 그대로 주지 마세요.'],
            ['관련', '소금·당 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['이유식 가이드', 'blog/baby-first-food-guide.html']
        ]
    },
    {
        id: 'salt-sugar-baby-food',
        match: /(이유식|아기\s*음식|유아식).*(소금|설탕|간|단맛)|소금.*(이유식|아기)|설탕.*(이유식|아기)|저염\s*이유식/,
        title: '이유식에 소금·설탕을 따로 넣지 않는 편이 좋습니다',
        lead: '영유아 식단에 불필요한 소금·첨가 설탕을 넣지 말라는 국제·국내 안내가 있습니다. 가공 식품·국물 간도 염분이 많을 수 있어 성인 입맛으로 간하지 마세요.',
        points: [
            ['실천', '재료 본연의 맛, 가공육·짠 국물·단 음료 제한'],
            ['주스·과자', '돌 전 주스 제한과 같은 맥락으로 당 음료를 피합니다.']
        ],
        blocks: [
            ['지금 할 일', '시판 이유식 성분표에서 나트륨·당류를 확인하세요.'],
            ['하지 않을 일', '성인 반찬을 그대로 갈아 먹이거나 설탕으로 단맛을 내지 마세요.'],
            ['진료', '특수 분유·질환 식이는 의료진 지시를 따릅니다.']
        ],
        links: [
            ['WHO 보충식 안내', 'https://www.who.int/health-topics/complementary-feeding'],
            ['이유식 가이드', 'blog/complementary-feeding-allergy-guide.html'],
            ['AAP 주스 권고', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/Where-We-Stand-Fruit-Juice.aspx']
        ]
    },
    {
        id: 'newborn-frequent-sneeze-boundary',
        match: /(신생아\s*재채기\s*많|신생아\s*재채기\s*자주|newborn\s*frequent\s*sneeze|아기\s*재채기\s*계속)/,
        title: '신생아 재채기는 코 자극으로 흔할 수 있으나, 호흡 곤란·수유 저하·발열이 있으면 진료하세요',
        lead: '감기와 구분이 필요하면 의료진을 보세요. 약 용량은 단정하지 않습니다.',
        points: [
            ['관찰', '호흡, 수유, 열'],
            ['환경', '연기·먼지 줄이기']
        ],
        blocks: [
            ['지금 할 일', '코 자극 요인을 줄여 보세요.'],
            ['하지 않을 일', '호흡이 힘들면 지체하지 마세요.'],
            ['관련', '신생아 재채기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['열·감기 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'hiccups-newborn',
        match: /(딸꾹|딸꾹질|히컵|hiccup)/,
        title: '신생아 딸꾹질은 흔하고, 대부분 잠시 후 멈춥니다',
        lead: '수유 전후 딸꾹질은 많은 아기에게 나타납니다. 억지로 놀라게 하거나 민간요법으로 끊으려 하지 마세요. 수유·호흡이 어렵고 토·처짐·청색증이 있으면 다른 문제를 진료로 확인합니다.',
        points: [
            ['대처', '수유를 잠시 쉬거나 트림을 돕고 자세를 바꿔 봅니다.'],
            ['진료', '딸꾹질과 함께 호흡 곤란·수유 거부·심한 구토']
        ],
        blocks: [
            ['지금 할 일', '수유 중 공기를 덜 삼키도록 자세를 점검하세요.'],
            ['하지 않을 일', '놀래키기·강한 자극으로 끊으려 하지 마세요.'],
            ['관련', '잦은 토함은 토함·역류 안내를 함께 보세요.']
        ],
        links: [
            ['토함·역류 안내', '#home'],
            ['AAP 토함 안내', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Why-Babies-Spit-Up.aspx']
        ]
    },
    {
        id: 'cord-blood-banking-boundary',
        match: /(제대혈\s*은행|Cord\s*blood|탯줄\s*피\s*보관|제대혈\s*보관|탯줄혈\s*광고)/,
        title: '제대혈 보관은 의학적 필요·비용·한계를 따져 결정하고, 광고만으로 필수로 보지 마세요',
        lead: '제대혈은 일부 질환 치료에 쓰일 수 있으나, 모든 가족에게 필수 보장은 아닙니다. 공여·자가 보관의 차이, 비용, 사용 가능성을 의료진과 상의하세요. 특정 은행 순위·성공률 광고를 그대로 따르지 않습니다.',
        points: [
            ['판단', '가족 병력, 공여 옵션, 비용, 보관 기간'],
            ['경계', '“만능 치료·보험” 식 마케팅']
        ],
        blocks: [
            ['지금 할 일', '산전과 소아과에 질문 목록을 만들어 두세요.'],
            ['하지 않을 일', '출산 당일 압박 계약에 급하게 서명하지 마세요.'],
            ['관련', '신생아 선별검사·접종 안내를 참고하세요.']
        ],
        links: [
            ['AAP 제대혈 개요', 'https://www.healthychildren.org/English/ages-stages/prenatal/decisions-to-make/Pages/default.aspx'],
            ['FDA 제대혈 정보(영)', 'https://www.fda.gov/vaccines-blood-biologics/cellular-gene-therapy-products/cord-blood']
        ]
    },
    {
        id: 'newborn-screening-boundary',
        match: /(신생아\s*선별|신생아\s*검사|발뒤꿈치\s*피|선천성\s*대사|newborn\s*screen|힐\s*스틱|신생아\s*청력\s*검사)/,
        title: '신생아 선별검사(발뒤꿈치·청력 등)는 병원에서 안내한 일정·재검을 따르세요',
        lead: '선천성 대사 이상·청력 등 선별검사는 조기 발견을 위한 공중보건 절차입니다. 결과가 “재검”이어도 바로 진단은 아닐 수 있어 안내된 재검·상담을 미루지 마세요. 사이트에서 개별 수치를 해석하거나 진단을 내리지 않습니다.',
        points: [
            ['절차', '출생 기관 안내, 재검 문자·전화 확인'],
            ['상담', '이상·재검은 담당 의료진·보건 안내']
        ],
        blocks: [
            ['지금 할 일', '선별검사 결과지·안내 문자를 찾아 두세요.'],
            ['하지 않을 일', '인터넷으로 수치만 보고 병을 단정하지 마세요.'],
            ['관련', '비타민 K·황달 안내를 참고하세요.']
        ],
        links: [
            ['CDC 신생아 선별', 'https://www.cdc.gov/newborn-screening/'],
            ['질병관리청·희귀질환 관련 안내', 'https://www.kdca.go.kr/'],
            ['황달 안내', '#home']
        ]
    },
    {
        id: 'uti-infant-boundary',
        match: /(요로\s*감염|방광염\s*아기|소변\s*이상\s*열|UTI|소변\s*검사\s*아기|영아\s*발열\s*소변)/,
        title: '영아 발열·소변 이상은 요로감염 가능성이 있어 소변 검사·진료를 미루지 마세요',
        lead: '특히 어린 영아 고열의 원인 중 하나로 요로감염이 평가되기도 합니다. 사이트에서 소변 색·냄새만으로 진단하지 않습니다. 해열제 용량을 정하지 않으며, 항생제 여부는 검사가 필요할 수 있어 의료진이 정합니다.',
        points: [
            ['의심 단서', '원인 불명 발열, 보챔, 소변 냄새·탁함(단정 금지)'],
            ['진료', '3개월 미만 발열, 처짐, 수유 감소']
        ],
        blocks: [
            ['지금 할 일', '열 시작·최고 체온·소변 양상을 기록하세요.'],
            ['하지 않을 일', '항생제를 임의로 먹이거나 “감기약”만으로 미루지 마세요.'],
            ['관련', '발열·탈수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 요로감염 개요', 'https://www.healthychildren.org/English/health-issues/conditions/genitourinary-tract/Pages/Urinary-Tract-Infections-in-Teens.aspx'],
            ['NHS UTI 어린이', 'https://www.nhs.uk/conditions/urinary-tract-infections-utis/'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'vitamin-k-newborn-boundary',
        match: /(비타민\s*k|비타민K|vitamin\s*k|신생아\s*출혈|VKDB|비타민\s*케이\s*주사)/,
        title: '신생아 비타민 K는 출혈 예방을 위해 의료진 안내 접종·투여를 따릅니다',
        lead: '출생 직후 비타민 K는 드문 출혈성 질환 예방에 쓰입니다. 주사·경구 방식과 일정은 의료기관 지침을 따르고, 사이트에서 “맞아도 된다/안 맞아도 된다”를 단정하거나 용량을 정하지 않습니다. 거부·대체 요법은 의료진과 상의하세요.',
        points: [
            ['목적', '비타민 K 결핍 출혈 예방'],
            ['상담', '일정·방식·이상반응은 담당 의료진']
        ],
        blocks: [
            ['지금 할 일', '출생 기관에서 안내한 비타민 K 기록을 확인하세요.'],
            ['하지 않을 일', '검증 안 된 식품·영양제로 주사를 대체하지 마세요.'],
            ['관련', '황달·신생아 돌봄 안내를 참고하세요.']
        ],
        links: [
            ['CDC 비타민 K 결핍 출혈', 'https://www.cdc.gov/vitamin-k-deficiency/about/index.html'],
            ['AAP 비타민 K', 'https://www.healthychildren.org/English/ages-stages/prenatal/delivery-beyond/Pages/Where-We-Stand-Administration-of-Vitamin-K.aspx'],
            ['신생아 돌봄', '#home']
        ]
    },
    {
        id: 'undescended-testis-boundary',
        match: /(잠복\s*고환|정류\s*고환|undescended\s*test|고환이\s*안\s*만져|고환\s*한쪽\s*없|고환\s*내려)/,
        title: '고환이 음낭에서 만져지지 않으면 시기를 미루지 말고 소아과·비뇨기 진료를 상의하세요',
        lead: '잠복고환은 생후 경과를 보며 평가·치료 시점을 의료진이 정합니다. 사진·만져보기만으로 가정에서 진단·마사지 치료를 단정하지 마세요. 통증·부종·색 변화는 응급일 수 있습니다. 수술·약 용량은 사이트에서 정하지 않습니다.',
        points: [
            ['상담', '신생아 검진, 추적 일정, 전문과 의뢰'],
            ['응급', '갑작스러운 통증·부종·구토']
        ],
        blocks: [
            ['지금 할 일', '목욕 때 양쪽 음낭이 대칭인지 기록하세요.'],
            ['하지 않을 일', '억지로 고환을 밀어 내리려 하지 마세요.'],
            ['관련', '히드로셀·신생아 검진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 잠복고환 개요', 'https://www.healthychildren.org/English/health-issues/conditions/genitourinary-tract/Pages/default.aspx'],
            ['CDC 아동 건강 검진 개요', 'https://www.cdc.gov/ncbddd/']
        ]
    },
    {
        id: 'hydrocele-boundary',
        match: /(음낭\s*물집|음낭\s*부음|고환\s*물|고환\s*부음|히드로실|hydrocele|물\s*고환)/,
        title: '음낭이 부어 보이면 물혹(히드로셀) 등 가능성이 있어 통증·색 변화를 진료로 확인하세요',
        lead: '신생아·영아 음낭 부음은 히드로셀로 설명되는 경우가 있으나, 탈장·고환 염전 등과 구분이 필요합니다. 사진으로 진단하지 말고, 단단히 아프고 색이 변하거나 토·처짐이 있으면 응급 평가를 받으세요. 수술 시점은 의료진이 정합니다.',
        points: [
            ['관찰', '크기 변화, 통증, 환원 여부, 발열'],
            ['바로 진료', '급격한 통증·부종, 색 변화, 구토·처짐']
        ],
        blocks: [
            ['지금 할 일', '언제 커졌는지·아픈지 기록하세요.'],
            ['하지 않을 일', '손으로 세게 짜거나 민간 연고를 바르지 마세요.'],
            ['관련', '배꼽 탈장·포피 안내를 참고하세요.']
        ],
        links: [
            ['AAP 음낭·고환 문제 개요', 'https://www.healthychildren.org/English/health-issues/conditions/genitourinary-tract/Pages/default.aspx'],
            ['NHS 히드로셀', 'https://www.nhs.uk/conditions/hydrocele/']
        ]
    },
    {
        id: 'circumcision-care-boundary',
        match: /(포경\s*수술|할례|포피\s*수술|circumcision|포경\s*후\s*관리|수술\s*후\s*귀두)/,
        title: '포경 수술 후 관리는 의료진 안내를 따르고, 출혈·고름·발열이면 연락하세요',
        lead: '포경 수술 여부는 가정·의료 결정이며 사이트에서 권하거나 말리지 않습니다. 수술한 경우 세척·거즈·연고는 담당 의료진 설명을 그대로 따르세요. 지속 출혈, 심한 부종, 고름, 발열, 소변 곤란이 있으면 바로 연락합니다. 약 용량·브랜드를 정하지 않습니다.',
        points: [
            ['관리', '안내된 세척·건조, 기저귀 마찰 줄이기'],
            ['연락', '출혈 지속, 감염 의심, 소변 이상']
        ],
        blocks: [
            ['지금 할 일', '퇴원·시술 안내 문서를 다시 읽으세요.'],
            ['하지 않을 일', '딱지를 억지로 떼거나 검증 안 된 민간 약을 바르지 마세요.'],
            ['관련', '포피 관리(비수술)·목욕 안내를 참고하세요.']
        ],
        links: [
            ['AAP 포경 수술 후 관리', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/Caring-for-a-Circumcised-Penis.aspx'],
            ['AAP 포경 정책 요약', 'https://www.healthychildren.org/English/ages-stages/baby/Pages/where-we-stand-circumcision.aspx']
        ]
    },
    {
        id: 'labial-adhesion-boundary',
        match: /(음순\s*유착|소음순\s*유착|labial\s*adhesion|여자\s*아기\s*음부\s*붙|외음\s*유착)/,
        title: '여아 음순이 붙어 보이면 억지로 벌리지 말고 소아과 진료를 상의하세요',
        lead: '일부 여아에서 음순이 얇게 유착되는 경우가 있습니다. 억지로 벌리거나 민간 연고를 바르지 마세요. 배뇨 문제·발적·통증이 있으면 진료가 필요합니다. 치료·약 용량은 의료진이 정합니다. 사진 진단은 하지 않습니다.',
        points: [
            ['관리', '부드러운 세척, 자극 비누 자제, 억지 분리 금지'],
            ['진료', '배뇨 이상, 출혈, 감염 징후']
        ],
        blocks: [
            ['지금 할 일', '기저귀 갈 때 자극·발진이 있는지 관찰하세요.'],
            ['하지 않을 일', '손으로 유착을 떼려 하지 마세요.'],
            ['관련', '신생아 위생·발진 안내를 참고하세요.']
        ],
        links: [
            ['AAP 소아 비뇨·생식기 개요', 'https://www.healthychildren.org/English/health-issues/conditions/genitourinary-tract/Pages/default.aspx'],
            ['신생아 케어 안내', '#home']
        ]
    },
    {
        id: 'newborn-pseudo-menses',
        match: /(가성\s*월경|여아\s*출혈|여아\s*피|신생아\s*질|기저귀\s*피\s*여|아기\s*여아\s*피|질\s*분비\s*신생아|신생아\s*피\s*비침)/,
        title: '신생아 여아의 약간의 피·분비는 호르몬 영향일 수 있고, 양·냄새·전신과 함께 봅니다',
        lead: '출생 후 며칠 사이 여아 기저귀에 옅은 피·흰 분비가 보일 수 있으며, 모체 호르몬 영향으로 설명되는 경우가 있습니다. 양이 많거나 냄새가 심하고, 발열·처짐·배뇨 이상이 있으면 진료하세요. 사진만으로 정상·이상을 단정하지 않습니다.',
        points: [
            ['관찰', '양·색깔·냄새, 발열·처짐, 소변 줄기'],
            ['진료', '지속·다량 출혈, 고름성 분비, 전신 증상']
        ],
        blocks: [
            ['지금 할 일', '기저귀 사진을 남기기보다 양상과 시간을 글로 기록하세요.'],
            ['하지 않을 일', '질 안을 면봉으로 깊게 닦지 마세요.'],
            ['관련', '탯줄·발진 경계를 참고하세요.']
        ],
        links: [
            ['AAP 신생아 외음·기저귀 관찰', 'https://www.healthychildren.org/English/ages-stages/baby/Pages/Babys-First-Days-Bowel-Movements-and-Urination.aspx'],
            ['NHS 신생아 돌봄', 'https://www.nhs.uk/baby/caring-for-a-newborn/']
        ]
    },
    {
        id: 'newborn-sneeze',
        match: /(재채기|재채).*(신생아|아기|많)|아기.*재채기|코\s*막.*신생아/,
        title: '신생아 재채기는 코를 치우는 반응일 수 있고, 호흡·발열을 함께 봅니다',
        lead: '좁은 콧구멍에 먼지나 젖이 자극되어 재채기가 잦을 수 있습니다. 그 자체만으로 감기는 아닙니다. 발열·호흡 곤란·수유 감소·처짐이 있으면 진료하세요.',
        points: [
            ['가정', '코 입구를 부드럽게 닦고, 연기·강한 향을 줄입니다.'],
            ['진료', '3개월 미만 발열, 숨가쁨, 수유 불가, 처짐']
        ],
        blocks: [
            ['지금 할 일', '수유·소변·체온을 확인하세요.'],
            ['하지 않을 일', '성인 비강 스프레이·민간 연기를 쓰지 마세요.'],
            ['관련', '감기·코막힘 직접 답과 발열 가이드를 참고하세요.']
        ],
        links: [
            ['감기·호흡 안내', '#home'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'plugged-duct-boundary',
        match: /(유방\s*멍울|막힌\s*관|유관\s*막|젖\s*멍울|유방\s*덩어리|plugged\s*duct)/,
        title: '유방 멍울은 수유·휴식과 함께 보고, 열·발적이 있으면 유선염을 의심합니다',
        lead: '수유부의 국소 멍울은 유관이 일시적으로 막힌 경우일 수 있습니다. 자주 수유·유축하고 편한 자세를 시도합니다. 열·오한·넓게 붉고 아프면 유선염 가능성을 보고 빨리 진료하세요. 약 용량·마사지 기구 순위는 정하지 않습니다.',
        points: [
            ['가정', '수유 빈도, 자세, 편안한 압박 완화(통증 유발 강한 마사지 주의)'],
            ['진료', '열, 발적 확산, 심한 통증, 유즙 고름']
        ],
        blocks: [
            ['지금 할 일', '증상 시작·체온·어느 부위인지 기록하세요.'],
            ['하지 않을 일', '아픈데 참으며 수유를 오래 참지 마세요.'],
            ['관련', '유선염·젖몸살 안내를 참고하세요.']
        ],
        links: [
            ['AAP 유선염·수유 문제', 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/Mastitis.aspx'],
            ['CDC 수유 문제 개요', 'https://www.cdc.gov/breastfeeding/'],
            ['유선염 안내', '#home']
        ]
    },
    {
        id: 'mastitis-signs',
        match: /(유선염|유방\s*(빨개|발적|열감)|가슴이\s*빨|수유.*유방.*아프|유방.*독감|유방.*고열)/,
        title: '유선염 의심이면 열·발적·통증을 보고 빨리 진료합니다',
        lead: '한쪽 유방이 뜨겁고 아프며 빨개지고, 몸살·오한·열이 나면 유선염을 의심할 수 있습니다. 사이트에서 항생제 종류·용량을 정하지 않습니다. 가정 완화만으로 12~24시간 안 좋아지거나 열이 있으면 의료진을 찾으세요. 대개 수유를 이어 가도 되는 경우가 많으나 지시는 의사가 합니다.',
        points: [
            ['의심 신호', '국소 열감·통증·발적, 딱딱한 부위, 독감 같은 전신 증상·발열'],
            ['바로 진료', '고열, 빠르게 퍼지는 발적, 고름, 어지럼·심한 무기력, 24시간 내 악화']
        ],
        blocks: [
            ['지금 할 일', '가능하면 수유·유축을 이어 가며 휴식을 취하고, 증상 시작 시각을 적어두세요.'],
            ['하지 않을 일', '임의 항생제·강한 마사지·검증 안 된 민간 연고로 치료하지 마세요.'],
            ['상담', '수유 상담가·산부인과·가정의학과 등에서 진찰받으세요.']
        ],
        links: [
            ['NHS 유선염 안내', 'https://www.nhs.uk/conditions/mastitis/'],
            ['LLL 유선염 정보', 'https://llli.org/breastfeeding-info/mastitis/']
        ]
    },
    {
        id: 'exercise-induced-wheeze-boundary',
        match: /(천식\s*발작\s*운동|운동\s*후\s*쌕쌕|운동\s*천식\s*아이|exercise\s*induced\s*wheeze)/,
        title: '운동 후 쌕쌕·호흡 곤란이 있으면 운동을 멈추고 진료·기존 계획을 따르세요',
        lead: '약 사용은 처방 교육을 따릅니다. 여기서 용량을 정하지 않습니다.',
        points: [
            ['즉시', '운동 중단, 앉히기'],
            ['계획', '의료진 지시']
        ],
        blocks: [
            ['지금 할 일', '증상을 기록하세요.'],
            ['하지 않을 일', '숨이 찬데 계속 뛰게 두지 마세요.'],
            ['관련', '천식·호흡 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/asthma/']
        ]
    },
    {
        id: 'wheeze-breathing-care-boundary',
        match: /(쌕쌕|휘징|wheeze|천명|숨소리\s*이상|가슴\s*들썩|천식\s*의심\s*아기)/,
        title: '쌕쌕거림·숨이 가쁜 증상은 원인을 사이트에서 단정하지 말고 호흡 상태를 보고 진료하세요',
        lead: '쌕쌕·가슴 들썩임·빠른 호흡은 감염·알레르기·이물 등 여러 원인일 수 있습니다. “천식” 병명·흡입약 용량을 온라인에서 정하지 마세요. 입술 파래짐·처짐·수유 불가·무호흡은 응급입니다.',
        points: [
            ['응급', '청색증, 처짐, 무호흡, 늑간 함몰 심함 → 119'],
            ['진료', '첫 쌕쌕, 수유·수면 방해, 열 동반']
        ],
        blocks: [
            ['지금 할 일', '호흡 수·가슴 움직임·수유량을 기록하세요.'],
            ['하지 않을 일', '성인 흡입약을 임의로 쓰지 마세요.'],
            ['관련', 'RSV·크룹·이물 흡인 안내를 참고하세요.']
        ],
        links: [
            ['CDC RSV·호흡기', 'https://www.cdc.gov/rsv/'],
            ['AAP 호흡 곤란 개요', 'https://www.healthychildren.org/English/health-issues/conditions/chest-lungs/Pages/default.aspx']
        ]
    },
    {
        id: 'rsv-breathing',
        match: /(rsv|RSV|호흡기세포|세기관지염|쌕쌕|숨이\s*가|호흡\s*곤란|늑간|코\s*벌렁)/,
        title: 'RSV·감기 비슷한 증상은 호흡·수분 섭취를 기준으로 진료합니다',
        lead: 'RSV는 콧물·기침으로 시작해 숨이 가쁘거나 수유가 줄 수 있습니다. 어린 영아는 보챔·처짐·호흡 곤란만 나타날 수도 있습니다. 숨쉬기 힘듦, 수분 섭취 부족, 증상 악화 시 바로 의료 평가를 받으세요.',
        points: [
            ['관찰', '호흡 수, 가슴이 쑥 들어가는지, 수유·소변, 발열·처짐'],
            ['응급에 가깝', '입술·얼굴이 파랗게 보임, 숨과 수유를 동시에 못 함, 깨우기 어려움']
        ],
        blocks: [
            ['지금 할 일', '연기를 피하고 수분을 유지하며, 호흡·기저귀 횟수를 기록하세요.'],
            ['하지 않을 일', '성인 감기약 용량을 인터넷으로 정하거나, “감기니까 괜찮다”며 호흡 곤란을 방치하지 마세요.'],
            ['진료', '특히 6개월 미만·미숙아·만성 질환이 있으면 일찍 진료하세요.']
        ],
        links: [
            ['CDC 영아 RSV', 'https://www.cdc.gov/rsv/infants-young-children/index.html'],
            ['CDC RSV 증상·돌봄', 'https://www.cdc.gov/rsv/symptoms/index.html'],
            ['발열·응급 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'exam-period-sleep-boundary',
        match: /(시험\s*기간\s*수면|시험\s*전\s*밤샘|exam\s*sleep\s*child|벼락치기\s*밤\s*안\s*자|시험\s*주\s*잠)/,
        title: '시험 기간에도 수면 시간을 과도하게 줄이지 않는 편이 학습·기분에 도움이 될 수 있습니다',
        lead: '밤샘을 정답으로 보지 마세요. 수면제 추천은 하지 않습니다.',
        points: [
            ['원칙', '규칙적 수면'],
            ['피하기', '과도한 밤샘·카페인']
        ],
        blocks: [
            ['지금 할 일', '취침 시각을 크게 미루지 마세요.'],
            ['하지 않을 일', '성인 카페인 음료를 주지 마세요.'],
            ['관련', '수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx']
        ]
    },
    {
        id: 'sleep-training-app-boundary',
        match: /(수면\s*교육\s*앱|수면\s*교육\s*앱|슬립\s*트레이닝\s*앱|sleep\s*training\s*app)/,
        title: '수면 교육 앱은 참고일 뿐이며, 영아 안전수면과 의료 상황을 우선하세요',
        lead: '울림 방치 방식은 가족·월령에 맞게 신중히 결정하세요. 앱 순위는 하지 않습니다.',
        points: [
            ['우선', '안전수면, 건강'],
            ['경계', '앱 만능']
        ],
        blocks: [
            ['지금 할 일', '월령과 체중 증가를 확인하세요.'],
            ['하지 않을 일', '앱 지시만 맹신하지 마세요.'],
            ['관련', '수면 교육 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수면 가이드', 'blog/baby-sleep-training.html']
        ]
    },
    {
        id: 'sleep-training-boundary',
        match: /(수면\s*교육|재우기\s*훈련|울려\s*가며|크라이\s*잇|cry\s*it|페르버|ferber|자기주도\s*수면|트레인닝|트레이닝)/,
        title: '수면교육보다 안전수면이 먼저이고, 신생아에게 강요하지 않습니다',
        lead: '통잠 훈련은 가정의 선택이지만, 1세 미만은 등·별도 수면면·빈 공간이 우선입니다. 생후 초기에는 수유·성장이 먼저이고, 흔히 수 개월이 지난 뒤에야 스스로 잠드는 연습을 이야기합니다. 특정 유료 프로그램·분 단위 공식을 사이트에서 처방하지 않습니다.',
        points: [
            ['먼저', '안전 수면 환경, 배고픔·통증·질병 여부 확인'],
            ['연습 시', '졸릴 때 침대에 두기, 밤 자극 줄이기 등 기본 습관부터. 아픈 날·성장 급변 때는 쉬어도 됩니다.']
        ],
        blocks: [
            ['지금 할 일', '등 재우기·별도 수면면이 지켜지는지부터 점검하세요.'],
            ['하지 않을 일', '엎어 재우거나 이불·소파로 재우는 방식으로 “교육”하지 마세요. 흔들 아기 증후군이 될 정도로 흔들지 마세요.'],
            ['상담', '수면·성장·호흡 걱정이 함께 있으면 의료진과 상의하세요.']
        ],
        links: [
            ['1세 미만 안전수면', 'blog/baby-safe-sleep-guide.html'],
            ['AAP 잠 습관 안내', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/getting-your-baby-to-sleep.aspx'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'oral-thrush',
        match: /(아구창|구강\s*칸디다|입안\s*흰|흰\s*이끼|혀\s*하얗|thrush|칸디다.*입)/,
        title: '입안 흰 반점은 수유 찌꺼기와 구별하고, 아파 보이면 진료합니다',
        lead: '혀·볼 안쪽에 잘 안 닦이는 흰 반점, 수유 시 통증·거부, 엄마 유두 통증이 함께 있으면 아구창 등을 의료진이 판단합니다. 사이트에서 약 이름을 정하지 않습니다.',
        points: [
            ['관찰', '흰 막이 거즈로 잘 안 지워지는지, 수유 통증, 기저귀 발진 동반'],
            ['진료', '수유 거부, 보챔, 번지는 발진, 엄마 유두 심한 통증']
        ],
        blocks: [
            ['지금 할 일', '증상을 기록하고 소아·수유 상담에서 진찰받으세요.'],
            ['하지 않을 일', '성인 항진균제를 임의로 바르거나 먹이지 마세요.'],
            ['관련', '기저귀 발진이 심하면 함께 알려 주세요.']
        ],
        links: [
            ['기저귀 발진 안내', '#home'],
            ['수유 통증·유선염 경계', '#home']
        ]
    },
    {
        id: 'medicine-breastfeeding-boundary',
        match: /(수유|모유).*(약|처방|타이레놀|해열|감기약|먹어도)|(약|처방).*(수유|모유|짠\s*후)|수유\s*중\s*약/,
        title: '수유 중 약은 임의로 정하지 말고 약사·의사·공식 상담 경로를 이용하세요',
        lead: '수유 중에도 필요한 약은 있을 수 있지만, 약마다 모유 이행·금기가 다릅니다. 사이트·댓글에서 약 이름과 용량을 정하지 않습니다. 처방·약국·의료진에게 수유 중임을 알리고, 공식 상담 자료가 있으면 함께 확인하세요. 자가 판단으로 수유를 갑자기 끊지 마세요.',
        points: [
            ['원칙', '수유 사실을 알린 뒤 처방·복약 지도, 임의 성인 약 금지'],
            ['금지', '인터넷 용량·“짠 뒤 바로 괜찮다” 단정']
        ],
        blocks: [
            ['지금 할 일', '약 성분·복용 시각·아이 월령을 적고 약사·의료진에게 문의하세요.'],
            ['하지 않을 일', '성인 감기약·한약을 임의로 함께 먹지 마세요.'],
            ['관련', '수유 중 카페인·음주 경계를 참고하세요.']
        ],
        links: [
            ['CDC 수유와 약·물질', 'https://www.cdc.gov/breastfeeding/breastfeeding-special-circumstances/vaccinations-medications-drugs/'],
            ['질병관리청 모유 수유', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586']
        ]
    },
    {
        id: 'energy-drink-breastfeeding-boundary',
        match: /(수유\s*중\s*에너지\s*드링크|수유\s*중\s*에너지\s*드링크|모유\s*카페인\s*에너지|energy\s*drink\s*breastfeeding)/,
        title: '수유 중 에너지 드링크는 카페인·첨가물 부담이 커 피하고, 의료진과 상담하세요',
        lead: '아이 음료로도 주지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '과다 카페인 자제'],
            ['대안', '물, 상담']
        ],
        blocks: [
            ['지금 할 일', '성분표를 확인하세요.'],
            ['하지 않을 일', '아이에게 에너지 드링크를 주지 마세요.'],
            ['관련', '카페인·수유 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['수유 가이드', 'blog/breastfeeding-guide.html']
        ]
    },
    {
        id: 'caffeine-breastfeeding',
        match: /(카페인|커피|녹차|에너지\s*음료).*(수유|모유|아기)|수유.*(커피|카페인)/,
        title: '수유 중 카페인은 과하지 않게, 아기 보챔을 보면 줄입니다',
        lead: '소량의 카페인은 많은 수유부가 섭취하지만, 아기마다 민감도가 다릅니다. 보챔·수면 방해가 보이면 줄이세요. 정확한 “하루 ○잔 공식”을 사이트에서 단정하지 않으며, 질환·약이 있으면 의료진과 확인합니다.',
        points: [
            ['실천', '커피·차·에너지 음료·초콜릿 등 총량을 의식하고, 한꺼번에 많이 마시지 않기'],
            ['아기 신호', '과도한 보챔·수면 곤란이 카페인 줄인 뒤 좋아지는지 관찰']
        ],
        blocks: [
            ['지금 할 일', '하루 카페인 음료 종류와 양을 적어 보세요.'],
            ['하지 않을 일', '카페인을 끊는다고 수유를 중단하지 마세요. 금연·금주 문제는 별도로 상담하세요.'],
            ['상담', '조산아·민감 아기는 의료진 조언을 우선하세요.']
        ],
        links: [
            ['CDC 수유 중 음식·음료 개요', 'https://www.cdc.gov/breastfeeding/breastfeeding-special-circumstances/diet-and-micronutrients/maternal-diet.html'],
            ['질병관리청 모유 수유', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586']
        ]
    },
    {
        id: 'pinkeye-shared-items-boundary',
        match: /(결막염\s*안경\s*장난감|결막염\s*수건\s*공유|눈병\s*장난감\s*같이|pinkeye\s*shared\s*towel)/,
        title: '결막염이 의심되면 수건·베개·눈 근처 물건을 구분하고 손을 자주 씻기세요',
        lead: '진단·약은 의료진을 따르세요. 사진 진단은 하지 않습니다.',
        points: [
            ['위생', '수건 분리, 손 씻기'],
            ['공유', '눈 비비기 금지']
        ],
        blocks: [
            ['지금 할 일', '손을 씻기세요.'],
            ['하지 않을 일', '같은 수건을 쓰지 마세요.'],
            ['관련', '결막염 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'pink-eye-conjunctivitis-boundary',
        match: /(결막염|핑크\s*아이|pink\s*eye|눈\s*충혈\s*눈곱|전염\s*눈병|유행성\s*눈병)/,
        title: '눈 충혈·눈곱은 결막염 등 여러 원인 가능해 병명·안약을 단정하지 마세요',
        lead: '바이러스·세균·알레르기 등으로 눈이 빨개지고 눈곱이 낄 수 있습니다. 손 씻기·수건 공유 금지·렌즈(해당 시) 중단이 도움이 되고, 심한 통증·빛 공포·시야 문제·신생아 눈 증상은 진료가 급합니다. 항생제 안약 처방 여부는 의료진이 정합니다.',
        points: [
            ['위생', '손 씻기, 베개·수건 따로, 눈 비비지 않기'],
            ['진료', '신생아, 심한 통증, 빛 민감, 시야 흐림, 외상']
        ],
        blocks: [
            ['지금 할 일', '손을 씻고 가족이 수건을 같이 쓰지 않게 하세요.'],
            ['하지 않을 일', '남은 안약을 임의로 넣지 마세요.'],
            ['관련', '눈곱·신생아 눈 증상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 결막염(핑크아이)', 'https://www.cdc.gov/conjunctivitis/'],
            ['AAP 눈 충혈·감염 개요', 'https://www.healthychildren.org/English/health-issues/conditions/eyes/Pages/default.aspx']
        ]
    },
    {
        id: 'water-gun-eye-safety',
        match: /(물총\s*눈|워터건\s*눈|water\s*gun\s*eye|물총\s*세게|슈퍼\s*소커\s*아이)/,
        title: '물총은 얼굴·눈에 가까이 쏘지 말고, 눈에 맞은 뒤 통증·시야 이상이 있으면 진료하세요',
        lead: '강한 물줄기는 눈에 자극·부상을 줄 수 있습니다. 얼굴 조준을 금지하고 거리를 두세요.',
        points: [
            ['규칙', '얼굴 금지, 거리'],
            ['이상', '통증, 충혈, 시야']
        ],
        blocks: [
            ['지금 할 일', '얼굴에 쏘지 않는 규칙을 정하세요.'],
            ['하지 않을 일', '근거리에서 눈을 겨냥하지 마세요.'],
            ['관련', '눈·물놀이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'newborn-tear-duct-boundary',
        match: /(신생아\s*눈물샘|눈물길\s*막힘|newborn\s*tear\s*duct|눈곱\s*신생아\s*한쪽|눈물\s*넘침\s*신생아)/,
        title: '신생아 눈물 넘침·눈곱은 흔할 수 있으나, 빨강·부종·심한 노란 눈곱이면 진료하세요',
        lead: '마사지 방법은 의료진 안내를 따르세요. 사진 진단은 하지 않습니다.',
        points: [
            ['관찰', '색깔, 부종'],
            ['진료', '감염 의심']
        ],
        blocks: [
            ['지금 할 일', '손을 씻고 가볍게 닦으세요.'],
            ['하지 않을 일', '눈을 세게 누르지 마세요.'],
            ['관련', '눈곱 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['눈 안내', '#home']
        ]
    },
    {
        id: 'unilateral-eye-discharge-boundary',
        match: /(눈곱\s*한쪽|한쪽\s*눈\s*노란\s*눈곱|unilateral\s*eye\s*discharge|한쪽\s*눈\s*충혈\s*눈곱)/,
        title: '한쪽 눈곱·충혈이 심하면 전염성 결막염 가능을 보고 진료·위생을 챙기세요',
        lead: '사진 진단은 하지 않습니다. 약 처방은 의료진을 따르세요.',
        points: [
            ['위생', '손, 수건 분리'],
            ['진료', '통증, 빛 민감, 시야']
        ],
        blocks: [
            ['지금 할 일', '손을 자주 씻기세요.'],
            ['하지 않을 일', '눈을 비비게 두지 마세요.'],
            ['관련', '눈곱·결막염 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'eye-discharge',
        match: /(눈곱|눈\s*충혈|눈물\s*길|결막염|눈이\s*노란\s*콧|눈\s*부음)/,
        title: '눈곱은 흔할 수 있고, 빨개짐·부음·발열이면 진료합니다',
        lead: '신생아·영아는 눈물길 미성숙으로 눈곱이 날 수 있습니다. 부드럽게 닦되, 눈이 심하게 빨개지거나 붓고 빛을 싫어하거나 발열·처짐이 있으면 진료하세요. 성인 안약을 임의로 넣지 마세요.',
        points: [
            ['가정', '깨끗한 거즈·미온수로 안쪽에서 바깥으로 닦기'],
            ['진료', '심한 충혈·부종, 노란 고름이 많음, 빛이 아픔, 발열, 시력·움직임 이상 의심']
        ],
        blocks: [
            ['지금 할 일', '양측인지·시작 시점·발열 여부를 적으세요.'],
            ['하지 않을 일', '민간 모유를 눈에 넣거나 처방 없이 항생 안약을 쓰지 마세요.'],
            ['상담', '신생아 눈 증상은 소아·안과 안내를 따르세요.']
        ],
        links: [
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'cradle-cap',
        match: /(크래들\s*캡|cradle\s*cap|머리\s*딱지|유아\s*지루|두피\s*노란\s*각질|베이비\s*비듬)/,
        title: '머리 딱지(크래들캡)는 부드럽게 관리하고, 염증·번짐이면 진료합니다',
        lead: '두피에 노란·흰 각질이 생기는 일은 흔합니다. 미온수로 적신 뒤 부드러운 솔·손가락으로 살살 관리합니다. 강제로 떼어 내거나 강한 스크럽은 피하세요. 심하게 빨개지거나 진물·몸 다른 곳으로 번지면 진료합니다.',
        points: [
            ['관리', '순한 세정, 부드럽게 각질 정리, 보습'],
            ['진료', '심한 염증, 진물·고름, 가려워 잠을 못 잠, 다른 부위 발진']
        ],
        blocks: [
            ['지금 할 일', '목욕 후 두피를 완전히 말리세요.'],
            ['하지 않을 일', '성인 비듬약을 임의로 쓰지 마세요.'],
            ['상담', '아토피·감염 감별이 필요하면 피부·소아 진료를 받으세요.']
        ],
        links: [
            ['발진 진료 경계', '#home']
        ]
    },
    {
        id: 'ors-dehydration-boundary',
        match: /(경구\s*수액|ORS|탈수\s*이온|수액\s*팩\s*아이|경구\s*수분\s*보충|페디아\s*라이트)/,
        title: '탈수가 걱정되면 경구 수분 보충을 의료 안내로 하고, 스포츠 음료로 대체하지 마세요',
        lead: '설사·구토 때 경구 수액(ORS)이 도움이 될 수 있다는 공식 안내가 있습니다. 스포츠·이온 음료·주스가 항상 같은 역할은 아닙니다. 처짐·소변 감소·피 묻은 설사·담즙성 구토면 진료가 우선입니다. 제품 브랜드·정확한 ml 처방은 사이트에서 하지 않습니다.',
        points: [
            ['신호', '소변 감소, 입 마름, 처짐, 눈물 감소'],
            ['경계', '스포츠 음료 일상 대체, 임의 성인 수액']
        ],
        blocks: [
            ['지금 할 일', '소변 횟수·구토·설사 횟수를 기록하세요.'],
            ['하지 않을 일', '처진 아이에게 억지로 많은 양을 한 번에 먹이지 마세요.'],
            ['관련', '탈수·설사·스포츠 음료 안내를 참고하세요.']
        ],
        links: [
            ['CDC 설사·수분', 'https://www.cdc.gov/diarrhea/'],
            ['WHO 경구 수액 개요', 'https://www.who.int/news-room/fact-sheets/detail/diarrhoeal-disease'],
            ['탈수 안내', '#home']
        ]
    },
    {
        id: 'vomiting-rehydration-pacing-boundary',
        match: /(구토\s*후\s*수분|토한\s*뒤\s*물|vomiting\s*rehydrat|토하고\s*뭐\s*먹|구토\s*이후\s*수유)/,
        title: '구토 뒤에는 소량씩 자주 수분을 시도하고, 계속 토하거나 처지면 진료하세요',
        lead: '한 번에 많이 주면 다시 토할 수 있습니다. ORS·수유 계획은 의료진 안내를 우선하세요. 용량 단정은 하지 않습니다.',
        points: [
            ['방법', '소량, 자주'],
            ['진료', '지속 구토, 탈수 신호']
        ],
        blocks: [
            ['지금 할 일', '소량씩 간격을 두고 주세요.'],
            ['하지 않을 일', '억지로 많이 먹이지 마세요.'],
            ['관련', '탈수·구토 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['탈수 안내', '#home']
        ]
    },
    {
        id: 'heat-low-urine-boundary',
        match: /(더위에\s*소변\s*감소|더위\s*소변\s*감소|땀\s*많이\s*소변\s*줄|heat\s*low\s*urine|더운\s*날\s*오줌\s*적|야외\s*소변\s*적어)/,
        title: '더운 날 소변이 줄고 처지면 그늘·수분·휴식을 주고, 호전 없으면 진료하세요',
        lead: '탈수·열 질환이 겹칠 수 있습니다. 음료 브랜드 순위는 하지 않습니다.',
        points: [
            ['즉시', '그늘, 수분'],
            ['진료', '처짐, 구토, 무뇨']
        ],
        blocks: [
            ['지금 할 일', '시원한 곳으로 옮기세요.'],
            ['하지 않을 일', '억지로 찬 물을 급히 많이 먹이지 마세요.'],
            ['관련', '탈수·열 안내를 참고하세요.']
        ],
        links: [
            ['CDC 열', 'https://www.cdc.gov/heat-health/'],
            ['탈수 안내', '#home']
        ]
    },
    {
        id: 'dehydration-signs',
        match: /(탈수|소변\s*줄|기저귀\s*안\s*젖|입\s*마름|눈물\s*없이\s*울|숨이\s*깊|처지.*안\s*먹)/,
        title: '탈수는 소변·입·처짐·수유량으로 가늠하고 심하면 진료합니다',
        lead: '토·설사·발열·수유 거부로 수분이 줄 수 있습니다. 젖은 기저귀가 평소보다 크게 줄고, 입이 마르며, 처지고, 울 때 눈물이 거의 없으면 탈수를 의심합니다. 수액·약 용량은 의사가 정합니다.',
        points: [
            ['관찰', '기저귀 횟수·무게감, 수유량, 입 안 마름, 숨·의식'],
            ['바로 진료', '생후 3개월 미만, 소변 거의 없음, 깨우기 어려움, 피 묻은 토·혈변']
        ],
        blocks: [
            ['지금 할 일', '마지막 소변·수유 시각을 기록하세요.'],
            ['하지 않을 일', '스포츠음료·주스로 탈수를 임의 치료하지 마세요.'],
            ['관련', '설사·구토·발열 안내를 함께 보세요.']
        ],
        links: [
            ['설사 안내', '#home'],
            ['발열·응급', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'night-cough-position-boundary',
        match: /(야간\s*기침\s*자세|밤에\s*기침\s*심|night\s*cough\s*position|누워\s*기침\s*심해|취침\s*기침)/,
        title: '밤 기침이 심하면 수분·실내 습도·의료진 안내를 보고, 영아에게 약 없이 민간 요법을 과신하지 마세요',
        lead: '호흡 곤란·함몰·청색이면 응급입니다. 약 용량은 단정하지 않습니다.',
        points: [
            ['관찰', '호흡, 수분'],
            ['응급', '힘겨운 호흡']
        ],
        blocks: [
            ['지금 할 일', '호흡 모양을 확인하세요.'],
            ['하지 않을 일', '꿀은 1세 미만에 주지 마세요.'],
            ['관련', '기침·크룹 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['열·감기 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'croup-bark',
        match: /(크룹|개\s*짖|짖는\s*기침|컹컹|금속성\s*기침|숨을\s*헐떡.*밤)/,
        title: '컹컹 기침·숨소리 이상은 밤사이 악화될 수 있어 호흡을 봅니다',
        lead: '크룹 등으로 컹컹한 기침·쉰 목소리가 날 수 있습니다. 숨이 가쁘거나 가슴이 들어가고, 침을 못 삼키거나 파랗게 보이면 응급입니다. 약 용량은 사이트에서 정하지 않습니다.',
        points: [
            ['가정', '차분한 환경, 수유·수분, 보호자가 호흡을 관찰'],
            ['응급', '심한 호흡 곤란, 침 흘리며 삼키지 못함, 청색증, 처짐']
        ],
        blocks: [
            ['지금 할 일', '기침 시작·발열·호흡 모습을 기록하세요.'],
            ['하지 않을 일', '민간 훈증·성인 진해제를 임의로 쓰지 마세요.'],
            ['진료', '밤에 갑자기 심해지면 진료·응급 평가를 미루지 마세요.']
        ],
        links: [
            ['CDC RSV·호흡기 안내', 'https://www.cdc.gov/rsv/infants-young-children/index.html'],
            ['발열·응급 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'nipple-shield-boundary',
        match: /(유두\s*보호기|니플\s*실드|nipple\s*shield|수유\s*보호기|유두\s*쉴드)/,
        title: '유두 보호기는 모든 수유에 필수는 아니며, 사용·중단은 수유 상담·의료진과 상의하세요',
        lead: '유두 보호기는 일시적으로 도움이 될 수 있으나 젖 이동·위생·의존 문제가 있을 수 있습니다. 통증·유착·조산 등 이유에 따라 전문가 평가 후 쓰세요. 브랜드 순위·“무조건 필수” 광고는 따르지 않습니다.',
        points: [
            ['사용', '올바른 크기, 세척, 수유량·체중 관찰'],
            ['상담', '통증 지속, 체중 정체, 끊는 방법']
        ],
        blocks: [
            ['지금 할 일', '보호기 없이/있을 때 젖물림 차이를 기록하세요.'],
            ['하지 않을 일', '맞지 않는 크기를 억지로 쓰지 마세요.'],
            ['관련', '젖물림 통증·유선염 안내를 참고하세요.']
        ],
        links: [
            ['AAP 모유 수유 개요', 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/default.aspx'],
            ['CDC 모유 수유', 'https://www.cdc.gov/breastfeeding/']
        ]
    },
    {
        id: 'nipple-pain-latch',
        match: /(유두.{0,6}(통증|아픔|상처|헐|아프|아파)|젖꼭지.{0,6}(헐|아프|통증|아파)|수유\s*아픔|물림이\s*안|젖\s*물리)/,
        title: '수유 통증이 심하면 물림·감염을 점검하고 참지 마세요',
        lead: '초기 며칠 가벼운 민감함은 있을 수 있으나, 매 수유마다 심한 통증·상처·갈라짐은 물림 문제나 감염 신호일 수 있습니다. 참지 말고 수유 상담·의료진을 찾으세요.',
        points: [
            ['점검', '입술이 젖혀지고 깊이 무는지, 수유 후 유두 모양'],
            ['진료', '열·유방 발적(유선염), 흰 반점·아구창 의심, 출혈·심한 상처']
        ],
        blocks: [
            ['지금 할 일', '다른 자세를 시도하고, 통증 위치·시점을 기록하세요.'],
            ['하지 않을 일', '아픈데도 억지로 오래 물리거나, 검증 안 된 연고만 바르고 미루지 마세요.'],
            ['상담', '국제수유상담가·소아·산부인과 등 도움을 요청하세요.']
        ],
        links: [
            ['질병관리청 모유 수유', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586'],
            ['유선염 안내', '#home']
        ]
    },
    {
        id: 'fever-without-source',
        match: /(열만\s*나|원인\s*모를\s*열|열\s*말고\s*다른|미열\s*계속|열이\s*안\s*떨어져)/,
        title: '열은 원인보다 나이·호흡·수분·지속 시간을 함께 봅니다',
        lead: '“열만 있다”고 느껴도 나이와 전신 상태가 우선입니다. 3개월 미만 38℃ 이상은 바로 평가가 필요합니다. 해열제 용량은 사이트에서 정하지 않습니다.',
        points: [
            ['바로 진료', '3개월 미만 38℃↑, 호흡 곤란, 처짐, 발진·경련, 수분 섭취 급감'],
            ['기록', '측정 방법·시간·최고 체온·수유·소변']
        ],
        blocks: [
            ['지금 할 일', '체온을 정확히 다시 재고 상태를 적으세요.'],
            ['하지 않을 일', '해열제로 숫자만 낮추며 진료를 미루지 마세요.'],
            ['관련', '발열 전체 가이드와 접종 후 반응 안내를 참고하세요.']
        ],
        links: [
            ['발열·응급 가이드', 'blog/baby-fever-cold-guide.html#urgent'],
            ['접종 후 반응', '#home']
        ]
    },
    {
        id: 'poop-frequency-newborn',
        match: /(신생아|모유).*(변\s*횟|응가\s*횟|며칠\s*안\s*똥)|변을\s*며칠|응가\s*안\s*해요.*모유/,
        title: '모유 수유 아기는 변 횟수가 들쭉날쭉할 수 있고, 통증·딱딱함·전신을 봅니다',
        lead: '모유 아기는 하루 여러 번이거나 며칠에 한 번일 수도 있습니다. 횟수만으로 변비라고 단정하지 않습니다. 딱딱하고 아픈 변, 배가 붓고, 토·수유 거부·처짐이 있으면 진료합니다.',
        points: [
            ['관찰', '변 모양(물·무름·딱딱), 힘주기 통증, 수유·소변, 복부 팽만'],
            ['진료', '혈변, 흰 변, 심한 구토, 처짐, 생후 초기 변을 전혀 안 함']
        ],
        blocks: [
            ['지금 할 일', '며칠간의 변·수유를 기록하세요.'],
            ['하지 않을 일', '관장·민간 허브를 임의로 쓰지 마세요.'],
            ['관련', '변비·설사 직접 답도 참고하세요.']
        ],
        links: [
            ['변비 안내', '#home'],
            ['질병관리청 변비', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=5827']
        ]
    },
    {
        id: 'swim-goggles-ear-plugs-boundary',
        match: /(수경\s*아이|물안경\s*아기|swim\s*goggles|귀마개\s*수영|ear\s*plugs\s*swim|수영\s*귀마개)/,
        title: '수경·수영 귀마개는 맞을 때만 쓰고, 아프거나 맞지 않으면 억지로 끼우지 마세요',
        lead: '수경은 눈 자극을 줄이는 데 도움이 될 수 있고, 귀마개는 일부 상황에서 쓰입니다. 너무 조이면 통증·압박이 납니다. 외이도염·고막 문제는 의료진 안내를 따르세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['수경', '크기 맞추기, 너무 세게 조이지 않기'],
            ['귀', '통증 시 중단, 면봉 깊게 금지']
        ],
        blocks: [
            ['지금 할 일', '수경 밴드가 너무 조이는지 확인하세요.'],
            ['하지 않을 일', '아픈 귀에 귀마개를 억지로 넣지 마세요.'],
            ['관련', '수영자 귀·물 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 건강한 수영', 'https://www.cdc.gov/healthy-swimming/'],
            ['AAP 물놀이 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'swimmer-ear-boundary',
        match: /(외이도염|수영자\s*귀|swimmer.?s?\s*ear|물놀이\s*후\s*귀|귀\s*가려\s*물놀이|수영\s*후\s*귀|swimmers\s*ear)/,
        title: '물놀이 후 귀 통증·가려움은 외이도 문제일 수 있어 면봉 깊게 금지·진료를 검토하세요',
        lead: '수영 후 귀가 아프거나 가렵고 진물이 나면 외이도염 등 가능성이 있으나 사진·증상만으로 단정하지 않습니다. 면봉을 깊게 넣지 말고, 통증·발열·청력 변화가 있으면 진료하세요. 약 용량·브랜드 추천은 하지 않습니다.',
        points: [
            ['관리', '물기 가볍게 닦기, 면봉 깊게 금지'],
            ['진료', '통증, 붓기, 진물, 발열, 청력 저하']
        ],
        blocks: [
            ['지금 할 일', '물놀이 후 귀를 옆으로 기울여 물기를 빼 보세요.'],
            ['하지 않을 일', '알코올·민간 오일을 임의로 넣지 마세요.'],
            ['관련', '중이염·귀지·물 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 외이도염(수영자 귀)', 'https://www.cdc.gov/swimmers-ear/'],
            ['AAP 귀 건강 개요', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/default.aspx']
        ]
    },
    {
        id: 'ear-tubes-boundary',
        match: /(중이\s*환기관|귀\s*튜브|ear\s*tubes|고막\s*튜브|환기관\s*수술|튜브\s*삽입\s*귀)/,
        title: '귀 튜브(환기관) 여부는 중이염 빈도·청력·진료 소견으로 의료진이 판단합니다',
        lead: '반복 중이염·삼출성 중이염 등에서 튜브를 논의할 수 있으나, 모든 중이염에 필수는 아닙니다. 수술·마취·관리 방법은 의료진이 설명합니다. 사이트에서 수술 여부를 단정하지 않습니다.',
        points: [
            ['상담 계기', '잦은 중이염, 청력·말 지연 걱정, 장기 삼출'],
            ['관리', '물·감염 안내는 담당의 지시']
        ],
        blocks: [
            ['지금 할 일', '중이염 횟수와 치료 이력을 정리하세요.'],
            ['하지 않을 일', '카페 후기만 보고 수술을 결정하지 마세요.'],
            ['관련', '중이염·청력 걱정 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중이염·귀 건강 개요', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/default.aspx'],
            ['CDC 귀 감염 개요', 'https://www.cdc.gov/ear-infection/']
        ]
    },
    {
        id: 'ear-pain-flying-boundary',
        match: /(귀\s*통증\s*비행|비행기\s*귀\s*아픔|ear\s*pain\s*fly|중이염\s*비행기|이착륙\s*귀\s*아이)/,
        title: '귀가 아픈 채 비행이 걱정되면 의료진과 상의하고, 이착륙 때 수유·삼킴을 도와보세요',
        lead: '기압 변화로 귀가 아플 수 있습니다. 비행 가능 여부는 진료 상태를 따릅니다. 약 용량은 단정하지 않습니다.',
        points: [
            ['도움', '수유, 삼킴, 하품'],
            ['상담', '급성 중이염, 심한 통증']
        ],
        blocks: [
            ['지금 할 일', '이착륙 때 물을 마시거나 수유해 보세요.'],
            ['하지 않을 일', '아픈 귀를 억지로 막지 마세요.'],
            ['관련', '비행기 귀·중이염 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'post-flight-ear-pain-boundary',
        match: /(비행\s*후\s*귀\s*아픔|착륙\s*뒤\s*귀\s*통증|post\s*flight\s*ear\s*pain|비행기\s*타고\s*귀)/,
        title: '비행 후 귀 통증이 지속되면 관찰·진료를 검토하고, 이착륙 때 삼킴을 도와보세요',
        lead: '중이 압력·감염이 겹칠 수 있습니다. 약 용량은 단정하지 않습니다.',
        points: [
            ['도움', '수분, 수유'],
            ['진료', '지속 통증, 발열']
        ],
        blocks: [
            ['지금 할 일', '통증 시간과 열을 기록하세요.'],
            ['하지 않을 일', '귀를 면봉으로 파지 마세요.'],
            ['관련', '비행기 귀·중이염 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'ear-infection-care',
        match: /(중이염|귀\s*염증|귀\s*아파|귓병|이통|귀가\s*아파)/,
        title: '귀 통증·중이염 의심은 진찰이 필요하고, 항생제는 의사가 정합니다',
        lead: '감기 뒤 귀 통증, 발열, 수면 방해, 귀 분비물이 있으면 중이염 등을 의료진이 진찰로 판단합니다. 귀를 만진다고 모두 중이염은 아닙니다. 사이트에서 항생제 처방 여부를 단정하지 않습니다.',
        points: [
            ['관찰', '열, 보챔, 수유·수면, 귀 분비물, 감기 동반'],
            ['바로 진료', '고열·심한 통증, 귀에서 고름, 처짐, 균형 이상·심한 구토']
        ],
        blocks: [
            ['지금 할 일', '증상 시작과 체온을 적어 소아청소년과를 방문하세요.'],
            ['하지 않을 일', '귀에 민간 오일·약초를 넣거나 남은 항생제를 쓰지 마세요.'],
            ['관련', '귀를 잡아당기는 습관만 있을 때는 귀 만짐 안내도 참고하세요.']
        ],
        links: [
            ['CDC 중이염 개요', 'https://www.cdc.gov/ear-infection/about/index.html'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'vaccine-catchup-schedule-boundary',
        match: /(접종\s*밀림|예방접종\s*따라잡|vaccine\s*catch\s*up|접종\s*연기\s*후|스케줄\s*놓친\s*접종)/,
        title: '접종이 밀리면 따라잡기 일정은 의료진·표준 일정표를 따르고, 임의로 건너뛰지 마세요',
        lead: '질환·용량 조합은 전문가 판단이 필요합니다. 여기서 개별 스케줄을 짜지 않습니다.',
        points: [
            ['행동', '진료 예약, 수첩 지참'],
            ['피하기', '임의 생략']
        ],
        blocks: [
            ['지금 할 일', '접종 수첩을 가지고 상담하세요.'],
            ['하지 않을 일', 'SNS 일정만 보고 결정하지 마세요.'],
            ['관련', '접종 일정 안내를 참고하세요.']
        ],
        links: [
            ['접종 가이드', 'blog/baby-vaccination-schedule-guide.html'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'vaccine-schedule-check',
        match: /(예방접종\s*일정|접종\s*일정|백신\s*스케줄|접종\s*표|다음\s*접종|접종\s*언제|국가예방접종)/,
        title: '예방접종 일정은 아이별 기록으로 확인하고, 고정 표만 따르지 않습니다',
        lead: '국가예방접종 일정은 아이의 실제 접종 기록·예진에 따라 달라질 수 있습니다. 사이트에 박힌 연도 표만 보고 단정하지 말고, 예방접종도우미와 접종 기관에서 확인하세요.',
        points: [
            ['확인 순서', '예방접종도우미 아이 기록 → 접종 기관 예진 → 다음 일정'],
            ['아프면', '열이 있거나 아픈 날은 접종 연기를 의료진과 상의합니다.']
        ],
        blocks: [
            ['지금 할 일', '도우미 앱·누리집에서 접종 이력을 확인하세요.'],
            ['하지 않을 일', '카페 표를 복사해 접종을 미루거나 임의로 순서를 바꾸지 마세요.'],
            ['이상반응', '접종 후 심한 반응이 있으면 진료·신고 경로를 이용하세요.']
        ],
        links: [
            ['예방접종 일정 확인 가이드', 'blog/vaccination-schedule.html'],
            ['예방접종도우미', 'https://nip.kdca.go.kr/'],
            ['접종 후 반응 안내', '#home']
        ]
    },
    {
        id: 'engorgement-vs-mastitis',
        match: /(젖몸살|유방\s*팽만|유방\s*부어|젖이\s*빵빵|울혈|engorg)/,
        title: '젖몸살(팽만)과 유선염을 구분하고, 열·발적이 있으면 진료합니다',
        lead: '수유가 늘거나 텀이 길 때 양쪽이 단단하고 무거울 수 있습니다. 수유·유축으로 편안해지면 팽만일 수 있습니다. 한쪽이 빨갛고 뜨거우며 몸살·고열이 동반되면 유선염 쪽을 의심하고 진료하세요.',
        points: [
            ['팽만 쪽으로', '양쪽·전반적 팽창, 수유 후 다소 완화, 전신 증상 약함'],
            ['유선염 쪽', '국소 발적·열감, 독감 같은 증상, 고열, 24시간 내 악화']
        ],
        blocks: [
            ['지금 할 일', '자주 수유·유축을 시도하고, 증상·체온을 기록하세요.'],
            ['하지 않을 일', '무리한 강한 마사지·검증 안 된 민간요법만으로 미루지 마세요.'],
            ['진료', '열·발적·통증이 심하면 유선염 안내와 함께 의료진을 찾으세요.']
        ],
        links: [
            ['유선염 안내', '#home'],
            ['NHS 유선염', 'https://www.nhs.uk/conditions/mastitis/']
        ]
    },
    {
        id: 'blw-safety',
        match: /(blw|BLW|아기주도\s*이유|핑거\s*푸드|손\s*이유식|스스로\s*먹이)/,
        title: '스스로 먹는 이유식도 준비 신호·질식 예방·지켜보기가 먼저입니다',
        lead: '아기 주도 이유식(BLW)을 쓰더라도 개월 수만 보지 말고 앉기·삼키기 준비 신호를 확인합니다. 둥근 덩어리·딱딱한 음식·통포도 등 질식 위험 형태는 피하고, 식사 내내 보호자가 지켜봅니다. “영상처럼 큰 고기”를 그대로 주지 마세요.',
        points: [
            ['안전', '앉은 자세, 부드러운 질감·안전한 크기, 보호자 감시, 질식 응급 지식'],
            ['함께', '모유·분유는 첫돌 전 주된 영양으로 유지하는 경우가 많습니다.']
        ],
        blocks: [
            ['지금 할 일', '이유식 시작 신호와 질식 경계 가이드를 확인하세요.'],
            ['하지 않을 일', '눕혀 먹이거나 차 안에서 혼자 먹이지 마세요.'],
            ['관련', '구역질과 질식의 차이를 구분하세요.']
        ],
        links: [
            ['이유식·질식 가이드', 'blog/complementary-feeding-allergy-guide.html#choking'],
            ['CDC 질식 위험 식품', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html'],
            ['AAP BLW·안전 요약', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/baby-led-weaning-is-it-safe.aspx']
        ]
    },
    {
        id: 'iron-rich-foods',
        match: /(철분|빈혈|철\s*강화|고기\s*이유식|철분\s*부족).*(이유|아기|먹)|이유식.*철/,
        title: '이유식 시기에는 철이 많은 음식을 다양하게, 용량 약은 의료진과',
        lead: '생후 6개월 전후 이유식을 시작할 때 철이 풍부한 식품(고기·철 강화 곡물 등)을 포함하라는 안내가 많습니다. 보충제 용량·제품은 검사·진료 없이 사이트에서 정하지 않습니다.',
        points: [
            ['식단', '연령에 맞는 질감으로 고기·철 강화 곡물 등을 한 번에 하나씩 도입'],
            ['진료', '창백함·처짐·성장 걱정·조산아는 의료진과 철 검사·보충을 상의']
        ],
        blocks: [
            ['지금 할 일', '현재 이유식 구성에 철 공급원이 있는지 확인하세요.'],
            ['하지 않을 일', '성인 철분제를 임의로 먹이거나 과량 주지 마세요.'],
            ['관련', '이유식 시작·알레르기 도입 안내를 함께 보세요.']
        ],
        links: [
            ['CDC 이유식 시작', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html'],
            ['이유식 가이드', 'blog/complementary-feeding-allergy-guide.html']
        ]
    },
    {
        id: 'brick-dust-urine',
        match: /(주황\s*가루|분홍\s*가루|요산\s*결정|brick\s*dust|주황\s*점\s*기저귀|기저귀\s*주황|분홍\s*얼룩\s*기저귀|주황\s*얼룩\s*소변)/,
        title: '신생아 기저귀의 주황·분홍 가루 얼룩은 요산 결정일 수 있고, 횟수·처짐과 함께 봅니다',
        lead: '생후 초기에 기저귀에 주황·분홍빛 가루 같은 얼룩이 보일 수 있으며, 요산 결정으로 설명되는 경우가 있습니다. 그 자체만으로 병이라고 단정하지 않되, 젖은 기저귀가 거의 없고 처지며 수유가 안 되면 탈수·다른 문제로 진료하세요. 사진만으로 혈뇨·병명을 정하지 않습니다.',
        points: [
            ['흔함', '생후 며칠, 수유 정착 전 요산 얼룩 가능'],
            ['진료', '소변 거의 없음, 처짐, 진짜 핏빛 지속, 발열']
        ],
        blocks: [
            ['지금 할 일', '24시간 젖은 기저귀·수유 횟수를 적으세요.'],
            ['하지 않을 일', '사진 앱으로 “혈뇨”라고 단정하지 마세요.'],
            ['관련', '젖은 기저귀·황달·탈수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 신생아 소변·기저귀 관찰', 'https://www.healthychildren.org/English/ages-stages/baby/Pages/Babys-First-Days-Bowel-Movements-and-Urination.aspx'],
            ['NHS 신생아 기저귀(영)', 'https://www.nhs.uk/baby/caring-for-a-newborn/nappies/'],
            ['탈수 안내', '#home']
        ]
    },
    {
        id: 'wet-diaper-count-worry-boundary',
        match: /(소변\s*횟수\s*걱정|소변\s*횟수\s*걱정|젖은\s*기저귀\s*몇\s*장|wet\s*diaper\s*count\s*worry)/,
        title: '소변 횟수는 수분·성장과 함께 보고, 급감·처짐이면 진료하세요',
        lead: '정확한 장수만으로 모든 것을 단정하지 않습니다.',
        points: [
            ['관찰', '횟수 변화, 처짐'],
            ['진료', '무뇨, 기력 저하']
        ],
        blocks: [
            ['지금 할 일', '최근 패턴을 기록하세요.'],
            ['하지 않을 일', '인터넷 숫자만 보고 단정하지 마세요.'],
            ['관련', '젖은 기저귀 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['수유 가이드', 'blog/breastfeeding-guide.html']
        ]
    },
    {
        id: 'wet-diapers-count',
        match: /(젖은\s*기저귀|기저귀\s*횟수|소변\s*횟수|오줌\s*횟|하루\s*몇\s*번\s*기저귀)/,
        title: '젖은 기저귀는 수유 충분·탈수를 가늠하는 단서입니다',
        lead: '생후 며칠이 지나면 하루 동안 충분히 젖은 기저귀가 나오는지가 수분·수유를 보는 데 도움이 됩니다. 정확한 “모든 아기 동일 횟수”는 없으며, 평소보다 크게 줄고 처지면 진료합니다.',
        points: [
            ['관찰', '24시간 젖은 기저귀, 소변 색, 수유 횟수, 활력'],
            ['진료', '소변 거의 없음, 입 마름, 처짐, 수유 거부, 3개월 미만 발열']
        ],
        blocks: [
            ['지금 할 일', '하루 기저귀와 수유를 간단히 적으세요.'],
            ['하지 않을 일', '카페 숫자만 보고 분유를 임의 농축하지 마세요.'],
            ['관련', '젖양·탈수·수유량 안내를 함께 보세요.']
        ],
        links: [
            ['젖양 신호 안내', '#home'],
            ['탈수 안내', '#home'],
            ['AAP 충분히 먹는지', 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/How-to-Tell-if-Baby-is-Getting-Enough-Milk.aspx']
        ]
    },
    {
        id: 'burp-not-coming-boundary',
        match: /(트림\s*안\s*나|트림\s*실패|burp\s*not\s*coming|트림\s*안\s*되는데|공기\s*빼\s*실패)/,
        title: '트림이 안 나와도 억지로 등 두드리기만 길게 하지 말고, 자세를 바꿔 시도하세요',
        lead: '모든 수유마다 큰 트림이 필요한 것은 아닐 수 있습니다. 심한 보챔·구토는 진료를 검토하세요.',
        points: [
            ['시도', '자세 변경, 짧게'],
            ['피하기', '과도한 등 두드림']
        ],
        blocks: [
            ['지금 할 일', '어깨·앉은 자세를 바꿔 보세요.'],
            ['하지 않을 일', '세게 장시간 두드리지 마세요.'],
            ['관련', '트림·가스 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['수유 가이드', 'blog/breastfeeding-guide.html']
        ]
    },
    {
        id: 'burping-gas',
        match: /(트림|트림\s*안|방귀\s*많|가스\s*차|트림\s*방법)/,
        title: '트림은 수유 중·후에 돕고, 토함·울음과 함께 봅니다',
        lead: '수유 중 공기를 삼키면 트림이 도움이 될 수 있습니다. 모든 수유마다 꼭 나와야 하는 것은 아닙니다. 분수토·성장 정체·심한 통증 울음이 있으면 토함·배앓이 안내와 진료를 보세요.',
        points: [
            ['방법', '세로로 안아 등을 가볍게 두드리기, 수유 중간에 쉬기'],
            ['진료', '힘주어 토함, 혈변, 처짐, 수유 거부']
        ],
        blocks: [
            ['지금 할 일', '수유 자세와 젖병 각도·유량을 점검하세요.'],
            ['하지 않을 일', '강하게 흔들거나 등을 세게 두드리지 마세요.'],
            ['관련', '토함·배앓이 직접 답을 참고하세요.']
        ],
        links: [
            ['토함·역류 안내', '#home'],
            ['배앓이형 울음', '#home']
        ]
    },
    {
        id: 'growth-spurt',
        match: /(성장\s*급등|그로스\s*스퍼트|growth\s*spurt|갑자기\s*많이\s*먹|며칠\s*보챔.*수유)/,
        title: '갑자기 자주 찾는 며칠은 성장·수유 변화일 수 있고, 부족 단정은 금물입니다',
        lead: '며칠간 수유를 더 찾고 보채는 시기가 있을 수 있습니다. 그 자체로 젖이 “고장” 난 것은 아닙니다. 다만 소변·체중·처짐을 함께 보고, 지속되면 진료합니다. 고정 “○주 급등표”를 사실처럼 쓰지 않습니다.',
        points: [
            ['대응', '배고픔 신호에 맞춰 수유, 보호자 휴식·수분'],
            ['점검', '기저귀 감소, 체중 정체, 지속 처짐·황달']
        ],
        blocks: [
            ['지금 할 일', '24시간 수유·기저귀를 기록하세요.'],
            ['하지 않을 일', '카페 급등 표만 보고 분유를 임의 고정 추가하지 마세요.'],
            ['관련', '몰아 수유·젖양 안내를 함께 보세요.']
        ],
        links: [
            ['몰아 수유 안내', '#home'],
            ['젖양 신호', '#home']
        ]
    },
    {
        id: 'room-share-duration-boundary',
        match: /(룸셰어\s*기간|같은\s*방\s*언제까지|room\s*share\s*how\s*long|부모\s*방\s*수면\s*기간|분리\s*수면\s*언제)/,
        title: '초기 룸셰어는 안전수면 권고와 가족 상황을 함께 보고, 별도 침대·등 재우기를 유지하세요',
        lead: '많은 안내가 생후 최소 6개월 같은 방·별도 수면면을 권합니다. 침대 공유와는 다릅니다. 개월 수 단정만으로 강제하지 않습니다.',
        points: [
            ['원칙', '같은 방, 별도 수면면'],
            ['금지', '소파·성인 침대 위험 공유']
        ],
        blocks: [
            ['지금 할 일', '별도 침대·등 재우기를 확인하세요.'],
            ['하지 않을 일', '소파에서 함께 잠들지 마세요.'],
            ['관련', '룸셰어·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'sibling-room-share-infant-boundary',
        match: /(형제\s*같은\s*방\s*아기|형제\s*같은\s*방\s*아기|형\s*방\s*신생아|sibling\s*room\s*share\s*infant)/,
        title: '어린 영아와 형제가 같은 방을 쓸 때는 영아 수면 공간을 비우고 감독하세요',
        lead: '형제 침대 공유는 위험할 수 있습니다.',
        points: [
            ['원칙', '영아 별도 수면면'],
            ['금지', '형제 침대 함께 잠']
        ],
        blocks: [
            ['지금 할 일', '아기 침대를 분리하세요.'],
            ['하지 않을 일', '형 침대에 아기를 두지 마세요.'],
            ['관련', '룸셰어·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'room-sharing',
        match: /(같은\s*방|룸\s*셰어|room\s*shar|옆에서\s*재우|요람.*침대\s*옆)/,
        title: '같은 방·별도 수면면이 권고이고, 같은 표면 동침과는 다릅니다',
        lead: '생후 최소 6개월(가능하면 더 오래) 같은 방에서, 아기 전용 수면면에 등을 대고 재우라는 안내가 있습니다. 보호자 침대 이불 속에서 같이 자는 것과는 다릅니다.',
        points: [
            ['권고', '같은 방 + 요람·침대 등 별도 단단한 면 + 등 + 빈 공간'],
            ['피하기', '소파·성인 이불 속 동침']
        ],
        blocks: [
            ['지금 할 일', '아기 수면 공간을 보호자 침대 옆에 두는지 확인하세요.'],
            ['하지 않을 일', '통잠을 위해 같은 이불 속에서 재우지 마세요.'],
            ['관련', '동침·안전수면 안내를 함께 보세요.']
        ],
        links: [
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html'],
            ['동침 안내', '#home'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'public-restroom-hygiene-boundary',
        match: /(공용\s*화장실|공공\s*화장실|public\s*restroom|마트\s*화장실\s*아기|화장실\s*위생\s*아이)/,
        title: '공용 화장실 이용 후 손 씻기를 하고, 바닥에 닿은 물건은 입에 넣지 않게 하세요',
        lead: '공용 공간은 손이 많이 닿습니다. 손 씻기·물티슈로 위생을 챙기세요. 소독제 브랜드 순위는 하지 않습니다.',
        points: [
            ['위생', '손 씻기, 물티슈'],
            ['주의', '바닥에 떨어진 공']
        ],
        blocks: [
            ['지금 할 일', '나올 때 비누로 손을 씻으세요.'],
            ['하지 않을 일', '바닥 물건을 입에 넣게 두지 마세요.'],
            ['관련', '손 씻기·외출 배변 안내를 참고하세요.']
        ],
        links: [
            ['CDC 위생', 'https://www.cdc.gov/hygiene/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'hand-sanitizer-when-child-boundary',
        match: /(손\s*소독제\s*아이|핸드\s*새니타이저\s*유아|hand\s*sanitizer\s*child|소독\s*젤\s*아기|알코올\s*손\s*세정)/,
        title: '손이 덜 더러우면 소독제가 대안이 될 수 있으나, 눈에 띄게 더러우면 비누 세척이 우선입니다',
        lead: '섭취·눈 접촉을 막고 소량을 쓰세요. 삼킴은 중독 상담·진료를 검토하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '비누와 물'],
            ['대안', '소독제, 소량, 감독']
        ],
        blocks: [
            ['지금 할 일', '마르기 전에 눈을 비비지 않게 하세요.'],
            ['하지 않을 일', '병을 가지고 놀게 두지 마세요.'],
            ['관련', '손 씻기·소독제 섭취 안내를 참고하세요.']
        ],
        links: [
            ['CDC 위생', 'https://www.cdc.gov/hygiene/'],
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'shared-towel-hygiene-boundary',
        match: /(공용\s*수건)/,
        title: '아픈 가족이 있으면 수건을 구분해 쓰고, 젖은 수건을 오래 두지 마세요',
        lead: '감염 전파를 줄이는 데 도움이 될 수 있습니다.',
        points: [
            ['위생', '개인 수건, 건조'],
            ['교체', '냄새·젖음']
        ],
        blocks: [
            ['지금 할 일', '아이 전용 수건을 두세요.'],
            ['하지 않을 일', '바닥에 떨어진 수건을 얼굴에 쓰지 마세요.'],
            ['관련', '손 씻기·위생 안내를 참고하세요.']
        ],
        links: [
            ['CDC 위생', 'https://www.cdc.gov/hygiene/'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'classroom-handwashing-boundary',
        match: /(교실\s*손\s*씻기|학교\s*손\s*위생|classroom\s*handwash|급식\s*전\s*손\s*씻|수업\s*후\s*손\s*씻)/,
        title: '학교·교실에서는 급식 전후·화장실 후 손 씻기를 강조하고, 아플 때 등원 기준을 지키세요',
        lead: '손 씻기가 감염 예방에 중요합니다. 소독제 브랜드 순위는 하지 않습니다.',
        points: [
            ['때', '급식 전, 화장실 후'],
            ['등원', '열·전염 증상']
        ],
        blocks: [
            ['지금 할 일', '집에 와서도 손 씻기를 루틴으로 하세요.'],
            ['하지 않을 일', '아프면 무리해 보내지 마세요.'],
            ['관련', '손 씻기·등원 안내를 참고하세요.']
        ],
        links: [
            ['CDC 위생', 'https://www.cdc.gov/hygiene/'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'daycare-sanitizer-ingest-boundary',
        match: /(어린이집\s*손\s*소독제\s*섭취|어린이집\s*손\s*소독제\s*먹|소독\s*젤\s*섭취\s*어린이집|daycare\s*sanitizer\s*ingest)/,
        title: '손 소독제를 마셨다면 양을 확인하고 중독 상담·진료 안내를 따르세요',
        lead: '평소에는 눈에 띄게 더러우면 비누 세척이 우선입니다.',
        points: [
            ['즉시', '상담, 라벨'],
            ['금지', '억지 구토']
        ],
        blocks: [
            ['지금 할 일', '제품명을 챙기세요.'],
            ['하지 않을 일', '병을 가지고 놀게 두지 마세요.'],
            ['관련', '소독제 섭취 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'hand-washing-illness',
        match: /(손\s*씻|손씻기).*(감염|위생|예방|육아|아기|아이)|감염\s*예방.*손|위생.*손\s*씻/,
        title: '손 씻기는 감염 예방의 기본이고, 아픈 아이 돌볼 때 특히 중요합니다',
        lead: '수유·이유식·기저귀 전후, 외출 후, 아플 때 돌보기 전후에 비누로 손을 씻으면 전파를 줄이는 데 도움이 됩니다. 손 씻기만으로 모든 병을 막지는 못하며, 호흡 곤란·고열 등 응급 신호는 진료가 우선입니다.',
        points: [
            ['언제', '수유·조리 전, 기저귀 후, 코 풀기·재채기 후, 외출 후'],
            ['방법', '비누와 물로 충분히, 알코올 손소독제는 손이 덜 더러울 때 보조']
        ],
        blocks: [
            ['지금 할 일', '가족·방문객에게도 손 씻기를 부탁하세요.'],
            ['하지 않을 일', '손 씻기만 믿고 호흡 곤란·탈수를 방치하지 마세요.'],
            ['관련', 'RSV·독감·수족구 안내를 참고하세요.']
        ],
        links: [
            ['CDC RSV 예방·돌봄', 'https://www.cdc.gov/rsv/infants-young-children/index.html'],
            ['질병관리청 수족구 예방(손 씻기)', 'https://www.kdca.go.kr/']
        ]
    },
    {
        id: 'room-temp-sleep-boundary',
        match: /(방\s*온도\s*재우|수면\s*실내\s*온도|room\s*temperature\s*sleep|몇\s*도\s*재우|아기\s*방\s*온도)/,
        title: '아기 방은 너무 덥지 않게, 한 겹 얇은 옷·수면조끼로 조절하고 한 온도로 단정하지 마세요',
        lead: '과열은 안전수면 위험 요인으로 거론됩니다. 모든 집에 동일한 “정답 온도 숫자”만으로 단정하지 않으며, 땀·더위 신호·통풍을 봅니다. 두꺼운 이불·전열 기구는 피하세요. 온도계 브랜드 추천은 하지 않습니다.',
        points: [
            ['관찰', '땀, 뒷목, 빠른 호흡, 방 답답함'],
            ['환경', '얇은 옷, 통풍, 전열 기구 치우기']
        ],
        blocks: [
            ['지금 할 일', '재울 때 뒷목이 축축한지 확인하세요.'],
            ['하지 않을 일', '전기장판·두꺼운 이불로 과열시키지 마세요.'],
            ['관련', '과열 수면·안전수면·전기장판 안내를 참고하세요.']
        ],
        links: [
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'overheating-sleep',
        match: /(과열|더워\s*재우|이불\s*많이|땀\s*흘리며\s*잠|실내\s*온도.*아기|너무\s*덥게)/,
        title: '잠자리 과열을 피하고, 두꺼운 이불·모자 재우기를 줄입니다',
        lead: '너무 더운 환경·과도한 이불은 수면 중 위험과 관련이 있을 수 있습니다. 얇은 옷·적절한 실내 온도, 얼굴이 가리지 않는 수면이 안전합니다. 정확한 “○℃만”을 사이트에서 단정하지 않고, 땀·목 뒤를 만져 조절합니다.',
        points: [
            ['점검', '목 뒤가 축축한지, 얼굴이 이불에 덮이는지, 모자 재우기 여부'],
            ['원칙', '등 자세, 빈 수면 공간, 연기 없는 환경']
        ],
        blocks: [
            ['지금 할 일', '이불과 옷을 한 겹 줄여 보세요.'],
            ['하지 않을 일', '전기장판 위·두꺼운 이불 속에서 재우지 마세요.'],
            ['관련', '안전수면·땀띠 안내를 참고하세요.']
        ],
        links: [
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'first-haircut-boundary',
        match: /(첫\s*이발|첫\s*미용실|first\s*haircut|아기\s*이발|신생아\s*머리\s*자르)/,
        title: '첫 이발은 위생·가위 안전이 우선이고, “운세·특정 날짜”를 필수로 단정하지 마세요',
        lead: '머리카락이 눈을 가리거나 관리가 필요할 때 자를 수 있습니다. 가정에서는 가위 끝을 조심하고, 미용실에서는 아이 고정·위생을 확인하세요. 민간 금기 날짜만으로 미룰 필요는 없습니다. 브랜드·샵 순위는 하지 않습니다.',
        points: [
            ['안전', '가위 방향, 아이 고정, 머리카락 흡입 주의'],
            ['위생', '도구 소독, 피부 상처 시 진료']
        ],
        blocks: [
            ['지금 할 일', '앞머리가 눈을 찌르는지 확인하세요.'],
            ['하지 않을 일', '움직이는 아이에게 큰 가위를 들이대지 마세요.'],
            ['관련', '손톱 자르기·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 신생아·유아 케어 개요', 'https://www.healthychildren.org/English/ages-stages/baby/Pages/default.aspx'],
            ['CDC 위생 개요', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'nail-trim-resistance-boundary',
        match: /(발톱\s*깎기\s*저항)/,
        title: '손톱·발톱 깎기를 싫어하면 수면 직후 등 차분한 때를 고르고, 억지로 다투다 다치지 않게 하세요',
        lead: '너무 짧게 깎아 살을 파지 마세요. 기구 순위는 하지 않습니다.',
        points: [
            ['때', '차분할 때, 짧은 시간'],
            ['주의', '상처']
        ],
        blocks: [
            ['지금 할 일', '한 번에 다 깎으려 하지 마세요.'],
            ['하지 않을 일', '움직이는 손을 세게 잡지 마세요.'],
            ['관련', '손발톱 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'nail-trimming-infant',
        match: /(손톱\s*자르|발톱\s*자르|손톱\s*깎|발톱\s*깎|손톱\s*정리|아기\s*손톱|신생아\s*손톱|nail\s*trim)/,
        title: '아기 손톱은 짧게 유지하되, 살을 깊게 파지 말고 안전한 도구로 자르세요',
        lead: '손톱이 길면 얼굴을 긁을 수 있어 짧게 다듬는 것이 도움이 됩니다. 밝을 때·아기가 잠든 뒤 등 안전한 순간에, 아기용 가위·줄로 살 쪽에서 멀리 자릅니다. 깊이 패이거나 출혈·감염이 있으면 진료하세요. 특정 용품 브랜드 순위는 하지 않습니다.',
        points: [
            ['방법', '밝은 빛, 한 손가락씩, 둥글게 다듬기'],
            ['주의', '살이 접힌 채로 깊게 자르기, 이빨로 물어 뜯기 금지']
        ],
        blocks: [
            ['지금 할 일', '얼굴 긁힘이 보이면 손톱 길이를 확인하세요.'],
            ['하지 않을 일', '어른 손톱깎이로 살을 집지 마세요.'],
            ['관련', '목욕·피부 관리 안내를 참고하세요.']
        ],
        links: [
            ['AAP 손톱 관리', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/default.aspx'],
            ['NHS 아기 손톱(영)', 'https://www.nhs.uk/baby/caring-for-a-newborn/how-to-cut-your-babys-nails/']
        ]
    },
    {
        id: 'newborn-bath',
        match: /(신생아|탯줄).*(목욕|씻)|목욕.*(신생아|탯줄|배꼽)|아기\s*목욕\s*(언제|자주|방법|해도)|목욕\s*빈도|스펀지\s*목욕/,
        title: '신생아 목욕은 짧게·따뜻하게, 탯줄이 젖은 채로 두지 않습니다',
        lead: '탯줄이 떨어지기 전에는 스펀지 목욕으로 몸을 닦고 배꼽은 건조하게 두는 안내가 흔합니다. 떨어진 뒤에도 미지근한 물에 짧게, 미끄러지지 않게 잡고, 끝낸 뒤 바로 말리고 따뜻하게 합니다. 물 온도·횟수는 가정·계절에 따라 다르며 사이트에서 “매일 ○분”을 단정하지 않습니다.',
        points: [
            ['안전', '한 손으로 머리를 지지하고, 물을 미리 받아 두며, 아기를 물속에 혼자 두지 않습니다.'],
            ['배꼽', '씻은 뒤 잘 말리고, 고름·발적·열이 있으면 목욕 방법보다 진료가 먼저입니다.']
        ],
        blocks: [
            ['지금 할 일', '목욕 전 수건·옷을 준비하고, 실내가 너무 춥지 않게 하세요.'],
            ['하지 않을 일', '뜨거운 물, 성인 향 비누·로션 과다, 배꼽에 민간 가루를 바르지 마세요.'],
            ['관련', '탯줄·황달·과열 안내를 함께 보세요.']
        ],
        links: [
            ['AAP 신생아 목욕·피부', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/default.aspx'],
            ['NHS 아기 목욕', 'https://www.nhs.uk/baby/caring-for-a-newborn/washing-and-bathing-your-baby/'],
            ['탯줄 관리 안내', '#home']
        ]
    },
    {
        id: 'straw-cup-cleaning-boundary',
        match: /(빨대\s*컵\s*세척|스트로\s*컵\s*곰팡이|straw\s*cup\s*clean|빨대\s*곰팡이\s*컵|텀블러\s*빨대\s*세척)/,
        title: '빨대컵은 분해해 세척·건조하고, 곰팡이·냄새가 나면 부품을 교체하세요',
        lead: '틈새 세균·곰팡이가 생기기 쉽습니다. 브랜드 순위보다 세척 습관이 중요합니다.',
        points: [
            ['세척', '분해, 솔, 건조'],
            ['교체', '곰팡이, 균열']
        ],
        blocks: [
            ['지금 할 일', '빨대를 분리해 씻으세요.'],
            ['하지 않을 일', '축축한 채로 뚜껑을 닫아 두지 마세요.'],
            ['관련', '젖병 위생·컵 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'bottle-hygiene',
        match: /(젖병|젖\s*병|유축기|유축\s*기|보틀).*(소독|위생|세척|삶|스팀|살균)|소독.*(젖병|유축)|병\s*소독|펌프\s*소독/,
        title: '젖병·유축기는 씻고 말리며, 영아 초기는 소독 안내를 따릅니다',
        lead: 'CDC 등은 분유·모유를 담는 병·꼭지·유축 부품을 사용 후 씻고, 특히 2개월 미만·미숙아·면역이 약한 아기는 소독(삶기·스팀 등)을 권하는 흐름이 있습니다. 브랜드 제품 순위는 안내하지 않으며, 설명서와 공식 조유·기구 위생 절차를 따릅니다.',
        points: [
            ['기본', '손 씻기 → 분리 → 뜨거운 물·세제로 세척 → 깨끗이 헹굼 → 완전 건조'],
            ['소독', '생후 초기·고위험 아기는 사용 전 소독. 건강한 큰 아기는 세척·건조만으로 충분한 경우도 있어 의료진·제품 안내를 확인']
        ],
        blocks: [
            ['지금 할 일', '사용 중인 병·유축기 설명서의 세척·소독 단계를 다시 확인하세요.'],
            ['하지 않을 일', '덜 마른 병·곰팡이 난 호스를 그대로 쓰지 마세요. 분유 농도를 바꾸지 마세요.'],
            ['관련', '분유 조유·모유 보관 안내를 함께 보세요.']
        ],
        links: [
            ['CDC 분유 기구 세척·소독', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html'],
            ['CDC 모유 취급·기구', 'https://www.cdc.gov/breastfeeding/php/guidelines-recommendations/handling-breastmilk.html'],
            ['분유 조유 안내', '#home']
        ]
    },
    {
        id: 'vaccine-when-sick',
        match: /(접종|백신|예방접종).*(연기|미뤄|미루|미룰|아픈\s*날|열\s*날|감기\s*때|아파서)|아픈데\s*(접종|예방접종)|열\s*있는데\s*접종|감기.*접종\s*(돼|되|가능)/,
        title: '가벼운 감기는 접종이 가능한 경우가 많고, 중등도 이상 아픔·고열은 예진에서 정합니다',
        lead: '가벼운 콧물·기침만으로 모든 접종을 미룰 필요는 없다는 안내가 많습니다. 중등도 이상 급성 질환, 고열, 이전에 심한 이상반응이 있으면 접종 기관 예진에서 연기 여부를 정합니다. 카페 표로 일정을 임의 변경하지 말고 예방접종도우미·의료진을 따릅니다. 해열제 용량은 사이트에서 정하지 않습니다.',
        points: [
            ['예진이 우선', '당일 체온·증상·약 복용·이전 반응을 접종 기관에 알리세요.'],
            ['미루는 예', '중등도 이상 급성 병, 고열, 의료진이 정한 금기·주의']
        ],
        blocks: [
            ['지금 할 일', '도우미에서 다음 일정을 확인하고, 아픈 날은 접종 전 의료진에게 상태를 말하세요.'],
            ['하지 않을 일', '열이 난다고 임의로 여러 달을 미루거나, 남은 해열제로 “예방 복용”하지 마세요.'],
            ['관련', '접종 일정 확인·접종 후 반응 안내를 참고하세요.']
        ],
        links: [
            ['예방접종도우미', 'https://nip.kdca.go.kr/'],
            ['예방접종 일정 확인 가이드', 'blog/vaccination-schedule.html'],
            ['CDC 접종 금기·주의 개요', 'https://www.cdc.gov/vaccines/hcp/imz-best-practices/contraindications-precautions.html']
        ]
    },
    {
        id: 'dream-feed-boundary',
        match: /(드림\s*피드|dream\s*feed|잠든\s*채\s*수유|부모\s*취침\s*전\s*수유|밤에\s*깨우지\s*않고\s*먹)/,
        title: '드림피드는 선택이지만, 억지로 깨워 먹이거나 위험 자세로 재우며 먹이지 마세요',
        lead: '일부 가족이 취침 전 수유를 시도합니다. 효과가 모두에게 같지는 않습니다. 안전수면 자세를 유지하세요.',
        points: [
            ['선택', '가족 상황, 성장'],
            ['안전', '등 재우기, 기도']
        ],
        blocks: [
            ['지금 할 일', '수유 후 등 재우기를 확인하세요.'],
            ['하지 않을 일', '소파에서 잠든 채 먹이다 함께 잠들지 마세요.'],
            ['관련', '밤중 수유·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수유 가이드', 'blog/breastfeeding-guide.html']
        ]
    },
    {
        id: 'night-feeding-reduce',
        match: /(야간|밤중?|밤)\s*수유.*(줄|끊|종료|떼|그만|줄이)|수유.*(줄|끊|종료).*(밤|야간|밤중)|밤수유\s*(끊|줄|종료)|밤중\s*수유\s*(끊|줄)/,
        title: '야간 수유를 줄일 때는 성장·소변·의료 계획을 먼저 봅니다',
        lead: '모든 아기에게 같은 “끊는 개월”은 없습니다. 건강하게 자라고 낮에 충분히 먹으며 소변이 평소대로면 담당 의료진과 상의한 뒤 밤 수유 간격을 천천히 늘릴 수 있습니다. 신생아 초기·조산·황달·체중 미회복이면 깨워 먹이기 계획이 우선입니다.',
        points: [
            ['줄이기 전', '최근 체중, 24시간 수유·젖은 기저귀, 의료진 수유 지시 여부'],
            ['줄이는 방식', '한 번에 전부 끊기보다 간격·양을 며칠 단위로 조정. 첫돌 전 생우유로 대체하지 않기']
        ],
        blocks: [
            ['지금 할 일', '낮 수유가 충분한지 기록하고, 줄이기 계획을 의료진과 확인하세요.'],
            ['하지 않을 일', '통잠을 위해 엎어 재우거나, 물·주스만으로 밤 수유를 대체하지 마세요.'],
            ['관련', '깨워 먹이기·안전수면·단유 안내를 참고하세요.']
        ],
        links: [
            ['AAP 밤중 수유·수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/Sleeping-Through-the-Night.aspx'],
            ['CDC 수유량·간격', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/how-much-and-how-often.html'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'solo-sleep-boundary',
        match: /(분리\s*수면|혼자\s*재우|독방\s*재우|아기\s*방\s*분리|언제\s*혼자\s*자|자기\s*방에서\s*자)/,
        title: '혼자 재우기는 안전수면·같은 방 권고와 구분해서 봅니다',
        lead: '생후 최소 6개월(가능하면 더)은 같은 방에서 아기 전용 수면면에 등을 대고 재우라는 안내가 있습니다. “분리수면·독방”을 서두르는 유료 교육보다 안전 환경이 먼저입니다. 통잠을 위해 엎어 재우거나 성인 이불 속 동침으로 바꾸지 마세요.',
        points: [
            ['먼저', '등·별도 단단한 면·빈 공간·과열·연기 없음'],
            ['방 분리', '가정·수면 습관에 따라 다르며, 사이트가 특정 주를 단정하지 않습니다.']
        ],
        blocks: [
            ['지금 할 일', '현재 잠자리가 같은 방·별도 요람인지 확인하세요.'],
            ['하지 않을 일', '울음을 이유로 소파·경사진 베개·이불 속에서 재우지 마세요.'],
            ['관련', '같은 방 수면·동침·수면교육 경계를 함께 보세요.']
        ],
        links: [
            ['1세 미만 안전수면', 'blog/baby-safe-sleep-guide.html'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['같은 방 수면 안내', '#home']
        ]
    },
    {
        id: 'rollover-sleep-leave-boundary',
        match: /(뒤집고\s*자|배로\s*자\s*아기|rollover\s*sleep|뒤집어서\s*잠|엎드려\s*자는데\s*돌리)/,
        title: '스스로 뒤집는 아기는 등을 재워 시작하되, 자면서 뒤집으면 억지로 계속 돌리지 않는 안내가 많습니다',
        lead: '수면 공간은 비우고 속싸개는 중단합니다. 개별 상황은 의료진과 상담하세요.',
        points: [
            ['시작', '등 재우기, 빈 침대'],
            ['전환', '속싸개 중지']
        ],
        blocks: [
            ['지금 할 일', '침대에서 부드러운 물건을 치우세요.'],
            ['하지 않을 일', '자는 동안 계속 배로 뒤집어 두지 마세요(시작은 등).'],
            ['관련', '뒤집기 수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'rollover-sleep',
        match: /(뒤집|뒤집기).*(재우|수면|잠)|뒤집어서\s*자|혼자\s*뒤집.*재우|복와위\s*수면/,
        title: '재울 때는 등으로, 스스로 뒤집으면 다시 억지로 엎어 두지 않습니다',
        lead: '잠들 때는 항상 등을 대고 눕힙니다. 아기가 스스로 뒤집을 수 있게 되면, 재울 때는 등으로 두고 잠든 뒤 뒤집힌 상태를 매번 강제로 되돌리지 말라는 안내가 있습니다. 속싸개·수면 포지셔너는 뒤집기 시작 후 질식 위험이 커질 수 있어 중단합니다.',
        points: [
            ['재울 때', '등 자세, 별도 단단한 면, 빈 공간'],
            ['뒤집기 후', '속싸개 중단, 이불·인형·범퍼 없이, 터미타임은 깨어 있을 때만']
        ],
        blocks: [
            ['지금 할 일', '속싸개 사용 여부와 수면면이 비어 있는지 점검하세요.'],
            ['하지 않을 일', '통잠을 위해 처음부터 엎어 재우지 마세요.'],
            ['관련', '안전수면·속싸개 안내를 함께 보세요.']
        ],
        links: [
            ['1세 미만 안전수면', 'blog/baby-safe-sleep-guide.html'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 안전수면 요약', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'straw-cup-when-boundary',
        match: /(빨대\s*컵|스트로\s*컵|straw\s*cup|빨대\s*언제|빨대\s*연습)/,
        title: '빨대 컵은 앉아서 연습할 수 있을 때 돕고, 단 음료를 하루 종일 물리지 마세요',
        lead: '오픈 컵·빨대 연습 시기는 아이마다 다릅니다. 앉은 자세에서 소량으로 연습하고, 주스·단 음료를 빨대에 담아 오래 물리면 치아에 나쁠 수 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['연습', '앉기, 소량, 흘림 허용, 감독'],
            ['치아', '단 음료 제한, 잠들며 빨대 금지']
        ],
        blocks: [
            ['지금 할 일', '물로 먼저 빨대 연습을 해 보세요.'],
            ['하지 않을 일', '주스 빨대를 하루 종일 물리지 마세요.'],
            ['관련', '컵 마시기·주스·충치 안내를 참고하세요.']
        ],
        links: [
            ['AAP 컵·음료 개요', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/default.aspx'],
            ['CDC 구강 건강', 'https://www.cdc.gov/oral-health/']
        ]
    },
    {
        id: 'cup-drinking',
        match: /(컵\s*(으로|으로\s*)?(마시|먹|연습|시작)|빨대\s*컵|오픈\s*컵|sippy|시피\s*컵|젖병\s*끊.*컵|컵\s*훈련)/,
        title: '이유식 시기부터 열린 컵·작은 컵 연습을 권하는 안내가 많습니다',
        lead: '생후 약 6개월 전후 이유식과 함께 소량의 물을 컵으로 연습할 수 있습니다. 젖병을 오래 물고 자는 습관은 치아에 불리할 수 있어, 첫돌 전후에 컵으로 옮기라는 안내가 흔합니다. 주스·가당 음료를 컵에 담아 습관화하지 마세요.',
        points: [
            ['연습', '보호자가 잡아 주는 작은 컵, 소량, 앉은 자세'],
            ['피하기', '돌 전 주스, 젖병 속 생우유를 주된 음료로']
        ],
        blocks: [
            ['지금 할 일', '현재 개월과 이유식 여부를 보고 물 연습부터 시작하세요.'],
            ['하지 않을 일', '걷거나 누운 채 먹이지 마세요.'],
            ['관련', '물·주스·생우유 안내를 참고하세요.']
        ],
        links: [
            ['CDC 이유식·음료', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html'],
            ['AAP 컵·음료 안내', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Recommended-Drinks-for-Young-Children-Ages-0-5.aspx'],
            ['생우유 전환 안내', '#home']
        ]
    },
    {
        id: 'backpack-weight-boundary',
        match: /(책가방\s*무게|백팩\s*무거|backpack\s*weight\s*child|책가방\s*어깨\s*아픔|초등\s*가방\s*무게)/,
        title: '책가방이 너무 무겁거나 한쪽으로만 메면 불편할 수 있어 양끈·무게를 조절하세요',
        lead: '정확한 kg 단정보다 아이 체격·통증 신호를 봅니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['착용', '양끈, 밀착'],
            ['신호', '통증, 저림']
        ],
        blocks: [
            ['지금 할 일', '불필요한 짐을 빼 주세요.'],
            ['하지 않을 일', '한쪽 어깨로만 메게 두지 마세요.'],
            ['관련', '자세·통증 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx']
        ]
    },
    {
        id: 'school-mask-when-boundary',
        match: /(학교\s*마스크|어린이집\s*마스크|마스크\s*언제\s*써|mask\s*school|아이\s*마스크\s*필수)/,
        title: '마스크 착용은 연령·호흡·시설·보건 안내를 따르고, 영아에게 억지로 씌우지 마세요',
        lead: '어린 영아는 마스크가 호흡에 부담이 될 수 있어 권고가 제한적인 경우가 많습니다. 학교·지역 지침과 의료진 안내를 우선하세요. 브랜드·“필수 국민템” 순위는 하지 않습니다.',
        points: [
            ['연령', '영아 강제 착용 자제, 시설 규정 확인'],
            ['사용', '호흡 편한 착용, 더러워지면 교체']
        ],
        blocks: [
            ['지금 할 일', '학교·어린이집 최신 마스크 안내를 확인하세요.'],
            ['하지 않을 일', '숨이 찬 아이에게 두꺼운 마스크를 겹쳐 씌우지 마세요.'],
            ['관련', '미세먼지·손 씻기·호흡기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 마스크 개요', 'https://www.cdc.gov/mask/'],
            ['질병관리청', 'https://www.kdca.go.kr/'],
            ['AAP 감염 예방 개요', 'https://www.healthychildren.org/English/health-issues/conditions/prevention/Pages/default.aspx']
        ]
    },
    {
        id: 'pollen-laundry-indoor-boundary',
        match: /(봄철\s*빨래\s*실내|꽃가루\s*빨래\s*실내|봄\s*빨래\s*밖|pollen\s*laundry\s*indoor)/,
        title: '꽃가루가 심한 날 빨래는 실내 건조를 검토하고, 외출 후 손·얼굴을 씻기세요',
        lead: '약 용량은 의료진을 따르세요. 제품 순위는 하지 않습니다.',
        points: [
            ['조절', '실내 건조, 환기 시간'],
            ['위생', '손 씻기']
        ],
        blocks: [
            ['지금 할 일', '외출 후 옷을 털어 보세요.'],
            ['하지 않을 일', '증상 심하면 진료하세요.'],
            ['관련', '꽃가루 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC 공기', 'https://www.cdc.gov/air-quality/']
        ]
    },
    {
        id: 'pollen-season-outdoor-boundary',
        match: /(꽃가루\s*알레르기|꽃가루\s*시즌|pollen\s*allergy\s*child|황사\s*꽃가루\s*아이|알레르기\s*코\s*봄)/,
        title: '꽃가루가 심한 날에는 외출·빨래 널기를 조절하고, 증상 심하면 진료하세요',
        lead: '봄·가을 꽃가루는 코·눈 증상을 키울 수 있습니다. 약 용량은 의료진에게 확인하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['조절', '외출 시간, 창 환기'],
            ['진료', '호흡 곤란, 심한 증상']
        ],
        blocks: [
            ['지금 할 일', '외출 후 손·얼굴을 씻기세요.'],
            ['하지 않을 일', '처방 없이 성인 약을 주지 마세요.'],
            ['관련', '미세먼지·감기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC 공기질', 'https://www.cdc.gov/air-quality/']
        ]
    },
    {
        id: 'yellow-dust-pe-class-boundary',
        match: /(황사\s*실외\s*체육|황사\s*체육|황사\s*실외\s*운동|yellow\s*dust\s*pe|미세먼지\s*체육\s*취소)/,
        title: '황사·고농도 미세먼지 날 실외 체육은 시설 안내를 따르고, 호흡 이상이면 쉬게 하세요',
        lead: '마스크 브랜드 순위는 하지 않습니다. 영아 마스크는 별도 안내를 보세요.',
        points: [
            ['원칙', '시설·경보 준수'],
            ['증상', '기침, 숨가쁨']
        ],
        blocks: [
            ['지금 할 일', '학교 공지를 확인하세요.'],
            ['하지 않을 일', '숨이 차면 억지로 뛰게 두지 마세요.'],
            ['관련', '미세먼지 안내를 참고하세요.']
        ],
        links: [
            ['CDC 공기', 'https://www.cdc.gov/air-quality/'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'fine-dust-mask-infant',
        match: /(미세\s*먼지|황사|초미세|air\s*quality|대기\s*질).{0,16}(아기|아이|마스크)|아기\s*마스크|영아\s*마스크|마스크\s*아기/,
        title: '영아 마스크는 숨쉬기·밀착이 어려워 무리하지 말고, 실내 공기·외출 시간을 조절하세요',
        lead: '아주 어린 아이에게 성인형 마스크를 강제하면 숨쉬기가 불편할 수 있습니다. 많은 안내가 연령·밀착·감독을 강조합니다. 황사·미세먼지가 나쁠 때는 외출을 줄이고 실내 환기·공기 관리를 우선하세요. 마스크 브랜드 순위·착용 “필수 개월” 단정은 하지 않습니다.',
        points: [
            ['우선', '외출 시간 조절, 그늘·실내, 창문 환기 타이밍'],
            ['마스크', '연령·제품 표시, 강제 착용·혼자 두지 않기']
        ],
        blocks: [
            ['지금 할 일', '당일 대기 질 예보와 외출 계획을 맞춰 보세요.'],
            ['하지 않을 일', '영아에게 성인 마스크를 테이프로 고정하지 마세요.'],
            ['관련', '자외선·호흡 증상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 공기 질·아이 건강 개요', 'https://www.healthychildren.org/English/safety-prevention/all-around/Pages/Air-Pollution.aspx'],
            ['질병관리청·대기 관련 건강 안내', 'https://www.kdca.go.kr/'],
            ['자외선·그늘 안내', '#home']
        ]
    },
    {
        id: 'window-tint-visibility-boundary',
        match: /(선팅|틴팅|window\s*tint|차\s*유리\s*어둡|불법\s*선팅|차\s*선팅)/,
        title: '차 유리 틴팅은 법·시야를 지키고, 아이 확인이 어려울 정도로 어둡게 하지 마세요',
        lead: '과도한 틴팅은 시야와 아이 관찰을 방해할 수 있습니다. 지역 법규와 안전을 우선하세요. 시공 순위는 하지 않습니다.',
        points: [
            ['시야', '사이드·후방, 야간'],
            ['아이', '뒷좌석 확인 가능 여부']
        ],
        blocks: [
            ['지금 할 일', '야간 시야가 충분한지 확인하세요.'],
            ['하지 않을 일', '앞유리 시야를 가리는 부착물을 붙이지 마세요.'],
            ['관련', '차 가리개·카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 차량 안전', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/']
        ]
    },
    {
        id: 'car-window-sunshade-boundary',
        match: /(차\s*햇빛\s*가리개|카\s*선쉐이드|car\s*sun\s*shade|자동차\s*블라인드\s*아기|차\s*창문\s*가리개)/,
        title: '차 햇빛 가리개는 시야를 가리지 않게 붙이고, 카시트·환기와 함께 쓰세요',
        lead: '옆 창문 가리개는 자외선·눈부심 완화에 도움이 될 수 있으나, 운전자 시야를 가리면 위험합니다. 앞유리에 불법·시야 방해 부착을 피하고, 차 안 과열·카시트 원칙을 함께 봅니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['부착', '옆 유리, 시야 확보, 떨어지지 않게'],
            ['안전', '카시트 벨트, 차 안 방치 금지']
        ],
        blocks: [
            ['지금 할 일', '가리개가 백미러·사이드 미러를 가리는지 확인하세요.'],
            ['하지 않을 일', '아이를 차 안에 두고 시동을 끄지 마세요.'],
            ['관련', '햇볕·차 안 방치·카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 차량·햇볕 개요', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 열·차량 안전', 'https://www.cdc.gov/heat-health/']
        ]
    },
    {
        id: 'sunscreen-water-reapply-boundary',
        match: /(물놀이\s*선크림\s*지움)/,
        title: '물놀이·땀 뒤에는 선크림을 표시에 따라 덧바르고 그늘을 함께 쓰세요',
        lead: '6개월 미만은 의료진 권고를 우선하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['기본', '그늘, 옷, 모자'],
            ['도포', '물 후 재도포']
        ],
        blocks: [
            ['지금 할 일', '한낮 노출을 줄이세요.'],
            ['하지 않을 일', '한 번 바르고 오래 직사광선에 두지 마세요.'],
            ['관련', '자외선 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/skin-cancer/']
        ]
    },
    {
        id: 'sunscreen-reapply-boundary',
        match: /(선크림\s*재도포|자외선\s*차단\s*다시|sunscreen\s*reapply|선블록\s*두\s*시간|물놀이\s*선크림)/,
        title: '선크림은 표시에 따라 덧바르고, 그늘·옷·모자를 함께 쓰세요',
        lead: '물놀이·땀 뒤에는 더 자주 필요할 수 있습니다. 6개월 미만은 의료진 권고를 우선하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['기본', '그늘, 옷, 모자'],
            ['도포', '표시 간격, 물 후']
        ],
        blocks: [
            ['지금 할 일', '한낮 야외를 줄이세요.'],
            ['하지 않을 일', '선크림만 믿고 오래 직사광선에 두지 마세요.'],
            ['관련', '자외선·화상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/skin-cancer/']
        ]
    },
    {
        id: 'hat-shade-outdoor-boundary',
        match: /(그늘\s*모자)/,
        title: '야외에서는 모자·그늘·옷을 함께 쓰고, 모자만으로 충분하다고 보지 마세요',
        lead: '자외선 예방은 여러 겹이 좋습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['기본', '그늘, 옷, 모자'],
            ['추가', '선크림(월령 안내)']
        ],
        blocks: [
            ['지금 할 일', '한낮 직사광선을 줄이세요.'],
            ['하지 않을 일', '모자만 믿고 오래 두지 마세요.'],
            ['관련', '자외선 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/skin-cancer/']
        ]
    },
    {
        id: 'infant-sun-shade',
        match: /(자외선|선크림|썬크림|햇볕|직사광선|야외.*아기|아기.*햇빛|일광\s*욕).*(아기|신생아|영아|아이)|아기.*(선크림|햇볕|자외선)/,
        title: '6개월 미만은 그늘·옷·모자가 우선이고, 선크림은 의료진 안내를 따릅니다',
        lead: '영아는 피부가 약해 직사광선·한낮 야외를 피하는 것이 우선입니다. 그늘, 긴 옷, 모자, 유모차 덮개(환기 유지)를 쓰고, 생후 6개월 미만 선크림 사용은 제품·상황마다 의료진·제품 표시를 확인합니다. 브랜드 순위는 안내하지 않습니다.',
        points: [
            ['우선', '그늘, 옷, 모자, 한낮(대략 10~16시) 강한 햇볕 피하기'],
            ['열·탈수', '더운 날 처짐·소변 감소·고열이 있으면 그늘·수분·진료']
        ],
        blocks: [
            ['지금 할 일', '외출 전 그늘·옷차림을 계획하세요.'],
            ['하지 않을 일', '밀폐된 차 안·유모차에 아기를 혼자 두지 마세요.'],
            ['관련', '과열 수면·탈수 안내를 참고하세요.']
        ],
        links: [
            ['AAP 햇빛·선크림(영아)', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Sun-Safety.aspx'],
            ['CDC 자외선 보호', 'https://www.cdc.gov/cancer/skin/basic_info/sun-safety.htm'],
            ['과열·탈수 안내', '#home']
        ]
    },
    {
        id: 'mixed-feeding-basics',
        match: /(혼합\s*수유|모유.*분유\s*같이|분유.*모유\s*같이|모유\s*부족.*분유|병행\s*수유)/,
        title: '혼합 수유는 비율 공식보다 성장·기저귀·의료 계획을 따릅니다',
        lead: '모유와 분유를 함께 쓰는 가정은 많습니다. 사이트에서 “○cc씩 몇 대 몇” 비율을 정하지 않습니다. 낮·밤 리듬, 젖양 유지 희망 여부, 체중·소변을 보고 의료진·수유 상담과 계획을 세우세요. 분유는 표시 농도를 지키고 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '아기의 배고픔 신호, 24시간 총 섭취·기저귀·성장'],
            ['모유 유지 시', '직접 수유·유축 빈도를 유지하는 편이 도움이 될 수 있음']
        ],
        blocks: [
            ['지금 할 일', '현재 모유·분유 횟수와 기저귀·체중을 기록하세요.'],
            ['하지 않을 일', '카페 비율표를 고정 처방전처럼 쓰지 마세요.'],
            ['관련', '젖양·조유·수유량 안내를 참고하세요.']
        ],
        links: [
            ['CDC 분유 조제', 'https://www.cdc.gov/infant-toddler-nutrition/formula-feeding/preparation-and-storage.html'],
            ['질병관리청 모유 수유', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586'],
            ['젖양 신호 안내', '#home']
        ]
    },
    {
        id: 'family-food-transition',
        match: /(완식|밥상\s*올|가족\s*식사|어른\s*밥|돌\s*이후\s*식사|이유식\s*끝내|고형식\s*전환)/,
        title: '완식은 “한 날짜 졸업”보다 질감·다양성·질식 안전을 봅니다',
        lead: '첫돌 전후 가족 식사에 참여하는 흐름을 완식이라고 부르기도 하지만, 모든 아기가 같은 날에 이유식을 끝내는 것은 아닙니다. 질감을 단계적으로 올리고, 둥근 덩어리·딱딱한 음식 등 질식 위험을 피하며, 첫돌 전 생우유를 주된 음료로 쓰지 마세요. 돌 전후에도 모유·영아 식이는 가정·성장에 따라 이어질 수 있습니다.',
        points: [
            ['원칙', '앉아서 먹기, 보호자 감시, 연령에 맞는 크기·질감, 다양성'],
            ['음료', '돌 전 주된 음료는 모유·조제유. 돌 이후 생우유 전환은 별도 안내']
        ],
        blocks: [
            ['지금 할 일', '현재 질감과 가족이 먹는 음식 중 안전한 것부터 맞추세요.'],
            ['하지 않을 일', '카페 “완식 표”만 보고 한 끼 분량을 강요하지 마세요.'],
            ['관련', '질식·철분·생우유·소금·설탕 안내를 참고하세요.']
        ],
        links: [
            ['이유식·질식 가이드', 'blog/complementary-feeding-allergy-guide.html'],
            ['CDC 이유식·음료', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/when-what-and-how-to-introduce-solid-foods.html'],
            ['WHO 보충식', 'https://www.who.int/health-topics/complementary-feeding']
        ]
    },
    {
        id: 'puffer-coat-carseat-boundary',
        match: /(패딩\s*입고\s*카시트|패딩\s*입고\s*카시트|두꺼운\s*외투\s*카시트|puffer\s*coat\s*car\s*seat|코트\s*입고\s*벨트)/,
        title: '두꺼운 패딩을 입은 채 카시트 벨트를 조이면 헐거울 수 있어 외투를 벗기거나 담요를 사용하세요',
        lead: '벨트와 몸 사이 두꺼운 옷은 위험할 수 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['방법', '외투 벗기기, 벨트 밀착'],
            ['대안', '담요 덮기']
        ],
        blocks: [
            ['지금 할 일', '벨트 경로를 확인하세요.'],
            ['하지 않을 일', '두꺼운 패딩 위에 벨트를 조이지 마세요.'],
            ['관련', '카시트 겨울 외투 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'car-seat-winter-coat',
        match: /(카시트.*패딩|카시트.*두꺼운\s*옷|패딩.*카시트|코트.*카시트|외투.*벨트|겨울.*카시트)/,
        title: '카시트에서는 두꺼운 패딩·외투를 벨트 아래에 끼우지 마세요',
        lead: '두꺼운 외투는 벨트가 몸에서 뜨게 만들어 충돌 시 고정이 약해질 수 있습니다. 아기를 얇게 앉힌 뒤 벨트를 조이고, 담요·외투는 벨트 위에 덮는 방식이 안전 안내로 흔합니다. 제품·패딩 브랜드 순위는 하지 않습니다.',
        points: [
            ['착용', '두꺼운 옷 제거 후 벨트, 어깨 클립·골반 벨트 위치 확인'],
            ['보온', '벨트 고정 후 담요·외투를 위에']
        ],
        blocks: [
            ['지금 할 일', '겨울 외출 전 벨트 두께를 한 번 점검하세요.'],
            ['하지 않을 일', '패딩 입은 채 벨트를 대충 조이지 마세요.'],
            ['관련', '카시트 원칙 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 카시트', 'https://www.nhtsa.gov/vehicle-safety/car-seats-and-booster-seats'],
            ['AAP 카시트·겨울', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Winter-Car-Seat-Safety-Tips.aspx'],
            ['카시트 원칙', '#home']
        ]
    },
    {
        id: 'used-car-seat-check-boundary',
        match: /(중고\s*카시트\s*거래|중고\s*카시트\s*사도|used\s*car\s*seat\s*check|카시트\s*중고\s*거래|중고\s*카시트\s*사도\s*되나)/,
        title: '중고 카시트는 사고 이력·리콜·만료·설명서 가능 여부를 확인하고 불확실하면 쓰지 마세요',
        lead: '브랜드 순위는 하지 않습니다. 설치 설명서가 없으면 위험합니다.',
        points: [
            ['확인', '이력, 리콜, 만료'],
            ['금지', '사고 차량 시트']
        ],
        blocks: [
            ['지금 할 일', '모델명으로 리콜을 검색하세요.'],
            ['하지 않을 일', '이력이 불분명하면 사용하지 마세요.'],
            ['관련', '중고 카시트·리콜 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'car-seat-expiry-date-check-boundary',
        match: /(카시트\s*만료일|카시트\s*만료\s*확인|car\s*seat\s*expiry\s*date|카시트\s*유통\s*기한)/,
        title: '카시트 만료일·제조일을 확인하고 만료된 시트는 사용하지 마세요',
        lead: '중고 이력도 함께 보세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['확인', '라벨 날짜'],
            ['금지', '만료 시트']
        ],
        blocks: [
            ['지금 할 일', '라벨 사진을 남기세요.'],
            ['하지 않을 일', '만료 시트를 물려주지 마세요.'],
            ['관련', '카시트 만료 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'used-car-seat-boundary',
        match: /(중고\s*카시트|카시트\s*중고|카시트\s*만료|카시트\s*사고|카시트\s*유통\s*기한|car\s*seat\s*expire)/,
        title: '중고 카시트는 사고 이력·만료·리콜을 모른 채 쓰지 않는 편이 안전합니다',
        lead: '사고 이력이 있거나 만료·리콜·부품 누락된 카시트는 성능이 떨어질 수 있습니다. 이력이 불명확한 중고 제품은 피하라는 안내가 많습니다. 설치는 설명서·차량 안내를 따르고, 브랜드 순위는 하지 않습니다.',
        points: [
            ['확인', '제조일·만료, 리콜, 라벨, 부품 완비, 사고 이력'],
            ['설치', '설명서, 흔들림 최소화, 겨울 패딩 주의']
        ],
        blocks: [
            ['지금 할 일', '시트 라벨의 날짜·모델명을 확인하세요.'],
            ['하지 않을 일', '사고 난 시트나 유통 기한 지난 시트를 쓰지 마세요.'],
            ['관련', '카시트 원칙·패딩 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 카시트', 'https://www.nhtsa.gov/vehicle-safety/car-seats-and-booster-seats'],
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['카시트 원칙', '#home']
        ]
    },
    {
        id: 'booster-belt-fit-boundary',
        match: /(부스터\s*벨트\s*위치|부스터\s*어깨\s*벨트|booster\s*belt\s*fit|보조\s*시트\s*벨트|벨트\s*목\s*스침)/,
        title: '부스터는 어깨·무릎 벨트가 몸에 맞게 지나는지 확인하고, 안 맞으면 전환을 미루세요',
        lead: '벨트가 목·배를 잘못 지나면 위험합니다. 키·체중·자세를 함께 보세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['핏', '어깨 중간, 무릎 벨트 아래'],
            ['조건', '등이 붙고 다리 구부림']
        ],
        blocks: [
            ['지금 할 일', '벨트가 목에 걸리지 않는지 보세요.'],
            ['하지 않을 일', '안 맞는 부스터에 억지로 태우지 마세요.'],
            ['관련', '부스터 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'booster-graduate-height-boundary',
        match: /(부스터\s*졸업\s*키|부스터\s*졸업\s*키|벨트\s*만\s*타\s*언제|booster\s*graduate\s*height)/,
        title: '부스터 졸업은 키·자세·벨트 핏을 보고, 연령만으로 서두르지 마세요',
        lead: '어깨·무릎 벨트가 맞는지 확인하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['핏', '어깨 벨트, 무릎 벨트'],
            ['조건', '등이 붙고 다리 구부림']
        ],
        blocks: [
            ['지금 할 일', '벨트가 목에 걸리지 않는지 보세요.'],
            ['하지 않을 일', '작다고 성인 벨트만 쓰지 마세요.'],
            ['관련', '부스터 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'booster-seat-when',
        match: /(부스터\s*시트|보조\s*시트|카시트\s*졸업|성인\s*벨트\s*아이|부스터\s*언제)/,
        title: '부스터는 키·몸무게·벨트 위치가 맞을 때만, “나이만”으로 졸업하지 마세요',
        lead: '어린이 보호장치는 단계(후방·전방·부스터·성인 벨트)가 있고, 나이 하나보다 키·몸무게·벨트 경로가 중요합니다. 어깨 벨트가 목에 걸치거나 무릎 벨트가 배에 올라오면 아직 이릅니다. 법·제품 라벨을 확인하고 브랜드 순위는 하지 않습니다.',
        points: [
            ['전환', '라벨의 키·몸무게, 벨트 위치, 등받이 유무'],
            ['금지', '성인 벨트만으로 조기 졸업, 두꺼운 패딩 아래 벨트']
        ],
        blocks: [
            ['지금 할 일', '현재 시트 라벨과 벨트 위치를 다시 확인하세요.'],
            ['하지 않을 일', '또래가 부스터 탄다고 바로 바꾸지 마세요.'],
            ['관련', '카시트 원칙·중고 시트·패딩 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 카시트·부스터', 'https://www.nhtsa.gov/vehicle-safety/car-seats-and-booster-seats'],
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['카시트 원칙', '#home']
        ]
    },
    {
        id: 'taxi-without-carseat-boundary',
        match: /(택시\s*카시트\s*없이\s*타|taxi\s*without\s*car\s*seat|콜택시\s*카시트\s*없을|카카오택시\s*카시트\s*없이)/,
        title: '가능하면 카시트를 쓰고, 없는 이동은 최소화하며 뒷좌석·벨트를 최선으로 맞추세요',
        lead: '법률·상황은 지역마다 다를 수 있습니다. 안전상 카시트가 최선입니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['최선', '카시트 휴대·대여'],
            ['차선', '뒷좌석, 짧은 이동']
        ],
        blocks: [
            ['지금 할 일', '여행 전 카시트 옵션을 확인하세요.'],
            ['하지 않을 일', '앞좌석에 아이를 태우지 마세요.'],
            ['관련', '승차공유·카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'rental-car-seat-boundary',
        match: /(렌터카\s*카시트|렌터카\s*카시트|렌트\s*카시트\s*대여|rental\s*car\s*seat)/,
        title: '렌터카 카시트는 설치 상태를 직접 확인하고, 불안하면 가져간 시트를 쓰세요',
        lead: '브랜드 순위는 하지 않습니다. 만료·리콜을 확인하세요.',
        points: [
            ['점검', '설치, 벨트 경로'],
            ['대안', '휴대 시트']
        ],
        blocks: [
            ['지금 할 일', '흔들림을 확인하세요.'],
            ['하지 않을 일', '대충 올려두고 출발하지 마세요.'],
            ['관련', '카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'rideshare-taxi-carseat',
        match: /(승차공유\s*카시트|rideshare\s*car\s*seat|우버\s*카시트|택시\s*카시트|콜택시\s*아기\s*카시트)/,
        title: '택시·라이드셰어에서도 연령에 맞는 카시트가 원칙이고, 짧은 거리라도 예외로 보지 마세요',
        lead: '차량 종류와 관계없이 어린이는 맞는 보호장치를 쓰는 것이 안전합니다. 택시에 시트가 없으면 휴대용·자신의 시트를 준비하거나 다른 이동 수단을 검토하세요. 무릎에만 안고 가는 방식은 충돌 시 위험합니다. 특정 앱·브랜드 추천은 하지 않습니다.',
        points: [
            ['원칙', '연령·체격에 맞는 시트, 올바르게 설치'],
            ['대안', '사전 예약·렌탈·자기 시트 지참 검토']
        ],
        blocks: [
            ['지금 할 일', '외출 전 이동 구간의 시트 계획을 세우세요.'],
            ['하지 않을 일', '성인 벨트에 아이만 매고 “잠깐”이라 넘기지 마세요.'],
            ['관련', '카시트·부스터 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 카시트', 'https://www.nhtsa.gov/vehicle-safety/car-seats-and-booster-seats'],
            ['AAP 이동 안전', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx']
        ]
    },
    {
        id: 'airbag-front-seat-carseat',
        match: /(조수석\s*카시트|에어백\s*카시트|앞좌석\s*아기|에어백\s*앞|전면\s*에어백\s*아이|infant\s*front\s*seat)/,
        title: '에어백이 있는 앞좌석에 아기를 태우지 않는 것이 안전합니다',
        lead: '전면 에어백은 충돌 시 카시트·아기에게 위험할 수 있어, 영아는 뒷좌석 카시트가 권고됩니다. 불가피한 예외는 차량·시트 설명서와 안전 전문가 안내를 따르세요. 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '뒷좌석 설치, 에어백 경고 라벨 확인'],
            ['피하기', '조수석에 후향·전향 영아 시트 + 에어백 ON']
        ],
        blocks: [
            ['지금 할 일', '차량 설명서의 에어백·카시트 주의 문구를 확인하세요.'],
            ['하지 않을 일', '앞좌석에 “잠깐만” 아기를 두지 마세요.'],
            ['관련', '카시트 원칙·택시 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 카시트·에어백', 'https://www.nhtsa.gov/vehicle-safety/car-seats-and-booster-seats'],
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['카시트 원칙 안내', '#home']
        ]
    },
    {
        id: 'forward-facing-when-boundary',
        match: /(전향\s*카시트\s*언제|앞보기\s*카시트\s*전환|forward\s*facing\s*when|후향\s*그만|카시트\s*방향\s*바꾸)/,
        title: '카시트 전향은 연령만이 아니라 키·체중·시트 한도와 후향 유지 권고를 함께 보세요',
        lead: '가능하면 더 오래 후향 유지 안내가 많습니다. 전향은 한도 충족 시 검토하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['기준', '키·체중 한도, 라벨'],
            ['원칙', '후향 우선']
        ],
        blocks: [
            ['지금 할 일', '후향 최대 체중 라벨을 확인하세요.'],
            ['하지 않을 일', '돌이면 전향만으로 바꾸지 마세요.'],
            ['관련', '후향·카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'rear-facing-longer-boundary',
        match: /(후향\s*카시트|후방\s*카시트|뒤로\s*보는\s*카시트|rear[\s-]?facing|후향\s*오래|최대한\s*후향|전향\s*빨리)/,
        title: '가능하면 키·몸무게 한도까지 후향(뒤로 보기)을 유지하라는 안내가 많습니다',
        lead: '많은 안전 안내가 법·제품 한도 안에서 가능한 한 오래 후향 장착을 권합니다. “○개월에 무조건 전향” 같은 카페 단정은 따르지 말고, 아이 신장·체중과 시트 라벨·설명서를 기준으로 하세요. 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['기준', '시트 표시 키·몸무게, 차량 설명서, 올바른 설치'],
            ['피하기', '또래 비교만으로 이른 전향']
        ],
        blocks: [
            ['지금 할 일', '시트 라벨의 후향 한도를 확인하세요.'],
            ['하지 않을 일', '다리가 닿는다고 바로 전향하지 마세요(많은 안내가 후향 유지를 우선).'],
            ['관련', '카시트 원칙·부스터 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트 방향', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA 카시트', 'https://www.nhtsa.gov/vehicle-safety/car-seats-and-booster-seats'],
            ['카시트 원칙', '#home']
        ]
    },
    {
        id: 'back-seat-under-13-boundary',
        match: /(앞좌석\s*아이|조수석\s*아이|13세\s*앞좌석|뒷좌석\s*타|back\s*seat\s*until|에어백\s*앞좌석\s*아이|몇\s*살\s*앞좌석)/,
        title: '어린이는 가능하면 뒷좌석에 태우고, 앞좌석은 에어백·키·체중 기준을 확인하세요',
        lead: '많은 안전 안내는 13세 전후까지 뒷좌석을 권합니다. 앞좌석 에어백은 작은 아이에게 위험할 수 있습니다. 카시트·부스터 전환은 연령만이 아니라 키·체중·시트 라벨을 따릅니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '뒷좌석, 연령·키·체중·설명서'],
            ['주의', '앞좌석 에어백, 시트벨트만으로 부적합한 키']
        ],
        blocks: [
            ['지금 할 일', '아이 키·체중과 시트 라벨을 대조하세요.'],
            ['하지 않을 일', '에어백 켠 조수석에 영아 카시트를 두지 마세요.'],
            ['관련', '카시트·부스터·에어백 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트·좌석 위치', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['CDC 아동 승차 안전', 'https://www.cdc.gov/transportationsafety/child_passenger_safety/']
        ]
    },
    {
        id: 'atv-child-boundary',
        match: /(atv|사륜\s*바이크|네\s*발\s*바이크|all[-\s]?terrain\s*vehicle|어린이\s*atv|쿼드\s*바이크|에이티비|사륜차\s*아이)/,
        title: '어린이 ATV·사륜 바이크 탑승은 심각한 부상 위험이 있어 권하지 않습니다',
        lead: 'ATV는 전복·충돌 위험이 커 소아 안전 기관이 어린이 탑승에 강하게 주의합니다. “아이용 소형”이라도 안전이 보장되지 않습니다. 헬멧만으로 충분하지 않습니다. 브랜드·연령 마케팅을 그대로 따르지 마세요.',
        points: [
            ['원칙', '어린이 ATV 탑승 자제, 성인 레저에 태우지 않기'],
            ['위험', '전복, 머리·목 손상, 도로·경사']
        ],
        blocks: [
            ['지금 할 일', '농장·캠핑장 ATV 규칙을 아이 기준으로 다시 보세요.'],
            ['하지 않을 일', '무릎에 태워 “한 바퀴만” 태우지 마세요.'],
            ['관련', '헬멧·오토바이·놀이 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP ATV 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/ATV-Safety.aspx'],
            ['CDC ATV 손상 개요', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'motorcycle-child-boundary',
        match: /(오토바이\s*아이|오토바이\s*동승|motorcycle\s*child|스쿠터\s*아이\s*태|오토바이\s*카시트|이륜차\s*아이)/,
        title: '어린이를 오토바이·스쿠터 동승으로 태우는 것은 권하지 않습니다',
        lead: '오토바이·스쿠터는 보호 차체가 없어 충돌 시 아이 부상 위험이 큽니다. 많은 소아 안전 안내는 어린이 동승을 권하지 않습니다. 카시트·헬멧으로 대체할 수 있는 이동이 아닙니다. 브랜드 추천은 하지 않습니다.',
        points: [
            ['원칙', '아이는 자동차·카시트로 이동'],
            ['위험', '낙상, 충돌, 도로 마찰, 헬멧만으로 부족']
        ],
        blocks: [
            ['지금 할 일', '아이 이동은 좌석벨트·카시트가 있는 차로 계획하세요.'],
            ['하지 않을 일', '무릎 위에 태우거나 “잠깐” 동승하지 마세요.'],
            ['관련', '카시트·헬멧·전동킥보드 안내를 참고하세요.']
        ],
        links: [
            ['AAP 이동 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 아동 승차 안전', 'https://www.cdc.gov/transportationsafety/child_passenger_safety/']
        ]
    },
    {
        id: 'car-seat-expiry-boundary',
        match: /(카시트\s*유효\s*기간|카시트\s*유통\s*기한|car\s*seat\s*expir|카시트\s*몇\s*년|카시트\s*폐기|중고\s*카시트\s*기한)/,
        title: '카시트는 제조일·만료·사고 이력을 확인하고, 만료·사고 이력이 있으면 쓰지 마세요',
        lead: '카시트는 재질 노화·기준 변경으로 사용 기한이 있습니다. 라벨의 제조일·만료를 보고, 중고는 사고·리콜·설명서 여부를 확인하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['확인', '만료일, 사고 유무, 리콜, 부품 누락'],
            ['금지', '만료·사고 시트, 출처 불명 중고']
        ],
        blocks: [
            ['지금 할 일', '시트 하단·옆 라벨 날짜를 확인하세요.'],
            ['하지 않을 일', '기한이 지난 시트를 “잠깐” 쓰지 마세요.'],
            ['관련', '중고 카시트·설치 원칙 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 카시트 개요(영)', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats'],
            ['AAP 카시트 정보', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx']
        ]
    },
    {
        id: 'latch-isofix-check-boundary',
        match: /(latch\s*카시트|isofix|아이소픽스|하부\s*고정\s*장치|카시트\s*래치|래치\s*앵커)/,
        title: 'LATCH·ISOFIX는 체중·차량 제한을 확인하고, 설명서대로 설치·점검을 하세요',
        lead: '하부 고정 장치(LATCH/ISOFIX)는 편리하지만 차량·시트마다 체중 한도와 위치가 다릅니다. 한도를 넘기면 안전벨트 설치로 전환해야 할 수 있습니다. 설치 후 흔들림을 점검하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['확인', '차량 매뉴얼, 시트 라벨, 체중 합산 한도'],
            ['점검', '좌우 2.5cm 이하 움직임, 리클라인 각도']
        ],
        blocks: [
            ['지금 할 일', '시트·차량 설명서의 LATCH 한도를 읽어 보세요.'],
            ['하지 않을 일', '한도를 넘긴 채 하부 고정만 쓰지 마세요.'],
            ['관련', '카시트 원칙·만료·중고 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 카시트 설치(영)', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats'],
            ['AAP 카시트 정보', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx']
        ]
    },
    {
        id: 'newborn-car-seat-angle-boundary',
        match: /(신생아\s*카시트\s*각도|신생아\s*시트\s*기울|newborn\s*car\s*seat\s*angle|후향\s*각도\s*신생아)/,
        title: '신생아 카시트는 설명서 각도·인디케이터를 맞추고, 고개가 앞으로 수그러지지 않게 보세요',
        lead: '두꺼운 외투를 벨트 아래 끼우지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['설치', '각도, 벨트 위치'],
            ['금지', '두꺼운 패딩 끼움']
        ],
        blocks: [
            ['지금 할 일', '설명서 각도 표시를 확인하세요.'],
            ['하지 않을 일', '시트가 너무 세워져 고개가 숙여지지 않게 하세요.'],
            ['관련', '카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'car-seat-install-check-boundary',
        match: /(카시트\s*설치\s*확인|카시트\s*흔들림|car\s*seat\s*install\s*check|아이소픽스\s*제대로|카시트\s*각도)/,
        title: '카시트는 설명서대로 설치하고, 좌우로 많이 흔들리면 다시 조이세요',
        lead: '잘못된 설치가 흔합니다. 검사 이벤트·설명서를 활용하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['점검', '흔들림, 벨트 경로, 각도'],
            ['금지', '중고 사고 이력 무시']
        ],
        blocks: [
            ['지금 할 일', '설치 후 좌우 흔들림을 확인하세요.'],
            ['하지 않을 일', '두꺼운 패딩을 아이와 벨트 사이에 끼우지 마세요.'],
            ['관련', '카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'carseat-angle-indicator-boundary',
        match: /(카시트\s*등받이\s*각도\s*인디케이터|카시트\s*각도\s*인디케이터|시트\s*각도\s*표시|car\s*seat\s*angle\s*indicator)/,
        title: '카시트 각도 인디케이터·설명서를 맞춰 설치하고 고개가 수그러지지 않게 보세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['설치', '각도 표시, 벨트'],
            ['금지', '두꺼운 패딩 끼움']
        ],
        blocks: [
            ['지금 할 일', '표시 범위 안에 두세요.'],
            ['하지 않을 일', '각도를 대충 맞추지 마세요.'],
            ['관련', '카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'car-seat-register-recall-boundary',
        match: /(카시트\s*리콜\s*문자|카시트\s*등록\s*리콜|카시트\s*제조사\s*등록|car\s*seat\s*register\s*recall)/,
        title: '카시트 구매 후 제조사 등록을 하면 리콜 안내를 받기 쉽습니다',
        lead: '등록이 안전을 완성하지는 않습니다. 설치도 점검하세요.',
        points: [
            ['행동', '등록, 리콜 확인'],
            ['점검', '설치 상태']
        ],
        blocks: [
            ['지금 할 일', '모델 번호를 사진으로 남기세요.'],
            ['하지 않을 일', '리콜인데 계속 쓰지 마세요.'],
            ['관련', '리콜·카시트 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'car-seat-principles',
        match: /(카시트|카\s*시트|유아용\s*시트|아동용\s*보호장치).*(방향|전환|후방|전방|언제|기준|설치)|후방\s*장착|전방\s*전환/,
        title: '카시트는 나이·키·몸무게 기준과 올바른 설치가 우선이고, 제품 순위는 하지 않습니다',
        lead: '이동 중 아기는 연령·체격에 맞는 카시트에, 사용 설명서와 차량 안내대로 설치합니다. 가능한 한 오래 후방 장착을 유지하라는 안전 안내가 많습니다. 사이트에서 브랜드 추천·제휴 링크·“국민템” 순위를 하지 않습니다. 설치가 불확실하면 공인 점검·설명서를 이용하세요.',
        points: [
            ['원칙', '체격에 맞는 단계, 단단히 고정, 안전띠 위치, 두꺼운 외투 아래 벨트 금지 등 설명서 준수'],
            ['전환', '법·제품 라벨의 키·몸무게 한도를 보고, 서두른 전방 전환을 피합니다.']
        ],
        blocks: [
            ['지금 할 일', '현재 시트 라벨의 키·몸무게 한도와 차량 장착 방법을 다시 확인하세요.'],
            ['하지 않을 일', '중고 시트 이력 불명·사고 이력을 무시하거나, 카페 추천만으로 고르지 마세요.'],
            ['관련', '고위험 용품은 추천 0·직접 제휴 0 원칙을 유지합니다.']
        ],
        links: [
            ['도로교통공단 어린이 안전', 'https://www.koroad.or.kr/'],
            ['NHTSA 카시트', 'https://www.nhtsa.gov/vehicle-safety/car-seats-and-booster-seats'],
            ['AAP 카시트 안내', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx']
        ]
    },
    {
        id: 'torticollis-boundary',
        match: /(사경|torticollis|고개\s*기울|목이\s*기울|한쪽으로만\s*고개|목\s*근육\s*짧|기운\s*목)/,
        title: '고개가 한쪽으로만 기울면 사경·자세 문제 가능성을 진료에서 확인하세요',
        lead: '한쪽만 보는 습관·목 기울임은 자세성 사경 등과 관련될 수 있고, 두상 비대칭과 함께 오기도 합니다. 사이트에서 운동 처방·도수 치료를 단정하지 않습니다. 터미타임·양방향 자극을 시도하되, 지속되면 소아청소년과·재활 상담을 검토하세요.',
        points: [
            ['가정', '양쪽으로 안기, 깨어 있을 때 엎드려 놀이, 장난감 위치 바꾸기'],
            ['진료', '움직임 비대칭 지속, 통증, 발달 걱정']
        ],
        blocks: [
            ['지금 할 일', '어느 쪽으로 고개를 돌리는지 며칠 관찰하세요.'],
            ['하지 않을 일', '목을 억지로 세게 돌리지 마세요.'],
            ['관련', '납작 머리·터미타임 안내를 참고하세요.']
        ],
        links: [
            ['AAP 사경·두상', 'https://www.healthychildren.org/English/ages-stages/baby/Pages/Your-Babys-Head-Shape-Positional-Skull-Deformities.aspx'],
            ['터미타임 안내', '#home'],
            ['발달 가이드', 'blog/development-kdst-guide.html']
        ]
    },
    {
        id: 'plagiocephaly-helmet-boundary',
        match: /(사두증\s*헬멧|두상\s*교정\s*헬멧|plagiocephaly\s*helmet|머리\s*모양\s*헬멧|사두\s*교정기)/,
        title: '머리 모양 헬멧은 의료진 평가 후 결정하며, 광고만으로 필수로 보지 마세요',
        lead: '자세 변경·터미타임이 먼저인 경우가 많습니다. 브랜드·병원 순위는 하지 않습니다.',
        points: [
            ['1차', '자세, 터미타임, 진료'],
            ['경계', '광고 필수 주장']
        ],
        blocks: [
            ['지금 할 일', '머리 방향 전환을 기록해 진료에 가져가세요.'],
            ['하지 않을 일', '인터넷 전후 사진만 보고 결정하지 마세요.'],
            ['관련', '납작 머리 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'flat-head-position',
        match: /(머리\s*납작|사두|두상|뒷머리\s*납작|플래지오|plagio|머리\s*모양|비대칭\s*머리)/,
        title: '뒷머리 납작함은 자세·터미타임으로 줄이고, 심하면 진료합니다',
        lead: '등을 대고 자는 안전수면 때문에 한쪽으로 머리가 납작해 보일 수 있습니다. 깨어 있을 때 엎드려 놀기(터미타임), 안는 팔·수유 방향을 바꾸는 것이 도움이 될 수 있습니다. 안전수면을 포기하고 엎어 재우지 마세요. 심한 비대칭·발달 걱정은 의료진과 상의합니다.',
        points: [
            ['낮', '지도된 터미타임, 고개 돌리는 방향 바꾸기'],
            ['잠', '등 재우기·빈 수면면 유지 (납작함 때문에 엎어 재우기 금지)']
        ],
        blocks: [
            ['지금 할 일', '깨어 있을 때 짧은 터미타임을 하루 여러 번 시도하세요.'],
            ['하지 않을 일', '헬멧·교정 제품을 자가 판단으로 구매해 쓰지 말고 진료와 상의하세요.'],
            ['관련', '터미타임·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['터미타임 안내', '#home'],
            ['AAP 머리 모양·자세', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/Positional-Skull-Deformities-and-Tummy-Time.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'bottle-wean',
        match: /(젖병).*(끊|떼|줄이|졸업|중독)|보틀\s*(웨닝|끊)|bottle\s*wean|젖병\s*끊/,
        title: '젖병 줄이기는 컵 연습과 함께, 첫돌 전후를 목표로 서서히',
        lead: '많은 안내가 첫돌 전후부터 열린 컵·작은 컵으로 옮기기를 권합니다. 한 번에 모두 빼기보다 낮 수유부터 컵으로 바꾸고 밤 젖병을 나중에 줄이는 방식이 흔합니다. 젖병에 주스·생우유를 넣어 재우지 마세요(치아).',
        points: [
            ['순서', '낮 한 회부터 컵, 취침 전 젖병은 천천히'],
            ['음료', '돌 전 주된 음료는 모유·조제유. 주스 습관화 금지']
        ],
        blocks: [
            ['지금 할 일', '컵 연습과 현재 젖병 횟수를 적어 보세요.'],
            ['하지 않을 일', '누운 채 젖병을 물리거나 달콤한 음료를 넣지 마세요.'],
            ['관련', '컵 마시기·생우유·양치 안내를 참고하세요.']
        ],
        links: [
            ['컵 마시기 안내', '#home'],
            ['AAP 음료·컵', 'https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/Recommended-Drinks-for-Young-Children-Ages-0-5.aspx'],
            ['양치 기준', 'market/toddler-toothbrush-guide.html#standard']
        ]
    },
    {
        id: 'soccer-goal-anchor-safety',
        match: /(축구골\s*고정|축구\s*골대\s*넘어|soccer\s*goal\s*anchor|골대\s*쓰러|이동식\s*골대)/,
        title: '축구·하키 골대는 땅에 고정하고, 골대에 매달리거나 올라가지 마세요',
        lead: '고정되지 않은 골대 전복 사고가 보고됩니다. 앵커·무게로 고정하고 아이들이 매달리지 않게 하세요.',
        points: [
            ['고정', '앵커, 무게, 점검'],
            ['금지', '매달리기, 올라가기']
        ],
        blocks: [
            ['지금 할 일', '경기 전 고정 상태를 확인하세요.'],
            ['하지 않을 일', '골대 가로대에 매달리지 마세요.'],
            ['관련', '스포츠·놀이 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 스포츠', 'https://www.healthychildren.org/English/healthy-living/sports/Pages/default.aspx']
        ]
    },
    {
        id: 'playground-supervision-boundary',
        match: /(놀이터\s*감독|playground\s*supervision|놀이터\s*혼자\s*두|놀이터\s*휴대폰|멀리서\s*놀이터)/,
        title: '놀이터에서는 아이가 보이는 거리에서 감독하고, 연령 구역을 넘나들지 않게 보세요',
        lead: '부상은 순식간에 납니다. 휴대폰만 보다가 놓치지 말고, 높은 기구·충돌 상황을 지켜보세요.',
        points: [
            ['감독', '시야 내, 즉시 개입 가능'],
            ['구역', '연령 적합 기구']
        ],
        blocks: [
            ['지금 할 일', '높은 기구 근처에서는 더 가까이 계세요.'],
            ['하지 않을 일', '어린 아이를 혼자 놀이터에 두지 마세요.'],
            ['관련', '놀이터 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 놀이터', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'playstructure-bolt-check-boundary',
        match: /(놀이터\s*볼트|놀이터\s*나사|playstructure\s*bolt|놀이터\s*녹슨|놀이\s*기구\s*흔들)/,
        title: '놀이 기구가 흔들리거나 나사·녹이 심하면 이용을 중단하고 관리자에게 알리세요',
        lead: '느슨한 볼트·녹슨 모서리는 부상 위험이 있습니다. 파손된 기구는 타지 마세요.',
        points: [
            ['점검', '흔들림, 날카로움, 녹'],
            ['행동', '중단, 신고']
        ],
        blocks: [
            ['지금 할 일', '이용 전 흔들림을 확인해 보세요.'],
            ['하지 않을 일', '파손 구역에 올라가지 마세요.'],
            ['관련', '놀이터 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 놀이터', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'merry-go-round-safety',
        match: /(회전\s*놀이터|merry\s*go\s*round|돌림판\s*놀이터|회전목마\s*놀이터\s*안전|스피너\s*놀이터)/,
        title: '회전 기구는 너무 빠르게 돌리지 말고, 매달린 손·발이 끼이지 않게 보세요',
        lead: '빠른 회전은 낙상·끼임을 키웁니다. 앉거나 잡을 곳을 확인한 뒤 천천히 돌리세요.',
        points: [
            ['이용', '천천히, 앉기, 잡기'],
            ['주의', '옷·끈 끼임']
        ],
        blocks: [
            ['지금 할 일', '옷·신발 끈이 끼이지 않는지 보세요.'],
            ['하지 않을 일', '어린이를 세게 돌리지 마세요.'],
            ['관련', '놀이터 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 놀이터', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'seesaw-teeter-safety',
        match: /(시소\s*안전|시소\s*타|seesaw|teeter\s*totter|시소\s*뛰어내리)/,
        title: '시소는 양쪽에 비슷한 체중으로, 상대가 내리기 전에 뛰어내리지 마세요',
        lead: '갑자기 내리면 상대가 크게 부딪힐 수 있습니다. 앉아서 타고 손이 끼이지 않게 보세요.',
        points: [
            ['이용', '앉기, 손 위치, 함께 내리기'],
            ['금지', '갑자기 뛰어내리기']
        ],
        blocks: [
            ['지금 할 일', '양쪽이 준비됐는지 확인하세요.'],
            ['하지 않을 일', '한쪽에만 여러 명이 몰리지 않게 하세요.'],
            ['관련', '놀이터 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 놀이터', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'climber-height-age-boundary',
        match: /(정글짐\s*높이)/,
        title: '높은 오르기 기구는 연령 구역을 지키고 꼭대기에서 뛰어내리지 않게 하세요',
        lead: '낙상은 머리 부상으로 이어질 수 있습니다.',
        points: [
            ['이용', '연령 구역, 양손'],
            ['금지', '꼭대기 점프']
        ],
        blocks: [
            ['지금 할 일', '아이 키에 맞는 구역인지 보세요.'],
            ['하지 않을 일', '위에서 밀지 마세요.'],
            ['관련', '놀이터·낙상 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['CDC 낙상', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'climber-jungle-gym-safety',
        match: /(정글짐|클라이머\s*놀이터|jungle\s*gym|오르는\s*놀이터|구름다리\s*놀이터)/,
        title: '오르는 기구는 연령 구역을 지키고, 높은 곳에서 밀치기·뛰어내리기를 말리세요',
        lead: '높은 기구 낙상은 골절·머리 부상으로 이어질 수 있습니다. 감독과 연령 적합 기구를 우선하세요.',
        points: [
            ['이용', '연령 구역, 양손, 밀지 않기'],
            ['금지', '꼭대기에서 점프']
        ],
        blocks: [
            ['지금 할 일', '아이 연령 구역인지 확인하세요.'],
            ['하지 않을 일', '위에서 밀며 장난하지 마세요.'],
            ['관련', '낙상·놀이터 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 놀이터', 'https://www.cpsc.gov/'],
            ['CDC 낙상', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'slide-burn-metal-boundary',
        match: /(미끄럼틀\s*화상|금속\s*미끄럼|slide\s*hot|미끄럼틀\s*뜨거|놀이터\s*미끄럼\s*화상)/,
        title: '금속 미끄럼틀은 뜨거울 수 있어 손으로 온도를 확인하고, 세워서 내려가지 마세요',
        lead: '여름 금속 표면은 화상을 입힐 수 있습니다. 온도를 확인하고 앉아서 미끄러지세요.',
        points: [
            ['확인', '표면 온도, 그늘'],
            ['이용', '앉기, 한 명씩']
        ],
        blocks: [
            ['지금 할 일', '타기 전 손으로 온도를 느껴 보세요.'],
            ['하지 않을 일', '뜨거울 때 맨살로 타지 마세요.'],
            ['관련', '화상·놀이터 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'swing-set-safety',
        match: /(그네\s*안전|swing\s*set|그네\s*뛰어내리|그네\s*앞\s*지나가|그네\s*두\s*명)/,
        title: '그네는 앞뒤를 비키고, 서서 타거나 뛰어내리지 마세요',
        lead: '그네 충돌·낙상이 흔합니다. 앉아서 타고, 앞을 지날 때 거리를 두며, 사슬·좌석 상태를 확인하세요.',
        points: [
            ['이용', '앉기, 한 명, 뛰어내리기 금지'],
            ['주변', '앞뒤 통행 주의']
        ],
        blocks: [
            ['지금 할 일', '사슬과 좌석 마모를 확인하세요.'],
            ['하지 않을 일', '그네 바로 앞을 뛰어 지나가지 마세요.'],
            ['관련', '놀이터 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 놀이터', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'playground-mulch-surface-boundary',
        match: /(놀이터\s*바닥|멀치\s*놀이터|playground\s*surface|놀이터\s*모래\s*깊이|놀이터\s*매트)/,
        title: '놀이터 바닥은 충격을 줄이는 포장이 중요하고, 파손·유리·동물 배설물을 점검하세요',
        lead: '콘크리트 바로 위 놀이는 낙상 위험이 큽니다. 바닥재 상태와 이물질을 확인하세요. 시설 추천은 하지 않습니다.',
        points: [
            ['점검', '바닥, 유리, 배설물, 녹'],
            ['이용', '연령 구역, 감독']
        ],
        blocks: [
            ['지금 할 일', '놀기 전 바닥을 둘러보세요.'],
            ['하지 않을 일', '파손된 기구에 올라가지 마세요.'],
            ['관련', '놀이터 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 놀이터', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'indoor-playground-safety-boundary',
        match: /(실내\s*놀이터|키즈카페\s*안전|indoor\s*playground|볼풀\s*안전|실내\s*키즈)/,
        title: '실내 놀이터는 양말·연령 구역·혼잡을 보고, 볼풀·미끄럼에서 밀치지 않게 하세요',
        lead: '감염·부상 모두 가능합니다. 손 씻기와 감독을 유지하세요. 매장 순위는 하지 않습니다.',
        points: [
            ['이용', '연령 구역, 감독'],
            ['위생', '손 씻기']
        ],
        blocks: [
            ['지금 할 일', '놀기 전후 손을 씻으세요.'],
            ['하지 않을 일', '아픈 아이를 억지로 보내지 마세요.'],
            ['관련', '놀이터 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'playground-glass-sand-boundary',
        match: /(놀이터\s*모래\s*유리|놀이터\s*모래\s*유리|모래\s*속\s*유리\s*조각|playground\s*glass\s*sand)/,
        title: '놀이터 모래·바닥에서 유리·바늘을 보면 놀이를 중단하고 치우세요',
        lead: '맨발 이용을 피하세요.',
        points: [
            ['점검', '이물질'],
            ['행동', '중단, 신고']
        ],
        blocks: [
            ['지금 할 일', '놀기 전 바닥을 보세요.'],
            ['하지 않을 일', '이물질이 보이면 만지지 말고 알리세요.'],
            ['관련', '놀이터 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'playground-lost-child-meet-boundary',
        match: /(놀이터\s*마스크\s*분실|놀이터\s*헤어짐|놀이터\s*만날\s*장소|playground\s*lost\s*child)/,
        title: '놀이터·공원에서는 만날 장소를 정하고, 시야에서 벗어나지 않게 하세요',
        lead: '이름표를 검토할 수 있습니다.',
        points: [
            ['준비', '만날 장소, 연락처'],
            ['감독', '시야 내']
        ],
        blocks: [
            ['지금 할 일', '헤어지면 만날 곳을 말하세요.'],
            ['하지 않을 일', '붐비는 곳에서 손을 놓지 마세요.'],
            ['관련', '놀이터 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'playground-safety-basics',
        match: /(놀이터\s*안전|미끄럼틀\s*안전|놀이터\s*낙상|그네\s*안전|playground)/,
        title: '놀이터에서는 나이 맞는 구역·바닥 상태·보호자 감시가 기본입니다',
        lead: '높은 장비·단단한 바닥은 낙상 위험을 키웁니다. 연령 표지, 파손·녹, 뜨거운 금속 표면을 확인하고 보호자가 곁에 있습니다. 줄·목걸이·헬멧을 그네·미끄럼에 쓴 채 놀지 마세요(감김). 특정 놀이터 순위는 하지 않습니다.',
        points: [
            ['점검', '바닥 충격 흡수, 파손, 더운 날 금속 표면'],
            ['복장', '끈·목걸이 제거, 신발 고정']
        ],
        blocks: [
            ['지금 할 일', '아이 연령 구역인지 표지를 확인하세요.'],
            ['하지 않을 일', '높은 곳에서 전화를 보며 감시하지 마세요.'],
            ['관련', '낙상·머리 부딪힘 안내를 참고하세요.']
        ],
        links: [
            ['CDC 놀이터 안전', 'https://www.cdc.gov/heights-and-falls/prevention/index.html'],
            ['CPSC 놀이터 안내', 'https://www.cpsc.gov/Safety-Education/Safety-Guides/Sports-and-Recreation/Playground-Safety'],
            ['AAP 놀이터', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Playground-Safety.aspx']
        ]
    },
    {
        id: 'icy-sidewalk-fall-boundary',
        match: /(빙판|얼음\s*길|icy\s*sidewalk|결빙\s*보도|미끄러운\s*겨울\s*길|미끄러운\s*빙판)/,
        title: '겨울 빙판에서는 손을 잡고 천천히 걷고, 뛰거나 뛰어내리지 마세요',
        lead: '미끄러짐으로 머리·팔 부상이 납니다. 신발 바닥과 보도 상태를 확인하세요.',
        points: [
            ['이동', '손잡기, 천천히'],
            ['주의', '계단, 그늘진 얼음']
        ],
        blocks: [
            ['지금 할 일', '빙판 구간에서는 손을 잡으세요.'],
            ['하지 않을 일', '빙판 위에서 뛰게 두지 마세요.'],
            ['관련', '낙상·동상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 낙상', 'https://www.cdc.gov/heights-and-falls/prevention/index.html'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'tree-climbing-safety',
        match: /(나무\s*오르|tree\s*climb\s*child|나무\s*타기\s*아이|나뭇가지\s*올라)/,
        title: '나무 오르기는 높이·가지 상태를 보고, 성인 감독 없이 높은 곳에 올라가지 않게 하세요',
        lead: '낙상·가지 부러짐이 위험합니다. 낮은 곳·안전한 가지에서만 제한적으로 허용을 검토하세요.',
        points: [
            ['조건', '감독, 낮은 높이, 마른 가지 피하기'],
            ['금지', '전선 근처, 비 온 뒤']
        ],
        blocks: [
            ['지금 할 일', '전선·도로 옆 나무는 피하세요.'],
            ['하지 않을 일', '혼자 높은 나무에 오르게 두지 마세요.'],
            ['관련', '낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 낙상', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'fall-from-surface',
        match: /(낙상|떨어져|떨어질|침대\s*에서\s*떨|소파\s*에서\s*떨|기저귀\s*갈.*떨|아기\s*추락)/,
        title: '높은 면·침대·소파·기저귀 갈이대에서 아기를 혼자 두지 마세요',
        lead: '짧은 순간에도 뒤집기·밀기로 떨어질 수 있습니다. 갈이대·침대·소파·테이블 위에 두었다가 고개만 돌리는 사이 사고가 납니다. 한 손은 항상 아기에게, 가능하면 바닥에서 갈아 주세요.',
        points: [
            ['예방', '높은 면에 혼자 두지 않기, 난간·가드 과신 금지'],
            ['사고 후', '의식·구토·처짐·경련이 있으면 바로 진료·119']
        ],
        blocks: [
            ['지금 할 일', '갈이·옷 입히기를 바닥 매트에서 할 수 있는지 점검하세요.'],
            ['하지 않을 일', '“잠깐만” 두고 자리를 비우지 마세요.'],
            ['관련', '집 안 안전·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['CDC 아동 낙상 예방', 'https://www.cdc.gov/heights-and-falls/prevention/index.html'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'automatic-door-pinch-boundary',
        match: /(자동문\s*끼임|회전문\s*아이\s*손|automatic\s*sliding\s*door\s*child|센서\s*자동문\s*손)/,
        title: '자동문·회전문에서는 손을 잡고, 문 틈에 손·유모차가 끼지 않게 하세요',
        lead: '센서 오작동과 끼임이 납니다. 아이 손을 잡고 가장자리로 이동하세요.',
        points: [
            ['이동', '손잡기, 유모차 위치'],
            ['주의', '문 틈, 회전문']
        ],
        blocks: [
            ['지금 할 일', '문이 완전히 열린 뒤 통과하세요.'],
            ['하지 않을 일', '문 사이에 손을 넣게 두지 마세요.'],
            ['관련', '문 끼임·엘리베이터 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'garage-door-safety',
        match: /(차고\s*문|개러지\s*도어|garage\s*door|자동\s*문\s*끼|차고\s*자동문)/,
        title: '자동 차고 문은 반전·센서·원격키를 점검하고, 아이 놀이터가 되지 않게 하세요',
        lead: '차고 자동문은 끼임·압궤 위험이 있습니다. 센서가 가려지지 않게 하고, 원격·벽 스위치는 아이 손 닿지 않게 두세요. 문 아래에서 장난하거나 매달리게 하지 마세요. 특정 브랜드 추천은 하지 않습니다.',
        points: [
            ['점검', '장애물 센서, 자동 반전, 비상 해제'],
            ['습관', '문이 완전히 닫힐 때까지 확인, 키 보관']
        ],
        blocks: [
            ['지금 할 일', '센서 앞 장난감·상자를 치우고 반전 기능을 시험하세요.'],
            ['하지 않을 일', '문이 움직이는 동안 아이만 두지 마세요.'],
            ['관련', '가전 끼임·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 차고 문 안전', 'https://www.cpsc.gov/'],
            ['AAP 가정 부상 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'freezer-entrapment-boundary',
        match: /(냉동고\s*가둠|freezer\s*entrap|냉장고\s*숨|김치냉장고\s*들어가|냉장고\s*안\s*숨바꼭질)/,
        title: '냉장고·냉동고·김치냉장고 안에서 숨바꼭질하지 않게 하세요',
        lead: '가전 안에 들어가면 질식·저체온 위험이 있습니다. 문을 완전히 닫히게 두고, 버려진 냉장고는 문을 제거하세요. 키·손잡이 놀이를 막습니다. 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '문 닫힘 확인, 폐기 가전 문 제거, 감독'],
            ['응급', '갇힘 의심 시 즉시 열고 119']
        ],
        blocks: [
            ['지금 할 일', '창고·베란다 미사용 냉장고 문을 점검하세요.'],
            ['하지 않을 일', '가전 안을 “비밀 기지”로 두지 마세요.'],
            ['관련', '가전 끼임·트렁크 가둠 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 가전·가둠 안전', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'appliance-entrapment',
        match: /(세탁기\s*숨|건조기\s*숨|냉장고\s*숨|폐가전|아이\s*가전\s*안|entrapment|드럼\s*세탁기\s*들어가)/,
        title: '세탁기·건조기·냉장고 등 가전 안에 들어가지 못하게 문을 닫고 폐가전을 방치하지 마세요',
        lead: '아이들이 가전 안에 들어가 문이 닫히면 질식 위험이 있습니다. 사용 후 문을 닫고, 버려진 냉장고 등은 문을 제거하라는 안전 안내가 있습니다. 브랜드와 무관한 기본 안전입니다.',
        points: [
            ['예방', '문 닫기, 폐가전 문 제거, 감독'],
            ['금지', '숨바꼭질 장소로 가전 쓰기']
        ],
        blocks: [
            ['지금 할 일', '세탁실·창고 가전 문이 열려 있지 않은지 확인하세요.'],
            ['하지 않을 일', '폐냉장고를 마당에 문 달린 채 두지 마세요.'],
            ['관련', '집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 가전 감금 위험', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'stair-gate-boundary',
        match: /(안전문|계단\s*게이트|베이비\s*게이트|baby\s*gate|계단\s*차단|난간\s*안전문|계단\s*안전)/,
        title: '계단·위험한 방 입구는 안전문으로 막고, 설치·고정 상태를 점검하세요',
        lead: '기기 시작하는 아기에게 계단·주방·욕실은 낙상·화상 위험이 큽니다. 압력식·나사 고정 등 설치 방식과 문턱 높이는 제품 설명서를 따르고, 잘못된 설치는 오히려 위험할 수 있습니다. 특정 브랜드 순위·“필수 국민템” 추천은 하지 않습니다.',
        points: [
            ['사용', '계단 위·아래, 위험한 방, 설명서대로 고정'],
            ['주의', '낡은 문·느슨한 고정, 아이 혼자 문에 매달리기']
        ],
        blocks: [
            ['지금 할 일', '계단 입구와 문 고정 나사를 점검하세요.'],
            ['하지 않을 일', '안전문만 믿고 높은 곳에서 감독을 끊지 마세요.'],
            ['관련', '낙상·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 아기 안전문·가정 안전', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['낙상 안내', '#home']
        ]
    },
    {
        id: 'power-strip-child-safety',
        match: /(멀티탭\s*안전|멀티탭\s*아이|power\s*strip\s*child|전기\s*줄\s*문어발|콘센트\s*문어발)/,
        title: '멀티탭은 과부하·노출 콘센트를 피하고, 아이가 만지거나 물에 닿지 않게 하세요',
        lead: '감전·화재 위험이 있습니다. 필요 없는 구멍은 막고 바닥에 방치하지 마세요.',
        points: [
            ['배치', '고정, 덮개, 건조'],
            ['금지', '과다 연결, 물 근처']
        ],
        blocks: [
            ['지금 할 일', '사용하지 않는 구멍에 안전 커버를 하세요.'],
            ['하지 않을 일', '젖은 손으로 만지게 두지 마세요.'],
            ['관련', '콘센트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'power-strip-dust-fire-boundary',
        match: /(멀티탭\s*먼지|멀티탭\s*먼지|문어발\s*화재|power\s*strip\s*dust\s*fire)/,
        title: '멀티탭 먼지·과부하는 화재 위험이 있어 청소·정격을 지키세요',
        lead: '물 근처 사용을 피하세요.',
        points: [
            ['관리', '먼지 제거, 정격'],
            ['금지', '과다 연결']
        ],
        blocks: [
            ['지금 할 일', '사용하지 않는 플러그를 뽑으세요.'],
            ['하지 않을 일', '젖은 손으로 만지지 마세요.'],
            ['관련', '콘센트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'charger-cable-chew-boundary',
        match: /(충전기\s*케이블\s*씹기|충전기\s*케이블\s*씹|충전\s*선\s*물\s*아이|charger\s*cable\s*chew|USB\s*선\s*물기)/,
        title: '충전 케이블을 입에 넣지 않게 치우고, 손상된 선은 사용하지 마세요',
        lead: '감전·질식 위험이 있습니다.',
        points: [
            ['조치', '치우기, 교체'],
            ['금지', '사용 중 물기']
        ],
        blocks: [
            ['지금 할 일', '충전 중 케이블을 치우세요.'],
            ['하지 않을 일', '벗겨진 선을 쓰지 마세요.'],
            ['관련', '콘센트·중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'outlet-cord-safety',
        match: /(콘센트|outlet|멀티탭|전선\s*씹|코드\s*씹|전기\s*코드\s*아기|콘센트\s*덮|전원\s*플러그)/,
        title: '콘센트·전선은 덮개·정리로 막고, 코드를 물거나 당기지 못하게 하세요',
        lead: '콘센트에 물건을 넣거나 전선을 씹으면 감전·화상 위험이 있습니다. 사용하지 않는 콘센트 덮개, 전선 정리, 멀티탭 고정이 도움이 됩니다. 특정 덮개 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '덮개, 전선 정리, 멀티탭 가림, 충전기 방치 금지'],
            ['응급', '감전·화상 의심 시 전원 차단 후 119·진료']
        ],
        blocks: [
            ['지금 할 일', '바닥 높이 콘센트와 늘어진 충전 케이블을 점검하세요.'],
            ['하지 않을 일', '젖은 손으로 플러그를 만지게 두지 마세요.'],
            ['관련', '집 안 안전·화상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 전기 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC 가정 전기', 'https://www.cpsc.gov/'],
            ['화상 안내', '#home']
        ]
    },
    {
        id: 'door-hinge-pinch-guard-boundary',
        match: /(방문\s*경첩\s*끼임|방문\s*경첩\s*끼임|문\s*경첩\s*손|door\s*hinge\s*pinch\s*child)/,
        title: '문 경첩·문틈 끼임을 막기 위해 스토퍼·가드를 검토하고 문을 세게 닫지 마세요',
        lead: '제품 순위는 하지 않습니다.',
        points: [
            ['예방', '가드, 천천히 닫기'],
            ['감독', '손가락 위치']
        ],
        blocks: [
            ['지금 할 일', '문틈에 손을 넣지 않게 하세요.'],
            ['하지 않을 일', '세게 닫히는 문을 방치하지 마세요.'],
            ['관련', '문 끼임 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'door-pinch-safety',
        match: /(문\s*끼|손가락\s*끼|서랍\s*끼|문틈\s*손|도어\s*핀치|door\s*pinch|손가락\s*찍)/,
        title: '문·서랍 틈에 손가락이 끼지 않게 스토퍼·손잡이 습관을 만드세요',
        lead: '문·서랍이 닫힐 때 손가락 압궤 사고가 납니다. 문 스토퍼, 천천히 닫기, 아이 손이 문틀에 없는지 확인하세요. 심하게 부으면 진료합니다. 특정 스토퍼 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '문 스토퍼, 서랍 잠금, 닫기 전 확인'],
            ['다친 뒤', '차갑게(직접 얼음 X), 부종·변형·출혈 시 진료']
        ],
        blocks: [
            ['지금 할 일', '자주 닫히는 방문·화장실 문에 손을 두는지 관찰하세요.'],
            ['하지 않을 일', '문을 세게 닫는 장난을 하지 마세요.'],
            ['관련', '집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 부상 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 부상 예방', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'toilet-brush-cleaner-boundary',
        match: /(변기\s*솔\s*세제|변기\s*세정제\s*아이|toilet\s*cleaner\s*child|변기\s*청소\s*약|변기\s*방향제\s*먹)/,
        title: '변기 세정제·솔·방향제를 아이 손에 두지 말고, 섭취·눈 접촉 시 안내를 따르세요',
        lead: '화학 화상·중독 위험이 있습니다. 음료병에 옮기지 마세요.',
        points: [
            ['보관', '잠금, 높은 곳'],
            ['노출', '중독 상담']
        ],
        blocks: [
            ['지금 할 일', '세정제를 변기 옆에 열어 두지 마세요.'],
            ['하지 않을 일', '억지로 토하게 하지 마세요.'],
            ['관련', '중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'toilet-lid-lock-boundary',
        match: /(변기\s*잠금|변기\s*뚜껑|toilet\s*lock|변기\s*빠|변기\s*익사|화장실\s*문\s*잠)/,
        title: '변기 뚜껑·화장실 문은 닫아 두고, 영아는 변기 물 놀이를 막으세요',
        lead: '변기 물에 머리가 빠지면 익사 위험이 있습니다. 뚜껑을 닫고 잠금장치를 쓰며, 화장실 문을 닫아 두세요. 목욕·물놀이와 별개로 변기 주변 감독이 필요합니다. 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '뚜껑 닫기·잠금, 화장실 문 닫기, 혼자 두지 않기'],
            ['응급', '물에 빠진 뒤 호흡 이상 → 119·응급처치']
        ],
        blocks: [
            ['지금 할 일', '변기 뚜껑과 화장실 문 습관을 점검하세요.'],
            ['하지 않을 일', '영아만 화장실에 두지 마세요.'],
            ['관련', '익사·욕조 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'sliding-door-safety',
        match: /(미닫이\s*문|슬라이딩\s*도어|sliding\s*door|베란다\s*유리문|통유리\s*문\s*부딪|유리문\s*쾅)/,
        title: '미닫이·통유리 문은 손 끼임·부딪힘을 막고, 닫힘 속도와 잠금을 확인하세요',
        lead: '베란다·거실 유리 미닫이문은 손가락 끼임·세게 닫힘·유리 충돌 사고가 납니다. 스토퍼·손잡이 습관, 스티커로 유리를 보이게 하기, 아이 손이 문틀에 없는지 확인하세요. 특정 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '손가락 위치 확인, 세게 닫지 않기, 유리 표시'],
            ['다친 뒤', '출혈·부종·머리 부딪힘 시 진료']
        ],
        blocks: [
            ['지금 할 일', '아이 눈높이에서 유리문이 잘 보이는지 확인하세요.'],
            ['하지 않을 일', '문을 밀치며 숨바꼭질하지 마세요.'],
            ['관련', '문 끼임·유리 모서리 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 부상 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 부상 예방', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'glass-corner-furniture-safety',
        match: /(유리\s*테이블|유리\s*탁자|모서리\s*보호|코너\s*가드|가구\s*모서리|glass\s*table|sharp\s*corner)/,
        title: '유리·날카로운 모서리는 가드·배치로 막고, 뛰는 공간과 분리하세요',
        lead: '유리 테이블·날카로운 모서리에 부딪히면 열상·머리 부상이 날 수 있습니다. 모서리 보호대, 미끄럼 방지, 가구 배치 변경이 도움이 됩니다. 특정 가드 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '모서리 가드, 유리 가장자리, 뛰어다니는 동선'],
            ['다친 뒤', '출혈 압박, 머리 부딪힘·의식 변화는 진료']
        ],
        blocks: [
            ['지금 할 일', '아이 눈높이에서 날카로운 모서리를 둘러보세요.'],
            ['하지 않을 일', '미끄러운 바닥에서 유리 가구 주변을 뛰게 두지 마세요.'],
            ['관련', '머리 부딪힘·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 낙상·부상', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'snow-removal-child-distance-boundary',
        match: /(제설\s*아이\s*거리|제설\s*아이\s*거리|눈\s*치우\s*아이|snow\s*removal\s*child\s*distance)/,
        title: '제설기·삽질 때는 아이를 멀리 두고, 눈 fort 무너짐도 조심하세요',
        lead: '기계 부상·질식 위험이 있습니다.',
        points: [
            ['거리', '작업 구역 밖'],
            ['금지', '기계 근처 놀이']
        ],
        blocks: [
            ['지금 할 일', '작업 전 아이 위치를 확인하세요.'],
            ['하지 않을 일', '제설기 근처에 두지 마세요.'],
            ['관련', '제설·동상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'snowblower-child-safety',
        match: /(제설기|스노우\s*블로어|snow\s*blower|눈\s*치우기\s*기계|제설\s*기계\s*아이)/,
        title: '제설기 가동 중에는 아이를 멀리 두고, 막힌 눈을 손으로 빼지 마세요',
        lead: '제설기는 칼날·투척구 부상 위험이 큽니다. 가동 중 아이·반려동물을 가까이 두지 말고, 막힌 눈은 전원을 끄고 도구로 치우세요. 제품 추천은 하지 않습니다.',
        points: [
            ['거리', '가동 중 접근 금지, 보호 장비'],
            ['금지', '투척구에 손, 아이 무릎에 태우기']
        ],
        blocks: [
            ['지금 할 일', '제설 전 아이 놀이 구역을 분리하세요.'],
            ['하지 않을 일', '기계가 돌아갈 때 아이와 같이 있지 마세요.'],
            ['관련', '잔디깎이·동상 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 제설·야외 장비', 'https://www.cpsc.gov/'],
            ['AAP 겨울·야외 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'lawn-mower-child-safety',
        match: /(잔디\s*깎|잔디깎|론\s*모어|lawn\s*mower|예초기\s*아이|잔디\s*기계)/,
        title: '잔디깎이·예초기 가동 중에는 아이를 멀리 두고, 타게 하지 마세요',
        lead: '잔디깎이·예초기는 돌·파편·칼날 부상 위험이 큽니다. 가동 중 아이는 실내나 충분히 먼 곳에 두고, 무릎·탑승석에 태우지 마세요. 잔디를 깎기 전 장난감·돌을 치웁니다. 제품 추천은 하지 않습니다.',
        points: [
            ['거리', '가동 중 아이·반려견 접근 금지'],
            ['금지', '무릎에 태우기, 아이 손 닿는 키 보관']
        ],
        blocks: [
            ['지금 할 일', '잔디 작업 전 마당에서 아이 장난감을 치우세요.'],
            ['하지 않을 일', '기계가 돌아갈 때 아이와 같이 있지 마세요.'],
            ['관련', '집 밖·놀이 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 잔디깎이 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Lawnmower-Safety.aspx'],
            ['CPSC 잔디 장비', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'rip-current-beach-boundary',
        match: /(이안류|rip\s*current|바다\s*쓸려|파도에\s*쓸려|해수욕\s*조류)/,
        title: '이안류에 휩쓸리면 해안과 평행히 헤엄치고, 깃발·구조 요원을 확인하세요',
        lead: '어린이는 깊은 물·파도 지역에 두지 마세요. 구명조끼와 성인 감독이 중요합니다.',
        points: [
            ['예방', '깃발, 얕은 구역, 감독'],
            ['휩쓸림', '평행 이동, 구조 요청']
        ],
        blocks: [
            ['지금 할 일', '해수욕장 안전 구역을 지키세요.'],
            ['하지 않을 일', '파도가 센 날 깊이 들어가지 마세요.'],
            ['관련', '해변 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'beach-safety-basics',
        match: /(해변|바다\s*아기|beach\s*safety|해수욕\s*아이|파도\s*아이|갯벌\s*아기|바닷가\s*아기)/,
        title: '해변에서는 파도·조류·햇볕·익사를 함께 보고, 팔 닿는 감시를 하세요',
        lead: '바다는 얕아 보여도 파도와 조류가 위험합니다. 구명조끼·팔 닿는 감시, 그늘·수분, 깨진 유리·낚시 바늘을 살피세요. 플로티만 믿지 마세요. 특정 해변·용품 추천은 하지 않습니다.',
        points: [
            ['물', '구명조끼, 파도 방향, 혼자 금지'],
            ['환경', '그늘, 수분, 발 보호, 쓰레기·바늘']
        ],
        blocks: [
            ['지금 할 일', '입수 전 구명조끼와 만조·파도 정보를 확인하세요.'],
            ['하지 않을 일', '등을 돌린 채 사진만 찍지 마세요.'],
            ['관련', '익사·구명조끼·햇볕 안내를 참고하세요.']
        ],
        links: [
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'air-purifier-child-boundary',
        match: /(공기청정기\s*아이|air\s*purifier\s*child|공기\s*청정기\s*전도|공기청정기\s*필터\s*만지)/,
        title: '공기청정기는 전복되지 않게 두고, 필터·버튼을 만지지 않게 하세요',
        lead: '코드 걸림·전복 위험이 있습니다. 효과 과장 광고만 보지 말고 배치 안전을 우선하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['배치', '안정, 코드 정리'],
            ['금지', '위에 오르기']
        ],
        blocks: [
            ['지금 할 일', '아이가 밀 수 없는 위치를 고르세요.'],
            ['하지 않을 일', '작동 중 필터를 빼게 두지 마세요.'],
            ['관련', '가정 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'home-safety-basics',
        match: /(집\s*안\s*안전|아기\s*안전|베이비\s*프루프|안전사고\s*예방|콘센트\s*막|모서리\s*보호|약품\s*보관).*(아기|아이)?|아이\s*손\s*닿/,
        title: '집 안 안전은 약품·작은 물건·창·뜨거운 것부터 치웁니다',
        lead: '아기가 뒤집고 기기 시작하면 바닥에 있는 모든 것이 입에 갈 수 있습니다. 의약품·세제·전지·작은 부품을 잠그는 수납에 두고, 창·스토브·뜨거운 음료를 관리합니다. 특정 안전문·잠금장치 브랜드 추천은 하지 않습니다.',
        points: [
            ['우선', '약·세제·전지·비닐·작은 장난감 치우기, 뜨거운 액체'],
            ['이동', '계단·창·가구 고정은 가정 환경에 맞게']
        ],
        blocks: [
            ['지금 할 일', '아기 눈높이에서 방을 한 바퀴 살펴보세요.'],
            ['하지 않을 일', '제품 광고만 믿고 감독을 줄이지 마세요.'],
            ['관련', '질식 위험 식품·낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 질식 위험', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html']
        ]
    },
    {
        id: 'sound-machine-volume-boundary',
        match: /(백색\s*소음\s*볼륨|사운드\s*머신\s*크기|white\s*noise\s*volume|백색소음\s*너무\s*커|수면\s*스피커\s*음량)/,
        title: '백색 소음·사운드 머신은 너무 크거나 오래 가까이 두지 마세요',
        lead: '수면에 도움이 될 수 있으나 과도한 음량은 청력 자극 우려가 있습니다. 스피커를 아기 머리 바로 옆에 두지 말고, 대화 소리보다 크지 않게 조절하세요. 브랜드·“수면 보장” 광고는 따르지 않습니다.',
        points: [
            ['사용', '거리 두기, 낮은 음량, 필요 시 타이머'],
            ['경계', '귀 옆 밀착, 하루 종일 최대 볼륨']
        ],
        blocks: [
            ['지금 할 일', '기계 위치를 침대에서 조금 멀리 옮기세요.'],
            ['하지 않을 일', '최대 볼륨으로 밤새 틀어 두지 마세요.'],
            ['관련', '백색소음·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면 환경 개요', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['CDC 소음·청력 개요', 'https://www.cdc.gov/nceh/hearing_loss/']
        ]
    },
    {
        id: 'flickering-night-light-boundary',
        match: /(수면등\s*깜빡임|수면등\s*깜빡|나이트라이트\s*깜박|flickering\s*night\s*light)/,
        title: '깜빡이는 수면등은 교체·점검을 하고, 전선·발열을 확인하세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['조치', '교체, 전선'],
            ['안전', '과열']
        ],
        blocks: [
            ['지금 할 일', '뜨거우면 끄고 치우세요.'],
            ['하지 않을 일', '파손된 제품을 쓰지 마세요.'],
            ['관련', '수면등 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'night-light-selection-boundary',
        match: /(수면등\s*고르|나이트\s*라이트\s*아이|night\s*light\s*baby|수면\s*조명\s*밝기|빨간\s*수면등)/,
        title: '수면등은 너무 밝지 않게 두고, 전선·뜨거운 전구를 아이 손에 닿지 않게 하세요',
        lead: '어두운 환경이 수면에 도움이 될 수 있습니다. 전복·화상 위험이 있는 스탠드를 침대 옆에 두지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['밝기', '낮게, 간접'],
            ['안전', '전선, 발열']
        ],
        blocks: [
            ['지금 할 일', '손이 닿지 않는 위치를 고르세요.'],
            ['하지 않을 일', '뜨거운 전구를 만지게 두지 마세요.'],
            ['관련', '수면 환경 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'sound-machine-distance-boundary',
        match: /(사운드\s*머신\s*거리|백색\s*소음\s*볼륨|sound\s*machine\s*distance|화이트노이즈\s*가까이|수면\s*기계\s*소리\s*크기)/,
        title: '사운드 머신은 너무 가까이·너무 크게 두지 말고, 대화 가능한 중간 이하를 검토하세요',
        lead: '과도한 소음은 청력에 부담이 될 수 있습니다. 기기 바로 옆·최대 볼륨을 피하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['배치', '침대에서 거리'],
            ['볼륨', '낮게, 整夜 최대 금지']
        ],
        blocks: [
            ['지금 할 일', '아이 머리 바로 옆에 두지 마세요.'],
            ['하지 않을 일', '최대 볼륨으로 整夜 틀지 마세요.'],
            ['관련', '백색 소음 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'white-noise-all-night-boundary',
        match: /(백색\s*소음\s*밤새|화이트노이즈\s*밤새|white\s*noise\s*all\s*night|밤새\s*백색소음)/,
        title: '백색 소음을 整夜 최대 볼륨으로 틀기보다 거리·볼륨을 조절하세요',
        lead: '과도한 소음 노출을 피하세요. 기기 브랜드 순위는 하지 않습니다.',
        points: [
            ['조절', '거리, 낮은 볼륨'],
            ['피하기', '최대 음량 근접']
        ],
        blocks: [
            ['지금 할 일', '아이 머리에서 떨어뜨려 두세요.'],
            ['하지 않을 일', '대화보다 크게 밤새 틀지 마세요.'],
            ['관련', '백색 소음 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'white-noise-boundary',
        match: /(백색\s*소음|백색소음|화이트\s*노이즈|white\s*noise|수면\s*기계|수면\s*스피커)/,
        title: '백색소음은 너무 크거나 가깝게 두지 말고, 안전수면을 대체하지 않습니다',
        lead: '일부 가정에서 수면 환경 소음으로 쓰지만, 볼륨이 크거나 아기 귀에 너무 가까우면 청력에 부담이 될 수 있다는 우려가 있습니다. 기기 유무보다 등 자세·빈 수면면·과열 방지가 우선입니다. 특정 기기 브랜드 추천은 하지 않습니다.',
        points: [
            ['사용 시', '적당한 거리·낮은 볼륨, 밤새 최대 음량 금지'],
            ['우선', '안전수면 환경, 일정 루틴']
        ],
        blocks: [
            ['지금 할 일', '스피커가 침대 안·바로 옆에 있지 않은지 확인하세요.'],
            ['하지 않을 일', '통잠을 위해 엎어 재우거나 이불을 덮지 마세요.'],
            ['관련', '안전수면·수면교육 경계를 참고하세요.']
        ],
        links: [
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['AAP 잠 습관', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/getting-your-baby-to-sleep.aspx']
        ]
    },
    {
        id: 'new-sibling-prep-boundary',
        match: /(동생\s*생김|동생\s*태어|둘째\s*태어|new\s*sibling|동생\s*질투\s*준비|형이\s*되는\s*준비|언니\s*되는\s*준비|둘째\s*생길)/,
        title: '동생이 생길 때는 첫째 루틴을 지키고, 퇴행·질투를 혼내지 말고 역할을 나눠 주세요',
        lead: '새 동생은 큰 변화입니다. 첫째의 수면·놀이 시간을 지키고, 아기를 돌보는 “도우미” 역할을 작게 주세요. 퇴행(배변·말)은 흔할 수 있습니다. 책·영상 “특효” 추천은 하지 않습니다.',
        points: [
            ['준비', '병원·방문 규칙, 혼자 시간, 일관된 양육자'],
            ['대응', '질투 인정, 안전 감독, 비교 금지']
        ],
        blocks: [
            ['지금 할 일', '첫째만의 짧은 특별 시간을 정해 보세요.'],
            ['하지 않을 일', '“이제 형/언니니까”로 감정을 누르지 마세요.'],
            ['관련', '형제 질투·배변 퇴행 안내를 참고하세요.']
        ],
        links: [
            ['AAP 새 동생 개요', 'https://www.healthychildren.org/English/family-life/family-dynamics/Pages/default.aspx'],
            ['CDC 아동 발달·관계', 'https://www.cdc.gov/ncbddd/childdevelopment/']
        ]
    },
    {
        id: 'sibling-sharing-conflict-boundary',
        match: /(형제\s*장난감\s*뺏|동생\s*물건\s*뺏|sibling\s*sharing|형\s*장난감\s*싸워|형제\s*물건\s*뺏)/,
        title: '형제 장난감 갈등은 강제 공유보다 차례·소유를 가르치고 안전을 먼저 보세요',
        lead: '어린 아이에게 즉시 완벽 공유를 강요하기 어렵습니다. 때리기·물기는 바로 막으세요.',
        points: [
            ['방법', '차례, 타이머, 각자의 것'],
            ['금지', '폭력 방치']
        ],
        blocks: [
            ['지금 할 일', '위험하면 장난감을 잠시 치우세요.'],
            ['하지 않을 일', '큰아이에게만 양보를 강요하지 마세요.'],
            ['관련', '형제 질투 안내를 참고하세요.']
        ],
        links: [
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['형제 안내', '#home']
        ]
    },
    {
        id: 'bullying-when-to-act-boundary',
        match: /(따돌림\s*의심|왕따\s*아이|bullying\s*child|괴롭힘\s*학교|친구\s*따돌려)/,
        title: '따돌림이 의심되면 아이 말을 경청하고 학교·상담 경로를 연결하세요',
        lead: '무시하라고만 하지 말고 안전을 우선하세요. 폭력·협박은 즉시 대응하세요.',
        points: [
            ['듣기', '비난 없이 경청'],
            ['행동', '학교 연락, 기록']
        ],
        blocks: [
            ['지금 할 일', '언제·무엇을 기록하세요.'],
            ['하지 않을 일', '아이 탓으로만 돌리지 마세요.'],
            ['관련', '훈육·정신건강 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'pregnancy-first-child-jealousy-boundary',
        match: /(둘째\s*임신\s*첫째|둘째\s*임신\s*첫째|임신\s*중\s*형\s*질투|pregnancy\s*sibling\s*jealousy)/,
        title: '둘째 임신 중 첫째에게 변화를 미리 말하고 개별 시간을 챙기세요',
        lead: '퇴행은 흔할 수 있습니다. 때리기는 막으세요.',
        points: [
            ['준비', '설명, 개별 시간'],
            ['금지', '폭력 방치']
        ],
        blocks: [
            ['지금 할 일', '배를 만지는 규칙을 정하세요.'],
            ['하지 않을 일', '둘째 탓으로만 혼내지 마세요.'],
            ['관련', '형제 질투 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['형제 안내', '#home']
        ]
    },
    {
        id: 'sibling-jealousy',
        match: /(형제\s*질투|동생\s*질투|첫째\s*질투|둘째\s*준비|동생\s*생|형제\s*싸움|형\s*질투|누나\s*질투)/,
        title: '형제 질투·둘째 준비는 애정 빼앗김이 아니라 적응 과정으로 봅니다',
        lead: '동생이 생기거나 관심을 나눠 쓰면 큰아이가 퇴행·보챔·공격성을 보일 수 있습니다. 특별한 “합격 기간”은 없습니다. 큰아이에게 일대일 짧은 시간을 주고, 때리기·물기는 즉시 막되 감정을 무시하지 마세요. 심한 폭력·자해가 있으면 상담·진료를 연결합니다.',
        points: [
            ['도움', '하루 10분이라도 큰아이만의 놀이, 역할(수건 가져오기 등) 주기'],
            ['경계', '때리기·물기·위험한 장난은 즉시 멈추게 하고 짧게 설명']
        ],
        blocks: [
            ['지금 할 일', '큰아이가 좋아하는 활동 한 가지를 일정에 넣으세요.'],
            ['하지 않을 일', '“너는 형이니까 참아”만 반복하거나, 체벌로 질투를 억누르지 마세요.'],
            ['상담', '지속되는 공격·수면·식사 붕괴가 있으면 의료·상담 기관과 상의하세요.']
        ],
        links: [
            ['AAP 형제 관계', 'https://www.healthychildren.org/English/family-life/family-dynamics/Pages/Sibling-Rivalry.aspx'],
            ['CDC 유아 훈육', 'https://www.cdc.gov/parenting-toddlers/discipline/index.html'],
            ['떼쓰기 안내', '#home']
        ]
    },
    {
        id: 'hair-pulling-boundary',
        match: /(머리\s*뽑|머리카락\s*뜯|머리카락\s*뽑|hair\s*pull|모발\s*뽑|트리코틸로|자기\s*머리\s*뽑)/,
        title: '머리카락을 반복해 뽑으면 피부 손상·스트레스 신호일 수 있어 비난보다 상담을 검토하세요',
        lead: '습관적으로 머리카락을 뽑는 행동은 불안·감각 추구 등과 관련될 수 있습니다. 혼내거나 묶어 두기만 하지 말고, 빈도·탈모 반·다른 행동을 관찰해 소아과·정신건강 상담을 상의하세요. 진단명 단정·약 용량은 하지 않습니다.',
        points: [
            ['관찰', '언제 뽑는지, 탈모 부위, 속눈썹·눈썹'],
            ['대응', '부드럽게 대체 행동, 처벌 과잉 금지, 진료']
        ],
        blocks: [
            ['지금 할 일', '뽑는 상황(TV·긴장)을 짧게 기록하세요.'],
            ['하지 않을 일', '머리를 세게 때리거나 공개 망신을 주지 마세요.'],
            ['관련', '손톱 물어뜯기·감각 예민 안내를 참고하세요.']
        ],
        links: [
            ['AAP 습관·행동 개요', 'https://www.healthychildren.org/English/healthy-living/emotional-wellness/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'nail-biting-habit-boundary',
        match: /(손톱\s*물어\s*뜯\s*습관|손톱\s*깨무는\s*습관|nail\s*biting\s*habit|손톱\s*씹는\s*버릇\s*고치)/,
        title: '손톱 물어뜯기는 스트레스·습관을 보고, 처벌보다 짧게 자르고 손을 바쁘게 하세요',
        lead: '감염·손톱 손상 위험이 있습니다. 심한 불안이 동반되면 상담을 검토하세요. 쓴맛 제품 순위는 하지 않습니다.',
        points: [
            ['관리', '짧게 자르기, 손 씻기'],
            ['접근', '대체 행동, 비난 금지']
        ],
        blocks: [
            ['지금 할 일', '손톱을 짧게 유지하세요.'],
            ['하지 않을 일', '할 때마다 크게 혼내지 마세요.'],
            ['관련', '손톱 깨물기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['AAP 훈육', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx']
        ]
    },
    {
        id: 'nail-biting',
        match: /(손톱\s*물어|손톱\s*깨물|손톱\s*뜯|네일\s*바이팅|nail\s*bit)/,
        title: '손톱 물어뜯기는 흔하고, 상처·감염·심한 불안이면 도움을 봅니다',
        lead: '어린이에게 손톱 물어뜯기는 흔할 수 있습니다. 꾸짖기만으로는 잘 줄지 않고, 손에 할 일(놀이·점토)을 주거나 손톱을 짧게 유지하는 편이 낫습니다. 살을 파고 피가 나거나, 다른 강박·불안이 크면 의료·상담과 상의하세요. 자폐 여부 단정은 하지 않습니다.',
        points: [
            ['가정', '짧게 깎기, 손 바쁘게 하기, 야단보다 대체 행동'],
            ['진료', '감염 징후, 피부 손상, 일상 방해 수준의 반복']
        ],
        blocks: [
            ['지금 할 일', '언제 물어뜯는지(긴장·심심·영상)를 하루 관찰해 보세요.'],
            ['하지 않을 일', '손을 때리거나 “장애”로 낙인찍지 마세요.'],
            ['상담', '또래보다 심하고 조절이 안 되면 소아·정신건강 상담을 고려하세요.']
        ],
        links: [
            ['AAP 습관 행동 안내', 'https://www.healthychildren.org/English/healthy-living/emotional-wellness/Pages/default.aspx'],
            ['CDC 아동 정신건강', 'https://www.cdc.gov/children-mental-health/'],
            ['부모 마음건강', '#home']
        ]
    },
    {
        id: 'thumb-sucking-stop-pressure-boundary',
        match: /(손가락\s*빨기\s*끊|엄지\s*빨기\s*중단|thumb\s*sucking\s*stop|손가락\s*빨\s*혼내|손빨기\s*교정)/,
        title: '손가락 빨기는 연령·치아 영향을 보고, 수치심·가혹한 제지보다 전환을 쓰세요',
        lead: '어린 시기에는 흔할 수 있습니다. 치아·또래 놀이에 영향이 크면 치과·의료진과 상담하세요. 기구 순위는 하지 않습니다.',
        points: [
            ['접근', '전환, 칭찬'],
            ['피하기', '수치심, 손 묶기']
        ],
        blocks: [
            ['지금 할 일', '낮에 장난감·활동을 늘려 보세요.'],
            ['하지 않을 일', '손을 묶거나 매운 것을 바르지 마세요.'],
            ['관련', '엄지 빨기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['치아 가이드', 'blog/baby-dental-care.html']
        ]
    },
    {
        id: 'thumb-sucking',
        match: /(손가락\s*빨|엄지\s*빨|썸\s*서킹|thumb\s*suck)/,
        title: '손가락 빨기는 어릴 때 흔하고, 치아·지속 여부는 성장과 함께 봅니다',
        lead: '영유아의 손가락 빨기는 안정 행동으로 흔합니다. 많은 아이는 스스로 줄입니다. 치아 맞물림·지속 여부가 걱정되면 소아치과·의료진과 상의하세요. 갑자기 강제로 묶거나 수치심을 주는 방식은 피합니다. 쪽쪽이 줄이기와는 별도로 봅니다.',
        points: [
            ['영아', '흔함, 위생·상처만 확인'],
            ['연장', '치아·발음 걱정 시 전문가와 상담, 처벌 금지']
        ],
        blocks: [
            ['지금 할 일', '낮에 손이 바쁜 놀이를 늘려 보세요.'],
            ['하지 않을 일', '손에 매운 것·테이프로 벌주지 마세요.'],
            ['상담', '지속·치아 변화가 보이면 소아치과에 문의하세요.']
        ],
        links: [
            ['AAP 손가락 빨기', 'https://www.healthychildren.org/English/ages-stages/baby/crying-colic/Pages/Pacifiers-and-Thumb-Sucking.aspx'],
            ['양치 기준', 'market/toddler-toothbrush-guide.html#standard']
        ]
    },
    {
        id: 'nosebleed-aftercare-activity-boundary',
        match: /(코피\s*후\s*운동|코피\s*나고\s*뛰|nosebleed\s*after|코피\s*이후\s*활동|코피\s*재발\s*운동)/,
        title: '코피가 멈추면 코를 세게 풀거나 바로 격한 운동을 피하고, 반복되면 진료하세요',
        lead: '앉혀 코를 부드럽게 누르는 응급 처치 후, 자극을 줄이세요. 용량 있는 약은 여기서 정하지 않습니다.',
        points: [
            ['이후', '자극 줄이기, 가습'],
            ['진료', '반복, 대량, 외상']
        ],
        blocks: [
            ['지금 할 일', '멈춘 뒤 코를 세게 풀지 마세요.'],
            ['하지 않을 일', '머리를 뒤로 젖히지 마세요.'],
            ['관련', '코피 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'nosebleed-care',
        match: /(코피|코\s*피|비출혈|nose\s*bleed|epistaxis)/,
        title: '코피는 앉혀 앞으로 숙이고 콧날을 누르며, 눕혀 고개를 젖히지 마세요',
        lead: '어린이 코피는 건조·감기·코 후비기로 흔할 수 있습니다. 앉아 상체를 앞으로 살짝 숙인 채 콧날 부드러운 부분을 10분 정도 눌러 주세요. 고개를 뒤로 젖히거나 눕히면 피가 목으로 넘어갈 수 있습니다. 멈추지 않거나 잦고 양이 많으면 진료합니다.',
        points: [
            ['응급 처치', '앉기, 앞으로 숙이기, 콧날 압박, 차분히 호흡'],
            ['진료', '20분 이상 지속, 외상·이물질, 잦은 대량 출혈, 멍·다른 출혈']
        ],
        blocks: [
            ['지금 할 일', '압박 시간을 지키고 삼킨 피가 토로 나올 수 있음을 알려 주세요.'],
            ['하지 않을 일', '휴지를 깊게 쑤시거나 아스피린 계열을 임의로 주지 마세요.'],
            ['예방', '실내 건조 시 가습·코 후비기 줄이기(용량 연고 추천 없음)']
        ],
        links: [
            ['AAP 코피', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/Nosebleeds.aspx'],
            ['NHS 코피', 'https://www.nhs.uk/conditions/nosebleed/']
        ]
    },
    {
        id: 'tablecloth-pull-hot-drink-boundary',
        match: /(테이블보\s*당김|식탁보\s*잡아당|tablecloth\s*pull\s*hot|식탁보\s*뜨거운\s*컵)/,
        title: '식탁보 끝에 뜨거운 음식이 있으면 아이가 당겨 화상을 입을 수 있어 배치를 바꾸세요',
        lead: '가장자리 컵·냄비를 안쪽으로 두세요.',
        points: [
            ['배치', '안쪽, 짧은 매트'],
            ['주의', '당김']
        ],
        blocks: [
            ['지금 할 일', '뜨거운 것을 가장자리에 두지 마세요.'],
            ['하지 않을 일', '식탁보를 길게 늘어뜨리지 마세요.'],
            ['관련', '화상·당김 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'tablecloth-pull-burn',
        match: /(식탁보\s*당|테이블보\s*당|식탁\s*잡아\s*당|뜨거운\s*국\s*엎|냄비\s*손잡이\s*아이)/,
        title: '식탁보를 잡아당기면 뜨거운 음식이 쏟아질 수 있어 치우거나 고정하세요',
        lead: '아기가 식탁보·전선·냄비 손잡이를 잡아당기면 화상·머리 충격이 납니다. 긴 식탁보를 줄이고, 손잡이는 안쪽으로, 뜨거운 음료는 아이 손 밖에 두세요. 화상 시 흐르는 물로 식히고 민간 연고는 피합니다.',
        points: [
            ['예방', '식탁보 최소화, 손잡이 안쪽, 뜨거운 것 가장자리 금지'],
            ['사고', '흐르는 물 식히기, 넓은 면적이면 진료']
        ],
        blocks: [
            ['지금 할 일', '식탁 가장자리에 당길 수 있는 것이 있는지 보세요.'],
            ['하지 않을 일', '뜨거운 국을 테이블 끝에 두지 마세요.'],
            ['관련', '화상·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['화상 안내', '#home']
        ]
    },
    {
        id: 'vaporizer-steam-burn',
        match: /(가습기\s*화상|스팀\s*가습기|증기\s*가습기|핫\s*미스트|vaporizer|뜨거운\s*가습)/,
        title: '뜨거운 증기 가습기는 화상 위험이 있어 아이 손 닿지 않게, 가능하면 시원한 방식을 검토하세요',
        lead: '뜨거운 증기(핫 미스트) 가습기는 넘어지거나 만지면 화상 위험이 있습니다. 아이 손이 닿지 않는 위치·안정된 받침대가 필요합니다. 기기 청결·물때·곰팡이도 함께 봅니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['위치', '아이·펫 손 밖, 전선 정리, 안정된 면'],
            ['관리', '물 교체·세척 안내 준수']
        ],
        blocks: [
            ['지금 할 일', '가습기가 침대·놀이 공간에 너무 가까운지 확인하세요.'],
            ['하지 않을 일', '뜨거운 증기 출구를 아이 얼굴 쪽에 두지 마세요.'],
            ['관련', '화상·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가습기·실내 공기 개요', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Humidifiers-and-Vaporizers.aspx'],
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/']
        ]
    },
    {
        id: 'halloween-candy-check-boundary',
        match: /(할로윈\s*사탕\s*검사|trick\s*or\s*treat\s*candy|핼러윈\s*간식\s*확인|사탕\s*포장\s*뜯긴)/,
        title: '할로윈 사탕은 포장이 뜯기거나 수상하면 버리고, 질식 크기 사탕을 치우세요',
        lead: '포장 손상·연령 부적합 사탕을 걸러 주세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['확인', '포장, 크기'],
            ['주의', '질식, 알레르기']
        ],
        blocks: [
            ['지금 할 일', '집에 와서 함께 확인하세요.'],
            ['하지 않을 일', '포장이 열린 것은 주지 마세요.'],
            ['관련', '할로윈·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 질식', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'halloween-pumpkin-costume-safety',
        match: /(할로윈|호박\s*조각|pumpkin\s*carv|코스튬\s*안전|가면\s*질식|할로윈\s*사탕|costume\s*safety)/,
        title: '할로윈은 시야·불꽃·사탕 질식을 챙기고, 호박 조각칼은 아이 손에 주지 마세요',
        lead: '가면은 시야를 가릴 수 있어 얼굴 페인트·모자 대안을 검토하세요. 어두운 옷에는 반사·조명을 더하고, 작은 사탕·딱딱한 캔디는 질식 위험이 있습니다. 호박 조각은 성인이 하고 촛불 대신 전등을 권하는 안내가 많습니다. 브랜드 추천은 하지 않습니다.',
        points: [
            ['외출', '시야, 반사, 어른 동행, 도로 안전'],
            ['간식', '질식 위험 사탕 치우기, 포장 확인']
        ],
        blocks: [
            ['지금 할 일', '코스튬 길이·신발이 걸려 넘어지지 않는지 확인하세요.'],
            ['하지 않을 일', '아이에게 날카로운 조각칼을 주지 마세요.'],
            ['관련', '사탕 질식·불꽃놀이·야간 외출 안내를 참고하세요.']
        ],
        links: [
            ['AAP 할로윈 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Halloween-Safety-Tips.aspx'],
            ['CPSC 코스튬·불꽃 안전', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'fireworks-aftermath-debris-boundary',
        match: /(폭죽\s*다음\s*날)/,
        title: '불꽃놀이 뒤 잔해·미폭발 폭죽을 줍지 않게 하고 손을 씻기세요',
        lead: '잔여 화약·날카로운 파편이 위험합니다. 제품 순위는 하지 않습니다.',
        points: [
            ['금지', '줍기, 만지기'],
            ['이후', '손 씻기']
        ],
        blocks: [
            ['지금 할 일', '잔해 구역에 가지 않게 하세요.'],
            ['하지 않을 일', '미폭발처럼 보이는 것을 건드리지 마세요.'],
            ['관련', '폭죽 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'fireworks-safety',
        match: /(폭죽|불꽃놀이\s*안전|폭죽\s*사고|불꽃\s*놀이\s*아이|fireworks)/,
        title: '어린이 손 폭죽·근접 불꽃은 화상·눈 손상 위험이 커서 전문 행사 관람이 더 안전합니다',
        lead: '폭죽은 화상·실명·절단 위험이 있습니다. 어린이에게 폭죽을 만지게 하지 말고, 가능하면 공인 불꽃놀이만 멀리서 보세요. 비상 시 흐르는 물로 식히고 눈 손상은 비비지 말고 진료합니다. 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '어린이 손 폭죽 금지, 거리 두기, 보호자 감시'],
            ['사고', '화상 식히기, 눈·손 손상 시 즉시 진료']
        ],
        blocks: [
            ['지금 할 일', '명절·축제 전 가족 규칙을 정하세요.'],
            ['하지 않을 일', '다 탄 폭죽을 주워 다시 붙이지 마세요.'],
            ['관련', '화상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 폭죽 안전', 'https://www.cdc.gov/nceh/features/fireworks-safety/'],
            ['AAP 폭죽', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Fireworks-Safety.aspx']
        ]
    },
    {
        id: 'water-heater-scald-boundary',
        match: /(온수기|보일러\s*온수|수온\s*조절|뜨거운\s*수돗물|욕조\s*물\s*온도|온수\s*화상\s*예방|탭\s*워터\s*화상)/,
        title: '수돗물·욕조 온도를 미리 확인하고, 온수기는 너무 뜨겁지 않게 관리하세요',
        lead: '뜨거운 수돗물은 수 초 만에 화상을 입을 수 있습니다. 목욕 전 팔꿈치로 온도를 확인하고, 아기를 물속에 혼자 두지 마세요. 가정 온수기 설정은 제조·배관 안내와 화상 예방 권고를 참고합니다. 특정 온도 숫자만으로 모든 집을 단정하지 않으며, 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['목욕', '미리 받기, 손·팔꿈치로 확인, 혼자 두지 않기'],
            ['가정', '온수기·수도 온도 점검, 뜨거운 음료 멀리']
        ],
        blocks: [
            ['지금 할 일', '욕조·세면대 물을 받기 전 온도를 확인하는 습관을 만드세요.'],
            ['하지 않을 일', '아기를 받아 둔 뜨거운 물 근처에 혼자 두지 마세요.'],
            ['관련', '화상 응급·목욕 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 화상 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Preventing-Burns-at-Home.aspx'],
            ['화상 응급 안내', '#home']
        ]
    },
    {
        id: 'tetanus-wound-boundary',
        match: /(파상풍|tetanus|녹슨\s*못|상처\s*파상풍|파상풍\s*접종|외상\s*접종)/,
        title: '더러운 상처·녹슨 물건 외상 후에는 세척과 파상풍 접종 여부를 의료진과 확인하세요',
        lead: '파상풍은 상처로 균이 들어가 생길 수 있는 질환입니다. 상처를 깨끗이 씻고, 깊거나 오염된 상처는 진료에서 접종·처치를 정합니다. 사이트에서 접종 “맞아야 한다/안 맞아도 된다”를 개인 상처에 단정하거나 약 용량을 정하지 않습니다.',
        points: [
            ['당장', '흐르는 물·비누 세척, 깨끗한 거즈'],
            ['진료', '깊은 상처, 오염, 접종 기록 불명, 감염 징후']
        ],
        blocks: [
            ['지금 할 일', '상처 경위와 마지막 파상풍 접종 시기를 확인하세요.'],
            ['하지 않을 일', '흙·녹을 민간 약으로만 덮어 두지 마세요.'],
            ['관련', '접종 일정·화상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 파상풍', 'https://www.cdc.gov/tetanus/'],
            ['예방접종도우미', 'https://nip.kdca.go.kr/'],
            ['접종 일정 글', 'blog/vaccination-schedule.html']
        ]
    },
    {
        id: 'parent-first-aid-class-boundary',
        match: /(응급\s*교육\s*부모)/,
        title: '영아·소아 심폐소생·응급처치 교육을 미리 받아 두면 위기 때 도움이 될 수 있습니다',
        lead: '교육이 모든 상황을 대신하지 않습니다. 응급이면 119를 우선하세요. 기관 순위는 하지 않습니다.',
        points: [
            ['준비', '공인 교육'],
            ['응급', '119·진료']
        ],
        blocks: [
            ['지금 할 일', '지역 적십자·병원 교육을 알아보세요.'],
            ['하지 않을 일', '유튜브만 보고 충분하다고 보지 마세요.'],
            ['관련', 'CPR 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['Red Cross', 'https://www.redcross.org/']
        ]
    },
    {
        id: 'infant-choking-response-learn-boundary',
        match: /(하임리히\s*영아|영아\s*하임리히|영아\s*질식\s*처치\s*배우|infant\s*choking\s*response\s*class)/,
        title: '영아 질식 응급처치는 공인 교육으로 배우고, 응급 시 119를 우선하세요',
        lead: '유튜브만으로 충분하다고 보지 마세요. 기관 순위는 하지 않습니다.',
        points: [
            ['준비', '공인 교육'],
            ['응급', '119']
        ],
        blocks: [
            ['지금 할 일', '교육을 미리 받으세요.'],
            ['하지 않을 일', '의식이 없는데 임의 처치만 반복하지 마세요.'],
            ['관련', 'CPR·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['질식 안내', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Choking-Prevention.aspx']
        ]
    },
    {
        id: 'cpr-class-boundary',
        match: /(cpr|심폐\s*소생|하임리히|하임리히법|영아\s*응급\s*처치|응급\s*처치\s*교육|first\s*aid\s*class|영아\s*cpr)/,
        title: '영아·소아 심폐소생·기도폐쇄 처치는 공인 교육으로 익히고, 영상만으로 단정하지 마세요',
        lead: '위급 시 119와 교육받은 응급처치가 중요합니다. 사이트 문장만으로 CPR·하임리히 손기술을 가르치지 않으며, 대한적십자·공인 기관 교육을 권합니다. 호흡이 없거나 반응이 없으면 즉시 119에 연락하세요.',
        points: [
            ['지금', '119, 주변 도움 요청, 교육받은 처치'],
            ['준비', '보호자 대상 영아·소아 응급처치 교육']
        ],
        blocks: [
            ['지금 할 일', '가까운 영아 응급처치 교육 일정을 알아보세요.'],
            ['하지 않을 일', '검증 안 된 숏폼 영상만 보고 기술을 외우지 마세요.'],
            ['관련', '질식·호흡 응급 안내를 참고하세요.']
        ],
        links: [
            ['대한적십자사 응급처치 교육', 'https://www.redcross.or.kr/'],
            ['AAP 질식·응급 개요', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/default.aspx'],
            ['질식 안내', '#home']
        ]
    },
    {
        id: 'clothing-iron-burn-safety',
        match: /(다리미\s*화상|アイロン|clothing\s*iron|헤어\s*아이론|고데기\s*화상|스트레이트기\s*화상|다리미\s*식히)/,
        title: '다리미·고데기는 사용한 뒤에도 뜨거우니 아이 손 닿지 않는 곳에 두세요',
        lead: '다리미·헤어 아이론은 전원을 끈 뒤에도 한동안 뜨겁습니다. 코드에 걸려 넘어질 수 있으니 높은 안정된 곳에 두고, 식기 전 아이 손을 막으세요. 화상 시 흐르는 물로 식히고 민간 연고를 바르지 마세요. 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '사용 후 격리, 코드 정리, 아이 접근 차단'],
            ['화상', '흐르는 시원한 물, 물집 터뜨리기 금지, 진료 여부']
        ],
        blocks: [
            ['지금 할 일', '다리미 보관 위치와 코드 길이를 점검하세요.'],
            ['하지 않을 일', '침대·바닥에서 다리미를 식히지 마세요.'],
            ['관련', '화상·뜨거운 음료 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 화상 개요', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Burns.aspx']
        ]
    },
    {
        id: 'fireplace-hearth-safety',
        match: /(벽난로|난로\s*가드|fireplace|벽난로\s*화상|난로\s*울타리|벽난로\s*재)/,
        title: '벽난로·난로는 가드·거리·재 관리를 하고, 불 켠 채 아이만 두지 마세요',
        lead: '벽난로·장작 난로는 화상·연기·불씨 위험이 있습니다. 단단한 가드를 쓰고, 재·성냥을 치우며, 불 옆에서 뛰어놀지 않게 하세요. 특정 가드 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '가드, 이격, 재 식히기, 성냥·라이터 잠금'],
            ['연기', '환기, CO 경보, 굴뚝 점검']
        ],
        blocks: [
            ['지금 할 일', '난로 주변 러그·장난감을 치우세요.'],
            ['하지 않을 일', '불 켠 채 자리를 비우지 마세요.'],
            ['관련', '화상·CO 경보·난로 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 화재·화상 개요', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'air-fryer-burn-safety',
        match: /(에어프라이어\s*화상|에어\s*프라이어\s*안전|air\s*fryer|에어프라이어\s*아이|에어프라이어\s*증기)/,
        title: '에어프라이어는 본체·바구니·증기가 뜨거우니 아이 손 닿지 않게 두세요',
        lead: '에어프라이어 겉면·바스켓·빠져나오는 증기에 화상 위험이 있습니다. 가장자리 깊은 선반에 두고, 식기 전 아이를 가까이 두지 마세요. 특정 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '높은 위치, 코드 정리, 식힌 뒤 세척'],
            ['화상', '흐르는 물로 식히기, 민간 연고 금지']
        ],
        blocks: [
            ['지금 할 일', '에어프라이어 주변 발판·의자를 치우세요.'],
            ['하지 않을 일', '작동 중 문을 아이 눈높이에 두지 마세요.'],
            ['관련', '화상·주방 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['CPSC 주방 가전 안전', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'bbq-grill-safety',
        match: /(바비큐|BBQ|그릴\s*안전|숯불\s*아이|가스\s*그릴\s*아이|barbeque|barbecue\s*child)/,
        title: '바비큐·그릴은 아이 접근을 막고, 재·그릴을 식히기 전까지 방치하지 마세요',
        lead: '숯불·가스 그릴은 화상·연기·일산화탄소·재 속 불씨 위험이 있습니다. 아이는 그릴 반대편에 두고, 점화·요리·식힘 내내 감독하세요. 실내·텐트에서 숯불을 피우지 마세요. 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '이격, 도구 손잡이, 재 완전 소화'],
            ['금지', '실내 숯불, 그릴 위 장난, 라이터 방치']
        ],
        blocks: [
            ['지금 할 일', '그릴 주변에 아이 놀이 공간을 겹치지 않게 하세요.'],
            ['하지 않을 일', '뜨거운 그릴망을 잔디에 엎어 두고 떠나지 마세요.'],
            ['관련', '화상·CO·라이터 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['CDC 일산화탄소', 'https://www.cdc.gov/carbon-monoxide/'],
            ['AAP 야외 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'pressure-cooker-steam-burn',
        match: /(압력솥|압력\s*냄비|pressure\s*cooker|인스턴트\s*팟|instant\s*pot|압력솥\s*증기|압력솥\s*화상)/,
        title: '압력솥·전기 압력냄비는 증기와 뚜껑을 조심하고, 아이 손 닿지 않게 두세요',
        lead: '압력솥은 뚜껑·증기·내용물이 매우 뜨겁습니다. 압력 해제 전 억지로 열지 말고, 증기 배출구 앞에 아이를 두지 마세요. 조리 중·직후 카운터 가장자리를 비우세요. 제품 추천은 하지 않습니다.',
        points: [
            ['위험', '증기 화상, 뚜껑 분출, 뜨거운 국물'],
            ['예방', '높은 위치, 아이 접근 차단, 설명서대로 감압']
        ],
        blocks: [
            ['지금 할 일', '압력솥 주변에 발판·의자가 있는지 치우세요.'],
            ['하지 않을 일', '증기가 나오는 쪽으로 얼굴을 들이밀게 하지 마세요.'],
            ['관련', '화상·에어프라이어·주방 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['CPSC 주방 가전 안전', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'campground-child-safety',
        match: /(캠핑장|캠프장|campground|글램핑\s*아이|텐트\s*주변\s*안전|캠핑\s*아이\s*안전)/,
        title: '캠핑장에서는 불·물·차량 이동 구간을 미리 정하고, 야간에는 아이를 혼자 두지 마세요',
        lead: '야외 숙소는 익숙한 집과 위험이 다릅니다. 구명조끼·불 거리·손전등을 챙기세요.',
        points: [
            ['위험', '불, 물, 차량'],
            ['밤', '조명, 감독']
        ],
        blocks: [
            ['지금 할 일', '캠프파이어 주변에 선을 정하세요.'],
            ['하지 않을 일', '물가에 아이 혼자 두지 마세요.'],
            ['관련', '캠프파이어·물 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'camping-lantern-burn-boundary',
        match: /(캠핑\s*랜턴)/,
        title: '캠핑 랜턴·가스 조명 주변에 아이를 두지 말고, 전복·화상을 조심하세요',
        lead: '일산화탄소·화재 위험도 보세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['배치', '안정, 거리'],
            ['환기', '밀폐 텐트 연소 주의']
        ],
        blocks: [
            ['지금 할 일', '랜턴을 테이블 가장자리에 두지 마세요.'],
            ['하지 않을 일', '텐트 안에서 연료 연소를 함부로 하지 마세요.'],
            ['관련', '캠프파이어·CO 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'campfire-safety',
        match: /(캠프파이어|모닥불\s*아이|campfire|장작불\s*안전|캠핑\s*불\s*아이|불멍\s*아이)/,
        title: '캠프파이어·모닥불은 아이 접근을 막고, 재가 식을 때까지 방치하지 마세요',
        lead: '야외 불은 화상·연기·불씨 위험이 큽니다. 아이 손이 닿지 않는 거리를 두고, 불이 완전히 꺼지고 재가 식었는지 확인하세요. 텐트 안·밀폐 공간에서 불을 피우지 마세요. 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '이격, 바람 방향, 물·모래로 완전 소화'],
            ['금지', '불 위 뛰어넘기, 라이터 장난, 텐트 안 화기']
        ],
        blocks: [
            ['지금 할 일', '불 주변에 아이 의자·담요를 겹치지 않게 두세요.'],
            ['하지 않을 일', '재 속에 불이 남은 채 자리를 비우지 마세요.'],
            ['관련', '바비큐·화상·CO 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 야외 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'after-sun-burn-care-boundary',
        match: /(햇볕\s*화상|일광\s*화상|sunburn\s*baby|햇볕\s*빨개|자외선\s*화상\s*아이|애프터선)/,
        title: '햇볕 화상은 시원하게 하고 자극을 줄이며, 물집·발열·어린 영아는 진료를 검토하세요',
        lead: '햇볕에 붉고 아프면 시원한 환경, 충분한 수분, 자극 없는 보습을 합니다. 버터·민간 연고를 바르거나 물집을 터뜨리지 마세요. 영아·넓은 물집·고열은 진료합니다. 애프터선 브랜드 순위는 하지 않습니다.',
        points: [
            ['즉시', '그늘, 시원한 물·수건, 수분'],
            ['진료', '물집, 발열, 처짐, 생후 어린 영아']
        ],
        blocks: [
            ['지금 할 일', '더 이상 햇볕에 노출되지 않게 하세요.'],
            ['하지 않을 일', '얼음을 직접 피부에 문지르지 마세요.'],
            ['관련', '햇볕 차단·화상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 일광 화상·자외선', 'https://www.cdc.gov/cancer/skin/basic_info/sun-safety.htm'],
            ['AAP 햇볕 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Sun-Safety.aspx']
        ]
    },
    {
        id: 'video-call-young-child-boundary',
        match: /(영상\s*통화\s*아기|페이스타임\s*아기|video\s*call\s*baby|줌\s*통화\s*아기|비디오\s*통화\s*유아)/,
        title: '화상 통화는 짧은 상호작용으로 쓰고, 일방적 영상 시청과 구분하세요',
        lead: '일부 안내는 영상 통화의 상호 작용을 다르게 보기도 합니다.  그래도 긴 화면 노출은 줄이세요. 앱 순위는 하지 않습니다.',
        points: [
            ['사용', '짧게, 함께 보기'],
            ['구분', '수동 시청']
        ],
        blocks: [
            ['지금 할 일', '통화를 짧게 유지하세요.'],
            ['하지 않을 일', '통화를 종일 배경 화면으로 켜 두지 마세요.'],
            ['관련', '스크린 타임 안내를 참고하세요.']
        ],
        links: [
            ['AAP 미디어', 'https://www.healthychildren.org/English/family-life/Media/Pages/default.aspx'],
            ['스크린 안내', '#home']
        ]
    },
    {
        id: 'hair-styling-tool-cool-boundary',
        match: /(고데기\s*식히|고데기\s*아이|flat\s*iron\s*child|매직기\s*뜨거|헤어\s*아이론\s*보관)/,
        title: '고데기·매직기는 식을 때까지 아이가 닿지 않는 곳에 두고, 사용 중 줄을 정리하세요',
        lead: '접촉 화상이 납니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['보관', '높은 곳, 식힘'],
            ['사용', '감독']
        ],
        blocks: [
            ['지금 할 일', '식기 전 침대·소파에 두지 마세요.'],
            ['하지 않을 일', '줄에 걸려 당기지 않게 하세요.'],
            ['관련', '다리미·화상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'ladle-hot-soup-reach-boundary',
        match: /(뜨거운\s*국\s*국자|국자\s*손잡이\s*아이|ladle\s*hot\s*soup|냄비\s*손잡이\s*바깥)/,
        title: '냄비·국자 손잡이를 아이 반대쪽으로 돌리고, 국이 끓는 동안 가까이 두지 마세요',
        lead: '당겨 쏟음 화상이 흔합니다.',
        points: [
            ['배치', '손잡이 안쪽'],
            ['감독', '주방 출입']
        ],
        blocks: [
            ['지금 할 일', '손잡이를 안쪽으로 돌리세요.'],
            ['하지 않을 일', '아이 앞에서 끓는 국을 옮기지 마세요.'],
            ['관련', '화상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'microwave-steam-burn-boundary',
        match: /(전자레인지\s*스팀)/,
        title: '전자레인지로 데운 음식은 뚜껑을 얼굴 반대쪽으로 열고, 김·뜨거운 반점을 조심하세요',
        lead: '스팀 화상이 흔합니다. 아이 얼굴 높이에서 열지 마세요.',
        points: [
            ['방법', '멀리, 젓기, 온도'],
            ['금지', '아이 앞에서 급개봉']
        ],
        blocks: [
            ['지금 할 일', '뚜껑을 천천히 여세요.'],
            ['하지 않을 일', '바로 입에 넣지 마세요.'],
            ['관련', '화상·전자레인지 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'burn-scald-care',
        match: /(화상|데였|뜨거운\s*물|끓는\s*물|스팀\s*화상|화상\s*응급)/,
        title: '화상·뜨거운 물은 흐르는 찬물로 식히고, 민간 연고·얼음 문지르기는 피합니다',
        lead: '뜨거운 액체·표면 화상은 즉시 흐르는 미지근하거나 찬물로 해당 부위를 20분 정도 식히는 안내가 많습니다. 얼음으로 문지르거나 치약·간장·민간 연고를 바르지 마세요. 물집을 터뜨리지 말고, 넓은 면적·얼굴·손·관절·호흡기 의심·아이 전신이면 바로 의료기관을 찾으세요. 약 용량·브랜드 연고 순위는 하지 않습니다.',
        points: [
            ['즉시', '흐르는 물로 식히기, 젖은 옷은 들러붙지 않으면 제거'],
            ['병원', '넓은 면적, 깊은 화상, 얼굴·기도, 화학·전기, 심한 통증·물집']
        ],
        blocks: [
            ['지금 할 일', '식힌 뒤 깨끗한 거즈로 덮고 진료 여부를 판단하세요.'],
            ['하지 않을 일', '치약·된장·얼음 직접 문지르기, 물집 터뜨리기 금지'],
            ['예방', '뜨거운 음료·냄비 손잡이·욕조 온도를 아이 손이 닿지 않게']
        ],
        links: [
            ['CDC 화상 안전', 'https://www.cdc.gov/burn-prevention/'],
            ['NHS 화상·열탕', 'https://www.nhs.uk/conditions/burns-and-scalds/'],
            ['집 안 안전 안내', '#home']
        ]
    },
    {
        id: 'water-wings-floaties-boundary',
        match: /(팔\s*튜브|워터\s*윙|물에\s*뜨는\s*팔|floaties|water\s*wings|수영\s*보조\s*팔)/,
        title: '팔 튜브·풀로티는 생명을 지켜 주는 장비가 아닙니다',
        lead: '팔에 끼우는 튜브·일부 수영 보조 용품은 뒤집히거나 공기가 빠질 수 있어 구명장비 대용이 아닙니다. 수영장·바다에서는 성인 팔 길이 안 감독과, 필요 시 공인 구명조끼를 우선하세요. 특정 제품 추천은 하지 않습니다.',
        points: [
            ['사실', '플로티 ≠ 구명조끼, 감독 대체 불가'],
            ['우선', '팔 닿는 거리, 울타리·문, 구명조끼(상황별)']
        ],
        blocks: [
            ['지금 할 일', '물놀이 때 “튜브 있으니 괜찮다”는 생각을 버리세요.'],
            ['하지 않을 일', '팔 튜브만 끼운 채 아이만 물에 두지 마세요.'],
            ['관련', '익사 예방·구명조끼·수영 교육 안내를 참고하세요.']
        ],
        links: [
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'fishing-hook-child-safety',
        match: /(낚싯바늘)/,
        title: '낚시 바늘·찌를 아이 손이 닿지 않게 하고, 찔리면 임의로 깊게 빼지 말고 진료를 검토하세요',
        lead: '미끼·낚싯줄 감김도 위험합니다.',
        points: [
            ['예방', '보관, 거리'],
            ['부상', '진료']
        ],
        blocks: [
            ['지금 할 일', '채비를 아이 뒤에 두세요.'],
            ['하지 않을 일', '바늘을 입으로 물지 않게 하세요.'],
            ['관련', '부상·중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'boat-child-safety',
        match: /(배\s*타\s*아이|보트\s*아이|선상\s*아이|boat\s*child|요트\s*아기|카약\s*아이|구명조끼\s*배)/,
        title: '배·보트에서는 아이에게 맞는 구명조끼를 입히고, 갑판에서 손을 놓지 마세요',
        lead: '수상 레저는 익사 위험이 큽니다. 아이 체중·체형에 맞는 공인 구명조끼를 입히고, 팔 튜브로 대체하지 마세요. 날씨·파도·음주 운항을 피하고, 갑판에서 뛰어다니지 않게 하세요. 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '체중 맞는 구명조끼, 잠금 확인, 플로티 대체 금지'],
            ['감시', '팔 닿는 거리, 난간, 승하선 시 손잡기']
        ],
        blocks: [
            ['지금 할 일', '출항 전 구명조끼 착용을 고정 루틴으로 만드세요.'],
            ['하지 않을 일', '조끼 없이 “잠깐만” 갑판에 두지 마세요.'],
            ['관련', '구명조끼·플로티·익사 예방 안내를 참고하세요.']
        ],
        links: [
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'inflatable-tube-not-lifejacket-boundary',
        match: /(튜브만\s*수영|수영\s*튜브만|inflatable\s*tube\s*child|보행\s*튜브|물놀이\s*튜브만|튜브만\s*의지)/,
        title: '공기 튜브는 구명조끼가 아니며, 깊은 물에서는 승인 구명조끼와 감독이 필요합니다',
        lead: '튜브는 뒤집히거나 공기가 빠질 수 있습니다. 물놀이는 팔 닿는 거리에서 보세요.',
        points: [
            ['장비', '구명조끼(필요 시)'],
            ['감독', '팔 닿는 거리']
        ],
        blocks: [
            ['지금 할 일', '보트·깊은 물에서는 구명조끼를 검토하세요.'],
            ['하지 않을 일', '튜브만 믿고 멀리 보내지 마세요.'],
            ['관련', '구명조끼·물 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'kayak-life-jacket-child-boundary',
        match: /(카약\s*구명조끼|카누\s*조끼\s*아이|kayak\s*life\s*jacket\s*child|보트\s*조끼\s*어린이)/,
        title: '카약·보트에서는 승인 구명조끼를 맞고 착용하고, 튜브만 의지하지 마세요',
        lead: '사이즈가 큰 조끼는 빠져 위험합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['착용', '맞는 사이즈, 잠금'],
            ['감독', '성인 동행']
        ],
        blocks: [
            ['지금 할 일', '조끼 끈을 조이세요.'],
            ['하지 않을 일', '조끼 없이 깊은 물에 나가지 마세요.'],
            ['관련', '구명조끼·보트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'stream-valley-lifejacket-boundary',
        match: /(계곡\s*물놀이\s*조끼|계곡\s*물놀이\s*조끼|계곡\s*구명조끼|stream\s*life\s*jacket\s*child)/,
        title: '계곡·급류 가능 구간에서는 구명조끼와 성인 동반을 검토하고, 비를 본 뒤 수위를 보세요',
        lead: '튜브만 의지하지 마세요.',
        points: [
            ['장비', '조끼, 신발'],
            ['금지', '단독, 깊은 웅덩이']
        ],
        blocks: [
            ['지금 할 일', '기상·수위를 확인하세요.'],
            ['하지 않을 일', '급류에 들어가지 마세요.'],
            ['관련', '물 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'life-jacket-water',
        match: /(구명\s*조끼|라이프\s*재킷|구명조끼|life\s*jacket|튜브만|암\s*밴드\s*수영)/,
        title: '물놀이에서는 연령·체중에 맞는 구명조끼와 보호자 감시가 함께입니다',
        lead: '튜브·암밴드만 믿고 감독을 줄이지 마세요. 체중·연령에 맞는 구명조끼를 바르게 입고, 팔이 닿는 거리에서 지켜봅니다. 영아는 얕은 물·욕조에서도 위험이 있습니다. 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '체중 표시 확인, 바른 착용, 보조일 뿐'],
            ['감시', '팔 닿는 거리, 음주 감독 금지']
        ],
        blocks: [
            ['지금 할 일', '물놀이 전 조끼 체중 라벨을 확인하세요.'],
            ['하지 않을 일', '튜브만 채운 채 자리를 비우지 마세요.'],
            ['관련', '익사 예방·목욕 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['익사 예방 안내', '#home']
        ]
    },
    {
        id: 'face-in-water-infant-boundary',
        match: /(아기\s*얼굴\s*물|영아\s*수영\s*잠수|face\s*in\s*water|아기\s*물\s*속\s*숨|물에\s*얼굴\s*담)/,
        title: '영아에게 강제로 얼굴을 물속에 넣거나 잠수 훈련을 강요하지 마세요',
        lead: '물 적응은 부드럽게 진행하세요. 익사 예방은 감독·장벽이 핵심입니다. 강습 업체 순위는 하지 않습니다.',
        points: [
            ['원칙', '강제 금지, 즐거움'],
            ['안전', '감독, 얕은 물']
        ],
        blocks: [
            ['지금 할 일', '아이 신호를 보고 멈추세요.'],
            ['하지 않을 일', '울어도 머리를 눌러 담그지 마세요.'],
            ['관련', '수영 강습·물 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'swimming-lesson-age-boundary',
        match: /(수영\s*강습|수영\s*수업|아기\s*수영|몇\s*살\s*수영|수영\s*배우기|swim\s*lesson)/,
        title: '수영 강습은 도움이 될 수 있어도 “몇 살 합격선”이나 익사 면제권은 아닙니다',
        lead: '연령에 맞는 물 적응·강습이 있을 수 있으나, 강습만으로 익사가 예방되지는 않습니다. 보호자 감시와 구명 장비·울타리가 우선입니다. 모든 아기가 같은 시작 나이는 없습니다. 학원 광고 순위는 하지 않습니다.',
        points: [
            ['우선', '팔 닿는 감시, 구명조끼·울타리, 욕조 혼자 금지'],
            ['강습', '강제 잠수·공포 유발 방식 주의']
        ],
        blocks: [
            ['지금 할 일', '물놀이 전 감시 역할을 정하세요.'],
            ['하지 않을 일', '“강습 끝났으니 괜찮다”며 자리를 비우지 마세요.'],
            ['관련', '익사 예방·구명조끼 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수영 강습', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Swim-Lessons.aspx'],
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['익사 예방 안내', '#home']
        ]
    },
    {
        id: 'bath-seat-danger',
        match: /(목욕\s*의자|욕조\s*시트|배스\s*시트|bath\s*seat|목욕\s*링|아기\s*목욕\s*의자)/,
        title: '목욕 의자·욕조 시트는 익사 예방 장비가 아니며, 아이를 혼자 두지 마세요',
        lead: '목욕용 의자·흡착 시트는 넘어지거나 빠져 익사 사고가 날 수 있어 안전장치로 보지 않습니다. 물은 얕아도 위험하고, 벨이 울려도 자리를 비우지 마세요. 특정 제품 추천은 하지 않습니다.',
        points: [
            ['원칙', '팔 닿는 거리 감독, 물 받기 전 준비물 챙기기'],
            ['금지', '목욕 의자에만 맡기고 자리 비우기']
        ],
        blocks: [
            ['지금 할 일', '목욕 중 휴대폰·초인종에 자리를 비우는 습관을 끊으세요.'],
            ['하지 않을 일', '흡착 시트가 붙었다고 안심하지 마세요.'],
            ['관련', '익사 예방·신생아 목욕 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 목욕 의자 위험', 'https://www.cpsc.gov/'],
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'hot-tub-spa-infant-boundary',
        match: /(온탕|스파\s*아기|hot\s*tub|자쿠지\s*아기|온수\s*풀\s*아기|스파\s*욕조)/,
        title: '영·유아를 뜨거운 온탕·스파에 넣지 말고, 물가에서는 팔 닿는 감시를 하세요',
        lead: '온탕·스파는 수온이 높아 과열·탈수 위험이 있고, 익사 위험도 있습니다. 영아는 일반적으로 권장되지 않으며, 나이·건강 상태에 따라 의료진 안내를 따르세요. 성인 혼자 감시 없이 두지 마세요. 시설 추천은 하지 않습니다.',
        points: [
            ['위험', '과열, 익사, 미끄러움, 흡입·흡인'],
            ['원칙', '팔 닿는 거리, 수온·시간, 혼자 금지']
        ],
        blocks: [
            ['지금 할 일', '온탕 커버·잠금이 아이 손 닿지 않게 확인하세요.'],
            ['하지 않을 일', '아기를 성인 무릎에만 맡긴 채 긴 시간 담그지 마세요.'],
            ['관련', '익사 예방·열 질환 안내를 참고하세요.']
        ],
        links: [
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'pool-door-alarm-boundary',
        match: /(풀장\s*문\s*알람|수영장\s*출입\s*경보|pool\s*door\s*alarm|마당\s*풀\s*문|수영장\s*게이트\s*잠금)/,
        title: '가정 수영장은 울타리·스스로 닫히는 문·경보 등 여러 겹 안전장치를 검토하세요',
        lead: '한 가지 장치만으로 부족할 수 있습니다. 성인 감독이 기본입니다. 제품 순위는 하지 않습니다.',
        points: [
            ['계층', '울타리, 문, 경보'],
            ['감독', '물놀이 시 집중']
        ],
        blocks: [
            ['지금 할 일', '풀장 출입문을 항상 잠그세요.'],
            ['하지 않을 일', '장난감이 물에 떠 있게 두지 마세요.'],
            ['관련', '풀 울타리·물 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'pool-fence-barrier-boundary',
        match: /(수영장\s*울타리|풀\s*펜스|pool\s*fence|수영장\s*담장|풀장\s*안전\s*문|수영장\s*잠금)/,
        title: '집 수영장은 사면 울타리·자동 잠금 문 등 다중 장벽과 감시를 함께 쓰세요',
        lead: '집·마당 수영장은 어린이 익사 위험이 큽니다. 울타리·문은 아이를 물에서 분리하는 장벽이고, 알람·커버만으로 감시를 대체하지 마세요. 문·게이트는 자동으로 닫히고 잠기는지 확인합니다. 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['장벽', '사면 울타리, 문이 집 쪽으로 열리지 않게, 자동 잠금'],
            ['감시', '물놀이 중 팔 닿는 거리, 장난감 물 위 방치 금지']
        ],
        blocks: [
            ['지금 할 일', '게이트가 혼자 닫히고 잠기는지 시험하세요.'],
            ['하지 않을 일', '울타리만 믿고 아이를 마당에 혼자 두지 마세요.'],
            ['관련', '익사 예방·구명조끼·플로티 안내를 참고하세요.']
        ],
        links: [
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['CPSC 수영장 안전', 'https://www.cpsc.gov/'],
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'green-pool-algae-boundary',
        match: /(초록\s*수영장|녹조\s*풀|green\s*pool|수영장\s*이끼|탁한\s*수영장\s*물|수영장\s*물\s*더러)/,
        title: '탁하고 초록빛 수영장 물은 시야·위생이 나쁠 수 있어 입수를 미루세요',
        lead: '물이 탁하면 익수자를 보기 어렵고, 관리되지 않은 물은 자극·감염 위험이 커질 수 있습니다. 가정 풀은 소독·여과 상태를 확인하고, 공공 시설은 안내를 따르세요. 약품 브랜드 추천은 하지 않습니다.',
        points: [
            ['판단', '바닥이 보이는지, 냄새·자극, 관리 기록'],
            ['행동', '입수 보류, 관리 후 재확인']
        ],
        blocks: [
            ['지금 할 일', '물이 맑아질 때까지 아이 입수를 미루세요.'],
            ['하지 않을 일', '약품을 과량으로 섞어 “급하게” 해결하려 하지 마세요.'],
            ['관련', '수영장 약품·익사 예방 안내를 참고하세요.']
        ],
        links: [
            ['CDC 건강한 수영', 'https://www.cdc.gov/healthy-swimming/'],
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'pool-chemical-safety',
        match: /(수영장\s*염소|풀\s*화학\s*약품|pool\s*chemical|염소\s*충격|수영장\s*소독약\s*아이|염소\s*중독)/,
        title: '수영장 염소·소독 약품은 잠가 두고, 섞지 말며, 아이 손 닿지 않게 하세요',
        lead: '수영장 화학 약품은 호흡 자극·화상·중독 위험이 있습니다. 산성·염소 제품을 섞지 말고, 보관은 잠금·환기가 되는 곳에 두세요. 냄새가 강하면 입수를 미루세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['보관', '원액 잠금, 아이 격리, 혼합 금지'],
            ['노출', '눈·피부 헹구기, 호흡 이상 시 대피·진료']
        ],
        blocks: [
            ['지금 할 일', '약품 통과 계량 스푼을 아이 손이 닿지 않게 옮기세요.'],
            ['하지 않을 일', '서로 다른 소독약을 한 통에 섞지 마세요.'],
            ['관련', '익사·중독·락스 안내를 참고하세요.']
        ],
        links: [
            ['CDC 수영장 화학·건강 수영', 'https://www.cdc.gov/healthy-swimming/'],
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'kiddie-pool-wading-safety',
        match: /(유아용\s*풀|키디\s*풀|kiddie\s*pool|간이\s*수영장|베란다\s*풀|작은\s*풀장\s*아기)/,
        title: '유아용 풀도 익사 위험이 있어 물을 빼 두고, 사용 중에는 팔 닿는 감시를 하세요',
        lead: '얕아 보여도 얼굴이 잠기면 위험합니다. 사용 후 물을 비우고, 커버만 믿지 마세요. 플로티로 감독을 대체하지 않습니다. 제품 추천은 하지 않습니다.',
        points: [
            ['사용', '팔 닿는 감시, 혼자 금지, 미끄럼 주의'],
            ['후', '물 비우기, 뒤집기, 고인 물 제거']
        ],
        blocks: [
            ['지금 할 일', '놀이 후 풀 물을 완전히 비우세요.'],
            ['하지 않을 일', '고인 물을 그대로 두고 자리를 비우지 마세요.'],
            ['관련', '익사·수영장 울타리·플로티 안내를 참고하세요.']
        ],
        links: [
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'water-table-splash-pad-safety',
        match: /(워터\s*테이블|water\s*table|물놀이\s*테이블|스프래시\s*패드|splash\s*pad|물놀이터)/,
        title: '워터테이블·물놀이터에서도 미끄럼·세균·익수를 보고, 고인 물은 자주 갈아 주세요',
        lead: '서 있는 물놀이도 넘어짐·얼굴 침수가 날 수 있습니다. 물을 자주 갈고, 미끄러운 바닥을 정리하며, 설사 등 아플 때는 공용 물놀이를 피하세요. 시설 추천은 하지 않습니다.',
        points: [
            ['위생', '물 교체, 손 씻기, 아플 때 이용 자제'],
            ['안전', '감독, 미끄럼, 너무 깊은 고인 물']
        ],
        blocks: [
            ['지금 할 일', '워터테이블 물을 비우고 말리세요.'],
            ['하지 않을 일', '여러 날이 지난 물을 그대로 두지 마세요.'],
            ['관련', '익사·수영장 약품·손 씻기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 건강한 수영·물놀이', 'https://www.cdc.gov/healthy-swimming/'],
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'garden-hose-water-safety',
        match: /(호스\s*물\s*마셨|정원\s*호스\s*물|garden\s*hose\s*drink|호스\s*물\s*아기|호스로\s*얼굴)/,
        title: '정원 호스 물은 마시지 않게 하고, 강한 물줄기를 얼굴에 쏘지 마세요',
        lead: '호스에 고인 물은 더럽거나 뜨거울 수 있고, 강한 수압은 눈·귀 자극이 날 수 있습니다. 마실 물은 정수·수돗물 안내를 따르세요. 장난으로 호스를 입에 물리지 마세요.',
        points: [
            ['금지', '호스 물 마시기, 얼굴 직사 물줄기'],
            ['대안', '컵 물, 그늘, 감독']
        ],
        blocks: [
            ['지금 할 일', '호스를 사용 후 아이 손이 닿지 않게 감으세요.'],
            ['하지 않을 일', '더운 날 호스 안 물을 그냥 마시게 하지 마세요.'],
            ['관련', '물 주기·열 질환·중독 안내를 참고하세요.']
        ],
        links: [
            ['CDC 음용수·위생 개요', 'https://www.cdc.gov/healthywater/'],
            ['AAP 여름 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'slip-n-slide-safety',
        match: /(미끄럼\s*매트|슬립\s*앤\s*슬라이드|slip\s*n\s*slide|물\s*미끄럼틀\s*마당|비닐\s*미끄럼)/,
        title: '마당 물 미끄럼 매트는 충돌·척추 부상 위험이 있어 연령·감독·설치를 지키세요',
        lead: '물 미끄럼 놀이는 머리·목·척추 부상이 보고된 바 있습니다. 제품 연령·체중을 지키고, 경사·장애물을 확인하며, 어른이 미끄러지며 아이와 충돌하지 않게 하세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['설치', '평평한 곳, 돌·뿌리 제거, 설명서'],
            ['이용', '한 명씩, 머리 먼저 금지, 감독']
        ],
        blocks: [
            ['지금 할 일', '제품 최소 연령과 설치 공간을 확인하세요.'],
            ['하지 않을 일', '성인이 아이 위로 미끄러지지 마세요.'],
            ['관련', '익사·낙상·물놀이 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 물 미끄럼·놀이 안전', 'https://www.cpsc.gov/'],
            ['AAP 놀이 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'sprinkler-play-safety',
        match: /(스프링클러\s*물놀이|sprinkler\s*play|잔디\s*스프링클러\s*아이|호스\s*분수\s*놀이)/,
        title: '스프링클러 물놀이는 미끄럼·넘어짐을 보고, 고인 물·전기 선을 치우세요',
        lead: '잔디 물놀이도 미끄러져 다칠 수 있습니다. 젖은 보도블록·전선·공구를 치우고 감독하세요. 물을 마실 호스 물은 권하지 않습니다.',
        points: [
            ['안전', '평평한 잔디, 장애물 제거, 감독'],
            ['위생', '호스 물 마시기 금지']
        ],
        blocks: [
            ['지금 할 일', '놀이 구역의 돌·장난감을 치우세요.'],
            ['하지 않을 일', '전기 연장선 위에서 물놀이를 하지 마세요.'],
            ['관련', '호스 물·익사·열 질환 안내를 참고하세요.']
        ],
        links: [
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['AAP 여름 놀이 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'fountain-water-play-safety',
        match: /(분수\s*물놀이|바닥\s*분수|fountain\s*play|음악\s*분수\s*아이|광장\s*분수)/,
        title: '바닥 분수·광장 분수도 익사 위험이 있어 팔 닿는 거리에서 보고, 미끄러운 바닥을 조심하세요',
        lead: '얕아 보여도 넘어져 얼굴이 물에 잠길 수 있습니다. 뛰어다니기와 음료 컵을 멀리 두세요.',
        points: [
            ['감독', '팔 닿는 거리'],
            ['바닥', '미끄럼, 배수구']
        ],
        blocks: [
            ['지금 할 일', '아이 곁에서 직접 보세요.'],
            ['하지 않을 일', '휴대폰만 보다가 분수에서 눈을 떼지 마세요.'],
            ['관련', '물 안전·물놀이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'bath-toy-mold-boundary',
        match: /(목욕\s*장난감\s*곰팡이|고무\s*오리\s*곰팡이|bath\s*toy\s*mold|물놀이\s*장난감\s*냄새|목욕\s*완구\s*세척)/,
        title: '목욕 장난감은 물을 빼고 건조하고, 곰팡이·냄새가 나면 버리거나 교체하세요',
        lead: '내부에 물이 고이면 곰팡이가 생기기 쉽습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['관리', '물 빼기, 건조'],
            ['교체', '검은 점, 악취']
        ],
        blocks: [
            ['지금 할 일', '놀이 후 구멍을 아래로 물기를 빼세요.'],
            ['하지 않을 일', '축축한 바구니에 넣지 마세요.'],
            ['관련', '목욕·위생 안내를 참고하세요.']
        ],
        links: [
            ['CDC 위생', 'https://www.cdc.gov/hygiene/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'typhoon-power-outage-child-boundary',
        match: /(태풍\s*정전\s*아이|태풍\s*정전\s*아이|태풍\s*대비\s*아기|typhoon\s*power\s*outage)/,
        title: '태풍·정전 때는 손전등·물·약·대피 정보를 준비하고, 침수·전선을 피하세요',
        lead: '양초보다 손전등이 안전합니다. 실내 발전기를 쓰지 마세요.',
        points: [
            ['준비', '손전등, 물, 약'],
            ['금지', '침수 지역, 실내 발전기']
        ],
        blocks: [
            ['지금 할 일', '비상 연락을 정하세요.'],
            ['하지 않을 일', '쓰러진 전선에 다가가지 마세요.'],
            ['관련', '정전·화재 대피 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['Red Cross', 'https://www.redcross.org/']
        ]
    },
    {
        id: 'floodwater-child-boundary',
        match: /(침수\s*물|홍수\s*물\s*아이|flood\s*water\s*child|빗물\s*고인\s*물\s*놀이|하수\s*넘친\s*물)/,
        title: '침수·하수 섞인 물에서는 놀지 말고, 물이 빠진 뒤에도 이물질을 조심하세요',
        lead: '홍수·고인 물은 감염·급류·숨은 위험물이 있을 수 있습니다. 절대 들어가 놀지 마세요.',
        points: [
            ['금지', '침수 지역 출입·놀이'],
            ['이후', '손 씻기, 상처 진료']
        ],
        blocks: [
            ['지금 할 일', '고인 물·넘친 하수에서 아이를 멀리하세요.'],
            ['하지 않을 일', '장화 신고 물속을 걷게 두지 마세요.'],
            ['관련', '물 안전·위생 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'snorkel-child-boundary',
        match: /(스너클\s*어린이|스노클\s*아이|스노클링\s*어린이|snorkel\s*child|물안경\s*호흡관\s*아이)/,
        title: '어린이 스노클은 감독·얕은 물·맞는 장비를 전제로 하고, 혼자 깊은 물에 두지 마세요',
        lead: '장비만으로 익사를 막지 않습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['조건', '감독, 얕은 물'],
            ['금지', '단독·깊은 물']
        ],
        blocks: [
            ['지금 할 일', '팔 닿는 거리에서 보세요.'],
            ['하지 않을 일', '거친 파도에서 쓰게 두지 마세요.'],
            ['관련', '물 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'bathroom-door-closed-toddler-boundary',
        match: /(화장실\s*문\s*닫기)/,
        title: '어린 유아가 화장실에 혼자 들어가지 않게 문·잠금을 관리하세요',
        lead: '변기·욕조 익사·세제 접근 위험이 있습니다.',
        points: [
            ['관리', '문, 잠금, 감독'],
            ['위험', '물, 세제']
        ],
        blocks: [
            ['지금 할 일', '외출·요리 중에도 화장실 문을 확인하세요.'],
            ['하지 않을 일', '변기 뚜껑을 열어 두지 마세요.'],
            ['관련', '변기 잠금·물 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'rain-puddle-play-boundary',
        match: /(빗물\s*웅덩이)/,
        title: '빗물 웅덩이 놀이는 얕아도 미끄럼·오염을 보고, 얼굴이 잠기지 않게 감독하세요',
        lead: '고인 물은 오염될 수 있습니다. 침수·하수 물은 피하세요.',
        points: [
            ['감독', '팔 닿는 거리'],
            ['주의', '미끄럼, 오염']
        ],
        blocks: [
            ['지금 할 일', '뛰다 얼굴이 잠기지 않게 보세요.'],
            ['하지 않을 일', '하수 넘친 물에서 놀지 마세요.'],
            ['관련', '물 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'pool-float-toy-lure-boundary',
        match: /(풀장\s*장난감\s*유인|풀장\s*장난감\s*유인|물에\s*뜬\s*장난감\s*아이|pool\s*toy\s*lure\s*drown)/,
        title: '풀장에 장난감을 띄워 두면 아이가 혼자 들어가려 할 수 있어 치우세요',
        lead: '성인 감독이 기본입니다.',
        points: [
            ['조치', '장난감 치우기, 울타리'],
            ['감독', '팔 닿는 거리']
        ],
        blocks: [
            ['지금 할 일', '사용 후 장난감을 건지세요.'],
            ['하지 않을 일', '장난감만 믿고 자리를 비우지 마세요.'],
            ['관련', '물 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사', 'https://www.cdc.gov/drowning/prevention/index.html']
        ]
    },
    {
        id: 'water-drowning-safety',
        match: /(익사|물에\s*빠|욕조.*혼자|목욕.*자리\s*비|물놀이\s*안전|수영장\s*아기|튜브만\s*믿)/,
        title: '목욕·물놀이는 팔 뻗으면 닿는 거리에서, 잠깐도 혼자 두지 마세요',
        lead: '영아는 얕은 물·욕조에서도 익사 위험이 있습니다. 목욕 중 전화·문 때문에 자리를 비우지 말고, 물놀이에서도 보호자가 팔이 닿는 거리에서 지켜보세요. 튜브·암밴드만 믿고 감독을 줄이지 마세요. 특정 수영 용품 브랜드 추천은 하지 않습니다.',
        points: [
            ['목욕', '물 받기 전 준비 끝, 한 손·시선 유지, 끝낸 뒤 물 빼기'],
            ['야외', '보호자 감시, 구명장비는 보조일 뿐']
        ],
        blocks: [
            ['지금 할 일', '욕조 물을 받아 둔 채 두지 않는지 점검하세요.'],
            ['하지 않을 일', '“형아가 봐”에 맡기거나 기기만 보고 있지 마세요.'],
            ['응급', '물에 빠진 뒤 기침·처짐·호흡 이상이 있으면 119·진료']
        ],
        links: [
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx'],
            ['CDC 익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['신생아 목욕 안내', '#home']
        ]
    },
    {
        id: 'fridge-magnet-low-boundary',
        match: /(냉장고\s*자석\s*낮|fridge\s*magnet\s*low|자석\s*낮춤|냉장고\s*자석\s*낮은\s*곳)/,
        title: '작은 냉장고 자석은 아이 손이 닿지 않게 높이 두거나 치우세요',
        lead: '여러 개 삼키면 위험합니다.',
        points: [
            ['배치', '높은 곳'],
            ['응급', '삼킴']
        ],
        blocks: [
            ['지금 할 일', '낮은 자석을 치우세요.'],
            ['하지 않을 일', '자석을 코·귀에 넣게 두지 마세요.'],
            ['관련', '자석·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'fridge-magnet-choking-boundary',
        match: /(냉장고\s*자석|fridge\s*magnet|자석\s*글자\s*장난감|마그네틱\s*알파벳|냉장고\s*자석\s*삼킴)/,
        title: '작은 냉장고 자석·자석 글자는 삼키면 위험할 수 있어 어린 아이 손에 두지 마세요',
        lead: '작고 강한 자석은 여러 개 삼키면 장에 붙을 수 있습니다. 냉장고 자석 글자·장식도 분리되면 위험합니다. 삼킴 의심 시 응급실을 우선하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '작은 자석 치우기, 깨진 세트 폐기'],
            ['응급', '삼킴·복통·구토 시 즉시 진료']
        ],
        blocks: [
            ['지금 할 일', '아이 손이 닿는 높이의 자석을 치우세요.'],
            ['하지 않을 일', '자석 장난감을 영아 놀이 공간에 두지 마세요.'],
            ['관련', '강력 자석·질식 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 자석 안전', 'https://www.cpsc.gov/'],
            ['AAP 이물질 삼킴 개요', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/default.aspx']
        ]
    },
    {
        id: 'magnet-toy-ingestion-boundary',
        match: /(자석\s*장난감\s*삼킴|네오디뮴\s*자석\s*먹|magnet\s*toy\s*ingest|자석\s*구슬\s*삼킴|강한\s*자석\s*완구\s*삼킴)/,
        title: '작은 고자석 장난감은 삼키면 장 손상이 날 수 있어 어린 아이 손에 두지 마세요',
        lead: '여러 개 삼킴은 특히 위험합니다. 의심 시 즉시 진료하세요.',
        points: [
            ['예방', '연령 부적합 치우기'],
            ['응급', '삼킴 의심']
        ],
        blocks: [
            ['지금 할 일', '고자석 세트는 아이 방에서 치우세요.'],
            ['하지 않을 일', '배가 아프다고 기다리기만 하지 마세요.'],
            ['관련', '자석 삼킴 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'magnet-ingestion-danger',
        match: /(자석\s*삼킴|네오디뮴\s*자석|강력\s*자석|매그넷\s*볼|버키볼|자석\s*장난감\s*삼킴|high\s*powered\s*magnet|magnet\s*ingest)/,
        title: '작은 강력 자석을 삼키면 장이 막히거나 뚫릴 수 있어 응급으로 봅니다',
        lead: '여러 개의 작은 자석(또는 자석과 금속)을 삼키면 장벽 사이에서 달라붙어 괴사·천공 위험이 있습니다. 호흡·침 흘림·복통·구토가 있으면 바로 응급실로 가고, 임의로 토하게 하거나 기다리지 마세요. 자석 장난감은 어린 아이 손에 두지 않습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['위험', '여러 개 자석, 자석+금속, 복통·구토·처짐'],
            ['대응', '삼킨 시각·개수 기록, 응급실·영상 검사 여부 의료진 판단']
        ],
        blocks: [
            ['지금 할 일', '자석 세트·분리된 작은 자석을 아이 손 닿지 않게 치우세요.'],
            ['하지 않을 일', '“한 개만 삼킨 것 같다”며 민간으로 기다리게 두지 마세요. 개수를 확신하기 어렵습니다.'],
            ['관련', '동전·버튼 전지 삼킴 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 자석 안전', 'https://www.cpsc.gov/'],
            ['AAP 이물질 삼킴 개요', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/default.aspx'],
            ['CDC 중독·응급 개요', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'coin-swallow-boundary',
        match: /(동전\s*삼|동전\s*먹|coin\s*swallow|동전\s*삼킴|백원\s*삼|동전\s*삼켰)/,
        title: '동전을 삼켰으면 호흡·침 흘림을 보고, 임의로 빼내려 하지 마세요',
        lead: '동전 등 이물질을 삼킨 뒤 숨이 차고 침을 못 삼키면 응급입니다. 토하게 하거나 손가락으로 목 안을 후비지 마세요. 삼킨 시각·종류를 기록하고 응급실·의료 안내를 따릅니다. 단추전지와 구분해, 전지 의심이면 전지 응급 안내를 우선합니다.',
        points: [
            ['응급', '호흡 곤란, 침 과다, 통증, 청색증'],
            ['행동', '토하게 금지, 물·음식 억지 금지, 바로 의료']
        ],
        blocks: [
            ['지금 할 일', '무엇을 언제 삼켰는지 적고 진료 경로로 가세요.'],
            ['하지 않을 일', '하임리히를 영상만 보고 임의 시행하지 마세요(교육 받은 경우·응급 지침 따름).'],
            ['관련', '단추전지·질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 이물질 삼킴 개요', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/default.aspx'],
            ['CDC 질식 위험', 'https://www.cdc.gov/infant-toddler-nutrition/foods-and-drinks/choking-hazards.html'],
            ['단추전지 안내', '#home']
        ]
    },
    {
        id: 'remote-battery-compartment-boundary',
        match: /(리모컨\s*배터리|티비\s*리모컨\s*뚜껑|remote\s*battery\s*child|리모콘\s*건전지\s*빠|장난감\s*배터리\s*뚜껑)/,
        title: '리모컨·장난감 배터리 뚜껑이 헐거우면 테이프로 보강하고 삼킴을 막으세요',
        lead: '단추 배터리는 응급입니다. 삼킴 의심 시 즉시 응급실로 가세요.',
        points: [
            ['예방', '뚜껑 고정, 여분 보관'],
            ['응급', '삼킴 의심']
        ],
        blocks: [
            ['지금 할 일', '헐거운 뚜껑을 즉시 조치하세요.'],
            ['하지 않을 일', '배터리를 그릇에 열어 두지 마세요.'],
            ['관련', '단추 배터리 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'musical-card-battery-boundary',
        match: /(노래하는\s*카드\s*배터리|뮤지컬\s*카드\s*건전지|musical\s*card\s*battery|초대장\s*배터리\s*아이|사운드\s*카드\s*전지)/,
        title: '노래하는 카드·장난감 속 단추 배터리를 분해하지 못하게 하고, 삼킴 시 즉시 응급실로 가세요',
        lead: '작은 배터리는 응급입니다.',
        points: [
            ['예방', '분해 금지, 보관'],
            ['응급', '삼킴 의심']
        ],
        blocks: [
            ['지금 할 일', '배터리가 보이는 제품은 치우세요.'],
            ['하지 않을 일', '삼킴 의심 시 지체하지 마세요.'],
            ['관련', '단추 배터리 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'car-key-fob-battery-boundary',
        match: /(자동차\s*키\s*배터리|자동차\s*키\s*배터리|스마트키\s*건전지\s*아이|car\s*key\s*fob\s*battery)/,
        title: '자동차 키·리모컨 배터리를 분해하지 못하게 하고 삼킴 시 즉시 응급실로 가세요',
        lead: '단추 배터리는 응급입니다.',
        points: [
            ['예방', '분해 금지'],
            ['응급', '삼킴']
        ],
        blocks: [
            ['지금 할 일', '헐거운 키를 치우세요.'],
            ['하지 않을 일', '삼킴 의심 시 지체하지 마세요.'],
            ['관련', '단추 배터리 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'button-battery-danger',
        match: /(단추\s*전지|버튼\s*배터리|수은\s*전지|코인\s*전지|자석\s*장난감|네오디뮴\s*자석|삼킨\s*전지|전지\s*삼)/,
        title: '단추전지·강한 자석은 삼키면 응급입니다. 장난감·리모컨을 잠그세요',
        lead: '단추전지(코인 전지)를 삼키면 식도에서 수 시간 안에 심각한 조직 손상이 날 수 있습니다. 강한 자석 여러 개를 삼키면 장 압박 괴사 위험이 있습니다. 의심되면 집에서 경과를 보지 말고 즉시 응급실·독극물 상담 체계를 이용하세요. 리모컨·장난감 전지 덮개를 고정하세요.',
        points: [
            ['예방', '전지 덮개 나사 고정, 여분 전지 아이 손 밖, 작은 자석 분리 보관'],
            ['의심 시', '즉시 의료기관, 토하게 하려 손가락을 넣지 않기']
        ],
        blocks: [
            ['지금 할 일', '집 안 리모컨·저울·장난감 전지 덮개를 점검하세요.'],
            ['하지 않을 일', '“두고 보자”며 기다리지 마세요.'],
            ['관련', '작은 물건 질식·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 단추전지', 'https://www.cdc.gov/battery-safety/'],
            ['AAP 이물질 삼킴', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Button-Battery-Injuries-in-Children.aspx'],
            ['집 안 안전', '#home']
        ]
    },
    {
        id: 'tick-removal-boundary',
        match: /(진드기\s*제거|진드기\s*뽑|진드기\s*물|풀숲\s*진드기|참진드기|tick\s*remov)/,
        title: '진드기는 무리하게 짜지 말고, 핀셋으로 가까이 집어 천천히 빼는 안내를 따릅니다',
        lead: '풀숲·산 활동 뒤 피부에 진드기가 붙을 수 있습니다. 불·기름·손으로 비틀어 짜지 마세요. 깨끗 한 핀셋으로 피부 가까이 집어 천천히 위로 빼는 방식이 흔히 안내됩니다. 열·발진·처짐이 있으면 진료하세요. 기피제 브랜드·농도 순위는 하지 않습니다.',
        points: [
            ['제거', '피부 가까이 집기, 천천히, 남은 부위 관찰'],
            ['이후', '씻기, 날짜 기록, 이상 증상 시 진료']
        ],
        blocks: [
            ['지금 할 일', '산에서 돌아온 뒤 머리·겨드랑·사타구니를 살펴보세요.'],
            ['하지 않을 일', '성냥불·석유로 떼려 하지 마세요.'],
            ['관련', '벌레 물림·발진 안내를 참고하세요.']
        ],
        links: [
            ['CDC 진드기 제거', 'https://www.cdc.gov/ticks/removal/'],
            ['CDC 진드기', 'https://www.cdc.gov/ticks/'],
            ['벌레 물림 안내', '#home']
        ]
    },
    {
        id: 'repellent-on-clothing-boundary',
        match: /(기피제\s*옷|모기\s*스프레이\s*옷|repellent\s*clothing|의류\s*기피제\s*아이|모기채\s*스프레이\s*옷)/,
        title: '기피제는 제품 표시대로 피부·옷에 쓰고, 얼굴에 직접 뿌리지 마세요',
        lead: '연령·성분 표시를 확인하고 과량을 피하세요. 용량·제품 순위는 하지 않습니다.',
        points: [
            ['사용', '표시 준수, 손 씻기'],
            ['금지', '얼굴 직분무, 상처']
        ],
        blocks: [
            ['지금 할 일', '손에 뿌려 얼굴에 펴 바르세요.'],
            ['하지 않을 일', '실내에서 과다 분사하지 마세요.'],
            ['관련', '모기 기피제 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/mosquitoes/']
        ]
    },
    {
        id: 'tall-grass-socks-boundary',
        match: /(풀숲\s*양말|긴\s*풀\s*양말\s*넣|tall\s*grass\s*socks|풀밭\s*바지\s*양말|진드기\s*양말\s*덮)/,
        title: '풀숲 산책 때는 양말을 바지 위에 덮는 방식 등을 검토하고, 귀가 후 몸을 확인하세요',
        lead: '진드기 예방에 도움이 될 수 있습니다. 기피제 표시를 따르세요.',
        points: [
            ['복장', '긴 옷, 양말'],
            ['이후', '몸 확인']
        ],
        blocks: [
            ['지금 할 일', '귀가 후 샤워·점검을 하세요.'],
            ['하지 않을 일', '풀숲에서 눕지 않게 하세요.'],
            ['관련', '진드기 안내를 참고하세요.']
        ],
        links: [
            ['CDC', 'https://www.cdc.gov/ticks/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'insect-repellent-boundary',
        match: /(모기\s*기피|벌레\s*기피|해충\s*기피|DEET|디트|기피제\s*아기|모기\s*팔찌)/,
        title: '기피제는 연령·표시를 확인하고, 영아·얼굴·상처에는 특히 조심하세요',
        lead: '야외에서 모기·진드기 예방에 기피제가 쓰이기도 합니다. 제품 표시의 연령·사용법을 지키고, 눈·입·손·상처에 바르지 않으며 실내·수면 중 과다 사용을 피하세요. 농도·브랜드 순위·“국민템” 추천은 하지 않습니다. 모기장·긴 옷도 함께 고려합니다.',
        points: [
            ['사용', '표시 연령, 최소량, 돌아와 씻기'],
            ['보조', '긴 옷, 고인 물 제거, 모기장']
        ],
        blocks: [
            ['지금 할 일', '제품 라벨의 개월·나이 제한을 확인하세요.'],
            ['하지 않을 일', '영아 얼굴에 스프레이를 직접 뿌리지 마세요.'],
            ['관련', '벌레 물림·진드기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 모기 물림 예방', 'https://www.cdc.gov/mosquitoes/mosquito-bites/prevent-mosquito-bites.html'],
            ['EPA 기피제 찾기(영)', 'https://www.epa.gov/insect-repellents'],
            ['벌레 물림 안내', '#home']
        ]
    },
    {
        id: 'bee-sting-anaphylaxis-boundary',
        match: /(벌\s*알레르기|벌침\s*아나필|bee\s*sting|말벌\s*쇼크|벌\s*쏘.{0,12}(숨|부어|전신|두드러기|아나필)|말벌\s*쏘)/,
        title: '벌에 쏘인 뒤 전신 두드러기·호흡 곤란·처짐이 있으면 응급으로 보세요',
        lead: '국소 부기와 달리 전신 증상·호흡 이상·목소리 변화·처짐은 중증 알레르기일 수 있습니다. 침이 보이면 긁지 말고 카드로 밀고, 응급이면 119를 우선하세요. 에피펜 등 처방·용량은 의료진이 정합니다. 사진 진단·브랜드 추천은 하지 않습니다.',
        points: [
            ['응급', '호흡 곤란, 입술·혀 부종, 전신 두드러기, 구토·처짐'],
            ['국소', '냉찜질, 더러워지지 않게, 커지면 진료']
        ],
        blocks: [
            ['지금 할 일', '야외 활동 시 벌집 위치를 피하고 맨발 보행을 줄이세요.'],
            ['하지 않을 일', '침을 집게로 짜듯이 집지 마세요.'],
            ['관련', '벌레 물림·알레르기 즉시 반응 안내를 참고하세요.']
        ],
        links: [
            ['CDC 벌·침 쏘임', 'https://www.cdc.gov/niosh/topics/insects/'],
            ['AAP 벌 쏘임·알레르기 개요', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/default.aspx']
        ]
    },
    {
        id: 'jellyfish-sting-boundary',
        match: /(해파리\s*쏘|jellyfish|해파리\s*화상|해파리\s*독|해파리\s*물)/,
        title: '해파리에 쏘이면 남은 촉수를 조심히 제거하고, 심한 통증·호흡 이상은 진료하세요',
        lead: '해파리 쏘임은 종에 따라 다릅니다. 맨손으로 촉수를 집지 말고, 바닷물로 헹구는 등 지역·공식 응급 안내를 따르세요. 소변을 바르는 민간 요법은 권하지 않는 경우가 많습니다. 호흡 곤란·넓은 쏘임은 응급입니다. 약 용량·브랜드 추천은 하지 않습니다.',
        points: [
            ['즉시', '물에서 나오기, 촉수 제거(도구), 통증 평가'],
            ['응급', '호흡 이상, 넓은 부위, 알레르기 증상']
        ],
        blocks: [
            ['지금 할 일', '해변 깃발·주의 안내를 확인하세요.'],
            ['하지 않을 일', '맨손으로 촉수를 문지르지 마세요.'],
            ['관련', '벌 쏘임·화상·해변 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 해파리·해양 쏘임 개요', 'https://www.cdc.gov/healthy-swimming/'],
            ['AAP 야외 부상 개요', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/default.aspx']
        ]
    },
    {
        id: 'spider-bite-when-care-boundary',
        match: /(거미\s*물림|spider\s*bite\s*child|독거미\s*아이|거미에\s*물렸)/,
        title: '거미 물림이 의심되면 부위 확대·통증·전신 증상을 보고 진료를 검토하세요',
        lead: '대부분의 거미 물림은 경할 수 있으나 심한 통증·발진 확산·호흡 이상은 진료가 필요합니다. 사진만으로 종을 단정하지 않습니다.',
        points: [
            ['관찰', '통증, 부종, 확산'],
            ['진료', '전신 증상, 호흡']
        ],
        blocks: [
            ['지금 할 일', '물린 시각과 변화를 기록하세요.'],
            ['하지 않을 일', '민간 요법으로 시간을 끌지 마세요.'],
            ['관련', '벌레 물림 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'snake-encounter-boundary',
        match: /(뱀\s*물림|뱀\s*만남|snake\s*bite\s*child|독사\s*아이|뱀\s*밟)/,
        title: '뱀을 건드리지 말고, 물리면 침착히 의료 도움을 받으세요',
        lead: '독사 여부는 현장에서 단정하기 어렵습니다. 물린 부위를 안정시키고 응급 진료를 우선하세요. 민간 요법은 권하지 않습니다.',
        points: [
            ['예방', '돌·덤불 조심, 손 대지 않기'],
            ['물림', '고정, 응급 진료']
        ],
        blocks: [
            ['지금 할 일', '물렸다면 즉시 의료 도움을 요청하세요.'],
            ['하지 않을 일', '입을 대고 독을 빨아내려 하지 마세요.'],
            ['관련', '벌레 물림·응급 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'mosquito-bite-swelling-boundary',
        match: /(모기\s*물린\s*후\s*부음|모기\s*물림\s*부어|mosquito\s*bite\s*swell|모기\s*자국\s*커짐|모기\s*물려\s*가려)/,
        title: '모기 물린 부위가 부을 수 있으나, 호흡 곤란·전신 두드러기·고열이면 진료하세요',
        lead: '긁어 감염되지 않게 하세요. 약 용량은 의료진·표시를 따르세요.',
        points: [
            ['관리', '긁지 않기, 시원하게'],
            ['진료', '전신 증상']
        ],
        blocks: [
            ['지금 할 일', '손을 씻기고 긁지 않게 하세요.'],
            ['하지 않을 일', '호흡이 이상하면 지체하지 마세요.'],
            ['관련', '벌레 물림 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/mosquitoes/']
        ]
    },
    {
        id: 'tick-prevention-clothing-boundary',
        match: /(진드기\s*예방\s*옷|긴팔\s*진드기|tick\s*prevention\s*cloth|풀숲\s*긴바지\s*아이|진드기\s*기피\s*옷)/,
        title: '풀숲에서는 긴 옷·모자·기피제 표시를 검토하고, 귀가 후 몸을 확인하세요',
        lead: '진드기 매개 질환 예방에 옷차림이 도움이 됩니다. 기피제 용량·제품 순위는 하지 않습니다.',
        points: [
            ['예방', '긴 옷, 확인'],
            ['이후', '부착 진드기 제거']
        ],
        blocks: [
            ['지금 할 일', '귀가 후 피부 주름을 확인하세요.'],
            ['하지 않을 일', '진드기를 손으로 비틀어 뽑지 마세요.'],
            ['관련', '진드기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/ticks/']
        ]
    },
    {
        id: 'wasp-nest-playground-boundary',
        match: /(벌집\s*근처\s*놀이|벌집\s*근처\s*놀이|말벌\s*놀이터|wasp\s*nest\s*playground)/,
        title: '벌집·말벌이 보이면 아이를 멀리하고 건드리지 마세요',
        lead: '알레르기 병력이 있으면 더 주의하세요.',
        points: [
            ['행동', '거리, 신고'],
            ['금지', '돌 던지기']
        ],
        blocks: [
            ['지금 할 일', '조용히 물러나세요.'],
            ['하지 않을 일', '둥지를 건드리지 마세요.'],
            ['관련', '벌 쏘임 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/']
        ]
    },
    {
        id: 'mosquito-net-crib-boundary',
        match: /(여름\s*모기장|모기장\s*아기\s*침대| crib\s*mosquito\s*net|유모차\s*모기장\s*질식)/,
        title: '모기장은 헐렁하게 늘어지지 않게 고정하고, 질식·감김을 확인하세요',
        lead: '브랜드 순위는 하지 않습니다. 수면 공간 원칙을 우선하세요.',
        points: [
            ['설치', '팽팽, 고정'],
            ['주의', '늘어진 천']
        ],
        blocks: [
            ['지금 할 일', '얼굴에 천이 닿지 않게 하세요.'],
            ['하지 않을 일', '느슨한 모기장을 침대에 덮지 마세요.'],
            ['관련', '안전수면·모기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'insect-bite-boundary',
        match: /(모기\s*물|벌레\s*물|벌\s*쏘|벌침|진드기\s*물|벌레\s*물림)/,
        title: '벌레 물림은 가려움 관리와 알레르기·감염 신호를 구분합니다',
        lead: '모기 물림은 시원하게 두고 긁지 않게 돕는 것이 우선입니다. 얼굴·입술·혀가 붓거나 호흡 곤란·전신 두드러기면 응급입니다. 진드기는 무리하게 짜지 말고 의료 안내대로 제거·관찰합니다. 기피제 브랜드 순위·농도를 사이트에서 정하지 않으며, 영아 사용은 제품 표시·의료진을 따릅니다.',
        points: [
            ['가정', '시원·보습, 긁기 방지, 부은 정도 관찰'],
            ['응급', '호흡 곤란, 목·혀 부종, 어지럼, 광범위 발진, 고열·처짐']
        ],
        blocks: [
            ['지금 할 일', '물린 시각·부위·퍼짐 여부를 글로 기록하세요.'],
            ['하지 않을 일', '민간 요법으로 태우거나, 처방 없이 강한 스테로이드를 바르지 마세요.'],
            ['예방', '긴 옷·그늘, 고인 물 제거. 기피제는 연령 표시 확인']
        ],
        links: [
            ['CDC 모기 물림', 'https://www.cdc.gov/mosquitoes/mosquito-bites/'],
            ['CDC 진드기', 'https://www.cdc.gov/ticks/'],
            ['발진 경계 안내', '#home']
        ]
    },
    {
        id: 'stuttering-pressure-boundary',
        match: /(말\s*더듬\s*고치|더듬\s*천천히\s*말해|stutter\s*pressure|말더듬\s*교정|더듬을\s*때마다\s*지적|말\s*더듬\s*압박)/,
        title: '말 더듬을 지적·재촉하기보다 여유 있게 듣고, 지속되면 전문가 상담을 검토하세요',
        lead: '어린 시기에 일시적일 수 있으나 오래가거나 심해지면 평가가 필요합니다. 앱 순위는 하지 않습니다.',
        points: [
            ['태도', '경청, 서두르지 않기'],
            ['상담', '지속·악화']
        ],
        blocks: [
            ['지금 할 일', '말을 끝까지 들어 주세요.'],
            ['하지 않을 일', '다시 똑바로 말해 보라며 압박하지 마세요.'],
            ['관련', '말 더듬 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'bilingual-not-confusing-boundary',
        match: /(이중\s*언어\s*혼란|두\s*언어\s*늦게|bilingual\s*confus|영어\s*한글\s*같이|바이링궐\s*지연)/,
        title: '이중 언어 자체가 언어 지연의 원인으로 단정되지 않으며, 걱정되면 전체 발달을 상담하세요',
        lead: '환경·청력·상호작용을 함께 봅니다. 학원 순위는 하지 않습니다.',
        points: [
            ['원칙', '풍부한 대화'],
            ['상담', '전반 지연 의심']
        ],
        blocks: [
            ['지금 할 일', '두 언어로 풍부히 말해 주세요.'],
            ['하지 않을 일', '이중 언어라서 늦다며 방치하지 마세요.'],
            ['관련', '발달·언어 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'speech-delay-when-eval-boundary',
        match: /(말\s*늦음\s*걱정|말이\s*늦어|speech\s*delay\s*eval|언어\s*지연\s*검사|또래보다\s*말\s*적)/,
        title: '말 늦음이 걱정되면 한두 단어로 단정하지 말고 개월별 안내·의료진 상담을 검토하세요',
        lead: 'CDC 대표 모습은 선별용입니다. 장애 단정·앱 진단은 하지 않습니다.',
        points: [
            ['관찰', '이해, 제스처, 청력'],
            ['상담', '지속 걱정']
        ],
        blocks: [
            ['지금 할 일', '구체적 예시를 기록하세요.'],
            ['하지 않을 일', '늦게 말해도 된다며 무조건 미루지 마세요.'],
            ['관련', '발달 가이드를 참고하세요.']
        ],
        links: [
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'presentation-anxiety-child-boundary',
        match: /(발표\s*불안)/,
        title: '발표 불안에는 연습·짧은 성공 경험을 돕고, 조롱·강요를 피하세요',
        lead: '심한 회피·공황 양상이면 상담을 검토하세요. 앱 순위는 하지 않습니다.',
        points: [
            ['도움', '연습, 응원'],
            ['피하기', '공개 망신']
        ],
        blocks: [
            ['지금 할 일', '집에서 짧게 연습해 보세요.'],
            ['하지 않을 일', '발표 못 했다고 창피를 주지 마세요.'],
            ['관련', '불안·말 더듬 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'stuttering-boundary',
        match: /(말더듬|더듬|말을\s*반복|말\s*막힘|stutter)/,
        title: '말더듬·더듬는 시기는 있을 수 있고, 야단·재촉보다 경청이 먼저입니다',
        lead: '말을 배우며 음을 반복하거나 막히는 시기가 있을 수 있습니다. “천천히 해”를 반복해 다그치고 웃기거나 말끝을 가로채지 마세요. 보호자는 천천히 듣고, 눈 맞춤·여유 있는 대화를 합니다. 오래 지속되거나 몸 긴장·회피가 심하면 언어치료·의료진과 상의하세요. 이 안내만으로 장애를 진단하지 않습니다.',
        points: [
            ['가정', '끼어들지 않기, 여유 있는 말 속도, 내용에 반응'],
            ['상담', '수개월 지속, 악화, 아이 스트레스가 큼']
        ],
        blocks: [
            ['지금 할 일', '하루 중 편한 대화 시간을 짧게라도 만드세요.'],
            ['하지 않을 일', '말더듬을 흉내 내거나 벌을 주지 마세요.'],
            ['관련', '언어 발달 걱정은 개월 수 관찰·K-DST 안내도 참고하세요.']
        ],
        links: [
            ['AAP 말더듬', 'https://www.healthychildren.org/English/ages-stages/toddler/Pages/Stuttering.aspx'],
            ['발달·K-DST 가이드', 'blog/development-kdst-guide.html#milestones'],
            ['CDC 언어 발달', 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html']
        ]
    },
    {
        id: 'adenoid-when-care-boundary',
        match: /(아데노이드|adenoid|인두\s*편도|코골이\s*아데노이드|아데노이드\s*수술)/,
        title: '아데노이드 비대 의심(만성 코막힘·코골이 등)은 진료로 확인하고, 수술 여부는 의료진이 판단합니다',
        lead: '만성 구강 호흡·코골이·중이 문제 등에서 아데노이드를 평가하기도 합니다. 사진·코 소리만으로 수술 필요를 단정하지 마세요. 수면 무호흡 신호가 있으면 진료를 우선합니다.',
        points: [
            ['신호', '지속 코막힘, 코골이, 입으로만 숨, 중이염 반복'],
            ['상담', '이비인후과, 수면·성장 영향']
        ],
        blocks: [
            ['지금 할 일', '코골이·무호흡 영상을 남겨 두세요.'],
            ['하지 않을 일', '민간 코 시술·테이프로 입을 막지 마세요.'],
            ['관련', '구강 호흡·코골이·중이염 안내를 참고하세요.']
        ],
        links: [
            ['AAP 코·인후 개요', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/default.aspx'],
            ['CDC 수면 건강', 'https://www.cdc.gov/sleep/']
        ]
    },
    {
        id: 'tonsil-when-care-boundary',
        match: /(편도\s*수술|편도선\s*절제|tonsillectomy|편도\s*비대|편도가\s*커|편도\s*적출)/,
        title: '편도 수술 여부는 감염 횟수·호흡·수면 문제로 의료진이 판단합니다',
        lead: '편도 비대·반복 편도염에서 수술을 논의할 수 있으나, 모든 목 아픔에 필수는 아닙니다. 적응증·위험·회복은 담당의가 설명합니다. 사이트에서 수술 결정을 대신하지 않습니다.',
        points: [
            ['상담 계기', '잦은 편도염, 수면 무호흡 의심, 삼킴 어려움'],
            ['응급', '침 못 삼킴, 호흡 곤란, 심한 탈수']
        ],
        blocks: [
            ['지금 할 일', '목 아픈 횟수와 수면 증상을 기록하세요.'],
            ['하지 않을 일', '후기만 보고 수술을 재촉하거나 거부 단정하지 마세요.'],
            ['관련', '인후통·코골이·아데노이드 안내를 참고하세요.']
        ],
        links: [
            ['AAP 편도·인후 개요', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/default.aspx'],
            ['CDC 인후 감염 개요', 'https://www.cdc.gov/group-a-strep/']
        ]
    },
    {
        id: 'mouth-breathing-boundary',
        match: /(구강\s*호흡|입으로만\s*숨|mouth\s*breathing|항상\s*입\s*벌리고|코로\s*숨\s*못\s*쉬|입호흡)/,
        title: '낮에도 계속 입으로만 숨 쉬면 코 막힘·알레르기·편도 등을 진료로 확인하세요',
        lead: '일시적 코 막힘과 달리 만성 구강 호흡은 원인 평가가 필요할 수 있습니다. 사진만으로 턱·치아 문제를 단정하지 마세요. 수면 무호흡 신호(코골이·무호흡)가 있으면 진료를 우선합니다. 장치·교정 브랜드 추천은 하지 않습니다.',
        points: [
            ['관찰', '코 막힘, 코골이, 낮 보챔, 입 마름'],
            ['상담', '이비인후과·소아과, 알레르기·편도']
        ],
        blocks: [
            ['지금 할 일', '코로 숨 쉴 수 있는지, 잠잘 때 소리를 기록하세요.'],
            ['하지 않을 일', '입을 테이프로 막는 유행 처치를 하지 마세요.'],
            ['관련', '코골이·감기 코막힘 안내를 참고하세요.']
        ],
        links: [
            ['AAP 코·수면 호흡 개요', 'https://www.healthychildren.org/English/health-issues/conditions/ear-nose-throat/Pages/default.aspx'],
            ['CDC 수면 건강', 'https://www.cdc.gov/sleep/']
        ]
    },
    {
        id: 'snoring-sleep-breathing-boundary',
        match: /(코골\s*아이|아이\s*코골|수면\s*무호흡|잠\s*숨\s*멈|mouth\s*breathing\s*sleep|코로\s*숨\s*못|편도\s*코골)/,
        title: '아이 코골이·잠 중 숨 멈춤이 반복되면 수면 호흡 문제로 진료를 검토하세요',
        lead: '가끔 가벼운 코골이와 달리, 크게 코골며 숨을 멈추거나 헐떡이며 깨고 낮에 매우 보채는 경우 의료 평가가 필요할 수 있습니다. 진단·수술·장치 여부는 의료진이 정합니다. 코골이 “치료 베개” 브랜드 추천은 하지 않습니다.',
        points: [
            ['관찰', '무호흡, 가슴 들썩, 땀, 자세, 낮 졸림·보챔'],
            ['상담', '성장·편도·알레르기 병력과 함께 소아과·이비인후과']
        ],
        blocks: [
            ['지금 할 일', '코골이·무호흡이 들리는 짧은 영상을 남겨 두세요.'],
            ['하지 않을 일', '성인용 코골이 약을 주지 마세요.'],
            ['관련', '안전수면·감기 코막힘 안내를 참고하세요.']
        ],
        links: [
            ['AAP 소아 코골이·수면 호흡', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['CDC 수면 건강 개요', 'https://www.cdc.gov/sleep/']
        ]
    },
    {
        id: 'sleep-talking-boundary',
        match: /(자면서\s*말하|잠꼬대\s*아이|sleep\s*talking\s*child|수면\s*중\s*말|잠결에\s*대화)/,
        title: '잠꼬대는 흔할 수 있으나, 위험한 행동·심한 코골이·낮 과로가 동반되면 상담을 검토하세요',
        lead: '억지로 깨워 대화하려 하지 마세요.',
        points: [
            ['관찰', '빈도, 위험 행동'],
            ['환경', '안전수면']
        ],
        blocks: [
            ['지금 할 일', '침대 주변 위험을 치우세요.'],
            ['하지 않을 일', '잠꼬대할 때 심문하지 마세요.'],
            ['관련', '수면·야경 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'sleepwalking-boundary',
        match: /(몽유병|잠\s*걸어|수면\s*보행|sleep\s*walk|자다가\s*걸어|잠결에\s*걸어)/,
        title: '자다가 걸어 다니는 수면 보행은 안전을 먼저 보고, 잦으면 진료를 검토하세요',
        lead: '일부 아이는 잠든 상태에서 일어나 걷거나 말할 수 있습니다. 억지로 세게 흔들어 깨우기보다 다치지 않게 막고, 계단·문·창을 안전하게 하세요. 잦거나 자해·주간 증상이 있으면 의료진과 상의합니다. 수면제 용량은 정하지 않습니다.',
        points: [
            ['당시', '부드럽게 침대로 안내, 위험물 치우기'],
            ['환경', '계단 문, 창 잠금, 날카로운 물건']
        ],
        blocks: [
            ['지금 할 일', '밤에 문을 잠그고 바닥 장애물을 치우세요.'],
            ['하지 않을 일', '공포를 주며 혼내지 마세요. 기억하지 못할 수 있습니다.'],
            ['관련', '야경증·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면 문제 개요', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['CDC 수면 건강', 'https://www.cdc.gov/sleep/']
        ]
    },
    {
        id: 'nightmare-comfort-boundary',
        match: /(악몽\s*후\s*달래|가위\s*눌린\s*후|nightmare\s*comfort|무서운\s*꿈\s*후|악몽\s*깨서\s*울)/,
        title: '악몽 후에는 짧게 안심시키고 침대로 돌아가게 도우며, 낮에 공포 매체를 줄이세요',
        lead: '야경과 구분이 필요하면 진료와 상담하세요. 수면제 추천은 하지 않습니다.',
        points: [
            ['즉시', '안심, 짧은 설명'],
            ['낮', '공포 영상 줄이기']
        ],
        blocks: [
            ['지금 할 일', '곁에서 차분히 말해 주세요.'],
            ['하지 않을 일', '긴 놀이를 시작해 밤을 깨우지 마세요.'],
            ['관련', '악몽·야경 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx']
        ]
    },
    {
        id: 'nightmare-boundary',
        match: /(악몽|무서운\s*꿈|nightmare|꿈\s*꿔서\s*울|자다가\s*무서워\s*깨)/,
        title: '악몽 뒤에는 안심시키고, 낮 스트레스·미디어를 점검하세요. 수면제는 임의로 주지 마세요',
        lead: '악몽은 잠에서 깨어 내용을 기억하며 위로를 구하는 경우가 많습니다. 야경증과 다를 수 있습니다. 잠들기 전 무서운 영상·이야기를 줄이고, 일정한 취침 루틴이 도움이 될 수 있습니다. 잦고 낮 생활이 힘들면 상담하세요. 수면제 용량은 정하지 않습니다.',
        points: [
            ['대응', '부드럽게 안심, 불 밝히기, 다시 재우기'],
            ['환경', '취침 전 스크린, 갈등·스트레스, 발열·통증']
        ],
        blocks: [
            ['지금 할 일', '잠들기 1시간 전 영상·자극 게임을 줄여 보세요.'],
            ['하지 않을 일', '혼내거나 무시하며 “허상”이라고만 몰아붙이지 마세요.'],
            ['관련', '야경증·수면 보행·수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면·악몽 개요', 'https://www.healthychildren.org/English/ages-stages/preschool/Pages/default.aspx'],
            ['CDC 수면 건강', 'https://www.cdc.gov/sleep/']
        ]
    },
    {
        id: 'self-rocking-soothe-boundary',
        match: /(앞뒤\s*흔들|자기\s*로킹|body\s*rocking|몸을\s*앞뒤로\s*흔들|리듬\s*흔들\s*잠)/,
        title: '잠들며 몸을 리듬 있게 흔드는 행동은 흔할 수 있으나, 자해·낮 기능 저하가 있으면 상담하세요',
        lead: '일부 아이는 수면 전 몸을 흔들며 진정합니다. 환경을 안전하게 하고 낮에도 심하거나 부상이 있으면 진료를 검토하세요.',
        points: [
            ['환경', '모서리 보호, 침대 안전'],
            ['상담', '부상, 낮 반복, 발달 걱정']
        ],
        blocks: [
            ['지금 할 일', '침대 주변 딱딱한 물건을 치우세요.'],
            ['하지 않을 일', '몸을 잡고 세게 제지하지 마세요.'],
            ['관련', '머리 박기·수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'head-banging-boundary',
        match: /(머리\s*박기|헤드\s*뱅잉|head\s*bang|머리를\s*바닥에\s*쿵|리듬\s*머리\s*박)/,
        title: '잠들 때 머리 박기는 흔할 수 있으나, 낮 손상·발달 걱정이 있으면 진료를 검토하세요',
        lead: '일부 유아는 잠들며 리듬 있게 머리를 박기도 합니다. 환경을 부드럽게 하고 다치지 않게 지키세요. 낮에도 심하거나, 발달 퇴행·경련·부상이 있으면 의료진과 상의합니다. 억제·처벌로 단정 짓지 마세요.',
        points: [
            ['환경', '침대 안전, 날카로운 모서리 제거'],
            ['상담', '낮 증상, 자해성, 발달 걱정, 부상']
        ],
        blocks: [
            ['지금 할 일', '침대 주변 딱딱한 물건을 치우세요.'],
            ['하지 않을 일', '머리를 잡고 흔들며 멈추게 강요하지 마세요.'],
            ['관련', '야경증·안전수면·발달 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면 행동 개요', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'monster-under-bed-fear-boundary',
        match: /(침대\s*밑\s*괴물|악어\s*침대\s*밑|monster\s*under\s*bed|무서운\s*존재\s*방|방에\s*괴물)/,
        title: '방에 대한 공포에는 가볍게 확인·루틴·은은한 수면등으로 돕고, 조롱하지 마세요',
        lead: '공포가 일상을 지배하면 상담을 검토하세요. 제품 순위는 하지 않습니다.',
        points: [
            ['도움', '함께 확인, 루틴'],
            ['피하기', '조롱, 무서운 이야기']
        ],
        blocks: [
            ['지금 할 일', '함께 침대 밑을 확인해 주세요.'],
            ['하지 않을 일', '겁준다고 놀리지 마세요.'],
            ['관련', '어둠 공포 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx'],
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx']
        ]
    },
    {
        id: 'fear-of-dark-boundary',
        match: /(어둠\s*무서|어둠을\s*무서|fear\s*of\s*dark|밤에\s*불\s*켜|괴물\s*무서|어둠\s*공포)/,
        title: '어둠 공포는 흔한 발달 과정일 수 있으며, 안심·일정한 취침 루틴이 도움이 됩니다',
        lead: '유아기 어둠·분리 공포는 흔할 수 있습니다. 조롱하지 말고, 작은 밤조명·취침 루틴·짧게 안심시키기를 시도해 보세요. 낮 불안이 심하거나 일상 방해가 크면 상담을 검토합니다. 수면제 용량은 정하지 않습니다.',
        points: [
            ['대응', '공감, 짧은 확인, 예측 가능한 취침'],
            ['환경', '약한 밤조명, 안전 확인']
        ],
        blocks: [
            ['지금 할 일', '잠들기 전 루틴을 같은 순서로 해보세요.'],
            ['하지 않을 일', '무서운 이야기·영상으로 겁주지 마세요.'],
            ['관련', '악몽·야경증·분리불안 안내를 참고하세요.']
        ],
        links: [
            ['AAP 공포·불안 개요', 'https://www.healthychildren.org/English/healthy-living/emotional-wellness/Pages/default.aspx'],
            ['수면 안내', '#home']
        ]
    },
    {
        id: 'night-terror-boundary',
        match: /(야경증|밤공포|자다가\s*비명|자다가\s*소리\s*지|나이트\s*테러|night\s*terror|야경)/,
        title: '야경증은 악몽과 다를 수 있고, 억지로 깨우기보다 안전을 봅니다',
        lead: '자다가 갑자기 울고 공포를 보이는 일은 일부 아이에게 있습니다. 악몽과 달리 다음날 기억하지 못하는 경우도 있습니다. 억지로 깨워 설명하기보다 부딪히지 않게 지키고, 에피소드가 지나면 다시 재웁니다. 잦거나, 낮 증상·경련·호흡 이상이 겹치면 진료하세요. 수면제 용량은 정하지 않습니다.',
        points: [
            ['대응', '안전 확보, 차분히 곁에, 무리한 각성·설명 금지'],
            ['진료', '매우 잦음, 낮 행동 변화, 경련 의심, 수면무호흡 의심']
        ],
        blocks: [
            ['지금 할 일', '시작 시각·지속·전후 열·코골이를 기록하세요.'],
            ['하지 않을 일', '소리 지른다고 혼내거나 영상으로 재우지 마세요.'],
            ['관련', '안전수면·수면교육 경계를 참고하세요.']
        ],
        links: [
            ['AAP 수면 문제', 'https://www.healthychildren.org/English/ages-stages/preschool/Pages/Nightmares-and-Night-Terrors.aspx'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'camphor-menthol-rub-infant',
        match: /(캠퍼|멘톨\s*연고|가슴\s*문지|기침\s*연고|비ックス|Vicks|캠포\s*로션|아로마\s*연고\s*아기)/,
        title: '영아에게 캠퍼·멘톨 계열 가슴 연고를 함부로 바르지 마세요',
        lead: '일부 기침·코막힘 연고에는 캠퍼·멘톨이 들어 있어 어린 아이에게 자극·중독 위험이 거론됩니다. 영아 얼굴·코 밑에 바르거나 코에 넣는 민간 요법을 피하세요. 필요 시 의료진·약사와 연령 적합 여부를 확인합니다. 브랜드 추천·용량은 하지 않습니다.',
        points: [
            ['경계', '영아 코 밑·가슴 도포, 먹이기, 밀폐 흡입'],
            ['우선', '수분·코 세척 안내, 호흡·발열 관찰, 진료']
        ],
        blocks: [
            ['지금 할 일', '집에 있는 연고 성분표를 확인하세요.'],
            ['하지 않을 일', '성인 기침 연고를 아기 발바닥에 바르는 민간 요법을 따라 하지 마세요.'],
            ['관련', '감기약·에센셜 오일 경계를 참고하세요.']
        ],
        links: [
            ['AAP 캠퍼 중독 주의', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Camphor-Products-Dangerous-for-Children.aspx'],
            ['CDC 감기 돌보기', 'https://www.cdc.gov/antibiotic-use/colds.html']
        ]
    },
    {
        id: 'aspirin-reye-boundary',
        match: /(아스피린|aspirin|아세틸살리실|라이\s*증후군|Reye|어린이\s*아스피린|해열.*아스피린)/,
        title: '발열·바이러스 의심 때 어린이에게 아스피린을 임의로 주지 마세요',
        lead: '일부 바이러스 감염 중 아스피린(살리실산) 사용은 라이 증후군과 관련해 어린이에게 권고되지 않는 경우가 많습니다. 해열·진통이 필요하면 의료진이 연령에 맞는 성분을 정합니다. 용량·브랜드를 사이트·댓글로 정하지 않습니다.',
        points: [
            ['피하기', '감기·발열 때 아스피린·살리실산 함유 약 임의 사용'],
            ['진료', '해열이 필요하거나 기존 처방 약이 있으면 의료진·약사 확인']
        ],
        blocks: [
            ['지금 할 일', '집에 있는 해열·진통 약 성분명(아세트아미노펜 등)을 확인하세요.'],
            ['하지 않을 일', '성인 아스피린을 쪼개 주지 마세요.'],
            ['관련', '발열·영아 감기약 경계를 참고하세요.']
        ],
        links: [
            ['CDC 라이 증후군·아스피린', 'https://www.cdc.gov/reye-syndrome/'],
            ['AAP 해열·약 일반', 'https://www.healthychildren.org/English/health-issues/conditions/fever/Pages/default.aspx'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'otc-cold-med-young-child-boundary',
        match: /(감기약\s*시판\s*아이|시판\s*감기약\s*아이|어린이\s*종합\s*감기약|otc\s*cold\s*medicine\s*child)/,
        title: '어린 아이에게 시판 종합 감기약은 의료진 없이 주지 않는 안내가 많습니다',
        lead: '연령 제한을 읽고, 용량을 여기서 정하지 않습니다.',
        points: [
            ['원칙', '의료진 상담'],
            ['금지', '성인약 소량']
        ],
        blocks: [
            ['지금 할 일', '표시 연령을 확인하세요.'],
            ['하지 않을 일', '성인 약을 나눠 주지 마세요.'],
            ['관련', '감기약 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['열·감기 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'cold-medicine-under-two',
        match: /(감기\s*약|종합\s*감기|코\s*막힘\s*약|기침\s*약|해열제\s*말고\s*감기|영아\s*감기\s*약|2세\s*미만\s*감기|돌\s*전\s*감기\s*약)/,
        title: '어린 아이에게 일반 감기약은 함부로 주지 않습니다',
        lead: '많은 공식 안내가 영아·어린 유아에게 일반의약품 기침·감기약을 일상적으로 쓰지 말라고 합니다. 특히 아주 어린 아이에서는 이득보다 위험이 클 수 있습니다. 해열·수분·호흡 관찰이 우선이고, 약 이름·용량을 사이트·댓글로 정하지 않습니다. 처방·예진은 의료진에게 맡기세요.',
        points: [
            ['우선', '수분, 코 흡인·생리식염(안내된 방법), 실내 습도, 호흡·처짐 관찰'],
            ['약', '일반 감기약 임의 복용 금지에 가깝게 보고, 필요 시 진료·약사·의사 지시만']
        ],
        blocks: [
            ['지금 할 일', '나이, 체온, 호흡, 먹은 양·소변을 적고 진료 여부를 판단하세요.'],
            ['하지 않을 일', '성인 감기약을 나눠 주거나, ml를 인터넷에서 맞춰 주지 마세요.'],
            ['관련', '발열·코막힘·RSV 호흡 안내를 참고하세요.']
        ],
        links: [
            ['FDA 어린이 감기약', 'https://www.fda.gov/drugs/special-features/use-caution-when-giving-cough-and-cold-products-kids'],
            ['CDC 감기 돌보기', 'https://www.cdc.gov/antibiotic-use/colds.html'],
            ['발열·응급 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'alcohol-breastfeeding',
        match: /(수유|모유).*(술|맥주|와인|소주|음주)|(술|맥주|와인|소주).*(수유|모유|짠\s*후)/,
        title: '수유 중 음주는 피하거나 최소화하고, “짜내면 된다”에 기대지 마세요',
        lead: '수유부가 술을 마시면 알코올이 모유로 전달될 수 있습니다. 가능하면 수유 중 음주를 피하고, 마셨다면 아이 수유 시점과 간격을 의료 안내·공식 자료를 기준으로 신중히 정하세요. “한 잔 공식”이나 펌핑으로 알코올을 완전히 뺀다는 식으로 단정하지 않습니다. 과음·의존이 걱정되면 도움을 연결하세요.',
        points: [
            ['원칙', '수유 중 금주 또는 최소화, 아이 안전을 우선'],
            ['오해', '유축해 버리면 모유 속 알코올이 바로 없어진다고 보지 말 것']
        ],
        blocks: [
            ['지금 할 일', '마실 계획이 있으면 미리 수유·유축 일정을 의료 안내와 맞춰 보세요.'],
            ['하지 않을 일', '만취 상태에서 아기를 안고 재우거나 함께 자지 마세요.'],
            ['상담', '약·질환·의존이 있으면 의료진·중독 상담 경로를 이용하세요.']
        ],
        links: [
            ['CDC 수유와 알코올', 'https://www.cdc.gov/breastfeeding/breastfeeding-special-circumstances/vaccinations-medications-drugs/alcohol.html'],
            ['질병관리청 모유 수유', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586']
        ]
    },
    {
        id: 'parade-crowd-child-safety',
        match: /(퍼레이드|축제\s*인파|parade\s*crowd|불꽃놀이\s*인파|행진\s*군중|행사\s*인파)/,
        title: '축제·퍼레이드 인파에서는 손을 잡고 만날 장소를 정하며, 유모차는 가장자리를 이용하세요',
        lead: '혼잡한 군중은 넘어짐·헤어짐 위험이 큽니다. 이름표·연락처와 탈출 경로를 미리 정하세요.',
        points: [
            ['준비', '손잡기, 만날 장소'],
            ['피하기', '과도한 밀집']
        ],
        blocks: [
            ['지금 할 일', '헤어지면 만날 장소를 아이에게 말하세요.'],
            ['하지 않을 일', '가장 붐비는 한가운데에 오래 있지 마세요.'],
            ['관련', '횡단·불꽃놀이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'parking-lot-hold-hand-boundary',
        match: /(주차장\s*손\s*잡|주차\s*빌딩\s*아이|parking\s*lot\s*hold|주차장\s*뛰어|주차\s*차량\s*사이\s*아이)/,
        title: '주차장에서는 손을 잡고, 차량 사이·후진 차량을 주의하세요',
        lead: '운전자가 작은 아이를 놓치기 쉽습니다. 카트·손잡이를 잡고 차도 쪽을 피하세요.',
        points: [
            ['이동', '손잡기, 인도 쪽'],
            ['주의', '후진등, 차량 사이']
        ],
        blocks: [
            ['지금 할 일', '차에서 내리자마자 손을 잡으세요.'],
            ['하지 않을 일', '주차 차량 사이로 뛰어가게 두지 마세요.'],
            ['관련', '횡단보도·주차장 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/']
        ]
    },
    {
        id: 'bike-lane-walking-child-boundary',
        match: /(자전거\s*도로\s*보행)/,
        title: '자전거 도로에서는 아이 손을 잡고 가장자리로 걷거나 보도를 이용하세요',
        lead: '빠른 자전거와 충돌 위험이 있습니다.',
        points: [
            ['이동', '손잡기, 보도 우선'],
            ['주의', '이어폰, 뛰어다님']
        ],
        blocks: [
            ['지금 할 일', '유모차는 보도·허용 구간을 확인하세요.'],
            ['하지 않을 일', '자전거 도로 한가운데를 걷지 마세요.'],
            ['관련', '횡단·외출 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'school-zone-walking-boundary',
        match: /(스쿨존\s*속도)/,
        title: '스쿨존·등하교 때는 손을 잡고, 신호와 차량을 함께 확인하세요',
        lead: '운전자가 아이를 놓치기 쉽습니다. 뛰어 건너지 않게 하세요.',
        points: [
            ['이동', '손잡기, 횡단보도'],
            ['금지', '뛰어 건너기']
        ],
        blocks: [
            ['지금 할 일', '건너기 전 좌우를 함께 보세요.'],
            ['하지 않을 일', '주차 차량 사이로 뛰지 마세요.'],
            ['관련', '횡단보도 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/']
        ]
    },
    {
        id: 'scooter-sidewalk-pedestrian-boundary',
        match: /(킥보드\s*인도|킥보드\s*인도|인도\s*킥보드\s*보행|scooter\s*sidewalk\s*pedestrian)/,
        title: '인도에서 킥보드를 탈 때는 보행자를 피하고 속도를 줄이며 헬멧을 쓰세요',
        lead: '지역 규정을 확인하세요. 전동 킥보드와 구분하세요.',
        points: [
            ['매너', '서행, 양보'],
            ['장비', '헬멧']
        ],
        blocks: [
            ['지금 할 일', '사람 많은 인도에서는 끌고 가세요.'],
            ['하지 않을 일', '이어폰을 끼고 타지 마세요.'],
            ['관련', '킥보드 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'crosswalk-child-safety',
        match: /(횡단보도\s*아이|crosswalk|건널목\s*아이|신호등\s*손\s*잡|길\s*건널\s*때\s*아이)/,
        title: '길을 건널 때는 아이 손을 잡고, 신호가 초록이어도 차를 직접 확인하세요',
        lead: '횡단보도에서도 차량이 멈춘다고 단정하지 마세요. 손을 잡고 좌우를 보고, 스마트폰을 보며 건너지 마세요. 유모차는 운전자 눈에 잘 띄게 합니다. 특정 앱 추천은 하지 않습니다.',
        points: [
            ['습관', '손 잡기, 멈추고 보기, 뛰어 건너지 않기'],
            ['유모차', '먼저 나가기 전 시야 확인']
        ],
        blocks: [
            ['지금 할 일', '건널 때 “같이 본다”를 말로 연습하세요.'],
            ['하지 않을 일', '아이만 먼저 보내 건너게 하지 마세요.'],
            ['관련', '주차장·후진 사고 안내를 참고하세요.']
        ],
        links: [
            ['CDC 보행 안전', 'https://www.cdc.gov/transportationsafety/pedestrian/'],
            ['AAP 보행·외출 안전', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx']
        ]
    },
    {
        id: 'drive-through-child-safety',
        match: /(드라이브\s*스루\s*아이|드라이브스루\s*아기|drive\s*through\s*child|차\s*안\s*주문\s*아이|차창\s*주문\s*아기)/,
        title: '드라이브스루에서도 아이는 카시트·벨트를 유지하고, 창밖으로 몸을 내밀지 않게 하세요',
        lead: '짧은 정차도 안전띠를 풀면 위험합니다. 뜨거운 음료를 아이 쪽으로 두지 마세요.',
        points: [
            ['안전', '벨트 유지, 손 위치'],
            ['화상', '뜨거운 음료']
        ],
        blocks: [
            ['지금 할 일', '음료를 컵홀더 안쪽에 두세요.'],
            ['하지 않을 일', '창밖으로 손을 내밀게 두지 마세요.'],
            ['관련', '차량·화상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 차량', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/']
        ]
    },
    {
        id: 'parking-lot-pedestrian-safety',
        match: /(주차장\s*아이|parking\s*lot|마트\s*주차장|차\s*사이\s*뛰어|주차장\s*손\s*잡)/,
        title: '주차장에서는 아이 손을 잡고, 차 사이·후진 차량 사이를 뛰지 않게 하세요',
        lead: '주차장은 운전자 시야가 가려진 채 차가 움직입니다. 아이 손을 잡고 보행 구역을 이용하고, 카트·유모차와 함께 차 뒤를 지나갈 때 특히 주의하세요. 특정 앱·장비 추천은 하지 않습니다.',
        points: [
            ['습관', '손 잡기, 차 사이에서 놀지 않기, 눈 맞춤'],
            ['유모차', '운전자 눈에 잘 띄게, 급정거 대비']
        ],
        blocks: [
            ['지금 할 일', '하차 후 즉시 아이 손을 잡는 루틴을 만드세요.'],
            ['하지 않을 일', '차 키만 들고 아이보다 먼저 멀리 가지 마세요.'],
            ['관련', '후진 사고·카시트·차 안 방치 안내를 참고하세요.']
        ],
        links: [
            ['AAP 보행·차량 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 교통 안전', 'https://www.cdc.gov/transportationsafety/']
        ]
    },
    {
        id: 'driveway-backover-prevention',
        match: /(드라이브웨이|후진\s*사고|차에\s*치|마당\s*후진|backover|후방\s*카메라\s*아이|주차\s*아이\s*치)/,
        title: '집 앞·주차장 후진 전 아이 위치를 직접 확인하세요',
        lead: '집 마당·아파트 주차장에서 차가 천천히 후진해도 아이를 볼 수 없는 사각이 있습니다. 출발 전 아이 손을 잡고, 차를 움직이기 전에 주변을 걷듯이 확인하세요. 카메라·센서만 믿지 마세요.',
        points: [
            ['습관', '아이·반려동물을 차 뒤에 두지 않기, 출발 전 수 확인'],
            ['환경', '장난감·공을 차도·차로에 두지 않기']
        ],
        blocks: [
            ['지금 할 일', '주차·출발 루틴에 “아이 손 잡기”를 넣으세요.'],
            ['하지 않을 일', '차 시동 켠 채 아이만 마당에 두지 마세요.'],
            ['관련', '카시트·차 안 방치 금지 안내를 참고하세요.']
        ],
        links: [
            ['AAP 보행·차량 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 교통 안전', 'https://www.cdc.gov/transportationsafety/']
        ]
    },
    {
        id: 'power-window-car-safety',
        match: /(자동\s*창문|파워\s*윈도|power\s*window|차\s*창문\s*끼|창문\s*손가락\s*끼|전동\s*윈도)/,
        title: '차 전동 창문에 목·손가락이 끼지 않게 잠금·감독을 하세요',
        lead: '전동 창문은 목·손가락 끼임 사고가 날 수 있습니다. 아이가 스위치에 닿지 않게 하고, 창문 잠금 기능을 쓰세요. 창문을 올린 채 고개를 내밀게 두지 마세요. 특정 차량 기능 순위는 하지 않습니다.',
        points: [
            ['예방', '윈도 락, 뒷좌석 스위치 잠금, 감독'],
            ['응급', '끼임 시 즉시 창을 내리고 119·진료']
        ],
        blocks: [
            ['지금 할 일', '뒷좌석 윈도 락이 켜지는지 확인하세요.'],
            ['하지 않을 일', '아이만 차 안에 두고 시동·전원을 켜 두지 마세요.'],
            ['관련', '차 안 방치·카시트 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 창문 끼임 안전(영)', 'https://www.nhtsa.gov/'],
            ['AAP 차량 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx']
        ]
    },
    {
        id: 'trunk-entrapment-boundary',
        match: /(트렁크\s*가둠|트렁크\s*갇|trunk\s*entrap|트렁크\s*놀이|차\s*트렁크\s*숨|트렁크\s*질식|트렁크\s*숨|트렁크\s*숨바꼭질)/,
        title: '트렁크·짐칸에서 숨바꼭질하지 않게 하고, 비상 탈출 레버를 확인하세요',
        lead: '트렁크에 들어가면 질식·열사병·탈출 지연 위험이 있습니다. 열쇠·리모컨을 아이 손에 두지 말고, 트렁크 안에서 놀지 않게 하세요. 차량 비상 탈출 레버 위치를 어른이 알아 두세요. 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '키 보관, 트렁크 장난 금지, 하차 후 확인'],
            ['응급', '갇힘 의심 시 즉시 열고 119']
        ],
        blocks: [
            ['지금 할 일', '차 키를 아이 손이 닿지 않는 곳에 두세요.'],
            ['하지 않을 일', '트렁크를 “비밀 기지” 놀이로 쓰지 마세요.'],
            ['관련', '차 안 방치·주차장 안전 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 트렁크 가둠 예방(영)', 'https://www.nhtsa.gov/'],
            ['AAP 차량 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx']
        ]
    },
    {
        id: 'idling-car-child-alone-boundary',
        match: /(차\s*시동\s*아이\s*혼자|공조\s*켜고\s*아이|idling\s*car\s*child|차\s*에어컨\s*아이\s*혼자|잠\s*든\s*아이\s*차)/,
        title: '에어컨·히터를 켜 두어도 아이를 차에 혼자 두지 마세요',
        lead: '온도 변화·납치·차량 이동 위험이 있습니다. 잠깐도 혼자 두지 마세요.',
        points: [
            ['원칙', '항상 함께'],
            ['위험', '열, 한랭, 차량 이동']
        ],
        blocks: [
            ['지금 할 일', '볼일 때 아이를 데려가세요.'],
            ['하지 않을 일', '잠들었다고 혼자 두지 마세요.'],
            ['관련', '차 안 방치 안내를 참고하세요.']
        ],
        links: [
            ['AAP 차량', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/']
        ]
    },
    {
        id: 'earthquake-drop-cover-hold-boundary',
        match: /(지진\s*대비\s*아이|지진\s* Occurs|earthquake\s*child|책상\s*아래\s*숨|지진\s*대피\s*아기)/,
        title: '지진 시 낙하물 아래를 피하고, 가능하면 엎드려 머리를 보호하세요',
        lead: '지역 안내를 따르고, 엘리베이터·깨진 유리를 조심하세요. 재난 앱·대피소는 지자체 정보를 확인하세요.',
        points: [
            ['순간', '머리 보호, 낙하물 피하기'],
            ['이후', '출구, 여진']
        ],
        blocks: [
            ['지금 할 일', '가족 만날 장소와 비상 연락을 정해 두세요.'],
            ['하지 않을 일', '엘리베이터를 타지 마세요.'],
            ['관련', '화재 대피 안내를 참고하세요.']
        ],
        links: [
            ['Red Cross 대비', 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'carpool-dropoff-check-boundary',
        match: /(카풀\s*하차\s*확인|카풀\s*아이\s*내림|carpool\s*drop\s*off|카풀\s*뒷좌석\s*확인|하원\s*카풀\s*확인)/,
        title: '카풀·하원 후 뒷좌석에 아이가 남았는지 확인하는 습관을 만드세요',
        lead: '바쁜 일정에 두고 내리는 사고가 납니다. 휴대폰 알림 등 보조를 검토하세요.',
        points: [
            ['습관', '뒷좌석 확인'],
            ['금지', '차 안 방치']
        ],
        blocks: [
            ['지금 할 일', '도착 시 뒷좌석을 꼭 보세요.'],
            ['하지 않을 일', '잠깐이라도 혼자 두지 마세요.'],
            ['관련', '차 안 방치 안내를 참고하세요.']
        ],
        links: [
            ['AAP 차량', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/']
        ]
    },
    {
        id: 'drive-thru-hot-drink-child-boundary',
        match: /(드라이브스루\s*카페\s*아이|드라이브스루\s*뜨거운\s*음료|차\s*안\s*핫초코\s*아이|drive\s*thru\s*hot\s*drink\s*child)/,
        title: '드라이브스루 뜨거운 음료는 아이 반대쪽에 두고 벨트를 유지하세요',
        lead: '화상·창밖 손 내밀기를 조심하세요.',
        points: [
            ['배치', '컵홀더 안쪽'],
            ['안전', '벨트 유지']
        ],
        blocks: [
            ['지금 할 일', '음료를 아이 무릎에 두지 마세요.'],
            ['하지 않을 일', '창밖으로 손을 내밀게 두지 마세요.'],
            ['관련', '화상·차량 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 차량', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx']
        ]
    },
    {
        id: 'holiday-long-drive-child-boundary',
        match: /(명절\s*장거리\s*운전\s*아이|명절\s*장거리\s*운전|연휴\s*장거리\s*아이|holiday\s*long\s*drive\s*child)/,
        title: '명절 장거리 운전은 휴식·수유·카시트 착용을 지키고, 차 안 방치를 하지 마세요',
        lead: '피곤한 운전은 사고 위험을 키웁니다.',
        points: [
            ['휴식', '정차, 수유'],
            ['안전', '벨트·카시트']
        ],
        blocks: [
            ['지금 할 일', '정기적으로 쉬세요.'],
            ['하지 않을 일', '휴게소에 아이 혼자 두지 마세요.'],
            ['관련', '차량·카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 차량', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/equipment/car-seats-and-booster-seats']
        ]
    },
    {
        id: 'never-leave-in-car',
        match: /(차\s*안\s*방치|차량\s*방치|카시트에\s*두고|차에서\s*잠|더운\s*차|차\s*안\s*온도|아기\s*차\s*두고)/,
        title: '아기를 차 안에 혼자 두지 마세요. 짧은 시간도 위험합니다',
        lead: '차 안 온도는 바깥보다 빠르게 오를 수 있고, 아기를 카시트에 둔 채 자리를 비우는 일은 열사병·질식·유괴 위험이 있습니다. “잠깐 마트”도 예외가 아닙니다. 도착 후 뒷좌석을 확인하는 습관, 동승자에게 알리기를 권합니다. 특정 알림 기기 브랜드 추천은 하지 않습니다.',
        points: [
            ['금지', '잠든 아이·짧은 볼일 이유로 차 안 단독 방치'],
            ['습관', '뒷좌석 확인, 가방을 뒷좌석에 두기 등 개인 점검 루틴']
        ],
        blocks: [
            ['지금 할 일', '하차 시 뒷좌석을 보는 동작을 고정하세요.'],
            ['하지 않을 일', '시동·에어컨만 켜 두고 아이를 혼자 두지 마세요.'],
            ['응급', '차 안 아이를 발견하면 즉시 구조를 요청하고 의료 평가를 받으세요.']
        ],
        links: [
            ['NHTSA 차 안 열·아동', 'https://www.nhtsa.gov/summer-heat-child-safety'],
            ['AAP 차 안전', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Prevent-Child-Deaths-in-Hot-Cars.aspx'],
            ['카시트 원칙', '#home']
        ]
    },
    {
        id: 'jumper-exersaucer-boundary',
        match: /(도어\s*점퍼|점퍼\s*아기|엑서\s*사우저|액티비티\s*센터|baby\s*jumper|exersaucer|점프\s*의자)/,
        title: '문틀 점퍼·오래 태우는 활동 의자는 낙상·자세 부담이 있어 시간을 짧게 하세요',
        lead: '문틀에 매다는 점퍼, 오래 앉혀 두는 활동 센터는 낙상·과도한 사용 우려가 있습니다. 보행기처럼 “빨리 걷게” 해 주지 않으며, 깨어 놀 때도 보호자 감시와 짧은 사용이 안전합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['사용', '짧은 시간, 설명서 연령·체중, 문틀 고정 확인'],
            ['우선', '바닥 놀이, 터미타임, 안아서 놀기']
        ],
        blocks: [
            ['지금 할 일', '점퍼·활동 의자에 하루 얼마나 두는지 점검하세요.'],
            ['하지 않을 일', '문틀 점퍼에 태운 채 자리를 비우지 마세요.'],
            ['관련', '보행기·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 보행기·유사 제품 경계', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Baby-Walkers-A-Dangerous-Choice.aspx'],
            ['CDC 낙상 예방', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'baby-walker-danger',
        match: /(보행기|아기\s*보행기|워크어|baby\s*walker|걸음마\s*보조\s*차)/,
        title: '앉아서 미는 보행기는 권하지 않는 안내가 많습니다',
        lead: '바퀴 달린 앉는 보행기는 낙상·계단 추락·화상·손 끼임 사고와 관련해 많은 전문 단체가 사용을 권하지 않습니다. 걷기 연습을 빠르게 해 주지 않으며, 오히려 위험할 수 있습니다. 고정 활동 센터·바닥 놀이·보호자 손을 잡는 방식이 더 안전합니다. 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['위험', '계단·문턱·핫플레이트 접근, 전복'],
            ['대안', '바닥 놀이, 밀기 장난감(보호자 감시), 손잡고 걷기']
        ],
        blocks: [
            ['지금 할 일', '집에 보행기가 있으면 계단·난간 환경을 점검하고 사용을 줄이세요.'],
            ['하지 않을 일', '보행기에 태운 채 자리를 비우지 마세요.'],
            ['관련', '집 안 안전·낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 보행기', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Baby-Walkers-A-Dangerous-Choice.aspx'],
            ['CDC 낙상 예방', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'matches-lighter-storage-boundary',
        match: /(성냥\s*라이터\s*숨김)/,
        title: '성냥·라이터는 잠금 수납에 두고, 아이 장난감처럼 보이지 않게 하세요',
        lead: '불장난 사고가 납니다. 눈에 보이는 곳에 두지 마세요.',
        points: [
            ['보관', '높은 곳·잠금'],
            ['금지', '가지고 놀기']
        ],
        blocks: [
            ['지금 할 일', '성냥·라이터를 치우세요.'],
            ['하지 않을 일', '차에 라이터를 방치하지 마세요.'],
            ['관련', '라이터·화재 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'lighter-matches-boundary',
        match: /(라이터|성냥|lighter|matches|불장난|라이터\s*아이|성냥\s*아이)/,
        title: '라이터·성냥은 아이 손 닿지 않는 곳에 두고, 불장난은 바로 말리세요',
        lead: '라이터와 성냥은 화재·화상 원인입니다. 높은 잠금 수납에 두고, 아이가 만지면 즉시 빼앗고 위험함을 짧게 알려 주세요. “재미”로 불을 보여 주지 마세요. 제품 추천은 하지 않습니다.',
        points: [
            ['보관', '잠금·높은 곳, 가방 안 라이터도 점검'],
            ['교육', '짧은 금지, 처벌보다 즉시 제지']
        ],
        blocks: [
            ['지금 할 일', '거실·주방·가방의 라이터를 모아 두세요.'],
            ['하지 않을 일', '아이 앞에서 라이터를 장난으로 켜지 마세요.'],
            ['관련', '화상·CO·양초 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화재·화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['CPSC 화재 안전', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'bunk-bed-child-safety',
        match: /(이층\s*침대|2층\s*침대|벙크\s*침대|bunk\s*bed|위층\s*침대\s*아이)/,
        title: '이층 침대는 연령·난간·사다리를 지키고, 어린 아이는 아래층을 쓰세요',
        lead: '위층은 낙상 위험이 커서 어린 연령에는 권하지 않는 안내가 많습니다. 난간·사다리 고정, 위층에 어린 아이를 두지 않기 등을 지키세요. 제품 기준·연령 표시를 확인하고 브랜드 순위는 하지 않습니다.',
        points: [
            ['연령', '위층은 제품·안전 안내 연령 이상'],
            ['구조', '난간, 사다리 고정, 침대 옆 가구 치우기']
        ],
        blocks: [
            ['지금 할 일', '난간 높이와 나사 풀림을 점검하세요.'],
            ['하지 않을 일', '위층에서 뛰어놀거나 난간을 빼지 마세요.'],
            ['관련', '낙상·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 이층 침대 안전', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'toddler-bed-rail-gap-boundary',
        match: /(유아\s*침대\s*난간|유아\s*침대\s*난간\s*틈|토들러\s*베드\s*레일|toddler\s*bed\s*rail\s*gap)/,
        title: '유아 침대 난간 틈과 고정 상태를 확인하고, 끼임·낙하를 보세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['점검', '틈, 고정'],
            ['금지', '헐거운 레일']
        ],
        blocks: [
            ['지금 할 일', '설치 설명서를 따르세요.'],
            ['하지 않을 일', '난간이 흔들리면 사용을 중단하세요.'],
            ['관련', '유아 침대 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'toddler-bed-rail-boundary',
        match: /(침대\s*가드|베드\s*레일|bed\s*rail|유아\s*침대\s*난간|떨어지는\s*침대\s*막|침대\s*펜스)/,
        title: '유아 침대 가드·레일은 끼임 위험을 보고, 설명서대로만 설치하세요',
        lead: '성인 침대에 붙이는 가드는 틈 끼임·이탈 사고가 보고된 적 있습니다. 연령·매트리스에 맞는 제품을 설명서대로 설치하고, 느슨하면 사용을 중단하세요. 영아용 안전수면(빈 공간·등 자세)과 혼동하지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['사용', '표시 연령, 틈 없이 밀착, 정기 점검'],
            ['중단', '흔들림, 매트리스와 큰 틈, 영아에게 부적합']
        ],
        blocks: [
            ['지금 할 일', '가드와 매트리스 사이 틈을 확인하세요.'],
            ['하지 않을 일', '영아 침대에 성인 침대 가드를 쓰지 마세요.'],
            ['관련', '안전수면·낙상 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 침대 레일·끼임', 'https://www.cpsc.gov/'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'bookcase-anchor-tipover-boundary',
        match: /(책장\s*고정|책장\s*넘어|bookcase\s*anchor|책장\s*앵커|선반\s*쓰러)/,
        title: '책장·높은 선반은 벽에 고정하고, 위에 올라가거나 서랍을 밟고 오르지 않게 하세요',
        lead: '가구 전도는 중상을 낼 수 있습니다. 앵커로 고정하고 무거운 물건은 아래에 두세요.',
        points: [
            ['고정', '벽 앵커, 무게 아래'],
            ['금지', '오르기, 문 열고 매달리기']
        ],
        blocks: [
            ['지금 할 일', '높은 가구 고정 여부를 점검하세요.'],
            ['하지 않을 일', '책장을 사다리처럼 쓰게 두지 마세요.'],
            ['관련', '가구 전도 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'dresser-drawer-climb-boundary',
        match: /(서랍\s*열고\s*오르|서랍장\s*계단\s*처럼|dresser\s*drawer\s*climb|서랍\s*밟고\s*올라)/,
        title: '서랍을 계단처럼 밟고 오르지 않게 하고, 서랍장·책장을 벽에 고정하세요',
        lead: '전도 사고가 중대합니다. 앵커 브랜드 순위는 하지 않습니다.',
        points: [
            ['고정', '벽 앵커'],
            ['금지', '서랍 오르기']
        ],
        blocks: [
            ['지금 할 일', '무거운 물건을 아래에 두세요.'],
            ['하지 않을 일', '서랍을 열어 두고 자리를 비우지 마세요.'],
            ['관련', '가구 전도 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'tv-remote-top-tempt-boundary',
        match: /(티비\s*위\s*리모컨|tv\s*위\s*리모컨|tv\s*remote\s*on\s*top|티비\s*위\s*장난감)/,
        title: 'TV·가구 위에 리모컨·장난감을 두면 올라가려다 전도될 수 있어 치우세요',
        lead: '앵커 고정을 점검하세요.',
        points: [
            ['배치', '낮은 곳, 고정'],
            ['금지', '위로 유인']
        ],
        blocks: [
            ['지금 할 일', '리모컨을 아래로 두세요.'],
            ['하지 않을 일', '가구에 올라가게 두지 마세요.'],
            ['관련', '가구 전도 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'furniture-tipover',
        match: /(가구\s*전도|서랍장\s*넘어|티비\s*넘어|TV\s*넘어|옷장\s*넘어|가구\s*고정|앵커\s*고정|팁오버)/,
        title: '서랍장·TV 등 가구는 벽에 고정하고, 아이 오르기 놀이를 막으세요',
        lead: '아이들이 서랍을 밟고 올라가거나 TV를 당기다가 가구가 넘어지는 사고가 납니다. 무거운 가구·TV는 안내된 방식으로 벽·스터드에 고정하고, 위에 유인물을 두지 마세요. 특정 고정 장치 브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '벽 고정, 서랍 잠금, TV 낮은 가구·고정'],
            ['행동', '가구 오르기 금지, 바로 제지']
        ],
        blocks: [
            ['지금 할 일', '아이 방에 높은 서랍장·불안정 TV가 있는지 확인하세요.'],
            ['하지 않을 일', '위에 장난감·리모컨을 올려 유인하지 마세요.'],
            ['응급', '깔리거나 머리 충격이 있으면 의식·구토·처짐을 보고 119·진료']
        ],
        links: [
            ['CPSC 가구 전도', 'https://www.cpsc.gov/Safety-Education/Safety-Education-Centers/Tipover-Information-Center'],
            ['AAP 가구 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Furniture-And-TV-Tip-Overs-A-Hidden-Hazard-in-Your-Home.aspx']
        ]
    },
    {
        id: 'tv-tipover-boundary',
        match: /(티비\s*고정\s*앵커|텔레비전\s*쓰러질|tv\s*tip\s*over|티비\s*전용\s*장|평판\s*티비\s*넘어)/,
        title: 'TV는 전용 장에 올리거나 벽에 고정하고, 위에 올라가지 않게 하세요',
        lead: '평판 TV도 당겨 넘길 수 있습니다. 가구·TV 앵커를 사용하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['고정', '앵커, 낮은 장'],
            ['금지', '불안정한 가구 위']
        ],
        blocks: [
            ['지금 할 일', 'TV 스탠드 안정성을 확인하세요.'],
            ['하지 않을 일', '리모컨을 위에 두어 잡아당기게 만들지 마세요.'],
            ['관련', '가구 전도 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'railing-gap-boundary',
        match: /(난간\s*간격|난간\s*사이|세로대\s*간격|발코니\s*난간|난간\s*끼|baluster|railing\s*gap|난간\s*사이\s*머리)/,
        title: '난간·세로대 간격이 넓으면 끼임·추락 위험이 있어 점검하세요',
        lead: '난간 사이가 넓거나 가로대가 사다리처럼 되어 있으면 아이가 오르거나 끼일 수 있습니다. 가구를 난간 옆에 두지 말고, 수리·가드는 가정 환경에 맞게 검토하세요. 특정 제품 순위는 하지 않습니다.',
        points: [
            ['점검', '세로대 간격, 가로대 오르기, 흔들림'],
            ['예방', '난간 옆 소파·상자 치우기, 감독']
        ],
        blocks: [
            ['지금 할 일', '아이 머리·몸이 빠질 틈이 있는지 살펴보세요.'],
            ['하지 않을 일', '난간을 놀이 기구처럼 타게 두지 마세요.'],
            ['관련', '창 추락·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 가정 안전', 'https://www.cpsc.gov/'],
            ['AAP 추락 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['창 추락 안내', '#home']
        ]
    },
    {
        id: 'hotel-bed-gap-infant-boundary',
        match: /(호텔\s*침대\s*사이\s*틈|호텔\s*침대\s*틈|호텔\s*매트리스\s*틈|hotel\s*bed\s*gap\s*infant)/,
        title: '호텔 침대와 벽·헤드보드 틈에 아기가 끼지 않게 배치를 확인하고 별도 수면 공간을 쓰세요',
        lead: '성인 침대 공유 위험을 피하세요.',
        points: [
            ['점검', '틈, 별도 침대'],
            ['금지', '소파 수면']
        ],
        blocks: [
            ['지금 할 일', '아기 침대를 요청·점검하세요.'],
            ['하지 않을 일', '베개 산에 재우지 마세요.'],
            ['관련', '호텔 침대·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'hotel-balcony-safety',
        match: /(호텔\s*발코니|호텔\s*난간|hotel\s*balcony|리조트\s*베란다\s*아이|숙소\s*난간\s*아이)/,
        title: '호텔 발코니는 문을 잠그고, 가구를 난간 쪽으로 붙이지 마세요',
        lead: '난간 틈·올라갈 수 있는 가구가 낙상 위험을 키웁니다. 아이 혼자 발코니에 두지 마세요.',
        points: [
            ['차단', '문 잠금, 가구 배치'],
            ['감독', '혼자 두지 않기']
        ],
        blocks: [
            ['지금 할 일', '도착 직후 발코니 문 잠금을 확인하세요.'],
            ['하지 않을 일', '의자·테이블을 난간 옆에 두지 마세요.'],
            ['관련', '창문 낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 낙상', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'window-screen-not-barrier-boundary',
        match: /(방충망\s*기대|방충망\s*막|window\s*screen\s*fall|방충망\s*안전|창\s*방충망\s*아이)/,
        title: '방충망은 낙상 방지 장치가 아니므로, 창을 잠그고 가구를 치우세요',
        lead: '방충망은 쉽게 밀립니다. 창문 안전 잠금과 가구 배치가 중요합니다.',
        points: [
            ['조치', '창 잠금, 가구 이동'],
            ['오해', '방충망=안전 장벽']
        ],
        blocks: [
            ['지금 할 일', '아이 방 창에 잠금 장치를 확인하세요.'],
            ['하지 않을 일', '방충망에 기대게 두지 마세요.'],
            ['관련', '창문 낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'window-screen-replace-loose-boundary',
        match: /(방충망\s*교체)/,
        title: '헐겁거나 찢어진 방충망은 낙상 방지 기능이 없으니 창 잠금·가구 배치를 우선하세요',
        lead: '방충망만 믿지 마세요.',
        points: [
            ['조치', '창 잠금, 가구 이동'],
            ['오해', '방충망=장벽']
        ],
        blocks: [
            ['지금 할 일', '아이 방 창 잠금을 확인하세요.'],
            ['하지 않을 일', '방충망에 기대게 두지 마세요.'],
            ['관련', '창문 낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'window-stopper-limit-boundary',
        match: /(창문\s*스토퍼|창문\s*스토퍼|창문\s*열림\s*제한|window\s*stopper\s*child)/,
        title: '창문 열림 제한 장치를 검토하고, 가구를 창 옆에 두지 마세요',
        lead: '방충망은 장벽이 아닙니다. 제품 순위는 하지 않습니다.',
        points: [
            ['조치', '잠금, 스토퍼'],
            ['배치', '가구 이동']
        ],
        blocks: [
            ['지금 할 일', '아이 방 창을 확인하세요.'],
            ['하지 않을 일', '창틀에 올라가게 두지 마세요.'],
            ['관련', '창문 낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'window-fall-prevention',
        match: /(창\s*추락|창문\s*추락|창틀\s*앉아|난간\s*넘어|베란다\s*추락|창문\s*방충|윈도우\s*가드)/,
        title: '창문·베란다에서는 방충망만 믿지 말고, 가구를 창 아래에서 치우세요',
        lead: '방충망은 추락 방지 장치가 아닙니다. 창 아래 침대·서랍을 두지 말고, 잠금·제한 장치를 사용 설명서대로 쓰세요. 특정 안전망 브랜드 순위는 하지 않습니다. 추락 사고가 있으면 머리·목 손상을 가정하고 함부로 움직이지 말고 구조를 요청하세요.',
        points: [
            ['예방', '창 아래 오를 가구 제거, 잠금, 성인 감시'],
            ['오해', '방충망 = 안전망 아님']
        ],
        blocks: [
            ['지금 할 일', '아이 손 닿는 창·베란다를 한 바퀴 점검하세요.'],
            ['하지 않을 일', '창틀에 앉히거나 방충망에 기대게 하지 마세요.'],
            ['응급', '떨어진 뒤 의식·구토·마비 의심이면 119']
        ],
        links: [
            ['AAP 창 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Window-Safety.aspx'],
            ['CDC 낙상', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'cat-scratch-boundary',
        match: /(고양이\s*할퀴|고양이\s*스크래치|캣\s*스크래치|cat\s*scratch|고양이\s*물림|고양이\s*상처)/,
        title: '고양이 할퀴·물림은 세척 후 감염 징후를 보고, 열·부종이 있으면 진료하세요',
        lead: '고양이 할퀴 뒤 드물게 감염(캣스크래치 등)이 문제될 수 있습니다. 상처를 비누와 물로 씻고, 빨개짐·부종·발열·림프절 부음이 있으면 진료하세요. 항생제 여부는 의료진이 정합니다. 사진으로 병명을 단정하지 않습니다.',
        points: [
            ['당장', '비누·물 세척, 출혈 압박'],
            ['진료', '열, 심한 부종, 고름, 무기력']
        ],
        blocks: [
            ['지금 할 일', '할퀸 시각과 부위·고양이 예방접종 여부를 기록하세요.'],
            ['하지 않을 일', '상처를 입으로 빨거나 민간 약만 바르지 마세요.'],
            ['관련', '반려동물 물림 안내를 참고하세요.']
        ],
        links: [
            ['CDC 캣스크래치 병', 'https://www.cdc.gov/bartonella/about/about-cat-scratch-disease.html'],
            ['AAP 동물 물림', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Animal-Bites.aspx']
        ]
    },
    {
        id: 'leash-hand-wrap-injury-boundary',
        match: /(목줄\s*손\s*감|리쉬\s*손\s*감김|leash\s*wrap\s*hand|강아지\s*줄\s*손|산책\s*줄\s*감기)/,
        title: '산책 줄이 아이 손·손목에 감기지 않게 하고, 큰 견종은 성인이 잡으세요',
        lead: '줄에 끌려 넘어지거나 손가락 부상이 납니다.',
        points: [
            ['방법', '성인 주도, 짧은 줄'],
            ['금지', '손에 감아 잡기']
        ],
        blocks: [
            ['지금 할 일', '아이가 줄을 감아 쥐지 않게 하세요.'],
            ['하지 않을 일', '큰 개가 갑자기 달려도 아이가 잡지 않게 하세요.'],
            ['관련', '산책 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'dog-walking-child-safety',
        match: /(강아지\s*산책\s*아이|반려견\s*산책\s*아기|dog\s*walk\s*child|개\s*줄\s*아이|유모차\s*개\s*산책)/,
        title: '아이와 반려견 산책 때는 줄을 짧게 잡고, 개가 갑자기 달려도 유모차·아이 손이 끌리지 않게 하세요',
        lead: '개가 다른 개·사람을 보고 튀면 유모차가 뒤집히거나 아이가 넘어질 수 있습니다. 한 손에 개 줄·한 손에 아이만 있는 상태를 피하고, 교통량이 적은 길을 선택하세요. 훈련·용품 브랜드 추천은 하지 않습니다.',
        points: [
            ['통제', '짧은 줄, 두 보호자 분담, 유모차 브레이크'],
            ['위험', '줄 걸림, 전복, 물림']
        ],
        blocks: [
            ['지금 할 일', '산책 동선을 아이 기준으로 다시 짜 보세요.'],
            ['하지 않을 일', '아이에게 개 줄을 맡기지 마세요.'],
            ['관련', '반려동물 물림·유모차 안내를 참고하세요.']
        ],
        links: [
            ['AAP 반려동물·아이 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 건강한 반려동물', 'https://www.cdc.gov/healthy-pets/']
        ]
    },
    {
        id: 'farm-visit-safety',
        match: /(농장\s*체험|farm\s*visit|가축\s*만지기|목장\s*아기|동물\s*먹이주기\s*체험|농장\s*아이)/,
        title: '농장·가축 체험 후에는 손을 씻고, 어린 아기는 동물 가까이 오래 두지 마세요',
        lead: '가축 주변은 감염·발 차임 위험이 있습니다. 손 씻기와 성인 감독이 중요합니다.',
        points: [
            ['위생', '손 씻기, 음식 전'],
            ['거리', '발 차임, 물림']
        ],
        blocks: [
            ['지금 할 일', '체험 직후 손을 씻으세요.'],
            ['하지 않을 일', '먹이를 먹다 만진 손으로 입을 닦지 마세요.'],
            ['관련', '물림·위생 안내를 참고하세요.']
        ],
        links: [
            ['CDC 위생', 'https://www.cdc.gov/hygiene/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'zoo-animal-boundary',
        match: /(동물원\s*안전|zoo\s*child|동물\s*만지기\s*체험|동물원\s*울타리|야생동물\s*만지)/,
        title: '동물원에서는 울타리 너머로 손을 넣지 말고, 만지기 체험 후 손을 씻으세요',
        lead: '동물 접촉은 물림·감염 위험이 있습니다. 안내문을 지키고 먹이를 무단으로 주지 마세요.',
        points: [
            ['규칙', '울타리, 안내원'],
            ['위생', '손 씻기']
        ],
        blocks: [
            ['지금 할 일', '만지기 후 비누로 손을 씻으세요.'],
            ['하지 않을 일', '우리 안에 손을 넣지 마세요.'],
            ['관련', '반려동물 물림·위생 안내를 참고하세요.']
        ],
        links: [
            ['CDC 위생', 'https://www.cdc.gov/hygiene/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'wildlife-feeding-boundary',
        match: /(야생동물\s*먹이|다람쥐\s*먹이\s*아이|wildlife\s*feed|길고양이\s*만지\s*아이|너구리\s*만지)/,
        title: '야생동물·길동물에게 먹이를 주거나 만지지 않게 하고, 물리면 진료하세요',
        lead: '야생동물은 예측 불가하고 감염 위험이 있을 수 있습니다. 거리를 두고 손을 씻으세요.',
        points: [
            ['규칙', '만지지 않기, 먹이 금지'],
            ['물림', '씻기, 진료']
        ],
        blocks: [
            ['지금 할 일', '공원에서 야생동물과 거리를 두세요.'],
            ['하지 않을 일', '손으로 먹이를 주지 마세요.'],
            ['관련', '반려동물 물림 안내를 참고하세요.']
        ],
        links: [
            ['CDC 위생', 'https://www.cdc.gov/hygiene/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'stray-dog-encounter-boundary',
        match: /(산책\s*중\s*낯선\s*개|낯선\s*개\s*만남|떠돌이\s*개\s*아이|stray\s*dog\s*child|모르는\s*개\s*다가|개\s*피하기\s*아이)/,
        title: '모르는 개에게 다가가지 않게 하고, 달려오면 어른 뒤로 피하세요',
        lead: '눈 맞추며 다가가기·먹이 주기를 말리세요.',
        points: [
            ['규칙', '만지지 않기'],
            ['위험', '도망·물림']
        ],
        blocks: [
            ['지금 할 일', '아이를 들어 올리거나 뒤로 두세요.'],
            ['하지 않을 일', '돌이나 막대로 자극하지 마세요.'],
            ['관련', '물림 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/healthypets/']
        ]
    },
    {
        id: 'small-rodent-bite-boundary',
        match: /(햄스터\s*물림|기니피그\s*물|small\s*rodent\s*bite|햄스터\s*물렸|랫\s*물림\s*아이)/,
        title: '소동물에게 물리면 씻고 감염 징후를 보며, 얼굴을 들이밀며 놀지 마세요',
        lead: '작은 동물도 물 수 있습니다. 심하거나 깊으면 진료하세요.',
        points: [
            ['예방', '거친 놀이 금지'],
            ['상처', '세척, 관찰']
        ],
        blocks: [
            ['지금 할 일', '잠든 동물을 갑자기 깨우지 마세요.'],
            ['하지 않을 일', '물린 부위를 씻으세요.'],
            ['관련', '물림 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/healthypets/']
        ]
    },
    {
        id: 'aquarium-child-safety-boundary',
        match: /(물고기\s*수조)/,
        title: '어항은 전복·감전·물 섭취를 보고 고정·코드 정리를 하세요',
        lead: '물고기를 만진 뒤 손을 씻기세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['고정', '받침대, 코드'],
            ['위생', '손 씻기']
        ],
        blocks: [
            ['지금 할 일', '수조를 안정된 곳에 두세요.'],
            ['하지 않을 일', '전기 코드에 물을 튀기지 마세요.'],
            ['관련', '가정 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'vet-waiting-room-child-boundary',
        match: /(동물\s*병원\s*대기)/,
        title: '동물병원 대기실에서는 다른 동물과 거리를 두고, 아이가 얼굴을 들이밀지 않게 하세요',
        lead: '아픈·불안한 동물은 예측이 어렵습니다.',
        points: [
            ['거리', '다른 동물 멀리'],
            ['금지', '얼굴 들이밀기']
        ],
        blocks: [
            ['지금 할 일', '아이를 무릎에 두고 감독하세요.'],
            ['하지 않을 일', '모르는 개를 만지게 두지 마세요.'],
            ['관련', '물림 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/healthypets/']
        ]
    },
    {
        id: 'bird-feather-allergy-boundary',
        match: /(새\s*깃털\s*알레르기|앵무\s*먼지\s*아이|bird\s*feather\s*allergy|조류\s*분진\s*아이|새장\s*청소\s*아이)/,
        title: '새장 청소·깃털 먼지가 호흡 증상을 키울 수 있어 환기·마스크·아이 거리를 검토하세요',
        lead: '증상 심하면 진료하세요. 제품 순위는 하지 않습니다.',
        points: [
            ['관리', '환기, 청소 시 분리'],
            ['증상', '기침, 쌕쌕']
        ],
        blocks: [
            ['지금 할 일', '청소 때 아이를 다른 방에 두세요.'],
            ['하지 않을 일', '호흡이 힘들면 방치하지 마세요.'],
            ['관련', '알레르기·호흡 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/healthypets/']
        ]
    },
    {
        id: 'reptile-salmonella-child-boundary',
        match: /(파충류\s*만지|거북이\s*살모넬라|reptile\s*child\s*salmonella|도마뱀\s*아이|뱀\s*만지\s*손\s*씻)/,
        title: '파충류·양서류 접촉 후 손을 씻고, 어린 아이 입에 손이 가지 않게 하세요',
        lead: '살모넬라 위험이 알려져 있습니다. 우리·물 관리도 위생적으로 하세요.',
        points: [
            ['위생', '손 씻기'],
            ['주의', '어린 영아 접촉']
        ],
        blocks: [
            ['지금 할 일', '만진 뒤 비누로 손을 씻으세요.'],
            ['하지 않을 일', '입 주변에 파충류를 가까이 대지 마세요.'],
            ['관련', '위생·물림 안내를 참고하세요.']
        ],
        links: [
            ['CDC', 'https://www.cdc.gov/healthypets/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'new-pet-introduction-child-boundary',
        match: /(새\s*반려\s*소개|강아지\s*입양\s*아이|new\s*pet\s*child|고양이\s*데려와\s*아기|반려동물\s*처음\s*만남)/,
        title: '새 반려동물 소개는 천천히, 감독 아래 하고, 아기가 혼자 있게 두지 마세요',
        lead: '초기 스트레스로 물림·할큄이 날 수 있습니다. 수면 공간은 분리하세요.',
        points: [
            ['소개', '짧게, 감독'],
            ['금지', '단독 방치']
        ],
        blocks: [
            ['지금 할 일', '첫 만남은 짧게 하세요.'],
            ['하지 않을 일', '아기와 동물을 방에 혼자 두지 마세요.'],
            ['관련', '물림 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/healthypets/']
        ]
    },
    {
        id: 'cat-scratch-prevention-boundary',
        match: /(고양이\s*발톱)/,
        title: '고양이와 거칠게 놀지 않게 하고, 긁히면 씻은 뒤 감염 징후를 보세요',
        lead: '고양이 할퀴 후 감염 위험이 있을 수 있습니다. 심하면 진료하세요.',
        points: [
            ['예방', '거친 놀이 금지'],
            ['상처', '세척, 관찰']
        ],
        blocks: [
            ['지금 할 일', '배를 세게 만지는 놀이를 말리세요.'],
            ['하지 않을 일', '할퀸 상처를 방치하지 마세요.'],
            ['관련', '고양이 할큄 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/healthypets/']
        ]
    },
    {
        id: 'dog-food-bowl-resource-guard-boundary',
        match: /(강아지\s*밥그릇)/,
        title: '반려견이 먹을 때 아이가 밥그릇에 손을 넣지 않게 하고, 분리 급식을 하세요',
        lead: '자원 보호 행동으로 물릴 수 있습니다. 훈련 업체 순위는 하지 않습니다.',
        points: [
            ['규칙', '식사 중 거리'],
            ['환경', '분리 공간']
        ],
        blocks: [
            ['지금 할 일', '식사 중 아이를 떨어져 있게 하세요.'],
            ['하지 않을 일', '먹이를 빼앗는 장난을 하지 마세요.'],
            ['관련', '반려견 물림 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/healthypets/']
        ]
    },
    {
        id: 'pet-bite-safety',
        match: /(개\s*물|강아지\s*물|고양이\s*할퀴|반려동물\s*물|애완견|물린\s*상처|동물\s*교상)/,
        title: '반려동물 물림·할퀴는 상처 세척과 진료 여부를 함께 봅니다',
        lead: '아기와 반려동물은 항상 보호자 감시 아래 두고, 먹이·잠자리·장난감을 빼앗기지 않게 합니다. 물리면 흐르는 물과 비누로 씻고, 깊거나 얼굴·손·감염 징후·예방접종 불명이면 진료하세요. 파상풍·광견병 판단은 의료진이 합니다. 품종 순위·훈련 업체 광고는 하지 않습니다.',
        points: [
            ['예방', '감시, 아이 얼굴 핥기·혼자 두기 금지, 신호(으르렁) 존중'],
            ['상처', '세척, 출혈 압박, 감염·깊으면 진료']
        ],
        blocks: [
            ['지금 할 일', '물린 시각·동물 예방접종 가능 정보를 적으세요.'],
            ['하지 않을 일', '민간 약초만 바르고 방치하지 마세요.'],
            ['관련', '손 씻기·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 개 물림', 'https://www.cdc.gov/healthy-pets/dog-bites/'],
            ['AAP 반려동물 안전', 'https://www.healthychildren.org/English/health-issues/conditions/from-insects-animals/Pages/Pets-and-Children.aspx']
        ]
    },
    {
        id: 'foreign-body-nose-ear',
        match: /(코\s*이물질|귀\s*이물질|귀에\s*이물질|(코|귀).{0,12}(넣|이물질|구슬|콩)|구슬\s*(코|귀)|배터리\s*코|이물질\s*제거)/,
        title: '코·귀 이물질은 억지로 쑤시지 말고, 특히 전지는 응급입니다',
        lead: '콩·구슬·휴지 등을 코·귀에 넣는 일이 있습니다. 집에서 집게로 깊게 찌르지 마세요. 단추전지가 코에 있으면 조직 손상이 빨라 응급입니다. 호흡 곤란·심한 통증·출혈이 있으면 바로 의료기관을 찾으세요.',
        points: [
            ['하지 말 것', '면봉·집게로 깊게 밀어 넣기, 약 액체 함부로 붓기'],
            ['바로 진료', '전지·자석, 호흡 불편, 한쪽 콧물·악취 지속, 심한 통증']
        ],
        blocks: [
            ['지금 할 일', '무엇을 넣었는지·시각을 기록하고 진료 경로를 잡으세요.'],
            ['하지 않을 일', '반대쪽 코를 막고 세게 불어 무리하게 빼려 하지 마세요(상황별 상이, 의료 지시 우선).'],
            ['관련', '단추전지·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 이물질', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/Pages/Insect-Stings-and-Bites.aspx'],
            ['NHS 코 이물질', 'https://www.nhs.uk/conditions/foreign-body-in-the-nose/'],
            ['단추전지 안내', '#home']
        ]
    },
    {
        id: 'ice-skating-child-safety',
        match: /(아이스\s*스케이트|ice\s*skat|얼음\s*스케이트\s*아이|링크\s*스케이트)/,
        title: '아이스 스케이트는 헬멧·손목 보호를 쓰고, 초보는 난간·평지에서 배우세요',
        lead: '얼음 위 넘어짐으로 손목·머리 부상이 납니다. 헬멧과 맞는 사이즈를 쓰고 붐비는 시간·야외 얇은 얼음을 피하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 손목 보호, 맞는 부츠'],
            ['장소', '실내 링크, 감독, 초보 구역']
        ],
        blocks: [
            ['지금 할 일', '헬멧을 쓰고 난간 근처에서 서 보세요.'],
            ['하지 않을 일', '얼음이 얇은 호수에서 타지 마세요.'],
            ['관련', '썰매·동상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상 예방', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'sledding-winter-safety',
        match: /(썰매\s*타기|sledding|눈썰매\s*안전|비탈\s*썰매|튜브\s*썰매\s*아이)/,
        title: '썰매는 헬멧을 쓰고, 차도·나무·얼음 강으로 향하지 않는 비탈을 고르세요',
        lead: '썰매 사고는 머리·목 부상이 날 수 있습니다. 안전한 비탈, 한 명씩, 끝에서 비키기, 야간 자제가 중요합니다. 제품 추천은 하지 않습니다.',
        points: [
            ['장소', '차도·호수 얼음 피하기, 장애물 없는 비탈'],
            ['장비', '헬멧, 장갑, 따뜻한 옷']
        ],
        blocks: [
            ['지금 할 일', '비탈 끝에 도로·나무가 있는지 확인하세요.'],
            ['하지 않을 일', '여러 명이 한 썰매에 겹쳐 타지 마세요.'],
            ['관련', '동상·헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 겨울 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 동상·한랭', 'https://www.cdc.gov/winter-weather/prevention/']
        ]
    },
    {
        id: 'extreme-cold-outdoor-limit-boundary',
        match: /(한파\s*외출|극한\s*추위\s*아이|extreme\s*cold\s*child|영하\s*놀이\s*시간|추위\s*밖에서\s*오래)/,
        title: '한파에는 외출을 짧게 하고, 귀·손가락·발가락 동상을 확인하세요',
        lead: '어린이는 체온 조절이 어렵습니다. 겹쳐 입히고 젖은 옷은 갈아입히세요.',
        points: [
            ['준비', '겹옷, 방수, 짧은 시간'],
            ['신호', '창백, 무감각']
        ],
        blocks: [
            ['지금 할 일', '귀가·손가락을 자주 보세요.'],
            ['하지 않을 일', '추위에 오래 두지 마세요.'],
            ['관련', '동상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'cold-commute-layers-boundary',
        match: /(한파\s*등원\s*옷|한파\s*등원\s*옷|추운\s*날\s*등원\s*겹|cold\s*commute\s*layers)/,
        title: '한파 등원은 겹쳐 입히고 귀·손·발을 덮으며, 젖은 옷은 갈아입히세요',
        lead: '동상 신호를 확인하세요.',
        points: [
            ['복장', '겹옷, 방수'],
            ['신호', '창백, 무감각']
        ],
        blocks: [
            ['지금 할 일', '여분 장갑을 챙기세요.'],
            ['하지 않을 일', '젖은 양말을 오래 두지 마세요.'],
            ['관련', '동상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'frostbite-cold-weather-boundary',
        match: /(동상|추위\s*화상|frostbite|손가락\s*하얘|발가락\s*얼|귀\s*동상|심한\s*추위\s*외출)/,
        title: '심한 추위 노출 후 창백·감각 이상이 있으면 따뜻하게 하고 진료를 검토하세요',
        lead: '동상은 손가락·발가락·귀·코 등에 잘 생깁니다. 젖은 옷·바람을 피하고 겹겹이 입히며, 언 부위를 불로 직접 녹이거나 문지르지 마세요. 수포·색 변화·감각 소실이 있으면 진료합니다. 민간 연고 추천은 하지 않습니다.',
        points: [
            ['예방', '겹옷, 방수·방풍, 젖으면 갈아입히기, 그늘·바람 줄이기'],
            ['응급', '창백·단단함·수포·심한 통증 → 따뜻하게·진료']
        ],
        blocks: [
            ['지금 할 일', '외출 전 장갑·모자·양말 상태를 확인하세요.'],
            ['하지 않을 일', '눈·얼음으로 언 피부를 세게 문지르지 마세요.'],
            ['관련', '열 질환·외출 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 동상·한랭 손상', 'https://www.cdc.gov/winter-weather/prevention/'],
            ['AAP 겨울 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'playground-heat-metal-boundary',
        match: /(놀이터\s*더위|놀이터\s*폭염|hot\s*playground|여름\s*놀이터\s*뜨거|금속\s*놀이터\s*열)/,
        title: '더운 날 놀이터 금속·바닥이 뜨거우면 그늘·물을 챙기고 이용 시간을 줄이세요',
        lead: '한낮 금속 기구와 고무 바닥은 매우 뜨거울 수 있습니다. 온도를 확인하고 수분을 자주 주세요.',
        points: [
            ['예방', '그늘, 물, 신발'],
            ['중단', '어지럼, 구토, 처짐']
        ],
        blocks: [
            ['지금 할 일', '기구 온도를 손으로 확인하세요.'],
            ['하지 않을 일', '한낮에 오래 두지 마세요.'],
            ['관련', '열 질환·화상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 열', 'https://www.cdc.gov/heat-health/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'sports-heat-practice-boundary',
        match: /(운동\s*더위|폭염\s*체육|heat\s*practice|더운\s*날\s*훈련|운동회\s*더위)/,
        title: '더운 날 운동은 그늘·물·휴식을 챙기고, 어지럼·구토·의식 변화가 있으면 중단 후 진료하세요',
        lead: '열 질환은 어린이에게도 위험합니다. 더운 시간대 훈련을 줄이고 수분을 자주 주세요.',
        points: [
            ['예방', '그늘, 물, 휴식'],
            ['응급', '처짐, 구토, 의식 변화']
        ],
        blocks: [
            ['지금 할 일', '운동 전후 물을 마시게 하세요.'],
            ['하지 않을 일', '더위에 쉬지 않고 뛰게 두지 마세요.'],
            ['관련', '열 질환 안내를 참고하세요.']
        ],
        links: [
            ['CDC 열', 'https://www.cdc.gov/heat-health/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'sudden-rain-playground-boundary',
        match: /(소나기\s*운동장|소나기\s*운동장|비\s*오는데\s*운동장|sudden\s*rain\s*playground)/,
        title: '갑자기 비가 오면 미끄럼·번개를 보고 실내로 옮기세요',
        lead: '젖은 금속 기구는 미끄럽습니다.',
        points: [
            ['행동', '실내 대피'],
            ['주의', '번개, 미끄럼']
        ],
        blocks: [
            ['지금 할 일', '천둥이 들리면 바로 들어가세요.'],
            ['하지 않을 일', '젖은 미끄럼틀을 타게 두지 마세요.'],
            ['관련', '번개·놀이터 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'lightning-outdoor-play-boundary',
        match: /(번개\s*야외|천둥\s*번개\s*놀이|lightning\s*play|소나기\s*번개\s*아이|천둥\s*밖에)/,
        title: '천둥·번개가 있으면 야외 놀이를 멈추고 건물 안으로 들어가세요',
        lead: '열린 들판·물가·높은 나무는 위험합니다. 천둥이 그친 뒤에도 잠시 실내에 머무는 편이 안전합니다.',
        points: [
            ['행동', '실내 대피, 열린 곳 피하기'],
            ['주의', '물가, 금속, 나무 아래']
        ],
        blocks: [
            ['지금 할 일', '천둥이 들리면 바로 실내로 이동하세요.'],
            ['하지 않을 일', '높은 나무 아래를 피난처로 쓰지 마세요.'],
            ['관련', '열·야외 놀이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'outdoor-nap-heat-boundary',
        match: /(폭염\s*낮잠\s*실외|실외\s*낮잠\s*더위|유모차\s*덮개\s*더위|outdoor\s*nap\s*heat|그늘\s*없이\s*재우|차양\s*유모차\s*과열)/,
        title: '더운 날 유모차·실외에서 재울 때는 과열·환기를 보고, 덮개로 막지 마세요',
        lead: '유모차 과열이 보고됩니다. 그늘·수분·수시 확인이 중요합니다.',
        points: [
            ['확인', '그늘, 통풍, 피부'],
            ['금지', '비닐·두꺼운 덮개 밀폐']
        ],
        blocks: [
            ['지금 할 일', '자주 얼굴을 확인하세요.'],
            ['하지 않을 일', '유모차를 덮개로 완전히 막지 마세요.'],
            ['관련', '열 질환·레인커버 안내를 참고하세요.']
        ],
        links: [
            ['CDC 열', 'https://www.cdc.gov/heat-health/'],
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx']
        ]
    },
    {
        id: 'hot-car-shade-not-enough-boundary',
        match: /(무더위\s*차\s*그늘|무더위\s*차\s*그늘|그늘\s*주차\s*아이\s*혼자|hot\s*car\s*shade\s*child)/,
        title: '그늘 주차·창문 살짝 열림만으로 아이를 차에 두지 마세요',
        lead: '차 안 온도는 빠르게 오를 수 있습니다.',
        points: [
            ['원칙', '항상 함께'],
            ['금지', '잠깐 혼자']
        ],
        blocks: [
            ['지금 할 일', '볼일 때 아이를 데려가세요.'],
            ['하지 않을 일', '잠들었다고 두지 마세요.'],
            ['관련', '차 안 방치 안내를 참고하세요.']
        ],
        links: [
            ['AAP 차량', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['NHTSA', 'https://www.nhtsa.gov/']
        ]
    },
    {
        id: 'heat-wave-school-commute-boundary',
        match: /(폭염\s*등교|폭염\s*등교|더위\s*등하교|heat\s*wave\s*school\s*walk)/,
        title: '폭염 등하교는 그늘·물·모자·시간을 조절하고, 어지럼·구토면 쉬게 한 뒤 진료를 검토하세요',
        lead: '열 질환은 위험할 수 있습니다.',
        points: [
            ['예방', '그늘, 물, 옷'],
            ['중단', '처짐, 구토']
        ],
        blocks: [
            ['지금 할 일', '물을 챙기세요.'],
            ['하지 않을 일', '한낮에 오래 걷게 두지 마세요.'],
            ['관련', '열 질환 안내를 참고하세요.']
        ],
        links: [
            ['CDC 열', 'https://www.cdc.gov/heat-health/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'heat-illness-child',
        match: /(열사병|일사병|더위\s*먹|폭염|고온\s*야외|더워서\s*처지|heat\s*stroke|heat\s*exhaust)/,
        title: '더위·열사병 의심이면 시원한 곳으로 옮기고 응급 신호를 봅니다',
        lead: '아이들은 더위에 취약할 수 있습니다. 그늘·수분·얇은 옷·차 안 방치 금지가 기본입니다. 심하게 처지거나, 토하거나, 의식이 이상하거나, 몸이 매우 뜨겁고 땀이 없거나 혼란스러우면 응급으로 봅니다. 해열제 용량으로 열사병을 집에서 치료하지 마세요.',
        points: [
            ['예방', '한낮 야외 줄이기, 그늘, 물, 차 안 금지'],
            ['응급', '의식 저하, 경련, 빠른 호흡, 피부 뜨거움, 소변 감소·처짐']
        ],
        blocks: [
            ['지금 할 일', '시원한 곳으로 옮기고 옷을 느슨히 하며 수분을 시도하세요(의식이 있을 때).'],
            ['하지 않을 일', '차 안·밀폐 공간에 두지 말고, 약 용량을 댓글로 정하지 마세요.'],
            ['관련', '차 안 방치·과열 수면 안내를 참고하세요.']
        ],
        links: [
            ['CDC 아동 더위', 'https://www.cdc.gov/extreme-heat/prevention/index.html'],
            ['AAP 더위 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Protecting-Children-from-Extreme-Heat-Information-for-Parents.aspx']
        ]
    },
    {
        id: 'return-to-play-pain-boundary',
        match: /(운동\s*복귀\s*통증|다친\s*뒤\s*시합|return\s*to\s*play|부상\s*후\s*경기|아직\s*아픈데\s*운동)/,
        title: '다친 뒤 통증이 남거나 뇌진탕 의심이면 시합 복귀는 의료진 기준을 따르세요',
        lead: '아픈데도 경기에 나가면 재부상 위험이 커집니다. 코치만의 판단이 아니라 의료 평가를 우선하세요.',
        points: [
            ['기준', '통증 없음, 의료 허가'],
            ['중단', '어지럼, 두통, 절뚝']
        ],
        blocks: [
            ['지금 할 일', '증상을 코치에게 숨기지 않게 하세요.'],
            ['하지 않을 일', '아프다고 하면서 뛰게 강요하지 마세요.'],
            ['관련', '뇌진탕·스포츠 검진 안내를 참고하세요.']
        ],
        links: [
            ['CDC Heads Up', 'https://www.cdc.gov/heads-up/'],
            ['AAP 스포츠', 'https://www.healthychildren.org/English/healthy-living/sports/Pages/default.aspx']
        ]
    },
    {
        id: 'sports-physical-exam-boundary',
        match: /(스포츠\s*신체검사|운동\s*신체검사|sports\s*physical|학교\s*운동\s*검진|체육\s*참가\s*검진)/,
        title: '학교·클럽 운동 전 신체검사는 시설·의료진 양식을 따르고, 온라인으로 합격을 단정하지 마세요',
        lead: '스포츠 참가 전 검진은 병력·증상을 확인합니다. 가슴 통증·실신 병력은 숨기지 마세요. 양식은 학교 규정을 따릅니다.',
        points: [
            ['준비', '병력, 약, 과거 부상'],
            ['상담', '가슴 통증, 실신, 천식, 뇌진탕 병력']
        ],
        blocks: [
            ['지금 할 일', '학교 양식과 마감일을 확인하세요.'],
            ['하지 않을 일', '증상을 숨기고 서명만 받지 마세요.'],
            ['관련', '뇌진탕·운동 안내를 참고하세요.']
        ],
        links: [
            ['AAP 스포츠', 'https://www.healthychildren.org/English/healthy-living/sports/Pages/default.aspx'],
            ['CDC Heads Up', 'https://www.cdc.gov/heads-up/']
        ]
    },
    {
        id: 'soccer-headgear-boundary',
        match: /(축구\s*헤드기어|축구\s*머리\s*보호|soccer\s*headgear|축구\s*헤드밴드\s*보호|헤딩\s*보호\s*장비)/,
        title: '축구 머리 보호 장비는 일부 충격을 줄일 수 있으나, 헤딩·충돌 규칙을 함께 지키세요',
        lead: '장비가 뇌진탕을 완전히 막지는 않습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['원칙', '규칙, 증상 관찰'],
            ['의심', '경기 중단·진료']
        ],
        blocks: [
            ['지금 할 일', '머리 충격 후 증상을 숨기지 않게 하세요.'],
            ['하지 않을 일', '어지러운데 계속 뛰게 두지 마세요.'],
            ['관련', '뇌진탕 안내를 참고하세요.']
        ],
        links: [
            ['CDC Heads Up', 'https://www.cdc.gov/heads-up/'],
            ['AAP 스포츠', 'https://www.healthychildren.org/English/healthy-living/sports/Pages/default.aspx']
        ]
    },
    {
        id: 'concussion-return-boundary',
        match: /(뇌진탕\s*복귀|concussion\s*return|머리\s*다친\s*뒤\s*운동|스포츠\s*뇌진탕|경기\s*복귀\s*머리)/,
        title: '머리 충격 후 어지럼·구토·의식 변화가 있으면 운동 복귀를 서두르지 말고 진료를 받으세요',
        lead: '뇌진탕 의심 시 당일 경기로 바로 복귀하지 않는 것이 중요합니다. 증상 평가와 단계적 복귀는 의료진 안내를 따르세요. 사이트에서 복귀 일수를 단정하지 않습니다.',
        points: [
            ['즉시', '경기 중단, 관찰, 악화 시 응급실'],
            ['복귀', '의료진 허가, 단계적 활동']
        ],
        blocks: [
            ['지금 할 일', '증상(두통·구토·혼란)을 기록하세요.'],
            ['하지 않을 일', '“괜찮다”며 바로 다시 뛰게 하지 마세요.'],
            ['관련', '머리 부딪힘·낙상 안내를 참고하세요.']
        ],
        links: [
            ['CDC 뇌진탕', 'https://www.cdc.gov/heads-up/'],
            ['AAP 스포츠 부상 개요', 'https://www.healthychildren.org/English/health-issues/injuries-emergencies/sports-injuries/Pages/default.aspx']
        ]
    },
    {
        id: 'sports-head-impact-sideline-boundary',
        match: /(운동\s*머리\s*부딪|경기\s*중\s*머리|sports\s*head\s*impact|헤딩\s*어지러|시합\s*머리\s*맞|스포츠\s*머리\s*충격)/,
        title: '운동 중 머리 충격 후 어지럼·구토·혼란이 있으면 즉시 빼고 진료를 검토하세요',
        lead: '같은 날 복귀는 위험할 수 있습니다. 코치·선수 판단을 의료 평가보다 앞세우지 마세요.',
        points: [
            ['즉시', '경기 중단, 관찰'],
            ['진료', '의식, 구토, 심한 두통']
        ],
        blocks: [
            ['지금 할 일', '증상을 숨기지 않게 하세요.'],
            ['하지 않을 일', '어지러운데 계속 뛰게 두지 마세요.'],
            ['관련', '뇌진탕 안내를 참고하세요.']
        ],
        links: [
            ['CDC Heads Up', 'https://www.cdc.gov/heads-up/'],
            ['AAP 스포츠', 'https://www.healthychildren.org/English/healthy-living/sports/Pages/default.aspx']
        ]
    },
    {
        id: 'head-bump-after-fall',
        match: /(머리\s*부딪|머리\s*다쳤|머리\s*충격|충격\s*후\s*머리|넘어져\s*머리|후두부\s*부딪|두피\s*혹)/,
        title: '머리를 부딪힌 뒤에는 의식·구토·처짐을 보고 관찰합니다',
        lead: '가벼운 부딪힘 후에도 혹·울음은 흔할 수 있지만, 의식 소실·반복 구토·경련·한쪽 마비·계속되는 처짐·심한 두통(표현 가능한 아이)이 있으면 바로 진료·119입니다. 자를 먹이거나 흔들어 깨우기 같은 민간 대응은 피하세요. 영아는 증상이 애매할 수 있어 보호자 직감이 위험하면 진료를 우선합니다.',
        points: [
            ['관찰', '2–24시간 반응·구토·보챔·수면 양상(억지 각성 X, 평소와 다른 깨우기 어려움 주의)'],
            ['즉시', '의식 없음, 경련, 귀·코 피·맑은 액, 동공 이상, 심한 처짐']
        ],
        blocks: [
            ['지금 할 일', '넘어진 높이·바닥·의식 여부·구토 횟수를 기록하세요.'],
            ['하지 않을 일', '진통제 용량을 댓글로 맞추거나, 증상을 술로 깨우려 하지 마세요.'],
            ['관련', '낙상 예방·열성경련 안내를 참고하세요.']
        ],
        links: [
            ['CDC 뇌진탕·머리 부상', 'https://www.cdc.gov/heads-up/'],
            ['NHS 머리 부상', 'https://www.nhs.uk/conditions/head-injury-and-concussion/'],
            ['낙상 예방', '#home']
        ]
    },
    {
        id: 'tooth-injury',
        match: /(치아\s*부러|이\s*부러|이\s*빠|젖니\s*외상|치아\s*외상|부딪.*이\s*깨|이빨\s*깨)/,
        title: '치아 외상은 빠르게 치과·의료 연락을 하고, 빠진 치아 처리는 연령에 따릅니다',
        lead: '부딪혀 이가 금가거나 빠지면 지혈·통증·호흡을 먼저 보고 소아치과·응급실 안내를 따르세요. 영구치와 젖니의 재식 가능 여부가 다릅니다. 사이트에서 자가 재식 절차를 단정하거나 약 용량을 정하지 않습니다. 파상풍·감염 여부는 의료진이 봅니다.',
        points: [
            ['당장', '출혈 압박, 숨·의식 확인, 조각·치아 보관 방법 문의'],
            ['진료', '빠짐·흔들림·잇몸 열상·턱 통증은 당일 상담']
        ],
        blocks: [
            ['지금 할 일', '사고 시각과 어느 치아인지 사진보다 글로 남기고 치과에 연락하세요.'],
            ['하지 않을 일', '빠진 치아를 비누로 문질러 닦지 말고, 임의 항생제를 주지 마세요.'],
            ['관련', '양치·낙상 예방 안내를 참고하세요.']
        ],
        links: [
            ['AAP 치과 응급', 'https://www.healthychildren.org/English/tips-tools/symptom-checker/Pages/symptomviewer.aspx?symptom=Tooth+Injury'],
            ['양치 기준', 'market/toddler-toothbrush-guide.html#standard']
        ]
    },
    {
        id: 'bounce-house-wind-anchor-boundary',
        match: /(에어바운스\s*바람|바운스\s*하우스\s*고정|bounce\s*house\s*wind|에어\s*놀이\s*날림|풍선\s*성\s*고정)/,
        title: '에어바운스는 고정·바람 조건을 확인하고, 정원 초과·신발을 신지 마세요',
        lead: '강풍에 날아가는 사고가 있습니다. 성인 감독과 정원 준수가 중요합니다.',
        points: [
            ['설치', '앵커, 바람'],
            ['이용', '정원, 감독']
        ],
        blocks: [
            ['지금 할 일', '고정 장치를 점검하세요.'],
            ['하지 않을 일', '바람 부는 날 무리하게 설치하지 마세요.'],
            ['관련', '바운스 하우스 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'bounce-house-shoes-boundary',
        match: /(에어바운스\s*신발|에어바운스\s*신발|바운스\s*하우스\s*양말|bounce\s*house\s*shoes)/,
        title: '에어바운스는 시설 규칙(양말 등)을 지키고 정원·감독을 확인하세요',
        lead: '강풍·과적은 위험합니다. 업체 순위는 하지 않습니다.',
        points: [
            ['규칙', '정원, 양말'],
            ['금지', '과적, 거친 장난']
        ],
        blocks: [
            ['지금 할 일', '규칙을 읽고 들어가세요.'],
            ['하지 않을 일', '아픈 아이를 억지로 뛰게 하지 마세요.'],
            ['관련', '바운스 하우스 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'bounce-house-inflatable-safety',
        match: /(에어\s*바운스|바운스\s*하우스|에어\s*점프|inflatable\s*bounce|풍선\s*성|에어\s*놀이매트\s*점프|바운시\s*캐슬)/,
        title: '에어바운스·바운스 하우스는 인원·바람·감독 규칙을 지키고, 성인 감독 없이 두지 마세요',
        lead: '풍선 놀이기구는 충돌·낙하·뒤집힘·질식 사고가 날 수 있습니다. 권장 인원·키 제한을 지키고, 고정·바람 경보를 확인하세요. 작은 아이와 큰 아이를 섞지 않는 편이 안전합니다. 특정 업체 추천은 하지 않습니다.',
        points: [
            ['운영', '감독, 인원 제한, 신발·안경 제거, 고정'],
            ['위험', '강풍, 과밀, 목 감기 놀이기구 겹침']
        ],
        blocks: [
            ['지금 할 일', '이용 전 안전 수칙과 연령 표시를 확인하세요.'],
            ['하지 않을 일', '뒤집힌 채 위에 올라타거나 밀치는 놀이를 하지 마세요.'],
            ['관련', '트램폴린·놀이터 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 팽창 놀이기구 안전', 'https://www.cpsc.gov/'],
            ['AAP 놀이 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'trampoline-one-at-a-time-boundary',
        match: /(트램폴린\s*한\s*명|트램폴린\s*여러\s*명|trampoline\s*one|트램폴린\s*안전망\s*점검)/,
        title: '트램폴린은 한 명씩, 안전망·패딩을 점검하고 공중제비를 하지 마세요',
        lead: '여러 명이 동시에 뛰면 충돌 부상이 늘어납니다. 성인 감독과 한 명 규칙이 중요합니다.',
        points: [
            ['규칙', '한 명, 감독, 공중제비 금지'],
            ['점검', '스프링 커버, 그물']
        ],
        blocks: [
            ['지금 할 일', '안전망과 패딩을 확인하세요.'],
            ['하지 않을 일', '여러 아이를 한꺼번에 태우지 마세요.'],
            ['관련', '트램폴린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 트램폴린', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Trampolines-What-You-Need-to-Know.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'trampoline-park-safety-boundary',
        match: /(트램폴린\s*공원|트램폴린\s*파크|trampoline\s*park|점프\s*파크\s*아이|실내\s*트램폴린)/,
        title: '트램폴린 공원도 규칙을 지키고, 어린 아이는 성인 감독·연령 구역을 확인하세요',
        lead: '시설이라도 부상 위험이 있습니다. 공중제비·여러 명 충돌을 피하세요. 업체 순위는 하지 않습니다.',
        points: [
            ['이용', '규칙, 연령 구역, 양말'],
            ['금지', '무리한 기술']
        ],
        blocks: [
            ['지금 할 일', '시설 안전 규칙을 읽고 들어가세요.'],
            ['하지 않을 일', '아픈데 계속 뛰게 두지 마세요.'],
            ['관련', '트램폴린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 트램폴린', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Trampolines-What-You-Need-to-Know.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'mini-trampoline-indoor-boundary',
        match: /(트램폴린\s*미니\s*실내)/,
        title: '미니 트램폴린도 한 명·감독·천장 높이를 보고, 공중제비를 하지 마세요',
        lead: '가구 근처 설치를 피하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['규칙', '한 명, 감독'],
            ['환경', '여유 공간']
        ],
        blocks: [
            ['지금 할 일', '주변에 날카로운 가구를 치우세요.'],
            ['하지 않을 일', '여러 명이 같이 뛰지 마세요.'],
            ['관련', '트램폴린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 트램폴린', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Trampolines-What-You-Need-to-Know.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'trampoline-net-hole-boundary',
        match: /(트램폴린\s*안전망\s*구멍|트램폴린\s*안전망\s*구멍|트램폴린\s*그물\s*찢|trampoline\s*net\s*hole)/,
        title: '안전망·패딩이 찢어지면 사용을 중단하고 수리·교체하세요',
        lead: '여러 명 동시 이용을 피하세요.',
        points: [
            ['점검', '그물, 패딩'],
            ['금지', '파손 상태 사용']
        ],
        blocks: [
            ['지금 할 일', '타기 전 점검하세요.'],
            ['하지 않을 일', '구멍 난 채로 뛰지 마세요.'],
            ['관련', '트램폴린 안내를 참고하세요.']
        ],
        links: [
            ['AAP 트램폴린', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Trampolines-What-You-Need-to-Know.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'trampoline-danger',
        match: /(트램폴린|방방\s*이|트램폴린\s*안전|가정용\s*트램폴린)/,
        title: '어린이 트램폴린은 골절·머리 부상 위험이 커서 권하지 않는 안내가 많습니다',
        lead: '가정·놀이 트램폴린은 낙상·충돌·스프링 끼임으로 부상이 잦다는 안전 안내가 있습니다. 여러 명이 동시에 뛰거나 어린 아이를 올리는 것도 위험합니다. 안전망만으로 충분하지 않습니다. 제품 브랜드 추천은 하지 않습니다.',
        points: [
            ['위험', '여러 명 동시, 어린 영아, 공중제비, 보호자 부재'],
            ['대안', '바닥 놀이·연령 맞는 야외 활동, 감독']
        ],
        blocks: [
            ['지금 할 일', '집에 있으면 사용 규칙·감독을 엄격히 하거나 치우세요.'],
            ['하지 않을 일', '아기를 성인과 함께 트램폴린에 올리지 마세요.'],
            ['응급', '머리·목 통증, 의식, 팔다리 움직임 이상은 119·진료']
        ],
        links: [
            ['AAP 트램폴린', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Trampolines-What-You-Need-to-Know.aspx'],
            ['CDC 아동 부상 예방 개요', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'bike-rack-child-seat-boundary',
        match: /(자전거\s*짐받이\s*아이|자전거\s*뒷자리\s*아기|bike\s*rear\s*child\s*seat|사이클\s*아이\s*시트|자전거\s*유아\s*안장)/,
        title: '자전거 유아 시트는 헬멧·고정·연령 한도를 지키고, 교통량이 많은 도로를 피하세요',
        lead: '전복·문 열림 충돌 위험이 있습니다. 제품 설명서와 헬멧이 필수입니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 벨트, 한도'],
            ['환경', '안전한 경로']
        ],
        blocks: [
            ['지금 할 일', '아이 헬멧을 착용하세요.'],
            ['하지 않을 일', '한 손 운전·야간 혼잡 도로를 피하세요.'],
            ['관련', '자전거 트레일러·헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 자전거', 'https://www.cdc.gov/transportationsafety/bicycle/']
        ]
    },
    {
        id: 'bike-trailer-helmet-boundary',
        match: /(자전거\s*트레일러\s*헬멧)/,
        title: '자전거 트레일러·시트 아이도 헬멧과 벨트·한도를 지키세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 벨트'],
            ['환경', '안전한 경로']
        ],
        blocks: [
            ['지금 할 일', '헬멧 핏을 확인하세요.'],
            ['하지 않을 일', '차도 혼잡 구간을 피하세요.'],
            ['관련', '트레일러·헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 자전거', 'https://www.cdc.gov/transportationsafety/bicycle/']
        ]
    },
    {
        id: 'bike-trailer-child-safety',
        match: /(자전거\s*트레일러|바이크\s*트레일러|bike\s*trailer|자전거\s*뒤\s*유모차|자전거\s*연결\s*시트)/,
        title: '자전거 트레일러·연결 시트는 헬멧·벨트·교통 규칙을 지키고, 도로 상황에 맞게 쓰세요',
        lead: '자전거에 아이를 태우는 트레일러·시트는 전복·충돌 위험이 있습니다. 연령·체중 제한, 안전벨트, 아이 헬멧(제품·지역 안내), 밝은 주간·안전한 경로를 지키세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '벨트, 헬멧, 깃발·라이트, 체중 제한'],
            ['환경', '혼잡 도로 피하기, 음주·한손 운전 금지']
        ],
        blocks: [
            ['지금 할 일', '벨트·바퀴·연결 부속을 점검하세요.'],
            ['하지 않을 일', '헬멧 없이 차로에 태워 달리지 마세요.'],
            ['관련', '헬멧·유모차·카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 자전거 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Bicycle-Safety-Making-Sure-Your-Child-is-Ready.aspx'],
            ['CDC 자전거 안전', 'https://www.cdc.gov/transportationsafety/bicycle/']
        ]
    },
    {
        id: 'balance-bike-safety',
        match: /(밸런스\s*바이크|balance\s*bike|러닝\s*바이크|페달\s*없는\s*자전거|스트라이더)/,
        title: '밸런스 바이크는 헬멧을 쓰고, 평지·감독 아래에서 타게 하세요',
        lead: '페달 없는 자전거도 넘어짐·충돌이 납니다. 헬멧, 닫힌 신발, 차도 금지가 기본입니다. 연령·키 제한은 제품 안내를 따르세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 적절한 안장 높이, 브레이크 유무 확인'],
            ['환경', '평지, 차도 금지, 감독']
        ],
        blocks: [
            ['지금 할 일', '헬멧이 눈썹 위 두 손가락 위치인지 확인하세요.'],
            ['하지 않을 일', '내리막·차도에서 타게 두지 마세요.'],
            ['관련', '헬멧·자전거 트레일러 안내를 참고하세요.']
        ],
        links: [
            ['AAP 자전거 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Bicycle-Safety-Making-Sure-Your-Child-is-Ready.aspx'],
            ['CDC 자전거 안전', 'https://www.cdc.gov/transportationsafety/bicycle/']
        ]
    },
    {
        id: 'e-scooter-child-safety',
        match: /(전동\s*킥보드|전기\s*킥보드|전동\s*스쿠터|아이\s*킥보드\s*도로|e-?\s*scooter)/,
        title: '어린이 전동 킥보드·도로 주행은 헬멧·보호 장비와 교통 규칙을 지키고, 어린 영아와 함께 타지 마세요',
        lead: '전동 킥보드는 속도·낙상 위험이 큽니다. 연령 제한·헬멧·야간 장비·보도 주행 금지 등 지역 규칙을 따르세요. 유아를 앞에 태우거나 안은 채 타는 것은 위험합니다. 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 보호대, 브레이크 상태'],
            ['환경', '도로·보도 규정, 어두운 곳·빗길 주의']
        ],
        blocks: [
            ['지금 할 일', '지역 연령·주행 규칙을 확인하세요.'],
            ['하지 않을 일', '헬멧 없이·유아를 태운 채 타지 마세요.'],
            ['관련', '헬멧·머리 부상 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 이륜·스쿠터 안전 개요', 'https://www.nhtsa.gov/'],
            ['AAP 바퀴 달린 놀이기구·헬멧', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Bicycle-Helmets-What-Every-Parent-Should-Know.aspx']
        ]
    },
    {
        id: 'kick-scooter-child-safety',
        match: /(발\s*킥보드|킥\s*스쿠터|kick\s*scooter|발이\s*미는\s*스쿠터|수동\s*킥보드)/,
        title: '발 킥보드는 헬멧을 쓰고, 차도·내리막·야간을 피하세요',
        lead: '전동 킥보드와 달리 발로 미는 킥보드도 넘어짐·충돌이 납니다. 헬멧, 닫힌 신발, 평평한 인도가 기본입니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 맞는 손잡이 높이'],
            ['환경', '인도, 차도 금지, 감독']
        ],
        blocks: [
            ['지금 할 일', '헬멧 착용 습관을 고정하세요.'],
            ['하지 않을 일', '차도·주차장에서 타게 두지 마세요.'],
            ['관련', '전동킥보드·헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상 예방', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'skate-park-safety-boundary',
        match: /(스케이트\s*파크|skate\s*park|보드\s*공원|인라인\s*파크|킥보드\s*파크)/,
        title: '스케이트 파크는 헬멧을 쓰고 초보 구역부터, 큰 램프는 실력에 맞게 하세요',
        lead: '파크 시설은 충돌·낙상 위험이 큽니다. 보호 장비와 규칙을 지키고 붐비는 시간을 피하세요.',
        points: [
            ['장비', '헬멧, 보호대'],
            ['이용', '초보 구역, 규칙']
        ],
        blocks: [
            ['지금 할 일', '파크 규칙과 헬멧 의무를 확인하세요.'],
            ['하지 않을 일', '실력 넘는 높은 램프에 바로 가지 마세요.'],
            ['관련', '스케이트보드·킥보드 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 자전거 안전', 'https://www.cdc.gov/transportationsafety/bicycle/']
        ]
    },
    {
        id: 'board-pad-set-boundary',
        match: /(보드\s*보호대\s*세트|보드\s*보호대\s*세트|스케이트\s*보호대\s*풀세트|board\s*pad\s*set\s*child)/,
        title: '보드·인라인은 헬멧을 우선하고 보호대는 맞게 착용하세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '헬멧'],
            ['추가', '손목·무릎']
        ],
        blocks: [
            ['지금 할 일', '헬멧을 흔들리지 않게 하세요.'],
            ['하지 않을 일', '보호대만 믿고 차도에서 타지 마세요.'],
            ['관련', '보드·헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'skateboard-child-safety',
        match: /(스케이트보드\s*아이|skateboard\s*kid|보드\s*타기\s*아이|스케이드\s*보드\s*어린이)/,
        title: '스케이트보드는 헬멧·보호구를 쓰고, 차도·급경사를 피하세요',
        lead: '넘어짐·머리 부상 위험이 큽니다. 헬멧, 닫힌 신발, 평평한 공원 등에서 감독 아래 타게 하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 손목·무릎 보호(선택), 맞는 보드'],
            ['환경', '차도 금지, 야간 자제, 감독']
        ],
        blocks: [
            ['지금 할 일', '헬멧이 흔들리지 않는지 조이세요.'],
            ['하지 않을 일', '차도·주차장에서 타게 두지 마세요.'],
            ['관련', '헬멧·킥보드·자전거 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이·스포츠 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 자전거·휠 스포츠 안전', 'https://www.cdc.gov/transportationsafety/bicycle/']
        ]
    },
    {
        id: 'roller-inline-skate-safety',
        match: /(인라인\s*스케이트|롤러블레이드|roller\s*blade|인라인\s*아이|롤러\s*스케이트\s*아이)/,
        title: '인라인·롤러 스케이트는 헬멧과 보호구를 쓰고, 평지에서 배우세요',
        lead: '넘어져 손목·머리 부상이 흔합니다. 헬멧·손목 보호를 권하고, 차도·가파른 내리막을 피하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 손목·무릎·팔꿈치 보호'],
            ['장소', '평지, 차도 금지, 감독']
        ],
        blocks: [
            ['지금 할 일', '보호구 착용 후 잔디·평지에서 연습하세요.'],
            ['하지 않을 일', '내리막에서 속도를 이기지 못한 채 타지 마세요.'],
            ['관련', '헬멧·킥보드 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상 예방', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'training-wheels-bike-boundary',
        match: /(보조\s*바퀴|트레이닝\s*휠|training\s*wheels|보조바퀴\s*자전거|네\s*발\s*자전거\s*아이)/,
        title: '보조 바퀴 자전거도 헬멧이 필요하고, 차도·가파른 내리막을 피하세요',
        lead: '보조 바퀴가 있어도 넘어질 수 있습니다. 헬멧, 맞는 안장 높이, 평지 연습이 우선입니다. 밸런스 바이크와 선택은 아이 발달·관심에 맡기고 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 안장·핸들 높이, 브레이크'],
            ['환경', '평지, 차도 금지, 감독']
        ],
        blocks: [
            ['지금 할 일', '헬멧과 타이어 공기압을 점검하세요.'],
            ['하지 않을 일', '차도에서 “잠깐” 타게 두지 마세요.'],
            ['관련', '헬멧·밸런스 바이크 안내를 참고하세요.']
        ],
        links: [
            ['AAP 자전거 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Bicycle-Safety-Making-Sure-Your-Child-is-Ready.aspx'],
            ['CDC 자전거 안전', 'https://www.cdc.gov/transportationsafety/bicycle/']
        ]
    },
    {
        id: 'sports-eye-protection-boundary',
        match: /(스포츠\s*보호\s*안경|운동\s*고글|sports\s*eye\s*protection|라켓\s*눈\s*보호|야구\s*눈\s*보호|보호\s*안경\s*스포츠)/,
        title: '공·라켓 운동에서는 상황에 맞는 눈 보호가 부상을 줄이는 데 도움이 될 수 있습니다',
        lead: '눈 부상은 영구적일 수 있습니다. 종목·연령에 맞는 보호 장비를 검토하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['검토', '종목, 공 속도, 연령'],
            ['증상', '통증, 시야 이상 → 진료']
        ],
        blocks: [
            ['지금 할 일', '코치·시설 안전 규칙을 확인하세요.'],
            ['하지 않을 일', '눈에 맞은 뒤 시야 이상을 무시하지 마세요.'],
            ['관련', '스포츠·눈 안내를 참고하세요.']
        ],
        links: [
            ['AAP 스포츠', 'https://www.healthychildren.org/English/healthy-living/sports/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'hard-ball-sports-safety',
        match: /(딱딱한\s*공\s*놀이|하드볼\s*아이|hard\s*ball\s*child|야구공\s*머리|골프공\s*아이\s*놀이)/,
        title: '딱딱한 공은 얼굴·머리 부상을 키울 수 있어 연령·보호 장비와 감독을 맞추세요',
        lead: '어린 아이에게 성인용 딱딱한 공을 가까이 던지지 마세요. 소프트 볼·보호 장비를 검토하세요.',
        points: [
            ['선택', '연령 적합 공, 거리'],
            ['보호', '헬멧·감독']
        ],
        blocks: [
            ['지금 할 일', '얼굴 높이 강투를 피하세요.'],
            ['하지 않을 일', '실내에서 골프공처럼 딱딱한 공을 던지지 마세요.'],
            ['관련', '스포츠·머리 부상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 스포츠', 'https://www.healthychildren.org/English/healthy-living/sports/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'baseball-helmet-safety',
        match: /(야구\s*헬멧|베이스볼\s*헬멧|baseball\s*helmet|타자\s*헬멧|소프트볼\s*헬멧)/,
        title: '야구·소프트볼 타석과 주루에서는 맞는 헬멧을 쓰고, 금이 간 헬멧은 교체하세요',
        lead: '공·배트에 맞는 충격을 줄이려면 헬멧이 중요합니다. 사이즈와 턱끈을 확인하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['착용', '맞는 사이즈, 턱끈'],
            ['교체', '금, 큰 충격 후']
        ],
        blocks: [
            ['지금 할 일', '헬멧이 흔들리지 않게 조절하세요.'],
            ['하지 않을 일', '금이 간 헬멧을 쓰지 마세요.'],
            ['관련', '뇌진탕·헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 스포츠', 'https://www.healthychildren.org/English/healthy-living/sports/Pages/default.aspx'],
            ['CDC Heads Up', 'https://www.cdc.gov/heads-up/']
        ]
    },
    {
        id: 'basketball-hoop-tipover',
        match: /(농구대\s*넘어|농구\s*골대\s*쓰러|basketball\s*hoop\s*tip|농구대\s*매달|이동식\s*농구대)/,
        title: '이동식 농구대에 매달리지 말고, 받침에 물을 채우거나 고정했는지 확인하세요',
        lead: '농구대 전복은 중상을 낼 수 있습니다. 테두리에 매달리지 말고 제조사 고정 지침을 따르세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['고정', '받침 무게, 고정 장치'],
            ['금지', '테두리 매달리기']
        ],
        blocks: [
            ['지금 할 일', '받침이 충분한지 점검하세요.'],
            ['하지 않을 일', '농구대에 매달리게 두지 마세요.'],
            ['관련', '가구 전도·놀이 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'elbow-knee-pad-boundary',
        match: /(팔꿈치\s*보호대|무릎\s*보호대|elbow\s*pad|knee\s*pad|보호대\s*세트\s*아이)/,
        title: '바퀴 놀이에는 헬멧이 우선이고, 무릎·팔꿈치 보호대는 넘어짐 부상을 줄이는 데 도움이 될 수 있습니다',
        lead: '보호대가 모든 부상을 막지는 않습니다. 헬멧을 먼저 쓰고 사이즈에 맞게 보호대를 착용하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '헬멧'],
            ['추가', '무릎·팔꿈치·손목']
        ],
        blocks: [
            ['지금 할 일', '보호대가 헐렁하지 않은지 확인하세요.'],
            ['하지 않을 일', '헬멧 없이 보호대만 믿지 마세요.'],
            ['관련', '킥보드·인라인 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상 예방', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'roller-rink-safety-boundary',
        match: /(롤러\s*스케이트\s*장|롤러장|roller\s*rink|인라인\s*링크\s*아이|롤러코트)/,
        title: '롤러장에서는 헬멧·보호대를 쓰고, 초보는 난간·느린 구역에서 시작하세요',
        lead: '혼잡한 시간대 충돌이 많습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 손목 보호'],
            ['이용', '초보 구역, 감독']
        ],
        blocks: [
            ['지금 할 일', '붐비는 시간을 피하세요.'],
            ['하지 않을 일', '역주행·밀치기를 하지 마세요.'],
            ['관련', '인라인·헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'helmet-certification-fit-boundary',
        match: /(헬멧\s*인증|헬멧\s*규격|helmet\s*certif|헬멧\s*사이즈\s*맞|자전거\s*헬멧\s*고르)/,
        title: '헬멧은 맞는 사이즈와 인증 표시를 확인하고, 눈·귀 위치가 올바른지 보세요',
        lead: '너무 크거나 뒤로 젖혀지면 보호가 약해집니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['핏', '수평, 끈, 눈 위 여유'],
            ['교체', '큰 충격 후, 금']
        ],
        blocks: [
            ['지금 할 일', '헬멧이 이마를 덮는지 확인하세요.'],
            ['하지 않을 일', '모자 위에 억지로 쓰지 마세요.'],
            ['관련', '헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 자전거', 'https://www.cdc.gov/transportationsafety/bicycle/']
        ]
    },
    {
        id: 'helmet-after-crash-replace-boundary',
        match: /(헬멧\s*충격\s*후|헬멧\s*사고\s*후\s*교체|helmet\s*after\s*crash|헬멧\s*부딪힌\s*뒤|헬멧\s*금\s*가)/,
        title: '헬멧이 크게 충격을 받았거나 금이 가면 교체를 검토하고, 계속 쓰지 마세요',
        lead: '겉이 멀쩡해 보여도 보호력이 줄 수 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['점검', '금, 찌그러짐'],
            ['행동', '교체']
        ],
        blocks: [
            ['지금 할 일', '충격 이력을 확인하세요.'],
            ['하지 않을 일', '금 간 헬멧을 쓰지 마세요.'],
            ['관련', '헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'inline-wrist-guard-boundary',
        match: /(인라인\s*손목\s*보호|롤러\s*손목\s*가드|inline\s*wrist\s*guard|스케이트\s*손목\s*대)/,
        title: '인라인·롤러는 헬멧과 함께 손목 보호를 검토하고, 초보는 평지에서 배우세요',
        lead: '보호대가 모든 부상을 막지는 않습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['장비', '헬멧, 손목'],
            ['장소', '평지, 감독']
        ],
        blocks: [
            ['지금 할 일', '헬멧을 먼저 쓰세요.'],
            ['하지 않을 일', '차도에서 타지 마세요.'],
            ['관련', '인라인·헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'scooter-brake-check-boundary',
        match: /(킥보드\s*브레이크)/,
        title: '킥보드는 브레이크·접힘 잠금·헬멧을 확인하고, 내리막·차도를 피하세요',
        lead: '전동 킥보드와 혼동하지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['점검', '브레이크, 접힘'],
            ['장비', '헬멧']
        ],
        blocks: [
            ['지금 할 일', '타기 전 브레이크를 시험하세요.'],
            ['하지 않을 일', '차도에서 타게 두지 마세요.'],
            ['관련', '킥보드·헬멧 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'bike-hand-signal-child-boundary',
        match: /(자전거\s*손\s*신호|자전거\s*방향\s*표시|bike\s*hand\s*signal\s*child|사이클\s*손짓\s*아이)/,
        title: '아이와 자전거를 탈 때는 헬멧을 쓰고 교통 규칙을 가르치며, 차도를 피하세요',
        lead: '손 신호보다 안전한 경로·헬멧이 우선입니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '헬멧, 안전한 길'],
            ['금지', '차도·야간 혼잡']
        ],
        blocks: [
            ['지금 할 일', '헬멧 핏을 확인하세요.'],
            ['하지 않을 일', '이어폰을 끼고 타게 두지 마세요.'],
            ['관련', '헬멧·자전거 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 자전거', 'https://www.cdc.gov/transportationsafety/bicycle/']
        ]
    },
    {
        id: 'bike-helmet-safety',
        match: /(헬멧|자전거\s*헬멧|킥보드\s*헬멧|스케이\s*헬멧|머리\s*보호구).*(아이|아기|어린이)?|(아이|아기).*(자전거|킥보드).*(헬멧|안전)/,
        title: '자전거·킥보드 등에서는 헬멧을 쓰고, 맞음새와 교체를 확인하세요',
        lead: '바퀴 달린 놀이기구는 머리 부상 위험이 있습니다. 연령·머리 크기에 맞는 헬멧을 바르게 쓰고, 사고가 난 헬멧은 교체하는 안내가 많습니다. 브랜드 순위는 하지 않습니다. 도로는 보호자 감독이 우선입니다.',
        points: [
            ['착용', '이마를 덮고 수평, 턱끈 고정, 흔들림 적게'],
            ['교체', '강한 충격 후·균열 시 교체']
        ],
        blocks: [
            ['지금 할 일', '헬멧이 눈을 가리거나 뒤로 밀리지 않는지 확인하세요.'],
            ['하지 않을 일', '헬멧 없이 경사진 길·도로에서 타게 하지 마세요.'],
            ['관련', '머리 부딪힘·낙상 안내를 참고하세요.']
        ],
        links: [
            ['NHTSA 자전거 안전', 'https://www.nhtsa.gov/bicycle-safety'],
            ['AAP 헬멧', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Bicycle-Helmets-What-Every-Parent-Should-Know.aspx']
        ]
    },
    {
        id: 'vitamin-gummy-overdose-boundary',
        match: /(비타민\s*젤리\s*과다|어린이\s*비타민\s*많이|vitamin\s*gummy\s*overdose|종합비타민\s*과다|비타민\s*사탕\s*많이|비타민\s*과다\s*섭취)/,
        title: '비타민 젤리를 사탕처럼 방치하지 말고, 많이 먹었다면 중독 상담·진료를 하세요',
        lead: '철분 등 일부 성분은 과량이 위험합니다. 표시 용량을 지키고 잠가 두세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['보관', '잠금, 성인 관리'],
            ['과다', '상담, 진료']
        ],
        blocks: [
            ['지금 할 일', '비타민을 간식 그릇에 두지 마세요.'],
            ['하지 않을 일', '하루 용량 이상 주지 마세요.'],
            ['관련', '철분·중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'iron-gummy-poison-boundary',
        match: /(철분제\s*삼|철분\s*과량|젤리\s*비타민\s*삼|영양제\s*많이\s*먹|아이\s*철분|iron\s*poison|gummy\s*vitamin\s*eat)/,
        title: '철분제·젤리 비타민을 많이 삼켰으면 토하게 하지 말고 중독 상담·응급실을 이용하세요',
        lead: '철분 과량은 어린이에게 위험할 수 있고, 알록달록한 젤리 영양제도 과량 섭취가 쉽습니다. 원래 용기에 잠가 두고, 삼켰으면 양·제품명을 확인한 뒤 토하게 강제하지 마세요. 해독·용량 처방은 사이트에서 하지 않습니다.',
        points: [
            ['예방', '잠금 수납, 사탕과 분리, 방문객 가방 주의'],
            ['노출', '토하게 금지, 상담·응급실, 용기 가져가기']
        ],
        blocks: [
            ['지금 할 일', '삼킨 대략 개수와 제품명을 적으세요.'],
            ['하지 않을 일', '우유를 억지로 먹여 “중화”하려 하지 마세요.'],
            ['관련', '약 잠금·중독 안내를 참고하세요.']
        ],
        links: [
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/'],
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['약 잠금 안내', '#home']
        ]
    },
    {
        id: 'firearm-safe-storage-boundary',
        match: /(총기|총\s*보관|총\s*안전|firearm|gun\s*safe|총\s*아이|권총\s*집|총알\s*보관)/,
        title: '총기·탄약은 잠금 장치에 따로 보관하고, 아이 손 닿지 않게 하세요',
        lead: '가정 내 총기 사고는 호기심으로도 날 수 있습니다. 장전하지 않은 상태로 잠그고, 탄약은 별도 잠금 수납에 두며, 아이 앞에서 장난·과시하지 마세요. 특정 금고 브랜드 순위는 하지 않습니다. 지역 법·보관 규정은 관할 안내를 따릅니다.',
        points: [
            ['보관', '잠금, 장전 금지, 탄약 분리, 키·비밀번호 관리'],
            ['교육', '총을 보면 만지지 말고 어른에게 알리기']
        ],
        blocks: [
            ['지금 할 일', '집·친척 집 총기 유무와 보관 상태를 확인하세요.'],
            ['하지 않을 일', '장난감 총과 실총을 혼동하게 두지 마세요.'],
            ['관련', '약장 잠금·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 총기 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Gun-Safety-Keeping-Children-Safe.aspx'],
            ['CDC 총기 손상 예방 개요', 'https://www.cdc.gov/firearm-violence/']
        ]
    },
    {
        id: 'visitor-purse-medicine-boundary',
        match: /(손님\s*가방\s*약|방문객\s*핸드백\s*약|visitor\s*purse\s*medicine|손님\s*약\s*아이|가방\s*속\s*약\s*아기)/,
        title: '손님 가방·코트 주머니의 약·비타민도 아이 손이 닿지 않게 치우세요',
        lead: '집 안 약이 아니어도 위험합니다. 방문 시 가방을 높은 곳에 두도록 요청하세요.',
        points: [
            ['예방', '가방 위치, 부탁'],
            ['섭취', '중독 상담']
        ],
        blocks: [
            ['지금 할 일', '손님에게 가방을 올려 달라고 말하세요.'],
            ['하지 않을 일', '소파 위 가방을 방치하지 마세요.'],
            ['관련', '약 보관 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'cleaning-supply-lock-boundary',
        match: /(세제\s*선반|청소\s*용품\s*보관|cleaning\s*supply\s*lock|락스\s*보관\s*아이|세제\s*잠금)/,
        title: '세제·청소 용품은 잠금 수납에 두고, 음료병으로 옮겨 담지 마세요',
        lead: '오인 섭취가 흔합니다. 원래 용기에 보관하고 아이 손이 닿지 않게 하세요.',
        points: [
            ['보관', '높은 곳·잠금'],
            ['금지', '음료병에 소분']
        ],
        blocks: [
            ['지금 할 일', '싱크 아래를 잠그거나 비우세요.'],
            ['하지 않을 일', '예쁜 병에 세제를 옮기지 마세요.'],
            ['관련', '중독·락스 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'mouthwash-child-access-boundary',
        match: /(구강\s*청결제\s*아이|마우스워시\s*마셨|mouthwash\s*child\s*access|가글\s*액\s*아이|입\s*가글\s*섭취)/,
        title: '구강 청결제는 잠가 두고, 마셨다면 중독 상담·진료 안내를 따르세요',
        lead: '알코올 성분 제품이 있을 수 있습니다. 용량 민간 요법은 하지 않습니다.',
        points: [
            ['보관', '잠금'],
            ['섭취', '상담']
        ],
        blocks: [
            ['지금 할 일', '세면대 위에 두지 마세요.'],
            ['하지 않을 일', '억지로 토하게 하지 마세요.'],
            ['관련', '가글 중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'fridge-medicine-child-lock-boundary',
        match: /(냉장고\s*약\s*보관|냉장고\s*약\s*아이|냉장\s*보관\s*약\s*손|fridge\s*medicine\s*child)/,
        title: '냉장 보관 약도 아이 손이 닿지 않게 하고 음료와 구분해 두세요',
        lead: '용량은 표시·처방을 따릅니다.',
        points: [
            ['보관', '높은 곳·잠금'],
            ['구분', '음료와 분리']
        ],
        blocks: [
            ['지금 할 일', '약 병을 문 쪽에 두지 마세요.'],
            ['하지 않을 일', '주스병처럼 보이게 두지 마세요.'],
            ['관련', '약 보관 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'medicine-cabinet-lock',
        match: /(약\s*보관|약\s*잠금|약품\s*수납|아이\s*약\s*손|영양제\s*삼킴|감기약\s*삼킴)/,
        title: '약·영양제·철분제는 잠그는 수납에 두고, 사탕처럼 보이지 않게 하세요',
        lead: '알록달록한 약·젤리 영양제·철분제는 아이가 과량 삼키기 쉽습니다. 원래 용기에 잠금 수납하고, 방문객 가방도 주의하세요. 삼켰으면 토하게 하지 말고 중독 상담·응급실 안내를 따릅니다. 용량·해독 처방을 사이트에서 하지 않습니다.',
        points: [
            ['예방', '높은 잠금, 뚜껑, 주스·사탕과 분리'],
            ['노출', '약 이름·개수 기록, 바로 상담']
        ],
        blocks: [
            ['지금 할 일', '싱크대 아래·가방 속 약을 점검하세요.'],
            ['하지 않을 일', '약 뚜껑을 열린 채 소파에 두지 마세요.'],
            ['관련', '세제 포드·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/'],
            ['AAP 약 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/medication-safety/Pages/default.aspx']
        ]
    },
    {
        id: 'garbage-disposal-child-safety',
        match: /(음식물\s*처리기|디스포저\s*아이|garbage\s*disposal\s*child|싱크\s*분쇄\s*손|처리기\s*스위치)/,
        title: '음식물 처리기는 전원을 끄고, 손이 들어가지 않게 하며 스위치를 잠그세요',
        lead: '손·도구가 들어가면 심한 부상이 납니다. 뚜껑·스위치 위치를 관리하세요.',
        points: [
            ['안전', '전원 차단, 손 금지'],
            ['청소', '도구 사용, 전원 확인']
        ],
        blocks: [
            ['지금 할 일', '스위치가 아이 손에 닿지 않게 하세요.'],
            ['하지 않을 일', '작동 중 손을 넣지 마세요.'],
            ['관련', '주방 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'dishwasher-door-open-boundary',
        match: /(식기세척기\s*문)/,
        title: '식기세척기 문을 열어 두면 칼·미끄럼·올라타기 위험이 있으니 닫고 날카로운 것을 치우세요',
        lead: '문 위에 올라가면 전복될 수 있습니다.',
        points: [
            ['습관', '문 닫기, 칼 손잡이'],
            ['금지', '올라타기']
        ],
        blocks: [
            ['지금 할 일', '사이클 전후 문을 닫으세요.'],
            ['하지 않을 일', '칼날이 위를 향하게 두지 마세요.'],
            ['관련', '식기세척기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'knife-drawer-safety',
        match: /(칼\s*서랍|칼\s*보관|주방\s*칼\s*아이|식기세척기\s*칼|날카로운\s*도구)/,
        title: '칼·가위는 잠그거나 높은 곳에 두고, 식기세척기 문 열린 채 날을 방치하지 마세요',
        lead: '주방 칼·가위·식품 가공 날은 아이 손이 닿지 않게 보관합니다. 식기세척기를 열어 두면 날카로운 쪽이 노출될 수 있습니다. 조리 중에도 손잡이·전선을 안쪽으로 두세요.',
        points: [
            ['보관', '잠금 서랍, 칼집, 높은 수납'],
            ['사용 중', '세척기 문·도마 위 방치 주의']
        ],
        blocks: [
            ['지금 할 일', '칼 서랍에 잠금이 가능한지 점검하세요.'],
            ['하지 않을 일', '싱크대에 칼을 담가 둔 채 자리를 비우지 마세요.'],
            ['관련', '집 안 안전·화상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 아동 손상 예방 개요', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'mouthwash-alcohol-poison-boundary',
        match: /(가글\s*먹|구강\s*청결제\s*먹|마우스워시\s*먹|mouthwash|가글액\s*삼킴|구강세정제\s*아이)/,
        title: '가글·구강청결제를 아이가 마셨으면 알코올·불소 함량을 확인하고 상담하세요',
        lead: '일부 구강청결제에는 알코올·불소 등이 들어 있어 소량이라도 아이 체중 대비 부담이 될 수 있습니다. 토하게 강제하지 말고 제품명·추정량을 확인한 뒤 중독 상담·진료를 검토하세요. 용량·브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '뚜껑 잠금, 세면대 아래 치우기, 성인용 제품 분리'],
            ['노출', '졸림·비틀거림·구토 시 응급실']
        ],
        blocks: [
            ['지금 할 일', '세면대의 가글·세정제를 아이 손 닿지 않게 옮기세요.'],
            ['하지 않을 일', '물을 억지로 많이 먹여 희석하려 하지 마세요. 상담을 우선하세요.'],
            ['관련', '손소독제·약장 잠금 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'hand-sanitizer-ingestion',
        match: /(손\s*소독제\s*먹|손소독제\s*삼|손\s*세정제\s*먹|알코올\s*젤\s*먹|sanitizer\s*ingest|손소독\s*마셨)/,
        title: '손소독제·알코올 젤을 삼켰으면 토하게 하지 말고 중독 상담·진료를 하세요',
        lead: '손소독제의 알코올 등은 소량이라도 어린이에게 위험할 수 있습니다. 삼킨 양·제품명을 확인하고 토하게 강제하지 마세요. 평소 손소독제는 아이 손 닿지 않게 두고, 손을 씻을 수 있으면 비누·물을 우선합니다. 용량·해독 처방을 사이트에서 하지 않습니다.',
        points: [
            ['예방', '펌프·뚜껑 잠금, 가방·낮은 선반 치우기'],
            ['노출', '양·시간 기록, 토하게 금지, 상담·응급실']
        ],
        blocks: [
            ['지금 할 일', '제품 라벨을 챙기고 중독 상담·의료 안내를 따르세요.'],
            ['하지 않을 일', '물·우유를 억지로 많이 먹여 “희석”하려 하지 마세요.'],
            ['관련', '약·세제 잠금 안내를 참고하세요.']
        ],
        links: [
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/'],
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['손 씻기 안내', '#home']
        ]
    },
    {
        id: 'yo-yo-ball-strangulation-boundary',
        match: /(요요\s*볼|yo[-\s]?yo\s*ball|탄성\s*줄\s*공|고무\s*줄\s*공\s*목|요요공)/,
        title: '고무 줄이 긴 요요 볼 종류는 목에 감길 수 있어 어린이에게 주지 마세요',
        lead: '긴 탄성 줄이 달린 공·요요 볼은 목에 감겨 질식 위험이 보고된 바 있습니다. 어린이 장난감으로 두지 말고, 유사 제품도 줄 길이와 고정 여부를 확인하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['위험', '목 감김, 질식, 눈 부상'],
            ['조치', '집에 있으면 폐기·회수, 리콜 확인']
        ],
        blocks: [
            ['지금 할 일', '긴 고무 줄 장난감을 치우세요.'],
            ['하지 않을 일', '줄에 목을 걸거나 돌리는 놀이를 하지 마세요.'],
            ['관련', '리콜·옷 끈·질식 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 장난감 줄·질식 위험', 'https://www.cpsc.gov/'],
            ['AAP 장난감 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'drawstring-clothing-danger',
        match: /(옷\s*끈|모자\s*끈|드로우\s*스트링|drawstring|목\s*끈\s*옷|후드\s*끈\s*아기|옷\s*모자\s*끈)/,
        title: '모자·옷 목 끈(드로우스트링)은 질식·걸림 위험이 있어 어린 아이 옷에서 빼 주세요',
        lead: '목·후드 주변 끈은 놀이기구·가구에 걸리거나 목을 조일 수 있습니다. 어린 아이 겉옷에서는 끈을 제거하거나 끈 없는 디자인을 쓰는 안내가 있습니다. 특정 브랜드 추천은 하지 않습니다.',
        points: [
            ['점검', '모자·후드·목 주변 끈, 허리 끈 길이'],
            ['조치', '자르거나 빼기, 놀이터·버스에서 특히 주의']
        ],
        blocks: [
            ['지금 할 일', '외투·모자 끈을 확인하고 필요하면 제거하세요.'],
            ['하지 않을 일', '긴 끈이 달린 옷을 입은 채 미끄럼틀에 혼자 두지 마세요.'],
            ['관련', '질식·놀이터 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 아동 옷 끈 위험', 'https://www.cpsc.gov/'],
            ['AAP 질식·걸림 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Choking-Prevention.aspx']
        ]
    },
    {
        id: 'slime-borax-boundary',
        match: /(슬라임|slime|보락스|borax|슬라임\s*만들|액체\s*괴물)/,
        title: '슬라임·보락스 재료는 삼키거나 눈에 들어가지 않게 하고, 어린 아이 혼자 만들게 두지 마세요',
        lead: '슬라임에 쓰이는 일부 재료는 자극·삼킴 위험이 있을 수 있습니다. 어린 아이는 보호자와 함께, 재료 표시를 읽고 눈에·입에 넣지 않게 하세요. 삼켰거나 눈 자극이 심하면 중독 상담·진료를 따릅니다. 브랜드 추천은 하지 않습니다.',
        points: [
            ['사용', '환기, 손 씻기, 어린 영아 멀리'],
            ['노출', '삼킴·눈 접촉 시 상담·헹굼 안내 따름']
        ],
        blocks: [
            ['지금 할 일', '재료 라벨의 연령·주의 문구를 확인하세요.'],
            ['하지 않을 일', '보락스 가루를 식품처럼 다루지 마세요.'],
            ['관련', '중독·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/'],
            ['CPSC 장난감·공예 재료 안전', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'product-recall-check-how-boundary',
        match: /(리콜\s*확인\s*방법|리콜\s*어디서\s*확인|product\s*recall\s*how\s*to|리콜\s*조회\s*방법|리콜\s*검색하는\s*법)/,
        title: '유모차·카시트·장난감은 제조사·CPSC 등 공식 리콜을 확인하고 해당 시 사용을 중지하세요',
        lead: '중고 구매 전에도 모델명을 검색하세요. 특정 쇼핑몰 순위는 하지 않습니다.',
        points: [
            ['확인', '모델명, 공식 공지'],
            ['조치', '사용 중지, 수리·반품']
        ],
        blocks: [
            ['지금 할 일', '제품 모델 번호를 사진으로 남기세요.'],
            ['하지 않을 일', '리콜인데 괜찮겠지 하고 쓰지 마세요.'],
            ['관련', '리콜 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'used-stroller-recall-boundary',
        match: /(중고\s*유모차\s*리콜|중고\s*유모차\s*리콜|유모차\s*중고\s*안전|used\s*stroller\s*recall)/,
        title: '중고 유모차는 리콜·벨트·접힘 잠금을 확인하고 불확실하면 쓰지 마세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['확인', '모델, 리콜, 잠금'],
            ['금지', '파손 상태']
        ],
        blocks: [
            ['지금 할 일', '모델명으로 리콜을 검색하세요.'],
            ['하지 않을 일', '벨트가 없으면 사용하지 마세요.'],
            ['관련', '유모차·리콜 안내를 참고하세요.']
        ],
        links: [
            ['CPSC', 'https://www.cpsc.gov/'],
            ['AAP 유모차', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Stroller-Safety.aspx']
        ]
    },
    {
        id: 'product-recall-boundary',
        match: /(리콜|리\s*콜|recall|제품\s*회수|리콜\s*확인|유모차\s*리콜|카시트\s*리콜\s*확인|장난감\s*리콜)/,
        title: '유모차·카시트·장난감 등은 리콜 여부를 확인하고, 해당되면 사용을 중단하세요',
        lead: '안전 문제로 리콜된 제품은 수선·반납 안내를 따르고 계속 쓰지 않는 것이 안전합니다. 제조사·시리얼 번호·구매 시기를 확인하세요. 사이트에서 특정 브랜드 순위를 하지 않으며, 리콜 목록은 공식 기관·제조사 공지를 봅니다.',
        points: [
            ['확인', '모델·시리얼, 제조사 공지, 공식 리콜 검색'],
            ['조치', '사용 중단, 안내된 수리·반납']
        ],
        blocks: [
            ['지금 할 일', '집에 있는 대형 육아용품 모델명을 적어 검색하세요.'],
            ['하지 않을 일', '리콜 통지를 무시하고 쓰지 마세요.'],
            ['관련', '카시트·유모차·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 리콜', 'https://www.cpsc.gov/Recalls'],
            ['NHTSA 리콜(차량·카시트)', 'https://www.nhtsa.gov/recalls'],
            ['고위험 용품 원칙', '#about']
        ]
    },
    {
        id: 'power-tool-child-safety',
        match: /(전동\s*공구|드릴\s*아이|power\s*tool|전기\s*톱|그라인더\s*아이|공구\s*창고\s*아이)/,
        title: '전동 공구 사용 중에는 아이를 멀리 두고, 공구·날은 잠가 보관하세요',
        lead: '드릴·톱·그라인더는 심한 열상·안구 부상 위험이 있습니다. 작업 중 아이 접근을 막고, 사용 후 전원을 분리·보관하세요. 장난감 공구와 실물을 섞어 두지 마세요. 제품 추천은 하지 않습니다.',
        points: [
            ['작업', '격리, 보호 장비, 전원 차단'],
            ['보관', '잠금 수납, 날·비트 분리']
        ],
        blocks: [
            ['지금 할 일', '차고·베란다 공구가 바닥에 있는지 치우세요.'],
            ['하지 않을 일', '아이를 무릎에 앉히고 공구를 켜지 마세요.'],
            ['관련', '가위·칼·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 공구·가정 안전', 'https://www.cpsc.gov/'],
            ['AAP 가정 부상 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'scissors-toddler-boundary',
        match: /(가위\s*아이|유아\s*가위|scissors\s*toddler|가위\s*안전|바느질\s*바늘\s*아이|바늘\s*삼킴)/,
        title: '가위·바늘은 아이 손 닿지 않게 두고, 유아용 가위도 감독 아래 쓰세요',
        lead: '날카로운 가위·바늘·핀은 찔림·열상 위험이 있습니다. 잠금 수납에 두고, 공예 시에는 끝이 둥근 유아용 도구와 보호자 감독이 필요합니다. 바늘을 삼켰으면 호흡을 보고 의료 안내를 따르세요.',
        points: [
            ['보관', '높은 곳·잠금, 바느질 도구 정리'],
            ['사용', '감독, 연령 맞는 도구']
        ],
        blocks: [
            ['지금 할 일', '책상·서랍의 가위·바늘을 치우세요.'],
            ['하지 않을 일', '뛰면서 가위를 들고 다니게 두지 마세요.'],
            ['관련', '중독·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC 부상 예방', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'cannabis-gummy-lookalike-boundary',
        match: /(대마\s*젤리\s*오인|대마\s*구미\s*아이|cannabis\s*gummy\s*child|THC\s*젤리\s*과자|마리화나\s*사탕)/,
        title: '대마·THC 젤리는 일반 과자와 비슷해 보이므로 잠가 두고, 섭취 시 즉시 진료하세요',
        lead: '어린이 중독이 보고됩니다. 보관과 표시를 철저히 하세요.',
        points: [
            ['보관', '잠금, 아이 시야 밖'],
            ['섭취', '응급 진료']
        ],
        blocks: [
            ['지금 할 일', '성인 제품을 과자 그릇 옆에 두지 마세요.'],
            ['하지 않을 일', '조금 먹었다고 지켜보기만 하지 마세요.'],
            ['관련', '대마 에디블 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'cannabis-edible-child-poison',
        match: /(대마|마리화나|칸나비스|THC|에디블|대마\s*젤리|대마\s*쿠키|cannabis|marijuana|edible).{0,20}(먹|삼킴|중독|아이|아기)|아이.{0,12}(대마|THC|에디블)/,
        title: '대마·THC 함유 젤리·쿠키를 아이가 먹었으면 중독 상담·응급실을 우선하세요',
        lead: '대마 성분 식품(에디블)은 사탕·젤리처럼 보여 아이들이 삼키기 쉽고, 늦게 증상이 나타날 수 있습니다. 임의로 토하게 하지 말고, 제품명·추정량을 확인한 뒤 중독 상담·응급실 경로를 이용하세요. 치료·용량을 사이트에서 정하지 않습니다.',
        points: [
            ['위험', '졸림·비틀거림·구토·호흡 이상, 늦게 나타나는 증상'],
            ['대응', '남은 포장 보관, 토하게 강제 금지, 119·중독 상담·응급실']
        ],
        blocks: [
            ['지금 할 일', '대마 식품·오일은 아이 손 닿지 않는 잠금 수납에 두세요.'],
            ['하지 않을 일', '“조금이니 자라면 괜찮다”며 지켜만 보지 마세요.'],
            ['관련', '약·세제 중독·약장 잠금 안내를 참고하세요.']
        ],
        links: [
            ['CDC 대마·소아 노출 개요', 'https://www.cdc.gov/cannabis/'],
            ['AAP 중독·응급 개요', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'silica-gel-desiccant-boundary',
        match: /(실리카\s*겔|방습제|제습제\s*봉투|습기\s*제거제\s*먹|silica\s*gel|건조제\s*삼킴)/,
        title: '방습제(실리카겔)를 삼켰으면 양·증상을 보고 중독 상담·진료를 하세요',
        lead: '옷·김·약 포장의 방습제는 보통 삼켜도 대부분 흡수되지 않지만, 양·첨가 성분·질식·포장지 조각에 따라 위험이 달라질 수 있습니다. 토하게 강제하지 말고 상담하세요. “무해” 단정은 하지 않습니다.',
        points: [
            ['확인', '실리카겔 표기, 산소흡수제(철 성분)와 구분'],
            ['대응', '호흡·침 흘림·복통 시 응급실, 중독 상담']
        ],
        blocks: [
            ['지금 할 일', '신발·김·가방 속 방습제를 아이 손에 두지 마세요.'],
            ['하지 않을 일', '포장째 장난감처럼 주지 마세요.'],
            ['관련', '중독·작은 물건 질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'mothball-poison-boundary',
        match: /(나프탈렌|모스볼|좀약| mothball| moth\s*ball|장뇌\s*좀약|옷장\s*좀약\s*먹)/,
        title: '좀약(나프탈렌 등)을 삼켰거나 냄새를 오래 맡으면 중독 위험이 있어 상담하세요',
        lead: '좀약 성분은 제품마다 다르며 혈구·신경 등에 영향을 줄 수 있습니다. 아이가 먹거나 빨았으면 남은 조각을 치우고 중독 상담·진료를 하세요. 토하게 강제하지 마세요. 옷장에 둔 채 아이 손에 두지 않습니다.',
        points: [
            ['예방', '밀폐·높은 곳, 아이 손 닿지 않게'],
            ['노출', '구토·처짐·호흡 이상 → 응급실']
        ],
        blocks: [
            ['지금 할 일', '서랍·옷장 좀약 위치를 점검하세요.'],
            ['하지 않을 일', '좀약을 방향제로 아이 방에 두지 마세요.'],
            ['관련', '중독·캠퍼 문지름 안내를 참고하세요.']
        ],
        links: [
            ['CDC 나프탈렌·좀약 개요', 'https://www.cdc.gov/niosh/'],
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'glow-stick-ingestion-boundary',
        match: /(야광봉|글로우\s*스틱|glow\s*stick|형광\s*스틱|야광\s*팔찌\s*먹|야광액)/,
        title: '야광봉 액체를 먹거나 눈에 넣으면 입을 헹구고 증상을 본 뒤 상담하세요',
        lead: '야광봉·야광 팔찌 액체는 대개 소량이면 큰 독성은 드물다는 안내가 있으나, 자극·구역·눈 통증을 일으킬 수 있습니다. 삼켰으면 입 안을 물로 헹구고, 눈에 들어갔으면 흐르는 물로 씻은 뒤 상담·진료를 검토하세요. 토하게 강제하지 마세요.',
        points: [
            ['노출', '입 헹구기, 눈 세척, 포장 확인'],
            ['진료', '호흡 이상, 심한 구토, 눈 통증 지속']
        ],
        blocks: [
            ['지금 할 일', '축제·할로윈 야광 용품을 씹지 않게 하세요.'],
            ['하지 않을 일', '터진 야광액을 피부에 문지르지 마세요.'],
            ['관련', '중독·이물질 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'pet-treat-ingestion-child-boundary',
        match: /(반려동물\s*간식\s*삼킴)/,
        title: '반려동물 간식을 아이가 먹지 않게 치우고, 많이 먹었다면 중독 상담·진료를 하세요',
        lead: '성분·양에 따라 위험이 다릅니다. 라벨을 챙기세요.',
        points: [
            ['예방', '보관, 치우기'],
            ['섭취', '상담']
        ],
        blocks: [
            ['지금 할 일', '간식을 바닥·탁자에 두지 마세요.'],
            ['하지 않을 일', '조금이라고 무시하지 마세요.'],
            ['관련', '펫푸드 섭취 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'pet-food-ingestion-boundary',
        match: /(강아지\s*사료\s*먹|고양이\s*사료\s*먹|펫\s*푸드\s*아기|pet\s*food\s*(먹|삼킴)|동물\s*사료\s*아이|개\s*밥\s*먹)/,
        title: '반려동물 사료·간식을 아이가 먹었으면 양·성분을 확인하고 상담하세요',
        lead: '반려동물 사료는 사람 식품 기준과 다르고, 일부 성분·첨가물이 아이에게 맞지 않을 수 있습니다. 소량이라도 삼켰으면 제품명·추정량을 확인하고 중독 상담·진료를 검토하세요. 토하게 강제하지 마세요. 사료 브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '사료 봉지를 잠그고 바닥에 두지 않기'],
            ['노출', '포장 확인, 구토·처짐·호흡 이상 시 진료']
        ],
        blocks: [
            ['지금 할 일', '사료·간식을 아이 손이 닿지 않는 곳에 두세요.'],
            ['하지 않을 일', '“동물이 먹으니 괜찮다”며 방치하지 마세요.'],
            ['관련', '중독·이물질 삼킴 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'dishwasher-pod-poison-boundary',
        match: /(식기세척기\s*세제|dishwasher\s*(pod|detergent)|식세기\s*포드|식기\s*세제\s*먹|식기세척\s*캡슐)/,
        title: '식기세척기 세제·캡슐을 삼키거나 눈에 넣으면 입·눈을 헹구고 바로 상담하세요',
        lead: '식기세척기 전용 세제·포드도 세탁 포드처럼 강하게 자극할 수 있습니다. 삼키면 토하게 강제하지 말고, 눈에 들어갔으면 흐르는 물로 씻은 뒤 중독 상담·응급실을 이용하세요. 제품 브랜드 순위는 하지 않습니다.',
        points: [
            ['위험', '입·식도 자극, 눈 손상, 호흡 이상'],
            ['예방', '잠금 수납, 문을 연 채 세제 방치 금지']
        ],
        blocks: [
            ['지금 할 일', '식세기 세제 위치를 아이 손이 닿지 않게 바꾸세요.'],
            ['하지 않을 일', '예쁘게 보이는 캡슐을 장난감처럼 두지 마세요.'],
            ['관련', '세탁 포드·중독 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 세제 포드 안전', 'https://www.cpsc.gov/'],
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'mixing-cleaners-fume-boundary',
        match: /(세제\s*섞어\s*쓰|락스\s*암모니아\s*섞|mixing\s*cleaners\s*fume|청소\s*약품\s*섞으면|염소\s*세제\s*혼합)/,
        title: '청소 약품을 섞지 마세요. 유독 가스가 날 수 있습니다',
        lead: '특히 락스와 암모니아·산성 제품 혼합은 위험합니다. 환기하고 아이를 대피시키세요.',
        points: [
            ['금지', '제품 혼합'],
            ['노출', '환기, 대피, 진료']
        ],
        blocks: [
            ['지금 할 일', '한 번에 한 제품만 쓰세요.'],
            ['하지 않을 일', '냄새 난다고 더 섞어 중화하려 하지 마세요.'],
            ['관련', '락스·중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'bleach-ingestion-boundary',
        match: /(락스\s*먹|표백제\s*먹|bleach\s*(먹|ingest|poison)|염소\s*표백\s*삼킴|락스\s*중독)/,
        title: '락스·표백제를 삼켰거나 섞어 쓴 가스에 노출되면 토하게 하지 말고 상담·응급실을 우선하세요',
        lead: '가정용 락스·표백제는 입·식도 자극이 심할 수 있고, 산성 세제와 섞으면 위험한 가스가 납니다. 삼켰을 때 억지로 토하게 하지 말고 제품명·추정량을 확인한 뒤 중독 상담·응급실을 이용하세요. 용량·해독제 단정은 하지 않습니다.',
        points: [
            ['금지', '세제 혼합, 토하게 강제, 우유·민간 해독 단정'],
            ['응급', '호흡 곤란, 심한 구토, 입 안 화상 → 119']
        ],
        blocks: [
            ['지금 할 일', '락스·표백제를 잠금 수납으로 옮기세요.'],
            ['하지 않을 일', '화장실 청소제를 한 통에 섞지 마세요.'],
            ['관련', '중독·세제 포드 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'antifreeze-poison-boundary',
        match: /(부동액\s*먹|antifreeze|에틸렌\s*글리콜|워셔액\s*먹|냉각수\s*먹|부동액\s*중독)/,
        title: '부동액·일부 워셔액은 달콤한 맛이 나 위험합니다. 삼켰으면 즉시 응급실·중독 상담을 하세요',
        lead: '부동액(에틸렌글리콜 등)은 소량이라도 아이에게 치명적일 수 있습니다. 토하게 강제하지 말고 남은 용기와 함께 응급실·중독 상담을 이용하세요. 차고·베란다에 방치하지 마세요. 해독·용량은 의료진이 정합니다.',
        points: [
            ['예방', '뚜껑 잠금, 흘린 액 즉시 닦기, 펫·아이 접근 차단'],
            ['응급', '삼킴 의심만으로도 즉시 의료 평가']
        ],
        blocks: [
            ['지금 할 일', '차고·베란다 부동액 용기를 점검하세요.'],
            ['하지 않을 일', '빈 음료수병에 옮겨 담지 마세요.'],
            ['관련', '중독·약장 잠금 안내를 참고하세요.']
        ],
        links: [
            ['CDC 에틸렌글리콜·중독 개요', 'https://www.cdc.gov/niosh/'],
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'mosquito-coil-indoor-boundary',
        match: /(모기향|mosquito\s*coil|훈증\s*모기|모기향\s*연소)/,
        title: '모기향·연소형 제품은 환기와 화상·연기를 보고, 아이 가까이에서 피우지 마세요',
        lead: '연기 자극과 화재 위험이 있습니다. 기피제·모기장은 표시를 따르세요. 제품 순위는 하지 않습니다.',
        points: [
            ['사용', '환기, 거리, 소화'],
            ['주의', '화상, 연기']
        ],
        blocks: [
            ['지금 할 일', '불씨를 완전히 끄고 버리세요.'],
            ['하지 않을 일', '아기 침대 옆에서 피우지 마세요.'],
            ['관련', '모기 기피·화재 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'pesticide-poison-boundary',
        match: /(살충제\s*먹|농약\s*먹|pesticide|살충\s*스프레이\s*아이|모기약\s*먹|해충\s*약\s*삼킴)/,
        title: '살충제·농약을 삼키거나 강하게 흡입하면 토하게 하지 말고 바로 상담·응급실을 이용하세요',
        lead: '가정용 살충제·모기약·농약은 성분마다 위험이 다릅니다. 삼켰을 때 억지로 토하게 하지 말고 제품명·추정량을 확인한 뒤 중독 상담·응급실을 이용하세요. 아이 있는 방에 뿌린 뒤 환기 없이 두지 마세요. 용량·브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '잠금 수납, 사용 중 아이 격리, 환기'],
            ['응급', '구토·처짐·경련·호흡 이상 → 119']
        ],
        blocks: [
            ['지금 할 일', '베란다·싱크 아래 살충제 위치를 점검하세요.'],
            ['하지 않을 일', '음식이 있는 식탁 위에 뿌리지 마세요.'],
            ['관련', '중독·벌레 물림 안내를 참고하세요.']
        ],
        links: [
            ['CDC 살충제·중독 개요', 'https://www.cdc.gov/pesticides/'],
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'super-glue-skin-boundary',
        match: /(순간\s*접착제|슈퍼\s*글루|super\s*glue|본드\s*손가락|접착제\s*눈|순간접착\s*붙)/,
        title: '순간접착제가 피부·눈에 묻으면 억지로 뜯지 말고 세척·진료 여부를 보세요',
        lead: '순간접착제는 피부끼리 붙거나 눈·입 주위 자극을 일으킬 수 있습니다. 억지로 뜯지 말고 미지근한 물·제품 안내에 따라 부드럽게 분리하세요. 눈·입 안·호흡기 자극은 진료를 우선합니다. 제거제 브랜드 추천은 하지 않습니다.',
        points: [
            ['피부', '억지 분리 금지, 물·오일류는 제품·의료 안내'],
            ['눈·입', '헹구기, 비비지 않기, 진료']
        ],
        blocks: [
            ['지금 할 일', '접착제를 아이 손 닿지 않는 곳에 두세요.'],
            ['하지 않을 일', '아세톤을 영아 피부에 함부로 바르지 마세요.'],
            ['관련', '중독·눈 이물 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독·가정 화학물질 개요', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'pencil-graphite-ingestion-boundary',
        match: /(연필\s*심\s*먹|연필\s*깨물어|graphite\s*pencil|색연필\s*먹|연필\s*흑연\s*삼킴|연필\s*뾰족\s*찌)/,
        title: '연필 심을 조금 씹은 경우와 찔린 상처를 구분해 보고, 이물질·통증이 있으면 상담하세요',
        lead: '흑연 연필 심 소량 섭취는 대개 큰 독성은 드물다는 안내가 많지만, 나무 조각·찔림·눈 손상은 별개입니다. 토하게 강제하지 말고, 호흡·복통·깊은 찔림이면 진료하세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['섭취', '소량이면 관찰, 많은 양·나무 조각은 상담'],
            ['찔림', '출혈 압박, 깊이·눈·관절 근처는 진료']
        ],
        blocks: [
            ['지금 할 일', '뾰족한 연필을 아이 손 닿지 않게 치우세요.'],
            ['하지 않을 일', '심을 억지로 빼내려 깊게 쑤시지 마세요.'],
            ['관련', '크레용·중독·이물 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'crayon-ingestion-boundary',
        match: /(크레용\s*먹|크레파스\s*먹|crayon\s*eat|색연필\s*먹|왁스\s*크레용\s*삼킴)/,
        title: '크레용·크레파스를 조금 씹은 경우에도 양·증상을 보고, 많은 양·이물질 느낌이면 상담하세요',
        lead: '일반 아동용 크레용은 소량 섭취 시 큰 독성은 드물다는 안내가 많지만, 포장·성분·이물질(뚜껑·조각)에 따라 다릅니다. 토하게 강제하지 말고, 호흡·복통·많은 양이 걱정되면 중독 상담·진료를 이용하세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['관찰', '호흡, 침 흘림, 복통, 변에 왁스'],
            ['예방', '비아동용·산업용 마킹 도구 치우기']
        ],
        blocks: [
            ['지금 할 일', '바닥에 떨어진 크레용 조각을 치우세요.'],
            ['하지 않을 일', '성인용 유성 마카를 미술 재료로 주지 마세요.'],
            ['관련', '중독·작은 물건 질식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'play-dough-ingestion-boundary',
        match: /(점토\s*먹|플레이도우\s*먹|play\s*dough|밀가루\s*점토\s*삼킴|슬라임\s*아닌\s*점토\s*먹|칼라\s*점토\s*먹)/,
        title: '플레이도우·점토를 삼켰으면 양·성분을 확인하고, 소금 많은 수제 점토는 특히 주의하세요',
        lead: '시판 아동용 점토는 소량 섭취 시 대개 큰 독성은 드물다는 안내가 있으나, 수제 점토의 많은 소금·첨가물·이물질은 위험할 수 있습니다. 토하게 강제하지 말고 상담하세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['관찰', '구토·처짐·심한 갈증(고염), 기도 이물'],
            ['예방', '놀이에 감독, 수제 레시피 소금량 주의']
        ],
        blocks: [
            ['지금 할 일', '바닥에 떨어진 점토 조각을 치우세요.'],
            ['하지 않을 일', '산업용 점토·석고를 놀이 재료로 주지 마세요.'],
            ['관련', '중독·슬라임·크레용 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'fabric-softener-poison-boundary',
        match: /(섬유유연제\s*먹|유연제\s*먹|fabric\s*softener|섬유유연\s*시트\s*먹|다우니\s*먹)/,
        title: '섬유유연제·유연 시트를 삼키거나 눈에 넣으면 입·눈을 헹구고 상담하세요',
        lead: '섬유유연제 액체·시트는 자극·구역을 일으킬 수 있습니다. 삼켰을 때 토하게 강제하지 말고 제품명·추정량을 확인한 뒤 중독 상담·진료를 검토하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '잠금 수납, 세탁기 위에 방치 금지'],
            ['노출', '입 헹구기, 눈 세척, 호흡·구토 심하면 응급']
        ],
        blocks: [
            ['지금 할 일', '유연제 병을 아이 손 닿지 않게 옮기세요.'],
            ['하지 않을 일', '시트를 스티커 놀이처럼 주지 마세요.'],
            ['관련', '세제 포드·중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'dryer-sheet-ingestion-boundary',
        match: /(건조기\s*시트\s*먹|드라이\s*시트|dryer\s*sheet|건조기\s*방향제\s*시트\s*삼킴)/,
        title: '건조기 시트를 씹거나 삼켰으면 이물질·자극을 보고 상담하세요',
        lead: '건조기 시트는 섬유·화학 성분이 있어 삼키면 구역·자극이 날 수 있습니다. 토하게 강제하지 말고 양과 증상을 본 뒤 중독 상담·진료를 검토하세요. 세탁물 옆에 두지 마세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '시트 보관함 잠금, 바닥에 떨어뜨리지 않기'],
            ['노출', '침 흘림·복통·호흡 이상 시 진료']
        ],
        blocks: [
            ['지금 할 일', '건조기 옆 시트를 높은 곳으로 옮기세요.'],
            ['하지 않을 일', '사용한 시트를 장난감처럼 주지 마세요.'],
            ['관련', '섬유유연제·중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'marker-ingestion-boundary',
        match: /(마카\s*먹|마커\s*먹|유성\s*매직\s*먹|permanent\s*marker|보드마카\s*먹|매직\s*잉크\s*삼킴)/,
        title: '유성 매직·보드마카 잉크를 삼켰거나 입에 묻히면 성분·양을 확인하고 상담하세요',
        lead: '아동용 수성 마카와 유성 매직은 위험이 다릅니다. 삼켰으면 토하게 강제하지 말고 제품명·추정량을 확인한 뒤 중독 상담·진료를 검토하세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '유성 매직 분리 보관, 뚜껑 닫기'],
            ['노출', '입 헹구기, 호흡·구토 심하면 진료']
        ],
        blocks: [
            ['지금 할 일', '서랍 속 유성 매직을 아이 손 닿지 않게 치우세요.'],
            ['하지 않을 일', '피부·입술에 매직으로 그림을 그리지 마세요.'],
            ['관련', '중독·크레용·점토 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'chalk-dust-boundary',
        match: /(분필\s*가루|분필\s*먹|sidewalk\s*chalk|초크\s*먼지|분필\s*흡입)/,
        title: '길거리 분필 가루를 먹거나 들이마시지 않게 하고, 놀이 후 손을 씻으세요',
        lead: '분필은 일반적으로 적은 양 접촉은 흔하지만, 대량 섭취·지속 기침이 있으면 상담하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '손 씻기, 입에 넣지 않기'],
            ['상담', '대량 섭취, 호흡 이상']
        ],
        blocks: [
            ['지금 할 일', '놀이 후 손을 씻으세요.'],
            ['하지 않을 일', '가루를 코에 들이마시게 두지 마세요.'],
            ['관련', '중독·위생 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'sandbox-cover-hygiene',
        match: /(모래상자\s*덮개|sandbox\s*cover|모래놀이\s*고양이|모래상자\s*위생|샌드박스\s*관리)/,
        title: '모래상자는 덮개를 덮고, 동물 배설물이 있으면 놀이를 중단하세요',
        lead: '모래는 동물 배설물·이물질이 섞일 수 있습니다. 덮개·정기 점검을 하고 놀이 후 손을 씻으세요.',
        points: [
            ['관리', '덮개, 이물질 제거'],
            ['위생', '손 씻기']
        ],
        blocks: [
            ['지금 할 일', '모래 위를 살펴보세요.'],
            ['하지 않을 일', '배설물이 보이면 그 모래를 쓰지 마세요.'],
            ['관련', '모래 섭취·손 씻기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 위생', 'https://www.cdc.gov/hygiene/'],
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'sand-ingestion-boundary',
        match: /(모래\s*먹|모래\s*삼킴|sand\s*eat|모래놀이\s*먹|흙\s*먹\s*아기|샌드박스\s*먹)/,
        title: '모래·흙을 자주 먹이면 위생·이물질·기생충 위험이 있어 감독하고, 많으면 상담하세요',
        lead: '모래놀이 중 소량을 입에 넣는 일은 흔할 수 있으나, 많은 양·유리·동물 분변이 섞인 모래는 위험할 수 있습니다. 토하게 강제하지 말고, 복통·구토·변 이상이 있으면 진료하세요. 모래장 위생을 점검합니다.',
        points: [
            ['예방', '손 씻기, 덮개, 동물 출입 제한, 감독'],
            ['상담', '많은 양, 날카로운 이물, 지속 증상']
        ],
        blocks: [
            ['지금 할 일', '놀이 후 손·얼굴을 씻기세요.'],
            ['하지 않을 일', '고양이 화장실 근처 모래를 놀이용으로 쓰지 마세요.'],
            ['관련', '중독·기생충·손 씻기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독·이물 개요', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 손 씻기', 'https://www.cdc.gov/handwashing/']
        ]
    },
    {
        id: 'liquid-detergent-poison-boundary',
        match: /(액체\s*세제\s*먹|세제\s*원액\s*먹|liquid\s*detergent|세탁\s*세제\s*마심|세제\s*병\s*빨)/,
        title: '액체 세탁 세제를 마시거나 눈에 넣으면 입·눈을 헹구고 중독 상담·진료를 하세요',
        lead: '포드가 아니어도 액체 세제는 자극·구역·거품 흡인 위험이 있습니다. 토하게 강제하지 말고 제품명·추정량을 확인하세요. 뚜껑을 잠그고 바닥 보관하지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '잠금 뚜껑, 높은 곳, 다른 용기에 옮겨 담지 않기'],
            ['노출', '입 헹구기, 눈 세척, 호흡 이상 시 응급']
        ],
        blocks: [
            ['지금 할 일', '세제 병이 싱크 아래 열려 있는지 확인하세요.'],
            ['하지 않을 일', '음료수병처럼 생긴 용기에 담아 두지 마세요.'],
            ['관련', '세제 포드·섬유유연제 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'makeup-play-boundary',
        match: /(화장\s*놀이|메이크업\s*놀이|kids\s*makeup|어린이\s*화장품|분장\s*놀이\s*아기)/,
        title: '화장 놀이는 눈·입에 들어가지 않게 하고, 성인 화장품을 그대로 쓰지 마세요',
        lead: '놀이 화장품도 자극·알레르기가 날 수 있습니다. 성인 제품·유통기한 지난 제품은 피하고, 놀이 후 세안하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['선택', '아이용 표시, 향 약한 것, 소량'],
            ['금지', '눈·입 속, 공유 브러시 비위생']
        ],
        blocks: [
            ['지금 할 일', '성인 화장품을 아이 손 닿지 않게 치우세요.'],
            ['하지 않을 일', '글리터를 눈에 가까이 바르지 마세요.'],
            ['관련', '화장품 섭취·중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 피부·자극 개요', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/default.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'perfume-makeup-ingestion-boundary',
        match: /(향수\s*먹|화장품\s*먹|perfume\s*ingest|립스틱\s*먹|메이크업\s*삼킴|향수\s*마심)/,
        title: '향수·화장품을 마시거나 눈에 넣으면 입·눈을 헹구고 성분·양을 확인해 상담하세요',
        lead: '향수·네일·메이크업은 알코올·다른 화학 성분이 있을 수 있습니다. 토하게 강제하지 말고 중독 상담·진료를 검토하세요. 화장대를 아이 손 닿지 않게 둡니다. 브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '잠금 수납, 가방 속 화장품 정리'],
            ['노출', '입 헹구기, 눈 세척, 호흡 이상 시 응급']
        ],
        blocks: [
            ['지금 할 일', '낮은 화장대·파우치 위치를 바꾸세요.'],
            ['하지 않을 일', '아이 얼굴에 성인 화장품을 놀이로 바르지 마세요.'],
            ['관련', '중독·손소독제 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'nail-polish-ingestion-boundary',
        match: /(매니큐어\s*먹|네일\s*폴리시\s*먹|nail\s*polish\s*ingest|매니큐어\s*냄새\s*중독|네일\s*리무버\s*먹)/,
        title: '매니큐어·리무버를 삼키거나 강하게 흡입하면 상담·환기를 우선하세요',
        lead: '네일 제품은 용제 성분이 있을 수 있습니다. 삼켰을 때 토하게 강제하지 말고, 환기·중독 상담·진료를 검토하세요. 아이 앞에서 네일 작업을 할 때는 뚜껑을 잠그세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '작업 후 즉시 치우기, 잠금 보관'],
            ['노출', '환기, 입 헹구기, 처짐·호흡 이상 시 응급']
        ],
        blocks: [
            ['지금 할 일', '네일 용품을 높은 잠금 수납으로 옮기세요.'],
            ['하지 않을 일', '리무버를 열린 채 바닥에 두지 마세요.'],
            ['관련', '중독·화장품 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'bubble-solution-ingestion',
        match: /(비눗방울\s*액|버블\s*솔루션|bubble\s*solution|비눗물\s*마셨|방울\s*물\s*먹|비눗방울\s*먹)/,
        title: '비눗방울 액을 마시지 않게 하고, 많이 삼켰거나 구토·처짐이 있으면 중독 상담·진료하세요',
        lead: '소량 입 접촉은 흔할 수 있으나 대량 섭취는 피해야 합니다. 용기 뚜껑을 닫아 두세요. 제품 순위는 하지 않습니다.',
        points: [
            ['예방', '뚜껑, 손에 쥐지 않기'],
            ['섭취 시', '중독 상담, 진료']
        ],
        blocks: [
            ['지금 할 일', '놀이가 끝나면 뚜껑을 닫으세요.'],
            ['하지 않을 일', '음료처럼 보이게 두지 마세요.'],
            ['관련', '중독 예방 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'dish-soap-ingestion-boundary',
        match: /(주방\s*세제\s*먹|식기\s*세제\s*섭취|dish\s*soap\s*ingest|설거지\s*비누\s*마셨|주방세제\s*삼킴|식기\s*세제\s*액체)/,
        title: '주방 세제를 마셨다면 억지로 토하게 하지 말고 중독 상담·진료 안내를 따르세요',
        lead: '제품·양에 따라 조치가 달라집니다. 용기 라벨을 챙기세요. 용량 민간 요법은 하지 않습니다.',
        points: [
            ['즉시', '입 헹구기, 상담'],
            ['금지', '억지 구토']
        ],
        blocks: [
            ['지금 할 일', '제품명을 확인하고 상담하세요.'],
            ['하지 않을 일', '손가락으로 목을 자극하지 마세요.'],
            ['관련', '중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'laundry-room-door-boundary',
        match: /(세탁실\s*문)/,
        title: '세탁실 문과 세제를 잠그고, 세탁기·건조기 문을 열어 두지 마세요',
        lead: '세제 중독·끼임 위험이 있습니다.',
        points: [
            ['차단', '문, 세제 잠금'],
            ['금지', '문 열고 놀기']
        ],
        blocks: [
            ['지금 할 일', '포드형 세제를 바닥 근처에 두지 마세요.'],
            ['하지 않을 일', '세탁기에 들어가 놀게 두지 마세요.'],
            ['관련', '세제·가둠 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'detergent-measure-child-access-boundary',
        match: /(세탁\s*세제\s*계량|세제\s*계량\s*아이|액체\s*세제\s*컵\s*방치|detergent\s*measure\s*child)/,
        title: '세제 계량컵을 싱크에 남겨 두지 말고 세제를 잠가 두세요',
        lead: '오인 섭취가 흔합니다.',
        points: [
            ['보관', '잠금, 원용기'],
            ['금지', '음료병 소분']
        ],
        blocks: [
            ['지금 할 일', '사용 후 뚜껑을 닫으세요.'],
            ['하지 않을 일', '예쁜 컵에 세제를 남기지 마세요.'],
            ['관련', '세제 중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'laundry-pod-poison',
        match: /(세제\s*포드|세탁\s*포드|캡슐\s*세제|액체\s*세제\s*삼|세제\s*먹|중독\s*상담|독극물)/,
        title: '세제 포드·약품은 아이 손이 닿지 않게 잠그고, 삼켰으면 응급 상담을 하세요',
        lead: '알록달록한 세제 포드·액체 세제·약은 삼키면 위험합니다. 원래 용기에 잠그는 수납에 두고, 다른 병에 옮겨 담지 마세요. 삼키거나 눈에 들어가면 집에서 토하게 하지 말고 응급·중독 상담 안내를 따르세요. 특정 제품 추천은 하지 않습니다.',
        points: [
            ['예방', '높은 잠금 수납, 즉시 뚜껑, 바닥 방치 금지'],
            ['노출 시', '입 안 닦기, 토하게 강제 금지, 바로 상담·응급실']
        ],
        blocks: [
            ['지금 할 일', '싱크대 아래·세탁실 세제를 아이 눈높이에서 치우세요.'],
            ['하지 않을 일', '물약처럼 보이는 용기에 세제를 옮기지 마세요.'],
            ['관련', '집 안 안전·단추전지 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방 개요', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'sleep-regression-boundary',
        match: /(수면\s*퇴행|수면퇴행|sleep\s*regression|4개월\s*수면|돌연\s*밤잠|자던\s*아기가\s*깨)/,
        title: '수면이 갑자기 흔들려도 “몇 개월 퇴행 표”만으로 단정하지 않습니다',
        lead: '성장·이 남·분리불안·질병·일정 변화로 잠이 흔들릴 수 있습니다. 몇 개월에 꼭 온다는 인터넷 표만 따르지 마세요. 안전수면(등·빈 수면면)을 유지하고, 낮잠·수유·아픈 기운을 함께 봅니다. 신생아에게 강압적 수면교육을 하지 않습니다.',
        points: [
            ['우선', '안전수면, 일정 루틴, 아픈지·이 나는지 확인'],
            ['경계', '고정 “퇴행 주간” 단정, 울려 재우기 강요']
        ],
        blocks: [
            ['지금 할 일', '최근 낮잠·수유·여행·발열 여부를 짧게 적어 보세요.'],
            ['하지 않을 일', '포지셔너·경사 쿠션으로 통잠을 만들지 마세요.'],
            ['관련', '안전수면·수면교육 경계·야경증 안내를 참고하세요.']
        ],
        links: [
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html'],
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'lip-tie-boundary',
        match: /(입술\s*유착|윗입술\s*유착|립\s*타이|lip\s*tie|상순\s*소대|입술\s*소대)/,
        title: '입술 유착(립 타이) 여부와 가위 시술은 수유·성장 평가 후 의료진이 판단합니다',
        lead: '윗입술 소대가 짧아 보이면 수유 통증·젖물림과 관련해 상담하기도 합니다. 사진만으로 “무조건 잘라야 한다”고 단정하지 마세요. 수유 상담·체중 증가·통증 평가가 우선이고, 시술 필요성은 의료진이 정합니다.',
        points: [
            ['관찰', '젖물림, 통증, 체중, 클릭음, 유두 손상'],
            ['경계', 'SNS 전후 사진만으로 시술 결정 금지']
        ],
        blocks: [
            ['지금 할 일', '수유 일지와 체중 기록을 챙겨 상담하세요.'],
            ['하지 않을 일', '가정에서 실·가위로 소대를 건드리지 마세요.'],
            ['관련', '설소대·젖물림·체중 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수유·구강 구조 개요', 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/default.aspx'],
            ['설소대 안내', '#home']
        ]
    },
    {
        id: 'tongue-tie-boundary',
        match: /(설소대|혀\s*짧은|tongue\s*tie|모유\s*유두\s*통증.*혀|수유\s*잠금.*혀)/,
        title: '설소대·혀 모양은 사진만으로 수술 여부를 정하지 않습니다',
        lead: '수유 통증·잠금·체중 증가 걱정이 있을 때 설소대를 이야기하는 경우가 있습니다. 입안 사진·인터넷 진단으로 수술 필요를 단정하지 마세요. 수유 상담·소아·이비인후 등 의료진이 수유·성장과 함께 평가합니다. 사이트에서 시술 권유·병원 순위는 하지 않습니다.',
        points: [
            ['볼 것', '수유 통증, 젖양·체중, 잠금, 다른 원인'],
            ['하지 말 것', 'SNS 사진 비교로 수술 결정']
        ],
        blocks: [
            ['지금 할 일', '수유 시각·통증·기저귀·체중 기록을 진료에 가져가세요.'],
            ['하지 않을 일', '민간 절개·집에서 혀를 자르려 하지 마세요.'],
            ['관련', '유두 통증·젖양 안내를 참고하세요.']
        ],
        links: [
            ['AAP 설소대·수유', 'https://www.healthychildren.org/English/ages-stages/baby/breastfeeding/Pages/Tongue-Tie.aspx'],
            ['질병관리청 모유 수유', 'https://health.kdca.go.kr/healthinfo/biz/health/gnrlzHealthInfo/gnrlzHealthInfo/gnrlzHealthInfoView.do?cntnts_sn=6586']
        ]
    },
    {
        id: 'school-vision-screening-boundary',
        match: /(시력\s*검진\s*학교)/,
        title: '학교 시력 검진에서 재검 안내가 나오면 미루지 말고 안과·소아 진료를 검토하세요',
        lead: '선별 검사는 확진이 아닙니다. 사진 앱으로 처방하지 마세요.',
        points: [
            ['다음', '재검 예약'],
            ['관찰', '눈 찡그림, 책 가까이']
        ],
        blocks: [
            ['지금 할 일', '결과지를 가지고 진료에 가세요.'],
            ['하지 않을 일', '재검을 미루지 마세요.'],
            ['관련', '눈·사시 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'lazy-eye-amblyopia-boundary',
        match: /(약시|게으른\s*눈|lazy\s*eye|amblyopia|한쪽\s*눈\s*잘\s*안|가림\s*치료)/,
        title: '한쪽 시력이 약한 약시 의심은 조기 시력 평가가 중요하고, 온라인으로 단정하지 마세요',
        lead: '약시는 한쪽 눈의 시력 발달이 약해질 수 있는 상태이며, 일찍 발견하면 치료 여지가 커질 수 있습니다. 사진·가정 테스트만으로 진단하지 마세요. 가림 치료·안경 여부는 안과·의료진이 정합니다. 제품 추천은 하지 않습니다.',
        points: [
            ['신호', '한쪽으로만 봄, 사시, 고개 기울임, 가족력'],
            ['행동', '정기 시력·사시 검진, 이상 시 의뢰']
        ],
        blocks: [
            ['지금 할 일', '눈이 몰리는지·빛 반사가 대칭인지 관찰하세요.'],
            ['하지 않을 일', 'SNS 처방으로 가림 시간을 정하지 마세요.'],
            ['관련', '사시·시력 걱정 안내를 참고하세요.']
        ],
        links: [
            ['AAP 시력·약시 개요', 'https://www.healthychildren.org/English/health-issues/conditions/eyes/Pages/default.aspx'],
            ['CDC 시력 건강 개요', 'https://www.cdc.gov/vision-health/']
        ]
    },
    {
        id: 'color-blind-screening-boundary',
        match: /(색맹|색각\s*이상|color\s*blind|색깔\s*구분\s*못|색약\s*아이|색\s*이름\s*틀)/,
        title: '색 구분이 어렵다고 느껴도 온라인 테스트로 단정하지 말고, 시력 검진에서 확인하세요',
        lead: '색각 이상은 남아에게 더 흔할 수 있으나 가정 앱·그림 테스트만으로 진단하지 마세요. 학교·일상에서 어려움이 있으면 시력·색각 검사를 의료진과 상의합니다. “고치는 안경” 광고 순위는 하지 않습니다.',
        points: [
            ['관찰', '빨강·초록 혼동, 색 이름 어려움, 가족력'],
            ['상담', '시력 검진, 학습·안전(신호등) 도움']
        ],
        blocks: [
            ['지금 할 일', '일상에서 어떤 색을 헷갈리는지 적어 두세요.'],
            ['하지 않을 일', '인터넷 색맹 테스트 결과로 단정하지 마세요.'],
            ['관련', '사시·약시·시력 안내를 참고하세요.']
        ],
        links: [
            ['AAP 시력·눈 건강 개요', 'https://www.healthychildren.org/English/health-issues/conditions/eyes/Pages/default.aspx'],
            ['CDC 시력 건강', 'https://www.cdc.gov/vision-health/']
        ]
    },
    {
        id: 'strabismus-when-eval-boundary',
        match: /(사시\s*검사\s*시기|눈\s*몰림\s*진료|strabismus\s*eval|사시\s*언제\s*병원|동공\s*흰자\s*빛)/,
        title: '눈 몰림·빛 반사가 걱정되면 사진 진단 대신 안과·소아 진료로 확인하세요',
        lead: '조기 발견이 중요할 수 있습니다. 앱 사진 분석만으로 병명을 정하지 않습니다.',
        points: [
            ['상담', '지속 몰림, 가족력'],
            ['금지', '사진 단정']
        ],
        blocks: [
            ['지금 할 일', '언제부터 보였는지 기록하세요.'],
            ['하지 않을 일', '인터넷 사진 비교로 괜찮다고 단정하지 마세요.'],
            ['관련', '사시 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['눈 안내', '#home']
        ]
    },
    {
        id: 'strabismus-eye-check',
        match: /(사시|눈이\s*몰|눈\s*떨|간헐\s*사시|한눈\s*안\s*봄|눈이\s*바깥|백색\s*동공|눈동자\s*흰)/,
        title: '눈 몰림·백색 동공 의심은 사진 판정이 아니라 진료로 확인합니다',
        lead: '신생아는 잠깐 눈이 어긋되어 보일 수 있지만, 지속되거나 한 눈만 안 쓰거나, 동공이 하얗게 보이면 의료진 평가가 필요합니다. 휴대폰 사진·필터로 병명을 정하지 마세요. 시력·안과 검사는 의사 안내를 따릅니다.',
        points: [
            ['관찰', '지속 시간, 양쪽 대칭, 빛에 대한 반응, 백색 동공'],
            ['진료', '지속 사시, 눈 떨림, 백색 동공, 시력 걱정']
        ],
        blocks: [
            ['지금 할 일', '언제부터·얼마나 자주인지 기록하세요.'],
            ['하지 않을 일', '안대·민간 교정 기구를 자가로 쓰지 마세요.'],
            ['관련', '눈곱·발달 안내를 참고하세요.']
        ],
        links: [
            ['AAP 사시', 'https://www.healthychildren.org/English/health-issues/conditions/eyes/Pages/Strabismus.aspx'],
            ['CDC 아동 시력', 'https://www.cdc.gov/vision-health/']
        ]
    },
    {
        id: 'hearing-rescreen-boundary',
        match: /(청력\s*재검|신생아\s*청력\s*재|hearing\s*rescreen|청력\s*검사\s*다시)/,
        title: '신생아 청력 재검 안내는 일정대로 받고, 반응 부족이 계속되면 미루지 마세요',
        lead: '조기 확인이 중요합니다. 통과 후에도 언어 지연이 있으면 재평가를 검토하세요.',
        points: [
            ['일정', '재검 예약 준수'],
            ['관찰', '소리 반응, 언어']
        ],
        blocks: [
            ['지금 할 일', '재검 날짜를 지키세요.'],
            ['하지 않을 일', '나중에 하자며 미루지 마세요.'],
            ['관련', '청력 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'classroom-hearing-concern-boundary',
        match: /(수업\s*중\s*안\s*들|선생님\s*말\s*못\s*들|classroom\s*hearing|뒤에서\s*부르면\s*모름|청력\s*학교\s*걱정)/,
        title: '수업 중 말을 자주 못 듣는다면 청력·주의력 평가를 의료진·학교와 상의하세요',
        lead: '한 가지 원인으로 단정하지 않습니다. 조기 확인이 도움이 될 수 있습니다.',
        points: [
            ['관찰', '상황 기록'],
            ['상담', '청력·학습']
        ],
        blocks: [
            ['지금 할 일', '언제 못 듣는지 적어 보세요.'],
            ['하지 않을 일', '혼만 내지 말고 평가를 검토하세요.'],
            ['관련', '청력 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'hearing-concern-boundary',
        match: /(청력|귀\s*안\s*들|소리\s*반응\s*없|난청|보청|이름\s*불러도\s*모름|청각\s*검사)/,
        title: '소리 반응이 걱정되면 기다리지 말고 청력 확인 경로를 밟으세요',
        lead: '이름에 반응하지 않거나, 큰 소리에도 반응이 약하거나, 언어가 또래보다 많이 걱정되면 청력·발달을 의료진과 상의하세요. “남자아이라 늦다”로 미루지 않는 편이 안전합니다. 이 안내만으로 난청을 진단하지 않습니다.',
        points: [
            ['신호', '소리 반응 약함, 언어 지연 걱정, 한쪽만 듣는 듯'],
            ['행동', '검진·이비인후·소아 상담, 필요 시 청력 검사']
        ],
        blocks: [
            ['지금 할 일', '걱정되는 상황을 구체적으로 적어 진료에 가져가세요.'],
            ['하지 않을 일', '큰 TV 소리로 “들리게” 보상하려 하지 마세요.'],
            ['관련', '언어 발달·중이염 안내를 참고하세요.']
        ],
        links: [
            ['CDC 아동 청력', 'https://www.cdc.gov/hearing-loss-children/'],
            ['발달·K-DST 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'return-school-sick-boundary',
        match: /(등원\s*언제\s*가능|등교\s*언제|언제\s*어린이집\s*가도|return\s*to\s*school\s*sick|열\s*떨어진\s*뒤\s*등원|전염\s*끝난\s*언제)/,
        title: '등원·등교 재개는 시설 규정과 증상(열·설사·발진 등) 소실을 기준으로 하세요',
        lead: '감염병마다 격리·등원 기준이 다릅니다. 열이 내린 뒤에도 시설 안내와 의료진 권고를 확인하세요. “하루만 쉬면 된다”고 단정하지 않습니다. 학교·어린이집 공지를 우선하세요.',
        points: [
            ['확인', '시설 보건 규정, 진단명, 증상 소실'],
            ['일반', '발열·구토·설사 후 안정, 컨디션']
        ],
        blocks: [
            ['지금 할 일', '어린이집·학교 아픈 아이 규정을 열어 보세요.'],
            ['하지 않을 일', '해열제로 열만 내리고 억지로 보내지 마세요.'],
            ['관련', '발열·등원·손 씻기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 학교·보육 건강 개요', 'https://www.cdc.gov/healthy-schools/'],
            ['AAP 등원·감염 개요', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'antibiotic-return-daycare-boundary',
        match: /(항생제\s*먹고\s*등원|항생제\s*후\s*어린이집|antibiotic\s*return\s*daycare|항생제\s*복용\s*중\s*등원)/,
        title: '항생제를 먹는 중 등원은 진단·시설 규정·증상 호전을 함께 보고, 약만으로 단정하지 마세요',
        lead: '전염 가능 기간은 질환마다 다릅니다. 시설 지침과 의료진 안내를 따르세요. 용량은 여기서 정하지 않습니다.',
        points: [
            ['기준', '열·증상, 시설 규정'],
            ['상담', '진단명별 격리']
        ],
        blocks: [
            ['지금 할 일', '어린이집 복귀 규정을 확인하세요.'],
            ['하지 않을 일', '열이 있는데 약만 믿고 보내지 마세요.'],
            ['관련', '등원 재개·항생제 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['등원 안내', '#home']
        ]
    },
    {
        id: 'sick-return-daycare',
        match: /(어린이집\s*등원|어린이집\s*복귀|열이\s*떨어져\s*등원|아파서\s*못\s*가|등원\s*기준|어린이집\s*며칠)/,
        title: '아픈 뒤 등원은 열·전신 상태와 시설 안내를 함께 보고, 같은 “무조건 ○시간”만 따르지 않습니다',
        lead: '열이 내린 뒤에도 처지거나 심하게 보채면 쉬는 편이 나을 수 있습니다. 많은 시설이 자체 등원 기준을 두므로 안내문을 확인하세요. 항생제·해열제 용량으로 등원 가능 여부를 사이트에서 정하지 않습니다. 전염이 걱정되면 시설·의료진과 상의하세요.',
        points: [
            ['볼 것', '24시간 흐름의 열·활력·식사·호흡, 시설 규정'],
            ['쉬기', '처짐, 호흡 이상, 설사·구토 심함, 의료진 격리 권고']
        ],
        blocks: [
            ['지금 할 일', '시설 등원 기준과 오늘 아이 상태를 대조하세요.'],
            ['하지 않을 일', '해열제로 열만 내린 직후 무리하게 보내지 마세요.'],
            ['관련', '발열·손 씻기·접종 후 안내를 참고하세요.']
        ],
        links: [
            ['CDC 손위생·돌봄 환경', 'https://www.cdc.gov/hygiene/'],
            ['발열 가이드', 'blog/baby-fever-cold-guide.html']
        ]
    },
    {
        id: 'clothing-tag-sensitivity-boundary',
        match: /(옷\s*태그\s*거부|라벨\s*따가|clothing\s*tag\s*sensitiv|옷\s*시접\s*싫어|양말\s*시접\s*거부)/,
        title: '옷 태그·시접에 예민하면 자르거나 부드러운 옷을 검토하고, 강요로 싸움을 키우지 마세요',
        lead: '일상 기능이 크게 방해되면 상담을 검토하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['조절', '태그 제거, 소재'],
            ['태도', '비난 금지']
        ],
        blocks: [
            ['지금 할 일', '태그를 깨끗이 제거해 보세요.'],
            ['하지 않을 일', '예민하다고 혼내지 마세요.'],
            ['관련', '감각 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['AAP 가족', 'https://www.healthychildren.org/English/family-life/family-dynamics/communication-discipline/Pages/default.aspx']
        ]
    },
    {
        id: 'sensory-sensitivity-boundary',
        match: /(감각\s*예민|감각\s*과민|촉각\s*예민|소리\s*예민|옷\s*태그|양말\s*싫어|감각\s*통합|sensory)/,
        title: '감각이 예민해 보여도 장애 여부를 검색으로 단정하지 않습니다',
        lead: '소리·옷감·촉감에 예민한 모습은 아이마다 다를 수 있습니다. 인터넷 체크리스트로 자폐·장애를 단정하지 마세요. 일상·수면·먹기가 크게 방해되거나 보호자 걱정이 계속되면 소아·발달 상담을 연결합니다. 특정 치료·교구 순위는 하지 않습니다.',
        points: [
            ['가정', '갑자기 강한 자극 줄이기, 미리 알리기, 편한 옷·환경 시도'],
            ['상담', '일상 방해가 크거나 발달 걱정이 함께 있을 때']
        ],
        blocks: [
            ['지금 할 일', '어떤 상황에서 힘든지 구체적으로 적어 보세요.'],
            ['하지 않을 일', '예민함을 “버릇”으로만 혼내거나 SNS로 진단하지 마세요.'],
            ['관련', '떼쓰기·발달·청력 안내를 참고하세요.']
        ],
        links: [
            ['CDC 아동 발달 관찰', 'https://www.cdc.gov/ncbddd/actearly/milestones/index.html'],
            ['발달·K-DST 가이드', 'blog/development-kdst-guide.html#milestones'],
            ['AAP 아동 행동 개요', 'https://www.healthychildren.org/English/healthy-living/emotional-wellness/Pages/default.aspx']
        ]
    },
    {
        id: 'facing-out-carrier-boundary',
        match: /(앞보기\s*아기띠|바깥\s*보기\s*아기띠|전방\s*아기띠|facing\s*out\s*carrier|앞으로\s*보는\s*캐리어|아기띠\s*앞보기)/,
        title: '아주 어린 아기는 안보기(보호자 쪽) 자세가 우선이고, 앞보기는 발달·제품 한도 후입니다',
        lead: '목·몸통 지지가 충분하지 않은 시기에 바깥을 보는 앞보기 착용은 권고되지 않는 경우가 많습니다. 얼굴이 보이고 숨길이 열린 안보기 자세를 먼저 쓰고, 앞보기는 제품 최소 월령·체중과 의료·제품 안내를 따르세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['우선', '안보기, 기도 개방, T.I.C.K.S. 등 안전 자세'],
            ['앞보기', '제품 한도·목 가눔 이후, 장시간 지양']
        ],
        blocks: [
            ['지금 할 일', '사용 중인 아기띠 설명서의 앞보기 허용 월령을 확인하세요.'],
            ['하지 않을 일', '신생아에게 앞보기로 오래 태우지 마세요.'],
            ['관련', '아기띠·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 아기띠 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Baby-Carriers-Backpacks-and-Slings.aspx'],
            ['CDC 안전수면(재우기≠캐리어)', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['아기띠 안내', '#home']
        ]
    },
    {
        id: 'baby-carrier-airway-boundary',
        match: /(아기띠\s*숨\s*막|아기띠\s*통풍|baby\s*carrier\s*airway|슬링\s*얼굴\s*묻|캐리어\s*턱\s*가슴)/,
        title: '아기띠는 얼굴이 보이고 코·입이 막히지 않게, 턱이 가슴에 묻히지 않게 하세요',
        lead: '기도 확보가 최우선입니다. 자세·제품 설명서를 확인하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['자세', '얼굴 보임, 기도 열림'],
            ['금지', '고개 숙여 묻힘']
        ],
        blocks: [
            ['지금 할 일', '자주 얼굴을 확인하세요.'],
            ['하지 않을 일', '천으로 얼굴을 가리지 마세요.'],
            ['관련', '슬링·아기띠 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'babywearing-heat-boundary',
        match: /(아기띠\s*여름\s*더위|아기띠\s*여름\s*더위|슬링\s*폭염|babywearing\s*heat)/,
        title: '더운 날 아기띠는 과열·탈수를 보고 그늘·수분을 챙기며 얼굴을 자주 확인하세요',
        lead: '기도가 막히지 않게 하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['확인', '얼굴, 땀, 호흡'],
            ['휴식', '그늘, 내리기']
        ],
        blocks: [
            ['지금 할 일', '자주 얼굴을 보세요.'],
            ['하지 않을 일', '두꺼운 외투로 같이 덮지 마세요.'],
            ['관련', '아기띠·열 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 열', 'https://www.cdc.gov/heat-health/']
        ]
    },
    {
        id: 'babywearing-sling-safety',
        match: /(아기띠|슬링|힙시트|베이비웨어|baby\s*wearing|포대기\s*안전)/,
        title: '아기띠·슬링은 얼굴이 보이고 숨길이 열린 자세가 우선입니다',
        lead: '안기 도구는 편리하지만, 얼굴이 가리거나 턱이 가슴에 눌리면 호흡이 위험할 수 있습니다. 입·코가 보이고, 가깝고 높이, 무릎이 높고 등이 둥근 자세 등 안전 안내를 따르세요. 재우기용으로 기대어 재우거나 카시트 대신 쓰지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['확인', '입·코 보임, 고개 처짐 없음, 보호자가 수시로 확인'],
            ['금지', '얼굴 덮기, 굽은 자세로 오래 두기, 수면 표면 대체']
        ],
        blocks: [
            ['지금 할 일', '착용 후 거울로 아이 얼굴·호흡을 확인하세요.'],
            ['하지 않을 일', '요리·뜨거운 음료 들 때 아기를 앞으로만 기대지 마세요.'],
            ['관련', '안전수면·낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 아기띠 안전', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Baby-Carriers-Backpacks-and-Slings.aspx'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/'],
            ['안전수면 가이드', 'blog/baby-safe-sleep-guide.html']
        ]
    },
    {
        id: 'monitor-privacy-wifi-boundary',
        match: /(베이비\s*모니터\s*해킹|모니터\s*와이파이|baby\s*monitor\s*privacy|홈캠\s*비밀번호|카메라\s*해킹\s*아기|모니터\s*프라이버시)/,
        title: '와이파이 모니터·홈캠은 강한 비밀번호와 최신 업데이트를 쓰고, 불필요 공유를 끄세요',
        lead: '연결된 카메라는 프라이버시 위험이 있을 수 있습니다. 기본 비밀번호를 바꾸고 공개 링크를 쓰지 마세요. 제품 순위는 하지 않습니다.',
        points: [
            ['보안', '비밀번호, 업데이트'],
            ['공유', '불필요 계정 제거']
        ],
        blocks: [
            ['지금 할 일', '기본 비밀번호를 바꾸세요.'],
            ['하지 않을 일', '공개 URL로 영상을 공유하지 마세요.'],
            ['관련', '모니터 줄·맘카 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'smart-speaker-child-boundary',
        match: /(스마트\s*스피커\s*아이|스마트\s*스피커\s*아이|AI\s*스피커\s*아기|smart\s*speaker\s*child)/,
        title: '스마트 스피커는 전선·전복을 보고, 개인정보·구매 명령을 잠그세요',
        lead: '브랜드 순위는 하지 않습니다. 코드 감김을 조심하세요.',
        points: [
            ['배치', '안정, 코드'],
            ['설정', '구매 잠금']
        ],
        blocks: [
            ['지금 할 일', '아이 손이 닿기 어렵게 두세요.'],
            ['하지 않을 일', '음성 구매를 열어 두지 마세요.'],
            ['관련', '모니터·가정 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'baby-monitor-cord-safety',
        match: /(베이비\s*모니터\s*줄|baby\s*monitor\s*cord|감시\s*카메라\s*전선|모니터\s*코드\s*목|적외선\s*카메라\s*줄)/,
        title: '베이비 모니터·카메라 전선은 아기 손에 닿지 않게 벽에 고정하세요',
        lead: '모니터 전원 코드·카메라 줄이 침대 안으로 늘어지면 목 감김 위험이 있습니다. 코드를 짧게 정리하고 아기 팔 닿지 않는 곳에 두세요. 특정 모니터 브랜드 순위는 하지 않습니다.',
        points: [
            ['설치', '코드 고정, 침대 난간 밖, 여유 줄 최소화'],
            ['수면', '모니터가 있어도 안전수면 원칙은 그대로']
        ],
        blocks: [
            ['지금 할 일', '카메라·모니터 줄이 침대 안으로 드리워졌는지 확인하세요.'],
            ['하지 않을 일', '아기 얼굴 바로 위에 장치를 매달지 마세요.'],
            ['관련', '블라인드 줄·안전수면 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 코드·질식 위험', 'https://www.cpsc.gov/'],
            ['AAP 안전수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/A-Parents-Guide-to-Safe-Sleep.aspx']
        ]
    },
    {
        id: 'blackout-curtain-cord-safety',
        match: /(암막\s*커튼\s*줄|블라인드\s*줄\s*아기|blackout\s*curtain\s*cord|커튼\s*끈\s*감|암막\s*코드)/,
        title: '암막 커튼·블라인드 줄은 아이 손이 닿지 않게 묶거나 무선 제품을 검토하세요',
        lead: '창문 줄 목 감김 사고가 보고됩니다. 줄을 짧게 정리하고 침대 옆에 두지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['조치', '줄 정리, 침대 거리'],
            ['점검', '당김, 고리']
        ],
        blocks: [
            ['지금 할 일', '줄이 침대·바닥에 늘어지지 않게 하세요.'],
            ['하지 않을 일', '긴 줄을 아이 손에 닿게 두지 마세요.'],
            ['관련', '블라인드 줄 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'kite-string-safety',
        match: /(연\s*줄|kite\s*string|연\s*날리|연줄|연\s*전선)/,
        title: '연은 전선·도로 근처에서 날리지 말고, 줄이 목에 감기지 않게 보세요',
        lead: '전선 접촉과 줄 감김이 위험합니다. 탁 트인 공원에서 성인 감독 아래 날리세요.',
        points: [
            ['장소', '전선 멀리, 차도 금지'],
            ['줄', '목·손 감김 주의']
        ],
        blocks: [
            ['지금 할 일', '전선이 없는 넓은 곳을 고르세요.'],
            ['하지 않을 일', '전선 근처에서 연을 날리지 마세요.'],
            ['관련', '야외 놀이 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'jump-rope-strangulation-boundary',
        match: /(줄넘기\s*목|줄넘기\s*감|jump\s*rope\s*strang|넘기\s*줄\s*목|로프\s*목에)/,
        title: '줄넘기 줄이 목에 감기지 않게 하고, 어린 아이에게는 긴 줄을 혼자 두지 마세요',
        lead: '긴 줄은 목 감김 위험이 있습니다. 연령에 맞게 쓰고 감독하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['감독', '어린 아이 곁에'],
            ['보관', '줄 정리, 목 감김 주의']
        ],
        blocks: [
            ['지금 할 일', '줄이 목에 닿지 않게 가르치세요.'],
            ['하지 않을 일', '유아 혼자 긴 줄을 가지고 놀게 두지 마세요.'],
            ['관련', '끈·목 감김 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'cordless-blind-prefer-boundary',
        match: /(블라인드\s*코드\s*절단|블라인드\s*코드\s*절단|무선\s*블라인드\s*아이|cordless\s*blind\s*prefer)/,
        title: '창문 블라인드 줄은 짧게 묶거나 무선 제품을 검토하고 침대 옆에 두지 마세요',
        lead: '목 감김 사고가 보고됩니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['조치', '줄 정리, 무선'],
            ['배치', '침대 거리']
        ],
        blocks: [
            ['지금 할 일', '늘어지는 줄을 치우세요.'],
            ['하지 않을 일', '줄로 놀지 않게 하세요.'],
            ['관련', '블라인드 줄 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'blind-cord-strangulation',
        match: /(블라인드\s*줄|커튼\s*줄|코드\s*감김|블라인드\s*안전|창문\s*줄|코드리스)/,
        title: '블라인드·커튼 줄은 감김 질식 위험이 있어 아이 손이 닿지 않게 하세요',
        lead: '긴 줄·루프 형태 코드는 목에 감길 수 있습니다. 코드를 묶어 올리거나 코드리스 제품을 쓰는 등 안내를 따르고, 아기 침대·소파 옆에 줄이 늘어지지 않게 하세요. 특정 브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '줄 정리·고정, 침대 옆 금지, 루프 제거'],
            ['점검', '이사·계절 커튼 교체 때 다시 확인']
        ],
        blocks: [
            ['지금 할 일', '아이 방에 늘어진 블라인드 줄이 있는지 살펴보세요.'],
            ['하지 않을 일', '줄 있는 창가에 아기 침대를 붙이지 마세요.'],
            ['관련', '집 안 안전·질식 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 창문 덮개 줄 안전', 'https://www.cpsc.gov/Safety-Education/Safety-Education-Centers/Window-Covering'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'grocery-cart-cover-boundary',
        match: /(장바구니\s*커버|카트\s*커버|grocery\s*cart\s*cover|쇼핑카트\s*시트|카트\s*위생\s*커버)/,
        title: '쇼핑 카트에는 벨트가 있는 칸에 앉히고, 커버는 위생 보조일 뿐 전복 방지는 아닙니다',
        lead: '카트 낙상이 흔합니다. 아이를 바구니·바구니에 태우지 마세요. 커버 브랜드 순위는 하지 않습니다.',
        points: [
            ['좌석', '벨트 칸, 손 잡기'],
            ['금지', '바구니·손잡이 탑승']
        ],
        blocks: [
            ['지금 할 일', '카트 벨트를 채우세요.'],
            ['하지 않을 일', '카트 안에서 서게 두지 마세요.'],
            ['관련', '쇼핑카트 낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'museum-child-safety',
        match: /(박물관|미술관|museum\s*with\s*toddler|전시\s*만지지|박물관\s*유모차|박물관\s*아이)/,
        title: '박물관·미술관에서는 손을 잡고, 유리·난간·계단에서 뛰어다니지 않게 하세요',
        lead: '붐비는 전시 공간은 충돌·낙상 위험이 있습니다. 유모차·캐리어 규칙을 시설에 확인하세요.',
        points: [
            ['이동', '손잡기, 유모차 규칙'],
            ['주의', '계단, 난간, 유리']
        ],
        blocks: [
            ['지금 할 일', '시설 유모차 정책을 미리 보세요.'],
            ['하지 않을 일', '난간 사이로 몸을 내밀지 않게 하세요.'],
            ['관련', '낙상·외출 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 낙상', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'shopping-cart-buckle-boundary',
        match: /(쇼핑\s*카트\s*벨트\s*채|장바구니\s*안전띠\s*매|shopping\s*cart\s*buckle|카트\s*좌석\s*벨트\s*채)/,
        title: '쇼핑 카트 좌석 벨트를 채우고, 바구니·손잡이에 태우지 마세요',
        lead: '카트 낙상은 흔합니다. 커버만으로 전복을 막지 못합니다.',
        points: [
            ['좌석', '벨트 칸'],
            ['금지', '바구니 탑승']
        ],
        blocks: [
            ['지금 할 일', '벨트가 있으면 꼭 채우세요.'],
            ['하지 않을 일', '카트 안에서 서게 두지 마세요.'],
            ['관련', '쇼핑카트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'shopping-cart-standing-base-boundary',
        match: /(카트\s*아래\s*타|쇼핑카트\s*발판\s*타|shopping\s*cart\s*stand\s*base|카트\s*밑\s*올라|카트\s*타는\s*아이)/,
        title: '쇼핑 카트 아래 발판·바구니에 타지 않게 하고, 좌석 벨트를 채우세요',
        lead: '전복·끼임 사고가 납니다.',
        points: [
            ['좌석', '벨트 칸'],
            ['금지', '아래·바구니 탑승']
        ],
        blocks: [
            ['지금 할 일', '벨트를 채우세요.'],
            ['하지 않을 일', '카트를 밀며 타게 두지 마세요.'],
            ['관련', '쇼핑카트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'shopping-cart-fall',
        match: /(쇼핑\s*카트|카트\s*추락|카트에\s*앉|장바구니\s*카트|카트\s*낙상)/,
        title: '쇼핑 카트에서는 아기를 세우거나 바구니에 앉히지 말고, 벨트 좌석을 쓰세요',
        lead: '카트 추락은 머리 부상의 흔한 원인 중 하나로 알려져 있습니다. 가능하면 카트 전용 벨트 좌석을 쓰고, 바구니·아래칸에 태우거나 카트 옆을 걷게 하지 마세요. 카트를 남겨 둔 채 자리를 비우지 마세요.',
        points: [
            ['안전', '벨트 좌석, 보호자 손 잡기, 바구니 탑승 금지'],
            ['대안', '캐리어·유모차 병행']
        ],
        blocks: [
            ['지금 할 일', '마트에서 카트 벨트 사용 가능 여부를 확인하세요.'],
            ['하지 않을 일', '카트에 아이를 세운 채 밀지 마세요.'],
            ['관련', '낙상·머리 부딪힘 안내를 참고하세요.']
        ],
        links: [
            ['AAP 쇼핑 카트 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Shopping-Cart-Safety.aspx'],
            ['CDC 낙상 예방', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'water-beads-danger',
        match: /(워터비즈|워터\s*비즈|오르비|물\s*구슬|워터볼|water\s*bead)/,
        title: '워터비즈(물 구슬)는 삼키면 장 폐색 위험이 있어 어린 아이 주변에 두지 마세요',
        lead: '물을 머금고 커지는 비즈는 삼키면 커져 장에 문제를 일으킬 수 있다는 안전 경고가 있습니다. 장난감·감각 놀이로도 어린 아이·장애 아동 주변에서는 특히 주의합니다. 삼킨 것이 의심되면 경과를 집에서만 보지 말고 진료하세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['예방', '영유아 손 닿지 않게, 바닥에 흩어진 알 즉시 치우기'],
            ['의심 시', '복통·구토·처짐이면 바로 진료']
        ],
        blocks: [
            ['지금 할 일', '집에 워터비즈가 있으면 아이 방에 두지 마세요.'],
            ['하지 않을 일', '“감각 놀이”라며 영아에게 맡기지 마세요.'],
            ['관련', '단추전지·질식·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CPSC 워터비즈 경고', 'https://www.cpsc.gov/'],
            ['AAP 이물질 삼킴 개요', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'nail-salon-chemicals-boundary',
        match: /(네일숍\s*아기|네일\s*살롱\s*아이|nail\s*salon\s*baby|매니큐어\s*샵\s*아이|네일\s*냄새\s*아기)/,
        title: '네일숍의 강한 냄새·용제는 환기가 중요하고, 영아를 오래 데려가지 않는 편이 낫습니다',
        lead: '네일 리무버·아크릴 등 화학 냄새는 자극이 될 수 있습니다. 가능하면 아이를 동반하지 않거나, 짧게·환기되는 자리를 선택하세요. 제품·샵 순위는 하지 않습니다.',
        points: [
            ['예방', '환기, 짧은 체류, 제품 방치 금지'],
            ['노출', '눈·호흡 자극 시 밖으로']
        ],
        blocks: [
            ['지금 할 일', '집 네일 용품을 잠가 두세요.'],
            ['하지 않을 일', '리무버를 아이 옆 탁자에 열어 두지 마세요.'],
            ['관련', '매니큐어 중독·에센셜 오일 안내를 참고하세요.']
        ],
        links: [
            ['CDC 실내 공기·자극 개요', 'https://www.cdc.gov/niosh/topics/indoorenv/'],
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'diffuser-essential-oil-child-boundary',
        match: /(디퓨저|아로마\s*디퓨저|essential\s*oil\s*diffuser|에센셜\s*오일\s*가습|향\s*디퓨저)/,
        title: '에센셜 오일 디퓨저는 영아 방에 과다 사용하지 말고, 섭취·피부 도포를 금하세요',
        lead: '일부 오일은 자극·중독 위험이 있습니다. 치료 효과 광고를 그대로 믿지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['주의', '환기, 과다 금지'],
            ['금지', '섭취, 영아 피부 도포']
        ],
        blocks: [
            ['지금 할 일', '아이 손이 닿는 곳에 오일을 두지 마세요.'],
            ['하지 않을 일', '원액을 피부에 바르지 마세요.'],
            ['관련', '에센셜 오일 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'essential-oils-infant-boundary',
        match: /(에센셜\s*오일|아로마\s*오일|티트리\s*오일|페퍼민트\s*오일|영아\s*아로마|디퓨저\s*아기)/,
        title: '영아에게 에센셜 오일을 바르거나 진하게 흡입시키는 것은 권하지 않습니다',
        lead: '향유·디퓨저는 “천연”이어도 자극·중독·호흡 자극 위험이 있을 수 있습니다. 특히 어린 영아 피부에 원액을 바르거나 밀폐 공간에서 강하게 틀지 마세요. 치료 효과·용량을 사이트에서 정하지 않으며, 피부·호흡 이상이 있으면 사용을 멈추고 진료하세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['경계', '원액 도포, 먹이기, 영아 얼굴 근처 강한 디퓨저'],
            ['우선', '환기, 의료진 상담 없는 치료 목적 사용 자제']
        ],
        blocks: [
            ['지금 할 일', '아이 방에 디퓨저가 가까이 있으면 거리·시간을 줄이세요.'],
            ['하지 않을 일', '발진·콧물에 오일을 민간 치료로 바르지 마세요.'],
            ['관련', '발진·호흡·중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 화학·중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 실내 공기·자극 개요', 'https://www.cdc.gov/niosh/topics/indoorenv/']
        ]
    },
    {
        id: 'bath-mat-suction-boundary',
        match: /(욕실\s*매트)/,
        title: '욕조 매트는 흡착·청결을 점검하고, 매트만 믿고 감독을 줄이지 마세요',
        lead: '곰팡이·헐거운 흡착은 오히려 위험할 수 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['점검', '흡착, 세척'],
            ['감독', '팔 닿는 거리']
        ],
        blocks: [
            ['지금 할 일', '사용 전 매트를 눌러 고정하세요.'],
            ['하지 않을 일', '아기를 욕조에 혼자 두지 마세요.'],
            ['관련', '욕조 미끄럼 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['AAP 물 안전', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Water-Safety-And-Young-Children.aspx']
        ]
    },
    {
        id: 'hair-dryer-bathroom-boundary',
        match: /(헤어드라이어\s*욕실|드라이기\s*물\s*근처|hair\s*dryer\s*bath|욕실\s*전기\s*아이|드라이기\s*감전)/,
        title: '욕실에서 헤어드라이어 등 전기 제품은 물과 거리를 두고, 사용한 뒤 코드를 뽑으세요',
        lead: '감전·화상 위험이 있습니다. 아이 손에 두지 마세요.',
        points: [
            ['사용', '건조한 손, 거리'],
            ['보관', '코드 정리']
        ],
        blocks: [
            ['지금 할 일', '사용 후 전원을 뽑으세요.'],
            ['하지 않을 일', '욕조 물에 가까이 두지 마세요.'],
            ['관련', '감전·화상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'bathtub-slip-safety',
        match: /(욕조\s*미끄|목욕\s*미끄러|bathtub\s*slip|욕조\s*낙상|샤워\s*미끄|목욕\s*매트)/,
        title: '욕조·샤워 바닥은 미끄럼을 줄이고, 아이를 혼자 두지 마세요',
        lead: '물기 있는 바닥에서 미끄러져 머리 부상을 입을 수 있습니다. 미끄럼 방지, 한 손 이상 잡기, 얕은 물에서도 감독이 필요합니다. 특정 매트 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '미끄럼 방지, 손잡이, 장난감 정리'],
            ['감독', '벨 소리에도 자리 비우지 않기']
        ],
        blocks: [
            ['지금 할 일', '욕조 바닥과 가장자리 물기를 점검하세요.'],
            ['하지 않을 일', '물 받아 둔 욕조에 아이만 두지 마세요.'],
            ['관련', '목욕 수온·익사 예방 안내를 참고하세요.']
        ],
        links: [
            ['CDC 낙상·익사 예방', 'https://www.cdc.gov/drowning/prevention/index.html'],
            ['AAP 목욕 안전', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/default.aspx']
        ]
    },
    {
        id: 'shower-temperature-child-boundary',
        match: /(샤워\s*온도\s*아이|아이\s*샤워\s*뜨거|shower\s*temp\s*child|샤워기\s*화상\s*아기|아이와\s*샤워)/,
        title: '아이와 샤워할 때는 물을 먼저 맞춰 온도를 확인하고, 갑자기 뜨거운 물이 나오지 않게 하세요',
        lead: '성인 선호 온도가 아이에게는 뜨거울 수 있습니다. 욕조 물 온도와 같은 원칙을 적용하세요.',
        points: [
            ['확인', '손목으로 온도'],
            ['주의', '급격한 온도 변화']
        ],
        blocks: [
            ['지금 할 일', '물을 맞춘 뒤 아이를 들이세요.'],
            ['하지 않을 일', '등 뒤를 본 사이 아이가 수도를 돌리게 두지 마세요.'],
            ['관련', '목욕 물 온도 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'fill-tub-before-child-boundary',
        match: /(욕조\s*물\s*미리|목욕\s*물\s*받아\s*두고|fill\s*tub\s*before|아이\s*넣기\s*전\s*물|욕조\s*먼저\s*받기)/,
        title: '아이를 넣기 전에 물을 받아 온도를 맞추고, 받는 동안 아이를 욕조에 두지 마세요',
        lead: '뜨거운 물이 갑자기 나올 수 있습니다. 수도를 아이 손이 닿지 않게 하세요.',
        points: [
            ['순서', '물 받기 → 온도 → 입욕'],
            ['금지', '받는 중 방치']
        ],
        blocks: [
            ['지금 할 일', '손목으로 온도를 확인하세요.'],
            ['하지 않을 일', '물을 틀어 둔 채 자리를 비우지 마세요.'],
            ['관련', '목욕 온도 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상', 'https://www.cdc.gov/burn-prevention/'],
            ['목욕 가이드', 'blog/baby-bath-guide.html']
        ]
    },
    {
        id: 'bath-water-temperature',
        match: /(목욕\s*물\s*온도|욕조\s*온도|뜨거\s*운\s*물\s*목욕|목욕\s*몇\s*도|수온\s*목욕)/,
        title: '목욕물은 미지근하게, 받기 전 손목·팔꿈치로 온도를 확인하세요',
        lead: '너무 뜨거운 물은 화상의 원인이 됩니다. 물을 받은 뒤 손을 넣어 확인하고, 아이를 넣기 전 다시 봅니다. 수도 온도를 낮추는 가정도 있습니다. 정확한 “한 온도 숫자”만으로 모든 집을 단정하지 않으며, 화상 시 흐르는 물로 식히고 진료 여부를 봅니다.',
        points: [
            ['확인', '미지근, 한곳만 뜨겁지 않게, 아이 혼자 두지 않기'],
            ['화상', '흐르는 물로 식히기, 민간 연고 금지']
        ],
        blocks: [
            ['지금 할 일', '목욕 전 온도 확인 습관을 고정하세요.'],
            ['하지 않을 일', '받고 있는 뜨거운 물 아래에 아이를 두지 마세요.'],
            ['관련', '신생아 목욕·화상·익사 예방 안내를 참고하세요.']
        ],
        links: [
            ['AAP 목욕 안전', 'https://www.healthychildren.org/English/ages-stages/baby/bathing-skin-care/Pages/default.aspx'],
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['신생아 목욕 안내', '#home']
        ]
    },
    {
        id: 'train-stroller-policy-boundary',
        match: /(기차\s*유모차|기차\s*유모차|KTX\s*유모차|train\s*stroller\s*policy)/,
        title: '기차·지하철 유모차는 접힘·고정·혼잡 시간 규정을 확인하고 문을 조심하세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['확인', '규정, 접기'],
            ['주의', '문 끼임']
        ],
        blocks: [
            ['지금 할 일', '승하차 때 바퀴를 잡으세요.'],
            ['하지 않을 일', '출입문에 유모차를 세우지 마세요.'],
            ['관련', '유모차·대중교통 안내를 참고하세요.']
        ],
        links: [
            ['AAP 유모차', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Stroller-Safety.aspx'],
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx']
        ]
    },
    {
        id: 'public-transit-stroller-boundary',
        match: /(지하철\s*유모차|버스\s*유모차|public\s*transit\s*stroller|대중교통\s*유모차|전철\s*아기|대중교통\s*접는\s*유모차)/,
        title: '지하철·버스에서는 문 틈·급정거를 보고, 혼잡 시 유모차를 접어 아기를 안는 편이 나을 수 있습니다',
        lead: '급정거와 문 끼임이 위험합니다. 지역 규정과 승하차 동선을 확인하세요. 유모차 브랜드 순위는 하지 않습니다.',
        points: [
            ['승하차', '문 틈, 휠 고정'],
            ['혼잡', '접기·안기 검토']
        ],
        blocks: [
            ['지금 할 일', '문 닫힘에 바퀴가 끼지 않게 하세요.'],
            ['하지 않을 일', '출입문에 유모차를 세워 두지 마세요.'],
            ['관련', '유모차·엘리베이터 안내를 참고하세요.']
        ],
        links: [
            ['AAP 유모차', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Stroller-Safety.aspx'],
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx']
        ]
    },
    {
        id: 'escalator-handhold-child-boundary',
        match: /(에스컬레이터\s*손잡이\s*아이|에스컬\s*손\s*잡|escalator\s*handhold\s*child|에스컬레이터\s*끼임\s*손)/,
        title: '에스컬레이터에서는 손을 잡고, 끈·옷·손가락 끼임을 보며 유모차는 엘리베이터를 이용하세요',
        lead: '앉거나 장난치지 않게 하세요.',
        points: [
            ['이동', '손잡기, 한 줄'],
            ['금지', '유모차 에스컬']
        ],
        blocks: [
            ['지금 할 일', '신발 끈을 확인하세요.'],
            ['하지 않을 일', '에스컬레이터에 유모차를 올리지 마세요.'],
            ['관련', '에스컬·유모차 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'elevator-stroller-safety',
        match: /(엘리베이터\s*유모차|승강기\s*유모차|elevator\s*stroller|엘리베이터\s*끼|승강기\s*문\s*끼)/,
        title: '엘리베이터에서는 유모차를 문 쪽에 두지 말고, 문이 닫힐 때 손을 살피세요',
        lead: '승강기 문·틈에 손·발이 끼거나 유모차가 문에 걸릴 수 있습니다. 유모차는 문에서 떨어뜨려 세우고, 아이들이 문 센서를 장난으로 막지 않게 하세요. 만원이면 다음 대를 기다립니다. 브랜드 추천은 하지 않습니다.',
        points: [
            ['위치', '문 반대쪽, 브레이크 잠금, 손 잡기'],
            ['주의', '문 틈, 과적, 뛰어내리기']
        ],
        blocks: [
            ['지금 할 일', '탑승 전 브레이크를 잠그고 아이 손을 잡으세요.'],
            ['하지 않을 일', '닫히는 문에 유모차를 억지로 끼워 넣지 마세요.'],
            ['관련', '에스컬레이터·유모차 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출·유모차 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['유모차 안전 안내', '#home']
        ]
    },
    {
        id: 'stroller-escalator-ban-boundary',
        match: /(유모차\s*에스컬레이터|유모차\s*에스컬|stroller\s*escalator|에스컬\s*유모차)/,
        title: '유모차는 에스컬레이터에 태우지 말고 엘리베이터를 이용하세요',
        lead: '바퀴 끼임·전복 사고가 납니다. 계단에서는 접거나 아기띠를 검토하세요.',
        points: [
            ['이동', '엘리베이터'],
            ['금지', '에스컬레이터, 무리한 계단']
        ],
        blocks: [
            ['지금 할 일', '엘리베이터 위치를 먼저 찾으세요.'],
            ['하지 않을 일', '에스컬레이터에 유모차를 올리지 마세요.'],
            ['관련', '유모차·에스컬레이터 안내를 참고하세요.']
        ],
        links: [
            ['AAP 유모차', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Stroller-Safety.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'escalator-stroller-safety',
        match: /(에스컬레이터|에스컬|자동\s*계단).{0,16}(유모차|아기|아이)|유모차.{0,12}에스컬|escalator/,
        title: '에스컬레이터에는 유모차를 올리지 말고 엘리베이터를 이용하세요',
        lead: '에스컬레이터에서 유모차가 뒤집히거나 바퀴·발이 끼는 사고가 날 수 있습니다. 가능하면 엘리베이터를 쓰고, 유모차를 접어 들고 오를 때도 한 손 아기·한 손 짐 상태를 피하세요. 쇼핑몰·지하철 안내를 따릅니다.',
        points: [
            ['선택', '엘리베이터 우선, 직원 도움 요청'],
            ['위험', '유모차 바퀴 끼임, 전복, 손 끼임']
        ],
        blocks: [
            ['지금 할 일', '목적지 엘리베이터 위치를 미리 확인하세요.'],
            ['하지 않을 일', '움직이는 에스컬레이터에 유모차를 밀어 올리지 마세요.'],
            ['관련', '유모차·쇼핑 카트 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출·유모차 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['유모차 안전 안내', '#home']
        ]
    },
    {
        id: 'paint-chip-ingestion-boundary',
        match: /(페인트\s*조각|페인트\s*칩|paint\s*chip|벗겨진\s*페인트|벽\s*페인트\s*뜯어)/,
        title: '벗겨진 페인트 조각을 먹지 않게 하고, 오래된 집 먼지가 걱정되면 상담하세요',
        lead: '오래된 페인트에는 납이 있을 수 있습니다. 보수·먼지 관리·손 씻기를 하고 검사는 의료진이 판단합니다.',
        points: [
            ['예방', '손 씻기, 페인트 보수, 먼지 줄이기'],
            ['상담', '섭취, 발달 걱정, 오래된 주택']
        ],
        blocks: [
            ['지금 할 일', '손 닿는 벗겨진 페인트를 점검하세요.'],
            ['하지 않을 일', '샌딩 먼지를 아이 옆에서 내지 마세요.'],
            ['관련', '납 노출 안내를 참고하세요.']
        ],
        links: [
            ['CDC 납', 'https://www.cdc.gov/lead-prevention/'],
            ['EPA 납', 'https://www.epa.gov/lead']
        ]
    },
    {
        id: 'toy-lead-paint-boundary',
        match: /(장난감\s*납|납\s*페인트\s*장난감|toy\s*lead\s*paint|중고\s*장난감\s*페인트|수입\s*장난감\s*중금속)/,
        title: '벗겨진 페인트 장난감·리콜 제품을 치우고, 입에 넣는 장난감은 인증·상태를 확인하세요',
        lead: '오래된·불명확 출처 장난감은 납 위험이 있을 수 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['점검', '페인트 벗겨짐, 리콜'],
            ['행동', '치우기, 손 씻기']
        ],
        blocks: [
            ['지금 할 일', '벗겨진 페인트 장난감을 버리세요.'],
            ['하지 않을 일', '출처 불명 중고 장남감을 입에 넣게 두지 마세요.'],
            ['관련', '납 노출 안내를 참고하세요.']
        ],
        links: [
            ['CDC 납', 'https://www.cdc.gov/lead-prevention/'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'lead-exposure-boundary',
        match: /(납\s*중독|납\s*노출|lead\s*poison|납\s*페인트|오래된\s*페인트|납\s*장난감|납\s*검사)/,
        title: '납 노출이 걱정되면 환경·장난감을 점검하고, 검사는 의료진과 상의하세요',
        lead: '오래된 페인트·먼지·일부 수입 장난감·도자기 등에서 납 노출이 문제될 수 있습니다. 증상을 사이트에서 단정하지 않으며, 혈중 납 검사·치료는 의료진이 판단합니다. “해독 주스·민간 요법”으로 대체하지 마세요.',
        points: [
            ['예방', '벗겨진 페인트 먼지, 손 씻기, 신뢰할 수 있는 장난감·식기'],
            ['상담', '집 수리·오래된 주택, 발달 걱정 시 의료진']
        ],
        blocks: [
            ['지금 할 일', '집 안 벗겨진 페인트·먼지가 많은 곳을 점검하세요.'],
            ['하지 않을 일', '검증 안 된 해독 제품을 주지 마세요.'],
            ['관련', '집 안 안전·중독 안내를 참고하세요.']
        ],
        links: [
            ['CDC 납 중독 예방', 'https://www.cdc.gov/lead-prevention/'],
            ['EPA 납 정보', 'https://www.epa.gov/lead'],
            ['AAP 환경 건강 개요', 'https://www.healthychildren.org/English/safety-prevention/all-around/Pages/default.aspx']
        ]
    },
    {
        id: 'double-stroller-safety',
        match: /(쌍둥이\s*유모차|더블\s*유모차|double\s*stroller|2인\s*유모차|형제\s*유모차\s*안전)/,
        title: '2인 유모차는 벨트·하중·접힘 잠금을 지키고, 핸들에 무거운 가방을 걸지 마세요',
        lead: '더블 유모차는 무게와 폭이 커서 전복·문 끼임이 날 수 있습니다. 아이마다 벨트를 매고, 하중 제한을 지키며, 경사·엘리베이터 이용에 주의하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['사용', '양쪽 벨트, 브레이크, 하중 라벨'],
            ['위험', '핸들 과적, 접힘 틈, 좁은 통로']
        ],
        blocks: [
            ['지금 할 일', '벨트와 접이식 잠금을 점검하세요.'],
            ['하지 않을 일', '쇼핑백을 핸들에만 잔뜩 걸지 마세요.'],
            ['관련', '유모차·에스컬레이터 안내를 참고하세요.']
        ],
        links: [
            ['AAP 유모차 안전', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Stroller-Safety.aspx'],
            ['CPSC 유모차', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'rain-cover-stroller-overheat',
        match: /(유모차\s*레인커버|비\s*가리개\s*유모차|rain\s*cover\s*stroller|유모차\s*덮개\s*더위|투명\s*커버\s*질식)/,
        title: '유모차 레인커버는 환기를 확인하고, 덥거나 닫힌 채 오래 두지 마세요',
        lead: '비 가리개는 유용하지만 밀폐되면 더위·습기·질식 우려가 있습니다. 환기구를 확인하고 자주 살펴보세요. 직사광선 아래 밀폐 방치를 피합니다. 브랜드 추천은 하지 않습니다.',
        points: [
            ['확인', '환기 구멍, 얼굴 주변 공간, 체온'],
            ['금지', '한여름 밀폐 방치, 얼굴 밀착']
        ],
        blocks: [
            ['지금 할 일', '커버를 씌운 뒤 5~10분마다 상태를 보세요.'],
            ['하지 않을 일', '커버 안에서 아이만 오래 두지 마세요.'],
            ['관련', '유모차·과열·햇볕 안내를 참고하세요.']
        ],
        links: [
            ['AAP 유모차·더위 개요', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Stroller-Safety.aspx'],
            ['CDC 열 질환', 'https://www.cdc.gov/heat-health/']
        ]
    },
    {
        id: 'jogger-stroller-safety',
        match: /(조깅\s*유모차|jogger\s*stroller|러닝\s*유모차|뛰며\s*유모차|조거\s*유모차)/,
        title: '조깅 유모차는 연령·목 가눔·벨트·브레이크를 지키고, 울퉁불퉁한 길을 피하세요',
        lead: '조깅용 유모차는 빠른 속도·충격이 있어 목 가눔이 된 뒤 등 제품 안내 연령을 따르세요. 벨트를 매고, 야간·교통량을 피합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['조건', '연령·체중 라벨, 5점 벨트, 손목 스트랩'],
            ['환경', '평탄한 길, 교통 주의, 야간 라이트']
        ],
        blocks: [
            ['지금 할 일', '제품 최소 월령과 벨트 상태를 확인하세요.'],
            ['하지 않을 일', '신생아를 조깅 유모차에 태우고 뛰지 마세요.'],
            ['관련', '유모차·헬멧·외출 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 유모차 안전', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Stroller-Safety.aspx'],
            ['CPSC 유모차', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'umbrella-stroller-safety',
        match: /(우산\s*유모차|umbrella\s*stroller|가벼운\s*유모차\s*접|휴대용\s*유모차\s*안전)/,
        title: '우산형 유모차는 벨트를 매고, 핸들 과적·불안정한 접힘을 조심하세요',
        lead: '가볍지만 전복·접힘 틈 위험이 있습니다. 벨트를 매고 가방을 핸들에만 걸지 마세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['사용', '벨트, 브레이크, 접힘 잠금'],
            ['금지', '핸들 과적']
        ],
        blocks: [
            ['지금 할 일', '벨트와 접이식 잠금을 점검하세요.'],
            ['하지 않을 일', '쇼핑백을 핸들에 잔뜩 걸지 마세요.'],
            ['관련', '유모차 안내를 참고하세요.']
        ],
        links: [
            ['AAP 유모차', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Stroller-Safety.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'stroller-handle-heavy-bag-boundary',
        match: /(유모차\s*손잡이\s*짐)/,
        title: '유모차 손잡이에 무거운 가방을 걸면 전복될 수 있어 바구니 공간·바닥을 이용하세요',
        lead: '브랜드 순위는 하지 않습니다.',
        points: [
            ['배치', '낮은 바구니'],
            ['금지', '핸들 과적']
        ],
        blocks: [
            ['지금 할 일', '벨트를 채우세요.'],
            ['하지 않을 일', '장바구니를 손잡이에 걸지 마세요.'],
            ['관련', '유모차 안내를 참고하세요.']
        ],
        links: [
            ['AAP 유모차', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Stroller-Safety.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'stroller-safety-basics',
        match: /(유모차\s*안전|유모차\s*벨트|유모차\s*접|스트롤러|stroller|유모차\s*기울)/,
        title: '유모차는 벨트를 매고, 접이식 틈·기울어진 채 재우기를 조심하세요',
        lead: '유모차에서는 안전벨트를 항상 매고, 접는 부위에 손가락이 끼지 않게 합니다. 경사지게 둔 채 오래 재우거나 카시트·침대 대용으로 방치하지 마세요. 무거운 가방을 핸들에만 걸면 전복될 수 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['사용', '벨트, 잠금 바퀴, 평지에서 손 잡기'],
            ['수면', '유모차 안 장시간 수면·기울임 방치 주의']
        ],
        blocks: [
            ['지금 할 일', '벨트 길이와 접이식 잠금이 되는지 확인하세요.'],
            ['하지 않을 일', '핸들에 장바구니를 잔뜩 걸고 밀지 마세요.'],
            ['관련', '안전수면·낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 유모차 안전', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Stroller-Safety.aspx'],
            ['CDC 안전수면', 'https://www.cdc.gov/sudden-infant-death/sleep-safely/']
        ]
    },
    {
        id: 'dining-booster-seat-safety',
        match: /(식탁\s*부스터|다이닝\s*부스터|booster\s*seat\s*식탁|의자\s*높임\s*아기|식탁\s*보조\s*의자)/,
        title: '식탁 부스터 의자는 벨트·안정된 성인 의자에 고정하고, 식탁 끝에 두지 마세요',
        lead: '부스터는 카시트 부스터와 다릅니다. 식탁용은 안전벨트와 의자 고정이 중요하고, 불안정한 의자·식탁 끝은 추락 위험이 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['고정', '벨트, 성인 의자 선택, 흔들림 점검'],
            ['금지', '바 의자, 식탁 끝, 혼자 두기']
        ],
        blocks: [
            ['지금 할 일', '벨트 버클과 고정 스트랩을 점검하세요.'],
            ['하지 않을 일', '벨트를 안 매고 부스터만 올려 두지 마세요.'],
            ['관련', '하이체어·낙상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 하이체어·식사 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/High-Chair-Safety.aspx'],
            ['CDC 낙상 예방', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'restaurant-highchair-wipe',
        match: /(식당\s*하이체어|레스토랑\s*아기의자|restaurant\s*high\s*chair|외식\s*부스터|카페\s*아기의자)/,
        title: '식당 하이체어는 벨트를 매고, 더러워 보이면 닦은 뒤 아이를 앉히세요',
        lead: '공용 의자는 벨트·안정성을 확인하세요. 테이블 가장자리 뜨거운 음식을 멀리 두세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['안전', '벨트, 안정, 모서리'],
            ['위생', '표면 닦기']
        ],
        blocks: [
            ['지금 할 일', '벨트 버클이 잠기는지 확인하세요.'],
            ['하지 않을 일', '벨트 없이 앉히지 마세요.'],
            ['관련', '하이체어·화상 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'high-chair-harness-use-boundary',
        match: /(하이체어\s*벨트\s*매번|하이체어\s*벨트\s*안\s*채|high\s*chair\s*harness\s*every|아기의자\s*벨트\s*꼭)/,
        title: '하이체어는 매번 벨트를 매고, 발판·테이블에 서서 올라가지 않게 하세요',
        lead: '벨트 없이 앉히면 미끄러져 낙상합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['사용', '벨트, 안정된 바닥'],
            ['금지', '서기, 밀기']
        ],
        blocks: [
            ['지금 할 일', '앉히자마자 벨트를 채우세요.'],
            ['하지 않을 일', '벨트를 느슨히 둔 채 자리를 비우지 마세요.'],
            ['관련', '하이체어 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'table-corner-head-bump-boundary',
        match: /(식탁\s*모서리)/,
        title: '식탁 모서리에 머리를 부딪히지 않게 보호·동선을 보고, 하이체어에서 일어서지 않게 하세요',
        lead: '보호대 브랜드 순위는 하지 않습니다. 의식 변화면 진료하세요.',
        points: [
            ['예방', '모서리, 벨트'],
            ['충격 후', '구토·처짐 관찰']
        ],
        blocks: [
            ['지금 할 일', '벨트를 채우고 자리를 비우지 마세요.'],
            ['하지 않을 일', '식탁 위에 서게 두지 마세요.'],
            ['관련', '머리 부딪힘·하이체어 안내를 참고하세요.']
        ],
        links: [
            ['CDC 낙상', 'https://www.cdc.gov/heights-and-falls/prevention/index.html'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'high-chair-safety',
        match: /(하이\s*체어|아기\s*식탁\s*의자|유아\s*식탁\s*의자|하이체어|high\s*chair)/,
        title: '하이체어는 벨트·안정된 바닥에, 식탁 가장자리에 발을 걸치게 두지 마세요',
        lead: '하이체어 추락은 흔합니다. 안전벨트를 매고, 평평하고 안정된 바닥에 두며, 식탁에 바짝 붙여 아이가 발로 밀지 못하게 합니다. 혼자 두지 마세요. 브랜드 추천은 하지 않습니다.',
        points: [
            ['고정', '5점·허리 벨트, 바퀴 잠금, 평평한 바닥'],
            ['감시', '벨트를 푼 채 두지 않기, 식탁 끝 밀기 주의']
        ],
        blocks: [
            ['지금 할 일', '벨트 버클과 의자 안정성을 점검하세요.'],
            ['하지 않을 일', '소파·침대 옆 불안정한 곳에 두지 마세요.'],
            ['관련', '낙상·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 하이체어 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/High-Chair-Safety.aspx'],
            ['CDC 낙상 예방', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'dehumidifier-child-safety',
        match: /(제습기|dehumidifier)/,
        title: '제습기는 물통·코드를 관리하고, 넘어뜨리거나 물기를 만지지 않게 하세요',
        lead: '전기·물 조합은 감전·미끄럼 위험이 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['관리', '물통, 코드, 안정'],
            ['금지', '물 가지고 놀기']
        ],
        blocks: [
            ['지금 할 일', '물통을 제때 비우세요.'],
            ['하지 않을 일', '물을 바닥에 흘리며 놀게 두지 마세요.'],
            ['관련', '가습기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'humidifier-tap-water-boundary',
        match: /(가습기\s*수돗물|가습기\s*수돗물|가습기\s*물\s*종류|humidifier\s*tap\s*water)/,
        title: '가습기 물은 제품 표시를 따르고, 물통을 자주 세척·건조하세요',
        lead: '미생물 번식을 줄이는 관리가 중요합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['관리', '세척, 건조'],
            ['금지', '더러운 물 방치']
        ],
        blocks: [
            ['지금 할 일', '매일 물통을 비우고 말리세요.'],
            ['하지 않을 일', '곰팡이 냄새 나면 사용을 중단하세요.'],
            ['관련', '가습기 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'humidifier-clean-boundary',
        match: /(가습기\s*세척|가습기\s*청소|가습기\s*곰팡이|가습기\s*물때|가습기\s*필터)/,
        title: '가습기는 물때·세균이 생기지 않게 자주 비우고 씻는 것이 중요합니다',
        lead: '물이 고인 가습기는 미생물이 자랄 수 있습니다. 사용 후 물을 비우고, 제품 안내대로 세척·건조하세요. “한 번 넣고 며칠” 방식은 피합니다. 소독제·세정 용량을 사이트에서 정하지 않으며, 호흡 자극이 있으면 사용을 줄이고 상담하세요.',
        points: [
            ['루틴', '매일 물 비우기·건조, 정기 세척'],
            ['물', '제품이 안내하는 물 종류 따르기']
        ],
        blocks: [
            ['지금 할 일', '물통과 필터 상태를 점검하세요.'],
            ['하지 않을 일', '탁한 물을 며칠째 그대로 두지 마세요.'],
            ['관련', '가습기 화상·호흡 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가습기', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Humidifiers-and-Vaporizers.aspx'],
            ['EPA 가습기 안내(영)', 'https://www.epa.gov/indoor-air-quality-iaq/use-and-care-home-humidifiers']
        ]
    },
    {
        id: 'hair-tourniquet',
        match: /(머리카락\s*감|헤어\s*토너|발가락\s*실\s*감|손가락\s*실\s*감|머리카락\s*조이|hair\s*tourniquet)/,
        title: '발가락·손가락·성기에 머리카락·실이 감기면 빨리 확인하고 진료를 보세요',
        lead: '가느다란 머리카락·실이 발가락·손가락 등에 감겨 붓고 아플 수 있습니다. 억지로 깊게 파내지 말고, 보이는 실은 조심히 풀거나 의료진에게 맡기세요. 심하게 붓고 색이 변하면 응급으로 봅니다.',
        points: [
            ['발견', '이유 없는 울음, 한 발가락만 붓고 빨개짐'],
            ['대응', '확대경·밝은 빛으로 확인, 무리한 절단 금지, 진료']
        ],
        blocks: [
            ['지금 할 일', '양말·수면 가운 실밥·긴 머리카락을 정리하세요.'],
            ['하지 않을 일', '보이지 않는 실을 바늘로 깊게 쑤시지 마세요.'],
            ['관련', '집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 헤어 토너케 개요', 'https://www.healthychildren.org/English/health-issues/conditions/skin/Pages/default.aspx'],
            ['NHS 손가락·발가락 감김(영)', 'https://www.nhs.uk/conditions/']
        ]
    },
    {
        id: 'generator-indoor-co-boundary',
        match: /(발전기\s*실내|generator\s*indoor|휴대용\s*발전기|정전\s*발전기|캠핑\s*발전기\s*텐트|발전기\s*일산화)/,
        title: '휴대용 발전기는 실내·차고·텐트에서 돌리지 마세요. 일산화탄소 위험이 큽니다',
        lead: '발전기는 실외 먼 곳에서만 사용하고, 창문·문 근처도 위험할 수 있습니다. 일산화탄소는 냄새·색이 없어 가족 여러 명이 두통·구토·처짐을 보이면 대피 후 구조를 요청하세요. 경보기 설치를 권합니다. 제품 순위는 하지 않습니다.',
        points: [
            ['금지', '실내, 차고, 지하, 텐트, 창가 바로 앞'],
            ['응급', '여러 명 동시 증상 → 밖으로·119']
        ],
        blocks: [
            ['지금 할 일', '정전 대비 발전기 위치를 실외로 계획하세요.'],
            ['하지 않을 일', '문 열어 둔 차고 안에서 돌리지 마세요.'],
            ['관련', '일산화탄소 경보·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 발전기·일산화탄소', 'https://www.cdc.gov/carbon-monoxide/'],
            ['CPSC 발전기 안전', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'power-outage-family-boundary',
        match: /(정전\s*대비|정전\s*아이|power\s*outage\s*child|전기\s*나갔\s*아기|정전\s*손전등)/,
        title: '정전 시 손전등·체온·의약품을 챙기고, 발전기는 실내에서 돌리지 마세요',
        lead: '정전은 온도·약물 보관·조명 문제가 됩니다. 양초보다 손전등이 안전합니다. 일산화탄소 위험을 보세요.',
        points: [
            ['준비', '손전등, 물, 약, 담요'],
            ['금지', '실내 발전기, 방치 양초']
        ],
        blocks: [
            ['지금 할 일', '손전등 위치를 가족에게 알려 두세요.'],
            ['하지 않을 일', '실내에서 발전기를 돌리지 마세요.'],
            ['관련', '화재 대피·일산화탄소 안내를 참고하세요.']
        ],
        links: [
            ['Red Cross 대비', 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'smoke-alarm-drill-child-boundary',
        match: /(연기\s*경보\s*소리\s*연습)/,
        title: '연기 경보 소리를 아이와 미리 듣고, 나가 모이는 장소를 연습하세요',
        lead: '공포만 주기보다 짧게 반복하세요. 대피 시 엘리베이터를 쓰지 마세요.',
        points: [
            ['연습', '소리 익히기, 출구'],
            ['금지', '엘리베이터']
        ],
        blocks: [
            ['지금 할 일', '만날 장소를 정하세요.'],
            ['하지 않을 일', '경보가 울려도 물건을 챙기러 들어가지 마세요.'],
            ['관련', '화재 대피 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'fire-escape-plan-family',
        match: /(화재\s*대피|불\s*나면\s*대피|fire\s*escape|가정\s*화재\s*연습|연기\s*경보\s*울리면|대피\s*계획\s*아이)/,
        title: '가정 화재 대피 경로를 정해 두고, 연기 경보가 울리면 낮게 이동해 밖으로 나가세요',
        lead: '경보가 울리면 물건을 챙기기보다 대피가 우선입니다. 두 가지 탈출 경로, 바깥 만남 장소, 문 손잡이 열기 연습을 아이 눈높이에 맞게 하세요. 특정 경보기 브랜드 순위는 하지 않습니다.',
        points: [
            ['준비', '경보 설치·배터리, 두 경로, 만남 장소'],
            ['행동', '기어 나가기, 엘리베이터 금지, 119']
        ],
        blocks: [
            ['지금 할 일', '경보를 시험하고 대피 경로를 아이와 걸어 보세요.'],
            ['하지 않을 일', '연기가 찬 곳으로 장난감·가방을 찾으러 돌아가지 마세요.'],
            ['관련', 'CO 경보·화상·난로 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화재 안전', 'https://www.cdc.gov/fire-prevention/'],
            ['AAP 가정 화재 안전 개요', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'smoke-alarm-placement-boundary',
        match: /(연기\s*경보\s*위치|연기\s*경보\s*위치|화재\s*감지기\s*어디|smoke\s*alarm\s*placement)/,
        title: '연기 경보기는 층마다·침실 근처 설치 안내를 참고하고 정기 시험하세요',
        lead: '지역 규정·제품 설명을 따르세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['설치', '층·침실 근처'],
            ['시험', '정기']
        ],
        blocks: [
            ['지금 할 일', '시험 버튼을 눌러 보세요.'],
            ['하지 않을 일', '배터리를 빼 두지 마세요.'],
            ['관련', '연기 경보 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'smoke-alarm-test-boundary',
        match: /(연기\s*감지기\s*시험|스모크\s*알람\s*배터리|smoke\s*alarm\s*test|화재\s*경보\s*점검|연기\s*경보기\s*배터리)/,
        title: '연기 경보기는 정기적으로 시험하고 배터리를 점검하세요',
        lead: '연기 경보기는 설치만으로 끝이 아닙니다. 제조사 안내에 따라 시험 버튼을 누르고, 배터리·수명을 확인하세요. 주방 연기 오작동이 잦으면 위치를 재검토합니다. 특정 브랜드 순위는 하지 않습니다.',
        points: [
            ['점검', '월 1회 시험(안내 따름), 배터리, 교체 주기'],
            ['배치', '각 층·침실 근처, 막히지 않게']
        ],
        blocks: [
            ['지금 할 일', '경보 시험 버튼을 눌러 작동을 확인하세요.'],
            ['하지 않을 일', '귀찮다고 배터리를 빼 두지 마세요.'],
            ['관련', '화재 대피·CO 경보 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화재 예방', 'https://www.cdc.gov/fire-prevention/'],
            ['CPSC 연기 경보', 'https://www.cpsc.gov/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'car-exhaust-garage-co-boundary',
        match: /(차고\s*시동|차\s*공회전\s*차고|garage\s*car\s*exhaust|문\s*닫고\s*시동|차고\s*일산화탄소)/,
        title: '닫힌 차고에서 시동을 걸거나 공회전하지 마세요. 일산화탄소가 집 안으로 들어갈 수 있습니다',
        lead: '무색무취 가스로 위험합니다. 경보기를 설치하고 증상을 보면 대피·진료하세요.',
        points: [
            ['금지', '닫힌 차고 공회전'],
            ['증상', '두통, 구토, 처짐']
        ],
        blocks: [
            ['지금 할 일', '차고 문을 연 채로만 시동 관련 작업을 하세요.'],
            ['하지 않을 일', '차 안에서 잠자며 시동을 켜 두지 마세요.'],
            ['관련', '일산화탄소 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/carbon-monoxide/']
        ]
    },
    {
        id: 'car-camping-co-boundary',
        match: /(차박\s*일산화탄소|캠핑\s*차\s*안\s*시동|car\s*camping\s*co|차에서\s*자며\s*히터|차박\s*히터|캠핑\s*차박\s*co|차박\s*co)/,
        title: '차박·캠핑 시 차 안에서 연료 히터·발전기·공회전을 쓰지 마세요',
        lead: '일산화탄소는 무색무취입니다. 경보기·환기를 검토하세요.',
        points: [
            ['금지', '실내 연소, 공회전 수면'],
            ['증상', '두통, 구토, 처짐']
        ],
        blocks: [
            ['지금 할 일', '환기와 경보기를 확인하세요.'],
            ['하지 않을 일', '문 닫고 시동 켠 채 자지 마세요.'],
            ['관련', '일산화탄소 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/carbon-monoxide/']
        ]
    },
    {
        id: 'boiler-vent-co-boundary',
        match: /(가스보일러\s*환기|가스보일러\s*환기|보일러\s*일산화탄소|boiler\s*vent\s*co)/,
        title: '가스보일러·연소 기구는 환기와 점검을 하고, CO 경보기를 설치하세요',
        lead: '두통·구토·처짐이면 대피·진료하세요.',
        points: [
            ['예방', '환기, 점검, 경보'],
            ['증상', '두통, 구토']
        ],
        blocks: [
            ['지금 할 일', '경보기 배터리를 확인하세요.'],
            ['하지 않을 일', '환기 없이 연소 기구를 쓰지 마세요.'],
            ['관련', '일산화탄소 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/carbon-monoxide/']
        ]
    },
    {
        id: 'carbon-monoxide-alarm',
        match: /(일산화\s*탄소|CO\s*경보|일산화탄소\s*경보|가스\s*중독|연탄|보일러\s*가스|스모크\s*알람|화재\s*경보기)/,
        title: '일산화탄소·화재 경보기는 설치·점검하고, 두통·구토·처짐이 여러 명이면 대피하세요',
        lead: '보일러·난로·밀폐 연소는 일산화탄소 위험이 있습니다. 경보기를 두고 배터리를 점검하세요. 가족 여러 명이 동시에 두통·메스꺼움·처짐을 보이면 창을 열고 밖으로 나가 구조를 요청합니다. 특정 경보기 브랜드 순위는 하지 않습니다.',
        points: [
            ['예방', '연소 기구 환기, CO·화재 경보기, 정기 점검'],
            ['응급', '여러 명 동시 증상, 의식 저하 → 대피·119']
        ],
        blocks: [
            ['지금 할 일', '경보기 위치와 배터리 상태를 확인하세요.'],
            ['하지 않을 일', '밀폐된 실내에서 발전기·숯불을 쓰지 마세요.'],
            ['관련', '집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['CDC 일산화탄소', 'https://www.cdc.gov/carbon-monoxide/'],
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx']
        ]
    },
    {
        id: 'outdoor-play-shoes-boundary',
        match: /(놀이터\s*신발|놀이\s*신발|운동화\s*놀이|outdoor\s*play\s*shoes|맨발\s*놀이터|슬리퍼\s*놀이터)/,
        title: '놀이터에서는 발 전체가 감싸는 신발이 미끄럼·찔림 위험을 줄이는 데 도움이 됩니다',
        lead: '슬리퍼·맨발은 미끄러지거나 유리·가시에 다칠 수 있습니다. 닫힌 신발을 권합니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['권장', '닫힌 운동화, 미끄럼 방지'],
            ['주의', '슬리퍼, 맨발']
        ],
        blocks: [
            ['지금 할 일', '신발 끈이 너무 길지 않은지 확인하세요.'],
            ['하지 않을 일', '맨발로 아스팔트·금속 위를 오래 두지 마세요.'],
            ['관련', '첫 신발·열 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 부상', 'https://www.cdc.gov/injury/']
        ]
    },
    {
        id: 'orthotics-insoles-boundary',
        match: /(교정\s*깔창|소아\s*오소틱|orthotic|인솔\s*교정\s*아이|평발\s*깔창\s*필수)/,
        title: '교정 깔창은 통증·보행 문제 평가 후 의료진이 판단하며, 광고만으로 필수로 보지 마세요',
        lead: '평발·안짱이 모두 깔창이 필요한 것은 아닙니다. 통증·절뚝이 있으면 진료하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['상담', '통증, 절뚝, 비대칭'],
            ['경계', '필수 교정 광고']
        ],
        blocks: [
            ['지금 할 일', '통증 나는 활동을 기록하세요.'],
            ['하지 않을 일', '광고만 보고 고가 깔창을 강요하지 마세요.'],
            ['관련', '평발·첫 신발 안내를 참고하세요.']
        ],
        links: [
            ['AAP 정형', 'https://www.healthychildren.org/English/health-issues/conditions/orthopedic/Pages/default.aspx'],
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx']
        ]
    },
    {
        id: 'grip-socks-indoor-walk-boundary',
        match: /(실내\s*미끄럼\s*양말)/,
        title: '걸음마 시기 실내 미끄러운 양말·바닥을 조심하고, 필요하면 미끄럼 방지·맨발을 검토하세요',
        lead: '브랜드 순위는 하지 않습니다. 통증·절뚝이면 진료하세요.',
        points: [
            ['환경', '바닥, 양말'],
            ['관찰', '자주 넘어짐']
        ],
        blocks: [
            ['지금 할 일', '물기·왁스 바닥을 닦으세요.'],
            ['하지 않을 일', '큰 양말을 신겨 미끄럽게 두지 마세요.'],
            ['관련', '첫 신발 안내를 참고하세요.']
        ],
        links: [
            ['AAP 놀이', 'https://www.healthychildren.org/English/safety-prevention/at-play/Pages/default.aspx'],
            ['CDC 낙상', 'https://www.cdc.gov/heights-and-falls/prevention/index.html']
        ]
    },
    {
        id: 'first-walking-shoes',
        match: /(첫\s*신발|아기\s*신발|걸음마\s*신발|맨발\s*걷기|소프트\s*슈즈|walking\s*shoes\s*baby)/,
        title: '실내 걸음마는 맨발·미끄럼 없는 양말이 편할 수 있고, 바깥은 발에 맞는 신발을 신기세요',
        lead: '걷기 시작 시 실내에서는 맨발이나 미끄럼 방지 양말로 바닥을 느끼는 편이 낫다는 안내가 많습니다. 바깥·울퉁불퉁한 곳에서는 발에 맞고 미끄럽지 않은 신발이 도움이 됩니다. “최고 브랜드·교정 신발” 순위는 하지 않으며, 발 변형 걱정은 의료진과 상의합니다.',
        points: [
            ['실내', '맨발·미끄럼 방지, 너무 두꺼운 바닥 피하기'],
            ['실외', '발 길이·폭에 맞는 신발, 끈·벨크로 고정']
        ],
        blocks: [
            ['지금 할 일', '신발이 발가락을 누르지 않는지 확인하세요.'],
            ['하지 않을 일', '큰 신발을 “여유”로 오래 신기지 마세요.'],
            ['관련', '보행기·발달 안내를 참고하세요.']
        ],
        links: [
            ['AAP 신발', 'https://www.healthychildren.org/English/ages-stages/baby/Pages/Baby-Shoes.aspx'],
            ['발달 가이드', 'blog/development-kdst-guide.html#milestones']
        ]
    },
    {
        id: 'wild-mushroom-poison-boundary',
        match: /(독버섯|야생\s*버섯|mushroom\s*poison|산에서\s*버섯|주워\s*온\s*버섯|버섯\s*중독\s*아이)/,
        title: '야생·주워 온 버섯은 먹이지 마세요. 삼켰으면 조각을 남기고 바로 상담·응급실로 가세요',
        lead: '독버섯은 생김만으로 구별하기 어렵고, 늦게 증상이 나타나기도 합니다. 민간 “해독”을 하지 말고, 남은 버섯을 가져가 중독 상담·응급실을 이용하세요. 채집 버섯 요리 추천은 하지 않습니다.',
        points: [
            ['예방', '야생 버섯 채집·섭취 금지, 마당 버섯 치우기'],
            ['노출', '구토·설사·처짐·황달 의심 시 응급']
        ],
        blocks: [
            ['지금 할 일', '마당·산책로에서 버섯을 따지 않게 하세요.'],
            ['하지 않을 일', '인터넷 사진과 비교해 “식용”으로 단정하지 마세요.'],
            ['관련', '중독·화분 식물 안내를 참고하세요.']
        ],
        links: [
            ['CDC 버섯 중독 개요', 'https://www.cdc.gov/poisonprevention/'],
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx']
        ]
    },
    {
        id: 'outdoor-berry-poison-boundary',
        match: /(야생\s*열매|산\s*열매\s*먹|빨간\s*열매\s*중독|wild\s*berry|주워\s*온\s*열매|길거리\s*열매\s*먹)/,
        title: '야생·정체 불명 열매는 먹이지 마세요. 삼켰으면 남은 조각을 가지고 상담하세요',
        lead: '색깔이 예뻐도 독성 열매일 수 있고, 사진만으로 식용을 단정하기 어렵습니다. 삼켰으면 억지로 토하게 하지 말고 남은 열매·토사물을 챙겨 중독 상담·진료를 이용하세요. 채집 추천은 하지 않습니다.',
        points: [
            ['예방', '산책 중 줍기 금지, 마당 열매 식물 파악'],
            ['노출', '구토·처짐·입 주위 자극 시 진료']
        ],
        blocks: [
            ['지금 할 일', '아이 손이 닿는 울타리 열매를 치우거나 가리세요.'],
            ['하지 않을 일', '인터넷 사진과 비교해 “먹어도 된다”고 단정하지 마세요.'],
            ['관련', '독버섯·화분 식물·중독 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'houseplant-poison-boundary',
        match: /(관엽\s*식물|독성\s*식물|식물\s*중독|화분.{0,12}(먹|중독)|식물.{0,12}(먹|중독|잎)|디펜바키아|화분\s*먹고)/,
        title: '화분·잎을 입에 넣는 아기가 있으면 독성 식물을 치우고, 삼켰으면 상담하세요',
        lead: '일부 관엽 식물은 자극·독성이 있습니다. 식물 이름·양을 확인하고 중독 상담·진료 경로를 이용하세요. 민간으로 토하게 하지 마세요. 특정 식물 판매 추천은 하지 않습니다.',
        points: [
            ['예방', '잎·열매 손 닿지 않게, 이름표 유지'],
            ['노출', '입 헹구기, 토하게 강제 금지, 상담·응급실']
        ],
        blocks: [
            ['지금 할 일', '바닥 가까운 화분을 높은 곳으로 옮기세요.'],
            ['하지 않을 일', '어떤 식물인지 모른 채 민간 해독제를 쓰지 마세요.'],
            ['관련', '중독·집 안 안전 안내를 참고하세요.']
        ],
        links: [
            ['AAP 중독 예방', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/Poison-Prevention.aspx'],
            ['CDC 중독 예방', 'https://www.cdc.gov/poisonprevention/']
        ]
    },
    {
        id: 'classroom-lice-check-boundary',
        match: /(교실\s*이\s*점검|학급\s*머릿니|classroom\s*lice|이\s*옮\s*학교|머릿니\s*반\s*공지)/,
        title: '학급 머릿니 공지가 있으면 머리를 확인하고, 수치심 없이 치료·복귀를 안내를 따르세요',
        lead: '제품 순위·민간 요법을 단정하지 않습니다. 치료제는 표시·의료진을 따르세요.',
        points: [
            ['확인', '빗, 두피'],
            ['태도', '비난 금지']
        ],
        blocks: [
            ['지금 할 일', '가족 머리를 함께 확인하세요.'],
            ['하지 않을 일', '아이에게 창피를 주지 마세요.'],
            ['관련', '머릿니 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/lice/']
        ]
    },
    {
        id: 'lice-treatment-repeat-boundary',
        match: /(이\s*약\s*내성|이\s*약\s*안\s*듣|머릿니\s*치료\s*반복|lice\s*treatment\s*fail)/,
        title: '머릿니 치료가 잘 안 되면 방법을 재확인하고 의료진·약사와 상담하세요',
        lead: '제품 순위·민간 요법을 단정하지 않습니다. 용량은 표시를 따르세요.',
        points: [
            ['확인', '빗질, 재처리 일정'],
            ['상담', '지속 감염']
        ],
        blocks: [
            ['지금 할 일', '설명서 일정을 지키세요.'],
            ['하지 않을 일', '성인 약을 임의로 쓰지 마세요.'],
            ['관련', '머릿니 안내를 참고하세요.']
        ],
        links: [
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx'],
            ['CDC', 'https://www.cdc.gov/lice/']
        ]
    },
    {
        id: 'head-lice-boundary',
        match: /(머릿니|머리\s*이|이\s*서식|이\s*알|헤드\s*라이스|head\s*lice|이\s*샴푸)/,
        title: '머릿니는 위생 실패가 아니고, 확인 후 의료·약국 안내로 관리합니다',
        lead: '머릿니는 가까운 머리 접촉으로 퍼질 수 있으며 “더러워서”만의 문제는 아닙니다. 약용 샴푸·빗질 등은 연령·제품 표시·의료진 안내를 따르고, 용량·브랜드 순위는 사이트에서 정하지 않습니다. 학교 규정은 시설 안내를 확인하세요.',
        points: [
            ['확인', '귀 뒤·목덜미 가려움, 이·서캐 관찰'],
            ['관리', '표시 연령 준수, 침구·빗 청소, 불필요한 삭발 강요 금지']
        ],
        blocks: [
            ['지금 할 일', '가족 머리를 밝은 빛에서 살펴보세요.'],
            ['하지 않을 일', '성인 약을 영아에게 임의로 쓰지 마세요.'],
            ['관련', '손 씻기·발진 경계를 참고하세요.']
        ],
        links: [
            ['CDC 머릿니', 'https://www.cdc.gov/lice/about/head-lice.html'],
            ['AAP 머릿니', 'https://www.healthychildren.org/English/health-issues/conditions/from-insects-animals/Pages/Head-Lice.aspx']
        ]
    },
    {
        id: 'time-zone-sleep-adjust-boundary',
        match: /(시차\s*적응\s*아이|시차\s*피로\s*아기|time\s*zone\s*baby|해외여행\s*수면\s*아이|시차\s*극복\s*유아)/,
        title: '시차 적응은 며칠에 걸쳐 빛·낮잠·취침을 맞추고, 수면제를 임의로 쓰지 마세요',
        lead: '어린이는 적응에 시간이 걸릴 수 있습니다. 안전수면을 유지하세요. 약 추천은 하지 않습니다.',
        points: [
            ['조절', '아침 빛, 낮 활동'],
            ['금지', '임의 수면제']
        ],
        blocks: [
            ['지금 할 일', '목적 시간대에 맞춰 낮잠을 조절해 보세요.'],
            ['하지 않을 일', '성인 수면제를 주지 마세요.'],
            ['관련', '시차·수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['시차 안내', '#home']
        ]
    },
    {
        id: 'jetlag-nap-adjust-boundary',
        match: /(시차\s*낮잠\s*조절|시차\s*낮잠\s*조절|시차\s*적응\s*낮잠|jetlag\s*nap\s*adjust)/,
        title: '시차 적응 때 낮잠을 목적 시간대에 맞게 조금씩 옮기고, 수면제를 쓰지 마세요',
        lead: '며칠이 걸릴 수 있습니다. 약 추천은 하지 않습니다.',
        points: [
            ['조절', '빛, 낮 활동'],
            ['금지', '임의 수면제']
        ],
        blocks: [
            ['지금 할 일', '아침 빛을 활용하세요.'],
            ['하지 않을 일', '성인 수면제를 주지 마세요.'],
            ['관련', '시차 안내를 참고하세요.']
        ],
        links: [
            ['AAP 수면', 'https://www.healthychildren.org/English/ages-stages/baby/sleep/Pages/default.aspx'],
            ['시차 안내', '#home']
        ]
    },
    {
        id: 'travel-solid-food-pack-boundary',
        match: /(해외여행\s*이유식|해외여행\s*이유식|여행\s*이유식\s*준비|travel\s*baby\s*food\s*pack)/,
        title: '여행 이유식은 위생·보관 온도를 계획하고, 상한 음식은 버리세요',
        lead: '브랜드 순위는 하지 않습니다. 현지 물은 의료진·여행 안내를 참고하세요.',
        points: [
            ['계획', '보관, 여분'],
            ['폐기', '상온 장시간']
        ],
        blocks: [
            ['지금 할 일', '아이스팩을 검토하세요.'],
            ['하지 않을 일', '상한 냄새 음식을 주지 마세요.'],
            ['관련', '여행·이유식 안내를 참고하세요.']
        ],
        links: [
            ['AAP 영양', 'https://www.healthychildren.org/English/healthy-living/nutrition/Pages/default.aspx'],
            ['CDC 위생', 'https://www.cdc.gov/hygiene/']
        ]
    },
    {
        id: 'jet-lag-infant-travel-boundary',
        match: /(시차\s*적응\s*아기|jet\s*lag\s*baby|해외여행\s*수면\s*아이|시차\s*피곤\s*아기|긴\s*비행\s*수면)/,
        title: '아이 시차 적응은 빛·수면·수유 리듬을 천천히 맞추고, 수면제 임의 복용은 피하세요',
        lead: '시차는 아이마다 다르며 “하루 한 시간” 공식으로 단정하지 않습니다. 목적지의 낮·밤 빛 노출, 낮잠·수유 리듬을 조금씩 조정하세요. 수면제·멜라토닌 용량은 사이트에서 정하지 않으며 의료진과 상의합니다.',
        points: [
            ['조정', '햇빛, 낮잠 길이, 취침 루틴'],
            ['경계', '성인 수면제 소분, 과한 카페인 음료']
        ],
        blocks: [
            ['지금 할 일', '도착 후 낮에 밝은 곳에서 짧게 활동해 보세요.'],
            ['하지 않을 일', '시차 극복을 위해 수면제를 임의로 주지 마세요.'],
            ['관련', '비행기 귀·수면 안내를 참고하세요.']
        ],
        links: [
            ['AAP 여행·수면 개요', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['CDC 여행 건강 개요', 'https://wwwnc.cdc.gov/travel']
        ]
    },
    {
        id: 'airplane-lap-infant-boundary',
        match: /(기내\s*무릎\s*아기|비행기\s*무릎\s*아기|airplane\s*lap\s*infant|무릎\s*탑승\s*아기|항공기\s*무릎\s*유아)/,
        title: '비행기에서 아기는 가능하면 승인된 카시트·별도 좌석이 더 안전할 수 있습니다',
        lead: '무릎 탑승은 난기류 시 위험이 큽니다. 항공사 규정을 확인하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['선택', '별도 좌석·승인 카시트'],
            ['주의', '난기류, 벨트']
        ],
        blocks: [
            ['지금 할 일', '항공사 카시트 정책을 미리 보세요.'],
            ['하지 않을 일', '이륙·착륙 때 복도를 걷지 마세요.'],
            ['관련', '비행기 귀·카시트 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['FAA/항공 규정 확인', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx']
        ]
    },
    {
        id: 'airport-security-infant-boundary',
        match: /(공항\s*검색대\s*아기|공항\s*검색대\s*아기|공항\s*보안\s*검색\s*유아|airport\s*security\s*infant)/,
        title: '공항 검색 때는 요원을 따르고, 카시트·분유 규정은 항공·보안 안내를 확인하세요',
        lead: '여기서 규정 전체를 대체하지 않습니다.',
        points: [
            ['준비', '여유 시간, 서류'],
            ['태도', '아이 손 잡기']
        ],
        blocks: [
            ['지금 할 일', '규정을 미리 검색하세요.'],
            ['하지 않을 일', '혼잡 중 아이를 손에서 놓지 마세요.'],
            ['관련', '외출·비행 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['AAP 카시트', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Car-Safety-Seats-Information-for-Families.aspx']
        ]
    },
    {
        id: 'takeoff-paci-swallow-boundary',
        match: /(이착륙\s*공갈\s*젖꼭지|이착륙\s*쪽쪽이|이륙\s*공갈\s*젖꼭지|takeoff\s*paci\s*ear)/,
        title: '이착륙 때 수유·쪽쪽이·물로 삼킴을 도와 귀 불편을 줄일 수 있습니다',
        lead: '중이염이 있으면 의료진과 비행 여부를 상담하세요.',
        points: [
            ['도움', '삼킴, 수유'],
            ['상담', '심한 귀 통증']
        ],
        blocks: [
            ['지금 할 일', '이착륙 때 삼키게 하세요.'],
            ['하지 않을 일', '아픈 귀를 세게 막지 마세요.'],
            ['관련', '비행기 귀 안내를 참고하세요.']
        ],
        links: [
            ['AAP 외출', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/default.aspx'],
            ['AAP 건강', 'https://www.healthychildren.org/English/health-issues/conditions/Pages/default.aspx']
        ]
    },
    {
        id: 'airplane-ear-pressure',
        match: /(비행기|항공).{0,16}(귀|이착륙|울음|압력)|이착륙.{0,12}(울음|귀)|귀\s*압력|ear\s*pressure\s*flight/,
        title: '이착륙 때 귀 압력은 삼키기·수유로 도움이 될 수 있고, 아픈 귀는 미리 상담하세요',
        lead: '비행기 이착륙 시 압력 변화로 보챌 수 있습니다. 수유·젖병·노리개로 삼키기를 돕는 방법이 흔히 안내됩니다. 중이염 등으로 귀가 아플 때는 여행 전 의료진과 상의하세요. 진정제 용량을 사이트에서 정하지 않습니다.',
        points: [
            ['이착륙', '삼키기, 수유 타이밍, 코 막힘 완화(의료 안내)'],
            ['상담', '귀 통증·수술 직후·심한 코막힘']
        ],
        blocks: [
            ['지금 할 일', '이착륙 시간에 맞춰 수유·간식을 계획해 보세요.'],
            ['하지 않을 일', '술을 바른 무균 솜 등 민간 귀 처치를 하지 마세요.'],
            ['관련', '중이염·수유 안내를 참고하세요.']
        ],
        links: [
            ['AAP 비행기 여행', 'https://www.healthychildren.org/English/safety-prevention/on-the-go/Pages/Flying-with-Baby.aspx'],
            ['중이염 안내', '#home']
        ]
    },
    {
        id: 'heater-timer-overnight-boundary',
        match: /(온풍기\s*타이머|온풍기\s*타이머\s*밤새|히터\s*밤새\s*타이머|heater\s*timer\s*overnight)/,
        title: '온풍기·히터를 밤새 켜 두기보다 타이머·거리를 쓰고 이불을 말리지 마세요',
        lead: '화재·화상 위험이 있습니다. 브랜드 순위는 하지 않습니다.',
        points: [
            ['사용', '거리, 타이머, 감독'],
            ['금지', '이불 건조']
        ],
        blocks: [
            ['지금 할 일', '사람·천에서 떨어뜨리세요.'],
            ['하지 않을 일', '넘어지기 쉬운 곳에 두지 마세요.'],
            ['관련', '난로 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'space-heater-distance-boundary',
        match: /(전기\s*난로\s*거리|온풍기\s*안전\s*거리|space\s*heater\s*distance|전기히터\s*이불\s*거리)/,
        title: '전기 난로·온풍기는 아이·이불에서 거리를 두고, 밤새 켜 두지 마세요',
        lead: '화상·화재 위험이 큽니다. 넘어지지 않는 위치와 타이머를 검토하세요. 브랜드 순위는 하지 않습니다.',
        points: [
            ['거리', '사람·천에서 떨어뜨리기'],
            ['사용', '감독, 타이머']
        ],
        blocks: [
            ['지금 할 일', '난로 앞에 장난감을 두지 마세요.'],
            ['하지 않을 일', '이불을 난로 위에 말리지 마세요.'],
            ['관련', '난로·화재 안내를 참고하세요.']
        ],
        links: [
            ['AAP 가정 안전', 'https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx'],
            ['CPSC', 'https://www.cpsc.gov/']
        ]
    },
    {
        id: 'candle-heater-fire',
        match: /(양초\s*화재|캔들\s*아기|전기\s*난로|히터\s*전도|난로\s*안전|공간\s*히터)/,
        title: '양초·전기 난로는 아이 손 닿지 않게 두고, 켜 둔 채 잠들거나 자리를 비우지 마세요',
        lead: '열린 불꽃과 뜨거운 난로는 화상·화재 원인입니다. 양초는 가능하면 쓰지 않거나 완전히 감시하고, 난로는 전도 방지·과열 차단·이격 거리를 지킵니다. 특정 제품 추천은 하지 않습니다.',
        points: [
            ['양초', '감시, 끄고 자기, 커튼 멀리'],
            ['난로', '전도 안전, 화상 방지 가드, 전원 점검']
        ],
        blocks: [
            ['지금 할 일', '난로·양초 주변에 끌릴 천·장난감이 있는지 치우세요.'],
            ['하지 않을 일', '켜 둔 난로 옆에서 아이만 두지 마세요.'],
            ['관련', '화상·CO 경보 안내를 참고하세요.']
        ],
        links: [
            ['CDC 화상 예방', 'https://www.cdc.gov/burn-prevention/'],
            ['CPSC 난로 안전', 'https://www.cpsc.gov/'],
            ['화상 안내', '#home']
        ]
    },
    {
        id: 'pinworm-boundary',
        match: /(요충|항문\s*가려|핀웜|pinworm|항문\s*가려움\s*밤)/,
        title: '항문 가려움으로 요충이 의심되면 자가 진단·약 용량을 정하지 말고 진료·약국 상담을 하세요',
        lead: '요충은 어린이에게 비교적 흔할 수 있으며 밤 항문 가려움으로 의심하기도 합니다. 가족 위생·손 씻기가 중요하고, 치료약 여부와 용량은 의료진·약사가 정합니다. 사진 진단·댓글 처방은 하지 않습니다.',
        points: [
            ['위생', '손 씻기, 손톱 짧게, 속옷·침구 위생'],
            ['진료', '가려움 지속, 수면 방해, 약 필요 여부']
        ],
        blocks: [
            ['지금 할 일', '증상 시간대와 가족 여부를 기록하세요.'],
            ['하지 않을 일', '성인 구충제를 임의 용량으로 나눠 주지 마세요.'],
            ['관련', '손 씻기 안내를 참고하세요.']
        ],
        links: [
            ['CDC 요충', 'https://www.cdc.gov/pinworm/'],
            ['AAP 요충', 'https://www.healthychildren.org/English/health-issues/conditions/abdominal/Pages/Pinworms.aspx']
        ]
    }

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

function findCommonParentAnswer(query) {
    const normalized = normalizeSiteSearch(query);
    return COMMON_PARENT_ANSWERS.find(answer => answer.match.test(normalized)) || null;
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

function appendOfficialAnswerTrustNote(container) {
    const note = document.createElement('p');
    note.className = 'official-answer-trust-note';
    note.textContent = '진단·처방이 아닙니다. 원문 링크를 열어 기준을 직접 확인하고, 위험하다고 느끼면 온라인 정보보다 진료를 우선하세요.';
    container.appendChild(note);
}

function renderNoDirectAnswerGuide(hasKeywordResults) {
    if (!developmentTimingCard) return false;

    developmentTimingCard.replaceChildren();
    developmentTimingCard.hidden = false;
    developmentTimingCard.classList.add('development-timing-card--scope');
    developmentTimingCard.classList.remove('development-timing-card--direct');

    const head = document.createElement('div');
    head.className = 'development-timing-head';
    const badge = document.createElement('span');
    badge.textContent = '직접 공식 답 없음';
    const title = document.createElement('h3');
    title.id = 'developmentTimingTitle';
    title.textContent = '이 질문에는 아직 공식 직접 답을 만들지 않았습니다';
    head.append(badge, title);

    const intro = document.createElement('p');
    intro.className = 'official-answer-lead';
    intro.textContent = hasKeywordResults
        ? '모르는 답을 지어내지 않습니다. 아래는 검수된 관련 글이며, 지금 아이 상태에 맞는 최종 판단은 의료진과 확인하세요.'
        : '모르는 답을 지어내지 않습니다. 비슷한 주제를 찾지 못했으므로, 응급 신호부터 확인하고 필요하면 바로 진료받으세요.';

    const supportPanel = document.createElement('div');
    supportPanel.className = 'development-support-panel development-support-panel--scope';
    const blocks = [
        {
            title: '지금 할 일',
            text: hasKeywordResults
                ? '아래 관련 글에서 적용 연령·예외·출처를 확인하세요. 아이 상태 변화(호흡·반응·수분·통증)를 함께 적어두면 진료에 도움이 됩니다.'
                : '열·호흡·의식·수분 섭취를 먼저 살피고, 평소와 다르면 진료를 미루지 마세요. 사이트에 없는 주제는 카페·영상보다 공식 기관·의료진을 우선하세요.',
            className: 'development-support-block development-support-now'
        },
        {
            title: '급할 때',
            text: '숨쉬기 힘듦, 파랗게 보임, 깨워도 반응이 매우 약함, 5분 이상 경련은 119 또는 응급실을 이용하세요. 생후 3개월 미만 38℃ 이상도 바로 의료기관 평가가 필요합니다.',
            className: 'development-support-block development-support-caution'
        },
        {
            title: '하지 않을 일',
            text: '출처 없는 용량·민간요법·사진만으로 병명 단정하기, “인터넷에 없으니 괜찮다”고 미루기를 하지 마세요.',
            className: 'development-support-block development-support-method'
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
    [
        ['열·응급 행동 가이드', 'blog/baby-fever-cold-guide.html'],
        ['1세 미만 안전수면', 'blog/baby-safe-sleep-guide.html'],
        ['이유식·질식 경계', 'blog/complementary-feeding-allergy-guide.html#choking'],
        ['오류·누락 제보 안내', '#contact']
    ].forEach(([label, href]) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        links.appendChild(link);
    });

    developmentTimingCard.append(head, intro, supportPanel, links);
    appendOfficialAnswerTrustNote(developmentTimingCard);
    return true;
}

function renderCommonParentAnswer(query, ageInfo) {
    if (!developmentTimingCard) return null;
    const answer = findCommonParentAnswer(query);
    if (!answer) {
        developmentTimingCard.hidden = true;
        return null;
    }

    developmentTimingCard.replaceChildren();
    developmentTimingCard.hidden = false;
    developmentTimingCard.classList.add('development-timing-card--direct');
    developmentTimingCard.classList.remove('development-timing-card--scope');

    const head = document.createElement('div');
    head.className = 'development-timing-head';
    const badge = document.createElement('span');
    badge.textContent = Number.isInteger(ageInfo?.value)
        ? '공식 답변 · ' + ageInfo.value + '개월'
        : '공식 답변';
    const title = document.createElement('h3');
    title.id = 'developmentTimingTitle';
    title.textContent = answer.title;
    head.append(badge, title);

    const intro = document.createElement('p');
    intro.className = 'official-answer-lead';
    intro.textContent = answer.lead;

    const list = document.createElement('ul');
    list.className = 'development-milestone-list';
    answer.points.forEach(([label, text]) => {
        const item = document.createElement('li');
        const strong = document.createElement('strong');
        strong.textContent = label + ' · ';
        item.append(strong, document.createTextNode(text));
        list.appendChild(item);
    });

    const supportPanel = document.createElement('div');
    supportPanel.className = 'development-support-panel';
    answer.blocks.forEach(([headingText, bodyText], index) => {
        const block = document.createElement('div');
        block.className = 'development-support-block';
        if (index === 0) block.classList.add('development-support-now');
        if (index === 1) block.classList.add('development-support-method');
        if (index === 2) block.classList.add('development-support-caution');
        const heading = document.createElement('h4');
        heading.textContent = headingText;
        const body = document.createElement('p');
        body.textContent = bodyText;
        block.append(heading, body);
        supportPanel.appendChild(block);
    });

    const links = document.createElement('div');
    links.className = 'development-timing-links';
    answer.links.forEach(([label, href]) => {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = label;
        if (/^https:\/\//.test(href)) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
        links.appendChild(link);
    });

    developmentTimingCard.append(head, intro, list, supportPanel, links);
    appendOfficialAnswerTrustNote(developmentTimingCard);
    return answer.id;
}

function renderOralCareAnswer(query, ageInfo) {
    if (!developmentTimingCard || !isOralCareQuestion(query)) {
        if (developmentTimingCard) developmentTimingCard.hidden = true;
        return false;
    }

    const age = ageInfo?.value;
    developmentTimingCard.replaceChildren();
    developmentTimingCard.hidden = false;
    developmentTimingCard.classList.add('development-timing-card--direct');
    developmentTimingCard.classList.remove('development-timing-card--scope');

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
    intro.className = 'official-answer-lead';
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
            className: 'development-support-block development-support-now'
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
    appendOfficialAnswerTrustNote(developmentTimingCard);
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
    developmentTimingCard.classList.add('development-timing-card--direct');
    developmentTimingCard.classList.remove('development-timing-card--scope');

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
    appendOfficialAnswerTrustNote(developmentTimingCard);
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
    const commonAnswerId = oralCareShown ? null : renderCommonParentAnswer(cleanQuery, ageInfo);
    const timingShown = (oralCareShown || commonAnswerId) ? false : renderDevelopmentTiming(cleanQuery, ageInfo);
    const hasDirectAnswer = Boolean(oralCareShown || commonAnswerId || timingShown);

    let results = searchSiteContent(cleanQuery);
    const hasKeywordResults = results.length > 0;
    let usedFallbackTopics = false;
    if (!results.length) {
        results = SITE_SEARCH_ITEMS.slice(0, 3);
        usedFallbackTopics = true;
    }

    if (!hasDirectAnswer) {
        renderNoDirectAnswerGuide(hasKeywordResults);
    }

    siteSearchResults.replaceChildren();
    results.forEach(appendSearchResult);
    siteSearchOutput.hidden = false;

    if (siteSearchResultHeading) {
        if (hasDirectAnswer && hasKeywordResults) {
            siteSearchResultHeading.textContent = '이어서 볼 검수된 상세 글';
        } else if (hasKeywordResults) {
            siteSearchResultHeading.textContent = '검수된 관련 글 · 직접 공식 답은 아님';
        } else {
            siteSearchResultHeading.textContent = '먼저 확인할 수 있는 핵심 가이드';
        }
    }

    let status = '';
    if (oralCareShown) status = '공식 구강관리 답을 먼저 보여 드렸습니다. 아래는 이어서 볼 상세 글입니다.';
    else if (commonAnswerId) status = '자주 묻는 질문의 공식 근거 답을 먼저 보여 드렸습니다. 원문 링크로 기준을 확인하세요.';
    else if (timingShown) status = '가까운 개월 수의 대표 모습을 보여 드렸습니다. 한두 가지 모습만으로 늦었다고 정하지 않습니다.';
    else if (ageInfo && !ageInfo.supported && isDevelopmentQuestion(cleanQuery)) {
        status = '발달 모습 안내는 현재 0~36개월까지입니다. 직접 공식 답 없이 관련 경로만 안내합니다.';
    } else if (isDevelopmentQuestion(cleanQuery) && !ageInfo) {
        status = '직접 공식 답이 없거나 개월 수가 필요합니다. 개월 수를 넣으면 발달 모습 안내를 함께 볼 수 있습니다.';
    } else if (hasKeywordResults) {
        status = '이 질문의 공식 직접 답은 아직 없습니다. 검수된 관련 글 ' + results.length + '개를 연결했습니다.';
    } else if (usedFallbackTopics) {
        status = '비슷한 주제를 찾지 못했습니다. 답을 지어내지 않고, 급할 때 기준과 핵심 가이드만 안내합니다.';
    } else {
        status = results.length + '개의 관련 내용을 찾았습니다.';
    }
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
