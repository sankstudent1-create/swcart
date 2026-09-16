'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, AlertCircle, PackageSearch } from 'lucide-react';
import TrackingTimeline, { TrackingData } from '@/components/TrackingTimeline';

export default function SpeedPostTrackingPage() {
  const [consignmentNumber, setConsignmentNumber] = useState('');
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!consignmentNumber || consignmentNumber.length !== 13) {
      setError('Please enter a valid 13-digit consignment number.');
      return;
    }

    setError(null);
    setIsLoading(true);
    setTrackingData(null);

    try {
      const response = await fetch(`/api/tracking?n=${consignmentNumber}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tracking data');
      }

      const data = await response.json();
      setTrackingData(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching tracking details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-10 pb-20 px-4 sm:px-6 lg:px-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="text-center mb-12">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-2xl mb-6 text-indigo-600 dark:text-indigo-400"
          >
            <PackageSearch className="w-8 h-8" />
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4"
          >
            Internal Package Tracking
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto"
          >
            Track shipments across the network instantly. Enter a 13-digit consignment number to get live transit updates.
          </motion.p>
        </div>

        {/* Search Bar */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto mb-16"
        >
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-500"></div>
            <div className="relative flex items-center bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800">
              <div className="pl-6 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <input
                type="text"
                value={consignmentNumber}
                onChange={(e) => setConsignmentNumber(e.target.value.toUpperCase())}
                placeholder="e.g. PP272506004IN"
                className="w-full py-5 pl-4 pr-32 text-lg bg-transparent text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none uppercase font-medium tracking-wider"
                maxLength={13}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-semibold transition-all shadow-md shadow-indigo-500/20 disabled:opacity-70 flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Tracking...</span>
                    </>
                  ) : (
                    <span>Track Item</span>
                  )}
                </button>
              </div>
            </div>
            {consignmentNumber.length > 0 && consignmentNumber.length !== 13 && (
               <div className="absolute -bottom-6 right-4 text-xs font-medium text-amber-500">
                 {consignmentNumber.length}/13 characters
               </div>
            )}
          </form>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400"
              >
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results Area */}
        <AnimatePresence mode="wait">
          {trackingData && !isLoading && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5 }}
            >
              <TrackingTimeline data={trackingData} />
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
