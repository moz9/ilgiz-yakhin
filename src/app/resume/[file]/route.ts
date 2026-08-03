export const dynamic = "force-static";

const resumeFiles = new Set(["ilgiz-yakhin-compact.pdf", "ilgiz-yakhin-extended.pdf"]);

export function generateStaticParams() {
  return [...resumeFiles].map((file) => ({ file }));
}

export async function GET(_request: Request, { params }: { params: Promise<{ file: string }> }) {
  const file = (await params).file;
  if (!resumeFiles.has(file)) return new Response("Not found", { status: 404 });
  return Response.redirect(`https://raw.githubusercontent.com/moz9/ilgiz-yakhin/main/public/resume/${file}`, 307);
}
