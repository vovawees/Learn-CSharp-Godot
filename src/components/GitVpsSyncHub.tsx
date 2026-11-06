import React from 'react';

export interface SyncStatusData {
  vps: {
    status: string;
    service: string;
    host: string;
    dotnetVersion: string;
    port: number;
    workspace?: string;
  };
  state: {
    updatedAt: string;
    device: string;
    xp: number;
    streakDays: number;
    completedTasks: string[];
    passedQuizzes: string[];
    syncHistory: { id: string; timestamp: string; device: string; summary: string }[];
  };
  github: {
    repo: string;
    url: string;
    issues: { number: number; title: string; state: string; html_url?: string }[];
    milestones: { number: number; title: string; description: string; open_issues: number; closed_issues: number }[];
  };
}

interface GitVpsSyncHubProps {
  syncData: SyncStatusData | null;
  isSyncing: boolean;
  onSyncNow: (deviceLabel: string) => void;
  localXp: number;
  completedTasks: string[];
  passedQuizzes: string[];
}

export const GitVpsSyncHub: React.FC<GitVpsSyncHubProps> = ({
  syncData,
  isSyncing,
  onSyncNow,
  localXp,
  completedTasks,
  passedQuizzes
}) => {
  return (
    <section className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
            Кроссплатформенная синхронизация прогресса ПК ⇄ Телефон через Oracle Cloud VPS и GitHub
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
            Центр синхронизации Git и VPS (.NET 10 ARM64)
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onSyncNow('Desktop / Mobile Web IDE')}
            disabled={isSyncing}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isSyncing ? 'Синхронизация с VPS...' : 'Сохранить снимок прогресса на VPS'}
          </button>
        </div>
      </div>

      {/* Top Telemetry Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">Статус боевого VPS сервера</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">
            {syncData?.vps?.host || '130.61.29.17 (Oracle Linux 9.8)'}
          </div>
          <div className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
            ● Сервис: {syncData?.vps?.service || 'csharp_mastery_hub_api'} (Порт {syncData?.vps?.port || 8945})
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            SDK: .NET {syncData?.vps?.dotnetVersion || '10.0.114'} · Изоляция: /home/opc/ai_workspace/csharp_mastery_hub
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">Единый инженерный профиль (PC &amp; Mobile)</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono tabular-nums">
            {localXp} XP · {completedTasks.length} Контрактов · {passedQuizzes.length} PR-Ревью
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300">
            Последняя синхронизация:{' '}
            {syncData?.state?.updatedAt
              ? new Date(syncData.state.updatedAt).toLocaleTimeString('ru-RU')
              : 'Только что'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Все решения C# 14 и прогресс мгновенно доступны с телефона и ПК.
          </div>
        </div>

        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="text-xs text-slate-500 dark:text-slate-400">Интеграция с GitHub Репозиторием</div>
          <div className="text-lg font-bold text-slate-900 dark:text-white font-mono truncate">
            {syncData?.github?.repo || 'vovawees/Learn-CSharp-Godot'}
          </div>
          <div className="text-xs text-sky-600 dark:text-sky-400">
            <a
              href={syncData?.github?.url || 'https://github.com/vovawees/Learn-CSharp-Godot'}
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-sky-300"
            >
              Открыть репозиторий на GitHub →
            </a>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Папка долгосрочной памяти .ai/ + Issues и Milestones активны.
          </div>
        </div>
      </div>

      {/* GitHub Milestones, Issues & VPS Sync Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            Активные GitHub Issues и Milestones проекта
          </h2>

          {syncData?.github?.milestones && syncData.github.milestones.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {syncData.github.milestones.map((m) => (
                <div
                  key={m.number}
                  className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs"
                >
                  <div className="font-semibold text-slate-900 dark:text-white">{m.title}</div>
                  <div className="mt-1 text-slate-500 font-mono tabular-nums">
                    Открыто задач: {m.open_issues} · Закрыто: {m.closed_issues}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-2">
            {(syncData?.github?.issues && syncData.github.issues.length > 0
              ? syncData.github.issues
              : [
                  {
                    number: 1,
                    title: 'Implement Goal-Driven C# Semantic Contract & AST Analyzer (Anti-Copy-Paste)',
                    state: 'open'
                  },
                  {
                    number: 2,
                    title: 'Build Interactive CLR Stack/Heap & Godot 4.8 SceneTree Visual Simulator',
                    state: 'open'
                  },
                  {
                    number: 3,
                    title: 'Create Comprehensive Curriculum: Core C# 14 (.NET 10) to Godot 4.7/4.8 Game Engineering',
                    state: 'open'
                  }
                ]
            ).map((iss) => (
              <div
                key={iss.number}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 text-xs"
              >
                <div className="text-slate-900 dark:text-white font-medium">
                  <span className="font-mono text-sky-600 dark:text-sky-400 mr-2">#{iss.number}</span>
                  {iss.title}
                </div>
                <span className="font-mono text-slate-500 shrink-0">{iss.state}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
            Журнал синхронизации состояния с VPS
          </h2>
          <div className="space-y-2.5">
            {(syncData?.state?.syncHistory || []).map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs"
              >
                <div className="flex justify-between text-slate-500 font-mono text-[11px]">
                  <span>{entry.device}</span>
                  <span>{new Date(entry.timestamp).toLocaleTimeString('ru-RU')}</span>
                </div>
                <div className="mt-1 text-slate-800 dark:text-slate-200">{entry.summary}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
