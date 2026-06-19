import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { importFromUrl } from "@/services/store-connectors";
import { z } from "zod";

const schema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors.url?.[0] ?? "Invalid URL" },
      { status: 400 }
    );
  }

  const result = await importFromUrl(parsed.data.url);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 422 });
  }

  return NextResponse.json(result.data);
}
