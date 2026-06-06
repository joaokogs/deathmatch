"use client"

import { useState } from "react"
import { Stack, Text, Button, Image, Center, Modal, Group, Box, Avatar } from "@mantine/core"
import { IconTrophy, IconList, IconCrown } from "@tabler/icons-react"
import type { Anime, Battle } from "@/src/lib/types"
import { useRouter } from "next/navigation"
import { computeRanking } from "@/src/lib/ranking"

interface ResultScreenProps {
  champion: Anime
  tournamentName: string
  bracket: Battle[][]
  allAnimes: Anime[]
}

export function ResultScreen({ champion, tournamentName, bracket, allAnimes }: ResultScreenProps) {
  const router = useRouter()
  const [rankingOpen, setRankingOpen] = useState(false)

  const ranking = computeRanking(bracket, champion, allAnimes)

  const handleNewTournament = () => {
    router.push("/")
  }

  return (
    <>
      <Center py="xl" style={{ flex: 1 }}>
        <Stack align="center" gap="lg" px="md">
          <IconTrophy size={48} color="#f59e0b" style={{ width: "clamp(40px, 10vw, 64px)", height: "clamp(40px, 10vw, 64px)" }} />

          <Text fw={700} size="xl" c="#888" ta="center">
            {tournamentName}
          </Text>

          <Text
            fw={900}
            size="xl"
            ta="center"
            style={{
              fontSize: "clamp(24px, 10vw, 48px)",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            CAMPEÃO
          </Text>

          <Image
            src={champion.coverImage}
            alt={champion.title}
            w="clamp(180px, 60vw, 320px)"
            h="clamp(225px, 75vw, 400px)"
            fit="cover"
            radius="lg"
            style={{
              border: "3px solid #8b5cf6",
              boxShadow: "0 0 40px rgba(139, 92, 246, 0.4)",
            }}
            fallbackSrc="https://via.placeholder.com/320x400?text=No+Image"
          />

          <Text fw={700} size="xl" c="white" ta="center">
            {champion.title}
          </Text>

          {champion.averageScore && (
            <Text size="md" c="#888">
              Score: {champion.averageScore}%
            </Text>
          )}

          <Group gap="md" w="100%" maw={400}>
            <Button
              variant="outline"
              color="grape"
              size="md"
              radius="md"
              fullWidth
              onClick={() => setRankingOpen(true)}
              leftSection={<IconList size={18} />}
            >
              Ver Ranking Completo
            </Button>
            <Button
              size="md"
              radius="md"
              fullWidth
              onClick={handleNewTournament}
              styles={{
                root: {
                  background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                },
              }}
            >
              Novo Torneio
            </Button>
          </Group>
        </Stack>
      </Center>

      <Modal
        opened={rankingOpen}
        onClose={() => setRankingOpen(false)}
        title="Ranking Final"
        size="sm"
        centered
        styles={{
          content: { backgroundColor: "#141414", border: "1px solid #2a2a2a" },
          header: { backgroundColor: "#141414" },
          title: { color: "white", fontWeight: 700 },
          body: { padding: 0 },
        }}
      >
        <Stack gap={0}>
          {ranking.map((entry, idx) => (
            <Box
              key={entry.anime.id}
              p="sm"
              style={{
                borderBottom: idx < ranking.length - 1 ? "1px solid #2a2a2a" : "none",
                background: entry.isChampion ? "rgba(139, 92, 246, 0.1)" : "transparent",
              }}
            >
              <Group gap="sm" wrap="nowrap">
                {/* Position */}
                <Box ta="center" style={{ minWidth: 44 }}>
                  {entry.isChampion ? (
                    <IconCrown size={22} color="#f59e0b" />
                  ) : (
                    <Text fw={700} size="lg" c="#666">
                      {entry.position}
                    </Text>
                  )}
                </Box>

                {/* Cover thumbnail */}
                <Avatar
                  src={entry.anime.coverImage}
                  alt={entry.anime.title}
                  size="md"
                  radius="sm"
                  style={{ minWidth: 40 }}
                />

                {/* Info */}
                <Box style={{ flex: 1, minWidth: 0 }}>
                  <Text fw={600} size="sm" c="white" truncate>
                    {entry.anime.title}
                  </Text>
                  <Text size="xs" c={entry.isChampion ? "grape" : "#666"}>
                    {entry.label}
                  </Text>
                </Box>

                {/* Score */}
                {entry.anime.averageScore && (
                  <Text size="xs" c="#888" style={{ whiteSpace: "nowrap" }}>
                    ★ {entry.anime.averageScore}%
                  </Text>
                )}
              </Group>
            </Box>
          ))}
        </Stack>
      </Modal>
    </>
  )
}
