'use client';

import { useEffect, useState, useCallback } from 'react';
import CreateShipmentForm from '@/components/CreateShipmentForm';
import ShipmentCard from '@/components/ShipmentCard';
import { useRealtime } from '@/hooks/useRealtime';

export default function CustomerDashboard() {
    const [shipments, setShipments] = useState<any[]>([]);
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState<string>('');
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    useEffect(() => {
        // Set time on client only to avoid hydration mismatch
        setCurrentTime(new Date().toLocaleTimeString());
        const interval = setInterval(() => {
            setCurrentTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const refreshShipments = useCallback(async () => {
        if (!customerId) return;
        try {
            const shipRes = await fetch(`/api/shipments?customerId=${customerId}`);
            if (!shipRes.ok) {
                console.error('Failed to fetch shipments:', shipRes.status);
                return;
            }
            const shipData = await shipRes.json();
            if (shipData.shipments) {
                setShipments(shipData.shipments);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Failed to refresh shipments', error);
        }
    }, [customerId]);

    // Real-time connection
    const { isConnected } = useRealtime({
        onShipmentUpdate: (event) => {
            // Update shipment in real-time if it belongs to this customer
            setShipments(prev => prev.map(s => 
                s.id === event.data.id ? { ...s, ...event.data } : s
            ));
            setLastUpdate(new Date());
        },
        onNewShipment: (event) => {
            // Add new shipment if it belongs to this customer
            if (event.data.customerId === customerId) {
                setShipments(prev => [event.data, ...prev]);
                setLastUpdate(new Date());
            }
        },
        onAssignmentUpdate: () => refreshShipments(),
    });

    useEffect(() => {
        const init = async () => {
            try {
                // 1. Get Demo Customer
                const userRes = await fetch('/api/users/first-customer');
                if (!userRes.ok) {
                    console.error('Failed to fetch customer:', userRes.status);
                    setLoading(false);
                    return;
                }
                const userData = await userRes.json();
                if (userData.customer) {
                    setCustomerId(userData.customer.id);
                    
                    // 2. Get Shipments
                    const shipRes = await fetch(`/api/shipments?customerId=${userData.customer.id}`);
                    if (shipRes.ok) {
                        const shipData = await shipRes.json();
                        if (shipData.shipments) {
                            setShipments(shipData.shipments);
                            setLastUpdate(new Date());
                        }
                    }
                }
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, []);

    return (
        <div className="min-h-screen p-8 pt-24">
            <div className="max-w-7xl mx-auto">
                <header className="mb-12 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Mission Control</h1>
                        <p className="text-gray-400">Welcome back, Commander. Fleet status is nominal.</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <div className="flex items-center justify-end gap-2 mb-1">
                            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                            <span className="text-xs text-gray-500 font-mono">
                                {isConnected ? 'LIVE' : 'OFFLINE'}
                            </span>
                        </div>
                        <p className="text-xs text-cyan-400 font-mono">SYSTEM TIME</p>
                        <p className="text-xl font-mono text-white">{currentTime || '--:--:--'}</p>
                        {lastUpdate && (
                            <p className="text-xs text-gray-600 font-mono mt-1">
                                Updated: {lastUpdate.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Create Shipment */}
                    <div className="lg:col-span-1">
                        {customerId ? (
                            <CreateShipmentForm customerId={customerId} onSuccess={refreshShipments} />
                        ) : (
                            <div className="glass-panel p-6 rounded-2xl text-center text-gray-400">
                                Loading User Profile...
                            </div>
                        )}
                    </div>

                    {/* Right Column: Active Shipments */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 7m0 13V7m0 0L9.553 4.553A1 1 0 0115 3.618v3.276z"></path></svg>
                                ACTIVE MISSIONS
                            </h3>
                            <button className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors">VIEW ALL HISTORY</button>
                        </div>

                        {loading ? (
                            <div className="text-center text-cyan-400 animate-pulse">Scanning Sector...</div>
                        ) : shipments.length === 0 ? (
                            <div className="text-center text-gray-500 py-12 glass-panel rounded-xl">No active missions found. Initiate a new shipment.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {shipments.map((shipment) => {
                                    // Format location display - prefer city names, fallback to coordinates
                                    const originDisplay = shipment.origin.city && shipment.origin.country
                                        ? `${shipment.origin.city}, ${shipment.origin.country}`
                                        : `${shipment.origin.lat.toFixed(2)}, ${shipment.origin.lng.toFixed(2)}`;
                                    const destDisplay = shipment.destination.city && shipment.destination.country
                                        ? `${shipment.destination.city}, ${shipment.destination.country}`
                                        : `${shipment.destination.lat.toFixed(2)}, ${shipment.destination.lng.toFixed(2)}`;
                                    
                                    return (
                                        <ShipmentCard
                                            key={shipment.trackingId}
                                            id={shipment.trackingId}
                                            status={shipment.status}
                                            origin={originDisplay}
                                            destination={destDisplay}
                                            vehicleType={shipment.assignedVehicle?.type}
                                            cost={shipment.cost}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
