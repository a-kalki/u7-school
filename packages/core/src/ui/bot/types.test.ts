import { describe, expect, it } from 'bun:test';
import type {
  ChatMemberUser,
  MessengerAction,
  MessengerEvent,
  MessengerEventReaction,
  ProactiveSender,
} from './types';

describe('Messenger Inbound/Outbound types and ProactiveSender contract', () => {
  it('supports MessengerAction discriminated union', () => {
    const actions: MessengerAction[] = [
      { kind: 'kick_member', chatId: '-100123', userId: 42 },
      {
        kind: 'restrict_member',
        chatId: 123,
        userId: 42,
        untilDate: new Date(),
      },
      { kind: 'pin_message', chatId: '-100123', messageId: 99, silent: true },
      { kind: 'approve_join', chatId: '-100123', userId: 42 },
    ];
    expect(actions).toHaveLength(4);
    expect(actions[0]?.kind).toBe('kick_member');
  });

  it('supports ChatMemberUser and MessengerEvent discriminated union', () => {
    const user: ChatMemberUser = {
      id: 12345,
      firstName: 'Ivan',
      lastName: 'Ivanov',
      username: 'ivanov',
    };

    const events: MessengerEvent[] = [
      {
        kind: 'member_joined',
        chatId: '-100999',
        user,
      },
      {
        kind: 'member_left',
        chatId: '-100999',
        user,
        kicked: true,
      },
      {
        kind: 'bot_membership',
        chatId: '-100999',
        status: 'added',
        byUser: user,
      },
    ];

    expect(events).toHaveLength(3);
    expect(events[0]?.kind).toBe('member_joined');
    expect(events[1]?.kind).toBe('member_left');
    expect(events[2]?.kind).toBe('bot_membership');
  });

  it('supports MessengerEventReaction values', () => {
    const passReaction: MessengerEventReaction = 'pass';
    const stopReaction: MessengerEventReaction = 'stop';
    expect(passReaction).toBe('pass');
    expect(stopReaction).toBe('stop');
  });

  it('verifies ProactiveSender interface has execute method', async () => {
    const executedActions: MessengerAction[] = [];
    const sender: ProactiveSender = {
      async notify() {},
      async invite() {},
      async kickFromGroup(groupId, userId) {
        await this.execute({ kind: 'kick_member', chatId: groupId, userId });
      },
      async execute(action) {
        executedActions.push(action);
      },
    };

    await sender.execute({ kind: 'kick_member', chatId: '100', userId: 1 });
    await sender.kickFromGroup('100', 2);

    expect(executedActions).toEqual([
      { kind: 'kick_member', chatId: '100', userId: 1 },
      { kind: 'kick_member', chatId: '100', userId: 2 },
    ]);
  });
});
