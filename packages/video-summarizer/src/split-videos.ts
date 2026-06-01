/**
 * Разрезает видео согласно конфигу и вставляет вступительные титры.
 * Запуск: bun run packages/video-summarizer/src/split-videos.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import { type PartConfig, SPLIT_CONFIG, type VideoSplit } from './split-config';

// Параметры кодирования
const ENCODE_PARAMS = [
  '-c:v',
  'libx264',
  '-crf',
  '23',
  '-preset',
  'fast',
  '-c:a',
  'aac',
  '-b:a',
  '128k',
];

function buildCutArgs(
  input: string,
  start: string,
  end: string | undefined,
  output: string,
): string[] {
  // Конвертируем в секунды (ffmpeg по-разному парсит MM:SS и просто число)
  const args = ['-y', '-ss', timeToSeconds(start)];
  if (end) args.push('-to', timeToSeconds(end));
  args.push('-i', input, '-c', 'copy', '-avoid_negative_ts', 'make_zero');
  args.push(output);
  return args;
}

/** Конвертирует MM:SS в строку секунд для ffmpeg */
function timeToSeconds(ts: string): string {
  const [m, s] = ts.split(':').map(Number);
  return String((m ?? 0) * 60 + (s ?? 0));
}

function _buildTitleArgs(
  input: string,
  caption: string,
  output: string,
): string[] {
  const escapedCaption = caption.replace(/:/g, '\\:');
  const drawtext = [
    'drawtext=',
    `text='${escapedCaption}'`,
    ':fontsize=28',
    ':fontcolor=white',
    ':borderw=2',
    ':bordercolor=black@0.7',
    ':x=(w-text_w)/2',
    ':y=(h-text_h)/2',
    ":enable='between(t,0,3)'",
  ].join('');

  return ['-y', '-i', input, '-vf', drawtext, ...ENCODE_PARAMS, output];
}

async function splitPart(
  video: VideoSplit,
  part: PartConfig,
): Promise<'ok' | 'skip' | 'error'> {
  const outName = `${String(part.part).padStart(2, '0')}. ${part.title}.mp4`;
  const outPath = path.join(video.outputDir, outName);

  fs.mkdirSync(video.outputDir, { recursive: true });

  // Пропускаем существующие файлы
  if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) {
    console.log(`    ⏭ уже существует`);
    return 'skip';
  }

  // Быстрая резка через -c copy (без перекодирования)
  const tempPath = outPath.replace(/\.mp4$/, '.temp.mp4');
  console.log(
    `    резка -ss ${part.start}${part.end ? ` -to ${part.end}` : ''} ...`,
  );

  const cutArgs = buildCutArgs(video.source, part.start, part.end, tempPath);
  const cutProc = Bun.spawn(['ffmpeg', ...cutArgs], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const cutCode = await cutProc.exited;
  if (cutCode !== 0) {
    const errText = await new Response(cutProc.stderr).text();
    try {
      fs.unlinkSync(tempPath);
    } catch {}
    throw new Error(`ffmpeg exit ${cutCode}: ${errText.slice(-200)}`);
  }

  fs.renameSync(tempPath, outPath);

  const sizeMB = (fs.statSync(outPath).size / 1024 / 1024).toFixed(0);
  console.log(`      ✅ ${sizeMB} МБ`);
  return 'ok';
}

async function main() {
  const totalParts = SPLIT_CONFIG.reduce((sum, v) => sum + v.parts.length, 0);
  let partIdx = 0;

  console.log(
    `🎬 Разрезаю ${SPLIT_CONFIG.length} видео на ${totalParts} частей с титрами\n`,
  );

  for (const video of SPLIT_CONFIG) {
    const videoName = path.basename(video.source, '.mp4');
    console.log(`📹 ${videoName} → ${video.parts.length} частей`);

    for (const part of video.parts) {
      partIdx++;
      console.log(`  [${partIdx}/${totalParts}] Часть ${part.part}`);

      try {
        const result = await splitPart(video, part);
        if (result === 'skip') continue;
      } catch (err: any) {
        console.error(`    ❌ Ошибка: ${err.message}`);
      }
    }
    console.log();
  }

  console.log('🏁 Готово!');
}

main().catch((err) => {
  console.error('💥 Фатальная ошибка:', err);
  process.exit(1);
});
