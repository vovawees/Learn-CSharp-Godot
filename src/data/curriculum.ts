export interface WalkthroughSlide {
  id: string;
  timeLabel: string;
  title: string;
  conceptSummary: string;
  codeFocus: string;
  memoryOrEngineState: {
    stackItems: { name: string; value: string; type: string }[];
    heapItems: { addr: string; type: string; sizeBytes: number; gen: number; note: string }[];
    engineNote: string;
  };
}

export interface TestCaseContract {
  id: string;
  name: string;
  inputDescription: string;
  expectedOutputDescription: string;
  category: 'functional' | 'edge-case' | 'performance';
}

export interface EngineeringTask {
  id: string;
  moduleId: string;
  order: number;
  title: string;
  subtitle: string;
  difficulty: 'База C# 14 / .NET 10' | 'Архитектура .NET 10' | 'Godot 4.7 Stable Core' | 'Godot 4.8 Beta 2 Архитектура';
  xpReward: number;
  estimatedMinutes: number;
  gitIssueNumber: number;
  diagramImage: string;
  firstPrinciples: {
    problemStatement: string;
    whyItMatters: string;
    underTheHood: string[];
    antiCopyPasteNotice: string;
  };
  walkthroughSlides: WalkthroughSlide[];
  technicalSpec: {
    goalSummary: string;
    signatureRequirement: string;
    functionalRequirements: string[];
    optimizationRequirements: string[];
    forbiddenPatterns: { pattern: string; reason: string }[];
  };
  starterCode: string;
  naiveCopyTrapCode: string;
  referenceCleanSolution: string;
  alternativeValidSolution: string;
  testContracts: TestCaseContract[];
  socraticDefense: {
    question: string;
    options: { id: string; text: string; isCorrect: boolean; explanation: string }[];
  };
}

export interface EngineeringQuiz {
  id: string;
  title: string;
  category: 'Code Review PR' | 'Архитектурный Выбор' | 'Оптимизация .NET 10 и Кадра';
  xpReward: number;
  scenario: string;
  prDiffOrCode: string;
  question: string;
  options: {
    id: string;
    label: string;
    isCorrect: boolean;
    engineeringFeedback: string;
  }[];
}

export const CURRICULUM_TASKS: EngineeringTask[] = [
  {
    id: 'cs-val-ref-01',
    moduleId: 'mod-core-clr',
    order: 1,
    title: '01. Стек, Куча и Value Types в C# 14 / .NET 10 (struct vs class)',
    subtitle: 'Проектирование структуры физического импульса с Escape Analysis .NET 10 без аллокаций в куче',
    difficulty: 'База C# 14 / .NET 10',
    xpReward: 150,
    estimatedMinutes: 15,
    gitIssueNumber: 1,
    diagramImage: '/src/assets/images/diagram_clr_memory_architecture_1793997361706.jpg',
    firstPrinciples: {
      problemStatement:
        'В игровых циклах (120–240 FPS в Godot 4.7/4.8) создание объектов через class для временных расчётов (векторов, урона, импульсов) забивает Поколение 0 (Gen 0) кучи и вызывает паузы сборщика мусора (GC Stop-the-World).',
      whyItMatters:
        'Понимание разницы между значимыми типами (struct, размещаемыми на стеке или инлайн в массивах) и ссылочными типами (class, требующими заголовка объекта в куче + указателя) — фундамент C# 14 / .NET 10 инженера.',
      underTheHood: [
        'Стек (Stack) двигает указатель регистра RSP за 1 такт процессора и автоматически очищается при выходе из метода.',
        'Управляемая куча (Managed Heap) требует Object Header + MethodTable Pointer и последующей сборки мусора.',
        'В C# 14 / .NET 10 readonly struct и ключевое слово field позволяют писать лаконичные неизменяемые структуры без скрытых защитных копий (defensive copies).'
      ],
      antiCopyPasteNotice:
        'Система проверяет достижение инженерной цели: ты можешь назвать поля и переменные как угодно, использовать C# 14 синтаксис, switch/тернарник/Math.Clamp, но тип должен быть значимым (struct) и корректно вычислять итоговую скорость с учётом порога затухания.'
    },
    walkthroughSlides: [
      {
        id: 'sl-1',
        timeLabel: '00:00 — Проблема GC в играх',
        title: 'Почему class убивает стабильный фреймрейт',
        conceptSummary:
          'Каждое создание new ImpulseClass() в кадре выделяет память в Gen 0 Heap. При 2000 снарядов это 120 000 аллокаций в секунду.',
        codeFocus: `// ПЛОХО: Ссылочный тип для легковесных данных кадра
public class FrameImpulse {
    public float Velocity;
    public float Damping;
}`,
        memoryOrEngineState: {
          stackItems: [{ name: 'impulseRef', value: '0x7F8A10', type: 'FrameImpulse*' }],
          heapItems: [
            { addr: '0x7F8A10', type: 'FrameImpulse (Class)', sizeBytes: 24, gen: 0, note: '16B Header + 8B Payload (GC Pressure!)' }
          ],
          engineNote: 'Frame Time Spike: +4.8ms из-за сборки мусора Gen 0'
        }
      },
      {
        id: 'sl-2',
        timeLabel: '01:30 — Переход на readonly struct в .NET 10',
        title: 'Размещение данных прямо в кадре стека и регистрах CPU',
        conceptSummary:
          'Объявляя структуру (struct), мы храним значения прямо на стеке потока (или в SIMD/базовых регистрах благодаря .NET 10 Physical Promotion) без участия GC.',
        codeFocus: `// ХОРОШО: Значимый неизменяемый тип на стеке (C# 14 / .NET 10)
public readonly struct ImpulseStep(float velocity, float damping) {
    public float Velocity { get; } = velocity;
    public float Damping { get; } = damping;
}`,
        memoryOrEngineState: {
          stackItems: [
            { name: 'step.Velocity', value: '25.0f', type: 'float (4B)' },
            { name: 'step.Damping', value: '0.9f', type: 'float (4B)' }
          ],
          heapItems: [],
          engineNote: '0 байт аллокаций в куче. Стек очищается мгновенно при ret.'
        }
      },
      {
        id: 'sl-3',
        timeLabel: '03:10 — Чистая функция расчёта',
        title: 'Инженерная формула затухания импульса',
        conceptSummary:
          'Сначала выполняем бизнес-цель: вычисляем новую скорость v * (1 - damping * dt), обнуляя микро-дрейф ниже порога 0.01f.',
        codeFocus: `public float ComputeNextVelocity(float dt) {
    float next = Velocity * (1f - Damping * dt);
    return next <= 0.01f ? 0f : next;
}`,
        memoryOrEngineState: {
          stackItems: [
            { name: 'dt', value: '0.016f', type: 'float' },
            { name: 'next', value: '24.64f', type: 'float' }
          ],
          heapItems: [],
          engineNote: 'Цель достигнута + 0 аллокаций в куче (Zero-GC).'
        }
      }
    ],
    technicalSpec: {
      goalSummary:
        'Спроектировать значимый тип (struct) для расчёта затухания физического импульса за шаг времени dt с отсечением микро-скоростей.',
      signatureRequirement:
        'Структура (struct) с методом расчёта новой скорости (например, CalculateNext или StepVelocity), принимающим float dt и возвращающим float.',
      functionalRequirements: [
        'Формула затухания: новая скорость равна текущей скорости, умноженной на (1.0f - damping * dt).',
        'Если результирующая скорость меньше или равна 0.01f (или отрицательна при сильном dt), метод обязан вернуть ровно 0f, чтобы остановить бесконечный микро-дрейф физического тела.',
        'Код может использовать любой синтаксис C# 14 (primary constructor struct, readonly struct, record struct, if/else, Math.Max или тернарный оператор).'
      ],
      optimizationRequirements: [
        'Использовать struct (а не class), чтобы гарантировать 0 байт аллокаций в управляемой куче CLR.',
        'Избегать упаковки (boxing) в object и создания строк внутри расчётного метода.'
      ],
      forbiddenPatterns: [
        { pattern: 'class ', reason: 'Создаёт аллокацию в куче (Heap) вместо размещения на стеке (Stack).' },
        { pattern: 'object ', reason: 'Вызывает упаковку (boxing) значимого типа в кучу.' }
      ]
    },
    starterCode: `using System;

namespace CSharpEngineeringLab.Core
{
    // ТЗ (C# 14 / .NET 10): Спроектируй значимый тип (struct) для расчёта затухания скорости.
    // Любая твоя реализация допустима, главное — выполнить цель ТЗ:
    // 1. Формула: velocity * (1f - damping * dt)
    // 2. Если результат <= 0.01f, вернуть 0f (отсечение микро-дрейфа)
    // 3. Тип должен быть struct (без аллокаций в куче)

    public readonly struct KineticImpulse
    {
        public readonly float Velocity;
        public readonly float Damping;

        public KineticImpulse(float velocity, float damping)
        {
            Velocity = velocity;
            Damping = damping;
        }

        public float CalculateNext(float dt)
        {
            // Напиши свою логику расчёта и отсечения порога 0.01f:
            
        }
    }
}`,
    naiveCopyTrapCode: `public class FrameImpulse { public float Velocity; public float Damping; }`,
    referenceCleanSolution: `using System;

namespace CSharpEngineeringLab.Core
{
    public readonly struct KineticImpulse
    {
        public readonly float Velocity;
        public readonly float Damping;

        public KineticImpulse(float velocity, float damping)
        {
            Velocity = velocity;
            Damping = damping;
        }

        public float CalculateNext(float dt)
        {
            float factor = 1f - (Damping * dt);
            float rawVelocity = Velocity * factor;
            if (rawVelocity <= 0.01f)
            {
                return 0f;
            }
            return rawVelocity;
        }
    }
}`,
    alternativeValidSolution: `public record struct KineticImpulse(float Velocity, float Damping)
{
    public float StepVelocity(float delta) =>
        (Velocity * (1.0f - Damping * delta)) is var v && v > 0.01f ? v : 0.0f;
}`,
    testContracts: [
      {
        id: 'tc-val-1',
        name: 'Базовый расчёт затухания импульса',
        inputDescription: 'Velocity = 20.0f, Damping = 0.5f, dt = 0.1f',
        expectedOutputDescription: 'Возвращает 19.0f (20 * (1 - 0.05))',
        category: 'functional'
      },
      {
        id: 'tc-val-2',
        name: 'Отсечение микро-дрейфа (<= 0.01f)',
        inputDescription: 'Velocity = 0.008f, Damping = 0.2f, dt = 0.016f',
        expectedOutputDescription: 'Возвращает ровно 0.0f вместо 0.00797f',
        category: 'edge-case'
      },
      {
        id: 'tc-val-3',
        name: 'Защита от инверсии скорости при большом лаге кадра (dt)',
        inputDescription: 'Velocity = 10.0f, Damping = 5.0f, dt = 0.5f (1 - 2.5 < 0)',
        expectedOutputDescription: 'Не уходит в отрицательную скорость, возвращает 0.0f',
        category: 'edge-case'
      },
      {
        id: 'tc-val-4',
        name: 'Контракт памяти .NET 10 CLR (Zero Heap Allocation)',
        inputDescription: 'Инспекция типа и инструкций аллокации',
        expectedOutputDescription: 'Используется struct (ValueType), 0 байт в Gen 0 Heap',
        category: 'performance'
      }
    ],
    socraticDefense: {
      question:
        'Представь, что твоя структура KineticImpulse передаётся в метод void Log(object item). Что произойдёт в памяти CLR при отсутствии девиртуализации?',
      options: [
        {
          id: 'opt-a',
          text: 'Произойдёт упаковка (Boxing): CLR выделит новый объект в Куче (Heap) и скопирует туда поля структуры.',
          isCorrect: true,
          explanation:
            'Верно! Приведение любого значимого типа (struct) к типу object или не-обобщённому интерфейсу без ограничений обобщений (where T : struct) вызывает инструкцию IL box.'
        },
        {
          id: 'opt-b',
          text: 'Ничего, так как структура объявлена как readonly struct, она всегда остаётся только на стеке.',
          isCorrect: false,
          explanation:
            'Модификатор readonly struct защищает от скрытых защитных копий на стеке, но при приведении к типу object CLR всё равно упакует значение в кучу.'
        },
        {
          id: 'opt-c',
          text: 'Компилятор C# 14 выдаст ошибку компиляции, так как struct не наследуется от System.Object.',
          isCorrect: false,
          explanation:
            'В C# все структуры(кроме ref struct) неявно наследуются от System.ValueType -> System.Object, поэтому код скомпилируется, но вызовет скрытый boxing.'
        }
      ]
    }
  },
  {
    id: 'cs-span-slice-02',
    moduleId: 'mod-core-clr',
    order: 2,
    title: '02. C# 14 Span<T>, params ReadOnlySpan<T> и Zero-Copy Парсинг',
    subtitle: 'Высокоскоростная фильтрация пакета телеметрии/урона в одном проходе без создания промежуточных массивов',
    difficulty: 'Архитектура .NET 10',
    xpReward: 200,
    estimatedMinutes: 20,
    gitIssueNumber: 1,
    diagramImage: '/src/assets/images/diagram_clr_memory_architecture_1793997361706.jpg',
    firstPrinciples: {
      problemStatement:
        'Классические методы Substring(), Split() или LINQ .Where(...).ToArray() при разборе сетевых пакетов и буферов урона создают десятки временных массивов в куче на каждый пакет.',
      whyItMatters:
        'В C# 14 / .NET 10 ReadOnlySpan<T> и Span<T> получили первоклассную поддержку языка (неявные приведения массивов к Span, params ReadOnlySpan<T> без аллокаций). Это типобезопасное «окно» (указатель + длина) поверх любой непрерывной памяти за O(1) и 0 байт в куче.',
      underTheHood: [
        'ref struct (каким является Span<T>) гарантированно живёт только на стеке и не может утечь в кучу.',
        'Срез span.Slice(start, length) или оператор диапазона span[1..^1] не копирует элементы — он лишь смещает внутренний ref-указатель и меняет длину.',
        'Однопроходная агрегация за O(N) по ReadOnlySpan<int> в .NET 10 автоматически векторизуется JIT-компилятором (AVX2 / ARM64 NEON) и устраняет проверки границ (Bounds Check Elimination).'
      ],
      antiCopyPasteNotice:
        'Не нужно угадывать шаблонный код! Ты можешь написать цикл for, foreach, индексацию или собственную логику фильтрации — главное, чтобы метод принимал ReadOnlySpan<int> (или Span<int>), игнорировал отрицательный шум (<= 0), ограничивал пики свыше maxCap и не выделял новых массивов.'
    },
    walkthroughSlides: [
      {
        id: 'sl-span-1',
        timeLabel: '00:00 — Ловушка .Where().ToArray()',
        title: 'Скрытые аллокации при обработке массивов',
        conceptSummary:
          'Вызов LINQ и создание подмассивов копирует память в кучу при каждом кадре сетевой синхронизации.',
        codeFocus: `// ПЛОХО: Выделяет итератор и новый массив в куче
public int SumValidDamage(int[] buffer, int maxCap) =>
    buffer.Where(x => x > 0).Select(x => Math.Min(x, maxCap)).ToArray().Sum();`,
        memoryOrEngineState: {
          stackItems: [{ name: 'buffer', value: '0x50A0', type: 'int[]' }],
          heapItems: [
            { addr: '0x50A0', type: 'int[1024]', sizeBytes: 4120, gen: 0, note: 'Исходный буфер' },
            { addr: '0x6100', type: 'WhereSelectIterator', sizeBytes: 48, gen: 0, note: 'Аллокация LINQ' },
            { addr: '0x6200', type: 'int[800] Copy', sizeBytes: 3224, gen: 0, note: 'Лишняя копия ToArray()' }
          ],
          engineNote: 'Аллокация 3.3 КБ на каждый сетевой тик!'
        }
      },
      {
        id: 'sl-span-2',
        timeLabel: '01:45 — Устройство ReadOnlySpan<T> в C# 14',
        title: 'Окно поверх памяти без копирования',
        conceptSummary:
          'ReadOnlySpan<int> хранит только 2 поля на стеке: interior pointer (ref readonly int) и длину (int _length). В C# 14 в метод с params ReadOnlySpan<int> можно передавать аргументы через запятую вообще без аллокации массива!',
        codeFocus: `// ХОРОШО: Принимает любой срез памяти (массив, stackalloc, inline массив)
public static int SumNormalizedHits(ReadOnlySpan<int> hits, int maxCap)`,
        memoryOrEngineState: {
          stackItems: [
            { name: 'hits._reference', value: '&buffer[0]', type: 'ref readonly int' },
            { name: 'hits._length', value: '1024', type: 'int' }
          ],
          heapItems: [{ addr: '0x50A0', type: 'int[1024]', sizeBytes: 4120, gen: 1, note: 'Переиспользуемый буфер (0 новых аллокаций)' }],
          engineNote: 'Срез Slice() стоит 0 байт и ~1 наносекунду.'
        }
      }
    ],
    technicalSpec: {
      goalSummary:
        'Реализовать однопроходный агрегатор буфера урона по срезу памяти ReadOnlySpan<int> (или Span<int>) с фильтрацией шума и ограничением пиков (Clamping).',
      signatureRequirement:
        'Метод, принимающий ReadOnlySpan<int> (или Span<int>) и порог int maxCap, возвращающий сумму int.',
      functionalRequirements: [
        'Отрицательные или нулевые значения (<= 0) в буфере считаются сетевым шумом и должны игнорироваться.',
        'Любое положительное значение, превышающее maxCap, должно быть ограничено сверху значением maxCap (clamped) перед добавлением в сумму.',
        'Для пустого среза (Length == 0) метод должен корректно возвращать 0.'
      ],
      optimizationRequirements: [
        'Временная сложность O(N) — ровно один проход по срезу без вложенных циклов.',
        'Пространственная сложность O(1) — запрещено вызывать .ToArray(), .ToList() или new int[...] внутри метода.'
      ],
      forbiddenPatterns: [
        { pattern: 'ToArray()', reason: 'Копирует срез памяти в новый массив в управляемой куче.' },
        { pattern: 'ToList()', reason: 'Аллоцирует динамический список List<T> в куче.' }
      ]
    },
    starterCode: `using System;

namespace CSharpEngineeringLab.Memory
{
    public static class TelemetryBufferProcessor
    {
        // ТЗ (C# 14 / .NET 10): Вычисли суммарный валидный урон из среза памяти ReadOnlySpan<int>:
        // 1. Значения <= 0 игнорируются (шум).
        // 2. Значения > maxCap ограничиваются до maxCap.
        // 3. Реализуй за O(N) и 0 аллокаций в куче (любым удобным способом: foreach / for / Math.Min / тернарник).
        public static int SumNormalizedHits(ReadOnlySpan<int> hits, int maxCap)
        {
            
        }
    }
}`,
    naiveCopyTrapCode: `buffer.Where(x => x > 0).Select(x => Math.Min(x, maxCap)).ToArray().Sum();`,
    referenceCleanSolution: `using System;

namespace CSharpEngineeringLab.Memory
{
    public static class TelemetryBufferProcessor
    {
        public static int SumNormalizedHits(ReadOnlySpan<int> hits, int maxCap)
        {
            int total = 0;
            foreach (int hit in hits)
            {
                if (hit <= 0) continue;
                total += hit > maxCap ? maxCap : hit;
            }
            return total;
        }
    }
}`,
    alternativeValidSolution: `public static int SumNormalizedHits(ReadOnlySpan<int> span, int cap)
{
    var acc = 0;
    for (int i = 0; i < span.Length; i++)
    {
        int val = span[i];
        if (val > 0) acc += Math.Min(val, cap);
    }
    return acc;
}`,
    testContracts: [
      {
        id: 'tc-span-1',
        name: 'Суммирование с фильтрацией шума и ограничением пиков',
        inputDescription: 'hits = [15, -4, 0, 80, 25], maxCap = 50',
        expectedOutputDescription: 'Возвращает 90 (15 + 50 + 25; -4 и 0 отброшены, 80 зажато до 50)',
        category: 'functional'
      },
      {
        id: 'tc-span-2',
        name: 'Обработка пустого среза ReadOnlySpan<int>.Empty',
        inputDescription: 'hits = [], maxCap = 100',
        expectedOutputDescription: 'Возвращает 0 без IndexOutOfRangeException',
        category: 'edge-case'
      },
      {
        id: 'tc-span-3',
        name: 'Буфер только из отрицательного шума',
        inputDescription: 'hits = [-10, -1, 0], maxCap = 50',
        expectedOutputDescription: 'Возвращает 0',
        category: 'edge-case'
      },
      {
        id: 'tc-span-4',
        name: 'Аудит сложности O(N) и отсутствия копирования в кучу',
        inputDescription: 'Статический анализ AST на отсутствие ToArray/ToList/new[]',
        expectedOutputDescription: 'Один проход O(N), 0 аллокаций в куче',
        category: 'performance'
      }
    ],
    socraticDefense: {
      question:
        'Почему компилятор C# 14 запретит тебе сохранить ReadOnlySpan<int> в качестве поля обычного класса или использовать его между вызовами await в async-методе?',
      options: [
        {
          id: 'opt-s1',
          text: 'Потому что Span<T> — это ref struct, который может указывать на память стека; если унести его в кучу (в поле класса или стейт-машину async), указатель станет висячим (dangling pointer) после выхода из фрейма стека.',
          isCorrect: true,
          explanation:
            'Точно в цель! Стейт-машина async при приостановке на await переезжает в кучу, а фрейм стека уничтожается. Если бы Span указывал на stackalloc-буфер, он бы указывал на уже освобождённую память стека.'
        },
        {
          id: 'opt-s2',
          text: 'Потому что ReadOnlySpan<int> не сериализуется в JSON по умолчанию.',
          isCorrect: false,
          explanation:
            'Ограничение связано не с сериализацией, а с безопасностью памяти (Memory Safety) и временем жизни стекового фрейма.'
        },
        {
          id: 'opt-s3',
          text: 'Это ограничение старых версий .NET, в C# 14 Span можно хранить в полях любых классов в куче.',
          isCorrect: false,
          explanation:
            'Даже в C# 14 / .NET 10 ref struct никогда не может быть полем обычного класса в куче — только полем другого ref struct на стеке.'
        }
      ]
    }
  },
  {
    id: 'godot-physics-delta-03',
    moduleId: 'mod-godot-core',
    order: 3,
    title: '03. Godot 4.7 Stable C#: _PhysicsProcess, Delta и MoveAndSlide',
    subtitle: 'Разработка детерминированного контроллера CharacterBody2D с кэшированием нод и защитой от фрейм-зависимости',
    difficulty: 'Godot 4.7 Stable Core',
    xpReward: 250,
    estimatedMinutes: 25,
    gitIssueNumber: 2,
    diagramImage: '/src/assets/images/diagram_godot_scene_architecture_1793997363445.jpg',
    firstPrinciples: {
      problemStatement:
        'Две главные ошибки новичков в Godot 4.7 C#: 1) вызов GetNode<T>() внутри _Process/_PhysicsProcess на каждом кадре и 2) прямое изменение Velocity без умножения ускорения/гравитации на (float)delta.',
      whyItMatters:
        'В Godot 4.7 Stable и 4.8 Beta 2 метод _PhysicsProcess(double delta) передаёт delta как double (для высокой точности таймера движка), тогда как векторы Vector2 хранят координаты во float. Кроме того, Velocity — это свойство самого CharacterBody2D, а MoveAndSlide() использует внутренний Velocity и Jolt/Godot Physics2D.',
      underTheHood: [
        'В Godot 4.7/4.8 C# класс узла обязан иметь модификатор partial (`public partial class Player : CharacterBody2D`), чтобы Roslyn Source Generator сгенерировал высокоскоростной мост к C++ ядру без рефлексии.',
        'Вызов GetNode<Sprite2D>("Sprite2D") парсит NodePath и ищет узел в дереве сцены — делай это 1 раз в _Ready() и сохраняй в приватное поле.',
        'При изменении структуры Vector2 Velocity нельзя писать `Velocity.Y += ...` напрямую к свойству — нужно прочитать `Vector2 v = Velocity;`, изменить компоненты, присвоить `Velocity = v;` и вызвать `MoveAndSlide()`.'
      ],
      antiCopyPasteNotice:
        'Не копируй слепо чужие туториалы! Реализуй контроллер для Godot 4.7/4.8 C# своим стилем: главное — класс должен быть partial, применять гравитацию с учётом (float)delta, когда персонаж не на полу (!IsOnFloor()), обновлять свойство Velocity и вызывать MoveAndSlide().'
    },
    walkthroughSlides: [
      {
        id: 'sl-gd-1',
        timeLabel: '00:00 — Архитектура Godot 4.7 Stable / 4.8 Beta 2 C#',
        title: 'Почему public partial class и MoveAndSlide() без параметров',
        conceptSummary:
          'В Godot 4.7/4.8 C# (.NET 10) используется Roslyn Source Generators. Поэтому каждый скрипт узла обязан быть partial.',
        codeFocus: `using Godot;

// Обязательно partial для генератора привязок Godot 4.7 / 4.8!
public partial class PlayerController : CharacterBody2D
{
    [Export] public float Gravity { get; set; } = 980.0f;
    [Export] public float MoveSpeed { get; set; } = 320.0f;
}`,
        memoryOrEngineState: {
          stackItems: [{ name: 'delta', value: '0.0166667 (double)', type: 'double (8B)' }],
          heapItems: [{ addr: '0x9010', type: 'CharacterBody2D (C++ GDExtension/Peer)', sizeBytes: 64, gen: 2, note: 'Кэшированный управляемый пир' }],
          engineNote: 'Source Generator создаёт табличный маппинг свойств [Export] на этапе компиляции.'
        }
      },
      {
        id: 'sl-gd-2',
        timeLabel: '02:15 — Модификация Vector2 Velocity в C# 14',
        title: 'Как правильно менять структуру Vector2 через свойство',
        conceptSummary:
          'Так как Vector2 в C# — это struct, а Velocity — свойство с геттером и сеттером, мы копируем его в локальную переменную на стеке, модифицируем и записываем обратно.',
        codeFocus: `public override void _PhysicsProcess(double delta)
{
    float dt = (float)delta;
    Vector2 velocity = Velocity;

    if (!IsOnFloor())
        velocity.Y += Gravity * dt;

    velocity.X = InputDirection * MoveSpeed;
    Velocity = velocity;
    MoveAndSlide();
}`,
        memoryOrEngineState: {
          stackItems: [
            { name: 'dt', value: '0.0166f', type: 'float' },
            { name: 'velocity', value: '(320.0, 16.33)', type: 'Vector2 struct' }
          ],
          heapItems: [],
          engineNote: 'MoveAndSlide() читает свойство Velocity и разрешает коллизии со скольжением.'
        }
      }
    ],
    technicalSpec: {
      goalSummary:
        'Написать скрипт узла CharacterBody2D для Godot 4.7/4.8 C#, реализующий физический шаг с гравитацией, горизонтальным движением и вызовом MoveAndSlide().',
      signatureRequirement:
        'public partial class, наследующий CharacterBody2D, с переопределением _PhysicsProcess(double delta).',
      functionalRequirements: [
        'Класс должен быть объявлен с ключевым словом partial (требование Source Generator в Godot 4.7 / 4.8 C#).',
        'При отсутствии контакта с полом (!IsOnFloor()) вертикальная скорость Y должна увеличиваться на Gravity * (float)delta.',
        'Горизонтальная скорость X должна вычисляться как InputDirection * MoveSpeed.',
        'Итоговый вектор должен записываться в свойство Velocity, после чего вызывается MoveAndSlide() без аргументов.'
      ],
      optimizationRequirements: [
        'Запрещено вызывать GetNode внутри _PhysicsProcess (узлы должны кэшироваться в _Ready).',
        'Приводить double delta к float без лишних аллокаций.'
      ],
      forbiddenPatterns: [
        { pattern: 'MoveAndSlide(velocity', reason: 'Устаревший API Godot 3! В Godot 4.7/4.8 MoveAndSlide() не принимает вектор и использует свойство Velocity.' },
        { pattern: 'GetNode', reason: 'Вызов GetNode внутри _PhysicsProcess приводит к дорогому поиску по дереву сцены на каждом физическом тике.' }
      ]
    },
    starterCode: `using Godot;

namespace CSharpEngineeringLab.GodotEngine
{
    // ТЗ (Godot 4.7 Stable / 4.8 Beta 2 C#):
    // 1. Убедись, что класс объявлен как partial и наследует CharacterBody2D.
    // 2. В _PhysicsProcess(double delta) примени гравитацию к оси Y, если !IsOnFloor(), умножая Gravity на (float)delta.
    // 3. Задай горизонтальную скорость по оси X равной InputDirection * MoveSpeed.
    // 4. Сохрани вектор в Velocity и вызови MoveAndSlide() (API Godot 4.7/4.8 без аргументов).
    // 5. Не вызывай GetNode внутри физического цикла!

    public partial class KineticCharacter : CharacterBody2D
    {
        [Export] public float MoveSpeed { get; set; } = 320f;
        [Export] public float Gravity { get; set; } = 980f;
        public float InputDirection { get; set; } = 1.0f;

        public override void _PhysicsProcess(double delta)
        {
            // Реализуй логику движения персонажа в Godot 4.7 / 4.8:
            
        }
    }
}`,
    naiveCopyTrapCode: `Velocity = MoveAndSlide(velocity, Vector2.Up);`,
    referenceCleanSolution: `using Godot;

namespace CSharpEngineeringLab.GodotEngine
{
    public partial class KineticCharacter : CharacterBody2D
    {
        [Export] public float MoveSpeed { get; set; } = 320f;
        [Export] public float Gravity { get; set; } = 980f;
        public float InputDirection { get; set; } = 1.0f;

        public override void _PhysicsProcess(double delta)
        {
            float dt = (float)delta;
            Vector2 nextVelocity = Velocity;

            if (!IsOnFloor())
            {
                nextVelocity.Y += Gravity * dt;
            }

            nextVelocity.X = InputDirection * MoveSpeed;
            Velocity = nextVelocity;
            MoveAndSlide();
        }
    }
}`,
    alternativeValidSolution: `using Godot;

public partial class KineticCharacter : CharacterBody2D
{
    [Export] public float MoveSpeed = 320f;
    [Export] public float Gravity = 980f;
    public float InputDirection = 1.0f;

    public override void _PhysicsProcess(double delta)
    {
        var v = Velocity;
        v.X = InputDirection * MoveSpeed;
        if (!IsOnFloor()) v.Y += Gravity * (float)delta;
        Velocity = v;
        MoveAndSlide();
    }
}`,
    testContracts: [
      {
        id: 'tc-gd-1',
        name: 'Проверка генератора исходного кода Godot 4.7/4.8 (partial class)',
        inputDescription: 'Инспекция объявления класса CharacterBody2D',
        expectedOutputDescription: 'Класс содержит модификатор partial для Roslyn Source Generator',
        category: 'functional'
      },
      {
        id: 'tc-gd-2',
        name: 'Интеграция гравитации в воздухе (!IsOnFloor)',
        inputDescription: 'IsOnFloor() = false, Gravity = 980f, delta = 0.0166667, InputDirection = 1f',
        expectedOutputDescription: 'Velocity.Y увеличивается на Gravity * (float)delta (~16.33f), Velocity.X = 320f',
        category: 'functional'
      },
      {
        id: 'tc-gd-3',
        name: 'Стабильность на полу (IsOnFloor() == true)',
        inputDescription: 'IsOnFloor() = true, начальный Velocity.Y = 0f, delta = 0.0166667',
        expectedOutputDescription: 'Гравитация не накапливается на полу, вызывается MoveAndSlide() без параметров',
        category: 'edge-case'
      },
      {
        id: 'tc-gd-4',
        name: 'Аудит производительности кадра (No GetNode in Physics Loop)',
        inputDescription: 'Проверка тела _PhysicsProcess на отсутствие поиска по дереву сцены',
        expectedOutputDescription: '0 вызовов GetNode внутри _PhysicsProcess',
        category: 'performance'
      }
    ],
    socraticDefense: {
      question:
        'Почему в Godot 4.7 / 4.8 C# строка `Velocity.X = 300f;` напрямую вызывает ошибку компиляции CS1612 (Cannot modify the return value of CharacterBody2D.Velocity because it is not a variable)?',
      options: [
        {
          id: 'opt-gd1',
          text: 'Потому что Velocity — это свойство (property), возвращающее копию значимого типа (struct Vector2) на стеке. Изменение поля временной копии не изменило бы само свойство в C++ ядре.',
          isCorrect: true,
          explanation:
            'Абсолютно верно! Геттер свойства `Velocity` возвращает копию `struct Vector2`. Если бы C# разрешил изменить `.X` у этой временной копии, изменение тут же бы потерялось без вызова сеттера `set_Velocity`.'
        },
        {
          id: 'opt-gd2',
          text: 'Потому что свойства Vector2 в Godot 4.7 являются неизменяемыми (immutable) и создаются только через конструктор.',
          isCorrect: false,
          explanation:
            'Поля X и Y у самого struct Vector2 изменяемы (mutable), если вектор хранится в локальной переменной или поле. Ограничение связано именно с тем, что Velocity — это свойство (get/set), а не поле.'
        },
        {
          id: 'opt-gd3',
          text: 'Потому что изменение Velocity разрешено только из метода _Ready().',
          isCorrect: false,
          explanation:
            'Velocity как раз меняется в _PhysicsProcess, но путём присвоения всего вектора свойству `Velocity = v;`.'
        }
      ]
    }
  },
  {
    id: 'godot-signals-decouple-04',
    moduleId: 'mod-godot-arch',
    order: 4,
    title: '04. Архитектура Сигналов Godot 4.8 Beta 2 ([Signal] EventHandler & C# 14 field)',
    subtitle: 'Построение реактивного компонента здоровья (HealthComponent) без жёстких ссылок на UI и звуковую систему',
    difficulty: 'Godot 4.8 Beta 2 Архитектура',
    xpReward: 300,
    estimatedMinutes: 25,
    gitIssueNumber: 3,
    diagramImage: '/src/assets/images/hero_csharp_engineering_lab_1793997363009.jpg',
    firstPrinciples: {
      problemStatement:
        'Если скрипт игрока напрямую вызывает `GetNode<ProgressBar>("/root/Main/HUD/HealthBar").Value = hp;`, то при любом переименовании узла UI или запуске игрока на тестовой арене без HUD игра падает с NullReferenceException.',
      whyItMatters:
        'Принцип слабой связности (Decoupling / Observer Pattern): компонент `HealthComponent` должен отвечать только за инварианты здоровья (0 <= CurrentHp <= MaxHp) и транслировать типизированный сигнал `[Signal] public delegate void HealthChangedEventHandler(int currentHp, int maxHp);`.',
      underTheHood: [
        'В Godot 4.7 Stable / 4.8 Beta 2 C# атрибут `[Signal]` над делегатом, заканчивающимся на `EventHandler`, автоматически генерирует метод `EmitSignal(SignalName.HealthChanged, current, max)` и строго типизированное событие!',
        'В C# 14 (.NET 10) также появилось ключевое слово `field` внутри свойств, позволяющее ограничивать значения прямо в сеттере `set => field = Math.Clamp(value, 0, MaxHp);` без ручного объявления приватного поля `_currentHp`.',
        'Инвариант состояния: после смерти (`CurrentHp == 0`) повторный урон не должен уводить здоровье в минус или повторно спамить сигнал.'
      ],
      antiCopyPasteNotice:
        'Спроектируй метод получения урона `ApplyDamage(int amount)` самостоятельно: защити состояние от отрицательного урона (игнорировать `amount <= 0`), зажми здоровье в диапазоне `[0, MaxHp]` и вызови уведомление/сигнал только при реальном изменении состояния.'
    },
    walkthroughSlides: [
      {
        id: 'sl-sig-1',
        timeLabel: '00:00 — Анти-паттерн Спагетти-Дерева',
        title: 'Жёсткая сцепка через GetNode("/root/...")',
        conceptSummary:
          'Когда боевая логика знает пути до HUD, звука и камеры, сцену невозможно протестировать изолированно.',
        codeFocus: `// АНТИ-ПАТТЕРН: Жёсткая зависимость от иерархии сцены
public void TakeDamage(int dmg) {
    Hp -= dmg;
    GetNode<Label>("../../UI/HpLabel").Text = Hp.ToString(); // Упадёт при смене верстки!
}`,
        memoryOrEngineState: {
          stackItems: [{ name: 'dmg', value: '25', type: 'int' }],
          heapItems: [{ addr: '0xA100', type: 'String "../..UI/HpLabel"', sizeBytes: 56, gen: 0, note: 'Хрупкая зависимость пути' }],
          engineNote: 'Нарушение Single Responsibility и падение при инстанцировании врага без UI.'
        }
      },
      {
        id: 'sl-sig-2',
        timeLabel: '02:00 — Типизированные сигналы Godot 4.7 / 4.8 C#',
        title: 'Декларация [Signal] delegate ...EventHandler',
        conceptSummary:
          'Source Generator в Godot 4.7/4.8 превращает делегат с суффиксом EventHandler в полноценное событие и SignalName константу.',
        codeFocus: `[Signal]
public delegate void HealthChangedEventHandler(int currentHp, int maxHp);

public int ApplyDamage(int amount) {
    if (amount <= 0 || CurrentHp <= 0) return CurrentHp;
    CurrentHp = Math.Max(0, CurrentHp - amount);
    EmitSignal(SignalName.HealthChanged, CurrentHp, MaxHp);
    return CurrentHp;
}`,
        memoryOrEngineState: {
          stackItems: [
            { name: 'amount', value: '35', type: 'int' },
            { name: 'CurrentHp', value: '65', type: 'int' }
          ],
          heapItems: [],
          engineNote: 'HealthComponent полностью автономен и готов к Unit-тестированию.'
        }
      }
    ],
    technicalSpec: {
      goalSummary:
        'Создать автономный компонент здоровья `HealthComponent` для Godot 4.7 / 4.8 C# со строгой защитой инвариантов `[0, MaxHp]` и эмиссией сигнала при изменении здоровья.',
      signatureRequirement:
        'public partial class HealthComponent : Node с делегатом `[Signal] public delegate void ...EventHandler(...)` и методом `ApplyDamage(int amount)`.',
      functionalRequirements: [
        'Если входящий урон `amount <= 0` или персонаж уже мёртв (`CurrentHp <= 0`), здоровье не меняется, а сигнал не эмитится.',
        'При валидном уроне `CurrentHp` уменьшается на `amount`, но никогда не опускается ниже `0` (например, через `Math.Max(0, ...)` или проверку `if`).',
        'При изменении здоровья вызывается `EmitSignal` (или событие `HealthChanged`), а метод возвращает актуальное значение `CurrentHp`.'
      ],
      optimizationRequirements: [
        'Не вызывать `EmitSignal`, если здоровье фактически не изменилось (защита от лишних перерисовок UI и аллокаций `Variant`).',
        'Никаких вызовов `GetNode` к внешнему UI внутри `HealthComponent`.'
      ],
      forbiddenPatterns: [
        { pattern: 'GetNode', reason: 'Нарушает инкапсуляцию: HealthComponent не должен сам искать узлы интерфейса.' }
      ]
    },
    starterCode: `using System;
using Godot;

namespace CSharpEngineeringLab.GodotArchitecture
{
    // ТЗ (Архитектура Компонентов Godot 4.7 Stable / 4.8 Beta 2):
    // 1. Объяви сигнал [Signal] public delegate void HealthChangedEventHandler(int currentHp, int maxHp);
    // 2. В методе ApplyDamage(int amount):
    //    - Игнорируй урон, если amount <= 0 || CurrentHp <= 0 (и не спамь сигнал!).
    //    - Уменьши CurrentHp на amount, но не ниже 0.
    //    - Вызови EmitSignal(SignalName.HealthChanged, CurrentHp, MaxHp) и верни CurrentHp.

    public partial class HealthComponent : Node
    {
        [Signal]
        public delegate void HealthChangedEventHandler(int currentHp, int maxHp);

        [Export] public int MaxHp { get; set; } = 100;
        public int CurrentHp { get; set; } = 100;

        public int ApplyDamage(int amount)
        {
            // Напиши свою реализацию с соблюдением инвариантов и сигнала:
            
        }
    }
}`,
    naiveCopyTrapCode: `GetNode<Label>("../../UI/HpLabel").Text = Hp.ToString();`,
    referenceCleanSolution: `using System;
using Godot;

namespace CSharpEngineeringLab.GodotArchitecture
{
    public partial class HealthComponent : Node
    {
        [Signal]
        public delegate void HealthChangedEventHandler(int currentHp, int maxHp);

        [Export] public int MaxHp { get; set; } = 100;
        public int CurrentHp { get; set; } = 100;

        public int ApplyDamage(int amount)
        {
            if (amount <= 0 || CurrentHp <= 0)
            {
                return CurrentHp;
            }

            int nextHp = CurrentHp - amount;
            CurrentHp = nextHp < 0 ? 0 : nextHp;
            EmitSignal(SignalName.HealthChanged, CurrentHp, MaxHp);
            return CurrentHp;
        }
    }
}`,
    alternativeValidSolution: `using System;
using Godot;

public partial class HealthComponent : Node
{
    [Signal]
    public delegate void HealthChangedEventHandler(int currentHp, int maxHp);

    [Export] public int MaxHp = 100;
    public int CurrentHp = 100;

    public int ApplyDamage(int dmg)
    {
        if (dmg > 0 && CurrentHp > 0)
        {
            CurrentHp = Math.Max(0, CurrentHp - dmg);
            EmitSignal(SignalName.HealthChanged, CurrentHp, MaxHp);
        }
        return CurrentHp;
    }
}`,
    testContracts: [
      {
        id: 'tc-sig-1',
        name: 'Декларация типизированного сигнала Godot 4.7/4.8 ([Signal] ...EventHandler)',
        inputDescription: 'Анализ сигнатуры делегата сигнала',
        expectedOutputDescription: 'Объявлен атрибут [Signal] и делегат с суффиксом EventHandler',
        category: 'functional'
      },
      {
        id: 'tc-sig-2',
        name: 'Корректное списание урона и эмиссия сигнала',
        inputDescription: 'CurrentHp = 100, ApplyDamage(35)',
        expectedOutputDescription: 'CurrentHp становится 65, вызывается EmitSignal',
        category: 'functional'
      },
      {
        id: 'tc-sig-3',
        name: 'Защита нижней границы (Overkill Clamping >= 0)',
        inputDescription: 'CurrentHp = 40, ApplyDamage(999)',
        expectedOutputDescription: 'CurrentHp зажимается ровно в 0 (не -959)',
        category: 'edge-case'
      },
      {
        id: 'tc-sig-4',
        name: 'Фильтрация невалидного урона и защита от спама сигналов после смерти',
        inputDescription: 'ApplyDamage(-15) или ApplyDamage(10) при CurrentHp == 0',
        expectedOutputDescription: 'Состояние не меняется, лишний EmitSignal не вызывается',
        category: 'performance'
      }
    ],
    socraticDefense: {
      question:
        'В Godot 4.7 / 4.8 C# можно вызывать сигнал двумя способами: через `EmitSignal(SignalName.HealthChanged, CurrentHp, MaxHp)` или как нативное C#-событие. В чём техническое преимущество нативного C# `event Action<int, int>` внутри чисто C#-кода и когда нужен `[Signal]`?',
      options: [
        {
          id: 'opt-sg1',
          text: 'Нативный C# event не упаковывает аргументы в структуры Godot.Variant и работает быстрее, а атрибут [Signal] нужен, когда сигнал нужно подключать в визуальном редакторе Godot или слушать из GDScript / GDExtension.',
          isCorrect: true,
          explanation:
            'Блестяще! Вызов `EmitSignal` маршалирует параметры через `Godot.Variant` для совместимости с движком и GDScript, тогда как чистый C# делегат вызывает метод напрямую без маршалинга.'
        },
        {
          id: 'opt-sg2',
          text: 'Нативный C# event автоматически отписывает все узлы при удалении из дерева сцены, а [Signal] нет.',
          isCorrect: false,
          explanation:
            'Наоборот: классические C# события держат сильную ссылку на подписчика и требуют ручной отписки `-=` в `_ExitTree()`, если источник живёт дольше подписчика.'
        },
        {
          id: 'opt-sg3',
          text: 'Атрибут [Signal] работает только в 2D-сценах, а в 3D (Jolt Physics) нужно использовать C# event.',
          isCorrect: false,
          explanation:
            'Система сигналов в Godot относится к базовому классу GodotObject и работает одинаково в 2D, 3D и ресурсах.'
        }
      ]
    }
  }
];

export const ENGINEERING_QUIZZES: EngineeringQuiz[] = [
  {
    id: 'quiz-clr-stack',
    title: 'PR #14: Рефакторинг поиска ближайшего врага в радиусе радара (.NET 10 / Godot 4.7)',
    category: 'Оптимизация .NET 10 и Кадра',
    xpReward: 120,
    scenario:
      'Тиммейт отправил Pull Request с системой турели, которая каждый кадр (120 FPS) ищет ближайшего врага среди 500 целей.',
    prDiffOrCode: `public Enemy FindClosest(Vector2 turretPos, List<Enemy> enemies)
{
    return enemies
        .Where(e => e.IsAlive)
        .OrderBy(e => turretPos.DistanceTo(e.GlobalPosition))
        .FirstOrDefault();
}`,
    question:
      'Ты проводишь Code Review этого PR. В чём две главные инженерные проблемы этого кода для боевого игрового цикла?',
    options: [
      {
        id: 'q1-a',
        label:
          '1) OrderBy сортирует весь список за O(N log N) и аллоцирует буфер в куче вместо линейного поиска минимума за O(N); 2) DistanceTo считает квадратный корень sqrt на каждой итерации вместо быстрого DistanceSquaredTo.',
        isCorrect: true,
        engineeringFeedback:
          'Идеальный инженерный разбор! Поиск минимума одним циклом `foreach` (или по `CollectionsMarshal.AsSpan(enemies)`) с `DistanceSquaredTo` работает за O(N), не вызывает `MathF.Sqrt` 500 раз и создаёт 0 байт мусора в куче.'
      },
      {
        id: 'q1-b',
        label:
          'Проблема только в том, что нужно заменить FirstOrDefault() на First(), чтобы ускорить LINQ в два раза.',
        isCorrect: false,
        engineeringFeedback:
          'Замена FirstOrDefault на First не избавит от полной сортировки O(N log N), аллокаций итератора в куче и вычислений квадратного корня.'
      },
      {
        id: 'q1-c',
        label:
          'Список List<Enemy> нельзя передавать в метод в C# 14, потому что он полностью копируется на стек при каждом вызове.',
        isCorrect: false,
        engineeringFeedback:
          'List<T> в C# — это ссылочный тип (class). При передаче в метод копируется только 8-байтная ссылка на список, а не сам массив элементов.'
      }
    ]
  },
  {
    id: 'quiz-godot-lifecycle',
    title: 'PR #27: Утечка памяти при подписке на автозагружаемый EventBus (Godot 4.7 / 4.8)',
    category: 'Code Review PR',
    xpReward: 150,
    scenario:
      'В проекте используется глобальный синглтон `GameEvents` (Autoload). Временные попапы наград подписываются на глобальное C#-событие в `_Ready()`, а при закрытии уничтожаются через `QueueFree()`.',
    prDiffOrCode: `public partial class RewardPopup : Control
{
    public override void _Ready()
    {
        GameEvents.Instance.OnGoldEarned += UpdateGoldText;
    }

    private void UpdateGoldText(int amount)
    {
        GetNode<Label>("GoldLabel").Text = $"+{amount}";
    }
}`,
    question:
      'Что произойдёт после того, как игрок откроет и закроет этот попап (`QueueFree()`) и затем подберёт монету?',
    options: [
      {
        id: 'q2-a',
        label:
          'Глобальный синглтон продолжит удерживать ссылку на C#-делегат удалённого узла: при следующем событии вызовется метод на уже уничтоженном C++ объекте Godot (`ObjectDisposedException`), поэтому отписку `-= UpdateGoldText` обязательно делать в `_ExitTree()`.',
        isCorrect: true,
        engineeringFeedback:
          'Точно! В Godot 4.7/4.8 C# управляемая оболочка C# связана с нативным C++ объектом. Если долгоживущий Autoload держит C# делегат на узел, удалённый через `QueueFree()`, сборщик мусора не соберёт обёртку, а обращение к `GetNode` внутри обработчика упадёт на мёртвом нативном указателе.'
      },
      {
        id: 'q2-b',
        label:
          'Сборщик мусора .NET 10 автоматически удаляет все подписки `+=` в момент вызова `QueueFree()`.',
          isCorrect: false,
          engineeringFeedback:
          'Для GC .NET 10 ссылка в списке делегатов `GameEvents.Instance.OnGoldEarned` является живым корнем (GC Root), поэтому без явной отписки `-=` делегат останется в памяти.'
      },
      {
        id: 'q2-c',
        label:
          'Метод `_Ready()` вызывается на каждом кадре, поэтому подписка будет дублироваться 120 раз в секунду.',
        isCorrect: false,
        engineeringFeedback:
          '`_Ready()` вызывается ровно один раз при входе узла и его дочерних нод в SceneTree.'
      }
    ]
  },
  {
    id: 'quiz-csharp14-field',
    title: 'PR #41: Новые возможности C# 14 (.NET 10) — ключевое слово field и params ReadOnlySpan<T>',
    category: 'Архитектурный Выбор',
    xpReward: 150,
    scenario:
      'В C# 14 (.NET 10) команда рефакторит свойства компонентов Godot 4.8 Beta 2 и методы логирования боевых событий:',
    prDiffOrCode: `public partial class ShieldComponent : Node
{
    [Export]
    public float ShieldEnergy
    {
        get;
        set => field = Math.Clamp(value, 0f, 100f);
    } = 100f;

    public void ApplyMultiHits(params ReadOnlySpan<int> damages)
    {
        foreach (int d in damages) ShieldEnergy -= d;
    }
}`,
    question:
      'Какие два преимущества даёт этот код на C# 14 (.NET 10) по сравнению с классическим C# 11/12?',
    options: [
      {
        id: 'q3-a',
        label:
          '1) Контекстное ключевое слово `field` в C# 14 позволяет валидировать значение в `set` без объявления отдельного приватного поля `_shieldEnergy`; 2) `params ReadOnlySpan<int>` позволяет вызывать `ApplyMultiHits(10, 20, 30)` с размещением аргументов на стеке (0 аллокаций массива в куче).',
        isCorrect: true,
        engineeringFeedback:
          'Великолепно! В C# 14 ключевое слово `field` избавляет от бойлерплейта backing-полей при добавлении логики в сеттер, а `params ReadOnlySpan<T>` компилирует вызовы с переменным числом аргументов через `InlineArray` на стеке вместо `new int[]` в куче!'
      },
      {
        id: 'q3-b',
        label:
          'Ключевое слово `field` автоматически сохраняет значение свойства на диск в JSON при каждом изменении.',
        isCorrect: false,
        engineeringFeedback:
          '`field` — это ссылка на синтезированное компилятором C# 14 резервное поле (backing field) внутри аксессора свойства, оно не пишет данные на диск.'
      },
      {
        id: 'q3-c',
        label:
          '`params ReadOnlySpan<int>` создаёт отдельный поток (Thread) для каждого переданного аргумента.',
        isCorrect: false,
        engineeringFeedback:
          '`params ReadOnlySpan<int>` — это zero-allocation замена `params int[]`, выполняющаяся синхронно в текущем потоке на стеке.'
        }
    ]
  }
];
