"use client"

import { useState, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Stack, Text, Button, Loader } from "@mantine/core"
import { IconDice } from "@tabler/icons-react"
import { GenreTags } from "@/src/components/GenreTags"
import { fetchAnimesPool } from "@/src/lib/anilist"
import { useTierlistStore } from "@/src/store/tierlist"
import { shuffle } from "@/src/lib/utils"

export function TierlistRandomTab() {
  const router = useRouter()
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setAnimes = useTierlistStore((s) => s.setAnimes)
  const setGenres = useTierlistStore((s) => s.setGenres)
  const abortRef = useRef<AbortController | null>(null)

  const handleGenerate = useCallback(async () => {
    if (selectedGenres.length === 0) {
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
        { genres: selectedGenres, maxPages: 5 },
        controller.signal
      )

      if (pool.length < 16) {
        setError(`Só encontramos ${pool.length} animes nesses gêneros. Selecione mais gêneros.`)
        return
      }

      const picked = shuffle(pool).slice(0, 16)
      setGenres(selectedGenres)
      setAnimes(picked)

      const id = useTierlistStore.getState().id
      router.push(`/tierlist/${id}`)
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return
      setError("Erro ao buscar animes. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [selectedGenres, setAnimes, setGenres, router])

  return (
    <Stack gap="lg" align="center">
      <Text c="#888" size="sm" ta="center">
        Selecione os gêneros e o sistema vai sortear 16 animes para você classificar nos tiers!
      </Text>

      <GenreTags selected={selectedGenres} onSelect={setSelectedGenres} />

      {error && <Text c="red" size="sm" role="alert">{error}</Text>}

      <Button
        size="lg"
        radius="md"
        fullWidth
        disabled={selectedGenres.length === 0 || loading}
        onClick={handleGenerate}
        leftSection={loading ? <Loader color="white" size="sm" aria-label="Carregando..." /> : <IconDice size={20} />}
        styles={{
          root: {
            background: selectedGenres.length > 0 && !loading
              ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
              : undefined,
          },
        }}
      >
        {loading ? "Gerando..." : "Gerar Tierlist!"}
      </Button>
    </Stack>
  )
}
