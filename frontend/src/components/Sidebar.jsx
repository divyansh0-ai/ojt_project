import { NavLink } from 'react-router-dom'

const links = [
  { to: '/',               label: 'Dashboard',       icon: 'dashboard' },
  { to: '/add-data',       label: 'Add Data',         icon: 'add_circle' },
  { to: '/segments',       label: 'Segments',         icon: 'group' },
  { to: '/recommendations',label: 'Recommendations',  icon: 'lightbulb' },
]

export default function Sidebar() {
  return (
    <nav className="fixed left-0 top-0 h-full w-[260px] bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col z-40 shadow-none">
      <div className="h-16 flex items-center px-6 border-b border-outline-variant/30">
        <h1 className="text-xl font-bold text-primary tracking-tight">Retail Insights</h1>
      </div>

      <div className="flex-1 py-4 flex flex-col gap-1">
        {links.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-4 py-3 mx-2 bg-blue-50 text-primary border-l-4 border-primary font-semibold rounded-r-lg'
                : 'flex items-center gap-3 px-4 py-3 mx-2 text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors duration-200 rounded-lg'
            }
          >
            {({ isActive }) => (
              <>
                <span className={`material-symbols-outlined ${isActive ? 'icon-filled' : ''}`}>
                  {icon}
                </span>
                <span className="text-[14px] font-semibold tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
