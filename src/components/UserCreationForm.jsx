import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';

const UserCreationForm = ({ setActiveView, userToEdit }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    nom: '',
    prenom: '',
    email: '',
    phoneNumber: '',
    isAdmin: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [validationErrors, setValidationErrors] = useState({});

  // Récupérer l'utilisateur connecté pour vérifier s'il est admin
  const loggedInUser = JSON.parse(sessionStorage.getItem('user') || '{}');
  const isAdmin = loggedInUser.is_admin === 1;
  const isEditingSelf = userToEdit && userToEdit.id === loggedInUser.id;

  // ✅ Fonctions de validation
  const isTextOnly = (value) => /^[a-zA-ZÀ-ÿ\s\-']*$/.test(value);
  const isEmailValid = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isUsernameValid = (value) => /^[a-zA-Z0-9_-]+$/.test(value);
  const isNumericOnly = (value) => /^\d*$/.test(value);

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        username: userToEdit.username || '',
        password: '',
        confirmPassword: '',
        nom: userToEdit.nom || '',
        prenom: userToEdit.prenom || '',
        email: userToEdit.email || '',
        phoneNumber: userToEdit.phone_number || '',
        isAdmin: userToEdit.is_admin === 1,
      });
    } else {
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        nom: '',
        prenom: '',
        email: '',
        phoneNumber: '',
        isAdmin: false,
      });
    }
    setValidationErrors({});
  }, [userToEdit]);

  // ✅ Validation en temps réel
  const validateField = (name, value) => {
    const newErrors = { ...validationErrors };

    switch (name) {
      case 'username':
        if (value && !isUsernameValid(value)) {
          newErrors[name] = 'Lettres, chiffres, tirets et underscores uniquement';
        } else {
          delete newErrors[name];
        }
        break;

      case 'nom':
      case 'prenom':
        if (value && !isTextOnly(value)) {
          newErrors[name] = 'Lettres uniquement';
        } else {
          delete newErrors[name];
        }
        break;

      case 'email':
        if (value && !isEmailValid(value)) {
          newErrors[name] = 'Format email invalide';
        } else {
          delete newErrors[name];
        }
        break;

      case 'phoneNumber':
        if (value && !isNumericOnly(value)) {
          newErrors[name] = 'Chiffres uniquement';
        } else {
          delete newErrors[name];
        }
        break;

      case 'confirmPassword':
        if (value && value !== formData.password) {
          newErrors[name] = 'Les mots de passe ne correspondent pas';
        } else {
          delete newErrors[name];
        }
        break;

      default:
        break;
    }

    setValidationErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'roleAdmin') {
      setFormData((prevFormData) => ({
        ...prevFormData,
        isAdmin: checked,
      }));
    } else if (name === 'roleVisitor') {
      setFormData((prevFormData) => ({
        ...prevFormData,
        isAdmin: !checked,
      }));
    } else {
      const newValue = type === 'checkbox' ? checked : value;
      setFormData((prevFormData) => ({
        ...prevFormData,
        [name]: newValue,
      }));
      
      // ✅ Validation en temps réel
      validateField(name, newValue);
      
      // ✅ Si on modifie le mot de passe, revalider la confirmation
      if (name === 'password' && formData.confirmPassword) {
        const newErrors = { ...validationErrors };
        if (formData.confirmPassword !== newValue) {
          newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
        } else {
          delete newErrors.confirmPassword;
        }
        setValidationErrors(newErrors);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Vérifier les erreurs de validation
    if (Object.keys(validationErrors).length > 0) {
      setError('Veuillez corriger les erreurs de validation avant de soumettre.');
      return;
    }

    // Validation des champs requis pour création
    if (!userToEdit) {
      if (!formData.username || !formData.password || !formData.nom || !formData.prenom) {
        setError('Le nom d\'utilisateur, le mot de passe, le nom et le prénom sont requis.');
        return;
      }
    }

    // Vérification de correspondance des mots de passe
    if ((formData.password || formData.confirmPassword) && formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    // Confirmation si l'utilisateur change son nom d'utilisateur
    if (userToEdit && formData.username !== userToEdit.username) {
      const confirmMessage = isEditingSelf 
        ? `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de changer votre nom d'utilisateur :\n\nAncien : "${userToEdit.username}"\nNouveau : "${formData.username}"\n\n■ Vous devrez utiliser ce nouveau nom pour vous connecter la prochaine fois.\n\nVoulez-vous continuer ?`
        : `Vous allez modifier le nom d'utilisateur de cet utilisateur :\n\nAncien : "${userToEdit.username}"\nNouveau : "${formData.username}"\n\nCet utilisateur devra utiliser ce nouveau nom pour se connecter.\n\nContinuer ?`;
      
      const confirmed = window.confirm(confirmMessage);
      if (!confirmed) {
        return;
      }
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setError('Vous n\'êtes pas authentifié.');
      return;
    }

    try {
      let response;
      if (userToEdit) {
        // Mode édition
        const updateData = {
          username: formData.username,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
        };
        
        // Ajouter le mot de passe seulement s'il est fourni
        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password;
        }

        // Ajouter isAdmin seulement si l'utilisateur connecté est admin et ne modifie pas son propre profil
        if (isAdmin && !isEditingSelf) {
          updateData.isAdmin = formData.isAdmin;
        }
        
        response = await axios.put(
          `http://localhost:3001/users/${userToEdit.id}`, 
          updateData, 
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Mode création
        const createData = {
          username: formData.username,
          password: formData.password,
          nom: formData.nom,
          prenom: formData.prenom,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          isAdmin: formData.isAdmin,
        };
        
        response = await axios.post('http://localhost:3001/users', createData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
      }

      if (response.data.success) {
        setSuccess(response.data.message);
        
        // Si un nouveau token est retourné (nom d'utilisateur modifié), le mettre à jour
        if (response.data.newToken) {
          localStorage.setItem('token', response.data.newToken);
        }
        
        // Mettre à jour les données en session si l'utilisateur modifie son propre profil
        if (isEditingSelf) {
          const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}');
          const updatedUser = {
            ...currentUser,
            username: formData.username,
            nom: formData.nom,
            prenom: formData.prenom,
            email: formData.email,
          };
          sessionStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        if (!userToEdit) {
          // Réinitialiser le formulaire après création
          setFormData({
            username: '',
            password: '',
            confirmPassword: '',
            nom: '',
            prenom: '',
            email: '',
            phoneNumber: '',
            isAdmin: false,
          });
          setValidationErrors({});
        } else {
          // Rediriger vers la liste après modification
          setTimeout(() => setActiveView('list-users'), 1500);
        }
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      console.error(`Erreur lors de ${userToEdit ? 'la modification' : 'la création'} de l'utilisateur:`, err);
      
      let errorMessage = `Erreur lors de ${userToEdit ? 'la modification' : 'la création'} de l'utilisateur.`;
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="user-form-container">
      <div className="form-card">
        <div className="form-header">
          <h2>{userToEdit ? 'Modifier l\'utilisateur' : 'Créer un nouvel utilisateur'}</h2>
          <p className="form-subtitle">
            {userToEdit ? 'Modifiez les informations de l\'utilisateur' : 'Remplissez tous les champs requis'}
          </p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            {error}
          </div>
        )}
        
        {success && (
          <div className="alert alert-success">
            <span className="alert-icon">✓</span>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="user-form">
          <div className="form-section">
            <h3 className="section-title">Informations de connexion</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label htmlFor="username" className="required">Nom d'utilisateur</label>
                <input
                  type="text"
                  className={`form-control ${validationErrors.username ? 'error' : ''}`}
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
                  placeholder="Nom d'utilisateur"
                />
                {validationErrors.username && (
                  <span className="error-message">{validationErrors.username}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password" className={!userToEdit ? 'required' : ''}>
                  Mot de passe {userToEdit && '(laisser vide pour ne pas changer)'}
                </label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required={!userToEdit}
                  placeholder="••••••••"
                />
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className={!userToEdit ? 'required' : ''}>
                  Confirmer le mot de passe
                </label>
                <input
                  type="password"
                  className={`form-control ${validationErrors.confirmPassword ? 'error' : ''}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={!userToEdit}
                  placeholder="••••••••"
                />
                {validationErrors.confirmPassword && (
                  <span className="error-message">{validationErrors.confirmPassword}</span>
                )}
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Informations personnelles</h3>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="nom" className="required">Nom</label>
                <input
                  type="text"
                  className={`form-control ${validationErrors.nom ? 'error' : ''}`}
                  id="nom"
                  name="nom"
                  value={formData.nom}
                  onChange={handleChange}
                  required
                  placeholder="Nom de famille"
                />
                {validationErrors.nom && (
                  <span className="error-message">{validationErrors.nom}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="prenom" className="required">Prénom</label>
                <input
                  type="text"
                  className={`form-control ${validationErrors.prenom ? 'error' : ''}`}
                  id="prenom"
                  name="prenom"
                  value={formData.prenom}
                  onChange={handleChange}
                  required
                  placeholder="Prénom"
                />
                {validationErrors.prenom && (
                  <span className="error-message">{validationErrors.prenom}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  className={`form-control ${validationErrors.email ? 'error' : ''}`}
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="email@example.com"
                />
                {validationErrors.email && (
                  <span className="error-message">{validationErrors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="phoneNumber">Numéro de téléphone</label>
                <input
                  type="tel"
                  className={`form-control ${validationErrors.phoneNumber ? 'error' : ''}`}
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="032 XX XXX XX"
                />
                {validationErrors.phoneNumber && (
                  <span className="error-message">{validationErrors.phoneNumber}</span>
                )}
              </div>
            </div>
          </div>

          {/* Section Rôle - visible uniquement pour les admins créant/modifiant d'autres utilisateurs */}
          {isAdmin && (!userToEdit || !isEditingSelf) && (
            <div className="form-section">
              <h3 className="section-title">Rôle utilisateur</h3>
              <div className="role-selection">
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    checked={formData.isAdmin}
                    onChange={() => setFormData({...formData, isAdmin: true})}
                  />
                  <span className="role-card admin-role">
                    <span className="role-icon">👑</span>
                    <span className="role-name">Administrateur</span>
                    <span className="role-description">Accès complet au système</span>
                  </span>
                </label>
                
                <label className="role-option">
                  <input
                    type="radio"
                    name="role"
                    checked={!formData.isAdmin}
                    onChange={() => setFormData({...formData, isAdmin: false})}
                  />
                  <span className="role-card user-role">
                    <span className="role-icon">👤</span>
                    <span className="role-name">Utilisateur standard</span>
                    <span className="role-description">Accès limité en lecture</span>
                  </span>
                </label>
              </div>
            </div>
          )}

          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={Object.keys(validationErrors).length > 0}
            >
              {userToEdit ? 'Mettre à jour l\'utilisateur' : 'Créer l\'utilisateur'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setActiveView('list-users')}>
              Annuler
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .user-form-container {
          padding: 2rem;
          max-width: 900px;
          margin: 0 auto;
        }

        .form-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .form-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 2rem;
          text-align: center;
        }

        .form-header h2 {
          margin: 0 0 0.5rem 0;
          font-size: 1.8rem;
        }

        .form-subtitle {
          margin: 0;
          opacity: 0.9;
          font-size: 0.95rem;
        }

        .alert {
          padding: 1rem;
          margin: 1.5rem 1.5rem 0;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .alert-error {
          background-color: #fdecea;
          color: #e74c3c;
          border-left: 4px solid #e74c3c;
        }

        .alert-success {
          background-color: #d4edda;
          color: #27ae60;
          border-left: 4px solid #27ae60;
        }

        .alert-icon {
          font-size: 1.3rem;
        }

        .user-form {
          padding: 2rem;
        }

        .form-section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .section-title {
          color: #2c3e50;
          font-size: 1.2rem;
          margin: 0 0 1.5rem 0;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full-width {
          grid-column: 1 / -1;
        }

        .form-group label {
          font-weight: 500;
          color: #34495e;
          font-size: 0.9rem;
        }

        .form-group label.required::after {
          content: " *";
          color: #e74c3c;
        }

        .form-control {
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
          background: white;
        }

        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-control.error {
          border-color: #e74c3c !important;
          background-color: #fdecea;
        }

        .form-control.error:focus {
          box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1);
        }

        .error-message {
          color: #e74c3c;
          font-size: 0.85rem;
          font-weight: 500;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          gap: 0.3rem;
        }

        .error-message::before {
          content: "⚠";
          font-size: 1rem;
        }

        .role-selection {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .role-option {
          cursor: pointer;
        }

        .role-option input[type="radio"] {
          display: none;
        }

        .role-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 1.5rem;
          border: 2px solid #e0e0e0;
          border-radius: 12px;
          background: white;
          transition: all 0.3s ease;
          text-align: center;
        }

        .role-option input[type="radio"]:checked + .role-card {
          border-color: #667eea;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }

        .role-icon {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .role-name {
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 0.3rem;
          display: block;
        }

        .role-description {
          font-size: 0.85rem;
          color: #7f8c8d;
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #ecf0f1;
        }

        .btn {
          padding: 0.9rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-primary {
          background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
        }

        .btn-primary:disabled {
          background: #95a5a6;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-secondary {
          background: #95a5a6;
          color: white;
        }

        .btn-secondary:hover {
          background: #7f8c8d;
        }

        @media (max-width: 768px) {
          .user-form-container {
            padding: 1rem;
          }

          .form-header {
            padding: 1.5rem;
          }

          .form-header h2 {
            font-size: 1.5rem;
          }

          .user-form {
            padding: 1.5rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .role-selection {
            grid-template-columns: 1fr;
          }

          .form-actions {
            flex-direction: column;
          }

          .form-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default UserCreationForm;
