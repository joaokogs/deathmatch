"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Stack, Text, Button, Loader, SegmentedControl, Group } from "@mantine/core"
import { IconDice } from "@tabler/icons-react"
import { GenreTags } from "@/src/components/GenreTags"
import { fetchAnimesPool } from "@/src/lib/anilist"
import { useTournamentStore } from "@/src/store/tournament"

type CountOption = 4 | 8 | 16
type RandomMode = "popular" | "genres"

const COUNT_OPTIONS = [
  { label: "4", value: "4" },
  { label: "8", value: "8" },
  { label: "16", value: "16" },
]

export function TournamentRandomTab() {
  const router = useRouter()
  const [count, setCount] = useState<CountOption>(8)
  const [mode, setMode] = useState<RandomMode>("popular")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tournamentName = useTournamentStore((s) => s.pendingName) || "Meu Torneio"
  const createTournament = useTournamentStore((s) => s.createTournament)
  const abortRef = useRef<AbortController | null>(null)

  const handleGenerate = useCallback(async () => {
    if (mode === "genres" && selectedGenres.length === 0) {
      setError("Selecione pelo menos um gênero")
      return
    }

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const pool = await fetchAnimesPool(
        {
          genres: mode === "genres" ? selectedGenres : undefined,
          maxPages: 5,
        },
        controller.signal
      )

      if (pool.length < count) {
        setError(
          `Só encontramos ${pool.length} animes${mode === "genres" ? " nesses gêneros" : ""}. Tente com mais gêneros ou reduza a quantidade.`
        )
        return
      }

      const picked = pool.slice(0, count)

      createTournament(tournamentName, picked)
      const tournamentId = useTournamentStore.getState().tournament?.id
      if (tournamentId) {
        router.push(`/torneio/${tournamentId}`)
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      setError("Erro ao buscar animes. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [count, mode, selectedGenres, tournamentName, createTournament, router])

  const isReady = mode !== "genres" || selectedGenres.length > 0

  return (
    <Stack gap="lg" align="center">
      <Text c="#888" size="sm" ta="center">
        Gere animes aleatórios para o torneio! Escolha a quantidade e o modo de seleção.
      </Text>

      {/* Seletor de quantidade */}
      <Stack gap={4} w="100%">
        <Text size="sm" c="#888" fw={500}>
          Quantidade de animes
        </Text>
        <SegmentedControl
          value={String(count)}
          onChange={(v) => setCount(Number(v) as CountOption)}
          data={COUNT_OPTIONS}
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

      {/* Modo */}
      <Stack gap={4} w="100%">
        <Text size="sm" c="#888" fw={500}>
          Modo de seleção
        </Text>
        <SegmentedControl
          value={mode}
          onChange={(v) => {
            setMode(v as RandomMode)
            setError(null)
          }}
          data={[
            { label: "Popular", value: "popular" },
            { label: "Por Gêneros", value: "genres" },
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

      {mode === "genres" && (
        <GenreTags selected={selectedGenres} onSelect={setSelectedGenres} />
      )}

      {error && <Text c="red" size="sm" role="alert">{error}</Text>}

      <Button
        size="lg"
        radius="md"
        fullWidth
        disabled={!isReady || loading}
        onClick={handleGenerate}
        leftSection={loading ? <Loader color="white" size="sm" aria-label="Carregando..." /> : <IconDice size={20} />}
        styles={{
          root: {
            background: isReady && !loading
              ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
              : undefined,
          },
        }}
      >
        {loading ? "Gerando..." : `Gerar Torneio! (${count} animes)`}
      </Button>
    </Stack>
  )
}
