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
    ['수유량', '분유량', '수유텀', '수유간격', '밤수유', '밤중수유'],
    ['생우유', '우유', '분유끊기', '분유떼기'],
    ['헛구역질', '구역질', '질식', '사레', '기도폐쇄'],
    ['영상', '유튜브', '티비', '스크린', '핸드폰', '휴대폰', '미디어'],
    ['배변훈련', '기저귀떼기', '변기', '팬티', '변비', '응가'],
    ['떼쓰기', '고집', '물기', '때리기', '공격행동'],
    ['열', '발열', '고열', '체온', '해열제', '감기', '기침', '경련'],
    ['잠', '수면', '밤잠', '낮잠', '자주깨요', '안자요', '뒤집기'],
    ['접종', '예방접종', '백신', '주사', '일정'],
    ['양치', '양치를', '칫솔', '칫솔질', '치약', '불소', '치아', '이빨', '첫니', '젖니', '잇몸', '구강', '충치', '닦기'],
    ['늦음', '늦는', '늦어요', '느림', '느려요', '지연', '못해요']
];

// Questions are selected from recurring themes in Korean parenting-community research
// and public childcare counselling cases. Community posts identify the question only;
// every answer below is written from the linked official or professional guidance.
const COMMON_PARENT_ANSWERS = [
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
        match: /(깨워서|깨워)\s*(먹|수유)|자는데\s*(먹|수유)|통잠.*(먹|수유)|밤중?\s*수유|밤수유/,
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
        match: /(모유|젖).*(끊|떼|단유|중단\s*하|끊는\s*방법|떼는\s*방법)|단유|젖\s*떼|수유\s*중단/,
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
