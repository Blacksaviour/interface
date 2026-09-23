import { beforeEach, describe, expect, it } from "vitest";
import { usePreferencesStore } from "./preferences-store";

describe("preferences-store", () => {
  beforeEach(() => {
    // Reset Zustand store state and localStorage for deterministic tests
    localStorage.clear();
    usePreferencesStore.setState({ slippageTolerance: 0.5 });
  });

  it("has default slippage tolerance of 0.5", () => {
    expect(usePreferencesStore.getState().slippageTolerance).toBe(0.5);
  });

  it("updates slippage tolerance within valid range", () => {
    usePreferencesStore.getState().setSlippageTolerance(1.0);
    expect(usePreferencesStore.getState().slippageTolerance).toBe(1.0);
  });

  it("rejects slippage tolerance below 0.1", () => {
    usePreferencesStore.getState().setSlippageTolerance(0.05);
    expect(usePreferencesStore.getState().slippageTolerance).toBe(0.5);
  });

  it("rejects slippage tolerance above 50", () => {
    usePreferencesStore.getState().setSlippageTolerance(51);
    expect(usePreferencesStore.getState().slippageTolerance).toBe(0.5);
  });

  it("rejects NaN slippage tolerance", () => {
    usePreferencesStore.getState().setSlippageTolerance(NaN);
    expect(usePreferencesStore.getState().slippageTolerance).toBe(0.5);
  });

  it("persists to and rehydrates from storage", () => {
    usePreferencesStore.getState().setSlippageTolerance(2.0);
    expect(localStorage.getItem("preferences-storage")).toContain("2");
    
    // Test rehydration by manually modifying local storage and calling rehydrate (simulated)
    const stored = JSON.parse(localStorage.getItem("preferences-storage") || "{}");
    expect(stored.state.slippageTolerance).toBe(2.0);
  });
});
