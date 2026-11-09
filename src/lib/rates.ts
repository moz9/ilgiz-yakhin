/** The shape of the widget's rates, shared by the server loader and the showcase. */
export type Rate = { code: string; value: number; previous: number };
export type Rates = { date: string; previousDate: string; rates: Rate[]; source: "cbr" | "mirror" | "saved" };

/** The rates the app showed on 7 November 2026: shown until live rates arrive, or when no source answers. */
export const SAVED_RATES: Rates = {
  date: "2026-11-07",
  previousDate: "2026-11-06",
  rates: [{ code: "USD", value: 82.14, previous: 81.8 }, { code: "EUR", value: 92.19, previous: 92.16 }],
  source: "saved",
};
