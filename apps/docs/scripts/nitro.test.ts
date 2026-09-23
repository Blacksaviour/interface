import { test, expect, beforeAll, afterAll } from "bun:test";
import { spawn, Subprocess } from "bun";
import { join } from "node:path";

let server: Subprocess;
const PORT = 3005;

beforeAll(async () => {
  const appRoot = import.meta.dirname.replace(/\/scripts$/, "");
  server = spawn(["node", join(appRoot, ".output/server/index.mjs")], {
    env: { ...process.env, PORT: String(PORT) },
    stdout: "inherit",
    stderr: "inherit",
  });
  
  // wait for server to start
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://localhost:${PORT}/resources/faq`);
      if (res.ok) break;
    } catch (e) {
      await Bun.sleep(100);
    }
  }
});

afterAll(() => {
  server?.kill();
});

test("serves HTML with correct headers", async () => {
  const res = await fetch(`http://localhost:${PORT}/resources/faq`);
  expect(res.status).toBe(200);
  
  const cacheControl = res.headers.get("cache-control");
  expect(cacheControl).toBe("s-maxage=300, stale-while-revalidate=86400");
  
  const csp = res.headers.get("content-security-policy") || "";
  expect(csp).toContain("default-src 'none'");
  expect(csp).not.toContain("'unsafe-eval'");
  expect(csp).not.toContain("'unsafe-inline' script");
});

test("serves hashed assets with immutable cache", async () => {
  // Test routeRules for /assets/**
  const res = await fetch(`http://localhost:${PORT}/assets/fake.css`);
  const cacheControl = res.headers.get("cache-control");
  expect(cacheControl).toBe("public, max-age=31536000, immutable");
});

test("redirects resolve with a 301", async () => {
  const res = await fetch(`http://localhost:${PORT}/old-path`, { redirect: "manual" });
  expect(res.status).toBe(301);
  expect(res.headers.get("location")).toBe("/new-path");
});
