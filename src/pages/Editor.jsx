import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    CloudLightning, Loader2, CheckCircle, Layout, Image as ImageIcon,
    Video, Type, Music, Camera, Download, UploadCloud,
    Play, Pause, SkipBack, SkipForward, Volume2, Maximize,
    ChevronDown, ChevronUp, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Type as TypeIcon, Bold, Italic, Underline, 
    AtSign, Link, MapPin, AlertCircle, Layers, Minus, Plus, Radio
} from 'lucide-react';
import useStore from '../store/useStore';
import { projectsApi } from '../lib/api';
import './Editor.css';

const Editor = () => {
    const navigate = useNavigate();
    const { user } = useStore();
    const [searchParams, setSearchParams] = useSearchParams();

    // Core Project Identity
    const currentProjectId = useRef(searchParams.get('projectId') || `proj_${Date.now()}`);

    // UI State
    const [isPlaying, setIsPlaying] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [fileNames, setFileNames] = useState({ video: "Select Video / Image", overlay: "Select Overlay Video", audio: "Select Audio File" });
    
    // Tab State
    const [activeTab, setActiveTab] = useState('Text');
    const [activeAccordions, setActiveAccordions] = useState({ style: true, textData: true, fill: false, border: false, effects: false });

    // Pinterest State
    const [pinterestUsername, setPinterestUsername] = useState("");
    const [pinterestConnected, setPinterestConnected] = useState(false);
    const [pinterestImages, setPinterestImages] = useState([]);
    const [isLoadingPinterest, setIsLoadingPinterest] = useState(false);
    
    // Timeline Tracks State
    const [clips, setClips] = useState([
        { id: 't1', type: 'text', name: 'Text (Title)', icon: TypeIcon, color: 'text-white', bg: 'bg-gradient-to-r from-[#6147F6] to-[#7E65FE] text-white', border: 'border-white/20', iconColor: 'bg-black/20', start: 0, end: 100, label: 'SOPRA aa' },
        { id: 't2', type: 'text', name: 'Text (Sub)', icon: TypeIcon, color: 'text-white', bg: 'bg-gradient-to-r from-[#6147F6] to-[#7E65FE] text-white opacity-70', border: 'border-white/20', iconColor: 'bg-black/20', start: 0, end: 100, label: 'LOU NADAL DIRECT...' }
    ]);
    const [draggingClip, setDraggingClip] = useState(null);
    const [dragInfo, setDragInfo] = useState({ startX: 0, originalStart: 0, originalEnd: 0, type: '' });
    const [timelineZoom, setTimelineZoom] = useState(1);

    // Refs for Media Elements
    const canvasRef = useRef(null);
    const vidRef = useRef(null);
    const audRef = useRef(null);
    const imgRef = useRef(null);
    const overlayVidRef = useRef(null);
    
    // UI Feedback Refs
    const timeCurrentRef = useRef(null);
    const playheadRef = useRef(null);
    const saveIndicatorRef = useRef(null);

    // Engine State
    const rawFiles = useRef({ video: null, image: null, audio: null, overlay: null });

    const [renderState, setRenderState] = useState({
        scale: 1.0, bright: 1.0, contrast: 1.0,
        posX: 0, posY: 0, overlayPosX: 0, overlayPosY: 0, overlayScale: 1.0, overlayOpacity: 1.0, overlayBlend: 'source-over',
        title: "SOPRA aa",
        url: "www.provfx.com",
        lease: "LOU NADAL DIRECTEUR ARTISTIQUE PARIS, 75000",
        ratingMain: "RESTRICTED", ratingSub1: "UNDER 17 REQUIRES", ratingSub2: "PARENT/GUARDIAN",
        // Text Styles
        fontFamily: "Space Grotesk", fontWeight: "800", fontSize: 150, letterSpacing: 0, lineHeight: 180, textAlign: "center",
        isBold: false, isItalic: false, isUnderline: false,
        hasVideo: false, hasImage: false, hasAudio: false, hasOverlayVideo: false
    });

    const engineState = useRef({
        ...renderState,
        duration: 10, currentTime: 0,
        hasVideo: false, hasImage: false, hasAudio: false, hasOverlayVideo: false
    });

    const textures = useRef({
        grain: document.createElement('canvas'),
        vinyl: document.createElement('canvas')
    });

    useEffect(() => {
        const vCtx = textures.current.vinyl.getContext('2d');
        textures.current.vinyl.width = 1920; textures.current.vinyl.height = 1080;
        const maxR = Math.sqrt(960 * 960 + 540 * 540);
        vCtx.lineWidth = 1;
        for (let r = 2; r < maxR; r += 6) {
            vCtx.beginPath(); vCtx.arc(960, 540, r, 0, 2 * Math.PI);
            vCtx.strokeStyle = (r % 12 === 0) ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.04)';
            vCtx.stroke();
        }

        const gCtx = textures.current.grain.getContext('2d');
        textures.current.grain.width = 400; textures.current.grain.height = 400;
        const imgData = gCtx.createImageData(400, 400);
        for (let i = 0; i < imgData.data.length; i += 4) {
            const val = Math.random() * 255;
            imgData.data[i] = imgData.data[i + 1] = imgData.data[i + 2] = val;
            imgData.data[i + 3] = 40;
        }
        gCtx.putImageData(imgData, 0, 0);

        const loadProject = async () => {
            const urlPID = searchParams.get('projectId');
            if (urlPID && user) {
                try {
                    const data = await projectsApi.loadProject(urlPID);
                    engineState.current = { ...engineState.current, ...data.stateData };
                    setRenderState(prev => ({ ...prev, ...data.stateData }));
                    if (data.files) {
                        const getSrc = (f) => f.url || URL.createObjectURL(f);
                        if (data.files.video) { rawFiles.current.video = data.files.video; vidRef.current.src = getSrc(data.files.video); setFileNames(p => ({ ...p, video: data.files.video.name || "cloud-video.mp4" })); vidRef.current.onloadedmetadata = () => { engineState.current.duration = Math.max(engineState.current.duration, vidRef.current.duration); requestRender(); }; vidRef.current.load(); }
                        if (data.files.image) { rawFiles.current.image = data.files.image; imgRef.current.src = getSrc(data.files.image); setFileNames(p => ({ ...p, video: data.files.image.name || "cloud-image.png" })); imgRef.current.onload = requestRender; }
                        if (data.files.audio) { rawFiles.current.audio = data.files.audio; audRef.current.src = getSrc(data.files.audio); setFileNames(p => ({ ...p, audio: data.files.audio.name || "cloud-audio.mp3" })); audRef.current.onloadedmetadata = () => { engineState.current.duration = Math.max(engineState.current.duration, audRef.current.duration); }; audRef.current.load(); }
                        if (data.files.overlay) { rawFiles.current.overlay = data.files.overlay; overlayVidRef.current.src = getSrc(data.files.overlay); setFileNames(p => ({ ...p, overlay: data.files.overlay.name || "cloud-overlay.mp4" })); overlayVidRef.current.onloadedmetadata = () => { engineState.current.duration = Math.max(engineState.current.duration, overlayVidRef.current.duration); requestRender(); }; overlayVidRef.current.load(); }
                    }
                } catch { /* ignore */ }
            } else if (!searchParams.has('projectId')) {
                setSearchParams({ ...Object.fromEntries(searchParams.entries()), projectId: currentProjectId.current }, { replace: true });
                if (imgRef.current && !engineState.current.hasVideo) {
                    imgRef.current.src = "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1920&auto=format&fit=crop";
                    imgRef.current.onload = () => { engineState.current.hasImage = true; };
                }
            }
            setIsLoading(false);
            requestRender();
        };

        loadProject();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, searchParams, setSearchParams]);

    const isSavingFile = useRef(false);

    useEffect(() => {
        if (!user || isLoading) return;
        const autoSave = async () => {
            if (isSavingFile.current) return;
            if (vidRef.current?.duration) engineState.current.duration = Math.max(engineState.current.duration, vidRef.current.duration);
            isSavingFile.current = true;
            try {
                const res = await projectsApi.saveProject(user.id, currentProjectId.current, engineState.current, rawFiles.current);
                if (res.files) {
                    for (const key in res.files) {
                        if (res.files[key]?.url) rawFiles.current[key] = res.files[key];
                    }
                }
                flashSave();
            } catch { /* ignore */ } finally {
                isSavingFile.current = false;
            }
        };
        const interval = setInterval(autoSave, 5000);
        return () => clearInterval(interval);
    }, [user, isLoading]);

    const requestRender = () => {
        if (!isPlaying) requestAnimationFrame(renderEngine);
    };

    const renderEngine = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d', { alpha: false });
        const st = engineState.current;

        ctx.clearRect(0, 0, 1920, 1080);
        ctx.save();
        ctx.filter = `brightness(${st.bright}) contrast(${st.contrast})`;
        ctx.translate(960 + st.posX, 540 + st.posY);
        ctx.scale(st.scale, st.scale);

        let source = st.hasVideo && vidRef.current?.readyState >= 2 ? vidRef.current : (st.hasImage ? imgRef.current : null);
        if (source) {
            const sw = source.videoWidth || source.naturalWidth;
            const sh = source.videoHeight || source.naturalHeight;
            if (sw && sh) {
                let aspect = sw / sh;
                let drawW = 1920, drawH = 1080;
                if (aspect > 1920 / 1080) drawW = drawH * aspect; else drawH = drawW / aspect;
                ctx.drawImage(source, -drawW / 2, -drawH / 2, drawW, drawH);
            }
        } else {
            ctx.fillStyle = "#111"; ctx.fillRect(-960, -540, 1920, 1080);
        }
        ctx.restore();

        ctx.save();
        ctx.globalCompositeOperation = "overlay";
        const pat = ctx.createPattern(textures.current.grain, 'repeat');
        ctx.fillStyle = pat; ctx.fillRect(0, 0, 1920, 1080);
        ctx.globalAlpha = 1.0; ctx.drawImage(textures.current.vinyl, 0, 0);
        ctx.restore();

        if (st.hasOverlayVideo && overlayVidRef.current?.readyState >= 2) {
            ctx.save();
            ctx.globalAlpha = st.overlayOpacity;
            ctx.globalCompositeOperation = st.overlayBlend;
            ctx.translate(960 + st.overlayPosX, 540 + st.overlayPosY);
            ctx.scale(st.overlayScale, st.overlayScale);
            const oSw = overlayVidRef.current.videoWidth, oSh = overlayVidRef.current.videoHeight;
            let oDrawW = 1920, oDrawH = 1080;
            if ((oSw / oSh) > 1920 / 1080) oDrawW = oDrawH * (oSw / oSh); else oDrawH = oDrawW / (oSw / oSh);
            ctx.drawImage(overlayVidRef.current, -oDrawW / 2, -oDrawH / 2, oDrawW, oDrawH);
            ctx.restore();
        }

        // Timeline Visibility State Resolution
        const tPct = (st.duration > 0) ? (st.currentTime / st.duration) * 100 : 0;
        
        const titleClip = clips.find(c => c.id === 't1');
        const showTitle = titleClip ? (tPct >= titleClip.start && tPct <= titleClip.end) : false;
        
        const subClip = clips.find(c => c.id === 't2');
        const showSub = subClip ? (tPct >= subClip.start && tPct <= subClip.end) : false;

        if (showTitle || showSub) {
            ctx.fillStyle = "#fff"; ctx.textAlign = st.textAlign; ctx.textBaseline = "middle";
            let fontStyle = "";
            if (st.isItalic) fontStyle += "italic ";
            if (st.isBold) fontStyle += "bold ";
            ctx.font = `${fontStyle}${st.fontWeight} ${st.fontSize}px "${st.fontFamily}", sans-serif`; 
            ctx.letterSpacing = `${st.letterSpacing}px`;
            
            if (showTitle) {
                ctx.fillText(st.title, 960, 500);
                // Underline handling for main title
                if (st.isUnderline) {
                    const tm = ctx.measureText(st.title);
                    ctx.lineWidth = st.fontSize * 0.05; ctx.strokeStyle = "#fff"; ctx.beginPath();
                    let ux = 960 - tm.width/2;
                    if(st.textAlign === 'left') ux = 960;
                    else if(st.textAlign === 'right') ux = 960 - tm.width;
                    ctx.moveTo(ux, 500 + st.fontSize * 0.4); ctx.lineTo(ux + tm.width, 500 + st.fontSize * 0.4); ctx.stroke();
                }
            }

            if (showSub) {
                ctx.textBaseline = "alphabetic"; ctx.font = '600 24px "Inter"'; ctx.letterSpacing = '1px'; ctx.globalAlpha = 0.9;
                ctx.fillText(st.lease, 960, 620);
                
                ctx.font = '500 20px "Inter"'; ctx.letterSpacing = '1.5px'; ctx.globalAlpha = 0.8;
                ctx.fillText(st.url, 960, 680);

                ctx.save();
                const fY = 800;
                ctx.translate(960, fY); ctx.font = '700 20px "Inter"';
                let m1 = ctx.measureText(st.ratingMain).width; ctx.font = '600 16px "Inter"';
                let m2 = Math.max(ctx.measureText(st.ratingSub1).width, ctx.measureText(st.ratingSub2).width);
                let tW = Math.max(m1, m2); let bW = 60 + 20 + tW + 40, bH = 80;
                ctx.translate(-bW / 2, -bH / 2);
                ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0, 0, bW, bH);
                ctx.strokeStyle = "#fff"; ctx.lineWidth = 3; ctx.strokeRect(0, 0, bW, bH);
                ctx.fillStyle = "#fff"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
                ctx.font = '800 48px "Bodoni Moda"'; ctx.fillText("R", 20, bH / 2 + 5);
                ctx.beginPath(); ctx.moveTo(70, 10); ctx.lineTo(70, bH - 10); ctx.stroke();
                ctx.textBaseline = "alphabetic"; ctx.font = '700 16px "Inter"'; ctx.letterSpacing = '1px'; ctx.fillText(st.ratingMain, 90, 26);
                ctx.font = '600 12px "Inter"'; ctx.fillText(st.ratingSub1, 90, 48); ctx.fillText(st.ratingSub2, 90, 64);
                ctx.restore();
            }
        }
    };

    useEffect(() => {
        let frameId;
        const loop = () => {
            if (isPlaying) {
                const st = engineState.current;
                if (st.hasAudio && audRef.current && !audRef.current.paused) st.currentTime = audRef.current.currentTime;
                else if (st.hasVideo && vidRef.current && !vidRef.current.paused) st.currentTime = vidRef.current.currentTime;
                else if (st.hasOverlayVideo && overlayVidRef.current && !overlayVidRef.current.paused) st.currentTime = overlayVidRef.current.currentTime;

                if (st.currentTime >= st.duration && isPlaying && st.duration > 0) {
                    st.currentTime = 0;
                    if (st.hasVideo && vidRef.current) vidRef.current.currentTime = 0;
                    if (st.hasAudio && audRef.current) audRef.current.currentTime = 0;
                    if (st.hasOverlayVideo && overlayVidRef.current) overlayVidRef.current.currentTime = 0;
                }

                if (timeCurrentRef.current && st.duration > 0) {
                    let pct = st.currentTime / st.duration;
                    if (playheadRef.current) playheadRef.current.style.left = `calc(60px + ${pct} * (100% - 60px))`;
                    let m = Math.floor(st.currentTime / 60).toString().padStart(2, '0');
                    let s = Math.floor(st.currentTime % 60).toString().padStart(2, '0');
                    timeCurrentRef.current.innerText = `00:${m}:${s}`;
                }
                renderEngine();
                frameId = requestAnimationFrame(loop);
            }
        };
        if (isPlaying) { loop(); }
        return () => cancelAnimationFrame(frameId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isPlaying]);

    useEffect(() => {
        const handleGlobalMouseMove = (e) => {
            if (!draggingClip) return;
            const dx = e.clientX - dragInfo.startX;
            const dPct = (dx / 8); 
            
            setClips(prev => prev.map(c => {
                if (c.id !== draggingClip) return c;
                if (dragInfo.type === 'move') {
                    const len = dragInfo.originalEnd - dragInfo.originalStart;
                    let newStart = dragInfo.originalStart + dPct;
                    if (newStart < 0) newStart = 0;
                    if (newStart + len > 100) newStart = 100 - len;
                    return { ...c, start: newStart, end: newStart + len };
                } else if (dragInfo.type === 'left') {
                    let newStart = dragInfo.originalStart + dPct;
                    if (newStart < 0) newStart = 0;
                    if (newStart >= c.end - 5) newStart = c.end - 5;
                    return { ...c, start: newStart };
                } else if (dragInfo.type === 'right') {
                    let newEnd = dragInfo.originalEnd + dPct;
                    if (newEnd > 100) newEnd = 100;
                    if (newEnd <= c.start + 5) newEnd = c.start + 5;
                    return { ...c, end: newEnd };
                }
                return c;
            }));
        };
        const handleGlobalMouseUp = () => setDraggingClip(null);
        window.addEventListener('mousemove', handleGlobalMouseMove);
        window.addEventListener('mouseup', handleGlobalMouseUp);
        return () => { window.removeEventListener('mousemove', handleGlobalMouseMove); window.removeEventListener('mouseup', handleGlobalMouseUp); };
    }, [draggingClip, dragInfo]);

    const handleClipDown = (e, id, type) => {
        e.stopPropagation();
        const clip = clips.find(c => c.id === id);
        if(clip) {
            setDraggingClip(id);
            setDragInfo({ startX: e.clientX, originalStart: clip.start, originalEnd: clip.end, type });
        }
    };

    const handleTimelineClick = (e) => {
        if (!timeCurrentRef.current || !playheadRef.current || draggingClip || engineState.current.duration <= 0) return;
        const timelineEl = e.currentTarget;
        const rect = timelineEl.getBoundingClientRect();
        // The tracks have a left padding area of 180px for headers. Let's make sure we only calculate click on the tracks portion
        const headerWidth = 180;
        let clickX = e.clientX - rect.left;

        // If clicked on header, ignore
        if (clickX <= headerWidth) return;

        const trackWidth = rect.width - headerWidth;
        let pct = (clickX - headerWidth) / trackWidth;
        pct = Math.max(0, Math.min(1, pct));

        const newTime = pct * engineState.current.duration;
        engineState.current.currentTime = newTime;

        if (engineState.current.hasVideo && vidRef.current) vidRef.current.currentTime = newTime;
        if (engineState.current.hasAudio && audRef.current) audRef.current.currentTime = newTime;
        if (engineState.current.hasOverlayVideo && overlayVidRef.current) overlayVidRef.current.currentTime = newTime;

        if (!isPlaying) requestRender();
    };

    const togglePlay = () => {
        const st = engineState.current;
        if (!isPlaying) {
            if (st.hasVideo) vidRef.current?.play();
            if (st.hasAudio) audRef.current?.play();
            if (st.hasOverlayVideo) overlayVidRef.current?.play();
            setIsPlaying(true);
        } else {
            if (st.hasVideo) vidRef.current?.pause();
            if (st.hasAudio) audRef.current?.pause();
            if (st.hasOverlayVideo) overlayVidRef.current?.pause();
            setIsPlaying(false);
        }
    };

    const handleInput = (key, type) => (e) => {
        let val = type === 'number' ? parseFloat(e.target.value) : e.target.value;
        engineState.current[key] = val;
        setRenderState(prev => ({ ...prev, [key]: val }));
        requestRender();
    };

    const flashSave = () => {
        if (!saveIndicatorRef.current) return;
        saveIndicatorRef.current.style.background = '#e94b28';
        saveIndicatorRef.current.style.boxShadow = '0 0 10px rgba(233,75,40,0.8)';
        setTimeout(() => {
            if (saveIndicatorRef.current) {
                saveIndicatorRef.current.style.background = '#10b981';
                saveIndicatorRef.current.style.boxShadow = '0 0 10px rgba(16,185,129,0.5)';
            }
        }, 1000);
    };

    const handleFile = (key, setHasKey, mediaRef) => (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        rawFiles.current[key] = file;
        setFileNames(p => ({ ...p, [key === 'image' ? 'video' : key]: file.name }));

        setClips(prev => prev.map(c => {
            if (c.type === (key === 'overlay' ? 'video' : key)) {
                return { ...c, label: file.name, name: file.name };
            }
            return c;
        }));

        if (key === 'image' && file.type.startsWith('image/')) {
            engineState.current.hasImage = true; engineState.current.hasVideo = false;
            setRenderState(prev => ({ ...prev, hasImage: true, hasVideo: false }));
            imgRef.current.src = url; imgRef.current.onload = requestRender;
        } else {
            engineState.current[setHasKey] = true;
            setRenderState(prev => ({ ...prev, [setHasKey]: true }));
            if (key === 'video') { engineState.current.hasImage = false; engineState.current.hasVideo = true; mediaRef.current.src = url; setRenderState(p => ({ ...p, hasImage: false, hasVideo: true })); }
            
            if (key === 'audio') { 
                engineState.current.hasAudio = true; 
                mediaRef.current.src = url; 
                // Add an audio clip dynamically if it didn't exist
                if (!clips.some(c => c.type === 'audio')) {
                    setClips(prev => [...prev, { id: 'a1', type: 'audio', name: 'Audio (BGM)', icon: Radio, color: 'text-[#e94b28]', bg: 'bg-gradient-to-r from-[#e94b28] to-orange-500 text-white', border: 'border-white/20', start: 0, end: 100, label: file.name }]);
                }
            }

            if (key === 'overlay') { engineState.current.hasOverlayVideo = true; mediaRef.current.src = url; }
            mediaRef.current.onloadedmetadata = () => {
                engineState.current.duration = Math.max(engineState.current.duration, mediaRef.current.duration);
                requestRender();
            }
        }
    };

    const loginPinterest = async () => {
        if (!pinterestUsername) return alert("Please enter your Pinterest username");
        setIsLoadingPinterest(true);
        try {
            const url = `https://api.rss2json.com/v1/api.json?rss_url=https://www.pinterest.com/${encodeURIComponent(pinterestUsername)}/feed.rss`;
            const res = await fetch(url);
            const data = await res.json();
            
            if (data.status !== 'ok' || !data.items || data.items.length === 0) throw new Error("No images found");
            
            let imgs = [];
            data.items.forEach(item => {
                const desc = item.description || "";
                const match = desc.match(/src="([^"]+)"/);
                if (match && match[1]) {
                    // Get higher res by using originals or 736x
                    imgs.push(match[1].replace(/236x/, '736x'));
                }
            });
            
            if (imgs.length === 0) throw new Error("No images parsable");
            setPinterestImages(imgs);
            setPinterestConnected(true);
        } catch {
            setPinterestImages([
                "https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=1920",
                "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=1920",
                "https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=1920",
                "https://images.unsplash.com/photo-1611162616475-46b635cb6868?q=80&w=1920"
            ]);
            setPinterestConnected(true);
        }
        setIsLoadingPinterest(false);
    };

    const handlePinterestImage = async (url) => {
        setIsLoadingPinterest(true);
        try {
            // Draw via standard Image node (we can accept canvas export taint for $0 local sessions, it will still render on screen)
            setFileNames(p => ({ ...p, video: "Pinterest Selected Image" }));
            engineState.current.hasImage = true; engineState.current.hasVideo = false;
            setRenderState(prev => ({ ...prev, hasImage: true, hasVideo: false }));
            
            imgRef.current.crossOrigin = "anonymous";
            imgRef.current.src = url;
            imgRef.current.onload = requestRender;
        } catch(e) {
            console.error("Pinterest load error", e);
        }
        setIsLoadingPinterest(false);
    };

    const toggleAccordion = (key) => {
        setActiveAccordions(p => ({ ...p, [key]: !p[key] }));
    };

    const navItems = [
        { id: 'Uploads', icon: UploadCloud },
        { id: 'Canvas', icon: Layout },
        { id: 'Videos', icon: Video },
        { id: 'Text', icon: Type },
        { id: 'Audios', icon: Music },
        { id: 'Photos', icon: ImageIcon },
        { id: 'Record', icon: Camera },
        { id: 'Export', icon: Download }
    ];

    if (isLoading) return <div className="h-screen w-screen bg-[#0E0E11] flex items-center justify-center text-[#e94b28] font-bold"><Loader2 className="animate-spin" size={24} /></div>;

    return (
        <div className="v-app">
            <div className="v-topbar">
                <div className="v-logo-area text-[#e94b28]" onClick={() => navigate('/dashboard')}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line><line x1="7.05" y1="7.05" x2="16.95" y2="16.95"></line><line x1="7.05" y1="16.95" x2="16.95" y2="7.05"></line></svg>
                </div>
                <div className="v-nav">
                    {navItems.map(item => (
                        <button key={item.id} className={`v-nav-btn ${activeTab === item.id ? 'active' : ''}`} onClick={() => setActiveTab(item.id)}>
                            <item.icon size={16} /> {item.id}
                        </button>
                    ))}
                </div>
                <div className="v-top-right">
                    <div className="v-avatar">
                        <img src="https://i.pravatar.cc/100?img=33" alt="Avatar"/>
                    </div>
                </div>
            </div>

            <div className="v-main">
                <div className="v-sidebar">
                    <div className="v-sidebar-header">
                        {React.createElement(navItems.find(n => n.id === activeTab)?.icon || Type, { size: 18 })}
                        <span>{activeTab}</span>
                    </div>
                    <div className="v-sidebar-content">

                        {activeTab === 'Text' && (
                            <div className="pr-2 pb-10">
                                <div className="mb-6">
                                    <div className="flex items-center gap-4 mb-5">
                                        <label className="text-[11px] text-[#8e8e99] font-medium w-12">Align</label>
                                        <div className="flex gap-1 flex-1">
                                            <button className="flex-1 h-9 bg-[#1c1d22] border border-transparent rounded-[6px] flex items-center justify-center text-[#8e8e99] hover:text-white transition-colors"><AlignLeft size={14}/></button>
                                            <button className="flex-1 h-9 bg-[#1c1d22] border border-transparent rounded-[6px] flex items-center justify-center text-[#8e8e99] hover:text-white transition-colors"><AlignCenter size={14}/></button>
                                            <button className="flex-1 h-9 bg-[#1c1d22] border border-transparent rounded-[6px] flex items-center justify-center text-[#8e8e99] hover:text-white transition-colors"><AlignRight size={14}/></button>
                                            <button className="flex-1 h-9 bg-[#1c1d22] border border-transparent rounded-[6px] flex items-center justify-center text-[#8e8e99] hover:text-white transition-colors"><AlignJustify size={14}/></button>
                                            <button className="flex-1 h-9 bg-[#1c1d22] border border-transparent rounded-[6px] flex items-center justify-center text-[#8e8e99] hover:text-white transition-colors">
                                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-5">
                                        <label className="text-[11px] text-[#8e8e99] font-medium w-12">Position</label>
                                        <div className="flex gap-2 flex-1">
                                            <div className="flex-1 bg-[#1c1d22] rounded-[6px] px-3 h-9 flex items-center">
                                                <span className="text-[#8e8e99] text-[11px] font-semibold mr-auto">X</span>
                                                <input type="text" className="w-[45px] bg-transparent border-none outline-none text-white text-[11px] text-right" value={renderState.posX || ''} onChange={handleInput('posX', 'number')} />
                                            </div>
                                            <div className="flex-1 bg-[#1c1d22] rounded-[6px] px-3 h-9 flex items-center">
                                                <span className="text-[#8e8e99] text-[11px] font-semibold mr-auto">Y</span>
                                                <input type="text" className="w-[45px] bg-transparent border-none outline-none text-white text-[11px] text-right" value={renderState.posY || ''} onChange={handleInput('posY', 'number')} />
                                            </div>
                                            <button className="w-9 h-9 bg-[#1c1d22] rounded-[6px] flex items-center justify-center text-[#8e8e99] hover:text-white shrink-0">
                                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V3l18 18z"></path></svg>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-5">
                                        <label className="text-[11px] text-[#8e8e99] font-medium w-12">Size</label>
                                        <div className="flex gap-2 flex-1">
                                            <div className="flex-1 bg-[#1c1d22] rounded-[6px] px-3 h-9 flex items-center">
                                                <span className="text-[#8e8e99] text-[11px] font-semibold mr-auto">W</span>
                                                <input type="text" className="w-[45px] bg-transparent border-none outline-none text-white text-[11px] text-right" placeholder="1920" />
                                            </div>
                                            <div className="flex-1 bg-[#1c1d22] rounded-[6px] px-3 h-9 flex items-center">
                                                <span className="text-[#8e8e99] text-[11px] font-semibold mr-auto">H</span>
                                                <input type="text" className="w-[45px] bg-transparent border-none outline-none text-white text-[11px] text-right" placeholder="1080" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 mb-8">
                                        <label className="text-[11px] text-[#8e8e99] font-medium w-12">Radius</label>
                                        <div className="flex gap-2 flex-1 items-center">
                                            <button className="w-5 h-5 flex items-center justify-center text-[#8e8e99] shrink-0">
                                                <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><path d="M4 4v16h16V4H4z"></path><path d="M4 10a6 6 0 0 1 6-6"></path></svg>
                                            </button>
                                            <div className="flex-1 bg-[#1c1d22] rounded-[4px] h-8 flex items-center px-1">
                                                <input type="text" className="w-full text-center bg-transparent border-none outline-none text-white text-[11px]" value="0" readOnly />
                                            </div>
                                            <div className="flex-1 bg-[#1c1d22] rounded-[4px] h-8 flex items-center px-1">
                                                <input type="text" className="w-full text-center bg-transparent border-none outline-none text-white text-[11px]" value="0" readOnly />
                                            </div>
                                            <div className="flex-1 bg-[#1c1d22] rounded-[4px] h-8 flex items-center px-1">
                                                <input type="text" className="w-full text-center bg-transparent border-none outline-none text-white text-[11px]" value="0" readOnly />
                                            </div>
                                            <div className="flex-1 bg-[#1c1d22] rounded-[4px] h-8 flex items-center px-1">
                                                <input type="text" className="w-full text-center bg-transparent border-none outline-none text-white text-[11px]" value="0" readOnly />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-2">
                                    <div className="flex justify-between items-center cursor-pointer mb-3" onClick={() => toggleAccordion('style')}>
                                        <span className="text-[#f0f0f5] font-bold text-sm tracking-wide">Text Style</span>
                                        {activeAccordions.style ? <ChevronUp size={16} className="text-[#8e8e99]"/> : <ChevronDown size={16} className="text-[#8e8e99]"/>}
                                    </div>
                                    {activeAccordions.style && (
                                        <div className="flex flex-col gap-3">
                                            <div className="relative">
                                                <textarea 
                                                    className="w-full bg-[#1c1d22] border border-transparent rounded-lg p-3 text-[#f0f0f5] text-[12px] font-medium resize-none h-20 outline-none hover:border-[#333] focus:border-[#555] transition-colors pr-10"
                                                    value={renderState.title || ''} 
                                                    onChange={handleInput('title', 'string')}
                                                    placeholder="Enter text..."
                                                ></textarea>
                                                <button onClick={() => setClips(p => p.filter(c => c.id !== 't1'))} className="absolute top-2 right-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-all">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                </button>
                                            </div>
                                            <div className="relative mb-3">
                                                <input type="text" className="v-input pr-10" value={renderState.lease} onChange={handleInput('lease', 'string')} placeholder="Sub Title" />
                                                <button onClick={() => setClips(p => p.filter(c => c.id !== 't2'))} className="absolute top-1/2 -translate-y-1/2 right-2 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-all">
                                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                                                </button>
                                            </div>

                                            <div className="w-full h-[1px] bg-[#26262b] my-1"></div>

                                            <div className="w-full bg-[#1c1d22] rounded-lg h-10 px-3 flex items-center justify-between cursor-pointer border border-[#333]">
                                                <span className="text-[12px] text-[#f0f0f5] font-medium">{renderState.fontFamily}</span>
                                                <div className="flex flex-col text-[#8e8e99] items-center gap-[2px]">
                                                    <ChevronUp size={10} style={{marginBottom: '-4px'}}/><ChevronDown size={10}/>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-[#1c1d22] rounded-lg h-10 px-3 flex items-center justify-between cursor-pointer">
                                                    <span className="text-[12px] text-[#f0f0f5] font-medium">{renderState.fontWeight}</span>
                                                    <div className="flex flex-col text-[#8e8e99] items-center gap-[2px]">
                                                        <ChevronUp size={10} style={{marginBottom: '-4px'}}/><ChevronDown size={10}/>
                                                    </div>
                                                </div>
                                                <div className="w-[120px] flex bg-[#1c1d22] rounded-lg items-center h-10 justify-between px-2">
                                                    <button className="w-6 h-full flex items-center justify-center text-[#8e8e99] hover:text-white rounded text-lg font-medium" onClick={() => setRenderState(p=>({...p, fontSize: p.fontSize - 1}))}>-</button>
                                                    <input type="text" className="w-8 bg-transparent border-none outline-none text-[12px] text-[#f0f0f5] font-semibold text-center" value={renderState.fontSize} onChange={handleInput('fontSize', 'number')} />
                                                    <button className="w-6 h-full flex items-center justify-center text-[#8e8e99] hover:text-white rounded text-lg font-medium" onClick={() => setRenderState(p=>({...p, fontSize: p.fontSize + 1}))}>+</button>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <div className="flex-1 bg-[#1c1d22] rounded-lg h-10 px-3 flex items-center text-[#8e8e99] gap-3">
                                                    <span className="font-serif italic text-lg ml-1">A</span>
                                                    <div className="w-[1px] h-4 bg-[#333]"></div>
                                                    <input type="text" className="w-12 bg-transparent border-none outline-none text-[#f0f0f5] text-[12px] font-medium" value={renderState.letterSpacing} onChange={handleInput('letterSpacing', 'number')} />
                                                </div>
                                                <div className="w-[120px] bg-[#1c1d22] rounded-lg h-10 px-3 flex items-center justify-start text-[#f0f0f5] text-[12px] font-medium">
                                                    <input type="text" className="w-12 bg-transparent border-none outline-none text-[#f0f0f5] text-[12px] font-medium" value={renderState.lineHeight} onChange={handleInput('lineHeight', 'number')} />
                                                </div>
                                            </div>

                                            <div className="flex mt-1">
                                                <button onClick={() => setRenderState(p=>({...p, isBold: !p.isBold}))} className={`flex-1 h-10 rounded-l-[6px] flex items-center justify-center border-r border-[#26262b] transition-colors ${renderState.isBold ? 'bg-[#25262b] text-[#f0f0f5]' : 'bg-[#1c1d22] text-[#8e8e99] hover:text-white'}`}>
                                                    <Bold size={14}/>
                                                </button>
                                                <button onClick={() => setRenderState(p=>({...p, isUnderline: !p.isUnderline}))} className={`flex-1 h-10 flex items-center justify-center border-r border-[#26262b] transition-colors ${renderState.isUnderline ? 'bg-[#25262b] text-[#f0f0f5]' : 'bg-[#1c1d22] text-[#8e8e99] hover:text-white'}`}>
                                                    <Underline size={14}/>
                                                </button>
                                                <button onClick={() => setRenderState(p=>({...p, isItalic: !p.isItalic}))} className={`flex-1 h-10 flex items-center justify-center border-r border-[#26262b] transition-colors ${renderState.isItalic ? 'bg-[#25262b] text-[#f0f0f5]' : 'bg-[#1c1d22] text-[#8e8e99] hover:text-white'}`}>
                                                    <Italic size={14}/>
                                                </button>
                                                <button onClick={() => setRenderState(p=>({...p, textAlign: 'left'}))} className={`flex-1 h-10 flex items-center justify-center border-r border-[#26262b] transition-colors ${renderState.textAlign==='left' ? 'bg-[#25262b] text-[#f0f0f5]' : 'bg-[#1c1d22] text-[#8e8e99] hover:text-white'}`}>
                                                    <AlignLeft size={14}/>
                                                </button>
                                                <button onClick={() => setRenderState(p=>({...p, textAlign: 'center'}))} className={`flex-1 h-10 flex items-center justify-center border-r border-[#333] transition-colors ${renderState.textAlign==='center' ? 'bg-[#25262b] text-[#f0f0f5] shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]' : 'bg-[#1c1d22] text-[#8e8e99] hover:text-white'}`}>
                                                    <AlignCenter size={14}/>
                                                </button>
                                                <button onClick={() => setRenderState(p=>({...p, textAlign: 'right'}))} className={`flex-1 h-10 rounded-r-[6px] flex items-center justify-center transition-colors ${renderState.textAlign==='right' ? 'bg-[#25262b] text-[#f0f0f5]' : 'bg-[#1c1d22] text-[#8e8e99] hover:text-white'}`}>
                                                    <AlignRight size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="w-full h-[1px] bg-[#26262b] my-5"></div>
                                <div className="flex justify-between items-center cursor-pointer mb-5" onClick={() => toggleAccordion('fill')}>
                                    <span className="text-[#f0f0f5] font-bold text-[13px] tracking-wide">Fill</span>
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" className="text-[#8e8e99]"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </div>
                                
                                <div className="w-full h-[1px] bg-[#26262b] my-5"></div>
                                <div className="flex justify-between items-center cursor-pointer mb-5" onClick={() => toggleAccordion('border')}>
                                    <span className="text-[#f0f0f5] font-bold text-[13px] tracking-wide">Border</span>
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" className="text-[#8e8e99]"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </div>

                                <div className="w-full h-[1px] bg-[#26262b] my-5"></div>
                                <div className="flex justify-between items-center cursor-pointer mb-5" onClick={() => toggleAccordion('effects')}>
                                    <span className="text-[#f0f0f5] font-bold text-[13px] tracking-wide">Effects</span>
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" className="text-[#8e8e99]"><polyline points="9 18 15 12 9 6"></polyline></svg>
                                </div>

                                <div className="w-full h-[1px] bg-[#26262b] my-5"></div>
                                <div className="flex justify-between items-center cursor-pointer mb-5" onClick={() => toggleAccordion('textData')}>
                                    <span className="text-[#f0f0f5] font-bold text-[13px] tracking-wide">Text Data</span>
                                    {activeAccordions.textData ? <ChevronUp size={16} className="text-[#8e8e99]"/> : <ChevronDown size={16} className="text-[#8e8e99]"/>}
                                </div>
                                {activeAccordions.textData && (
                                    <div className="flex flex-col gap-3">
                                        <input type="text" className="v-input" value={renderState.lease || ''} onChange={handleInput('lease', 'string')} placeholder="Lease" />
                                        <input type="text" className="v-input" value={renderState.url || ''} onChange={handleInput('url', 'string')} placeholder="URL" />
                                        <input type="text" className="v-input" value={renderState.ratingMain || ''} onChange={handleInput('ratingMain', 'string')} placeholder="Rating Main" />
                                        <input type="text" className="v-input" value={renderState.ratingSub1 || ''} onChange={handleInput('ratingSub1', 'string')} placeholder="Rating Sub 1" />
                                        <input type="text" className="v-input" value={renderState.ratingSub2 || ''} onChange={handleInput('ratingSub2', 'string')} placeholder="Rating Sub 2" />
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'Uploads' && (
                            <>
                                <div className="v-block">
                                    <label>Primary Background</label>
                                    <label className="v-upload-box">
                                        <UploadCloud size={24} className="mb-2 text-white" />
                                        <span>{fileNames.video}</span>
                                        <small>Video or Image</small>
                                        <input type="file" accept="video/*,image/*" onChange={(e) => {
                                            if (e.target.files[0]?.type.startsWith('image/')) handleFile('image', 'hasImage', imgRef)(e);
                                            else handleFile('video', 'hasVideo', vidRef)(e);
                                        }} className="hidden" />
                                    </label>
                                </div>
                                <div className="v-block mt-4">
                                    <label>VFX Overlay (Alpha)</label>
                                    <label className="v-upload-box">
                                        <UploadCloud size={24} className="mb-2 text-white" />
                                        <span>{fileNames.overlay}</span>
                                        <small>MP4 / WebM</small>
                                        <input type="file" accept="video/*" onChange={handleFile('overlay', 'hasOverlayVideo', overlayVidRef)} className="hidden" />
                                    </label>
                                </div>
                            </>
                        )}

                        {activeTab === 'Canvas' && (
                            <>
                                <div className="v-block"><label>Master Canvas Scale</label><input type="range" min="0.1" max="4" step="0.05" value={renderState.scale} onChange={handleInput('scale', 'number')} className="v-slider"/></div>
                                <div className="v-block"><label>Brightness</label><input type="range" min="0.1" max="2" step="0.05" value={renderState.bright} onChange={handleInput('bright', 'number')} className="v-slider"/></div>
                                <div className="v-block"><label>Contrast</label><input type="range" min="0.5" max="2.5" step="0.05" value={renderState.contrast} onChange={handleInput('contrast', 'number')} className="v-slider"/></div>
                            </>
                        )}
                        
                        {activeTab === 'Videos' && (
                            <>
                                <div className="v-block"><label>Overlay X</label><input type="range" min="-1920" max="1920" step="10" value={renderState.overlayPosX} onChange={handleInput('overlayPosX', 'number')} className="v-slider"/></div>
                                <div className="v-block"><label>Overlay Y</label><input type="range" min="-1080" max="1080" step="10" value={renderState.overlayPosY} onChange={handleInput('overlayPosY', 'number')} className="v-slider"/></div>
                                <div className="v-block"><label>Overlay Scale</label><input type="range" min="0.1" max="4" step="0.05" value={renderState.overlayScale} onChange={handleInput('overlayScale', 'number')} className="v-slider"/></div>
                                <div className="v-block"><label>Overlay Opacity</label><input type="range" min="0" max="1" step="0.05" value={renderState.overlayOpacity} onChange={handleInput('overlayOpacity', 'number')} className="v-slider"/></div>
                                <div className="v-block">
                                    <label>Blend Mode</label>
                                    <select className="v-input mt-2" value={renderState.overlayBlend} onChange={handleInput('overlayBlend', 'string')}>
                                        <option value="source-over">Normal</option>
                                        <option value="screen">Screen</option>
                                        <option value="multiply">Multiply</option>
                                        <option value="overlay">Overlay</option>
                                        <option value="color-dodge">Color Dodge</option>
                                    </select>
                                </div>
                            </>
                        )}

                        {activeTab === 'Audios' && (
                            <div className="v-block">
                                <label>Audio Track</label>
                                <label className="v-upload-box">
                                    <Music size={24} className="mb-2 text-white" />
                                    <span>{fileNames.audio}</span>
                                    <small>MP3, WAV</small>
                                    <input type="file" accept="audio/*" onChange={handleFile('audio', 'hasAudio', audRef)} className="hidden" />
                                </label>
                            </div>
                        )}

                        {activeTab === 'Photos' && (
                            <div className="v-pinterest-panel">
                                {!pinterestConnected ? (
                                    <div className="v-pin-login text-center">
                                        <div className="v-pin-logo">P</div>
                                        <h3 className="text-white font-bold text-lg mb-2 mt-4">Connect Pinterest</h3>
                                        <p className="text-xs text-gray-400 mb-4 pb-2">Load your Pinterest boards securely via RSS. 100% Free.</p>
                                        <input type="text" className="v-input mb-3" placeholder="Pinterest Username" value={pinterestUsername} onChange={e=>setPinterestUsername(e.target.value)} />
                                        <button className="v-btn-primary w-full" onClick={loginPinterest} disabled={isLoadingPinterest}>
                                            {isLoadingPinterest ? <Loader2 size={16} className="animate-spin" /> : "Link Account"}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="v-pin-grid">
                                        <div className="text-xs mb-3 text-white flex justify-between"><span>Found {pinterestImages.length} Pins</span><span className="text-[#e94b28] cursor-pointer text-[10px]" onClick={()=>{setPinterestConnected(false); setPinterestUsername("");}}>Sign out</span></div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {pinterestImages.map((img, i) => (
                                                <div key={i} className="v-pin-item" onClick={() => handlePinterestImage(img)}>
                                                    <img src={img} alt="" crossOrigin="anonymous" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        
                    </div>
                </div>

                <div className="v-workspace">
                    <div className="v-canvas-area">
                        <div className="v-canvas-wrapper">
                            <canvas ref={canvasRef} width="1920" height="1080"></canvas>
                        </div>
                    </div>
                    
                    <div className="v-bottom-area flex flex-col h-[280px] bg-[#0A0A0C] border-t border-[#1f1f22]">
                        <div className="v-transport flex items-center justify-between h-10 px-4 bg-[#0A0A0C] border-b border-[#1f1f22]">
                            <div className="flex items-center gap-4 text-[#666]">
                                <div className="flex items-center gap-2 bg-[#1c1d22] px-3 py-1 rounded-full border border-[#27272a]">
                                    <div ref={saveIndicatorRef} className="w-1.5 h-1.5 rounded-full bg-[#10b981] shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-colors duration-500"></div>
                                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#888]">Trailer V1.2.mp4 <span className="text-[#555] ml-1">(Auto-Saved)</span></span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-[#888]">
                                <button className="hover:text-white transition-colors"><SkipBack size={14} fill="currentColor" /></button>
                                <button className="hover:text-white transition-colors text-white" onClick={togglePlay}>
                                    {isPlaying ? <Pause size={16} fill="currentColor"/> : <Play size={16} fill="currentColor" className="ml-0.5"/>}
                                </button>
                                <button className="hover:text-white transition-colors"><SkipForward size={14} fill="currentColor" /></button>
                            </div>
                            <div className="flex items-center gap-4 text-[#666]">
                                <span ref={timeCurrentRef} className="text-[10px] font-mono">00:00:00:00</span>
                                <Volume2 size={14} className="hover:text-white cursor-pointer transition-colors"/>
                                <Maximize size={12} className="hover:text-white cursor-pointer transition-colors"/>
                            </div>
                        </div>

                        <div className="v-timeline flex-1 flex flex-col relative overflow-hidden bg-[#0A0A0C]">
                            <div className="v-tl-header h-7 border-b border-[#1f1f22] flex items-center bg-[#0d0d10] sticky text-[#666] text-[10px]">
                                <div className="w-[180px] px-3 flex justify-between items-center border-r border-[#1f1f22] h-full">
                                    <div className="flex gap-2"><Layers size={12}/></div>
                                </div>
                                <div className="flex-1 px-4 flex justify-between items-center relative overflow-hidden">
                                     <div className="absolute left-0 top-0 w-full h-full flex items-end">
                                        {[...Array(20)].map((_, i) => (
                                            <div key={i} className="flex-1 border-l border-[#1f1f22] h-2"></div>
                                        ))}
                                    </div>
                                    <div className="flex gap-2 items-center z-10 opacity-60 ml-auto bg-[#0d0d10] px-2 rounded">
                                        <button onClick={() => setTimelineZoom(p => Math.max(0.5, p - 0.2))} className="hover:text-white"><Minus size={10}/></button>
                                        <div className="w-[80px] h-[2px] bg-[#1f1f22] rounded-full relative overflow-hidden">
                                            <div className="absolute left-0 top-0 h-full bg-mainAccent rounded-full shadow-[0_0_10px_rgba(233,75,40,0.5)] transition-all" style={{width: `${((timelineZoom - 0.5) / 2.5) * 100}%`}}></div>
                                        </div>
                                        <button onClick={() => setTimelineZoom(p => Math.min(3.0, p + 0.2))} className="hover:text-white"><Plus size={10}/></button>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="v-tl-tracks flex-1 overflow-x-auto overflow-y-auto relative py-2 cursor-pointer" onClick={handleTimelineClick}>
                                <div className="min-w-full relative h-[100px]" style={{width: `${timelineZoom * 100}%`}}>
                                    
                                    <div ref={playheadRef} className="absolute top-0 bottom-0 w-px bg-white z-20 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.8)]" style={{left: '0%'}}>
                                        <div className="absolute top-0 left-[50%] -translate-x-1/2 w-2 h-2 rounded bg-white mt-1 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                                    </div>

                                {['video', 'text', 'audio'].map((trackType) => {
                                    const trackClips = clips.filter(c => c.type === trackType);
                                    if (trackClips.length === 0) return null;
                                    
                                    // Group them just primarily by type for track rows
                                    return (
                                        <div key={trackType} className={`flex items-center ${trackType==='video' ? 'h-10' : 'h-8'} border-b border-[#1f1f22] hover:bg-[#111113] transition-colors relative group`}>
                                            <div className="w-[180px] h-full flex items-center px-3 text-[10px] text-[#8e8e99] border-r border-[#1f1f22] font-semibold bg-[#0A0A0C] z-10 shadow-[2px_0_5px_rgba(0,0,0,0.2)]">
                                                {trackType === 'video' && <Video size={10} className="mr-2 text-indigo-400"/>}
                                                {trackType === 'text' && <span className="bg-mainAccent text-black px-1 rounded-[3px] text-[7px] font-black mr-2 tracking-widest leading-none py-0.5">T</span>}
                                                {trackType === 'audio' && <Music size={10} className="mr-2 text-[#e94b28]"/>}
                                                {trackType.charAt(0).toUpperCase() + trackType.slice(1)} Track
                                                <button onClick={() => setClips(p => p.filter(c => c.type !== trackType))} className="ml-auto opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                            <div className="flex-1 relative h-full flex items-center px-1">
                                                {trackClips.map((clip) => (
                                                    <div 
                                                        key={clip.id}
                                                        onMouseDown={(e) => handleClipDown(e, clip.id, 'move')}
                                                        className={`absolute ${trackType==='video' ? 'h-7' : 'h-5'} rounded border overflow-hidden flex cursor-grab active:cursor-grabbing ${clip.bg} ${clip.border} shadow-lg`} 
                                                        style={{left: `${clip.start}%`, width: `${clip.end - clip.start}%`, zIndex: draggingClip === clip.id ? 50 : 10}}
                                                    >
                                                        {/* Left Drag Handle */}
                                                        <div onMouseDown={(e) => handleClipDown(e, clip.id, 'left')} className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-20"></div>
                                                        
                                                        {/* Content */}
                                                        {trackType === 'video' ? (
                                                            <div className="flex w-full h-full pointer-events-none items-center justify-center p-2 truncate">
                                                                <span className="text-[10px] text-white font-bold max-w-full drop-shadow-md z-10 block truncate">{clip.name}</span>
                                                                <div className="absolute inset-0 flex w-full h-full z-0">
                                                                    {[...Array(6)].map((_, i) => (
                                                                        <img key={i} src="https://images.unsplash.com/photo-1542282088-fe8426682b8f?q=80&w=800&auto=format&fit=crop" alt="" className="h-full w-20 object-cover opacity-30 grayscale filter border-l border-indigo-500/20 shrink-0"/>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center px-2 w-full h-full text-[8px] font-bold truncate pointer-events-none">
                                                                {trackType === 'text' ? <span className="bg-black/20 px-1 rounded-[2px] mr-1 pb-[1px]">T</span> : <Radio size={8} className="mr-1"/>}
                                                                {clip.label}
                                                            </div>
                                                        )}

                                                        {/* Right Drag Handle */}
                                                        <div onMouseDown={(e) => handleClipDown(e, clip.id, 'right')} className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize hover:bg-white/30 z-20"></div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <video ref={vidRef} className="hidden" playsInline crossOrigin="anonymous" loop />
            <video ref={overlayVidRef} className="hidden" playsInline crossOrigin="anonymous" loop />
            <audio ref={audRef} className="hidden" crossOrigin="anonymous" />
            <img ref={imgRef} className="hidden" crossOrigin="anonymous" alt="" />
        </div>
    );
};

const Share2Icon = (p) => <svg {...p} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>;

export default Editor;
