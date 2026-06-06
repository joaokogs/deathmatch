"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect } from "react"
import {
  Container,
  Text,
  Group,
  Box,
  Center,
  Loader,
  Drawer,
  ActionIcon,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconLayoutSidebar } from "@tabler/icons-react"
import { BracketView } from "@/src/components/BracketView"
import { BattleArena } from "@/src/components/BattleArena"
import { useTournamentStore } from "@/src/store/tournament"
import type { Anime } from "@/src/lib/types"

export default function BattlePage() {
  const params = useParams()
  const router = useRouter()
  const tournament = useTournamentStore((s) => s.tournament)
  const vote = useTournamentStore((s) => s.vote)
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false)

  useEffect(() => {
    if (!tournament) {
      router.push("/")
    }
  }, [tournament, router])

  useEffect(() => {
    if (tournament?.isFinished) {
      router.push(`/torneio/${params.id}/resultado`)
    }
  }, [tournament?.isFinished, params.id, router])

  if (!tournament) {
    return (
      <Center mih="100vh">
        <Loader color="grape" />
      </Center>
    )
  }

  const currentRoundBattles = tournament.bracket[tournament.currentRound]
  const nextBattle = currentRoundBattles.find((b) => !b.winner)

  if (!nextBattle) {
    return (
      <Center mih="100vh">
        <Loader color="grape" />
      </Center>
    )
  }

  const handleVote = (winner: Anime) => {
    vote(nextBattle.id, winner)
  }

  const totalMatchesInRound = currentRoundBattles.length

  const bracketContent = (
    <BracketView
      bracket={tournament.bracket}
      currentRound={tournament.currentRound}
    />
  )

  return (
    <Container fluid mih="100vh" p={0}>
      <Group align="stretch" gap={0} mih="100vh">
          <Box
            w={280}
            visibleFrom="md"
            style={{
              borderRight: "1px solid #2a2a2a",
              overflowY: "auto",
            }}
          >
            {bracketContent}
          </Box>

        <Box style={{ flex: 1 }}>
          <Group justify="space-between" p="md" className="max-sm:!p-2" style={{ borderBottom: "1px solid #2a2a2a" }}>
            <Group gap="sm">
                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={openDrawer}
                  hiddenFrom="md"
                  aria-label="Abrir chaveamento"
                >
                  <IconLayoutSidebar size={20} />
                </ActionIcon>
              <Text fw={700} c="white">
                {tournament.name}
              </Text>
            </Group>
          </Group>

          <BattleArena
            battle={nextBattle}
            round={tournament.currentRound}
            totalMatchesInRound={totalMatchesInRound}
            onVote={handleVote}
          />
        </Box>
      </Group>

      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title="Chaveamento"
        size={280}
        styles={{
          content: {
            backgroundColor: "#141414",
          },
          header: {
            backgroundColor: "#141414",
          },
          title: {
            color: "white",
          },
        }}
      >
        {bracketContent}
      </Drawer>
    </Container>
  )
}
