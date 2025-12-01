'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { useRealtime } from '@/hooks/useRealtime';

// Dynamically import FleetMap to avoid SSR issues with Leaflet
const FleetMap = dynamic(() => import('@/components/FleetMap'), {
    ssr: false,
    loading: () => (
        <div className="h-[400px] bg-space-dark rounded-xl flex items-center justify-center">
            <div className="text-cyan-400 animate-pulse">Loading Map...</div>
        </div>
    )
});

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
    weight: number;
    cost: number | null;
    createdAt: string;
    customer: { name: string };
    originCity?: string;
    destCity?: string;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [lastUpdateTime, setLastUpdateTime] = useState<string>('--:--:--');
    const [isMounted, setIsMounted] = useState(false);
    const [isSimulating, setIsSimulating] = useState(false);
    const simulationIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        onShipmentUpdate: (event) => {
            setRecentShipments(prev => prev.map(s => 
                s.id === event.data.id ? { ...s, ...event.data } : s
            ));
            setLastUpdateTime(new Date().toLocaleTimeString());
        },
        onVehicleUpdate: (event) => {
            setVehicles(prev => prev.map(v => 
                v.id === event.data.id ? { ...v, ...event.data } : v
            ));
            if (selectedVehicle?.id === event.data.id) {
                setSelectedVehicle(prev => prev ? { ...prev, ...event.data } : null);
            }
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

    // Simulation controls
    const runSimulationStep = async () => {
        try {
            await fetch('/api/simulation', { method: 'POST' });
        } catch (error) {
            console.error('Simulation step failed:', error);
        }
    };

    const toggleSimulation = () => {
        if (isSimulating) {
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
                simulationIntervalRef.current = null;
            }
            setIsSimulating(false);
        } else {
            setIsSimulating(true);
            runSimulationStep();
            simulationIntervalRef.current = setInterval(runSimulationStep, 2000);
        }
    };

    useEffect(() => {
        return () => {
            if (simulationIntervalRef.current) {
                clearInterval(simulationIntervalRef.current);
            }
        };
    }, []);

    const getVehicleIcon = (type: string) => {
        switch (type) {
            case 'DRONE':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                    </svg>
                );
            case 'TRUCK':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                );
            case 'SHIP':
                return (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2z"/>
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

    const getShipmentStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'PENDING': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
            'ASSIGNED': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
            'IN_TRANSIT': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
            'DELIVERED': 'bg-green-500/20 text-green-400 border-green-500/30',
            'CANCELLED': 'bg-red-500/20 text-red-400 border-red-500/30',
        };
        return styles[status] || styles['PENDING'];
    };

    return (
        <div className="min-h-screen p-8 pt-24">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Fleet Command Center</h1>
                            <p className="text-gray-400">Real-time global logistics monitoring</p>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                <span className="text-xs text-gray-400 font-mono">
                                    {isConnected ? 'LIVE' : 'OFFLINE'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                                Updated: {lastUpdateTime}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-4 rounded-xl"
                    >
                        <p className="text-xs text-gray-400 mb-1">SHIPMENTS</p>
                        <p className="text-2xl font-bold text-white">{stats?.totalShipments ?? '...'}</p>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-4 rounded-xl"
                    >
                        <p className="text-xs text-gray-400 mb-1">ACTIVE</p>
                        <p className="text-2xl font-bold text-cyan-400">
                            {vehicles.filter(v => v.status === 'IN_TRANSIT').length}
                        </p>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-4 rounded-xl"
                    >
                        <p className="text-xs text-gray-400 mb-1">FLEET SIZE</p>
                        <p className="text-2xl font-bold text-orange-400">{vehicles.length}</p>
                    </motion.div>
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass-card p-4 rounded-xl"
                    >
                        <p className="text-xs text-gray-400 mb-1">REVENUE</p>
                        <p className="text-2xl font-bold text-green-400">
                            ${stats?.revenue?.toFixed(0) ?? '...'}
                        </p>
                    </motion.div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Map Section */}
                    <div className="lg:col-span-2 glass-panel rounded-2xl border border-white/10 overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                <h3 className="text-lg font-bold text-white">LIVE FLEET MAP</h3>
                            </div>
                            <div className="flex items-center gap-3">
                                {/* Simulation Controls */}
                                <button
                                    onClick={toggleSimulation}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 transition-all ${
                                        isSimulating 
                                            ? 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30' 
                                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                                    }`}
                                >
                                    {isSimulating ? (
                                        <>
                                            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                            STOP SIM
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z"/>
                                            </svg>
                                            START SIM
                                        </>
                                    )}
                                </button>
                                <span className="text-xs text-gray-500 font-mono">
                                    {vehicles.filter(v => v.status === 'IN_TRANSIT').length} IN TRANSIT
                                </span>
                            </div>
                        </div>
                        
                        <FleetMap
                            vehicles={vehicles}
                            selectedVehicle={selectedVehicle}
                            onVehicleSelect={setSelectedVehicle}
                            className="h-[400px]"
                        />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Vehicle Details or Fleet List */}
                        {selectedVehicle ? (
                            <motion.div 
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="glass-panel p-5 rounded-2xl border border-cyan-500/30"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                            selectedVehicle.type === 'DRONE' ? 'bg-cyan-500/20 text-cyan-400' :
                                            selectedVehicle.type === 'TRUCK' ? 'bg-orange-500/20 text-orange-400' :
                                            'bg-blue-500/20 text-blue-400'
                                        }`}>
                                            {getVehicleIcon(selectedVehicle.type)}
                                        </div>
                                        <div>
                                            <p className="text-white font-mono font-bold">{selectedVehicle.licenseId}</p>
                                            <p className="text-xs text-gray-400">{selectedVehicle.type}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setSelectedVehicle(null)}
                                        className="text-gray-500 hover:text-white transition-colors"
                                    >✕</button>
                                </div>
                                
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Status</span>
                                        <span className={`px-2 py-0.5 rounded text-xs ${
                                            selectedVehicle.status === 'IDLE' ? 'bg-green-500/20 text-green-400' :
                                            selectedVehicle.status === 'IN_TRANSIT' ? 'bg-cyan-500/20 text-cyan-400' :
                                            'bg-yellow-500/20 text-yellow-400'
                                        }`}>{selectedVehicle.status}</span>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Fuel Level</span>
                                        <div className="flex items-center gap-2">
                                            <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                                                <motion.div 
                                                    className={`h-full ${
                                                        selectedVehicle.currentFuel > 50 ? 'bg-green-500' : 
                                                        selectedVehicle.currentFuel > 20 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${selectedVehicle.currentFuel}%` }}
                                                    transition={{ duration: 0.5 }}
                                                />
                                            </div>
                                            <span className="text-white font-mono text-xs w-10 text-right">
                                                {selectedVehicle.currentFuel.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Position</span>
                                        <span className="text-white font-mono text-xs">
                                            {selectedVehicle.latitude?.toFixed(4)}, {selectedVehicle.longitude?.toFixed(4)}
                                        </span>
                                    </div>
                                    
                                    {selectedVehicle.currentShipment && (
                                        <div className="mt-4 p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                                            <p className="text-xs text-cyan-400 mb-2 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></span>
                                                ACTIVE DELIVERY
                                            </p>
                                            <p className="text-white font-mono text-sm">{selectedVehicle.currentShipment.trackingId}</p>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="glass-panel p-5 rounded-2xl border border-white/10">
                                <h3 className="text-lg font-bold text-white mb-4">FLEET STATUS</h3>
                                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                                    {vehicles.map(v => (
                                        <motion.div 
                                            key={v.id}
                                            whileHover={{ scale: 1.02 }}
                                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                                            onClick={() => setSelectedVehicle(v)}
                                        >
                                            <div className={`w-2 h-2 rounded-full ${getStatusColor(v.status)}`}></div>
                                            <div className={`w-8 h-8 rounded flex items-center justify-center ${
                                                v.type === 'DRONE' ? 'bg-cyan-500/20 text-cyan-400' :
                                                v.type === 'TRUCK' ? 'bg-orange-500/20 text-orange-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {getVehicleIcon(v.type)}
                                            </div>
                                            <div className="flex-1">
                                                <span className="text-white font-mono text-sm">{v.licenseId}</span>
                                                <p className="text-gray-500 text-xs">{v.status}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                    {vehicles.length === 0 && (
                                        <p className="text-gray-500 text-sm text-center py-4">No vehicles in fleet</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Recent Shipments */}
                        <div className="glass-panel p-5 rounded-2xl border border-white/10">
                            <h3 className="text-lg font-bold text-white mb-4">RECENT SHIPMENTS</h3>
                            <div className="space-y-2 max-h-[250px] overflow-y-auto">
                                {recentShipments.map(s => (
                                    <motion.div 
                                        key={s.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white font-mono text-sm truncate">{s.trackingId}</p>
                                            <p className="text-gray-500 text-xs truncate">{s.customer.name}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs border ${getShipmentStatusBadge(s.status)}`}>
                                            {s.status}
                                        </span>
                                    </motion.div>
                                ))}
                                {recentShipments.length === 0 && (
                                    <p className="text-gray-500 text-sm text-center py-4">No shipments yet</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
