import React, { useState } from 'react';
import { CURRICULUM_TASKS, EngineeringTask } from '../data/curriculum';
import { evaluateCSharpTask, EvaluationReport } from '../engine/csharpEvaluator';

interface EngineeringWorkspaceProps {
  completedTasks: string[];
  codeSnapshots: Record<string, string>;
  onTaskPassed: (taskId: string, code: string, xpEarned: number) => void;
}

const MOBILE_QUICK_TOKENS = [
  '{',
  '}',
  '(',
  ')',
  ';',
  '=>',
  'return ',
  'if ',
  'foreach ',
  'readonly struct',
  'ReadOnlySpan<int>',
  'partial',
  'Velocity',
  'MoveAndSlide();',
  'EmitSignal'
];

export const EngineeringWorkspace: React.FC<EngineeringWorkspaceProps> = ({
  completedTasks,
  codeSnapshots,
  onTaskPassed
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(CURRICULUM_TASKS[0].id);
  const currentTask: EngineeringTask =
    CURRICULUM_TASKS.find((t) => t.id === selectedTaskId) || CURRICULUM_TASKS[0];

  const [slideIndex, setSlideIndex] = useState<number>(0);
  const [codeByTask, setCodeByTask] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const t of CURRICULUM_TASKS) {
      initial[t.id] = codeSnapshots[t.id] || t.starterCode;
    }
    return initial;
  });

  const [report, setReport] = useState<EvaluationReport | null>(null);
  const [vpsRunOutput, setVpsRunOutput] = useState<string | null>(null);
  const [isRunningVps, setIsRunningVps] = useState<boolean>(false);
  const [mentorReview, setMentorReview] = useState<string | null>(null);
  const [isLoadingMentor, setIsLoadingMentor] = useState<boolean>(false);
  const [selectedDefenseOption, setSelectedDefenseOption] = useState<string | null>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<'spec' | 'editor' | 'contracts'>('spec');
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const activeCode = codeByTask[currentTask.id] ?? currentTask.starterCode;
  const activeSlide = currentTask.walkthroughSlides[slideIndex] || currentTask.walkthroughSlides[0];

  const handleSelectTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setSlideIndex(0);
    setReport(null);
    setVpsRunOutput(null);
    setMentorReview(null);
    setSelectedDefenseOption(null);
    setPasteNotice(null);
  };

  const handleCodeChange = (newCode: string) => {
    setPasteNotice(null);
    setCodeByTask((prev) => ({ ...prev, [currentTask.id]: newCode }));
  };

  const handleInsertToken = (token: string) => {
    setCodeByTask((prev) => ({
      ...prev,
      [currentTask.id]: (prev[currentTask.id] || currentTask.starterCode) + '\n' + token
    }));
  };

  const handleRunContracts = () => {
    const evalReport = evaluateCSharpTask(currentTask.id, activeCode, false);
    setReport(evalReport);
    setMobilePane('contracts');
    if (evalReport.goalPassed) {
      onTaskPassed(currentTask.id, activeCode, currentTask.xpReward);
    }
  };

  const handleTryAlternativeValidCode = () => {
    const isCurrentlyRef = activeCode.trim() === currentTask.referenceCleanSolution.trim();
    const nextCode = isCurrentlyRef
      ? currentTask.alternativeValidSolution
      : currentTask.referenceCleanSolution;
    setCodeByTask((prev) => ({ ...prev, [currentTask.id]: nextCode }));
    const evalReport = evaluateCSharpTask(currentTask.id, nextCode, false);
    setReport(evalReport);
    if (evalReport.goalPassed) {
      onTaskPassed(currentTask.id, nextCode, currentTask.xpReward);
    }
  };

  const handleRunOnVpsDotnet10 = async () => {
    setIsRunningVps(true);
    setVpsRunOutput(null);
    try {
      const res = await fetch('/api/vps/dotnet-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: currentTask.id, code: activeCode })
      });
      const data = await res.json();
      setVpsRunOutput(`${data.sdk}\n${data.output}`);
      setMobilePane('contracts');
    } catch {
      setVpsRunOutput('Ошибка соединения с удалённым компилятором .NET 10 на VPS.');
    } finally {
      setIsRunningVps(false);
    }
  };

  const handleRequestSocraticReview = async () => {
    setIsLoadingMentor(true);
    try {
      const currentEval = report || evaluateCSharpTask(currentTask.id, activeCode, false);
      const res = await fetch('/api/mentor/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskTitle: currentTask.title,
          code: activeCode,
          evaluationSummary: currentEval.architecturalFeedback
        })
      });
      const data = await res.json();
      setMentorReview(data.review);
      setMobilePane('contracts');
    } catch {
      setMentorReview(
        'Сократовский совет: сначала убедись, что твой метод возвращает правильный результат на граничных значениях (0, отрицательные числа, большой шаг delta), а затем проверь отсутствие аллокаций в куче.'
      );
    } finally {
      setIsLoadingMentor(false);
    }
  };

  return (
    <section className="max-w-[1360px] mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Progressive Curriculum Module Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span>Инженерный трек C# 14 (.NET 10) → Godot 4.7 Stable &amp; 4.8 Beta 2</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              Выполнено модулей: {completedTasks.length} / {CURRICULUM_TASKS.length}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1 font-display">
            {currentTask.title}
          </h1>
        </div>

        {/* Interactive Module Selector Tabs */}
        <div
          role="tablist"
          aria-label="Модули инженерной программы"
          className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg overflow-x-auto border border-slate-200 dark:border-slate-800"
        >
          {CURRICULUM_TASKS.map((t) => {
            const isSelected = t.id === currentTask.id;
            const isDone = completedTasks.includes(t.id);
            return (
              <button
                key={t.id}
                role="tab"
                aria-selected={isSelected}
                type="button"
                onClick={() => handleSelectTask(t.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {isDone ? '✓ ' : ''}Модуль 0{t.order}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Viewport Mode Switcher (PC shows full 2-column layout) */}
      <div className="flex lg:hidden items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setMobilePane('spec')}
          className={`flex-1 py-2 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
            mobilePane === 'spec'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          1. Видео-Разбор и ТЗ
        </button>
        <button
          type="button"
          onClick={() => setMobilePane('editor')}
          className={`flex-1 py-2 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
            mobilePane === 'editor'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          2. Код C# 14
        </button>
        <button
          type="button"
          onClick={() => setMobilePane('contracts')}
          className={`flex-1 py-2 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer ${
            mobilePane === 'contracts'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold'
              : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          3. Контракты ({report ? (report.goalPassed ? '✓' : '!') : '4'})
        </button>
      </div>

      {/* Main Split Engineering Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN (6 cols): Interactive Video/Concept Walkthrough + First Principles + Technical Spec (ТЗ) */}
        <div
          className={`lg:col-span-6 space-y-6 ${
            mobilePane === 'spec' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Interactive Video / Concept Walkthrough Player */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-sky-600 dark:text-sky-400 font-medium">
                  Интерактивный видео-разбор и трассировка памяти · Глава {slideIndex + 1} из{' '}
                  {currentTask.walkthroughSlides.length}
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5 font-display">
                  {activeSlide.title}
                </h2>
              </div>
              <div className="flex items-center gap-1.5">
                {currentTask.walkthroughSlides.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSlideIndex(idx)}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer whitespace-nowrap ${
                      idx === slideIndex
                        ? 'bg-sky-600 text-white font-semibold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Шаг {idx + 1}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {activeSlide.conceptSummary}
            </p>

            {/* Code Focus inside Walkthrough */}
            <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto border border-slate-800">
              <code>{activeSlide.codeFocus}</code>
            </pre>

            {/* Live Memory / Engine State Snapshot for this Slide */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-sky-600 dark:text-sky-400 mb-1.5">
                  Стек потока (Stack Frame)
                </div>
                {activeSlide.memoryOrEngineState.stackItems.map((item, i) => (
                  <div key={i} className="flex justify-between py-0.5 text-slate-700 dark:text-slate-300">
                    <span>{item.name}</span>
                    <span className="text-sky-600 dark:text-sky-400">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div className="font-semibold text-amber-600 dark:text-amber-400 mb-1.5">
                  Управляемая Куча (Managed Heap)
                </div>
                {activeSlide.memoryOrEngineState.heapItems.length === 0 ? (
                  <div className="text-emerald-600 dark:text-emerald-400 py-0.5">
                    ● 0 аллокаций в куче (Zero-GC)
                  </div>
                ) : (
                  activeSlide.memoryOrEngineState.heapItems.map((h, i) => (
                    <div key={i} className="py-0.5 text-rose-600 dark:text-rose-400">
                      {h.type} ({h.sizeBytes} B) — {h.note}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Статус кадра: {activeSlide.memoryOrEngineState.engineNote}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={slideIndex === 0}
                  onClick={() => setSlideIndex((i) => Math.max(0, i - 1))}
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Назад
                </button>
                <button
                  type="button"
                  disabled={slideIndex === currentTask.walkthroughSlides.length - 1}
                  onClick={() =>
                    setSlideIndex((i) => Math.min(currentTask.walkthroughSlides.length - 1, i + 1))
                  }
                  className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Далее
                </button>
              </div>
            </div>
          </div>

          {/* Technical Specification (ТЗ) Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Техническое Задание (ТЗ) и Инженерные Контракты
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                GitHub Issue #{currentTask.gitIssueNumber} · +{currentTask.xpReward} XP
              </span>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {currentTask.technicalSpec.goalSummary}
            </p>

            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Этап 1. Главная цель (Функциональные требования — код может быть любым):
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4">
                {currentTask.technicalSpec.functionalRequirements.map((req, idx) => (
                  <li key={idx}>{req}</li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">
                Этап 2. Инженерная оптимизация (Память .NET 10 и производительность):
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-4">
                {currentTask.technicalSpec.optimizationRequirements.map((opt, idx) => (
                  <li key={idx}>{opt}</li>
                ))}
              </ul>
            </div>

            {/* Architectural Blueprint Visual with Resilient Fallback */}
            <div className="pt-2">
              {!imageError[currentTask.id] ? (
                <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-950">
                  <img
                    src={currentTask.diagramImage}
                    alt={`Архитектурная схема: ${currentTask.title}`}
                    referrerPolicy="no-referrer"
                    onError={() => setImageError((prev) => ({ ...prev, [currentTask.id]: true }))}
                    className="w-full h-44 object-cover opacity-90"
                  />
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400">
                  Архитектурная схема модуля: {currentTask.title} (.NET 10 CLR &amp; Godot 4.8 SceneTree)
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (6 cols): C# 14 Code Workbench + Contract Runner + Socratic Defense */}
        <div
          className={`lg:col-span-6 space-y-6 ${
            mobilePane === 'editor' || mobilePane === 'contracts' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* C# 14 Ergonomic Code Editor */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white font-display">
                  Среда разработки C# 14 (.NET 10 / Godot 4.8)
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Свободная реализация: система проверяет контракт результата и памяти, а не порядок строк.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTryAlternativeValidCode}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Показать валидный стиль C#
                </button>
                <button
                  type="button"
                  onClick={() => handleCodeChange(currentTask.starterCode)}
                  className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Сбросить к ТЗ
                </button>
              </div>
            </div>

            {/* Mobile & Touch Quick-Token Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto py-1">
              <span className="text-xs text-slate-400 shrink-0 mr-1">Токены:</span>
              {MOBILE_QUICK_TOKENS.map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => handleInsertToken(tok)}
                  className="px-2 py-1 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-sky-500/20 border border-slate-200 dark:border-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {tok}
                </button>
              ))}
            </div>

            {pasteNotice && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-700 dark:text-amber-300">
                {pasteNotice}
              </div>
            )}

            <div>
              <label htmlFor="csharp-code-editor" className="sr-only">
                Редактор кода C# 14
              </label>
              <textarea
                id="csharp-code-editor"
                rows={14}
                value={activeCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onPaste={() => {
                  setPasteNotice(
                    'Защита осознанного кодинга: если вставляешь фрагмент, обязательно проверь его граничные случаи и адаптируй под контракты ТЗ.'
                  );
                }}
                spellCheck={false}
                className="w-full p-4 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm leading-relaxed border border-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleRunContracts}
                className="px-4 py-2.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Проверить цель и контракты
              </button>

              <button
                type="button"
                onClick={handleRunOnVpsDotnet10}
                disabled={isRunningVps}
                className="px-4 py-2.5 text-xs font-semibold text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isRunningVps ? 'Компиляция .NET 10 на VPS...' : 'Компилировать на VPS (.NET 10)'}
              </button>

              <button
                type="button"
                onClick={handleRequestSocraticReview}
                disabled={isLoadingMentor}
                className="px-3.5 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isLoadingMentor ? 'Анализ...' : 'Сократовский разбор кода'}
              </button>
            </div>
          </div>

          {/* Contract & Optimization Evaluation Results */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white font-display">
                Результаты проверки контрактов и памяти CLR
              </h3>
              {report && (
                <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
                  <span
                    className={
                      report.goalPassed
                        ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                        : 'text-amber-600 dark:text-amber-400'
                    }
                  >
                    {report.goalPassed ? '✓ Цель выполнена' : '○ Цель в работе'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      report.optimizationPassed
                        ? 'text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-500'
                    }
                  >
                    {report.optimizationPassed ? '★ Zero-GC Оптимизировано' : 'Аудит памяти'}
                  </span>
                </div>
              )}
            </div>

            {!report ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Нажми «Проверить цель и контракты», чтобы прогнать модульные тесты ТЗ и проверить аллокации памяти .NET 10.
              </p>
            ) : (
              <div className="space-y-4">
                <div
                  className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                    report.allContractsPassed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-200'
                      : report.goalPassed
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-800 dark:text-sky-200'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
                  }`}
                >
                  <div className="font-semibold mb-1">{report.architecturalFeedback}</div>
                  <div className="font-mono text-[11px] opacity-90">
                    Сложность: {report.complexityEstimate} · Куча (Heap): {report.heapAllocationBytes} B · Стек (Stack):{' '}
                    {report.stackAllocationBytes} B
                  </div>
                </div>

                <div className="space-y-2">
                  {report.contractResults.map((c) => (
                    <div
                      key={c.contractId}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2 font-medium">
                        <span className="text-slate-900 dark:text-white">
                          {c.passed ? '✓ ' : '✕ '}
                          {c.name}
                        </span>
                        <span className="font-mono text-slate-500">{c.category}</span>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-sky-600 dark:text-sky-400">
                        Вывод: {c.actualOutput}
                      </div>
                      <div className="mt-1 text-slate-600 dark:text-slate-400">{c.diagnostic}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {vpsRunOutput && (
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 whitespace-pre-wrap">
                {vpsRunOutput}
              </div>
            )}

            {mentorReview && (
              <div className="p-3.5 rounded-lg bg-sky-500/10 border border-sky-500/30 text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                <strong className="block text-sky-600 dark:text-sky-400 mb-1">
                  Сократовский архитектурный ревьюер:
                </strong>
                {mentorReview}
              </div>
            )}
          </div>

          {/* Socratic Code Defense Card */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              Защита понимания архитектуры (Анти-Зубрёжка)
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {currentTask.socraticDefense.question}
            </p>
            <div className="space-y-2">
              {currentTask.socraticDefense.options.map((opt) => {
                const isPicked = selectedDefenseOption === opt.id;
                return (
                  <div key={opt.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedDefenseOption(opt.id)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition-colors cursor-pointer ${
                        isPicked
                          ? opt.isCorrect
                            ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-white font-semibold'
                            : 'bg-rose-500/10 border-rose-500/40 text-slate-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                      }`}
                    >
                      {opt.text}
                    </button>
                    {isPicked && (
                      <div className="mt-1.5 px-3 py-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/60 rounded">
                        {opt.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
