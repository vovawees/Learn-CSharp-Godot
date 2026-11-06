import React, { useState } from 'react';
import { simulateClrAndGodotFrame, SimulatorParams } from '../engine/csharpEvaluator';

export const ClrGodotSimulator: React.FC = () => {
  const [params, setParams] = useState<SimulatorParams>({
    entityCount: 1000,
    useValueTypeStruct: true,
    useSpanSlice: true,
    cacheGodotNodesInReady: true,
    physicsTickHz: 120,
    deltaSeconds: 0.0083
  });

  const [stepCount, setStepCount] = useState<number>(1);
  const metrics = simulateClrAndGodotFrame(params);

  const handleStepSimulation = () => {
    setStepCount((prev) => prev + 1);
  };

  const handleResetSimulation = () => {
    setStepCount(1);
    setParams({
      entityCount: 1000,
      useValueTypeStruct: true,
      useSpanSlice: true,
      cacheGodotNodesInReady: true,
      physicsTickHz: 120,
      deltaSeconds: 0.0083
    });
  };

  const heapMegabytesPerSec = (metrics.gen0HeapBytesPerSecond / (1024 * 1024)).toFixed(2);
  const frameBudgetMs = (1000 / params.physicsTickHz).toFixed(2);

  return (
    <section className="max-w-[1360px] mx-auto px-4 sm:px-6 py-8">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
            Интерактивный стенд памяти .NET 10 CLR и физического кадра Godot 4.7 Stable / 4.8 Beta 2
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
            Визуальная симуляция Стека, Кучи и Дерева Сцены
          </h1>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
          <span>Тик симуляции: #{stepCount}</span>
          <span aria-hidden="true">·</span>
          <span
            className={`font-semibold ${
              metrics.statusLevel === 'optimal'
                ? 'text-emerald-600 dark:text-emerald-400'
                : metrics.statusLevel === 'warning'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {metrics.statusLabel}
          </span>
        </div>
      </div>

      {/* Two-Zone Sandbox Layout: Left 65% Interactive Stage, Right 35% Control & Concept Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Zone: Interactive Visual Stage */}
        <div className="lg:col-span-8 space-y-6">
          {/* KPI Telemetry Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Аллокации Gen 0 / сек</div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {heapMegabytesPerSec} МБ/с
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {params.useValueTypeStruct && params.useSpanSlice ? '● 0 B мусора' : '▲ Нагрузка на GC'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Время кадра (CPU)</div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {metrics.frameTimeMs} мс
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Бюджет: {frameBudgetMs} мс ({params.physicsTickHz} Гц)
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Паузы GC Stop-The-World</div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {metrics.gcPauseMsPerMinute} мс/мин
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Стек: {(metrics.stackBytesUsed / 1024).toFixed(1)} КБ
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-xs text-slate-500 dark:text-slate-400">Вектор скорости Godot</div>
              <div className="mt-1 text-xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
                Vy: +{metrics.characterVelocityY}
              </div>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Смещение X: {metrics.characterPositionX} px
              </div>
            </div>
          </div>

          {/* Visual Stack vs Managed Heap Architecture Diagram */}
          <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-display">
                Карта памяти потока .NET 10 CLR и Узлов Godot 4.8
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Активных сущностей: {params.entityCount} · Delta: {params.deltaSeconds}s
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Stack Visualizer */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-sky-600 dark:text-sky-400">
                    Стек потока (CPU Thread Stack — O(1))
                  </span>
                  <span className="text-xs font-mono text-slate-500">RSP Pointer</span>
                </div>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2.5 rounded bg-sky-500/10 border border-sky-500/30 flex justify-between">
                    <span>double delta (Godot 4.8)</span>
                    <span className="text-sky-600 dark:text-sky-300">{params.deltaSeconds} (8 B)</span>
                  </div>
                  <div className="p-2.5 rounded bg-sky-500/10 border border-sky-500/30 flex justify-between">
                    <span>
                      {params.useValueTypeStruct ? 'readonly struct KineticImpulse' : 'ImpulseClass* refPtr'}
                    </span>
                    <span className="text-sky-600 dark:text-sky-300">
                      {params.useValueTypeStruct ? 'Inline Value (8 B)' : '0x7FA0480 (Pointer)'}
                    </span>
                  </div>
                  <div className="p-2.5 rounded bg-sky-500/10 border border-sky-500/30 flex justify-between">
                    <span>
                      {params.useSpanSlice ? 'ReadOnlySpan<int> slice' : 'int[] copyArrayRef'}
                    </span>
                    <span className="text-sky-600 dark:text-sky-300">
                      {params.useSpanSlice ? 'ref T + Length (16 B)' : 'Heap Array Ref (8 B)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Managed Heap Visualizer */}
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    Управляемая Куча (Gen 0 Managed Heap)
                  </span>
                  <span className="text-xs font-mono text-slate-500">GC Tracker</span>
                </div>
                {metrics.gen0HeapBytesPerSecond === 0 ? (
                  <div className="p-6 text-center rounded border border-emerald-500/30 bg-emerald-500/5">
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      ● 0 новых объектов в Gen 0 Heap
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      Все временные расчёты кадра выполняются на стеке и в кэшированных структурах. Сборщик мусора не вызывается.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 font-mono text-xs">
                    {!params.useValueTypeStruct && (
                      <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 flex justify-between">
                        <span>new ImpulseClass[{params.entityCount}]</span>
                        <span className="text-rose-600 dark:text-rose-300">
                          +{(params.entityCount * 32) / 1000} КБ / кадр
                        </span>
                      </div>
                    )}
                    {!params.useSpanSlice && (
                      <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/30 flex justify-between">
                        <span>LINQ .Where().ToArray()</span>
                        <span className="text-amber-600 dark:text-amber-300">
                          +{(params.entityCount * 24) / 1000} КБ / кадр
                        </span>
                      </div>
                    )}
                    {!params.cacheGodotNodesInReady && (
                      <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/30 flex justify-between">
                        <span>GetNode(&quot;Sprite2D&quot;) NodePath Alloc</span>
                        <span className="text-rose-600 dark:text-rose-300">
                          +{(params.entityCount * 48) / 1000} КБ / кадр
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Godot 4.8 CharacterBody2D Vector & SceneTree Preview */}
            <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-white">
                  Траектория узла CharacterBody2D._PhysicsProcess(double delta)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleStepSimulation}
                    className="px-3 py-1.5 text-xs font-semibold rounded-md bg-sky-600 text-white hover:bg-sky-500 transition-colors cursor-pointer"
                  >
                    Шаг физики (+1 кадр)
                  </button>
                  <button
                    type="button"
                    onClick={handleResetSimulation}
                    className="px-3 py-1.5 text-xs font-medium rounded-md border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Сброс параметров
                  </button>
                </div>
              </div>

              <div className="w-full h-24 rounded-lg bg-slate-900 border border-slate-800 relative overflow-hidden flex items-center px-6">
                <div className="text-xs font-mono text-slate-400 z-10">
                  Позиция X: {((stepCount * metrics.characterPositionX) % 600).toFixed(1)} px · Скорость Y:{' '}
                  {(stepCount * metrics.characterVelocityY).toFixed(1)} px/s · Вызов: MoveAndSlide()
                </div>
                <div
                  className="w-8 h-8 rounded-lg bg-sky-500/30 border-2 border-sky-400 flex items-center justify-center text-xs font-mono font-bold text-sky-200 transition-transform duration-150"
                  style={{
                    transform: `translateX(${Math.min(280, (stepCount * 28) % 280)}px)`
                  }}
                >
                  P2D
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Zone: Control & Concept Deck */}
        <div className="lg:col-span-4 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white font-display">
              Панель параметров движка
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Переключай архитектурные решения и наблюдай за откликом памяти .NET 10 и кадра Godot 4.8.
            </p>
          </div>

          {/* Labeled Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <label htmlFor="slider-entities" className="text-slate-700 dark:text-slate-300">
                  Количество активных узлов/снарядов:
                </label>
                <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">
                  {params.entityCount} шт.
                </span>
              </div>
              <input
                id="slider-entities"
                type="range"
                min={100}
                max={5000}
                step={100}
                value={params.entityCount}
                onChange={(e) => setParams({ ...params, entityCount: Number(e.target.value) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1.5">
                <label htmlFor="slider-delta" className="text-slate-700 dark:text-slate-300">
                  Шаг физики (double delta):
                </label>
                <span className="font-mono tabular-nums text-sky-600 dark:text-sky-400">
                  {params.deltaSeconds} сек
                </span>
              </div>
              <input
                id="slider-delta"
                type="range"
                min={0.004}
                max={0.05}
                step={0.002}
                value={params.deltaSeconds}
                onChange={(e) => setParams({ ...params, deltaSeconds: Number(e.target.value) })}
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>

            <div>
              <span className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-2">
                Частота физического тика Godot (Physics Ticks per Second):
              </span>
              <div className="grid grid-cols-3 gap-2">
                {([60, 120, 240] as const).map((hz) => (
                  <button
                    key={hz}
                    type="button"
                    onClick={() =>
                      setParams({
                        ...params,
                        physicsTickHz: hz,
                        deltaSeconds: Number((1 / hz).toFixed(4))
                      })
                    }
                    className={`py-2 px-3 text-xs font-mono font-medium rounded-lg border transition-colors cursor-pointer ${
                      params.physicsTickHz === hz
                        ? 'bg-sky-600 text-white border-sky-600'
                        : 'bg-slate-50 dark:bg-slate-800/70 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {hz} Гц
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Architectural Toggles */}
          <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={params.useValueTypeStruct}
                onChange={(e) => setParams({ ...params, useValueTypeStruct: e.target.checked })}
                className="mt-1 accent-sky-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                <strong className="block text-slate-900 dark:text-white">
                  Использовать readonly struct вместо class
                </strong>
                Хранит импульсы на стеке или инлайн в массиве (0 байт в куче).
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={params.useSpanSlice}
                onChange={(e) => setParams({ ...params, useSpanSlice: e.target.checked })}
                className="mt-1 accent-sky-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                <strong className="block text-slate-900 dark:text-white">
                  Обрабатывать буфер через ReadOnlySpan&lt;T&gt;
                </strong>
                Отключает копирование массивов через LINQ .ToArray() на каждом кадре.
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={params.cacheGodotNodesInReady}
                onChange={(e) => setParams({ ...params, cacheGodotNodesInReady: e.target.checked })}
                className="mt-1 accent-sky-500"
              />
              <span className="text-xs text-slate-700 dark:text-slate-300">
                <strong className="block text-slate-900 dark:text-white">
                  Кэшировать GetNode&lt;T&gt;() один раз в _Ready()
                </strong>
                Убирает парсинг NodePath и поиск по дереву сцены внутри _PhysicsProcess.
              </span>
            </label>
          </div>
        </div>
      </div>
    </section>
  );
};
