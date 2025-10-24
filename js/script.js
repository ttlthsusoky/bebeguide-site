// Mobile Navigation Toggle
const mobileMenu = document.getElementById('mobile-menu');
const navMenu = document.querySelector('.nav-menu');

mobileMenu.addEventListener('click', () => {
    mobileMenu.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Close mobile menu when clicking on a link
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        mobileMenu.classList.remove('active');
        navMenu.classList.remove('active');
    });
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.offsetTop - navHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

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

// Initialize typing effect when page loads
window.addEventListener('load', () => {
    const heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
        const originalText = heroTitle.textContent;
        typeWriter(heroTitle, originalText, 50);
    }
});

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

// Initialize loading screen
showLoadingScreen();

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
/* === Bebeguide: 월령별 실제 체크리스트 === */

// 임신 준비 체크리스트
const PREGNANCY_PREP = {
  '임신 전 준비': [
    "엽산 복용 (임신 3개월 전부터)",
    "건강검진 (산부인과, 내과)",
    "풍진 항체 검사 및 예방접종",
    "치과 검진 및 치료",
    "철분제 복용 시작",
    "카페인·알코올 섭취 줄이기",
    "적정 체중 유지 (BMI 확인)",
    "복용 중인 약물 의사와 상담"
  ],
  '산모 용품': [
    "임부복 3-5벌 (배가 커지는 시기 대비)",
    "임산부 속옷 (편안한 소재)",
    "복대 (임신 중기부터)",
    "임산부 베개 (C자형 추천)",
    "스트레치 마크 크림",
    "임산부 영양제 (엽산, 철분, 오메가3)",
    "출산 가방 (34주 전 준비)",
    "수유 브라 2-3개"
  ],
  '아기 용품': [
    "신생아 기저귀 (소형, 3-5kg용) 1팩",
    "속싸개 3-4장 (면 100%)",
    "배냇저고리 5-6벌",
    "체온계 (디지털 or 귀 적외선)",
    "젖병 및 젖꼭지 (신생아용) 2-3개",
    "젖병 세척솔 및 소독기",
    "기저귀 발진 크림",
    "신생아용 로션 (무향)",
    "아기 침대 및 침구",
    "카시트 (필수 안전용품)"
  ],
  '출산 준비': [
    "출산 병원 예약 및 확인",
    "출산 방법 결정 (자연분만/제왕절개)",
    "출산 교실 수강",
    "출산 가방 준비 (산모용, 아기용)",
    "보험 서류 준비",
    "출생 신고 절차 확인",
    "산후조리원 예약 (선택사항)",
    "신생아 용품 최종 점검"
  ]
};

// 0개월 상세 돌봄 가이드 (WHO, 질병관리청, 대한소아과학회 기준)
const NEWBORN_CARE = {
  '수유 가이드': [
    {
      title: "모유수유 (WHO 권장)",
      items: [
        "📌 횟수: 하루 8-12회, 2-3시간마다 수유 (WHO 기준)",
        "👶 자세: C자형 손모양으로 유방 잡기, 아기 입에 유두+유륜 깊숙이",
        "💨 트림: 수유 후 반드시 세워서 등 두드리기 (5-10분)",
        "⏰ 시간: 한쪽 유방당 10-15분, 양쪽 번갈아가며",
        "💧 수분: 엄마는 하루 2L 이상 물 섭취 (모유 생성)",
        "📦 보관: 실온 4시간, 냉장 3-5일, 냉동 6개월 (WHO 기준)",
        "✅ 충분한지 확인: 하루 6회 이상 기저귀 젖음, 체중 증가",
        "🎯 WHO 권장: 생후 6개월까지 완전 모유수유, 2세까지 지속"
      ]
    },
    {
      title: "분유수유 (식약처 기준)",
      items: [
        "🍼 선택: 0-6개월용 1단계 분유 (식약처 인증 제품)",
        "🌡️ 조유: 70도 이상 물로 조유 후 체온(37도)까지 식히기",
        "📊 양: 체중 1kg당 150ml (하루 총량), 신생아 약 60-90ml/회",
        "🧼 소독: 매 수유 후 젖병·젖꼭지 세척 및 소독 (끓는 물 5분)",
        "⏱️ 간격: 3-4시간 간격, 아기가 원할 때 수유",
        "🚫 폐기: 조유 후 2시간, 먹다 남은 분유는 1시간 내 폐기",
        "💡 트림: 분유는 공기 섭취가 많으므로 트림 필수",
        "📌 참고: 대한소아과학회 - 분유는 모유 대체 시 적절한 영양 공급"
      ]
    }
  ],
  '기저귀 & 목욕': [
    {
      title: "기저귀 갈기 (대한소아과학회)",
      items: [
        "🔄 횟수: 하루 8-10회 (신생아는 더 자주)",
        "💩 즉시 교체: 대변 후 바로, 피부 자극 방지",
        "💧 세척: 물티슈보다 미지근한 물+부드러운 천 권장",
        "🌬️ 발진 예방: 자주 갈고, 통풍 시간 주기 (하루 10-15분)",
        "🩹 배꼽: 탯줄 떨어질 때까지 소독 (알코올 솜), 건조 유지",
        "🧴 발진 크림: 아연 성분, 얇게 도포 (두껍게 바르면 역효과)",
        "⚠️ 주의: 기저귀 발진 심하면 소아과 진료",
        "📌 팁: 기저귀 크기는 허벅지에 손가락 2개 들어갈 정도"
      ]
    },
    {
      title: "목욕 (WHO & 대한신생아학회)",
      items: [
        "⏰ 횟수: 주 2-3회면 충분 (매일 안 해도 됨, 피부 건조 방지)",
        "🌡️ 온도: 물 37-38도, 손목 안쪽으로 확인",
        "⏱️ 시간: 5-10분 이내 (장시간 목욕은 체온 저하)",
        "🛁 탯줄 전: 부분 목욕 (스펀지 목욕), 탯줄 젖지 않게",
        "🚿 탯줄 후: 통목욕 가능 (생후 2주 이후 보통)",
        "🧴 보습: 목욕 후 3분 내 무향 로션 (피부 보호막)",
        "🧼 세제: 무향·저자극 베이비 전용 제품, 거품 적게",
        "📌 WHO 권장: 생후 24시간 후 첫 목욕 (체온 유지 위해)"
      ]
    }
  ],
  '수면 & 환경': [
    {
      title: "수면 패턴 (미국소아과학회 AAP)",
      items: [
        "💤 시간: 하루 16-20시간 수면 (정상)",
        "🌓 낮밤: 구분 없음 (생후 3-4개월부터 구분 시작)",
        "⏰ 깨기: 2-3시간마다 수유 때문에 깸 (자연스러운 현상)",
        "🛏️ 자세: 반드시 '등 대고' 재우기 (영아돌연사증후군 SIDS 예방)",
        "🚫 침구: 베개·이불·인형 넣지 않기 (질식 위험)",
        "🌡️ 온도: 실내 20-22도, 너무 덥지 않게 (과열 주의)",
        "👶 같은 방 다른 침대: AAP 권장 (최소 6개월, 이상적으로 1년)",
        "📌 주의: 엎드려 재우기·옆으로 재우기 금지 (SIDS 위험 증가)"
      ]
    },
    {
      title: "환경 관리 (보건복지부)",
      items: [
        "🌡️ 온도: 20-22도 (여름 24-26도), 온도계로 확인",
        "💧 습도: 40-60% 유지 (가습기 사용, 청결 관리 필수)",
        "🌬️ 환기: 하루 2-3회, 10분씩 (미세먼지 적을 때)",
        "☀️ 햇빛: 직사광선 피하기, 간접 햇빛은 OK (비타민D)",
        "🔇 소음: 최소화, 백색소음은 50dB 이하로 사용 가능",
        "💡 밝기: 낮은 밝게·밤은 어둡게 (낮밤 구분 학습)",
        "🧼 청결: 먼지·곰팡이 제거, 공기청정기 활용",
        "📌 공기질: 미세먼지 '나쁨' 이상 시 외출·환기 자제"
      ]
    }
  ],
  '건강 체크': [
    {
      title: "성장 발달 (대한소아과학회)",
      items: [
        "⚖️ 체중: 출생 시 -7~10% 감소 정상, 생후 2주 내 회복",
        "📏 신장: 월 평균 3-4cm 증가 (개인차 있음)",
        "👶 머리: 대천문(숨구멍) 확인, 부드럽게 뛰는 것 정상",
        "🟡 황달: 생후 2-3일 시작, 2주 내 사라짐 (지속 시 진료)",
        "👁️ 시력: 20-30cm 거리 얼굴 구분, 흑백 대비 선호",
        "👂 청력: 큰 소리에 깜짝 놀람 (모로 반사)",
        "🤲 반사: 빨기·잡기·모로·걷기 반사 확인",
        "📊 성장곡선: 백분위수 3-97% 범위 내 정상 (소아과 상담)"
      ]
    },
    {
      title: "주의 증상 (응급 상황)",
      items: [
        "🌡️ 발열: 38도 이상 시 즉시 소아과 (생후 3개월 미만은 응급)",
        "🤮 구토: 분수처럼 토하거나 녹색 구토 시 응급실",
        "💩 대변: 흰색·회색 대변 (담도폐쇄), 검은색 (출혈) 즉시 병원",
        "😮 호흡: 숨쉬기 힘들어하거나 입술이 파래지면 119",
        "💧 탈수: 기저귀 6시간 이상 마름, 입술 건조, 처짐",
        "🟡 황달: 2주 이상 지속, 피부·눈 노래짐 심해지면 검사",
        "😴 각성: 깨우기 어렵거나 처지면 즉시 병원",
        "📌 경련·의식 저하·지속적 보챔은 응급 상황 (119)"
      ]
    }
  ]
};

// 예방접종 스케줄 (질병관리청 기준)
const VACCINATION_SCHEDULE = [
  {
    age: "출생 직후",
    vaccines: [
      { name: "BCG (결핵)", note: "피내용 또는 경피용 중 선택" },
      { name: "B형간염 1차", note: "출생 후 24시간 내" }
    ]
  },
  {
    age: "1개월",
    vaccines: [
      { name: "B형간염 2차", note: "1차 접종 후 1개월 후" }
    ]
  },
  {
    age: "2개월",
    vaccines: [
      { name: "DTaP 1차", note: "디프테리아, 파상풍, 백일해" },
      { name: "IPV 1차", note: "소아마비" },
      { name: "Hib 1차", note: "b형 헤모필루스 인플루엔자" },
      { name: "PCV 1차", note: "폐렴구균" },
      { name: "로타바이러스 1차", note: "선택접종 (유료)" }
    ]
  },
  {
    age: "4개월",
    vaccines: [
      { name: "DTaP 2차", note: "1차 접종 후 2개월 후" },
      { name: "IPV 2차", note: "1차 접종 후 2개월 후" },
      { name: "Hib 2차", note: "1차 접종 후 2개월 후" },
      { name: "PCV 2차", note: "1차 접종 후 2개월 후" },
      { name: "로타바이러스 2차", note: "선택접종 (유료)" }
    ]
  },
  {
    age: "6개월",
    vaccines: [
      { name: "DTaP 3차", note: "2차 접종 후 2개월 후" },
      { name: "IPV 3차", note: "2차 접종 후 2개월 후" },
      { name: "Hib 3차", note: "2차 접종 후 2개월 후" },
      { name: "PCV 3차", note: "2차 접종 후 2개월 후" },
      { name: "B형간염 3차", note: "2차 접종 후 5개월 후" },
      { name: "로타바이러스 3차", note: "선택접종, 제품에 따라 생략 가능" },
      { name: "인플루엔자 1차", note: "매년 접종, 유행 시기 전" }
    ]
  },
  {
    age: "12개월",
    vaccines: [
      { name: "MMR 1차", note: "홍역, 유행성이하선염, 풍진" },
      { name: "수두 1차", note: "12-15개월 사이" },
      { name: "일본뇌염 불활성화 백신 1차", note: "또는 약독화 생백신" },
      { name: "PCV 4차", note: "3차 접종 후 6개월 후" },
      { name: "Hib 4차", note: "3차 접종 후 6개월 후" }
    ]
  }
];

const CHECKLIST = {
  0: [
    "🍼 신생아 기저귀 (소형, 3-5kg용, 하루 8-10개)",
    "👶 속싸개 3-4장 (면 100%, 사계절용)",
    "👕 배냇저고리 5-6벌 (앞트임, 끈으로 묶는 형)",
    "🌡️ 체온계 (디지털 or 귀 적외선, 발열 체크 필수)",
    "🍼 젖병 2-3개 (120ml 소형, 유리 or BPA-free)",
    "🧼 젖병 세척솔 및 소독기 (매 수유 후 소독)",
    "🧴 기저귀 발진 크림 (아연 성분, 신생아용)",
    "💧 신생아용 로션 (무향, 저자극)",
    "🛁 신생아 욕조 (접이식 추천)",
    "🩹 배꼽 소독 세트 (알코올 솜, 탯줄 떨어질 때까지)"
  ],
  1: [
    "🍼 기저귀 소형 (계속 사용, 하루 8-10개)",
    "🛋️ 수유쿠션 (팔 부담 감소, 올바른 자세)",
    "✂️ 신생아 손톱깎이 (안전형, 자는 동안 자르기)",
    "🤱 배앓이 완화 복대 (영아산통 시기)",
    "👶 아기띠 (신생아용, 목 지지 필수)",
    "🧸 외출용 담요 (계절별, 통풍 잘 되는 소재)",
    "🌡️ 젖병 보온포트 (외출 시 편리)",
    "🛏️ 침구 세트 (아기침대용, 베개 없이)",
    "📦 유축기 (직장 복귀 or 모유 보관용)",
    "🧴 수유패드 (모유 수유 시)"
  ],
  2: [
    "🍼 기저귀 중형으로 교체 고려 (5kg 이상)",
    "🛋️ 목 받침 쿠션 (목 가누기 연습)",
    "🎨 흑백 대비 카드 (시각 발달 자극)",
    "🛁 목욕용 베이비 바스 (미끄럼 방지)",
    "🧴 무향 베이비 샴푸 (저자극)",
    "💆 아기 마사지 오일 (혈액순환, 정서 안정)",
    "👜 외출용 기저귀 가방 (정리 수납)",
    "🚗 카시트 (법적 필수, 안전 인증 확인)",
    "🌡️ 가습기 (습도 40-60% 유지)",
    "🧸 딸랑이 (청각 자극)"
  ],
  3: [
    "🍼 기저귀 중형 (5-9kg용, 활동량 증가)",
    "🍽️ 턱받이 여러 개 (침 많이 흘림 시기)",
    "🎵 침대 모빌 (시각·청각 발달)",
    "👃 콧물 흡입기 (감기 예방 시즌)",
    "🧤 손싸개/발싸개 (긁힘 방지, 선택사항)",
    "🛏️ 수면 조끼 (이불 대신 안전하게)",
    "🧸 딸랑이 장난감 (쥐기 연습)",
    "💉 예방접종 수첩 (접종 기록 관리)",
    "📚 헝겊책 (촉각 자극)",
    "🎶 백색소음기 (수면 루틴)"
  ],
  4: [
    "기저귀 중형 지속 사용",
    "범퍼침대 or 안전가드",
    "치아발육기 (실리콘)",
    "아기 전용 물티슈",
    "외출용 유모차",
    "자외선 차단 모자",
    "소근육 발달 장난감",
    "아기 안전 손목밴드"
  ],
  5: [
    "기저귀 대형 교체 고려",
    "아기 식탁의자 준비",
    "이유식 준비 도구들",
    "실리콘 수저 세트",
    "흘림방지 턱받이",
    "식품 알레르기 체크 노트",
    "아기 치발기 다양하게",
    "놀이매트 (안전한 재질)"
  ],
  6: [
    "하이체어 (이유식용)",
    "이유식 조리도구 세트",
    "흡착식판 (미끄럼방지)",
    "실리콘 스푼 (BPA프리)",
    "바닥 놀이매트",
    "이유식 냉동보관용기",
    "아기 앞치마",
    "소화기능 보조 유산균"
  ],
  7: [
    "기저귀 대형 (7-12kg용)",
    "셀프 이유식 도구",
    "물컵 (흘림방지)",
    "기어다니기 안전용품",
    "모서리 보호대",
    "서랍 안전잠금장치",
    "두뇌발달 장난감",
    "아기 운동복"
  ],
  8: [
    "잡기 쉬운 장난감들",
    "크롤링 무릎보호대",
    "안전문 (계단, 방문)",
    "콘센트 안전커버",
    "아기 전용 칫솔",
    "무불소 치약",
    "소근육 발달 놀이용품",
    "외출용 간식통"
  ],
  9: [
    "잡고 서기 보조 용품",
    "테이블 모서리 보호대",
    "아기 신발 (실내용)",
    "높이 조절 식탁의자",
    "핑거푸드 준비용품",
    "아기 가위 (안전형)",
    "목욕 장난감",
    "발달 체크 일지"
  ],
  10: [
    "걸음마 보조기구",
    "아기 실외화 (첫 신발)",
    "무릎보호대 (걸음마용)",
    "안전한 계단 가드",
    "높낮이 변환 침대",
    "소통 및 언어발달 도서",
    "빨대컵 (무게 가벼운)",
    "응급처치 키트"
  ],
  11: [
    "걸음마 연습 공간 확보",
    "실외 활동용 모자",
    "선크림 (베이비 전용)",
    "대근육 발달 놀이기구",
    "언어 자극 장난감",
    "그림책 (두꺼운 보드북)",
    "유아용 식탁의자",
    "치아 관리용품 업그레이드"
  ],
  12: [
    "돌잔치 준비용품",
    "코너 보호대 추가 설치",
    "빨대컵 (무게 있는 것)",
    "유아식 식기 세트",
    "소형 도서 5-10권",
    "블록 놀이 세트",
    "역할놀이 장난감",
    "성장 기록 앨범"
  ]
};

(function initAgeChecklist(){
  const ageSel = document.getElementById('ageSelect');
  const btnShow = document.getElementById('showChecklist');
  const btnPdf  = document.getElementById('getPdf');
  const box     = document.getElementById('checklistResult');
  if(!ageSel || !btnShow || !box) return;

  btnShow.addEventListener('click', ()=>{
    const m = ageSel.value;
    const list = CHECKLIST[m] || CHECKLIST[0];
    const monthText = m == 0 ? '신생아' : `${m}개월`;
    
    // Add header with month info
    let headerHTML = `
      <div class="checklist-header">
        <h2>${monthText} 필수 준비물 체크리스트</h2>
        <p>${monthText} 아기에게 꼭 필요한 용품들을 정리했습니다. 안전하고 검증된 제품을 선택하세요.</p>
      </div>
    `;
    
    // Create checklist items with better descriptions and affiliate links
    let itemsHTML = list.map((item, index) => `
      <div class="service-card checklist-item">
        <div class="service-icon">
          <i class="fas fa-baby"></i>
          <span class="item-number">${index + 1}</span>
        </div>
        <h3>${item}</h3>
        <p>${getItemDescription(item, m)}</p>
        <div class="item-actions">
          <a href="#" class="btn-link affiliate-link" data-item="${item}" onclick="trackAffiliateClick('${item}')">
            <i class="fas fa-shopping-cart"></i> 쿠팡에서 보기
          </a>
          <span class="price-info">💰 최저가 비교 중...</span>
        </div>
      </div>
    `).join('');
    
    box.innerHTML = headerHTML + itemsHTML;
    box.scrollIntoView({behavior:'smooth', block:'start'});
  });

  // Helper function to provide context for items
  function getItemDescription(item, month) {
    if (item.includes('기저귀')) return '아기 체중에 맞는 사이즈 선택이 중요합니다. 새는 것을 방지하고 편안함을 위해 정기적으로 교체하세요.';
    if (item.includes('체온계')) return '발열 체크용 필수품입니다. 디지털 체온계나 귀 적외선 체온계 모두 괜찮습니다.';
    if (item.includes('카시트')) return '법적 의무사항이며 생명과 직결된 안전용품입니다. 반드시 신품 구매를 권장합니다.';
    if (item.includes('이유식')) return '아기의 첫 고형식 도입 시기입니다. 알레르기 반응을 주의 깊게 관찰하세요.';
    if (item.includes('안전')) return '아기가 활동 반경이 넓어지면서 꼭 필요한 안전용품입니다.';
    if (item.includes('장난감')) return '월령에 맞는 발달 자극용 장난감입니다. 안전 인증 제품을 선택하세요.';
    if (item.includes('걸음마')) return '아기의 대근육 발달에 도움이 되지만 과도한 사용은 피하세요.';
    if (item.includes('치아') || item.includes('칫솔')) return '유치 관리의 시작입니다. 불소 성분 없는 제품을 사용하세요.';
    
    return '아기의 건강한 성장과 안전을 위한 필수 용품입니다. 제품 구매 전 안전 인증을 확인하세요.';
  }

  btnPdf?.addEventListener('click', ()=>{
    alert('이메일 수집 폼으로 연결하거나, 폼 제출 시 PDF 자동 발송을 붙여주세요. (Formspark/Formspree/Google Forms → Cloudflare Email Routing)');
  });
})();

// === 제휴마케팅 링크 관리 === //
function trackAffiliateClick(itemName) {
  // 쿠팡 파트너스 링크 (실제 가입 후 링크로 교체 필요)
  const coupangPartnerLink = "https://link.coupang.com/a/YOUR_AFFILIATE_ID";
  
  // 클릭 추적 (Google Analytics, Cloudflare Analytics 등)
  if (typeof gtag !== 'undefined') {
    gtag('event', 'affiliate_click', {
      'item_name': itemName,
      'affiliate_source': 'coupang'
    });
  }
  
  // 쿠팡 검색어로 리다이렉트 (임시)
  const searchKeyword = encodeURIComponent(itemName.replace(/\([^)]*\)/g, '').trim());
  window.open(`https://www.coupang.com/np/search?q=${searchKeyword}`, '_blank');
  
  console.log(`제휴 클릭 추적: ${itemName}`);
}

// 자동 가격 정보 업데이트 (향후 API 연동용)
function updatePriceInfo() {
  const priceElements = document.querySelectorAll('.price-info');
  priceElements.forEach(element => {
    // 임시로 랜덤 가격 표시 (실제로는 API에서 가져와야 함)
    const randomPrice = Math.floor(Math.random() * 50000) + 5000;
    element.textContent = `💰 ${randomPrice.toLocaleString()}원부터`;
  });
}

// 체크리스트 표시 후 가격 정보 업데이트
document.addEventListener('DOMContentLoaded', () => {
  // 페이지 로드 시 가격 정보 업데이트
  setTimeout(updatePriceInfo, 2000);
});


// Chatbot functionality
(function initChatbot() {
  // (기존 initChatbot() 내부 상단 어딘가 적당한 위치에 추가)
    let chatHistory = []; // [{role:'user'|'assistant', content:'...'}]
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    if (!chatToggle || !chatWindow) return;

    // 확장된 Q&A 데이터베이스 (GPT 연동 전 단계)
    const autoResponses = {
        // 인사 및 기본
        '안녕': '안녕하세요! 베베가이드입니다 😊 신생아~12개월 육아 정보를 도와드릴게요. 무엇이 궁금하신가요?',
        '안녕하세요': '안녕하세요! 베베가이드입니다 😊 무엇을 도와드릴까요?',
        '도움': '월령별 체크리스트, 예방접종 스케줄, 신생아 돌봄 가이드 등을 제공합니다. 궁금한 주제를 말씀해주세요!',

        // 예방접종
        '예방접종': '📌 예방접종 스케줄은 상단 메뉴의 "예방접종" 섹션에서 확인하실 수 있어요!\n\n출생 직후: BCG, B형간염 1차\n2개월: DTaP, IPV, Hib, 폐렴구균 시작\n\n자세한 내용은 질병관리청 기준으로 정리되어 있습니다.',
        '접종': '예방접종은 아기의 면역력을 키우는 가장 중요한 방법이에요. 반드시 정해진 시기에 맞춰 접종하세요. 발열·경련 등 이상 증상 시 즉시 병원 방문이 필요합니다.',
        'BCG': 'BCG는 결핵 예방접종으로 출생 직후 접종합니다. 피내용과 경피용 2가지 중 선택 가능하며, 접종 부위에 붉은 자국이 남는 것은 정상입니다.',

        // 수유
        '수유': '📌 수유 가이드:\n• 모유수유: 하루 8-12회, 2-3시간마다 (WHO 권장)\n• 분유수유: 체중 1kg당 150ml (하루 총량)\n\n자세한 내용은 0개월 체크리스트에서 확인하세요!',
        '모유': '모유수유는 WHO에서 생후 6개월까지 완전 모유수유를 권장해요. 올바른 자세(C자형 손모양)와 충분한 수분 섭취(하루 2L)가 중요합니다.',
        '분유': '분유는 70도 이상 물로 조유 후 체온(37도)까지 식혀주세요. 매 수유 후 젖병 소독 필수이며, 남은 분유는 1시간 내 폐기하세요.',
        '트림': '수유 후 트림은 필수예요! 아기를 세워서 등을 5-10분간 부드럽게 두드려주세요. 트림을 안 시키면 역류나 배앓이가 생길 수 있어요.',

        // 수면
        '수면': '📌 신생아 수면:\n• 하루 16-20시간 수면 (정상)\n• 반드시 "등 대고" 재우기 (SIDS 예방)\n• 베개·이불 없이, 온도 20-22도 유지\n\n자세한 내용은 0개월 가이드 참조!',
        '잠': '신생아는 2-3시간마다 깨는 게 정상이에요. 낮밤 구분은 생후 3-4개월부터 시작됩니다. 밤에는 조명을 어둡게, 낮에는 밝게 해주세요.',
        '영아돌연사': 'SIDS(영아돌연사증후군) 예방을 위해:\n1. 반드시 등 대고 재우기\n2. 침대에 베개·이불 넣지 않기\n3. 과열 주의 (20-22도)\n4. 같은 방, 다른 침대',

        // 기저귀 & 목욕
        '기저귀': '신생아는 하루 8-10회 기저귀를 갈아줘야 해요. 대변 후 즉시 교체하고, 물티슈보다 미지근한 물 사용을 권장합니다. 발진 예방을 위해 통풍 시간도 주세요.',
        '목욕': '신생아 목욕은 주 2-3회면 충분해요. 물 온도는 37-38도, 5-10분 이내로! 탯줄 떨어지기 전엔 부분 목욕만 하세요. WHO는 생후 24시간 후 첫 목욕을 권장합니다.',
        '발진': '기저귀 발진은 자주 갈고 통풍 시키면 예방할 수 있어요. 아연 성분 크림을 얇게 도포하세요. 심하면 소아과 진료가 필요합니다.',

        // 건강 & 응급
        '열': '⚠️ 신생아 발열(38도 이상)은 응급상황이에요! 생후 3개월 미만은 즉시 병원 방문하세요. 해열제는 의사 처방 없이 먹이면 안 됩니다.',
        '황달': '신생아 황달은 생후 2-3일 시작해서 2주 내 사라져요. 2주 이상 지속되거나 피부·눈이 심하게 노래지면 검사가 필요합니다.',
        '구토': '분수처럼 토하거나 녹색 구토는 응급실 가야 해요. 트림 후 소량 역류는 정상입니다.',
        '응급': '🚨 응급 상황:\n• 발열 38도 이상\n• 호흡곤란, 입술 파래짐\n• 분수 구토, 흰색·검은색 대변\n• 6시간 이상 기저귀 마름\n→ 즉시 119 또는 응급실!',

        // 체크리스트
        '월령': '월령별 체크리스트는 메인 페이지에서 확인하세요! 0개월부터 12개월까지 각 시기에 필요한 준비물과 돌봄 정보가 정리되어 있어요.',
        '준비물': '신생아 필수 준비물:\n• 기저귀, 속싸개, 배냇저고리\n• 젖병, 소독기, 체온계\n• 카시트 (법적 필수)\n• 신생아 욕조, 로션\n\n자세한 리스트는 0개월 체크리스트 참조!',
        '카시트': '카시트는 신생아 퇴원 시부터 법적으로 필수예요! 반드시 안전 인증 제품을 구매하고, 중고는 사고 이력을 확인하세요.',

        // 임신 준비
        '임신': '임신 준비는 "임신 준비" 섹션을 확인하세요! 엽산 복용(3개월 전), 건강검진, 산모·아기 용품 준비 리스트가 있어요.',
        '엽산': '엽산은 임신 3개월 전부터 복용하세요 (하루 400-800μg). 태아 신경관 결손 예방에 필수입니다.',

        // 기타
        '상담': '전문 육아 상담은 이메일(info@bebe-guide.com)로 문의해주세요. 24시간 내 답변드립니다!',
        '연락처': '📧 이메일: info@bebe-guide.com\n💬 실시간 채팅: 여기 챗봇\n\n의료 응급 상황은 119 또는 가까운 소아과로 즉시 연락하세요!',
        '가격': '베베가이드의 모든 정보는 무료로 제공됩니다! 😊',
        '출처': '모든 정보는 질병관리청, WHO, 대한소아과학회, 보건복지부 등 공신력 있는 기관 자료를 참고했어요. "가이드" 섹션에서 출처를 확인하실 수 있습니다.',

        'default': '죄송해요, 정확히 이해하지 못했어요. 😅\n\n자주 묻는 질문:\n• 예방접종\n• 수유/모유/분유\n• 수면/잠\n• 기저귀/목욕\n• 열/황달/응급\n• 월령별 준비물\n\n구체적인 질문은 이메일(info@bebe-guide.com)로 보내주세요!'
    };

    // Toggle chat window
    chatToggle.addEventListener('click', () => {
        chatWindow.classList.toggle('open');
        if (chatWindow.classList.contains('open')) {
            chatInput.focus();
        }
    });

    // Close chat window
    chatClose.addEventListener('click', () => {
        chatWindow.classList.remove('open');
    });

    // Send message
    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';

        // 로딩 메시지 표시
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message bot-message loading-message';
        loadingDiv.innerHTML = '<p><i class="fas fa-spinner fa-spin"></i> 답변 생성 중...</p>';
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Generate bot response (async)
        try {
            const response = await generateResponse(message);
            // 로딩 메시지 제거
            loadingDiv.remove();
            addMessage(response, 'bot');
        } catch (error) {
            loadingDiv.remove();
            addMessage('죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'bot');
        }
    }

    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Generate bot response (GPT 또는 기본 응답)
    // Generate bot response (GPT 또는 기본 응답)
async function generateResponse(userMessage) {
  const WORKER_URL = 'https://bebeguide-chatbot.ttlthsusoky.workers.dev'; // 슬래시 없어도 OK

  try {
    const response = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: userMessage,      // 워커는 question을 받음
        history: chatHistory        // 직전 대화 맥락 전달 (최대 8개는 워커에서 자름)
      })
    });

    if (!response.ok) throw new Error('upstream error');
    const data = await response.json();

    if (data && data.answer) {
      // 히스토리 갱신 (다음 질문에 문맥 전달)
      chatHistory.push({ role: 'user', content: userMessage });
      chatHistory.push({ role: 'assistant', content: data.answer });
      return data.answer;
    }
  } catch (err) {
    console.error('GPT 호출 실패:', err);
  }

  // GPT 실패 시 키워드 기반 기본 응답
  const lowerMessage = userMessage.toLowerCase();
  for (const keyword in autoResponses) {
    if (lowerMessage.includes(keyword)) return autoResponses[keyword];
  }
  return autoResponses.default;
}

    // Send button click
    chatSend.addEventListener('click', sendMessage);

    // Enter key press
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Close chat when clicking outside
    document.addEventListener('click', (e) => {
        if (!chatToggle.contains(e.target) && !chatWindow.contains(e.target)) {
            chatWindow.classList.remove('open');
        }
    });
})();

// === 임신 준비 체크리스트 표시 기능 === //
(function initPregnancyChecklist() {
  const tabBtns = document.querySelectorAll('.pregnancy-tabs .tab-btn');
  const content = document.getElementById('pregnancyContent');

  if (!tabBtns.length || !content) return;

  // 초기 로드 시 첫 번째 카테고리 표시
  showPregnancyCategory('임신 전 준비');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // 모든 버튼에서 active 제거
      tabBtns.forEach(b => b.classList.remove('active'));
      // 클릭된 버튼에 active 추가
      btn.classList.add('active');

      const category = btn.getAttribute('data-category');
      showPregnancyCategory(category);
    });
  });

  function showPregnancyCategory(category) {
    const items = PREGNANCY_PREP[category] || [];

    let html = items.map((item, index) => `
      <div class="service-card checklist-item">
        <div class="service-icon">
          <i class="fas ${getCategoryIcon(category)}"></i>
          <span class="item-number">${index + 1}</span>
        </div>
        <h3>${item}</h3>
        <p>${getPregnancyItemDesc(item, category)}</p>
      </div>
    `).join('');

    content.innerHTML = html;
  }

  function getCategoryIcon(category) {
    const icons = {
      '임신 전 준비': 'fa-heart-pulse',
      '산모 용품': 'fa-person-dress',
      '아기 용품': 'fa-baby',
      '출산 준비': 'fa-hospital'
    };
    return icons[category] || 'fa-check-circle';
  }

  function getPregnancyItemDesc(item, category) {
    if (item.includes('엽산')) return '임신 준비 3개월 전부터 하루 400-800μg 복용을 권장합니다.';
    if (item.includes('건강검진')) return '임신 전 필수 검진으로 풍진, 간염, 성병 등을 확인합니다.';
    if (item.includes('카시트')) return '신생아 퇴원 시 법적으로 필수입니다. 안전 인증 제품을 선택하세요.';
    if (item.includes('출산 가방')) return '예정일 3-4주 전에 미리 준비해두면 안심입니다.';
    if (item.includes('젖병')) return '신생아는 작은 용량(120ml)의 젖병을 사용합니다.';

    return '건강한 임신과 출산을 위한 필수 준비물입니다.';
  }
})();

// === 예방접종 스케줄 표시 기능 === //
(function initVaccinationSchedule() {
  const scheduleContainer = document.getElementById('vaccinationSchedule');

  if (!scheduleContainer) return;

  // KDCA 기준으로 상세하게 표시
  let html = VACCINATION_SCHEDULE.map((schedule, index) => `
    <div class="vaccination-card" style="animation-delay: ${index * 0.1}s">
      <div class="vaccination-age">
        <i class="fas fa-calendar-days"></i>
        <h3>${schedule.age}</h3>
      </div>
      <div class="vaccination-list">
        ${schedule.vaccines.map(vaccine => `
          <div class="vaccine-item">
            <div class="vaccine-header">
              <i class="fas fa-syringe"></i>
              <strong>${vaccine.name}</strong>
            </div>
            <p class="vaccine-note">${vaccine.note}</p>
          </div>
        `).join('')}
      </div>
      <div class="vaccination-info">
        <small>💡 <strong>접종 시기:</strong> ${getVaccineTiming(schedule.age)}</small>
      </div>
    </div>
  `).join('');

  scheduleContainer.innerHTML = html;

  // 접종 시기 설명 추가 함수
  function getVaccineTiming(age) {
    const timings = {
      "출생 직후": "출산 병원에서 퇴원 전 접종 (생후 24시간 이내 권장)",
      "1개월": "생후 4주 후 (B형간염 1차 후 정확히 4주 간격)",
      "2개월": "생후 8주 (DTaP, IPV 등 다수 접종 시작)",
      "4개월": "생후 16주 (2차 접종, 2개월 접종 후 정확히 8주 간격)",
      "6개월": "생후 24주 (3차 접종, 독감 시즌 전 인플루엔자 포함)",
      "12개월": "돌 이후 (MMR, 수두 등 생백신 접종 가능)"
    };
    return timings[age] || "소아과 의사와 상담하여 접종 일정 조정";
  }
})();

// === 0개월 상세 가이드 확장 기능 === //
// 월령 선택 시 0개월이면 상세 돌봄 가이드도 함께 표시
const originalShowChecklist = document.getElementById('showChecklist');
if (originalShowChecklist) {
  originalShowChecklist.addEventListener('click', function() {
    const ageSelect = document.getElementById('ageSelect');
    const selectedAge = ageSelect ? ageSelect.value : null;

    // 0개월 선택 시 상세 가이드 추가 표시
    if (selectedAge === '0') {
      setTimeout(() => {
        showNewbornCareGuide();
      }, 500);
    }
  });
}

function showNewbornCareGuide() {
  const resultBox = document.getElementById('checklistResult');
  if (!resultBox) return;

  let guideHTML = '<div class="newborn-care-section"><h2 style="margin-top:40px;text-align:center;">👶 신생아(0개월) 상세 돌봄 가이드</h2>';

  for (const category in NEWBORN_CARE) {
    guideHTML += `<div class="care-category"><h3>${category}</h3><div class="services-grid">`;

    NEWBORN_CARE[category].forEach(section => {
      guideHTML += `
        <div class="service-card newborn-care-card">
          <div class="service-icon">
            <i class="fas ${getCareIcon(section.title)}"></i>
          </div>
          <h4>${section.title}</h4>
          <ul class="care-list">
            ${section.items.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
    });

    guideHTML += '</div></div>';
  }

  guideHTML += '</div>';
  resultBox.insertAdjacentHTML('beforeend', guideHTML);
}

function getCareIcon(title) {
  const icons = {
    '모유수유': 'fa-baby',
    '분유수유': 'fa-bottle-baby',
    '기저귀 갈기': 'fa-diaper',
    '목욕': 'fa-bath',
    '수면 패턴': 'fa-moon',
    '환경 관리': 'fa-house',
    '성장 발달': 'fa-chart-line',
    '주의 증상': 'fa-triangle-exclamation'
  };
  return icons[title] || 'fa-info-circle';
}

// === Formspree 이메일 폼 처리 === //
(function initEmailForm() {
  const contactForm = document.getElementById('contactForm');

  if (!contactForm) return;

  contactForm.addEventListener('submit', function(e) {
    e.preventDefault();

    // 제출 버튼 비활성화
    const submitBtn = contactForm.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 전송 중...';

    // Formspree에 제출
    const formData = new FormData(contactForm);

    fetch(contactForm.action, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        // 성공 메시지
        alert('✅ 감사합니다! 맞춤 체크리스트를 이메일로 발송했습니다.\n\n받은편지함을 확인해주세요. (스팸함도 확인해주세요!)');
        contactForm.reset();
      } else {
        throw new Error('전송 실패');
      }
    })
    .catch(error => {
      alert('❌ 전송에 실패했습니다. 잠시 후 다시 시도해주세요.\n\n문제가 계속되면 info@bebe-guide.com으로 직접 문의해주세요.');
      console.error('Form submission error:', error);
    })
    .finally(() => {
      // 버튼 복구
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    });
  });
})();

console.log('🍼 베베가이드 사이트가 성공적으로 로드되었습니다!');