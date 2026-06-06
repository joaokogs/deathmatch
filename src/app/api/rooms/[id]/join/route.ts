import { NextRequest, NextResponse } from "next/server"
import { joinRoom } from "@/src/lib/room"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { nickname } = await req.json()

    if (!nickname?.trim()) {
      return NextResponse.json(
        { error: "Nickname é obrigatório" },
        { status: 400 }
      )
    }

    const result = await joinRoom(id, nickname.trim())

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json(result)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Erro ao entrar na sala" },
      { status: 500 }
    )
  }
}
