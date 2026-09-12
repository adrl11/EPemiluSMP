import React from 'react';
import { Candidate } from '../../types';
import { X, CheckCircle2, Award, Video, User } from 'lucide-react';

interface CandidateDetailModalProps {
  candidate: Candidate | null;
  onClose: () => void;
  onVoteClick?: (candidate: Candidate) => void;
  showVoteButton?: boolean;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  onClose,
  onVoteClick,
  showVoteButton = false,
}) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white text-blue-900 font-extrabold text-2xl flex items-center justify-center shadow-lg border-2 border-blue-200">
              0{candidate.ballot_number}
            </div>
            <div>
              <div className="text-xs uppercase tracking-widest text-blue-200 font-semibold">
                Profil Pasangan Calon No. Urut 0{candidate.ballot_number}
              </div>
              <h2 className="text-xl font-bold mt-0.5">{candidate.chairman_name}</h2>
              <p className="text-sm text-blue-100 flex items-center gap-2">
                <span>&amp; {candidate.vice_chairman_name}</span>
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-sm">
                  {candidate.chairman_class} / {candidate.vice_chairman_class}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Candidate Photos & Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3.5">
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                <img
                  src={candidate.photo_url}
                  alt={candidate.chairman_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-top"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                  Calon Ketua
                </span>
                <h4 className="text-sm font-bold text-slate-800 leading-snug">
                  {candidate.chairman_name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Kelas {candidate.chairman_class}
                </p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center gap-3.5">
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-slate-200 shrink-0 border border-slate-300">
                <img
                  src={candidate.photo_url}
                  alt={candidate.vice_chairman_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover object-bottom"
                />
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                  Calon Wakil Ketua
                </span>
                <h4 className="text-sm font-bold text-slate-800 leading-snug">
                  {candidate.vice_chairman_name}
                </h4>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Kelas {candidate.vice_chairman_class}
                </p>
              </div>
            </div>
          </div>

          {/* Visi */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider mb-1.5">
              <Award className="w-4 h-4 text-blue-600" />
              Visi Paslon
            </div>
            <p className="text-sm text-slate-700 italic font-medium leading-relaxed">
              &ldquo;{candidate.vision}&rdquo;
            </p>
          </div>

          {/* Misi */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              Misi Kerja Terstruktur
            </h4>
            <ul className="space-y-2.5">
              {candidate.mission.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Program Unggulan */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
              Program Kerja Unggulan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {candidate.programs.map((prog, i) => (
                <div
                  key={i}
                  className="bg-slate-50 border border-slate-200/80 rounded-lg p-3 text-xs font-medium text-slate-800 flex items-start gap-2"
                >
                  <span className="w-5 h-5 rounded-md bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <span>{prog}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Video Kampanye Teaser */}
          <div className="bg-slate-900 text-white rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5 text-white" />
              </div>
              <div>
                <h5 className="text-xs font-bold">Video Orasi &amp; Debat Kandidat</h5>
                <p className="text-[11px] text-slate-300">
                  Saksikan tayangan visi misi lengkap dalam debat terbuka sekolah
                </p>
              </div>
            </div>
            <a
              href="https://www.youtube.com"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold bg-white/20 hover:bg-white/30 text-white px-3.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Putar Video Orasi
            </a>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Tutup
          </button>
          {showVoteButton && onVoteClick && (
            <button
              onClick={() => {
                onVoteClick(candidate);
                onClose();
              }}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
            >
              <span>Pilih Paslon No. 0{candidate.ballot_number}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
