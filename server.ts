import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { store } from './src/server/store';
import { parseElderAudioOrText, scanPillStripOrPrescription, generateRegionalReminderMessage } from './src/server/geminiParser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser with 15mb limit for audio base64 payload
  app.use(express.json({ limit: '15mb' }));

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', app: 'SevaMitr Care Assistant', timestamp: new Date().toISOString() });
  });

  // Get full app state
  app.get('/api/data', (req, res) => {
    const traffic = store.evaluateTrafficLight();
    res.json({
      profiles: store.getProfiles(),
      prescriptions: store.getPrescriptions(),
      logs: store.getLogs(),
      escalations: store.getEscalations(),
      webhookLogs: store.getWebhookLogs(),
      trafficLight: traffic,
    });
  });

  // Process Elder Audio / Text input
  app.post('/api/process-audio', async (req, res) => {
    try {
      const { text, audioBase64, mimeType } = req.body;

      // Active prescriptions list for Gemini context
      const prescriptions = store.getPrescriptions().filter((p) => p.isActive);
      const rxContextStr = prescriptions
        .map((p) => `${p.medicineName} (${p.category}) at ${p.scheduledTime}`)
        .join(', ');

      const parsed = await parseElderAudioOrText(
        { text, audioBase64, mimeType },
        rxContextStr
      );

      // Find matching prescription ID if any
      const matchedRx = prescriptions.find((p) => p.category === parsed.category);

      const log = store.addLog({
        elderId: 'p-elder-01',
        prescriptionId: matchedRx ? matchedRx.id : undefined,
        medicineName: matchedRx ? matchedRx.medicineName : `${parsed.category.replace('_', ' ')} med`,
        category: parsed.category,
        rawTranscription: parsed.transcription,
        status: parsed.status,
        timeContext: 'current_time',
        confidenceScore: parsed.confidenceScore,
        affirmationResponse: parsed.affirmation,
      });

      const updatedTraffic = store.evaluateTrafficLight();

      res.json({
        success: true,
        log,
        parsed,
        trafficLight: updatedTraffic,
      });
    } catch (err: any) {
      console.error('Error in /api/process-audio:', err);
      res.status(500).json({ error: 'Failed to process audio message', message: err.message });
    }
  });

  // Scan Pill Strip / Prescription Image
  app.post('/api/scan-pill-strip', async (req, res) => {
    try {
      const { imageBase64, mimeType } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'imageBase64 required' });
      }

      const result = await scanPillStripOrPrescription(imageBase64, mimeType || 'image/jpeg');
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Error scanning pill strip:', err);
      res.status(500).json({ error: 'Failed to scan image', message: err.message });
    }
  });

  // Add Prescription
  app.post('/api/prescriptions', (req, res) => {
    try {
      const { medicineName, category, scheduledTime, dosageInstruction, pillImageUrl } = req.body;
      if (!medicineName || !category || !scheduledTime) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const newRx = store.addPrescription({
        elderId: 'p-elder-01',
        medicineName,
        category,
        scheduledTime,
        dosageInstruction: dosageInstruction || 'Take as directed',
        isActive: true,
        pillImageUrl,
      });

      res.json({ success: true, prescription: newRx, trafficLight: store.evaluateTrafficLight() });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Toggle Prescription
  app.post('/api/prescriptions/toggle', (req, res) => {
    const { id } = req.body;
    const rx = store.togglePrescription(id);
    if (!rx) return res.status(404).json({ error: 'Prescription not found' });
    res.json({ success: true, prescription: rx, trafficLight: store.evaluateTrafficLight() });
  });

  // Delete Prescription
  app.delete('/api/prescriptions/:id', (req, res) => {
    const deleted = store.deletePrescription(req.params.id);
    res.json({ success: deleted, trafficLight: store.evaluateTrafficLight() });
  });

  // Simulate Meta WhatsApp Cloud Webhook Endpoint
  app.post('/api/simulate-whatsapp-webhook', async (req, res) => {
    try {
      const payload = req.body;

      store.addWebhookLog({
        id: `wh-${Date.now()}`,
        timestamp: new Date().toISOString(),
        direction: 'inbound',
        type: payload.type || 'audio',
        fromNumber: payload.fromNumber || '+91 98765 43210 (Elder)',
        toNumber: '+91 80000 12345 (Meta Webhook)',
        rawPayload: payload,
      });

      let textToProcess = payload.text;
      let audioBase64ToProcess = payload.audioBase64;

      const parsed = await parseElderAudioOrText({
        text: textToProcess,
        audioBase64: audioBase64ToProcess,
      });

      const matchedRx = store.getPrescriptions().find((p) => p.category === parsed.category && p.isActive);

      const log = store.addLog({
        elderId: 'p-elder-01',
        prescriptionId: matchedRx?.id,
        medicineName: matchedRx?.medicineName || parsed.category,
        category: parsed.category,
        rawTranscription: parsed.transcription,
        status: parsed.status,
        timeContext: 'webhook_event',
        confidenceScore: parsed.confidenceScore,
        affirmationResponse: parsed.affirmation,
      });

      res.json({
        messaging_product: 'whatsapp',
        contacts: [{ wa_id: '919876543210' }],
        messages: [{ id: `wamid.${Date.now()}` }],
        sevaMitrParsed: parsed,
        loggedAdherence: log,
        trafficLight: store.evaluateTrafficLight(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Run 15-min Cron Check simulation
  app.post('/api/trigger-cron-check', (req, res) => {
    const result = store.runCronCheck();
    res.json({
      success: true,
      newlyEscalatedCount: result.newlyEscalatedCount,
      trafficLight: result.status,
      escalations: store.getEscalations(),
    });
  });

  // Acknowledge Escalation
  app.post('/api/escalations/acknowledge', (req, res) => {
    const { id } = req.body;
    const success = store.acknowledgeEscalation(id);
    res.json({ success, escalations: store.getEscalations() });
  });

  // Generate Warm Regional Dialect WhatsApp Template Reminder
  app.post('/api/generate-reminder', async (req, res) => {
    try {
      const { prescriptionId, dialect, elderName, phoneNumber } = req.body;

      const prescriptions = store.getPrescriptions();
      const rx = prescriptions.find((p) => p.id === prescriptionId) || prescriptions[0];
      const elder = store.getProfiles().find((p) => p.role === 'elder') || {
        fullName: 'Ramesh Sharma (Uncle Ji)',
        phoneNumber: '+91 98765 43210',
        language: 'Hinglish',
      };

      const result = await generateRegionalReminderMessage({
        elderName: elderName || elder.fullName,
        medicineName: rx ? rx.medicineName : 'Amlodipine 5mg',
        scheduledTime: rx ? rx.scheduledTime : '09:00',
        dosageInstruction: rx ? rx.dosageInstruction : '1 tablet after breakfast',
        dialect: dialect || elder.language || 'Hinglish',
        phoneNumber: phoneNumber || elder.phoneNumber,
      });

      // Log outbound Meta WhatsApp Template dispatch in webhook inspector
      store.addWebhookLog({
        id: `wh-${Date.now()}`,
        timestamp: new Date().toISOString(),
        direction: 'outbound',
        type: 'template',
        fromNumber: '+91 80000 12345 (SevaMitr Regional Reminders)',
        toNumber: `${phoneNumber || elder.phoneNumber} (Elder)`,
        rawPayload: result.whatsappTemplatePayload,
        parsedResult: {
          transcription: `[AUTOMATED ${result.dialect.toUpperCase()} REMINDER] ${result.warmMessage}`,
          category: rx ? rx.category : 'general',
          status: 'unknown',
          affirmation: result.warmMessage,
        },
      });

      // Also append to adherence logs so it immediately appears in the senior's WhatsApp feed simulation
      store.addLog({
        elderId: (elder as any).id || 'elder-001',
        timeContext: 'reminder',
        prescriptionId: rx ? rx.id : undefined,
        rawTranscription: `⏰ [Upcoming Dose Window Reminder in ${result.dialect}]`,
        category: rx ? rx.category : 'general',
        medicineName: rx ? rx.medicineName : 'Medication',
        status: 'unknown',
        affirmationResponse: result.warmMessage,
        confidenceScore: 1.0,
      });

      res.json({
        success: true,
        reminder: result,
        webhookLogs: store.getWebhookLogs(),
      });
    } catch (err: any) {
      console.error('Error in /api/generate-reminder:', err);
      res.status(500).json({ error: 'Failed to generate reminder', message: err.message });
    }
  });

  // Vite Middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SevaMitr backend running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
