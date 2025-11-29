import { Burger, Container, Group, Drawer, Stack, ActionIcon } from '@mantine/core'
import { Link, useRouterState } from '@tanstack/react-router'
import { IconRefresh } from '@tabler/icons-react'
import classes from './NavigationHeader.module.css'
import { useDisclosure } from '@mantine/hooks'
import { CabinPiLogo } from './CabinPiLogo'

const links = [
  { link: '/', label: 'Home' },
  { link: '/charts', label: 'Charts' },
  { link: '/photos', label: 'Photos' },
]

export function NavigationHeader() {
  const router = useRouterState()
  const pathname = router.location.pathname
  const [opened, { toggle, close }] = useDisclosure(false)

  const items = links.map((linkItem) => (
    <Link
      key={linkItem.label}
      to={linkItem.link}
      className={classes.link}
      data-active={pathname === linkItem.link || undefined}
    >
      {linkItem.label}
    </Link>
  ))

  return (
    <header className={classes.header}>
      <Container size="md" className={classes.inner}>
        <CabinPiLogo size={28} />
        <Group gap={5} visibleFrom="xs">
          {items}
        </Group>

        <Group gap="xs">
          <ActionIcon
            onClick={() => window.location.reload()}
            variant="subtle"
            color="gray"
            size="lg"
            aria-label="Refresh"
          >
            <IconRefresh size={18} />
          </ActionIcon>
          <Burger opened={opened} onClick={toggle} hiddenFrom="xs" size="sm" />
        </Group>
      </Container>

      <Drawer
        opened={opened}
        onClose={close}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="xs"
        zIndex={1000000}
      >
        <Stack gap="md" onClick={close}>
          {items}
        </Stack>
      </Drawer>
    </header>
  )
}
