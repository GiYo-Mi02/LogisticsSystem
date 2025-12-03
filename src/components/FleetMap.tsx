'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';

// Load Leaflet CSS dynamically
if (typeof window !== 'undefined') {
    const linkId = 'leaflet-css';
    if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        link.crossOrigin = '';
        document.head.appendChild(link);
    }
}

// Custom marker icons
const createIcon = (color: string, isActive: boolean = false) => {
    const size = isActive ? 40 : 30;
    const pulseAnimation = isActive ? `
        <style>
            @keyframes pulse-ring {
                0% { transform: scale(0.8); opacity: 1; }
                100% { transform: scale(2); opacity: 0; }
            }
            .pulse-ring { animation: pulse-ring 1.5s ease-out infinite; }
        </style>
        <circle cx="20" cy="20" r="15" fill="${color}" opacity="0.3" class="pulse-ring"/>
    ` : '';
    
    return L.divIcon({
        html: `
            <svg width="${size}" height="${size}" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
                ${pulseAnimation}
                <circle cx="20" cy="20" r="12" fill="${color}" stroke="white" stroke-width="2"/>
                <circle cx="20" cy="20" r="5" fill="white"/>
            </svg>
        `,
        className: 'custom-marker',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    });
};

// Vehicle type icons with better SVG
const vehicleIcons = {
    DRONE: (color: string) => L.divIcon({
        html: `
            <div style="position: relative;">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="white" opacity="0.3"/>
                    <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
                    <path d="M12 6l-4 4h3v4h2v-4h3l-4-4z" fill="white"/>
                </svg>
            </div>
        `,
        className: 'vehicle-marker drone',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    }),
    TRUCK: (color: string) => L.divIcon({
        html: `
            <div style="position: relative;">
                <svg width="36" height="36" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
                    <path d="M18 10h-2V7H6v8h1c0 1.1.9 2 2 2s2-.9 2-2h4c0 1.1.9 2 2 2s2-.9 2-2h1v-3l-2-2zm-9 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm8 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm0-4h-1V9h.5l1.5 2h-1z" fill="white"/>
                </svg>
            </div>
        `,
        className: 'vehicle-marker truck',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
    }),
    SHIP: (color: string) => L.divIcon({
        html: `
            <div style="position: relative;">
                <svg width="40" height="40" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="11" fill="${color}" stroke="white" stroke-width="2"/>
                    <!-- Cargo Ship Icon -->
                    <path d="M4 17l2-5h12l2 5" stroke="white" stroke-width="1.5" fill="none"/>
                    <rect x="7" y="9" width="10" height="3" rx="0.5" fill="white"/>
                    <rect x="8" y="6" width="3" height="3" rx="0.5" fill="white"/>
                    <rect x="12" y="7" width="2" height="2" rx="0.3" fill="white"/>
                    <path d="M3 18c1.5 1 3 1.5 4.5 1.5s3-.5 4.5-1.5c1.5 1 3 1.5 4.5 1.5s3-.5 4.5-1.5" stroke="white" stroke-width="1" fill="none" stroke-linecap="round"/>
                </svg>
            </div>
        `,
        className: 'vehicle-marker ship',
        iconSize: [40, 40],
        iconAnchor: [20, 20],
    }),
};

// Shipment marker (package icon)
const shipmentIcon = (status: string) => {
    const color = status === 'IN_TRANSIT' ? '#00D9FF' : 
                  status === 'DELIVERED' ? '#22C55E' : 
                  status === 'ASSIGNED' ? '#F59E0B' : '#6B7280';
    
    return L.divIcon({
        html: `
            <svg width="28" height="28" viewBox="0 0 24 24" fill="${color}" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="18" height="18" rx="2" fill="${color}" stroke="white" stroke-width="1.5"/>
                <path d="M12 8v8M8 12h8" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
        `,
        className: 'shipment-marker',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
    });
};

interface Vehicle {
    id: string;
    licenseId: string;
    type: 'DRONE' | 'TRUCK' | 'SHIP';
    status: string;
    latitude: number | null;
    longitude: number | null;
    currentFuel: number;
    currentShipment?: {
        id: string;
        trackingId: string;
        originLat: number;
        originLng: number;
        destLat: number;
        destLng: number;
    } | null;
}

interface Shipment {
    id: string;
    trackingId: string;
    status: string;
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    currentLat?: number;
    currentLng?: number;
}

interface FleetMapProps {
    vehicles: Vehicle[];
    shipments?: Shipment[];
    selectedVehicle: Vehicle | null;
    onVehicleSelect: (vehicle: Vehicle | null) => void;
    className?: string;
}

export default function FleetMap({ 
    vehicles, 
    shipments = [], 
    selectedVehicle, 
    onVehicleSelect,
    className = ''
}: FleetMapProps) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const routeLinesRef = useRef<Map<string, L.Polyline>>(new Map());
    const [isClient, setIsClient] = useState(false);

    // Only render on client
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Initialize map
    useEffect(() => {
        if (!isClient || !mapRef.current || mapInstanceRef.current) return;

        // Create map centered on a world view
        const map = L.map(mapRef.current, {
            center: [20, 0],
            zoom: 2,
            minZoom: 2,
            maxZoom: 18,
            zoomControl: true,
            attributionControl: false,
        });

        // Add dark-themed tile layer (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd',
            maxZoom: 19,
        }).addTo(map);

        // Add custom attribution
        L.control.attribution({
            prefix: false,
            position: 'bottomright'
        }).addAttribution('© <a href="https://carto.com/">CARTO</a>').addTo(map);

        mapInstanceRef.current = map;

        return () => {
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [isClient]);

    // Update vehicle markers
    useEffect(() => {
        if (!mapInstanceRef.current) return;
        const map = mapInstanceRef.current;

        // Track current vehicle IDs
        const currentVehicleIds = new Set(vehicles.map(v => v.id));

        // Remove markers for vehicles that no longer exist
        markersRef.current.forEach((marker, id) => {
            if (!currentVehicleIds.has(id) && !id.startsWith('shipment-')) {
                marker.remove();
                markersRef.current.delete(id);
            }
        });

        // Remove old route lines
        routeLinesRef.current.forEach((line, id) => {
            if (!currentVehicleIds.has(id)) {
                line.remove();
                routeLinesRef.current.delete(id);
            }
        });

        // Update or create markers for vehicles
        vehicles.forEach(vehicle => {
            if (vehicle.latitude === null || vehicle.longitude === null) return;

            const isSelected = selectedVehicle?.id === vehicle.id;
            const color = vehicle.type === 'DRONE' ? '#00D9FF' : 
                         vehicle.type === 'TRUCK' ? '#F97316' : '#3B82F6';
            
            const icon = vehicleIcons[vehicle.type](color);
            
            let marker = markersRef.current.get(vehicle.id);
            
            if (marker) {
                // Update existing marker position with animation
                marker.setLatLng([vehicle.latitude, vehicle.longitude]);
                marker.setIcon(icon);
            } else {
                // Create new marker
                marker = L.marker([vehicle.latitude, vehicle.longitude], { icon })
                    .addTo(map)
                    .on('click', () => onVehicleSelect(vehicle));
                
                // Add tooltip
                marker.bindTooltip(`
                    <div class="font-mono text-xs">
                        <strong>${vehicle.licenseId}</strong><br/>
                        ${vehicle.type} - ${vehicle.status}<br/>
                        Fuel: ${vehicle.currentFuel}%
                    </div>
                `, { 
                    className: 'custom-tooltip',
                    direction: 'top',
                    offset: [0, -10]
                });
                
                markersRef.current.set(vehicle.id, marker);
            }

            // Draw route line if vehicle has active shipment
            if (vehicle.currentShipment && vehicle.status === 'IN_TRANSIT') {
                const shipment = vehicle.currentShipment;
                const routeCoords: L.LatLngTuple[] = [
                    [shipment.originLat, shipment.originLng],
                    [vehicle.latitude, vehicle.longitude],
                    [shipment.destLat, shipment.destLng]
                ];

                let routeLine = routeLinesRef.current.get(vehicle.id);
                if (routeLine) {
                    routeLine.setLatLngs(routeCoords);
                } else {
                    routeLine = L.polyline(routeCoords, {
                        color: color,
                        weight: 2,
                        opacity: 0.6,
                        dashArray: '10, 10',
                    }).addTo(map);
                    routeLinesRef.current.set(vehicle.id, routeLine);
                }

                // Add origin marker
                const originMarkerId = `origin-${vehicle.id}`;
                if (!markersRef.current.has(originMarkerId)) {
                    const originMarker = L.circleMarker([shipment.originLat, shipment.originLng], {
                        radius: 6,
                        fillColor: '#22C55E',
                        color: 'white',
                        weight: 2,
                        fillOpacity: 0.8
                    }).addTo(map);
                    markersRef.current.set(originMarkerId, originMarker as unknown as L.Marker);
                }

                // Add destination marker
                const destMarkerId = `dest-${vehicle.id}`;
                if (!markersRef.current.has(destMarkerId)) {
                    const destMarker = L.circleMarker([shipment.destLat, shipment.destLng], {
                        radius: 6,
                        fillColor: '#EF4444',
                        color: 'white',
                        weight: 2,
                        fillOpacity: 0.8
                    }).addTo(map);
                    markersRef.current.set(destMarkerId, destMarker as unknown as L.Marker);
                }
            } else {
                // Remove route line and endpoint markers if not in transit
                const routeLine = routeLinesRef.current.get(vehicle.id);
                if (routeLine) {
                    routeLine.remove();
                    routeLinesRef.current.delete(vehicle.id);
                }
                
                const originMarker = markersRef.current.get(`origin-${vehicle.id}`);
                if (originMarker) {
                    originMarker.remove();
                    markersRef.current.delete(`origin-${vehicle.id}`);
                }
                
                const destMarker = markersRef.current.get(`dest-${vehicle.id}`);
                if (destMarker) {
                    destMarker.remove();
                    markersRef.current.delete(`dest-${vehicle.id}`);
                }
            }
        });

        // Fly to selected vehicle
        if (selectedVehicle && selectedVehicle.latitude && selectedVehicle.longitude) {
            map.flyTo([selectedVehicle.latitude, selectedVehicle.longitude], 6, {
                duration: 1
            });
        }
    }, [vehicles, selectedVehicle, onVehicleSelect]);

    if (!isClient) {
        return (
            <div className={`bg-space-dark rounded-xl flex items-center justify-center ${className}`}>
                <div className="text-cyan-400 animate-pulse">Loading Map...</div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            <div 
                ref={mapRef} 
                className="w-full h-full rounded-xl overflow-hidden"
                style={{ background: '#0a0a0a' }}
            />
            
            {/* Map overlay controls */}
            <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-2">
                <button 
                    onClick={() => mapInstanceRef.current?.setView([20, 0], 2)}
                    className="w-8 h-8 bg-black/70 hover:bg-black/90 border border-white/20 rounded flex items-center justify-center text-white text-sm transition-colors"
                    title="Reset View"
                >
                    🌍
                </button>
            </div>

            {/* Legend overlay */}
            <div className="absolute bottom-3 left-3 z-[1000] bg-black/70 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                <div className="flex flex-wrap gap-4 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                        <span className="text-gray-300">Drone</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span className="text-gray-300">Truck</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-300">Ship</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-300">Origin</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-gray-300">Destination</span>
                    </div>
                </div>
            </div>

            {/* Custom styles for tooltips */}
            <style jsx global>{`
                .custom-tooltip {
                    background: rgba(0, 0, 0, 0.9) !important;
                    border: 1px solid rgba(0, 217, 255, 0.3) !important;
                    border-radius: 8px !important;
                    padding: 8px 12px !important;
                    color: white !important;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
                }
                .custom-tooltip::before {
                    border-top-color: rgba(0, 217, 255, 0.3) !important;
                }
                .leaflet-control-zoom {
                    border: 1px solid rgba(255, 255, 255, 0.2) !important;
                    border-radius: 8px !important;
                    overflow: hidden;
                }
                .leaflet-control-zoom a {
                    background: rgba(0, 0, 0, 0.8) !important;
                    color: white !important;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
                }
                .leaflet-control-zoom a:hover {
                    background: rgba(0, 0, 0, 0.95) !important;
                }
                .vehicle-marker {
                    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
                }
                .custom-marker {
                    background: transparent !important;
                    border: none !important;
                }
            `}</style>
        </div>
    );
}
