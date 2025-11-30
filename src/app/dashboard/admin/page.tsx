'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRealtime } from '@/hooks/useRealtime';

interface Vehicle {
    id: string;
    licenseId: string;
    type: 'DRONE' | 'TRUCK' | 'SHIP';
    status: string;
    latitude: number | null;
    longitude: number | null;
    currentFuel: number;
    currentShipment: any | null;
}

interface Shipment {
    id: string;
    trackingId: string;
    status: string;
    weight: number;
    cost: number | null;
    createdAt: string;
    customer: { name: string };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>('--:--:--');
    const [isMounted, setIsMounted] = useState(false);

    // Handle client-side mounting to avoid hydration issues
    useEffect(() => {
        setIsMounted(true);
        setLastUpdateTime(new Date().toLocaleTimeString());
    }, []);

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/stats');
            const data = await res.json();
            setStats(data);
            setVehicles(data.vehicles || []);
            setRecentShipments(data.recentShipments || []);
            if (isMounted) {
                setLastUpdateTime(new Date().toLocaleTimeString());
            }
        } catch (error) {
            console.error('Failed to fetch admin stats', error);
        }
    }, [isMounted]);

    // Real-time connection
    const { isConnected } = useRealtime({
        onShipmentUpdate: () => fetchStats(),
        onVehicleUpdate: (event) => {
            // Update vehicle in real-time
            setVehicles(prev => prev.map(v => 
                v.id === event.data.id ? { ...v, ...event.data } : v
            ));
            setLastUpdateTime(new Date().toLocaleTimeString());
        },
        onNewShipment: () => fetchStats(),
        onAssignmentUpdate: () => fetchStats(),
        onStatsUpdate: (event) => {
            if (event.data.totalShipments) {
                setStats((prev: any) => ({ ...prev, totalShipments: event.data.totalShipments }));
            }
            setLastUpdateTime(new Date().toLocaleTimeString());
        }
    });

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const getVehicleIcon = (type: string) => {
        switch (type) {
            case 'DRONE':
                return (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                );
            case 'TRUCK':
                return (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                );
            case 'SHIP':
                return (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/>
                    </svg>
                );
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IDLE': return 'bg-green-500';
            case 'IN_TRANSIT': return 'bg-cyan-500 animate-pulse';
            case 'ASSIGNED': return 'bg-yellow-500';
            case 'MAINTENANCE': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Convert lat/lng to map position (simplified world map projection)
    const getMapPosition = (lat: number | null, lng: number | null) => {
        if (lat === null || lng === null) return { x: 50, y: 50 };
        const x = ((lng + 180) / 360) * 100;
        const y = ((90 - lat) / 180) * 100;
        return { x, y };
    };

    return (
        <div className="min-h-screen p-8 pt-24">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">System Administration</h1>
                            <p className="text-gray-400">Global Fleet Overview</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                <span className="text-xs text-gray-400 font-mono">
                                    {isConnected ? 'REALTIME CONNECTED' : 'RECONNECTING...'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                                Last Update: {lastUpdateTime}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <div className="glass-card p-6 rounded-xl">
                        <p className="text-sm text-gray-400 mb-1">TOTAL SHIPMENTS</p>
                        <p className="text-3xl font-bold text-white">{stats ? stats.totalShipments : '...'}</p>
                        <p className="text-xs text-green-400 mt-2">Live Data</p>
                    </div>
                    <div className="glass-card p-6 rounded-xl">
                        <p className="text-sm text-gray-400 mb-1">ACTIVE DRONES</p>
                        <p className="text-3xl font-bold text-cyan-400">{stats ? stats.activeDrones : '...'}</p>
                        <p className="text-xs text-gray-500 mt-2">Operational</p>
                    </div>
                    <div className="glass-card p-6 rounded-xl">
                        <p className="text-sm text-gray-400 mb-1">ACTIVE TRUCKS</p>
                        <p className="text-3xl font-bold text-orange-400">{stats ? stats.activeTrucks : '...'}</p>
                        <p className="text-xs text-gray-500 mt-2">Operational</p>
                    </div>
                    <div className="glass-card p-6 rounded-xl">
                        <p className="text-sm text-gray-400 mb-1">REVENUE</p>
                        <p className="text-3xl font-bold text-purple-400">${stats ? stats.revenue.toFixed(2) : '...'}</p>
                        <p className="text-xs text-green-400 mt-2">Total Generated</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Fleet Map */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-white/10 relative overflow-hidden">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                GLOBAL FLEET MAP
                            </h3>
                            <span className="text-xs text-gray-500 font-mono">REAL-TIME TRACKING</span>
                        </div>
                        
                        <div className="relative h-[350px] bg-space-dark rounded-xl overflow-hidden border border-white/5">
                            {/* Grid lines */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:10%_10%]"></div>
                            
                            {/* Simplified world map outline */}
                            <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                                <path d="M20,30 Q30,25 40,30 T60,28 T80,32 L85,40 Q80,50 75,55 L70,60 Q65,70 60,75 L40,70 Q30,65 25,55 L20,45 Z" fill="none" stroke="#00D9FF" strokeWidth="0.3"/>
                                <path d="M55,35 Q60,30 70,35 T85,40 L90,50 Q85,60 80,65 L70,70 Q60,68 55,60 Z" fill="none" stroke="#00D9FF" strokeWidth="0.3"/>
                                <path d="M10,55 Q15,50 25,52 T35,58 L30,70 Q20,68 15,62 Z" fill="none" stroke="#00D9FF" strokeWidth="0.3"/>
                            </svg>
                            
                            {/* Vehicle markers */}
                            {vehicles.map((vehicle, index) => {
                                const pos = getMapPosition(vehicle.latitude, vehicle.longitude);
                                return (
                                    <motion.div
                                        key={vehicle.id}
                                        initial={{ scale: 0, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                                            selectedVehicle?.id === vehicle.id ? 'z-20' : 'z-10'
                                        }`}
                                        style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
                                        onClick={() => setSelectedVehicle(vehicle)}
                                    >
                                        <div className={`relative ${selectedVehicle?.id === vehicle.id ? 'scale-125' : ''} transition-transform`}>
                                            {/* Pulse ring */}
                                            <div className={`absolute inset-0 w-10 h-10 -m-2 rounded-full ${getStatusColor(vehicle.status)} opacity-30 animate-ping`}></div>
                                            
                                            {/* Vehicle icon */}
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                vehicle.type === 'DRONE' ? 'bg-cyan-500 text-black' :
                                                vehicle.type === 'TRUCK' ? 'bg-orange-500 text-black' :
                                                'bg-blue-500 text-black'
                                            }`}>
                                                {getVehicleIcon(vehicle.type)}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                            
                            {/* No vehicles message */}
                            {vehicles.length === 0 && (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                                    No vehicles registered
                                </div>
                            )}
                        </div>
                        
                        {/* Legend */}
                        <div className="flex gap-6 mt-4 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
                                <span className="text-gray-400">Drone</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                                <span className="text-gray-400">Truck</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                <span className="text-gray-400">Ship</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Vehicle Details / Recent Activity */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Selected Vehicle Panel */}
                        {selectedVehicle ? (
                            <div className="glass-panel p-6 rounded-2xl border border-cyan-500/30">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-lg font-bold text-white">VEHICLE DETAILS</h3>
                                    <button 
                                        onClick={() => setSelectedVehicle(null)}
                                        className="text-gray-500 hover:text-white"
                                    >✕</button>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">ID</span>
                                        <span className="text-cyan-400 font-mono">{selectedVehicle.licenseId}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Type</span>
                                        <span className="text-white">{selectedVehicle.type}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Status</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                            selectedVehicle.status === 'IDLE' ? 'bg-green-500/20 text-green-400' :
                                            selectedVehicle.status === 'IN_TRANSIT' ? 'bg-cyan-500/20 text-cyan-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>{selectedVehicle.status}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Fuel</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${selectedVehicle.currentFuel > 50 ? 'bg-green-500' : selectedVehicle.currentFuel > 20 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${selectedVehicle.currentFuel}%` }}
                                                ></div>
                                            </div>
                                            <span className="text-white">{selectedVehicle.currentFuel}%</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Position</span>
                                        <span className="text-white font-mono text-xs">
                                            {selectedVehicle.latitude?.toFixed(4)}, {selectedVehicle.longitude?.toFixed(4)}
                                        </span>
                                    </div>
                                    {selectedVehicle.currentShipment && (
                                        <div className="mt-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                                            <p className="text-xs text-cyan-400 mb-1">ACTIVE SHIPMENT</p>
                                            <p className="text-white font-mono">{selectedVehicle.currentShipment.trackingId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel p-6 rounded-2xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-4">FLEET STATUS</h3>
                                <div className="space-y-3">
                                    {vehicles.map(v => (
                                        <div 
                                            key={v.id} 
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                            onClick={() => setSelectedVehicle(v)}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(v.status)}`}></div>
                                            <span className="text-white font-mono text-sm">{v.licenseId}</span>
                                            <span className="text-gray-500 text-xs">{v.type}</span>
                                        </div>
                                    ))}
                                    {vehicles.length === 0 && (
                                        <p className="text-gray-500 text-sm">No vehicles in fleet</p>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Recent Shipments */}
                        <div className="glass-panel p-6 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">RECENT SHIPMENTS</h3>
                            <div className="space-y-3 max-h-[200px] overflow-y-auto">
                                {recentShipments.map(s => (
                                    <div key={s.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5">
                                        <div>
                                            <p className="text-white font-mono text-sm">{s.trackingId}</p>
                                            <p className="text-gray-500 text-xs">{s.customer.name}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                            s.status === 'DELIVERED' ? 'bg-green-500/20 text-green-400' :
                                            s.status === 'IN_TRANSIT' ? 'bg-cyan-500/20 text-cyan-400' :
                                            s.status === 'ASSIGNED' ? 'bg-yellow-500/20 text-yellow-400' :
                                            'bg-gray-500/20 text-gray-400'
                                        }`}>{s.status}</span>
                                    </div>
                                ))}
                                {recentShipments.length === 0 && (
                                    <p className="text-gray-500 text-sm">No shipments yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
