import React from 'react';
import {
  Compass,
  ArrowRight,
  Shield,
  Zap,
  HardDrive,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useCompassStore } from '../../store/useCompassStore';

export const ArchitectureCanvasPlaceholder: React.FC = () => {
  const { setWorkspaceMode, setSelectedServiceId } = useCompassStore();

  const handleInspectService = (id: string) => {
    setSelectedServiceId(id);
    setWorkspaceMode('vault');
  };

  return (
    <div className="relative w-full h-full bg-[#080c14] overflow-hidden flex flex-col items-center justify-center p-8 select-none">
      {/* Blueprint Grid Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle, #38bdf8 1px, transparent 1px), radial-gradient(circle, #334155 1px, transparent 1px)',
          backgroundSize: '24px 24px, 120px 120px',
          backgroundPosition: '0 0, 0 0',
        }}
      />

      {/* Subtle Grid Ambient Glow */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Container HUD */}
      <div className="relative z-10 max-w-3xl w-full text-center space-y-6">
        {/* Phase 2 Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs text-sky-400 font-mono shadow-lg shadow-black/50">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span>PHASE 2 SANDBOX PREVIEW · REACT FLOW READY</span>
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2.5">
            <Compass className="w-8 h-8 text-sky-400 animate-spin-slow" />
            <span>Interactive Architecture Canvas</span>
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            The multi-tier visual diagramming engine powered by <code className="text-sky-300">@xyflow/react</code> and{' '}
            <code className="text-sky-300">zustand</code>. Drag services from the catalog, connect them with strict protocol
            edges, and inspect deep concept notes.
          </p>
        </div>

        {/* Live Architecture Node Preview Cards */}
        <div className="p-6 rounded-xl bg-slate-900/70 border border-slate-800 backdrop-blur-md shadow-2xl">
          <div className="text-left mb-4 flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
            <span className="font-mono flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Canvas Prototype: Serverless Order Processing Flow</span>
            </span>
            <span className="text-[11px] text-slate-500 font-mono">Snapshots synced to Dexie.js</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Node 1: API Gateway */}
            <div
              onClick={() => handleInspectService('api-gateway')}
              className="p-3.5 rounded-lg border border-purple-500/30 bg-purple-950/20 hover:border-purple-400 hover:bg-purple-950/40 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                  Networking · T1
                </span>
                <Zap className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition-colors">
                Amazon API Gateway
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">REST / HTTP ingress proxy</p>
              <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <span>Handles: 4-Way</span>
                <span className="text-emerald-400 ml-auto">Ready</span>
              </div>
            </div>

            {/* Edge 1 Connector */}
            <div className="flex flex-col items-center justify-center text-center space-y-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-sky-400 border border-slate-700">
                HTTPS / REST
              </span>
              <div className="flex items-center text-slate-500 w-full justify-center">
                <div className="h-0.5 w-12 bg-sky-500/40" />
                <ArrowRight className="w-3.5 h-3.5 text-sky-400" />
              </div>
            </div>

            {/* Node 2: Lambda */}
            <div
              onClick={() => handleInspectService('lambda')}
              className="p-3.5 rounded-lg border border-pink-500/30 bg-pink-950/20 hover:border-pink-400 hover:bg-pink-950/40 transition-all cursor-pointer text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300">
                  Serverless · T1
                </span>
                <Zap className="w-3.5 h-3.5 text-pink-400" />
              </div>
              <h4 className="text-xs font-bold text-white group-hover:text-pink-300 transition-colors">
                AWS Lambda
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">Order processor handler</p>
              <div className="mt-2 text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <span>Handles: 4-Way</span>
                <span className="text-emerald-400 ml-auto">Ready</span>
              </div>
            </div>
          </div>

          {/* Secondary Sub-layer */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-blue-400" />
              <span>Target: Amazon DynamoDB</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>Storage: Amazon S3 (OAC)</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-rose-400" />
              <span>IAM: Least Privilege Roles</span>
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => setWorkspaceMode('vault')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-sky-950/50 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Open Concept Vault Dossiers</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArchitectureCanvasPlaceholder;
