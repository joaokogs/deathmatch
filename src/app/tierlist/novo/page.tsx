"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Stack, Text, Button, Center, Loader, Container,
} from "@mantine/core"
import { IconList } from "@tabler/icons-react"
import { GenreTags } from "@/src/components/GenreTags"
import { fetchAnimes } from "@/src/lib/anilist"
import { useTierlistStore } from "@/src/store/tierlist"
import { shuffle } from "@/src/lib/utils"

export default function NovoTierlistPage() {
  const router = useRouter()
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const setAnimes = useTierlistStore((s) => s.setAnimes)
  const setGenres = useTierlistStore((s) => s.setGenres)

  const handleGenerate = useCallback(async () => {
    if (selectedGenres.length === 0) {
      setError("Selecione pelo menos um gênero")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Busca 50 animes dos gêneros selecionados
      const res = await fetchAnimes({
        genres: selectedGenres,
        page: 1,
        sort: "POPULARITY_DESC",
      })

      const all = res.animes
      if (all.length < 16) {
        setError(`Só encontramos ${all.length} animes nesses gêneros. Selecione mais gêneros.`)
        return
      }

      const picked = shuffle(all).slice(0, 16)
      setGenres(selectedGenres)
      setAnimes(picked)

      const id = useTierlistStore.getState().id
      router.push(`/tierlist/${id}`)
    } catch {
      setError("Erro ao buscar animes. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }, [selectedGenres, setAnimes, setGenres, router])

  return (
    <Center mih="100dvh" px="sm">
      <Container size="sm" py="xl">
        <Stack gap="lg" align="center">
          <IconList size={48} color="#8b5cf6" style={{ width: "clamp(32px, 12vw, 48px)", height: "clamp(32px, 12vw, 48px)" }} />
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
            Tierlist
          </Text>
          <Text c="#888" size="sm" ta="center">
            Selecione os gêneros e o sistema vai sortear 16 animes para você classificar nos tiers!
          </Text>

          <GenreTags selected={selectedGenres} onSelect={setSelectedGenres} />

          {error && <Text c="red" size="sm">{error}</Text>}

          <Button
            size="lg"
            radius="md"
            fullWidth
            disabled={selectedGenres.length === 0 || loading}
            onClick={handleGenerate}
            styles={{
              root: {
                background: selectedGenres.length > 0 && !loading
                  ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                  : undefined,
              },
            }}
          >
            {loading ? (
              <Loader color="white" size="sm" />
            ) : (
              "Gerar Tierlist!"
            )}
          </Button>
        </Stack>
      </Container>
    </Center>
  )
}
