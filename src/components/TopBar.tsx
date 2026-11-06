import React from 'react';

export type ActiveTab = 'foundation' | 'workspace' | 'simulator' | 'assessments' | 'sync';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onTriggerVpsSync: () => void;
  isSyncing: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onTriggerVpsSync,
  isSyncing
}) => {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'foundation', label: 'Основы C#' },
    { id: 'workspace', label: 'Лаборатория и ТЗ' },
    { id: 'simulator', label: 'Симулятор CLR и Godot' },
    { id: 'assessments', label: 'PR-Ревью и Тесты' },
    { id: 'sync', label: 'Git и VPS Синк' }
  ];

  return (
    <header className="flex items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B1120]/95 sticky top-0 z-30">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#foundation"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('foundation');
        }}
        className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0 font-display"
      >
        C# &amp; Godot Lab
      </a>

      {/* Zone 2: 4 concise single-line text navigation links */}
      <nav aria-label="Основная навигация" className="hidden lg:flex items-center gap-4 text-sm font-medium">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                onSelectTab(item.id);
              }}
              className={`whitespace-nowrap shrink-0 transition-colors py-1 border-b-2 ${
                isActive
                  ? 'border-sky-500 text-slate-900 dark:text-white font-semibold'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onTriggerVpsSync}
          disabled={isSyncing}
          className="px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-60 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isSyncing ? 'Синхронизация...' : 'Синхронизировать с VPS'}
        </button>
      </div>
    </header>
  );
};
