import { NextRequest, NextResponse } from "next/server"
import { useForceVote } from "@/src/lib/room"
import type { TierLabel } from "@/src/lib/types"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { playerId, animeId, fromTier, toTier } = await req.json() as {
      playerId: string
      animeId: number
      fromTier: TierLabel
      toTier: TierLabel
    }

    if (!playerId || !animeId || !fromTier || !toTier) {
      return NextResponse.json(
        { error: "Campos obrigatórios: playerId, animeId, fromTier, toTier" },
        { status: 400 }
      )
    }

    const result = await useForceVote(id, playerId, animeId, fromTier, toTier)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true, swappedAnimeId: result.swappedAnimeId })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Erro ao usar voto com força" },
      { status: 500 }
    )
  }
}
