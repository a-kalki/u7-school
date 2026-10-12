import { describe, expect, it } from 'bun:test';
import { createState, getView, update } from './hangman.js';

describe('games/hangman: hangman.js', () => {
  it('createState создает начальное состояние со словом', () => {
    const state = createState({ word: 'СТЕК', lang: 'ru' });
    expect(state.word).toBe('СТЕК');
    expect(state.lang).toBe('ru');
    expect(state.guessedLetters).toEqual([]);
    expect(state.wrongLetters).toEqual([]);
    expect(state.maxErrors).toBe(6);
    expect(state.status).toBe('PLAYING');
  });

  it('угадывание правильной буквы обновляет guessedLetters', () => {
    let state = createState({ word: 'СТЕК' });
    state = update(state, { type: 'GUESS', char: 'С' });

    expect(state.guessedLetters).toContain('С');
    expect(state.wrongLetters).toHaveLength(0);
    expect(state.status).toBe('PLAYING');
  });

  it('ошибочная буква увеличивает wrongLetters', () => {
    let state = createState({ word: 'СТЕК' });
    state = update(state, { type: 'GUESS', char: 'А' });

    expect(state.wrongLetters).toContain('А');
    expect(state.guessedLetters).toHaveLength(0);
    expect(state.status).toBe('PLAYING');
  });

  it('повторный ввод той же буквы не меняет состояние', () => {
    let state = createState({ word: 'СТЕК' });
    state = update(state, { type: 'GUESS', char: 'А' });
    const nextState = update(state, { type: 'GUESS', char: 'А' });

    expect(nextState.wrongLetters).toEqual(['А']);
  });

  it('победа наступает при открытии всех букв', () => {
    let state = createState({ word: 'ХЕШ' });
    state = update(state, { type: 'GUESS', char: 'Х' });
    state = update(state, { type: 'GUESS', char: 'Е' });
    state = update(state, { type: 'GUESS', char: 'Ш' });

    expect(state.status).toBe('WON');
  });

  it('поражение наступает при достижении maxErrors', () => {
    let state = createState({ word: 'СТЕК' });
    const wrong = ['А', 'Б', 'В', 'Г', 'Д', 'Ж'];
    for (const ch of wrong) {
      state = update(state, { type: 'GUESS', char: ch });
    }

    expect(state.status).toBe('LOST');
    expect(state.wrongLetters).toHaveLength(6);

    // Дальнейший ввод не меняет состояние
    const postState = update(state, { type: 'GUESS', char: 'С' });
    expect(postState.status).toBe('LOST');
  });

  it('переключение языка начинает новый раунд с новым языком', () => {
    let state = createState({ lang: 'ru' });
    state = update(state, { type: 'TOGGLE_LANG' });

    expect(state.lang).toBe('en');
    expect(state.status).toBe('PLAYING');

    state = update(state, { type: 'TOGGLE_LANG' });
    expect(state.lang).toBe('ru');
  });

  it('угадывание букв Q и R корректно работает', () => {
    let state = createState({ word: 'QUEUE', lang: 'en' });
    state = update(state, { type: 'GUESS', char: 'Q' });

    expect(state.guessedLetters).toContain('Q');
    expect(state.wrongLetters).toHaveLength(0);
  });

  it('ACTION_CONFIRM после окончания игры перезапускает раунд', () => {
    let state = createState({ word: 'ХЕШ', lang: 'ru' });
    state = update(state, { type: 'GUESS', char: 'Х' });
    state = update(state, { type: 'GUESS', char: 'Е' });
    state = update(state, { type: 'GUESS', char: 'Ш' });
    expect(state.status).toBe('WON');

    state = update(state, { type: 'ACTION_CONFIRM' });
    expect(state.status).toBe('PLAYING');
    expect(state.guessedLetters).toHaveLength(0);
  });

  it('getView формирует маскированное слово и данные для рендера', () => {
    let state = createState({ word: 'СТЕК' });
    state = update(state, { type: 'GUESS', char: 'С' });
    state = update(state, { type: 'GUESS', char: 'К' });
    state = update(state, { type: 'GUESS', char: 'Я' });

    const view = getView(state);
    expect(view.maskedWord).toBe('С _ _ К');
    expect(view.errorsCount).toBe(1);
    expect(view.wrongLetters).toEqual(['Я']);
    expect(view.status).toBe('PLAYING');
  });
});
