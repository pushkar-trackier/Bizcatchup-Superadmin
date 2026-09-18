import { fakerEN_IN as faker } from "@faker-js/faker";

/** Deterministic seed so pagination/search behave identically across reloads. */
const SEED = 20250917;

const FIRESTORE_ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function makeFirestoreId(rng: () => number, length = 20): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += FIRESTORE_ID_ALPHABET[Math.floor(rng() * FIRESTORE_ID_ALPHABET.length)];
  }
  return out;
}

/** A tiny seeded PRNG (mulberry32) so IDs stay stable independent of faker's own cursor. */
function mulberry32(a: number) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let initialized = false;

/** Call once before generating any mock collection. Idempotent. */
export function initMockRandomness() {
  if (initialized) return;
  faker.seed(SEED);
  initialized = true;
}

export function idRng(streamOffset: number): () => number {
  return mulberry32(SEED + streamOffset);
}

export { faker };

