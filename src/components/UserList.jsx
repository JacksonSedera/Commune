import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import styles from '../styles/UserList.module.css';

const UserList = ({ setActiveView, user: loggedInUser }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // ✅ Si utilisateur standard, afficher uniquement ses propres infos
      if (loggedInUser.is_admin === 0) {
        const currentUserData = response.data.users.filter(u => u.id === loggedInUser.id);
        setUsers(currentUserData);
      } else {
        // ✅ Si admin, afficher tous les utilisateurs
        setUsers(response.data.users);
      }
      
      setError('');
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      setError('Impossible de charger la liste des utilisateurs');
    } finally {
      setLoading(false);
    }
  }, [loggedInUser]);

  const handleDelete = useCallback(async (userToDelete) => {
    const role = userToDelete.is_admin ? 'Administrateur' : 'Utilisateur';
    if (window.confirm(`Voulez-vous vraiment supprimer l'utilisateur ${userToDelete.username} (${role}) ?`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3001/users/${userToDelete.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchUsers();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de l\'utilisateur');
      }
    }
  }, [fetchUsers]);

  const handleEdit = useCallback((user) => {
    setActiveView('edit-user', user);
  }, [setActiveView]);

  const handleEditOwnProfile = useCallback(() => {
    // Trouver les données complètes de l'utilisateur connecté
    const currentUserData = users.find(u => u.id === loggedInUser.id) || loggedInUser;
    setActiveView('edit-user', currentUserData);
  }, [setActiveView, users, loggedInUser]);

  // Rafraîchir la liste quand on revient à la vue
  useEffect(() => {
    const refreshTimer = setTimeout(() => {
      fetchUsers();
    }, 100);
    
    return () => clearTimeout(refreshTimer);
  }, [fetchUsers]);

  if (loading) {
    return (
      <div className="container py-3">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-3">
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button className="btn btn-primary" onClick={fetchUsers}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-3">
      <div className="page-header">
        <h2>{loggedInUser.is_admin === 1 ? 'Liste des utilisateurs' : 'Mes informations'}</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setActiveView(null)}>
            ← Retour au Dashboard
          </button>
          {loggedInUser.is_admin === 1 && (
            <button className="btn btn-primary" onClick={() => setActiveView('create-user')}>
              + Créer un utilisateur
            </button>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <div className="empty-state">
          <p>Aucun utilisateur trouvé</p>
          {loggedInUser.is_admin === 1 && (
            <button className="btn btn-primary" onClick={() => setActiveView('create-user')}>
              Créer le premier utilisateur
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className={`table table-striped table-hover table-sm ${styles['user-table-compact']}`}>
              <thead className="table-dark">
                <tr>
                  <th>ID</th>
                  <th>Nom d'utilisateur</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>Email</th>
                  <th>Téléphone</th>
                  <th>Rôle</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td><strong>{user.username}</strong></td>
                    <td>{user.nom || '-'}</td>
                    <td>{user.prenom || '-'}</td>
                    <td>{user.email || '-'}</td>
                    <td>{user.phone_number || '-'}</td>
                    <td className={user.is_admin ? styles['role-admin'] : styles['role-user']}>
                      {user.is_admin ? 'Administrateur' : 'Utilisateur'}
                    </td>
                    <td className="action-buttons">
                      <button 
                        className="btn btn-sm btn-info" 
                        onClick={() => handleEdit(user)}
                        title="Modifier cet utilisateur"
                      >
                        ✏️ Modifier
                      </button>
                      {loggedInUser.is_admin === 1 && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(user)}
                          title="Supprimer cet utilisateur"
                        >
                          🗑️ Supprimer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Message informatif pour les utilisateurs standards */}
          {loggedInUser.is_admin === 0 && (
            <div className="info-banner">
              <span className="info-icon">ℹ️</span>
              <p>Vous visualisez uniquement vos informations personnelles. Seul un administrateur peut voir la liste complète des utilisateurs.</p>
            </div>
          )}
        </>
      )}

      <style>{`
        .container.py-3 {
          padding: 2rem;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .page-header h2 {
          margin: 0;
          color: #2c3e50;
          font-size: 1.8rem;
        }

        .header-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.95rem;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-secondary:hover {
          background: #7f8c8d;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.85rem;
        }

        .loading-container, .error-container {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .loading-spinner {
          display: inline-block;
          width: 40px;
          height: 40px;
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-text {
          color: #e74c3c;
          margin-bottom: 1rem;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .empty-state p {
          color: #7f8c8d;
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }

        .table-responsive {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        /* ✅ Bannière informative pour utilisateurs standards */
        .info-banner {
          margin-top: 2rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(52, 152, 219, 0.1) 0%, rgba(41, 128, 185, 0.1) 100%);
          border-radius: 12px;
          border-left: 4px solid #3498db;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .info-icon {
          font-size: 1.5rem;
          color: #3498db;
        }

        .info-banner p {
          margin: 0;
          color: #2c3e50;
          font-size: 0.95rem;
          line-height: 1.5;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .header-actions {
            width: 100%;
          }

          .header-actions .btn {
            flex: 1;
          }

          .info-banner {
            flex-direction: column;
            text-align: center;
          }
        }
      `}</style>
    </div>
  );
};

export default UserList;
