"use client";

import { useState } from "react";
import { Check, Copy, Mail } from "lucide-react";

const email = "im@angelius.ru";

/** The closing call to action: a big address over the same light as the hero. */
export function ContactBlock({ title = "Есть задача? Давайте обсудим" }: { title?: string }) {
  const [copied, setCopied] = useState(false);
  return <section className="contact" id="contact" aria-labelledby="contact-title" data-field="#ff6b8b #4a5cff 0.66">
    <div className="contact-lights" aria-hidden="true"><i /><i /><i /></div>
    <p className="hero-status"><i aria-hidden="true" />Открыт к удалённой работе</p>
    <h2 id="contact-title">{title}</h2>
    <a className="contact-mail" href={`mailto:${email}`}>{email}</a>
    <div className="contact-actions">
      <a className="button button-primary" href={`mailto:${email}`} data-lg="button" data-lg-variant="prominent"><Mail aria-hidden="true" />Написать письмо</a>
      <button className="button" type="button" data-lg="button" onClick={async () => {
        try { await navigator.clipboard.writeText(email); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch { /* Clipboard may be blocked: the address is visible above. */ }
      }}>{copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}<span aria-live="polite">{copied ? "Скопировано" : "Скопировать адрес"}</span></button>
    </div>
  </section>;
}
