'use client';

import React, { useState } from 'react';
import { Calculator, Plus, Trash2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function InteractiveCalculator() {
  const [people, setPeople] = useState<string[]>(['Aman', 'Rahul', 'Priya']);
  const [newPerson, setNewPerson] = useState('');
  const [expenses, setExpenses] = useState<
    { id: string; paidBy: string; amount: number; description: string }[]
  >([
    { id: '1', paidBy: 'Aman', amount: 150, description: 'Hotel Stay' },
    { id: '2', paidBy: 'Rahul', amount: 60, description: 'Dinner' },
  ]);

  const [expPaidBy, setExpPaidBy] = useState('Aman');
  const [expAmount, setExpAmount] = useState('');
  const [expDesc, setExpDesc] = useState('');

  const addPerson = () => {
    if (newPerson.trim() && !people.includes(newPerson.trim())) {
      setPeople([...people, newPerson.trim()]);
      setNewPerson('');
    }
  };

  const removePerson = (name: string) => {
    if (people.length <= 2) return;
    setPeople(people.filter((p) => p !== name));
    setExpenses(expenses.filter((e) => e.paidBy !== name));
  };

  const addExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(expAmount);
    if (!amt || amt <= 0 || !expDesc.trim()) return;
    setExpenses([
      ...expenses,
      {
        id: Date.now().toString(),
        paidBy: expPaidBy,
        amount: amt,
        description: expDesc.trim(),
      },
    ]);
    setExpAmount('');
    setExpDesc('');
  };

  // Calculate Net Balances
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const perPersonShare = people.length > 0 ? totalSpend / people.length : 0;

  const paidMap: { [name: string]: number } = {};
  people.forEach((p) => (paidMap[p] = 0));
  expenses.forEach((e) => {
    if (paidMap[e.paidBy] !== undefined) paidMap[e.paidBy] += e.amount;
  });

  const netMap: { name: string; net: number }[] = people.map((p) => ({
    name: p,
    net: (paidMap[p] || 0) - perPersonShare,
  }));

  // Calculate Settlements
  const debtors = netMap.filter((m) => m.net < -0.01).map((m) => ({ name: m.name, amount: -m.net }));
  const creditors = netMap.filter((m) => m.net > 0.01).map((m) => ({ name: m.name, amount: m.net }));

  const settlements: { from: string; to: string; amount: number }[] = [];
  let dIdx = 0;
  let cIdx = 0;

  const debtorsCopy = debtors.map((d) => ({ ...d }));
  const creditorsCopy = creditors.map((c) => ({ ...c }));

  while (dIdx < debtorsCopy.length && cIdx < creditorsCopy.length) {
    const d = debtorsCopy[dIdx];
    const c = creditorsCopy[cIdx];
    const transfer = Math.min(d.amount, c.amount);

    if (transfer > 0) {
      settlements.push({ from: d.name, to: c.name, amount: transfer });
      d.amount -= transfer;
      c.amount -= transfer;
    }

    if (d.amount <= 0.01) dIdx++;
    if (c.amount <= 0.01) cIdx++;
  }

  return (
    <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6 text-white">
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-2xl">
          <Calculator className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-extrabold">Instant Trip Expense Calculator</h3>
          <p className="text-xs text-slate-400">Test how expense splitting works right in your browser</p>
        </div>
      </div>

      {/* 1. Manage People */}
      <div className="space-y-3">
        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
          Trip Members ({people.length})
        </label>
        <div className="flex flex-wrap gap-2 items-center">
          {people.map((p) => (
            <span key={p} className="bg-white/10 border border-white/10 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
              {p}
              {people.length > 2 && (
                <button onClick={() => removePerson(p)} className="text-slate-400 hover:text-rose-400">
                  ×
                </button>
              )}
            </span>
          ))}
        </div>
        <div className="flex gap-2 max-w-sm">
          <input
            type="text"
            placeholder="Add member name..."
            value={newPerson}
            onChange={(e) => setNewPerson(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-500 text-white"
          />
          <button onClick={addPerson} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* 2. Add Expense Form */}
      <form onSubmit={addExpense} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
        <input
          type="text"
          placeholder="Expense title (e.g. Hotel)"
          value={expDesc}
          onChange={(e) => setExpDesc(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          required
        />
        <input
          type="number"
          placeholder="Amount ($)"
          value={expAmount}
          onChange={(e) => setExpAmount(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          required
        />
        <select
          value={expPaidBy}
          onChange={(e) => setExpPaidBy(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
        >
          {people.map((p) => (
            <option key={p} value={p} className="bg-slate-900 text-white">
              Paid by {p}
            </option>
          ))}
        </select>
        <button type="submit" className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs rounded-xl py-2 flex items-center justify-center gap-1">
          <Plus className="w-3.5 h-3.5" /> Add Expense
        </button>
      </form>

      {/* 3. Expense Log & Calculated Settlement */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/10">
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logged Expenses</h4>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs">
            {expenses.map((e) => (
              <div key={e.id} className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between">
                <span>
                  <strong className="text-white">{e.description}</strong> (${e.amount})
                </span>
                <span className="text-emerald-400 font-medium">Paid by {e.paidBy}</span>
              </div>
            ))}
          </div>
          <div className="text-xs text-slate-400 font-semibold pt-1">
            Total Spend: <strong className="text-white">${totalSpend.toFixed(2)}</strong> | Per Person: <strong className="text-emerald-400">${perPersonShare.toFixed(2)}</strong>
          </div>
        </div>

        <div className="space-y-2 bg-emerald-950/30 border border-emerald-500/20 p-4 rounded-2xl">
          <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Calculated Settlement Transfers</h4>
          {settlements.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Everyone is settled up equally!</p>
          ) : (
            <ul className="space-y-2 text-xs">
              {settlements.map((s, idx) => (
                <li key={idx} className="bg-slate-900/80 p-2.5 rounded-xl border border-emerald-500/30 font-semibold flex items-center justify-between">
                  <span>
                    <span className="text-rose-400">{s.from}</span> owes <span className="text-emerald-400">{s.to}</span>
                  </span>
                  <span className="text-white font-extrabold">${s.amount.toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="pt-3">
            <Link href="/register" className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md">
              Save This Trip Free <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
