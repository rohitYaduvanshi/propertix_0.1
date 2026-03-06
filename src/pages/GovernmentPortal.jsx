import React from 'react';
import { Construction, Clock, ShieldAlert } from 'lucide-react';

const UnderDevelopment = () => {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="max-w-md w-full text-center space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-blue-100">
        
        {/* Animated Icon Container */}
        <div className="flex justify-center">
          <div className="relative">
            <Construction className="w-20 h-20 text-blue-600 animate-bounce" />
            <div className="absolute -top-1 -right-1">
              <span className="flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
              </span>
            </div>
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Feature Under <span className="text-blue-600">Verification</span>
          </h2>
          <p className="text-gray-500 text-lg leading-relaxed">
            This module is currently being synced with the 
            <span className="font-semibold text-gray-700"> Local Blockchain Ledger. </span> 
            Smart contract audit in progress.
          </p>
        </div>

        {/* Professional Status Badges */}
        <div className="flex flex-col gap-3 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-sm text-amber-600 bg-amber-50 py-2 rounded-lg font-medium">
            <Clock className="w-4 h-4" />
            ETA: Next Development Sprint (Phase 2)
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 bg-blue-50 py-2 rounded-lg font-medium">
            <ShieldAlert className="w-4 h-4" />
            Security Protocol: Level 4 Active
          </div>
        </div>

        {/* Back Button for Demo Navigation */}
        <button 
          onClick={() => window.history.back()}
          className="w-full bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg active:scale-95"
        >
          Return to Dashboard
        </button>

        <p className="text-[10px] text-gray-400 uppercase tracking-widest">
          Propertix Protocol v0.1.0-alpha
        </p>
      </div>
    </div>
  );
};

export default UnderDevelopment;