import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const source = readFileSync("public/sw.js", "utf8");
const mainSource = readFileSync("src/main.tsx", "utf8");

describe("service worker update behavior", () => {
  test("uses a bumped app cache name", () => {
    expect(source).toContain('const CACHE_NAME = "kuiz-app-v4"');
  });

  test("loads navigations from the network before falling back offline", () => {
    const navigateBranch = source.slice(source.indexOf('if (request.mode === "navigate")'));

    expect(navigateBranch.indexOf("fetch(request)")).toBeGreaterThan(-1);
    expect(navigateBranch.indexOf("fetch(request)")).toBeLessThan(navigateBranch.indexOf("caches.match"));
  });

  test("activates updated workers without waiting for stale mobile tabs", () => {
    expect(source).toContain("SKIP_WAITING");
    expect(mainSource).toContain('updateViaCache: "none"');
    expect(mainSource).toContain("controllerchange");
    expect(mainSource).toContain("registration.update()");
    expect(mainSource).toContain('type: "SKIP_WAITING"');
  });
});
