import type { BotResponse, BotUpdate } from '@u7-scl/core/ui';
import { BotController } from '@u7-scl/core/ui';
import type { StreamApiModule } from '../../../api/module';
import type { UcMeta, UseCase } from '@u7-scl/core/api';

export class StreamController extends BotController {
  constructor(private readonly streamApi: StreamApiModule) {
    super();
  }

  private getUc(name: string): StreamApiModule['useCases'] {
    const uc = this.streamApi.useCases.find(
      (uc): uc is UseCase<UcMeta, unknown> =>
        'ucName' in uc && uc.ucName === name,
    );
    if (!uc) throw new Error(`UseCase ${name} not found`);
    return uc;
  }

  async handleUpdate(update: BotUpdate, actorId: string): Promise<BotResponse> {
    try {
      if (update.type === 'command') {
        if (update.command === 'streams') return await this.handleListStreams();
        if (update.command === 'my_study')
          return await this.handleMyStudy(actorId);
      }

      return { sendMessage: { text: 'Команда не поддерживается' } };
    } catch (err) {
      return this.handleError(err);
    }
  }

  async handleListStreams(): Promise<BotResponse> {
    const streams = await this.getUc('list-streams').execute({}, '');
    return {
      sendMessage: {
        text: `Список потоков: ${this.escapeMarkdown(JSON.stringify(streams))}`,
      },
    };
  }

  async handleMyStudy(studentId: string): Promise<BotResponse> {
    const progress = await this.getUc('get-student-progress').execute(
      { studentId },
      studentId,
    );
    return {
      sendMessage: {
        text: `Ваш прогресс: ${this.escapeMarkdown(JSON.stringify(progress))}`,
      },
    };
  }

  async handleEnroll(
    studentId: string,
    streamId: string,
  ): Promise<BotResponse> {
    await this.getUc('enroll-student').execute(
      { streamId, userId: studentId },
      studentId,
    );
    return { sendMessage: { text: 'Вы успешно записаны на поток!' } };
  }

  async handleCompleteStep(
    studentId: string,
    streamId: string,
    stepId: string,
  ): Promise<BotResponse> {
    const result = await this.getUc('complete-step').execute(
      { studentId, streamId, stepId },
      studentId,
    );
    return {
      sendMessage: {
        text: `Шаг завершен: ${this.escapeMarkdown(JSON.stringify(result))}`,
      },
    };
  }
}
