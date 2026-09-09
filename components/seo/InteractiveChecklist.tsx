'use client';

import React, { useState } from 'react';
import { CheckSquare, Plus, CheckCircle2, User, Users } from 'lucide-react';

export function InteractiveChecklist() {
  const [tab, setTab] = useState<'GROUP' | 'PERSONAL'>('GROUP');
  const [groupItems, setGroupItems] = useState([
    { id: 1, title: 'Snacks & Bottled Water', category: '🍿 Food & Drinks', done: true, assignedTo: 'Aman' },
    { id: 2, title: 'First-aid Kit', category: '🩹 Health', done: true, assignedTo: 'Rahul' },
    { id: 3, title: 'Hotel Booking Confirmation', category: '🏨 Stay', done: false, assignedTo: 'Host' },
  ]);

  const [personalItems, setPersonalItems] = useState([
    { id: 101, title: 'Toothbrush & Toothpaste', category: '🧴 Toiletries', done: true },
    { id: 102, title: 'Phone Charger & Power Bank', category: '🔌 Electronics', done: false },
    { id: 103, title: 'ID Proof / Driving Licence', category: '🪪 Documents', done: false },
  ]);

  const toggleGroupDone = (id: number) => {
    setGroupItems(groupItems.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const togglePersonalDone = (id: number) => {
    setPersonalItems(personalItems.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));
  };

  const currentList = tab === 'GROUP' ? groupItems : personalItems;

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 text-white">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-2xl">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold">Group & Personal Packing Checklist</h3>
            <p className="text-xs text-slate-400">Interactive preview of group vs personal checklist organization</p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
          <button
            onClick={() => setTab('GROUP')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              tab === 'GROUP' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Group Items
          </button>
          <button
            onClick={() => setTab('PERSONAL')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              tab === 'PERSONAL' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Personal Items
          </button>
        </div>
      </div>

      <div className="divide-y divide-white/5 bg-white/5 border border-white/10 rounded-2xl overflow-hidden text-xs">
        {currentList.map((item) => (
          <div
            key={item.id}
            onClick={() => (tab === 'GROUP' ? toggleGroupDone(item.id) : togglePersonalDone(item.id))}
            className="p-3.5 flex items-center justify-between gap-3 hover:bg-white/5 cursor-pointer select-none transition-colors"
          >
            <div className="flex items-center gap-3">
              <button
                className={`p-1 rounded-lg transition-all ${
                  item.done ? 'bg-emerald-500 text-slate-950' : 'bg-white/10 text-slate-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
              <span className={`font-semibold ${item.done ? 'line-through text-slate-400' : 'text-white'}`}>
                {item.title}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px]">
              <span className="bg-white/10 text-slate-300 px-2 py-0.5 rounded-md font-bold">{item.category}</span>
              {tab === 'GROUP' && (item as any).assignedTo && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-md font-bold">
                  Assigned: {(item as any).assignedTo}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
