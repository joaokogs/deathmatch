import { NextRequest, NextResponse } from "next/server"
import { sendMessage } from "@/src/lib/room"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { playerId, text } = await req.json()

    if (!playerId || !text?.trim()) {
      return NextResponse.json(
        { error: "Campos obrigatórios: playerId, text" },
        { status: 400 }
      )
    }

    const result = await sendMessage(id, playerId, text.trim())

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erro ao enviar mensagem" }, { status: 500 })
  }
}
