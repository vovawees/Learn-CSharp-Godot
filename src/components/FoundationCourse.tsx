import React, { useEffect, useState } from 'react';

const STORAGE_KEY = 'csharp-lab.foundation-notes.v1';
const lessons = [
  {
    id: 'program', label: '0 · Первая программа', title: 'Программа как последовательность действий',
    idea: 'Исходный код — инструкции на C#. .NET компилирует и выполняет программу. Она получает данные, обрабатывает их и показывает результат. Ошибка компиляции означает, что программа ещё не запустилась.',
    predict: 'Какой результат ты ожидаешь увидеть, если программа выводит две строки одну за другой?',
    task: 'Создай консольный проект. Выведи имя персонажа и его здоровье, измени текст и запусти снова. Затем убери точку с запятой, прочитай сообщение компилятора и исправь ошибку.',
    defense: 'Чем ошибка компиляции отличается от неверного результата работающей программы? Где вход, обработка и выход?',
    video: 'https://learn.microsoft.com/en-us/shows/csharp-for-beginners/what-is-csharp-csharp-for-beginners/',
    videoLabel: 'Видео: что такое C#? · Microsoft (английский)'
  },
  {
    id: 'health', label: '1 · Здоровье и условия', title: 'Здоровье после урона',
    idea: 'Переменная хранит значение определённого типа. Арифметика вычисляет новое значение, а условие позволяет выбирать поведение в зависимости от данных.',
    predict: 'До кода: какой результат ожидаешь для здоровья 80 и урона 30? А для 5 и 99? Почему?',
    task: 'Получи здоровье и урон — целые числа от 0 до 100. Выведи оставшееся здоровье, не допуская отрицательного значения. Некорректный текст и значения вне диапазона должны приводить к понятной ошибке без вычисления.',
    defense: 'Почему одного вычитания недостаточно? Чем текст «20» отличается от числа 20? Что произойдёт с неверным вводом?',
    video: 'https://learn.microsoft.com/en-us/shows/csharp-for-beginners/branching-ifs-and-conditional-logic-csharp-for-beginners/',
    videoLabel: 'Видео: условия и ветвление · Microsoft (английский)'
  },
  {
    id: 'hits', label: '2 · Циклы и методы', title: 'Серия попаданий',
    idea: 'Цикл повторяет действие, а метод выделяет отдельную операцию. Логику игрового правила удобнее проверять отдельно от чтения данных и вывода.',
    predict: 'Здоровье 80, попадания 10 и 20. Что останется? Что произойдёт, если попаданий нет?',
    task: 'Получи начальное здоровье 0–100, количество попаданий 0–10 и урон каждого попадания 0–100. Выведи итоговое здоровье, не ниже нуля. При неверном вводе остановись с ошибкой. Вычисление одного удара вынеси в метод.',
    defense: 'Сколько раз выполнится цикл при нуле попаданий? Почему отдельный метод проще проверить? Как добавить лечение, не превышающее максимум здоровья?',
    video: 'https://learn.microsoft.com/en-us/shows/csharp-for-beginners/branching-and-while-loops-csharp-for-beginners/',
    videoLabel: 'Видео: циклы while · Microsoft (английский)'
  }
] as const;

type Notes = Record<string, string>;
function loadNotes(): Notes {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  } catch { return {}; }
}

export const FoundationCourse: React.FC = () => {
  const [selected, setSelected] = useState(0);
  const [notes, setNotes] = useState<Notes>(loadNotes);
  const [storageError, setStorageError] = useState(false);
  const lesson = lessons[selected];
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); setStorageError(false); }
    catch { setStorageError(true); }
  }, [notes]);
  return (
    <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-sky-600 dark:text-sky-400">НАЧАЛЬНЫЙ МАРШРУТ · .NET 10 → GODOT 4.7</p>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Сначала научимся мыслить, потом писать код</h1>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Объяснение → прогноз → собственная реализация → проверки → объяснение решения. Сначала корректность и понятность; оптимизацию обсуждаем, когда есть что измерять.</p>
      </div>
      <nav aria-label="Выбор урока" className="flex flex-wrap gap-2">
        {lessons.map((item, index) => <button key={item.id} type="button" onClick={() => setSelected(index)} aria-current={selected === index ? 'step' : undefined}
          className={`px-4 py-2 rounded-lg text-sm font-semibold border ${selected === index ? 'bg-sky-600 border-sky-600 text-white' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'}`}>{item.label}</button>)}
      </nav>
      <article className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-7 space-y-6 text-slate-800 dark:text-slate-200">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">{lesson.title}</h2>
        <div><h3 className="font-semibold mb-1">1. Разберись в идее</h3><p className="text-sm leading-6">{lesson.idea}</p></div>
        <div><h3 className="font-semibold mb-1">2. Сначала предположи</h3><p className="text-sm leading-6">{lesson.predict}</p></div>
        <div><h3 className="font-semibold mb-1">3. Техническое задание</h3><p className="text-sm leading-6">{lesson.task}</p></div>
        {lesson.id === 'health' && <div className="rounded-lg bg-sky-50 dark:bg-sky-950/50 p-4 text-sm space-y-2"><p>Практика на .NET 10 проверяет поведение метода на 10 201 допустимой паре и 10 недопустимых случаях. Реализацию придумываешь ты.</p><a className="text-sky-700 dark:text-sky-300 underline font-semibold" href="https://github.com/vovawees/Learn-CSharp-Godot/tree/main/curriculum/foundation/health-lab" target="_blank" rel="noreferrer">Открыть задание и инструкцию запуска ↗</a><p>Это отдельное локальное упражнение: результаты не передаются в приложение автоматически.</p></div>}
        <div><h3 className="font-semibold mb-1">4. Объясни и измени</h3><p className="text-sm leading-6">{lesson.defense}</p></div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm"><a className="text-sky-700 dark:text-sky-300 underline" href={lesson.video} target="_blank" rel="noreferrer">{lesson.videoLabel} ↗</a><a className="text-sky-700 dark:text-sky-300 underline" href="https://github.com/vovawees/Learn-CSharp-Godot/tree/main/curriculum/foundation" target="_blank" rel="noreferrer">Полный текст и проверки ↗</a></div>
        <div className="border-t border-slate-200 dark:border-slate-700 pt-5 space-y-2">
          <label htmlFor="foundation-notes" className="block font-semibold">Твои мысли и результаты</label>
          <textarea id="foundation-notes" value={notes[lesson.id] ?? ''} onChange={e => setNotes(prev => ({ ...prev, [lesson.id]: e.target.value }))} rows={6} placeholder="Запиши прогноз, свои проверки и объяснение…" className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-3 text-sm focus:outline-none focus:border-sky-500" />
          <p role="status" className="text-xs text-slate-600 dark:text-slate-400">{storageError ? 'Не удалось сохранить заметку в браузере. Скопируй её в другое место.' : 'Заметки сохраняются только в этом браузере. Между устройствами пока не синхронизируются.'}</p>
        </div>
      </article>
    </section>
  );
};
