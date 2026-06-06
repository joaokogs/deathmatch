"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { TextInput, SimpleGrid, Loader, Center, Text, Stack, Group, Button } from "@mantine/core"
import { IconSearch, IconChevronLeft, IconChevronRight } from "@tabler/icons-react"
import { fetchAnimes } from "@/src/lib/anilist"
import { AnimeCard } from "./AnimeCard"
import { GenreTags } from "./GenreTags"
import type { Anime, SearchResult } from "@/src/lib/types"

interface AnimeSearchProps {
  selectedAnimes: Anime[]
  onSelect: (anime: Anime) => void
  maxSelections: number
}

export function AnimeSearch({
  selectedAnimes,
  onSelect,
  maxSelections,
}: AnimeSearchProps) {
  const [query, setQuery] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [result, setResult] = useState<SearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const searchRef = useRef<ReturnType<typeof setTimeout>>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const doFetch = useCallback(async (opts: { query?: string; genres?: string[]; page?: number }) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setError(null)

    try {
      const res = await fetchAnimes(opts, controller.signal)
      if (mountedRef.current) {
        setResult(res)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      if (mountedRef.current) {
        setError("Erro ao buscar animes. Tente novamente.")
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    mountedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    doFetch({ page: 1 })
    return () => {
      mountedRef.current = false
      abortRef.current?.abort()
      if (searchRef.current) clearTimeout(searchRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value)
      setPage(1)

      if (searchRef.current) clearTimeout(searchRef.current)

      if (!value.trim() && selectedGenres.length === 0) {
        setResult(null)
        return
      }

      if (!value.trim() && selectedGenres.length > 0) {
        // Só gênero selecionado sem texto
        doFetch({ genres: selectedGenres, page: 1 })
        return
      }

      searchRef.current = setTimeout(() => {
        doFetch({
          query: value,
          genres: selectedGenres.length > 0 ? selectedGenres : undefined,
          page: 1,
        })
      }, 400)
    },
    [doFetch, selectedGenres]
  )

  const handleGenresChange = useCallback(
    (genres: string[]) => {
      setSelectedGenres(genres)
      setPage(1)

      if (searchRef.current) clearTimeout(searchRef.current)

      if (genres.length === 0 && !query.trim()) {
        doFetch({ page: 1 })
        return
      }

      doFetch({
        query: query.trim() || undefined,
        genres: genres.length > 0 ? genres : undefined,
        page: 1,
      })
    },
    [doFetch, query]
  )

  const goToPage = useCallback(
    (newPage: number) => {
      if (newPage < 1 || (result && newPage > result.pageInfo.lastPage)) return
      setPage(newPage)

      if (query.trim()) {
        doFetch({
          query,
          genres: selectedGenres.length > 0 ? selectedGenres : undefined,
          page: newPage,
        })
      } else if (selectedGenres.length > 0) {
        doFetch({ genres: selectedGenres, page: newPage })
      } else {
        doFetch({ page: newPage })
      }
    },
    [query, selectedGenres, result, doFetch]
  )

  const canSelect = selectedAnimes.length < maxSelections
  const selectedIds = new Set(selectedAnimes.map((a) => a.id))
  const animes = result?.animes || []
  const pageInfo = result?.pageInfo

  return (
    <Stack gap="md">
      <TextInput
        placeholder="Buscar anime por nome..."
        leftSection={<IconSearch size={20} />}
        value={query}
        onChange={(e) => handleSearch(e.currentTarget.value)}
        size="lg"
        radius="md"
        styles={{
          input: {
            backgroundColor: "#141414",
            border: "1px solid #2a2a2a",
            color: "white",
          },
        }}
      />

      <GenreTags selected={selectedGenres} onSelect={handleGenresChange} />

      {loading && (
        <Center py="xl">
          <Loader color="grape" />
        </Center>
      )}

      {error && (
        <Text c="red" ta="center" py="md">
          {error}
        </Text>
      )}

      {!loading && animes.length === 0 && !error && (
        <Text c="dimmed" ta="center" py="xl">
          Nenhum anime encontrado.
        </Text>
      )}

      {animes.length > 0 && !loading && (
        <>
          <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
            {animes.map((anime) => {
              const isSelected = selectedIds.has(anime.id)
              return (
                <AnimeCard
                  key={anime.id}
                  anime={anime}
                  selected={isSelected}
                  onClick={isSelected ? undefined : canSelect ? onSelect : undefined}
                />
              )
            })}
          </SimpleGrid>

          {pageInfo && pageInfo.lastPage > 1 && (
            <Group justify="center" mt="md">
              <Button
                variant="outline"
                color="gray"
                size="sm"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
                leftSection={<IconChevronLeft size={16} />}
              >
                Anterior
              </Button>
              <Text size="sm" c="dimmed" px="md">
                Página {pageInfo.currentPage} de {pageInfo.lastPage}
                {" — "}
                {pageInfo.total} resultados
              </Text>
              <Button
                variant="outline"
                color="gray"
                size="sm"
                disabled={page >= pageInfo.lastPage}
                onClick={() => goToPage(page + 1)}
                rightSection={<IconChevronRight size={16} />}
              >
                Próxima
              </Button>
            </Group>
          )}
        </>
      )}
    </Stack>
  )
}
