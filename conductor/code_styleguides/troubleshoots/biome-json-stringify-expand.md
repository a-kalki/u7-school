# Biome: JSON.stringify(…, 2) разворачивает массивы, biome — нет

- **Симптомы:** `bun run lint` падает только на JSON (`data/courses/modules.json`, `lessons.json`, `...troubleshoots/registry.json`): «Formatter would have printed the following content». В diff — короткие массивы (`tags`) развёрнуты по одному элементу на строку. На `main` те же файлы проходят.
- **Причина:** скрипты и репозитории пишут JSON через `JSON.stringify(value, null, 2)`, который всегда разворачивает массивы. Biome схлопывает короткие массивы в одну строку. После каждой записи файл перестаёт соответствовать формату biome.
- **Решение:** после записи JSON прогонять его через biome. Для скриптов:

```ts
function formatJsonFiles(files: string[]): void {
  const res = Bun.spawnSync(['bunx', 'biome', 'format', '--write', ...files], {
    stdout: 'pipe',
    stderr: 'pipe',
  });
  if (res.exitCode !== 0) {
    throw new Error(`biome format: ${res.stderr.toString()}`);
  }
}
```

Уже испорченные файлы чинятся `bunx biome format --write <файлы>` (семантически no-op, можно сверить `json.load` до/после).
