import React, { useState } from 'react';
import { Lock, User, KeyRound, ArrowRight, ShieldCheck, Truck, Sparkles } from 'lucide-react';

interface Props {
  onLoginSuccess: (userInfo: { userId: string; companyName: string }) => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    setTimeout(() => {
      // kkh / 1010 로그인 검증
      if (userId.trim() === 'kkh' && password === '1010') {
        onLoginSuccess({
          userId: 'kkh',
          companyName: '대국'
        });
      } else {
        setErrorMessage('아이디 또는 비밀번호가 올바르지 않습니다. (아이디: kkh / 암호: 1010)');
      }
      setLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-['Pretendard',sans-serif]">
      {/* Background Radial Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-300">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-xl shadow-blue-500/25 mb-4 border border-blue-400/30">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            FleetSync <span className="px-2 py-0.5 text-xs font-bold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30">PRO</span>
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1.5">
            통합 배차 및 기사 관리를 위한 스마트 스마트 물류 솔루션
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-400" />
                시스템 관리자 로그인
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">승인된 관리자 계정 정보를 입력하세요.</p>
            </div>
            <span className="px-2.5 py-1 bg-slate-800 text-blue-400 rounded-lg text-[11px] font-extrabold border border-slate-700">
              대국 물류
            </span>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2 animate-in fade-in">
              <ShieldCheck className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 아이디 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                관리자 아이디 (User ID)
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 z-10" />
                <input
                  type="text"
                  placeholder="아이디 입력"
                  value={userId}
                  onChange={e => setUserId(e.target.value)}
                  required
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-medium"
                />
              </div>
            </div>

            {/* 비밀번호 */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                비밀번호 (Password)
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5 z-10" />
                <input
                  type="password"
                  placeholder="비밀번호 입력"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition font-medium"
                />
              </div>
            </div>

            {/* 계정 안내 가이드 팁 */}
            <div className="p-3 bg-blue-950/40 border border-blue-900/50 rounded-xl flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-300/80 leading-relaxed font-medium">
                테스트 관리자 계정: 아이디 <span className="font-bold text-white bg-blue-900/60 px-1.5 py-0.5 rounded">kkh</span> / 비밀번호 <span className="font-bold text-white bg-blue-900/60 px-1.5 py-0.5 rounded">1010</span>
              </p>
            </div>

            {/* 로그인 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>로그인 및 대시보드 진입</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-[11px] text-slate-600 mt-6">
          © 2026 FleetSync. All rights reserved. (소속 회사: 대국)
        </p>
      </div>
    </div>
  );
};
