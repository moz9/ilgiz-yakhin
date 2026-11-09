import { loadRates } from "@/lib/cbr";

// CBR publishes once a day; an hourly refresh keeps the widget current without hammering the source.
export const revalidate = 3600;

export async function GET() {
  return Response.json(await loadRates());
}
