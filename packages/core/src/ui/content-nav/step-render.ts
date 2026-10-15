import {
  type MdText,
  md,
  mdCodeBlock,
  mdRaw,
  safeConvert,
} from '../../shared/markdown';

export interface StepContentData {
  kind: string;
  code?: string;
  content?: string;
}

/**
 * Рендерит контентное тело шага (текст или блок кода) с экранированием для MarkdownV2.
 * Чистая функция без зависимостей от бот-транспорта.
 */
export function formatStepBody(step: StepContentData): MdText {
  if (step.kind === 'code' && step.code) {
    return mdCodeBlock(step.code);
  }
  if (step.kind === 'text' && step.content) {
    return mdRaw(safeConvert(step.content));
  }
  return md``;
}
