import { Profile, Prescription, AdherenceLog, EscalationAlert, WhatsAppPayloadLog } from '../types';

export const initialProfiles: Profile[] = [
  {
    id: 'p-elder-01',
    fullName: 'Ramesh Sharma (Uncle Ji)',
    phoneNumber: '+91 98765 43210',
    role: 'elder',
    language: 'Hinglish',
    city: 'Jaipur, Rajasthan',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'p-caregiver-01',
    fullName: 'Anand Sharma',
    phoneNumber: '+91 91234 56789',
    role: 'caregiver',
    relation: 'Son (Living in Bengaluru)',
    language: 'English / Hindi',
    city: 'Bengaluru, Karnataka',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
];

export const initialPrescriptions: Prescription[] = [
  {
    id: 'rx-01',
    elderId: 'p-elder-01',
    medicineName: 'Amlodipine 5mg',
    category: 'blood_pressure',
    scheduledTime: '09:00',
    dosageInstruction: '1 tablet after breakfast with warm water',
    isActive: true,
    pillImageUrl: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rx-02',
    elderId: 'p-elder-01',
    medicineName: 'Metformin 500mg',
    category: 'diabetes',
    scheduledTime: '14:00',
    dosageInstruction: '1 tablet after lunch',
    isActive: true,
    pillImageUrl: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rx-03',
    elderId: 'p-elder-01',
    medicineName: 'Atorvastatin 10mg',
    category: 'heart',
    scheduledTime: '21:00',
    dosageInstruction: '1 tablet before bedtime',
    isActive: true,
    pillImageUrl: 'https://images.unsplash.com/photo-1550572017-edd951aa8f72?w=300&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rx-04',
    elderId: 'p-elder-01',
    medicineName: 'Becosules Z Multivitamin',
    category: 'general',
    scheduledTime: '09:00',
    dosageInstruction: '1 capsule with morning tea/milk',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const today = new Date();
const todayStr = today.toISOString().split('T')[0];

export const initialLogs: AdherenceLog[] = [
  {
    id: 'log-101',
    elderId: 'p-elder-01',
    prescriptionId: 'rx-01',
    medicineName: 'Amlodipine 5mg',
    category: 'blood_pressure',
    rawTranscription: 'Beta, maine subah ki B.P. ki goli kha li hai chai ke baad.',
    status: 'taken',
    timeContext: 'morning',
    confidenceScore: 0.98,
    loggedAt: `${todayStr}T09:12:00.000Z`,
    affirmationResponse: 'Bahut ache Ramesh Uncle Ji! B.P. ki goli log kar li hai. Apni sehat ka dhyan rakhein.',
  },
  {
    id: 'log-102',
    elderId: 'p-elder-01',
    prescriptionId: 'rx-04',
    medicineName: 'Becosules Z Multivitamin',
    category: 'general',
    rawTranscription: 'Subah wali vitamin goli bhi le li beta.',
    status: 'taken',
    timeContext: 'morning',
    confidenceScore: 0.95,
    loggedAt: `${todayStr}T09:13:15.000Z`,
    affirmationResponse: 'Shabaash Uncle Ji! Multivitamin bhi mark ho gaya hai.',
  },
];

export const initialEscalations: EscalationAlert[] = [
  {
    id: 'esc-01',
    elderId: 'p-elder-01',
    prescriptionId: 'rx-02',
    medicineName: 'Metformin 500mg',
    scheduledTime: '14:00',
    caregiverPhone: '+91 91234 56789',
    sentAt: `${todayStr}T15:05:00.000Z`,
    channel: 'whatsapp_template',
    templateName: 'caregiver_missed_medication_alert_v1',
    status: 'sent',
    messageText: '🚨 SevaMitr Alert: Ramesh Sharma has missed their 02:00 PM Diabetes dosage (Metformin 500mg) by >60 minutes. Please check in with them.',
  },
];

export const initialWebhookLogs: WhatsAppPayloadLog[] = [
  {
    id: 'wh-01',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    direction: 'inbound',
    type: 'audio',
    fromNumber: '+91 98765 43210',
    toNumber: '+91 80000 12345 (Meta Cloud Webhook)',
    rawPayload: {
      object: 'whatsapp_business_account',
      entry: [{
        id: 'META_WABA_98231',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '1555023901', phone_number_id: '109283019' },
            messages: [{
              from: '919876543210',
              id: 'wamid.HBgMOTE5ODc2NTQzMjEwFQIAERgSQjE0RTY4RjA5RDI1RjkyM0E2AA==',
              timestamp: '1723368000',
              type: 'audio',
              audio: { mime_type: 'audio/ogg; codecs=opus', id: 'media_id_992102' }
            }]
          }
        }]
      }]
    },
    parsedResult: {
      transcription: 'Beta, maine subah ki B.P. ki goli kha li hai chai ke baad.',
      category: 'blood_pressure',
      status: 'taken',
      affirmation: 'Bahut ache Ramesh Uncle Ji! B.P. ki goli log kar li hai.',
    }
  }
];
