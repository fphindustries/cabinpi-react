import { HeadContent, Scripts, createRootRoute, Link } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { MantineProvider, Container, Stack, Title, Text, Button } from '@mantine/core'
import { IconHome } from '@tabler/icons-react'
import { NavigationHeader } from '../components/NavigationHeader'

import mantineCoreCss from '@mantine/core/styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'CabinPi Dashboard',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: mantineCoreCss,
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <Container fluid px="xl" py="xl" maw={1920}>
      <Stack align="center" justify="center" gap="xl" style={{ minHeight: '60vh' }}>
        <Title order={1}>404 - Page Not Found</Title>
        <Text size="lg" c="dimmed">
          The page you're looking for doesn't exist.
        </Text>
        <Button
          component={Link}
          to="/"
          leftSection={<IconHome size={16} />}
          size="lg"
        >
          Go to Dashboard
        </Button>
      </Stack>
    </Container>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <MantineProvider defaultColorScheme="light">
          <NavigationHeader />
          {children}
          <TanStackDevtools
            config={{
              position: 'bottom-right',
            }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        </MantineProvider>
        <Scripts />
      </body>
    </html>
  )
}
