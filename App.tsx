import React, { useState, useEffect } from 'react';
import {
  Profile,
  Prescription,
  AdherenceLog,
  EscalationAlert,
  WhatsAppPayloadLog,
  TrafficLightStatus,
} from './types';
import { Header } from './components/Header';
import { TrafficLightBanner } from './components/TrafficLightBanner';
import { WhatsAppInterface } from './components/WhatsAppInterface';
import { PrescriptionManager } from './components/PrescriptionManager';
import { AdherenceLogFeed } from './components/AdherenceLogFeed';
import { EscalationMonitor } from './components/EscalationMonitor';
import { RegionalReminderGenerator } from './components/RegionalReminderGenerator';
import {
  Sparkles,
  Heart,
  ShieldCheck,
  Zap,
  Activity,
  RefreshCw,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'whatsapp' | 'dashboard' | 'webhook'>('dashboard');

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [logs, setLogs] = useState<AdherenceLog[]>([]);
  const [escalations, setEscalations] = useState<EscalationAlert[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WhatsAppPayloadLog[]>([]);
  const [trafficLight, setTrafficLight] = useState<TrafficLightStatus | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [processingAudio, setProcessingAudio] = useState<boolean>(false);
  const [cronLoading, setCronLoading] = useState<boolean>(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Fetch initial app state from backend server
  const fetchState = async () => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) throw new Error('Failed to fetch state');
      const data = await res.json();
      setProfiles(data.profiles || []);
      setPrescriptions(data.prescriptions || []);
      setLogs(data.logs || []);
      setEscalations(data.escalations || []);
      setWebhookLogs(data.webhookLogs || []);
      setTrafficLight(data.trafficLight || null);
    } catch (err) {
      console.error('Error fetching state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Process Elder WhatsApp speech or text message
  const handleSendMessage = async (payload: { text?: string; audioBase64?: string; mimeType?: string }) => {
    setProcessingAudio(true);
    try {
      const res = await fetch('/api/process-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        await fetchState();
        showNotification(`Log processed: ${data.parsed?.category} marked ${data.parsed?.status.toUpperCase()}`);
        return data;
      }
    } catch (err) {
      console.error('Error processing audio message:', err);
    } finally {
      setProcessingAudio(false);
    }
  };

  // Add Prescription
  const handleAddPrescription = async (rx: Partial<Prescription>) => {
    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rx),
      });
      if (res.ok) {
        await fetchState();
        showNotification('New prescription schedule added.');
      }
    } catch (err) {
      console.error('Error adding prescription:', err);
    }
  };

  // Toggle Prescription
  const handleTogglePrescription = async (id: string) => {
    try {
      const res = await fetch('/api/prescriptions/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchState();
      }
    } catch (err) {
      console.error('Error toggling prescription:', err);
    }
  };

  // Delete Prescription
  const handleDeletePrescription = async (id: string) => {
    try {
      const res = await fetch(`/api/prescriptions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchState();
        showNotification('Prescription removed.');
      }
    } catch (err) {
      console.error('Error deleting prescription:', err);
    }
  };

  // Scan Pill Strip Vision AI
  const handleScanPillStrip = async (imageBase64: string) => {
    try {
      const res = await fetch('/api/scan-pill-strip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64 }),
      });
      return await res.json();
    } catch (err) {
      console.error('Error scanning pill strip image:', err);
    }
  };

  // Trigger 15-min Cron Check Simulation
  const handleTriggerCron = async () => {
    setCronLoading(true);
    try {
      const res = await fetch('/api/trigger-cron-check', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchState();
        if (data.newlyEscalatedCount > 0) {
          showNotification(`🚨 ${data.newlyEscalatedCount} missed dosage escalation alert(s) dispatched to caregiver!`);
        } else {
          showNotification('15-min Cron Check completed: All active doses logged or within safe buffer.');
        }
      }
    } catch (err) {
      console.error('Error running cron check:', err);
    } finally {
      setCronLoading(false);
    }
  };

  // Acknowledge Escalation
  const handleAcknowledgeEscalation = async (id: string) => {
    try {
      const res = await fetch('/api/escalations/acknowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchState();
        showNotification('Escalation alert acknowledged.');
      }
    } catch (err) {
      console.error('Error acknowledging escalation:', err);
    }
  };

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  const elderProfile = profiles.find((p) => p.role === 'elder') || {
    id: 'p-elder-01',
    fullName: 'Ramesh Sharma (Uncle Ji)',
    phoneNumber: '+91 98765 43210',
    role: 'elder',
    language: 'Hinglish',
    city: 'Jaipur',
    createdAt: '',
  };

  if (loading || !trafficLight) {
    return (
      <div className="min-h-screen bg-[#F9F7F2] text-[#3E3C38] flex flex-col items-center justify-center p-6">
        <Sparkles className="w-12 h-12 text-[#889E81] animate-spin mb-4" />
        <h2 className="text-lg font-bold font-serif text-[#5A5A40]">Starting SevaMitr Core Engine...</h2>
        <p className="text-xs text-[#8E8B82] mt-1">Connecting Gemini AI parser & Supabase database tables</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9F7F2] text-[#3E3C38] font-sans selection:bg-[#889E81] selection:text-white pb-16">
      
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        trafficLight={trafficLight}
        profiles={profiles}
        onTriggerCron={handleTriggerCron}
        cronLoading={cronLoading}
      />

      {/* Floating Notification Toast */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#889E81] border border-[#6E8367] text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-bounce">
          <Zap className="w-4 h-4 text-[#FDFCF9]" />
          <span>{notificationMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Always visible: Traffic Light Banner */}
        <TrafficLightBanner
          trafficLight={trafficLight}
          elderName={elderProfile.fullName}
          caregiverPhone="+91 98765 43210"
          onRunCronCheck={handleTriggerCron}
        />

        {/* Tab View 1: Caregiver Dashboard (Primary) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Prescriptions & AI Scanner */}
            <PrescriptionManager
              prescriptions={prescriptions}
              onAddPrescription={handleAddPrescription}
              onTogglePrescription={handleTogglePrescription}
              onDeletePrescription={handleDeletePrescription}
              onScanPillStrip={handleScanPillStrip}
            />

            {/* Automated Regional Dialect WhatsApp Reminders */}
            <RegionalReminderGenerator
              prescriptions={prescriptions}
              elderProfile={elderProfile}
              onReminderSent={fetchState}
            />

            {/* Adherence Live Log Stream */}
            <AdherenceLogFeed logs={logs} />

            {/* Active Escalation Alerts */}
            <EscalationMonitor
              escalations={escalations}
              webhookLogs={webhookLogs}
              onAcknowledge={handleAcknowledgeEscalation}
              elderPhone={elderProfile.phoneNumber}
            />
          </div>
        )}

        {/* Tab View 2: Elder WhatsApp Interface Simulator */}
        {activeTab === 'whatsapp' && (
          <WhatsAppInterface
            elderProfile={elderProfile}
            logs={logs}
            onSendMessage={handleSendMessage}
            loading={processingAudio}
          />
        )}

        {/* Tab View 3: Developer Meta Webhook Inspector */}
        {activeTab === 'webhook' && (
          <EscalationMonitor
            escalations={escalations}
            webhookLogs={webhookLogs}
            onAcknowledge={handleAcknowledgeEscalation}
            elderPhone={elderProfile.phoneNumber}
          />
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-[#E5E1D8] text-center text-xs text-[#8E8B82] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="flex items-center gap-1.5 font-medium">
          <Heart className="w-3.5 h-3.5 text-[#D4A373]" />
          <span>SevaMitr (सेवामित्र) — Zero-UI Geriatric Care Assistant</span>
        </p>
        <p className="font-mono text-[11px] text-[#A09D94]">
          Built with Express + Vite + Gemini 3.6 Flash + Meta Cloud API Architecture
        </p>
      </footer>

    </div>
  );
}
