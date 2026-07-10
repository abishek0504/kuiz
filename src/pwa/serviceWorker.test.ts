import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const source = readFileSync("public/sw.js", "utf8");
const mainSource = readFileSync("src/main.tsx", "utf8");
const registrationSource = readFileSync("src/pwa/registerServiceWorker.ts", "utf8");

describe("service worker update behavior", () => {
  test("uses a bumped app cache name", () => {
    expect(source).toContain('const CACHE_NAME = "kuiz-app-v9"');
  });

  test("loads navigations from the network before falling back offline", () => {
    const navigateBranch = source.slice(source.indexOf('if (request.mode === "navigate")'));

    expect(navigateBranch.indexOf("fetch(request)")).toBeGreaterThan(-1);
    expect(navigateBranch.indexOf("fetch(request)")).toBeLessThan(navigateBranch.indexOf("caches.match"));
  });

  test("checks for updates but waits for the learner before refreshing", () => {
    expect(source).toContain("SKIP_WAITING");
    expect(registrationSource).toContain('updateViaCache: "none"');
    expect(registrationSource).toContain("controllerchange");
    expect(registrationSource).toContain("registration.update()");
    expect(registrationSource).toContain('type: "SKIP_WAITING"');
    expect(registrationSource).toContain("refreshAfterActivation");
    expect(mainSource).toContain("registerServiceWorkerUpdateFlow");
    expect(source).not.toContain(".then(() => self.skipWaiting())");
  });
});
