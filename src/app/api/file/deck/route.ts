export async function GET() {
  const fileUrl =
    "https://pub-f3908722c2da49ddac69179d6469614a.r2.dev/fisense-pitch-deck.pdf";

  const response = await fetch(fileUrl);

  const buffer = await response.arrayBuffer();

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="fisense-pitch-deck.pdf"',
    },
  });
}
