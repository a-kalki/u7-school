/**
 * Генерирует JSON Schema файлы из Valibot-схем сущностей.
 *
 * Запуск:  bun run scripts/generate-json-schemas.ts
 * Результат:  data/schemas/*.schema.json
 *
 * Чтобы IDE валидировала JSON-файл по схеме — добавь в начало файла:
 *   { "$schema": "../schemas/Questionnaire.schema.json", ... }
 *
 * Для файла-массива нужно обернуть в объект:
 *   { "$schema": "../schemas/Questionnaire.schema.json", "items": [...] }
 */

import { toJsonSchema } from '@valibot/to-json-schema';
import * as fs from 'node:fs';
import * as path from 'node:path';

import { QuestionnaireSchema } from '../packages/onboarding/src/domain/questionnaire/entity';
import { StudentSchema } from '../packages/stream/src/domain/student/entity';
import { StreamSchema } from '../packages/stream/src/domain/stream/entity';
import { UserSchema } from '../packages/user/src/domain/user/entity';
import { ModuleSchema } from '../packages/course/src/domain/module/entity';
import { LessonSchema } from '../packages/course/src/domain/lesson/entity';
import { StepSchema } from '../packages/course/src/domain/step/entity';

const OUT_DIR = 'data/schemas';

const schemas: { name: string; schema: Record<string, unknown> }[] = [
  { name: 'Questionnaire', schema: QuestionnaireSchema },
  { name: 'Student', schema: StudentSchema },
  { name: 'Stream', schema: StreamSchema },
  { name: 'User', schema: UserSchema },
  { name: 'Module', schema: ModuleSchema },
  { name: 'Lesson', schema: LessonSchema },
  { name: 'Step', schema: StepSchema },
];

function generate() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const { name, schema } of schemas) {
    const outPath = path.join(OUT_DIR, `${name}.schema.json`);

    try {
      const jsonSchema = toJsonSchema(schema, {
        errorMode: 'ignore',
        target: 'draft-2020-12',
      });

      // Убираем дублирующийся $schema, если toJsonSchema уже проставил
      const { $schema: _, ...rest } = jsonSchema;

      fs.writeFileSync(outPath, JSON.stringify({ title: name, ...rest }, null, 2));
      console.log(`✅ ${name}.schema.json`);
    } catch (err) {
      console.error(`❌ ${name}: ${(err as Error).message}`);
    }
  }

  console.log(`\nГотово. Схемы в ${OUT_DIR}/`);
}

generate();
