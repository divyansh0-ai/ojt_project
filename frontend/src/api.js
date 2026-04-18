export const fetchStats = () =>
  fetch('/api/stats').then(r => r.json())

export const fetchMonthlyRevenue = () =>
  fetch('/api/revenue/monthly').then(r => r.json())

export const fetchTopCustomers = () =>
  fetch('/api/customers/top').then(r => r.json())

export const fetchTopProducts = () =>
  fetch('/api/products/top').then(r => r.json())

export const fetchSegments = () =>
  fetch('/api/segments').then(r => r.json())

export const fetchProducts = () =>
  fetch('/api/products').then(r => r.json())

export const postRecommend = (stock_code, top_n = 5) =>
  fetch('/api/recommend', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock_code, top_n }),
  }).then(r => r.json())

export const uploadFile = (file) => {
  const form = new FormData()
  form.append('file', file)
  return fetch('/api/upload', { method: 'POST', body: form }).then(r => {
    if (!r.ok) return r.json().then(e => Promise.reject(e.detail))
    return r.json()
  })
}

export const addTransaction = (data) =>
  fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  }).then(r => r.json())
