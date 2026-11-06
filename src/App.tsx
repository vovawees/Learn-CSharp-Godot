import { useEffect, useState } from 'react';
import { TopBar, ActiveTab } from './components/TopBar';
import { FoundationCourse } from './components/FoundationCourse';
import { EngineeringWorkspace } from './components/EngineeringWorkspace';
import { ClrGodotSimulator } from './components/ClrGodotSimulator';
import { EngineeringAssessments } from './components/EngineeringAssessments';
import { GitVpsSyncHub, SyncStatusData } from './components/GitVpsSyncHub';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('foundation');
  const [syncData, setSyncData] = useState<SyncStatusData | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  const [xp, setXp] = useState<number>(0);
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);
  const [passedQuizzes, setPassedQuizzes] = useState<string[]>([]);
  const [codeSnapshots, setCodeSnapshots] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    fetch('/api/sync/status')
      .then((r) => r.json())
      .then((data: SyncStatusData) => {
        if (!mounted || !data) return;
        setSyncData(data);
        if (data.state) {
          if (typeof data.state.xp === 'number') setXp(data.state.xp);
          if (Array.isArray(data.state.completedTasks)) setCompletedTasks(data.state.completedTasks);
          if (Array.isArray(data.state.passedQuizzes)) setPassedQuizzes(data.state.passedQuizzes);
        }
      })
      .catch(() => {
        // Offline / local fallback already initialized
      });
    return () => {
      mounted = false;
    };
  }, []);

  const pushStateToVps = async (
    nextXp: number,
    nextTasks: string[],
    nextQuizzes: string[],
    nextSnapshots: Record<string, string>,
    summary: string
  ) => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/sync/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device: window.innerWidth < 768 ? 'Mobile-Web-IDE' : 'Desktop-Web-IDE',
          xp: nextXp,
          completedTasks: nextTasks,
          passedQuizzes: nextQuizzes,
          codeSnapshots: nextSnapshots,
          summary
        })
      });
      const result = await res.json();
      if (result?.state) {
        setSyncData((prev) =>
          prev
            ? { ...prev, state: result.state }
            : {
                vps: {
                  status: 'online',
                  service: 'csharp_mastery_hub_api',
                  host: '130.61.29.17',
                  dotnetVersion: '10.0.114',
                  port: 8945
                },
                state: result.state,
                github: { repo: 'vovawees/Learn-CSharp-Godot', url: 'https://github.com/vovawees/Learn-CSharp-Godot', issues: [], milestones: [] }
              }
        );
      }
    } catch {
      // Keep local state
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTaskPassed = (taskId: string, code: string, xpReward: number) => {
    const alreadyDone = completedTasks.includes(taskId);
    const nextTasks = alreadyDone ? completedTasks : [...completedTasks, taskId];
    const nextXp = alreadyDone ? xp : xp + xpReward;
    const nextSnapshots = { ...codeSnapshots, [taskId]: code };

    setCompletedTasks(nextTasks);
    setXp(nextXp);
    setCodeSnapshots(nextSnapshots);

    pushStateToVps(
      nextXp,
      nextTasks,
      passedQuizzes,
      nextSnapshots,
      `Выполнен инженерный контракт ${taskId} (+${alreadyDone ? 0 : xpReward} XP)`
    );
  };

  const handleQuizPassed = (quizId: string, xpReward: number) => {
    const alreadyDone = passedQuizzes.includes(quizId);
    const nextQuizzes = alreadyDone ? passedQuizzes : [...passedQuizzes, quizId];
    const nextXp = alreadyDone ? xp : xp + xpReward;

    setPassedQuizzes(nextQuizzes);
    setXp(nextXp);

    pushStateToVps(
      nextXp,
      completedTasks,
      nextQuizzes,
      codeSnapshots,
      `Пройдено инженерное PR-ревью ${quizId}`
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B1120] text-slate-900 dark:text-slate-100">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onTriggerVpsSync={() =>
          pushStateToVps(
            xp,
            completedTasks,
            passedQuizzes,
            codeSnapshots,
            'Ручная синхронизация прогресса и снимков кода с VPS'
          )
        }
        isSyncing={isSyncing}
      />

      {/* Mobile Navigation Bar (compact, below 15% sticky cap) */}
      <nav
        aria-label="Мобильная навигация"
        className="flex lg:hidden items-center justify-start gap-1 overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2 py-2 text-xs font-medium"
      >
        <button
          type="button"
          onClick={() => setActiveTab('foundation')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'foundation' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Основы C#
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'workspace' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Лаборатория
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('simulator')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'simulator' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Симулятор
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('assessments')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'assessments' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          PR-Тесты
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('sync')}
          className={`px-2.5 py-1 rounded whitespace-nowrap ${
            activeTab === 'sync' ? 'bg-sky-600 text-white font-semibold' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Git и VPS
        </button>
      </nav>

      <main className="flex-1">
        {activeTab === 'foundation' && <FoundationCourse />}
        {activeTab === 'workspace' && (
          <EngineeringWorkspace
            completedTasks={completedTasks}
            codeSnapshots={codeSnapshots}
            onTaskPassed={handleTaskPassed}
          />
        )}
        {activeTab === 'simulator' && <ClrGodotSimulator />}
        {activeTab === 'assessments' && (
          <EngineeringAssessments passedQuizzes={passedQuizzes} onQuizPassed={handleQuizPassed} />
        )}
        {activeTab === 'sync' && (
          <GitVpsSyncHub
            syncData={syncData}
            isSyncing={isSyncing}
            onSyncNow={(deviceLabel) =>
              pushStateToVps(
                xp,
                completedTasks,
                passedQuizzes,
                codeSnapshots,
                `Синхронизация состояния (${deviceLabel})`
              )
            }
            localXp={xp}
            completedTasks={completedTasks}
            passedQuizzes={passedQuizzes}
          />
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-6 px-6 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1360px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            C# 14 (.NET 10) &amp; Godot 4.7 Stable / 4.8 Beta 2 Engineering Lab · Инженерная практика без слепого копипаста
          </div>
          <div className="flex items-center gap-4 tabular-nums">
            <span>Профиль: {xp} XP</span>
            <span aria-hidden="true">·</span>
            <a
              href="https://github.com/vovawees/Learn-CSharp-Godot"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-900 dark:hover:text-white underline"
            >
              GitHub: vovawees/Learn-CSharp-Godot
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
