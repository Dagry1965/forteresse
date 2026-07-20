# Procédure de restauration d’urgence AMARKHYS

## Objectif

Restaurer la base SQLite de production à partir d’une sauvegarde valide.

## Prérequis

- Accès administrateur à Railway
- Accès au dossier Google Drive `AMARKHYS Backups`
- Une sauvegarde `.db` récente
- Application placée en maintenance avant restauration

## 1. Choisir la sauvegarde

Télécharger depuis Google Drive la sauvegarde souhaitée.

Privilégier la sauvegarde la plus récente ayant le statut `SUCCESS` dans la page :

`/sauvegardes`

## 2. Vérifier la sauvegarde localement

Placer le fichier dans :

`apps/backend`

Puis exécuter depuis la racine du dépôt :

```powershell
pnpm --filter @app/backend run test:restore -- .\NOM_DU_FICHIER.db
Résultat attendu :

Restauration de test réussie.
Intégrité SQLite : OK
Tables trouvées : 32

Ne jamais restaurer une sauvegarde qui échoue à ce test.

3. Mettre l’application en maintenance

Avant toute restauration :

Empêcher les utilisateurs de modifier les données.
Arrêter temporairement le service backend Railway.
Vérifier qu’aucune sauvegarde ou écriture n’est en cours.
4. Conserver une copie de sécurité

Avant de remplacer la base actuelle, conserver une copie de :

/data/dev.db

Exemple de nom :

dev-before-restore-AAAA-MM-JJ-HH-MM.db

5. Restaurer la base

Remplacer le fichier Railway :

/data/dev.db

par la sauvegarde validée.

Le fichier restauré doit impérativement conserver le nom :

dev.db

6. Redémarrer le backend

Redémarrer le service AMARKHYS Backend.

Surveiller les logs et vérifier :

démarrage NestJS réussi
connexion Prisma réussie
aucune erreur SQLite
routes API correctement chargées
7. Vérifications fonctionnelles

Après redémarrage :

Se connecter avec un compte administrateur.
Vérifier le tableau de bord.
Ouvrir plusieurs modules critiques.
Vérifier quelques clients, véhicules, factures et interventions.
Vérifier la page /sauvegardes.
Lancer une nouvelle sauvegarde manuelle.
8. Retour arrière

En cas d’échec :

Arrêter à nouveau le backend.
Restaurer la copie dev-before-restore-...db.
Redémarrer le backend.
Vérifier les logs et les fonctions critiques.
Règles importantes
Ne jamais restaurer directement sans test local préalable.
Ne jamais écraser /data/dev.db sans copie de sécurité.
Ne jamais effectuer une restauration pendant que des utilisateurs travaillent.
Toujours noter la date, l’heure, le fichier utilisé et le résultat.