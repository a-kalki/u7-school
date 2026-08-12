import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import type { QuestionnaireBotFacade } from './bot-facade';

describe('QuestionnaireBotFacade (type-level interface)', () => {
  test('интерфейс определяет sendQuestionnaireInvite', () => {
    // Проверяем, что объект с методом sendQuestionnaireInvite
    // удовлетворяет интерфейсу QuestionnaireBotFacade
    const mock: QuestionnaireBotFacade = {
      sendQuestionnaireInvite: async (_user: User, _response: any) => {},
      startQuestionnaire: async (_user: User, _response: any) => {},
    };

    expect(mock.sendQuestionnaireInvite).toBeDefined();
    expect(mock.startQuestionnaire).toBeDefined();
    expect(typeof mock.sendQuestionnaireInvite).toBe('function');
    expect(typeof mock.startQuestionnaire).toBe('function');
  });
});
