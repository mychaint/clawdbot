// Tests usage-line formatting for agent runner completion summaries.
import { describe, expect, it } from "vitest";
import { getReplyPayloadMetadata, setReplyPayloadMetadata } from "../reply-payload.js";
import { appendUsageLine, formatResponseUsageLine } from "./agent-runner-usage-line.js";

const BASE = { usage: { input: 100, output: 50 }, showCost: false };

describe("formatResponseUsageLine", () => {
  it("returns null when usage is undefined", () => {
    expect(formatResponseUsageLine({ showCost: false })).toBeNull();
  });

  it("formats token counts without suffix", () => {
    expect(formatResponseUsageLine(BASE)).toBe("Usage: 100 in / 50 out");
  });

  it("appends providerQuotaSuffix when provided", () => {
    expect(formatResponseUsageLine({ ...BASE, providerQuotaSuffix: "Premium 86% left" })).toBe(
      "Usage: 100 in / 50 out · Premium 86% left",
    );
  });

  it("does not append when providerQuotaSuffix is undefined", () => {
    expect(formatResponseUsageLine({ ...BASE, providerQuotaSuffix: undefined })).toBe(
      "Usage: 100 in / 50 out",
    );
  });

  it("does not append when providerQuotaSuffix is empty string", () => {
    expect(formatResponseUsageLine({ ...BASE, providerQuotaSuffix: "" })).toBe(
      "Usage: 100 in / 50 out",
    );
  });

  it("appends quota suffix after cost suffix when both are present", () => {
    const costConfig = { input: 0.000003, output: 0.000015, cacheRead: 0, cacheWrite: 0 };
    const result = formatResponseUsageLine({
      ...BASE,
      showCost: true,
      costConfig,
      providerQuotaSuffix: "Premium 90% left",
    });
    // cost suffix comes before quota suffix
    expect(result).toMatch(/est \$.*· Premium 90% left$/);
  });
});

describe("appendUsageLine", () => {
  it("preserves reply payload metadata when appending usage text", () => {
    const payload = setReplyPayloadMetadata(
      { text: "message tool reply" },
      {
        deliverDespiteSourceReplySuppression: true,
        sourceReplyTranscriptMirror: {
          sessionKey: "agent:main:telegram:direct:123",
          agentId: "main",
          text: "message tool reply",
          idempotencyKey: "run-1:internal-source-reply:0",
        },
      },
    );

    const [updated] = appendUsageLine([payload], "Usage: 12 in / 3 out");

    expect(updated).toEqual({ text: "message tool reply\nUsage: 12 in / 3 out" });
    expect(getReplyPayloadMetadata(updated)).toMatchObject({
      deliverDespiteSourceReplySuppression: true,
      sourceReplyTranscriptMirror: {
        sessionKey: "agent:main:telegram:direct:123",
        idempotencyKey: "run-1:internal-source-reply:0",
        text: "message tool reply\nUsage: 12 in / 3 out",
      },
    });
  });
});
