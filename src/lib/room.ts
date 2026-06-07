import { getRedis } from "./redis"
import type { Anime, Battle, Room, RoomAnime, RoomMessage, RoomMode, TierLabel, TierlistPlacement } from "./types"
import { shuffle, generateId } from "./utils"

function buildBracket(animes: Anime[]): Battle[][] {
  const total = animes.length
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

  return [pairs]
}

export async function createRoom(
  name: string,
  hostNickname: string,
  mode: RoomMode = "tournament"
): Promise<Room> {
  const redis = getRedis()
  const roomId = generateId().slice(0, 8)
  const hostId = generateId()

  const room: Room = {
    id: roomId,
    name,
    hostId,
    players: [{ id: hostId, nickname: hostNickname, isHost: true }],
    pool: [],
    messages: [],
    bracket: [],
    currentRound: 0,
    currentBattleIndex: 0,
    champion: null,
    status: "selecting",
    votes: {},
    mode,
    tierlist: mode === "tierlist"
      ? {
          turnOrder: [],
          currentTurnIndex: 0,
          unranked: [],
          tiers: { lixo: [], ruim: [], mediocre: [], bom: [], top: [] },
          forceVotesUsed: {},
          animeCount: 16,
        }
      : null,
  }

  await redis.set(`room:${roomId}`, JSON.stringify(room))
  await redis.expire(`room:${roomId}`, 86400)

  return room
}

export async function getRoom(roomId: string): Promise<Room | null> {
  const redis = getRedis()
  const data = await redis.get(`room:${roomId}`)
  if (!data) return null
  const room = typeof data === "string" ? JSON.parse(data) : (data as Room)
  if (!room.messages) room.messages = []
  if (!room.pool) room.pool = []
  return room
}

export async function joinRoom(
  roomId: string,
  nickname: string
): Promise<{ room: Room; playerId: string } | { error: string }> {
  const redis = getRedis()
  const room = await getRoom(roomId)

  if (!room) return { error: "Sala não encontrada" }
  if (room.status !== "selecting" && room.status !== "waiting") {
    return { error: "Sala já iniciou" }
  }

  const maxPlayers = room.mode === "tierlist" ? 4 : 16
  if (room.players.length >= maxPlayers) {
    return { error: `Sala cheia (máx ${maxPlayers} jogadores)` }
  }
  if (room.players.some((p) => p.nickname === nickname)) {
    return { error: "Esse nick já está em uso" }
  }

  const playerId = generateId()
  room.players.push({ id: playerId, nickname, isHost: false })

  await redis.set(`room:${roomId}`, JSON.stringify(room))
  await redis.expire(`room:${roomId}`, 86400)

  return { room, playerId }
}

export async function addAnimeToPool(
  roomId: string,
  playerId: string,
  anime: Anime
): Promise<{ error?: string }> {
  const redis = getRedis()
  const room = await getRoom(roomId)

  if (!room) return { error: "Sala não encontrada" }
  if (room.status !== "selecting") return { error: "Fase de seleção encerrada" }
  if (!room.players.find((p) => p.id === playerId)) {
    return { error: "Jogador não está na sala" }
  }

  const maxPool = room.mode === "tierlist" ? (room.tierlist?.animeCount ?? 16) : 16
  if (room.pool.length >= maxPool) return { error: `Pool cheia (máx ${maxPool} animes)` }
  if (room.pool.find((a) => a.id === anime.id)) {
    return { error: "Anime já adicionado" }
  }

  const player = room.players.find((p) => p.id === playerId)!
  const roomAnime: RoomAnime = {
    ...anime,
    addedBy: playerId,
    addedByName: player.nickname,
  }

  room.pool.push(roomAnime)

  await redis.set(`room:${roomId}`, JSON.stringify(room))
  await redis.expire(`room:${roomId}`, 86400)
  return {}
}

export async function removeAnimeFromPool(
  roomId: string,
  playerId: string,
  animeId: number
): Promise<{ error?: string }> {
  const redis = getRedis()
  const room = await getRoom(roomId)

  if (!room) return { error: "Sala não encontrada" }
  if (room.status !== "selecting") return { error: "Fase de seleção encerrada" }

  const anime = room.pool.find((a) => a.id === animeId)
  if (!anime) return { error: "Anime não está na pool" }

  room.pool = room.pool.filter((a) => a.id !== animeId)

  await redis.set(`room:${roomId}`, JSON.stringify(room))
  await redis.expire(`room:${roomId}`, 86400)
  return {}
}

export async function startGame(
  roomId: string,
  playerId: string,
  animeCount?: 8 | 16
): Promise<{ error?: string }> {
  const redis = getRedis()
  const room = await getRoom(roomId)

  if (!room) return { error: "Sala não encontrada" }
  if (room.hostId !== playerId) return { error: "Só o host pode iniciar" }

  if (room.mode === "tierlist") {
    if (room.players.length < 2) return { error: "Precisa de pelo menos 2 jogadores" }
    if (room.players.length > 4) return { error: "Máximo de 4 jogadores" }

    const count = animeCount || room.tierlist?.animeCount || 16
    if (room.pool.length !== count) {
      return { error: `Pool precisa ter exatamente ${count} animes` }
    }

    const turnOrder = shuffle(room.players.map((p) => p.id))
    const forceVotesUsed: Record<string, boolean> = {}
    for (const pid of room.players.map((p) => p.id)) {
      forceVotesUsed[pid] = false
    }

    room.tierlist = {
      turnOrder,
      currentTurnIndex: 0,
      unranked: shuffle(room.pool),
      tiers: { lixo: [], ruim: [], mediocre: [], bom: [], top: [] },
      forceVotesUsed,
      animeCount: count,
    }

    room.status = "tierlisting"
    await redis.set(`room:${roomId}`, JSON.stringify(room))
    await redis.expire(`room:${roomId}`, 86400)
    return {}
  }

  // Modo torneio (comportamento existente)
  if (room.players.length < 2) return { error: "Precisa de pelo menos 2 jogadores" }
  if (room.pool.length < 2 || room.pool.length % 2 !== 0) {
    return { error: "Pool precisa ter um número par de animes (mín. 2)" }
  }

  room.bracket = buildBracket(room.pool)
  room.status = "voting"
  room.currentRound = 0
  room.currentBattleIndex = 0
  room.votes = {}

  const firstBattle = room.bracket[0]?.[0]
  if (firstBattle) {
    room.votes[firstBattle.id] = []
  }

  await redis.set(`room:${roomId}`, JSON.stringify(room))
  return {}
}

export async function placeAnimeInTier(
  roomId: string,
  playerId: string,
  animeId: number,
  tier: TierLabel
): Promise<{ error?: string }> {
  const redis = getRedis()
  const room = await getRoom(roomId)

  if (!room) return { error: "Sala não encontrada" }
  if (room.status !== "tierlisting") return { error: "Fase de classificação encerrada" }
  if (!room.tierlist) return { error: "Estado da tierlist não encontrado" }

  const tl = room.tierlist
  const currentPlayerId = tl.turnOrder[tl.currentTurnIndex]
  if (currentPlayerId !== playerId) return { error: "Não é sua vez" }

  const animeIndex = tl.unranked.findIndex((a) => a.id === animeId)
  if (animeIndex === -1) return { error: "Anime não está na fila de não classificados" }
  if (animeIndex !== 0) return { error: "Você só pode colocar o primeiro anime da fila" }

  if (tier !== "ruim" && tier !== "mediocre" && tier !== "bom") {
    if (tl.tiers[tier].length >= 3) return { error: `Tier ${tier} já está cheio (máx 3)` }
  }

  const anime = tl.unranked[0]
  const placement: TierlistPlacement = {
    animeId: anime.id,
    tier,
    placedBy: playerId,
    forceVoted: false,
  }

  tl.tiers[tier].push(placement)
  tl.unranked.shift()
  tl.currentTurnIndex = (tl.currentTurnIndex + 1) % tl.turnOrder.length

  if (checkTierlistFinished(tl)) {
    room.status = "finished"
  }

  await redis.set(`room:${roomId}`, JSON.stringify(room))
  await redis.expire(`room:${roomId}`, 86400)
  return {}
}

export async function useForceVote(
  roomId: string,
  playerId: string,
  animeId: number,
  fromTier: TierLabel,
  toTier: TierLabel
): Promise<{ error?: string; swappedAnimeId?: number }> {
  const redis = getRedis()
  const room = await getRoom(roomId)

  if (!room) return { error: "Sala não encontrada" }
  if (room.status !== "tierlisting") return { error: "Fase de classificação encerrada" }
  if (!room.tierlist) return { error: "Estado da tierlist não encontrado" }

  const tl = room.tierlist
  const currentPlayerId = tl.turnOrder[tl.currentTurnIndex]
  if (currentPlayerId !== playerId) return { error: "Não é sua vez" }

  if (tl.forceVotesUsed[playerId]) return { error: "Você já usou seu voto com força" }
  if (fromTier === toTier) return { error: "O tier de destino deve ser diferente" }

  const fromPlacement = tl.tiers[fromTier].find((p) => p.animeId === animeId)
  if (!fromPlacement) return { error: "Anime não encontrado no tier de origem" }
  if (fromPlacement.forceVoted) return { error: "Este anime foi travado por um voto com força e não pode ser movido" }

  const toTierAnimes = tl.tiers[toTier]
  if (toTierAnimes.length === 0) return { error: "Não pode mover para um tier vazio" }

  let swappedAnimeId: number | undefined

  if ((toTier === "lixo" || toTier === "top") && toTierAnimes.length >= 3) {
    // Precisa trocar: remove o último do tier destino e coloca no fromTier
    const swapped = toTierAnimes.pop()!
    swappedAnimeId = swapped.animeId
    // Recoloca o anime trocado no fromTier, sem forceVoted
    tl.tiers[fromTier].push({
      animeId: swapped.animeId,
      tier: fromTier,
      placedBy: swapped.placedBy,
      forceVoted: false,
    })
  }

  // Remove o anime do tier de origem
  tl.tiers[fromTier] = tl.tiers[fromTier].filter((p) => p.animeId !== animeId)

  // Marca como force voted e adiciona no destino
  fromPlacement.forceVoted = true
  fromPlacement.tier = toTier
  tl.tiers[toTier].push(fromPlacement)

  tl.forceVotesUsed[playerId] = true
  tl.currentTurnIndex = (tl.currentTurnIndex + 1) % tl.turnOrder.length

  if (checkTierlistFinished(tl)) {
    room.status = "finished"
  }

  await redis.set(`room:${roomId}`, JSON.stringify(room))
  await redis.expire(`room:${roomId}`, 86400)
  return { swappedAnimeId }
}

function checkTierlistFinished(tl: NonNullable<Room["tierlist"]>): boolean {
  return tl.unranked.length === 0 && tl.tiers.lixo.length === 3 && tl.tiers.top.length === 3
}

export async function voteAnime(
  roomId: string,
  playerId: string,
  battleId: string,
  animeId: number
): Promise<{ error?: string; winner?: Anime }> {
  const redis = getRedis()
  const room = await getRoom(roomId)

  if (!room) return { error: "Sala não encontrada" }
  if (room.status !== "voting") return { error: "Votação fechada" }

  const player = room.players.find((p) => p.id === playerId)
  if (!player) return { error: "Jogador não encontrado" }

  const existingVotes = room.votes[battleId] || []
  if (existingVotes.some((v) => v.playerId === playerId)) {
    return { error: "Você já votou" }
  }

  room.votes[battleId] = [...existingVotes, { playerId, animeId }]

  const totalPlayers = room.players.length
  const votedCount = room.votes[battleId].length

  if (votedCount >= totalPlayers) {
    const votesFor = room.votes[battleId].reduce(
      (acc, v) => {
        acc[v.animeId] = (acc[v.animeId] || 0) + 1
        return acc
      },
      {} as Record<number, number>
    )

    const currentBattle = room.bracket[room.currentRound]?.find(
      (b) => b.id === battleId
    )
    if (!currentBattle) return { error: "Batalha não encontrada" }

    const [anime1Votes, anime2Votes] = [
      votesFor[currentBattle.anime1.id] || 0,
      votesFor[currentBattle.anime2.id] || 0,
    ]

    let winner: Anime
    if (anime1Votes > anime2Votes) {
      winner = currentBattle.anime1
    } else if (anime2Votes > anime1Votes) {
      winner = currentBattle.anime2
    } else {
      winner = Math.random() < 0.5 ? currentBattle.anime1 : currentBattle.anime2
    }

    currentBattle.winner = winner

    const currentRoundBattles = room.bracket[room.currentRound]
    const allVoted = currentRoundBattles.every((b) => b.winner !== null)

    if (allVoted) {
      if (currentRoundBattles.length === 1) {
        room.champion = winner
        room.status = "finished"
      } else {
        const winners = currentRoundBattles.map((b) => b.winner!)
        const nextBattles: Battle[] = []
        for (let i = 0; i < winners.length; i += 2) {
          if (i + 1 < winners.length) {
            nextBattles.push({
              id: generateId(),
              anime1: winners[i],
              anime2: winners[i + 1],
              winner: null,
              round: room.currentRound + 1,
              matchIndex: nextBattles.length,
            })
          }
        }
        room.bracket.push(nextBattles)
        room.currentRound++
        room.currentBattleIndex = 0
        room.votes = {}
        const nextBattle = nextBattles[0]
        if (nextBattle) room.votes[nextBattle.id] = []
      }
    } else {
      room.currentBattleIndex++
      room.votes = {}
      const nextBattle = currentRoundBattles.find((b) => !b.winner)
      if (nextBattle) room.votes[nextBattle.id] = []
    }

    await redis.set(`room:${roomId}`, JSON.stringify(room))
    await redis.expire(`room:${roomId}`, 86400)

    return { winner }
  }

  await redis.set(`room:${roomId}`, JSON.stringify(room))
  return {}
}

export async function reconnectToRoom(
  roomId: string,
  playerId: string
): Promise<{ room: Room; nickname: string } | { error: string }> {
  const redis = getRedis()
  const room = await getRoom(roomId)

  if (!room) return { error: "Sala não encontrada" }
  if (room.status === "finished") return { error: "Sala encerrada" }

  const player = room.players.find((p) => p.id === playerId)
  if (!player) return { error: "Jogador não encontrado na sala" }

  return { room, nickname: player.nickname }
}

export async function sendMessage(
  roomId: string,
  playerId: string,
  text: string
): Promise<{ error?: string }> {
  const redis = getRedis()
  const room = await getRoom(roomId)
  if (!room) return { error: "Sala não encontrada" }

  const player = room.players.find((p) => p.id === playerId)
  if (!player) return { error: "Jogador não encontrado" }

  const msg: RoomMessage = {
    id: generateId(),
    playerId,
    nickname: player.nickname,
    text: text.slice(0, 500),
    createdAt: Date.now(),
  }

  room.messages.push(msg)
  if (room.messages.length > 100) {
    room.messages = room.messages.slice(-100)
  }

  await redis.set(`room:${roomId}`, JSON.stringify(room))
  await redis.expire(`room:${roomId}`, 86400)
  return {}
}

export async function resetRoom(roomId: string): Promise<{ error?: string }> {
  const redis = getRedis()
  const room = await getRoom(roomId)
  if (!room) return { error: "Sala não encontrada" }

  await redis.del(`room:${roomId}`)
  return {}
}
