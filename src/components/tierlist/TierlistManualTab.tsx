"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Stack, Text, Button, SimpleGrid, Badge, Group } from "@mantine/core"
import { IconPlayerPlay } from "@tabler/icons-react"
import { AnimeSearch } from "@/src/components/AnimeSearch"
import { AnimeCard } from "@/src/components/AnimeCard"
import { useTierlistStore } from "@/src/store/tierlist"
import type { Anime } from "@/src/lib/types"

const MAX_ANIMES = 16

export function TierlistManualTab() {
  const router = useRouter()
  const [pendingAnimes, setPendingAnimes] = useState<Anime[]>([])
  const setAnimes = useTierlistStore((s) => s.setAnimes)

  const handleSelect = useCallback(
    (anime: Anime) => {
      setPendingAnimes((prev) => {
        if (prev.length >= MAX_ANIMES || prev.find((a) => a.id === anime.id)) {
          return prev
        }
        return [...prev, anime]
      })
    },
    []
  )

  const handleRemove = useCallback((anime: Anime) => {
    setPendingAnimes((prev) => prev.filter((a) => a.id !== anime.id))
  }, [])

  const handleCreate = useCallback(() => {
    if (pendingAnimes.length < 2) return

    setAnimes(pendingAnimes)
    const id = useTierlistStore.getState().id
    router.push(`/tierlist/${id}`)
  }, [pendingAnimes, setAnimes, router])

  const canCreate = pendingAnimes.length >= 2

  return (
    <Stack gap="lg">
      <Text c="#888" size="sm" ta="center">
        Busque e selecione de 2 a {MAX_ANIMES} animes para montar sua tierlist manualmente!
      </Text>

      <AnimeSearch
        selectedAnimes={pendingAnimes}
        onSelect={handleSelect}
        maxSelections={MAX_ANIMES}
      />

      {pendingAnimes.length > 0 && (
        <>
          <Group justify="space-between" align="center">
            <Text fw={600} size="lg" c="white">
              Selecionados
            </Text>
            <Badge
              size="lg"
              variant="gradient"
              gradient={{ from: "grape", to: "pink" }}
            >
              {pendingAnimes.length}/{MAX_ANIMES}
            </Badge>
          </Group>

          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
            {pendingAnimes.map((anime) => (
              <AnimeCard
                key={anime.id}
                anime={anime}
                selected
                onRemove={handleRemove}
              />
            ))}
          </SimpleGrid>

          <Button
            fullWidth
            size="lg"
            radius="md"
            disabled={!canCreate}
            onClick={handleCreate}
            leftSection={<IconPlayerPlay size={20} />}
            styles={{
              root: {
                background: canCreate
                  ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                  : undefined,
              },
            }}
          >
            {pendingAnimes.length < 2
              ? "Selecione pelo menos 2 animes"
              : `Criar Tierlist (${pendingAnimes.length} animes)`}
          </Button>
        </>
      )}
    </Stack>
  )
}
