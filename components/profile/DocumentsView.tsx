'use client';

import React, { useState, useRef } from 'react';
import { UserDocumentDetail, DocumentType } from '@/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ArrowLeft,
  FileText,
  Lock,
  CheckCircle2,
  Eye,
  Upload,
  Trash2,
  Plus,
  Camera,
  Image as ImageIcon,
  Download,
  AlertCircle,
  ShieldCheck,
  Info,
} from 'lucide-react';

interface DocumentsViewProps {
  documents: UserDocumentDetail[];
  onBack: () => void;
  onRefreshDocs: () => Promise<void>;
}

const DOCUMENT_CONFIGS: { type: DocumentType; title: string; subtitle: string; example: string }[] = [
  { type: 'AADHAAR', title: 'Aadhaar Card', subtitle: 'Government Unique ID Proof', example: '1234 5678 9012' },
  { type: 'PAN', title: 'PAN Card', subtitle: 'Tax Identification Card', example: 'ABCDE1234F' },
  { type: 'VOTER_ID', title: 'Voter ID', subtitle: 'Electoral Identity Card', example: 'ABC1234567' },
  { type: 'DRIVING_LICENSE', title: 'Driving Licence', subtitle: 'Vehicle Rental & Driving ID', example: 'MH12 20240012345' },
  { type: 'PASSPORT', title: 'Passport (Optional)', subtitle: 'International Travel & Hotel Check-in', example: 'A1234567' },
];

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onBack,
  onRefreshDocs,
}) => {
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('AADHAAR');
  const [documentNo, setDocumentNo] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Preview Lightbox State
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; docNo?: string | null } | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const openUploadModal = (type: DocumentType) => {
    const existing = documents.find((d) => d.documentType === type);
    setSelectedType(type);
    setDocumentNo(existing?.documentNo || '');
    setFileUrl(existing?.fileUrl || null);
    setFileName(existing?.fileName || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setError('Document photo must be smaller than 8MB');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl) {
      setError('Please select or capture a document image');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/user/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentType: selectedType,
          documentNo: documentNo.trim(),
          fileUrl,
          fileName,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save document');

      await onRefreshDocs();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  const performDeleteDocument = async (documentId: string) => {
    try {
      const res = await fetch(`/api/user/documents/${documentId}`, { method: 'DELETE' });
      if (res.ok) {
        showToast('✓ Document deleted', 'info', 'Document Removed');
        await onRefreshDocs();
      }
    } catch (err) {
      showToast('Failed to delete document', 'error', 'Error');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleDeleteDocument = (documentId: string) => {
    setDeletingDocId(documentId);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex items-center justify-between pt-1 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-3 py-1.5 rounded-xl border border-slate-200 apple-shadow transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>
        <h2 className="text-sm font-extrabold text-slate-900">Documents & ID Proofs</h2>
        <div className="w-16" />
      </div>

      {/* Privacy Guarantee Header Card */}
      <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-3xl p-5 space-y-3 apple-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-emerald-950">Encrypted Profile Storage</h3>
              <p className="text-[11px] text-emerald-800">Zero duplicate uploads across trips</p>
            </div>
          </div>

          <span className="text-[10px] font-extrabold text-emerald-800 bg-white px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-600" /> Private
          </span>
        </div>

        <div className="p-3 bg-white/90 border border-emerald-200/60 rounded-2xl text-xs text-emerald-900 leading-relaxed space-y-1">
          <p className="font-bold flex items-center gap-1 text-emerald-950">
            <Info className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Trip Verification Protocol:
          </p>
          <p className="text-[11px] text-emerald-800">
            Personal documents stay stored securely in your profile. Normal trip members can <strong>never</strong> view your private IDs. Access is authorized only for the trip <strong>Super Host / Admin</strong> when required for hotel check-ins or rental bookings.
          </p>
        </div>
      </div>

      {/* Document List Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
          Supported Identity Proofs
        </h3>

        <div className="space-y-3">
          {DOCUMENT_CONFIGS.map((docConfig) => {
            const uploadedDoc = documents.find((d) => d.documentType === docConfig.type);
            const isUploaded = !!uploadedDoc;

            return (
              <div
                key={docConfig.type}
                className={`p-4 rounded-2xl border transition-all ${
                  isUploaded
                    ? 'bg-emerald-50/40 border-emerald-200/80'
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                        isUploaded
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {isUploaded ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">{docConfig.title}</h4>
                        {isUploaded ? (
                          <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-200">
                            Added & Verified
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Not Added
                          </span>
                        )}
                      </div>

                      {isUploaded && uploadedDoc.documentNo ? (
                        <p className="text-[11px] font-mono text-slate-700 font-semibold mt-0.5">
                          ID: {uploadedDoc.documentNo}
                        </p>
                      ) : (
                        <p className="text-[11px] text-slate-400 mt-0.5">{docConfig.subtitle}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isUploaded ? (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            setPreviewDoc({
                              title: docConfig.title,
                              url: uploadedDoc.fileUrl,
                              docNo: uploadedDoc.documentNo,
                            })
                          }
                          className="p-2 text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl text-xs font-bold transition-colors"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openUploadModal(docConfig.type)}
                          className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors"
                          title="Replace Document"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDocument(uploadedDoc.id)}
                          className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                          title="Remove Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openUploadModal(docConfig.type)}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" /> Upload
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload Document Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Upload ${DOCUMENT_CONFIGS.find((d) => d.type === selectedType)?.title}`}
        >
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="Document / ID Number (Optional)"
              placeholder={`e.g. ${DOCUMENT_CONFIGS.find((d) => d.type === selectedType)?.example}`}
              value={documentNo}
              onChange={(e) => setDocumentNo(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-2">
                Upload Document Photo
              </label>

              {/* Hidden File Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleFileChange}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {fileUrl ? (
                <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-2 overflow-hidden flex items-center gap-3">
                  <img
                    src={fileUrl}
                    alt="Document preview"
                    className="w-16 h-16 object-cover rounded-xl border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">
                      {fileName || 'Document Photo Ready'}
                    </p>
                    <p className="text-[11px] text-slate-500">Tap remove to capture or choose another file</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFileUrl(null);
                      setFileName('');
                    }}
                    className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 border-dashed rounded-2xl hover:bg-slate-100 hover:border-emerald-500 text-slate-700 text-xs font-bold transition-all space-y-1.5"
                  >
                    <Camera className="w-6 h-6 text-emerald-600" />
                    <span>Take Photo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 border-dashed rounded-2xl hover:bg-slate-100 hover:border-emerald-500 text-slate-700 text-xs font-bold transition-all space-y-1.5"
                  >
                    <ImageIcon className="w-6 h-6 text-blue-600" />
                    <span>Choose Gallery</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Button type="submit" fullWidth isLoading={isSubmitting} size="lg">
                Save & Verify Document
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Preview Lightbox Modal */}
      {previewDoc && (
        <Modal
          isOpen={!!previewDoc}
          onClose={() => setPreviewDoc(null)}
          title={`ID Proof - ${previewDoc.title}`}
        >
          <div className="space-y-4 text-center">
            <div className="relative border border-slate-200 rounded-2xl overflow-hidden bg-slate-900 max-h-[70vh] flex items-center justify-center p-2">
              <img
                src={previewDoc.url}
                alt={previewDoc.title}
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-lg"
              />
            </div>

            {previewDoc.docNo && (
              <p className="text-xs font-mono text-slate-700 font-bold">
                Document ID: {previewDoc.docNo}
              </p>
            )}

            <div className="pt-2 flex gap-3">
              <a
                href={previewDoc.url}
                download={`${previewDoc.title.toLowerCase().replace(/\s+/g, '_')}.png`}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-colors"
              >
                <Download className="w-4 h-4" /> Download ID Proof
              </a>
              <button
                type="button"
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}
        <ConfirmModal
          isOpen={!!deletingDocId}
          onClose={() => setDeletingDocId(null)}
          title="Remove Document"
          message="Are you sure you want to remove this document from your profile?"
          confirmText="Delete Document"
          variant="danger"
          onConfirm={() => {
            if (deletingDocId) performDeleteDocument(deletingDocId);
          }}
        />
    </div>
  );
};
