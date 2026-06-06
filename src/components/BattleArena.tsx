"use client"

import { useState } from "react"
import { Stack, Text, Group, Modal, Button, Box } from "@mantine/core"
import { AnimeCard } from "./AnimeCard"
import type { Anime, Battle } from "@/src/lib/types"

interface BattleArenaProps {
  battle: Battle
  round: number
  totalMatchesInRound: number
  onVote: (winner: Anime) => void
}

export function BattleArena({
  battle,
  round,
  totalMatchesInRound,
  onVote,
}: BattleArenaProps) {
  const [modalOpened, setModalOpened] = useState(false)
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)

  const handleClick = (anime: Anime) => {
    setSelectedAnime(anime)
    setModalOpened(true)
  }

  const confirmVote = () => {
    if (selectedAnime) {
      onVote(selectedAnime)
      setModalOpened(false)
      setSelectedAnime(null)
    }
  }

  const roundLabel = round < 3
    ? ["Rodada 1", "Rodada 2", "Semifinal"][round]
    : "Final"

  return (
    <>
      <Stack gap="xl" align="center" py="xl">
        <Text fw={700} size="lg" c="white">
          {roundLabel} — {battle.matchIndex + 1} de {totalMatchesInRound}
        </Text>

        <Text size="sm" c="#888">
          Clique no anime que você quer passar para a próxima rodada
        </Text>

        <Group gap="md" className="sm:gap-12" justify="center" wrap="wrap">
          <Box style={{ width: "clamp(140px, 30vw, 280px)" }}>
            <AnimeCard
              anime={battle.anime1}
              onClick={handleClick}
            />
          </Box>

          <Text
            fw={900}
            size="xl"
            style={{
              fontSize: "clamp(24px, 8vw, 48px)",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            VS
          </Text>

          <Box style={{ width: "clamp(140px, 30vw, 280px)" }}>
            <AnimeCard
              anime={battle.anime2}
              onClick={handleClick}
            />
          </Box>
        </Group>
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        centered
        withCloseButton={false}
        styles={{
          content: {
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
          },
        }}
      >
        <Stack gap="lg" align="center" py="md">
          <Text fw={600} size="lg" ta="center" c="white">
            Você quer passar{" "}
            <Text component="span" c="grape.4" fw={700}>
              {selectedAnime?.title}
            </Text>{" "}
            para a próxima rodada?
          </Text>

          <Group gap="md">
            <Button
              variant="outline"
              color="gray"
              onClick={() => setModalOpened(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: "grape", to: "pink" }}
              onClick={confirmVote}
            >
              Sim, passar!
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}
