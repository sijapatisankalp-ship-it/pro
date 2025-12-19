
import React, { useState, useEffect } from 'react';
import { 
  analyzeProductImage, 
  generateLifestyleImage, 
  generateProductVideo,
  writeViralScript, 
  ideateBRoll 
} from './services/geminiService';
import { ProductAnalysis, LoadingState, CreativeAssets } from './types';
import { Button } from './components/Button';
import { Toast } from './components/Toast';

const SAMPLE_IMAGE = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=1000";

const App: React.FC = () => {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>("Initializing...");
  const [credits, setCredits] = useState<number>(3);
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  
  const [assets, setAssets] = useState<CreativeAssets>({
    originalImage: null,
    lifestyleImage: null,
    tiktokScript: null,
    bRollConcepts: null,
    productVideoUrl: null
  });
  const [loading, setLoading] = useState<LoadingState>({
    analyzing: false,
    generatingImage: false,
    writingScript: false,
    ideatingBRoll: false,
    generatingVideo: false
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setOriginalImage(base64);
        handleAnalysis(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSampleLoad = async () => {
    if (credits <= 0) {
      setShowUpgradeModal(true);
      return;
    }
    try {
      setLoading(prev => ({ ...prev, analyzing: true }));
      const response = await fetch(SAMPLE_IMAGE);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setOriginalImage(base64);
        handleAnalysis(base64);
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      showToast("Failed to load sample image.");
    }
  };

  const handleAnalysis = async (image: string) => {
    setLoading(prev => ({ ...prev, analyzing: true }));
    try {
      const result = await analyzeProductImage(image);
      setAnalysis(result);
      setCredits(prev => Math.max(0, prev - 1));
      showToast("Analysis complete! 1 credit used.");
    } catch (error) {
      showToast("Analysis failed. Try another image.");
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, analyzing: false }));
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  const onGenerateVideo = async () => {
    // Video is a Pro feature
    // @ts-ignore
    const hasKey = window.aistudio && (await window.aistudio.hasSelectedApiKey());
    
    if (!hasKey) {
      setShowUpgradeModal(true);
      return;
    }

    if (!originalImage || !analysis) return;

    setLoading(prev => ({ ...prev, generatingVideo: true }));
    try {
      const result = await generateProductVideo(originalImage, analysis, setVideoStatus);
      setAssets(prev => ({ ...prev, productVideoUrl: result }));
      showToast("Campaign video generated!");
    } catch (error: any) {
      if (error?.message?.includes("Requested entity was not found")) {
        showToast("Session expired. Please re-link your key.");
        setShowUpgradeModal(true);
      } else {
        showToast("Video generation failed.");
      }
      console.error(error);
    } finally {
      setLoading(prev => ({ ...prev, generatingVideo: false }));
    }
  };

  const handleUpgrade = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setShowUpgradeModal(false);
      showToast("Pro features unlocked!");
      // Reset credits for simulation
      setCredits(99);
    }
  };

  const onGenerateImage = async () => {
    if (!originalImage || !analysis) return;
    setLoading(prev => ({ ...prev, generatingImage: true }));
    try {
      const result = await generateLifestyleImage(originalImage, analysis);
      setAssets(prev => ({ ...prev, lifestyleImage: result }));
      showToast("Lifestyle photo generated!");
    } catch (error) {
      showToast("Failed to generate image.");
    } finally {
      setLoading(prev => ({ ...prev, generatingImage: false }));
    }
  };

  const onWriteScript = async () => {
    if (!analysis) return;
    setLoading(prev => ({ ...prev, writingScript: true }));
    try {
      const result = await writeViralScript(analysis);
      setAssets(prev => ({ ...prev, tiktokScript: result }));
      showToast("Viral script ready!");
    } catch (error) {
      showToast("Failed to write script.");
    } finally {
      setLoading(prev => ({ ...prev, writingScript: false }));
    }
  };

  const onIdeateBRoll = async () => {
    if (!analysis) return;
    setLoading(prev => ({ ...prev, ideatingBRoll: true }));
    try {
      const result = await ideateBRoll(analysis);
      setAssets(prev => ({ ...prev, bRollConcepts: result }));
      showToast("B-roll concepts created!");
    } catch (error) {
      showToast("Failed to ideate B-roll.");
    } finally {
      setLoading(prev => ({ ...prev, ideatingBRoll: false }));
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!");
  };

  return (
    <div className="max-w-[1600px] mx-auto p-4 md:p-8">
      <Toast 
        message={toastMessage || ""} 
        isVisible={!!toastMessage} 
        onClose={() => setToastMessage(null)} 
      />

      {/* PRO UPGRADE MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 transition-all">
          <div className="bg-slate-900 border border-white/10 rounded-[40px] max-w-lg w-full p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] -mr-32 -mt-32"></div>
            <button 
              onClick={() => setShowUpgradeModal(false)}
              className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                  <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-white mb-2">Unlock Pro Features</h2>
              <p className="text-slate-400 text-sm">Advanced video generation and unlimited assets require a paid API key.</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Hero Video Generation</p>
                  <p className="text-xs text-slate-500">Access to Veo 3.1 high-fidelity video engine.</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 opacity-80">
                <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Unlimited Credits</p>
                  <p className="text-xs text-slate-500">No more daily usage limits on AI analysis.</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button onClick={handleUpgrade} variant="primary" className="w-full py-4 text-md">
                Link Paid API Key
              </Button>
              <div className="text-center">
                <a 
                  href="https://ai.google.dev/gemini-api/docs/billing" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 transition-colors"
                >
                  View Billing Documentation
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
             <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M14.615 1.595a.75.75 0 01.359.852L12.972 9h5.278a.75.75 0 01.547 1.265l-9.25 9.5a.75.75 0 01-1.182-.906L10.366 12H5.122a.75.75 0 01-.548-1.262l9.25-9.25a.75.75 0 01.791-.143z" clipRule="evenodd" />
                </svg>
             </div>
             <h1 className="text-4xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white via-indigo-300 to-purple-400">
              VIRAL LAB
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-slate-400 font-medium">AI-First Creative Suite for Modern E-Commerce.</p>
            <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-full flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${credits > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{credits} Credits Left</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!originalImage && (
            <Button variant="outline" onClick={handleSampleLoad} className="border-indigo-500/30 text-indigo-300">
              Try Sample Product
            </Button>
          )}
          {originalImage && (
            <Button variant="secondary" onClick={() => {
              setOriginalImage(null);
              setAnalysis(null);
              setAssets({ originalImage: null, lifestyleImage: null, tiktokScript: null, bRollConcepts: null, productVideoUrl: null });
            }}>New Campaign</Button>
          )}
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8">
        <aside className="space-y-6">
          <section className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-6 shadow-2xl overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] -mr-10 -mt-10"></div>
            
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white">
              <span className="w-1.5 h-6 rounded-full bg-indigo-500"></span>
              Input
            </h2>
            
            <div className="relative group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className={`
                border-2 border-dashed rounded-3xl p-6 text-center transition-all duration-500 relative overflow-hidden
                ${originalImage ? 'border-indigo-500/50 bg-indigo-500/5' : 'border-slate-800 hover:border-indigo-500/40 hover:bg-white/5'}
              `}>
                {originalImage ? (
                  <div className="relative group overflow-hidden rounded-2xl">
                    <img src={originalImage} alt="Uploaded" className="object-cover w-full aspect-square scale-100 group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                      <p className="text-xs font-bold uppercase tracking-widest text-indigo-400">Replace Image</p>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-3xl bg-slate-800/50 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-bold text-slate-100">Upload Product</p>
                      <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Studio Lighting Recommended</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {originalImage && (
              <div className="mt-6 space-y-3">
                <div className="relative">
                  <Button onClick={onGenerateVideo} loading={loading.generatingVideo} disabled={!analysis} variant="primary" className="w-full text-sm py-4 bg-gradient-to-r from-pink-600 to-purple-600">
                    Generate Hero Video
                  </Button>
                  <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-white text-slate-900 text-[8px] font-black rounded uppercase tracking-tighter">PRO</div>
                </div>
                <Button onClick={onGenerateImage} loading={loading.generatingImage} disabled={!analysis} className="w-full text-sm py-3 bg-slate-800 hover:bg-slate-700">
                  Lifestyle Photo
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={onWriteScript} loading={loading.writingScript} variant="secondary" disabled={!analysis} className="text-xs py-3">
                    Viral Script
                  </Button>
                  <Button onClick={onIdeateBRoll} loading={loading.ideatingBRoll} variant="outline" disabled={!analysis} className="text-xs py-3">
                    B-Roll
                  </Button>
                </div>
              </div>
            )}
          </section>

          <section className={`
            bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[32px] p-6 shadow-2xl transition-all duration-700
            ${analysis ? 'opacity-100 translate-y-0 scale-100' : 'opacity-30 translate-y-4 scale-95 pointer-events-none'}
          `}>
            <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white">
              <span className="w-1.5 h-6 rounded-full bg-purple-500"></span>
              Intel
            </h2>
            
            {loading.analyzing ? (
              <div className="space-y-4 py-2">
                <div className="h-4 w-full shimmer rounded-full opacity-50"></div>
                <div className="h-4 w-4/5 shimmer rounded-full opacity-30"></div>
                <div className="h-20 w-full shimmer rounded-2xl opacity-20"></div>
              </div>
            ) : analysis ? (
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-1.5">Product Identity</label>
                  <p className="text-white font-bold text-lg">{analysis.productName}</p>
                  <p className="text-indigo-400 text-xs font-medium mt-0.5">{analysis.productType}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-2">Palette</label>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.primaryColors.map(c => (
                        <span key={c} className="px-2 py-0.5 bg-slate-800 rounded text-[10px] text-slate-300 font-bold border border-white/5">{c}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-2">Materials</label>
                    <div className="flex flex-wrap gap-1.5">
                      {analysis.materials.map(m => (
                        <span key={m} className="px-2 py-0.5 bg-indigo-500/10 rounded text-[10px] text-indigo-400 font-bold border border-indigo-500/10">{m}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black block mb-2">Core Persona</label>
                  <div className="p-4 rounded-2xl bg-slate-800/30 border border-white/5 text-[13px] leading-relaxed text-slate-300 italic">
                    "{analysis.targetAudience}"
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 font-bold text-center py-4">WAITING FOR UPLOAD</p>
            )}
          </section>
        </aside>

        <div className="space-y-8 pb-20">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden flex flex-col shadow-2xl xl:row-span-2">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-pink-500/5 to-purple-500/5">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M4.5 4.5a3 3 0 00-3 3v9a3 3 0 003 3h15a3 3 0 003-3v-9a3 3 0 00-3-3h-15zm3.75 3a.75.75 0 100 1.5.75.75 0 000-1.5zM3.75 14.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0zm15.75-5.25a.75.75 0 100 1.5.75.75 0 000-1.5zM18.75 14.25a.75.75 0 111.5 0 .75.75 0 01-1.5 0z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">Veo Hero Video</h3>
                </div>
                {assets.productVideoUrl && (
                  <a href={assets.productVideoUrl} download="product-hero.mp4" className="text-[10px] font-black uppercase tracking-widest text-pink-400 hover:text-pink-300 transition-colors">Download MP4</a>
                )}
              </div>
              <div className="flex-1 min-h-[600px] flex items-center justify-center relative bg-black/20">
                {loading.generatingVideo ? (
                  <div className="text-center p-12 space-y-6">
                    <div className="relative w-24 h-24 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-slate-800"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin"></div>
                    </div>
                    <div>
                        <p className="text-sm font-bold text-indigo-400 animate-pulse uppercase tracking-[0.2em]">{videoStatus}</p>
                        <p className="text-[10px] text-slate-500 mt-2 italic max-w-xs mx-auto">High-quality video synthesis in progress. This process takes approximately 2-3 minutes.</p>
                    </div>
                  </div>
                ) : assets.productVideoUrl ? (
                  <video 
                    src={assets.productVideoUrl} 
                    controls 
                    autoPlay 
                    loop 
                    className="w-full h-full max-h-[800px] object-contain rounded-2xl"
                  />
                ) : (
                  <div className="text-center space-y-4 opacity-20">
                    <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-700 mx-auto flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.91 11.672a.375.375 0 010 .656l-5.603 3.113a.375.375 0 01-.557-.328V8.887c0-.286.307-.466.557-.327l5.603 3.112z" />
                      </svg>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest">Video Engine Offline</p>
                    <Button onClick={() => setShowUpgradeModal(true)} variant="outline" className="text-[10px] py-2 px-4 border-slate-800 text-slate-500">Unlock Pro</Button>
                  </div>
                )}
              </div>
            </div>

            {/* Lifestyle Image Output */}
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">Lifestyle Asset</h3>
                </div>
              </div>
              <div className="flex-1 min-h-[350px] flex items-center justify-center relative p-8">
                {loading.generatingImage ? (
                  <div className="w-full h-full shimmer rounded-3xl opacity-50"></div>
                ) : assets.lifestyleImage ? (
                  <img src={assets.lifestyleImage} alt="Lifestyle" className="rounded-3xl shadow-2xl max-h-[300px] w-auto border border-white/10" />
                ) : (
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-20">Image Sandbox</p>
                )}
              </div>
            </div>

            {/* TikTok Script Output */}
            <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                      <path d="M11.644 1.59a.75.75 0 01.712 0l9.75 5.25a.75.75 0 010 1.32l-9.75 5.25a.75.75 0 01-.712 0l-9.75-5.25a.75.75 0 010-1.32l9.75-5.25z" />
                      <path d="M3.265 10.602l7.667 4.13a1.5 1.5 0 001.432 0l7.667-4.13a.75.75 0 01.711 1.32l-7.667 4.13a3 3 0 01-2.864 0l-7.667-4.13a.75.75 0 01.711-1.32zm0 3.75l7.667 4.13a1.5 1.5 0 001.432 0l7.667-4.13a.75.75 0 01.711 1.32l-7.667 4.13a3 3 0 01-2.864 0l-7.667-4.13a.75.75 0 01.711-1.32z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-200">Viral Script</h3>
                </div>
              </div>
              <div className="flex-1 p-6 overflow-y-auto max-h-[350px]">
                {loading.writingScript ? (
                  <div className="space-y-4 opacity-40">
                    <div className="h-3 w-full shimmer rounded-full"></div>
                    <div className="h-3 w-3/4 shimmer rounded-full"></div>
                  </div>
                ) : assets.tiktokScript ? (
                  <div className="font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-wrap bg-slate-800/20 p-5 rounded-[24px] border border-white/5">
                    {assets.tiktokScript}
                  </div>
                ) : (
                   <p className="text-[10px] text-center font-bold uppercase tracking-widest opacity-20 py-20">Script Sandbox</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[40px] p-8 shadow-2xl">
            <h2 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-3 text-slate-200">
              <span className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" clipRule="evenodd" />
                </svg>
              </span>
              Supplement B-Roll (Veo Prompts)
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loading.ideatingBRoll ? (
                [1,2,3].map(i => (
                  <div key={i} className="h-32 shimmer rounded-3xl opacity-10"></div>
                ))
              ) : assets.bRollConcepts ? (
                assets.bRollConcepts.map((concept, idx) => (
                  <div key={idx} className="bg-slate-800/20 border border-white/5 p-6 rounded-[28px] relative group hover:border-indigo-500/30 transition-all duration-300">
                    <div className="absolute -top-3 left-6 bg-slate-800 text-slate-400 border border-white/5 text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">Scene 0{idx + 1}</div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed font-medium">"{concept}"</p>
                    <button 
                      onClick={() => copyToClipboard(concept)}
                      className="mt-6 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-400 flex items-center gap-2 transition-all opacity-40 group-hover:opacity-100"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 01-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75" />
                      </svg>
                      Copy Prompt
                    </button>
                  </div>
                ))
              ) : (
                <div className="col-span-full border border-dashed border-slate-800 rounded-3xl p-16 text-center opacity-10">
                  <p className="text-xs font-black uppercase tracking-[0.2em]">Cinematics Module Offline</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-20 py-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black tracking-[0.3em] text-slate-600 uppercase">
        <div className="flex items-center gap-6">
          <span className="text-slate-500">VIRAL CREATIVE LAB</span>
          <span className="w-1 h-1 rounded-full bg-slate-800"></span>
          <span>EST. 2025</span>
        </div>
        <div className="flex items-center gap-6">
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="hover:text-indigo-400 transition-colors">Billing Docs</a>
          <a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a>
          <div className="flex items-center gap-2 text-indigo-500/50">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
            VEO ENGINE READY
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
