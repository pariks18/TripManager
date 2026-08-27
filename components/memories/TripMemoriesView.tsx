'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { TripSummary, UserSummary, TripMemoryDetail, MemoryShareRequestDetail, MemoryQuestionnaireAnswers } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { useToast } from '@/components/ui/Toast';
import {
  Lock,
  Users,
  UserCheck,
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  Share2,
  Heart,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Grid,
  Layers,
  X,
  Check,
  Calendar,
  Camera,
  Globe,
  Smile,
  Utensils,
  MapPin,
  HelpCircle,
  Clock,
} from 'lucide-react';

interface TripMemoriesViewProps {
  trip: TripSummary;
  currentUser: UserSummary;
}

export const TripMemoriesView: React.FC<TripMemoriesViewProps> = ({ trip, currentUser }) => {
  const { showToast } = useToast();

  const [memories, setMemories] = useState<TripMemoryDetail[]>([]);
  const [shareRequests, setShareRequests] = useState<MemoryShareRequestDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeSubTab, setActiveSubTab] = useState<'MY_JOURNEY' | 'OUR_JOURNEY' | 'SHARED_WITH_ME' | 'PHOTOS'>('MY_JOURNEY');

  // Modal States
  const [isQuestionnaireOpen, setIsQuestionnaireOpen] = useState(false);
  const [editingMemory, setEditingMemory] = useState<TripMemoryDetail | null>(null);

  // Share Modal State
  const [shareModalMemory, setShareModalMemory] = useState<TripMemoryDetail | null>(null);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [sharePrivacy, setSharePrivacy] = useState<'SHARED_SELECTIVE' | 'SHARED_GROUP'>('SHARED_SELECTIVE');

  // Delete Modal State
  const [deletingMemoryId, setDeletingMemoryId] = useState<string | null>(null);

  // Photo Layout State (Carousel, Grid, Collage)
  const [photoLayout, setPhotoLayout] = useState<'GRID' | 'CAROUSEL' | 'COLLAGE'>('GRID');
  const [activeCarouselIndex, setActiveCarouselIndex] = useState(0);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Questionnaire Form State
  const [qWhere, setQWhere] = useState('');
  const [qHighlight, setQHighlight] = useState('');
  const [qBestMoment, setQBestMoment] = useState('');
  const [qFunniestMoment, setQFunniestMoment] = useState('');
  const [qBestFood, setQBestFood] = useState('');
  const [qUnexpected, setQUnexpected] = useState('');
  const [qNotes, setQNotes] = useState('');
  const [freeText, setFreeText] = useState('');
  const [photoInput, setPhotoInput] = useState('');
  const [photosList, setPhotosList] = useState<string[]>([]);
  const [memoryPrivacy, setMemoryPrivacy] = useState<'PRIVATE' | 'SHARED_SELECTIVE' | 'SHARED_GROUP'>('PRIVATE');

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const rawResult = event.target?.result as string;
        if (!rawResult) return;

        const img = new Image();
        img.onload = () => {
          const maxDim = 1024;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
            setPhotosList((prev) => [...prev, compressed]);
          } else {
            setPhotosList((prev) => [...prev, rawResult]);
          }
        };
        img.onerror = () => {
          setPhotosList((prev) => [...prev, rawResult]);
        };
        img.src = rawResult;
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  // 1. Compute Trip Days list based on startDate & endDate
  const tripDays = useMemo(() => {
    if (!trip.startDate || !trip.endDate) {
      return Array.from({ length: 5 }, (_, i) => ({
        dayNumber: i + 1,
        dateString: null,
        formattedDate: `Day ${i + 1}`,
      }));
    }

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const days: { dayNumber: number; dateString: string; formattedDate: string }[] = [];

    let current = new Date(start);
    let dayCount = 1;

    while (current <= end && dayCount <= 30) {
      const dateStr = current.toISOString().split('T')[0];
      const formatted = current.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      days.push({
        dayNumber: dayCount,
        dateString: dateStr,
        formattedDate: `Day ${dayCount} – ${formatted}`,
      });
      current.setDate(current.getDate() + 1);
      dayCount++;
    }

    return days.length > 0 ? days : [{ dayNumber: 1, dateString: null, formattedDate: 'Day 1' }];
  }, [trip.startDate, trip.endDate]);

  // Fetch Memories
  const fetchMemories = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/trips/${trip.id}/memories`);
      const data = await res.json();
      if (data.memories) {
        setMemories(data.memories);
      }
      if (data.shareRequests) {
        setShareRequests(data.shareRequests);
      }
    } catch (err) {
      console.error('Failed to load trip memories:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, [trip.id]);

  // Open Questionnaire Modal
  const openNewMemoryModal = () => {
    const existingMyMem = myJourneyMemories.find((m) => m.dayNumber === selectedDay);
    if (existingMyMem) {
      openEditMemoryModal(existingMyMem);
      return;
    }

    setEditingMemory(null);
    setQWhere('');
    setQHighlight('');
    setQBestMoment('');
    setQFunniestMoment('');
    setQBestFood('');
    setQUnexpected('');
    setQNotes('');
    setFreeText('');
    setPhotoInput('');
    setPhotosList([]);
    setMemoryPrivacy('PRIVATE');
    setIsQuestionnaireOpen(true);
  };

  const openEditMemoryModal = (mem: TripMemoryDetail) => {
    setEditingMemory(mem);
    const ans = mem.answers || {};
    setQWhere(ans.where || '');
    setQHighlight(ans.highlight || '');
    setQBestMoment(ans.bestMoment || '');
    setQFunniestMoment(ans.funniestMoment || '');
    setQBestFood(ans.bestFood || '');
    setQUnexpected(ans.unexpected || '');
    setQNotes(ans.notes || '');
    setFreeText(mem.freeText || '');
    setPhotosList(mem.photos || []);
    setMemoryPrivacy(mem.privacy);
    setIsQuestionnaireOpen(true);
  };

  // Add photo url or mock upload
  const handleAddPhoto = () => {
    if (!photoInput.trim()) return;
    setPhotosList((prev) => [...prev, photoInput.trim()]);
    setPhotoInput('');
  };

  const handleRemovePhoto = (index: number) => {
    setPhotosList((prev) => prev.filter((_, i) => i !== index));
  };

  // Save Memory (Create or Edit)
  const handleSaveMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const answers: MemoryQuestionnaireAnswers = {};
      if (qWhere.trim()) answers.where = qWhere.trim();
      if (qHighlight.trim()) answers.highlight = qHighlight.trim();
      if (qBestMoment.trim()) answers.bestMoment = qBestMoment.trim();
      if (qFunniestMoment.trim()) answers.funniestMoment = qFunniestMoment.trim();
      if (qBestFood.trim()) answers.bestFood = qBestFood.trim();
      if (qUnexpected.trim()) answers.unexpected = qUnexpected.trim();
      if (qNotes.trim()) answers.notes = qNotes.trim();

      const dayObj = tripDays.find((d) => d.dayNumber === selectedDay);

      const endpoint = editingMemory
        ? `/api/trips/${trip.id}/memories/${editingMemory.id}`
        : `/api/trips/${trip.id}/memories`;

      const method = editingMemory ? 'PUT' : 'POST';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: selectedDay,
          date: dayObj?.dateString || null,
          title: `Day ${selectedDay} Memory`,
          type: 'PERSONAL',
          answers: Object.keys(answers).length > 0 ? answers : null,
          freeText: freeText.trim() || null,
          photos: photosList,
          privacy: memoryPrivacy,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save memory');

      showToast(editingMemory ? 'Memory updated successfully!' : 'Memory saved successfully! ❤️', 'success');
      setIsQuestionnaireOpen(false);
      fetchMemories();
    } catch (err: any) {
      showToast(err.message || 'Error saving memory', 'error');
    }
  };

  // Delete Memory
  const handleDeleteMemory = async () => {
    if (!deletingMemoryId) return;
    try {
      const res = await fetch(`/api/trips/${trip.id}/memories/${deletingMemoryId}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete memory');
      }

      showToast('Memory deleted', 'success');
      setDeletingMemoryId(null);
      fetchMemories();
    } catch (err: any) {
      showToast(err.message || 'Error deleting memory', 'error');
    }
  };

  // Add to Group Memory
  const handleAddToGroupMemory = async (personalMemoryId: string) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/memories/${personalMemoryId}/add-to-group`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to publish to group memory');

      showToast('Added to Our Journey group memory! 👥', 'success');
      fetchMemories();
    } catch (err: any) {
      showToast(err.message || 'Error adding to group memory', 'error');
    }
  };

  // Open Share Modal
  const openShareModal = (mem: TripMemoryDetail) => {
    setShareModalMemory(mem);
    setSelectedMemberIds(mem.sharedWithUserIds || []);
    setSharePrivacy(mem.privacy === 'SHARED_GROUP' ? 'SHARED_GROUP' : 'SHARED_SELECTIVE');
  };

  // Save Share Settings
  const handleSaveShare = async () => {
    if (!shareModalMemory) return;
    try {
      const res = await fetch(`/api/trips/${trip.id}/memories/${shareModalMemory.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserIds: selectedMemberIds,
          privacy: sharePrivacy,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update share settings');
      }

      showToast('Share settings updated successfully! 🤝', 'success');
      setShareModalMemory(null);
      fetchMemories();
    } catch (err: any) {
      showToast(err.message || 'Error updating sharing', 'error');
    }
  };

  // Respond to Share Request (Accept / Decline)
  const handleRespondShareRequest = async (requestId: string, action: 'ACCEPT' | 'DECLINE') => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/memories/dummy/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });
      if (!res.ok) throw new Error('Failed to respond to request');

      showToast(action === 'ACCEPT' ? 'Shared memory accepted!' : 'Invitation declined', 'success');
      fetchMemories();
    } catch (err: any) {
      showToast(err.message || 'Error updating request', 'error');
    }
  };

  // Revoke Access
  const handleRevokeAccess = async (memoryId: string, targetUserId: string) => {
    try {
      const res = await fetch(`/api/trips/${trip.id}/memories/${memoryId}/share?targetUserId=${targetUserId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to revoke access');

      showToast('Access revoked', 'success');
      fetchMemories();
    } catch (err: any) {
      showToast(err.message || 'Error revoking access', 'error');
    }
  };

  // Filter Memories by Day
  const dayMemories = useMemo(() => {
    return memories.filter((m) => m.dayNumber === selectedDay);
  }, [memories, selectedDay]);

  // Sub-tab specific lists
  const myJourneyMemories = useMemo(() => {
    return dayMemories.filter((m) => m.type === 'PERSONAL' && m.userId === currentUser.id);
  }, [dayMemories, currentUser.id]);

  const ourJourneyMemories = useMemo(() => {
    return dayMemories.filter((m) => m.type === 'GROUP');
  }, [dayMemories]);

  const sharedWithMeMemories = useMemo(() => {
    return memories.filter(
      (m) =>
        m.userId !== currentUser.id &&
        (m.sharedWithUserIds.includes(currentUser.id) ||
          shareRequests.some((sr) => sr.memoryId === m.id && sr.status === 'ACCEPTED'))
    );
  }, [memories, currentUser.id, shareRequests]);

  const dayPhotos = useMemo(() => {
    const photos: { url: string; memoryId: string; authorName: string }[] = [];
    dayMemories.forEach((m) => {
      (m.photos || []).forEach((url) => {
        photos.push({ url, memoryId: m.id, authorName: m.user.name });
      });
    });
    return photos;
  }, [dayMemories]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trip Memories & Journey</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">{trip.name} Memories</h2>
          <p className="text-xs sm:text-sm text-rose-100 max-w-xl font-medium">
            Capture what actually happened during your trip, day by day. Write your personal travel journal, share moments with friends, and preserve collective group stories.
          </p>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] opacity-15 pointer-events-none">
          <Heart className="w-64 h-64" />
        </div>
      </div>

      {/* 2. Daily Timeline Navigator */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-rose-500" />
            <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Daily Timeline</h4>
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {tripDays.length} {tripDays.length === 1 ? 'Day' : 'Days'} Total
          </span>
        </div>

        {/* Day Pills Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {tripDays.map((d) => {
            const isActive = selectedDay === d.dayNumber;
            const dayMemCount = memories.filter((m) => m.dayNumber === d.dayNumber).length;

            return (
              <button
                key={d.dayNumber}
                onClick={() => setSelectedDay(d.dayNumber)}
                className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shrink-0 transition-all cursor-pointer flex items-center gap-2 ${
                  isActive
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span>{d.formattedDate}</span>
                {dayMemCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-black ${
                      isActive ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {dayMemCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Sub-Navigation Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto border-b border-slate-200 pb-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('MY_JOURNEY')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'MY_JOURNEY'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-400" />
            <span>My Journey</span>
          </button>

          <button
            onClick={() => setActiveSubTab('OUR_JOURNEY')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'OUR_JOURNEY'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-blue-400" />
            <span>Our Journey</span>
          </button>

          <button
            onClick={() => setActiveSubTab('SHARED_WITH_ME')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 relative ${
              activeSubTab === 'SHARED_WITH_ME'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shared With Me</span>
            {shareRequests.filter((sr) => sr.status === 'PENDING').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveSubTab('PHOTOS')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubTab === 'PHOTOS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5 text-pink-400" />
            <span>Photos ({dayPhotos.length})</span>
          </button>
        </div>

        {/* Create Memory Button */}
        <Button
          onClick={openNewMemoryModal}
          size="sm"
          className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record Day {selectedDay} Memory</span>
        </Button>
      </div>

      {/* 4. Tab Contents */}

      {/* TAB A: MY JOURNEY (Personal) */}
      {activeSubTab === 'MY_JOURNEY' && (
        <div className="space-y-4">
          {myJourneyMemories.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                <Heart className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900">No Personal Memory for Day {selectedDay} yet</h4>
                <p className="text-xs text-slate-500">
                  Write it your way ❤️ There are no right or wrong answers. Capture the moment in your own words.
                </p>
              </div>
              <Button
                onClick={openNewMemoryModal}
                size="sm"
                className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-sm gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Write Day {selectedDay} Journal Entry</span>
              </Button>
            </div>
          ) : (
            myJourneyMemories.map((mem) => (
              <div
                key={mem.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4 relative"
              >
                {/* Memory Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={mem.user.name} size="sm" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{mem.title || `Day ${mem.dayNumber} Personal Journal`}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400">{new Date(mem.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="text-slate-300">•</span>
                        {mem.privacy === 'PRIVATE' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" /> Private (Only Me)
                          </span>
                        ) : mem.privacy === 'SHARED_SELECTIVE' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <UserCheck className="w-3 h-3" /> Shared with {mem.sharedWithUserIds.length} Members
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                            <Globe className="w-3 h-3" /> Entire Group
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleAddToGroupMemory(mem.id)}
                      className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 bg-blue-50/50 rounded-lg border border-blue-200/60 transition-all flex items-center gap-1 cursor-pointer"
                      title="Publish copy to Our Journey group memory"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Add to Group Memory</span>
                    </button>

                    <button
                      onClick={() => openShareModal(mem)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                      title="Share Memory"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => openEditMemoryModal(mem)}
                      className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                      title="Edit Memory"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeletingMemoryId(mem.id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                      title="Delete Memory"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Questionnaire Guided Answers */}
                {mem.answers && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                    {mem.answers.where && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-rose-500" /> Where did you go today?
                        </span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.where}</p>
                      </div>
                    )}
                    {mem.answers.highlight && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-500" /> Highlight of today
                        </span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.highlight}</p>
                      </div>
                    )}
                    {mem.answers.bestMoment && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Heart className="w-3 h-3 text-pink-500" /> Best moment
                        </span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.bestMoment}</p>
                      </div>
                    )}
                    {mem.answers.funniestMoment && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Smile className="w-3 h-3 text-emerald-500" /> Funniest moment
                        </span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.funniestMoment}</p>
                      </div>
                    )}
                    {mem.answers.bestFood && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <Utensils className="w-3 h-3 text-indigo-500" /> Best food
                        </span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.bestFood}</p>
                      </div>
                    )}
                    {mem.answers.unexpected && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3 text-purple-500" /> Unexpected moment
                        </span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.unexpected}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Free Text Writing */}
                {mem.freeText && (
                  <div className="space-y-1">
                    <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">
                      {mem.freeText}
                    </p>
                  </div>
                )}

                {/* Photos Grid */}
                {mem.photos && mem.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
                    {mem.photos.map((photoUrl, idx) => (
                      <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 group relative">
                        <img src={photoUrl} alt={`Memory photo ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB B: OUR JOURNEY (Group Shared Story) */}
      {activeSubTab === 'OUR_JOURNEY' && (
        <div className="space-y-4">
          {ourJourneyMemories.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900">No Group Stories for Day {selectedDay} yet</h4>
                <p className="text-xs text-slate-500">
                  Group memories represent the collective experience of everyone on the trip. Members can explicitly add their memories to Our Journey.
                </p>
              </div>
            </div>
          ) : (
            ourJourneyMemories.map((mem) => (
              <div key={mem.id} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={mem.user.name} size="sm" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{mem.title || `Day ${mem.dayNumber} Group Memory`}</h4>
                      <p className="text-[10px] text-slate-400">Contributed by {mem.user.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Users className="w-3 h-3" /> Group Memory
                  </span>
                </div>

                {mem.answers && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                    {mem.answers.highlight && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Group Highlight</span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.highlight}</p>
                      </div>
                    )}
                    {mem.answers.bestMoment && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Best Moment</span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.bestMoment}</p>
                      </div>
                    )}
                    {mem.answers.funniestMoment && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Funniest Moment</span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.funniestMoment}</p>
                      </div>
                    )}
                    {mem.answers.bestFood && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Best Food</span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.bestFood}</p>
                      </div>
                    )}
                  </div>
                )}

                {mem.freeText && (
                  <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">{mem.freeText}</p>
                )}

                {mem.photos && mem.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mem.photos.map((url, idx) => (
                      <img key={idx} src={url} alt={`Group photo ${idx}`} className="w-full aspect-square object-cover rounded-2xl border border-slate-200" />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB C: SHARED WITH ME */}
      {activeSubTab === 'SHARED_WITH_ME' && (
        <div className="space-y-4">
          {/* Pending Invitations */}
          {shareRequests.filter((sr) => sr.status === 'PENDING').length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Pending Shared Invitations</h4>
              {shareRequests
                .filter((sr) => sr.status === 'PENDING')
                .map((req) => (
                  <div key={req.id} className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar name={req.owner.name} size="sm" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">{req.owner.name} shared a memory with you!</p>
                        <p className="text-[10px] text-slate-500">Day {req.memory.dayNumber} • {req.memory.title || 'Personal Journal'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button onClick={() => handleRespondShareRequest(req.id, 'ACCEPT')} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1 px-3 rounded-xl">
                        Accept
                      </Button>
                      <Button onClick={() => handleRespondShareRequest(req.id, 'DECLINE')} size="sm" variant="ghost" className="text-slate-600 text-xs py-1 px-3">
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Accepted Shared Memories */}
          {sharedWithMeMemories.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 shadow-xs space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <UserCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1 max-w-md mx-auto">
                <h4 className="text-sm font-bold text-slate-900">No Memories Shared With You</h4>
                <p className="text-xs text-slate-500">
                  When other trip members explicitly share their personal memories with you, they will appear here.
                </p>
              </div>
            </div>
          ) : (
            sharedWithMeMemories.map((mem) => (
              <div key={mem.id} className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={mem.user.name} size="sm" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{mem.title || `Day ${mem.dayNumber} Memory`}</h4>
                      <p className="text-[10px] text-slate-400">Shared by {mem.user.name}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
                    <UserCheck className="w-3 h-3" /> Shared With You
                  </span>
                </div>

                {mem.answers && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                    {mem.answers.highlight && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Highlight</span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.highlight}</p>
                      </div>
                    )}
                    {mem.answers.bestMoment && (
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Best Moment</span>
                        <p className="text-xs font-semibold text-slate-800">{mem.answers.bestMoment}</p>
                      </div>
                    )}
                  </div>
                )}

                {mem.freeText && (
                  <p className="text-xs leading-relaxed text-slate-700 whitespace-pre-wrap font-medium">{mem.freeText}</p>
                )}

                {mem.photos && mem.photos.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {mem.photos.map((url, idx) => (
                      <img key={idx} src={url} alt={`Shared photo ${idx}`} className="w-full aspect-square object-cover rounded-2xl border border-slate-200" />
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB D: PHOTOS GALLERY */}
      {activeSubTab === 'PHOTOS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Day {selectedDay} Photos ({dayPhotos.length})</span>

            {/* Layout Mode Toggles */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setPhotoLayout('GRID')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  photoLayout === 'GRID' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Grid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                onClick={() => setPhotoLayout('CAROUSEL')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  photoLayout === 'CAROUSEL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <ChevronRight className="w-3.5 h-3.5" />
                <span>Carousel</span>
              </button>
              <button
                onClick={() => setPhotoLayout('COLLAGE')}
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer ${
                  photoLayout === 'COLLAGE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Collage</span>
              </button>
            </div>
          </div>

          {dayPhotos.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs space-y-2 text-slate-400">
              <Camera className="w-8 h-8 mx-auto text-slate-300" />
              <p className="text-xs font-bold text-slate-700">No photos added for Day {selectedDay}</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Add photos when creating or editing your daily memory entries.
              </p>
            </div>
          ) : photoLayout === 'GRID' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {dayPhotos.map((p, idx) => (
                <div key={idx} className="aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 relative group">
                  <img src={p.url} alt={`Gallery photo ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-3 flex items-end">
                    <span className="text-[10px] font-bold text-white">By {p.authorName}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : photoLayout === 'CAROUSEL' ? (
            <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-4 relative">
              <div className="relative aspect-video max-h-[420px] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                <img
                  src={dayPhotos[activeCarouselIndex]?.url}
                  alt="Carousel current"
                  className="max-h-full max-w-full object-contain"
                />
                <button
                  onClick={() => setActiveCarouselIndex((prev) => (prev > 0 ? prev - 1 : dayPhotos.length - 1))}
                  className="absolute left-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-all cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveCarouselIndex((prev) => (prev < dayPhotos.length - 1 ? prev + 1 : 0))}
                  className="absolute right-3 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-all cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>
                  Photo {activeCarouselIndex + 1} of {dayPhotos.length}
                </span>
                <span>By {dayPhotos[activeCarouselIndex]?.authorName}</span>
              </div>
            </div>
          ) : (
            /* COLLAGE VIEW */
            <div className="grid grid-cols-3 gap-2 auto-rows-[160px]">
              {dayPhotos.map((p, idx) => {
                const isSpanTwo = idx % 3 === 0;
                return (
                  <div
                    key={idx}
                    className={`rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 relative group ${
                      isSpanTwo ? 'col-span-2 row-span-2' : ''
                    }`}
                  >
                    <img src={p.url} alt={`Collage photo ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. GUIDED QUESTIONNAIRE MODAL */}
      <Modal
        isOpen={isQuestionnaireOpen}
        onClose={() => setIsQuestionnaireOpen(false)}
        title={editingMemory ? `Edit Day ${selectedDay} Memory` : `Record Day ${selectedDay} Memory`}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveMemory} className="space-y-5">
          {/* Encouraging Default Note Banner */}
          <div className="bg-rose-50/90 border border-rose-200/80 rounded-2xl p-4 text-center space-y-1">
            <p className="text-xs font-extrabold text-rose-700">
              Write it your way ❤️ There are no right or wrong answers. Capture the moment in your own words.
            </p>
            <p className="text-[10px] text-rose-500">
              Feel free to answer in English, Hindi, Hinglish or any language! Guidance questions below are optional.
            </p>
          </div>

          {/* Guided Questions Grid */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Daily Questionnaire (Optional)</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Where did you go today?"
                placeholder="e.g., Anjuna Beach, Old Fort"
                value={qWhere}
                onChange={(e) => setQWhere(e.target.value)}
              />
              <Input
                label="What was the highlight of today?"
                placeholder="e.g., Sunset near the cliff"
                value={qHighlight}
                onChange={(e) => setQHighlight(e.target.value)}
              />
              <Input
                label="What was the best moment?"
                placeholder="e.g., Playing music by the beach"
                value={qBestMoment}
                onChange={(e) => setQBestMoment(e.target.value)}
              />
              <Input
                label="What was the funniest moment?"
                placeholder="e.g., Rahul dropped his ice cream"
                value={qFunniestMoment}
                onChange={(e) => setQFunniestMoment(e.target.value)}
              />
              <Input
                label="What was the best food you had?"
                placeholder="e.g., Local seafood curry"
                value={qBestFood}
                onChange={(e) => setQBestFood(e.target.value)}
              />
              <Input
                label="Was there anything unexpected?"
                placeholder="e.g., Rain started suddenly!"
                value={qUnexpected}
                onChange={(e) => setQUnexpected(e.target.value)}
              />
            </div>
          </div>

          {/* Free Text Writing Area */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">Tell us anything else about today</label>
            <textarea
              rows={3}
              placeholder="Write freely in your preferred language..."
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-rose-500 font-medium text-slate-800"
            />
          </div>

          {/* Photo Attachments */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Photos (Optional)</label>

            {/* Hidden device file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleDeviceFileUpload}
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                size="sm"
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-rose-600" />
                <span>Upload Photos from Device</span>
              </Button>

              <div className="flex items-center gap-2 flex-1">
                <Input
                  placeholder="Or paste Photo Image URL"
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddPhoto} size="sm" variant="outline" className="text-xs shrink-0 cursor-pointer">
                  Add URL
                </Button>
              </div>
            </div>

            {photosList.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pt-1">
                {photosList.map((url, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    <img src={url} alt={`Preview ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 p-0.5 bg-slate-900/80 text-white rounded-full hover:bg-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy Choice */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700">Privacy Setting</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setMemoryPrivacy('PRIVATE')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                  memoryPrivacy === 'PRIVATE'
                    ? 'border-rose-500 bg-rose-50/80 text-rose-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Private (Only Me)</span>
              </button>

              <button
                type="button"
                onClick={() => setMemoryPrivacy('SHARED_SELECTIVE')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                  memoryPrivacy === 'SHARED_SELECTIVE'
                    ? 'border-rose-500 bg-rose-50/80 text-rose-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span>Selected Members</span>
              </button>

              <button
                type="button"
                onClick={() => setMemoryPrivacy('SHARED_GROUP')}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center flex flex-col items-center gap-1 cursor-pointer ${
                  memoryPrivacy === 'SHARED_GROUP'
                    ? 'border-rose-500 bg-rose-50/80 text-rose-700 shadow-xs'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Globe className="w-4 h-4 text-blue-500" />
                <span>Entire Group</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button type="button" variant="ghost" onClick={() => setIsQuestionnaireOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl">
              Save Memory
            </Button>
          </div>
        </form>
      </Modal>

      {/* 6. SHARE MODAL */}
      <Modal
        isOpen={!!shareModalMemory}
        onClose={() => setShareModalMemory(null)}
        title="Share Memory"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">Choose who can view this personal memory. You can revoke access anytime.</p>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Sharing Mode</label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSharePrivacy('SHARED_SELECTIVE')}
                className={`flex-1 p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                  sharePrivacy === 'SHARED_SELECTIVE' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'
                }`}
              >
                Selected Members
              </button>
              <button
                onClick={() => setSharePrivacy('SHARED_GROUP')}
                className={`flex-1 p-2 rounded-xl border text-xs font-bold cursor-pointer ${
                  sharePrivacy === 'SHARED_GROUP' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200'
                }`}
              >
                Entire Group
              </button>
            </div>
          </div>

          {sharePrivacy === 'SHARED_SELECTIVE' && (
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Select Members</label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {trip.members
                  .filter((m) => m.userId !== currentUser.id)
                  .map((m) => {
                    const isSelected = selectedMemberIds.includes(m.userId);
                    return (
                      <div
                        key={m.userId}
                        onClick={() =>
                          setSelectedMemberIds((prev) =>
                            isSelected ? prev.filter((id) => id !== m.userId) : [...prev, m.userId]
                          )
                        }
                        className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                          isSelected ? 'border-rose-500 bg-rose-50/60' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Avatar name={m.user.name} size="sm" />
                          <span className="text-xs font-bold text-slate-800">{m.user.name}</span>
                        </div>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-rose-600" />
                        ) : (
                          <span className="text-[10px] text-slate-400">Select</span>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setShareModalMemory(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveShare} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl">
              Save Share Settings
            </Button>
          </div>
        </div>
      </Modal>

      {/* 7. DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={!!deletingMemoryId}
        onClose={() => setDeletingMemoryId(null)}
        title="Delete Memory"
        maxWidth="max-w-sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 font-medium">Are you sure you want to delete this memory? This action cannot be undone.</p>
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeletingMemoryId(null)}>
              Cancel
            </Button>
            <Button onClick={handleDeleteMemory} className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl">
              Delete Permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
