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
        id: 'gas-colic-comfort',
        match: /(배앓이|가스|방귀|콜릭|colic|저녁마다\s*울|한없이\s*울|보챔.*저녁)/,
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
