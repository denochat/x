import { Sha256 } from "https://deno.land/std@0.96.0/hash/sha256.ts";
const secret =
  "dfgoijwroijxdfoijweroijdfgoijwertoijdfgpoijposirejpijfpoijsdfgpoijwerpoijsdfgpoijweroijspfogihjposig";
const hashed = new Sha256().update(secret).hex().toLowerCase();
console.log(hashed);
