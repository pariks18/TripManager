'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UserSession, UserDocumentDetail, DocumentType } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { BottomNav } from '@/components/ui/BottomNav';
import { User, Mail, LogOut, ShieldCheck, Sparkles, ArrowLeft, Heart, Layers, FileText, Upload, Camera, Image as ImageIcon, Trash2, Eye, Lock, CheckCircle2, AlertCircle, Download, Plus } from 'lucide-react';

const DOCUMENT_CONFIGS: { type: DocumentType; title: string; subtitle: string; example: string }[] = [
  { type: 'AADHAAR', title: 'Aadhaar Card', subtitle: 'Government Unique ID Proof', example: '1234 5678 9012' },
  { type: 'PAN', title: 'PAN Card', subtitle: 'Tax Identification Card', example: 'ABCDE1234F' },
  { type: 'VOTER_ID', title: 'Voter ID', subtitle: 'Electoral Identity Card', example: 'ABC1234567' },
  { type: 'DRIVING_LICENSE', title: 'Driving Licence', subtitle: 'Vehicle Rental & Driving ID', example: 'MH12 20240012345' },
  { type: 'PASSPORT', title: 'Passport (Optional)', subtitle: 'International Travel & Hotel Check-in', example: 'A1234567' },
];

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserSession | null>(null);
  const [documents, setDocuments] = useState<UserDocumentDetail[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(true);

  // Upload modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<DocumentType>('AADHAAR');
  const [documentNo, setDocumentNo] = useState('');
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Preview lightbox state
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string; docNo?: string | null } | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          fetchDocuments();
        } else {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  const fetchDocuments = async () => {
    setIsLoadingDocs(true);
    try {
      const res = await fetch('/api/user/documents');
      const data = await res.json();
      if (data.documents) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to fetch user documents:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

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

      await fetchDocuments();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      const res = await fetch(`/api/user/documents/${documentId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchDocuments();
      }
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 md:pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 px-4 py-3.5 sm:px-8">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Trips
          </button>
          <h1 className="text-base font-extrabold text-slate-900">Profile</h1>
          <div className="w-12" />
        </div>
      </header>

      {/* Profile Details */}
      <main className="max-w-xl mx-auto px-4 py-6 sm:px-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 apple-shadow text-center space-y-4">
          <Avatar name={user?.name || 'User'} size="xl" className="mx-auto shadow-md" />

          <div>
            <h2 className="text-xl font-bold text-slate-900">{user?.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          </div>

          <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
            <ShieldCheck className="w-4 h-4" /> Verified TripSplit Member
          </div>
        </div>

        {/* Section 2: Profile Documents (ID Proofs) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Documents & ID Proofs</h3>
                <p className="text-[11px] text-slate-400">Identity verification for hotel check-ins & rentals</p>
              </div>
            </div>

            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <Lock className="w-3 h-3 text-emerald-600" /> Private & Encrypted
            </span>
          </div>

          {/* Privacy Access Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-start gap-2.5 text-xs text-slate-600">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Only <strong>you</strong> and the <strong>Super Host / Admin</strong> can access these documents during trip operations.
            </p>
          </div>

          {/* Document Type Cards */}
          <div className="space-y-3 pt-1">
            {DOCUMENT_CONFIGS.map((docConfig) => {
              const uploadedDoc = documents.find((d) => d.documentType === docConfig.type);
              const isUploaded = !!uploadedDoc;

              return (
                <div
                  key={docConfig.type}
                  className={`p-4 rounded-2xl border transition-all ${
                    isUploaded
                      ? 'bg-emerald-50/40 border-emerald-200/80'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                          isUploaded
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isUploaded ? <CheckCircle2 className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{docConfig.title}</h4>
                          {isUploaded ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Uploaded
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
                            title="Update Document"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(uploadedDoc.id)}
                            className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                            title="Delete Document"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openUploadModal(docConfig.type)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors"
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

        {/* Section 3: System Settings & Information */}
        <div className="bg-white rounded-3xl p-4 border border-slate-100 apple-shadow space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 px-2">
            Application Info
          </h3>

          <div className="space-y-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 text-xs font-medium">
              <span className="text-slate-600 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> App Version
              </span>
              <span className="font-bold text-slate-900">v2.6 Mobile First</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 text-xs font-medium">
              <span className="text-slate-600 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" /> Currency Support
              </span>
              <span className="font-bold text-slate-900">INR (₹), USD ($), EUR (€), THB (฿)</span>
            </div>
          </div>
        </div>

        <Button
          onClick={handleLogout}
          variant="danger"
          fullWidth
          size="lg"
          className="flex items-center justify-center gap-2 font-bold"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </Button>
      </main>

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

      {/* Preview Document Lightbox Modal */}
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

      <BottomNav />
    </div>
  );
}

