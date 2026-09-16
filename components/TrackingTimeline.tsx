'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, MapPin, Package, Truck, Clock } from 'lucide-react';
import { format } from 'date-fns';

export interface TrackingEvent {
  date: string;
  location: string;
  description: string;
  status: 'completed' | 'active' | 'pending';
}

export interface TrackingData {
  consignment_number: string;
  status: string;
  origin: string;
  destination: string;
  events: TrackingEvent[];
}

interface TrackingTimelineProps {
  data: TrackingData;
}

export default function TrackingTimeline({ data }: TrackingTimelineProps) {
  // Determine icon based on description/status
  const getIcon = (description: string, status: string, isLast: boolean, isFirst: boolean) => {
    const lowerDesc = description.toLowerCase();
    
    if (lowerDesc.includes('delivered')) return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    if (lowerDesc.includes('out for delivery')) return <Truck className="w-6 h-6 text-blue-500" />;
    if (isLast && status === 'completed') return <Package className="w-6 h-6 text-purple-500" />;
    if (status === 'completed') return <CheckCircle2 className="w-5 h-5 text-indigo-500" />;
    if (status === 'active') return <Circle className="w-5 h-5 text-amber-500 fill-amber-500/20 animate-pulse" />;
    return <Circle className="w-5 h-5 text-slate-300" />;
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 shadow-2xl rounded-3xl p-6 md:p-8 overflow-hidden">
      
      {/* Header Card */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg mb-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-indigo-100 text-sm font-medium tracking-wider uppercase mb-1">Consignment No.</p>
            <h2 className="text-3xl font-bold tracking-tight">{data.consignment_number}</h2>
          </div>
          <div className="flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full backdrop-blur-md border border-white/20">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="font-semibold tracking-wide">{data.status}</span>
          </div>
        </div>
        
        <div className="mt-6 flex items-center justify-between text-sm text-indigo-50 border-t border-white/20 pt-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>Origin: <strong className="text-white">{data.origin}</strong></span>
          </div>
          <div className="h-4 w-px bg-white/30"></div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>Dest: <strong className="text-white">{data.destination}</strong></span>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="relative pl-4 md:pl-8">
        {data.events.map((event, index) => {
          const isLast = index === 0;
          const isFirst = index === data.events.length - 1;
          
          return (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.5, ease: "easeOut" }}
              key={index} 
              className="relative pb-10 last:pb-0"
            >
              {/* Connector Line */}
              {!isFirst && (
                <div className={`absolute left-2.5 md:left-3 top-8 -bottom-2 w-[2px] ${event.status === 'completed' ? 'bg-indigo-500/30' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
              )}
              
              <div className="flex gap-4 md:gap-6">
                {/* Icon Column */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center bg-white dark:bg-slate-900 shadow-sm border ${isLast ? 'border-emerald-200 dark:border-emerald-900/50' : 'border-slate-100 dark:border-slate-800'} p-1`}>
                    {getIcon(event.description, event.status, isLast, isFirst)}
                  </div>
                </div>
                
                {/* Content Column */}
                <div className={`flex-1 ${isLast ? '' : 'pt-1'}`}>
                  <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-1 md:gap-4 mb-2">
                    <h3 className={`text-base md:text-lg font-semibold ${isLast ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                      {event.description}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs md:text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800/50 px-2.5 py-1 rounded-md shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                      {(() => {
                        try {
                          const d = new Date(event.date);
                          if (isNaN(d.getTime())) return event.date; // Fallback to raw string if invalid
                          return format(d, 'dd MMM yyyy, hh:mm a');
                        } catch (e) {
                          return event.date;
                        }
                      })()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
