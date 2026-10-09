import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  User,
  Users,
  Clock,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Delete,
  X,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Contact, CallRecord } from '../../types';
import { INITIAL_CONTACTS, INITIAL_CALL_RECORDS } from '../../data/mockData';
import { soundEffects } from '../../utils/sound';

interface CallsAppProps {
  onClose: () => void;
}

export const CallsApp: React.FC<CallsAppProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'keypad' | 'recents' | 'contacts'>('keypad');
  const [dialedNumber, setDialedNumber] = useState('');
  const [contacts] = useState<Contact[]>(INITIAL_CONTACTS);
  const [recentCalls, setRecentCalls] = useState<CallRecord[]>(INITIAL_CALL_RECORDS);

  // Call states
  const [callState, setCallState] = useState<'idle' | 'outgoing' | 'connected' | 'incoming'>('idle');
  const [currentCallContact, setCurrentCallContact] = useState<{ name: string; number: string }>({
    name: '',
    number: '',
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // Timer for active call
  useEffect(() => {
    let timer: number;
    if (callState === 'connected') {
      timer = window.setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // Outgoing connect delay simulation
  useEffect(() => {
    if (callState === 'outgoing') {
      const connectTimer = setTimeout(() => {
        setCallState('connected');
        setCallDuration(0);
        soundEffects.playSuccessBeep();
      }, 2000);
      return () => clearTimeout(connectTimer);
    }
  }, [callState]);

  const handleKeyPress = (digit: string, freq: number) => {
    soundEffects.playTone(freq, 0.12);
    setDialedNumber((prev) => prev + digit);
  };

  const handleBackspace = () => {
    soundEffects.playHapticClick();
    setDialedNumber((prev) => prev.slice(0, -1));
  };

  const startCall = (name: string, number: string) => {
    soundEffects.playHapticClick();
    setCurrentCallContact({
      name: name || number || 'Unknown Node',
      number: number || 'AERIX Direct Line',
    });
    setCallState('outgoing');
    setIsMuted(false);
    setIsSpeaker(false);
  };

  const simulateIncoming = () => {
    soundEffects.playHapticClick();
    setCurrentCallContact({
      name: 'Elena Rostova',
      number: '+1 (555) 019-4821',
    });
    setCallState('incoming');
  };

  const answerIncoming = () => {
    soundEffects.playSuccessBeep();
    setCallState('connected');
    setCallDuration(0);
  };

  const endCall = () => {
    soundEffects.playTone(180, 0.25);
    // Add to recents
    if (currentCallContact.name) {
      const record: CallRecord = {
        id: `cr-${Date.now()}`,
        name: currentCallContact.name,
        number: currentCallContact.number,
        type: 'outgoing',
        time: 'Just now',
        duration: callDuration > 0 ? `${callDuration}s` : 'Cancelled',
      };
      setRecentCalls((prev) => [record, ...prev]);
    }
    setCallState('idle');
    setCallDuration(0);
  };

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const keypadButtons = [
    { label: '1', sub: '', freq: 697 },
    { label: '2', sub: 'ABC', freq: 770 },
    { label: '3', sub: 'DEF', freq: 852 },
    { label: '4', sub: 'GHI', freq: 697 },
    { label: '5', sub: 'JKL', freq: 770 },
    { label: '6', sub: 'MNO', freq: 852 },
    { label: '7', sub: 'PQRS', freq: 697 },
    { label: '8', sub: 'TUV', freq: 770 },
    { label: '9', sub: 'WXYZ', freq: 852 },
    { label: '*', sub: '', freq: 941 },
    { label: '0', sub: '+', freq: 770 },
    { label: '#', sub: '', freq: 941 },
  ];

  return (
    <div className="fixed inset-0 z-40 bg-[#040711] text-slate-100 flex flex-col overflow-hidden select-none pb-16">
      {/* Top Header */}
      <div className="p-3 aerix-glass border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-display text-white">
              AERIX COMMS
            </h2>
            <span className="text-[10px] font-mono text-emerald-400">
              Interactive Telephony Shell
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={simulateIncoming}
            className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono border border-slate-700"
            title="Test Incoming Call"
          >
            Simulate Ring
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Switcher Tabs (Keypad / Recents / Contacts) */}
      {callState === 'idle' && (
        <div className="p-2 border-b border-slate-800/80 aerix-glass flex items-center justify-center gap-2">
          {[
            { id: 'keypad', label: 'Keypad', icon: Phone },
            { id: 'recents', label: 'Recents', icon: Clock },
            { id: 'contacts', label: 'Contacts', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playHapticClick();
                  setActiveTab(tab.id as typeof activeTab);
                }}
                className={`min-h-[38px] px-4 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Viewport for Inactive vs Active Calls */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col justify-center items-center">
        {/* --- INCOMING CALL SCREEN --- */}
        {callState === 'incoming' && (
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-cyan-500/20 border-2 border-cyan-400 flex items-center justify-center text-2xl font-bold text-white shadow-2xl">
              <PhoneIncoming className="w-10 h-10 text-cyan-400 animate-bounce" />
            </div>

            <div>
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">
                Incoming AERIX Transmission
              </span>
              <h3 className="text-2xl font-bold font-display text-white mt-1">
                {currentCallContact.name}
              </h3>
              <p className="text-sm text-slate-400 font-mono mt-0.5">
                {currentCallContact.number}
              </p>
            </div>

            <div className="flex items-center gap-8 pt-6">
              {/* Decline */}
              <button
                onClick={endCall}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-transform"
              >
                <PhoneOff className="w-7 h-7" />
              </button>

              {/* Accept */}
              <button
                onClick={answerIncoming}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform"
              >
                <PhoneCall className="w-7 h-7" />
              </button>
            </div>
          </div>
        )}

        {/* --- OUTGOING & CONNECTED CALL SCREEN --- */}
        {(callState === 'outgoing' || callState === 'connected') && (
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-2xl font-bold text-white shadow-2xl">
              <User className="w-10 h-10 text-emerald-400" />
            </div>

            <div>
              <h3 className="text-2xl font-bold font-display text-white">
                {currentCallContact.name}
              </h3>
              <p className="text-sm text-slate-400 font-mono mt-0.5">
                {currentCallContact.number}
              </p>
              <div className="mt-2 text-xs font-mono text-emerald-400 flex items-center justify-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  {callState === 'outgoing' ? 'Dialing Node...' : formatSeconds(callDuration)}
                </span>
              </div>
            </div>

            {/* In-Call Controls (Mute, Speaker, Keypad, End) */}
            <div className="grid grid-cols-2 gap-4 w-56 pt-4">
              <button
                onClick={() => {
                  soundEffects.playHapticClick();
                  setIsMuted(!isMuted);
                }}
                className={`py-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-xs border ${
                  isMuted
                    ? 'bg-rose-950 border-rose-700 text-rose-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                <span>{isMuted ? 'Muted' : 'Mute'}</span>
              </button>

              <button
                onClick={() => {
                  soundEffects.playHapticClick();
                  setIsSpeaker(!isSpeaker);
                }}
                className={`py-3 rounded-2xl flex flex-col items-center justify-center gap-1 text-xs border ${
                  isSpeaker
                    ? 'bg-cyan-950 border-cyan-700 text-cyan-300'
                    : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                {isSpeaker ? <Volume2 className="w-5 h-5 text-cyan-400" /> : <VolumeX className="w-5 h-5" />}
                <span>{isSpeaker ? 'Speaker On' : 'Speaker'}</span>
              </button>
            </div>

            <button
              onClick={endCall}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 active:scale-95 transition-transform"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
          </div>
        )}

        {/* --- KEYPAD VIEW --- */}
        {callState === 'idle' && activeTab === 'keypad' && (
          <div className="w-full max-w-xs flex flex-col items-center space-y-4">
            {/* Number Display */}
            <div className="h-12 w-full flex items-center justify-center px-4 relative">
              <span className="font-mono text-2xl font-bold tracking-wider text-white truncate text-center">
                {dialedNumber || ''}
              </span>
              {dialedNumber && (
                <button
                  onClick={handleBackspace}
                  className="absolute right-0 p-2 text-slate-400 hover:text-white"
                >
                  <Delete className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* 12 Keys Grid */}
            <div className="grid grid-cols-3 gap-3 w-full">
              {keypadButtons.map((btn) => (
                <button
                  key={btn.label}
                  onClick={() => handleKeyPress(btn.label, btn.freq)}
                  className="min-h-[58px] rounded-2xl aerix-glass-card hover:bg-slate-800/80 border border-slate-800 flex flex-col items-center justify-center active:scale-95 transition-transform"
                >
                  <span className="text-xl font-bold font-display text-white">
                    {btn.label}
                  </span>
                  {btn.sub && (
                    <span className="text-[9px] font-mono text-slate-400 tracking-widest uppercase">
                      {btn.sub}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Dial CTA */}
            <div className="pt-2">
              <button
                onClick={() => startCall('Manual Call', dialedNumber)}
                disabled={!dialedNumber}
                className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 flex items-center justify-center shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform"
              >
                <Phone className="w-7 h-7 fill-current" />
              </button>
            </div>
          </div>
        )}

        {/* --- RECENTS VIEW --- */}
        {callState === 'idle' && activeTab === 'recents' && (
          <div className="w-full max-w-sm space-y-2">
            {recentCalls.map((rec) => (
              <div
                key={rec.id}
                onClick={() => startCall(rec.name, rec.number)}
                className="p-3.5 rounded-2xl aerix-glass-card border border-slate-800/80 hover:border-emerald-500/40 cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-800 text-slate-300">
                    {rec.type === 'incoming' && <PhoneIncoming className="w-4 h-4 text-emerald-400" />}
                    {rec.type === 'outgoing' && <PhoneOutgoing className="w-4 h-4 text-cyan-400" />}
                    {rec.type === 'missed' && <PhoneMissed className="w-4 h-4 text-rose-400" />}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-white group-hover:text-emerald-300">
                      {rec.name}
                    </h4>
                    <p className="text-[10px] font-mono text-slate-500">
                      {rec.time} · {rec.duration}
                    </p>
                  </div>
                </div>

                <Phone className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
              </div>
            ))}
          </div>
        )}

        {/* --- CONTACTS VIEW --- */}
        {callState === 'idle' && activeTab === 'contacts' && (
          <div className="w-full max-w-sm space-y-2">
            {contacts.map((con) => (
              <div
                key={con.id}
                onClick={() => startCall(con.name, con.number)}
                className="p-3.5 rounded-2xl aerix-glass-card border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400">
                    {con.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-white group-hover:text-cyan-300">
                      {con.name}
                    </h4>
                    <p className="text-[10px] text-slate-400">{con.role}</p>
                    <span className="text-[10px] font-mono text-cyan-400">{con.number}</span>
                  </div>
                </div>

                <div className="p-2 rounded-xl bg-slate-800 group-hover:bg-emerald-500/20 text-slate-400 group-hover:text-emerald-400">
                  <Phone className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
