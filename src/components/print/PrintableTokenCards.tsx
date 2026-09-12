import React, { useEffect, useState } from 'react';
import { Voter, School, ElectionPeriod } from '../../types';
import QRCode from 'qrcode';
import { Printer, ArrowLeft, Scissors, ShieldAlert } from 'lucide-react';

interface PrintableTokenCardsProps {
  school: School;
  activePeriod: ElectionPeriod | null;
  voters: Voter[];
  onBack: () => void;
}

interface VoterCardData extends Voter {
  qrDataUrl?: string;
}

export const PrintableTokenCards: React.FC<PrintableTokenCardsProps> = ({
  school,
  activePeriod,
  voters,
  onBack,
}) => {
  const [cardsWithQr, setCardsWithQr] = useState<VoterCardData[]>([]);
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function generateQrs() {
      setIsGenerating(true);
      const generated = await Promise.all(
        voters.map(async (v) => {
          try {
            // QR format: NISN#PIN untuk kemudahan scanner bilik
            const qrText = `EPILKETOS:${v.nisn}:${v.pin_plain}`;
            const qrDataUrl = await QRCode.toDataURL(qrText, {
              width: 100,
              margin: 1,
              color: {
                dark: '#0f172a',
                light: '#ffffff',
              },
            });
            return { ...v, qrDataUrl };
          } catch {
            return v;
          }
        })
      );

      if (isMounted) {
        setCardsWithQr(generated);
        setIsGenerating(false);
      }
    }

    generateQrs();

    return () => {
      isMounted = false;
    };
  }, [voters]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-100 min-h-screen p-4 sm:p-8 print:p-0 print:bg-white text-slate-900">
      {/* Control Toolbar (Hidden in Print) */}
      <div className="max-w-5xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4 print:hidden bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Panel Panitia</span>
          </button>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Cetak Kartu Suara &amp; Token Pemilih
            </h2>
            <p className="text-xs text-slate-500">
              Total {cardsWithQr.length} kartu siap cetak (Ukuran Grid Siap Potong A4)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{isGenerating ? 'Memuat QR Code...' : 'Cetak Dokumen (Print)'}</span>
          </button>
        </div>
      </div>

      {/* Sheet Container */}
      <div className="max-w-5xl mx-auto bg-white p-4 sm:p-8 rounded-2xl shadow-xl print:shadow-none print:p-0">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 print:grid-cols-3 gap-4">
          {cardsWithQr.map((voter) => (
            <div
              key={voter.id}
              className="border-2 border-dashed border-slate-300 rounded-xl p-3.5 bg-white relative flex flex-col justify-between break-inside-avoid print:border-slate-400"
            >
              {/* Cut Icon Marker */}
              <div className="absolute -top-2.5 right-3 bg-white px-1.5 text-slate-400 flex items-center gap-0.5 text-[9px] print:hidden">
                <Scissors className="w-3 h-3" />
                <span>potong di sini</span>
              </div>

              <div>
                {/* Header Kartu */}
                <div className="border-b border-slate-200 pb-2 mb-2 text-center">
                  <div className="text-[10px] font-extrabold text-blue-800 uppercase tracking-wider">
                    {school.type === 'OSIM' ? 'KARTU PEMILIH OSIM' : 'KARTU SUARA PILKETOS'}
                  </div>
                  <div className="text-[11px] font-bold text-slate-900 leading-tight">
                    {school.name}
                  </div>
                  <div className="text-[9px] text-slate-500">
                    {activePeriod?.academic_year || '2026/2027'}
                  </div>
                </div>

                {/* Identity & QR Code */}
                <div className="flex items-center justify-between gap-2 my-2">
                  <div className="space-y-1 text-left flex-1 min-w-0">
                    <div>
                      <span className="text-[9px] text-slate-400 font-semibold block uppercase">
                        Nama Pemilih
                      </span>
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        {voter.full_name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div>
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase">
                          Kelas
                        </span>
                        <span className="text-xs font-semibold text-slate-700 font-mono">
                          {voter.class_name}
                        </span>
                      </div>
                      <div className="ml-2">
                        <span className="text-[9px] text-slate-400 font-semibold block uppercase">
                          Gender
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          {voter.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 font-semibold block uppercase">
                        NISN
                      </span>
                      <span className="text-xs font-bold font-mono text-slate-800">
                        {voter.nisn}
                      </span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="w-18 h-18 shrink-0 bg-slate-50 p-1 rounded-lg border border-slate-200 flex items-center justify-center">
                    {voter.qrDataUrl ? (
                      <img
                        src={voter.qrDataUrl}
                        alt={`QR ${voter.nisn}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-[9px] text-slate-400">QR Code</div>
                    )}
                  </div>
                </div>

                {/* Big PIN Highlight */}
                <div className="bg-slate-900 text-white rounded-lg p-2 text-center my-2">
                  <span className="text-[9px] uppercase tracking-widest text-slate-300 font-bold block">
                    KODE TOKEN PIN RAHASIA
                  </span>
                  <span className="text-xl font-black font-mono tracking-widest text-emerald-400">
                    {voter.pin_plain}
                  </span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="text-[8px] text-slate-500 border-t border-slate-100 pt-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <ShieldAlert className="w-2.5 h-2.5 text-amber-600" />
                  <span>Jaga Kerahasiaan PIN</span>
                </span>
                <span className="font-mono">Sekali Pakai</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
