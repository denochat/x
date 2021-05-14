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

localStorage.setItem("hello", "" + Date.now());

addEventListener(
  "fetch",
  (event) => event.respondWith(new Response(localStorage.getItem("hello"))),
);
