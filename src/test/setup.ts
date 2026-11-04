import { afterAll, afterEach } from "vitest";
import { server, startServer, stopServer } from "../mocks/server";
import { resetMockState } from "../mocks/state/mock-state";
import { resetScenarios } from "../mocks/scenarios";

startServer();

afterEach(() => {
  resetMockState();
  resetScenarios();
  server.resetHandlers();
});

afterAll(() => stopServer());
