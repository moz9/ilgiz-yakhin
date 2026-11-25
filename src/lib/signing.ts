/**
 * A browser model of detached multi-signer signatures, built on real WebCrypto: each person has a
 * key pair, a demo certificate authority signs their certificates, and every signature covers the
 * SHA-256 of the document. The product signs with GOST keys through a crypto provider and stores
 * CMS/CAdES; here ECDSA P-256 and JSON stand in, so the rules can be shown live without a token.
 */

const subtle = globalThis.crypto.subtle;
const enc = new TextEncoder();
const ALG = { name: "ECDSA", namedCurve: "P-256" } as const;
const SIG = { name: "ECDSA", hash: "SHA-256" } as const;

const b64 = (buf: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(buf instanceof Uint8Array ? buf : new Uint8Array(buf))));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
export const hex = (bytes: Uint8Array, n = 12) => [...bytes.slice(0, n)].map((x) => x.toString(16).padStart(2, "0")).join(" ");

export async function sha256(text: string) { return new Uint8Array(await subtle.digest("SHA-256", enc.encode(text))); }

export type Cert = { serial: string; owner: string; role: string; org: string; validTo: string; key: JsonWebKey; caSignature: string };
export type Person = { cert: Cert; privateKey: CryptoKey };
export type SignerInfo = { serial: string; digest: string; signature: string; signedAt: string; cert: Cert | null };
export type Container = SignerInfo[];

const tbs = (c: Omit<Cert, "caSignature">) => enc.encode(JSON.stringify([c.serial, c.owner, c.role, c.org, c.validTo, c.key.x, c.key.y]));
/** The exact bytes a signer info occupies in the container: what must survive adding a new signer. */
/** The raw signature value of one signer: what a person would compare by eye. */
export const signatureBytes = (s: SignerInfo) => unb64(s.signature);
export const bytesOf = (s: SignerInfo) => enc.encode(JSON.stringify([s.serial, s.digest, s.signature, s.signedAt]));

export type Authority = { name: string; key: CryptoKeyPair };

export async function authority(name = "Демо УЦ"): Promise<Authority> {
  return { name, key: await subtle.generateKey(ALG, true, ["sign", "verify"]) as CryptoKeyPair };
}

export async function issue(ca: Authority, owner: string, role: string, serial: string, validTo = "2027-12-31"): Promise<Person> {
  const pair = await subtle.generateKey(ALG, true, ["sign", "verify"]) as CryptoKeyPair;
  const key = await subtle.exportKey("jwk", pair.publicKey);
  const body = { serial, owner, role, org: "ООО «Демо-Центр»", validTo, key: { kty: key.kty, crv: key.crv, x: key.x, y: key.y } };
  const caSignature = b64(await subtle.sign(SIG, ca.key.privateKey, tbs(body)));
  return { cert: { ...body, caSignature }, privateKey: pair.privateKey };
}

/** A signature of the document by one person: independent of everyone who signed before. */
export async function sign(person: Person, document: string, signedAt: string): Promise<SignerInfo> {
  const digest = await sha256(document);
  const signature = b64(await subtle.sign(SIG, person.privateKey, digest));
  return { serial: person.cert.serial, digest: b64(digest), signature, signedAt, cert: person.cert };
}

/** Adding a signer never rebuilds the others: their entries are carried over as they are. */
export const cosign = (container: Container, added: SignerInfo): Container => [...container, added];
/** One container per signer, each with that signer's entry untouched. */
export const split = (container: Container): Container[] => container.map((s) => [s]);

const publicKey = (c: Cert) => subtle.importKey("jwk", { ...c.key, ext: true }, ALG, false, ["verify"]);

async function signatureMatches(s: SignerInfo, cert: Cert) {
  return subtle.verify(SIG, await publicKey(cert), unb64(s.signature), unb64(s.digest));
}

export type Check = {
  /** The document still hashes to the signed digest and the signature verifies against it. */
  integrity: boolean | null;
  /** The certificate travels with the signature, so another workstation can check it. */
  certificate: boolean;
  /** The authority's signature over the certificate holds and the certificate has not expired. */
  chain: boolean | null;
  /** Revocation could only be checked when the local revocation data was available. */
  revocation: "checked" | "unknown";
};

export async function verify(s: SignerInfo, document: string, ca: Authority, revocationAvailable: boolean, today = "2026-11-25"): Promise<Check> {
  const sameDocument = b64(await sha256(document)) === s.digest;
  if (!s.cert) return { integrity: null, certificate: false, chain: null, revocation: "unknown" };
  const integrity = sameDocument && (await signatureMatches(s, s.cert));
  const caKey = ca.key.publicKey;
  const { caSignature, ...body } = s.cert;
  const chain = (await subtle.verify(SIG, caKey, unb64(caSignature), tbs(body))) && s.cert.validTo >= today;
  return { integrity, certificate: true, chain, revocation: revocationAvailable ? "checked" : "unknown" };
}

/**
 * Puts the public certificate back into a signer entry. A name or serial can match several
 * certificates in the store; the one taken is the one the signature mathematically verifies with.
 */
export async function attach(s: SignerInfo, store: Cert[]): Promise<{ entry: SignerInfo; tried: number; picked: Cert | null }> {
  let tried = 0;
  for (const cert of store.filter((c) => c.serial === s.serial)) {
    tried++;
    if (await signatureMatches(s, cert)) return { entry: { ...s, cert }, tried, picked: cert };
  }
  return { entry: s, tried, picked: null };
}
