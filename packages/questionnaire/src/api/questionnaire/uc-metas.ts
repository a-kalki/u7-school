export type {
  AbandonCmd,
  AbandonCmdMeta,
  AbandonCmdMeta as AbandonUcMeta,
} from '../../domain/questionnaire/commands/abandon-cmd';
export type {
  DeclineInviteCmd,
  DeclineInviteCmdMeta,
  DeclineInviteCmdMeta as DeclineInviteUcMeta,
} from '../../domain/questionnaire/commands/decline-invite-cmd';
export type {
  GetCurrentCmd,
  GetCurrentCmdMeta,
  GetCurrentCmdMeta as GetCurrentUcMeta,
} from '../../domain/questionnaire/commands/get-current-cmd';
export type {
  GetQuestionnaireCmd,
  GetQuestionnaireCmdMeta,
  GetQuestionnaireCmdMeta as GetQuestionnaireUcMeta,
} from '../../domain/questionnaire/commands/get-questionnaire-cmd';
export type {
  GetQuestionnairesByUserCmd,
  GetQuestionnairesByUserCmdMeta,
  GetQuestionnairesByUserCmdMeta as GetQuestionnairesByUserUcMeta,
} from '../../domain/questionnaire/commands/get-questionnaires-by-user-cmd';
export type {
  HandleActionCmd,
  HandleActionCmdMeta,
  HandleActionCmdMeta as HandleActionUcMeta,
} from '../../domain/questionnaire/commands/handle-action-cmd';
// Для обратной совместимости — реэкспорт старых имён
export type {
  SendInviteCmd,
  SendInviteCmdMeta,
  SendInviteCmdMeta as SendInviteUcMeta,
} from '../../domain/questionnaire/commands/send-invite-cmd';
export type {
  StartByInviteCmd,
  StartByInviteCmdMeta,
  StartByInviteCmdMeta as StartByInviteUcMeta,
} from '../../domain/questionnaire/commands/start-by-invite-cmd';
export type {
  StartCmd,
  StartCmdMeta,
  StartCmdMeta as StartUcMeta,
} from '../../domain/questionnaire/commands/start-cmd';
