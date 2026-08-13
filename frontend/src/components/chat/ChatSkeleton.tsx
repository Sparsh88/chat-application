import React from 'react';

export const ChatSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-hidden py-4 px-4 space-y-4 animate-pulse select-none">
      {/* Skeleton Item 1: Received message */}
      <div className="flex items-start gap-3 max-w-xl">
        <div className="w-10 h-10 rounded-xl bg-slate-800/60 shrink-0 border border-slate-700/30" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-24 bg-slate-800/80 rounded-md" />
            <div className="h-2.5 w-12 bg-slate-800/40 rounded-md" />
          </div>
          <div className="h-12 w-3/4 bg-slate-800/50 rounded-2xl border border-slate-700/20" />
        </div>
      </div>

      {/* Skeleton Item 2: Received message with code / card */}
      <div className="flex items-start gap-3 max-w-lg">
        <div className="w-10 h-10 rounded-xl bg-slate-800/60 shrink-0 border border-slate-700/30" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-28 bg-slate-800/80 rounded-md" />
            <div className="h-2.5 w-14 bg-slate-800/40 rounded-md" />
          </div>
          <div className="h-20 w-full bg-slate-800/50 rounded-2xl border border-slate-700/20" />
        </div>
      </div>

      {/* Skeleton Item 3: Sent message */}
      <div className="flex items-start gap-3 max-w-md ml-auto flex-row-reverse">
        <div className="w-10 h-10 rounded-xl bg-indigo-900/40 shrink-0 border border-indigo-500/20" />
        <div className="space-y-2 flex-1 flex flex-col items-end">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-12 bg-slate-800/40 rounded-md" />
            <div className="h-3.5 w-20 bg-indigo-800/60 rounded-md" />
          </div>
          <div className="h-10 w-4/5 bg-indigo-900/30 rounded-2xl border border-indigo-500/20" />
        </div>
      </div>

      {/* Skeleton Item 4: Received message */}
      <div className="flex items-start gap-3 max-w-xl">
        <div className="w-10 h-10 rounded-xl bg-slate-800/60 shrink-0 border border-slate-700/30" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-3.5 w-24 bg-slate-800/80 rounded-md" />
            <div className="h-2.5 w-12 bg-slate-800/40 rounded-md" />
          </div>
          <div className="h-16 w-5/6 bg-slate-800/50 rounded-2xl border border-slate-700/20" />
        </div>
      </div>
    </div>
  );
};
