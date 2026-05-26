import { describe, expect, test } from 'bun:test';
import type { User } from '@u7-scl/user/domain';
import { Role } from '@u7-scl/user/domain';
import type { Module } from '../module/entity';
import { Status } from '../status';
import { StepAr } from './a-root';

describe('StepAr', () => {
  describe('create', () => {
    test('создаёт text-шаг', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'text',
        content: 'Описание',
      });
      expect(ar.state.kind).toBe('text');
      expect(ar.state.status).toBe(Status.DRAFT);
    });

    test('создаёт code-шаг', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'code',
        content: 'Код',
        code: 'console.log(1)',
      });
      expect(ar.state.kind).toBe('code');
      if (ar.state.kind === 'code')
        expect(ar.state.code).toBe('console.log(1)');
    });

    test('создаёт code-шаг без language', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'code',
        content: 'Код',
        code: 'x',
      });
      if (ar.state.kind === 'code') expect(ar.state.language).toBeUndefined();
    });

    test('создаёт file-шаг', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'file',
        content: 'Файл',
        fileName: 'doc.pdf',
        fileMimeType: 'application/pdf',
        fileSize: 2048,
        fileDescription: 'Документ',
      });
      expect(ar.state.kind).toBe('file');
      if (ar.state.kind === 'file') {
        expect(ar.state.file.name).toBe('doc.pdf');
        expect(ar.state.file.mimeType).toBe('application/pdf');
        expect(ar.state.file.size).toBe(2048);
      }
    });

    test('не создаёт updatedAt при создании', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'text',
        content: 'Описание',
      });
      expect(ar.state.updatedAt).toBeUndefined();
    });
  });

  describe('getVisibleFor', () => {
    const authorId = crypto.randomUUID();
    const module: Module = {
      uuid: crypto.randomUUID(),
      // kind removed as const,
      title: 'Курс',
      description: 'Описание',
      authorId,
      status: Status.DRAFT,
      createdAt: '2026-05-01T12:00',
      projects: [],
    };

    function makeActor(roles: Role[], uuid = 'other'): User {
      return {
        uuid,
        name: 'Т',
        telegramId: 1,
        roles,
        createdAt: '2026-05-01T12:00',
      };
    }

    test('без актора — DRAFT → null', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'text',
        content: 'Ш',
      });
      expect(ar.getVisibleFor(undefined, module)).toBeNull();
    });

    test('без актора — PUBLISHED → шаг', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'text',
        content: 'Ш',
      });
      const published = new StepAr({ ...ar.state, status: Status.PUBLISHED });
      expect(published.getVisibleFor(undefined, module)).not.toBeNull();
    });

    test('автор видит DRAFT', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'text',
        content: 'Ш',
      });
      expect(
        ar.getVisibleFor(makeActor([Role.MENTOR], authorId), module),
      ).not.toBeNull();
    });

    test('ADMIN видит DRAFT', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'text',
        content: 'Ш',
      });
      expect(ar.getVisibleFor(makeActor([Role.ADMIN]), module)).not.toBeNull();
    });

    test('студент не видит DRAFT', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'text',
        content: 'Ш',
      });
      expect(ar.getVisibleFor(makeActor([Role.STUDENT]), module)).toBeNull();
    });

    test('студент видит PUBLISHED', () => {
      const ar = StepAr.create({
        moduleId: crypto.randomUUID(),
        lessonId: crypto.randomUUID(),
        description: 'Описание',
        kind: 'text',
        content: 'Ш',
      });
      const published = new StepAr({ ...ar.state, status: Status.PUBLISHED });
      expect(
        published.getVisibleFor(makeActor([Role.STUDENT]), module),
      ).not.toBeNull();
    });
  });
});
