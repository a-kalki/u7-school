/**
 * Сессия активного пользователя в CLI.
 * Хранит actorId текущего пользователя и управляет его жизненным циклом.
 */
export class ActorSession {
  private _actorId: string | null = null;

  /** ID текущего активного пользователя */
  get actorId(): string | null {
    return this._actorId;
  }

  /** Аутентифицирован ли пользователь */
  get isAuthenticated(): boolean {
    return this._actorId !== null;
  }

  /** Устанавливает активного пользователя */
  setActor(actorId: string): void {
    this._actorId = actorId;
  }

  /** Сбрасывает сессию (logout) */
  clear(): void {
    this._actorId = null;
  }
}
