"use client"

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Stack, Text, Container, Center, Loader } from "@mantine/core"
import { AnimeSearch } from "@/src/components/AnimeSearch"
import { SelectedList } from "@/src/components/SelectedList"
import { useTournamentStore } from "@/src/store/tournament"

const MAX_ANIMES = 16

function NovoContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const storeName = useTournamentStore((s) => s.pendingName)
  const pendingAnimes = useTournamentStore((s) => s.pendingAnimes)
  const addPendingAnime = useTournamentStore((s) => s.addPendingAnime)
  const removePendingAnime = useTournamentStore((s) => s.removePendingAnime)
  const setPendingName = useTournamentStore((s) => s.setPendingName)
  const createTournament = useTournamentStore((s) => s.createTournament)

  const urlName = searchParams.get("name") || ""
  const tournamentName = storeName || urlName || "Meu Torneio"

  // Sync url name to store on first load
  useEffect(() => {
    if (urlName && !storeName) {
      setPendingName(urlName)
    }
  }, [urlName, storeName, setPendingName])

  const handleSelect = (anime: import("@/src/lib/types").Anime) => {
    addPendingAnime(anime)
  }

  const handleRemove = (anime: import("@/src/lib/types").Anime) => {
    removePendingAnime(anime.id)
  }

  const handleStart = () => {
    if (pendingAnimes.length >= 2 && pendingAnimes.length % 2 === 0) {
      createTournament(tournamentName, pendingAnimes)
      const tournamentId = useTournamentStore.getState().tournament?.id
      if (tournamentId) {
        router.push(`/torneio/${tournamentId}`)
      }
    }
  }

  return (
    <Container size="xl" py="xl" className="max-sm:!py-4">
      <Stack gap="xl">
        <div>
          <Text
            fw={900}
            size="xl"
            ta="center"
            style={{
              fontSize: "clamp(22px, 8vw, 32px)",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {tournamentName}
          </Text>
          <Text c="#888" size="sm">
            Selecione até {MAX_ANIMES} animes para começar o torneio
          </Text>
        </div>

        <AnimeSearch
          selectedAnimes={pendingAnimes}
          onSelect={handleSelect}
          maxSelections={MAX_ANIMES}
        />

        <SelectedList
          animes={pendingAnimes}
          maxSelections={MAX_ANIMES}
          onRemove={handleRemove}
          onStart={handleStart}
          tournamentName={tournamentName}
        />
      </Stack>
    </Container>
  )
}

export default function NovoPage() {
  return (
    <Suspense
      fallback={
        <Center mih="100vh">
          <Loader color="grape" />
        </Center>
      }
    >
      <NovoContent />
    </Suspense>
  )
}
