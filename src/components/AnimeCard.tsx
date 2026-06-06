"use client"

import { useCallback } from "react"
import { Card, Image, Text, Group, Badge, ActionIcon } from "@mantine/core"
import { IconX } from "@tabler/icons-react"
import type { Anime } from "@/src/lib/types"

interface AnimeCardProps {
  anime: Anime
  size?: "sm" | "md" | "lg"
  selected?: boolean
  onSelect?: (anime: Anime) => void
  onRemove?: (anime: Anime) => void
}

export function AnimeCard({
  anime,
  size = "sm",
  selected = false,
  onSelect,
  onRemove,
}: AnimeCardProps) {
  const imageHeight = { sm: 180, md: 220, lg: 400 }
  const cardWidth = { sm: 180, md: 200, lg: 380 }

  const genreColors: Record<string, string> = {
    Action: "red",
    Adventure: "orange",
    Comedy: "yellow",
    Drama: "violet",
    Fantasy: "indigo",
    Horror: "dark",
    "Sci-Fi": "cyan",
    Romance: "pink",
    "Slice of Life": "teal",
    Sports: "lime",
    Mystery: "grape",
    Psychological: "blue",
    Supernatural: "grape",
    Thriller: "gray",
    Music: "pink",
    Mecha: "red",
    Seinen: "blue",
    Shounen: "orange",
  }

  const handleClick = useCallback(() => {
    onSelect?.(anime)
  }, [anime, onSelect])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onSelect && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        onSelect(anime)
      }
    },
    [anime, onSelect]
  )

  const handleRemoveClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove?.(anime)
    },
    [anime, onRemove]
  )

  const interactive = !!onSelect

  return (
    <Card
      shadow="md"
      padding="xs"
      radius="md"
      w={cardWidth[size]}
      bg="#1a1a1a"
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? `Selecionar ${anime.title}` : anime.title}
      onKeyDown={interactive ? handleKeyDown : undefined}
      style={{
        border: selected ? "2px solid #8b5cf6" : "2px solid transparent",
        cursor: onSelect ? "pointer" : undefined,
        transition: "transform 0.2s, border-color 0.2s",
      }}
      className="hover:scale-105"
      onClick={interactive ? handleClick : undefined}
    >
      <Card.Section>
        <div style={{ position: "relative" }}>
          <Image
            src={anime.coverImage}
            alt={anime.title}
            w={cardWidth[size]}
            h={imageHeight[size]}
            fit="cover"
            fallbackSrc="https://via.placeholder.com/160x200?text=No+Image"
          />
          {onRemove && (
            <ActionIcon
              variant="filled"
              color="red"
              size="sm"
              radius="xl"
              style={{
                position: "absolute",
                top: 6,
                right: 6,
              }}
              onClick={handleRemoveClick}
              aria-label={`Remover ${anime.title}`}
            >
              <IconX size={14} />
            </ActionIcon>
          )}
        </div>
      </Card.Section>

      <Text fw={600} size="sm" ta="center" lineClamp={2} mt={6} c="white">
        {anime.title}
      </Text>

      <Group gap={4} justify="center" mt={2}>
        {anime.averageScore && (
          <Badge size="sm" variant="light" color="yellow" styles={{ label: { fontSize: 10 } }}>
            {anime.averageScore}%
          </Badge>
        )}
        {anime.format && (
          <Badge size="sm" variant="light" color="gray" styles={{ label: { fontSize: 10 } }}>
            {anime.format}
          </Badge>
        )}
      </Group>

      <Group gap={4} justify="center" mt={4}>
        {anime.genres.slice(0, 3).map((genre) => (
          <Badge
            key={genre}
            size="xs"
            variant="light"
            color={genreColors[genre] || "gray"}
            styles={{ label: { fontSize: 9 } }}
          >
            {genre}
          </Badge>
        ))}
      </Group>
    </Card>
  )
}
