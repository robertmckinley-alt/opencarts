'use client';

import { useEffect, useMemo, useState } from 'react';

type Item = {
  brand_name?: string | null;
  category_name?: string | null;
  product_name?: string | null;
  quantity?: number;
  unit_price?: number;
  line_total?: number;
  uom?: string | null;
  package_type?: string | null;
};

type Cart = {
  cart_id: string;
  cart_age_minutes: number;
  cart_minutes_since_last_update: number;
  cart_total: number;
  cart_created_at: string;
  cart_updated_at: string;
  cart_expired_at: string | null;
  client_name: string;
  client_license?: string;
  inventory_allocation_name?: string;
  item_count: number;
  items: Item[];
};

type Payload = {
  account_holder_id?: string;
  cart_item_lines?: number;
  carts?: Cart[];
  error?: string;
};

const REFRESH_MS = 15000;

function money(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });
}
function moneyFull(n: number) {
  return n.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
  });
}
function int(n: number) {
  return n.toLocaleString();
}
function ageColor(mins: number) {
  if (mins < 30) return 'glow-emerald';
  if (mins < 120) return 'glow-sky';
  if (mins < 360) return 'glow-amber';
  return 'glow-rose';
}
function ageBadge(mins: number) {
  if (mins < 30) return { label: 'FRESH', cls: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30' };
  if (mins < 120) return { label: 'ACTIVE', cls: 'bg-sky-500/15 text-sky-300 ring-sky-400/30' };
  if (mins < 360) return { label: 'AGING', cls: 'bg-amber-500/15 text-amber-300 ring-amber-400/30' };
  return { label: 'STALE', cls: 'bg-rose-500/15 text-rose-300 ring-rose-400/30' };
}
function relTime(mins: number) {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return m ? `${h}h ${m}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export default function Page() {
  const [data, setData] = useState<Payload | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<'value' | 'age' | 'items'>('value');

  async function load() {
    try {
      const r = await fetch('/api/carts', { cache: 'no-store' });
      const j = (await r.json()) as Payload;
      if (j.error) throw new Error(j.error);
      setData(j);
      setErr(null);
      setLastFetch(new Date());
    } catch (e: any) {
      setErr(e?.message ?? 'failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const carts = data?.carts ?? [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let arr = carts;
    if (needle) {
      arr = arr.filter(
        (c) =>
          c.client_name.toLowerCase().includes(needle) ||
          (c.client_license ?? '').toLowerCase().includes(needle) ||
          (c.inventory_allocation_name ?? '').toLowerCase().includes(needle)
      );
    }
    const sorted = [...arr];
    if (sort === 'value') sorted.sort((a, b) => b.cart_total - a.cart_total);
    if (sort === 'age') sorted.sort((a, b) => b.cart_age_minutes - a.cart_age_minutes);
    if (sort === 'items') sorted.sort((a, b) => b.item_count - a.item_count);
    return sorted;
  }, [carts, q, sort]);

  const totals = useMemo(() => {
    const totalValue = carts.reduce((s, c) => s + (c.cart_total || 0), 0);
    const totalItems = carts.reduce((s, c) => s + (c.item_count || 0), 0);
    const lines = data?.cart_item_lines ?? 0;
    const avg = carts.length ? totalValue / carts.length : 0;
    return { totalValue, totalItems, lines, avg, count: carts.length };
  }, [carts, data]);

  const openCart = openId ? carts.find((c) => c.cart_id === openId) ?? null : null;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/5 backdrop-blur-xl bg-black/30">
        <div className="mx-auto max-w-[1500px] px-6 py-4 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-400 to-sky-500 grid place-items-center text-black font-black">
              ◎
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400">
                <span className="absolute inset-0 rounded-full bg-emerald-400 ping-dot" />
              </span>
            </div>
            <div>
              <div className="text-lg font-bold tracking-tight">OpenCarts</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                Live wholesale carts
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter clients, licenses, allocations…"
              className="w-72 rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm focus:outline-none"
            >
              <option value="value">Sort: value</option>
              <option value="age">Sort: age</option>
              <option value="items">Sort: items</option>
            </select>
            <button
              onClick={load}
              className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
            >
              ↻ Refresh
            </button>
            <div className="flex items-center gap-2 ml-2 text-xs text-white/50">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-70 ping-dot" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              {lastFetch ? `Updated ${lastFetch.toLocaleTimeString()}` : 'Connecting…'}
            </div>
          </div>
        </div>
      </header>

      {/* KPI strip */}
      <section className="mx-auto max-w-[1500px] px-6 pt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi
          label="Open Carts"
          value={int(totals.count)}
          sub={loading ? 'loading…' : `${int(totals.lines)} line items`}
          accent="from-sky-400 to-cyan-300"
        />
        <Kpi
          label="Total Open Value"
          value={money(totals.totalValue)}
          sub={moneyFull(totals.totalValue)}
          accent="from-emerald-400 to-teal-300"
        />
        <Kpi
          label="Average Cart"
          value={money(totals.avg)}
          sub="per active cart"
          accent="from-fuchsia-400 to-violet-300"
        />
        <Kpi
          label="Units in Carts"
          value={int(totals.totalItems)}
          sub="qty across all carts"
          accent="from-amber-400 to-orange-300"
        />
      </section>

      {/* Status */}
      {err && (
        <div className="mx-auto max-w-[1500px] px-6 mt-4">
          <div className="glass rounded-2xl p-4 text-rose-300 text-sm">
            Couldn’t reach the carts feed: {err}
          </div>
        </div>
      )}

      {/* Cart grid */}
      <main className="mx-auto max-w-[1500px] px-6 py-6">
        {loading && !data ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <div className="glass rounded-2xl p-10 text-center text-white/60">
            No open carts match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((c) => {
              const badge = ageBadge(c.cart_age_minutes);
              return (
                <button
                  key={c.cart_id}
                  onClick={() => setOpenId(c.cart_id)}
                  className={`group glass ${ageColor(
                    c.cart_age_minutes
                  )} rounded-2xl p-5 text-left transition-transform hover:-translate-y-0.5 hover:bg-white/[0.07] relative overflow-hidden`}
                >
                  <div className="absolute inset-x-0 top-0 h-px shine" />
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                        {c.client_license ? `Lic ${c.client_license}` : 'Cart'}
                      </div>
                      <div className="mt-1 font-semibold text-base truncate">
                        {c.client_name}
                      </div>
                      <div className="mt-0.5 text-xs text-white/50 truncate">
                        {c.inventory_allocation_name ?? '—'}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[10px] font-semibold tracking-wider px-2 py-1 rounded-full ring-1 ${badge.cls}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="mt-5 flex items-end justify-between">
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                        Cart value
                      </div>
                      <div className="text-3xl font-black tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                        {moneyFull(c.cart_total)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
                        Items
                      </div>
                      <div className="text-xl font-bold">{int(c.item_count)}</div>
                      <div className="text-[11px] text-white/40">
                        {c.items?.length ?? 0} SKUs
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between text-xs text-white/50">
                    <span>Open {relTime(c.cart_age_minutes)}</span>
                    <span>Updated {relTime(c.cart_minutes_since_last_update)} ago</span>
                  </div>

                  <div className="mt-4 text-[11px] text-white/30 group-hover:text-white/60 transition">
                    Click to view items →
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {/* Modal */}
      {openCart && (
        <CartModal cart={openCart} onClose={() => setOpenId(null)} />
      )}

      <footer className="mx-auto max-w-[1500px] px-6 py-10 text-center text-xs text-white/30">
        Polling every {REFRESH_MS / 1000}s · Source: Bamboo Intelligence
      </footer>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="glass rounded-2xl p-5 relative overflow-hidden">
      <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${accent} opacity-20 blur-2xl`} />
      <div className="text-[11px] uppercase tracking-[0.2em] text-white/50">{label}</div>
      <div className="mt-2 text-3xl font-black tracking-tight">{value}</div>
      {sub && <div className="mt-1 text-xs text-white/40">{sub}</div>}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-5 h-44 animate-pulse">
          <div className="h-3 w-24 bg-white/10 rounded" />
          <div className="mt-3 h-5 w-44 bg-white/10 rounded" />
          <div className="mt-8 h-8 w-32 bg-white/10 rounded" />
        </div>
      ))}
    </div>
  );
}

function CartModal({ cart, onClose }: { cart: Cart; onClose: () => void }) {
  const sortedItems = [...(cart.items ?? [])].sort(
    (a, b) => (b.line_total ?? 0) - (a.line_total ?? 0)
  );
  const byBrand = sortedItems.reduce<Record<string, number>>((acc, it) => {
    const k = it.brand_name || 'Unknown';
    acc[k] = (acc[k] ?? 0) + (it.line_total ?? 0);
    return acc;
  }, {});
  const topBrands = Object.entries(byBrand)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="glass rounded-3xl w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-white/10 flex items-start gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              {cart.client_license ? `License ${cart.client_license}` : 'Cart'}
            </div>
            <div className="text-2xl font-bold mt-1">{cart.client_name}</div>
            <div className="text-sm text-white/50 mt-1">
              {cart.inventory_allocation_name ?? '—'}
            </div>
          </div>
          <div className="ml-auto text-right">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">
              Cart value
            </div>
            <div className="text-3xl font-black bg-gradient-to-br from-emerald-300 to-sky-300 bg-clip-text text-transparent">
              {moneyFull(cart.cart_total)}
            </div>
            <div className="text-xs text-white/40 mt-1">
              {int(cart.item_count)} units · {sortedItems.length} SKUs
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-2 rounded-full h-9 w-9 grid place-items-center bg-white/5 border border-white/10 hover:bg-white/10"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4 border-b border-white/10 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <Stat label="Open for" value={relTime(cart.cart_age_minutes)} />
          <Stat label="Last update" value={`${relTime(cart.cart_minutes_since_last_update)} ago`} />
          <Stat label="Created" value={cart.cart_created_at?.slice(0, 16) ?? '—'} />
          <Stat label="Updated" value={cart.cart_updated_at?.slice(0, 16) ?? '—'} />
        </div>

        {topBrands.length > 0 && (
          <div className="px-6 py-3 border-b border-white/10 flex flex-wrap gap-2">
            {topBrands.map(([b, v]) => (
              <span
                key={b}
                className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/10"
              >
                <span className="text-white/60">{b}</span>{' '}
                <span className="font-semibold ml-1">{money(v)}</span>
              </span>
            ))}
          </div>
        )}

        <div className="overflow-auto scrollbar-thin flex-1">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-black/60 backdrop-blur z-10">
              <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-white/40">
                <th className="px-6 py-3 font-medium">Product</th>
                <th className="px-2 py-3 font-medium">Brand</th>
                <th className="px-2 py-3 font-medium text-right">Qty</th>
                <th className="px-2 py-3 font-medium text-right">Unit</th>
                <th className="px-6 py-3 font-medium text-right">Line total</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((it, idx) => (
                <tr
                  key={idx}
                  className="border-t border-white/5 hover:bg-white/[0.03]"
                >
                  <td className="px-6 py-3">
                    <div className="font-medium">{it.product_name ?? '—'}</div>
                    <div className="text-[11px] text-white/40">
                      {it.category_name ?? ''}
                    </div>
                  </td>
                  <td className="px-2 py-3 text-white/70">{it.brand_name ?? '—'}</td>
                  <td className="px-2 py-3 text-right tabular-nums">
                    {int(it.quantity ?? 0)}
                    {it.uom ? <span className="text-white/40 ml-1">{it.uom}</span> : null}
                  </td>
                  <td className="px-2 py-3 text-right tabular-nums text-white/70">
                    {it.unit_price != null ? moneyFull(it.unit_price) : '—'}
                  </td>
                  <td className="px-6 py-3 text-right tabular-nums font-semibold">
                    {it.line_total != null ? moneyFull(it.line_total) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/5 border border-white/10 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="text-sm mt-0.5">{value}</div>
    </div>
  );
}
