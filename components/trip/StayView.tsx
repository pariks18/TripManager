'use client';

import React, { useState } from 'react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import { StayDetail } from '@/types';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import {
  Hotel,
  MapPin,
  Calendar,
  Clock,
  ExternalLink,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Key,
  FileText,
  CheckCircle2,
  Building,
} from 'lucide-react';

interface StayViewProps {
  tripId: string;
  stays: StayDetail[];
  isAdmin: boolean;
  onRefresh: () => void;
}

export const StayView: React.FC<StayViewProps> = React.memo(({
  tripId,
  stays,
  isAdmin,
  onRefresh,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStay, setEditingStay] = useState<StayDetail | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [checkOutTime, setCheckOutTime] = useState('');
  const [bookingRef, setBookingRef] = useState('');
  const [bookingUrl, setBookingUrl] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleOpenAddModal = () => {
    setEditingStay(null);
    setName('');
    setAddress('');
    setCheckIn('');
    setCheckOut('');
    setCheckInTime('02:00 PM');
    setCheckOutTime('11:00 AM');
    setBookingRef('');
    setBookingUrl('');
    setContactPhone('');
    setNotes('');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (stay: StayDetail) => {
    setEditingStay(stay);
    setName(stay.name);
    setAddress(stay.address || '');
    setCheckIn(stay.checkIn ? stay.checkIn.split('T')[0] : '');
    setCheckOut(stay.checkOut ? stay.checkOut.split('T')[0] : '');
    setCheckInTime(stay.checkInTime || '');
    setCheckOutTime(stay.checkOutTime || '');
    setBookingRef(stay.bookingRef || '');
    setBookingUrl(stay.bookingUrl || '');
    setContactPhone(stay.contactPhone || '');
    setNotes(stay.notes || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Hotel / Accommodation name is required');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const url = editingStay
        ? `/api/trips/${tripId}/stay/${editingStay.id}`
        : `/api/trips/${tripId}/stay`;
      const method = editingStay ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || undefined,
          checkIn: checkIn || undefined,
          checkOut: checkOut || undefined,
          checkInTime: checkInTime.trim() || undefined,
          checkOutTime: checkOutTime.trim() || undefined,
          bookingRef: bookingRef.trim() || undefined,
          bookingUrl: bookingUrl.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save stay details');

      onRefresh();
      setIsModalOpen(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const { showToast } = useToast();
  const [deletingStayId, setDeletingStayId] = useState<string | null>(null);

  const performDelete = async (stayId: string) => {
    try {
      const res = await fetch(`/api/trips/${tripId}/stay/${stayId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete stay record');
      showToast('✓ Stay record deleted', 'info', 'Deleted');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete stay record', 'error', 'Error');
    } finally {
      setDeletingStayId(null);
    }
  };

  const handleDelete = (stayId: string) => {
    setDeletingStayId(stayId);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-pink-800 via-rose-800 to-purple-900 rounded-3xl p-5 text-white shadow-xl flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-pink-200 text-xs font-bold uppercase tracking-wider">
            <Hotel className="w-4 h-4 text-pink-400" /> Accommodation & Quick Access
          </div>
          <h3 className="text-lg font-black tracking-tight">Stay Details</h3>
          <p className="text-xs text-pink-200/80 max-w-sm">
            Hotel, Villa & Airbnb details, check-in/out times, address, and 1-tap direct booking links.
          </p>
        </div>

        {isAdmin && (
          <Button
            onClick={handleOpenAddModal}
            size="sm"
            className="bg-white text-rose-900 hover:bg-rose-50 font-bold shrink-0 shadow-md"
          >
            <Plus className="w-4 h-4 mr-1" /> Add Stay
          </Button>
        )}
      </div>

      {/* Stay Cards List */}
      {stays && stays.length > 0 ? (
        <div className="space-y-4">
          {stays.map((stay) => (
            <div
              key={stay.id}
              className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-3 rounded-2xl bg-pink-50 text-pink-600 shrink-0 mt-0.5">
                    <Building className="w-5 h-5" />
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">{stay.name}</h4>
                    {stay.bookingRef && (
                      <span className="text-[10px] font-mono font-extrabold bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full inline-block mt-1">
                        Booking Ref: {stay.bookingRef}
                      </span>
                    )}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditModal(stay)}
                      className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Edit Stay Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(stay.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete Stay Details"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Address Banner */}
              {stay.address && (
                <div className="flex items-start gap-2 bg-slate-50 border border-slate-200/60 p-3 rounded-2xl text-xs text-slate-800">
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="font-semibold block">{stay.address}</span>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stay.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] font-bold text-pink-600 hover:underline inline-flex items-center gap-0.5 shrink-0 ml-1"
                  >
                    Get Directions <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              {/* Check-In / Check-Out Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-3 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Check-In
                  </span>
                  <p className="font-extrabold text-emerald-950">
                    {stay.checkIn ? formatDate(stay.checkIn) : 'Date TBD'}
                  </p>
                  {stay.checkInTime && (
                    <p className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {stay.checkInTime}
                    </p>
                  )}
                </div>

                <div className="bg-rose-50/70 border border-rose-200/80 p-3 rounded-2xl space-y-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-rose-600" /> Check-Out
                  </span>
                  <p className="font-extrabold text-rose-950">
                    {stay.checkOut ? formatDate(stay.checkOut) : 'Date TBD'}
                  </p>
                  {stay.checkOutTime && (
                    <p className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {stay.checkOutTime}
                    </p>
                  )}
                </div>
              </div>

              {/* Direct Booking Link & Contact Phone */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {stay.bookingUrl && (
                  <a
                    href={stay.bookingUrl.startsWith('http') ? stay.bookingUrl : `https://${stay.bookingUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" /> Open Direct Booking Link
                  </a>
                )}

                {stay.contactPhone && (
                  <a
                    href={`tel:${stay.contactPhone}`}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-200 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> {stay.contactPhone}
                  </a>
                )}
              </div>

              {/* Notes & Room / WiFi Instructions */}
              {stay.notes && (
                <div className="bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl space-y-1 text-xs">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-pink-600" /> Host Notes & Instructions:
                  </span>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-line">{stay.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 text-center space-y-3 apple-shadow">
          <Hotel className="w-10 h-10 text-slate-300 mx-auto" />
          <h4 className="text-base font-bold text-slate-800">No Accommodation Details Uploaded</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            {isAdmin
              ? 'Add hotel or Airbnb details, check-in/out times, and direct booking links for easy 1-tap access.'
              : 'The Super Host has not added stay details for this trip yet.'}
          </p>
          {isAdmin && (
            <Button onClick={handleOpenAddModal} size="sm" className="mt-2">
              <Plus className="w-4 h-4 mr-1" /> Add Accommodation Details
            </Button>
          )}
        </div>
      )}

      {/* Add / Edit Stay Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingStay ? 'Edit Stay Details' : 'Add Stay / Accommodation'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-medium text-rose-600">
                {error}
              </div>
            )}

            <Input
              label="Hotel / Airbnb / Villa Name"
              placeholder="e.g. Taj Fort Aguada Resort, Goa Beachfront Villa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="Full Address (Optional)"
              placeholder="e.g. Sinquerim Beach, Candolim, Goa 403515"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Check-In Date
                </label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl p-3 focus:outline-none focus:border-pink-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                  Check-Out Date
                </label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl p-3 focus:outline-none focus:border-pink-500 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Check-In Time"
                placeholder="e.g. 02:00 PM"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
              />
              <Input
                label="Check-Out Time"
                placeholder="e.g. 11:00 AM"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
              />
            </div>

            <Input
              label="Direct Booking URL (Airbnb, Booking.com, etc.)"
              placeholder="https://www.airbnb.com/rooms/123456"
              value={bookingUrl}
              onChange={(e) => setBookingUrl(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Booking Ref / Conf #"
                placeholder="e.g. HM8X92K"
                value={bookingRef}
                onChange={(e) => setBookingRef(e.target.value)}
              />
              <Input
                label="Reception / Host Phone"
                placeholder="e.g. +91 9876543210"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase mb-1.5">
                Notes & Instructions (Optional)
              </label>
              <textarea
                placeholder="Key pickup instructions, WiFi network name & password, room numbers, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-2xl p-3 focus:outline-none focus:border-pink-500 focus:bg-white"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" fullWidth isLoading={isLoading} size="lg">
                {editingStay ? 'Save Stay Changes' : 'Add Accommodation Details'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {deletingStayId && (
        <ConfirmModal
          isOpen={!!deletingStayId}
          onClose={() => setDeletingStayId(null)}
          title="Delete Stay Accommodation"
          message="Are you sure you want to delete this stay record?"
          confirmText="Delete Accommodation"
          variant="danger"
          onConfirm={() => {
            if (deletingStayId) performDelete(deletingStayId);
          }}
        />
      )}
    </div>
  );
});
