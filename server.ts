import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { Client } from 'ssh2';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = 3000;
const VPS_HOST = process.env.VPS_HOST || '130.61.29.17';
const VPS_USER = process.env.VPS_USER || 'opc';
const GITHUB_REPO = process.env.GITHUB_REPO || 'vovawees/Learn-CSharp-Godot';
const LOCAL_STATE_FALLBACK = path.resolve(process.cwd(), '.local-sync-cache.json');

function getSshPrivateKey(): Buffer | null {
  const keyPath = path.join(process.env.HOME || '/root', '.ssh', 'oci_a1');
  if (fs.existsSync(keyPath)) {
    return fs.readFileSync(keyPath);
  }
  return null;
}

function getGithubToken(): string | null {
  const tokenPath = path.join(process.env.HOME || '/root', '.config', 'gh_token');
  if (fs.existsSync(tokenPath)) {
    return fs.readFileSync(tokenPath, 'utf8').trim();
  }
  return process.env.GITHUB_TOKEN || null;
}

function execOnVps(command: string, timeoutMs = 12000): Promise<string> {
  return new Promise((resolve, reject) => {
    const privateKey = getSshPrivateKey();
    if (!privateKey) {
      return reject(new Error('SSH key not found in ~/.ssh/oci_a1'));
    }

    const conn = new Client();
    const timer = setTimeout(() => {
      conn.end();
      reject(new Error('VPS SSH command timed out'));
    }, timeoutMs);

    conn
      .on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) {
            clearTimeout(timer);
            conn.end();
            return reject(err);
          }
          let stdout = '';
          let stderr = '';
          stream
            .on('close', () => {
              clearTimeout(timer);
              conn.end();
              resolve(stdout || stderr);
            })
            .on('data', (data: Buffer) => {
              stdout += data.toString();
            })
            .stderr.on('data', (data: Buffer) => {
              stderr += data.toString();
            });
        });
      })
      .on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      })
      .connect({
        host: VPS_HOST,
        port: 22,
        username: VPS_USER,
        privateKey
      });
  });
}

function readLocalFallbackState() {
  if (fs.existsSync(LOCAL_STATE_FALLBACK)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_STATE_FALLBACK, 'utf8'));
    } catch {
      // ignore
    }
  }
  return {
    updatedAt: new Date().toISOString(),
    device: 'Web-Engineering-Client',
    xp: 0,
    streakDays: 0,
    completedTasks: [],
    passedQuizzes: [],
    codeSnapshots: {},
    syncHistory: [
      {
        id: 'init-1',
        timestamp: new Date().toISOString(),
        device: 'Oracle-VPS-ARM64',
        summary: 'Initialized C# 14 (.NET 10) & Godot 4.7/4.8 Engineering State Store'
      }
    ]
  };
}

app.get('/api/sync/status', async (_req, res) => {
  try {
    const [vpsRaw, ghIssuesRes, ghMilestonesRes] = await Promise.allSettled([
      execOnVps('curl -s http://127.0.0.1:8945/health && echo "---SPLIT---" && curl -s http://127.0.0.1:8945/state', 8000),
      fetch(`https://api.github.com/repos/${GITHUB_REPO}/issues?state=all&per_page=15`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'csharp-mastery-hub',
          ...(getGithubToken() ? { Authorization: `token ${getGithubToken()}` } : {})
        }
      }).then((r) => (r.ok ? r.json() : [])),
      fetch(`https://api.github.com/repos/${GITHUB_REPO}/milestones?state=all`, {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'csharp-mastery-hub',
          ...(getGithubToken() ? { Authorization: `token ${getGithubToken()}` } : {})
        }
      }).then((r) => (r.ok ? r.json() : []))
    ]);

    let vpsHealth = {
      status: 'cached',
      service: 'csharp_mastery_hub_api',
      host: '130.61.29.17 (Oracle Linux 9.8 ARM64)',
      dotnetVersion: '10.0.114',
      port: 8945,
      workspace: '/home/opc/ai_workspace/csharp_mastery_hub'
    };
    let state = readLocalFallbackState();

    if (vpsRaw.status === 'fulfilled' && vpsRaw.value.includes('---SPLIT---')) {
      const [hPart, sPart] = vpsRaw.value.split('---SPLIT---');
      try {
        vpsHealth = JSON.parse(hPart.trim());
      } catch {
        // keep default
      }
      try {
        state = JSON.parse(sPart.trim());
        fs.writeFileSync(LOCAL_STATE_FALLBACK, JSON.stringify(state, null, 2));
      } catch {
        // keep fallback
      }
    }

    res.json({
      vps: vpsHealth,
      state,
      github: {
        repo: GITHUB_REPO,
        url: `https://github.com/${GITHUB_REPO}`,
        issues: ghIssuesRes.status === 'fulfilled' && Array.isArray(ghIssuesRes.value) ? ghIssuesRes.value : [],
        milestones:
          ghMilestonesRes.status === 'fulfilled' && Array.isArray(ghMilestonesRes.value) ? ghMilestonesRes.value : []
      }
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(200).json({
      vps: {
        status: 'fallback',
        service: 'csharp_mastery_hub_api',
        host: '130.61.29.17',
        dotnetVersion: '10.0.114',
        port: 8945,
        error: message
      },
      state: readLocalFallbackState(),
      github: { repo: GITHUB_REPO, url: `https://github.com/${GITHUB_REPO}`, issues: [], milestones: [] }
    });
  }
});

app.post('/api/sync/push', async (req, res) => {
  const payload = req.body || {};
  const current = readLocalFallbackState();
  const merged = {
    ...current,
    ...payload,
    updatedAt: new Date().toISOString(),
    completedTasks: Array.from(new Set([...(current.completedTasks || []), ...(payload.completedTasks || [])])),
    passedQuizzes: Array.from(new Set([...(current.passedQuizzes || []), ...(payload.passedQuizzes || [])])),
    codeSnapshots: { ...(current.codeSnapshots || {}), ...(payload.codeSnapshots || {}) },
    syncHistory: [
      {
        id: 'sync-' + Date.now(),
        timestamp: new Date().toISOString(),
        device: payload.device || 'PC / Mobile Web IDE',
        summary: payload.summary || 'Синхронизация прогресса и снимков кода с VPS'
      },
      ...(current.syncHistory || []).slice(0, 14)
    ]
  };

  fs.writeFileSync(LOCAL_STATE_FALLBACK, JSON.stringify(merged, null, 2));

  try {
    const b64 = Buffer.from(JSON.stringify(merged), 'utf8').toString('base64');
    const vpsResp = await execOnVps(
      `echo "${b64}" | base64 -d | curl -s -X POST -H "Content-Type: application/json" -d @- http://127.0.0.1:8945/state`,
      8000
    );
    const parsed = JSON.parse(vpsResp.trim());
    res.json({ ok: true, syncedWithVps: true, state: parsed });
  } catch {
    res.json({ ok: true, syncedWithVps: false, state: merged });
  }
});

// Disabled until per-run isolation, limits and exit-status checks are implemented (#9).
app.post('/api/vps/dotnet-run', (_req, res) => {
  res.status(503).json({ ok: false, error: 'Удалённый запуск временно отключён до внедрения изоляции. Используй локальную практику в разделе «Основы C#».' });
});

app.post('/api/mentor/review', async (req, res) => {
  const { taskTitle, code, evaluationSummary } = req.body || {};
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    res.json({
      review:
        'Подсказка без автоматической проверки: обрати внимание на то, как данные располагаются в стеке и куче: в C# 14 (.NET 10) и Godot 4.7/4.8 главная цель — сначала добиться 100% прохождения граничных тестов, а затем исключить лишние аллокации в игровом цикле.'
    });
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Задача: ${taskTitle}\nКод студента:\n${code}\nРезультат контрактов: ${evaluationSummary}\nДай краткий (3-4 предложения) инженерный разбор кода на русском языке для C# 14 (.NET 10) и Godot 4.7/4.8. НИКОГДА не пиши готовый код решения за студента (чтобы исключить копипаст), а задай 1 наводящий архитектурный вопрос и укажи на влияние его кода на память CLR / кадр движка.`,
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });

    res.json({
      review: response.text || 'Инженерный разбор завершён.'
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Ошибка обращения к Gemini API';
    res.status(200).json({
      review: `Локальный архитектурный аудит (.NET 10 / Godot 4.8): Проверь граничные условия в ТЗ и убедись, что внутри горячего цикла не создаются временные объекты в куче. (${msg})`
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`C# 14 & Godot 4.7/4.8 Engineering Lab listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
