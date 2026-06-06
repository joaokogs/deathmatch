"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Box, Group, Text, ActionIcon, Drawer, Stack, Button, Center, Loader,
} from "@mantine/core"
import { useDisclosure } from "@mantine/hooks"
import { IconSettings, IconArrowLeft, IconClick, IconGripVertical } from "@tabler/icons-react"
import { TierBoard } from "@/src/components/TierBoard"
import { useTierlistStore, type InteractionMode } from "@/src/store/tierlist"

export default function TierlistPage() {
  const params = useParams()
  const router = useRouter()
  const store = useTierlistStore()
  const [configOpen, { open: openConfig, close: closeConfig }] = useDisclosure(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Se não tem animes carregados, redireciona
  useEffect(() => {
    if (mounted && store.animes.length === 0) {
      router.push("/tierlist/novo")
    }
  }, [mounted, store.animes.length, router])

  if (!mounted || store.animes.length === 0) {
    return (
      <Center mih="100vh">
        <Loader color="grape" />
      </Center>
    )
  }

  return (
    <Box style={{ display: "flex", height: "100vh", background: "#0d0d0d" }}>
      {/* Sidebar de configuração (desktop) */}
      <Drawer
        opened={configOpen}
        onClose={closeConfig}
        title="Configurações"
        size={280}
        position="right"
        styles={{
          content: { backgroundColor: "#141414", border: "1px solid #2a2a2a" },
          header: { backgroundColor: "#141414" },
          title: { color: "white", fontWeight: 700 },
        }}
      >
        <Stack gap="md" p="sm">
          <Text size="sm" c="#888">Modo de Interação</Text>

          <Button
            variant={store.interactionMode === "click" ? "filled" : "outline"}
            color="grape"
            radius="md"
            fullWidth
            leftSection={<IconClick size={18} />}
            onClick={() => store.setMode("click")}
          >
            Click
          </Button>

          <Button
            variant={store.interactionMode === "drag" ? "filled" : "outline"}
            color="grape"
            radius="md"
            fullWidth
            leftSection={<IconGripVertical size={18} />}
            onClick={() => store.setMode("drag")}
          >
            Arrastar
          </Button>

          <Text size="xs" c="dimmed" mt="sm">
            <strong>Click:</strong> Clique no anime para selecionar, depois clique no tier para colocá-lo.
          </Text>
          <Text size="xs" c="dimmed">
            <strong>Arrastar:</strong> Arraste o card do anime diretamente para o tier desejado.
          </Text>
        </Stack>
      </Drawer>

      {/* Conteúdo principal */}
      <Box style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Header */}
        <Group p="sm" style={{ borderBottom: "1px solid #2a2a2a" }} justify="space-between">
          <Button variant="subtle" color="gray" size="sm" onClick={() => router.push("/")} leftSection={<IconArrowLeft size={16} />}>
            Voltar
          </Button>
          <ActionIcon variant="subtle" color="gray" onClick={openConfig} aria-label="Configurações">
            <IconSettings size={20} />
          </ActionIcon>
        </Group>

        {/* Tier Board */}
        <TierBoard />
      </Box>
    </Box>
  )
}
