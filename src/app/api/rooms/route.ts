import { NextRequest, NextResponse } from "next/server"
import { createRoom } from "@/src/lib/room"

export async function POST(req: NextRequest) {
  try {
    const { name, hostNickname, mode } = await req.json()

    if (!name || !hostNickname) {
      return NextResponse.json(
        { error: "Campos obrigatórios: name, hostNickname" },
        { status: 400 }
      )
    }

    const room = await createRoom(name, hostNickname, mode || "tournament")

    return NextResponse.json({ room, hostId: room.hostId })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Erro ao criar sala" },
      { status: 500 }
    )
  }
}
