"use client"

import { Stack, Text, Box } from "@mantine/core"
import type { Battle } from "@/src/lib/types"

interface BracketViewProps {
  bracket: Battle[][]
  currentRound: number
}

function BracketMatch({
  battle,
  isActive,
}: {
  battle: Battle
  isActive: boolean
}) {
  return (
    <Box
      p={8}
      style={{
        borderRadius: 8,
        border: isActive ? "2px solid #8b5cf6" : "1px solid #2a2a2a",
        backgroundColor: "#1a1a1a",
        minWidth: 200,
      }}
    >
      <Text size="xs" c={battle.winner?.id === battle.anime1.id ? "grape" : "#888"} truncate>
        {battle.anime1.title}
      </Text>
      <Text size="xs" c="#555" ta="center">vs</Text>
      <Text size="xs" c={battle.winner?.id === battle.anime2.id ? "grape" : "#888"} truncate>
        {battle.anime2.title}
      </Text>
    </Box>
  )
}

export function BracketView({ bracket, currentRound }: BracketViewProps) {
  if (bracket.length === 0) return null

  const roundLabels = ["Rodada 1", "Rodada 2", "Semifinal", "Final"]

  return (
    <Stack gap="md" p="md" bg="#121212" style={{ borderRadius: 12, minHeight: "100%" }}>
      <Text fw={700} size="sm" c="white" ta="center">
        Chaves
      </Text>

      {bracket.map((round, roundIndex) => (
        <Box key={roundIndex}>
          <Text size="xs" c="#777" mb={4}>
            {roundLabels[roundIndex] || `Round ${roundIndex + 1}`}
          </Text>
          <Stack gap={6}>
            {round.map((battle) => (
              <BracketMatch
                key={battle.id}
                battle={battle}
                isActive={roundIndex === currentRound && !battle.winner}
              />
            ))}
          </Stack>
        </Box>
      ))}
    </Stack>
  )
}
