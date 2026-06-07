"use client"

import { useRouter } from "next/navigation"
import {
  Stack, Text, Button, Center, Title, Divider, Group, Box,
} from "@mantine/core"
import { IconSwords, IconUsers, IconList, IconTrophy } from "@tabler/icons-react"

export default function HomePage() {
  const router = useRouter()

  return (
    <Center mih="100dvh" px="sm">
      <Stack align="center" gap="lg" maw={500} w="100%">
        <IconSwords size={64} color="#8b5cf6" style={{ width: "clamp(40px, 15vw, 64px)", height: "clamp(40px, 15vw, 64px)" }} />

        <Title
          order={1}
          ta="center"
          style={{
            fontSize: "clamp(28px, 10vw, 48px)",
            background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Deathmatch
        </Title>

        <Text size="lg" c="#888" ta="center">
          Escolha um modo de jogo!
        </Text>

        <Divider w="100%" label="Modo Solo" labelPosition="center" c="#555" />

        <Group gap="md" w="100%">
          <Button
            size="lg"
            radius="md"
            fullWidth
            onClick={() => router.push("/torneio/novo")}
            leftSection={<IconSwords size={20} />}
            styles={{
              root: {
                background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              },
            }}
          >
            Mata-Mata
          </Button>
          <Button
            size="lg"
            radius="md"
            fullWidth
            variant="outline"
            color="grape"
            onClick={() => router.push("/tierlist/novo")}
            leftSection={<IconList size={20} />}
          >
            Tierlist
          </Button>
        </Group>

        <Divider w="100%" label="Multiplayer" labelPosition="center" c="#555" />

        <Group gap="md" w="100%">
          <Button
            size="lg"
            radius="md"
            fullWidth
            variant="outline"
            color="grape"
            onClick={() => router.push("/sala/criar")}
            leftSection={<IconUsers size={20} />}
          >
            Mata-Mata
          </Button>
          <Button
            size="lg"
            radius="md"
            fullWidth
            variant="outline"
            color="grape"
            onClick={() => router.push("/sala/criar")}
            leftSection={<IconList size={20} />}
          >
            Tierlist
          </Button>
        </Group>

      </Stack>
    </Center>
  )
}
