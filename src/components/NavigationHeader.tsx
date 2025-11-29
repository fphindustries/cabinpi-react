import { Group, Tabs } from '@mantine/core'
import { IconHome, IconChartLine, IconPhoto } from '@tabler/icons-react'
import { Link, useRouterState } from '@tanstack/react-router'

export function NavigationHeader() {
  const router = useRouterState()
  const pathname = router.location.pathname

  const activeTab = pathname === '/charts' ? 'charts'
    : pathname === '/photos' ? 'photos'
    : 'home'

  return (
    <Group justify="center" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
      <Tabs value={activeTab} variant="outline">
        <Tabs.List>
          <Tabs.Tab
            value="home"
            leftSection={<IconHome size={16} />}
            component={Link}
            to="/"
          >
            Dashboard
          </Tabs.Tab>
          <Tabs.Tab
            value="charts"
            leftSection={<IconChartLine size={16} />}
            component={Link}
            to="/charts"
          >
            Charts
          </Tabs.Tab>
          <Tabs.Tab
            value="photos"
            leftSection={<IconPhoto size={16} />}
            component={Link}
            to="/photos"
          >
            Photos
          </Tabs.Tab>
        </Tabs.List>
      </Tabs>
    </Group>
  )
}
