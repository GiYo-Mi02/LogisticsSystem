'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRealtime } from '@/hooks/useRealtime';
import Link from 'next/link';

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
    customer?: { name: string };
}

interface Stats {
    total: number;
    pending: number;
    inTransit: number;
    delivered: number;
}

export default function DriverDashboard() {
    const [driver, setDriver] = useState<any>(null);
    const [vehicle, setVehicle] = useState<any>(null);
    const [assignment, setAssignment] = useState<Shipment | null>(null);
    const [availableJobs, setAvailableJobs] = useState<Shipment[]>([]);
    const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, inTransit: 0, delivered: 0 });
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

    const fetchData = useCallback(async () => {
        try {
            // 1. Get Demo Driver
            const userRes = await fetch('/api/users/first-driver');
            const userData = await userRes.json();
            
            if (userData.driver) {
                setDriver(userData.driver);
                
                // 2. Get Assignments
                const assignRes = await fetch(`/api/driver/assignment?driverId=${userData.driver.id}`);
                const assignData = await assignRes.json();
                
                setAssignment(assignData.currentAssignment);
                setAvailableJobs(assignData.availableJobs || []);
                setVehicle(assignData.vehicle || userData.driver.currentVehicle);
                
                // Calculate stats
                const jobs = assignData.availableJobs || [];
                setStats({
                    total: jobs.length + (assignData.currentAssignment ? 1 : 0),
                    pending: jobs.filter((j: Shipment) => j.status === 'PENDING').length,
                    inTransit: assignData.currentAssignment?.status === 'IN_TRANSIT' ? 1 : 0,
                    delivered: 0
                });
                
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Failed to load driver dashboard', error);
        } finally {
            setLoading(false);
        }
    }, []);

    // Real-time connection
    const { isConnected } = useRealtime({
        onShipmentUpdate: (event) => {
            // Update current assignment if it matches
            if (assignment?.id === event.data.id) {
                setAssignment(prev => prev ? { ...prev, ...event.data } : null);
            }
            // Update in available jobs list
            setAvailableJobs(prev => prev.map(j => 
                j.id === event.data.id ? { ...j, ...event.data } : j
            ));
            setLastUpdate(new Date());
        },
        onNewShipment: () => fetchData(), // New job available
        onAssignmentUpdate: (event) => {
            // Another driver took a job, refresh list
            if (event.data.driverId !== driver?.id) {
                fetchData();
            }
        },
        onVehicleUpdate: (event) => {
            if (vehicle?.id === event.data.id) {
                setVehicle((prev: any) => prev ? { ...prev, ...event.data } : null);
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
            const res = await fetch('/api/driver/assignment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ driverId: driver.id, shipmentId })
            });
            const data = await res.json();
            if (data.success) {
                await fetchData();
            }
        } catch (error) {
            console.error('Failed to accept job', error);
        } finally {
            setActionLoading(false);
        }
    };

    const markDelivered = async () => {
        if (!assignment || !driver) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/driver/assignment', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shipmentId: assignment.id, driverId: driver.id })
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

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 to-cyan-900">
            <div className="text-center">
                <div className="w-16 h-16 border-4 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-cyan-400 font-mono text-lg">Initializing Driver Command...</p>
                <p className="text-cyan-300/50 text-sm mt-2">Loading vehicle and assignment data</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-cyan-900/30 to-slate-900 p-8 pt-24">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <header className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <svg className="w-10 h-10 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                                <div>
                                    <h1 className="text-4xl font-bold text-white">Driver Command</h1>
                                    <p className="text-cyan-400 font-mono">Ground & Air Deliveries Control</p>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-4 text-gray-400 mt-4">
                                <span>Operator: <span className="text-white">{driver?.name}</span></span>
                                <span>|</span>
                                <span>Vehicle: <span className={vehicle ? 'text-cyan-400' : 'text-red-400'}>{vehicle ? `${vehicle.licenseId} (${vehicle.type})` : 'NOT ASSIGNED'}</span></span>
                                <span>|</span>
                                <span>Status: <span className={vehicle?.status === 'IN_TRANSIT' ? 'text-cyan-400' : 'text-green-400'}>{vehicle?.status || 'OFFLINE'}</span></span>
                                <span>|</span>
                                <span>Fuel: <span className="text-cyan-400">{vehicle?.currentFuel || 0}%</span></span>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                <span className="text-xs text-gray-400 font-mono">
                                    {isConnected ? 'REALTIME ACTIVE' : 'RECONNECTING...'}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-mono">
                                Last Sync: {lastUpdate.toLocaleTimeString()}
                            </p>
                        </div>
                    </div>
                </header>

                {/* Navigation to Maritime Command */}
                <div className="mb-8">
                    <Link href="/dashboard/driver/sea">
                        <motion.div
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 backdrop-blur border border-blue-500/30 rounded-xl p-4 flex items-center justify-between hover:border-blue-400/50 transition-all cursor-pointer"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                    <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 15l4-8 4 8M5 13h4m6-3v8m-2-4h4m-2-4v.01M3 21h18M3 3h18" />
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Maritime Command Center</h3>
                                    <p className="text-blue-300/70 text-sm">Access sea & ship deliveries dashboard</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-blue-400">
                                <span className="text-sm font-medium">Open Dashboard</span>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </motion.div>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-slate-800/50 backdrop-blur border border-cyan-500/20 rounded-xl p-4"
                    >
                        <p className="text-xs text-gray-400 uppercase">Total Jobs</p>
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
                        className="bg-cyan-500/10 backdrop-blur border border-cyan-500/20 rounded-xl p-4"
                    >
                        <p className="text-xs text-cyan-400 uppercase">In Transit</p>
                        <p className="text-2xl font-bold text-cyan-400">{stats.inTransit}</p>
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
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Current Job */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            CURRENT ASSIGNMENT
                        </h3>
                        
                        {assignment ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-800/50 backdrop-blur p-8 rounded-2xl border-l-4 border-cyan-400"
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div>
                                        <h2 className="text-3xl font-bold text-white">{assignment.trackingId}</h2>
                                        <p className="text-cyan-400 font-mono">STATUS: {assignment.status}</p>
                                        {assignment.customer && (
                                            <p className="text-gray-400 text-sm mt-1">Customer: {assignment.customer.name}</p>
                                        )}
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-gray-400">CARGO WEIGHT</p>
                                        <p className="text-2xl font-mono text-white">{assignment.weight} kg</p>
                                        {assignment.cost && (
                                            <p className="text-green-400 font-mono">${assignment.cost.toFixed(2)}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div className="p-4 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
                                        <p className="text-xs text-cyan-400 mb-1 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                                            PICKUP LOCATION
                                        </p>
                                        {assignment.originCity && (
                                            <p className="text-lg text-white font-semibold">{assignment.originCity}</p>
                                        )}
                                        {assignment.originCountry && (
                                            <p className="text-sm text-gray-400">{assignment.originCountry}</p>
                                        )}
                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                            {assignment.originLat.toFixed(4)}°, {assignment.originLng.toFixed(4)}°
                                        </p>
                                    </div>
                                    <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                        <p className="text-xs text-orange-400 mb-1 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            DROP-OFF LOCATION
                                        </p>
                                        {assignment.destCity && (
                                            <p className="text-lg text-white font-semibold">{assignment.destCity}</p>
                                        )}
                                        {assignment.destCountry && (
                                            <p className="text-sm text-gray-400">{assignment.destCountry}</p>
                                        )}
                                        <p className="text-xs text-gray-500 font-mono mt-1">
                                            {assignment.destLat.toFixed(4)}°, {assignment.destLng.toFixed(4)}°
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
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                                                </svg>
                                                MARK AS DELIVERED
                                            </>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-slate-800/50 backdrop-blur p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center h-64 text-center">
                                <svg className="w-16 h-16 text-cyan-600/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                </svg>
                                <p className="text-gray-400 text-lg">No Active Assignment</p>
                                <p className="text-gray-600 text-sm mt-2">Accept a job from the available list to begin</p>
                            </div>
                        )}
                    </div>

                    {/* Available Jobs */}
                    <div className="lg:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                            AVAILABLE JOBS
                            {availableJobs.length > 0 && (
                                <span className="ml-2 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                    {availableJobs.length}
                                </span>
                            )}
                        </h3>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                            {availableJobs.length > 0 ? (
                                availableJobs.map((job, index) => (
                                    <motion.div
                                        key={job.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className="bg-slate-800/50 backdrop-blur p-4 rounded-xl border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="text-white font-mono font-bold">{job.trackingId}</p>
                                                <p className="text-gray-500 text-xs">{job.customer?.name || 'Customer'}</p>
                                            </div>
                                            <span className={`px-2 py-0.5 rounded text-xs ${
                                                job.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>
                                                {job.status}
                                            </span>
                                        </div>
                                        
                                        <div className="text-sm mb-3">
                                            <div className="flex items-center gap-2 text-gray-400">
                                                <span className="text-cyan-400">{job.originCity || 'Origin'}</span>
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                                </svg>
                                                <span className="text-orange-400">{job.destCity || 'Destination'}</span>
                                            </div>
                                            {job.originCountry && job.destCountry && job.originCountry !== job.destCountry && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {job.originCountry} → {job.destCountry}
                                                </p>
                                            )}
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="text-gray-500 text-xs">Weight: </span>
                                                <span className="text-white text-sm">{job.weight} kg</span>
                                                {job.cost && (
                                                    <span className="text-green-400 text-sm ml-3">${job.cost.toFixed(2)}</span>
                                                )}
                                            </div>
                                            <button
                                                disabled={actionLoading || !!assignment}
                                                onClick={() => acceptJob(job.id)}
                                                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors"
                                            >
                                                {assignment ? 'BUSY' : 'ACCEPT'}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-cyan-700/50 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                    <p className="text-gray-500 text-sm">No pending jobs available</p>
                                    <p className="text-gray-600 text-xs mt-1">Check back soon for new shipments</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
