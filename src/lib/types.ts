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
  status: "waiting" | "selecting" | "voting" | "finished"
  votes: Record<string, RoomVote[]>
}
