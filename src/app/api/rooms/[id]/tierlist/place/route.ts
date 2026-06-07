import { NextRequest, NextResponse } from "next/server"
import { placeAnimeInTier } from "@/src/lib/room"
import type { TierLabel } from "@/src/lib/types"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { playerId, animeId, tier } = await req.json() as {
      playerId: string
      animeId: number
      tier: TierLabel
    }

    if (!playerId || !animeId || !tier) {
      return NextResponse.json(
        { error: "Campos obrigatórios: playerId, animeId, tier" },
        { status: 400 }
      )
    }

    const result = await placeAnimeInTier(id, playerId, animeId, tier)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Erro ao classificar anime" },
      { status: 500 }
    )
  }
}
