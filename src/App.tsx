import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import { MantineProvider, AppShell, Group, Title, Burger, NavLink, Container } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { IconHome, IconChartLine, IconPhoto } from '@tabler/icons-react';
import Home from './pages/Home';
import Charts from './pages/Charts';
import Photos from './pages/Photos';
import { CabinPiLogo } from './components/CabinPiLogo';

function Navigation() {
  const location = useLocation();
  const [opened, { toggle, close }] = useDisclosure();

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
