'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { PRESET_LOCATIONS } from '@/core/types';

const locationOptions = Object.entries(PRESET_LOCATIONS).map(([key, loc]) => ({
    value: key,
    label: `${loc.city}, ${loc.country}`,
    fullLabel: `${loc.address}, ${loc.city}, ${loc.country}`,
}));

export default function CreateShipmentForm({ customerId, onSuccess }: { customerId: string, onSuccess?: () => void }) {
    const { 
        register, 
        handleSubmit, 
        formState: { errors }, 
        watch 
    } = useForm({
        defaultValues: {
            weight: '' as unknown as number,
            origin: '',
            destination: '',
            urgency: 'standard' as const,
        },
    });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [jobId, setJobId] = useState<string | null>(null);

    const selectedOrigin = watch('origin');
    const selectedDest = watch('destination');

    const onSubmit = async (data: { weight: number; origin: string; destination: string; urgency: string }) => {
        setIsLoading(true);
        setResult(null);
        setJobId(null);
        
        try {
            const originLoc = PRESET_LOCATIONS[data.origin];
            const destLoc = PRESET_LOCATIONS[data.destination];

            if (!originLoc || !destLoc) {
                throw new Error('Please select valid locations');
            }

            const response = await fetch('/api/shipments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customerId,
                    weight: parseFloat(String(data.weight)), // Ensure it's a number
                    origin: originLoc,
                    destination: destLoc,
                    urgency: data.urgency,
                }),
            });
            
            const json = await response.json();
            
            if (!response.ok) {
                throw new Error(json.error || 'Failed to create shipment');
            }
            
            // Handle async response (202 Accepted)
            if (response.status === 202) {
                setJobId(json.jobId);
                setResult({
                    ...json.shipment,
                    isProcessing: true,
                });
            } else {
                setResult(json.shipment);
            }
            
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error(error);
            setResult({ error: error instanceof Error ? error.message : 'Failed to create shipment' });
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
                            {...register('weight', { required: true, min: 0.1 })}
                            type="number"
                            step="0.1"
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:border-cyan-400 focus:outline-none transition-colors"
                            placeholder="0.00"
                        />
                        {errors.weight && <span className="text-red-400 text-xs">Required</span>}
                    </div>
                    <div>
                        <label className="block text-xs text-gray-400 mb-1">URGENCY</label>
                        <select
                            {...register('urgency')}
                            className="w-full bg-black/20 border border-white/10 rounded p-2 text-white focus:border-cyan-400 focus:outline-none transition-colors"
                        >
                            <option value="standard">STANDARD (GROUND)</option>
                            <option value="high">EXPRESS (AIR)</option>
                            <option value="low">ECONOMY (SEA)</option>
                        </select>
                    </div>
                </div>

                {/* Origin Location */}
                <div>
                    <label className="block text-xs text-gray-400 mb-1">
                        <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            ORIGIN
                        </span>
                    </label>
                    <select
                        {...register('origin', { required: true })}
                        className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-cyan-400 focus:outline-none transition-colors"
                    >
                        <option value="">Select pickup location...</option>
                        {locationOptions.map(loc => (
                            <option key={loc.value} value={loc.value}>{loc.label}</option>
                        ))}
                    </select>
                    {selectedOrigin && PRESET_LOCATIONS[selectedOrigin] && (
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                            📍 {PRESET_LOCATIONS[selectedOrigin].address}
                        </p>
                    )}
                    {errors.origin && <span className="text-red-400 text-xs">Please select origin</span>}
                </div>

                {/* Destination Location */}
                <div>
                    <label className="block text-xs text-gray-400 mb-1">
                        <span className="inline-flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                            </svg>
                            DESTINATION
                        </span>
                    </label>
                    <select
                        {...register('destination', { required: true })}
                        className="w-full bg-black/20 border border-white/10 rounded p-3 text-white focus:border-cyan-400 focus:outline-none transition-colors"
                    >
                        <option value="">Select delivery location...</option>
                        {locationOptions.map(loc => (
                            <option key={loc.value} value={loc.value}>{loc.label}</option>
                        ))}
                    </select>
                    {selectedDest && PRESET_LOCATIONS[selectedDest] && (
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                            📍 {PRESET_LOCATIONS[selectedDest].address}
                        </p>
                    )}
                    {errors.destination && <span className="text-red-400 text-xs">Please select destination</span>}
                </div>

                {/* Route Preview */}
                {selectedOrigin && selectedDest && selectedOrigin !== selectedDest && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                        <p className="text-xs text-gray-400 mb-2">ROUTE PREVIEW</p>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="text-cyan-400">{PRESET_LOCATIONS[selectedOrigin]?.city}</span>
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"/>
                            </svg>
                            <span className="text-purple-400">{PRESET_LOCATIONS[selectedDest]?.city}</span>
                        </div>
                    </motion.div>
                )}

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
                    className={`mt-6 p-4 rounded-lg ${
                        result.error 
                            ? 'bg-red-500/10 border border-red-500/30' 
                            : result.isProcessing
                            ? 'bg-yellow-500/10 border border-yellow-500/30'
                            : 'bg-green-500/10 border border-green-500/30'
                    }`}
                >
                    {result.error ? (
                        <p className="text-red-400 font-bold text-sm">✗ {result.error}</p>
                    ) : result.isProcessing ? (
                        <>
                            <p className="text-yellow-400 font-bold text-sm mb-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></span>
                                PROCESSING SHIPMENT...
                            </p>
                            <div className="text-xs text-gray-300 space-y-1">
                                <p><span className="text-gray-500">Tracking:</span> <span className="font-mono">{result.trackingId}</span></p>
                                <p><span className="text-gray-500">Status:</span> {result.status}</p>
                                {jobId && <p><span className="text-gray-500">Job ID:</span> <span className="font-mono text-xs">{jobId}</span></p>}
                                <p className="text-yellow-400/70 text-xs mt-2">
                                    Vehicle assignment and pricing are being calculated...
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-green-400 font-bold text-sm mb-2">✓ SHIPMENT CONFIRMED</p>
                            <div className="text-xs text-gray-300 space-y-1">
                                <p><span className="text-gray-500">Tracking:</span> <span className="font-mono">{result.trackingId}</span></p>
                                <p><span className="text-gray-500">Cost:</span> <span className="text-green-400 font-bold">${result.cost?.toFixed(2) || '0.00'}</span></p>
                                <p><span className="text-gray-500">Status:</span> {result.status}</p>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
        </div>
    );
}
