"use client"

import { Group, Avatar, Text, Badge, Stack } from "@mantine/core"
import type { RoomPlayer } from "@/src/lib/types"

interface TierlistTurnIndicatorProps {
  players: RoomPlayer[]
  turnOrder: string[]
  currentTurnIndex: number
  currentPlayerId: string | null
  forceVotesUsed: Record<string, boolean>
}

export function TierlistTurnIndicator({
  players,
  turnOrder,
  currentTurnIndex,
  currentPlayerId,
  forceVotesUsed,
}: TierlistTurnIndicatorProps) {
  const currentTurnPlayerId = turnOrder[currentTurnIndex]
  const currentPlayer = players.find((p) => p.id === currentTurnPlayerId)
  const isMyTurn = currentPlayerId === currentTurnPlayerId

  return (
    <Stack gap="sm">
      <Group gap="xs" justify="center">
        {isMyTurn ? (
          <Badge size="lg" variant="gradient" gradient={{ from: "green", to: "teal" }}>
            Sua vez!
          </Badge>
        ) : (
          <Text size="sm" c="#888">
            Vez de <strong>{currentPlayer?.nickname || "..."}</strong>
          </Text>
        )}
      </Group>

      <Group gap={8} justify="center" wrap="wrap">
        {turnOrder.map((pid) => {
          const player = players.find((p) => p.id === pid)
          if (!player) return null
          const isActive = pid === currentTurnPlayerId
          const hasUsedForceVote = forceVotesUsed[pid]

          return (
            <Stack key={pid} align="center" gap={2}>
              <Avatar
                size="md"
                color={player.isHost ? "grape" : "blue"}
                radius="xl"
                style={{
                  border: isActive ? "2px solid #2f9e44" : "2px solid transparent",
                  transition: "border-color 0.3s",
                }}
              >
                {player.nickname[0].toUpperCase()}
              </Avatar>
              <Text size="xs" c={isActive ? "green" : "#888"} fw={isActive ? 700 : 400}>
                {player.nickname}
              </Text>
              {hasUsedForceVote && (
                <Text size="xs" c="#f59e0b">⚡</Text>
              )}
            </Stack>
          )
        })}
      </Group>
    </Stack>
  )
}
