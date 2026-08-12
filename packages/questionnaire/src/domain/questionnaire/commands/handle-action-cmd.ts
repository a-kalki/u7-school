import * as v from 'valibot';
import type { QuestionnaireArMeta } from '../entity';
import type { QuestionnaireActionResponse } from '../types';
import type {
  BadRequestUcError,
  InternalUcError,
  QuestionnaireNotFoundUcError,
} from './errors';

export const HandleActionCmdSchema = v.object({
  questionnaireId: v.pipe(v.string(), v.uuid()),
  type: v.picklist(['callback', 'text']),
  value: v.string(),
});

export type HandleActionCmd = v.InferOutput<typeof HandleActionCmdSchema>;

export interface HandleActionCmdMeta {
  ucName: 'handle-action';
  arMeta: QuestionnaireArMeta;
  input: HandleActionCmd;
  output: QuestionnaireActionResponse;
  errors: HandleActionCmdError;
  requiresAuth: false;
  type: 'command';
}

export type HandleActionCmdError =
  | BadRequestUcError
  | InternalUcError
  | QuestionnaireNotFoundUcError;
