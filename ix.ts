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

addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  console.log(url);
  event.respondWith(new Response("OK", { status: 200 }));
});
