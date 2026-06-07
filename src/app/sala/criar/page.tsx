"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Stack, Text, TextInput, Button, Center, SegmentedControl, Group } from "@mantine/core"
import { IconUsers, IconSwords, IconList } from "@tabler/icons-react"
import type { RoomMode } from "@/src/lib/types"

export default function CriarSalaPage() {
  const router = useRouter()
  const [nickname, setNickname] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("anime-battle-nickname") || ""
    }
    return ""
  })
  const [salaName, setSalaName] = useState("")
  const [mode, setMode] = useState<RoomMode>("tournament")
  const [animeCount, setAnimeCount] = useState<8 | 16>(16)
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
          mode,
          ...(mode === "tierlist" ? { animeCount } : {}),
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || "Erro ao criar sala"); return }

      localStorage.setItem("anime-battle-player-id", data.hostId)
      localStorage.setItem("anime-battle-room-id", data.room.id)
      localStorage.setItem("anime-battle-nickname", nickname.trim())
      localStorage.setItem("anime-battle-room-mode", mode)
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
          Crie uma sala e compartilhe o link com seus amigos!
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

        <Stack gap={4} w="100%">
          <Text size="sm" c="#888" fw={500}>
            Modo de jogo
          </Text>
          <SegmentedControl
            value={mode}
            onChange={(v) => setMode(v as RoomMode)}
            data={[
              { label: "Torneio", value: "tournament" },
              { label: "Tierlist", value: "tierlist" },
            ]}
            fullWidth
            size="md"
              styles={{
                root: { backgroundColor: "#141414", border: "1px solid #2a2a2a" },
                indicator: {
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                },
                label: { color: "#888" },
              }}
            />
          </Stack>

          {mode === "tierlist" && (
          <Stack gap={4} w="100%">
            <Text size="sm" c="#888" fw={500}>
              Quantidade de animes
            </Text>
            <SegmentedControl
              value={String(animeCount)}
              onChange={(v) => setAnimeCount(Number(v) as 8 | 16)}
              data={[
                { label: "8 animes", value: "8" },
                { label: "16 animes", value: "16" },
              ]}
              fullWidth
              size="md"
              styles={{
                root: { backgroundColor: "#141414", border: "1px solid #2a2a2a" },
                indicator: {
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                },
                label: { color: "#888" },
              }}
            />
          </Stack>
        )}

        {error && <Text c="red" size="sm">{error}</Text>}

        <Button
          size="lg"
          radius="md"
          fullWidth
          disabled={!nickname.trim() || !salaName.trim() || creating}
          onClick={handleCreate}
          leftSection={mode === "tierlist" ? <IconList size={20} /> : <IconSwords size={20} />}
          styles={{
            root: {
              background: nickname.trim() && salaName.trim() && !creating
                ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                : undefined,
            },
          }}
        >
          {creating ? "Criando..." : mode === "tierlist" ? "Criar Sala Tierlist" : "Criar Sala Torneio"}
        </Button>
      </Stack>
    </Center>
  )
}
