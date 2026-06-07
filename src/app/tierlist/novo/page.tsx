"use client"

import { Center, Container, Stack, Tabs, Text } from "@mantine/core"
import { IconDice, IconList, IconSearch } from "@tabler/icons-react"
import { TierlistRandomTab } from "@/src/components/tierlist/TierlistRandomTab"
import { TierlistManualTab } from "@/src/components/tierlist/TierlistManualTab"
import { TAB_STYLES } from "@/src/lib/tab-styles"

export default function NovoTierlistPage() {
  return (
    <Center mih="100dvh" px="sm">
      <Container size="sm" py="xl">
        <Stack gap="lg" align="center">
          <IconList size={48} color="#8b5cf6" style={{ width: "clamp(32px, 12vw, 48px)", height: "clamp(32px, 12vw, 48px)" }} />
          <Text
            fw={900}
            ta="center"
            style={{
              fontSize: "clamp(22px, 8vw, 32px)",
              background: "linear-gradient(135deg, #8b5cf6, #ec4899)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Tierlist
          </Text>

          <Tabs defaultValue="random" variant="pills" w="100%">
            <Tabs.List justify="center" mb="lg" style={{ gap: "8px" }}>
              <Tabs.Tab
                value="random"
                leftSection={<IconDice size={18} />}
                styles={TAB_STYLES}
              >
                Aleatório
              </Tabs.Tab>
              <Tabs.Tab
                value="manual"
                leftSection={<IconSearch size={18} />}
                styles={TAB_STYLES}
              >
                Manual
              </Tabs.Tab>
            </Tabs.List>

            <Tabs.Panel value="random">
              <TierlistRandomTab />
            </Tabs.Panel>

            <Tabs.Panel value="manual">
              <TierlistManualTab />
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Container>
    </Center>
  )
}
