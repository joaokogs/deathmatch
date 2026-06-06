"use client"

import { useCallback } from "react"
import { Text, ActionIcon } from "@mantine/core"
import { IconX } from "@tabler/icons-react"
import type { Anime } from "@/src/lib/types"

interface AnimeCardProps {
  anime: Anime
  selected?: boolean
  onClick?: (anime: Anime) => void
  onRemove?: (anime: Anime) => void
  className?: string
}

export function AnimeCard({
  anime,
  selected = false,
  onClick,
  onRemove,
  className = "",
}: AnimeCardProps) {
  const interactive = !!onClick

  const handleClick = useCallback(() => {
    onClick?.(anime)
  }, [anime, onClick])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (onClick && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault()
        onClick(anime)
      }
    },
    [anime, onClick]
  )

  const handleRemove = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      onRemove?.(anime)
    },
    [anime, onRemove]
  )

  return (
    <div
      tabIndex={interactive ? 0 : undefined}
      role={interactive ? "button" : undefined}
      aria-label={interactive ? `Selecionar ${anime.title}` : anime.title}
      onKeyDown={interactive ? handleKeyDown : undefined}
      onClick={interactive ? handleClick : undefined}
      className={`relative overflow-hidden rounded-xl cursor-${interactive ? "pointer" : "default"} transition-all duration-300 ${className}`}
      style={{
        aspectRatio: "3 / 4",
        border: selected
          ? "2px solid #8b5cf6"
          : "1px solid rgba(255,255,255,0.1)",
        boxShadow: selected
          ? "0 0 20px rgba(139, 92, 246, 0.3)"
          : "0 4px 12px rgba(0,0,0,0.3)",
      }}
      onMouseEnter={(e) => {
        if (interactive) {
          e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)"
          e.currentTarget.style.boxShadow = "0 0 24px rgba(139, 92, 246, 0.2)"
          e.currentTarget.style.transform = "scale(1.03)"
        }
      }}
      onMouseLeave={(e) => {
        if (interactive) {
          e.currentTarget.style.borderColor = selected
            ? "#8b5cf6"
            : "rgba(255,255,255,0.1)"
          e.currentTarget.style.boxShadow = selected
            ? "0 0 20px rgba(139, 92, 246, 0.3)"
            : "0 4px 12px rgba(0,0,0,0.3)"
          e.currentTarget.style.transform = "scale(1)"
        }
      }}
    >
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${anime.coverImage})` }}
      />

      {/* Fallback gradient if image fails */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(135deg, #1a1a1a, #2a2a2a)", zIndex: -1 }}
      />

      {/* Glass overlay at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          background: "rgba(0, 0, 0, 0.4)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
          padding: "8px 12px",
        }}
      >
        <Text
          fw={700}
          size="sm"
          c="white"
          lineClamp={2}
          style={{ textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
        >
          {anime.title}
        </Text>
        {anime.averageScore && (
          <Text size="xs" c="rgba(255,255,255,0.7)" mt={2}>
            ★ {anime.averageScore}%
          </Text>
        )}
      </div>

      {/* Remove button */}
      {onRemove && (
        <ActionIcon
          variant="filled"
          color="red"
          size="sm"
          radius="xl"
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
          onClick={handleRemove}
          aria-label={`Remover ${anime.title}`}
        >
          <IconX size={14} />
        </ActionIcon>
      )}
    </div>
  )
}
