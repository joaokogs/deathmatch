import { NextRequest, NextResponse } from "next/server"
import { removeAnimeFromPool } from "@/src/lib/room"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { playerId, animeId } = await req.json()

    if (!playerId || animeId == null) {
      return NextResponse.json(
        { error: "Campos obrigatórios: playerId, animeId" },
        { status: 400 }
      )
    }

    const result = await removeAnimeFromPool(id, playerId, animeId)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erro ao remover anime" }, { status: 500 })
  }
}
