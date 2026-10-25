import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, FileCheck, Sparkles } from 'lucide-react';

export const ImageDropzone = ({ onFileSelected, previewUrl, onClear, sampleType = 'safety' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndPass = (file) => {
    setErrorMsg('');
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMsg('Please upload a valid JPG, PNG, or WEBP image.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image file size exceeds 15MB limit.');
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndPass(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndPass(e.target.files[0]);
    }
  };

  // Helper to load a realistic synthetic canvas sample image with 1-click
  const handleLoadSample = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');

    if (sampleType === 'crack') {
      // Draw simulated concrete wall with crack
      ctx.fillStyle = '#78716c'; // concrete base
      ctx.fillRect(0, 0, 640, 480);
      // subtle concrete texture
      for (let i = 0; i < 3000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? '#57534e' : '#a8a29e';
        ctx.fillRect(Math.random() * 640, Math.random() * 480, 2, 2);
      }
      // draw shear crack line
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(180, 80);
      ctx.lineTo(260, 180);
      ctx.lineTo(310, 260);
      ctx.lineTo(440, 390);
      ctx.stroke();
      // branching crack
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(260, 180);
      ctx.lineTo(350, 195);
      ctx.stroke();

      ctx.fillStyle = '#e7e5e4';
      ctx.font = '16px sans-serif';
      ctx.fillText('Structural Element: RC Beam / Support Joint', 20, 450);
    } else {
      // Draw simulated construction site scene
      ctx.fillStyle = '#334155'; // background structure
      ctx.fillRect(0, 0, 640, 480);
      // scaffolding beams
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.strokeRect(60, 60, 240, 340);
      ctx.strokeRect(340, 60, 240, 340);
      // floor slab
      ctx.fillStyle = '#475569';
      ctx.fillRect(40, 380, 560, 40);
      // warning label
      ctx.fillStyle = '#fbbf24';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('SITE SAFETY ZONE: LEVEL 4 PERIMETER', 120, 240);
      ctx.fillStyle = '#ef4444';
      ctx.fillText('⚠️ UNPROTECTED LEADING EDGE', 160, 280);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `sample_${sampleType}_photo.jpg`, { type: 'image/jpeg' });
        validateAndPass(file);
      }
    }, 'image/jpeg');
  };

  return (
    <div className="w-full">
      {previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md group">
          <img
            src={previewUrl}
            alt="Upload preview"
            className="w-full max-h-80 object-cover rounded-xl"
          />
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={onClear}
              className="p-2.5 rounded-full bg-red-600/90 text-white hover:bg-red-500 shadow-lg transition-transform hover:scale-105"
              title="Remove image"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-3 bg-slate-900/95 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <FileCheck className="w-4 h-4" /> Ready for AI Analysis
            </span>
            <button
              type="button"
              onClick={onClear}
              className="text-slate-400 hover:text-red-400 underline"
            >
              Change file
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-slate-700 hover:border-amber-500/50 hover:bg-slate-800/40 bg-slate-900/40'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-200">
                Click to upload or drag & drop photograph
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Supports JPG, PNG, WEBP (Max 15MB)
              </p>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-slate-500">or</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleLoadSample();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-300 text-xs font-medium hover:bg-amber-500/25 transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" /> Load Sample {sampleType === 'crack' ? 'Crack' : 'Safety'} Photo
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <p className="mt-2 text-xs text-red-400 font-medium">{errorMsg}</p>
      )}
    </div>
  );
};

export default ImageDropzone;
