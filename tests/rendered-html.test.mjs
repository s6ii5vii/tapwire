import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the complete TapWire landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>TapWire — Tap\. Verify\. Pay\.<\/title>/i);
  assert.match(html, /Tap\. Verify\./);
  assert.match(html, /Need cash\? Know where to go/);
  assert.match(html, /Tap identifies you/);
  assert.match(html, /No real transactions/);
  assert.doesNotMatch(html, /codex-preview|SkeletonPreview|react-loading-skeleton/i);
});

test("keeps the experience frontend-only and includes the required product flow", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  const styles = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");

  for (const step of ["Identify", "Verify", "Confirm", "Authorize", "Settle"]) {
    assert.match(page, new RegExp(`\\"${step}\\"`));
  }
  assert.match(page, /type DemoState = "idle" \| "searching" \| "results" \| "authorized" \| "ready"/);
  assert.match(page, /Currently unavailable/);
  assert.match(page, /exact cash and electronic-float balance private/);
  assert.match(styles, /--blue:#021f94/);
  assert.match(styles, /--paper:#f5f2f3/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
  await assert.rejects(access(new URL("../app/_sites-preview/SkeletonPreview.tsx", import.meta.url)));
});
