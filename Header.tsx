import React from 'react';
import { TrafficLightStatus, Profile } from '../types';
import {
  Heart,
  PhoneCall,
  Clock,
  MessageSquare,
  LayoutDashboard,
  Code,
  Sparkles,
  Zap,
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'whatsapp' | 'dashboard' | 'webhook';
  setActiveTab: (tab: 'whatsapp' | 'dashboard' | 'webhook') => void;
  trafficLight: TrafficLightStatus;
  profiles: Profile[];
  onTriggerCron: () => void;
  cronLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  trafficLight,
  profiles,
  onTriggerCron,
  cronLoading,
}) => {
  const elder = profiles.find((p) => p.role === 'elder') || profiles[0];
  const caregiver = profiles.find((p) => p.role === 'caregiver') || profiles[1];

  const getTrafficBadge = () => {
    switch (trafficLight.status) {
      case 'GREEN':
        return 'bg-[#889E81]/15 text-[#3B5834] border-[#889E81]/30';
      case 'YELLOW':
        return 'bg-[#D4A373]/15 text-[#845217] border-[#D4A373]/30';
      case 'RED':
        return 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse';
    }
  };

  return (
    <header className="bg-white text-[#3E3C38] border-b border-[#E5E1D8] sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3.5 gap-4">
          
          {/* Brand Logo & Senior Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-[#889E81] flex items-center justify-center text-white shadow-xs font-serif text-xl font-bold">
              S
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-serif font-bold text-[#5A5A40] tracking-tight">
                  SevaMitr <span className="text-xs font-sans font-normal text-[#889E81] bg-[#889E81]/10 px-2 py-0.5 rounded-full border border-[#889E81]/20">सेवामित्र</span>
                </h1>
                <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold flex items-center gap-1.5 ${getTrafficBadge()}`}>
                  <span className={`w-2 h-2 rounded-full ${trafficLight.status === 'GREEN' ? 'bg-[#889E81]' : trafficLight.status === 'YELLOW' ? 'bg-[#D4A373]' : 'bg-rose-500'}`}></span>
                  {trafficLight.status}
                </span>
              </div>
              <p className="text-xs text-[#8E8B82] flex items-center gap-2 font-medium">
                Senior: <strong className="text-[#3E3C38]">{elder?.fullName}</strong> ({elder?.city})
              </p>
            </div>
          </div>

          {/* Navigation Tab Switcher */}
          <div className="flex items-center bg-[#F3F0E9] p-1 rounded-xl border border-[#E5E1D8] text-xs sm:text-sm">
            <button
              id="nav-whatsapp-tab"
              onClick={() => setActiveTab('whatsapp')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'whatsapp'
                  ? 'bg-[#889E81] text-white shadow-sm'
                  : 'text-[#7A776F] hover:text-[#3E3C38] hover:bg-[#EAE6DD]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Elder WhatsApp</span>
              <span className="bg-[#5A5A40]/20 text-xs px-1.5 py-0.2 rounded-full text-current">Zero-UI</span>
            </button>

            <button
              id="nav-dashboard-tab"
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#889E81] text-white shadow-sm'
                  : 'text-[#7A776F] hover:text-[#3E3C38] hover:bg-[#EAE6DD]'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Caregiver Portal</span>
            </button>

            <button
              id="nav-webhook-tab"
              onClick={() => setActiveTab('webhook')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'webhook'
                  ? 'bg-[#889E81] text-white shadow-sm'
                  : 'text-[#7A776F] hover:text-[#3E3C38] hover:bg-[#EAE6DD]'
              }`}
            >
              <Code className="w-4 h-4" />
              <span>Meta Webhooks</span>
            </button>
          </div>

          {/* Actions: Background Cron Simulation & Caregiver Call */}
          <div className="flex items-center gap-2">
            <button
              id="btn-run-cron"
              onClick={onTriggerCron}
              disabled={cronLoading}
              className="flex items-center gap-1.5 bg-[#F3F0E9] hover:bg-[#EAE6DD] text-[#5A5A40] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#E5E1D8] transition cursor-pointer"
              title="Simulates 15-minute scheduled time check for missed doses"
            >
              <Clock className={`w-3.5 h-3.5 text-[#D4A373] ${cronLoading ? 'animate-spin' : ''}`} />
              <span>Run 15m Cron Check</span>
            </button>

            <a
              href={`tel:${elder?.phoneNumber}`}
              className="flex items-center gap-1.5 bg-[#889E81] hover:bg-[#778D70] text-white text-xs font-semibold px-3.5 py-1.5 rounded-xl transition shadow-xs"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Call Senior</span>
            </a>
          </div>

        </div>
      </div>
    </header>
  );
};
