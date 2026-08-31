'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChecklistItemDetail, UserSummary } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import {
  CheckSquare,
  User,
  Users,
  Plus,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Loader2,
  Sparkles,
  Heart,
  Ban,
  UserCheck,
  Tag,
  Settings,
} from 'lucide-react';

interface TripChecklistViewProps {
  tripId: string;
  currentUser: UserSummary;
  members: { user: UserSummary; role?: string }[];
  isAdmin?: boolean;
}

const DEFAULT_GROUP_CATEGORIES = [
  '🍿 Food & Drinks',
  '🩹 Health',
  '🧻 Hygiene',
  '🎫 Travel',
  '🏨 Stay',
  '🚗 Transport',
];

const DEFAULT_PERSONAL_CATEGORIES = [
  '🧴 Toiletries',
  '👕 Clothing',
  '🔌 Electronics',
  '🪪 Documents',
  '💊 Health',
  '🕶️ Accessories',
  '🌦️ Weather',
  "🌸 Women's Essentials",
];

export const TripChecklistView: React.FC<TripChecklistViewProps> = React.memo(({
  tripId,
  currentUser,
  members,
  isAdmin = false,
}) => {
  const [section, setSection] = useState<'GROUP' | 'PERSONAL'>('GROUP');
  const [groupItems, setGroupItems] = useState<ChecklistItemDetail[]>([]);
  const [personalItems, setPersonalItems] = useState<ChecklistItemDetail[]>([]);
  const [userGender, setUserGender] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Category Collapse State
  const [collapsedCategories, setCollapsedCategories] = useState<{ [cat: string]: boolean }>({});

  // Add Item Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [itemTitle, setItemTitle] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [assignedToId, setAssignedToId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gender Modal
  const [isGenderModalOpen, setIsGenderModalOpen] = useState(false);
  const [genderInput, setGenderInput] = useState('');
  const [isSavingGender, setIsSavingGender] = useState(false);

  const fetchChecklist = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/trips/${tripId}/checklist`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load checklist');

      setGroupItems(data.groupItems || []);
      setPersonalItems(data.personalItems || []);
      setUserGender(data.userGender || null);
      if (data.userGender) {
        setGenderInput(data.userGender);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load checklist');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) {
      fetchChecklist();
    }
  }, [tripId]);

  const isFemale = useMemo(() => {
    if (!userGender) return false;
    const g = userGender.trim().toLowerCase();
    return ['female', 'woman', 'w', 'f'].includes(g);
  }, [userGender]);

  const currentItems = section === 'GROUP' ? groupItems : personalItems;

  // Group items by category
  const categoriesMap = useMemo(() => {
    const map: { [cat: string]: ChecklistItemDetail[] } = {};
    currentItems.forEach((item) => {
      if (!map[item.category]) {
        map[item.category] = [];
      }
      map[item.category].push(item);
    });
    return map;
  }, [currentItems]);

  const categoriesList = useMemo(() => {
    return Object.keys(categoriesMap).sort((a, b) => {
      // Prioritize Women's Essentials at top of Personal if present
      if (a.includes("Women's Essentials")) return -1;
      if (b.includes("Women's Essentials")) return 1;
      return a.localeCompare(b);
    });
  }, [categoriesMap]);

  // Overall Progress calculation
  const totalItemsCount = currentItems.length;
  const noNeedCount = currentItems.filter((i) => i.status === 'NO_NEED').length;
  const requiredItemsCount = Math.max(0, totalItemsCount - noNeedCount);
  const doneItemsCount = currentItems.filter((i) => i.status === 'DONE').length;
  const progressPercent = requiredItemsCount > 0 ? Math.round((doneItemsCount / requiredItemsCount) * 100) : 0;

  const toggleCategoryCollapse = (cat: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [cat]: !prev[cat],
    }));
  };

  const handleUpdateStatus = async (item: ChecklistItemDetail, newStatus: 'PENDING' | 'DONE' | 'NO_NEED') => {
    // Optimistic update
    const updater = (prev: ChecklistItemDetail[]) =>
      prev.map((i) =>
        i.id === item.id
          ? {
              ...i,
              status: newStatus,
              completedById: newStatus === 'DONE' ? currentUser.id : null,
              completedBy: newStatus === 'DONE' ? currentUser : null,
            }
          : i
      );

    if (item.type === 'GROUP') setGroupItems(updater);
    else setPersonalItems(updater);

    try {
      const res = await fetch(`/api/trips/${tripId}/checklist/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update item status');

      // Update with server response
      const serverUpdater = (prev: ChecklistItemDetail[]) =>
        prev.map((i) => (i.id === data.item.id ? data.item : i));
      if (item.type === 'GROUP') setGroupItems(serverUpdater);
      else setPersonalItems(serverUpdater);
    } catch (err: any) {
      fetchChecklist();
    }
  };

  const handleAssignItem = async (itemId: string, assignedId: string | null) => {
    setGroupItems((prev) =>
      prev.map((i) =>
        i.id === itemId
          ? {
              ...i,
              assignedToId: assignedId,
              assignedTo: members.find((m) => m.user.id === assignedId)?.user || null,
            }
          : i
      )
    );

    try {
      const res = await fetch(`/api/trips/${tripId}/checklist/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignedToId: assignedId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to assign item');
    } catch (err) {
      fetchChecklist();
    }
  };

  const handleDeleteItem = async (item: ChecklistItemDetail) => {
    const updater = (prev: ChecklistItemDetail[]) => prev.filter((i) => i.id !== item.id);
    if (item.type === 'GROUP') setGroupItems(updater);
    else setPersonalItems(updater);

    try {
      const res = await fetch(`/api/trips/${tripId}/checklist/${item.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete item');
    } catch (err) {
      fetchChecklist();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemTitle.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const finalCategory = itemCategory === 'CUSTOM' ? customCategory.trim() : itemCategory;

    try {
      const res = await fetch(`/api/trips/${tripId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: section,
          title: itemTitle.trim(),
          category: finalCategory || (section === 'GROUP' ? '🍿 Food & Drinks' : '🧴 Toiletries'),
          assignedToId: section === 'GROUP' && assignedToId ? assignedToId : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add item');

      if (section === 'GROUP') {
        setGroupItems((prev) => [...prev, data.item]);
      } else {
        setPersonalItems((prev) => [...prev, data.item]);
      }

      setIsAddModalOpen(false);
      setItemTitle('');
      setItemCategory('');
      setCustomCategory('');
      setAssignedToId('');
    } catch (err: any) {
      setError(err.message || 'Failed to add item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveGender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genderInput.trim() || isSavingGender) return;

    setIsSavingGender(true);
    try {
      const res = await fetch('/api/user/gender', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: genderInput.trim() }),
      });
      if (!res.ok) throw new Error('Failed to update gender profile');
      setUserGender(genderInput.trim());
      setIsGenderModalOpen(false);
      fetchChecklist();
    } catch (err: any) {
      setError(err.message || 'Failed to update gender profile');
    } finally {
      setIsSavingGender(false);
    }
  };

  const categoryOptions = section === 'GROUP' ? DEFAULT_GROUP_CATEGORIES : DEFAULT_PERSONAL_CATEGORIES;

  return (
    <div className="space-y-5 max-w-4xl mx-auto pb-12">
      {/* 1. Header & Section Switcher */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100/80 text-emerald-700 rounded-2xl">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-snug">Trip Checklist</h3>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">
                Remember essential items before and during your trip
              </p>
            </div>
          </div>

          {/* Section Toggle: Group vs Personal */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold w-full sm:w-auto">
            <button
              onClick={() => setSection('GROUP')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                section === 'GROUP'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" /> Group Checklist
            </button>
            <button
              onClick={() => setSection('PERSONAL')}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                section === 'PERSONAL'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" /> Personal Checklist
            </button>
          </div>
        </div>

        {/* Progress Card */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-extrabold">
            <span className="text-slate-700 uppercase tracking-wider">
              {section === 'GROUP' ? 'Group Progress' : 'My Personal Progress'}
            </span>
            <span className="text-emerald-700 font-mono text-sm">
              {doneItemsCount} / {requiredItemsCount} required items completed
            </span>
          </div>

          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 pt-0.5">
            <span>
              {noNeedCount > 0 ? `${noNeedCount} items marked "No Need"` : 'All items active'}
            </span>
            <span>{progressPercent}% Done</span>
          </div>
        </div>

        {/* Action Controls Header */}
        <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
          <span className="text-xs font-bold text-slate-500">
            {section === 'GROUP'
              ? 'Shared list across all trip members'
              : 'Private list exclusive to you'}
          </span>

          <div className="flex items-center gap-2">
            {section === 'PERSONAL' && (
              <button
                type="button"
                onClick={() => setIsGenderModalOpen(true)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-slate-500" />
                <span>Profile Gender ({userGender || 'Not Set'})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setItemCategory(categoryOptions[0]);
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Item
            </button>
          </div>
        </div>
      </div>

      {/* Women's Essentials Banner Notice for Personal Checklist */}
      {section === 'PERSONAL' && isFemale && (
        <div className="bg-pink-50 border border-pink-200/90 rounded-2xl p-3.5 flex items-center justify-between text-xs text-pink-900">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">🌸</span>
            <div>
              <span className="font-extrabold block">Women's Essentials Category Active</span>
              <span className="text-pink-700 font-medium">Included in your private personal checklist based on your profile.</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. Checklist Items by Category Accordions */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
          <span className="text-xs font-medium">Loading checklist items...</span>
        </div>
      ) : categoriesList.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-6 space-y-3">
          <CheckSquare className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-slate-700">No items found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click "+ Add Item" above to add your first checklist item.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {categoriesList.map((cat) => {
            const items = categoriesMap[cat];
            const isCollapsed = !!collapsedCategories[cat];
            const catDoneCount = items.filter((i) => i.status === 'DONE').length;
            const catNoNeedCount = items.filter((i) => i.status === 'NO_NEED').length;
            const catReqCount = Math.max(0, items.length - catNoNeedCount);

            return (
              <div
                key={cat}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all"
              >
                {/* Category Header Bar */}
                <div
                  onClick={() => toggleCategoryCollapse(cat)}
                  className="p-4 bg-slate-50/80 hover:bg-slate-100/70 border-b border-slate-100 flex items-center justify-between cursor-pointer select-none transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <h4 className="text-sm font-extrabold text-slate-900">{cat}</h4>
                    <span className="bg-slate-200/80 text-slate-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                      {catDoneCount} / {catReqCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {catDoneCount === catReqCount && catReqCount > 0 && (
                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Complete
                      </span>
                    )}
                    {isCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Category Body Items */}
                {!isCollapsed && (
                  <div className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const isDone = item.status === 'DONE';
                      const isNoNeed = item.status === 'NO_NEED';
                      const isPending = item.status === 'PENDING';

                      return (
                        <div
                          key={item.id}
                          className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 transition-colors ${
                            isDone
                              ? 'bg-emerald-50/30'
                              : isNoNeed
                              ? 'bg-slate-50/60 text-slate-400'
                              : 'bg-white hover:bg-slate-50/40'
                          }`}
                        >
                          {/* Left: Checkbox & Title */}
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            {/* Status State Toggle Buttons */}
                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                              {/* 1. Done Toggle */}
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(item, isDone ? 'PENDING' : 'DONE')}
                                className={`p-1 rounded-xl transition-all cursor-pointer ${
                                  isDone
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-emerald-100 text-slate-400 hover:text-emerald-700'
                                }`}
                                title={isDone ? 'Mark Pending' : 'Mark Done'}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>

                              {/* 2. No Need Toggle */}
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(item, isNoNeed ? 'PENDING' : 'NO_NEED')}
                                className={`p-1 rounded-xl transition-all cursor-pointer ${
                                  isNoNeed
                                    ? 'bg-slate-700 text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-400 hover:text-slate-700'
                                }`}
                                title={isNoNeed ? 'Mark Pending' : 'Mark No Need'}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>

                            {/* Item Details */}
                            <div className="min-w-0 flex-1">
                              <span
                                className={`text-xs font-bold block truncate leading-snug ${
                                  isDone
                                    ? 'line-through text-slate-500 font-semibold'
                                    : isNoNeed
                                    ? 'line-through text-slate-400 italic font-medium'
                                    : 'text-slate-900'
                                }`}
                              >
                                {item.title}
                              </span>

                              {/* Completion & Assignment Badges */}
                              <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px]">
                                {isDone && item.completedBy && (
                                  <span className="bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <UserCheck className="w-3 h-3 text-emerald-600" />
                                    <span>Completed by {item.completedBy.name}</span>
                                  </span>
                                )}

                                {isNoNeed && (
                                  <span className="bg-slate-200 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                                    No Need
                                  </span>
                                )}

                                {section === 'GROUP' && (
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-400 font-medium">Assigned:</span>
                                    <select
                                      value={item.assignedToId || ''}
                                      onChange={(e) => handleAssignItem(item.id, e.target.value || null)}
                                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 text-[10px] font-bold rounded-lg px-1.5 py-0.5 focus:outline-none"
                                    >
                                      <option value="">Unassigned</option>
                                      {members.map((m) => (
                                        <option key={m.user.id} value={m.user.id}>
                                          {m.user.name} {m.user.id === currentUser.id ? '(You)' : ''}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right Actions: Delete */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 3. Add Custom Item Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={`Add ${section === 'GROUP' ? 'Group' : 'Personal'} Checklist Item`}
      >
        <form onSubmit={handleAddItem} className="space-y-4 py-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Item Name
            </label>
            <input
              type="text"
              placeholder="e.g. Swimming Goggles, Board Games"
              value={itemTitle}
              onChange={(e) => setItemTitle(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Category
            </label>
            <select
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
              <option value="CUSTOM">+ Custom Category</option>
            </select>
          </div>

          {itemCategory === 'CUSTOM' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Custom Category Name
              </label>
              <input
                type="text"
                placeholder="e.g. 🏄 Beach Equipment"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
                required
              />
            </div>
          )}

          {section === 'GROUP' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Assign To (Optional)
              </label>
              <select
                value={assignedToId}
                onChange={(e) => setAssignedToId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
              >
                <option value="">No assignment</option>
                {members.map((m) => (
                  <option key={m.user.id} value={m.user.id}>
                    {m.user.name} {m.user.id === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="pt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!itemTitle.trim() || isSubmitting}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* 4. Edit Gender Modal */}
      <Modal
        isOpen={isGenderModalOpen}
        onClose={() => setIsGenderModalOpen(false)}
        title="Profile Gender Preference"
      >
        <form onSubmit={handleSaveGender} className="space-y-4 py-1">
          <p className="text-xs text-slate-600 leading-relaxed">
            Women's Essentials categories are displayed inside the Personal Checklist when your gender is set to Female or Woman.
          </p>

          <div>
            <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
              Select Gender
            </label>
            <select
              value={genderInput}
              onChange={(e) => setGenderInput(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold rounded-2xl p-3 focus:outline-none focus:border-emerald-500 focus:bg-white"
            >
              <option value="Female">Female / Woman</option>
              <option value="Male">Male / Man</option>
              <option value="Non-binary">Non-binary / Other</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setIsGenderModalOpen(false)}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingGender}
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {isSavingGender ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Gender Preference'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
});
