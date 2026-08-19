import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("includes the complete CredLink demo workflow", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");

  for (const copy of [
    "Ghana Card number",
    "Demo code",
    "Before we build your profile",
    "Building your financial profile",
    "CredLink Score",
    "Explore your loan options",
    "Submit loan request",
    "Institution portal",
    "Lender decision",
    "Demo reset",
  ]) {
    assert.match(page, new RegExp(copy));
  }
});

test("uses CredLink branding and PWA metadata", async () => {
  const layout = await readFile(new URL("app/layout.tsx", root), "utf8");
  const manifest = await readFile(new URL("public/manifest.webmanifest", root), "utf8");
  const packageJson = JSON.parse(await readFile(new URL("package.json", root), "utf8"));

  assert.equal(packageJson.name, "credlink");
  assert.match(layout, /CredLink — Financial behaviour connected/);
  assert.match(layout, /serviceWorker/);
  assert.match(manifest, /"name": "CredLink"/);
  assert.match(manifest, /"display": "standalone"/);
  await access(new URL("public/sw.js", root));
  await access(new URL("public/icon-192.png", root));
  await access(new URL("public/icon-512.png", root));
});

test("uses the requested responsive financial interface safeguards", async () => {
  const styles = await readFile(new URL("app/globals.css", root), "utf8");

  assert.match(styles, /--green: #0b7555/);
  assert.match(styles, /safe-area-inset-bottom/);
  assert.match(styles, /@media \(max-width: 950px\)/);
  assert.match(styles, /@media \(max-width: 560px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});

test("does not retain old visible product names", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  const layout = await readFile(new URL("app/layout.tsx", root), "utf8");
  const readme = await readFile(new URL("README.md", root), "utf8");
  const oldNames = ["Tap" + "Wire", "We" + "Wire", "Sika" + "Bridge"];

  for (const content of [page, layout, readme]) {
    for (const oldName of oldNames) {
      assert.equal(content.toLowerCase().includes(oldName.toLowerCase()), false);
    }
  }
});
