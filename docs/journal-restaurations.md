# Journal des restaurations AMARKHYS

Ce document sert à consigner chaque test de restauration et chaque restauration réelle.

## Modèle d’entrée

### Date et heure

`AAAA-MM-JJ HH:MM`

### Type d’opération

- Test de restauration
- Restauration réelle
- Retour arrière

### Fichier utilisé

`dev-backup-auto-AAAA-MM-JJT-HH-MM-SS.db`

### Opérateur

Nom de la personne ayant réalisé l’opération.

### Environnement

- Local
- Préproduction
- Production

### Résultat

- Réussi
- Échoué
- Annulé

### Contrôles effectués

- Intégrité SQLite
- Nombre de tables
- Connexion administrateur
- Vérification des clients
- Vérification des véhicules
- Vérification des factures
- Vérification des interventions
- Nouvelle sauvegarde après restauration

### Remarques

Décrire ici les anomalies, décisions prises et actions complémentaires.

---

## Historique

### 2026-07-20 — Test de restauration

- Type : Test de restauration
- Fichier : `dev-backup-auto-2026-07-20T12-58-48-561Z.db`
- Environnement : Local
- Résultat : Réussi
- Intégrité SQLite : OK
- Tables trouvées : 32
- Remarques : Première validation réelle d’une sauvegarde Google Drive.