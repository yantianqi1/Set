import { afterEach, describe, expect, it, vi } from "vitest";
import { createDefaultProviders } from "../src/modules/default-providers";

const POLLINATIONS_CONFIG = {
  baseUrl: "https://gen.pollinations.ai",
  apiKey: "pollinations-secret",
  planningModel: "openai",
  promptModel: "openai-fast",
  imageModel: "flux"
} as const;

describe("default providers image download", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("downloads images without forwarding the pollinations api key", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("png-bytes", {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "Cache-Control": "public, max-age=60"
        }
      })
    );
    const providers = createDefaultProviders();

    const result = await providers.imageProvider.fetchImage({
      imageUrl: "https://cdn.example.com/generated.png",
      pollinationsConfig: POLLINATIONS_CONFIG
    });

    expect(fetchSpy).toHaveBeenCalledWith("https://cdn.example.com/generated.png", {});
    expect(result.contentType).toBe("image/png");
    expect(result.cacheControl).toBe("public, max-age=60");
  });

  it("rejects non-http image urls before making a download request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const providers = createDefaultProviders();

    await expect(
      providers.imageProvider.fetchImage({
        imageUrl: "javascript:alert(1)",
        pollinationsConfig: POLLINATIONS_CONFIG
      })
    ).rejects.toThrow("Image download url must be an absolute http(s) URL");

    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("rejects relative image urls before making a download request", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const providers = createDefaultProviders();

    await expect(
      providers.imageProvider.fetchImage({
        imageUrl: "/generated.png",
        pollinationsConfig: POLLINATIONS_CONFIG
      })
    ).rejects.toThrow("Image download url must be an absolute http(s) URL");

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
