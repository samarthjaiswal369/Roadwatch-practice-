import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  ChevronRight,
  Navigation2,
  Layers,
} from 'lucide-react';

import roads from '../data/roads';
import useAppStore from '../store/useAppStore';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, SectionHeader } from '../components/ui';

const MUMBAI_CENTER = { lat: 19.0760, lng: 72.8777 };

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const mapStyles = [
  { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d8e8' }] },
];

const getSeverity = (complaints) => {
  if (!complaints || complaints <= 4) {
    return {
      label: 'Good',
      hex: '#22c55e',
      bgColor: 'rgba(34,197,94,0.15)',
    };
  }

  if (complaints <= 8) {
    return {
      label: 'Warning',
      hex: '#eab308',
      bgColor: 'rgba(234,179,8,0.15)',
    };
  }

  return {
    label: 'Critical',
    hex: '#ef4444',
    bgColor: 'rgba(239,68,68,0.15)',
  };
};

function BottomSheet({ road, onClose, onRaiseComplaint }) {
  if (!road) return null;

  const cfg = getSeverity(road.complaints);

  return (
    <motion.div
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl p-4 bg-bg-surface border-t border-border-subtle shadow-2xl"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{road.name}</h2>
          <p className="text-sm text-text-muted">{road.area}</p>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-full bg-slate-100 hover:bg-slate-200"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-4">
        <div
          className="px-3 py-2 rounded-xl border text-sm font-semibold"
          style={{
            background: cfg.bgColor,
            color: cfg.hex,
            borderColor: `${cfg.hex}30`,
          }}
        >
          {cfg.label} ({road.complaints} complaints)
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-text-muted">Authority</p>
            <p className="font-semibold">{road.authority || 'N/A'}</p>
          </div>

          <div>
            <p className="text-xs text-text-muted">Category</p>
            <p className="font-semibold">{road.category || 'N/A'}</p>
          </div>

          <div>
            <p className="text-xs text-text-muted">Last Repair</p>
            <p className="font-semibold">{road.lastRepair || 'N/A'}</p>
          </div>

          <div>
            <p className="text-xs text-text-muted">Contractor</p>
            <p className="font-semibold">{road.contractor || 'N/A'}</p>
          </div>
        </div>

        <button
          onClick={onRaiseComplaint}
          className="w-full mt-2 px-6 py-2 rounded-xl bg-primary text-white font-semibold hover:bg-primary/90"
        >
          Raise Complaint
        </button>
      </div>
    </motion.div>
  );
}

export default function MapPage() {
  const navigate = useNavigate();

  const {
    darkMode,
    selectedRoad,
    setSelectedRoad,
    clearSelectedRoad,
  } = useAppStore();

  const mapRef = useRef(null);

  const [authError, setAuthError] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  const isPlaceholder =
    !apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: isPlaceholder ? '' : apiKey,
  });

  useEffect(() => {
    window.gm_authFailure = () => {
      setAuthError(true);
    };

    return () => {
      delete window.gm_authFailure;
    };
  }, []);

  const onMapLoad = useCallback((map) => {
    mapRef.current = map;
  }, []);

  const handleRaiseComplaint = () => {
    if (!selectedRoad) return;

    navigate('/complaint', {
      state: {
        road: selectedRoad,
      },
    });

    clearSelectedRoad();
  };

  const suggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const q = searchQuery.toLowerCase();

    return roads
      .filter(
        (road) =>
          road.name.toLowerCase().includes(q) ||
          (road.area &&
            road.area.toLowerCase().includes(q))
      )
      .slice(0, 8);
  }, [searchQuery]);

  const handleRoadSelect = useCallback(
    (road) => {
      setSelectedRoad(road);

      setSearchQuery('');
      setShowSuggestions(false);

      if (mapRef.current && road.path?.length) {
        const midpoint =
          road.path[Math.floor(road.path.length / 2)];

        mapRef.current.panTo(midpoint);
        mapRef.current.setZoom(15);
      }
    },
    [setSelectedRoad]
  );

  const handleCloseSheet = useCallback(() => {
    clearSelectedRoad();

    if (mapRef.current) {
      mapRef.current.panTo(MUMBAI_CENTER);
      mapRef.current.setZoom(12);
    }
  }, [clearSelectedRoad]);

  const showFallback =
    isPlaceholder || !!loadError || authError;

  if (!isLoaded && !showFallback) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <p>Loading map...</p>
      </div>
    );
  }

  if (showFallback) {
    return (
      <div className="relative h-[calc(100vh-4rem)] overflow-hidden">
        <PageContainer className="flex flex-col items-center justify-center py-8">
          <div className="text-center max-w-2xl w-full">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-primary/10">
              <Navigation2 size={30} className="text-primary" />
            </div>

            <h1 className="text-2xl font-bold mb-3">
              Infrastructure Map
            </h1>

            <p className="text-text-muted mb-6">
              Google Maps unavailable. Browse roads below.
            </p>

            <Card className="p-0 overflow-hidden">
              <div className="px-6 py-3 border-b flex items-center justify-between">
                <SectionHeader
                  title="Infrastructure Inventory"
                  className="mb-0"
                />

                <span className="text-xs text-text-muted">
                  {roads.length} Roads
                </span>
              </div>

              <div className="max-h-[400px] overflow-y-auto divide-y">
                {roads.map((road) => {
                  const cfg = getSeverity(road.complaints);

                  return (
                    <div
                      key={road.id}
                      onClick={() => handleRoadSelect(road)}
                      className="flex items-center justify-between py-4 px-6 hover:bg-slate-50 cursor-pointer"
                    >
                      <div>
                        <p className="font-semibold">
                          {road.name}
                        </p>

                        <p className="text-xs text-text-muted">
                          {road.area}
                        </p>
                      </div>

                      <div
                        className="px-3 py-1 rounded-full text-xs font-bold border"
                        style={{
                          background: cfg.bgColor,
                          color: cfg.hex,
                          borderColor: `${cfg.hex}30`,
                        }}
                      >
                        {cfg.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>
        </PageContainer>

        <AnimatePresence>
          {selectedRoad && (
            <BottomSheet
              road={selectedRoad}
              onClose={handleCloseSheet}
              onRaiseComplaint={handleRaiseComplaint}
            />
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-4rem)] w-full overflow-hidden">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={MUMBAI_CENTER}
        zoom={12}
        onLoad={onMapLoad}
        options={{
          disableDefaultUI: true,
          styles: mapStyles,
        }}
      >
        {roads.map((road) => {
          if (!road.path?.length) return null;

          const midpoint =
            road.path[Math.floor(road.path.length / 2)];

          const cfg = getSeverity(road.complaints);

          return (
            <div
              key={road.id}
              lat={midpoint.lat}
              lng={midpoint.lng}
            >
              <button
                onClick={() => handleRoadSelect(road)}
                className="hidden"
              >
                {cfg.label}
              </button>
            </div>
          );
        })}
      </GoogleMap>

      {/* Search */}
      <div className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <input
            type="text"
            placeholder="Search roads..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            className="w-full px-4 py-3 outline-none"
          />

          {showSuggestions && suggestions.length > 0 && (
            <div className="border-t max-h-[250px] overflow-y-auto">
              {suggestions.map((road) => (
                <button
                  key={road.id}
                  onClick={() => handleRoadSelect(road)}
                  className="w-full text-left px-4 py-3 hover:bg-slate-100"
                >
                  <p className="font-semibold">
                    {road.name}
                  </p>

                  <p className="text-xs text-text-muted">
                    {road.area}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedRoad && (
          <BottomSheet
            road={selectedRoad}
            onClose={handleCloseSheet}
            onRaiseComplaint={handleRaiseComplaint}
          />
        )}
      </AnimatePresence>
    </div>
  );
}