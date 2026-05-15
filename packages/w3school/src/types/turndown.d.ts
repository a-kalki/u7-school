declare module 'turndown' {
  interface TurndownNode {
    classList: { contains(className: string): boolean };
    querySelector(selector: string): { textContent: string } | null;
  }

  class TurndownService {
    constructor(options?: Record<string, unknown>);
    addRule(
      name: string,
      rule: {
        filter: string | string[] | ((node: TurndownNode) => boolean);
        replacement: (content: string, node: TurndownNode) => string;
      },
    ): void;
    turndown(html: string): string;
  }

  export = TurndownService;
}
