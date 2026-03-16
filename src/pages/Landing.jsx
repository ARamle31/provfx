import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Zap, Github, Twitter, Youtube, MonitorPlay, Layers, Video, DatabaseBackup } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import useStore from '../store/useStore';

const AuthModal = ({ isOpen, onClose }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState(null);
    const { login, register } = useStore();
    const navigate = useNavigate();

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            if (isLogin) await login(email, password);
            else await register(email, password, name);
            onClose();
            navigate('/dashboard');
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 bg-[#020202]/95 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4"
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 30 }}
                    className="bg-[#0A0A0C] border border-[#1f1f22] w-full max-w-sm p-10 rounded-[32px] relative shadow-[0_30px_100px_rgba(59,130,246,0.15)] overflow-hidden"
                >
                    <div className="absolute top-[-50%] right-[-50%] w-full h-full bg-mainAccent rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

                    <button onClick={onClose} className="absolute top-6 right-6 text-textMuted hover:text-white transition-colors">&times;</button>

                    <div className="flex bg-[#111113] p-1.5 rounded-2xl mb-10 shadow-inner border border-[#1f1f22]">
                        <button onClick={() => setIsLogin(true)} className={`flex-1 py-2.5 text-xs font-black tracking-wide uppercase rounded-xl transition-all ${isLogin ? 'bg-[#222] text-white shadow-md' : 'text-textMuted hover:text-white'}`}>Sign In</button>
                        <button onClick={() => setIsLogin(false)} className={`flex-1 py-2.5 text-xs font-black tracking-wide uppercase rounded-xl transition-all ${!isLogin ? 'bg-[#222] text-white shadow-md' : 'text-textMuted hover:text-white'}`}>Register</button>
                    </div>

                    <h2 className="text-3xl font-black mb-3 tracking-tighter text-white">{isLogin ? "Welcome Back." : "Create Studio."}</h2>
                    <p className="text-sm text-[#888] mb-8 leading-relaxed font-semibold">
                        {isLogin ? "Authenticate to synchronize your cloud edits." : "Provision your dedicated rendering node instantly."}
                    </p>

                    {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-4 rounded-xl mb-6 flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>{error}</div>}

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
                        {!isLogin && (
                            <input type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Creator/Studio Name"
                                className="w-full p-4 bg-[#111113] border border-[#27272a] rounded-xl text-white outline-none focus:border-mainAccent focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all font-semibold text-sm placeholder:text-[#555]" />
                        )}
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="hello@creator.io"
                            className="w-full p-4 bg-[#111113] border border-[#27272a] rounded-xl text-white outline-none focus:border-mainAccent focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all font-semibold text-sm placeholder:text-[#555]" />
                        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                            className="w-full p-4 bg-[#111113] border border-[#27272a] rounded-xl text-white outline-none focus:border-mainAccent focus:shadow-[0_0_20px_rgba(59,130,246,0.2)] transition-all font-semibold text-sm placeholder:text-[#555]" />

                        <button type="submit" className="w-full bg-white text-black font-black py-4 rounded-xl mt-4 hover:bg-gray-200 transition-colors shadow-[0_5px_20px_rgba(255,255,255,0.15)]">
                            {isLogin ? "Access Dashboard" : "Initialize Account"}
                        </button>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const BentoBox = ({ icon: Icon, title, desc, delay, size = "small" }) => (
    <motion.div
        initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.7, delay }}
        whileHover={{ y: -10, scale: 1.02 }}
        className={`bg-[#0A0A0C] border border-[#1f1f22] p-10 rounded-[32px] flex flex-col group relative overflow-hidden transition-all hover:border-mainAccent/40 hover:shadow-[0_20px_60px_rgba(59,130,246,0.15)] ${size === "large" ? "md:col-span-2 lg:col-span-2" : "md:col-span-1"
            }`}
    >
        <div className="absolute top-0 right-0 w-32 h-32 bg-mainAccent rounded-full blur-[80px] opacity-0 group-hover:opacity-10 transition-opacity duration-700"></div>
        <div className="w-14 h-14 rounded-2xl bg-[#111113] border border-[#27272a] flex items-center justify-center text-white mb-8 group-hover:scale-110 group-hover:bg-mainAccent group-hover:text-black group-hover:border-mainAccent transition-all duration-300">
            <Icon size={24} />
        </div>
        <h3 className="text-2xl font-black text-white mb-4 tracking-tight group-hover:translate-x-1 transition-transform">{title}</h3>
        <p className="text-[#888] font-medium leading-relaxed max-w-sm group-hover:text-white/80 transition-colors">{desc}</p>
    </motion.div>
);

const Landing = () => {
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();
    const isAuth = useStore(state => state.isAuth);

    return (
        <div className="relative min-h-screen font-inter w-full text-textMain bg-[#020202] selection:bg-mainAccent selection:text-black overflow-x-hidden">

            {/* Massive Neon Ambient Mesh */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.15 }} transition={{ duration: 2 }} className="absolute top-[-30%] left-[-20%] w-[80vw] h-[80vh] bg-mainAccent rounded-full blur-[200px] animate-blob"></motion.div>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.1 }} transition={{ duration: 3, delay: 1 }} className="absolute bottom-[-30%] right-[-20%] w-[70vw] h-[70vh] bg-purple-600 rounded-full blur-[250px] animate-blob" style={{ animationDelay: '4s', animationDuration: '30s' }}></motion.div>
            </div>

            <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />

            {/* Floating Glass Navbar */}
            <motion.nav
                initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }}
                className="fixed top-6 left-0 right-0 max-w-[1200px] mx-auto z-[100] bg-[#0A0A0C]/80 backdrop-blur-2xl border border-[#1f1f22] rounded-full px-8 py-5 flex items-center justify-between shadow-[0_20px_40px_rgba(0,0,0,0.5)]"
            >
                <div className="text-2xl font-black flex items-center gap-3 tracking-tighter text-white">
                    <div className="w-7 h-7 rounded-[8px] bg-white flex justify-center items-center shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                        <Video size={14} className="text-black" />
                    </div>
                    ProVFX.
                </div>
                <div className="hidden md:flex gap-10 font-bold uppercase tracking-widest text-[10px] text-[#666]">
                    <a href="#features" className="hover:text-white transition-colors py-2">The Engine</a>
                    <a href="#infrastructure" className="hover:text-white transition-colors py-2">Infrastructure</a>
                    <a href="#pricing" className="hover:text-white transition-colors py-2">Plans</a>
                </div>
                <div className="flex items-center gap-6">
                    {!isAuth ? (
                        <>
                            <button onClick={() => setShowModal(true)} className="text-[11px] font-black uppercase tracking-widest text-[#888] hover:text-white hidden md:block transition-colors">Sign In</button>
                            <button onClick={() => setShowModal(true)} className="bg-white text-black px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all">Start Editing</button>
                        </>
                    ) : (
                        <button onClick={() => navigate('/dashboard')} className="bg-mainAccent text-black px-8 py-3.5 rounded-full text-xs font-black uppercase tracking-wider shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all">Your Studio</button>
                    )}
                </div>
            </motion.nav>

            {/* Hero Section */}
            <section className="min-h-screen flex flex-col items-center text-center justify-center px-6 relative pt-40 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
                    className="mb-8 border border-[#27272a] bg-[#111113]/50 backdrop-blur-md px-5 py-2.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] text-[#888] flex items-center gap-3 shadow-xl"
                >
                    <span className="flex items-center gap-2 text-white">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse"></div> V3 CLOUD LIVE
                    </span>
                    <div className="w-[1px] h-3 bg-[#333]"></div>
                    WebGL Processing Engine Now Available
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
                    className="text-[clamp(60px,10vw,140px)] font-black leading-[0.85] tracking-tighter max-w-[1400px] mb-10 text-white"
                >
                    We Killed The <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-mainAccent via-purple-400 to-white pb-2 relative inline-block">
                        Render Queue.
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.3 }}
                    className="text-lg md:text-2xl text-[#888] font-medium max-w-[800px] leading-relaxed mb-14"
                >
                    The first serverless WebGL video editor capable of rendering 4K compositions entirely inside your browser cache. Instant playback, zero latency, limitless pipelines.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, delay: 0.5 }}
                    className="flex flex-col sm:flex-row items-center gap-6"
                >
                    <button
                        onClick={() => isAuth ? navigate('/dashboard') : setShowModal(true)}
                        className="bg-white text-black px-12 py-5 rounded-full text-base font-black uppercase tracking-wider flex items-center gap-4 shadow-[0_10px_30px_rgba(255,255,255,0.1)] hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(255,255,255,0.3)] hover:scale-[1.02] transition-all"
                    >
                        Launch Editor
                        <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
                            <Play size={14} fill="white" className="ml-0.5 text-white" />
                        </div>
                    </button>
                </motion.div>

                {/* Dynamic Studio Mockup */}
                <motion.div
                    initial={{ opacity: 0, y: 100, rotateX: 20 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ duration: 1.5, delay: 0.7, ease: "easeOut" }}
                    style={{ transformPerspective: 1200 }}
                    className="w-full max-w-[1280px] aspect-video mt-32 rounded-[40px] border border-[#1f1f22] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.8)] bg-[#0A0A0C] relative flex flex-col group"
                >
                    <div className="h-12 border-b border-[#1f1f22] flex items-center px-6 gap-3 bg-[#111113]">
                        <div className="w-3.5 h-3.5 rounded-full bg-[#ef4444]"></div><div className="w-3.5 h-3.5 rounded-full bg-[#eab308]"></div><div className="w-3.5 h-3.5 rounded-full bg-[#10b981]"></div>
                        <div className="flex-1 text-center font-mono text-xs font-bold text-[#555] tracking-widest uppercase">ProVFX WebGL Engine</div>
                    </div>
                    <div className="flex-1 w-full bg-[url('https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1600&auto=format&fit=crop')] bg-cover bg-center flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm group-hover:backdrop-blur-none transition-all duration-1000"></div>

                        {/* Fake UI Overlays inside the mockup */}
                        <div className="absolute bottom-10 left-10 right-10 h-32 bg-[#111113]/80 backdrop-blur-xl border border-[#27272a] rounded-2xl p-4 flex flex-col gap-2 opacity-0 translate-y-10 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-700 delay-100">
                            <div className="flex justify-between px-2 text-[10px] font-bold text-[#888] uppercase tracking-widest border-b border-[#27272a] pb-2">
                                <span>Timeline V1</span><span>00:04:23:12</span>
                            </div>
                            <div className="flex-1 mt-2 bg-mainAccent/20 rounded-lg border border-mainAccent/40 relative overflow-hidden">
                                <div className="absolute top-0 bottom-0 left-[30%] w-[2px] bg-red-500 shadow-[0_0_10px_red]"></div>
                            </div>
                        </div>

                        <div className="text-center z-10 p-12 backdrop-blur-2xl bg-[#0A0A0C]/60 border border-white/20 rounded-[32px] shadow-2xl group-hover:scale-95 transition-transform duration-700">
                            <h2 className="font-bodoni text-7xl font-black text-white italic tracking-[0.2em] relative">RESTRICTED<div className="absolute -top-6 -right-12 text-mainAccent font-inter text-sm not-italic font-black tracking-widest uppercase rotate-12 bg-mainAccent/20 px-3 py-1 rounded border border-mainAccent/30">V3</div></h2>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Feature Bento Grid */}
            <section id="features" className="py-40 px-6 max-w-[1300px] mx-auto">
                <div className="text-center mb-24">
                    <h2 className="text-5xl md:text-7xl font-black mb-8 tracking-tighter text-white">Engineered for <br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-mainAccent to-purple-400">Extreme Fidelity.</span></h2>
                    <p className="text-[#888] font-medium text-xl max-w-2xl mx-auto leading-relaxed">Forget desktop apps eating your RAM. We route matrix transformations directly through your browser's V8 GPU instance.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <BentoBox
                        size="large" icon={MonitorPlay} delay={0.1}
                        title="Real-Time Canvas Matrix"
                        desc="Every slider, every color tweak, completely latency free. We bypass the DOM entirely by writing pixels directly into ArrayBuffers using pure mathematical Shaders."
                    />
                    <BentoBox
                        icon={Zap} delay={0.2}
                        title="H.264 Inject"
                        desc="Lossless file imports straight from your local directory without uploading a single byte to an external server."
                    />
                    <BentoBox
                        icon={DatabaseBackup} delay={0.3}
                        title="State Sync"
                        desc="Your edits are silently hashed and encrypted securely inside your browser's IndexedDB. Never lose a frame."
                    />
                    <BentoBox
                        size="large" icon={Layers} delay={0.4}
                        title="Advanced Blends & Overlays"
                        desc="Add cinematic grain, VHS artifacts, and 4K Light Leaks using Screen or Color-Dodge algorithms identical to Adobe Premiere Pro."
                    />
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-[#1f1f22] bg-[#0A0A0C] mt-20 relative overflow-hidden">
                <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-mainAccent to-transparent opacity-20"></div>
                <div className="max-w-[1300px] mx-auto px-10 py-20 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">

                    <div className="flex flex-col gap-4">
                        <div className="text-3xl font-black flex items-center gap-3 text-white">
                            <div className="w-6 h-6 rounded-md bg-white flex justify-center items-center"><Video size={12} className="text-black" /></div>ProVFX.
                        </div>
                        <p className="text-[#666] font-semibold text-sm max-w-xs leading-relaxed">
                            The ultimate web-based editing architecture for modern SaaS creators.
                        </p>
                    </div>

                    <div className="flex flex-col gap-6 text-right w-full md:w-auto">
                        <div className="flex gap-4 justify-start md:justify-end">
                            <a href="#" className="w-12 h-12 rounded-full bg-[#111113] border border-[#27272a] flex items-center justify-center text-[#888] hover:text-white hover:bg-mainAccent hover:border-mainAccent transition-all"><Twitter size={20} /></a>
                            <a href="#" className="w-12 h-12 rounded-full bg-[#111113] border border-[#27272a] flex items-center justify-center text-[#888] hover:text-white hover:bg-[#ff0000] hover:border-[#ff0000] transition-all"><Youtube size={20} /></a>
                            <a href="#" className="w-12 h-12 rounded-full bg-[#111113] border border-[#27272a] flex items-center justify-center text-[#888] hover:text-white hover:bg-white hover:text-black hover:border-white transition-all"><Github size={20} /></a>
                        </div>
                        <p className="text-xs uppercase tracking-[0.2em] font-bold text-[#555]">
                            © 2026 ProVFX Systems Inc
                        </p>
                    </div>

                </div>
            </footer>
        </div>
    );
};

export default Landing;
