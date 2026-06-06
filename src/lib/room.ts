import { getRedis } from "./redis"
import type { Anime, Battle, Room, RoomAnime, RoomMessage } from "./types"
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
  hostNickname: string
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
  // Garante campos que podem estar faltando em dados antigos do Redis
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
  if (room.players.length >= 16) return { error: "Sala cheia" }
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
  if (room.pool.length >= 16) return { error: "Pool cheia (máx 16 animes)" }
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

  // Qualquer um pode remover
  room.pool = room.pool.filter((a) => a.id !== animeId)

  await redis.set(`room:${roomId}`, JSON.stringify(room))
  await redis.expire(`room:${roomId}`, 86400)
  return {}
}

export async function startGame(roomId: string, playerId: string): Promise<{ error?: string }> {
  const redis = getRedis()
  const room = await getRoom(roomId)

  if (!room) return { error: "Sala não encontrada" }
  if (room.hostId !== playerId) return { error: "Só o host pode iniciar" }
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
