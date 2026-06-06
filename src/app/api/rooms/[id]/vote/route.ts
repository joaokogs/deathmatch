import { NextRequest, NextResponse } from "next/server"
import { voteAnime } from "@/src/lib/room"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { playerId, battleId, animeId } = await req.json()

    if (!playerId || !battleId || !animeId) {
      return NextResponse.json(
        { error: "Campos obrigatórios: playerId, battleId, animeId" },
        { status: 400 }
      )
    }

    const result = await voteAnime(id, playerId, battleId, animeId)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Erro ao votar" },
      { status: 500 }
    )
  }
}
