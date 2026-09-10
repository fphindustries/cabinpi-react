import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import { MantineProvider, AppShell, Group, Title, Burger, NavLink, Container, Avatar, Text, Menu, Loader, Center, UnstyledButton } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { IconHome, IconChartLine, IconPhoto, IconUser, IconChartBar } from '@tabler/icons-react';
import { lazy, Suspense } from 'react';
import Home from './pages/Home';
import { CabinPiLogo } from './components/CabinPiLogo';
import { useApi } from './hooks/useApi';
import type { UserResponse } from './types/api';
import { ErrorBoundary } from './components/ErrorBoundary';

const Charts = lazy(() => import('./pages/Charts'));
const Photos = lazy(() => import('./pages/Photos'));
const Analysis = lazy(() => import('./pages/Analysis'));

function Navigation() {
  const location = useLocation();
  const [opened, { toggle, close }] = useDisclosure();
  const { data } = useApi<UserResponse>('/api/user');
  const user = data?.user;

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
            <Burger aria-label="Toggle navigation" opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <CabinPiLogo size={28} />
            <Title order={2}>CabinPi</Title>
          </Group>
          {user && (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton aria-label="Your account"><Group gap="xs">
                  <Avatar color="blue" radius="xl" size="sm">
                    <IconUser size={18} />
                  </Avatar>
                  <Text size="sm" fw={500} visibleFrom="sm">{user.name}</Text>
                </Group></UnstyledButton>
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
          <ErrorBoundary key={location.pathname}>
            <Suspense fallback={<Center p="xl"><Loader aria-label="Loading page" /></Center>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/charts" element={<Charts />} />
                <Route path="/analysis" element={<Analysis />} />
                <Route path="/photos" element={<Photos />} />
                <Route path="*" element={<Text>Page not found. <Link to="/">Return to dashboard</Link></Text>} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
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
