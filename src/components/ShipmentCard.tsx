'use client';

import { motion } from 'framer-motion';

interface ShipmentCardProps {
    id: string;
    status: string;
    origin: string;
    destination: string;
    vehicleType?: string;
    cost?: number;
}

export default function ShipmentCard({ id, status, origin, destination, vehicleType, cost }: ShipmentCardProps) {
    const getStatusColor = (s: string) => {
        switch (s) {
            case 'PENDING': return 'text-yellow-400';
            case 'ASSIGNED': return 'text-blue-400';
            case 'IN_TRANSIT': return 'text-orange-400';
            case 'DELIVERED': return 'text-green-400';
            default: return 'text-gray-400';
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-6 rounded-xl border border-white/5 relative overflow-hidden group"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                {/* Icon based on vehicle type */}
                {vehicleType === 'DRONE' && <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>}
                {vehicleType === 'TRUCK' && <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 24 24"><path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" /></svg>}
            </div>

            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="text-xs font-mono text-gray-400 mb-1">TRACKING ID</h4>
                    <p className="text-lg font-bold text-white tracking-wider">{id}</p>
                </div>
                <div className={`text-xs font-bold px-2 py-1 rounded bg-white/5 ${getStatusColor(status)}`}>
                    {status}
                </div>
            </div>

            <div className="space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                    <p className="text-sm text-gray-300">{origin}</p>
                </div>
                <div className="w-0.5 h-4 bg-white/10 ml-1"></div>
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <p className="text-sm text-gray-300">{destination}</p>
                </div>
            </div>

            {cost && (
                <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
                    <span className="text-xs text-gray-400">ESTIMATED COST</span>
                    <span className="text-lg font-bold text-cyan-400">${cost.toFixed(2)}</span>
                </div>
            )}
        </motion.div>
    );
}
