import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import "../styles/Dashboard.css";
import DeliberationForm from '../components/DeliberationForm';
import ViewDeliberations from '../components/ViewDeliberations';
import UserCreationForm from '../components/UserCreationForm';
import UserList from '../components/UserList';
import AboutPage from '../components/AboutPage';
import DeliberationList from '../components/DeliberationList';

const Dashboard = ({ user, logout }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const [activeView, setActiveView] = useState(null);
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const [userToEdit, setUserToEdit] = useState(null);
  const [deliberationToEdit, setDeliberationToEdit] = useState(null);
  
  const toggleMenu = useCallback((menu) => {
    setOpenMenu(prev => prev === menu ? null : menu);
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    navigate('/');
  }, [logout, navigate]);

  const toggleAdminMenu = useCallback(() => {
    setShowAdminMenu(prev => !prev);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const handleCreateUser = useCallback(() => {
    setActiveView('create-user');
  }, []);

  const handleSetView = useCallback((view, data = null) => {
    setActiveView(view);
    setUserToEdit(null);
    setDeliberationToEdit(null);

    if (view === 'edit-user') {
      setUserToEdit(data);
    } else if (view === 'edit-deliberation') {
      setDeliberationToEdit(data);
    } else if (view === 'list-users') {
      // Rafraîchir les données utilisateur quand on retourne à la liste
      setUserToEdit(null);
    }
  }, []);

  if (!user?.id) {
    console.error("Erreur: Utilisateur non défini", user);
    return (
      <div className="app-container">
        <div className="main-content">
          <div className="error-container">
            <h2>Erreur d'authentification</h2>
            <p>Veuillez vous reconnecter</p>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Se connecter
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <button 
          className="sidebar-toggle" 
          onClick={toggleSidebar}
          aria-label={sidebarCollapsed ? 'Ouvrir le menu' : 'Fermer le menu'}
        >
          <span className="toggle-icon">
            {sidebarCollapsed ? '▶' : '◀'}
          </span>
        </button>

        <div className="logo-container">
          <div className="logo">
            <div className="pillar-icon">📄</div>
            {!sidebarCollapsed && <div className="admin-text">DELIBERATION APP</div>}
          </div>
        </div>

        <nav className="sidebar-menu">
          {/* LETTRES DE DELIBERATION */}
          <div 
            className={`menu-item ${openMenu === 'deliberations' ? 'active' : ''}`} 
            onClick={() => toggleMenu('deliberations')}
          >
            <span className="menu-icon">📋</span>
            {!sidebarCollapsed && (
              <>
                <span className="menu-text">Lettre de délibération</span>
                <span className="chevron">{openMenu === 'deliberations' ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          {openMenu === 'deliberations' && !sidebarCollapsed && (
            <div className="submenu">
              {user.is_admin === 1 && (
                <div className="submenu-item" onClick={() => handleSetView('create-deliberation')}>
                  <span className="submenu-icon">➕</span>
                  Création de lettre
                </div>
              )}
              <div className="submenu-item" onClick={() => handleSetView('list-deliberations')}>
                <span className="submenu-icon">📑</span>
                Liste de délibération
              </div>
            </div>
          )}

          {/* PROFIL */}
          <div 
            className={`menu-item ${openMenu === 'profile' ? 'active' : ''}`} 
            onClick={() => toggleMenu('profile')}
          >
            <span className="menu-icon">👤</span>
            {!sidebarCollapsed && (
              <>
                <span className="menu-text">Profil</span>
                <span className="chevron">{openMenu === 'profile' ? '▼' : '▶'}</span>
              </>
            )}
          </div>
          {openMenu === 'profile' && !sidebarCollapsed && (
            <div className="submenu">
              {user.is_admin === 1 && (
                <div className="submenu-item" onClick={() => handleSetView('create-user')}>
                  <span className="submenu-icon">➕</span>
                  Création des utilisateurs
                </div>
              )}
              <div className="submenu-item" onClick={() => handleSetView('list-users')}>
                <span className="submenu-icon">👥</span>
                Liste des utilisateurs
              </div>
            </div>
          )}

          {/* A PROPOS */}
          <div 
            className="menu-item" 
            onClick={() => handleSetView('about')}
          >
            <span className="menu-icon">ℹ️</span>
            {!sidebarCollapsed && <span className="menu-text">À propos</span>}
          </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <header className="header">
          <div className="header-left">
            <h1 className="title">Bienvenue, {user.prenom || 'Administrateur'} {user.nom || ''}</h1>
          </div>
          <div className="header-right">
            <div className="admin-menu-container">
              <button 
                className="user-icon-container" 
                onClick={toggleAdminMenu}
                aria-label="Menu utilisateur"
              >
                <span className="user-icon">👤</span>
                <span className="user-name">{user.prenom || 'Admin'}</span>
                <span className="dropdown-arrow">{showAdminMenu ? '▲' : '▼'}</span>
              </button>
              {showAdminMenu && (
                <div className="admin-dropdown">
                  <div className="dropdown-header">
                    <span className="dropdown-title">Menu Utilisateur</span>
                  </div>
                  {user.is_admin === 1 && (
                    <button className="dropdown-item" onClick={handleCreateUser}>
                      <span className="dropdown-icon">➕</span>
                      <span>Créer un utilisateur</span>
                    </button>
                  )}
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-item" onClick={handleLogout}>
                    <span className="dropdown-icon">🚪</span>
                    <span>Déconnexion</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="content">
          {/* Vues pour les délibérations */}
          {activeView === 'create-deliberation' && user.is_admin === 1 && (
            <DeliberationForm user={user} setActiveView={handleSetView} />
          )}
          {activeView === 'list-deliberations' && (
            <DeliberationList user={user} setActiveView={handleSetView} />
          )}
          {activeView === 'edit-deliberation' && deliberationToEdit && user.is_admin === 1 && (
            <DeliberationForm deliberationToEdit={deliberationToEdit} setActiveView={handleSetView} />
          )}
          {activeView === 'view-specific-deliberation' && (
            <ViewDeliberations setActiveView={handleSetView} />
          )}

          {/* Vues pour les utilisateurs */}
          {activeView === 'create-user' && user.is_admin === 1 && (
            <UserCreationForm setActiveView={handleSetView} />
          )}
          {activeView === 'list-users' && (
            <UserList user={user} setActiveView={handleSetView} />
          )}
          {activeView === 'edit-user' && userToEdit && (
            <UserCreationForm userToEdit={userToEdit} setActiveView={handleSetView} />
          )}

          {/* Vue À propos */}
          {activeView === 'about' && (
            <AboutPage setActiveView={handleSetView} />
          )}

          {/* Vue par défaut */}
          {activeView === null && (
            <section className="welcome-section">
              <div className="welcome-card">
                <h2 className="welcome-title">
                  {user.is_admin === 1 ? 'Tableau de bord administrateur' : 'Espace utilisateur'}
                </h2>
                <p className="welcome-description">
                  Bienvenue dans l'application de gestion des délibérations
                </p>
                <div className="action-cards">
                  <button 
                    className="action-card"
                    onClick={() => handleSetView('view-specific-deliberation')}
                  >
                    <span className="action-icon">📖</span>
                    <span className="action-text">Consulter les délibérations</span>
                  </button>
                  {user.is_admin === 1 && (
                    <button 
                      className="action-card"
                      onClick={() => handleSetView('create-deliberation')}
                    >
                      <span className="action-icon">✏️</span>
                      <span className="action-text">Créer une délibération</span>
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
