import React, { useState } from 'react';
import { EscalationAlert, WhatsAppPayloadLog } from '../types';
import {
  Bell,
  CheckCircle,
  Clock,
  PhoneCall,
  Send,
  Code,
  ShieldAlert,
  Terminal,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface EscalationMonitorProps {
  escalations: EscalationAlert[];
  webhookLogs: WhatsAppPayloadLog[];
  onAcknowledge: (id: string) => Promise<void>;
  elderPhone: string;
}

export const EscalationMonitor: React.FC<EscalationMonitorProps> = ({
  escalations,
  webhookLogs,
  onAcknowledge,
  elderPhone, }) => {
  const [expandedWebhookId, setExpandedWebhookId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      
      {/* Active Escalation Alerts Section */}
      <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 text-[#3E3C38] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E1D8] mb-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#5A5A40] flex items-center gap-2">
              <Bell className="w-5 h-5 text-rose-600 animate-pulse" />
              <span>Proactive Meta WhatsApp Escalation Alerts</span>
            </h3>
            <p className="text-xs text-[#8E8B82] mt-1 font-medium">
              Triggered automatically when a senior misses a dosage past the 60-minute safety threshold.
            </p>
          </div>

          <span className="text-xs bg-rose-100 text-rose-800 border border-rose-200 px-3 py-1 rounded-full font-bold">
            {escalations.filter((e) => e.status === 'sent').length} Active Alerts
          </span>
        </div>

        <div className="space-y-3">
          {escalations.length === 0 ? (
            <div className="text-center py-6 text-[#A09D94] text-xs font-medium">
              No escalation alerts triggered. All medications are logged on time!
            </div>
          ) : (
            escalations.map((esc) => (
              <div
                key={esc.id}
                className={`p-4 rounded-2xl border transition ${
                  esc.status === 'sent'
                    ? 'bg-rose-50/80 border-rose-200'
                    : 'bg-[#FDFCF9] border-[#E5E1D8]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert
                      className={`w-6 h-6 mt-0.5 shrink-0 ${
                        esc.status === 'sent' ? 'text-rose-600 animate-bounce' : 'text-[#A09D94]'
                      }`}
                    />

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-rose-900">
                          {esc.medicineName} ({esc.scheduledTime})
                        </span>
                        <span className="text-[10px] bg-[#F3F0E9] text-[#5A5A40] px-2 py-0.5 rounded-md font-mono border border-[#E5E1D8]">
                          Template: {esc.templateName}
                        </span>
                      </div>

                      <p className="text-sm text-[#3E3C38] font-medium">
                        {esc.messageText}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-[#8E8B82] mt-2 font-medium">
                        <span>Sent To Caregiver: {esc.caregiverPhone}</span>
                        <span>•</span>
                        <span>
                          {new Date(esc.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {esc.status === 'sent' ? (
                      <button
                        onClick={() => onAcknowledge(esc.id)}
                        className="flex items-center gap-1.5 bg-[#F3F0E9] hover:bg-[#EAE6DD] text-[#5A5A40] text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#E5E1D8] transition cursor-pointer"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-[#889E81]" />
                        <span>Acknowledge</span>
                      </button>
                    ) : (
                      <span className="text-xs text-[#3B5834] bg-[#889E81]/20 px-2.5 py-1 rounded-xl border border-[#889E81]/30 flex items-center gap-1 font-semibold">
                        <CheckCircle className="w-3.5 h-3.5" /> Acknowledged
                      </span>
                    )}

                    <a
                      href={`tel:${elderPhone}`}
                      className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xs transition"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Senior</span>
                    </a>
                  </div>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Meta Webhooks Payload Inspector (Developer View) */}
      <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 text-[#3E3C38] shadow-xs">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E1D8] mb-6">
          <div>
            <h3 className="text-lg font-serif font-bold text-[#5A5A40] flex items-center gap-2">
              <Code className="w-5 h-5 text-[#889E81]" />
              <span>Meta Cloud API Webhook Stream Inspector</span>
            </h3>
            <p className="text-xs text-[#8E8B82] mt-1 font-medium">
              Raw JSON payloads received at <code>/api/simulate-whatsapp-webhook</code> or sent via Meta Cloud API.
            </p>
          </div>

          <span className="text-xs bg-[#F3F0E9] text-[#5A5A40] border border-[#E5E1D8] px-2.5 py-1 rounded-lg font-mono font-bold">
            {webhookLogs.length} Events Logged
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {webhookLogs.map((wh) => {
            const isExpanded = expandedWebhookId === wh.id;
            return (
              <div
                key={wh.id}
                className="bg-[#FDFCF9] border border-[#E5E1D8] rounded-2xl overflow-hidden"
              >
                <div
                  onClick={() => setExpandedWebhookId(isExpanded ? null : wh.id)}
                  className="p-3 bg-[#FDFCF9] hover:bg-[#F3F0E9] cursor-pointer flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        wh.direction === 'inbound'
                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                          : 'bg-[#889E81]/20 text-[#3B5834] border border-[#889E81]/30'
                      }`}
                    >
                      {wh.direction}
                    </span>

                    <span className="text-[#3E3C38] font-sans text-xs">
                      Type: <strong>{wh.type}</strong> ({wh.fromNumber} → {wh.toNumber})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[#A09D94] text-[11px]">
                    <span>{new Date(wh.timestamp).toLocaleTimeString()}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 bg-[#2D2C28] border-t border-[#E5E1D8] overflow-x-auto text-[11px] text-[#A2C398]">
                    <pre className="leading-relaxed">{JSON.stringify(wh.rawPayload, null, 2)}</pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
