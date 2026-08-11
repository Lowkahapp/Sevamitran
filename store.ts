import {
  Profile,
  Prescription,
  AdherenceLog,
  EscalationAlert,
  WhatsAppPayloadLog,
  TrafficLightStatus,
  TrafficLight,
} from '../types';
import {
  initialProfiles,
  initialPrescriptions,
  initialLogs,
  initialEscalations,
  initialWebhookLogs,
} from '../data/initialData';

class SevaMitrStore {
  private profiles: Profile[] = [...initialProfiles];
  private prescriptions: Prescription[] = [...initialPrescriptions];
  private logs: AdherenceLog[] = [...initialLogs];
  private escalations: EscalationAlert[] = [...initialEscalations];
  private webhookLogs: WhatsAppPayloadLog[] = [...initialWebhookLogs];

  public getProfiles(): Profile[] {
    return this.profiles;
  }

  public getPrescriptions(): Prescription[] {
    return this.prescriptions;
  }

  public getLogs(): AdherenceLog[] {
    return [...this.logs].sort(
      (a, b) => new Date(b.loggedAt).getTime() - new Date(a.loggedAt).getTime()
    );
  }

  public getEscalations(): EscalationAlert[] {
    return [...this.escalations].sort(
      (a, b) => new Date(b.sentAt).getTime() - new Date(a.sentAt).getTime()
    );
  }

  public getWebhookLogs(): WhatsAppPayloadLog[] {
    return [...this.webhookLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public addPrescription(rx: Omit<Prescription, 'id' | 'createdAt'>): Prescription {
    const newRx: Prescription = {
      ...rx,
      id: `rx-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.prescriptions.push(newRx);
    return newRx;
  }

  public togglePrescription(id: string): Prescription | null {
    const rx = this.prescriptions.find((p) => p.id === id);
    if (rx) {
      rx.isActive = !rx.isActive;
      return rx;
    }
    return null;
  }

  public deletePrescription(id: string): boolean {
    const index = this.prescriptions.findIndex((p) => p.id === id);
    if (index !== -1) {
      this.prescriptions.splice(index, 1);
      return true;
    }
    return false;
  }

  public addLog(log: Omit<AdherenceLog, 'id' | 'loggedAt'>): AdherenceLog {
    const newLog: AdherenceLog = {
      ...log,
      id: `log-${Date.now()}`,
      loggedAt: new Date().toISOString(),
    };
    this.logs.unshift(newLog);

    // Also record an outbound WhatsApp webhook event
    this.webhookLogs.unshift({
      id: `wh-${Date.now()}`,
      timestamp: new Date().toISOString(),
      direction: 'outbound',
      type: 'text',
      fromNumber: '+91 80000 12345 (SevaMitr Bot)',
      toNumber: '+91 98765 43210 (Elder)',
      rawPayload: {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '919876543210',
        type: 'text',
        text: { body: newLog.affirmationResponse || 'Log confirmed.' },
      },
      parsedResult: {
        transcription: newLog.rawTranscription,
        category: newLog.category,
        status: newLog.status,
        affirmation: newLog.affirmationResponse,
      },
    });

    return newLog;
  }

  public addWebhookLog(log: WhatsAppPayloadLog) {
    this.webhookLogs.unshift(log);
  }

  public acknowledgeEscalation(id: string): boolean {
    const esc = this.escalations.find((e) => e.id === id);
    if (esc) {
      esc.status = 'acknowledged';
      return true;
    }
    return false;
  }

  /**
   * Calculates the current Traffic Light status based on scheduled prescriptions vs logged adherence for today.
   */
  public evaluateTrafficLight(): TrafficLightStatus {
    const activeRxs = this.prescriptions.filter((p) => p.isActive);
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];

    // Filter today's logs
    const todayLogs = this.logs.filter((l) => l.loggedAt.startsWith(todayDateStr));

    let takenCount = 0;
    let missedCount = 0;
    let pendingCount = 0;

    const currentMinutes = today.getHours() * 60 + today.getMinutes();

    let hasRedMissed = false;
    let hasYellowUrgent = false;
    let closestNextDose: TrafficLightStatus['nextDose'] = undefined;
    let minBufferRemaining = Infinity;

    for (const rx of activeRxs) {
      // Parse scheduled HH:mm
      const [hStr, mStr] = rx.scheduledTime.split(':');
      const scheduledHour = parseInt(hStr || '9', 10);
      const scheduledMinute = parseInt(mStr || '0', 10);
      const scheduledMinutesTotal = scheduledHour * 60 + scheduledMinute;

      // Check if there is a 'taken' or 'skipped' log for this prescription category/id today
      const matchedLog = todayLogs.find(
        (l) => l.prescriptionId === rx.id || l.category === rx.category
      );

      if (matchedLog && matchedLog.status === 'taken') {
        takenCount++;
      } else if (matchedLog && matchedLog.status === 'skipped') {
        // counted as acknowledged skipped
      } else {
        // Not logged yet for today
        const diffMinutes = currentMinutes - scheduledMinutesTotal;

        if (diffMinutes > 60) {
          // Passed scheduled time by more than 60 minutes buffer without log!
          missedCount++;
          hasRedMissed = true;
        } else if (diffMinutes >= 0 && diffMinutes <= 60) {
          // Within 60 minutes past scheduled time
          pendingCount++;
          hasYellowUrgent = true;
          const bufferRemaining = 60 - diffMinutes;
          if (bufferRemaining < minBufferRemaining) {
            minBufferRemaining = bufferRemaining;
            closestNextDose = {
              medicineName: rx.medicineName,
              category: rx.category,
              scheduledTime: rx.scheduledTime,
              bufferMinutesRemaining: bufferRemaining,
            };
          }
        } else {
          // Future dose due later today
          pendingCount++;
          const minutesUntilDose = scheduledMinutesTotal - currentMinutes;
          if (minutesUntilDose < minBufferRemaining) {
            minBufferRemaining = minutesUntilDose;
            closestNextDose = {
              medicineName: rx.medicineName,
              category: rx.category,
              scheduledTime: rx.scheduledTime,
              bufferMinutesRemaining: minutesUntilDose,
            };
          }
        }
      }
    }

    let status: TrafficLight = 'GREEN';
    let headline = '🟢 All Medications On Track';
    let description = 'Ramesh Uncle Ji has logged all scheduled medications on time today.';

    if (hasRedMissed) {
      status = 'RED';
      headline = '🔴 CRITICAL: Missed Medication Window';
      description = `Attention! ${missedCount} medication dosage(s) missed past 60-minute safety buffer. Caregiver action required.`;
    } else if (hasYellowUrgent) {
      status = 'YELLOW';
      headline = '🟡 Medication Window Closing Soon';
      description = `Upcoming medication due within 60 minutes. Monitoring senior voice log.`;
    }

    return {
      status,
      headline,
      description,
      lastUpdated: new Date().toISOString(),
      takenCountToday: takenCount,
      totalPrescriptionsToday: activeRxs.length,
      missedCountToday: missedCount,
      pendingCountToday: pendingCount,
      nextDose: closestNextDose,
    };
  }

  /**
   * Simulates background 15-min Cron Job execution.
   * Checks for missed prescriptions (>60 mins past time) and triggers Meta Template Escalations to Caregiver.
   */
  public runCronCheck(): { newlyEscalatedCount: number; status: TrafficLightStatus } {
    const traffic = this.evaluateTrafficLight();
    const activeRxs = this.prescriptions.filter((p) => p.isActive);
    const today = new Date();
    const todayDateStr = today.toISOString().split('T')[0];
    const todayLogs = this.logs.filter((l) => l.loggedAt.startsWith(todayDateStr));
    const currentMinutes = today.getHours() * 60 + today.getMinutes();

    let newEscalations = 0;

    for (const rx of activeRxs) {
      const [hStr, mStr] = rx.scheduledTime.split(':');
      const scheduledMinutesTotal = parseInt(hStr || '9', 10) * 60 + parseInt(mStr || '0', 10);
      const diffMinutes = currentMinutes - scheduledMinutesTotal;

      const matchedLog = todayLogs.find(
        (l) => l.prescriptionId === rx.id || l.category === rx.category
      );

      // If missed past 60 minutes and no log exists, and no active escalation already sent for this rx today
      if (diffMinutes > 60 && !matchedLog) {
        const existingEscalation = this.escalations.find(
          (e) => e.prescriptionId === rx.id && e.sentAt.startsWith(todayDateStr)
        );

        if (!existingEscalation) {
          const newEsc: EscalationAlert = {
            id: `esc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            elderId: rx.elderId,
            prescriptionId: rx.id,
            medicineName: rx.medicineName,
            scheduledTime: rx.scheduledTime,
            caregiverPhone: '+91 91234 56789',
            sentAt: new Date().toISOString(),
            channel: 'whatsapp_template',
            templateName: 'caregiver_missed_medication_alert_v1',
            status: 'sent',
            messageText: `🚨 SevaMitr Alert: Ramesh Sharma missed their ${rx.scheduledTime} ${rx.medicineName} (${rx.category}) dosage by >60 minutes. Please call or check in!`,
          };
          this.escalations.unshift(newEsc);
          newEscalations++;

          // Add to Meta Webhook Outbound log
          this.webhookLogs.unshift({
            id: `wh-${Date.now()}`,
            timestamp: new Date().toISOString(),
            direction: 'outbound',
            type: 'template',
            fromNumber: '+91 80000 12345 (Meta Cloud Webhook)',
            toNumber: '+91 91234 56789 (Caregiver)',
            rawPayload: {
              messaging_product: 'whatsapp',
              to: '919123456789',
              type: 'template',
              template: {
                name: 'caregiver_missed_medication_alert_v1',
                language: { code: 'en_US' },
                components: [
                  {
                    type: 'body',
                    parameters: [
                      { type: 'text', text: 'Ramesh Sharma' },
                      { type: 'text', text: rx.medicineName },
                      { type: 'text', text: rx.scheduledTime },
                    ],
                  },
                ],
              },
            },
          });
        }
      }
    }

    return {
      newlyEscalatedCount: newEscalations,
      status: this.evaluateTrafficLight(),
    };
  }
}

export const store = new SevaMitrStore();
