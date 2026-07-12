export interface LayerState {
  heatmap: boolean
  tradeRoutes: boolean
  cityNetwork: boolean
  investment: boolean
  news: boolean
}

export const DEFAULT_LAYERS: LayerState = {
  heatmap: false,
  tradeRoutes: false,
  cityNetwork: false,
  investment: false,
  news: false,
}
