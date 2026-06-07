"use client"

import { useState, useCallback } from "react"
import { Stack, Text, Button, Group, Box, Image, Modal, Badge } from "@mantine/core"
import { TIER_LABELS, TIER_COLORS } from "@/src/lib/types"
import type { TierlistState, TierlistPlacement, RoomAnime, TierLabel } from "@/src/lib/types"

interface ForceVotePanelProps {
  tierlist: TierlistState
  pool: RoomAnime[]
  opened: boolean
  onClose: () => void
  onConfirm: (animeId: number, fromTier: TierLabel, toTier: TierLabel, swapAnimeId?: number) => void
}

export function ForceVotePanel({
  tierlist,
  pool,
  opened,
  onClose,
  onConfirm,
}: ForceVotePanelProps) {
  const [selectedAnime, setSelectedAnime] = useState<{ animeId: number; fromTier: TierLabel } | null>(null)
  const [selectedToTier, setSelectedToTier] = useState<TierLabel | null>(null)
  const [swapAnimeId, setSwapAnimeId] = useState<number | undefined>(undefined)

  const getAnime = (animeId: number) => pool.find((a) => a.id === animeId)

  const availableAnimes: (TierlistPlacement & { tier: TierLabel })[] = []
  for (const [tier, placements] of Object.entries(tierlist.tiers)) {
    const tl = tier as TierLabel
    for (const p of placements) {
      if (!p.forceVoted) {
        availableAnimes.push({ ...p, tier: tl })
      }
    }
  }

  const handleSelectAnime = (animeId: number, fromTier: TierLabel) => {
    setSelectedAnime({ animeId, fromTier })
    setSelectedToTier(null)
    setSwapAnimeId(undefined)
  }

  const handleSelectToTier = (tier: TierLabel) => {
    if (!selectedAnime) return
    if (tier === selectedAnime.fromTier) return

    const toTierAnimes = tierlist.tiers[tier]

    if ((tier === "lixo" || tier === "top") && toTierAnimes.length >= 3) {
      // Precisa escolher qual trocar
      setSelectedToTier(tier)
      setSwapAnimeId(undefined)
    } else if (toTierAnimes.length === 0) {
      return // Não pode mover para vazio
    } else {
      setSelectedToTier(tier)
      setSwapAnimeId(undefined)
    }
  }

  const handleConfirm = useCallback(() => {
    if (!selectedAnime || !selectedToTier) return
    onConfirm(selectedAnime.animeId, selectedAnime.fromTier, selectedToTier, swapAnimeId)
    setSelectedAnime(null)
    setSelectedToTier(null)
    setSwapAnimeId(undefined)
    onClose()
  }, [selectedAnime, selectedToTier, swapAnimeId, onConfirm, onClose])

  const tierOrder: TierLabel[] = ["top", "bom", "mediocre", "ruim", "lixo"]

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="⚡ Voto com Força"
      size="lg"
      centered
      styles={{
        content: { backgroundColor: "#141414", border: "1px solid #2a2a2a" },
        header: { backgroundColor: "#141414" },
        title: { color: "white", fontWeight: 700 },
        body: { backgroundColor: "#141414" },
      }}
    >
      <Stack gap="md">
        <Text c="#888" size="sm">
          Selecione um anime para mover de tier!
        </Text>

        {!selectedAnime && (
          <>
            <Text size="sm" c="white" fw={600}>Animes disponíveis para mover:</Text>
            <Group gap="sm" wrap="wrap">
              {availableAnimes.map((p) => {
                const anime = getAnime(p.animeId)
                if (!anime) return null
                return (
                  <Box
                    key={p.animeId}
                    onClick={() => handleSelectAnime(p.animeId, p.tier)}
                    style={{
                      width: 90,
                      cursor: "pointer",
                      borderRadius: 8,
                      overflow: "hidden",
                      border: "2px solid transparent",
                      transition: "border-color 0.2s",
                    }}
                    className="hover:border-[#8b5cf6]"
                  >
                    <Image
                      src={anime.coverImage}
                      alt={anime.title}
                      w="100%"
                      h={110}
                      fit="cover"
                      fallbackSrc="https://via.placeholder.com/90x110?text=No+Image"
                    />
                    <Text size="xs" c="white" ta="center" truncate p={2}>
                      {anime.title}
                    </Text>
                    <Badge size="xs" variant="light" color="grape" fullWidth style={{ borderRadius: 0 }}>
                      {TIER_LABELS[p.tier]}
                    </Badge>
                  </Box>
                )
              })}
              {availableAnimes.length === 0 && (
                <Text c="#888" size="sm">Nenhum anime disponível para mover.</Text>
              )}
            </Group>
          </>
        )}

        {selectedAnime && !selectedToTier && (
          <>
            <Text size="sm" c="white" fw={600}>Mover para qual tier?</Text>
            <Group gap="sm">
              {tierOrder
                .filter((t) => t !== selectedAnime.fromTier)
                .map((tier) => {
                  const isFull = (tier === "lixo" || tier === "top") && tierlist.tiers[tier].length >= 3
                  const isEmpty = tierlist.tiers[tier].length === 0
                  return (
                    <Button
                      key={tier}
                      variant="outline"
                      size="sm"
                      disabled={isEmpty}
                      onClick={() => handleSelectToTier(tier)}
                      styles={{
                        root: {
                          borderColor: TIER_COLORS[tier],
                          color: TIER_COLORS[tier],
                          opacity: isEmpty ? 0.3 : 1,
                        },
                      }}
                    >
                      {TIER_LABELS[tier]}
                      {isFull && " (cheio - troca)"}
                      {isEmpty && " (vazio)"}
                    </Button>
                  )
                })}
            </Group>
            <Button variant="subtle" color="gray" size="xs" onClick={() => setSelectedAnime(null)}>
              Voltar
            </Button>
          </>
        )}

        {selectedAnime && selectedToTier && (
          <>
            {(selectedToTier === "lixo" || selectedToTier === "top") &&
              tierlist.tiers[selectedToTier].length >= 3 && !swapAnimeId && (
              <>
                <Text size="sm" c="white" fw={600}>
                  {TIER_LABELS[selectedToTier]} está cheio. Selecione qual anime será trocado:
                </Text>
                <Group gap="sm" wrap="wrap">
                  {tierlist.tiers[selectedToTier].map((p) => {
                    const anime = getAnime(p.animeId)
                    if (!anime) return null
                    return (
                      <Box
                        key={p.animeId}
                        onClick={() => setSwapAnimeId(p.animeId)}
                        style={{
                          width: 80,
                          cursor: "pointer",
                          borderRadius: 8,
                          overflow: "hidden",
                          border: "2px solid transparent",
                        }}
                        className="hover:border-[#f59e0b]"
                      >
                        <Image
                          src={anime.coverImage}
                          alt={anime.title}
                          w="100%"
                          h={100}
                          fit="cover"
                        />
                        <Text size="xs" c="white" ta="center" truncate p={2}>
                          {anime.title}
                        </Text>
                      </Box>
                    )
                  })}
                </Group>
              </>
            )}

            {((selectedToTier !== "lixo" && selectedToTier !== "top") ||
              tierlist.tiers[selectedToTier].length < 3 ||
              swapAnimeId) && (
              <Button
                fullWidth
                size="md"
                radius="md"
                onClick={handleConfirm}
                styles={{
                  root: {
                    background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
                  },
                }}
              >
                Confirmar Voto com Força!
              </Button>
            )}
          </>
        )}
      </Stack>
    </Modal>
  )
}
