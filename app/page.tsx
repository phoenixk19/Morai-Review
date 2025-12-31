"use client";
import React, { useState, useEffect } from 'react';

interface Review {
  id: string;
  name: string;
  comment: string;
  audio?: string | null;
}

export default function MoraiReviewPage() {
  const [reviews, setReviews] = useState<Review[]>([]);

  const [formData, setFormData] = useState({ name: '', comment: '' });
  const [isListening, setIsListening] = useState(false);

  // --- Voice Recognition Logic ---
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [chunks, setChunks] = useState<BlobPart[]>([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioPreview, setAudioPreview] = useState<string | null>(null); // data URL

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Your browser does not support voice recognition. Please try Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US'; // සිංහල ඕනේ නම් 'si-LK' දාන්න පුළුවන්
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFormData(prev => ({ ...prev, comment: prev.comment + " " + transcript }));
    };

    recognition.start();
  };

  // --- Audio recording (optional) ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      setChunks([]);
      mr.ondataavailable = (e) => setChunks(prev => [...prev, e.data]);
      mr.onstop = () => {
        // stop tracks
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setMediaRecorder(mr);
      setIsListening(true);
  setRecordingSeconds(0);
    } catch (err) {
      alert('Unable to access microphone');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder) return;
    mediaRecorder.stop();
    setMediaRecorder(null);
    setIsListening(false);
  };

  const getRecordedDataUrl = async () => {
    if (chunks.length === 0) return null;
    const blob = new Blob(chunks, { type: 'audio/webm' });
    // create preview as side-effect
    const preview = URL.createObjectURL(blob);
    setAudioPreview(preview);
    return await new Promise<string>((res) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result as string);
      reader.readAsDataURL(blob);
    });
  };

  // (file upload removed) — audio comes from recording only

  // Create data URL on demand if we have chunks but no preview
  useEffect(() => {
    (async () => {
      if (chunks.length > 0 && !audioPreview) {
        const data = await getRecordedDataUrl();
        if (data) setAudioPreview(data);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chunks]);

  // recording timer
  useEffect(() => {
    let timer: number | undefined;
    if (mediaRecorder) {
      timer = window.setInterval(() => setRecordingSeconds(s => s + 1), 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [mediaRecorder]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      // include audio if recorded
      const audioData = await getRecordedDataUrl();
      const payload = { ...formData, audio: audioData };
      try {
        const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (!res.ok) throw new Error('Failed to save');
        const saved = await res.json();
        setReviews(prev => [{ id: saved.id, name: saved.name, comment: saved.comment, audio: saved.audio }, ...prev]);
        setFormData({ name: '', comment: '' });
        setChunks([]);
        setAudioPreview(null);
        if (mediaRecorder) {
          try { mediaRecorder.stop(); } catch {}
          setMediaRecorder(null);
        }
      } catch (err) {
        alert('Unable to save review');
      }
    })();
  };

  useEffect(() => {
    // fetch reviews from API
    (async () => {
      try {
        const res = await fetch('/api/reviews');
        if (!res.ok) return;
        const items: Review[] = await res.json();
        setReviews(items);
      } catch (e) {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#010816] text-white py-10 md:py-16 px-4 md:px-6 flex flex-col items-center overflow-x-hidden font-sans">
      
      {/* --- Main Topic Section --- */}
  <div className="text-center mb-16 md:mb-24 mt-5 md:mt-10 w-full transition-all duration-700 transform">
        <h2 className="text-sm md:text-xl font-light tracking-[0.4em] md:tracking-[0.6em] text-cyan-400 uppercase mb-2 md:mb-4">
          Future World for
        </h2>
        
        <h1 className="text-5xl sm:text-7xl md:text-[12rem] font-black uppercase italic leading-none flex justify-center items-center">
          <span className="bg-gradient-to-r from-blue-500 via-cyan-300 via-green-300 to-cyan-400 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(0,255,255,0.6)] px-2 md:px-4">
            MORAI
          </span>
        </h1>

      <div className="relative mt-4 md:mt-8">
          <div className="h-[2px] w-40 md:w-80 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
        </div>
    </div>

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 md:gap-12">
        
        {/* --- Left: Submit Form --- */}
        <div className="lg:col-span-5 order-2 lg:order-1">
          <div className="lg:sticky lg:top-10 bg-white/5 p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 backdrop-blur-2xl shadow-2xl transition-all">
            <h3 className="text-xl md:text-2xl font-bold mb-6 tracking-tight text-white uppercase italic">What do you suggest for future of Morai</h3>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              <div className="space-y-2">
                <label className="text-xs text-cyan-400 ml-1 uppercase tracking-widest font-semibold">Your Name</label>
                <input 
                  type="text" placeholder="Full Name" required 
                  className="w-full bg-black/50 border border-white/10 p-3 md:p-4 rounded-xl focus:border-cyan-500 outline-none transition text-white"
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-cyan-400 ml-1 uppercase tracking-widest font-semibold">Message</label>
                <div className="relative">
                  <textarea 
                    placeholder="Tell us what you think..." required 
                    className="w-full bg-black/50 border border-white/10 p-3 md:p-4 rounded-xl h-32 md:h-40 focus:border-blue-500 outline-none transition text-white pr-14"
                    value={formData.comment} onChange={(e) => setFormData({...formData, comment: e.target.value})}
                  />

                  {/* Speak-to-type button placed bottom-right of textarea */}
                  <button onClick={handleVoiceInput} type="button" title="Speak to type" className={`absolute right-3 bottom-3 p-2 rounded-full transition-all ${isListening ? 'bg-red-500 animate-pulse' : 'bg-cyan-600 hover:bg-cyan-500'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>
                  </button>
                </div>

                {/* Recording controls (stacked) */}
                <div className="mt-3">
                  <div className="flex items-center gap-2">
                    {!mediaRecorder ? (
                      <button onClick={startRecording} type="button" className="flex items-center gap-2 p-2 rounded-full bg-emerald-500 hover:bg-emerald-400" title="Start recording">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v6"/><path d="M12 15v8"/><rect x="9" y="3" width="6" height="10" rx="3" ry="3"/></svg>
                        <span className="text-xs">Voice message</span>
                      </button>
                    ) : (
                      <button onClick={stopRecording} type="button" className="p-2 rounded-full bg-red-600 hover:bg-red-500" title="Stop recording">Stop</button>
                    )}
                    {mediaRecorder ? <div className="text-xs text-gray-300">Recording: {Math.floor(recordingSeconds/60).toString().padStart(2,'0')}:{(recordingSeconds%60).toString().padStart(2,'0')}</div> : null}
                  </div>

                  {/* full-width preview */}
                  {audioPreview ? (
                    <div className="mt-3 w-full">
                      <audio src={audioPreview} controls className="w-full" />
                      <div className="mt-2 flex gap-2">
                        <button type="button" onClick={() => { setAudioPreview(null); setChunks([]); }} className="text-xs px-2 py-1 bg-red-600 rounded">Remove</button>
                        <button type="button" onClick={() => { setChunks([]); setAudioPreview(null); startRecording(); }} className="text-xs px-2 py-1 bg-yellow-600 rounded">Re-record</button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 py-3 md:py-4 rounded-xl font-black tracking-[0.2em] uppercase hover:brightness-110 transition-all shadow-[0_0_20px_rgba(0,180,255,0.3)]"
              >
                Submit Review
              </button>
            </form>
          </div>
        </div>

        {/* --- Right: Reviews List --- */}
        <div className="lg:col-span-7 order-1 lg:order-2">
          <h3 className="text-sm md:text-xl font-light tracking-[0.3em] text-gray-400 uppercase mb-6 md:mb-8 ml-2">Recent Reviews</h3>
          
          <div className="space-y-4 md:space-y-6">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] bg-white/5 border border-white/10 relative group hover:bg-white/[0.08] transition-all"
              >
                  <div className="flex justify-between items-start mb-4 md:mb-6">
                    <h4 className="font-bold text-lg md:text-xl text-white group-hover:text-cyan-400 transition-colors uppercase tracking-tight">{rev.name}</h4>
                    <span className="text-[9px] md:text-[10px] text-cyan-500 uppercase tracking-widest font-bold border border-cyan-500/30 px-2 md:px-3 py-1 rounded-full">Community</span>
                  </div>
                  
                  <p className="text-gray-300 italic leading-relaxed text-base md:text-lg font-light">"{rev.comment}"</p>
                  {rev.audio ? (
                    <div className="mt-4">
                      <audio src={rev.audio} controls className="w-full mt-2" />
                    </div>
                  ) : null}
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Background Decor */}
      <div className="fixed top-1/4 -left-20 w-64 md:w-96 h-64 md:h-96 bg-blue-600/10 blur-[100px] md:blur-[120px] rounded-full -z-10"></div>
    </div>
  );
}