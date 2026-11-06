using HealthLab;

Console.OutputEncoding = System.Text.Encoding.UTF8;
Console.WriteLine("Проверка задания: здоровье после урона (.NET 10)");
int passed = 0;
int failed = 0;
const int maxDetails = 12;

void Check(string description, Action action)
{
    try
    {
        action();
        passed++;
    }
    catch (Exception ex)
    {
        failed++;
        if (failed <= maxDetails)
            Console.WriteLine($"ОШИБКА: {description}: {ex.GetType().Name}: {ex.Message}");
    }
}

// Исчерпывающая проверка всех пар допустимых входов в оговорённом диапазоне.
for (int health = 0; health <= 100; health++)
{
    for (int damage = 0; damage <= 100; damage++)
    {
        int h = health, d = damage;
        Check($"health={h}, damage={d}", () =>
        {
            int actual = Health.AfterDamage(h, d);
            int expected = Math.Max(0, h - d);
            if (actual != expected)
                throw new InvalidOperationException($"ожидалось {expected}, получено {actual}");
        });
    }
}

(int health, int damage)[] invalid =
[
    (-1, 0), (101, 0), (0, -1), (0, 101),
    (int.MinValue, 0), (int.MaxValue, 0), (0, int.MinValue), (0, int.MaxValue),
    (-1, -1), (101, 101)
];
foreach (var (h, d) in invalid)
{
    Check($"некорректный ввод health={h}, damage={d}", () =>
    {
        try { Health.AfterDamage(h, d); }
        catch (ArgumentOutOfRangeException) { return; }
        throw new InvalidOperationException("ожидалось исключение ArgumentOutOfRangeException");
    });
}

Console.WriteLine($"Проверок пройдено: {passed}; ошибок: {failed}.");
if (failed > maxDetails) Console.WriteLine($"Показаны первые {maxDetails} ошибок.");
if (failed == 0)
    Console.WriteLine("Тесты пройдены. Теперь объясни решение и выполни изменение требований из README.md.");
else
    Console.WriteLine("Решение не прошло все проверки. Сравни ожидания с результатом, исправь и запусти снова.");
return failed == 0 ? 0 : 1;
