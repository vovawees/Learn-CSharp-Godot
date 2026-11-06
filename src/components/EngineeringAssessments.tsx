import React, { useState } from 'react';
import { ENGINEERING_QUIZZES } from '../data/curriculum';

interface EngineeringAssessmentsProps {
  passedQuizzes: string[];
  onQuizPassed: (quizId: string, xpReward: number) => void;
}

export const EngineeringAssessments: React.FC<EngineeringAssessmentsProps> = ({
  passedQuizzes,
  onQuizPassed
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});

  const handleSelectOption = (quizId: string, optionId: string, isCorrect: boolean, xpReward: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [quizId]: optionId }));
    if (isCorrect) {
      onQuizPassed(quizId, xpReward);
    }
  };

  return (
    <section className="max-w-[1160px] mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="border-b border-slate-200 dark:border-slate-800 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-sky-600 dark:text-sky-400 mb-1">
            Командное Code Review и Архитектурная диагностика вместо поверхностного заучивания
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white font-display">
            Инженерные PR-Ревью и Тесты Понимания
          </h1>
        </div>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
          Пройдено PR-ревью: {passedQuizzes.length} / {ENGINEERING_QUIZZES.length}
        </div>
      </div>

      <div className="space-y-8">
        {ENGINEERING_QUIZZES.map((quiz) => {
          const pickedId = selectedAnswers[quiz.id];
          const isCompleted = passedQuizzes.includes(quiz.id);

          return (
            <article
              key={quiz.id}
              className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>
                  {quiz.category} · Награда: +{quiz.xpReward} XP
                </span>
                <span className={isCompleted ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                  {isCompleted ? '✓ PR Успешно Проверен' : 'Ожидает ревью'}
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-display">
                {quiz.title}
              </h2>

              <p className="text-sm text-slate-700 dark:text-slate-300">{quiz.scenario}</p>

              <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto border border-slate-800">
                <code>{quiz.prDiffOrCode}</code>
              </pre>

              <p className="text-sm font-semibold text-slate-900 dark:text-white">{quiz.question}</p>

              <div className="space-y-2.5">
                {quiz.options.map((opt) => {
                  const isPicked = pickedId === opt.id;
                  return (
                    <div key={opt.id}>
                      <button
                        type="button"
                        onClick={() => handleSelectOption(quiz.id, opt.id, opt.isCorrect, quiz.xpReward)}
                        className={`w-full text-left p-3.5 rounded-lg border text-xs leading-relaxed transition-colors cursor-pointer ${
                          isPicked
                            ? opt.isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-white font-semibold'
                              : 'bg-rose-500/10 border-rose-500/40 text-slate-900 dark:text-white'
                            : 'bg-slate-50 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                      {isPicked && (
                        <div className="mt-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-800/70 text-xs text-slate-700 dark:text-slate-300">
                          {opt.engineeringFeedback}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
