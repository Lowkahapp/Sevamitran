import React, { useState } from 'react';
import { Prescription, Profile } from '../types';
import { Sparkles, MessageSquare, Volume2, Send, CheckCircle2, ChevronDown, ChevronUp, Languages, Clock, Code, Bell } from 'lucide-react';

interface RegionalReminderGeneratorProps {
  prescriptions: Prescription[];
  elderProfile: Profile;
  onReminderSent?: () => void;
}

export const RegionalReminderGenerator: React.FC<RegionalReminderGeneratorProps> = ({
  prescriptions,
  elderProfile,
  onReminderSent,
}) => {
  const activePrescriptions = prescriptions.filter((p) => p.isActive);

  const [selectedRxId, setSelectedRxId] = useState<string>(
    activePrescriptions[0]?.id || ''
  );
  const [selectedDialect, setSelectedDialect] = useState<string>(
    elderProfile?.language || 'Hinglish'
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedReminder, setGeneratedReminder] = useState<any | null>(null);
  const [showPayload, setShowPayload] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  const dialects = [
    { label: 'Hinglish', flag: '🇮🇳', lang: 'hi-IN', desc: 'Hindi + English mix' },
    { label: 'Hindi', flag: '🇮🇳', lang: 'hi-IN', desc: 'Pranam / Namaste' },
    { label: 'Gujarati', flag: '🇮🇳', lang: 'gu-IN', desc: 'Jai Shree Krishna' },
    { label: 'Tamil', flag: '🇮🇳', lang: 'ta-IN', desc: 'Vanakkam' },
    { label: 'Telugu', flag: '🇮🇳', lang: 'te-IN', desc: 'Namaskaram' },
    { label: 'Kannada', flag: '🇮🇳', lang: 'kn-IN', desc: 'Namaskara' },
    { label: 'Malayalam', flag: '🇮🇳', lang: 'ml-IN', desc: 'Namaskaram' },
    { label: 'Marathi', flag: '🇮🇳', lang: 'mr-IN', desc: 'Namaskar' },
    { label: 'Bengali', flag: '🇮🇳', lang: 'bn-IN', desc: 'Nomoshkar' },
    { label: 'Punjabi', flag: '🇮🇳', lang: 'pa-IN', desc: 'Sat Sri Akal' },
    { label: 'Odia', flag: '🇮🇳', lang: 'or-IN', desc: 'Namaskar' },
    { label: 'Assamese', flag: '🇮🇳', lang: 'as-IN', desc: 'Nomaskar' },
    { label: 'Urdu', flag: '🇮🇳', lang: 'ur-IN', desc: 'Adab / Aadaab' },
    { label: 'Maithili', flag: '🇮🇳', lang: 'hi-IN', desc: 'Pranam / Jai Baba' },
    { label: 'Konkani', flag: '🇮🇳', lang: 'kok-IN', desc: 'Dev Boren Korum' },
    { label: 'English', flag: '🇮🇳', lang: 'en-IN', desc: 'Indian English' },
  ];

  const handleGenerateAndSend = async () => {
    setLoading(true);
    setGeneratedReminder(null);
    try {
      const res = await fetch('/api/generate-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prescriptionId: selectedRxId,
          dialect: selectedDialect,
          elderName: elderProfile.fullName,
          phoneNumber: elderProfile.phoneNumber,
        }),
      });

      const data = await res.json();
      if (data.success && data.reminder) {
        setGeneratedReminder(data.reminder);
        if (onReminderSent) onReminderSent();
      }
    } catch (err) {
      console.error('Failed to generate regional reminder:', err);
    } finally {
      setLoading(false);
    }
  };

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const currentDialectObj = dialects.find((d) => d.label === selectedDialect);
      utterance.lang = currentDialectObj ? currentDialectObj.lang : 'hi-IN';
      utterance.rate = 0.9;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  };

  const selectedRx = activePrescriptions.find((p) => p.id === selectedRxId) || activePrescriptions[0];

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 text-[#3E3C38] shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E1D8] mb-6">
        <div>
          <h3 className="text-lg font-serif font-bold text-[#5A5A40] flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#889E81]" />
            <span>Automated Regional Dialect WhatsApp Reminders</span>
          </h3>
          <p className="text-xs text-[#8E8B82] mt-1 font-medium">
            Dispatches AI-crafted, culturally respectful reminders in native Indian dialects before medication windows open.
          </p>
        </div>

        <span className="text-xs bg-[#889E81]/15 text-[#3B5834] border border-[#889E81]/30 px-3 py-1 rounded-full font-bold self-start sm:self-auto flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
          <span>Meta WhatsApp Template API</span>
        </span>
      </div>

      {/* Configuration Form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Step 1: Select Prescription Window */}
        <div>
          <label className="block text-xs font-semibold text-[#5A5A40] mb-2 flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-[#889E81]" />
            <span>Select Medication Schedule Window</span>
          </label>
          {activePrescriptions.length === 0 ? (
            <p className="text-xs text-[#8E8B82] italic">No active prescriptions available.</p>
          ) : (
            <div className="space-y-2">
              {activePrescriptions.map((rx) => (
                <div
                  key={rx.id}
                  onClick={() => setSelectedRxId(rx.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                    selectedRxId === rx.id
                      ? 'bg-[#889E81]/10 border-[#889E81] text-[#3B5834] shadow-2xs font-semibold'
                      : 'bg-[#FDFCF9] border-[#E5E1D8] hover:border-[#D1CDC2] text-[#3E3C38]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-serif font-bold text-[#5A5A40]">{rx.medicineName}</div>
                    <div className="text-[11px] text-[#8E8B82] mt-0.5">{rx.dosageInstruction}</div>
                  </div>
                  <span className="text-xs font-mono font-bold text-[#845217] bg-[#D4A373]/20 px-2.5 py-1 rounded-xl border border-[#D4A373]/30">
                    {rx.scheduledTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Select Regional Dialect */}
        <div>
          <label className="block text-xs font-semibold text-[#5A5A40] mb-2 flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-[#889E81]" />
            <span>Select Senior's Regional Dialect</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {dialects.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setSelectedDialect(d.label)}
                className={`p-2.5 rounded-xl border text-left transition text-xs cursor-pointer ${
                  selectedDialect === d.label
                    ? 'bg-[#889E81] text-white border-[#778D70] font-semibold shadow-2xs'
                    : 'bg-[#FDFCF9] text-[#3E3C38] border-[#E5E1D8] hover:bg-[#F3F0E9]'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <span>{d.flag}</span>
                  <span>{d.label}</span>
                </div>
                <p className={`text-[10px] mt-0.5 leading-tight ${selectedDialect === d.label ? 'text-emerald-100' : 'text-[#8E8B82]'}`}>
                  {d.desc}
                </p>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Action Button */}
      <div className="flex items-center justify-between pt-2 border-t border-[#E5E1D8]">
        <div className="text-xs text-[#8E8B82] font-medium">
          Sending to: <strong className="text-[#5A5A40]">{elderProfile.fullName}</strong> ({elderProfile.phoneNumber})
        </div>

        <button
          onClick={handleGenerateAndSend}
          disabled={loading || activePrescriptions.length === 0}
          className="flex items-center gap-2 bg-[#889E81] hover:bg-[#778D70] disabled:opacity-50 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
        >
          <Sparkles className={`w-4 h-4 text-[#F3F0E9] ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Generating Dialect Message...' : '✨ Generate & Send WhatsApp Reminder'}</span>
        </button>
      </div>

      {/* Generated Reminder Output Card */}
      {generatedReminder && (
        <div className="mt-6 pt-6 border-t border-[#E5E1D8] space-y-4 animate-fadeIn">
          
          <div className="bg-[#FDFCF9] border border-[#889E81]/40 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E1D8] mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#3B5834] bg-[#889E81]/20 px-2.5 py-0.5 rounded-full border border-[#889E81]/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Dispatched via WhatsApp Template API
                </span>
                <span className="text-xs font-mono text-[#8E8B82]">
                  Dialect: <strong>{generatedReminder.dialect}</strong>
                </span>
              </div>

              <button
                onClick={() => speakMessage(generatedReminder.warmMessage)}
                className="flex items-center gap-1.5 bg-[#F3F0E9] hover:bg-[#EAE6DD] text-[#5A5A40] text-xs font-semibold px-3 py-1 rounded-xl border border-[#E5E1D8] transition cursor-pointer"
              >
                <Volume2 className={`w-3.5 h-3.5 text-[#889E81] ${isSpeaking ? 'animate-bounce text-[#3B5834]' : ''}`} />
                <span>{isSpeaking ? 'Speaking...' : 'Listen Audio'}</span>
              </button>
            </div>

            {/* Message Body */}
            <div className="p-3 bg-[#F3F0E9] rounded-xl border border-[#E5E1D8] text-sm text-[#3E3C38] font-serif leading-relaxed italic">
              "{generatedReminder.warmMessage}"
            </div>

            {/* Metadata Footer */}
            <div className="flex items-center justify-between text-[11px] text-[#8E8B82] mt-3 pt-2 border-t border-[#E5E1D8]/60 font-medium">
              <span>Elder: {generatedReminder.elderName} • Med: {generatedReminder.medicineName} ({generatedReminder.scheduledTime})</span>

              <button
                onClick={() => setShowPayload(!showPayload)}
                className="text-[#889E81] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Code className="w-3.5 h-3.5" />
                <span>{showPayload ? 'Hide' : 'Inspect'} Meta API Payload</span>
                {showPayload ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>

            {/* Payload Inspector */}
            {showPayload && (
              <div className="mt-3 p-3 bg-[#2D2C28] text-[#A2C398] font-mono text-[11px] rounded-xl overflow-x-auto">
                <pre>{JSON.stringify(generatedReminder.whatsappTemplatePayload, null, 2)}</pre>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
};
