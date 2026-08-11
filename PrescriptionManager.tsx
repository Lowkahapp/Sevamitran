import React, { useState } from 'react';
import { Prescription, MedCategory } from '../types';
import {
  Pill,
  Plus,
  Trash2,
  Camera,
  Check,
  Clock,
  FileText,
  Sparkles,
  UploadCloud,
  X,
  Heart,
  Activity,
  ShieldAlert,
} from 'lucide-react';

interface PrescriptionManagerProps {
  prescriptions: Prescription[];
  onAddPrescription: (rx: Partial<Prescription>) => Promise<void>;
  onTogglePrescription: (id: string) => Promise<void>;
  onDeletePrescription: (id: string) => Promise<void>;
  onScanPillStrip: (imageBase64: string) => Promise<any>;
}

export const PrescriptionManager: React.FC<PrescriptionManagerProps> = ({
  prescriptions,
  onAddPrescription,
  onTogglePrescription,
  onDeletePrescription,
  onScanPillStrip,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Form fields
  const [medicineName, setMedicineName] = useState('');
  const [category, setCategory] = useState<MedCategory>('blood_pressure');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [dosageInstruction, setDosageInstruction] = useState('1 tablet after meals');

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) return;

    await onAddPrescription({
      medicineName,
      category,
      scheduledTime,
      dosageInstruction,
      isActive: true,
    });

    setIsModalOpen(false);
    setMedicineName('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      const res = await onScanPillStrip(base64Data);
      if (res && res.result) {
        setMedicineName(res.result.medicineName || '');
        if (res.result.category) setCategory(res.result.category);
        if (res.result.scheduledTime) setScheduledTime(res.result.scheduledTime);
        if (res.result.dosageInstruction) setDosageInstruction(res.result.dosageInstruction);
      }
      setIsScanning(false);
    };
  };

  const getCategoryBadge = (cat: MedCategory) => {
    switch (cat) {
      case 'blood_pressure':
        return { label: 'Blood Pressure', bg: 'bg-rose-100 text-rose-800 border-rose-200' };
      case 'diabetes':
        return { label: 'Diabetes', bg: 'bg-[#D4A373]/20 text-[#845217] border-[#D4A373]/30' };
      case 'heart':
        return { label: 'Heart Care', bg: 'bg-red-100 text-red-800 border-red-200' };
      case 'general':
        return { label: 'General / Vitamins', bg: 'bg-[#889E81]/20 text-[#3B5834] border-[#889E81]/30' };
    }
  };

  return (
    <div className="bg-white border border-[#E5E1D8] rounded-3xl p-6 text-[#3E3C38] shadow-xs">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5E1D8] mb-6">
        <div>
          <h3 className="text-lg font-serif font-bold text-[#5A5A40] flex items-center gap-2">
            <Pill className="w-5 h-5 text-[#889E81]" />
            <span>Senior Doctor Prescriptions & Schedules</span>
          </h3>
          <p className="text-xs text-[#8E8B82] mt-1 font-medium">
            Manage daily chronic medication schedules. SevaMitr evaluates adherence against these windows.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#889E81] hover:bg-[#778D70] text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition shadow-xs cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add / Scan Prescription</span>
        </button>
      </div>

      {/* Grid of Active Prescriptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prescriptions.map((rx) => {
          const badge = getCategoryBadge(rx.category);
          return (
            <div
              key={rx.id}
              className={`p-4 rounded-2xl border transition-all ${
                rx.isActive
                  ? 'bg-[#FDFCF9] border-[#E5E1D8] hover:border-[#D1CDC2] shadow-xs'
                  : 'bg-[#F3F0E9]/60 border-[#E5E1D8] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <h4 className="text-base font-serif font-bold text-[#5A5A40] mt-1.5">{rx.medicineName}</h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onTogglePrescription(rx.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                      rx.isActive
                        ? 'bg-[#889E81]/20 text-[#3B5834] border-[#889E81]/30 hover:bg-[#889E81]/30'
                        : 'bg-[#EAE6DD] text-[#7A776F] border-[#D1CDC2]'
                    }`}
                  >
                    {rx.isActive ? 'Active' : 'Paused'}
                  </button>

                  <button
                    onClick={() => onDeletePrescription(rx.id)}
                    className="p-1.5 text-[#A09D94] hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                    title="Delete Prescription"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-[#3E3C38] mt-3 pt-2 border-t border-[#E5E1D8]">
                <span className="flex items-center gap-1 text-[#845217] font-mono font-semibold">
                  <Clock className="w-3.5 h-3.5 text-[#D4A373]" />
                  {rx.scheduledTime}
                </span>

                <span className="text-[#8E8B82] truncate font-medium">
                  {rx.dosageInstruction}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / AI Scan Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white border border-[#E5E1D8] rounded-3xl max-w-lg w-full p-6 text-[#3E3C38] shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E1D8]">
              <h3 className="font-serif font-bold text-base text-[#5A5A40] flex items-center gap-2">
                <Plus className="w-5 h-5 text-[#889E81]" />
                Add Medication / Scan Pill Strip
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#A09D94] hover:text-[#3E3C38] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* AI Vision Pill Scanner Section */}
            <div className="bg-[#F3F0E9] p-4 rounded-2xl border border-[#E5E1D8] text-center">
              <label className="cursor-pointer block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="flex flex-col items-center justify-center py-3 text-[#5A5A40] hover:text-[#3B5834] transition">
                  <Sparkles className={`w-8 h-8 text-[#D4A373] mb-2 ${isScanning ? 'animate-spin' : ''}`} />
                  <span className="font-semibold text-xs text-[#3B5834]">
                    {isScanning ? 'Scanning Pill Strip with Gemini AI...' : '📸 Upload Pill Strip Image for AI Auto-Fill'}
                  </span>
                  <span className="text-[11px] text-[#8E8B82] mt-0.5">
                    Click to browse prescription photo or pill box
                  </span>
                </div>
              </label>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#5A5A40] mb-1">
                  Medicine Name & Strength
                </label>
                <input
                  type="text"
                  required
                  value={medicineName}
                  onChange={(e) => setMedicineName(e.target.value)}
                  placeholder="e.g. Amlodipine 5mg, Metformin 500mg"
                  className="w-full bg-[#FDFCF9] border border-[#D1CDC2] rounded-xl px-3.5 py-2 text-sm text-[#3E3C38] focus:outline-none focus:border-[#889E81]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MedCategory)}
                    className="w-full bg-[#FDFCF9] border border-[#D1CDC2] rounded-xl px-3.5 py-2 text-sm text-[#3E3C38] focus:outline-none focus:border-[#889E81]"
                  >
                    <option value="blood_pressure">Blood Pressure</option>
                    <option value="diabetes">Diabetes</option>
                    <option value="heart">Heart Care</option>
                    <option value="general">General / Vitamins</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#5A5A40] mb-1">
                    Scheduled Time (24h)
                  </label>
                  <input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full bg-[#FDFCF9] border border-[#D1CDC2] rounded-xl px-3.5 py-2 text-sm text-[#3E3C38] focus:outline-none focus:border-[#889E81]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A5A40] mb-1">
                  Dosage Instruction
                </label>
                <input
                  type="text"
                  value={dosageInstruction}
                  onChange={(e) => setDosageInstruction(e.target.value)}
                  placeholder="e.g., 1 tablet after breakfast with warm water"
                  className="w-full bg-[#FDFCF9] border border-[#D1CDC2] rounded-xl px-3.5 py-2 text-sm text-[#3E3C38] focus:outline-none focus:border-[#889E81]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E1D8]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#7A776F] hover:text-[#3E3C38] cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="bg-[#889E81] hover:bg-[#778D70] text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                >
                  Save Prescription Schedule
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
