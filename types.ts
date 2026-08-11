export type UserRole = 'elder' | 'caregiver';

export type MedCategory = 'blood_pressure' | 'diabetes' | 'heart' | 'general';

export type AdherenceStatus = 'taken' | 'skipped' | 'unknown';

export type TrafficLight = 'GREEN' | 'YELLOW' | 'RED';

export interface Profile {
  id: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  language: string; // e.g., 'Hinglish', 'Hindi', 'Bengali', 'English'
  city: string;
  relation?: string; // e.g. 'Son (NRI / Bengaluru)'
  avatarUrl?: string;
  createdAt: string;
}

export interface Prescription {
  id: string;
  elderId: string;
  medicineName: string;
  category: MedCategory;
  scheduledTime: string; // 'HH:mm:ss' or 'HH:mm' e.g. '09:00'
  dosageInstruction: string; // e.g. 'After breakfast with warm water'
  isActive: boolean;
  pillImageUrl?: string;
  createdAt: string;
}

export interface AdherenceLog {
  id: string;
  elderId: string;
  prescriptionId?: string;
  medicineName?: string;
  category: MedCategory;
  rawTranscription: string;
  status: AdherenceStatus;
  timeContext: string; // 'morning', 'afternoon', 'night', 'raw_timestamp'
  confidenceScore: number; // 0.0 to 1.0
  audioUrl?: string;
  loggedAt: string; // ISO date string
  affirmationResponse?: string;
}

export interface TrafficLightStatus {
  status: TrafficLight;
  headline: string;
  description: string;
  lastUpdated: string;
  takenCountToday: number;
  totalPrescriptionsToday: number;
  missedCountToday: number;
  pendingCountToday: number;
  nextDose?: {
    medicineName: string;
    category: MedCategory;
    scheduledTime: string;
    bufferMinutesRemaining: number;
  };
}

export interface EscalationAlert {
  id: string;
  elderId: string;
  prescriptionId: string;
  medicineName: string;
  scheduledTime: string;
  caregiverPhone: string;
  sentAt: string;
  channel: 'whatsapp_template' | 'sms';
  templateName: string;
  status: 'pending' | 'sent' | 'acknowledged';
  messageText: string;
}

export interface WhatsAppPayloadLog {
  id: string;
  timestamp: string;
  direction: 'inbound' | 'outbound';
  type: 'audio' | 'text' | 'template';
  fromNumber: string;
  toNumber: string;
  rawPayload: any;
  parsedResult?: {
    transcription?: string;
    category?: MedCategory;
    status?: AdherenceStatus;
    affirmation?: string;
  };
}
