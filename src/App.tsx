import { Outlet } from 'react-router-dom'
import { AppShell, useMantineColorScheme, ActionIcon, Group } from '@mantine/core'
import { IconSun, IconMoon } from '@tabler/icons-react'
import './App.css'

function ColorSchemeToggle() {
  const { colorScheme, setColorScheme } = useMantineColorScheme()

  return (
    <ActionIcon
      onClick={() => setColorScheme(colorScheme === 'dark' ? 'light' : 'dark')}
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
    >
      {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
    </ActionIcon>
  )
}

function App() {
  return (
    <AppShell
      header={{ height: 60 }}
      padding={0}
    >
      <AppShell.Header>
        <Group h="100%" px="xl" justify="flex-end">
          <ColorSchemeToggle />
        </Group>
      </AppShell.Header>
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  )
}

export default App
