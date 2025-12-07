import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider, AppShell, Group, Title, Burger, NavLink, Container, Avatar, Text, Menu } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { IconHome, IconChartLine, IconPhoto, IconUser, IconChartBar } from '@tabler/icons-react';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import Charts from './pages/Charts';
import Photos from './pages/Photos';
import Analysis from './pages/Analysis';
import { CabinPiLogo } from './components/CabinPiLogo';
import { getCurrentUser } from './lib/api';
import type { User } from './types/api';

function Navigation() {
  const location = useLocation();
  const [opened, { toggle, close }] = useDisclosure();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await getCurrentUser();
        if (response.authenticated && response.user) {
          setUser(response.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      }
    }
    fetchUser();
  }, []);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: 'sm',
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <CabinPiLogo size={28} />
            <Title order={2}>CabinPi</Title>
          </Group>
          {user && (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <Group gap="xs" style={{ cursor: 'pointer' }}>
                  <Avatar color="blue" radius="xl" size="sm">
                    <IconUser size={18} />
                  </Avatar>
                  <Text size="sm" fw={500} visibleFrom="sm">{user.name}</Text>
                </Group>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>Account</Menu.Label>
                <Menu.Item disabled>
                  <Text size="xs" c="dimmed">{user.email}</Text>
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <NavLink
          component={Link}
          to="/"
          label="Dashboard"
          leftSection={<IconHome size={20} />}
          active={location.pathname === '/'}
          onClick={close}
        />
        <NavLink
          component={Link}
          to="/charts"
          label="Charts"
          leftSection={<IconChartLine size={20} />}
          active={location.pathname === '/charts'}
          onClick={close}
        />
        <NavLink
          component={Link}
          to="/analysis"
          label="Analysis"
          leftSection={<IconChartBar size={20} />}
          active={location.pathname === '/analysis'}
          onClick={close}
        />
        <NavLink
          component={Link}
          to="/photos"
          label="Photos"
          leftSection={<IconPhoto size={20} />}
          active={location.pathname === '/photos'}
          onClick={close}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        <Container fluid>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/photos" element={<Photos />} />
          </Routes>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

export default function App() {
  return (
    <MantineProvider defaultColorScheme="light">
      <BrowserRouter>
        <Navigation />
      </BrowserRouter>
    </MantineProvider>
  );
}
