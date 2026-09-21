import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = {
  student: [
    { label: 'Equipment', to: '/equipment' },
    { label: 'My Requests', to: '/my-requests' },
  ],
  admin: [
    { label: 'Dashboard', to: '/admin' },
    { label: 'Equipment', to: '/admin/equipment' },
    { label: 'Requests', to: '/admin/requests' },
  ],
}

function Navbar({ role = 'student' }) {
  const { logout } = useAuth()
  const items = navItems[role]
  const roleLabel = role === 'admin' ? 'Admin' : 'Student'

  return (
    <>
      <header className="navbar">
        <div className="navbar__inner">
          <NavLink className="navbar__brand" to={role === 'admin' ? '/admin' : '/equipment'}>
            LabReserve
          </NavLink>
          <nav className="navbar__links" aria-label={`${roleLabel} navigation`}>
            {items.map((item) => (
              <NavLink key={item.to} className="navbar__link" to={item.to} end={item.to === '/admin'}>
                {item.label}
              </NavLink>
            ))}
          </nav>
          <span className="navbar__role">{roleLabel}</span>
          <button className="navbar__logout" type="button" onClick={logout}>Sign out</button>
        </div>
      </header>

      <nav className="mobile-nav" aria-label={`${roleLabel} mobile navigation`}>
        {items.map((item) => (
          <NavLink key={item.to} className="mobile-nav__link" to={item.to} end={item.to === '/admin'}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}

export default Navbar
