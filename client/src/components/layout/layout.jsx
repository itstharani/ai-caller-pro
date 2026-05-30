import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Megaphone, PhoneCall, Users, Settings } from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/campaigns', icon: Megaphone,       label: 'Campaigns' },
  { to: '/calls',     icon: PhoneCall,       label: 'Calls' },
  { to: '/contacts',  icon: Users,           label: 'Contacts' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
]

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Sidebar */}
      <div style={{
        width: 220, background: 'var(--bg2)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', padding: '20px 12px', gap: 4,
        position: 'fixed', top: 0, left: 0, height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--accent)', padding: '0 12px 20px' }}>
          VoiceAI
        </div>

        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', borderRadius: 8,
              background: isActive ? 'rgba(124,58,237,0.08)' : 'none',
              color: isActive ? 'var(--accent)' : 'var(--text2)',
              fontSize: 13, fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
            })}>
            <Icon size={15} />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Main content */}
      <div style={{ marginLeft: 220, flex: 1, padding: 28, minHeight: '100vh' }}>
        {children}
      </div>
    </div>
  )
}