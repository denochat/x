// Imports
import { extname, resolve } from "https://deno.land/std@0.96.0/path/mod.ts";

const regex1 = /^\/(\w+)(?:@)([^\/\\]*)(.*)$/;
const regex2 = /^\/(\w+)(.*)$/;

function getVars(
  url: string,
): null | [module: string, version: string | null, path: string] {
  const result1 = url.match(regex1);
  if (!result1) {
    const result2 = url.match(regex2);
    if (!result2) return null;
    return [result2[1], null, result2[3]];
  }
  return [result1[1], result1[2], result1[3]];
}

function buildUrl(
  module: string,
  version: string | null,
  path: string,
): string {
  return `https://raw.githubusercontent.com/denochat/${module}/${version ||
    "main"}${resolve("/", path)}`;
}

const types: Record<string, string> = {
  ".ts": "text/typescript",
  ".tsx": "text/typescript",
  ".js": "text/javascript",
  ".jsx": "text/javascript",
};

const denoImportIntellisense = JSON.stringify({
  version: 1,
  registries: [
    {
      schema: "/:module(\w+)@:version?/:path*",
      variables: [
        {
          key: "module",
          url: "https://ix.denochat.dev/modules",
        },
        {
          key: "version",
          url: "https://ix.denochat.dev/versions?module=${module}",
        },
        {
          key: "path",
          url:
            "https://ix.denochat.dev/paths?module=${module}&version=${{version}}",
        },
      ],
    },
    {
      schema: "/:module(\w+)/:path*",
      variables: [
        {
          key: "module",
          url: "https://ix.denochat.dev/modules",
        },
        {
          key: "path",
          url: "https://ix.denochat.dev/paths?module=${module}&latest=yes",
        },
      ],
    },
  ],
});

addEventListener("fetch", async (event: FetchEvent) => {
  const { pathname } = new URL(event.request.url);
  if (pathname === "/.well-known/deno-import-intellisense.json") {
    await event.respondWith(
      new Response(denoImportIntellisense, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    return;
  } else {
    const parts = getVars(pathname);
    console.log(parts);
    if (parts && parts[0] && parts[2]) {
      try {
        const nurl = buildUrl(...parts);
        const response = await fetch(nurl);
        const ext = extname(event.request.url);
        const type = types[ext];
        if (response.ok && type) {
          await event.respondWith(
            new Response(await response.text(), {
              headers: { "Content-Type": type },
            }),
          );
          return;
        }
        await event.respondWith(
          new Response("Something went wrong!", { status: 500 }),
        );
        return;
      } catch (error) {
        console.error(event.request, error);
        await event.respondWith(
          new Response("Something went wrong!", { status: 500 }),
        );
        return;
      }
    }
    return event.respondWith(new Response("Not found!", { status: 401 }));
  }
});
