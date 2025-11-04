-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : dim. 21 sep. 2025 à 20:30
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `deliberation-letters`
--

-- --------------------------------------------------------

--
-- Structure de la table `letters`
--

CREATE TABLE `letters` (
  `id` int(11) NOT NULL,
  `created_by` int(11) NOT NULL,
  `letter_number` varchar(50) NOT NULL,
  `year` int(11) NOT NULL,
  `title` text NOT NULL,
  `deliberation_number` varchar(50) NOT NULL,
  `content` longtext NOT NULL,
  `status` enum('en_attente','approuvee') DEFAULT 'en_attente',
  `file_path` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sequence_number` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `letters`
--

INSERT INTO `letters` (`id`, `created_by`, `letter_number`, `year`, `title`, `deliberation_number`, `content`, `status`, `file_path`, `created_at`, `sequence_number`) VALUES
(1, 1, '038', 2025, 'Prise par les membres du Conseil Municipal', '038-25', '{\"numero\":\"038\",\"sessionDate\":\"26, 27 et 28 Mai 2025\",\"exercice\":\"18\",\"conseillersPresents\":[{\"nom\":\"RAKOTOJAOBELINA Haja Liva\",\"fonction\":\"Président\"},{\"nom\":\"RAKOTOARIVONY Raymond\",\"fonction\":\"Vice-Président\"},{\"nom\":\"RIVOARISON Jean Fidelis\",\"fonction\":\"Rapporteur\"},{\"nom\":\"LEGARNISSON Edmond\",\"fonction\":\"Rapporteur\"},{\"nom\":\"RANDRIAMANDROSO Benoit\",\"fonction\":\"Membre\"},{\"nom\":\"RANDRIANJAFY Sidonie Larrizi\",\"fonction\":\"Membre\"}],\"representes\":[{\"represente\":\"Mme ANDRIAMANANA Safy Gabrielle Emilie \",\"representant\":\"M.  RAKOTOJAOBELINA Haja Liva\"},{\"represente\":\"M.AZALY FAILAZA Cortijo Anjara \",\"representant\":\"Mme RANDRIANAMBININA Yvette Natcha\"}],\"lignesJuridiques\":[\"-Vu le Contrat-Programme entre l’Etat représenté par le Ministre de la Décentralisation et de l’Aménagement du Territoire d’une part et d’autre part la Commune Urbaine de Mahajanga représentée par le Maire ;\",\"-Vu la convocation n° 022-25/CU/MGA/CM du 22 Mai 2025 ;\",\"-Vu le Procès-verbal de la session ordinaire en date du 26, 27 et 28 Mai 2025 ;\",\"-Oui l’exposé de Monsieur le Président de séance et les discussions qui l’ont suivi\"],\"articles\":[\"Article premier. Décide d’approuver le contrat-programme conclu entre la République de\\nMadagascar, désignée ci-après « l’État », représentée par le Ministre de la Décentralisation et\\nde l’Aménagement du Territoire, et la Commune Urbaine de Mahajanga représentée par le\\nMaire , en vue de la mise en œuvre de la stratégie de développement urbain des principales\\nvilles secondaires, qui structurent le développement national, notamment les pôles urbains des\\nespaces de croissance. Le contrat-programme susmentionné est annexé à la présente\\ndélibération et en fait partie intégrante.\",\"Article 2. L’organe exécutif est chargé de la transmission au Représentant de l’État et de\\nl’exécution de la présente délibération;\\nDélibéré et adopté à Mahajanga les jour, mois et année ci-dessus avec la signature du registre\\npar tous les membres présents ;\\n\"],\"rapporteur\":\"RIVOARISOA Jean Fidelis\",\"president\":\"RAKOTOJAOBELINA Haja Liva\",\"presidentNom\":\"RAKOTOJAOBELINA Haja Liva\",\"date\":\"2025-09-11\",\"heure\":\"11\",\"convocation\":\"022-25/CU/MGA/CM\",\"dateConvocation\":\"2025-05-22\",\"voix\":\"19\",\"titreDeliberation\":\"Prise par les membres du Conseil Municipal\"}', 'en_attente', NULL, '2025-08-16 07:17:46', '18'),
(2, 1, '039', 2025, 'Prise par les membres du Conseil Municipal  de la Commune Urbaine de Mahajanga lors de la session extraordinaire', '039-25', '{\"numero\":\"039\",\"sessionDate\":\"26, 27 et 28 Mai 2025\",\"exercice\":\"18\",\"conseillersPresents\":[{\"nom\":\"RAKOTOJAOBELINA Haja Liva\",\"fonction\":\"Président\"},{\"nom\":\"RAKOTOARIVONY Raymond\",\"fonction\":\"Vice-Président\"},{\"nom\":\"RIVOARISON Jean Fidelis\",\"fonction\":\"Rapporteur\"},{\"nom\":\"LEGARNISSON Edmond\",\"fonction\":\"Rapporteur\"},{\"nom\":\"RANDRIAMANDROSO Benoit\",\"fonction\":\"Membre\"},{\"nom\":\"RANDRIANJAFY Sidonie Larrizi\",\"fonction\":\"Membre\"},{\"nom\":\"ALI TOIHIR Ibrahim\",\"fonction\":\"Membre\"},{\"nom\":\"BEN M ZE Soaleh\",\"fonction\":\"Membre\"},{\"nom\":\"HERISOLO ANDRIATSARAFARA Jean Arthur\",\"fonction\":\"Membre\"},{\"nom\":\"TOLY Anjara\",\"fonction\":\"Membre\"},{\"nom\":\"BARIJAONINA Ravelonirina Paulette \",\"fonction\":\"Membre\"},{\"nom\":\"RANDRIANAMBININA Yvette Natcha\",\"fonction\":\"Membre\"},{\"nom\":\"HOUMAD\",\"fonction\":\"Membre\"},{\"nom\":\"RANDRIAMANARINA Nanahary Niaina Ravoniombonana\",\"fonction\":\"Membre\"}],\"representes\":[{\"represente\":\"Mme ANDRIAMANANA Safy Gabrielle Emilie\",\"representant\":\"M. RAKOTOJAOBELINA Haja Liva\"},{\"represente\":\"M.AZALY FAILAZA Cortijo Anjara\",\"representant\":\"Mme RANDRIANAMBININA Yvette Natcha\"},{\"represente\":\"M. ENINJARA Guy Jacques Bertin\",\"representant\":\"M. LEDA Jasmin Andriamarolahy\"}],\"lignesJuridiques\":[\"-Vu le Contrat-Programme entre l’Etat représenté par le Ministre de la Décentralisation et de l’Aménagement du Territoire d’une part et d’autre part la Commune Urbaine de Mahajanga représentée par le Maire ;\",\"-Vu la convocation n° 022-25/CU/MGA/CM du 22 Mai 2025 ;\",\"-Vu le Procès-verbal de la session ordinaire en date du 26, 27 et 28 Mai 2025 ;\",\"-Oui l’exposé de Monsieur le Président de séance et les discussions qui l’ont suivi\"],\"articles\":[\"Décide d’approuver le contrat-programme conclu entre la République de\\nMadagascar, désignée ci-après « l’État », représentée par le Ministre de la Décentralisation et\\nde l’Aménagement du Territoire, et la Commune Urbaine de Mahajanga représentée par le\\nMaire , en vue de la mise en œuvre de la stratégie de développement urbain des principales\\nvilles secondaires, qui structurent le développement national, notamment les pôles urbains des\\nespaces de croissance. Le contrat-programme susmentionné est annexé à la présente\\ndélibération et en fait partie intégrante.\",\"L’organe exécutif est chargé de la transmission au Représentant de l’État et de\\nl’exécution de la présente délibération;\"],\"rapporteur\":\"RIVOARISOA Jean Fidelis\",\"president\":\"RAKOTOJAOBELINA Haja Liva\",\"presidentNom\":\"RAKOTOJAOBELINA Haja Liva\",\"date\":\"2025-09-18\",\"heure\":\"11\",\"convocation\":\"022-25/CU/MGA/CM\",\"dateConvocation\":\"2025-05-22\",\"voix\":\"19\",\"titreDeliberation\":\"Prise par les membres du Conseil Municipal  de la Commune Urbaine de Mahajanga lors de la session extraordinaire\"}', 'en_attente', NULL, '2025-08-23 06:15:36', '18'),
(5, 1, '040', 2025, 'Prise par les membres du Conseil Municipal', '040-25', '{\"numero\":\"040\",\"sessionDate\":\"26, 27 et 28 Mai 2025\",\"exercice\":\"18\",\"conseillersPresents\":[{\"nom\":\"KOTO\",\"fonction\":\"Président\"},{\"nom\":\"JEAN\",\"fonction\":\"Vice-président\"}],\"representes\":[{\"represente\":\"JULES\",\"representant\":\"JEAN\"}],\"lignesJuridiques\":[\"\"],\"articles\":[\"lgknmfjnjfdnxm\"],\"rapporteur\":\"RIVOARISOA Jean Fidelis\",\"president\":\"RAKOTOJAOBELINA Haja Liva\",\"presidentNom\":\"RAKOTOJAOBELINA Haja Liva\",\"date\":\"2025-09-19\",\"heure\":\"11\",\"convocation\":\"022-25/CU/MGA/CM\",\"dateConvocation\":\"2025-09-15\",\"voix\":\"19\",\"titreDeliberation\":\"Prise par les membres du Conseil Municipal\"}', 'en_attente', NULL, '2025-09-12 08:00:11', '18');

-- --------------------------------------------------------

--
-- Structure de la table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `nom` varchar(100) DEFAULT NULL,
  `prenom` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `is_admin` tinyint(1) DEFAULT 0 COMMENT '1=admin, 0=visiteur',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `phone_number` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Déchargement des données de la table `users`
--

INSERT INTO `users` (`id`, `username`, `password_hash`, `nom`, `prenom`, `email`, `is_admin`, `created_at`, `phone_number`) VALUES
(1, 'admin', '$2a$12$rwwuxCd6BpD4f.wRJ9GaEegMnlqPWBDMqeHDAJRwoBAnn4XtjuviO', 'RAZAFINDRAZAKA', 'Jakobsen German Sedera', 'jakobsonrazafindrazaka@gmail.com', 1, '2025-07-31 07:33:21', '0325083463'),
(2, 'visiteur', '$2b$12$tj4OoDkM06cGJsvJ.2WZM.9S5jJT0vYtcEjDlB81W/TWKLUXUh8Lm', 'ROMMY', 'Aldo', '', 0, '2025-09-01 13:30:24', NULL);

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `letters`
--
ALTER TABLE `letters`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UQ_year_deliberation_number` (`year`,`deliberation_number`),
  ADD KEY `created_by` (`created_by`);

--
-- Index pour la table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `letters`
--
ALTER TABLE `letters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `letters`
--
ALTER TABLE `letters`
  ADD CONSTRAINT `letters_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
