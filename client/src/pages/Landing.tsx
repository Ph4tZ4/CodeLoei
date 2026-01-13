import { ChevronRight, UserPlus, Upload, Share2, ArrowUp } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import AuthModal from '../components/AuthModal';
import ContactSection from '../components/ContactSection';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingProps {
    onLogin: (token: string, user: any) => void;
    handleLogin?: (token: string, user: any) => void;
}

// --- COMPONENTS: TECH BACKGROUND ---
const TechBackground = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let particles: Particle[] = [];
        const mouse = { x: -1000, y: -1000 };

        class Particle {
            screenWidth: number;
            screenHeight: number;
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;

            constructor(w: number, h: number) {
                this.screenWidth = w;
                this.screenHeight = h;
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = (Math.random() - 0.5) * 0.3;
                this.size = Math.random() * 1.5 + 0.5;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > this.screenWidth) this.vx *= -1;
                if (this.y < 0 || this.y > this.screenHeight) this.vy *= -1;

                const dx = mouse.x - this.x;
                const dy = mouse.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 120;

                if (distance < maxDistance) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (maxDistance - distance) / maxDistance;
                    this.x -= forceDirectionX * force * 1.5;
                    this.y -= forceDirectionY * force * 1.5;
                }
            }

            draw() {
                if (!ctx) return;
                // Use a dynamic color logic or fixed CSS variable reading?
                // For performance, let's just make them slightly adaptive:
                // Check if we are in light mode by reading a CSS var or body class? 
                // Or simply use a color that works on both (white with opacity). 
                // Since background allows generic 'bg-white/60' equivalent, we can use a CSS variable check.
                // But accessing DOM in draw loop is bad. 
                // Let's stick to "white" particles but with varying opacity, OR 
                // check the computed style of an element ONCE per resize/init.

                const isLight = document.documentElement.classList.contains('light');
                ctx.fillStyle = isLight ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.6)';

                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = (width: number, height: number) => {
            particles = [];
            const particleCount = Math.min((width * height) / 12000, 80);
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle(width, height));
            }
        };

        const resize = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = canvas.getBoundingClientRect();

            // เช็คว่าขนาดเปลี่ยนจริงหรือไม่ เพื่อลดการทำงานซ้ำซ้อน
            if (canvas.width === rect.width * dpr && canvas.height === rect.height * dpr && particles.length > 0) return;

            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);

            // สร้างจุดใหม่ตามขนาดหน้าจอที่เปลี่ยนไป
            initParticles(rect.width, rect.height);

            // Force Draw ทันทีเพื่อลบภาพเก่าที่อาจจะยืดออก
            if (particles.length > 0) {
                ctx.clearRect(0, 0, rect.width, rect.height);
                particles.forEach(p => p.draw());
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            mouse.x = e.clientX - rect.left;
            mouse.y = e.clientY - rect.top;
        };

        const animate = () => {
            if (!ctx) return;
            const rect = canvas.getBoundingClientRect();
            ctx.clearRect(0, 0, rect.width, rect.height);

            particles.forEach((p, index) => {
                p.update();
                p.draw();

                for (let j = index + 1; j < particles.length; j++) {
                    const p2 = particles[j];
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * (1 - dist / 100)})`;
                        ctx.lineWidth = 0.5;
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.stroke();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);

        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none bg-bg-primary transition-colors duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,_var(--color-bg-secondary)_0%,_var(--color-bg-primary)_100%)] opacity-80"></div>
            {/* Grid Pattern using CSS masks or simple borders? Keeping it simple for now, using a subtle border grid or just removing the specific hardcoded hex */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: `linear-gradient(to right, var(--color-text-primary) 1px, transparent 1px), linear-gradient(to bottom, var(--color-text-primary) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px'
                }}>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-60 dark:opacity-100" />
        </div>
    );
};

// --- COMPONENTS: SCROLL REVEAL ---
interface ScrollRevealProps {
    children: React.ReactNode;
    direction?: 'up' | 'down' | 'left' | 'right';
    delay?: number;
    className?: string;
    distance?: number;
}

const ScrollReveal = ({ children, direction = 'up', delay = 0, className = '', distance = 50 }: ScrollRevealProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    const getTransformStyle = () => {
        if (isVisible) return 'translate3d(0,0,0)';

        switch (direction) {
            case 'up': return `translate3d(0, ${distance}px, 0)`;
            case 'down': return `translate3d(0, -${distance}px, 0)`;
            case 'left': return `translate3d(-${distance}px, 0, 0)`;
            case 'right': return `translate3d(${distance}px, 0, 0)`;
            default: return `translate3d(0, ${distance}px, 0)`;
        }
    };

    return (
        <div
            ref={ref}
            className={`${className}`}
            style={{
                opacity: isVisible ? 1 : 0,
                transform: getTransformStyle(),
                transition: `all 1000ms cubic-bezier(0.2, 0.8, 0.2, 1) ${delay}ms`,
                willChange: 'opacity, transform'
            }}
        >
            {children}
        </div>
    );
};

// --- NEW COMPONENT: INTRO ANIMATION ---
const IntroOverlay = ({ onComplete }: { onComplete: () => void }) => {
    // Stages: 'initial', 'drop-arrow', 'slide-underscore', 'jelly', 'zoom-out'
    const [stage, setStage] = useState('initial');

    useEffect(() => {
        // Timeline
        // 0ms: Start (Black Screen)
        // 100ms: Arrow Drops
        // 900ms: Underscore Slides
        // 1500ms: Jelly Effect (Boing!)
        // 2400ms: Zoom Out (Explode)
        // 3000ms: Complete (Unmount)

        const t1 = setTimeout(() => setStage('drop-arrow'), 100);
        const t2 = setTimeout(() => setStage('slide-underscore'), 900);
        const t3 = setTimeout(() => setStage('jelly'), 1500);
        const t4 = setTimeout(() => setStage('zoom-out'), 2400);
        const t5 = setTimeout(() => onComplete(), 3000);

        return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
            clearTimeout(t4);
            clearTimeout(t5);
        };
    }, [onComplete]);

    // Styles based on stage
    const getArrowStyle = () => {
        if (stage === 'initial') return 'opacity-0 -translate-y-[100vh]';
        // เมื่อถึง stage jelly ให้เอา transform:translate ออกเพื่อไม่ให้ตีกับ animation class
        if (stage === 'jelly') return 'opacity-100 translate-y-0 jelly-anim';
        if (stage === 'zoom-out') return 'opacity-100 translate-y-0';
        return 'opacity-100 translate-y-0 transition-all duration-[800ms] ease-out-bounce';
    };

    const getUnderscoreStyle = () => {
        if (stage === 'initial' || stage === 'drop-arrow') return 'opacity-0 translate-x-[100vw]';
        if (stage === 'jelly') return 'opacity-100 translate-x-0 jelly-anim-delay';
        if (stage === 'zoom-out') return 'opacity-100 translate-x-0';
        return 'opacity-100 translate-x-0 transition-all duration-[600ms] ease-out-quart';
    };

    const getContainerStyle = () => {
        if (stage === 'zoom-out') return 'scale-[50] opacity-0 pointer-events-none transition-all duration-[600ms] ease-in';
        return 'scale-100 opacity-100';
    };

    return (
        <div className={`fixed inset-0 z-[9999] bg-bg-primary flex items-center justify-center overflow-hidden ${stage === 'zoom-out' ? 'pointer-events-none' : ''}`}>
            {/* Logo Container */}
            <div className={`relative flex items-center justify-center ${getContainerStyle()}`}>

                {/* The Arrow ( > ) - Changed to SVG for rounded look */}
                <div className={`transform ${getArrowStyle()} text-text-primary origin-center`}>
                    <ChevronRight size={140} strokeWidth={3} className="block" />
                </div>

                {/* The Underscore ( _ ) - Changed to Rounded Div */}
                {/* Adjusting position: moved up slightly (mt-24 -> mt-20) */}
                <div className={`transform ${getUnderscoreStyle()} relative mt-20 -ml-10 origin-center`}>
                    <div className="bg-text-primary rounded-full" style={{ width: '80px', height: '14px' }}></div>
                </div>

            </div>

            <style>{`
                .ease-out-bounce {
                    transition-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                .ease-out-quart {
                    transition-timing-function: cubic-bezier(0.165, 0.84, 0.44, 1);
                }
                
                @keyframes jelly {
                    0%, 100% { transform: scale(1, 1); }
                    25% { transform: scale(1.25, 0.75); }
                    50% { transform: scale(0.75, 1.25); }
                    75% { transform: scale(1.15, 0.85); }
                    95% { transform: scale(0.95, 1.05); }
                }

                .jelly-anim {
                    animation: jelly 0.8s both;
                }
                
                .jelly-anim-delay {
                    animation: jelly 0.8s both;
                    animation-delay: 0.1s; /* ให้ _ เด้งตามมานิดหน่อย */
                }
            `}</style>
        </div>
    );
};

// --- COMPONENTS: SCROLL TO TOP ---
const ScrollToTopButton = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button
            onClick={scrollToTop}
            className={`fixed bottom-8 right-8 p-3 rounded-full bg-text-primary text-bg-primary shadow-lg hover:scale-110 transition-all duration-300 z-40 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
            aria-label="Scroll to top"
        >
            <ArrowUp className="w-5 h-5" />
        </button>
    );
};

// --- MAIN COMPONENT ---
const Landing = ({ onLogin, handleLogin }: LandingProps) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useLanguage();
    const [isAuthOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [showIntro, setShowIntro] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        // Play intro ONLY if:
        // 1. Not seen in this session yet (!intro_seen)
        // 2. Not redirecting for login (!login param)
        return !sessionStorage.getItem('intro_seen') && params.get('login') !== 'true';
    });

    const handleIntroComplete = () => {
        setShowIntro(false);
        sessionStorage.setItem('intro_seen', 'true');
    };

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        if (params.get('login') === 'true') {
            setAuthOpen(true);
            // Optionally clear the query param so it doesn't persist on reload
            window.history.replaceState({}, '', '/');
        }
    }, [location]);

    const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
        setAuthMode(mode);
        setAuthOpen(true);
    };

    const onLoginSuccess = (token: string, user: any) => {
        // App.tsx passes handleLogin, simpler prop name might be onLogin in App.tsx usage
        // Let's use whatever is passed.
        if (handleLogin) handleLogin(token, user);
        else if (onLogin) onLogin(token, user);
    };

    return (
        <div className="relative min-h-screen bg-bg-primary text-text-primary overflow-hidden font-sans selection:bg-pink-500/30 selection:text-pink-400 transition-colors duration-300">

            {/* The Intro Animation Overlay */}
            {showIntro && (
                <IntroOverlay onComplete={handleIntroComplete} />
            )}

            <TechBackground />

            {/* Wrap Content to potentially hide it or just layer it behind */}
            <div className={`transition-opacity duration-1000 ${showIntro ? 'opacity-0' : 'opacity-100'}`}>
                <ScrollToTopButton />
                <Navbar
                    user={null}
                    onLogout={() => { }}
                    onOpenAuth={handleOpenAuth}
                    onOpenUpload={() => { }}
                    onToggleMenu={() => { }}
                />

                <main className="relative pt-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center z-10">
                    {/* Badge */}
                    <ScrollReveal direction="down" delay={0} distance={20}>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-pink-500/20 bg-pink-500/5 backdrop-blur-sm mb-8 shadow-[0_0_20px_rgba(236,72,153,0.1)] hover:border-pink-500/40 transition-colors">
                            <span className="flex h-2 w-2 rounded-full bg-pink-500 animate-pulse"></span>
                            <span className="text-xs font-mono text-pink-400 font-bold tracking-wider">SYSTEM ONLINE v2.5.0</span>
                        </div>
                    </ScrollReveal>

                    {/* Hero Title */}
                    <ScrollReveal direction="up" delay={200} distance={60}>
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-text-primary via-text-primary via-70% to-text-muted drop-shadow-sm">
                            {t('landing.hero.title_1')}<br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-600">
                                {t('landing.hero.title_2')}
                            </span>
                        </h1>
                    </ScrollReveal>

                    {/* Hero Description */}
                    <ScrollReveal direction="up" delay={300} distance={40}>
                        <p className="text-lg md:text-xl text-text-muted max-w-2xl mb-10 leading-relaxed mx-auto">
                            {t('landing.hero.desc')}
                        </p>
                    </ScrollReveal>

                    {/* CTA Buttons */}
                    <ScrollReveal direction="up" delay={400} distance={30}>
                        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center">
                            <button
                                onClick={() => handleOpenAuth('login')}
                                className="px-8 py-4 bg-text-primary text-bg-primary font-bold rounded-lg hover:scale-105 transition-all duration-300 shadow-lg flex items-center justify-center gap-2"
                            >
                                <UserPlus className="w-5 h-5" /> {t('landing.cta.login')}
                            </button>
                            <button
                                onClick={() => navigate('/home')}
                                className="px-8 py-4 bg-transparent border border-border-primary text-text-primary font-semibold rounded-lg hover:bg-text-primary/5 hover:border-text-primary transition-all duration-300 flex items-center justify-center gap-2 group"
                            >
                                {t('landing.cta.explore')} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </ScrollReveal>

                    {/* Stats / Feature Grid */}
                    <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 text-text-muted text-sm font-mono border-t border-border-primary pt-10 w-full">
                        <ScrollReveal direction="left" delay={500} distance={30}>
                            <div className="text-xl font-bold text-text-primary mb-1 group cursor-default">
                                <span className="transition-colors">{t('landing.stats.explore_title')}</span>
                            </div>
                            <div>{t('landing.stats.explore_desc')}</div>
                        </ScrollReveal>
                        <ScrollReveal direction="up" delay={600} distance={30}>
                            <div className="text-xl font-bold text-text-primary mb-1 group cursor-default">
                                <span className="transition-colors">{t('landing.stats.download_title')}</span>
                            </div>
                            <div>{t('landing.stats.download_desc')}</div>
                        </ScrollReveal>
                        <ScrollReveal direction="up" delay={700} distance={30}>
                            <div className="text-xl font-bold text-text-primary mb-1 group cursor-default">
                                <span className="transition-colors">{t('landing.stats.showcase_title')}</span>
                            </div>
                            <div>{t('landing.stats.showcase_desc')}</div>
                        </ScrollReveal>
                        <ScrollReveal direction="right" delay={800} distance={30}>
                            <div className="text-xl font-bold text-white mb-1 group cursor-default">
                                <span className="transition-colors">{t('landing.stats.community_title')}</span>
                            </div>
                            <div>{t('landing.stats.community_desc')}</div>
                        </ScrollReveal>
                    </div>

                    {/* Steps Section */}
                    <div className="mt-32 w-full max-w-5xl">
                        <ScrollReveal direction="up">
                            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-12">{t('landing.steps.title')}</h2>
                        </ScrollReveal>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
                            {/* Step 1: Green */}
                            <ScrollReveal direction="up" delay={100} className="h-full">
                                <div className="bg-bg-tertiary p-8 rounded-2xl border border-border-primary hover:border-green-500/50 hover:bg-bg-tertiary/80 transition-all duration-300 group h-full hover:-translate-y-2">
                                    <div className="text-4xl font-bold text-green-500 mb-4 group-hover:scale-110 transition-transform origin-left">01</div>
                                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                        <UserPlus className="w-5 h-5 text-green-500" /> {t('landing.steps.1.title')}
                                    </h3>
                                    <p className="text-text-muted group-hover:text-text-primary transition-colors">
                                        {t('landing.steps.1.desc')}
                                    </p>
                                </div>
                            </ScrollReveal>
                            {/* Step 2: Blue */}
                            <ScrollReveal direction="up" delay={200} className="h-full">
                                <div className="bg-bg-tertiary p-8 rounded-2xl border border-border-primary hover:border-blue-500/50 hover:bg-bg-tertiary/80 transition-all duration-300 group h-full hover:-translate-y-2">
                                    <div className="text-4xl font-bold text-blue-500 mb-4 group-hover:scale-110 transition-transform origin-left">02</div>
                                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                        <Upload className="w-5 h-5 text-blue-500" /> {t('landing.steps.2.title')}
                                    </h3>
                                    <p className="text-text-muted group-hover:text-text-primary transition-colors">
                                        {t('landing.steps.2.desc')}
                                    </p>
                                </div>
                            </ScrollReveal>
                            {/* Step 3: Purple */}
                            <ScrollReveal direction="up" delay={300} className="h-full">
                                <div className="bg-bg-tertiary p-8 rounded-2xl border border-border-primary hover:border-purple-500/50 hover:bg-bg-tertiary/80 transition-all duration-300 group h-full hover:-translate-y-2">
                                    <div className="text-4xl font-bold text-purple-500 mb-4 group-hover:scale-110 transition-transform origin-left">03</div>
                                    <h3 className="text-xl font-semibold text-white mb-3 flex items-center gap-2">
                                        <Share2 className="w-5 h-5 text-purple-500" /> {t('landing.steps.3.title')}
                                    </h3>
                                    <p className="text-text-muted group-hover:text-text-primary transition-colors">
                                        {t('landing.steps.3.desc')}
                                    </p>
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>

                    {/* Counter Section */}
                    <div className="mt-32 w-full max-w-7xl border-y border-border-primary py-12">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                            <ScrollReveal direction="up" delay={0}>
                                <div>
                                    <div className="text-4xl font-bold text-text-primary mb-2">{t('landing.stats_counter.open')}</div>
                                    <div className="text-text-muted">{t('landing.stats_counter.open_desc')}</div>
                                </div>
                            </ScrollReveal>
                            <ScrollReveal direction="up" delay={150}>
                                <div>
                                    <div className="text-4xl font-bold text-text-primary mb-2">{t('landing.stats_counter.devs')}</div>
                                    <div className="text-text-muted">{t('landing.stats_counter.devs_desc')}</div>
                                </div>
                            </ScrollReveal>
                            <ScrollReveal direction="up" delay={300}>
                                <div>
                                    <div className="text-4xl font-bold text-text-primary mb-2">{t('landing.stats_counter.free')}</div>
                                    <div className="text-text-muted">{t('landing.stats_counter.free_desc')}</div>
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="mt-32 w-full max-w-3xl text-left mb-20">
                        <ScrollReveal direction="up">
                            <h2 className="text-3xl font-bold text-text-primary mb-8 text-center">{t('landing.faq.title')}</h2>
                        </ScrollReveal>
                        <div className="space-y-6">
                            <ScrollReveal direction="left" delay={0}>
                                <div className="bg-bg-tertiary p-6 rounded-xl border border-border-primary hover:bg-bg-tertiary/80 transition-colors">
                                    <h3 className="text-lg font-semibold text-text-primary mb-2">{t('landing.faq.1.q')}</h3>
                                    <p className="text-text-muted" dangerouslySetInnerHTML={{ __html: t('landing.faq.1.a') }} />
                                </div>
                            </ScrollReveal>
                            <ScrollReveal direction="right" delay={150}>
                                <div className="bg-bg-tertiary p-6 rounded-xl border border-border-primary hover:bg-bg-tertiary/80 transition-colors">
                                    <h3 className="text-lg font-semibold text-text-primary mb-2">{t('landing.faq.2.q')}</h3>
                                    <p className="text-text-muted">
                                        {t('landing.faq.2.a')}
                                    </p>
                                </div>
                            </ScrollReveal>
                            <ScrollReveal direction="left" delay={300}>
                                <div className="bg-bg-tertiary p-6 rounded-xl border border-border-primary hover:bg-bg-tertiary/80 transition-colors">
                                    <h3 className="text-lg font-semibold text-text-primary mb-2">{t('landing.faq.3.q')}</h3>
                                    <p className="text-text-muted">{t('landing.faq.3.a')}</p>
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                    <ScrollReveal direction="up" delay={0} distance={30}>
                        <ContactSection />
                    </ScrollReveal>
                </main>

                <footer className="relative z-10 py-8 text-center text-text-muted text-sm border-t border-border-primary w-full max-w-7xl mx-auto px-4">
                    <ScrollReveal direction="up">
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <p>{t('footer.copyright')}</p>
                            <div className="flex gap-6">
                                <a href="#" className="hover:text-text-primary transition-colors">{t('footer.about')}</a>
                                <a href="#" className="hover:text-text-primary transition-colors">{t('footer.privacy')}</a>
                                <a href="#" className="hover:text-text-primary transition-colors">{t('footer.contact')}</a>
                            </div>
                        </div>
                    </ScrollReveal>
                </footer>

                <AuthModal
                    isOpen={isAuthOpen}
                    onClose={() => setAuthOpen(false)}
                    initialView={authMode}
                    onLoginSuccess={onLoginSuccess}
                />
            </div>
        </div>
    );
};

export default Landing;