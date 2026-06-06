"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Center, Loader } from "@mantine/core"
import { ResultScreen } from "@/src/components/ResultScreen"
import { useTournamentStore } from "@/src/store/tournament"

export default function ResultadoPage() {
  const params = useParams()
  const router = useRouter()
  const tournament = useTournamentStore((s) => s.tournament)

  useEffect(() => {
    if (!tournament) {
      router.push("/")
    }
  }, [tournament, router])

  useEffect(() => {
    if (tournament && (!tournament.isFinished || !tournament.champion)) {
      router.push(`/torneio/${params.id}`)
    }
  }, [tournament, params.id, router])

  if (!tournament) {
    return (
      <Center mih="100vh">
        <Loader color="grape" />
      </Center>
    )
  }

  if (!tournament.isFinished || !tournament.champion) {
    return (
      <Center mih="100vh">
        <Loader color="grape" />
      </Center>
    )
  }

  return (
    <ResultScreen
      champion={tournament.champion}
      tournamentName={tournament.name}
      bracket={tournament.bracket}
      allAnimes={tournament.animes}
    />
  )
}
