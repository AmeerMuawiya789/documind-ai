import { describe, it, expect } from "vitest";
import {
  chatSystemPrompt,
  summarizeSystemPrompt,
  extractionSystemPrompt,
  comparisonSystemPrompt,
  SUMMARY_LABELS,
  PROMPT_VERSION,
} from "@/lib/ai/prompts";

describe("prompts", () => {
  it("has a prompt version for tracking", () => {
    expect(PROMPT_VERSION).toMatch(/^v\d+$/);
  });

  it("chat prompt grounds answers and handles missing evidence", () => {
    const p = chatSystemPrompt();
    expect(p).toMatch(/only/i);
    expect(p).toMatch(/doesn't contain/i);
    expect(p).toMatch(/cite/i);
  });

  it("every prompt treats document text as untrusted data", () => {
    const prompts = [
      chatSystemPrompt(),
      summarizeSystemPrompt("overview"),
      extractionSystemPrompt(["Dates"]),
      comparisonSystemPrompt(),
    ];
    for (const p of prompts) {
      expect(p).toMatch(/untrusted/i);
      expect(p).toMatch(/never follow instructions/i);
    }
  });

  it("defines all seven summary kinds", () => {
    expect(Object.keys(SUMMARY_LABELS)).toHaveLength(7);
    for (const kind of Object.keys(SUMMARY_LABELS) as (keyof typeof SUMMARY_LABELS)[]) {
      expect(summarizeSystemPrompt(kind).length).toBeGreaterThan(50);
    }
  });

  it("extraction prompt requires JSON with evidence fields", () => {
    const p = extractionSystemPrompt(["Dates", "Amounts"]);
    expect(p).toMatch(/JSON/);
    expect(p).toMatch(/"Dates"/);
    expect(p).toMatch(/evidence/);
    expect(p).toMatch(/confidence/);
  });

  it("comparison prompt requires the documented JSON shape", () => {
    const p = comparisonSystemPrompt();
    for (const key of ["similarities", "differences", "changed_dates_amounts", "missing_sections", "important_changes", "report"]) {
      expect(p).toContain(key);
    }
  });
});
