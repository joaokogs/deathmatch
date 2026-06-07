"use client"

import { Box, Stack, Text, Avatar, Group, Badge, Button, Center, Image } from "@mantine/core"
import { useRouter } from "next/navigation"
import { TIER_LABELS, TIER_COLORS } from "@/src/lib/types"
import type { TierlistState, RoomPlayer, RoomAnime, TierLabel } from "@/src/lib/types"

interface TierlistResultProps {
  tierlist: TierlistState
  pool: RoomAnime[]
  players: RoomPlayer[]
}

export function TierlistResult({ tierlist, pool, players }: TierlistResultProps) {
  const router = useRouter()

  const getAnime = (animeId: number) => pool.find((a) => a.id === animeId)
  const getPlayerName = (playerId: string) => players.find((p) => p.id === playerId)?.nickname || "Desconhecido"

  const tierOrder: TierLabel[] = ["top", "bom", "mediocre", "ruim", "lixo"]

  const handleNewRoom = () => {
    localStorage.removeItem("anime-battle-player-id")
    localStorage.removeItem("anime-battle-room-id")
    localStorage.removeItem("anime-battle-nickname")
    router.push("/")
  }

  return (
    <Center mih="100vh" p="md">
      <Stack align="center" gap="lg" maw={600} w="100%">
        <Text
          fw={900}
          ta="center"
          style={{
            fontSize: "clamp(28px, 8vw, 36px)",
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Tierlist Finalizada!
        </Text>

        <Stack gap="md" w="100%">
          {tierOrder.map((tier) => {
            const placements = tierlist.tiers[tier]
            if (placements.length === 0) return null

            return (
              <Box
                key={tier}
                p="sm"
                style={{
                  borderRadius: 12,
                  backgroundColor: `${TIER_COLORS[tier]}15`,
                  border: `1px solid ${TIER_COLORS[tier]}30`,
                }}
              >
                <Group justify="space-between" mb="sm">
                  <Badge
                    size="lg"
                    style={{ backgroundColor: TIER_COLORS[tier], color: "white" }}
                  >
                    {TIER_LABELS[tier]}
                  </Badge>
                  <Text size="sm" c="#888">{placements.length} animes</Text>
                </Group>

                <Group gap="sm" wrap="wrap">
                  {placements.map((p) => {
                    const anime = getAnime(p.animeId)
                    if (!anime) return null
                    return (
                      <Box
                        key={p.animeId}
                        style={{
                          width: 100,
                          borderRadius: 8,
                          overflow: "hidden",
                          border: p.forceVoted ? `2px solid #f59e0b` : "1px solid rgba(255,255,255,0.1)",
                          position: "relative",
                        }}
                      >
                        <Image
                          src={anime.coverImage}
                          alt={anime.title}
                          w="100%"
                          h={130}
                          fit="cover"
                          fallbackSrc="https://via.placeholder.com/100x130?text=No+Image"
                        />
                        <Text
                          size="xs"
                          fw={600}
                          c="white"
                          ta="center"
                          truncate
                          p={4}
                          style={{ background: "rgba(0,0,0,0.7)" }}
                        >
                          {anime.title}
                        </Text>
                        {p.forceVoted && (
                          <Text
                            size="xs"
                            c="#f59e0b"
                            ta="center"
                            style={{
                              position: "absolute",
                              top: 4,
                              right: 4,
                              background: "rgba(0,0,0,0.6)",
                              borderRadius: 4,
                              padding: "0 4px",
                              fontSize: 10,
                            }}
                          >
                            ⚡
                          </Text>
                        )}
                        <Text
                          size="xs"
                          c="#888"
                          ta="center"
                          style={{ fontSize: 10, padding: "0 4px 4px" }}
                        >
                          {getPlayerName(p.placedBy)}
                        </Text>
                      </Box>
                    )
                  })}
                </Group>
              </Box>
            )
          })}
        </Stack>

        <Button
          size="lg"
          radius="md"
          fullWidth
          onClick={handleNewRoom}
          styles={{
            root: {
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            },
          }}
        >
          Nova Sala
        </Button>
      </Stack>
    </Center>
  )
}
