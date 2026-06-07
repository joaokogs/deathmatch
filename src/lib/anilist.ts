import type { AniListMedia, AniListResponse, Anime, SearchResult } from "./types"

const ANILIST_API = "https://graphql.anilist.co"

const SEARCH_QUERY = `
query ($search: String, $genre_in: [String], $page: Int, $perPage: Int, $sort: [MediaSort]) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      total
      currentPage
      lastPage
      perPage
    }
    media(search: $search, genre_in: $genre_in, type: ANIME, sort: $sort) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        large
        extraLarge
      }
      format
      episodes
      averageScore
      genres
    }
  }
}
`

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+\d+(?:st|nd|rd|th)?\s*season$/i, "")
    .replace(/\s+season\s+\d+$/i, "")
    .replace(/\s+part\s+(?:[ivxlcdm]+|\d+)$/i, "")
    .replace(/\s+cour\s+\d+$/i, "")
    .replace(/\s+\(tv\)$/i, "")
    .replace(/\s+\d+(?:st|nd|rd|th)?\s*series$/i, "")
    .replace(/\s+s\d+$/i, "")
    .trim()
}

function mapMediaToAnime(media: AniListMedia): Anime {
  return {
    id: media.id,
    title: media.title.english || media.title.romaji,
    coverImage: media.coverImage.extraLarge || media.coverImage.large,
    format: media.format,
    episodes: media.episodes,
    averageScore: media.averageScore,
    genres: media.genres || [],
  }
}

export async function fetchAnimes(
  options: { query?: string; genres?: string[]; page?: number; sort?: string },
  signal?: AbortSignal
): Promise<SearchResult> {
  const { query, genres, page = 1, sort } = options

  // Se for busca "Todos" (sem query e sem gênero), ordena alfabeticamente
  // Senão, ordena por popularidade
  const hasFilter = !!(query || (genres && genres.length > 0))
  const sortOrder = sort || (hasFilter ? "POPULARITY_DESC" : "TITLE_ROMAJI")

  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort(), 10000)

  if (signal) {
    signal.addEventListener("abort", () => timeoutController.abort(signal.reason), {
      once: true,
    })
  }

  try {
    const response = await fetch(ANILIST_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: SEARCH_QUERY,
        variables: {
          search: query || null,
          genre_in: genres && genres.length > 0 ? genres : null,
          page,
          perPage: 20,
          sort: [sortOrder],
        },
      }),
      signal: timeoutController.signal,
    })

    if (!response.ok) {
      throw new Error(`Erro ao conectar com AniList (HTTP ${response.status})`)
    }

    const json: AniListResponse = await response.json()

    if (json.errors && json.errors.length > 0) {
      const message = json.errors[0].message || "Erro desconhecido"
      if (message.includes("rate limit") || message.includes("Too Many Requests")) {
        throw new Error("Muitas requisições. Aguarde um momento e tente novamente.")
      }
      throw new Error(`Erro na busca: ${message}`)
    }

    if (!json.data?.Page?.media) {
      return { animes: [], pageInfo: { total: 0, currentPage: page, lastPage: 1, perPage: 20 } }
    }

    return {
      animes: json.data.Page.media.map(mapMediaToAnime),
      pageInfo: json.data.Page.pageInfo,
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchAnimesPool(
  options: { genres?: string[]; maxPages?: number },
  signal?: AbortSignal
): Promise<Anime[]> {
  const { genres, maxPages = 5 } = options

  const firstResult = await fetchAnimes(
    { genres, page: 1, sort: "POPULARITY_DESC" },
    signal
  )

  const pool = new Map<number, Anime>()
  const seenTitles = new Set<string>()

  for (const anime of firstResult.animes) {
    pool.set(anime.id, anime)
    seenTitles.add(normalizeTitle(anime.title))
  }

  const lastPage = firstResult.pageInfo?.lastPage ?? 1
  const pagesToFetch = Math.min(lastPage, maxPages)

  if (pagesToFetch <= 1) {
    return Array.from(pool.values())
  }

  const sorts = ["SCORE_DESC", "TRENDING_DESC", "FAVOURITES_DESC", "POPULARITY_DESC"]

  const requests = Array.from({ length: pagesToFetch - 1 }, (_, i) => {
    const page = i + 2
    const sort = sorts[(page - 2) % sorts.length]
    return fetchAnimes({ genres, page, sort }, signal)
  })

  const results = await Promise.allSettled(requests)

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const anime of result.value.animes) {
        const normalized = normalizeTitle(anime.title)
        if (!pool.has(anime.id) && !seenTitles.has(normalized)) {
          pool.set(anime.id, anime)
          seenTitles.add(normalized)
        }
      }
    }
  }

  return Array.from(pool.values())
}
