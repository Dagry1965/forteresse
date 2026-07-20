# AMARKHYS

Application ERP pour la gestion d’un garage automobile.

## Documentation

- [Procédure de restauration d’urgence](docs/restauration-urgence.md)
- [Journal des restaurations](docs/journal-restaurations.md)

## Sauvegardes

Le système comprend :

- une sauvegarde SQLite automatique quotidienne
- un envoi vers Google Drive
- un historique accessible aux administrateurs
- une sauvegarde manuelle depuis l’interface
- un contrôle d’intégrité SQLite
- un script local de test de restauration

## Test de restauration

Depuis la racine du dépôt :

```powershell
pnpm --filter @app/backend run test:restore -- .\NOM_DU_FICHIER.db```
