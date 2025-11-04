import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import "../styles/Login.css";

const Login = ({ setUser }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/login', {
        username: username.trim(),
        password
      });
      
      if (response.data.success) {
        const userData = {
          id: response.data.user.id,
          username: response.data.user.username,
          nom: response.data.user.nom || '',
          prenom: response.data.user.prenom || '',
          email: response.data.user.email || '',
          is_admin: response.data.user.is_admin || 0
        };
        
        setUser(userData);
        localStorage.setItem('token', response.data.token);
        sessionStorage.setItem('user', JSON.stringify(userData));
        navigate('/dashboard');
      } else {
        setError(response.data.message || 'Identifiants incorrects');
      }
    } catch (err) {
      let errorMessage = 'Erreur de connexion';
      
      if (err.response) {
        if (err.response.status === 401) {
          errorMessage = 'Identifiants incorrects';
        } else if (err.response.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
        } else if (err.response.data?.message) {
          errorMessage = err.response.data.message;
        }
      } else if (err.request) {
        errorMessage = 'Impossible de contacter le serveur.';
      }
      
      setError(errorMessage);
      console.error('Erreur login:', err);
    } finally {
      setIsLoading(false);
    }
  }, [username, password, setUser, navigate]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword(prev => !prev);
  }, []);

  return (
    <div className="login-wrapper">
      <div className="login-container">
        <img src="/logo.png" alt="Logo Commune" className="commune-logo" />
        
        <p className="login-subtitle"><h2>Système de gestion des délibérations</h2></p>
        <h2>Connexion</h2>
        
        {error && (
          <div className="error-message" role="alert">
            <span className="error-icon">⚠</span>
            {error}
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="username">Nom d'utilisateur</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Entrez votre nom d'utilisateur"
            required
            autoFocus
            autoComplete="username"
            disabled={isLoading}
          />
        </div>
        
        <div className="form-group password-group">
          <label htmlFor="password">Mot de passe</label>
          <div className="password-input-container">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              required
              autoComplete="current-password"
              disabled={isLoading}
            />
            <button
              type="button"
              className="password-toggle-icon"
              onClick={togglePasswordVisibility}
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              disabled={isLoading}
            >
              {showPassword ? 'Masquer' : 'Afficher'}
            </button>
          </div>
        </div>
        
        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? 'Connexion...' : 'Se connecter'}
        </button>
      
        <div className="login-footer">
          <p>© 2025 Commune Urbaine de Mahajanga</p>
        </div>
      </div>
    </div>
  );
};

export default Login;