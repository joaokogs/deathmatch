"use client"

import { MultiSelect, Stack, Text } from "@mantine/core"
import { IconFilter } from "@tabler/icons-react"

interface GenreTagsProps {
  selected: string[]
  onSelect: (genres: string[]) => void
}

const GENRES = [
  { label: "Ação", value: "Action" },
  { label: "Aventura", value: "Adventure" },
  { label: "Comédia", value: "Comedy" },
  { label: "Drama", value: "Drama" },
  { label: "Fantasia", value: "Fantasy" },
  { label: "Ficção Científica", value: "Sci-Fi" },
  { label: "Romance", value: "Romance" },
  { label: "Slice of Life", value: "Slice of Life" },
  { label: "Sobrenatural", value: "Supernatural" },
  { label: "Suspense", value: "Thriller" },
  { label: "Esporte", value: "Sports" },
  { label: "Música", value: "Music" },
  { label: "Mistério", value: "Mystery" },
  { label: "Psicológico", value: "Psychological" },
  { label: "Terror", value: "Horror" },
  { label: "Mecha", value: "Mecha" },
]

export function GenreTags({ selected, onSelect }: GenreTagsProps) {
  return (
    <Stack gap={4}>
      <Text size="sm" c="#888" fw={500}>
        Filtrar por gêneros
      </Text>
      <MultiSelect
        placeholder="Selecione um ou mais gêneros..."
        data={GENRES}
        value={selected}
        onChange={onSelect}
        leftSection={<IconFilter size={18} />}
        clearable
        searchable
        hidePickedOptions
        size="md"
        radius="md"
        styles={{
          input: {
            backgroundColor: "#141414",
            border: "1px solid #2a2a2a",
            color: "white",
          },
          dropdown: {
            backgroundColor: "#1a1a1a",
            border: "1px solid #2a2a2a",
          },
          pill: {
            backgroundColor: "#8b5cf6",
            color: "white",
          },
        }}
      />
    </Stack>
  )
}
