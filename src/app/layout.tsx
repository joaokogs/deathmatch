import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ColorSchemeScript } from "@mantine/core"
import "./globals.css"
import { MantineSetup } from "./mantine-setup"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Deathmatch",
  description: "Crie seu torneio de animes e descubra quem é o campeão!",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <ColorSchemeScript defaultColorScheme="dark" />
        <meta name="viewport" content="initial-scale=1, width=device-width" />
      </head>
      <body>
        <MantineSetup>{children}</MantineSetup>
      </body>
    </html>
  )
}
