import React from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Campaigns from './pages/Campaigns'
import Calls from './pages/Calls'
import Contacts from './pages/Contacts'
import Settings from './pages/Settings'

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/calls"     element={<Calls />} />
        <Route path="/contacts"  element={<Contacts />} />
        <Route path="/settings"  element={<Settings />} />
      </Routes>
    </Layout>
  )
}