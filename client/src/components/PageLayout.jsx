import Navbar from './Navbar.jsx'

function PageLayout({ role = 'student', title, description, actions, children }) {
  return (
    <div className="app-layout">
      <Navbar role={role} />
      <main className="page">
        <div className="page__header">
          <div>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {actions && <div className="page__actions">{actions}</div>}
        </div>
        {children}
      </main>
    </div>
  )
}

export default PageLayout
