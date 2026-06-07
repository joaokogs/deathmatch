export interface AniListCoverImage {
  large: string
  extraLarge: string
}

export interface AniListTitle {
  romaji: string
  english: string | null
  native: string | null
}

export interface AniListMedia {
  id: number
  title: AniListTitle
  coverImage: AniListCoverImage
  format: string
  episodes: number | null
  averageScore: number | null
  genres: string[]
}

export interface AniListResponse {
  data: {
    Page: {
      pageInfo: AniListPageInfo
      media: AniListMedia[]
    }
  }
  errors?: { message: string }[]
}

export interface AniListPageInfo {
  total: number
  currentPage: number
  lastPage: number
  perPage: number
}

export interface AniListResponse {
  data: {
    Page: {
      pageInfo: AniListPageInfo
      media: AniListMedia[]
    }
  }
  errors?: { message: string }[]
}

export interface SearchResult {
  animes: Anime[]
  pageInfo: AniListPageInfo
}

export interface Anime {
  id: number
  title: string
  coverImage: string
  format: string
  episodes: number | null
  averageScore: number | null
  genres: string[]
}

export interface Battle {
  id: string
  anime1: Anime
  anime2: Anime
  winner: Anime | null
  round: number
  matchIndex: number
}

export interface Tournament {
  id: string
  name: string
  animes: Anime[]
  bracket: Battle[][]
  currentRound: number
  champion: Anime | null
  isFinished: boolean
}

export interface RoomPlayer {
  id: string
  nickname: string
  isHost: boolean
}

export interface RoomAnime extends Anime {
  addedBy: string
  addedByName: string
}

export interface RoomVote {
  playerId: string
  animeId: number
}

export interface RoomMessage {
  id: string
  playerId: string
  nickname: string
  text: string
  createdAt: number
}

export type RoomMode = "tournament" | "tierlist"

export type TierLabel = "lixo" | "ruim" | "mediocre" | "bom" | "top"

export const TIER_LABELS: Record<TierLabel, string> = {
  top: "Top Top",
  bom: "Bom",
  mediocre: "Medíocre",
  ruim: "Ruim",
  lixo: "Lixo",
}

export const TIER_COLORS: Record<TierLabel, string> = {
  top: "#8b5cf6",
  bom: "#2f9e44",
  mediocre: "#5c5c5c",
  ruim: "#f08c00",
  lixo: "#e03131",
}

export interface TierlistPlacement {
  animeId: number
  tier: TierLabel
  placedBy: string
  forceVoted: boolean
}

export interface TierlistState {
  turnOrder: string[]
  currentTurnIndex: number
  unranked: RoomAnime[]
  tiers: Record<TierLabel, TierlistPlacement[]>
  forceVotesUsed: Record<string, boolean>
  animeCount: number
}

export interface Room {
  id: string
  name: string
  hostId: string
  players: RoomPlayer[]
  pool: RoomAnime[]
  messages: RoomMessage[]
  bracket: Battle[][]
  currentRound: number
  currentBattleIndex: number
  champion: Anime | null
  status: "waiting" | "selecting" | "voting" | "tierlisting" | "finished"
  votes: Record<string, RoomVote[]>
  mode: RoomMode
  tierlist: TierlistState | null
}
