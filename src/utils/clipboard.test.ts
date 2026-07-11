import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "./clipboard";

describe("copyText", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses the modern clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    await expect(copyText("안녕하세요")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("안녕하세요");
  });

  it("falls back when the exposed clipboard API rejects", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new DOMException("Not allowed", "NotAllowedError")) },
    });
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", { configurable: true, value: execCommand });

    await expect(copyText("long update prompt")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.querySelector('textarea[aria-hidden="true"]')).toBeNull();
  });
});
