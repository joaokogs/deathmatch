"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { generateId } from "@/src/lib/utils"
import type { Anime } from "@/src/lib/types"

export type TierSlot = "unranked" | "lixo" | "ruim" | "mediocre" | "bom" | "top" | "nao_assisti"
export type TierLabel = "lixo" | "ruim" | "mediocre" | "bom" | "top" | "nao_assisti"

export const TIER_LABELS: Record<TierLabel, string> = {
  top: "Top Top",
  bom: "Bom",
  mediocre: "Medíocre",
  ruim: "Ruim",
  lixo: "Lixo",
  nao_assisti: "Não assisti",
}

export const TIER_COLORS: Record<TierLabel, string> = {
  top: "#8b5cf6",
  bom: "#2f9e44",
  mediocre: "#5c5c5c",
  ruim: "#f08c00",
  lixo: "#e03131",
  nao_assisti: "#3d3d3d",
}

export type InteractionMode = "click" | "drag"

export interface TierlistState {
  id: string
  genres: string[]
  animes: Anime[]
  tiers: Record<string, Anime[]>
  isFinished: boolean
  interactionMode: InteractionMode
  setGenres: (genres: string[]) => void
  setAnimes: (animes: Anime[]) => void
  setMode: (mode: InteractionMode) => void
  moveAnime: (animeId: number, from: string, to: string) => void
  finish: () => void
  reset: () => void
}

const INITIAL_TIERS: Record<string, Anime[]> = {
  unranked: [],
  top: [],
  bom: [],
  mediocre: [],
  ruim: [],
  lixo: [],
  nao_assisti: [],
}

export const useTierlistStore = create<TierlistState>()(
  persist(
    (set, get) => ({
      id: "",
      genres: [],
      animes: [],
      tiers: { ...INITIAL_TIERS },
      isFinished: false,
      interactionMode: "drag",

      setGenres: (genres) => set({ genres }),

      setAnimes: (animes) => {
        const id = generateId().slice(0, 8)
        set({
          id,
          animes,
          tiers: { ...INITIAL_TIERS, unranked: [...animes] },
          isFinished: false,
        })
      },

      setMode: (mode) => set({ interactionMode: mode }),

      moveAnime: (animeId, from, to) => {
        const state = get()
        if (from === to) return

        const fromTier = [...(state.tiers[from] || [])]
        const toTier = [...(state.tiers[to] || [])]
        const anime = fromTier.find((a) => a.id === animeId)
        if (!anime) return

        set({
          tiers: {
            ...state.tiers,
            [from]: fromTier.filter((a) => a.id !== animeId),
            [to]: [...toTier, anime],
          },
        })
      },

      finish: () => set({ isFinished: true }),

      reset: () =>
        set({
          id: "",
          genres: [],
          animes: [],
          tiers: { ...INITIAL_TIERS },
          isFinished: false,
        }),
    }),
    {
      name: "deathmatch-tierlist",
    }
  )
)
