import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { generateDeliberationPDF } from "../utils/generateDeliberationPDF";

const INITIAL_FORM_STATE = {
  numero: "",
  sessionDate: "",
  exercice: "1",
  conseillersPresents: [{ nom: "", fonction: "" }],
  representes: [{ represente: "", representant: "" }],
  lignesJuridiques: [""],
  articles: [""],
  rapporteur: "",
  president: "",
  presidentNom: "",
  date: "",
  heure: "",
  convocation: "",
  dateConvocation: "",
  voixPour: "",
  voixContre: "",
  voixAbstention: "",
  titreDeliberation: "",
};

const FONCTIONS_OPTIONS = [
  { value: "", label: "Sélectionner une fonction" },
  { value: "Président", label: "Président" },
  { value: "Vice-président", label: "Vice-président" },
  { value: "Rapporteur", label: "Rapporteur" },
  { value: "Membre", label: "Membre" }
];

export default function DeliberationForm({ user = {}, setActiveView, deliberationToEdit }) {
  const navigate = useNavigate();
  const [form, setForm] = useState(INITIAL_FORM_STATE);
  const [repoblikaLogoDataUrl, setRepoblikaLogoDataUrl] = useState('');
  const [communeLogoDataUrl, setCommuneLogoDataUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [errors, setErrors] = useState({});

  // Validation helpers
  const isNumericOnly = (value) => /^\d*$/.test(value);
  const isTextOnly = (value) => /^[a-zA-ZÀ-ÿ\s\-']*$/.test(value);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'numero':
      case 'voixPour':
      case 'voixContre':
      case 'voixAbstention':
        if (value && !isNumericOnly(value)) {
          newErrors[name] = 'Chiffres uniquement';
        } else {
          delete newErrors[name];
        }
        break;
      
      case 'titreDeliberation':
      case 'president':
      case 'rapporteur':
      case 'presidentNom':
        if (value && !isTextOnly(value)) {
          newErrors[name] = 'Lettres uniquement';
        } else {
          delete newErrors[name];
        }
        break;
      
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    const checkAuth = () => {
      const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}');
      if (!user?.id && !storedUser?.id) {
        alert("Session expirée. Veuillez vous reconnecter.");
        navigate('/login');
      }
    };
    checkAuth();
  }, [user, navigate]);

  useEffect(() => {
    if (deliberationToEdit) {
      try {
        const content = JSON.parse(deliberationToEdit.content);
        setForm({
          ...content,
          numero: deliberationToEdit.letter_number || "",
          date: (deliberationToEdit.date || content.date) 
            ? new Date(deliberationToEdit.date || content.date).toISOString().split('T')[0] 
            : "",
          dateConvocation: content.dateConvocation 
            ? new Date(content.dateConvocation).toISOString().split('T')[0] 
            : "",
          titreDeliberation: deliberationToEdit.title || "",
          voixPour: content.voixPour || content.voix || "",
          voixContre: content.voixContre || "",
          voixAbstention: content.voixAbstention || "",
        });
      } catch (e) {
        console.error("Erreur lors du parsing:", e);
      }
    } else {
      setForm(INITIAL_FORM_STATE);
    }
  }, [deliberationToEdit]);

  useEffect(() => {
    const loadLogos = async () => {
      try {
        const loadImage = async (url) => {
          const response = await fetch(url);
          const blob = await response.blob();
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        };

        const [repoblika, commune] = await Promise.all([
          loadImage('/repoblika.PNG'),
          loadImage('/logo.png')
        ]);
        
        setRepoblikaLogoDataUrl(repoblika);
        setCommuneLogoDataUrl(commune);
      } catch (error) {
        console.error("Échec du chargement des logos:", error);
      }
    };

    loadLogos();
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    validateField(name, value);
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleAddConseillerPresent = useCallback(() => {
    setForm(prev => ({
      ...prev,
      conseillersPresents: [...prev.conseillersPresents, { nom: "", fonction: "" }]
    }));
  }, []);

  const handleDeleteConseillerPresent = useCallback((indexToDelete) => {
    setForm(prev => ({
      ...prev,
      conseillersPresents: prev.conseillersPresents.filter((_, i) => i !== indexToDelete)
    }));
  }, []);

  const handleChangeConseillerPresent = useCallback((i, field, value) => {
    if (field === 'nom') {
      const errorKey = `conseillerPresent_${i}_nom`;
      const newErrors = { ...errors };
      if (value && !isTextOnly(value)) {
        newErrors[errorKey] = 'Lettres uniquement';
      } else {
        delete newErrors[errorKey];
      }
      setErrors(newErrors);
    }

    setForm(prev => {
      const updated = [...prev.conseillersPresents];
      updated[i][field] = value;
      return { ...prev, conseillersPresents: updated };
    });
  }, [errors]);

  const handleAddRepresente = useCallback(() => {
    setForm(prev => ({
      ...prev,
      representes: [...prev.representes, { represente: "", representant: "" }]
    }));
  }, []);

  const handleDeleteRepresente = useCallback((indexToDelete) => {
    setForm(prev => ({
      ...prev,
      representes: prev.representes.filter((_, i) => i !== indexToDelete)
    }));
  }, []);

  const handleChangeRepresente = useCallback((i, field, value) => {
    const errorKey = `represente_${i}_${field}`;
    const newErrors = { ...errors };
    if (value && !isTextOnly(value)) {
      newErrors[errorKey] = 'Lettres uniquement';
    } else {
      delete newErrors[errorKey];
    }
    setErrors(newErrors);

    setForm(prev => {
      const updated = [...prev.representes];
      updated[i][field] = value;
      return { ...prev, representes: updated };
    });
  }, [errors]);

  const handleAddLigneJuridique = useCallback(() => {
    setForm(prev => ({
      ...prev,
      lignesJuridiques: [...prev.lignesJuridiques, ""]
    }));
  }, []);

  const handleDeleteLigneJuridique = useCallback((indexToDelete) => {
    setForm(prev => ({
      ...prev,
      lignesJuridiques: prev.lignesJuridiques.filter((_, i) => i !== indexToDelete)
    }));
  }, []);

  const handleChangeLigneJuridique = useCallback((i, value) => {
    setForm(prev => {
      const updated = [...prev.lignesJuridiques];
      updated[i] = value;
      return { ...prev, lignesJuridiques: updated };
    });
  }, []);

  const handleAddArticle = useCallback(() => {
    setForm(prev => ({
      ...prev,
      articles: [...prev.articles, ""]
    }));
  }, []);

  const handleDeleteArticle = useCallback((indexToDelete) => {
    setForm(prev => ({
      ...prev,
      articles: prev.articles.filter((_, i) => i !== indexToDelete)
    }));
  }, []);

  const handleChangeArticle = useCallback((i, value) => {
    setForm(prev => {
      const updated = [...prev.articles];
      updated[i] = value;
      return { ...prev, articles: updated };
    });
  }, []);

  // ✅ Fonction pour basculer l'aperçu
  const handleTogglePreview = () => {
    setShowPreview(!showPreview);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifier s'il y a des erreurs de validation
    if (Object.keys(errors).length > 0) {
      alert("Veuillez corriger les erreurs de validation avant de soumettre.");
      return;
    }

    const requiredFields = {
      numero: "Numéro de délibération",
      date: "Date de délibération",
      heure: "Heure",
      titreDeliberation: "Titre de la délibération"
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([key]) => !form[key])
      .map(([_, label]) => label);

    if (missingFields.length > 0) {
      alert(`Champs obligatoires manquants :\n${missingFields.join('\n')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = user?.id ? user : JSON.parse(sessionStorage.getItem('user'));
      if (!currentUser?.id) throw new Error("Utilisateur non authentifié");

      const year = new Date(form.date).getFullYear();
      const deliberation_number_full = `${form.numero}-${year.toString().slice(-2)}`;

      const payload = {
        created_by: currentUser.id,
        letter_number: form.numero,
        year: year,
        sequence_number: form.exercice,
        title: form.titreDeliberation,
        deliberation_number: deliberation_number_full,
        date: form.date,
        content: JSON.stringify(form),
        status: "en_attente"
      };

      const url = deliberationToEdit 
        ? `http://localhost:3001/letters/${deliberationToEdit.id}`
        : "http://localhost:3001/letters";
      
      const method = deliberationToEdit ? 'put' : 'post';

      const response = await axios[method](url, payload, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        const doc = generateDeliberationPDF(form, repoblikaLogoDataUrl, communeLogoDataUrl);
        doc.save(`Deliberation_${deliberation_number_full}.pdf`);
        
        alert(deliberationToEdit 
          ? "Lettre modifiée et PDF généré avec succès !" 
          : "Lettre enregistrée et PDF généré avec succès !");
        setActiveView('list-deliberations');
      }
    } catch (error) {
      console.error("Erreur:", error);
      
      if (error.response?.status === 401) {
        alert("Session expirée. Veuillez vous reconnecter.");
        navigate('/login');
        return;
      }

      const errorMessage = error.response?.data?.message || 
                         error.message || 
                         (deliberationToEdit ? "Erreur lors de la modification" : "Erreur lors de l'enregistrement");
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-header">
        <h2>{deliberationToEdit ? 'Modifier une délibération' : 'Création d\'une lettre de délibération'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="deliberation-form">
        {/* Titre de la délibération */}
        <div className="form-section">
          <div className="form-group full-width">
            <label className="required">Titre de la délibération</label>
            <input
              name="titreDeliberation"
              className={`form-control ${errors.titreDeliberation ? 'error' : ''}`}
              value={form.titreDeliberation}
              onChange={handleChange}
              placeholder="Entrez le titre de la délibération"
              required
            />
            {errors.titreDeliberation && <span className="error-message">{errors.titreDeliberation}</span>}
          </div>
        </div>

        {/* Informations de base */}
        <div className="form-section">
          <h3 className="section-title">Informations générales</h3>
          <div className="form-grid">
            <div className="form-group">
              <label className="required">Numéro de délibération</label>
              <input
                name="numero"
                className={`form-control ${errors.numero ? 'error' : ''}`}
                value={form.numero}
                onChange={handleChange}
                placeholder="Ex: 001"
                required
              />
              {errors.numero && <span className="error-message">{errors.numero}</span>}
            </div>
            <div className="form-group">
              <label>Date de session (texte)</label>
              <input
                name="sessionDate"
                className="form-control"
                value={form.sessionDate}
                onChange={handleChange}
                placeholder="Ex: Session extraordinaire"
              />
            </div>
            <div className="form-group">
              <label className="required">Date de la délibération</label>
              <input
                type="date"
                name="date"
                className="form-control"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="required">Heure</label>
              <input
                name="heure"
                className="form-control"
                value={form.heure}
                onChange={handleChange}
                placeholder="Ex: 10"
                required
              />
            </div>
            <div className="form-group">
              <label className="required">Numéro de convocation</label>
              <input
                name="convocation"
                className="form-control"
                value={form.convocation}
                onChange={handleChange}
                placeholder="Ex: 123"
                required
              />
            </div>
            <div className="form-group">
              <label className="required">Date de convocation</label>
              <input
                type="date"
                name="dateConvocation"
                className="form-control"
                value={form.dateConvocation}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group full-width">
              <label>Président (présidence de séance)</label>
              <input
                name="president"
                className={`form-control ${errors.president ? 'error' : ''}`}
                value={form.president}
                onChange={handleChange}
                placeholder="Nom du président de séance"
              />
              {errors.president && <span className="error-message">{errors.president}</span>}
            </div>
            <div className="form-group">
              <label>Nombre de conseillers en exercice</label>
              <input
                name="exercice"
                type="number"
                className="form-control"
                value={form.exercice}
                onChange={handleChange}
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Conseillers présents */}
        <div className="form-section">
          <h3 className="section-title">Conseillers présents</h3>
          {form.conseillersPresents.map((c, i) => (
            <div key={i} className="dynamic-field-group">
              <div className="form-grid">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Nom complet"
                    className={`form-control ${errors[`conseillerPresent_${i}_nom`] ? 'error' : ''}`}
                    value={c.nom}
                    onChange={(e) => handleChangeConseillerPresent(i, "nom", e.target.value)}
                  />
                  {errors[`conseillerPresent_${i}_nom`] && (
                    <span className="error-message">{errors[`conseillerPresent_${i}_nom`]}</span>
                  )}
                </div>
                <div className="form-group">
                  <select
                    className="form-control"
                    value={c.fonction}
                    onChange={(e) => handleChangeConseillerPresent(i, "fonction", e.target.value)}
                  >
                    {FONCTIONS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                className="btn-delete"
                onClick={() => handleDeleteConseillerPresent(i)}
                title="Supprimer ce conseiller"
              >
                🗑️
              </button>
            </div>
          ))}
          <button type="button" className="btn-add" onClick={handleAddConseillerPresent}>
            + Ajouter un conseiller
          </button>
        </div>

        {/* Conseillers représentés */}
        <div className="form-section">
          <h3 className="section-title">Conseillers représentés</h3>
          {form.representes.map((r, i) => (
            <div key={i} className="dynamic-field-group">
              <div className="form-grid">
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Nom représenté"
                    className={`form-control ${errors[`represente_${i}_represente`] ? 'error' : ''}`}
                    value={r.represente}
                    onChange={(e) => handleChangeRepresente(i, "represente", e.target.value)}
                  />
                  {errors[`represente_${i}_represente`] && (
                    <span className="error-message">{errors[`represente_${i}_represente`]}</span>
                  )}
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    placeholder="Représentant"
                    className={`form-control ${errors[`represente_${i}_representant`] ? 'error' : ''}`}
                    value={r.representant}
                    onChange={(e) => handleChangeRepresente(i, "representant", e.target.value)}
                  />
                  {errors[`represente_${i}_representant`] && (
                    <span className="error-message">{errors[`represente_${i}_representant`]}</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="btn-delete"
                onClick={() => handleDeleteRepresente(i)}
                title="Supprimer ce représenté"
              >
                🗑️
              </button>
            </div>
          ))}
          <button type="button" className="btn-add" onClick={handleAddRepresente}>
            + Ajouter un représenté
          </button>
        </div>

        {/* Lignes juridiques */}
        <div className="form-section">
          <h3 className="section-title">Lignes juridiques modifiables</h3>
          {form.lignesJuridiques.map((line, i) => (
            <div key={i} className="dynamic-field-group-simple">
              <input
                value={line}
                onChange={(e) => handleChangeLigneJuridique(i, e.target.value)}
                className="form-control"
                placeholder="-Vu la ..."
              />
              <button
                type="button"
                className="btn-delete-small"
                onClick={() => handleDeleteLigneJuridique(i)}
                title="Supprimer cette ligne"
              >
                🗑️
              </button>
            </div>
          ))}
          <button type="button" className="btn-add" onClick={handleAddLigneJuridique}>
            + Ajouter une ligne
          </button>
        </div>

        {/* Articles */}
        <div className="form-section">
          <h3 className="section-title">Articles</h3>
          {form.articles.map((a, i) => (
            <div key={i} className="dynamic-field-group-simple">
              <div className="form-group-full">
                <label>Article {i === 0 ? "premier" : i + 1}</label>
                <textarea
                  className="form-control"
                  value={a}
                  onChange={(e) => handleChangeArticle(i, e.target.value)}
                  placeholder={`Contenu de l'article ${i + 1}`}
                  rows="3"
                />
              </div>
              <button
                type="button"
                className="btn-delete-small"
                onClick={() => handleDeleteArticle(i)}
                title="Supprimer cet article"
              >
                🗑️
              </button>
            </div>
          ))}
          <button type="button" className="btn-add" onClick={handleAddArticle}>
            + Ajouter un article
          </button>
        </div>

        {/* Signataires */}
        <div className="form-section">
          <h3 className="section-title">Signataires</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>Rapporteur</label>
              <input
                name="rapporteur"
                className={`form-control ${errors.rapporteur ? 'error' : ''}`}
                value={form.rapporteur}
                onChange={handleChange}
                placeholder="Nom du rapporteur"
              />
              {errors.rapporteur && <span className="error-message">{errors.rapporteur}</span>}
            </div>
            <div className="form-group">
              <label>Nom du président (signature)</label>
              <input
                name="presidentNom"
                className={`form-control ${errors.presidentNom ? 'error' : ''}`}
                value={form.presidentNom}
                onChange={handleChange}
                placeholder="Nom du président"
              />
              {errors.presidentNom && <span className="error-message">{errors.presidentNom}</span>}
            </div>
          </div>
          
          <h4 className="subsection-title">Résultats du vote</h4>
          <div className="form-grid">
            <div className="form-group">
              <label>Voix POUR</label>
              <input
                name="voixPour"
                className={`form-control ${errors.voixPour ? 'error' : ''}`}
                value={form.voixPour}
                onChange={handleChange}
                placeholder="Ex: 25"
              />
              {errors.voixPour && <span className="error-message">{errors.voixPour}</span>}
            </div>
            <div className="form-group">
              <label>Voix CONTRE</label>
              <input
                name="voixContre"
                className={`form-control ${errors.voixContre ? 'error' : ''}`}
                value={form.voixContre}
                onChange={handleChange}
                placeholder="Ex: 2"
              />
              {errors.voixContre && <span className="error-message">{errors.voixContre}</span>}
            </div>
            <div className="form-group">
              <label>Voix ABSTENTION</label>
              <input
                name="voixAbstention"
                className={`form-control ${errors.voixAbstention ? 'error' : ''}`}
                value={form.voixAbstention}
                onChange={handleChange}
                placeholder="Ex: 1"
              />
              {errors.voixAbstention && <span className="error-message">{errors.voixAbstention}</span>}
            </div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="form-actions">
          <button
            type="button"
            className="btn-preview"
            onClick={handleShowPreview}
            disabled={!repoblikaLogoDataUrl || !communeLogoDataUrl}
          >
            👁️ Voir l'aperçu PDF
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={isSubmitting || Object.keys(errors).length > 0}
          >
            {isSubmitting ? "Traitement..." : (deliberationToEdit ? "Mettre à jour" : "Générer le PDF")}
          </button>
          <button
            type="button"
            className="btn-cancel"
            onClick={() => setActiveView('list-deliberations')}
          >
            Annuler
          </button>
        </div>
      </form>

      <style>{`
        .form-container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          padding: 2rem;
        }

        .form-header h2 {
          color: #2c3e50;
          margin-bottom: 2rem;
          font-size: 1.8rem;
          text-align: center;
        }

        .deliberation-form {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .form-section {
          background: #f8f9fa;
          padding: 1.5rem;
          border-radius: 8px;
          border-left: 4px solid #667eea;
        }

        .section-title {
          color: #2c3e50;
          font-size: 1.2rem;
          margin-bottom: 1.5rem;
          font-weight: 600;
        }

        .subsection-title {
          color: #2c3e50;
          font-size: 1rem;
          margin: 1.5rem 0 1rem 0;
          font-weight: 600;
        }

        .form-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
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
          border-radius: 6px;
          font-size: 1rem;
          transition: all 0.3s ease;
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
        }

        textarea.form-control {
          resize: vertical;
          min-height: 80px;
        }

        .dynamic-field-group {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          margin-bottom: 1rem;
          padding: 1rem;
          background: white;
          border-radius: 6px;
        }

        .dynamic-field-group .form-grid {
          flex: 1;
        }

        .dynamic-field-group-simple {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .dynamic-field-group-simple .form-control {
          flex: 1;
        }

        .dynamic-field-group-simple .form-group-full {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .btn-delete {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          min-width: 50px;
        }

        .btn-delete:hover {
          background: #c0392b;
          transform: translateY(-2px);
        }

        .btn-delete-small {
          background: #e74c3c;
          color: white;
          border: none;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
        }

        .btn-delete-small:hover {
          background: #c0392b;
          transform: translateY(-2px);
        }

        .btn-add {
          background: #3498db;
          color: white;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .btn-add:hover {
          background: #2980b9;
          transform: translateY(-2px);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
          flex-wrap: wrap;
        }

        .btn-submit, .btn-preview, .btn-cancel {
          padding: 0.9rem 2rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-submit {
          background: linear-gradient(135deg, #27ae60 0%, #1e8449 100%);
          color: white;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(39, 174, 96, 0.3);
        }

        .btn-submit:disabled {
          background: #95a5a6;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-preview {
          background: linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%);
          color: white;
        }

        .btn-preview:hover:not(:disabled) {
          background: linear-gradient(135deg, #8e44ad 0%, #7d3c98 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(155, 89, 182, 0.3);
        }

        .btn-preview:disabled {
          background: #95a5a6;
          cursor: not-allowed;
          opacity: 0.6;
        }

        .btn-cancel {
          background: #95a5a6;
          color: white;
        }

        .btn-cancel:hover {
          background: #7f8c8d;
          transform: translateY(-2px);
        }

        @media (max-width: 768px) {
          .form-container {
            padding: 1rem;
          }

          .form-grid {
            grid-template-columns: 1fr;
          }

          .dynamic-field-group {
            flex-direction: column;
          }

          .dynamic-field-group-simple {
            flex-direction: column;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-submit, .btn-preview, .btn-cancel {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}