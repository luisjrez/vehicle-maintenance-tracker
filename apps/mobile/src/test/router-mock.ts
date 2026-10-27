/** A stand-in for expo-router's imperative router, shared by screen tests. */
export const routerMock = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  dismiss: jest.fn(),
  navigate: jest.fn(),
};

export function resetRouterMock(): void {
  for (const fn of Object.values(routerMock)) fn.mockReset();
}
