import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
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

const DeliberationList = ({ setActiveView, user }) => {
  const [deliberations, setDeliberations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchDeliberations();
  }, []);

  const fetchDeliberations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3001/letters', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDeliberations(response.data.letters);
      setLoading(false);
    } catch (error) {
      console.error('Erreur lors de la récupération des délibérations:', error);
      setLoading(false);
    }
  };

  const handleEdit = (deliberation) => {
    setActiveView('edit-deliberation', deliberation);
  };

  const handlePreview = async (deliberation) => {
    try {
      let formattedDeliberationContent = {};
      if (typeof deliberation.content === 'string') {
        try {
          formattedDeliberationContent = JSON.parse(deliberation.content);
        } catch (e) {
          console.error("Erreur lors du parsing du contenu de la délibération:", e);
          alert("Erreur lors de l'affichage de l'aperçu: Contenu invalide.");
          return;
        }
      } else {
        formattedDeliberationContent = deliberation.content;
      }

      const repoblikaLogoDataUrl = await getImageDataUrl('/repoblika.PNG');
      const communeLogoDataUrl = await getImageDataUrl('/logo.png');
      
      const doc = generateDeliberationPDF(formattedDeliberationContent, repoblikaLogoDataUrl, communeLogoDataUrl);
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (pdfError) {
      console.error("Erreur lors de la génération ou l'affichage du PDF:", pdfError);
      alert("Une erreur est survenue lors de la génération du PDF.");
    }
  };

  // Filtrer les délibérations selon le terme de recherche
  const filteredDeliberations = useMemo(() => {
    if (!searchTerm) return deliberations;

    const lowercasedSearch = searchTerm.toLowerCase();
    return deliberations.filter(delib => {
      return (
        delib.deliberation_number?.toLowerCase().includes(lowercasedSearch) ||
        delib.letter_number?.toString().toLowerCase().includes(lowercasedSearch) ||
        delib.year?.toString().includes(lowercasedSearch) ||
        delib.title?.toLowerCase().includes(lowercasedSearch) ||
        delib.created_by_username?.toLowerCase().includes(lowercasedSearch)
      );
    });
  }, [deliberations, searchTerm]);

  // Calculer les délibérations à afficher pour la page actuelle
  const paginatedDeliberations = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredDeliberations.slice(startIndex, endIndex);
  }, [filteredDeliberations, currentPage]);

  // Calculer le nombre total de pages
  const totalPages = Math.ceil(filteredDeliberations.length / itemsPerPage);

  // ✅ Vérifier si la pagination est nécessaire
  const showPagination = filteredDeliberations.length > itemsPerPage;

  // Réinitialiser à la page 1 quand on recherche
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ✅ Fonction pour générer les numéros de page intelligemment
  const getPageNumbers = () => {
    const pages = [];
    
    // Toujours afficher les premières pages
    for (let i = 1; i <= Math.min(5, totalPages); i++) {
      pages.push(i);
    }
    
    // Si on a plus de 5 pages, ajouter des pages clés
    if (totalPages > 5) {
      // Ajouter des points de suspension si nécessaire
      if (currentPage > 6) {
        pages.push('dots1');
      }
      
      // Ajouter les pages autour de la page courante
      if (currentPage > 5 && currentPage < totalPages - 4) {
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          if (!pages.includes(i)) {
            pages.push(i);
          }
        }
      }
      
      // Ajouter des pages clés (10, 20, 30...)
      [10, 20, 30, 40, 50].forEach(num => {
        if (num < totalPages && num > 5 && !pages.includes(num)) {
          pages.push(num);
        }
      });
      
      // Ajouter des points de suspension avant la dernière page
      if (currentPage < totalPages - 5) {
        pages.push('dots2');
      }
      
      // Toujours afficher la dernière page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }
    
    // Trier les pages (en ignorant les 'dots')
    return pages.sort((a, b) => {
      if (typeof a === 'string') return 1;
      if (typeof b === 'string') return -1;
      return a - b;
    });
  };

  if (loading) {
    return (
      <div className="container-delib">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des délibérations...</p>
        </div>
      </div>
    );
  }

  if (!loading && deliberations.length === 0) {
    return (
      <div className="container-delib">
        <div className="page-header">
          <h2>Liste des délibérations</h2>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <p>Aucune délibération trouvée pour le moment.</p>
          {user.is_admin === 1 && (
            <button className="btn btn-primary" onClick={() => setActiveView('create-deliberation')}>
              + Créer une délibération
            </button>
          )}
          <button className="btn btn-secondary" onClick={() => setActiveView(null)}>
            Retour au Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-delib">
      <div className="page-header">
        <h2>Liste des délibérations</h2>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => setActiveView(null)}>
            ← Retour au Dashboard
          </button>
          {user.is_admin === 1 && (
            <button className="btn btn-primary" onClick={() => setActiveView('create-deliberation')}>
              + Créer une délibération
            </button>
          )}
        </div>
      </div>

      {/* Barre de recherche */}
      <div className="search-bar-container">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Rechercher par numéro, année, titre, créateur..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              ✕
            </button>
          )}
        </div>
        <div className="search-info">
          {filteredDeliberations.length} délibération(s) trouvée(s)
          {searchTerm && ` pour "${searchTerm}"`}
        </div>
      </div>

      {filteredDeliberations.length === 0 ? (
        <div className="no-results">
          <p>Aucune délibération ne correspond à votre recherche.</p>
          <button className="btn btn-secondary" onClick={() => setSearchTerm('')}>
            Réinitialiser la recherche
          </button>
        </div>
      ) : (
        <>
          <div className="table-container">
            <table className="deliberation-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Année</th>
                  <th>Titre</th>
                  <th>Créé par</th>
                  <th>Date de création</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDeliberations.map(deliberation => (
                  <tr key={deliberation.id}>
                    <td><span className="badge-numero">{deliberation.deliberation_number}</span></td>
                    <td>{deliberation.year}</td>
                    <td className="title-cell" title={deliberation.title}>{deliberation.title || '-'}</td>
                    <td>{deliberation.created_by_username}</td>
                    <td>{new Date(deliberation.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="action-buttons">
                      {user.is_admin === 1 && (
                        <button className="btn btn-sm btn-edit" onClick={() => handleEdit(deliberation)}>
                          ✏️ Modifier
                        </button>
                      )}
                      <button className="btn btn-sm btn-preview" onClick={() => handlePreview(deliberation)}>
                        👁️ Aperçu
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ✅ Pagination - Affichée uniquement si plus de 10 délibérations */}
          {showPagination && (
            <div className="pagination-wrapper">
              <div className="pagination">
                <span className="page-display">Page {currentPage} of {totalPages}</span>
                
                <button
                  className="page-nav"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  «
                </button>

                {getPageNumbers().map((page, index) => {
                  if (typeof page === 'string') {
                    return <span key={page} className="page-dots">...</span>;
                  }
                  
                  return (
                    <button
                      key={page}
                      className={`page-number ${currentPage === page ? 'active' : ''}`}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  );
                })}

                <button
                  className="page-nav"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  »
                </button>

                <button
                  className="page-number"
                  onClick={() => handlePageChange(totalPages)}
                >
                  Last »
                </button>
              </div>
              
              <div className="pagination-info">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, filteredDeliberations.length)} sur {filteredDeliberations.length} délibération(s)
              </div>
            </div>
          )}

          {/* ✅ Message si moins de 10 délibérations */}
          {!showPagination && filteredDeliberations.length > 0 && (
            <div className="pagination-info">
              Affichage de {filteredDeliberations.length} délibération(s)
            </div>
          )}
        </>
      )}

      <style>{`
        .container-delib {
          padding: 2rem;
          max-width: 1400px;
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
          background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
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

        .btn-edit {
          background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
          color: white;
        }

        .btn-edit:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
        }

        .btn-preview {
          background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
          color: white;
        }

        .btn-preview:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
        }

        /* Barre de recherche */
        .search-bar-container {
          margin-bottom: 2rem;
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .search-bar {
          position: relative;
          display: flex;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .search-icon {
          position: absolute;
          left: 1rem;
          font-size: 1.2rem;
          color: #7f8c8d;
        }

        .search-input {
          width: 100%;
          padding: 0.9rem 1rem 0.9rem 3rem;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .clear-search {
          position: absolute;
          right: 1rem;
          background: #e74c3c;
          color: white;
          border: none;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .clear-search:hover {
          background: #c0392b;
          transform: scale(1.1);
        }

        .search-info {
          color: #7f8c8d;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .no-results {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .no-results p {
          color: #7f8c8d;
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }

        .loading-container {
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

        .empty-state {
          text-align: center;
          padding: 3rem;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .empty-icon {
          font-size: 4rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state p {
          color: #7f8c8d;
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
        }

        .empty-state .btn {
          margin: 0.5rem;
        }

        .table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          margin-bottom: 1.5rem;
        }

        .deliberation-table {
          width: 100%;
          border-collapse: collapse;
        }

        .deliberation-table thead {
          background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
          color: white;
        }

        .deliberation-table th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.85rem;
          letter-spacing: 0.5px;
        }

        .deliberation-table td {
          padding: 1rem;
          border-bottom: 1px solid #f0f0f0;
          vertical-align: middle;
        }

        .deliberation-table tbody tr {
          transition: all 0.3s ease;
        }

        .deliberation-table tbody tr:hover {
          background-color: rgba(102, 126, 234, 0.05);
          transform: scale(1.005);
        }

        .deliberation-table tbody tr:last-child td {
          border-bottom: none;
        }

        .badge-numero {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 0.3rem 0.8rem;
          border-radius: 20px;
          font-weight: 600;
          font-size: 0.85rem;
          display: inline-block;
        }

        .title-cell {
          max-width: 300px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-weight: 500;
          color: #2c3e50;
        }

        .action-buttons {
          display: flex;
          gap: 0.5rem;
          flex-wrap: wrap;
        }

        /* ✅ PAGINATION STYLE - Style amélioré */
        .pagination-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          margin: 2rem 0;
        }

        .pagination {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .page-display {
          background: white;
          border: 2px solid #cbd5e0;
          padding: 0.6rem 1.2rem;
          border-radius: 6px;
          font-size: 0.95rem;
          color: #718096;
          font-weight: 500;
          margin-right: 0.5rem;
        }

        .page-number {
          min-width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #cbd5e0;
          background: white;
          color: #4a5568;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .page-number:hover:not(.active) {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }

        .page-number.active {
          background: #2d3748;
          color: white;
          border-color: #2d3748;
          font-weight: 600;
        }

        .page-dots {
          min-width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #a0aec0;
          font-weight: bold;
          font-size: 1.2rem;
        }

        .page-nav {
          min-width: 45px;
          height: 45px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #cbd5e0;
          background: white;
          color: #4a5568;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
          padding: 0 0.8rem;
        }

        .page-nav:hover:not(:disabled) {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }

        .page-nav:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .pagination-info {
          text-align: center;
          color: #718096;
          font-size: 0.9rem;
          margin-top: 1rem;
        }

        @media (max-width: 1024px) {
          .deliberation-table {
            font-size: 0.9rem;
          }

          .deliberation-table th,
          .deliberation-table td {
            padding: 0.75rem;
          }
        }

        @media (max-width: 768px) {
          .container-delib {
            padding: 1rem;
          }

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

          .table-container {
            overflow-x: auto;
          }

          .deliberation-table {
            font-size: 0.85rem;
          }

          .title-cell {
            max-width: 150px;
          }

          .page-number,
          .page-nav,
          .page-dots {
            min-width: 38px;
            height: 38px;
            font-size: 0.9rem;
          }

          .page-display {
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  );
};

export default DeliberationList;
