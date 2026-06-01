/**
 * HTTP-клиент для Gemini File API и GenerateContent API.
 * Загружает видео и получает суммаризацию.
 */

const BASE = 'https://generativelanguage.googleapis.com';

export interface UploadedFile {
  name: string;
  uri: string;
  state: 'PROCESSING' | 'ACTIVE' | 'FAILED';
}

/** Загружает видеофайл через Resumable Upload и ждёт готовности. */
export async function uploadVideo(
  videoPath: string,
  apiKey: string,
): Promise<UploadedFile> {
  const fileName = videoPath.split('/').pop()!;
  const fileBytes = await Bun.file(videoPath).arrayBuffer();
  const fileSize = fileBytes.byteLength;

  // Шаг 1 — инициализация загрузки, получаем upload URL
  const initUrl = `${BASE}/upload/v1beta/files?key=${apiKey}`;
  const initResp = await fetch(initUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(fileSize),
      'X-Goog-Upload-Header-Content-Type': 'video/mp4',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      file: { display_name: fileName },
    }),
  });

  if (!initResp.ok) {
    const err = await initResp.text();
    throw new Error(`Init upload failed [${initResp.status}]: ${err}`);
  }

  // Google возвращает URL в x-goog-upload-url, а не Location
  const uploadUrl = initResp.headers.get('x-goog-upload-url');
  if (!uploadUrl) {
    const headers = [...initResp.headers.entries()]
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
    throw new Error(`Не получен upload URL от сервера. Заголовки:\n${headers}`);
  }

  // Шаг 2 — загрузка файла (потоковая, чтобы не держать весь файл в памяти дважды)
  const uploadResp = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(fileSize),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: fileBytes,
    signal: AbortSignal.timeout(120_000),
  });

  if (!uploadResp.ok) {
    const err = await uploadResp.text();
    throw new Error(`Upload failed [${uploadResp.status}]: ${err}`);
  }

  let file: UploadedFile = await uploadResp.json() as UploadedFile;
  // Ответ может быть в поле file
  if ((file as any).file) {
    file = (file as any).file;
  }

  console.log(`  Загружен: ${file.name} (state: ${file.state})`);

  // Шаг 3 — ждём обработки
  let attempts = 0;
  while (file.state === 'PROCESSING' && attempts < 60) {
    await Bun.sleep(2000);
    const statusResp = await fetch(`${BASE}/v1beta/${file.name}?key=${apiKey}`);
    if (!statusResp.ok) {
      throw new Error(`Status check failed [${statusResp.status}]`);
    }
    file = await statusResp.json() as UploadedFile;
    attempts++;
    if (file.state === 'PROCESSING') {
      console.log(`  Ожидание обработки... (попытка ${attempts})`);
    }
  }

  if (file.state !== 'ACTIVE') {
    throw new Error(`Файл не готов: ${file.state}`);
  }

  console.log(`  Готов: ${file.uri}`);
  return file;
}

/** Отправляет промпт вместе с загруженным видео и возвращает текст ответа. */
export async function generateContent(
  file: UploadedFile,
  prompt: string,
  apiKey: string,
  model: string = 'gemini-2.5-flash',
): Promise<string> {
  const url = `${BASE}/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          {
            fileData: {
              mimeType: 'video/mp4',
              fileUri: file.uri,
            },
          },
          { text: prompt },
        ],
      },
    ],
  };

  const resp = await fetch(url, {
    signal: AbortSignal.timeout(300_000),
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`GenerateContent failed [${resp.status}]: ${err}`);
  }

  const data = await resp.json() as any;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error(`Пустой ответ: ${JSON.stringify(data).slice(0, 500)}`);
  }

  return text;
}
