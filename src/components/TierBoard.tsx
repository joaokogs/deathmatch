"use client"

import { useState } from "react"
import {
  Stack, Text, Group, Box, ActionIcon, Button, Paper, Image, Center,
} from "@mantine/core"
import { IconX, IconGripVertical } from "@tabler/icons-react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd"
import { useTierlistStore, TIER_LABELS, TIER_COLORS, type TierSlot, type TierLabel } from "@/src/store/tierlist"
import type { Anime } from "@/src/lib/types"

const TIER_SLOTS: TierLabel[] = ["top", "bom", "mediocre", "ruim", "lixo", "nao_assisti"]

function TierCard({
  anime,
  isSelected,
  onSelect,
  onRemove,
  dragHandle = false,
}: {
  anime: Anime
  isSelected: boolean
  onSelect?: () => void
  onRemove?: () => void
  dragHandle?: boolean
}) {
  return (
    <div
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault()
          onSelect()
        }
      }}
      tabIndex={onSelect ? 0 : undefined}
      role={onSelect ? "button" : undefined}
      className="relative overflow-hidden rounded-lg transition-all duration-200 flex-shrink-0"
      style={{
        width: 90,
        aspectRatio: "2/3",
        cursor: onSelect ? "pointer" : "default",
        border: isSelected ? "2px solid #8b5cf6" : "2px solid transparent",
        boxShadow: isSelected ? "0 0 16px rgba(139, 92, 246, 0.4)" : "0 2px 6px rgba(0,0,0,0.3)",
        outline: isSelected ? "2px solid #8b5cf6" : "none",
        outlineOffset: 2,
      }}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${anime.coverImage})` }}
      />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.8))" }}
      />
      {dragHandle && (
        <div className="absolute top-1 left-1 text-white opacity-60">
          <IconGripVertical size={14} />
        </div>
      )}
      {onRemove && (
        <ActionIcon
          size="xs"
          radius="xl"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          style={{
            position: "absolute",
            top: 4,
            right: 4,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          onClick={(e) => { e.stopPropagation(); onRemove() }}
          aria-label={`Remover ${anime.title}`}
        >
          <IconX size={10} />
        </ActionIcon>
      )}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          padding: "4px 6px",
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Text size="xs" c="white" truncate style={{ fontSize: 10, textShadow: "0 1px 4px rgba(0,0,0,0.5)" }}>
          {anime.title}
        </Text>
      </div>
    </div>
  )
}

export function TierBoard() {
  const store = useTierlistStore()
  const { animes, tiers, isFinished, interactionMode } = store
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null)
  const [showResult, setShowResult] = useState(false)

  const allClassified = tiers["unranked"].length === 0
  const totalClassified = animes.length - tiers["unranked"].length

  // Drag end handler
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const { draggableId, source, destination } = result
    const sourceSlot = source.droppableId as string
    const destSlot = destination.droppableId as string

    if (sourceSlot === destSlot) return
    store.moveAnime(Number(draggableId), sourceSlot, destSlot)
  }

  // Click mode: select anime
  const handleSelectAnime = (anime: Anime) => {
    if (interactionMode === "drag") return
    if (isFinished) return
    setSelectedAnime((prev) => (prev?.id === anime.id ? null : anime))
  }

  // Click mode: place selected anime into tier
  const handlePlaceInTier = (slot: string) => {
    if (!selectedAnime || interactionMode === "drag") return
    // Find current slot
    for (const [key, list] of Object.entries(tiers)) {
      if (list.some((a) => a.id === selectedAnime.id)) {
        store.moveAnime(selectedAnime.id, key, slot)
        break
      }
    }
    setSelectedAnime(null)
  }

  // Click mode: return from tier back to unranked
  const handleReturnToPool = (anime: Anime, fromSlot: string) => {
    if (interactionMode === "drag") return
    store.moveAnime(anime.id, fromSlot, "unranked")
  }

  // Finish
  const handleFinish = () => {
    store.finish()
    setShowResult(true)
  }

  // Reset
  const handleReset = () => {
    store.reset()
    setSelectedAnime(null)
    setShowResult(false)
  }

  // Empty unranked state
  if (animes.length === 0) {
    return (
      <Center mih="60vh">
        <Text c="dimmed">Nenhum anime carregado. Volte e gere uma nova tierlist.</Text>
      </Center>
    )
  }

  const renderContent = () => {
    if (showResult) {
      return (
        <Stack gap="lg" align="center" py="xl" px="md">
          <Text
            fw={900}
            ta="center"
            style={{
              fontSize: "clamp(24px, 8vw, 36px)",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Tierlist Completa!
          </Text>
          {TIER_SLOTS.map((slot) => {
            const items = tiers[slot] || []
            if (items.length === 0) return null
            return (
              <Box key={slot} w="100%" maw={600}>
                <Group gap={8} mb={4}>
                  <Box style={{ width: 12, height: 12, borderRadius: "50%", backgroundColor: TIER_COLORS[slot] }} />
                  <Text fw={700} size="sm" c="white">{TIER_LABELS[slot]}</Text>
                  <Text size="xs" c="dimmed">({items.length})</Text>
                </Group>
                <Group gap="xs">
                  {items.map((a) => (
                    <Box key={a.id} style={{ width: 70, textAlign: "center" }}>
                      <Image src={a.coverImage} alt={a.title} w={70} h={90} fit="cover" radius="sm"
                        fallbackSrc="https://via.placeholder.com/70x90?text=N/A" />
                      <Text size="xs" c="white" truncate style={{ fontSize: 9 }}>{a.title}</Text>
                    </Box>
                  ))}
                </Group>
              </Box>
            )
          })}
          <Button variant="outline" color="grape" size="md" radius="md" onClick={handleReset} mt="md">
            Nova Tierlist
          </Button>
        </Stack>
      )
    }

    if (interactionMode === "drag") {
      return (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Stack gap="lg" px="md" pb="xl">
            {/* Tier rows — melhor no topo */}
            {TIER_SLOTS.map((slot) => (
              <Droppable key={slot} droppableId={slot} direction="horizontal">
                {(provided, snapshot) => {
                  const items = tiers[slot] || []
                  return (
                    <Group gap={0} wrap="nowrap" align="stretch">
                      {/* Tier label */}
                      <Box
                        style={{
                          minWidth: 80,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          borderRadius: "8px 0 0 8px",
                          background: TIER_COLORS[slot],
                          padding: "4px 8px",
                        }}
                      >
                        <Text fw={700} size="sm" c="white" ta="center">
                          {TIER_LABELS[slot]}
                        </Text>
                      </Box>
                      {/* Drop zone */}
                      <Box
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        style={{
                          flex: 1,
                          minHeight: 100,
                          borderRadius: "0 8px 8px 0",
                          background: snapshot.isDraggingOver
                            ? "rgba(139,92,246,0.1)"
                            : "rgba(255,255,255,0.03)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          borderLeft: "none",
                          padding: 6,
                        }}
                      >
                        <Group gap="xs" wrap="wrap">
                          {items.map((anime, idx) => (
                            <Draggable key={anime.id} draggableId={String(anime.id)} index={idx}>
                              {(provided, snapshot) => (
                                <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                  <TierCard anime={anime} isSelected={false} dragHandle />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </Group>
                      </Box>
                    </Group>
                  )
                }}
              </Droppable>
            ))}

            {/* Unranked pool — no final */}
            <Droppable droppableId="unranked" direction="horizontal">
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  p="sm"
                  style={{
                    borderRadius: 12,
                    background: snapshot.isDraggingOver ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)",
                    border: "1px dashed rgba(255,255,255,0.15)",
                    minHeight: 140,
                  }}
                >
                  <Text size="xs" c="dimmed" mb="xs">Não classificado ({tiers["unranked"].length})</Text>
                  <Group gap="xs" wrap="wrap">
                    {(tiers["unranked"] || []).map((anime, idx) => (
                      <Draggable key={anime.id} draggableId={String(anime.id)} index={idx}>
                        {(provided, snapshot) => (
                          <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                            <TierCard anime={anime} isSelected={false} dragHandle />
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </Group>
                </Box>
              )}
            </Droppable>
          </Stack>
        </DragDropContext>
      )
    }

    // Click mode
    return (
      <Stack gap="lg" px="md" pb="xl">
        {/* Tier rows — melhor no topo */}
        {TIER_SLOTS.map((slot) => {
          const items = tiers[slot] || []
          return (
            <Group key={slot} gap={0} wrap="nowrap" align="stretch">
              {/* Tier label (clickable to place selected anime) */}
              <Box
                onClick={() => handlePlaceInTier(slot)}
                style={{
                  minWidth: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "8px 0 0 8px",
                  background: TIER_COLORS[slot],
                  padding: "4px 8px",
                  cursor: selectedAnime ? "pointer" : "default",
                  transition: "opacity 0.2s",
                  opacity: selectedAnime ? 0.85 : 1,
                }}
                role={selectedAnime ? "button" : undefined}
                tabIndex={selectedAnime ? 0 : undefined}
                onKeyDown={(e) => {
                  if (selectedAnime && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    handlePlaceInTier(slot)
                  }
                }}
                aria-label={`Mover para ${TIER_LABELS[slot]}`}
              >
                <Text fw={700} size="sm" c="white" ta="center">
                  {TIER_LABELS[slot]}
                </Text>
              </Box>
              {/* Tier content */}
              <Box
                style={{
                  flex: 1,
                  minHeight: 100,
                  borderRadius: "0 8px 8px 0",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: "none",
                  padding: 6,
                }}
              >
                <Group gap="xs" wrap="wrap">
                  {items.map((anime) => (
                    <div key={anime.id} className="group">
                      <TierCard
                        anime={anime}
                        isSelected={selectedAnime?.id === anime.id}
                        onSelect={() => handleSelectAnime(anime)}
                        onRemove={() => handleReturnToPool(anime, slot)}
                      />
                    </div>
                  ))}
                  {items.length === 0 && !selectedAnime && (
                    <Text size="xs" c="dimmed" style={{ padding: 8 }}>
                      {selectedAnime ? "Clique aqui" : "Vazio"}
                    </Text>
                  )}
                </Group>
              </Box>
            </Group>
          )
        })}

        {/* Unranked pool — no final */}
        <Box
          p="sm"
          style={{
            borderRadius: 12,
            background: "rgba(255,255,255,0.03)",
            border: "1px dashed rgba(255,255,255,0.15)",
            minHeight: 140,
          }}
        >
          <Text size="xs" c="dimmed" mb="xs">
            Não classificado ({tiers["unranked"].length})
            {selectedAnime && <Text component="span" c="grape" size="xs"> — Clique no tier abaixo para colocar</Text>}
          </Text>
          <Group gap="xs" wrap="wrap">
            {(tiers["unranked"] || []).map((anime) => (
              <TierCard
                key={anime.id}
                anime={anime}
                isSelected={selectedAnime?.id === anime.id}
                onSelect={() => handleSelectAnime(anime)}
              />
            ))}
          </Group>
        </Box>
      </Stack>
    )
  }

  return (
    <Box style={{ flex: 1, overflow: "auto" }}>
      {/* Header */}
      <Group p="md" justify="space-between" style={{ borderBottom: "1px solid #2a2a2a" }}>
        <Group gap="xs">
          <Text fw={700} c="white">Tierlist</Text>
          <Text size="xs" c="dimmed">
            {totalClassified}/{animes.length} classificados
          </Text>
        </Group>
        <Group gap="xs">
          {allClassified && !showResult && (
            <Button size="sm" radius="md" color="grape" onClick={handleFinish}>
              Finalizar
            </Button>
          )}
        </Group>
      </Group>

      {renderContent()}
    </Box>
  )
}
