import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubGlobal("crypto", {
  getRandomValues: (buffer: Uint8Array) => {
    for (let i = 0; i < buffer.length; i += 1) {
      buffer[i] = i;
    }
    return buffer;
  }
});

describe("client token and settings helpers", () => {
  beforeEach(() => {
    localStorage.clear();
    document.cookie = "image-set-client-token=; Max-Age=0; Path=/";
  });

  it("generates and reuses a client token", async () => {
    const { getClientToken } = await import("../src/lib/client");
    const first = getClientToken();
    const second = getClientToken();
    expect(first).toBe(second);
    expect(typeof first).toBe("string");
    expect(document.cookie).toContain(`image-set-client-token=${first}`);
  });

  it("persists runtime settings as JSON", async () => {
    const { loadRuntimeSetting, saveRuntimeSetting } = await import("../src/lib/client");
    expect(loadRuntimeSetting()).toEqual({});
    saveRuntimeSetting({
      pollinations: {
        api_key: "pollinations-secret",
        planning_model: "openai",
        prompt_model: "openai-fast",
        image_model: "flux-pro"
      }
    });
    expect(loadRuntimeSetting()).toMatchObject({
      pollinations: {
        api_key: "pollinations-secret",
        planning_model: "openai",
        prompt_model: "openai-fast",
        image_model: "flux-pro"
      }
    });
  });

  it("clearRuntimeSetting removes persisted config", async () => {
    const { saveRuntimeSetting, loadRuntimeSetting, clearRuntimeSetting } = await import(
      "../src/lib/client"
    );
    saveRuntimeSetting({ pollinations: { image_model: "flux" } });
    clearRuntimeSetting();
    expect(loadRuntimeSetting()).toEqual({});
  });

  it("drops blank override values so empty inputs fall back to server defaults", async () => {
    const { saveRuntimeSetting, loadRuntimeSetting } = await import("../src/lib/client");
    saveRuntimeSetting({
      pollinations: {
        api_key: "",
        planning_model: "openai",
        prompt_model: " ",
        image_model: "flux"
      }
    });
    expect(loadRuntimeSetting()).toEqual({
      pollinations: {
        planning_model: "openai",
        image_model: "flux"
      }
    });
  });
});
