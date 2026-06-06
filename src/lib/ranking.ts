import type { Anime, Battle } from "./types"

export interface RankedAnime {
  anime: Anime
  position: number
  label: string
  isChampion: boolean
}

export function computeRanking(
  bracket: Battle[][],
  champion: Anime,
  allAnimes: Anime[]
): RankedAnime[] {
  const totalRounds = bracket.length
  if (totalRounds === 0) return []

  // Mapa de animeId → round em que foi eliminado
  const eliminatedInRound = new Map<number, number>()
  const championsSet = new Set<number>()

  for (let roundIdx = 0; roundIdx < totalRounds; roundIdx++) {
    const round = bracket[roundIdx]
    for (const battle of round) {
      if (battle.winner) {
        // Perdedor é eliminado neste round
        const loser =
          battle.winner.id === battle.anime1.id ? battle.anime2 : battle.anime1
        eliminatedInRound.set(loser.id, roundIdx)
      }
    }
  }

  // O campeão nunca foi eliminado
  const finalRound = bracket[totalRounds - 1]
  if (finalRound?.[0]?.winner) {
    championsSet.add(finalRound[0].winner.id)
  } else {
    championsSet.add(champion.id)
  }

  // Construir lista ranqueada
  const ranked: { anime: Anime; eliminatedAt: number | null }[] = []

  for (const anime of allAnimes) {
    if (championsSet.has(anime.id)) {
      ranked.push({ anime, eliminatedAt: null })
    } else {
      const round = eliminatedInRound.get(anime.id)
      if (round !== undefined) {
        ranked.push({ anime, eliminatedAt: round })
      }
    }
  }

  // Ordenar: campeão primeiro, depois quem foi eliminado mais tarde
  ranked.sort((a, b) => {
    if (a.eliminatedAt === null) return -1
    if (b.eliminatedAt === null) return 1
    return b.eliminatedAt - a.eliminatedAt
  })

  // Atribuir posições e labels
  const result: RankedAnime[] = ranked.map((item, idx) => {
    const position = idx + 1
    let label: string

    if (item.eliminatedAt === null) {
      label = "Campeão"
    } else if (position === 2) {
      label = "2º Lugar"
    } else if (totalRounds === 1) {
      label = `${position}º Lugar`
    } else {
      // Agrupar por round de eliminação
      const eliminatedRound = item.eliminatedAt
      const nextRoundStart = Math.pow(2, totalRounds - eliminatedRound - 1) + 1
      const roundEnd = Math.pow(2, totalRounds - eliminatedRound)
      label = `${nextRoundStart}º - ${roundEnd}º`
    }

    return {
      anime: item.anime,
      position,
      label,
      isChampion: item.eliminatedAt === null,
    }
  })

  return result
}
