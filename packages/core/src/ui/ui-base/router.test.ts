import { describe, expect, it, mock } from "bun:test";
import { UIRouter } from "./router";
import type { UIApp } from "./ui-app";
import type { UIModule } from "./ui-module";

describe("router (Система навигации)", () => {
  it("должен вызывать app.render для путей '/' и '/app'", async () => {
    const renderAppMock = mock(() => "app-rendered");
    
    const appMock = {
      render: renderAppMock,
      modules: []
    } as unknown as UIApp<any>;

    const router = new UIRouter(appMock);

    expect(await router.navigate("/")).toBe("app-rendered");
    expect(await router.navigate("/app", { someContext: true })).toBe("app-rendered");
    
    expect(renderAppMock).toHaveBeenCalledTimes(2);
    expect(renderAppMock).toHaveBeenLastCalledWith({ someContext: true });
  });

  it("должен вызывать module.render для пути '/<module-name>'", async () => {
    const renderModuleMock = mock(() => "module-rendered");
    
    const uiModuleMock = {
      name: "course",
      render: renderModuleMock
    } as unknown as UIModule<any, any, any>;

    const appMock = {
      render: mock(),
      modules: [uiModuleMock]
    } as unknown as UIApp<any>;

    const router = new UIRouter(appMock);

    expect(await router.navigate("/course", 123)).toBe("module-rendered");
    expect(renderModuleMock).toHaveBeenCalledTimes(1);
    expect(renderModuleMock).toHaveBeenCalledWith(123);
  });

  it("должен вызывать module.renderUseCase для пути '/<module-name>/<uc-name>'", async () => {
    const renderUseCaseMock = mock(() => "uc-rendered");
    
    const uiModuleMock = {
      name: "course",
      getDocTypes: () => [{ commandName: "create-course" }],
      renderUseCase: renderUseCaseMock
    } as unknown as UIModule<any, any, any>;

    const appMock = {
      render: mock(),
      modules: [uiModuleMock]
    } as unknown as UIApp<any>;

    const router = new UIRouter(appMock);

    expect(await router.navigate("/course/create-course", "payload")).toBe("uc-rendered");
    expect(renderUseCaseMock).toHaveBeenCalledTimes(1);
    expect(renderUseCaseMock).toHaveBeenCalledWith("create-course", "payload");
  });

  it("должен выбрасывать ошибку, если модуль не найден", async () => {
    const appMock = {
      render: mock(),
      modules: []
    } as unknown as UIApp<any>;

    const router = new UIRouter(appMock);

    expect(router.navigate("/unknown")).rejects.toThrow("Модуль с именем 'unknown' не найден");
  });

  it("должен выбрасывать ошибку, если UseCase не найден", async () => {
    const uiModuleMock = {
      name: "course",
      getDocTypes: () => [{ commandName: "create-course" }],
    } as unknown as UIModule<any, any, any>;

    const appMock = {
      render: mock(),
      modules: [uiModuleMock]
    } as unknown as UIApp<any>;

    const router = new UIRouter(appMock);

    expect(router.navigate("/course/unknown-uc")).rejects.toThrow("UseCase 'unknown-uc' не найден в модуле 'course'");
  });
});
