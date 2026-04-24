import { useEffect, useState } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import TopBar from '../components/TopBar'
import { fetchStats, fetchMonthlyRevenue, fetchTopCustomers, fetchTopProducts } from '../api'

const AVATAR_COLORS = [
  'bg-primary-container text-on-primary-container',
  'bg-tertiary-fixed text-on-tertiary-fixed',
  'bg-secondary-fixed text-on-secondary-container',
  'bg-surface-container-high text-on-surface',
  'bg-surface-container-high text-on-surface',
]

function initials(id) {
  return `#${String(id).slice(-3)}`
}

export default function Dashboard() {
  const [stats, setStats] = useState({ revenue: 0, customers: 0, transactions: 0 })
  const [monthly, setMonthly] = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetchStats(),
      fetchMonthlyRevenue(),
      fetchTopCustomers(),
      fetchTopProducts(),
    ]).then(([s, m, c, p]) => {
      setStats(s)
      setMonthly(m)
      setCustomers(c)
      setProducts(p)
      setLoading(false)
    })
  }, [])

  return (
    <div className="flex flex-col h-full">
      <TopBar title="Dashboard Overview" />

      <div className="flex-1 overflow-y-auto p-gutter bg-surface">
        <div className="max-w-[1440px] mx-auto space-y-gutter">

          {/* Overview Metrics */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {[
              { label: 'Total Revenue',      value: `$${stats.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
              { label: 'Total Customers',    value: stats.customers.toLocaleString() },
              { label: 'Total Transactions', value: stats.transactions.toLocaleString() },
            ].map(({ label, value }) => (
              <div key={label} className="bg-surface-container-lowest rounded-xl shadow-level-1 p-gutter flex flex-col border border-transparent card-hover">
                <h3 className="text-[14px] font-semibold tracking-wide text-on-surface-variant mb-2 uppercase">
                  {label}
                </h3>
                <div className="flex items-end justify-between mt-auto">
                  <span className="text-[30px] font-bold leading-tight text-on-surface">
                    {loading ? <span className="text-outline animate-pulse">loading...</span> : value}
                  </span>
                  <span className="text-[14px] font-semibold text-primary flex items-center bg-primary-fixed py-1 px-2 rounded-full">
                    <span className="material-symbols-outlined text-[16px] mr-1">show_chart</span>
                    Live
                  </span>
                </div>
              </div>
            ))}
          </section>

          {/* Monthly Revenue Chart */}
          <section className="bg-surface-container-lowest rounded-xl shadow-level-1 p-gutter border border-transparent card-hover">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-[20px] font-semibold text-on-surface">Monthly Revenue</h3>
            </div>
            <div className="w-full h-[300px]">
              {monthly.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-on-surface-variant">
                  No data yet — upload a file to get started.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#006193" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#006193" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e2e8" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12, fill: '#404850' }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12, fill: '#404850' }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={v => [`$${Number(v).toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Revenue']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #c0c7d1', fontSize: 13 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#006193"
                      strokeWidth={2}
                      fill="url(#revenueGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* Bottom Lists */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
            {/* Top Customers */}
            <div className="bg-surface-container-lowest rounded-xl shadow-level-1 p-gutter border border-transparent card-hover">
              <h3 className="text-[20px] font-semibold text-on-surface mb-6">Top 5 Customers by Spending</h3>
              {customers.length === 0 ? (
                <p className="text-on-surface-variant text-sm">No data yet.</p>
              ) : (
                <ul className="space-y-4">
                  {customers.map((c, i) => (
                    <li key={c.customer_id} className="flex items-center justify-between pb-4 border-b border-surface-variant last:border-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${AVATAR_COLORS[i]} flex items-center justify-center text-[14px] font-semibold`}>
                          {initials(c.customer_id)}
                        </div>
                        <div>
                          <span className="text-[16px] font-medium text-on-surface block">
                            Customer {c.customer_id}
                          </span>
                          <span className="text-[12px] text-on-surface-variant">
                            {c.frequency} orders
                          </span>
                        </div>
                      </div>
                      <span className="text-[14px] font-semibold text-on-surface-variant">
                        ${Number(c.monetary).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top Products */}
            <div className="bg-surface-container-lowest rounded-xl shadow-level-1 p-gutter border border-transparent card-hover">
              <h3 className="text-[20px] font-semibold text-on-surface mb-6">Top 5 Products by Quantity</h3>
              {products.length === 0 ? (
                <p className="text-on-surface-variant text-sm">No data yet.</p>
              ) : (
                <ul className="space-y-4">
                  {products.map((p) => (
                    <li key={p.product} className="flex items-center justify-between pb-4 border-b border-surface-variant last:border-0 last:pb-0">
                      <div className="flex flex-col">
                        <span className="text-[16px] font-medium text-on-surface">{p.product}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-primary">trending_up</span>
                        <span className="text-[14px] font-semibold text-on-surface">
                          {Number(p.quantity_sold).toLocaleString()} units
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  )
}
