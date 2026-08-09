'use client';

import React, { useEffect, useState } from 'react';
import { MemberLocationDetail } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatDate } from '@/lib/utils';
import {
  MapPin,
  Navigation,
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  Radio,
  Compass,
  Users,
  ExternalLink,
  LocateFixed,
  AlertCircle,
} from 'lucide-react';

interface LiveLocationViewProps {
  tripId: string;
  currentUserId: string;
  isAdmin: boolean;
  onRefreshTrip?: () => void;
}

export const LiveLocationView: React.FC<LiveLocationViewProps> = React.memo(({
  tripId,
  currentUserId,
  isAdmin,
  onRefreshTrip,
}) => {
  const [locations, setLocations] = useState<MemberLocationDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [isUpdatingGPS, setIsUpdatingGPS] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<MemberLocationDetail | null>(null);

  const fetchLocations = async () => {
    try {
      const res = await fetch(`/api/trips/${tripId}/location`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch member locations');
      
      const list: MemberLocationDetail[] = data.locations || [];
      setLocations(list);

      const currentUserLoc = list.find((l) => l.userId === currentUserId);
      if (currentUserLoc) {
        setIsSharing(currentUserLoc.isSharing);
      }
    } catch (err: any) {
      console.error('Fetch locations error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (tripId) fetchLocations();
  }, [tripId]);

  // Request browser GPS position and send to backend
  const updateGPSPosition = (sharingState: boolean) => {
    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by your browser.');
      return;
    }

    setIsUpdatingGPS(true);
    setErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        try {
          const res = await fetch(`/api/trips/${tripId}/location`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude,
              longitude,
              accuracy,
              isSharing: sharingState,
            }),
          });
          if (!res.ok) throw new Error('Failed to update live location');

          setIsSharing(sharingState);
          fetchLocations();
          if (onRefreshTrip) onRefreshTrip();
        } catch (err: any) {
          setErrorMsg(err.message || 'Failed to update GPS location.');
        } finally {
          setIsUpdatingGPS(false);
        }
      },
      (err) => {
        setIsUpdatingGPS(false);
        setErrorMsg(`GPS Error (${err.code}): ${err.message}. Please allow location access in your browser.`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleToggleSharing = () => {
    const nextState = !isSharing;
    if (nextState) {
      updateGPSPosition(true);
    } else {
      // Turn off sharing
      setIsUpdatingGPS(true);
      fetch(`/api/trips/${tripId}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: 0,
          longitude: 0,
          isSharing: false,
        }),
      })
        .then(() => {
          setIsSharing(false);
          fetchLocations();
        })
        .finally(() => setIsUpdatingGPS(false));
    }
  };

  // Default map center: first available member or Goa coordinates
  const activeLocations = React.useMemo(() => locations.filter((l) => l.isSharing), [locations]);
  const centerLat = activeLocations.length > 0 ? activeLocations[0].latitude : 15.2993;
  const centerLng = activeLocations.length > 0 ? activeLocations[0].longitude : 74.124;

  const openNavigationDirections = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto" />
        <p className="text-xs font-semibold text-slate-500">Loading Live Member Locations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Location Opt-In Banner */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                isSharing
                  ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Radio className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Live GPS Location Sharing</h3>
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                    isSharing
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {isSharing ? 'Live Sharing ACTIVE' : 'Sharing Disabled'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isSharing
                  ? 'Your location is visible to trip members for group coordination.'
                  : 'Location sharing is optional and strictly user-controlled.'}
              </p>
            </div>
          </div>

          {/* Location Toggle Switch */}
          <button
            type="button"
            role="switch"
            aria-checked={isSharing}
            disabled={isUpdatingGPS}
            onClick={handleToggleSharing}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              isSharing ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                isSharing ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold p-3.5 rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {isSharing && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500">
              Active GPS lock • High Accuracy
            </span>
            <button
              onClick={() => updateGPSPosition(true)}
              disabled={isUpdatingGPS}
              className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
            >
              <LocateFixed className="w-3.5 h-3.5" />
              {isUpdatingGPS ? 'Updating GPS...' : 'Refresh My Position'}
            </button>
          </div>
        )}
      </div>

      {/* Interactive Map Section */}
      <div className="bg-white rounded-3xl overflow-hidden border border-slate-100 apple-shadow">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-bold text-slate-900">Interactive Live Group Map</h4>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            {activeLocations.length} Members Sharing Location
          </span>
        </div>

        {/* Embedded Interactive Map */}
        <div className="relative h-72 w-full bg-slate-100 overflow-hidden">
          <iframe
            title="Group Member Map"
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${centerLng - 0.05}%2C${centerLat - 0.05}%2C${centerLng + 0.05}%2C${centerLat + 0.05}&layer=mapnik&marker=${centerLat}%2C${centerLng}`}
            className="w-full h-full"
          />

          {/* Overlay Member Pin Badges */}
          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            OpenStreetMap Live Tracking
          </div>
        </div>
      </div>

      {/* Active Member Cards List */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 apple-shadow space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <h4 className="text-sm font-bold text-slate-900">Active Member Locations</h4>
          </div>
          <button
            onClick={fetchLocations}
            className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Refresh List
          </button>
        </div>

        {activeLocations.length > 0 ? (
          <div className="space-y-3">
            {activeLocations.map((loc) => {
              const isCurrentUser = loc.userId === currentUserId;
              return (
                <div
                  key={loc.id}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 hover:bg-slate-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={loc.user.name} size="md" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {loc.user.name} {isCurrentUser ? '(You)' : ''}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Active Now
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {loc.distanceKm !== null && loc.distanceKm !== undefined ? (
                          <span className="font-extrabold text-indigo-600">
                            {loc.distanceKm} km away from you
                          </span>
                        ) : (
                          `GPS: ${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}`
                        )}{' '}
                        • Updated {formatDate(loc.updatedAt)}
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => openNavigationDirections(loc.latitude, loc.longitude)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Navigate
                  </Button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs italic space-y-2">
            <Compass className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No trip members are currently sharing their live location.</p>
            <p className="text-[11px] text-slate-400">
              Toggle "Live GPS Location Sharing" above to share your location with the group.
            </p>
          </div>
        )}
      </div>
    </div>
  );
});
