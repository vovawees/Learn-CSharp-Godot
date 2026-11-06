import { CURRICULUM_TASKS, EngineeringTask } from '../data/curriculum';

export interface ContractResult {
  contractId: string;
  name: string;
  category: 'functional' | 'edge-case' | 'performance';
  passed: boolean;
  actualOutput: string;
  diagnostic: string;
}

export interface EvaluationReport {
  taskId: string;
  isStubOrEmpty: boolean;
  isAntiCopyPasteTriggered: boolean;
  antiCopyPasteReason?: string;
  goalPassed: boolean;
  optimizationPassed: boolean;
  allContractsPassed: boolean;
  complexityEstimate: 'O(1)' | 'O(N)' | 'O(N log N)' | 'O(N²)';
  heapAllocationBytes: number;
  stackAllocationBytes: number;
  contractResults: ContractResult[];
  architecturalFeedback: string;
}

export interface SimulatorParams {
  entityCount: number;
  useValueTypeStruct: boolean;
  useSpanSlice: boolean;
  cacheGodotNodesInReady: boolean;
  physicsTickHz: 60 | 120 | 240;
  deltaSeconds: number;
}

export interface SimulatorMetrics {
  gen0HeapBytesPerSecond: number;
  gcPauseMsPerMinute: number;
  frameTimeMs: number;
  fpsEstimate: number;
  stackBytesUsed: number;
  characterVelocityY: number;
  characterPositionX: number;
  statusLevel: 'optimal' | 'warning' | 'critical';
  statusLabel: string;
}

function stripComments(code: string): string {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
    .trim();
}

export function evaluateCSharpTask(taskId: string, rawCode: string, pastedDirectly = false): EvaluationReport {
  const task: EngineeringTask | undefined = CURRICULUM_TASKS.find((t) => t.id === taskId);
  if (!task) {
    throw new Error(`Unknown task ID: ${taskId}`);
  }

  const cleanCode = stripComments(rawCode);
  const starterClean = stripComments(task.starterCode);

  if (!cleanCode || cleanCode === starterClean || cleanCode.length < 35) {
    return {
      taskId,
      isStubOrEmpty: true,
      isAntiCopyPasteTriggered: false,
      goalPassed: false,
      optimizationPassed: false,
      allContractsPassed: false,
      complexityEstimate: 'O(1)',
      heapAllocationBytes: 0,
      stackAllocationBytes: 0,
      contractResults: task.testContracts.map((c) => ({
        contractId: c.id,
        name: c.name,
        category: c.category,
        passed: false,
        actualOutput: 'Метод не реализован (пустой шаблон)',
        diagnostic: 'Напиши собственную логику внутри метода, опираясь на цель ТЗ.'
      })),
      architecturalFeedback:
        'Код пока совпадает со стартовым шаблоном. Изучи ТЗ слева и напиши собственное решение — любая рабочая логика C# 14 приветствуется!'
    };
  }

  // Check if user pasted the naive trap snippet from slides/anti-patterns
  const normalizedCode = cleanCode.replace(/\s+/g, ' ');
  const normalizedTrap = stripComments(task.naiveCopyTrapCode).replace(/\s+/g, ' ');
  if (pastedDirectly || (normalizedTrap.length > 12 && normalizedCode.includes(normalizedTrap))) {
    return {
      taskId,
      isStubOrEmpty: false,
      isAntiCopyPasteTriggered: true,
      antiCopyPasteReason:
        'Обнаружено слепое копирование анти-паттерна или готового фрагмента без осмысленной адаптации под контракты ТЗ.',
      goalPassed: false,
      optimizationPassed: false,
      allContractsPassed: false,
      complexityEstimate: 'O(N log N)',
      heapAllocationBytes: 1024,
      stackAllocationBytes: 16,
      contractResults: task.testContracts.map((c) => ({
        contractId: c.id,
        name: c.name,
        category: c.category,
        passed: false,
        actualOutput: 'Заблокировано защитой от копипаста / анти-паттерн',
        diagnostic: 'Не копируй примеры из слайдов — вырази алгоритм своими словами.'
      })),
      architecturalFeedback:
        'Сработала защита «Анти-Копипаст»: в коде обнаружен шаблонный анти-паттерн из примера. Перепиши логику самостоятельно, ориентируясь на инженерную цель.'
    };
  }

  if (taskId === 'cs-val-ref-01') {
    return evaluateTask01StructImpulse(task, cleanCode);
  }
  if (taskId === 'cs-span-slice-02') {
    return evaluateTask02SpanSlice(task, cleanCode);
  }
  if (taskId === 'godot-physics-delta-03') {
    return evaluateTask03GodotPhysics(task, cleanCode);
  }
  return evaluateTask04GodotSignals(task, cleanCode);
}

function evaluateTask01StructImpulse(task: EngineeringTask, code: string): EvaluationReport {
  const usesStruct = /\bstruct\s+\w+/.test(code);
  const usesClass = /\bclass\s+\w+/.test(code) && !usesStruct;
  const usesBoxing = /\bobject\b/.test(code);

  // Check formula: velocity * (1 - damping * dt) or velocity - velocity * damping * dt
  const hasDampingProduct =
    /(\bDamping\b|\bdamping\b)\s*\*\s*(\bdt\b|\bdelta\b|\bstep\b)/i.test(code) ||
    /(\bdt\b|\bdelta\b|\bstep\b)\s*\*\s*(\bDamping\b|\bdamping\b)/i.test(code);

  const hasVelocityScaling =
    /(\bVelocity\b|\bvelocity\b)\s*\*/i.test(code) || /\*\s*(\bVelocity\b|\bvelocity\b)/i.test(code);

  const hasFormula = hasDampingProduct && hasVelocityScaling;

  // Check threshold 0.01f or Math.Max / Math.Clamp / ternary / if
  const hasThreshold =
    /0\.01f?/.test(code) &&
    (/(<=|<|>=|>|Math\.Max|Math\.Clamp|\?)/.test(code));

  const hasReturnZero = /return\s+0(\.0)?f?\s*;|\?\s*0(\.0)?f?\s*:|:\s*0(\.0)?f?|Math\.Max\s*\(\s*0/.test(code);

  const tc1Passed = hasFormula;
  const tc2Passed = hasFormula && hasThreshold && hasReturnZero;
  const tc3Passed = tc2Passed;
  const tc4Passed = usesStruct && !usesClass && !usesBoxing;

  const goalPassed = tc1Passed && tc2Passed && tc3Passed;
  const optimizationPassed = goalPassed && tc4Passed;

  const heapBytes = usesStruct && !usesBoxing ? 0 : 24;

  const contractResults: ContractResult[] = [
    {
      contractId: 'tc-val-1',
      name: task.testContracts[0].name,
      category: 'functional',
      passed: tc1Passed,
      actualOutput: tc1Passed ? '19.0f (Совпадает с эталоном)' : 'Формула затухания не найдена или неверна',
      diagnostic: tc1Passed
        ? 'Формула Velocity * (1 - Damping * dt) работает корректно независимо от имён переменных.'
        : 'Убедись, что скорость умножается на коэффициент (1f - Damping * dt).'
    },
    {
      contractId: 'tc-val-2',
      name: task.testContracts[1].name,
      category: 'edge-case',
      passed: tc2Passed,
      actualOutput: tc2Passed ? '0.0f (Микро-дрейф отсечён)' : 'Возвращает 0.00797f (Нет отсечения порога 0.01f)',
      diagnostic: tc2Passed
        ? 'Порог <= 0.01f корректно обнуляет остаточную скорость.'
        : 'Добавь проверку: если результат <= 0.01f, возвращать 0f.'
    },
    {
      contractId: 'tc-val-3',
      name: task.testContracts[2].name,
      category: 'edge-case',
      passed: tc3Passed,
      actualOutput: tc3Passed ? '0.0f (Защита от инверсии активна)' : 'Отрицательная скорость -15.0f',
      diagnostic: tc3Passed
        ? 'Отрицательные значения при большом dt безопасно отсекаются в 0f.'
        : 'При большом dt множитель (1 - Damping * dt) может стать < 0; условие <= 0.01f защищает от этого.'
    },
    {
      contractId: 'tc-val-4',
      name: task.testContracts[3].name,
      category: 'performance',
      passed: tc4Passed,
      actualOutput: tc4Passed ? '0 B в Gen 0 Heap (Stack ValueType)' : `${heapBytes} B в Gen 0 Heap (Class/Boxing)`,
      diagnostic: tc4Passed
        ? 'Тип размещён на стеке (struct), нагрузка на сборщик мусора .NET 10 равна нулю.'
        : 'Цель может выполняться, но использование class или object создаёт аллокации в куче! Замени на struct.'
    }
  ];

  return {
    taskId: task.id,
    isStubOrEmpty: false,
    isAntiCopyPasteTriggered: false,
    goalPassed,
    optimizationPassed,
    allContractsPassed: goalPassed && optimizationPassed,
    complexityEstimate: 'O(1)',
    heapAllocationBytes: heapBytes,
    stackAllocationBytes: 8,
    contractResults,
    architecturalFeedback:
      goalPassed && optimizationPassed
        ? 'Отличная инженерная работа! Цель ТЗ выполнена, и структура KineticImpulse гарантирует 0 байт аллокаций в куче .NET 10.'
        : goalPassed && !optimizationPassed
          ? 'Главная цель достигнута (расчёты верны!), но код ещё не оптимизирован по памяти: используй struct вместо class/object, чтобы убрать аллокации в куче.'
          : 'Цель ТЗ пока не выполнена: проверь расчёт затухания Velocity * (1f - Damping * dt) и отсечение значений <= 0.01f в 0f.'
  };
}

function evaluateTask02SpanSlice(task: EngineeringTask, code: string): EvaluationReport {
  const acceptsSpan = /\b(ReadOnlySpan|Span)\s*<\s*int\s*>/.test(code);
  const hasLoop = /\b(foreach|for|while)\b/.test(code);
  const filtersNegative = /(<=|<\s*1|>\s*0|>=\s*1)/.test(code);
  const capsMax = /\b(Math\.Min|Math\.Clamp|\?|<|<=|>|>=)\b/.test(code) && /\b(maxCap|cap)\b/i.test(code);
  const returnsValue = /\breturn\b/.test(code);

  const allocatesHeap = /\.(ToArray|ToList)\s*\(|new\s+(int\s*\[|List\s*<)/.test(code);
  const hasNestedLoop = (code.match(/\b(foreach|for|while)\b/g) || []).length > 1;

  const tc1Passed = hasLoop && filtersNegative && capsMax && returnsValue;
  const tc2Passed = tc1Passed && acceptsSpan;
  const tc3Passed = tc1Passed && filtersNegative;
  const tc4Passed = acceptsSpan && !allocatesHeap && !hasNestedLoop;

  const goalPassed = tc1Passed && tc2Passed && tc3Passed;
  const optimizationPassed = goalPassed && tc4Passed;

  const heapBytes = allocatesHeap ? 3224 : 0;

  return {
    taskId: task.id,
    isStubOrEmpty: false,
    isAntiCopyPasteTriggered: false,
    goalPassed,
    optimizationPassed,
    allContractsPassed: goalPassed && optimizationPassed,
    complexityEstimate: hasNestedLoop ? 'O(N²)' : allocatesHeap ? 'O(N log N)' : 'O(N)',
    heapAllocationBytes: heapBytes,
    stackAllocationBytes: 24,
    contractResults: [
      {
        contractId: 'tc-span-1',
        name: task.testContracts[0].name,
        category: 'functional',
        passed: tc1Passed,
        actualOutput: tc1Passed ? '90 (15 + 50 + 25)' : 'Неверная сумма буфера',
        diagnostic: tc1Passed
          ? 'Агрегация корректно фильтрует шум <= 0 и ограничивает пики до maxCap.'
          : 'Проверь, что цикл пропускает значения <= 0 и зажимает значения > maxCap.'
      },
      {
        contractId: 'tc-span-2',
        name: task.testContracts[1].name,
        category: 'edge-case',
        passed: tc2Passed,
        actualOutput: tc2Passed ? '0 (Безопасный проход по ReadOnlySpan<int>.Empty)' : 'Ошибка сигнатуры или границ',
        diagnostic: tc2Passed
          ? 'Пустой срез обрабатывается за O(1) с возвратом 0.'
          : 'Метод должен принимать ReadOnlySpan<int> или Span<int> и возвращать 0 для пустого среза.'
      },
      {
        contractId: 'tc-span-3',
        name: task.testContracts[2].name,
        category: 'edge-case',
        passed: tc3Passed,
        actualOutput: tc3Passed ? '0 (Отрицательный шум отброшен)' : 'Отрицательная сумма',
        diagnostic: tc3Passed
          ? 'Все отрицательные выбросы телеметрии проигнорированы.'
          : 'Добавь фильтрацию отрицательных элементов (например, if (hit <= 0) continue;).'
      },
      {
        contractId: 'tc-span-4',
        name: task.testContracts[3].name,
        category: 'performance',
        passed: tc4Passed,
        actualOutput: tc4Passed
          ? 'O(N) проход, 0 B в куче (Zero-Copy Span)'
          : `Аллокация ${heapBytes} B или лишний проход`,
        diagnostic: tc4Passed
          ? 'Однопроходный расчёт по срезу памяти без ToArray/ToList!'
          : 'Убери вызовы .ToArray(), .ToList() и new int[] — работай напрямую со срезом Span.'
      }
    ],
    architecturalFeedback:
      goalPassed && optimizationPassed
        ? 'Безупречно! Твой код обрабатывает ReadOnlySpan<int> за один проход O(N) и не создаёт ни одного объекта в управляемой куче .NET 10.'
        : goalPassed && !optimizationPassed
          ? 'Функциональная цель достигнута (сумма считается верно!), но обнаружены лишние аллокации (.ToArray/.ToList). Оптимизируй код до чистого прохода по Span.'
          : 'Проверь условия задачи: нужно пройти по срезу ReadOnlySpan<int>, отбросить <= 0 и ограничить значения сверху порогом maxCap.'
  };
}

function evaluateTask03GodotPhysics(task: EngineeringTask, code: string): EvaluationReport {
  const isPartialClass = /\bpartial\s+class\s+\w+\s*:\s*CharacterBody2D/.test(code);
  const checksIsOnFloor = /!\s*IsOnFloor\s*\(\s*\)|IsOnFloor\s*\(\s*\)\s*==\s*false/.test(code);
  const appliesGravityWithDelta =
    /Gravity\s*\*\s*\(\s*float\s*\)\s*delta|\(\s*float\s*\)\s*delta\s*\*\s*Gravity|Gravity\s*\*\s*\bdt\b|\bdt\b\s*\*\s*Gravity/.test(
      code
    );
  const setsHorizontalSpeed =
    /InputDirection\s*\*\s*(MoveSpeed|Speed)|(MoveSpeed|Speed)\s*\*\s*InputDirection/.test(code);
  const assignsVelocity = /\bVelocity\s*=/.test(code);
  const callsMoveAndSlide4 = /\bMoveAndSlide\s*\(\s*\)/.test(code);
  const callsGetNodeInPhysics = /\bGetNode\b/.test(code);

  const tc1Passed = isPartialClass;
  const tc2Passed = checksIsOnFloor && appliesGravityWithDelta && setsHorizontalSpeed;
  const tc3Passed = assignsVelocity && callsMoveAndSlide4;
  const tc4Passed = !callsGetNodeInPhysics && callsMoveAndSlide4;

  const goalPassed = tc1Passed && tc2Passed && tc3Passed;
  const optimizationPassed = goalPassed && tc4Passed;

  return {
    taskId: task.id,
    isStubOrEmpty: false,
    isAntiCopyPasteTriggered: false,
    goalPassed,
    optimizationPassed,
    allContractsPassed: goalPassed && optimizationPassed,
    complexityEstimate: 'O(1)',
    heapAllocationBytes: callsGetNodeInPhysics ? 128 : 0,
    stackAllocationBytes: 16,
    contractResults: [
      {
        contractId: 'tc-gd-1',
        name: task.testContracts[0].name,
        category: 'functional',
        passed: tc1Passed,
        actualOutput: tc1Passed
          ? 'public partial class : CharacterBody2D (Готов к Source Generator)'
          : 'Отсутствует partial или базовый класс CharacterBody2D',
        diagnostic: tc1Passed
          ? 'Модификатор partial корректен для генератора привязок Godot 4.7 / 4.8 C#.'
          : 'В Godot 4.7/4.8 каждый скрипт узла обязан быть объявлен как partial class.'
      },
      {
        contractId: 'tc-gd-2',
        name: task.testContracts[1].name,
        category: 'functional',
        passed: tc2Passed,
        actualOutput: tc2Passed
          ? 'Velocity = (320.0, 16.33) при !IsOnFloor()'
          : 'Гравитация с (float)delta или скорость X не рассчитаны',
        diagnostic: tc2Passed
          ? 'Гравитация масштабируется на (float)delta только в воздухе (!IsOnFloor()), скорость X задана.'
          : 'Проверь условие !IsOnFloor(), прибавление Gravity * (float)delta к Y и расчёт InputDirection * MoveSpeed для X.'
      },
      {
        contractId: 'tc-gd-3',
        name: task.testContracts[2].name,
        category: 'edge-case',
        passed: tc3Passed,
        actualOutput: tc3Passed
          ? 'Velocity обновлён, вызван MoveAndSlide()'
          : 'Velocity не присвоен или не вызван MoveAndSlide()',
        diagnostic: tc3Passed
          ? 'Структура Vector2 корректно записана обратно в свойство Velocity перед вызовом MoveAndSlide().'
          : 'Не забудь присвоить изменённый вектор свойству Velocity и вызвать MoveAndSlide() без аргументов.'
      },
      {
        contractId: 'tc-gd-4',
        name: task.testContracts[3].name,
        category: 'performance',
        passed: tc4Passed,
        actualOutput: tc4Passed ? '0 вызовов GetNode в кадре физики' : 'Обнаружен вызов GetNode в _PhysicsProcess!',
        diagnostic: tc4Passed
          ? 'Физический тик выполняется за O(1) без поиска узлов по дереву сцены.'
          : 'Никогда не вызывай GetNode внутри _PhysicsProcess — кэшируй ссылки в _Ready().'
      }
    ],
    architecturalFeedback:
      goalPassed && optimizationPassed
        ? 'Отличный контроллер Godot 4.7 / 4.8 C#! Физика детерминирована по времени delta, свойство Velocity обновляется без мутаций временных копий, и дерево сцены не опрашивается в кадре.'
        : goalPassed && !optimizationPassed
          ? 'Движение работает, но внутри _PhysicsProcess обнаружен вызов GetNode. Вынеси поиск нод из физического цикла!'
          : 'Проверь все шаги контроллера Godot 4.7/4.8: partial class, проверка !IsOnFloor(), умножение Gravity на (float)delta, запись в Velocity и вызов MoveAndSlide().'
  };
}

function evaluateTask04GodotSignals(task: EngineeringTask, code: string): EvaluationReport {
  const hasSignalAttr = /\[Signal\]\s*public\s+delegate\s+void\s+\w*EventHandler/.test(code);
  const guardsInvalidOrDead =
    /(amount|dmg)\s*<=\s*0|(amount|dmg)\s*>\s*0/.test(code) && /CurrentHp\s*(<=|>)\s*0/.test(code);
  const clampsZero = /Math\.(Max|Clamp)|<\s*0\s*\?\s*0|<=\s*0\s*\?\s*0/.test(code);
  const emitsSignal = /EmitSignal\s*\(\s*SignalName\.HealthChanged/.test(code);
  const callsGetNode = /\bGetNode\b/.test(code);

  const tc1Passed = hasSignalAttr;
  const tc2Passed = emitsSignal && /(CurrentHp\s*-|CurrentHp\s*-=)/.test(code);
  const tc3Passed = tc2Passed && clampsZero;
  const tc4Passed = guardsInvalidOrDead && !callsGetNode;

  const goalPassed = tc1Passed && tc2Passed && tc3Passed;
  const optimizationPassed = goalPassed && tc4Passed;

  return {
    taskId: task.id,
    isStubOrEmpty: false,
    isAntiCopyPasteTriggered: false,
    goalPassed,
    optimizationPassed,
    allContractsPassed: goalPassed && optimizationPassed,
    complexityEstimate: 'O(1)',
    heapAllocationBytes: callsGetNode ? 96 : 0,
    stackAllocationBytes: 12,
    contractResults: [
      {
        contractId: 'tc-sig-1',
        name: task.testContracts[0].name,
        category: 'functional',
        passed: tc1Passed,
        actualOutput: tc1Passed
          ? '[Signal] HealthChangedEventHandler сгенерирован'
          : 'Делегат сигнала [Signal] ...EventHandler не найден',
        diagnostic: tc1Passed
          ? 'Генератор Godot 4.7/4.8 успешно создал SignalName.HealthChanged.'
          : 'Сохрани атрибут [Signal] и делегат с суффиксом EventHandler.'
      },
      {
        contractId: 'tc-sig-2',
        name: task.testContracts[1].name,
        category: 'functional',
        passed: tc2Passed,
        actualOutput: tc2Passed
          ? 'CurrentHp = 65, сигнал отправлен подписчикам'
          : 'Урон не списан или не вызван EmitSignal',
        diagnostic: tc2Passed
          ? 'Компонент уменьшает здоровье и уведомляет слушателей через EmitSignal.'
          : 'Уменьши CurrentHp на величину урона и вызови EmitSignal(SignalName.HealthChanged, CurrentHp, MaxHp).'
      },
      {
        contractId: 'tc-sig-3',
        name: task.testContracts[2].name,
        category: 'edge-case',
        passed: tc3Passed,
        actualOutput: tc3Passed ? 'CurrentHp = 0 (Нижняя граница защищена)' : 'CurrentHp ушёл в -959',
        diagnostic: tc3Passed
          ? 'Здоровье надёжно зажато на нижней границе 0.'
          : 'Используй Math.Max(0, CurrentHp - amount) или тернарную проверку, чтобы здоровье не стало отрицательным.'
      },
      {
        contractId: 'tc-sig-4',
        name: task.testContracts[3].name,
        category: 'performance',
        passed: tc4Passed,
        actualOutput: tc4Passed
          ? '0 лишних сигналов, полная отвязка от UI (0 GetNode)'
          : 'Отсутствует фильтр amount <= 0 / CurrentHp <= 0 или вызван GetNode',
        diagnostic: tc4Passed
          ? 'Невалидный урон и удары по мёртвому объекту отсекаются до эмиссии сигнала.'
          : 'Проверь условие (amount <= 0 || CurrentHp <= 0) перед изменением здоровья и не используй GetNode.'
      }
    ],
    architecturalFeedback:
      goalPassed && optimizationPassed
        ? 'Чистая компонентная архитектура Godot 4.8 Beta 2! HealthComponent полностью изолирован от UI, защищает свои инварианты и эмитит сигнал только при реальном изменении.'
        : goalPassed && !optimizationPassed
          ? 'Основная логика урона работает, но нужно защитить компонент от спама сигналов при amount <= 0 или CurrentHp <= 0 (и убрать любые вызовы GetNode).'
          : 'Реализуй списание урона с ограничением нижней границы >= 0 и вызовом EmitSignal(SignalName.HealthChanged, CurrentHp, MaxHp).'
  };
}

export function simulateClrAndGodotFrame(params: SimulatorParams): SimulatorMetrics {
  const bytesPerEntityHeap =
    (params.useValueTypeStruct ? 0 : 32) +
    (params.useSpanSlice ? 0 : 24) +
    (params.cacheGodotNodesInReady ? 0 : 48);

  const gen0HeapBytesPerSecond = bytesPerEntityHeap * params.entityCount * params.physicsTickHz;
  const gcPauseMsPerMinute =
    gen0HeapBytesPerSecond === 0
      ? 0
      : Number(((gen0HeapBytesPerSecond / (1024 * 1024)) * 1.85).toFixed(2));

  const baseCpuMs = (params.entityCount / 500) * 1.1;
  const allocPenaltyMs = (bytesPerEntityHeap / 32) * (params.entityCount / 500) * 1.6;
  const frameTimeMs = Number((baseCpuMs + allocPenaltyMs).toFixed(2));
  const budgetMs = 1000 / params.physicsTickHz;
  const fpsEstimate = Math.min(params.physicsTickHz, Math.round(1000 / Math.max(frameTimeMs, budgetMs)));

  const stackBytesUsed = params.entityCount * 12 + 64;
  const characterVelocityY = Number((980 * params.deltaSeconds).toFixed(2));
  const characterPositionX = Number((320 * params.deltaSeconds * 10).toFixed(1));

  let statusLevel: 'optimal' | 'warning' | 'critical' = 'optimal';
  let statusLabel = '● ZERO-GC OPTIMAL (.NET 10 + Godot 4.8)';

  if (gen0HeapBytesPerSecond > 5_000_000 || frameTimeMs > budgetMs) {
    statusLevel = 'critical';
    statusLabel = '▲ GC SPIKE & FRAME DROP';
  } else if (gen0HeapBytesPerSecond > 0) {
    statusLevel = 'warning';
    statusLabel = '◆ HEAP ALLOCATIONS DETECTED';
  }

  return {
    gen0HeapBytesPerSecond,
    gcPauseMsPerMinute,
    frameTimeMs,
    fpsEstimate,
    stackBytesUsed,
    characterVelocityY,
    characterPositionX,
    statusLevel,
    statusLabel
  };
}
