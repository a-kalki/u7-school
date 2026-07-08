import type { ContentSnapshot } from '#domain/content-snapshot';
import type { Course } from '#domain/course/entity';
import type { CourseFacade, CourseProgram } from '#domain/facade';
import type { Step } from '#domain/step/entity';
import type { CourseApiModule } from '../api/module';

/**
 * In-process реализация фасада курсов.
 * Делегирует вызовы CourseApiModule, не дублируя бизнес-логику.
 */
export class CourseInProcFacade implements CourseFacade {
  constructor(private readonly courseModule: CourseApiModule) {}

  async getModuleSnapshot(moduleId: string): Promise<ContentSnapshot> {
    return this.courseModule.execute('get-module-snapshot', { moduleId });
  }

  async getStep(stepId: string): Promise<Step> {
    return this.courseModule.execute('get-step', { uuid: stepId });
  }

  async getCourseProgram(courseId: string): Promise<CourseProgram> {
    const course: Course = await this.courseModule.execute('get-course', {
      uuid: courseId,
    });

    const phases = await Promise.all(
      course.phases.map(async (phase) => {
        const modules = await Promise.all(
          phase.moduleIds.map((moduleId) => this.getModuleSnapshot(moduleId)),
        );
        return {
          title: phase.title,
          track: phase.track,
          modules,
        };
      }),
    );

    return { course, phases };
  }
}
