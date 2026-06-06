"use client"

import { useEffect, useState } from "react"
import { Group, Text, Badge, Button, SimpleGrid } from "@mantine/core"
import { AnimeCard } from "./AnimeCard"
import type { Anime } from "@/src/lib/types"

interface SelectedListProps {
  animes: Anime[]
  maxSelections: number
  onRemove: (anime: Anime) => void
  onStart: () => void
  tournamentName: string
}

export function SelectedList({
  animes,
  maxSelections,
  onRemove,
  onStart,
  tournamentName,
}: SelectedListProps) {
  const [mounted, setMounted] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setMounted(true) }, [])

  const isDisabled = animes.length < 2 || animes.length % 2 !== 0

  return (
    <>
      <Group justify="space-between" align="center">
        <Text fw={600} size="lg" c="white">
          Animes Selecionados
        </Text>
        <Badge
          size="lg"
          variant="gradient"
          gradient={{ from: "grape", to: "pink" }}
        >
          {animes.length}/{maxSelections}
        </Badge>
      </Group>

      {animes.length === 0 ? (
        <Text c="dimmed" ta="center" py="xl">
          Nenhum anime selecionado ainda. Busque acima para adicionar.
        </Text>
      ) : (
        <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
          {animes.map((anime) => (
            <AnimeCard
              key={anime.id}
              anime={anime}
              size="sm"
              selected
              onRemove={onRemove}
            />
          ))}
        </SimpleGrid>
      )}

      <Button
        fullWidth
        size="lg"
        radius="md"
        disabled={mounted ? isDisabled : false}
        onClick={onStart}
        styles={{
          root: {
            background: mounted && !isDisabled
              ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
              : undefined,
          },
        }}
      >
        {animes.length < 2
          ? "Selecione pelo menos 2 animes"
          : animes.length % 2 !== 0
          ? "Número de animes precisa ser par"
          : `Iniciar Torneio: ${tournamentName}`}
      </Button>
    </>
  )
}
