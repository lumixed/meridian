import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CommandPalette from './CommandPalette'
import { DEFAULT_LAYERS, type LayerState } from '@/types/layers'

const RESULTS = [
  { id: 'BR', name: '🇧🇷 Brazil', subtitle: 'Latin America', lat: -15.8, lng: -47.9, type: 'country', countryCode: 'BR' },
  { id: 'cap:CG', name: '🇨🇬 Brazzaville', subtitle: 'Capital · Congo', lat: -4.3, lng: 15.3, type: 'capital', countryCode: 'CG' },
]

function mockSearch(results: unknown[] = RESULTS) {
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ results }) }) as unknown as Response))
}

function setup(overrides: Partial<React.ComponentProps<typeof CommandPalette>> = {}) {
  const props = {
    open: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    layers: DEFAULT_LAYERS as LayerState,
    onToggleLayer: vi.fn(),
    onStartDemo: vi.fn(),
    ...overrides,
  }
  render(<CommandPalette {...props} />)
  return props
}

beforeEach(() => {
  vi.unstubAllGlobals()
  mockSearch()
})

describe('CommandPalette', () => {
  it('renders nothing while closed', () => {
    setup({ open: false })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens as a labelled modal dialog', () => {
    setup()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAccessibleName('Command palette')
  })

  it('lists every layer as a command before any query', () => {
    setup()
    expect(screen.getByText('Show Economic Heatmap')).toBeInTheDocument()
    expect(screen.getByText('Show Trade Routes')).toBeInTheDocument()
    expect(screen.getByText('Start demo tour')).toBeInTheDocument()
  })

  it('reflects the current layer state in the command label', () => {
    setup({ layers: { ...DEFAULT_LAYERS, heatmap: true } })
    expect(screen.getByText('Hide Economic Heatmap')).toBeInTheDocument()
  })

  it('filters commands by the typed query', async () => {
    mockSearch([])
    setup()

    await userEvent.type(screen.getByRole('textbox'), 'trade')

    await waitFor(() => expect(screen.getByText('Show Trade Routes')).toBeInTheDocument())
    expect(screen.queryByText('Show Economic Heatmap')).not.toBeInTheDocument()
  })

  it('searches the api and shows matching places', async () => {
    setup()
    await userEvent.type(screen.getByRole('textbox'), 'braz')

    expect(await screen.findByText('🇧🇷 Brazil')).toBeInTheDocument()
    expect(screen.getByText('🇨🇬 Brazzaville')).toBeInTheDocument()
  })

  it('selects a place with the mouse and closes', async () => {
    const props = setup()
    await userEvent.type(screen.getByRole('textbox'), 'braz')
    await userEvent.click(await screen.findByText('🇧🇷 Brazil'))

    expect(props.onSelect).toHaveBeenCalledWith(-15.8, -47.9, expect.objectContaining({
      id: 'BR',
      type: 'country',
      name: 'Brazil',
      countryCode: 'BR',
    }))
    expect(props.onClose).toHaveBeenCalled()
  })

  it('treats a capital as its country', async () => {
    const props = setup()
    await userEvent.type(screen.getByRole('textbox'), 'braz')
    await userEvent.click(await screen.findByText('🇨🇬 Brazzaville'))

    expect(props.onSelect).toHaveBeenCalledWith(-4.3, 15.3, expect.objectContaining({
      id: 'CG',
      type: 'country',
      name: 'Brazzaville',
    }))
  })

  it('runs the highlighted row on Enter', async () => {
    const props = setup()
    await userEvent.type(screen.getByRole('textbox'), 'braz')
    await screen.findByText('🇧🇷 Brazil')

    await userEvent.keyboard('{Enter}')
    expect(props.onSelect).toHaveBeenCalled()
  })

  it('moves the highlight with the arrow keys', async () => {
    const props = setup()
    await userEvent.type(screen.getByRole('textbox'), 'braz')
    await screen.findByText('🇧🇷 Brazil')

    await userEvent.keyboard('{ArrowDown}{Enter}')

    expect(props.onSelect).toHaveBeenCalledWith(-4.3, 15.3, expect.anything())
  })

  it('toggles a layer when its command is chosen', async () => {
    const props = setup()
    await userEvent.click(screen.getByText('Show Investment Signal'))

    expect(props.onToggleLayer).toHaveBeenCalledWith('investment')
    expect(props.onClose).toHaveBeenCalled()
  })

  it('closes on Escape', async () => {
    const props = setup()
    await userEvent.keyboard('{Escape}')
    expect(props.onClose).toHaveBeenCalled()
  })

  it('reports when nothing matches', async () => {
    mockSearch([])
    setup()
    await userEvent.type(screen.getByRole('textbox'), 'zzzzzz')

    expect(await screen.findByText('No matches.')).toBeInTheDocument()
  })
})
