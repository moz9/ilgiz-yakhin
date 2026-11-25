import { describe, expect, it } from "vitest";
import { attach, authority, bytesOf, cosign, issue, sign, split, verify } from "./signing";

const DOC = "Договор поставки № 14. Сумма 120 000 ₽.";

describe("multi-signer signatures", () => {
  it("adds a signer without touching the bytes of earlier ones", async () => {
    const ca = await authority();
    const [a, b] = await Promise.all([issue(ca, "Орлов П. Н.", "Директор", "01"), issue(ca, "Сафина Л. Р.", "Главный бухгалтер", "02")]);
    const first = [await sign(a, DOC, "10:00")];
    const before = bytesOf(first[0]);
    const both = cosign(first, await sign(b, DOC, "10:05"));
    expect(both).toHaveLength(2);
    expect(bytesOf(both[0])).toEqual(before);
    for (const s of both) expect(await verify(s, DOC, ca, true)).toEqual({ integrity: true, certificate: true, chain: true, revocation: "checked" });
    expect(split(both).map((c) => c[0].serial)).toEqual(["01", "02"]);
  });

  it("fails integrity for every signer when the document changes", async () => {
    const ca = await authority();
    const a = await issue(ca, "Орлов П. Н.", "Директор", "01");
    const s = await sign(a, DOC, "10:00");
    expect((await verify(s, DOC + " ", ca, true)).integrity).toBe(false);
  });

  it("keeps integrity, certificate, chain and revocation as separate results", async () => {
    const ca = await authority(), other = await authority("Чужой УЦ");
    const a = await issue(other, "Орлов П. Н.", "Директор", "01");
    const s = await sign(a, DOC, "10:00");
    expect(await verify(s, DOC, ca, false)).toEqual({ integrity: true, certificate: true, chain: false, revocation: "unknown" });
    expect(await verify({ ...s, cert: null }, DOC, ca, true)).toMatchObject({ certificate: false, integrity: null });
    const expired = await issue(ca, "Титов А. В.", "Юрист", "03", "2025-01-01");
    expect((await verify(await sign(expired, DOC, "10:00"), DOC, ca, true)).chain).toBe(false);
  });

  it("attaches the certificate the signature verifies with, not the first one with that serial", async () => {
    const ca = await authority();
    const real = await issue(ca, "Орлов П. Н.", "Директор", "01");
    const decoy = await issue(ca, "Орлов П. Н.", "Директор", "01");
    const s = { ...(await sign(real, DOC, "10:00")), cert: null };
    const { entry, tried, picked } = await attach(s, [decoy.cert, real.cert]);
    expect(tried).toBe(2);
    expect(picked).toEqual(real.cert);
    expect((await verify(entry, DOC, ca, true)).integrity).toBe(true);
  });
});
