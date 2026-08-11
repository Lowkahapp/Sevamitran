import React, { useState, useRef } from 'react';
import { Profile, AdherenceLog, WhatsAppPayloadLog } from '../types';
import {
  Mic,
  Square,
  Send,
  Volume2,
  CheckCheck,
  Sparkles,
  Bot,
  User,
  Info,
  Clock,
  Zap,
  Play,
  RotateCcw,
} from 'lucide-react';

interface WhatsAppInterfaceProps {
  elderProfile: Profile;
  logs: AdherenceLog[];
  onSendMessage: (payload: { text?: string; audioBase64?: string; mimeType?: string }) => Promise<any>;
  loading: boolean;
}

const VOICE_PRESETS = [
  {
    label: '🎙️ "Beta, subah ki B.P. ki goli kha li"',
    text: 'Beta, maine subah ki B.P. ki goli kha li hai chai ke baad.',
    category: 'blood_pressure',
  },
  {
    label: '🎙️ "Sugar tablet skipped today feel unwell"',
    text: 'Aaj sugar wali tablet nahi li, mujhe ulti jaisa lag raha tha.',
    category: 'diabetes',
  },
  {
    label: '🎙️ "Heart medicine done beta evening"',
    text: 'Beta, raat ki heart ki goli le li hai sone se pehle.',
    category: 'heart',
  },
  {
    label: '🎙️ "Multivitamin goli doodh ke sath li"',
    text: 'Subah wali vitamin goli bhi le li doodh ke sath.',
    category: 'general',
  },
];

export const WhatsAppInterface: React.FC<WhatsAppInterfaceProps> = ({
  elderProfile,
  logs,
  onSendMessage,
  loading,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [latestParsed, setLatestParsed] = useState<any>(null);
  const [speakingLogId, setSpeakingLogId] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Handle Recording Audio with MediaRecorder API
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Data = (reader.result as string).split(',')[1];
          const result = await onSendMessage({
            audioBase64: base64Data,
            mimeType: 'audio/webm',
          });
          if (result && result.parsed) {
            setLatestParsed(result.parsed);
            speakAffirmation(result.parsed.affirmation);
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSeconds(0);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Microphone access denied or not available. You can use the Voice Sample buttons below to test!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // Stop track
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const textToSend = inputText;
    setInputText('');

    const result = await onSendMessage({ text: textToSend });
    if (result && result.parsed) {
      setLatestParsed(result.parsed);
      speakAffirmation(result.parsed.affirmation);
    }
  };

  const handlePresetSelect = async (text: string) => {
    setInputText(text);
    const result = await onSendMessage({ text });
    if (result && result.parsed) {
      setLatestParsed(result.parsed);
      speakAffirmation(result.parsed.affirmation);
    }
  };

  // Speaks out the Indian voice affirmation via Web Speech Synthesis
  const speakAffirmation = (text: string, logId?: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop prior
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'hi-IN'; // Indian accent/Hindi if supported

      if (logId) setSpeakingLogId(logId);
      utterance.onend = () => setSpeakingLogId(null);
      utterance.onerror = () => setSpeakingLogId(null);

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* WhatsApp Chat Main Window (Col 7) */}
      <div className="lg:col-span-7 bg-white border border-[#E5E1D8] rounded-3xl overflow-hidden shadow-xs flex flex-col h-[700px]">
        
        {/* WhatsApp Top Header Bar */}
        <div className="bg-[#F3F0E9] text-[#3E3C38] px-4 py-3 border-b border-[#E5E1D8] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={elderProfile.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
                alt={elderProfile.fullName}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#889E81]"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#889E81] border-2 border-white rounded-full"></span>
            </div>

            <div>
              <h3 className="font-serif font-bold text-sm text-[#5A5A40] flex items-center gap-2">
                <span>{elderProfile.fullName}</span>
                <span className="text-[10px] bg-[#EAE6DD] text-[#5A5A40] px-2 py-0.5 rounded-full font-mono border border-[#D1CDC2]">
                  {elderProfile.phoneNumber}
                </span>
              </h3>
              <p className="text-xs text-[#8E8B82] flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#889E81] animate-pulse"></span>
                SevaMitr WhatsApp Voice Engine Connected • Zero-UI Mode
              </p>
            </div>
          </div>

          <div className="text-xs bg-[#889E81]/20 px-2.5 py-1 rounded-xl border border-[#889E81]/30 text-[#3B5834] font-semibold">
            Hinglish Voice Enabled
          </div>
        </div>

        {/* WhatsApp Message Wallpaper Canvas */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#F9F7F2] text-sm font-sans">
          
          {/* Welcome Notice */}
          <div className="text-center my-2">
            <span className="bg-[#EAE6DD] text-[#5A5A40] text-xs px-3.5 py-1.5 rounded-full border border-[#D1CDC2] shadow-2xs inline-flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
              Elderly Zero-UI Mode: Click Mic or tap sample voice notes to speak to SevaMitr
            </span>
          </div>

          {/* Conversation History */}
          {logs.slice(0, 10).map((log) => (
            <div key={log.id} className="space-y-2">
              
              {/* Senior Inbound Speech Bubble */}
              <div className="flex justify-start">
                <div className="bg-[#EAE6DD] text-[#3E3C38] p-3.5 rounded-2xl rounded-tl-none max-w-[85%] border border-[#D1CDC2] shadow-2xs">
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-[#845217] font-semibold">
                    <User className="w-3.5 h-3.5 text-[#D4A373]" />
                    <span>{elderProfile.fullName} (Senior Voice)</span>
                  </div>

                  <p className="text-[#3E3C38] font-serif text-sm leading-relaxed">
                    "{log.rawTranscription}"
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[#8E8B82] mt-2 border-t border-[#D1CDC2]/60 pt-1">
                    <span className="capitalize bg-[#F3F0E9] text-[#5A5A40] px-1.5 py-0.5 rounded font-mono font-medium">
                      Category: {log.category.replace('_', ' ')}
                    </span>
                    <span className="font-medium">{new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>

              {/* SevaMitr Assistant Affirmation Bubble */}
              {log.affirmationResponse && (
                <div className="flex justify-end">
                  <div className="bg-[#889E81] text-white p-3.5 rounded-2xl rounded-tr-none max-w-[85%] shadow-2xs border border-[#778D70]">
                    <div className="flex items-center justify-between mb-1 text-[11px] text-emerald-100">
                      <span className="flex items-center gap-1 font-semibold">
                        <Bot className="w-3.5 h-3.5 text-[#F3F0E9]" /> SevaMitr Bot
                      </span>
                      <button
                        onClick={() => speakAffirmation(log.affirmationResponse!, log.id)}
                        className="flex items-center gap-1 bg-[#778D70] hover:bg-[#667A5F] text-white text-[10px] px-2 py-0.5 rounded-lg transition cursor-pointer"
                        title="Listen to voice affirmation"
                      >
                        <Volume2 className={`w-3 h-3 ${speakingLogId === log.id ? 'animate-bounce text-amber-200' : ''}`} />
                        <span>Speak Audio</span>
                      </button>
                    </div>

                    <p className="text-white text-sm font-medium">
                      {log.affirmationResponse}
                    </p>

                    <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-100 mt-1 font-medium">
                      <span>{new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <CheckCheck className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                </div>
              )}

            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-[#EAE6DD] text-[#5A5A40] p-3 rounded-2xl text-xs flex items-center gap-2 border border-[#D1CDC2] animate-pulse">
                <Sparkles className="w-4 h-4 text-[#D4A373] animate-spin" />
                <span>SevaMitr AI is transcribing Hinglish audio and updating DB...</span>
              </div>
            </div>
          )}

        </div>

        {/* Recording / Input Bar */}
        <div className="p-3.5 bg-[#F3F0E9] border-t border-[#E5E1D8] flex flex-col gap-2.5">
          
          {isRecording ? (
            <div className="flex items-center justify-between bg-rose-100 border border-rose-200 p-3 rounded-2xl animate-pulse text-rose-900">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
                <span className="font-semibold text-sm">Recording Senior Voice Note... ({recordingSeconds}s)</span>
              </div>
              <button
                onClick={stopRecording}
                className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>Stop & Send Voice</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <button
                type="button"
                onClick={startRecording}
                className="p-3 bg-[#889E81] hover:bg-[#778D70] text-white rounded-2xl shadow-xs transition-transform hover:scale-105 active:scale-95 shrink-0 cursor-pointer"
                title="Hold or Click to Record Voice Note"
              >
                <Mic className="w-5 h-5" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder='Type or record voice note (e.g., "Subah ki B.P. ki goli le li")...'
                className="flex-1 bg-[#FDFCF9] text-[#3E3C38] placeholder-[#A09D94] text-sm px-4 py-2.5 rounded-2xl border border-[#D1CDC2] focus:outline-none focus:border-[#889E81]"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || loading}
                className="p-2.5 bg-[#889E81] hover:bg-[#778D70] disabled:opacity-50 text-white rounded-2xl transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Quick Voice Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-[#8E8B82] font-semibold shrink-0 text-[11px]">Voice Presets:</span>
            {VOICE_PRESETS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handlePresetSelect(preset.text)}
                disabled={loading}
                className="bg-[#FDFCF9] hover:bg-[#EAE6DD] text-[#5A5A40] border border-[#E5E1D8] px-2.5 py-1 rounded-xl whitespace-nowrap transition text-[11px] font-medium cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* AI Pipeline & Natural Language Parser Drawer (Col 5) */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Real-time Gemini NLP Pipeline Breakdown */}
        <div className="bg-white border border-[#E5E1D8] rounded-3xl p-5 text-[#3E3C38] shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8] mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#D4A373]" />
              <h3 className="font-serif font-bold text-sm text-[#5A5A40]">Gemini AI Pipeline Inspector</h3>
            </div>
            <span className="text-[10px] bg-[#F3F0E9] text-[#5A5A40] px-2 py-0.5 rounded-md border border-[#E5E1D8] font-mono font-bold">
              gemini-3.6-flash
            </span>
          </div>

          <p className="text-xs text-[#8E8B82] mb-4 leading-relaxed font-medium">
            SevaMitr processes raw Indian audio streams, transcribes Hinglish speech, and maps unstructured text into deterministic database parameters.
          </p>

          {latestParsed ? (
            <div className="space-y-3 bg-[#FDFCF9] p-4 rounded-2xl border border-[#E5E1D8] font-mono text-xs">
              <div>
                <span className="text-[#A09D94] block text-[10px] uppercase font-sans font-bold">Raw Audio Transcription</span>
                <span className="text-[#3B5834] font-serif text-sm font-semibold">"{latestParsed.transcription}"</span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5E1D8]">
                <div>
                  <span className="text-[#A09D94] block text-[10px] uppercase font-sans font-bold">Extracted Category</span>
                  <span className="bg-[#889E81]/20 text-[#3B5834] px-2 py-0.5 rounded text-xs font-semibold uppercase">
                    {latestParsed.category}
                  </span>
                </div>

                <div>
                  <span className="text-[#A09D94] block text-[10px] uppercase font-sans font-bold">Adherence Status</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${latestParsed.status === 'taken' ? 'bg-[#889E81]/20 text-[#3B5834]' : 'bg-rose-100 text-rose-800'}`}>
                    {latestParsed.status}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E1D8]">
                <span className="text-[#A09D94] block text-[10px] uppercase font-sans font-bold">Confidence Score</span>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-[#EAE6DD] h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#889E81] h-full rounded-full transition-all duration-500"
                      style={{ width: `${(latestParsed.confidenceScore || 0.95) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-[#3B5834] font-bold">
                    {Math.round((latestParsed.confidenceScore || 0.95) * 100)}%
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#E5E1D8]">
                <span className="text-[#A09D94] block text-[10px] uppercase font-sans font-bold">Generated Regional Affirmation</span>
                <p className="text-[#3E3C38] font-serif italic text-xs mt-1">
                  "{latestParsed.affirmation}"
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#F3F0E9]/60 p-6 rounded-2xl border border-dashed border-[#E5E1D8] text-center text-[#8E8B82] text-xs font-medium">
              <Bot className="w-8 h-8 text-[#A09D94] mx-auto mb-2" />
              <span>Record a voice note on the left to see live Gemini transcription and parameter extraction.</span>
            </div>
          )}
        </div>

        {/* Zero-UI Principles Card */}
        <div className="bg-[#FDFCF9] border border-[#E5E1D8] rounded-3xl p-5 text-[#3E3C38] shadow-xs">
          <h4 className="font-serif font-bold text-sm text-[#5A5A40] mb-2 flex items-center gap-2">
            <Info className="w-4 h-4 text-[#889E81]" /> Zero-UI Architecture Principles
          </h4>
          <ul className="text-xs text-[#8E8B82] space-y-2 list-disc pl-4 font-medium">
            <li><strong>Zero Apps to Install:</strong> Elderly seniors keep using pinned WhatsApp, avoiding login screens or app fatigue.</li>
            <li><strong>Voice First:</strong> Handles regional accents, mixed Hinglish, and colloquial speech.</li>
            <li><strong>Warm Feedback Loop:</strong> Instant text & audio affirmations reassure the senior.</li>
          </ul>
        </div>

      </div>

    </div>
  );
};
