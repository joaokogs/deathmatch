"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Stack, Text, TextInput, Button, Center, Title, Divider } from "@mantine/core"
import { IconSwords, IconUsers } from "@tabler/icons-react"

export default function HomePage() {
  const [name, setName] = useState("")
  const router = useRouter()

  const handleSolo = () => {
    if (!name.trim()) return
    router.push(`/torneio/novo?name=${encodeURIComponent(name.trim())}`)
  }

  const handleMultiplayer = () => {
    router.push("/sala/criar")
  }

  return (
    <Center mih="100vh" p="md">
      <Stack align="center" gap="lg" maw={500} w="100%">
        <IconSwords size={64} color="#8b5cf6" />

        <Title
          order={1}
          style={{
            fontSize: 48,
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Anime Battle
        </Title>

        <Text size="lg" c="#888" ta="center">
          Crie seu torneio de animes e descubra quem é o campeão!
        </Text>

        <Divider w="100%" label="Modo Solo" labelPosition="center" c="#555" />

        <TextInput
          placeholder="Nome da Disputa"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          size="lg"
          radius="md"
          w="100%"
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSolo()
          }}
          styles={{
            input: {
              backgroundColor: "#141414",
              border: "1px solid #2a2a2a",
              color: "white",
              textAlign: "center",
            },
          }}
        />

        <Button
          size="lg"
          radius="md"
          fullWidth
          disabled={!name.trim()}
          onClick={handleSolo}
          leftSection={<IconSwords size={20} />}
          styles={{
            root: {
              background: name.trim()
                ? "linear-gradient(135deg, #8b5cf6, #ec4899)"
                : undefined,
            },
          }}
        >
          Jogar Sozinho
        </Button>

        <Divider w="100%" label="Multiplayer" labelPosition="center" c="#555" />

        <Button
          size="lg"
          radius="md"
          fullWidth
          variant="outline"
          color="grape"
          onClick={handleMultiplayer}
          leftSection={<IconUsers size={20} />}
        >
          Criar Sala Multiplayer
        </Button>
      </Stack>
    </Center>
  )
}
