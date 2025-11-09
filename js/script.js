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
  ],

  // 13~24개월 (유아기 초기)
  13: [
    "걸음마 안정화 신발 (바닥 미끄럼 방지)",
    "언어 발달 그림책 (의성어·의태어 풍부한)",
    "손 씻기 전용 스툴 (세면대 높이 조절)",
    "낮잠 1~2회 전환 준비 (수면 루틴 조정)",
    "안전문/코너보호대 재점검 (활동 범위 확대)",
    "스푼·포크 연습 세트 (자기주도 식사)",
    "실내외 놀이터 안전용품",
    "감정표현 학습 카드"
  ],
  15: [
    "두 발로 걷기 안정화 신발",
    "간단한 퍼즐 (3~5피스)",
    "큰 크레용 (손잡기 쉬운)",
    "물컵 (손잡이 있는 빨대컵)",
    "실외 놀이용 모자/선크림",
    "역할놀이 장난감 (전화기, 인형)",
    "안전한 계단 오르기 연습 매트",
    "치아 관리 습관 (칫솔·치약 업그레이드)"
  ],
  18: [
    "🎯 두 단어 조합 말하기 시작 (언어 자극 장난감)",
    "🛏️ 낮잠 1회 전환 준비 (취침 루틴 고정)",
    "🦷 양치질 습관 형성 (불소 함유 치약 확인)",
    "💭 감정 라벨링 놀이 도구 (기쁨·슬픔·화남)",
    "🏃 대근육 발달 장난감 (공놀이, 미끄럼틀)",
    "📚 그림책 (스토리 있는, 15~20권)",
    "💉 예방접종 체크 (독감 등 시즌별)",
    "🍽️ 자기주도 식사 도구 (어린이 식탁 세트)"
  ],
  24: [
    "🎭 간단한 역할놀이 세트 (소꿉장난, 의사놀이)",
    "🤸 실내 점프/균형 놀이 기구 (안전 매트)",
    "🍴 자기주도 먹기 100% 전환 (질식 주의 교육)",
    "🚽 배변 훈련 준비 (기저귀 변화 관찰)",
    "🧩 퍼즐 (10~20피스로 난이도 상승)",
    "👶 어린이집 준비물 (필요 시)",
    "🎨 미술 놀이 재료 (물감, 찰흙)",
    "📖 생활 습관 그림책 (인사, 정리정돈)"
  ],
  30: [
    "❓ '왜?' 질문에 짧고 정확히 답변 (호기심 충족)",
    "🎨 색/모양/숫자 놀이 교구 (과도한 조기학습 금지)",
    "💤 낮잠 단계적 축소 관찰 (아이별 차이)",
    "😷 마스크/손씻기/기침예절 습관 형성",
    "🦷 정기 치과 검진 권장 시기",
    "📚 스토리북 30권 이상 (읽기 전 단계)",
    "🏃 대근육 놀이 (세발자전거, 킥보드)",
    "🎼 음악/리듬 놀이 악기"
  ],
  36: [
    "🎒 유치원 준비물 체크리스트",
    "🎲 규칙/순서 놀이 (보드게임 입문)",
    "🚸 안전교육 (낯선 사람 대처, 차도 주의)",
    "🚨 응급 신호 교육 (아프면 말하기/도움청하기)",
    "📋 정기 건강검진·예방접종 최신화",
    "✂️ 가위질/풀칠 미술 활동 (소근육)",
    "🧒 친구 관계 형성 놀이",
    "📖 한글/숫자 자연스러운 노출 (강요 금지)"
  ]
};

(function initAgeChecklist(){
  const ageSel = document.getElementById('ageSelect');
  const btnShow = document.getElementById('showChecklist');
  const btnPdf  = document.getElementById('getPdf');
  const box     = document.getElementById('checklistResult');
  if(!ageSel || !btnShow || !box) return;

  // 로컬스토리지에서 체크 상태 불러오기
  function loadChecklistState(month) {
    const saved = localStorage.getItem(`checklist_${month}`);
    return saved ? JSON.parse(saved) : {};
  }

  // 로컬스토리지에 체크 상태 저장하기
  function saveChecklistState(month, itemIndex, checked) {
    const state = loadChecklistState(month);
    state[itemIndex] = checked;
    localStorage.setItem(`checklist_${month}`, JSON.stringify(state));
  }

  btnShow.addEventListener('click', ()=>{
    const m = ageSel.value;
    const list = CHECKLIST[m] || CHECKLIST[0];
    const monthText = m == 0 ? '신생아' : `${m}개월`;
    const savedState = loadChecklistState(m);

    // 월령별 테마 클래스 결정
    const monthNum = parseInt(m);
    let themeClass = '';
    if (monthNum <= 6) {
      themeClass = 'age-theme-0-6';
    } else if (monthNum <= 12) {
      themeClass = 'age-theme-7-12';
    } else if (monthNum <= 24) {
      themeClass = 'age-theme-13-24';
    } else if (monthNum <= 36) {
      themeClass = 'age-theme-25-36';
    } else {
      themeClass = 'age-theme-0-6'; // 기본값
    }

    // Info bar 추가
    let infoBar = `
      <div class="checklist-info-bar" style="background:#e3f2fd; padding:12px; border-radius:8px; margin-bottom:20px; font-size:0.9rem; color:#1976d2;">
        <i class="fas fa-info-circle"></i> 이 체크리스트는 브라우저에 저장됩니다. 준비 완료한 항목에 체크하세요!
      </div>
    `;

    // 진행률 계산
    const progress = calculateProgress(m);

    // Add header with month info and progress bar
    let headerHTML = `
      <div class="checklist-header ${themeClass}">
        <h2>${monthText} 필수 준비물 체크리스트</h2>
        <p>${monthText} 아기에게 꼭 필요한 용품들을 정리했습니다. 안전하고 검증된 제품을 선택하세요.</p>

        <div class="progress-container">
          <div class="progress-header">
            <span class="progress-label">준비 진행률</span>
            <span class="progress-stats">${progress.checkedCount}/${progress.totalItems} 완료</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress.percentage}%">
              <span class="progress-text">${progress.percentage}%</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Create checklist items with checkbox
    let itemsHTML = list.map((item, index) => {
      const isChecked = savedState[index] || false;
      const doneClass = isChecked ? 'done' : '';

      // 제휴 링크 생성 (실제 쿠팡 파트너스 링크로 교체 필요)
      const searchKeyword = encodeURIComponent(item.replace(/\([^)]*\)/g, '').trim());
      const affiliateLink = `https://www.coupang.com/np/search?q=${searchKeyword}&subid=AF8186321`;

      return `
      <div class="service-card checklist-item ${themeClass} ${doneClass}" data-index="${index}">
        <div class="checkbox-wrapper">
          <input type="checkbox" id="check-${m}-${index}" ${isChecked ? 'checked' : ''}
                 onchange="window.toggleChecklistItem(${m}, ${index}, this.checked)">
          <label for="check-${m}-${index}"></label>
        </div>
        <div class="service-icon">
          <i class="fas ${getCategoryIcon(item)}"></i>
          <span class="item-number">${index + 1}</span>
        </div>
        <h3>${item}</h3>
        <p>${getItemDescription(item, m)}</p>

        <div class="affiliate-box">
          <span class="affiliate-headline">[광고]</span>
          <span class="affiliate-desc">
            이 추천은 쿠팡 파트너스 활동의 일환으로, 해당 링크를 통해 구매 시
            판매자로부터 일정액의 수수료를 제공받습니다.
          </span>

          <div class="affiliate-buttons">
            <a class="affiliate-link-btn"
               href="${affiliateLink}"
               target="_blank"
               rel="noopener noreferrer"
               data-product="${item.replace(/"/g, '&quot;')}"
               data-month="${m}"
               onclick="trackAffiliateClick(event)">
              <i class="fas fa-shopping-cart"></i> 쿠팡에서 보기
            </a>
          </div>

          <div class="affiliate-price-note price-info">
            <strong>💰 최저가 확인 중...</strong><br>
            (가격/재고/배송비 등은 실시간으로 변동될 수 있어요)
          </div>
        </div>
      </div>
    `}).join('');

    box.innerHTML = infoBar + headerHTML + itemsHTML;
    box.scrollIntoView({behavior:'smooth', block:'start'});

    // 예방접종 스케줄도 해당 월령으로 업데이트 (하이라이트)
    renderVaccinationSchedule(m);
  });

  // 진행률 계산 함수
  function calculateProgress(month) {
    const list = CHECKLIST[month] || CHECKLIST[0];
    const totalItems = list.length;
    const savedState = loadChecklistState(month);

    let checkedCount = 0;
    for (let i = 0; i < totalItems; i++) {
      if (savedState[i]) checkedCount++;
    }

    const percentage = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;
    return { checkedCount, totalItems, percentage };
  }

  // 진행률 UI 업데이트 함수
  function updateProgressUI(month) {
    const progress = calculateProgress(month);
    const progressBar = document.querySelector('.progress-fill');
    const progressText = document.querySelector('.progress-text');
    const progressStats = document.querySelector('.progress-stats');

    if (progressBar) {
      progressBar.style.width = `${progress.percentage}%`;
    }

    if (progressText) {
      progressText.textContent = `${progress.percentage}%`;
    }

    if (progressStats) {
      progressStats.textContent = `${progress.checkedCount}/${progress.totalItems} 완료`;
    }

    // 100% 달성 시 축하 메시지 표시
    if (progress.percentage === 100) {
      showCongratulationsModal(month);
    }
  }

  // 축하 메시지 모달 표시 함수
  function showCongratulationsModal(month) {
    const monthText = month == 0 ? '신생아' : `${month}개월`;

    // 기존 모달이 있으면 제거
    const existingModal = document.querySelector('.congratulations-modal');
    if (existingModal) {
      existingModal.remove();
    }

    // 모달 생성
    const modal = document.createElement('div');
    modal.className = 'congratulations-modal';
    modal.innerHTML = `
      <div class="congratulations-content">
        <div class="confetti-container">
          ${generateConfetti()}
        </div>
        <div class="congratulations-icon">🎉</div>
        <h2>축하합니다! 🎊</h2>
        <p class="congrats-message">
          <strong>${monthText} 준비물을 모두 체크하셨습니다!</strong>
        </p>
        <p class="congrats-sub-message">
          아기를 맞이할 준비가 완벽하게 되었네요.<br>
          사랑스러운 육아의 시작을 응원합니다! 💕
        </p>
        <button class="congrats-close-btn" onclick="closeCongratulationsModal()">
          <i class="fas fa-check"></i> 확인
        </button>
      </div>
    `;

    document.body.appendChild(modal);

    // 애니메이션 시작
    setTimeout(() => {
      modal.classList.add('show');
    }, 100);
  }

  // Confetti 생성 함수
  function generateConfetti() {
    let confetti = '';
    const colors = ['#ff9aa2', '#ffb7b2', '#ffdac1', '#e2f0cb', '#b5ead7', '#c7ceea'];
    const emojis = ['🎈', '🎉', '🎊', '🌟', '✨', '💕', '🍼', '👶', '❤️'];

    for (let i = 0; i < 50; i++) {
      const isEmoji = Math.random() > 0.7;
      const content = isEmoji ? emojis[Math.floor(Math.random() * emojis.length)] : '';
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const animationDelay = Math.random() * 3;
      const animationDuration = 3 + Math.random() * 2;

      confetti += `<div class="confetti ${isEmoji ? 'confetti-emoji' : ''}"
        style="left: ${left}%;
               background-color: ${color};
               animation-delay: ${animationDelay}s;
               animation-duration: ${animationDuration}s;">
        ${content}
      </div>`;
    }
    return confetti;
  }

  // 모달 닫기 함수 (전역)
  window.closeCongratulationsModal = function() {
    const modal = document.querySelector('.congratulations-modal');
    if (modal) {
      modal.classList.remove('show');
      setTimeout(() => {
        modal.remove();
      }, 300);
    }
  };

  // 전역으로 체크 토글 함수 노출
  window.toggleChecklistItem = function(month, itemIndex, checked) {
    saveChecklistState(month, itemIndex, checked);

    // UI 업데이트
    const item = document.querySelector(`.checklist-item[data-index="${itemIndex}"]`);
    if (item) {
      if (checked) {
        item.classList.add('done');
      } else {
        item.classList.remove('done');
      }
    }

    // 진행률 업데이트
    updateProgressUI(month);
  };

  // Helper function to determine icon based on item category
  function getCategoryIcon(item) {
    const itemLower = item.toLowerCase();

    // 수유/먹기 관련
    if (itemLower.includes('젖병') || itemLower.includes('수유') || itemLower.includes('분유') ||
        itemLower.includes('이유식') || itemLower.includes('턱받이') || itemLower.includes('식탁') ||
        itemLower.includes('먹') || itemLower.includes('🍼') || itemLower.includes('🍽️')) {
      return 'fa-bottle-baby';
    }

    // 수면 관련
    if (itemLower.includes('침대') || itemLower.includes('수면') || itemLower.includes('침구') ||
        itemLower.includes('속싸개') || itemLower.includes('담요') || itemLower.includes('낮잠') ||
        itemLower.includes('💤') || itemLower.includes('🛏️')) {
      return 'fa-moon';
    }

    // 건강/의료 관련
    if (itemLower.includes('체온계') || itemLower.includes('예방접종') || itemLower.includes('건강') ||
        itemLower.includes('병원') || itemLower.includes('약') || itemLower.includes('크림') ||
        itemLower.includes('💉') || itemLower.includes('🌡️') || itemLower.includes('❤️')) {
      return 'fa-heart-pulse';
    }

    // 놀이/발달 관련
    if (itemLower.includes('장난감') || itemLower.includes('놀이') || itemLower.includes('그림책') ||
        itemLower.includes('도서') || itemLower.includes('발달') || itemLower.includes('퍼즐') ||
        itemLower.includes('블록') || itemLower.includes('🧸') || itemLower.includes('🎨') ||
        itemLower.includes('📚') || itemLower.includes('🎭')) {
      return 'fa-puzzle-piece';
    }

    // 안전 관련
    if (itemLower.includes('안전') || itemLower.includes('카시트') || itemLower.includes('보호대') ||
        itemLower.includes('잠금') || itemLower.includes('가드') || itemLower.includes('🚗') ||
        itemLower.includes('🚸')) {
      return 'fa-shield-halved';
    }

    // 위생/목욕 관련
    if (itemLower.includes('기저귀') || itemLower.includes('목욕') || itemLower.includes('욕조') ||
        itemLower.includes('로션') || itemLower.includes('샴푸') || itemLower.includes('물티슈') ||
        itemLower.includes('🛁')) {
      return 'fa-bath';
    }

    // 치아 관리
    if (itemLower.includes('치아') || itemLower.includes('칫솔') || itemLower.includes('치약') ||
        itemLower.includes('치과') || itemLower.includes('🦷')) {
      return 'fa-tooth';
    }

    // 의류/신발
    if (itemLower.includes('옷') || itemLower.includes('저고리') || itemLower.includes('신발') ||
        itemLower.includes('양말') || itemLower.includes('모자') || itemLower.includes('👕')) {
      return 'fa-shirt';
    }

    // 이동/외출
    if (itemLower.includes('유모차') || itemLower.includes('아기띠') || itemLower.includes('외출') ||
        itemLower.includes('걸음마') || itemLower.includes('🏃')) {
      return 'fa-baby-carriage';
    }

    // 학습/교육
    if (itemLower.includes('언어') || itemLower.includes('학습') || itemLower.includes('교육') ||
        itemLower.includes('유치원') || itemLower.includes('어린이집') || itemLower.includes('🎒')) {
      return 'fa-graduation-cap';
    }

    // 기본 아이콘
    return 'fa-baby';
  }

  // Helper function to provide context for items
  function getItemDescription(item, month) {
    const monthNum = parseInt(month);

    // 월령별 기본 설명
    let baseDesc = '';
    if (monthNum <= 6) {
      baseDesc = '초기 안전/수유/수면 루틴을 정비하세요.';
    } else if (monthNum <= 12) {
      baseDesc = '이유식·낮잠 전환·예방접종 일정에 유의하세요.';
    } else if (monthNum <= 24) {
      baseDesc = '언어·사회성 발달을 돕는 놀이를 권장합니다.';
    } else if (monthNum <= 36) {
      baseDesc = '규칙/순서 놀이와 안전교육을 병행하세요.';
    } else {
      baseDesc = '발달 수준에 맞춘 놀이와 안전 환경을 유지하세요.';
    }

    // 아이템별 상세 설명
    if (item.includes('기저귀')) return '아기 체중에 맞는 사이즈 선택이 중요합니다. 새는 것을 방지하고 편안함을 위해 정기적으로 교체하세요.';
    if (item.includes('체온계')) return '발열 체크용 필수품입니다. 디지털 체온계나 귀 적외선 체온계 모두 괜찮습니다.';
    if (item.includes('카시트')) return '법적 의무사항이며 생명과 직결된 안전용품입니다. 반드시 신품 구매를 권장합니다.';
    if (item.includes('이유식')) return '아기의 첫 고형식 도입 시기입니다. 알레르기 반응을 주의 깊게 관찰하세요.';
    if (item.includes('안전')) return '아기가 활동 반경이 넓어지면서 꼭 필요한 안전용품입니다.';
    if (item.includes('장난감') || item.includes('놀이')) return '월령에 맞는 발달 자극용 장난감입니다. 안전 인증 제품을 선택하세요.';
    if (item.includes('걸음마') || item.includes('신발')) return '아기의 대근육 발달에 도움이 되지만 과도한 사용은 피하세요.';
    if (item.includes('치아') || item.includes('칫솔') || item.includes('치과')) return '유치 관리의 시작입니다. 정기 검진과 올바른 양치 습관이 중요합니다.';
    if (item.includes('그림책') || item.includes('도서')) return '언어 발달과 정서 안정에 도움이 됩니다. 매일 일정 시간 함께 읽어주세요.';
    if (item.includes('유치원') || item.includes('어린이집')) return '사회성 발달의 중요한 시기입니다. 아이의 준비 상태를 확인하세요.';
    if (item.includes('퍼즐') || item.includes('블록')) return '소근육과 문제해결 능력 발달에 도움이 됩니다. 월령에 맞는 난이도를 선택하세요.';

    return baseDesc + ' 제품 구매 전 안전 인증을 확인하세요.';
  }

  // PDF 버튼: contact 섹션으로 스크롤 + prefill
  btnPdf?.addEventListener('click', ()=>{
    const selectedMonth = ageSel.value;

    // 스크롤 이동
    const contactSection = document.getElementById('contact');
    if (contactSection) {
      contactSection.scrollIntoView({behavior: 'smooth', block: 'start'});
    }

    // 월령 select 세팅
    const babyAgeSelect = document.querySelector('select[name="baby_age"]');
    if (babyAgeSelect) {
      setTimeout(() => {
        babyAgeSelect.value = selectedMonth;
        babyAgeSelect.dispatchEvent(new Event('change'));
      }, 300);
    }

    // hidden 필드 자동 채움
    const reqTypeField = document.getElementById('hidden_request_type');
    const monthField   = document.getElementById('hidden_requested_month');
    if (reqTypeField) reqTypeField.value = 'PDF_CHECKLIST';
    if (monthField)   monthField.value   = selectedMonth;

    // 알림
    showNotification("체크리스트 링크를 이메일로 보내드립니다. 이메일 주소를 입력해 주세요 💌", "success");
  });
})();

// === 제휴마케팅 링크 관리 === //
function trackAffiliateClick(e) {
  try {
    const el = e.currentTarget;
    const product = el.getAttribute('data-product') || 'unknown';
    const month   = el.getAttribute('data-month') || 'unknown';

    // GA 이벤트 전송
    if (typeof gtag === 'function') {
      gtag('event', 'affiliate_click', {
        event_category: 'commerce',
        event_label: product,
        value: 1,
        baby_month: month
      });
    }

    // 추후(선택): Worker에 로그 쌓고 싶으면 여기서 fetch('/log-click', {...})
    // -> 그건 리마인더 저장과 유사한 방식으로 처리 가능
  } catch (err) {
    // 굳이 사용자에게 오류 표시할 필요는 없음
  }
}

// 자동 가격 정보 업데이트 (API 연동 준비)
async function updatePriceInfo() {
  const priceElements = document.querySelectorAll('.price-info');

  priceElements.forEach(async (element) => {
    try {
      // 현재: placeholder 상태
      element.textContent = '💰 최저가 비교 중...';

      // 향후 API 연결 시 활성화할 코드
      // const itemCard = element.closest('.checklist-item');
      // const itemName = itemCard.querySelector('h3').textContent;
      //
      // // 예시: 쿠팡 파트너스 또는 네이버쇼핑 API
      // const response = await fetch(`/api/price?item=${encodeURIComponent(itemName)}`);
      // const data = await response.json();
      //
      // if (data.success && data.price) {
      //   element.textContent = `💰 최저가: ${data.price.toLocaleString()}원`;
      // } else {
      //   element.textContent = '💰 가격 정보 없음';
      // }
    } catch (error) {
      console.error('가격 정보 업데이트 실패:', error);
      element.textContent = '💰 가격 확인 불가';
    }
  });
}

// 체크리스트 표시 후 가격 정보 업데이트
document.addEventListener('DOMContentLoaded', () => {
  // 페이지 로드 시 가격 정보 업데이트
  setTimeout(updatePriceInfo, 2000);
});


/* ===============================
   베베가이드 미니 챗봇 (토글 + 자동응답)
   =============================== */

const chatWidget    = document.getElementById("chatWidget");
const chatContainer = document.getElementById("chatContainer");
const chatInput     = document.getElementById("chat-input");
const sendBtn       = document.getElementById("send-btn");
const chatToggleBtn = document.getElementById("chatToggleBtn");
const chatCloseBtn  = document.getElementById("chatCloseBtn");

// 1. 자주 묻는 질문에 대한 자동응답 사전
const autoResponses = {
  "0개월": `🍼 <b>0개월 아기 체크리스트</b><br>
- 속싸개 3~4장<br>
- 젖병 2개 이상<br>
- 신생아용 기저귀<br>
- 배냇저고리, 손싸개<br>
- 체온계, 비판텐 크림<br><br>
👉 수유 후 20~30분 세워 안기기<br>
👉 하루 8~10회 기저귀 교체`,

  "1개월": `🌙 <b>1개월 아기 돌봄 가이드</b><br>
- 수유 텀 2~3시간<br>
- 낮엔 밝게, 밤엔 어둡게 (낮밤 구분)<br>
- 트림 후 눕히기<br>
- 수면시간 16~18시간 유지`,

  "예방접종": `💉 <b>예방접종 일정 (생후 기준)</b><br>
- B형간염: 출생, 1개월, 6개월<br>
- BCG(결핵): 생후 4주 이내<br>
- DTaP / IPV / Hib: 2, 4, 6개월<br><br>
👉 꼭 소아과에서 최종 확인하세요.`,

  "분유": `🍼 <b>분유 급여 팁</b><br>
- 1회 60~80ml로 시작<br>
- 2~3시간 간격 유지<br>
- 40~45℃ 온도 유지<br>
- 남은 분유 재사용 ❌`,

  "모유": `🤱 <b>모유 수유 팁</b><br>
- 한쪽 충분히 비우고 반대쪽으로 교체<br>
- 수유 후 트림 필수<br>
- 엄마 자세 편한 게 중요 (수유쿠션 도움)`,

  "체온": `🌡️ <b>체온 관리</b><br>
- 정상: 36.5~37.5℃ 정도<br>
- 37.5℃ 이상: 미열일 수 있음<br>
- 38℃ 이상: 열 가능성 → 병원 상담 권장`,

  "기저귀": `🧷 <b>기저귀 교체</b><br>
- 하루 8~10회 교체가 보통<br>
- 발진 나면 무향 크림<br>
- 피부 숨 쉴 시간 잠깐 주는 것도 도움`
};

// 2. 메시지 DOM에 추가
function addMessage(content, sender = "user") {
  const bubble = document.createElement("div");
  bubble.classList.add("message", sender);
  bubble.innerHTML = content;
  chatContainer.appendChild(bubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;
  return bubble; // 로딩 메시지 제거를 위해 요소 반환
}

// 안전 가드: 응급 상황 감지 및 안전 메시지 반환
function safetyGuardReply(userMessage) {
  const urgentKeywords = [
    '열', '38', '39', '40', '발열', '고열',
    '호흡', '숨', '청색', '파랗', '파래',
    '경련', '숨을 못', '숨을 잘 못', '호흡이',
    '의식', '축 늘어', '반응 없', '청백',
    '토혈', '혈변', '피', '탈수'
  ];

  const lowered = userMessage.toLowerCase();
  const isUrgent = urgentKeywords.some(k => lowered.includes(k));

  if (isUrgent) {
    return `⚠️ <b>응급일 수 있어요</b><br><br>
      생후 3개월 미만 아기의 38도 이상 발열, 호흡 곤란, 경련 등은<br>
      <b>즉시 119 또는 응급실, 소아청소년과 진료를 받으세요.</b><br><br>
      온라인 답변은 의료진의 진단을 대체할 수 없습니다.<br>
      📞 응급: 119 / 소아과 상담 우선`;
  }
  return null;
}

// 3. 어떤 응답을 줄지 결정
function getAutoReply(userMessage) {
  const lower = userMessage.toLowerCase();

  // 1차: 안전 가드 체크
  const safetyMsg = safetyGuardReply(userMessage);
  if (safetyMsg) {
    return safetyMsg;
  }

  // 2차: 일반 응답
  for (const key in autoResponses) {
    if (lower.includes(key)) {
      return autoResponses[key];
    }
  }

  // 3차: 기본 안내
  return "👶 아직 등록되지 않은 질문이에요.<br><br>예시 질문:<br>- 0개월 체크리스트<br>- 예방접종 일정<br>- 분유 얼마나 줘요?<br>- 체온 몇 도가 정상이에요?";
}

// 4. 전송 로직 (AI 챗봇)
async function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;

  // 사용자 메시지 표시
  addMessage(`<b>👩‍🍼</b> ${text}`, "user");
  chatInput.value = "";

  // 1차: 응급 상황 체크 (즉시 응답)
  const safetyMsg = safetyGuardReply(text);
  if (safetyMsg) {
    setTimeout(() => {
      addMessage(`<b>🤖 베베봇:</b><br>${safetyMsg}`, "bot");
    }, 500);
    return;
  }

  // 2차: AI 챗봇 응답 (로딩 표시)
  const loadingMsg = addMessage(`<b>🤖 베베봇:</b><br><span class="typing-indicator">답변 생성 중<span class="dots">...</span></span>`, "bot");

  try {
    // OpenAI API 호출 (Cloudflare Worker 경유)
    const response = await fetch('https://bebeguide-chatbot.ttlthsusoky.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: text })
    });

    if (!response.ok) {
      throw new Error('API 응답 오류');
    }

    const data = await response.json();

    // 로딩 메시지 제거
    loadingMsg.remove();

    if (data.success && data.reply) {
      // AI 응답 표시 (참고사이트 정보 자동 포함됨)
      addMessage(`<b>🤖 베베봇:</b><br>${data.reply}`, "bot");
    } else {
      throw new Error('응답 데이터 없음');
    }

  } catch (error) {
    console.error('챗봇 오류:', error);

    // 로딩 메시지 제거
    loadingMsg.remove();

    // 폴백: 키워드 기반 응답
    const fallbackReply = getAutoReply(text);
    addMessage(`<b>🤖 베베봇:</b><br>${fallbackReply}<br><br><small style="color:#999;">※ AI 서버 연결 중 문제가 발생했습니다. 기본 응답을 제공합니다.</small>`, "bot");
  }
}

// 엔터키, 버튼 둘 다 지원
sendBtn.addEventListener("click", handleSend);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});

// 5. 열기 / 닫기 토글
function openChat() {
  chatWidget.classList.remove("minimized");
  chatInput.focus();

  // 첫 방문 시 웰컴 메시지 표시 (localStorage로 제어)
  const welcomed = localStorage.getItem('bebe_chat_greeted');
  if (!welcomed) {
    setTimeout(() => {
      const welcomeMsg = `
        <b>👋 안녕하세요!</b><br>
        베베가이드 챗봇입니다.<br><br>
        ⚠️ <b><span style="color:#d32f2f;">중요 안내</span></b><br>
        응급 증상(고열, 호흡 곤란 등)은 <b>즉시 119 또는 소아과 진료</b>를 받으세요.<br>
        이 대화는 의료 진단이 아닙니다.<br><br>
        💡 <b>이런 질문을 해보세요:</b><br>
        - "0개월 체크리스트"<br>
        - "예방접종 일정"<br>
        - "분유 얼마나 줘요?"<br>
        - "체온 몇 도가 정상이에요?"<br><br>
        📧 <b>체크리스트를 이메일로 받아보고 싶으신가요?</b><br>
        아래 "문의/구독" 섹션에서 이메일로 링크를 받으실 수 있어요!<br><br>
        궁금한 점이 있으면 언제든 물어보세요! 😊
      `;
      addMessage(welcomeMsg, "bot");
      localStorage.setItem('bebe_chat_greeted', 'true');
    }, 500);
  }
}

function closeChat() {
  chatWidget.classList.add("minimized");
}

if (chatToggleBtn) {
  chatToggleBtn.addEventListener("click", openChat);
}
if (chatCloseBtn) {
  chatCloseBtn.addEventListener("click", closeChat);
}

// 페이지 로드 시에는 닫힌 상태 유지
closeChat();

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
function highlightIfMatch(month, ageText) {
  if (!month && month !== 0) return '';
  const monthNum = parseInt(month);

  // 0개월 = 신생아 = "출생"
  if (monthNum === 0 && ageText.includes("출생")) {
    return 'highlight';
  }

  // 일반 월령 매칭
  if (ageText.includes(`${monthNum}개월`)) {
    return 'highlight';
  }

  return '';
}

function renderVaccinationSchedule(month = null) {
  const wrap = document.getElementById('vaccinationSchedule');
  if (!wrap) return;

  wrap.innerHTML = VACCINATION_SCHEDULE.map(block => {
    const isHighlight = highlightIfMatch(month, block.age);
    const highlightClass = isHighlight ? 'vaccination-row highlight' : 'vaccination-row';

    const items = block.vaccines.map(v => `
      <li>
        <strong>${v.name}</strong>
        <span>${v.note || ''}</span>
      </li>`).join('');

    return `
      <div class="${highlightClass}">
        <div class="vaccine-age">${block.age}${isHighlight ? ' ⭐' : ''}</div>
        <ul class="vaccine-list">${items}</ul>
      </div>`;
  }).join('') + `
    <div class="vaccination-disclaimer">
      ※ 실제 접종 가능 시기(일/주 단위 조정)는 소아과마다 다를 수 있습니다.
      일정 확정 전 반드시 병원에서 확인하세요. (질병관리청 예방접종도우미 기준)
    </div>`;
}

// 페이지 로드 시 초기 렌더링
(function initVaccinationSchedule() {
  renderVaccinationSchedule();
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

document.addEventListener('DOMContentLoaded', () => {
  const contactForm    = document.getElementById('contactForm');
  const submitBtn      = document.getElementById('contactSubmitBtn');
  const statusBox      = document.getElementById('contactStatus');
  const reminderOptIn  = document.getElementById('reminderOptIn');
  const reqTypeField   = document.getElementById('hidden_request_type');
  const monthField     = document.getElementById('hidden_requested_month');

  if (!contactForm) return;

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // 1) baby_age 값을 읽어서 hidden_requested_month에 자동 설정
    const babyAgeField = document.getElementById('baby_age');
    if (babyAgeField && monthField) {
      monthField.value = babyAgeField.value;
    }

    // 2) request_type 결정
    // - 사용자가 리마인더 구독에 체크했다면 "VACCINE_REMINDER"
    // - 아니면 "PDF_CHECKLIST" (기본값)
    if (reqTypeField) {
      if (reminderOptIn && reminderOptIn.checked) {
        reqTypeField.value = 'VACCINE_REMINDER';
      } else {
        reqTypeField.value = 'PDF_CHECKLIST';
      }
    }

    // 3) 버튼 비활성화
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '전송 중...';
    }

    // 4) 상태 초기화
    if (statusBox) {
      statusBox.style.color = '#555';
      statusBox.textContent = '';
    }

    const endpoint = contactForm.action;
    const formData = new FormData(contactForm);

    // 5) 실제 전송 (PDF 생성 없이 웹페이지 링크로 제공)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      let data = {};
      try { data = await res.json(); } catch (_) {}

      if (res.ok && data.ok) {
        if (statusBox) {
          statusBox.style.color = '#10b981';
          statusBox.textContent =
            '요청이 접수되었습니다. 이메일을 확인해 주세요! (응급 증상은 즉시 119 또는 소아청소년과 진료를 받으셔야 합니다.)';
        }

        contactForm.reset();

        if (reqTypeField) reqTypeField.value = '';
        if (monthField)   monthField.value   = '';
        if (reminderOptIn) reminderOptIn.checked = false;

        if (typeof showNotification === 'function') {
          showNotification('요청이 정상적으로 접수되었어요 💌', 'success');
        }
      } else {
        if (statusBox) {
          statusBox.style.color = '#ef4444';
          statusBox.textContent =
            '전송에 실패했습니다. 다시 시도해 주세요. (응급이면 즉시 119 또는 소아청소년과 진료를 받으셔야 합니다.)';
        }

        if (typeof showNotification === 'function') {
          showNotification('전송에 문제가 발생했어요. 다시 시도해주세요.', 'error');
        }
      }
    } catch (err) {
      if (statusBox) {
        statusBox.style.color = '#ef4444';
        statusBox.textContent =
          '네트워크 오류가 발생했습니다. 잠시 후 다시 시도해 주세요. (응급이면 바로 119 또는 응급실로 가셔야 합니다.)';
      }

      if (typeof showNotification === 'function') {
        showNotification('네트워크 오류가 발생했습니다.', 'error');
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = '보내주세요';
      }
    }
  });
});

// === 육아 팁 카드 펼치기 기능 === //
document.addEventListener('DOMContentLoaded', () => {
  const expandableCards = document.querySelectorAll('.service-card.expandable');

  expandableCards.forEach(card => {
    const title = card.querySelector('h3');
    const details = card.querySelector('.service-details');
    const icon = card.querySelector('.expand-icon');

    if (title && details) {
      title.style.cursor = 'pointer';
      title.addEventListener('click', () => {
        const isVisible = details.style.display !== 'none';

        if (isVisible) {
          // 닫기
          details.style.display = 'none';
          if (icon) icon.style.transform = 'rotate(0deg)';
        } else {
          // 열기
          details.style.display = 'block';
          if (icon) icon.style.transform = 'rotate(180deg)';
        }
      });
    }
  });
});

console.log('🍼 베베가이드 사이트가 성공적으로 로드되었습니다!');