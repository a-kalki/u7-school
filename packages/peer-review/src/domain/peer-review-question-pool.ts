import {
  type MetricQuestionPool,
  MetricQuestionPoolSchema,
} from '@u7-scl/questionnaire/domain';
import * as v from 'valibot';

/**
 * Валидирует пул метрик-вопросов на этапе загрузки модуля.
 * Гарантирует: категория↔подкатегория корректны, вес ∈ {0.75, 1, 1.25},
 * хотя бы один вопрос, уникальность структуры данных.
 */
function definePool(pool: MetricQuestionPool): MetricQuestionPool {
  return v.parse(MetricQuestionPoolSchema, pool);
}

/**
 * Пул метрик-анкеты для контекста `module_completed`.
 * Все 10 подкатегорий (29 утверждений), роли: все.
 * Источник: metrics-conception.md §10.1.
 */
export const MODULE_COMPLETED_POOL: MetricQuestionPool = definePool({
  inviteText:
    'Вы завершили модуль. Пришло время ставить оценки. В нашей школе оценки ставят не только учителя, но и сами студенты.\n\nИ в нашей школе оценки это не про то что студент плохой или хороший. Мы это делаем чтобы сам студент мог посмотреть на себя со стороны, как его воспринимают другие. И в то же время, чтобы в будущем он всегда мог поделиться своим профилем в школе. Как его и его работу оценивали другие. Это будет намного лучше говорить о нем, чем любой диплом, даже самый красный.',
  whyText: 'Оценка влияет на профиль компетенций студента',
  completionText: 'Спасибо, ваша оценка учтена',
  cancelWarning: 'Оценка не будет сохранена',
  questions: [
    // professional_skills / work_quality
    {
      questionCode: 'mc_work_quality_1',
      question: 'Пишет код чисто, читаемо и структурированно',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_work_quality_2',
      question: 'Код соответствует принятым стандартам и соглашениям',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_work_quality_3',
      question: 'Решение продумано, а не собрано на скорую руку',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    },
    // professional_skills / algorithmic_thinking
    {
      questionCode: 'mc_algorithmic_thinking_1',
      question: 'Умеет декомпозировать задачу на подзадачи',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'algorithmic_thinking',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_algorithmic_thinking_2',
      question: 'Выбирает подходящие алгоритмы и структуры данных',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'algorithmic_thinking',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_algorithmic_thinking_3',
      question: 'Может объяснить почему выбрал именно это решение',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'algorithmic_thinking',
        weight: 1,
      },
    },
    // professional_skills / tooling
    {
      questionCode: 'mc_tooling_1',
      question: 'Грамотно использует git (commit, branch, PR)',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'tooling',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_tooling_2',
      question: 'Эффективно использует IDE и инструменты отладки',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'tooling',
        weight: 1,
      },
    },
    // team_skills / communication
    {
      questionCode: 'mc_communication_1',
      question: 'Ясно и аргументированно излагает мысли',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'communication',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_communication_2',
      question: 'Слушает других и учитывает обратную связь',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'communication',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_communication_3',
      question: 'Умеет донести сложную мысль простыми словами',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'communication',
        weight: 1,
      },
    },
    // team_skills / initiative
    {
      questionCode: 'mc_initiative_1',
      question: 'Задаёт вопросы по существу, не молчит при затруднениях',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'initiative',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_initiative_2',
      question: 'Предлагает улучшения и альтернативные решения',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'initiative',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_initiative_3',
      question: 'Выходит за рамки задания, изучает смежные темы',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'initiative',
        weight: 1,
      },
    },
    // team_skills / honesty
    {
      questionCode: 'mc_honesty_1',
      question:
        'Даёт честную обратную связь, даже если это вызывает дискомфорт',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'honesty',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_honesty_2',
      question: 'Не завышает оценки себе и другим',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'honesty',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_honesty_3',
      question: 'Признаёт свои ошибки и пробелы в знаниях',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'honesty',
        weight: 1,
      },
    },
    // team_skills / mutual_help
    {
      questionCode: 'mc_mutual_help_1',
      question: 'Помогает сокурсникам, когда они сталкиваются с трудностями',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'mutual_help',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_mutual_help_2',
      question: 'Не боится просить о помощи, когда нужно',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'mutual_help',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_mutual_help_3',
      question: 'Делится знаниями и находками с группой',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'mutual_help',
        weight: 1,
      },
    },
    // personal_skills / enthusiasm
    {
      questionCode: 'mc_enthusiasm_1',
      question: 'Любопытен к новому, задаёт вопросы о том как устроено глубже',
      metricMapping: {
        category: 'personal_skills',
        subcategory: 'enthusiasm',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_enthusiasm_2',
      question: 'Увлечён процессом, а не просто отбывает время',
      metricMapping: {
        category: 'personal_skills',
        subcategory: 'enthusiasm',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_enthusiasm_3',
      question: 'Изучает дополнительные материалы сверх программы',
      metricMapping: {
        category: 'personal_skills',
        subcategory: 'enthusiasm',
        weight: 1,
      },
    },
    // personal_skills / responsibility
    {
      questionCode: 'mc_responsibility_1',
      question: 'Берёт задачи самостоятельно, не дожидаясь указаний',
      metricMapping: {
        category: 'personal_skills',
        subcategory: 'responsibility',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_responsibility_2',
      question: 'Соблюдает договорённости и дедлайны',
      metricMapping: {
        category: 'personal_skills',
        subcategory: 'responsibility',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_responsibility_3',
      question: 'Предупреждает о проблемах заранее, а не постфактум',
      metricMapping: {
        category: 'personal_skills',
        subcategory: 'responsibility',
        weight: 1,
      },
    },
    // personal_skills / regularity
    {
      questionCode: 'mc_regularity_1',
      question: 'Дисциплинирован, занимается регулярно',
      metricMapping: {
        category: 'personal_skills',
        subcategory: 'regularity',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_regularity_2',
      question: 'Держит стабильный темп, без длительных пауз',
      metricMapping: {
        category: 'personal_skills',
        subcategory: 'regularity',
        weight: 1,
      },
    },
    {
      questionCode: 'mc_regularity_3',
      question: 'Не пропускает занятия без предупреждения',
      metricMapping: {
        category: 'personal_skills',
        subcategory: 'regularity',
        weight: 1,
      },
    },
  ],
});

/**
 * Пул метрик-анкеты для контекста `pair_programming`.
 * 6 подкатегорий (13 утверждений), роль: student_student.
 * Источник: metrics-conception.md §10.2.
 */
export const PAIR_PROGRAMMING_POOL: MetricQuestionPool = definePool({
  inviteText: 'Оцените напарника после парного программирования',
  whyText: 'Оценка влияет на профиль компетенций студента',
  completionText: 'Спасибо, ваша оценка учтена',
  cancelWarning: 'Оценка не будет сохранена',
  questions: [
    // professional_skills / work_quality
    {
      questionCode: 'pp_work_quality_1',
      question: 'Пишет код осмысленно, а не наугад',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    },
    {
      questionCode: 'pp_work_quality_2',
      question: 'Объясняет что и зачем пишет, а не молча набирает',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    },
    {
      questionCode: 'pp_work_quality_3',
      question: 'Сразу пишет чисто, а не рассчитывает на «потом поправлю»',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    },
    // professional_skills / algorithmic_thinking
    {
      questionCode: 'pp_algorithmic_thinking_1',
      question: 'Продумывает решение до написания кода',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'algorithmic_thinking',
        weight: 1,
      },
    },
    {
      questionCode: 'pp_algorithmic_thinking_2',
      question:
        'Сравнивает альтернативные подходы, а не берёт первый попавшийся',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'algorithmic_thinking',
        weight: 1,
      },
    },
    // professional_skills / tooling
    {
      questionCode: 'pp_tooling_1',
      question:
        'Эффективно использует инструменты (навигация, рефакторинг, отладка)',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'tooling',
        weight: 1,
      },
    },
    {
      questionCode: 'pp_tooling_2',
      question: 'Уверенно работает с git в процессе сессии',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'tooling',
        weight: 1,
      },
    },
    // team_skills / communication
    {
      questionCode: 'pp_communication_1',
      question: 'Понятно объясняет свои действия и решения',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'communication',
        weight: 1,
      },
    },
    {
      questionCode: 'pp_communication_2',
      question: 'Обсуждает варианты, а не действует в одиночку',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'communication',
        weight: 1,
      },
    },
    // team_skills / honesty
    {
      questionCode: 'pp_honesty_1',
      question: 'Не полагается на ИИ для генерации целых решений',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'honesty',
        weight: 1,
      },
    },
    {
      questionCode: 'pp_honesty_2',
      question: 'Честно признаёт, когда не знает или не понимает',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'honesty',
        weight: 1,
      },
    },
    // team_skills / mutual_help
    {
      questionCode: 'pp_mutual_help_1',
      question: 'Открыт к диалогу, воспринимает подсказки',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'mutual_help',
        weight: 1,
      },
    },
    {
      questionCode: 'pp_mutual_help_2',
      question: 'Помогает понять логику, а не просто диктует код',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'mutual_help',
        weight: 1,
      },
    },
  ],
});

/**
 * Пул метрик-анкеты для контекста `code_review`.
 * 4 подкатегории (9 утверждений), роли: все.
 * Источник: metrics-conception.md §10.3.
 */
export const CODE_REVIEW_POOL: MetricQuestionPool = definePool({
  inviteText: 'Оцените качество кода после ревью',
  whyText: 'Оценка влияет на профиль компетенций студента',
  completionText: 'Спасибо, ваша оценка учтена',
  cancelWarning: 'Оценка не будет сохранена',
  questions: [
    // professional_skills / work_quality
    {
      questionCode: 'cr_work_quality_1',
      question: 'Код оформлен аккуратно, соответствует стандартам',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    },
    {
      questionCode: 'cr_work_quality_2',
      question: 'В коде нет очевидных багов или плохих практик',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    },
    {
      questionCode: 'cr_work_quality_3',
      question: 'Код легко читается и не требует дополнительных пояснений',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'work_quality',
        weight: 1,
      },
    },
    // professional_skills / algorithmic_thinking
    {
      questionCode: 'cr_algorithmic_thinking_1',
      question:
        'Выбранное решение адекватно задаче, нет избыточного усложнения',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'algorithmic_thinking',
        weight: 1,
      },
    },
    {
      questionCode: 'cr_algorithmic_thinking_2',
      question: 'Может объяснить компромиссы выбранного подхода',
      metricMapping: {
        category: 'professional_skills',
        subcategory: 'algorithmic_thinking',
        weight: 1,
      },
    },
    // team_skills / communication
    {
      questionCode: 'cr_communication_1',
      question: 'Аргументированно отвечает на замечания ревью',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'communication',
        weight: 1,
      },
    },
    {
      questionCode: 'cr_communication_2',
      question: 'В коде и комментариях понятна мысль автора',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'communication',
        weight: 1,
      },
    },
    // team_skills / initiative
    {
      questionCode: 'cr_initiative_1',
      question: 'Предлагает улучшения сверх поставленной задачи',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'initiative',
        weight: 1,
      },
    },
    {
      questionCode: 'cr_initiative_2',
      question: 'Находит и исправляет проблемы сам, не дожидаясь ревью',
      metricMapping: {
        category: 'team_skills',
        subcategory: 'initiative',
        weight: 1,
      },
    },
  ],
});

/**
 * Пул по контексту запуска. Контекст `initiative` — свободная форма,
 * поэтому фиксированного пула не имеет.
 */
export const METRIC_POOLS: Record<
  'module_completed' | 'pair_programming' | 'code_review',
  MetricQuestionPool
> = {
  module_completed: MODULE_COMPLETED_POOL,
  pair_programming: PAIR_PROGRAMMING_POOL,
  code_review: CODE_REVIEW_POOL,
};
