import React, { useState } from "react";
import { generateDeliberationPDF } from "../utils/generateDeliberationPDF";

const getImageDataUrl = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export default function ViewDeliberations({ setActiveView }) {
  const [year, setYear] = useState("");
  const [numero, setNumero] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [searching, setSearching] = useState(false);

  const handleSearch = async () => {
    setError("");
    setResult(null);
    
    if (!year || !numero) {
      setError("Veuillez entrer l'année et le numéro de délibération.");
      return;
    }

    setSearching(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Vous n'êtes pas authentifié. Veuillez vous connecter.");
        return;
      }

      const res = await fetch(`http://localhost:3001/api/deliberations?year=${year}&numero=${numero}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
      });

      const data = await res.json();
      
      if (data.success) {
        if (typeof data.deliberation.content === 'string') {
          try {
            data.deliberation.content = JSON.parse(data.deliberation.content);
          } catch (parseError) {
            console.error("Erreur lors du parsing du contenu JSON:", parseError);
          }
        }
        setResult(data.deliberation);
      } else {
        setError(data.message || 'Aucune délibération trouvée ou erreur serveur.');
      }
    } catch (err) {
      console.error("Erreur lors de la recherche :", err);
      setError("Erreur réseau ou serveur. Veuillez réessayer plus tard.");
    } finally {
      setSearching(false);
    }
  };

  const handleGeneratePDF = async () => {
    if (result && result.content) {
      setLoadingPdf(true);
      try {
        const repoblikaLogoDataUrl = await getImageDataUrl('/repoblika.PNG');
        const communeLogoDataUrl = await getImageDataUrl('/logo.png');
        
        const doc = generateDeliberationPDF(result.content, repoblikaLogoDataUrl, communeLogoDataUrl);
        const pdfBlob = doc.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');
      } catch (pdfError) {
        console.error("Erreur lors de la génération ou l'affichage du PDF:", pdfError);
        alert("Une erreur est survenue lors de la génération du PDF.");
      } finally {
        setLoadingPdf(false);
      }
    } else {
      alert("Aucune délibération à générer en PDF.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="view-deliberations-container">
      <div className="page-header">
        <h2>Consulter les délibérations</h2>
        <button className="btn btn-secondary" onClick={() => setActiveView(null)}>
          ← Retour au Dashboard
        </button>
      </div>

      <div className="search-card">
        <div className="search-header">
          <span className="search-icon">🔍</span>
          <h3>Rechercher une délibération</h3>
        </div>
        
        <div className="search-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Année</label>
              <input
                id="year"
                type="number"
                className="form-control"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: 2025"
                min="2000"
                max="2100"
              />
            </div>
            <div className="form-group">
              <label htmlFor="numero">Numéro de délibération</label>
              <input
                id="numero"
                type="text"
                className="form-control"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ex: 001"
              />
            </div>
            <div className="form-group button-group">
              <button 
                className="btn btn-primary btn-search" 
                onClick={handleSearch}
                disabled={searching}
              >
                {searching ? 'Recherche...' : 'Rechercher'}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠</span>
            {error}
          </div>
        )}
      </div>

      {result && (
        <div className="result-card">
          <div className="result-header">
            <span className="result-badge">Résultat de la recherche</span>
            <h3>Délibération N° {result.deliberation_number}</h3>
          </div>

          <div className="result-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Numéro</span>
                <span className="info-value highlight">{result.letter_number}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Année</span>
                <span className="info-value">{result.year}</span>
              </div>
              <div className="info-item full-width">
                <span className="info-label">Titre</span>
                <span className="info-value">{result.title || '-'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Numéro complet</span>
                <span className="info-value">{result.deliberation_number}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Statut</span>
                <span className={`status-badge ${result.status}`}>
                  {result.status === 'en_attente' ? 'En attente' : result.status}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Créée par</span>
                <span className="info-value">{result.created_by_username}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Date de création</span>
                <span className="info-value">
                  {new Date(result.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            </div>

            {result.content && (
              <div className="content-details">
                <h4>Détails de la délibération</h4>
                <div className="detail-grid">
                  {result.content.sessionDate && (
                    <div className="detail-item">
                      <span className="detail-label">Date de session</span>
                      <span className="detail-value">{result.content.sessionDate}</span>
                    </div>
                  )}
                  {result.content.exercice && (
                    <div className="detail-item">
                      <span className="detail-label">Exercice</span>
                      <span className="detail-value">{result.content.exercice}</span>
                    </div>
                  )}
                  {result.content.president && (
                    <div className="detail-item">
                      <span className="detail-label">Président</span>
                      <span className="detail-value">{result.content.president}</span>
                    </div>
                  )}
                  {result.content.rapporteur && (
                    <div className="detail-item">
                      <span className="detail-label">Rapporteur</span>
                      <span className="detail-value">{result.content.rapporteur}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="result-actions">
              <button 
                className="btn btn-success btn-generate"
                onClick={handleGeneratePDF}
                disabled={loadingPdf}
              >
                {loadingPdf ? 'Génération...' : '📄 Générer le PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .view-deliberations-container {
          padding: 2rem;
          max-width: 1000px;
          margin: 0 auto;
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
          font-weight: 600;
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

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
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

        .btn-success {
          background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
          color: white;
        }

        .btn-success:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
        }

        .search-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          margin-bottom: 2rem;
        }

        .search-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 1.5rem 2rem;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .search-icon {
          font-size: 2rem;
        }

        .search-header h3 {
          margin: 0;
          font-size: 1.3rem;
        }

        .search-form {
          padding: 2rem;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr auto;
          gap: 1.5rem;
          align-items: end;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-weight: 500;
          color: #34495e;
          font-size: 0.9rem;
        }

        .form-control {
          padding: 0.75rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .form-control:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .btn-search {
          padding: 0.75rem 2rem;
          font-weight: 600;
        }

        .alert {
          padding: 1rem;
          margin: 0 2rem 2rem;
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

        .alert-icon {
          font-size: 1.3rem;
        }

        .result-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          animation: fadeInUp 0.5s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .result-header {
          background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
          color: white;
          padding: 2rem;
          text-align: center;
        }

        .result-badge {
          display: inline-block;
          padding: 0.4rem 1rem;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
        }

        .result-header h3 {
          margin: 0;
          font-size: 1.8rem;
        }

        .result-content {
          padding: 2rem;
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
          margin-bottom: 2rem;
        }

        .info-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 1rem;
          background: #f8f9fa;
          border-radius: 8px;
          border-left: 3px solid #667eea;
        }

        .info-item.full-width {
          grid-column: 1 / -1;
        }

        .info-label {
          font-size: 0.85rem;
          color: #7f8c8d;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .info-value {
          color: #2c3e50;
          font-weight: 500;
          font-size: 1.1rem;
        }

        .info-value.highlight {
          color: #667eea;
          font-weight: 700;
          font-size: 1.3rem;
        }

        .status-badge {
          display: inline-block;
          padding: 0.4rem 1rem;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .status-badge.en_attente {
          background: #fff3cd;
          color: #856404;
        }

        .content-details {
          margin: 2rem 0;
          padding: 1.5rem;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .content-details h4 {
          margin: 0 0 1.5rem 0;
          color: #2c3e50;
          font-size: 1.2rem;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
        }

        .detail-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }

        .detail-label {
          font-size: 0.85rem;
          color: #7f8c8d;
          font-weight: 600;
        }

        .detail-value {
          color: #2c3e50;
          font-weight: 500;
        }

        .result-actions {
          display: flex;
          justify-content: center;
          margin-top: 2rem;
          padding-top: 2rem;
          border-top: 1px solid #e0e0e0;
        }

        .btn-generate {
          padding: 1rem 2.5rem;
          font-size: 1.1rem;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .view-deliberations-container {
            padding: 1rem;
          }

          .page-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .info-grid {
            grid-template-columns: 1fr;
          }

          .detail-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}