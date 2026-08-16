'use client';

import React, { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { ItineraryItemDetail } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Compass,
  Utensils,
  Car,
  Palmtree,
  Camera,
  Plane,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

interface ItineraryViewProps {
  tripId: string;
  itinerary: ItineraryItemDetail[];
  isAdmin: boolean;
  onRefresh: () => void;
}

const CATEGORY_ICONS: Record<string, { icon: React.ElementType; bg: string; color: string }> = {
  Sightseeing: { icon: Camera, bg: 'bg-blue-100 text-blue-700', color: 'text-blue-600' },
  Dining: { icon: Utensils, bg: 'bg-amber-100 text-amber-700', color: 'text-amber-600' },
  Transport: { icon: Car, bg: 'bg-purple-100 text-purple-700', color: 'text-purple-600' },
  Flight: { icon: Plane, bg: 'bg-indigo-100 text-indigo-700', color: 'text-indigo-600' },
  Leisure: { icon: Palmtree, bg: 'bg-emerald-100 text-emerald-700', color: 'text-emerald-600' },
  Activity: { icon: Compass, bg: 'bg-teal-100 text-teal-700', color: 'text-teal-600' },
};

export const ItineraryView: React.FC<ItineraryViewProps> = React.memo(({
  tripId,
  itinerary,
  isAdmin,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ItineraryItemDetail | null>(null);

  // Form State
  const [dayNumber, setDayNumber] = useState('1');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Sightseeing');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Group items by dayNumber
  const { daysMap, sortedDays } = React.useMemo(() => {
    const map = new Map<number, ItineraryItemDetail[]>();
    itinerary.forEach((item) => {
      const list = map.get(item.dayNumber) || [];
      list.push(item);
      map.set(item.dayNumber, list);
    });
    const sorted = Array.from(map.keys()).sort((a, b) => a - b);
    return { daysMap: map, sortedDays: sorted };
  }, [itinerary]);

  const handleOpenAddModal = (targetDay?: number) => {
    setEditingItem(null);
    setDayNumber(targetDay ? targetDay.toString() : (sortedDays.length > 0 ? Math.max(...sortedDays).toString() : '1'));
    setTitle('');
    setCategory('Sightseeing');
    setStartTime('');
    setEndTime('');
    setLocation('');
    setDescription('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: ItineraryItemDetail) => {
    setEditingItem(item);
    setDayNumber(item.dayNumber.toString());
    setTitle(item.title);
    setCategory(item.category || 'Sightseeing');
    setStartTime(item.startTime || '');
    setEndTime(item.endTime || '');
    setLocation(item.location || '');
    setDescription(item.description || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const url = editingItem
        ? `/api/trips/${tripId}/itinerary/${editingItem.id}`
        : `/api/trips/${tripId}/itinerary`;
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dayNumber: parseInt(dayNumber, 10) || 1,
          title: title.trim(),
          category,
          startTime: startTime.trim() || undefined,
          endTime: endTime.trim() || undefined,
          location: location.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save itinerary item');

      onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const { showToast } = useToast();
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  const performDelete = async (itemId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/itinerary/${itemId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete item');
      showToast('✓ Itinerary item deleted', 'info', 'Deleted');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete item', 'error', 'Error');
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleDelete = (itemId: string) => {
    setDeletingItemId(itemId);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-5 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-indigo-400" /> Day-Wise Travel Schedule
          </div>
          <h3 className="text-lg font-black tracking-tight">Trip Itinerary</h3>
          <p className="text-xs text-indigo-200/80 max-w-sm">
            Complete schedule, destinations, activity timings, and locations for all trip members.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={() => handleOpenAddModal()}
            size="sm"
            className="bg-white text-indigo-900 hover:bg-indigo-50 font-bold shrink-0 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Activity
          </Button>
        )}
      </div>

      {/* Itinerary Schedule Body */}
      {sortedDays.length > 0 ? (
        <div className="space-y-6">
          {sortedDays.map((dayNum) => {
            const items = daysMap.get(dayNum) || [];
            return (
              <div key={dayNum} className="space-y-3">
                {/* Day Header Badge */}
                <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-600 text-white text-xs font-black px-3 py-1 rounded-xl shadow-sm">
                      Day {dayNum}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      ({items.length} activit{items.length !== 1 ? 'ies' : 'y'})
                    </span>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenAddModal(dayNum)}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add to Day {dayNum}
                    </button>
                  )}
                </div>

                {/* Items Timeline Cards */}
                <div className="space-y-3 pl-1">
                  {items.map((item) => {
                    const catStyle = CATEGORY_ICONS[item.category || 'Sightseeing'] || CATEGORY_ICONS.Sightseeing;
                    const CatIcon = catStyle.icon;

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl p-4 border border-slate-100 apple-shadow hover:border-slate-200 transition-all space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className={`p-2.5 rounded-xl ${catStyle.bg} shrink-0 mt-0.5`}>
                              <CatIcon className="w-4 h-4" />
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${catStyle.bg}`}>
                                  {item.category || 'Sightseeing'}
                                </span>
                              </div>

                              {(item.startTime || item.endTime) && (
                                <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 mt-1">
                                  <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                  <span>
                                    {item.startTime} {item.endTime ? `- ${item.endTime}` : ''}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {isAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenEditModal(item)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                                title="Edit Item"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {item.location && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 p-2 rounded-xl border border-slate-100">
                            <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            <span className="font-semibold truncate">{item.location}</span>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.location)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto text-[11px] font-bold text-indigo-600 hover:underline inline-flex items-center gap-0.5 shrink-0"
                            >
                              Map <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}

                        {item.description && (
                          <p className="text-xs text-slate-600 leading-relaxed font-normal pt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-3 apple-shadow">
          <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Itinerary Planned Yet</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {isAdmin
              ? 'Start building your day-by-day travel plan so all trip members can view the schedule and activity timings.'
              : 'The Super Host has not added itinerary details for this trip yet.'}
          </p>
          {isAdmin && (
            <Button onClick={() => handleOpenAddModal(1)} size="sm" className="mt-2">
              <Plus className="w-4 h-4 mr-1" /> Create Day 1 Schedule
            </Button>
          )}
        </div>
      )}

      {/* Add / Edit Itinerary Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? 'Edit Itinerary Activity' : 'Add Itinerary Activity'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-600">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Day Number
                </label>
                <input
                  type="number"
                  min="1"
                  value={dayNumber}
                  onChange={(e) => setDayNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm font-bold rounded-2xl p-3 focus:outline-none focus:border-indigo-500 focus:bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-2xl p-3 focus:outline-none focus:border-indigo-500 focus:bg-white"
                >
                  <option value="Sightseeing">Sightseeing</option>
                  <option value="Dining">Dining</option>
                  <option value="Transport">Transport</option>
                  <option value="Flight">Flight</option>
                  <option value="Leisure">Leisure</option>
                  <option value="Activity">Activity</option>
                </select>
              </div>
            </div>

            <Input
              label="Activity Title"
              placeholder="e.g. Scuba Diving, Hotel Check-in, Seafood Dinner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Start Time (Optional)"
                placeholder="e.g. 09:30 AM"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
              <Input
                label="End Time (Optional)"
                placeholder="e.g. 01:00 PM"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <Input
              label="Location / Destination (Optional)"
              placeholder="e.g. Baga Beach, Candolim, Goa"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Description & Notes (Optional)
              </label>
              <textarea
                placeholder="Add entry instructions, ticket reference, what to carry, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl p-3 focus:outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                {editingItem ? 'Save Changes' : 'Add Activity'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deletingItemId && (
        <ConfirmModal
          isOpen={!!deletingItemId}
          onClose={() => setDeletingItemId(null)}
          title="Delete Itinerary Item"
          message="Are you sure you want to delete this itinerary activity?"
          confirmText="Delete Activity"
          variant="danger"
          onConfirm={() => {
            if (deletingItemId) performDelete(deletingItemId);
          }}
        />
      )}
    </div>
  );
});
