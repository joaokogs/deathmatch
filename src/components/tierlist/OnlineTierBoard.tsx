"use client"

import { useState, useCallback } from "react"
import {
  Stack, Text, Box, Group, Image, Button, Badge, Progress, ActionIcon, Tooltip,
} from "@mantine/core"
import { IconBolt, IconArrowRight, IconPlayerPlay } from "@tabler/icons-react"
import { TierlistTurnIndicator } from "./TierlistTurnIndicator"
import { ForceVotePanel } from "./ForceVotePanel"
import { TIER_LABELS, TIER_COLORS } from "@/src/lib/types"
import type { Room, TierLabel, RoomAnime } from "@/src/lib/types"

interface OnlineTierBoardProps {
  room: Room
  playerId: string
  onPlaceAnime: (animeId: number, tier: TierLabel) => void
  onForceVote: (animeId: number, fromTier: TierLabel, toTier: TierLabel, swapAnimeId?: number) => void
}

export function OnlineTierBoard({ room, playerId, onPlaceAnime, onForceVote }: OnlineTierBoardProps) {
  const tl = room.tierlist!
  const currentPlayerId = tl.turnOrder[tl.currentTurnIndex]
  const isMyTurn = playerId === currentPlayerId
  const [forceVoteOpened, setForceVoteOpened] = useState(false)
  const [selectedTier, setSelectedTier] = useState<TierLabel | null>(null)

  const totalAnimes = tl.animeCount
  const placedCount = totalAnimes - tl.unranked.length
  const progress = (placedCount / totalAnimes) * 100

  const canPlace = isMyTurn && tl.unranked.length > 0
  const canForceVote = isMyTurn && tl.unranked.length === 0 && !tl.forceVotesUsed[playerId]

  const currentAnime: RoomAnime | null = tl.unranked[0] || null

  const handleTierClick = useCallback((tier: TierLabel) => {
    if (!canPlace || !currentAnime) return
    // Validar limite de lixo/top
    if ((tier === "lixo" || tier === "top") && tl.tiers[tier].length >= 3) return
    onPlaceAnime(currentAnime.id, tier)
    setSelectedTier(null)
  }, [canPlace, currentAnime, tl.tiers, onPlaceAnime])

  const handleForceVoteConfirm = useCallback(
    (animeId: number, fromTier: TierLabel, toTier: TierLabel, swapAnimeId?: number) => {
      onForceVote(animeId, fromTier, toTier, swapAnimeId)
    },
    [onForceVote]
  )

  const getAnimeById = (animeId: number) => room.pool.find((a) => a.id === animeId)

  const tierOrder: TierLabel[] = ["top", "bom", "mediocre", "ruim", "lixo"]

  return (
    <Box style={{ display: "flex", flexDirection: "column", height: "100vh" }} p="md">
      {/* Header */}
      <Stack gap="md" mb="md">
        <Group justify="space-between">
          <Text fw={700} size="lg" c="white">{room.name}</Text>
          <Group gap="xs">
            <Badge size="lg" variant="gradient" gradient={{ from: "grape", to: "pink" }}>
              {placedCount}/{totalAnimes}
            </Badge>
            {canForceVote && (
              <Tooltip label="Use seu voto com força para reposicionar um anime">
                <Button
                  size="sm"
                  variant="outline"
                  color="yellow"
                  leftSection={<IconBolt size={16} />}
                  onClick={() => setForceVoteOpened(true)}
                >
                  ⚡ Força
                </Button>
              </Tooltip>
            )}
            {tl.forceVotesUsed[playerId] && (
              <Badge size="sm" color="yellow" variant="light">⚡ Usado</Badge>
            )}
          </Group>
        </Group>

        <Progress value={progress} color="grape" size="sm" />

        <TierlistTurnIndicator
          players={room.players}
          turnOrder={tl.turnOrder}
          currentTurnIndex={tl.currentTurnIndex}
          currentPlayerId={playerId}
          forceVotesUsed={tl.forceVotesUsed}
        />
      </Stack>

      {/* Current anime (unranked) */}
      <Box mb="md">
        {currentAnime ? (
          <Box
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: 12,
              borderRadius: 12,
              background: "rgba(139, 92, 246, 0.1)",
              border: "1px solid rgba(139, 92, 246, 0.3)",
            }}
          >
            <Image
              src={currentAnime.coverImage}
              alt={currentAnime.title}
              w={80}
              h={110}
              fit="cover"
              radius="md"
              fallbackSrc="https://via.placeholder.com/80x110?text=No+Image"
            />
            <Box style={{ flex: 1 }}>
              <Text fw={700} size="lg" c="white">{currentAnime.title}</Text>
              <Text size="sm" c="#888">
                Coloque este anime em um tier abaixo
              </Text>
            </Box>
            {!isMyTurn && (
              <Badge size="lg" color="gray" variant="light">Aguardando...</Badge>
            )}
          </Box>
        ) : (
          <Box
            p="md"
            style={{
              borderRadius: 12,
              background: "rgba(255,255,255,0.03)",
              border: "1px dashed rgba(255,255,255,0.15)",
              textAlign: "center",
            }}
          >
            <Text c="#888" size="sm">Todos os animes foram colocados!</Text>
            {!tl.tiers.lixo.length || !tl.tiers.top.length ? (
              <Text c="#f08c00" size="sm" mt={4}>
                Aguardando lixo e top terem 3 animes para finalizar
              </Text>
            ) : null}
          </Box>
        )}
      </Box>

      {/* Tiers */}
      <Box style={{ flex: 1, overflow: "auto" }}>
        <Stack gap="sm">
          {tierOrder.map((tier) => {
            const placements = tl.tiers[tier]
            const isFull = (tier === "lixo" || tier === "top") && placements.length >= 3
            const isSelectable = canPlace && !isFull
            const limit = tier === "lixo" || tier === "top" ? 3 : undefined

            return (
              <Box
                key={tier}
                p="sm"
                style={{
                  borderRadius: 12,
                  backgroundColor: `${TIER_COLORS[tier]}15`,
                  border: `1px solid ${TIER_COLORS[tier]}30`,
                  cursor: isSelectable ? "pointer" : "default",
                  transition: "transform 0.2s, border-color 0.2s",
                  opacity: isFull ? 0.6 : 1,
                }}
                onClick={() => handleTierClick(tier)}
                className={isSelectable ? "hover:scale-[1.01]" : ""}
              >
                <Group justify="space-between" mb="xs">
                  <Group gap="xs">
                    <Badge
                      size="sm"
                      style={{ backgroundColor: TIER_COLORS[tier], color: "white" }}
                    >
                      {TIER_LABELS[tier]}
                    </Badge>
                    {limit && (
                      <Text
                        size="xs"
                        c={placements.length >= limit ? "#2f9e44" : "#888"}
                        fw={700}
                      >
                        {placements.length}/{limit}
                      </Text>
                    )}
                  </Group>
                  {isSelectable && (
                    <ActionIcon variant="light" color="grape" size="sm" radius="xl">
                      <IconArrowRight size={14} />
                    </ActionIcon>
                  )}
                </Group>

                <Group gap="xs" wrap="wrap">
                  {placements.map((p) => {
                    const anime = getAnimeById(p.animeId)
                    if (!anime) return null
                    return (
                      <Box
                        key={p.animeId}
                        style={{
                          width: 70,
                          borderRadius: 6,
                          overflow: "hidden",
                          border: p.forceVoted ? `2px solid #f59e0b` : "1px solid rgba(255,255,255,0.1)",
                          position: "relative",
                        }}
                      >
                        <Image
                          src={anime.coverImage}
                          alt={anime.title}
                          w="100%"
                          h={90}
                          fit="cover"
                          fallbackSrc="https://via.placeholder.com/70x90?text=No+Image"
                        />
                        <Text
                          size="xs"
                          c="white"
                          ta="center"
                          truncate
                          p={2}
                          style={{ background: "rgba(0,0,0,0.7)", fontSize: 10 }}
                        >
                          {anime.title}
                        </Text>
                        {p.forceVoted && (
                          <Text
                            size="xs"
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              fontSize: 10,
                              background: "rgba(0,0,0,0.6)",
                              borderRadius: 4,
                              padding: "0 3px",
                            }}
                          >
                            🔒
                          </Text>
                        )}
                      </Box>
                    )
                  })}
                  {placements.length === 0 && (
                    <Text size="xs" c="#555" py="sm">Vazio — clique para colocar aqui</Text>
                  )}
                </Group>
              </Box>
            )
          })}
        </Stack>
      </Box>

      {/* Force Vote Panel */}
      <ForceVotePanel
        tierlist={tl}
        pool={room.pool}
        opened={forceVoteOpened}
        onClose={() => setForceVoteOpened(false)}
        onConfirm={handleForceVoteConfirm}
      />
    </Box>
  )
}
