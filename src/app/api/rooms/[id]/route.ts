import { NextRequest, NextResponse } from "next/server"
import { getRoom } from "@/src/lib/room"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const room = await getRoom(id)

  if (!room) {
    return NextResponse.json({ error: "Sala não encontrada" }, { status: 404 })
  }

  return NextResponse.json({ room })
}
