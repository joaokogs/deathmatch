"use client"

import { Stack, Text, Button, Image, Center } from "@mantine/core"
import { IconTrophy } from "@tabler/icons-react"
import type { Anime } from "@/src/lib/types"
import { useRouter } from "next/navigation"

interface ResultScreenProps {
  champion: Anime
  tournamentName: string
}

export function ResultScreen({ champion, tournamentName }: ResultScreenProps) {
  const router = useRouter()

  const handleNewTournament = () => {
    router.push("/")
  }

  return (
    <Center py="xl" style={{ flex: 1 }}>
      <Stack align="center" gap="lg">
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

        <Button
          size="lg"
          variant="outline"
          color="grape"
          radius="md"
          onClick={handleNewTournament}
          mt="md"
        >
          Novo Torneio
        </Button>
      </Stack>
    </Center>
  )
}
