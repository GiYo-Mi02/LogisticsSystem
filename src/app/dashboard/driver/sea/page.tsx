'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRealtime } from '@/hooks/useRealtime';
import Stars from '@/components/Stars';

interface Customer {
    id: string;
    name: string;
    email: string;
}

interface Vehicle {
    id: string;
    licenseId: string;
    type: string;
    capacity: number;
    currentFuel: number;
    status: string;
    latitude?: number;
    longitude?: number;
}

interface Shipment {
    id: string;
    trackingId: string;
    status: string;
    weight: number;
    originAddress?: string;
    originCity?: string;
    originCountry?: string;
    originLat: number;
    originLng: number;
    destAddress?: string;
    destCity?: string;
    destCountry?: string;
    destLat: number;
    destLng: number;
    cost: number | null;
    customer?: Customer;
    driver?: { id: string; name: string };
    vehicle?: Vehicle;
    createdAt: string;
}

interface Stats {
    total: number;
    pending: number;
    inTransit: number;
    delivered: number;
    assigned: number;
    totalWeight: number;
    totalRevenue: number;
}

export default function SeaDriverDashboard() {
    const [driver, setDriver] = useState<any>(null);
    const [vehicle, setVehicle] = useState<Vehicle | null>(null);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [currentAssignment, setCurrentAssignment] = useState<Shipment | null>(null);
    const [availableShips, setAvailableShips] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [statusFilter, setStatusFilter] = useState<string>('all');

    const fetchData = useCallback(async () => {
        try {
            // 1. Get Ship Captain (separate from regular driver)
            const userRes = await fetch('/api/users/first-captain');
            const userData = await userRes.json();

            if (userData.driver) {
                setDriver(userData.driver);

                // 2. Get Sea Deliveries
                const seaRes = await fetch(`/api/driver/sea-deliveries?driverId=${userData.driver.id}`);
                const seaData = await seaRes.json();

                setShipments(seaData.shipments || []);
                setStats(seaData.stats);
                setAvailableShips(seaData.availableShipVehicles || []);
                setVehicle(seaData.driverVehicle);

                // Find current assignment from driver's assigned jobs
                const activeAssignment = seaData.driverAssignments?.find(
                    (s: Shipment) => s.status === 'IN_TRANSIT' || s.status === 'ASSIGNED'
                );
                setCurrentAssignment(activeAssignment || null);

                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Failed to load sea driver dashboard', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Real-time connection
    const { isConnected } = useRealtime({
        onShipmentUpdate: (event) => {
            if (currentAssignment?.id === event.data.id) {
                setCurrentAssignment(prev => prev ? { ...prev, ...event.data } : null);
            }
            setShipments(prev => prev.map(s =>
                s.id === event.data.id ? { ...s, ...event.data } : s
            ));
            setLastUpdate(new Date());
        },
        onNewShipment: () => fetchData(),
        onAssignmentUpdate: (event) => {
            if (event.data.driverId !== driver?.id) {
                fetchData();
            }
        },
        onVehicleUpdate: (event) => {
            if (vehicle?.id === event.data.id) {
                setVehicle(prev => prev ? { ...prev, ...event.data } : null);
            }
            setLastUpdate(new Date());
        }
    });

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const acceptJob = async (shipmentId: string) => {
        if (!driver) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/driver/sea-deliveries', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId: driver.id, shipmentId })
            });
            const data = await res.json();
            if (data.success) {
                await fetchData();
            } else {
                alert(data.error || 'Failed to accept job');
            }
        } catch (error) {
            console.error('Failed to accept job', error);
        } finally {
            setActionLoading(false);
        }
    };

    const markDelivered = async () => {
        if (!currentAssignment || !driver) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/driver/sea-deliveries', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    shipmentId: currentAssignment.id,
                    driverId: driver.id,
                    action: 'deliver'
                })
            });
            const data = await res.json();
            if (data.success) {
                await fetchData();
            }
        } catch (error) {
            console.error('Failed to mark delivered', error);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredShipments = shipments.filter(s => {
        if (statusFilter === 'all') return true;
        return s.status === statusFilter;
    });

    const availableJobs = shipments.filter(s =>
        s.status === 'PENDING' && !s.driver
    );

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-blue-900/50 to-slate-900">
            <Stars />
            <div className="text-center relative z-10">
                <div className="w-16 h-16 border-4 border-t-blue-400 border-r-transparent border-b-blue-400 border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-blue-400 font-mono text-lg">Initializing Maritime Command...</p>
                <p className="text-blue-300/50 text-sm mt-2">Loading sea delivery data</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-blue-900/50 to-slate-900 p-8 pt-24 relative">
            <Stars />
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15l4-8 4 8M5 13h4m6-3v8m-2-4h4m-2-4v.01M3 21h18M3 3h18" />
                                </svg>
                                <div>
                                    <h1 className="text-4xl font-bold text-white">Maritime Command</h1>
                                    <p className="text-blue-400 font-mono">Sea & Ship Deliveries Dashboard</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 text-gray-400 mt-4">
                                <span>Captain: <span className="text-white">{driver?.name}</span></span>
                                <span>|</span>
                                <span>Vessel: <span className={vehicle?.type === 'SHIP' ? 'text-blue-400' : 'text-yellow-400'}>
                                    {vehicle ? `${vehicle.licenseId} (${vehicle.type})` : 'NOT ASSIGNED'}
                                </span></span>
                                <span>|</span>
                                <span>Status: <span className={vehicle?.status === 'IN_TRANSIT' ? 'text-cyan-400' : 'text-green-400'}>
                                    {vehicle?.status || 'DOCKED'}
                                </span></span>
                                <span>|</span>
                                <span>Fuel: <span className="text-blue-400">{vehicle?.currentFuel || 0}%</span></span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                <span className="text-xs text-gray-400 font-mono">
                                    {isConnected ? 'SATELLITE LINK ACTIVE' : 'RECONNECTING...'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                                Last Sync: {lastUpdate.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-800/50 backdrop-blur border border-blue-500/20 rounded-xl p-4"
                        >
                            <p className="text-xs text-gray-400 uppercase">Total Shipments</p>
                            <p className="text-2xl font-bold text-white">{stats.total}</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-yellow-500/10 backdrop-blur border border-yellow-500/20 rounded-xl p-4"
                        >
                            <p className="text-xs text-yellow-400 uppercase">Pending</p>
                            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-blue-500/10 backdrop-blur border border-blue-500/20 rounded-xl p-4"
                        >
                            <p className="text-xs text-blue-400 uppercase">In Transit</p>
                            <p className="text-2xl font-bold text-blue-400">{stats.inTransit}</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="bg-green-500/10 backdrop-blur border border-green-500/20 rounded-xl p-4"
                        >
                            <p className="text-xs text-green-400 uppercase">Delivered</p>
                            <p className="text-2xl font-bold text-green-400">{stats.delivered}</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="bg-purple-500/10 backdrop-blur border border-purple-500/20 rounded-xl p-4"
                        >
                            <p className="text-xs text-purple-400 uppercase">Assigned</p>
                            <p className="text-2xl font-bold text-purple-400">{stats.assigned}</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                            className="bg-cyan-500/10 backdrop-blur border border-cyan-500/20 rounded-xl p-4"
                        >
                            <p className="text-xs text-cyan-400 uppercase">Total Weight</p>
                            <p className="text-2xl font-bold text-cyan-400">{(stats.totalWeight / 1000).toFixed(1)}t</p>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.6 }}
                            className="bg-emerald-500/10 backdrop-blur border border-emerald-500/20 rounded-xl p-4"
                        >
                            <p className="text-xs text-emerald-400 uppercase">Revenue</p>
                            <p className="text-2xl font-bold text-emerald-400">${stats.totalRevenue.toFixed(0)}</p>
                        </motion.div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Current Assignment */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            CURRENT VOYAGE
                        </h3>

                        {currentAssignment ? (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-800/50 backdrop-blur p-8 rounded-2xl border-l-4 border-blue-400"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white">{currentAssignment.trackingId}</h2>
                                        <p className="text-blue-400 font-mono">STATUS: {currentAssignment.status}</p>
                                        {currentAssignment.customer && (
                                            <p className="text-gray-400 text-sm mt-1">Shipper: {currentAssignment.customer.name}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">CARGO WEIGHT</p>
                                        <p className="text-2xl font-mono text-white">{currentAssignment.weight} kg</p>
                                        {currentAssignment.cost && (
                                            <p className="text-green-400 font-mono">${currentAssignment.cost.toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                        <p className="text-xs text-blue-400 mb-1 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                            PORT OF ORIGIN
                                        </p>
                                        {currentAssignment.originCity && (
                                            <p className="text-lg text-white font-semibold">{currentAssignment.originCity}</p>
                                        )}
                                        {currentAssignment.originCountry && (
                                            <p className="text-sm text-gray-400">{currentAssignment.originCountry}</p>
                                        )}
                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                            {currentAssignment.originLat.toFixed(4)}°, {currentAssignment.originLng.toFixed(4)}°
                                        </p>
                                    </div>
                                    <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                        <p className="text-xs text-orange-400 mb-1 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            DESTINATION PORT
                                        </p>
                                        {currentAssignment.destCity && (
                                            <p className="text-lg text-white font-semibold">{currentAssignment.destCity}</p>
                                        )}
                                        {currentAssignment.destCountry && (
                                            <p className="text-sm text-gray-400">{currentAssignment.destCountry}</p>
                                        )}
                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                            {currentAssignment.destLat.toFixed(4)}°, {currentAssignment.destLng.toFixed(4)}°
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        disabled={actionLoading}
                                        className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-green-800 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        onClick={markDelivered}
                                    >
                                        {actionLoading ? (
                                            <span className="animate-pulse">Processing...</span>
                                        ) : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                                CARGO DELIVERED
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center h-64 text-center">
                                <svg className="w-16 h-16 text-blue-600/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M3 15l4-8 4 8M5 13h4m6-3v8m-2-4h4m-2-4v.01M3 21h18M3 3h18" />
                                </svg>
                                <p className="text-gray-400 text-lg">Vessel Docked - No Active Voyage</p>
                                <p className="text-gray-600 text-sm mt-2">Accept a shipping job to begin your voyage</p>
                            </div>
                        )}
                    </div>

                    {/* Available Jobs */}
                    <div className="lg:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            AVAILABLE CARGO
                            {availableJobs.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                    {availableJobs.length}
                                </span>
                            )}
                        </h3>
                        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                            {availableJobs.length > 0 ? (
                                availableJobs.map((job, index) => (
                                    <motion.div
                                        key={job.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-slate-800/50 backdrop-blur p-4 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-white font-mono font-bold">{job.trackingId}</p>
                                                <p className="text-gray-500 text-xs">{job.customer?.name || 'Shipper'}</p>
                                            </div>
                                            <span className="px-2 py-0.5 rounded text-xs bg-yellow-500/20 text-yellow-400">
                                                {job.status}
                                            </span>
                                        </div>

                                        <div className="text-sm mb-3">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <span className="text-blue-400">{job.originCity || 'Origin'}</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                                <span className="text-orange-400">{job.destCity || 'Destination'}</span>
                                            </div>
                                            {job.originCountry !== job.destCountry && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {job.originCountry} → {job.destCountry}
                                                </p>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-gray-500 text-xs">Cargo: </span>
                                                <span className="text-white text-sm">{job.weight} kg</span>
                                                {job.cost && (
                                                    <span className="text-green-400 text-sm ml-3">${job.cost.toFixed(2)}</span>
                                                )}
                                            </div>
                                            <button
                                                disabled={actionLoading || !!currentAssignment}
                                                onClick={() => acceptJob(job.id)}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors"
                                            >
                                                {currentAssignment ? 'AT SEA' : 'ACCEPT'}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-blue-700/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p className="text-gray-500 text-sm">No pending cargo available</p>
                                    <p className="text-gray-600 text-xs mt-1">Check back for new shipments</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* All Sea Shipments Table */}
                <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            ALL SEA SHIPMENTS
                        </h3>
                        <div className="flex gap-2">
                            {['all', 'PENDING', 'IN_TRANSIT', 'DELIVERED', 'ASSIGNED'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${statusFilter === status
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                                        }`}
                                >
                                    {status === 'all' ? 'All' : status.replace('_', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-800/50 backdrop-blur rounded-xl border border-blue-500/20 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="bg-slate-900/50">
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tracking ID</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Origin</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Destination</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Weight</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cost</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Driver</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {filteredShipments.length > 0 ? (
                                        filteredShipments.map((shipment) => (
                                            <tr key={shipment.id} className="hover:bg-slate-700/30 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="text-white font-mono text-sm">{shipment.trackingId}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="text-white text-sm">{shipment.originCity || 'N/A'}</p>
                                                        <p className="text-gray-500 text-xs">{shipment.originCountry || ''}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="text-white text-sm">{shipment.destCity || 'N/A'}</p>
                                                        <p className="text-gray-500 text-xs">{shipment.destCountry || ''}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-cyan-400 text-sm">{shipment.weight} kg</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-green-400 text-sm">
                                                        {shipment.cost ? `$${shipment.cost.toFixed(2)}` : '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${shipment.status === 'DELIVERED' ? 'bg-green-500/20 text-green-400' :
                                                        shipment.status === 'IN_TRANSIT' ? 'bg-blue-500/20 text-blue-400' :
                                                            shipment.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                                'bg-purple-500/20 text-purple-400'
                                                        }`}>
                                                        {shipment.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-gray-300 text-sm">{shipment.customer?.name || '-'}</span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className="text-gray-300 text-sm">{shipment.driver?.name || '-'}</span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                                                No sea shipments found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Available Ships */}
                {availableShips.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15l4-8 4 8M5 13h4m6-3v8m-2-4h4m-2-4v.01M3 21h18M3 3h18" />
                            </svg>
                            AVAILABLE VESSELS
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {availableShips.map((ship) => (
                                <div key={ship.id} className="bg-slate-800/50 backdrop-blur p-4 rounded-xl border border-blue-500/20">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-white font-mono">{ship.licenseId}</p>
                                        <span className="px-2 py-0.5 rounded text-xs bg-green-500/20 text-green-400">
                                            {ship.status}
                                        </span>
                                    </div>
                                    <p className="text-gray-400 text-sm">Capacity: {ship.capacity} kg</p>
                                    <p className="text-gray-400 text-sm">Fuel: {ship.currentFuel}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
