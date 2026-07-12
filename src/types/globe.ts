export interface SelectedEntity {
  id: string
  type: 'city' | 'country' | 'capital'
  name: string
  country?: string
  countryCode?: string
  lat: number
  lng: number
}
