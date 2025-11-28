import { Group, Text, Tabs, Image } from '@mantine/core';
import { IconHome, IconChartLine, IconPhoto } from '@tabler/icons-react';
import { useLocation, Link } from 'react-router';

export function NavigationHeader() {
  const location = useLocation();

  // Determine active tab based on current path
  const activeTab = location.pathname === '/charts' ? 'charts'
    : location.pathname === '/photos' ? 'photos'
    : 'home';

  return (
    <Group justify="space-between" p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
      <Group gap="md">
        <Image src="/favicon.svg" alt="CabinPi Logo" w={32} h={32} fit="contain" />
        <Text size="xl" fw={700}>CabinPi</Text>
      </Group>

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
  );
}
