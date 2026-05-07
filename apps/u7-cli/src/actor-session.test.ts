import { describe, expect, it } from "bun:test";
import { ActorSession } from "./actor-session";

describe("ActorSession", () => {
  it("isAuthenticated возвращает false по умолчанию", () => {
    const session = new ActorSession();
    expect(session.isAuthenticated).toBe(false);
  });

  it("actorId равен null по умолчанию", () => {
    const session = new ActorSession();
    expect(session.actorId).toBeNull();
  });

  it("setActor устанавливает actorId и делает сессию аутентифицированной", () => {
    const session = new ActorSession();
    session.setActor("user-123");
    expect(session.actorId).toBe("user-123");
    expect(session.isAuthenticated).toBe(true);
  });

  it("clear сбрасывает сессию", () => {
    const session = new ActorSession();
    session.setActor("user-123");
    session.clear();
    expect(session.actorId).toBeNull();
    expect(session.isAuthenticated).toBe(false);
  });

  it("setActor перезаписывает предыдущего актора", () => {
    const session = new ActorSession();
    session.setActor("user-1");
    session.setActor("user-2");
    expect(session.actorId).toBe("user-2");
  });
});
