'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { UserDocumentDetail } from '@/types';
import { ShieldCheck, FileText, Download, AlertCircle, Eye, Lock } from 'lucide-react';

interface MemberDocumentsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  memberUserId: string;
  memberName: string;
}

const DOCUMENT_LABELS: Record<string, string> = {
  AADHAAR: 'Aadhaar Card',
  PAN: 'PAN Card',
  VOTER_ID: 'Voter ID',
  DRIVING_LICENSE: 'Driving Licence',
  PASSPORT: 'Passport',
  OTHER: 'Other ID Proof',
};

export const MemberDocumentsModal: React.FC<MemberDocumentsModalProps> = ({
  isOpen,
  onClose,
  tripId,
  memberUserId,
  memberName,
}) => {
  const [documents, setDocuments] = useState<UserDocumentDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ url: string; title: string } | null>(null);

  useEffect(() => {
    if (isOpen && tripId && memberUserId) {
      setIsLoading(true);
      setError('');
      fetch(`/api/trips/${tripId}/members/${memberUserId}/documents`)
        .then((res) => res.json())
        .then((data) => {
          if (data.documents) {
            setDocuments(data.documents);
          } else {
            setError(data.error || 'Failed to load member documents');
          }
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, tripId, memberUserId]);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Verification Documents - ${memberName}`}
      >
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-3 flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-xs text-emerald-900 leading-relaxed font-medium">
              Authorized access for <strong>Super Host / Admin</strong> to verify member details for smooth hotel check-ins and vehicle rentals.
            </p>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs font-semibold text-slate-400">
              Loading verification documents...
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="py-8 text-center text-slate-400 space-y-1">
              <FileText className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No Documents Uploaded</p>
              <p className="text-[11px] text-slate-400">This member has not uploaded any ID proofs yet.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {documents.map((doc) => {
                const label = DOCUMENT_LABELS[doc.documentType] || doc.documentType;
                return (
                  <div
                    key={doc.id}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                        {doc.fileUrl.startsWith('data:image') || doc.fileUrl.startsWith('http') ? (
                          <img src={doc.fileUrl} alt={label} className="w-full h-full object-cover" />
                        ) : (
                          <FileText className="w-5 h-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900">{label}</h4>
                        {doc.documentNo && (
                          <p className="text-[11px] font-mono text-slate-500 font-medium">
                            ID: {doc.documentNo}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedImage({ url: doc.fileUrl, title: label })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>

      {/* Image Lightbox Preview */}
      {selectedImage && (
        <Modal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          title={selectedImage.title}
        >
          <div className="space-y-4 text-center">
            <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 max-h-[70vh] flex items-center justify-center p-2">
              <img
                src={selectedImage.url}
                alt={selectedImage.title}
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>

            <div className="pt-2 flex gap-3">
              <a
                href={selectedImage.url}
                download={`${selectedImage.title.toLowerCase().replace(/\s+/g, '_')}.png`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-colors"
              >
                <Download className="w-4 h-4" /> Download ID Proof
              </a>
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
