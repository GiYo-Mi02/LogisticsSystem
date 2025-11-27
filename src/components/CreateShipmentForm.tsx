'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';

export default function CreateShipmentForm({ customerId, onSuccess }: { customerId: string, onSuccess?: () => void }) {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customerId,
                    weight: parseFloat(data.weight),
                    origin: { lat: parseFloat(data.originLat), lng: parseFloat(data.originLng) },
                    destination: { lat: parseFloat(data.destLat), lng: parseFloat(data.destLng) },
                    urgency: data.urgency,
                }),
            });
            const json = await response.json();
            setResult(json.shipment);
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl">
            <h3 className="text-xl font-bold mb-6 text-cyan-400 flex items-center gap-2">
                <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></span>
                INITIATE SHIPMENT
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">WEIGHT (KG)</label>
                        <input
                            {...register('weight', { required: true })}
                            type="number"
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:border-cyan-400 focus:outline-none transition-colors"
                            placeholder="0.00"
                        />
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">URGENCY</label>
                        <select
                            {...register('urgency')}
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:border-cyan-400 focus:outline-none transition-colors"
                        >
                            <option value="standard">STANDARD</option>
                            <option value="high">HIGH PRIORITY (AIR)</option>
                            <option value="low">ECONOMY (SEA)</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-mono">ORIGIN COORDINATES</p>
                        <input
                            {...register('originLat', { required: true })}
                            type="number" step="any"
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                            placeholder="LAT"
                            defaultValue="40.7128"
                        />
                        <input
                            {...register('originLng', { required: true })}
                            type="number" step="any"
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                            placeholder="LNG"
                            defaultValue="-74.0060"
                        />
                    </div>
                    <div className="space-y-2">
                        <p className="text-xs text-gray-500 font-mono">DESTINATION COORDINATES</p>
                        <input
                            {...register('destLat', { required: true })}
                            type="number" step="any"
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                            placeholder="LAT"
                            defaultValue="34.0522"
                        />
                        <input
                            {...register('destLng', { required: true })}
                            type="number" step="any"
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white text-sm"
                            placeholder="LNG"
                            defaultValue="-118.2437"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-cyan-600/20 hover:bg-cyan-600/40 border border-cyan-500/50 text-cyan-400 font-bold py-3 rounded-lg transition-all flex justify-center items-center gap-2 group"
                >
                    {isLoading ? 'CALCULATING...' : 'LAUNCH SHIPMENT'}
                    {!isLoading && <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>}
                </button>
            </form>

            {result && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg"
                >
                    <p className="text-green-400 font-bold text-sm mb-2">SHIPMENT CONFIRMED</p>
                    <div className="text-xs text-gray-300 space-y-1 font-mono">
                        <p>ID: {result.trackingId}</p>
                        <p>COST: ${result.cost.toFixed(2)}</p>
                        <p>STATUS: {result.status}</p>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
