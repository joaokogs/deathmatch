import { NextRequest, NextResponse } from "next/server"
import { startGame } from "@/src/lib/room"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { playerId } = await req.json()

    if (!playerId) {
      return NextResponse.json(
        { error: "playerId é obrigatório" },
        { status: 400 }
      )
    }

    const result = await startGame(id, playerId)

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Erro ao iniciar jogo" },
      { status: 500 }
    )
  }
}
