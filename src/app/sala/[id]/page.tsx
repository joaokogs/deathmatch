"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Stack, Text, Button, Group, Badge, Center, Loader,
  Card, Image, Box, SimpleGrid, Avatar, Progress, TextInput,
  ActionIcon, Paper, Drawer,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconCopy, IconArrowLeft, IconX, IconSearch, IconChevronLeft, IconChevronRight, IconUsers, IconLayoutSidebar } from "@tabler/icons-react"
import { fetchAnimes } from "@/src/lib/anilist"
import { GenreTags } from "@/src/components/GenreTags"
import type { Room, Anime, SearchResult } from "@/src/lib/types"

const MAX_POOL = 16

export default function SalaPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string

  const [room, setRoom] = useState<Room | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [nickname, setNickname] = useState("")
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [votedAnime, setVotedAnime] = useState<number | null>(null)
  const [copied, setCopied] = useState(false)
  const [sidebarOpened, { toggle: toggleSidebar, close: closeSidebar }] = useDisclosure(true)

  // Busca de animes
  const [query, setQuery] = useState("")
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [result, setResult] = useState<SearchResult | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const searchRef = useRef<ReturnType<typeof setTimeout>>(null)
  const abortRef = useRef<AbortController | null>(null)
  const mountedRef = useRef(true)

  const pollRef = useRef<ReturnType<typeof setInterval>>(null)

  // Player ID + Auto-reconnect
  useEffect(() => {
    let cancelled = false

    const tryReconnect = async () => {
      const savedPlayerId = localStorage.getItem("anime-battle-player-id")
      const savedRoomId = localStorage.getItem("anime-battle-room-id")
      const savedNickname = localStorage.getItem("anime-battle-nickname")

      // Sem dados salvos → mostra tela de join
      if (!savedPlayerId || !savedRoomId) return

      // roomId salvo não bate com a sala atual → dados stale, limpar
      if (savedRoomId !== roomId) {
        localStorage.removeItem("anime-battle-player-id")
        localStorage.removeItem("anime-battle-room-id")
        localStorage.removeItem("anime-battle-nickname")
        return
      }

      // roomId bate → tenta reconectar via API
      try {
        const res = await fetch(`/api/rooms/${roomId}/reconnect`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ playerId: savedPlayerId }),
        })

        if (!res.ok) {
          // Player não é mais válido (sala expirou, removido, etc.)
          localStorage.removeItem("anime-battle-player-id")
          localStorage.removeItem("anime-battle-room-id")
          localStorage.removeItem("anime-battle-nickname")
          return
        }

        if (!cancelled) {
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPlayerId(savedPlayerId)
          if (savedNickname) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setNickname(savedNickname)
          }
        }
      } catch {
        // Erro de rede → limpa dados para forçar re-join
        if (!cancelled) {
          localStorage.removeItem("anime-battle-player-id")
          localStorage.removeItem("anime-battle-room-id")
          localStorage.removeItem("anime-battle-nickname")
        }
      }
    }

    tryReconnect()
    return () => { cancelled = true }
  }, [roomId])

  // Polling da sala
  const fetchRoom = useCallback(async () => {
    try {
      const res = await fetch(`/api/rooms/${roomId}`)
      if (!res.ok) { if (pollRef.current) clearInterval(pollRef.current); setError("Sala não encontrada"); return }
      const data = await res.json()
      setRoom(data.room)
    } catch { /* ignora */ }
  }, [roomId])

  useEffect(() => {
    mountedRef.current = true
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRoom()
    pollRef.current = setInterval(fetchRoom, 2000)
    return () => { mountedRef.current = false; if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchRoom])

  // Busca de animes
  const doFetch = useCallback(async (opts: { query?: string; genres?: string[]; page?: number }) => {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setSearchLoading(true)
    setSearchError(null)
    try {
      const res = await fetchAnimes(opts, controller.signal)
      if (mountedRef.current) setResult(res)
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return
      if (mountedRef.current) setSearchError("Erro ao buscar animes")
    } finally {
      if (mountedRef.current) setSearchLoading(false)
    }
  }, [])

  // Carrega "Todos" ao entrar
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    doFetch({ page: 1 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    setSelectedGenres([])
    setPage(1)
    if (searchRef.current) clearTimeout(searchRef.current)
    if (!value.trim()) { setResult(null); doFetch({ page: 1 }); return }
    searchRef.current = setTimeout(() => doFetch({ query: value, page: 1 }), 400)
  }, [doFetch])

  const handleGenresChange = useCallback((genres: string[]) => {
    setSelectedGenres(genres)
    setQuery("")
    setPage(1)
    if (searchRef.current) clearTimeout(searchRef.current)
    doFetch({ genres: genres.length > 0 ? genres : undefined, page: 1 })
  }, [doFetch])

  const goToPage = useCallback((newPage: number) => {
    if (newPage < 1 || (result && newPage > result.pageInfo.lastPage)) return
    setPage(newPage)
    if (query.trim()) doFetch({ query, genres: selectedGenres.length > 0 ? selectedGenres : undefined, page: newPage })
    else if (selectedGenres.length > 0) doFetch({ genres: selectedGenres, page: newPage })
    else doFetch({ page: newPage })
  }, [query, selectedGenres, result, doFetch])

  // Ações da sala
  const handleJoin = async () => {
    if (!nickname.trim()) return
    setJoining(true); setJoinError(null)
    try {
      const res = await fetch(`/api/rooms/${roomId}/join`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error); return }
      setPlayerId(data.playerId)
      localStorage.setItem("anime-battle-player-id", data.playerId)
      localStorage.setItem("anime-battle-room-id", roomId)
      localStorage.setItem("anime-battle-nickname", nickname.trim())
      setRoom(data.room)
    } catch { setJoinError("Erro de conexão") }
    finally { setJoining(false) }
  }

  const handleAddAnime = async (anime: Anime) => {
    if (!playerId) return
    await fetch(`/api/rooms/${roomId}/animes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, anime }),
    })
    fetchRoom()
  }

  const handleRemoveAnime = async (animeId: number) => {
    if (!playerId) return
    await fetch(`/api/rooms/${roomId}/animes/remove`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, animeId }),
    })
    fetchRoom()
  }

  const handleStart = async () => {
    if (!playerId) return
    const res = await fetch(`/api/rooms/${roomId}/start`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId }),
    })
    if (res.ok) setVotedAnime(null)
  }

  const handleVote = async (animeId: number) => {
    if (!playerId || votedAnime) return
    setVotedAnime(animeId)
    const cr = room!.bracket[room!.currentRound]
    const cb = cr?.find((b) => !b.winner) || cr?.[0]
    if (!cb) return
    await fetch(`/api/rooms/${roomId}/vote`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, battleId: cb.id, animeId }),
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleLeave = () => {
    localStorage.removeItem("anime-battle-player-id")
    localStorage.removeItem("anime-battle-room-id")
    localStorage.removeItem("anime-battle-nickname")
    if (pollRef.current) clearInterval(pollRef.current)
    router.push("/")
  }

  // ====== ERROR ======
  if (error) {
    return <Center mih="100vh"><Stack align="center" gap="md">
      <Text c="red" size="lg">{error}</Text>
      <Button variant="outline" color="gray" onClick={() => router.push("/")}>Voltar</Button>
    </Stack></Center>
  }

  // ====== JOIN ======
  if (!playerId) {
    return <Center mih="100vh" p="md"><Stack align="center" gap="lg" maw={400} w="100%">
      <Avatar size="xl" color="grape"><IconUsers size={32} /></Avatar>
      <Text fw={700} size="xl" c="white">Entrar na Sala</Text>
      <Text c="#888" size="sm" ta="center">Você foi convidado para uma partida de Deathmatch!</Text>
      <TextInput placeholder="Seu nickname" value={nickname} onChange={(e) => setNickname(e.currentTarget.value)}
        size="lg" radius="md" w="100%"
        styles={{ input: { backgroundColor: "#141414", border: "1px solid #2a2a2a", color: "white" } }} />
      {joinError && <Text c="red" size="sm">{joinError}</Text>}
      <Button fullWidth size="lg" radius="md" disabled={!nickname.trim() || joining} onClick={handleJoin}
        styles={{ root: { background: nickname.trim() && !joining ? "linear-gradient(135deg, #8b5cf6, #ec4899)" : undefined } }}>
        {joining ? "Entrando..." : "Entrar na Sala"}
      </Button>
    </Stack></Center>
  }

  if (!room) return <Center mih="100vh"><Loader color="grape" /></Center>

  const isHost = playerId === room.hostId
  const poolCount = room.pool.length
  const poolOk = poolCount >= 2 && poolCount % 2 === 0
  const poolAnimeIds = new Set(room.pool.map((a) => a.id))

  // ====== RESULTADO ======
  if (room.status === "finished" && room.champion) {
    return <Center mih="100vh" p="md"><Stack align="center" gap="lg">
      <Text fw={900} style={{ fontSize: 48, background: "linear-gradient(135deg, #8b5cf6, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>CAMPEÃO</Text>
      <Image src={room.champion.coverImage} alt={room.champion.title} w={320} h={400} fit="cover" radius="lg"
        fallbackSrc="https://via.placeholder.com/320x400?text=No+Image" />
      <Text fw={700} size="xl" c="white">{room.champion.title}</Text>
      <Button variant="outline" color="grape" size="lg" radius="md" onClick={handleLeave}>Voltar ao Início</Button>
    </Stack></Center>
  }

  // ====== VOTAÇÃO ======
  if (room.status === "voting") {
    const currentBattle = room.bracket[room.currentRound]?.find((b) => !b.winner) || room.bracket[room.currentRound]?.[0]
    const totalVotes = currentBattle ? (room.votes[currentBattle.id]?.length || 0) : 0
    const roundLabel = ["Rodada 1", "Rodada 2", "Semifinal", "Final"][room.currentRound] || "Final"

    const votingSidebarContent = (
      <Stack p="md" gap="sm" style={{ flex: 1 }}>
        <Text fw={700} size="sm" c="white">{room.name}</Text>
        <Badge size="sm" color="grape">{room.id}</Badge>
        <Text size="xs" c="#888" mt="sm">Jogadores</Text>
        <Stack gap={4}>
          {room.players.map((p) => (
            <Group key={p.id} gap={6} p={4} style={{ borderRadius: 6, backgroundColor: "#1a1a1a" }}>
              <Avatar size="sm" color={p.isHost ? "grape" : "blue"} radius="xl">{p.nickname[0].toUpperCase()}</Avatar>
              <Text size="sm" c="white">{p.nickname}</Text>
              {p.isHost && <Badge size="xs" color="grape" variant="light">Host</Badge>}
            </Group>
          ))}
        </Stack>
      </Stack>
    )

    return <Box style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar desktop */}
      <Paper
        visibleFrom="md"
        w={sidebarOpened ? 280 : 0}
        bg="#121212"
        style={{
          borderRight: sidebarOpened ? "1px solid #2a2a2a" : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.3s ease, border-color 0.3s ease",
        }}
      >
        <Box style={{ opacity: sidebarOpened ? 1 : 0, transition: "opacity 0.2s ease", flex: 1, minWidth: 280 }}>
          {votingSidebarContent}
        </Box>
      </Paper>

      {/* Sidebar mobile drawer */}
      <Drawer
        hiddenFrom="md"
        opened={sidebarOpened || false}
        onClose={closeSidebar}
        size="100%"
        position="left"
        styles={{
          content: { backgroundColor: "#121212" },
          header: { backgroundColor: "#121212" },
          title: { color: "white" },
        }}
      >
        {votingSidebarContent}
      </Drawer>

      {/* Conteúdo */}
      <Box style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }} p="md">
        <Group gap="xs" style={{ position: "absolute", top: 16, left: 16 }}>
          <ActionIcon variant="subtle" color="gray" hiddenFrom="md" onClick={toggleSidebar} aria-label="Abrir sidebar">
            <IconLayoutSidebar size={20} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="gray" visibleFrom="md" onClick={toggleSidebar} aria-label={sidebarOpened ? "Fechar sidebar" : "Abrir sidebar"}>
            {sidebarOpened ? <IconChevronLeft size={18} /> : <IconChevronRight size={18} />}
          </ActionIcon>
        </Group>
        <Stack gap="lg" align="center" style={{ maxWidth: 900, width: "100%" }}>
          <Group justify="space-between" w="100%">
            <Text fw={700} c="white" size="lg">{room.name}</Text>
            <Badge size="lg" variant="gradient" gradient={{ from: "grape", to: "pink" }}>{roundLabel}</Badge>
          </Group>
          <Group gap={8} justify="center" wrap="wrap">
            {room.players.map((p) => {
              const hv = currentBattle ? room.votes[currentBattle.id]?.some((v) => v.playerId === p.id) : false
              return <Box key={p.id} ta="center" style={{ opacity: hv ? 1 : 0.5 }}>
                <Avatar size="md" color={p.isHost ? "grape" : "blue"} radius="xl">{p.nickname[0].toUpperCase()}</Avatar>
                <Text size="xs" c={hv ? "grape" : "dimmed"}>{p.nickname}{hv && " ✓"}</Text>
              </Box>
            })}
          </Group>
          <Progress value={room.players.length > 0 ? (totalVotes / room.players.length) * 100 : 0} color="grape" size="sm" w="100%" maw={400} />
          <Text size="sm" c="#888">{totalVotes} de {room.players.length} votaram{votedAnime ? " — Aguardando..." : " — Clique no seu favorito!"}</Text>
          {currentBattle && <Group gap="md" className="sm:gap-12" justify="center" wrap="wrap">
            {[currentBattle.anime1, currentBattle.anime2].map((a) => (
              <Card key={a.id} shadow="md" padding={0} radius="md" style={{
                cursor: votedAnime ? "default" : "pointer",
                width: "clamp(140px, 35vw, 280px)",
                border: votedAnime === a.id ? "3px solid #8b5cf6" : "3px solid transparent",
                opacity: votedAnime && votedAnime !== a.id ? 0.4 : 1,
                transition: "all 0.3s",
              }} onClick={() => handleVote(a.id)}>
                <Image src={a.coverImage} alt={a.title} w="100%" h="clamp(175px, 45vw, 350px)" fit="cover"
                  fallbackSrc="https://via.placeholder.com/280x350?text=No+Image" />
                <Text fw={600} ta="center" p="xs" c="white" truncate>{a.title}</Text>
              </Card>
            ))}
          </Group>}
        </Stack>
      </Box>
    </Box>
  }

  // ====== LOBBY / SELEÇÃO ======
  const animes = result?.animes || []
  const pageInfo = result?.pageInfo

  const lobbySidebarContent = (
    <Stack p="md" gap="sm" style={{ flex: 1, overflow: "hidden" }}>
      <Group justify="space-between">
        <Text fw={700} size="sm" c="white">{room.name}</Text>
        <Button size="xs" variant="subtle" color="gray" onClick={handleLeave}>
          <IconArrowLeft size={16} />
        </Button>
      </Group>
      <Group gap={4}>
        <Badge size="sm" color="grape">{room.id}</Badge>
        <Button size="xs" variant="subtle" color="gray" leftSection={<IconCopy size={12} />}
          onClick={handleCopyLink}>{copied ? "OK" : "Link"}</Button>
      </Group>

      <Text size="xs" c="#888" mt="sm">Jogadores ({room.players.length})</Text>
      <Stack gap={4}>
        {room.players.map((p) => (
          <Group key={p.id} gap={6} p={4} style={{ borderRadius: 6, backgroundColor: "#1a1a1a" }}>
            <Avatar size="sm" color={p.isHost ? "grape" : "blue"} radius="xl">{p.nickname[0].toUpperCase()}</Avatar>
            <Text size="sm" c="white">{p.nickname}</Text>
            {p.isHost && <Badge size="xs" color="grape" variant="light">Host</Badge>}
          </Group>
        ))}
      </Stack>
    </Stack>
  )

  return (
    <Box style={{ display: "flex", height: "100vh" }}>
      {/* Sidebar desktop */}
      <Paper
        visibleFrom="md"
        w={sidebarOpened ? 300 : 0}
        bg="#121212"
        style={{
          borderRight: sidebarOpened ? "1px solid #2a2a2a" : "none",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.3s ease, border-color 0.3s ease",
        }}
      >
        <Box style={{ opacity: sidebarOpened ? 1 : 0, transition: "opacity 0.2s ease", flex: 1, minWidth: 300 }}>
          {lobbySidebarContent}
        </Box>
      </Paper>

      {/* Sidebar mobile drawer */}
      <Drawer
        hiddenFrom="md"
        opened={sidebarOpened || false}
        onClose={closeSidebar}
        size="100%"
        position="left"
        styles={{
          content: { backgroundColor: "#121212" },
          header: { backgroundColor: "#121212" },
          title: { color: "white" },
        }}
      >
        {lobbySidebarContent}
      </Drawer>

      {/* CONTEÚDO PRINCIPAL */}
      <Box style={{ flex: 1, overflow: "auto" }} p="md">
        <Stack gap="md" style={{ maxWidth: 1100, margin: "0 auto" }}>
          {/* Toggle sidebar button */}
          <Group gap="xs">
            <ActionIcon variant="subtle" color="gray" hiddenFrom="md" onClick={toggleSidebar} aria-label="Abrir sidebar">
              <IconLayoutSidebar size={20} />
            </ActionIcon>
            <ActionIcon variant="subtle" color="gray" visibleFrom="md" onClick={toggleSidebar} aria-label={sidebarOpened ? "Fechar sidebar" : "Abrir sidebar"}>
              {sidebarOpened ? <IconChevronLeft size={18} /> : <IconChevronRight size={18} />}
            </ActionIcon>
          </Group>

          {/* Pool */}
          <Group justify="space-between">
            <Text fw={600} c="white">Pool ({poolCount}/{MAX_POOL})</Text>
            <Group gap={4}>
              <Text size="xs" c="dimmed">Total: {poolCount} animes</Text>
              {poolCount >= 2 && <Badge size="sm" color={poolOk ? "green" : "yellow"} variant="light">
                {poolOk ? "OK" : "Par needed"}
              </Badge>}
            </Group>
          </Group>

          <Box
            style={{
              overflowX: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#2a2a2a transparent",
            }}
          >
            <Group gap="sm" wrap="nowrap" style={{ minHeight: 170, paddingBottom: 4 }}>
              {room.pool.length === 0 ? (
                <div
                  style={{
                    minWidth: "100%",
                    minHeight: 160,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    border: "1px dashed rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Text c="rgba(255,255,255,0.35)" size="sm">
                    Nenhum anime ainda. Busque abaixo e clique para adicionar!
                  </Text>
                </div>
              ) : room.pool.map((a, idx) => (
                <div
                  key={a.id}
                  className="group relative overflow-hidden rounded-xl flex-shrink-0 transition-all duration-300 hover:scale-105"
                  style={{
                    width: 120,
                    aspectRatio: "2/3",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                  }}
                >
                  {/* Cover background */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${a.coverImage})` }}
                  />

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.85))" }}
                  />

                  {/* Index badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      left: 6,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "rgba(139, 92, 246, 0.8)",
                      backdropFilter: "blur(4px)",
                      WebkitBackdropFilter: "blur(4px)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    <Text size="xs" fw={700} c="white" style={{ fontSize: 11 }}>{idx + 1}</Text>
                  </div>

                  {/* Remove button */}
                  <ActionIcon
                    variant="filled"
                    color="red"
                    size="xs"
                    radius="xl"
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "rgba(0,0,0,0.5)",
                      backdropFilter: "blur(4px)",
                      WebkitBackdropFilter: "blur(4px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                    onClick={() => handleRemoveAnime(a.id)}
                    aria-label={`Remover ${a.title}`}
                  >
                    <IconX size={12} />
                  </ActionIcon>

                  {/* Info overlay at bottom */}
                  <div
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                      padding: "6px 8px",
                      background: "rgba(0,0,0,0.4)",
                      backdropFilter: "blur(8px)",
                      WebkitBackdropFilter: "blur(8px)",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <Text
                      size="xs"
                      fw={600}
                      c="white"
                      truncate
                      style={{ textShadow: "0 1px 4px rgba(0,0,0,0.5)", fontSize: 11 }}
                    >
                      {a.title}
                    </Text>
                    <Text
                      size="xs"
                      c="rgba(255,255,255,0.5)"
                      truncate
                      style={{ fontSize: 10, marginTop: 1 }}
                    >
                      +{a.addedByName}
                    </Text>
                  </div>
                </div>
              ))}
            </Group>
          </Box>

          {/* Busca estilo solo */}
          <TextInput
            placeholder="Buscar anime por nome..."
            leftSection={<IconSearch size={20} />}
            value={query}
            onChange={(e) => handleSearch(e.currentTarget.value)}
            size="lg" radius="md"
            styles={{ input: { backgroundColor: "#141414", border: "1px solid #2a2a2a", color: "white" } }}
          />

          <GenreTags selected={selectedGenres} onSelect={handleGenresChange} />

          {searchLoading && <Center py="xl"><Loader color="grape" /></Center>}
          {searchError && <Text c="red" ta="center" py="md">{searchError}</Text>}
          {!searchLoading && animes.length === 0 && !searchError && (
            <Text c="dimmed" ta="center" py="xl">Nenhum anime encontrado.</Text>
          )}

          {animes.length > 0 && !searchLoading && (
            <>
              <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="sm">
                {animes.map((anime) => {
                  const inPool = poolAnimeIds.has(anime.id)
                  const canAdd = !inPool && poolCount < MAX_POOL
                  return (
                    <Card key={anime.id} p={4} radius="md" bg="#1a1a1a"
                      style={{
                        cursor: canAdd ? "pointer" : "default",
                        border: inPool ? "2px solid #8b5cf6" : "2px solid transparent",
                        opacity: inPool ? 0.6 : 1,
                        transition: "transform 0.2s",
                      }}
                      className={canAdd ? "hover:scale-105" : ""}
                      onClick={() => canAdd && handleAddAnime(anime)}
                    >
                      <Card.Section>
                        <Image src={anime.coverImage} alt={anime.title} w="100%" h={180} fit="cover"
                          fallbackSrc="https://via.placeholder.com/160x180?text=No+Image" />
                      </Card.Section>
                      <Text fw={600} size="sm" ta="center" lineClamp={2} mt={4} c="white">{anime.title}</Text>
                      {inPool && <Text size="xs" ta="center" c="grape">✓ Adicionado</Text>}
                    </Card>
                  )
                })}
              </SimpleGrid>

              {pageInfo && pageInfo.lastPage > 1 && (
                <Group justify="center" mt="md">
                  <Button variant="outline" color="gray" size="sm"
                    disabled={page <= 1}
                    onClick={() => goToPage(page - 1)}
                    leftSection={<IconChevronLeft size={16} />}>
                    Anterior
                  </Button>
                  <Text size="sm" c="dimmed" px="md">
                    Página {pageInfo.currentPage} de {pageInfo.lastPage} — {pageInfo.total} resultados
                  </Text>
                  <Button variant="outline" color="gray" size="sm"
                    disabled={page >= pageInfo.lastPage}
                    onClick={() => goToPage(page + 1)}
                    rightSection={<IconChevronRight size={16} />}>
                    Próxima
                  </Button>
                </Group>
              )}
            </>
          )}

          {/* Botão iniciar */}
          {isHost ? (
            <Button size="lg" radius="md" fullWidth
              disabled={!poolOk || room.players.length < 2}
              onClick={handleStart}
              styles={{ root: { background: poolOk && room.players.length >= 2 ? "linear-gradient(135deg, #8b5cf6, #ec4899)" : undefined } }}>
              {room.players.length < 2 ? "Aguardando jogadores..."
                : !poolOk ? `Pool inválida (${poolCount} animes, precisa ser par)`
                : "Iniciar Torneio!"}
            </Button>
          ) : (
            <Text c="dimmed" size="sm" ta="center" py="md">
              Adicione animes na pool! O host inicia quando todos estiverem prontos.
            </Text>
          )}
        </Stack>
      </Box>
    </Box>
  )
}
