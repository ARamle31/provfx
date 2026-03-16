import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Edit, UploadCloud, Settings, LogOut, Loader2, Play, Sparkles, FolderOpen, Video } from 'lucide-react';
import useStore from '../store/useStore';
import { projectsApi } from '../lib/api';

const SidebarItem = ({ icon: IconComponent, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-3 px-4 py-3.5 w-full text-left text-sm font-semibold rounded-xl transition-all mb-1 hover:translate-x-1 active:scale-95 ${active
            ? 'bg-gradient-to-r from-mainAccent/20 to-transparent text-mainAccent border-l-2 border-mainAccent shadow-[inset_0_0_20px_rgba(59,130,246,0.05)]'
            : 'text-textMuted hover:bg-[#18181b] hover:text-white border-l-2 border-transparent hover:border-[#333]'
            }`}
    >
        <IconComponent size={18} />
        {label}
    </button>
);

const TemplateCard = ({ title, desc, tags, previewUrl, isVHS, isProject, onClick }) => (
    <div
        onClick={onClick}
        className="bg-bgCard border border-[#26262b] rounded-3xl overflow-hidden cursor-pointer hover:border-mainAccent/50 hover:shadow-[0_20px_40px_rgba(233,75,40,0.15)] transition-all hover:-translate-y-2 hover:scale-[1.02] block text-left group flex flex-col h-full animate-[fadeInUp_0.5s_ease-out_forwards]"
    >
        <div
            className={`w-full h-48 relative bg-[#1c1d22] bg-cover bg-center shrink-0 ${isVHS ? 'bg-[url(https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=800&auto=format&fit=crop)]' : ''}`}
            style={!isVHS && previewUrl ? { backgroundImage: `url(${previewUrl})` } : {}}
        >
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-sm">
                <div className="w-14 h-14 rounded-full bg-mainAccent text-black flex items-center justify-center shadow-[0_0_30px_rgba(233,75,40,0.5)] transform scale-50 group-hover:scale-100 transition-transform duration-300">
                    <Play size={24} fill="currentColor" className="ml-1" />
                </div>
            </div>

            {isVHS && (
                <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-md border-2 border-white px-3 py-1.5 flex items-center gap-2 rounded shadow-2xl">
                    <div className="font-bodoni text-2xl font-bold text-white">R</div>
                    <div className="w-[1px] h-6 bg-white shrink-0"></div>
                    <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-white uppercase tracking-[0.2em] leading-tight">RESTRICTED</span>
                        <span className="text-[7px] text-gray-300 tracking-wider">UNDER 17 REQUIRES PARENT</span>
                    </div>
                </div>
            )}
            {!isVHS && !previewUrl && (
                <div className="w-full h-full bg-gradient-to-br from-[#1c1d22] to-[#15161a] flex flex-col items-center justify-center text-[#555]">
                    <Video size={48} className="mb-2" />
                    <span className="text-xs font-bold uppercase tracking-widest">{isProject ? "Cloud Save" : "Empty Canvas"}</span>
                </div>
            )}
        </div>

        <div className="p-6 flex flex-col gap-3 flex-1 bg-gradient-to-b from-[#15161a] to-[#0f0f12]">
            <span className="text-lg font-bold text-white truncate">{title}</span>
            <span className="text-sm text-textMuted line-clamp-2 leading-relaxed flex-1">{desc}</span>
            <div className="flex gap-2 mt-2 flex-wrap">
                {tags.map((tag, i) => (
                    <span key={i} className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${isProject ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-mainAccent/10 text-mainAccent border border-mainAccent/20'}`}>
                        {tag}
                    </span>
                ))}
            </div>
        </div>
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useStore();
    const [filter, setFilter] = useState('All');
    const [projects, setProjects] = useState([]);
    const [loadingObj, setLoadingObj] = useState(true);

    const filters = ['All Templates', 'My Sessions', 'Shorts', 'Commercials'];

    useEffect(() => {
        if (user) {
            projectsApi.getProjects(user.id).then(res => {
                setProjects(res);
                setLoadingObj(false);
            }).catch(() => setLoadingObj(false));
        }
    }, [user]);

    const handleOpenEditor = (templateOrId, isExisting = false) => {
        if (isExisting) navigate(`/editor?projectId=${templateOrId}`);
        else navigate(`/editor${templateOrId ? `?template=${templateOrId}` : ''}`);
    };

    return (
        <div className="flex h-screen bg-[#0f0f12] text-[#f0f0f5] overflow-hidden font-inter selection:bg-[#e94b28] selection:text-black">
            {/* Dynamic Left Sidebar */}
            <div className="w-[280px] bg-[#15161a] border-r border-[#26262b] flex flex-col shrink-0 relative z-20 shadow-[10px_0_30px_rgba(0,0,0,0.5)]">
                <div className="p-8 pb-6 flex items-center gap-3">
                    <div className="text-[#e94b28]" style={{ filter: "drop-shadow(0 0 5px rgba(233, 75, 40, 0.4))" }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line><line x1="7.05" y1="7.05" x2="16.95" y2="16.95"></line><line x1="7.05" y1="16.95" x2="16.95" y2="7.05"></line></svg>
                    </div>
                    <h2 className="font-black text-2xl tracking-tight text-white mb-0.5 mt-0.5 leading-none">ProVFX.</h2>
                </div>

                <div className="flex-1 px-4 py-4 flex flex-col gap-1 overflow-y-auto">
                    <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8e8e99] mb-2 px-4 mt-2">Menu</div>
                    <SidebarItem icon={LayoutGrid} label="Discover Hub" active />
                    <SidebarItem icon={FolderOpen} label="My Projects" onClick={() => window.scrollTo(0, 500)} />
                    <SidebarItem icon={Edit} label="Blank Workspace" onClick={() => handleOpenEditor()} />
                    <SidebarItem icon={UploadCloud} label="Cloud Archive" />

                    <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#8e8e99] mb-2 px-4 mt-8">Organization</div>
                    <SidebarItem icon={Settings} label="Studio Settings" />
                </div>

                <div className="p-6 border-t border-[#26262b] flex items-center justify-between gap-4 bg-[#0f0f12]">
                    <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 shrink-0 rounded-full bg-gradient-to-tr from-[#e94b28] to-orange-500 flex items-center justify-center font-bold text-white shadow-lg">
                            {user?.name?.charAt(0).toUpperCase() || "U"}
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-sm font-bold truncate text-white">{user?.name}</span>
                            <span className="text-[10px] text-[#8e8e99] truncate">{user?.email}</span>
                        </div>
                    </div>
                    <button onClick={() => { logout(); navigate('/'); }} className="text-[#8e8e99] hover:text-red-400 transition-colors bg-[#1c1d22] p-2.5 rounded-xl hover:bg-red-500/10">
                        <LogOut size={16} />
                    </button>
                </div>
            </div>

            {/* Main Premium Dashboard Workspace */}
            <div className="flex-1 p-0 overflow-y-auto relative w-full scroll-smooth custom-scrollbar">
                {/* Massive Top Hero Banner Gradient */}
                <div className="absolute top-0 left-0 w-full h-[400px] bg-gradient-to-b from-mainAccent/10 via-[#0f0f12]/50 to-[#0f0f12] pointer-events-none -z-10"></div>
                <div className="absolute top-[-20%] left-[30%] w-[60vw] h-[60vh] bg-mainAccent rounded-full blur-[250px] opacity-[0.05] pointer-events-none -z-10 animate-blob"></div>

                <div className="max-w-[1400px] mx-auto px-10 py-16 pt-20">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-mainAccent/10 text-mainAccent border border-mainAccent/20 text-xs font-bold uppercase tracking-wider mb-4">
                                <Sparkles size={12} className="animate-pulse" /> V3 Dashboard
                            </div>
                            <h1 className="text-5xl font-black tracking-tighter mb-3 text-white">Creator Hub.</h1>
                            <p className="text-base text-textMuted max-w-lg">Welcome back to the studio, <span className="text-white font-semibold">{user?.name}</span>. Start a new blank canvas or jump into an official template directly accelerated by your GPU.</p>
                        </div>
                        <button
                            onClick={() => handleOpenEditor()}
                            className="bg-white text-black px-8 py-4 rounded-full text-sm font-extrabold shadow-[0_10px_30px_rgba(255,255,255,0.15)] hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(255,255,255,0.25)] transition-all flex items-center gap-2 group"
                        >
                            <Edit size={16} className="group-hover:rotate-12 transition-transform" /> NEW WORKSPACE
                        </button>
                    </div>

                    <div className="flex gap-3 mb-12 overflow-x-auto pb-4 border-b border-[#26262b]">
                        {filters.map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`whitespace-nowrap px-6 py-2.5 rounded-full text-xs font-bold transition-all border ${filter === f || (f === 'All Templates' && filter === 'All')
                                    ? 'bg-mainAccent border-mainAccent text-black shadow-[0_0_20px_rgba(233,75,40,0.3)]'
                                    : 'bg-[#15161a] border-[#26262b] text-[#8e8e99] hover:text-white hover:bg-[#1c1d22]'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    <section className="mb-16">
                        <h3 className="text-2xl font-black mb-6 text-white flex items-center gap-3">
                            <UploadCloud size={24} className="text-mainAccent" /> Recent Cloud Sessions
                        </h3>

                        {loadingObj ? (
                            <div className="flex items-center justify-center p-20 gap-3 text-mainAccent font-bold bg-[#15161a] border border-[#26262b] rounded-3xl"><Loader2 className="animate-spin" /> Syncing with Encrypted Vault...</div>
                        ) : projects.length === 0 ? (
                            <div className="bg-[#15161a] border border-[#26262b] p-16 rounded-3xl mb-12 flex flex-col items-center justify-center text-center shadow-xl">
                                <div className="w-20 h-20 bg-[#1c1d22] rounded-full flex items-center justify-center mb-6">
                                    <FolderOpen size={32} className="text-[#8e8e99]" />
                                </div>
                                <h4 className="text-xl font-bold text-white mb-2">No Projects Detected</h4>
                                <p className="text-[#8e8e99] max-w-sm">You haven&apos;t saved any sessions to the cloud yet. Open a workspace to automatically trigger a sync.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {projects.map(p => (
                                    <TemplateCard
                                        key={p.projectId}
                                        title={p.title}
                                        desc={`Last modified on ${new Date(p.updatedAt).toLocaleString()}`}
                                        tags={['Local Storage', 'Auto-Saved']}
                                        isProject={true}
                                        onClick={() => handleOpenEditor(p.projectId, true)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="mb-20">
                        <h3 className="text-2xl font-black mb-6 text-white flex items-center gap-3">
                            <Sparkles size={24} className="text-mainAccent" /> Official SaaS Templates
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <TemplateCard
                                title="Original Main (video-app.html)"
                                desc="The exact 1:1 port of your original video-app.html. Hollywood restricted trailer overlay with automated WebGL grain."
                                tags={['Core Engine', '4K Export']}
                                isVHS
                                onClick={() => handleOpenEditor('vhs-rating')}
                            />
                            <TemplateCard
                                title="Cinematic Vlog / B-Roll"
                                desc="High dynamic range lookup tables and automated color dodge blending for travel and lifestyle creators."
                                tags={['Reel', 'Color Grade']}
                                previewUrl="https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=800&auto=format&fit=crop"
                                onClick={() => handleOpenEditor('cinematic')}
                            />
                            <TemplateCard
                                title="Cyberpunk Glitch Protocol"
                                desc="Advanced chromatic aberration shaders running inside real-time matrix loops."
                                tags={['Effects', 'Presets']}
                                previewUrl="https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800&auto=format&fit=crop"
                                onClick={() => handleOpenEditor('cyberpunk')}
                            />
                            <TemplateCard
                                title="Podcast Viral Short"
                                desc="Split screen dynamic timeline specifically formatted for TikTok and Instagram Reels."
                                tags={['Vertical', 'API Upload']}
                                previewUrl="https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=800&auto=format&fit=crop"
                                onClick={() => handleOpenEditor('podcast')}
                            />
                        </div>
                    </section>

                </div>
            </div>
        </div>
    );
};

export default Dashboard;
