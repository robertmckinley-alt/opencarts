import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SOURCE_URL =
  process.env.BAMBOO_CART_URL ||
  'https://api-intelligence.getbamboo.com/api/reports/cart-counts';

export async function GET() {
  try {
    const res = await fetch(SOURCE_URL, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: 502 }
      );
    }
    const data = await res.json();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message ?? 'fetch failed' },
      { status: 500 }
    );
  }
}
