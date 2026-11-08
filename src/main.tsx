import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App, {
  preloadRoute,
  routerReady,
  resetNavState,
  rootOptions,
  reportBiniError,
} from 'virtual:bini-app'


class LastResortBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      if (import.meta.env.DEV) return null
      return React.createElement(
        'div',
        {
          style: {
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            textAlign: 'center',
          },
        },
        React.createElement(
          'h1',
          { style: { fontSize: '1.5rem', marginBottom: '1rem' } },
          'Something went wrong'
        ),
        React.createElement(
          'pre',
          {
            style: {
              fontSize: '0.75rem',
              maxWidth: '40rem',
              overflow: 'auto',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '0.5rem',
              background: '#f9f9f9',
              textAlign: 'left',
            },
          },
          String(this.state.error.message || this.state.error)
        ),
        React.createElement(
          'button',
          {
            type: 'button',
            onClick: () => this.setState({ error: null }),
            style: {
              marginTop: '1rem',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              background: '#06b6d4',
              color: 'white',
              cursor: 'pointer',
            },
          },
          'Try again'
        )
      )
    }
    return this.props.children
  }
}

function Root({ children }: { children: React.ReactNode }) {
  return <LastResortBoundary>{children}</LastResortBoundary>
}

if (typeof window !== 'undefined') {
  const ssrFallbackRoot = document.querySelector('[data-bini-ssr-fallback]')
  const rootElement = ssrFallbackRoot ? null : document.getElementById('root')

  if (rootElement) {
    const isShell = (window as unknown as { __BINI_SHELL__?: boolean }).__BINI_SHELL__ === true
    const bootShell = rootElement.querySelector('[data-bini-boot]') !== null
    const tree = (
      <Root>
        <App />
      </Root>
    )

    if (typeof resetNavState === 'function') resetNavState()

    const ready = Promise.race([
      preloadRoute(location.pathname).then(() => routerReady()),
      new Promise<void>((resolve) => setTimeout(resolve, 10_000)),
    ]).catch((err: unknown) => {
      reportBiniError(err, '', 'uncaught')
    })

    void ready.then(() => {
      try {
        if (isShell || bootShell || !rootElement.hasChildNodes()) {
          createRoot(rootElement, rootOptions).render(tree)
        } else {
          hydrateRoot(rootElement, tree, rootOptions)
        }
      } catch (err) {
        reportBiniError(err, '', 'uncaught')
      }
    })
  }
}

export { App }