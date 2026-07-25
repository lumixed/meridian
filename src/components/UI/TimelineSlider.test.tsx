import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TimelineSlider from './TimelineSlider'

function setup(overrides: Partial<React.ComponentProps<typeof TimelineSlider>> = {}) {
  const props = {
    year: 2015,
    onChange: vi.fn(),
    heatmapActive: true,
    ...overrides,
  }
  const view = render(<TimelineSlider {...props} />)
  return { ...props, view }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('TimelineSlider', () => {
  it('shows the current year and pins the slider to it', () => {
    setup({ year: 2018 })
    expect(screen.getByText('2018')).toBeInTheDocument()
    expect(screen.getByLabelText('Timeline year')).toHaveValue('2018')
  })

  it('highlights the marker matching the current year', () => {
    setup({ year: 2021 })
    expect(screen.getByRole('button', { name: '2021' })).toHaveClass('text-[#45E0C0]/80')
  })

  it('reports the year when a marker is clicked', async () => {
    const { onChange } = setup()
    await userEvent.click(screen.getByRole('button', { name: '2021' }))
    expect(onChange).toHaveBeenCalledWith(2021)
  })

  it('tells the user the globe recolours when the heatmap is on', () => {
    setup({ heatmapActive: true })
    expect(screen.getByText(/globe recolours by GDP per capita/i)).toBeInTheDocument()
  })

  it('tells the user to enable the heatmap when it is off', () => {
    setup({ heatmapActive: false })
    expect(screen.getByText(/enable the heatmap to recolour the globe/i)).toBeInTheDocument()
  })

  it('advances the year while playing', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(<TimelineSlider year={2015} onChange={onChange} heatmapActive />)

    await act(async () => {
      screen.getByLabelText('Play timeline').click()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200)
    })

    expect(onChange).toHaveBeenCalledWith(2016)
  })

  it('wraps back to the first year at the end of the range', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(<TimelineSlider year={2025} onChange={onChange} heatmapActive />)

    await act(async () => {
      screen.getByLabelText('Play timeline').click()
    })
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200)
    })

    expect(onChange).toHaveBeenCalledWith(2015)
  })

  it('stops playing when a year is picked by hand', async () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    render(<TimelineSlider year={2015} onChange={onChange} heatmapActive />)

    await act(async () => {
      screen.getByLabelText('Play timeline').click()
    })
    expect(screen.getByLabelText('Pause timeline')).toBeInTheDocument()

    await act(async () => {
      screen.getByRole('button', { name: '2023' }).click()
    })

    expect(onChange).toHaveBeenCalledWith(2023)
    expect(screen.getByLabelText('Play timeline')).toBeInTheDocument()

    onChange.mockClear()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(3000)
    })
    expect(onChange).not.toHaveBeenCalled()
  })
})
