interface Window {
  bryteDesktop?: {
    beeperRequest(input: { baseUrl: string; token: string; path: string; method: string; body?: string }): Promise<{ status: number; body: unknown }>;
  };
}