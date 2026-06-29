const appRoot = document.getElementById('app-root');
const dynamicBg = document.getElementById('dynamic-bg');

// ========================================
// CUSTOM CURSOR
// ========================================
const customCursor = document.getElementById('custom-cursor');
let cursorX = 0, cursorY = 0, cursorCurrentX = 0, cursorCurrentY = 0;
const isTouch = window.matchMedia('(pointer: coarse)').matches;

if (!isTouch && customCursor) {
    document.addEventListener('mousemove', (e) => {
        cursorX = e.clientX;
        cursorY = e.clientY;
        if (!customCursor.classList.contains('cursor-active')) {
            customCursor.classList.add('cursor-active');
        }
    });
    document.addEventListener('mouseover', (e) => {
        const t = e.target.closest('a, button, .btn, [data-route], .pyramid-layer, .size-option, .cart-item-remove');
        if (t) customCursor.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', (e) => {
        const t = e.target.closest('a, button, .btn, [data-route], .pyramid-layer, .size-option, .cart-item-remove');
        if (t) customCursor.classList.remove('cursor-hover');
    });
    (function animateCursor() {
        cursorCurrentX += (cursorX - cursorCurrentX) * 0.15;
        cursorCurrentY += (cursorY - cursorCurrentY) * 0.15;
        customCursor.style.left = cursorCurrentX + 'px';
        customCursor.style.top = cursorCurrentY + 'px';
        requestAnimationFrame(animateCursor);
    })();
}

// ========================================
// PARTICLE / MIST EFFECT
// ========================================
const particleCanvas = document.getElementById('particle-canvas');
const pCtx = particleCanvas ? particleCanvas.getContext('2d') : null;
let particles = [];
let currentParticleColor = { r: 20, g: 20, b: 20 };
let targetParticleColor = { r: 20, g: 20, b: 20 };

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function initParticles() {
    if (!particleCanvas || !pCtx) return;
    particleCanvas.width = window.innerWidth;
    particleCanvas.height = window.innerHeight;
    particles = [];
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * particleCanvas.width,
            y: Math.random() * particleCanvas.height,
            radius: Math.random() * 60 + 20,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            opacity: Math.random() * 0.08 + 0.02
        });
    }
}

function animateParticles() {
    if (!pCtx) return;
    pCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    currentParticleColor.r += (targetParticleColor.r - currentParticleColor.r) * 0.02;
    currentParticleColor.g += (targetParticleColor.g - currentParticleColor.g) * 0.02;
    currentParticleColor.b += (targetParticleColor.b - currentParticleColor.b) * 0.02;
    const cr = Math.round(currentParticleColor.r);
    const cg = Math.round(currentParticleColor.g);
    const cb = Math.round(currentParticleColor.b);
    particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -p.radius) p.x = particleCanvas.width + p.radius;
        if (p.x > particleCanvas.width + p.radius) p.x = -p.radius;
        if (p.y < -p.radius) p.y = particleCanvas.height + p.radius;
        if (p.y > particleCanvas.height + p.radius) p.y = -p.radius;
        pCtx.beginPath();
        const grad = pCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, `rgba(${cr},${cg},${cb},${p.opacity})`);
        grad.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        pCtx.fillStyle = grad;
        pCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        pCtx.fill();
    });
    requestAnimationFrame(animateParticles);
}

function setParticleColor(hex) {
    if (!hex) return;
    const cleanHex = hex.replace(/[^#0-9a-fA-F]/g, '').slice(0, 7);
    if (cleanHex.length === 7) targetParticleColor = hexToRgb(cleanHex);
}

window.addEventListener('resize', () => {
    if (particleCanvas) {
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
    }
});
initParticles();
animateParticles();

// ========================================
// 3D TILT EFFECT
// ========================================
function initTiltEffect(selector) {
    document.querySelectorAll(selector).forEach(card => {
        card.classList.add('tilt-card');
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -6;
            const rotateY = ((x - centerX) / centerX) * 6;
            card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) scale(1)';
        });
    });
}

// ========================================
// CART STATE MANAGEMENT
// ========================================
let cart = [];

function addToCart(id, size) {
    const f = fragrances.find(x => x.id === id);
    if (!f) return;
    const existing = cart.find(item => item.id === id && item.size === size);
    if (existing) { existing.qty++; }
    else { cart.push({ id, size, qty: 1 }); }
    updateCartBadge();
    renderCartDrawerContent();
    openCart();
    showToast(`${f.name} (${size}) added to cart`, 'success');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartBadge();
    renderCartDrawerContent();
}

function getCartTotal() {
    return cart.reduce((sum, item) => {
        const f = fragrances.find(x => x.id === item.id);
        return sum + (f ? f.price[item.size] * item.qty : 0);
    }, 0);
}

function getCartCount() {
    return cart.reduce((sum, item) => sum + item.qty, 0);
}

function updateCartBadge() {
    const badge = document.querySelector('.cart-badge');
    if (!badge) return;
    const count = getCartCount();
    badge.textContent = count;
    badge.classList.toggle('visible', count > 0);
}

// ========================================
// CART DRAWER
// ========================================
function createCartDrawer() {
    if (document.getElementById('cart-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'cart-overlay';
    overlay.className = 'cart-overlay';
    overlay.addEventListener('click', closeCart);
    document.body.appendChild(overlay);

    const drawer = document.createElement('div');
    drawer.id = 'cart-drawer';
    drawer.className = 'cart-drawer';
    drawer.innerHTML = `
        <div class="cart-header">
            <h3>Your Cart</h3>
            <button class="cart-close-btn" onclick="closeCart()">
                <i data-lucide="x" style="width:20px;height:20px;"></i>
            </button>
        </div>
        <div class="cart-items" id="cart-items-list"></div>
        <div class="cart-footer" id="cart-footer"></div>
    `;
    document.body.appendChild(drawer);
    if (window.lucide) window.lucide.createIcons();
    renderCartDrawerContent();
}

function renderCartDrawerContent() {
    const list = document.getElementById('cart-items-list');
    const footer = document.getElementById('cart-footer');
    if (!list || !footer) return;

    if (cart.length === 0) {
        list.innerHTML = `<div class="cart-empty"><div class="cart-empty-icon"><i data-lucide="shopping-bag" style="width:48px;height:48px;"></i></div><p>Your cart is empty</p></div>`;
        footer.innerHTML = `<button class="cart-checkout-btn" disabled>Checkout</button>`;
    } else {
        list.innerHTML = cart.map((item, i) => {
            const f = fragrances.find(x => x.id === item.id);
            if (!f) return '';
            return `<div class="cart-item">
                <img src="${f.image}" alt="${f.name}" class="cart-item-img">
                <div class="cart-item-info">
                    <div class="cart-item-name">${f.name}</div>
                    <div class="cart-item-size">${item.size} · Qty ${item.qty}</div>
                </div>
                <div class="cart-item-price">$${f.price[item.size] * item.qty}</div>
                <button class="cart-item-remove" onclick="removeFromCart(${i})">
                    <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                </button>
            </div>`;
        }).join('');
        footer.innerHTML = `
            <div class="cart-total-row">
                <span class="cart-total-label">Total</span>
                <span class="cart-total-value">$${getCartTotal()}</span>
            </div>
            <button class="cart-checkout-btn" onclick="mockCheckout()">Checkout</button>
        `;
    }
    if (window.lucide) window.lucide.createIcons();
}

function openCart() {
    const d = document.getElementById('cart-drawer');
    const o = document.getElementById('cart-overlay');
    if (d) d.classList.add('open');
    if (o) o.classList.add('open');
}
function closeCart() {
    const d = document.getElementById('cart-drawer');
    const o = document.getElementById('cart-overlay');
    if (d) d.classList.remove('open');
    if (o) o.classList.remove('open');
}
function mockCheckout() {
    if (cart.length === 0) return;
    const total = getCartTotal();
    cart = [];
    updateCartBadge();
    renderCartDrawerContent();
    closeCart();
    showToast(`Order confirmed! Total: $${total}. Thank you!`, 'success');
}

// ========================================
// TOAST NOTIFICATIONS
// ========================================
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">✓</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// ========================================
// SCENT PYRAMID BUILDER
// ========================================
function buildScentPyramid(f) {
    const layers = [
        { label: 'TOP', notes: f.topNotes },
        { label: 'MIDDLE', notes: f.middleNotes },
        { label: 'BASE', notes: f.baseNotes }
    ];
    const opacities = [0.35, 0.55, 0.75];
    return `<div class="scent-pyramid">${layers.map((l, i) =>
        `<div class="pyramid-layer" style="background: ${f.colorTheme}${Math.round(opacities[i]*255).toString(16).padStart(2,'0')}; box-shadow: 0 0 30px ${f.colorTheme}20;">
            <span class="pyramid-label">${l.label}</span>
            <span class="pyramid-notes">${l.notes.join(' · ')}</span>
        </div>`
    ).join('')}</div>`;
}

// ========================================
// RADAR CHART BUILDER
// ========================================
function buildRadarChart(f) {
    const size = 200, cx = size/2, cy = size/2, r = 75;
    const metrics = Object.entries(f.performance);
    const angleStep = (Math.PI * 2) / metrics.length;
    const startAngle = -Math.PI / 2;

    // Grid rings
    let gridLines = '';
    [0.33, 0.66, 1].forEach(scale => {
        const pts = metrics.map((_, i) => {
            const a = startAngle + i * angleStep;
            return `${cx + r * scale * Math.cos(a)},${cy + r * scale * Math.sin(a)}`;
        }).join(' ');
        gridLines += `<polygon points="${pts}" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>`;
    });
    // Axis lines
    let axes = '';
    metrics.forEach((_, i) => {
        const a = startAngle + i * angleStep;
        axes += `<line x1="${cx}" y1="${cy}" x2="${cx + r * Math.cos(a)}" y2="${cy + r * Math.sin(a)}" stroke="rgba(255,255,255,0.08)" stroke-width="1"/>`;
    });
    // Data polygon
    const dataPoints = metrics.map(([, val], i) => {
        const a = startAngle + i * angleStep;
        const v = val / 100;
        return `${cx + r * v * Math.cos(a)},${cy + r * v * Math.sin(a)}`;
    }).join(' ');
    // Labels
    let labels = '';
    metrics.forEach(([key, val], i) => {
        const a = startAngle + i * angleStep;
        const lx = cx + (r + 28) * Math.cos(a);
        const ly = cy + (r + 28) * Math.sin(a);
        const vx = cx + (r * val/100 + 14) * Math.cos(a);
        const vy = cy + (r * val/100 + 14) * Math.sin(a);
        labels += `<text x="${lx}" y="${ly}" class="radar-label" text-anchor="middle" dominant-baseline="middle">${key}</text>`;
        labels += `<text x="${vx}" y="${vy}" class="radar-value" text-anchor="middle" dominant-baseline="middle">${val}%</text>`;
    });

    return `<div class="radar-chart-container">
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            ${gridLines}${axes}
            <polygon points="${dataPoints}" fill="${f.colorTheme}30" stroke="${f.colorTheme}" stroke-width="2" class="radar-animate" style="transform-origin:${cx}px ${cy}px;"/>
            ${labels}
        </svg>
    </div>`;
}

// Routing mechanism
function navigate(route, params = {}) {
    window.history.pushState({ route, params }, '', `#${route}`);
    renderRoute(route, params);
}

let transitionTimeout;

function renderRoute(route, params) {
    clearTimeout(transitionTimeout);
    
    // Animate current page out
    appRoot.classList.add('page-exit');
    
    transitionTimeout = setTimeout(() => {
        appRoot.innerHTML = ''; // Clear current view
        window.scrollTo(0, 0);

        // Default background
        dynamicBg.style.setProperty('--glow-color', 'rgba(20,20,20,1)');
        dynamicBg.style.opacity = '1';
        document.body.style.overflow = '';
        setParticleColor('#141414');

        const footer = document.getElementById('main-footer');
        if (footer) {
            footer.style.display = (route === 'catalogue') ? 'none' : 'block';
        }

        switch (route) {
            case 'home':
                renderHome();
                break;
            case 'catalogue':
                renderCatalogue();
                break;
            case 'product':
                renderProduct(params.id);
                break;
            case 'about':
                renderAbout();
                break;
            case 'contact':
                renderContact();
                break;
            default:
                renderHome();
        }
        
        // Re-initialize icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Animate new page in
        setTimeout(() => {
            appRoot.classList.remove('page-exit');
            document.querySelectorAll('.fade-up').forEach(el => el.classList.add('visible'));
        }, 50);

    }, 300); // Wait for CSS fade out
}

// Global Event Listeners for Navigation
document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-route]');
    if (link) {
        e.preventDefault();
        const route = link.getAttribute('data-route');
        const id = link.getAttribute('data-id');
        navigate(route, { id });
        
        // Auto-close mobile menu if open
        const navMenu = document.getElementById('nav-links-menu');
        if (navMenu && navMenu.classList.contains('mobile-active')) {
            navMenu.classList.remove('mobile-active');
        }
    }
});

const mobileMenuBtn = document.getElementById('mobile-menu-btn');
if (mobileMenuBtn) {
    mobileMenuBtn.addEventListener('click', () => {
        const navMenu = document.getElementById('nav-links-menu');
        if (navMenu) navMenu.classList.toggle('mobile-active');
    });
}

window.addEventListener('popstate', (e) => {
    if (e.state) {
        renderRoute(e.state.route, e.state.params);
    } else {
        renderHome();
    }
});

// --- Page Renderers ---

function renderHome() {
    const featured = fragrances[0];
    dynamicBg.style.setProperty('--glow-color', `${featured.colorTheme}40`);
    setParticleColor(featured.colorTheme);

    appRoot.innerHTML = `
        <section class="hero-section" style="min-height: 100vh; display: flex; align-items: center;">
            <div class="container grid-12" style="align-items: center;">
                <div class="hero-content fade-up" style="grid-column: span 5;">
                    <h2 class="text-xl text-uppercase text-muted" style="margin-bottom: 1rem;">Featured</h2>
                    <h1 class="text-huge serif" style="margin-bottom: 2rem;">${featured.name}</h1>
                    <p class="text-lg" style="margin-bottom: 2rem; color: #ddd;">${featured.tagline}</p>
                    <button class="btn" data-route="product" data-id="${featured.id}">Discover</button>
                </div>
                <div class="hero-image fade-up" style="grid-column: span 7; display: flex; justify-content: center; position: relative;">
                    <div style="position: absolute; width: 400px; height: 400px; border-radius: 50%; background: ${featured.colorTheme}; filter: blur(100px); opacity: 0.2; z-index: -1;"></div>
                    <img id="hero-parallax-img" class="parallax-img" src="${featured.image}" alt="${featured.name}" style="max-width: 100%; height: auto; max-height: 70vh; object-fit: contain; border-radius: 20px; box-shadow: 0 30px 60px rgba(0,0,0,0.5);">
                </div>
            </div>
        </section>
        <section class="collection-section" style="padding-top: 0;">
            <div class="container text-center fade-up">
                <h2 class="serif text-uppercase" style="font-size: 2.5rem; margin-bottom: 1rem;">The Collection</h2>
                <p class="text-muted" style="margin-bottom: 4rem;">Fragrance catalogue for modern scent stories.</p>
                <div class="grid-12" style="gap: 2rem;">
                    ${fragrances.slice(1, 4).map(f => `
                        <div class="glass-panel text-left fade-up home-card" style="grid-column: span 4; cursor: pointer;" data-route="product" data-id="${f.id}" data-color="${f.colorTheme}">
                            <img src="${f.image}" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 1.5rem;" alt="${f.name}">
                            <div class="text-xs text-uppercase" style="margin-bottom: 1rem;"><span style="background: ${f.colorTheme}; color: #fff; padding: 4px 10px; border-radius: 12px; display: inline-block; text-shadow: 0 1px 3px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2);">${f.family}</span></div>
                            <h3 class="serif text-lg" style="margin-bottom: 0.5rem; color: #fff;">${f.name}</h3>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 4rem;">
                    <button class="btn" data-route="catalogue">View Full Catalogue</button>
                </div>
            </div>
        </section>
    `;

    // 3D tilt on collection cards
    setTimeout(() => initTiltEffect('.home-card'), 100);

    // Hero parallax on window scroll
    const heroImg = document.getElementById('hero-parallax-img');
    if (heroImg) {
        const onScroll = () => { heroImg.style.transform = `translateY(${window.scrollY * 0.12}px)`; };
        window.addEventListener('scroll', onScroll);
        appRoot._cleanupParallax = () => window.removeEventListener('scroll', onScroll);
    }

    // Card hover changes bg color
    document.querySelectorAll('.home-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            const c = card.getAttribute('data-color');
            dynamicBg.style.setProperty('--glow-color', c + '40');
            setParticleColor(c);
        });
        card.addEventListener('mouseleave', () => {
            dynamicBg.style.setProperty('--glow-color', featured.colorTheme + '40');
            setParticleColor(featured.colorTheme);
        });
    });
}

function renderCatalogue() {
    appRoot.innerHTML = `
        <div class="snap-container" id="catalogue-scroller">
            ${fragrances.map((f) => `
                <section class="snap-section perfume-section" data-color="${f.colorTheme}" id="fragrance-${f.id}">
                    <div class="container grid-12" style="align-items: center; height: 100%;">
                        <div class="fade-up visible" style="grid-column: span 6; display: flex; justify-content: center; position: relative;">
                            <div style="position: absolute; width: 400px; height: 400px; border-radius: 50%; background: ${f.colorTheme}; filter: blur(100px); opacity: 0.2; z-index: -1;"></div>
                            <img src="${f.image}" style="max-height: 70vh; max-width: 100%; object-fit: contain; border-radius: 20px; box-shadow: 0 30px 60px rgba(0,0,0,0.5);" alt="${f.name}">
                        </div>
                        <div class="fade-up visible text-left" style="grid-column: span 6; padding: 2rem;">
                            <div class="text-xs text-uppercase" style="margin-bottom: 1rem;"><span style="background: ${f.colorTheme}; color: #fff; padding: 4px 12px; border-radius: 12px; display: inline-block; text-shadow: 0 1px 3px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2);">${f.family}</span></div>
                            <h2 class="serif" style="font-size: 3.5rem; margin-bottom: 1rem; line-height: 1.1;">${f.name}</h2>
                            <p class="text-lg text-muted" style="margin-bottom: 2rem;">${f.shortDescription}</p>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 2rem;">
                                ${f.usage.map(u => `<span class="text-xs" style="padding: 0.3rem 0.8rem; border-radius: 20px; background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);">${u}</span>`).join('')}
                            </div>
                            <button class="btn" data-route="product" data-id="${f.id}">View Details</button>
                        </div>
                    </div>
                </section>
            `).join('')}
        </div>
    `;

    document.body.style.overflow = 'hidden';

    const scroller = document.getElementById('catalogue-scroller');
    const sections = scroller.querySelectorAll('.perfume-section');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const color = entry.target.getAttribute('data-color');
                document.getElementById('dynamic-bg').style.setProperty('--glow-color', color + '40');
                setParticleColor(color);
            }
        });
    }, {
        root: scroller,
        threshold: 0.5
    });

    sections.forEach(sec => observer.observe(sec));

    // Lightweight parallax — rAF-throttled, pre-cached offsets
    const sectionData = Array.from(sections).map(sec => ({
        el: sec,
        img: sec.querySelector('img'),
        top: sec.offsetTop
    }));
    let parallaxTicking = false;
    scroller.addEventListener('scroll', () => {
        if (parallaxTicking) return;
        parallaxTicking = true;
        requestAnimationFrame(() => {
            const scrollTop = scroller.scrollTop;
            for (let i = 0; i < sectionData.length; i++) {
                const d = sectionData[i];
                if (d.img) {
                    d.img.style.transform = `translateY(${(d.top - scrollTop) * 0.04}px)`;
                }
            }
            parallaxTicking = false;
        });
    }, { passive: true });
}

function renderProduct(id) {
    const f = fragrances.find(x => x.id === id);
    if (!f) return renderCatalogue();

    dynamicBg.style.setProperty('--glow-color', `${f.colorTheme}50`);
    setParticleColor(f.colorTheme);

    let selectedSize = '100ml';

    appRoot.innerHTML = `
        <section class="product-detail-section" style="padding-top: 150px;">
            <div class="container grid-12" style="gap: 4rem;">
                <div class="fade-up" style="grid-column: span 6; position: relative;">
                    <div style="position: sticky; top: 150px;">
                        <img id="product-detail-img" src="${f.image}" style="width: 100%; border-radius: 20px; box-shadow: 0 40px 80px rgba(0,0,0,0.6);" alt="${f.name}">
                    </div>
                </div>
                
                <div class="fade-up" style="grid-column: span 6; padding-bottom: 4rem;">
                    <div class="text-xs text-uppercase" style="margin-bottom: 1.5rem;"><span style="background: ${f.colorTheme}; color: #fff; padding: 6px 16px; border-radius: 20px; display: inline-block; text-shadow: 0 1px 3px rgba(0,0,0,0.8); border: 1px solid rgba(255,255,255,0.2); letter-spacing: 2px;">${f.family}</span></div>
                    <h1 class="serif" style="font-size: 4rem; line-height: 1; margin-bottom: 1.5rem;">${f.name}</h1>
                    <p class="text-lg text-muted" style="margin-bottom: 3rem;">${f.shortDescription}</p>
                    
                    <div class="glass-panel text-center" style="margin-bottom: 3rem;">
                        <h3 class="text-xs text-uppercase" style="letter-spacing: 3px; margin-bottom: 1.5rem; color: var(--text-muted);">Olfactory Pyramid</h3>
                        ${buildScentPyramid(f)}
                    </div>
                    
                    <div class="glass-panel" style="margin-bottom: 3rem;">
                        <h3 class="text-xs text-uppercase text-center" style="letter-spacing: 3px; margin-bottom: 1rem; color: var(--text-muted);">Performance</h3>
                        ${buildRadarChart(f)}
                    </div>
                    
                    <div class="usage-section" style="margin-bottom: 3rem;">
                         <h3 class="text-sm text-uppercase" style="margin-bottom: 1rem;">Recommended Usage</h3>
                         <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            ${f.usage.map(u => `<span class="glass-panel text-sm" style="padding: 0.5rem 1rem;">${u}</span>`).join('')}
                         </div>
                    </div>

                    <div style="margin-bottom: 1.5rem;">
                        <h3 class="text-sm text-uppercase" style="margin-bottom: 1rem;">Select Size</h3>
                        <div class="size-selector">
                            <button class="size-option" data-size="50ml">50ml — $${f.price['50ml']}</button>
                            <button class="size-option active" data-size="100ml">100ml — $${f.price['100ml']}</button>
                        </div>
                    </div>

                    <div style="display: flex; gap: 1rem;">
                        <button class="btn" id="add-to-cart-btn" style="flex: 1; background: ${f.colorTheme}; color: #fff; border: none; font-weight: 600;">Add to Cart — $${f.price['100ml']}</button>
                        <button class="btn" data-route="catalogue" style="flex: 1;">Back to Catalogue</button>
                    </div>
                </div>
            </div>
        </section>
    `;

    // 3D tilt on product image
    setTimeout(() => initTiltEffect('#product-detail-img'), 100);

    // Size selector logic
    const sizeButtons = document.querySelectorAll('.size-option');
    const cartBtn = document.getElementById('add-to-cart-btn');
    sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            sizeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedSize = btn.getAttribute('data-size');
            cartBtn.textContent = `Add to Cart — $${f.price[selectedSize]}`;
        });
    });
    if (cartBtn) {
        cartBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addToCart(f.id, selectedSize);
        });
    }
}

function renderAbout() {
    appRoot.innerHTML = `
        <section class="about-section" style="padding-top: 150px;">
            <div class="container fade-up text-center">
                <h1 class="serif text-huge" style="margin-bottom: 2rem;">Our Story</h1>
                <p class="text-lg text-muted" style="max-width: 800px; margin: 0 auto 4rem;">
                    Serena Ventus approaches scent as architecture. We construct invisible palaces of memory, identity, and emotion using the finest ingredients from around the world.
                </p>
            </div>
            
            <div class="container grid-12 fade-up" style="gap: 4rem; align-items: center; margin-bottom: 8rem;">
                <div style="grid-column: span 6;">
                    <img src="${fragrances[2].image}" style="width: 100%; border-radius: 20px; filter: grayscale(50%);">
                </div>
                <div style="grid-column: span 6;">
                    <h2 class="serif text-uppercase" style="font-size: 2.5rem; margin-bottom: 2rem;">Philosophy</h2>
                    <p class="text-muted" style="margin-bottom: 1.5rem; font-size: 1.1rem;">A fragrance is not just a smell; it is a signature. It is the aura you leave behind when you exit a room. Our philosophy is rooted in creating scents that speak before you do.</p>
                    <p class="text-muted" style="font-size: 1.1rem;">We blend modern synthetic mastery with ancient natural extraction techniques to create unparalleled olfactory experiences.</p>
                </div>
            </div>
        </section>
    `;
}

function renderContact() {
    appRoot.innerHTML = `
        <section class="contact-section" style="padding-top: 150px; min-height: 80vh;">
            <div class="container grid-12 fade-up">
                <div style="grid-column: span 5;">
                    <h1 class="serif" style="font-size: 3.5rem; margin-bottom: 1rem;">Get in Touch</h1>
                    <p class="text-muted text-lg" style="margin-bottom: 3rem;">For wholesale inquiries, press, or general questions.</p>
                    
                    <div style="margin-bottom: 2rem;">
                        <h4 class="text-xs text-uppercase text-muted" style="margin-bottom: 0.5rem;">Email</h4>
                        <p class="text-lg">atelier@serenaventus.com</p>
                    </div>
                    <div style="margin-bottom: 2rem;">
                        <h4 class="text-xs text-uppercase text-muted" style="margin-bottom: 0.5rem;">Instagram</h4>
                        <p class="text-lg">@serenaventus</p>
                    </div>
                    <div>
                        <h4 class="text-xs text-uppercase text-muted" style="margin-bottom: 0.5rem;">Business Hours</h4>
                        <p class="text-lg">Mon-Fri, 9am - 6pm EST</p>
                    </div>
                </div>
                <div style="grid-column: span 7;">
                    <form class="glass-panel" style="display: flex; flex-direction: column; gap: 1.5rem;" onsubmit="event.preventDefault(); alert('Inquiry Sent!');">
                        <div style="display: flex; gap: 1.5rem;">
                            <input type="text" placeholder="Name" style="flex: 1; background: transparent; border: none; border-bottom: 1px solid var(--glass-border); padding: 1rem 0; color: white; font-family: var(--font-ui); outline: none;">
                            <input type="email" placeholder="Email" style="flex: 1; background: transparent; border: none; border-bottom: 1px solid var(--glass-border); padding: 1rem 0; color: white; font-family: var(--font-ui); outline: none;">
                        </div>
                        <select style="background: var(--bg-dark); border: none; border-bottom: 1px solid var(--glass-border); padding: 1rem 0; color: white; font-family: var(--font-ui); outline: none;">
                            <option value="wholesale">Wholesale Inquiry</option>
                            <option value="press">Press / PR</option>
                            <option value="general">General Question</option>
                        </select>
                        <textarea placeholder="Your Message" rows="4" style="background: transparent; border: none; border-bottom: 1px solid var(--glass-border); padding: 1rem 0; color: white; font-family: var(--font-ui); outline: none; resize: none;"></textarea>
                        <button type="submit" class="btn" style="align-self: flex-start; margin-top: 1rem;">Send Message</button>
                    </form>
                </div>
            </div>
        </section>
    `;
}

// Inject cart icon into nav
const navLinksMenu = document.getElementById('nav-links-menu');
if (navLinksMenu) {
    const cartIconEl = document.createElement('button');
    cartIconEl.className = 'nav-cart-btn';
    cartIconEl.setAttribute('onclick', 'openCart()');
    cartIconEl.innerHTML = `<i data-lucide="shopping-bag" style="width:20px;height:20px;"></i><span class="cart-badge">0</span>`;
    navLinksMenu.parentElement.appendChild(cartIconEl);
}

// Create cart drawer
createCartDrawer();

// Initial render
renderRoute('home');
