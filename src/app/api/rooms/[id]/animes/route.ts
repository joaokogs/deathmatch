import { NextRequest, NextResponse } from "next/server"
import { addAnimeToPool } from "@/src/lib/room"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { playerId, anime } = await req.json()

    if (!playerId || !anime) {
      return NextResponse.json(
        { error: "Campos obrigatórios: playerId, anime" },
        { status: 400 }
      )
    }

    const result = await addAnimeToPool(id, playerId, anime)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erro ao adicionar anime" }, { status: 500 })
  }
}
