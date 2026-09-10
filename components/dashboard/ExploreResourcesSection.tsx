'use client';

import React from 'react';
import { Calculator, CheckSquare, Compass, BookOpen, ArrowUpRight, Sparkles } from 'lucide-react';

interface ResourceItem {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
  badge: string;
  colorBg: string;
  colorBorder: string;
  colorIcon: string;
}

const RESOURCES: ResourceItem[] = [
  {
    id: 'calculator',
    title: 'Trip Expense Calculator',
    description: 'Calculate ad-hoc per-person splits & hotel room divisions instantly.',
    href: '/trip-expense-calculator',
    icon: Calculator,
    badge: 'Free Tool',
    colorBg: 'bg-emerald-50 hover:bg-emerald-100/80',
    colorBorder: 'border-emerald-200/80',
    colorIcon: 'text-emerald-600',
  },
  {
    id: 'checklist',
    title: 'Group Trip Checklist',
    description: 'Browse shared packing templates and host assignment tips.',
    href: '/group-trip-checklist',
    icon: CheckSquare,
    badge: 'Packing Tool',
    colorBg: 'bg-blue-50 hover:bg-blue-100/80',
    colorBorder: 'border-blue-200/80',
    colorIcon: 'text-blue-600',
  },
  {
    id: 'planner',
    title: 'Group Trip Planner',
    description: 'Guide to organizing group itineraries, dates, and voting polls.',
    href: '/group-trip-planner',
    icon: Compass,
    badge: 'Planning Guide',
    colorBg: 'bg-indigo-50 hover:bg-indigo-100/80',
    colorBorder: 'border-indigo-200/80',
    colorIcon: 'text-indigo-600',
  },
  {
    id: 'blog',
    title: 'Travel Guides & Blog',
    description: 'Expert articles on splitting vacation costs and travel budgeting.',
    href: '/blog',
    icon: BookOpen,
    badge: 'Blog & Tips',
    colorBg: 'bg-purple-50 hover:bg-purple-100/80',
    colorBorder: 'border-purple-200/80',
    colorIcon: 'text-purple-600',
  },
];

export const ExploreResourcesSection: React.FC = () => {
  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-100/90 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/60">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Explore & Resources</h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Free tools, packing guides & budgeting tips
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RESOURCES.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`p-4 rounded-2xl border transition-all ${item.colorBg} ${item.colorBorder} flex flex-col justify-between space-y-3 group cursor-pointer`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 bg-white rounded-xl shadow-xs shrink-0 ${item.colorIcon}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-slate-950 transition-colors">
                      {item.title}
                    </h4>
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block mt-0.5">
                      {item.badge}
                    </span>
                  </div>
                </div>

                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed font-medium">
                {item.description}
              </p>
            </a>
          );
        })}
      </div>
    </div>
  );
};
