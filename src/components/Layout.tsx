import { Outlet, NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useNoteStore } from '../stores/noteStore';
import './Layout.css';

export function Layout() {
  const { theme, setTheme } = useNoteStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
  };
  
  return (
    <div className="app-layout">
      <nav className="top-nav">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          data-testid="mobile-menu-btn"
        >
          ☰
        </button>
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          Notes
        </NavLink>
        <NavLink to="/graph" className={({ isActive }) => isActive ? 'active' : ''}>
          Graph
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
          Settings
        </NavLink>
        <button 
          className="theme-toggle" 
          onClick={toggleTheme}
          data-testid="theme-toggle"
          style={{ marginLeft: 'auto' }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>
      <div className="main-content">
        <Outlet context={{ sidebarOpen, setSidebarOpen }} />
      </div>
    </div>
  );
}