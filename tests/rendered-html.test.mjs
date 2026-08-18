import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("includes the complete frontend-only TapWire product story", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");

  for (const step of ["Identify", "Verify", "Confirm", "Authorize", "Settle"]) {
    assert.match(page, new RegExp(`\\"${step}\\"`));
  }

  assert.match(page, /type DemoState = "idle" \| "searching" \| "results" \| "authorized" \| "ready"/);
  assert.match(page, /Currently unavailable/);
  assert.match(page, /No location or financial data is collected/);
  assert.match(page, /exact cash and electronic-float balance private/);
});

test("uses the requested palette and responsive safeguards", async () => {
  const styles = await readFile(new URL("app/globals.css", root), "utf8");
  assert.match(styles, /--blue:#021f94/);
  assert.match(styles, /--paper:#f5f2f3/);
  assert.match(styles, /@media \(max-width:480px\)/);
  assert.match(styles, /prefers-reduced-motion:reduce/);
});

test("uses the supplied TapWire branding for the site and previews", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  const layout = await readFile(new URL("app/layout.tsx", root), "utf8");

  assert.match(page, /src="\/tapwire-logo\.png"/);
  assert.match(page, /src="\/icon\.png"/);
  assert.match(layout, /TapWire — Tap\. Connect\. Send\./);
  await access(new URL("public/tapwire-logo.png", root));
  await access(new URL("public/og.png", root));
  await access(new URL("app/icon.png", root));
  await access(new URL("app/apple-icon.png", root));
});

test("is configured as a Vercel-native Next.js application", async () => {
  const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));
  const readme = await readFile(new URL("README.md", root), "utf8");

  assert.equal(packageJson.scripts.dev, "next dev --hostname 0.0.0.0");
  assert.equal(packageJson.scripts.build, "next build");
  assert.equal(packageJson.scripts.start, "next start --hostname 0.0.0.0");
  assert.equal(packageJson.dependencies.next, "16.3.1");
  assert.equal(packageJson.dependencies.vinext, undefined);
  assert.doesNotMatch(readme, /vinext|Cloudflare|Wrangler|Drizzle/i);
  await assert.rejects(access(new URL("vite.config.ts", root)));
  await assert.rejects(access(new URL(".openai/hosting.json", root)));
});
