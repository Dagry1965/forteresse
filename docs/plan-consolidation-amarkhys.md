# Plan de consolidation AMARKHYS

## Point de depart

- Date de derniere mise a jour : 2026-08-02
- Branche active : `feature/shadcn-v2-development`
- Commit de reference : ede8d92 - feat(billing): unify invoice creation flows
- Branche production protegee : `rollback-shadcn-v1`
- Build backend : OK
- Build frontend : OK
- Schema Prisma : valide
- Sauvegarde locale : `apps/backend/prisma/dev.before-consolidation-20260731.db`
- Taille de la sauvegarde : 630784 octets
- Migrations existantes : 26

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

Statut : TERMINE

Objectifs :

- verifier Git et les branches ;
- valider les builds ;
- valider Prisma ;
- inventorier les migrations ;
- sauvegarder la base locale ;
- inventorier les tests ;
- creer ce document de suivi.

### LOT 1 - Utilisateur connecte obligatoire

Statut : TERMINE

Objectifs :

- supprimer les utilisateurs de remplacement ;
- transmettre l auteur reel aux rendez-vous, devis, factures, paiements, mouvements de stock et operations atelier ;
- refuser toute operation sensible sans identite valide.

### LOT 2 - Filtres deleted_at

Statut : TERMINE

Objectifs :

- uniformiser l exclusion des entites archivees ;
- corriger les listes, recherches, controles de doublons et protections de suppression.

### LOT 3 - Gouvernance des statuts

Statut : TERMINE

Commit : `59b83e2` - feat(workflow): govern and centralize status transitions

Objectifs :

- centraliser les transitions autorisees ;
- refuser les statuts arbitraires ;
- synchroniser rendez-vous, dossiers, interventions, devis et factures.

### LOT 4 - Numerotation centralisee

Statut : TERMINE

Commit : `da4dd5e` - feat(numbering): centralize document references

Objectifs :

- utiliser exclusivement SequencingService ;
- harmoniser DEV, FAC, AV, CMD, REC, INV et DOS ;
- supprimer Date.now() et les numeros aleatoires ;
- ajouter les contraintes d unicite necessaires.

### LOT 5 - Facturation unifiee

Statut : TERMINE

Commit : `ede8d92` - feat(billing): unify invoice creation flows

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

### 2026-08-01

- suppression du fallback utilisateur sur la creation des rendez-vous ;
- identite authentifiee obligatoire pour les paiements directs et les paiements d echeance ;
- suppression du fallback vers le premier utilisateur du workspace ;
- identite authentifiee obligatoire pour les factures groupees ;
- validation de l utilisateur actif dans le workspace pour les paiements et factures ;
- generation de facture depuis devis rattachee a l utilisateur authentifie ;
- build backend valide apres modifications ;
- fichier DTO orphelin create-public-appointment.dto.ts conserve pour le LOT 16.

### 2026-08-01 - LOT 2

- exclusion uniforme des clients et vehicules archives dans les listes et lectures detaillees ;
- rendez-vous refuses lorsque le client, le vehicule ou le creneau est archive ;
- devis et factures archives exclus des listes, lectures, conversions et controles de doublons ;
- factures groupees et flotte limitees aux rendez-vous et devis actifs ;
- commandes fournisseurs archivees exclues des listes, lectures et changements de statut ;
- articles de stock archives refuses lors de la creation de commandes ;
- receptions liees a une commande archivee exclues des lectures ;
- paiements archives et factures archivees exclus des rapports de caisse et calculs actifs ;
- echeances liees a une facture archivee exclues des encaissements et relances ;
- rapports de consommation limites aux interventions actives ;
- build backend valide apres modifications.

### 2026-08-01 - LOT 3

- transitions de statuts centralisees et gouvernees ;
- statuts arbitraires refuses dans les flux metier ;
- rendez-vous, dossiers, interventions, devis et factures alignes sur les constantes metier ;
- build backend et frontend valides ;
- commit pousse : `59b83e2`.

### 2026-08-01 - LOT 4

- numerotation documentaire centralisee dans SequencingService ;
- prefixes harmonises : FAC, DEV, CMD, DOS, REC, INV et AV ;
- anciennes generations aleatoires ou basees sur Date.now() retirees des flux traites ;
- contraintes d unicite documentaires conservees ou ajoutees ;
- build backend et frontend valides ;
- commit pousse : `da4dd5e`.

### 2026-08-02 - LOT 5

- AuditService remplace par une ecriture reelle dans AuditLog ;
- utilisateur authentifie obligatoire lors de la conversion devis vers facture ;
- facture creee avec user_id, created_by et updated_by ;
- lignes de devis, snapshots client et echeancier recopies dans la facture ;
- trace d audit creee dans la meme transaction que la facture ;
- ancienne route Finance conservee par delegation vers ProformasService ;
- ancienne logique de facture flotte inutilisee supprimee ;
- factures flotte groupees completees avec auteurs et audit transactionnel ;
- contrainte unique ajoutee sur Invoice(workspace_id, proforma_id) ;
- migration `20260802061645_unique_invoice_per_proforma` creee et appliquee ;
- schema Prisma synchronise avec 26 migrations ;
- build backend valide ;
- build frontend valide ;
- git diff --check valide, hors avertissement LF/CRLF Windows ;
- commit pousse : `ede8d92`.

