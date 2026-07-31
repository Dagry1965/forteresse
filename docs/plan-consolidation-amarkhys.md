# Plan de consolidation AMARKHYS

## Point de depart

- Date : 2026-07-31
- Branche active : `feature/shadcn-v2-development`
- Commit de reference : 9acde0b - docs: add AMARKHYS tester user guide
- Branche production protegee : `rollback-shadcn-v1`
- Build backend : OK
- Build frontend : OK
- Schema Prisma : valide
- Sauvegarde locale : `apps/backend/prisma/dev.before-consolidation-20260731.db`
- Taille de la sauvegarde : 630784 octets
- Migrations existantes : 24

## Regles d execution

Chaque lot suit ce cycle :

1. Inspecter
2. Definir le comportement attendu
3. Modifier
4. Formater
5. Compiler
6. Tester
7. Verifier Git
8. Committer
9. Pousser
10. Valider sur Railway developpement

La production ne doit pas etre modifiee directement.

## Lots planifies

### LOT 0 - Point de depart et documentation

Statut : EN COURS

Objectifs :

- verifier Git et les branches ;
- valider les builds ;
- valider Prisma ;
- inventorier les migrations ;
- sauvegarder la base locale ;
- inventorier les tests ;
- creer ce document de suivi.

### LOT 1 - Utilisateur connecte obligatoire

Objectifs :

- supprimer les utilisateurs de remplacement ;
- transmettre l auteur reel aux rendez-vous, devis, factures, paiements, mouvements de stock et operations atelier ;
- refuser toute operation sensible sans identite valide.

### LOT 2 - Filtres deleted_at

Objectifs :

- uniformiser l exclusion des entites archivees ;
- corriger les listes, recherches, controles de doublons et protections de suppression.

### LOT 3 - Gouvernance des statuts

Objectifs :

- centraliser les transitions autorisees ;
- refuser les statuts arbitraires ;
- synchroniser rendez-vous, dossiers, interventions, devis et factures.

### LOT 4 - Numerotation centralisee

Objectifs :

- utiliser exclusivement SequencingService ;
- harmoniser DEV, FAC, AV, CMD, REC, INV et DOS ;
- supprimer Date.now() et les numeros aleatoires ;
- ajouter les contraintes d unicite necessaires.

### LOT 5 - Facturation unifiee

Objectifs :

- unifier facture directe, devis vers facture et facture flotte ;
- empecher les doublons ;
- creer les lignes, snapshots, echeanciers et traces d audit.

### LOT 6 - Verrouillage des documents

Objectifs :

- verrouiller devis acceptes et factures emises ;
- interdire les suppressions physiques ;
- ajouter annulation et avoir.

### LOT 7 - Retours et tracabilite du stock

Objectifs :

- securiser les consommations et retours atelier ;
- lier chaque mouvement a sa cause ;
- empecher les stocks negatifs ;
- conserver l historique des pieces retirees.

### LOT 8 - Lignes de devis

Objectifs :

- generer les lignes de pieces, main-d oeuvre, services, forfaits et remises ;
- recalculer les totaux depuis les lignes ;
- recopier les lignes vers les factures.

### LOT 9 - Main-d oeuvre atelier

Objectifs :

- ajouter mecanicien, temps prevu, temps reel, tarif horaire, priorite, diagnostic et controle qualite.

### LOT 10 - Rendez-vous et creneaux

Objectifs :

- unifier le systeme de creneaux ;
- fiabiliser la capacite ;
- corriger suppression, restauration, changement de statut et fuseau horaire.

### LOT 11 - Clients et vehicules

Objectifs :

- normaliser emails, telephones, immatriculations et VIN ;
- empecher les doublons ;
- securiser archivage et restauration ;
- conserver l historique.

### LOT 12 - Paiements et caisse

Objectifs :

- normaliser les moyens de paiement ;
- ajouter annulation et remboursement ;
- creer ouverture, cloture et ecart de caisse.

### LOT 13 - Roles et permissions

Objectifs :

- ajouter les roles reception, atelier, mecanicien, stock, caisse, comptabilite et lecture ;
- proteger chaque action selon le role.

### LOT 14 - Securite technique

Objectifs :

- limiter CORS ;
- renforcer la connexion ;
- integrer les refresh tokens ;
- journaliser les operations sensibles ;
- separer administrateur garage et administrateur systeme.

### LOT 15 - Decimal financier

Objectifs :

- remplacer progressivement les Float financiers par Decimal ;
- adapter services, DTO, migrations et frontend ;
- tester arrondis et TVA.

### LOT 16 - Nettoyage et tests complets

Objectifs :

- supprimer le code mort, les BOM et les `any` critiques ;
- mettre en place Jest et Supertest ;
- ajouter les scenarios E2E metier ;
- valider la restauration et la separation multi-workspace.

## Risques prioritaires

1. references documentaires non uniformes ;
2. auteur reel absent dans certains flux ;
3. transitions de statut non controlees ;
4. suppressions physiques de donnees comptables ;
5. stock potentiellement desynchronise ;
6. facturation concurrente et doublons ;
7. montants financiers en Float ;
8. permissions trop larges ;
9. systemes de creneaux concurrents ;
10. couverture de tests insuffisante.

## Journal d avancement

### 2026-07-31

- branche et depot propres ;
- commit de reference confirme ;
- backend compile ;
- frontend compile ;
- schema Prisma valide ;
- migrations inventoriees ;
- sauvegarde locale creee et ignoree par Git ;
- infrastructure de tests jugee insuffisante ;
- document de pilotage initialise.
