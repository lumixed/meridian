'use client'

import { Component, useEffect, useState, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import GlobeFallback from './GlobeFallback'
import LoadingScreen from '@/components/UI/LoadingScreen'
import type { SelectedEntity } from '@/types/globe'
import type { LayerState } from '@/types/layers'

const GlobeContainer = dynamic(() => import('./GlobeContainer'), {
  ssr: false,
  loading: () => <LoadingScreen />,
})

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    return Boolean(gl)
  } catch {
    return false
  }
}

interface BoundaryProps {
  children: ReactNode
  onError: () => void
}

class GlobeBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    console.error('[globe] render failed', error)
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}

type Status = 'checking' | 'ready' | 'unsupported' | 'crashed'

interface Props {
  onEntitySelect: (entity: SelectedEntity | null) => void
  onLoaded: () => void
  flyTo: { lat: number; lng: number; altitude?: number } | null
  selectedEntity: SelectedEntity | null
  layers: LayerState
  timelineYear: number
}

export default function GlobeStage(props: Props) {
  const [status, setStatus] = useState<Status>('checking')
  const { onLoaded } = props

  useEffect(() => {
    const ok = supportsWebGL()
    setStatus(ok ? 'ready' : 'unsupported')
    if (!ok) onLoaded()
  }, [onLoaded])

  if (status === 'checking') return <LoadingScreen />

  if (status !== 'ready') {
    return (
      <GlobeFallback
        reason={status === 'unsupported' ? 'unsupported' : 'crashed'}
        onRetry={status === 'crashed' ? () => window.location.reload() : undefined}
      />
    )
  }

  return (
    <GlobeBoundary onError={() => { setStatus('crashed'); onLoaded() }}>
      <GlobeContainer {...props} />
    </GlobeBoundary>
  )
}
