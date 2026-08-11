import React from 'react';
import { TrafficLightStatus } from '../types';
import { AlertTriangle, CheckCircle2, AlertCircle, Clock, ShieldCheck, PhoneCall, Zap } from 'lucide-react';

interface TrafficLightBannerProps {
  trafficLight: TrafficLightStatus;
  elderName: string;
  caregiverPhone: string;
  onRunCronCheck: () => void;
}

export const TrafficLightBanner: React.FC<TrafficLightBannerProps> = ({
  trafficLight,
  elderName,
  caregiverPhone,
  onRunCronCheck,
}) => {
  const getBannerStyles = () => {
    switch (trafficLight.status) {
      case 'GREEN':
        return {
          bgBg: 'bg-[#889E81]/10 border-[#889E81]/25',
          badgeBg: 'bg-[#889E81]/20 text-[#3B5834] border-[#889E81]/30',
          icon: <CheckCircle2 className="w-8 h-8 text-[#889E81] shrink-0" />,
          titleColor: 'text-[#3B5834]',
          indicatorBg: 'bg-[#889E81]',
        };
      case 'YELLOW':
        return {
          bgBg: 'bg-[#D4A373]/15 border-[#D4A373]/30',
          badgeBg: 'bg-[#D4A373]/25 text-[#845217] border-[#D4A373]/40',
          icon: <AlertCircle className="w-8 h-8 text-[#D4A373] shrink-0 animate-pulse" />,
          titleColor: 'text-[#845217]',
          indicatorBg: 'bg-[#D4A373]',
        };
      case 'RED':
        return {
          bgBg: 'bg-rose-50 border-rose-200 shadow-md shadow-rose-100',
          badgeBg: 'bg-rose-100 text-rose-800 border-rose-300 animate-pulse',
          icon: <AlertTriangle className="w-8 h-8 text-rose-600 shrink-0 animate-bounce" />,
          titleColor: 'text-rose-900',
          indicatorBg: 'bg-rose-600 animate-ping',
        };
    }
  };

  const style = getBannerStyles();

  return (
    <div className={`rounded-3xl border p-5 sm:p-6 mb-6 text-[#3E3C38] transition-all ${style.bgBg}`}>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        {/* Left: Traffic Status Indicator & Main Copy */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-2xl bg-white border border-[#E5E1D8] shadow-xs flex items-center justify-center">
            {style.icon}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${style.badgeBg}`}>
                <span className={`w-2 h-2 rounded-full ${style.indicatorBg}`}></span>
                Traffic Light: {trafficLight.status} STATUS
              </span>
              <span className="text-xs text-[#8E8B82] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#A09D94]" />
                Updated {new Date(trafficLight.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <h2 className={`text-xl sm:text-2xl font-serif font-bold ${style.titleColor}`}>
              {trafficLight.headline}
            </h2>

            <p className="text-sm text-[#5A5A40] mt-1 max-w-2xl leading-relaxed font-medium">
              {trafficLight.description}
            </p>

            {trafficLight.nextDose && (
              <div className="mt-3 inline-flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-xl border border-[#E5E1D8] text-xs text-[#3E3C38]">
                <Clock className="w-3.5 h-3.5 text-[#D4A373]" />
                <span className="text-[#8E8B82]">Next Scheduled Dose:</span>
                <strong className="text-[#5A5A40]">{trafficLight.nextDose.medicineName} ({trafficLight.nextDose.category.replace('_', ' ')})</strong>
                <span className="text-[#845217] bg-[#D4A373]/20 px-2 py-0.5 rounded-lg text-[11px] font-semibold">
                  At {trafficLight.nextDose.scheduledTime} ({trafficLight.nextDose.bufferMinutesRemaining}m buffer remaining)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Metrics Grid & Escalation Call Action */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 border-t lg:border-t-0 lg:border-l border-[#E5E1D8] lg:pl-6 pt-4 lg:pt-0">
          
          <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-2xl border border-[#E5E1D8] text-center min-w-[260px] shadow-xs">
            <div>
              <div className="text-[11px] uppercase font-bold text-[#A09D94]">Logged</div>
              <div className="text-xl font-bold font-serif text-[#889E81]">
                {trafficLight.takenCountToday} / {trafficLight.totalPrescriptionsToday}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase font-bold text-[#A09D94]">Pending</div>
              <div className="text-xl font-bold font-serif text-[#D4A373]">
                {trafficLight.pendingCountToday}
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase font-bold text-[#A09D94]">Missed</div>
              <div className={`text-xl font-bold font-serif ${trafficLight.missedCountToday > 0 ? 'text-rose-600 animate-pulse' : 'text-[#A09D94]'}`}>
                {trafficLight.missedCountToday}
              </div>
            </div>
          </div>

          {trafficLight.status === 'RED' && (
            <a
              href={`tel:${caregiverPhone}`}
              className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-sm px-4 py-3 rounded-xl shadow-md transition-all border border-rose-400/30 animate-pulse shrink-0"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Call {elderName} Now</span>
            </a>
          )}

        </div>

      </div>
    </div>
  );
};
