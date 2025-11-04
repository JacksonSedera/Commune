import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import db from './db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fileUpload from 'express-fileupload';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const app = express();

// Port fixé
const PORT = 3001;
const SECRET_KEY = 'ma_clef_secrete_super_longue_et_complexe';

// Configuration de __dirname pour les modules ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser.json());
app.use(fileUpload({ createParentPath: true }));

// Création du dossier uploads si inexistant
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware admin
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (!decoded.is_admin) {
      return res.status(403).json({ success: false, message: 'Accès refusé - admin requis' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
}

// Middleware pour vérifier uniquement l'authentification (pas besoin d'être admin)
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: 'Token manquant' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Token invalide ou expiré' });
  }
}

// ===== ROUTES AUTHENTIFICATION =====

// Connexion utilisateur
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [users] = await db.query(
      'SELECT id, username, password_hash, nom, prenom, email, is_admin FROM users WHERE username = ?',
      [username]
    );
    if (users.length === 0) return res.status(401).json({ success: false, message: 'Utilisateur non trouvé' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { id: user.id, username: user.username, is_admin: user.is_admin },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    res.json({ success: true, token, user });
  } catch (err) {
    console.error('Erreur login:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===== ROUTES UTILISATEURS =====

// GET tous les utilisateurs
app.get('/users', requireAuth, async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, nom, prenom, email, phone_number, is_admin, created_at FROM users');
    res.json({ success: true, users });
  } catch (err) {
    console.error('Erreur récupération utilisateurs:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// Création utilisateur (admin seulement)
app.post('/users', requireAdmin, async (req, res) => {
  const { username, password, nom, prenom, email, phoneNumber, isAdmin } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Nom d\'utilisateur et mot de passe sont requis.' });
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const [existingUsers] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsers.length > 0) {
      return res.status(409).json({ success: false, message: 'Ce nom d\'utilisateur existe déjà.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    
    // SÉCURITÉ : Seul un admin peut créer d'autres admins
    const modifyingUserIsAdmin = req.user.is_admin;
    let is_admin = 0;
    
    if (isAdmin === true || isAdmin === 1) {
      if (modifyingUserIsAdmin) {
        is_admin = 1;
        console.log(`✓ Admin ${req.user.id} crée un nouvel administrateur`);
      } else {
        console.log(`⚠️ Utilisateur non-admin ${req.user.id} a tenté de créer un admin - BLOQUÉ`);
        is_admin = 0;
      }
    }

    const [result] = await db.query(
      'INSERT INTO users (username, password_hash, nom, prenom, email, phone_number, is_admin) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, password_hash, nom, prenom, email, phoneNumber, is_admin]
    );

    console.log(`✓ Nouvel utilisateur créé (ID: ${result.insertId}, Admin: ${is_admin})`);

    res.status(201).json({ success: true, message: 'Utilisateur créé avec succès', userId: result.insertId });
  } catch (err) {
    console.error('Erreur création utilisateur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la création de l\'utilisateur.' });
  }
});

// UPDATE un utilisateur (authentifié requis, mais vérifications spéciales)
app.put('/users/:id', requireAuth, async (req, res) => {
  const userId = req.params.id;
  const { username, password, nom, prenom, email, phoneNumber, isAdmin } = req.body;

  try {
    // Récupérer l'utilisateur qui fait la modification
    const modifyingUserId = req.user.id;
    const modifyingUserIsAdmin = req.user.is_admin;

    // Vérifier si l'utilisateur modifie son propre profil
    const isEditingSelf = parseInt(userId) === parseInt(modifyingUserId);

    // SÉCURITÉ : Un utilisateur standard ne peut modifier que son propre profil
    if (!modifyingUserIsAdmin && !isEditingSelf) {
      return res.status(403).json({ 
        success: false, 
        message: 'Vous n\'avez pas les permissions pour modifier ce profil' 
      });
    }

    let updateFields = [];
    let updateValues = [];

    // NOUVEAU : Vérifier si le nom d'utilisateur change et s'il est déjà utilisé
    if (username) {
      // Récupérer le username actuel de l'utilisateur
      const [currentUserData] = await db.query('SELECT username FROM users WHERE id = ?', [userId]);
      const currentUsername = currentUserData[0]?.username;
      
      // Vérifier seulement si le username a réellement changé
      if (username !== currentUsername) {
        const [existingUsers] = await db.query(
          'SELECT id FROM users WHERE username = ? AND id != ?', 
          [username, userId]
        );
        
        if (existingUsers.length > 0) {
          return res.status(409).json({ 
            success: false, 
            message: 'Ce nom d\'utilisateur est déjà utilisé par un autre compte' 
          });
        }
        
        updateFields.push('username = ?');
        updateValues.push(username);
        console.log(`✓ Nom d'utilisateur modifié de "${currentUsername}" vers "${username}"`);
      }
    }

    // Vérifier si on veut changer le mot de passe
    if (password && password.trim() !== '') {
      const password_hash = await bcrypt.hash(password, 12);
      updateFields.push('password_hash = ?');
      updateValues.push(password_hash);
    }

    // Ajouter les autres champs
    updateFields.push('nom = ?, prenom = ?, email = ?, phone_number = ?');
    updateValues.push(nom, prenom, email, phoneNumber);

    // SÉCURITÉ CRITIQUE : Gestion du rôle isAdmin
    if (isAdmin !== undefined) {
      if (isEditingSelf) {
        // Un utilisateur ne peut JAMAIS modifier son propre rôle
        console.log(`⚠️ Tentative de modification de son propre rôle par l'utilisateur ${modifyingUserId} - BLOQUÉ`);
      } else {
        // Seul un admin peut modifier le rôle d'un autre utilisateur
        if (modifyingUserIsAdmin) {
          updateFields.push('is_admin = ?');
          updateValues.push(isAdmin ? 1 : 0);
          console.log(`✓ Admin ${modifyingUserId} a modifié le rôle de l'utilisateur ${userId}`);
        } else {
          return res.status(403).json({ 
            success: false, 
            message: 'Vous n\'avez pas les permissions pour modifier les rôles utilisateurs' 
          });
        }
      }
    }

    // Ajouter l'ID à la fin pour la clause WHERE
    updateValues.push(userId);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
    
    await db.query(query, updateValues);
    
    console.log(`✓ Utilisateur ${userId} modifié par ${modifyingUserId} (admin: ${modifyingUserIsAdmin})`);
    
    // Si l'utilisateur a modifié son propre nom d'utilisateur, mettre à jour le token
    let responseData = { success: true, message: 'Utilisateur modifié avec succès' };
    
    if (isEditingSelf && username) {
      const newToken = jwt.sign(
        { id: modifyingUserId, username: username, is_admin: modifyingUserIsAdmin },
        SECRET_KEY,
        { expiresIn: '1h' }
      );
      responseData.newToken = newToken;
      console.log(`✓ Nouveau token généré pour ${username}`);
    }
    
    res.json(responseData);
  } catch (err) {
    console.error('Erreur modification utilisateur:', err);
    let errorMessage = 'Erreur serveur lors de la modification';
    if (err.sqlMessage) {
      errorMessage = err.sqlMessage;
    } else if (err.message) {
      errorMessage = err.message;
    }
    res.status(500).json({ success: false, message: errorMessage });
  }
});

// DELETE un utilisateur (admin seulement)
app.delete('/users/:id', requireAdmin, async (req, res) => {
  const userId = req.params.id;
  const modifyingUserId = req.user.id;
  
  // Vérifier si l'utilisateur modifie son propre compte
  const isDeletingSelf = parseInt(userId) === parseInt(modifyingUserId);
  
  // SÉCURITÉ : Si c'est le dernier admin, empêcher la suppression
  if (isDeletingSelf) {
    try {
      const [admins] = await db.query('SELECT COUNT(*) as count FROM users WHERE is_admin = 1');
      const adminCount = admins[0].count;
      
      if (adminCount <= 1) {
        return res.status(403).json({ 
          success: false, 
          message: 'Impossible de supprimer le dernier administrateur du système' 
        });
      }
      
      console.log(`⚠️ Admin ${modifyingUserId} supprime son propre compte (${adminCount - 1} admin(s) restant(s))`);
    } catch (err) {
      console.error('Erreur vérification admins:', err);
      return res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
  }

  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Utilisateur non trouvé' });
    }
    
    if (isDeletingSelf) {
      console.log(`✓ Admin ${modifyingUserId} a supprimé son propre compte`);
    } else {
      console.log(`✓ Utilisateur ${userId} supprimé par l'admin ${modifyingUserId}`);
    }
    
    res.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (err) {
    console.error('Erreur suppression utilisateur:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// ===== ROUTES DÉLIBÉRATIONS =====

// GET toutes les lettres
app.get('/letters', requireAuth, async (req, res) => {
  try {
    const [letters] = await db.query(`
      SELECT l.*, u.username as created_by_username 
      FROM letters l
      JOIN users u ON l.created_by = u.id
      ORDER BY l.created_at DESC
    `);
    res.json({ success: true, letters });
  } catch (err) {
    console.error('Erreur DB:', err);
    res.status(500).json({ success: false, error: 'Erreur base de données' });
  }
});

// Création de lettre (admin seulement)
app.post('/letters', requireAdmin, async (req, res) => {
  console.log("Requête reçue pour /letters", req.body);

  const requiredFields = [
    'created_by',
    'letter_number', 
    'year',
    'title',
    'deliberation_number'
  ];
  
  const missingFields = requiredFields.filter(field => !req.body[field]);
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      success: false,
      message: `Champs obligatoires manquants: ${missingFields.join(', ')}`
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO letters 
       (created_by, letter_number, year, sequence_number, title, 
        deliberation_number, content, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.body.created_by,
        req.body.letter_number,
        req.body.year,
        req.body.sequence_number || "1",
        req.body.title,
        req.body.deliberation_number,
        req.body.content || JSON.stringify({}),
        req.body.status || "en_attente"
      ]
    );

    res.json({
      success: true,
      message: "Lettre enregistrée avec succès",
      letterId: result.insertId
    });
  } catch (err) {
    console.error("Erreur MySQL:", err);
    
    let errorMessage = "Erreur serveur";
    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
      errorMessage = "L'utilisateur spécifié n'existe pas";
    } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
      errorMessage = "Format de données incorrect";
    } else if (err.code === 'ER_DUP_ENTRY') {
      errorMessage = "Une lettre avec ce numéro existe déjà";
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: err.message
    });
  }
});

// UPDATE une lettre spécifique (admin seulement)
app.put('/letters/:id', requireAdmin, async (req, res) => {
  const letterId = req.params.id;
  const { 
    letter_number, 
    year, 
    sequence_number, 
    title, 
    deliberation_number, 
    content, 
    status 
  } = req.body;

  try {
    const [result] = await db.query(
      `UPDATE letters 
       SET letter_number = ?, year = ?, sequence_number = ?, title = ?, 
           deliberation_number = ?, content = ?, status = ?
       WHERE id = ?`,
      [
        letter_number,
        year,
        sequence_number,
        title,
        deliberation_number,
        content,
        status,
        letterId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Délibération non trouvée' });
    }

    res.json({ success: true, message: 'Délibération modifiée avec succès' });
  } catch (err) {
    console.error('Erreur modification délibération:', err);
    let errorMessage = 'Erreur serveur lors de la modification';
    if (err.sqlMessage) {
      errorMessage = err.sqlMessage;
    } else if (err.message) {
      errorMessage = err.message;
    }
    res.status(500).json({ success: false, message: errorMessage });
  }
});

// GET une lettre spécifique par année et numéro
app.get('/api/deliberations', requireAuth, async (req, res) => {
  const { year, numero } = req.query;

  if (!year || !numero) {
    return res.status(400).json({ success: false, message: 'Année et numéro de délibération sont requis' });
  }

  try {
    const [letters] = await db.query(
      `SELECT l.*, u.username as created_by_username 
       FROM letters l
       JOIN users u ON l.created_by = u.id
       WHERE l.year = ? AND l.letter_number = ?`,
      [year, numero]
    );

    if (letters.length === 0) {
      return res.status(404).json({ success: false, message: 'Délibération non trouvée' });
    }

    res.json({ success: true, deliberation: letters[0] });
  } catch (err) {
    console.error('Erreur lors de la recherche de la délibération:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur lors de la recherche' });
  }
});

// Lancement serveur
app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
});