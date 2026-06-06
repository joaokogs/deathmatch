"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Anime, Battle, Tournament } from "@/src/lib/types"
import { shuffle, generateId } from "@/src/lib/utils"

function buildBracket(animes: Anime[]): Battle[][] {
  const total = animes.length
  const rounds: Battle[][] = []
  const shuffled = shuffle(animes)
  const pairs: Battle[] = []

  for (let i = 0; i < total; i += 2) {
    if (i + 1 < total) {
      pairs.push({
        id: generateId(),
        anime1: shuffled[i],
        anime2: shuffled[i + 1],
        winner: null,
        round: 0,
        matchIndex: pairs.length,
      })
    }
  }

  rounds.push(pairs)
  return rounds
}

interface TournamentState {
  tournament: Tournament | null
  pendingAnimes: Anime[]
  pendingName: string
  setPendingName: (name: string) => void
  addPendingAnime: (anime: Anime) => void
  removePendingAnime: (animeId: number) => void
  clearPending: () => void
  createTournament: (name: string, animes: Anime[]) => void
  vote: (battleId: string, winner: Anime) => void
  reset: () => void
}

export const useTournamentStore = create<TournamentState>()(
  persist(
    (set, get) => ({
      tournament: null,
      pendingAnimes: [],
      pendingName: "",

      setPendingName: (name: string) => {
        set({ pendingName: name })
      },

      addPendingAnime: (anime: Anime) => {
        const { pendingAnimes } = get()
        if (pendingAnimes.length < 16 && !pendingAnimes.find((a) => a.id === anime.id)) {
          set({ pendingAnimes: [...pendingAnimes, anime] })
        }
      },

      removePendingAnime: (animeId: number) => {
        const { pendingAnimes } = get()
        set({ pendingAnimes: pendingAnimes.filter((a) => a.id !== animeId) })
      },

      clearPending: () => {
        set({ pendingAnimes: [], pendingName: "" })
      },

      createTournament: (name: string, animes: Anime[]) => {
        const bracket = buildBracket(animes)
        const tournament: Tournament = {
          id: generateId(),
          name,
          animes,
          bracket,
          currentRound: 0,
          champion: null,
          isFinished: false,
        }
        set({ tournament, pendingAnimes: [], pendingName: "" })
      },

      vote: (battleId: string, winner: Anime) => {
        const { tournament } = get()
        if (!tournament) return

        const newBracket = tournament.bracket.map((round) =>
          round.map((battle) =>
            battle.id === battleId
              ? { ...battle, winner }
              : battle
          )
        )

        const currentRoundBattles = newBracket[tournament.currentRound]
        const allVoted = currentRoundBattles.every((b) => b.winner !== null)

        if (allVoted) {
          if (currentRoundBattles.length === 1) {
            // É a final! Campeão definido
            set({
              tournament: {
                ...tournament,
                bracket: newBracket,
                champion: winner,
                isFinished: true,
              },
            })
          } else {
            // Avança para o próximo round
            const winners = currentRoundBattles.map((b) => b.winner!)
            const nextRoundBattles: Battle[] = []

            for (let i = 0; i < winners.length; i += 2) {
              if (i + 1 < winners.length) {
                nextRoundBattles.push({
                  id: generateId(),
                  anime1: winners[i],
                  anime2: winners[i + 1],
                  winner: null,
                  round: tournament.currentRound + 1,
                  matchIndex: nextRoundBattles.length,
                })
              }
            }

            newBracket.push(nextRoundBattles)
            set({
              tournament: {
                ...tournament,
                bracket: newBracket,
                currentRound: tournament.currentRound + 1,
              },
            })
          }
        } else {
          // Ainda não votou todas — salva o voto atual
          set({
            tournament: {
              ...tournament,
              bracket: newBracket,
            },
          })
        }
      },

      reset: () => {
        set({ tournament: null })
      },
    }),
    {
      name: "deathmatch-storage",
    }
  )
)
