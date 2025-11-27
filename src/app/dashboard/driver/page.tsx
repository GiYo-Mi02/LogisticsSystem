'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useRealtime } from '@/hooks/useRealtime';

interface Shipment {
    id: string;
    trackingId: string;
    status: string;
    weight: number;
    originLat: number;
    originLng: number;
    destLat: number;
    destLng: number;
    cost: number | null;
    customer?: { name: string };
}

export default function DriverDashboard() {
    const [driver, setDriver] = useState<any>(null);
    const [vehicle, setVehicle] = useState<any>(null);
    const [assignment, setAssignment] = useState<Shipment | null>(null);
    const [availableJobs, setAvailableJobs] = useState<Shipment[]>([]);
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
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-t-cyan-400 border-r-transparent border-b-cyan-400 border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-cyan-400 font-mono">Initializing Driver Interface...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen p-8 pt-24">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-white mb-2">Driver Command</h1>
                            <div className="flex flex-wrap gap-4 text-gray-400">
                                <span>Operator: <span className="text-white">{driver?.name}</span></span>
                                <span>|</span>
                                <span>Vehicle: <span className={vehicle ? 'text-green-400' : 'text-red-400'}>{vehicle ? vehicle.licenseId : 'NOT ASSIGNED'}</span></span>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Current Job */}
                    <div className="lg:col-span-2">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full animate-pulse ${assignment ? 'bg-green-400' : 'bg-gray-600'}`}></span>
                            CURRENT ASSIGNMENT
                        </h3>
                        
                        {assignment ? (
                            <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="glass-panel p-8 rounded-2xl border-l-4 border-cyan-400"
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
                                        <p className="text-sm text-gray-400">WEIGHT</p>
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
                                        <p className="text-lg text-white font-mono">{assignment.originLat.toFixed(4)}°</p>
                                        <p className="text-lg text-white font-mono">{assignment.originLng.toFixed(4)}°</p>
                                    </div>
                                    <div className="p-4 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                        <p className="text-xs text-orange-400 mb-1 flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                                            DROP-OFF LOCATION
                                        </p>
                                        <p className="text-lg text-white font-mono">{assignment.destLat.toFixed(4)}°</p>
                                        <p className="text-lg text-white font-mono">{assignment.destLng.toFixed(4)}°</p>
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
                            <div className="glass-panel p-8 rounded-2xl border border-white/10 flex flex-col items-center justify-center h-64 text-center">
                                <svg className="w-16 h-16 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                                </svg>
                                <p className="text-gray-500 text-lg">No active assignment</p>
                                <p className="text-gray-600 text-sm mt-2">Accept a job from the available list to begin</p>
                            </div>
                        )}
                    </div>

                    {/* Available Jobs */}
                    <div className="lg:col-span-1">
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
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
                                        className="glass-card p-4 rounded-xl border border-white/10 hover:border-cyan-500/30 transition-colors"
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
                                        
                                        <div className="flex items-center gap-2 text-sm mb-3">
                                            <div className="flex-1">
                                                <p className="text-gray-500 text-xs">FROM</p>
                                                <p className="text-gray-300 font-mono text-xs">{job.originLat.toFixed(2)}, {job.originLng.toFixed(2)}</p>
                                            </div>
                                            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                                            </svg>
                                            <div className="flex-1 text-right">
                                                <p className="text-gray-500 text-xs">TO</p>
                                                <p className="text-gray-300 font-mono text-xs">{job.destLat.toFixed(2)}, {job.destLng.toFixed(2)}</p>
                                            </div>
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
                                    <svg className="w-12 h-12 text-gray-700 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
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
