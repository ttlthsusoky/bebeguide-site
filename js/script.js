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

// Contact Form Handling
const contactForm = document.getElementById('contactForm');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const originalText = submitButton.innerHTML;
    
    // Show loading state
    submitButton.classList.add('loading');
    submitButton.disabled = true;
    
    // Get form data
    const formData = new FormData(contactForm);
    const formObject = {};
    formData.forEach((value, key) => {
        formObject[key] = value;
    });
    
    try {
        // Simulate form submission delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Show success message
        showNotification('육아 문의가 성공적으로 전송되었습니다! 전문가가 곧 답변드릴게요 💕', 'success');
        contactForm.reset();
        
    } catch (error) {
        // Show error message
        showNotification('문의 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
    } finally {
        // Reset button state
        submitButton.classList.remove('loading');
        submitButton.disabled = false;
        submitButton.innerHTML = originalText;
    }
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
const CHECKLIST = {
  0: [
    "신생아 기저귀 (소형, 3-5kg용)",
    "속싸개 3-4장 (면 100%)",
    "배냇저고리 5-6벌",
    "체온계 (디지털 or 귀 적외선)",
    "젖병 및 젖꼭지 (신생아용)",
    "젖병 세척솔 및 소독용품",
    "기저귀 발진 크림",
    "신생아용 로션"
  ],
  1: [
    "기저귀 소형 (계속 사용)",
    "수유쿠션",
    "신생아 손톱깎이",
    "배앓이 완화 복대",
    "아기띠 (신생아용)",
    "외출용 담요",
    "젖병 보온포트",
    "침구 세트 (아기침대용)"
  ],
  2: [
    "기저귀 중형으로 교체 고려",
    "목 받침 쿠션",
    "흑백 대비 카드",
    "목욕용 베이비 바스",
    "무향 베이비 샴푸",
    "아기 마사지 오일",
    "외출용 기저귀 가방",
    "카시트 (필수 안전용품)"
  ],
  3: [
    "기저귀 중형 (5-9kg용)",
    "턱받이 여러 개",
    "침대 모빌 (시각 발달)",
    "콧물 흡입기",
    "손싸개/발싸개 (긁힘 방지)",
    "수면 조끼",
    "딸랑이 장난감",
    "예방접종 수첩"
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
    const chatToggle = document.getElementById('chatToggle');
    const chatWindow = document.getElementById('chatWindow');
    const chatClose = document.getElementById('chatClose');
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const chatMessages = document.getElementById('chatMessages');

    if (!chatToggle || !chatWindow) return;

    // Auto responses for basic questions
    const autoResponses = {
        '안녕하세요': '안녕하세요! 베베가이드입니다 😊 무엇을 도와드릴까요?',
        '상담': '전문 육아 상담은 이메일(info@bebe-guide.com)로 문의해주세요. 24시간 내 답변드리겠습니다!',
        '월령': '월령별 체크리스트는 메인 페이지에서 확인하실 수 있어요! 0개월부터 12개월까지 준비되어 있습니다.',
        '이유식': '이유식 관련 정보는 곧 업데이트될 예정입니다. 이메일로 구체적인 질문 보내주시면 전문가가 답변드릴게요!',
        '수유': '수유 가이드는 신생아부터 단계별로 준비 중입니다. 급한 질문은 이메일로 연락주세요.',
        '수면': '수면 교육 정보도 준비 중이에요. 자세한 상담은 이메일로 문의해주시면 개인 맞춤 조언드릴게요.',
        '연락처': '📧 이메일: info@bebe-guide.com (24시간 상담 가능)\n💬 실시간 채팅: 여기 챗봇 (기본 안내)\n🕐 전문가 상담: 이메일 접수 후 24시간 내 답변',
        '가격': '베베가이드의 기본 정보는 무료로 제공됩니다. 개인 맞춤 상담은 이메일로 문의주세요!',
        '제품': '제품 추천 정보는 곧 업데이트될 예정입니다. 가격/리뷰 정보도 함께 제공할 예정이에요.',
        'default': '구체적인 질문은 이메일(info@bebe-guide.com)로 보내주시면 전문가가 24시간 내 답변드리겠습니다! 😊'
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
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';

        // Generate bot response
        setTimeout(() => {
            const response = generateResponse(message);
            addMessage(response, 'bot');
        }, 500);
    }

    // Add message to chat
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${sender}-message`;
        messageDiv.innerHTML = `<p>${text}</p>`;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Generate bot response
    function generateResponse(userMessage) {
        const lowerMessage = userMessage.toLowerCase();
        
        for (const keyword in autoResponses) {
            if (lowerMessage.includes(keyword)) {
                return autoResponses[keyword];
            }
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

console.log('🍼 베베가이드 사이트가 성공적으로 로드되었습니다!');