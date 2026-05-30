const BASE = 'http://localhost:5000/api'

export const api = {
  get: (url) => fetch(`${BASE}${url}`).then(r => r.json()),

  post: (url, body) => fetch(`${BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()),

  put: (url, body) => fetch(`${BASE}${url}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  }).then(r => r.json()),

  delete: (url) => fetch(`${BASE}${url}`, {
    method: 'DELETE',
  }).then(r => r.json()),
}