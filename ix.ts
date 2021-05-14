/// <reference path="./d.d.ts" />
import { HmacSha256 } from "https://deno.land/std@0.96.0/hash/sha256.ts";

async function getRemoteModules(): Promise<string[]> {
  return (await (await fetch("https://api.github.com/orgs/denochat/repos", {
    headers: { accepts: "application/json" },
  })).json()).map(({ name }: { name: string }) => name);
}

async function getRemoteTags(repo: string): Promise<string[]> {
  return (await (await fetch(
    `https://api.github.com/repos/denochat/${repo}/tags`,
    { headers: { accepts: "application/json" } },
  )).json()).map(({ name }: { name: string }) => name);
}

async function getRemoteFiles(repo: string, ref: string): Promise<string[]> {
  return (await (await fetch(
    `https://api.github.com/repos/denochat/${repo}/git/trees/${ref}?recursive=1`,
    { headers: { accepts: "application/json" } },
  )).json()).tree.map(({ path }: { path: string }) => path);
}

const cache = new Map<string, Map<string, Set<string>>>();

{
  for (const mod of await getRemoteModules()) {
    const tags = new Map<string, Set<string>>();
    for (const tag of await getRemoteTags(mod)) {
      const files = new Set<string>();
      for (const file of await getRemoteFiles(mod, tag)) {
        if (file.endsWith(".ts")) {
          files.add("/" + file);
        }
      }
      if (files.size > 0) {
        tags.set(tag, files);
      }
    }
    if (tags.size > 0) {
      cache.set(mod, tags);
    }
  }
}

const hash = (text: string) =>
  new HmacSha256(Deno.env.get("GITHUB_WEBHOOK_SECRET")!, false, false)
    .update(text)
    .hex().toLowerCase();

addEventListener("fetch", async (event) => {
  const url = new URL(event.request.url);
  if (
    url.pathname === "/webhook" &&
    event.request.method.trim().toLowerCase() === "post"
  ) {
    try {
      const body = await event.request.text();
      console.log(hash(body));
      console.log(event.request.headers.get("X-Hub-Signature-256"));
    } catch {
      await event.respondWith(
        new Response("Internal server error.", { status: 500 }),
      );
      return;
    }
  }
  console.log(url);
  event.respondWith(new Response("OK", { status: 200 }));
});
