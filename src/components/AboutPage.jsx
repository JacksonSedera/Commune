import React from 'react';
import '../styles/AboutPage.css';

const AboutPage = ({ setActiveView }) => {
  return (
    <div className="container py-3">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">À propos de notre application</h2>
        <button className="btn btn-secondary" onClick={() => setActiveView(null)}>
          ← Retour au Dashboard
        </button>
      </div>

      <div className="marquee-container mb-4">
        <div className="marquee-content">
          <h3 className="marquee-text">DELIBERATION APP - Gestion des lettres de délibération</h3>
        </div>
      </div>

      <div className="row">
        <div className="col-md-8 mx-auto">
          <div className="card shadow">
            <div className="card-body">
              <h4 className="card-title">Notre mission</h4>
              <p className="card-text">
                Notre application web a été conçue pour simplifier et digitaliser le processus de création, 
                gestion et suivi des lettres de délibération au sein des administrations municipales.
              </p>
              
              <h4 className="card-title mt-4">Fonctionnalités principales</h4>
              <ul>
                <li>Création et édition de lettres de délibération</li>
                <li>Gestion des utilisateurs et des permissions</li>
                <li>Génération automatique de PDF</li>
                <li>Historique et suivi des délibérations</li>
                <li>Interface intuitive et sécurisée</li>
              </ul>
              
              <h4 className="card-title mt-4">Avantages de la solution</h4>
              <ul>
                <li>Gain de temps dans la rédaction des documents</li>
                <li>Réduction des erreurs de saisie</li>
                <li>Archivage numérique sécurisé</li>
                <li>Accès rapide aux délibérations antérieures</li>
                <li>Respect des formats officiels</li>
              </ul>
              
              <h4 className="card-title mt-4">Contact</h4>
              <p className="card-text">
                Pour toute question ou support technique, veuillez contacter notre équipe à 
                la <strong>porte 006 (Service Informatique)</strong> de la <strong>COMMUNE URBAINE DE MAHAJANGA</strong>
              </p>
              
              <div className="info-box mt-4">
                <h5>Informations pratiques</h5>
                <p><strong>Horaires :</strong> Lundi - Vendredi, 8h00 - 16h00</p>
                <p><strong>Support :</strong> support.deliberation@mahajanga.mg</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;