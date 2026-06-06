"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Stack, Text, TextInput, Button, Center } from "@mantine/core"
import { IconUsers } from "@tabler/icons-react"

export default function CriarSalaPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("anime-battle-nickname") || ""
    }
    return ""
  })
  const [salaName, setSalaName] = useState("")
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreate = async () => {
    if (!nickname.trim()) { setError("Digite seu nickname"); return }
    if (!salaName.trim()) { setError("Dê um nome pra sala"); return }

    localStorage.setItem("anime-battle-nickname", nickname.trim())
    setCreating(true)
    setError(null)

    try {
      const res = await fetch("/api/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: salaName.trim(),
          hostNickname: nickname.trim(),
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erro ao criar sala"); return }

      localStorage.setItem("anime-battle-player-id", data.hostId)
      localStorage.setItem("anime-battle-room-id", data.room.id)
      localStorage.setItem("anime-battle-nickname", nickname.trim())
      router.push(`/sala/${data.room.id}`)
    } catch {
      setError("Erro de conexão")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Center mih="100dvh" px="sm">
      <Stack align="center" gap="lg" maw={450} w="100%">
        <IconUsers size={48} color="#8b5cf6" style={{ width: "clamp(32px, 12vw, 48px)", height: "clamp(32px, 12vw, 48px)" }} />
        <Text
          fw={900}
          ta="center"
          style={{
            fontSize: "clamp(22px, 8vw, 32px)",
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Criar Sala
        </Text>
        <Text c="#888" size="sm" ta="center">
          Crie uma sala e compartilhe o link com seus amigos.
          Depois todos escolhem os animes juntos!
        </Text>

        <TextInput
          placeholder="Seu nickname"
          value={nickname}
          onChange={(e) => setNickname(e.currentTarget.value)}
          size="lg"
          radius="md"
          w="100%"
          styles={{ input: { backgroundColor: "#141414", border: "1px solid #2a2a2a", color: "white" } }}
        />
        <TextInput
          placeholder="Nome da Sala"
          value={salaName}
          onChange={(e) => setSalaName(e.currentTarget.value)}
          size="lg"
          radius="md"
          w="100%"
          styles={{ input: { backgroundColor: "#141414", border: "1px solid #2a2a2a", color: "white" } }}
        />

        {error && <Text c="red" size="sm">{error}</Text>}

        <Button
          size="lg"
          radius="md"
          fullWidth
          disabled={!nickname.trim() || !salaName.trim() || creating}
          onClick={handleCreate}
          styles={{
            root: {
              background: nickname.trim() && salaName.trim() && !creating
                ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                : undefined,
            },
          }}
        >
          {creating ? "Criando..." : "Criar Sala"}
        </Button>
      </Stack>
    </Center>
  )
}
