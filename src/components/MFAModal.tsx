import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  ShieldCheck,
  X,
  Smartphone,
  CheckCircle2,
  Lock,
  Sparkles,
  Camera,
} from 'lucide-react';
import { UserProfile } from '../types';
import { playSuccessChime } from '../utils/audio';

interface MFAModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onConfirmMFA: () => void;
}

export const MFAModal: React.FC<MFAModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onConfirmMFA,
}) => {
  const [method, setMethod] = useState<'totp' | 'biometric' | 'sms'>('totp');
  const [code, setCode] = useState(['8', '4', '2', '', '', '']);
  const [countdown, setCountdown] = useState(26);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCountdown(prev => (prev > 1 ? prev - 1 : 30));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDigitChange = (index: number, val: string) => {
    if (val.length > 1) val = val[val.length - 1];
    const newCode = [...code];
    newCode[index] = val;
    setCode(newCode);
    setErrorMsg(null);
  };

  const handleFillDemoCode = () => {
    setCode(['8', '4', '2', '1', '9', '6']);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit authentication code.');
      return;
    }

    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsSuccess(true);
      playSuccessChime();
      setTimeout(() => {
        onConfirmMFA();
        setIsSuccess(false);
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-600 text-white rounded-lg">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Multi-Factor Authentication (MFA)</span>
              </h3>
              <p className="text-xs text-slate-400">
                User access control for <strong>{currentUser.name}</strong> ({currentUser.role.toUpperCase()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close MFA modal"
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs">
          {/* Method selector */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setMethod('totp')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                method === 'totp'
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>TOTP App</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('biometric')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                method === 'biometric'
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Face ID 2FA</span>
            </button>
            <button
              type="button"
              onClick={() => setMethod('sms')}
              className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                method === 'sms'
                  ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300 font-bold'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>SMS OTP</span>
            </button>
          </div>

          {isSuccess ? (
            <div className="p-4 bg-emerald-950/80 border border-emerald-600 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
              <div className="font-bold text-white text-sm">MFA Identity Verified!</div>
              <div className="text-emerald-300 text-xs">Session elevated with full role permissions.</div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <span className="text-slate-300 font-semibold block">
                  {method === 'totp'
                    ? 'Enter 6-digit code from Google Authenticator / Authy'
                    : method === 'biometric'
                    ? 'Facial Biometric Challenge Token'
                    : 'SMS OTP sent to registered phone (•••• 8921)'}
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  Code refreshes in: <strong className="text-cyan-400">{countdown}s</strong>
                </span>
              </div>

              {/* 6-digit boxes */}
              <div className="flex justify-center gap-2">
                {code.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleDigitChange(idx, e.target.value)}
                    className="w-10 h-12 text-center text-lg font-bold font-mono bg-slate-950 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-lg text-white"
                  />
                ))}
              </div>

              {errorMsg && (
                <div className="text-red-400 text-center text-[11px]">{errorMsg}</div>
              )}

              {/* Demo auto-fill button */}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleFillDemoCode}
                  className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 underline cursor-pointer"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Insert Demo MFA Code (842196)</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
              >
                {isVerifying ? 'Verifying MFA Credential...' : 'Authenticate & Unlock Access'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
