import { NextResponse } from 'next/server'
import { getAllCityDots } from '@/lib/cities'

export const revalidate = 300

export async function GET() {
  const cities = getAllCityDots()

  return NextResponse.json(
    { success: true, count: cities.length, cities },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' } },
  )
}
