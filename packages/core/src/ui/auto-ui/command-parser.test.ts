import { describe, expect, it } from 'bun:test';
import { CommandParser } from './command-parser';

describe('command-parser', () => {
  const parser = new CommandParser();

  it('должен парсить глобальные команды приложения', () => {
    expect(parser.parse('/app')).toEqual({ type: 'app', command: 'about' });
    expect(parser.parse('/')).toEqual({ type: 'app', command: 'about' });
    expect(parser.parse('/start')).toEqual({ type: 'app', command: 'about' });
    expect(parser.parse('/about')).toEqual({ type: 'app', command: 'about' });
    expect(parser.parse('/modules')).toEqual({ type: 'app', command: 'modules' });
  });

  it('должен парсить команды уровня модуля', () => {
    expect(parser.parse('/courses')).toEqual({ type: 'module', moduleName: 'courses', command: 'about' });
    expect(parser.parse('/courses/aggregates')).toEqual({ type: 'module', moduleName: 'courses', command: 'aggregates' });
    expect(parser.parse('/courses/course')).toEqual({ type: 'module', moduleName: 'courses', aggregateName: 'course', command: 'usecases' });
  });

  it('должен парсить команды уровня UseCase (запрос prompt)', () => {
    expect(parser.parse('/courses/course/add-course')).toEqual({
      type: 'usecase',
      moduleName: 'courses',
      aggregateName: 'course',
      commandName: 'add-course',
      action: 'prompt'
    });
  });

  it('должен парсить команды уровня UseCase (выполнение с payload)', () => {
    const input = `
/courses/course/add-course
- Мой новый курс
- Отличное описание
    `;
    expect(parser.parse(input)).toEqual({
      type: 'usecase',
      moduleName: 'courses',
      aggregateName: 'course',
      commandName: 'add-course',
      action: 'execute',
      payload: ['Мой новый курс', 'Отличное описание']
    });
  });

  it('должен очищать маркеры списка из payload', () => {
    const input = `
/users/user/create
* Иван Иванов
* ivan@example.com
    `;
    expect(parser.parse(input)).toEqual({
      type: 'usecase',
      moduleName: 'users',
      aggregateName: 'user',
      commandName: 'create',
      action: 'execute',
      payload: ['Иван Иванов', 'ivan@example.com']
    });
  });

  it('должен возвращать ошибку при пустом вводе или неверном формате', () => {
    expect(parser.parse('')).toEqual({ type: 'error', message: 'Пустой ввод' });
    expect(parser.parse('непонятный текст')).toEqual({ 
      type: 'error', 
      message: 'Неизвестная команда. Введите путь из меню или /app для возврата в главное меню.' 
    });
  });
});
