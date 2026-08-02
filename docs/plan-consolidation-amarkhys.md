# Plan de consolidation AMARKHYS

## Point de depart

- Date de derniere mise a jour : 2026-08-02
- Branche active : `feature/shadcn-v2-development`
- Commit de reference : 713a0fc - feat(inventory): trace stock movements and secure returns
- Branche production protegee : `rollback-shadcn-v1`
- Build backend : OK
- Build frontend : OK
- Schema Prisma : valide
- Sauvegarde locale : `apps/backend/prisma/dev.before-consolidation-20260731.db`
- Taille de la sauvegarde : 630784 octets
- Migrations existantes : 29

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

Statut : TERMINE

Objectifs :

- verrouiller devis acceptes et factures emises ;
- interdire les suppressions physiques ;
- ajouter annulation et avoir.

### LOT 7 - Retours et tracabilite du stock

Statut : TERMINE

Commit : `713a0fc` - feat(inventory): trace stock movements and secure returns

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

Statut : TERMINE

Commit : `fbd8b6e` - feat(scheduling): unify time slots and secure capacity

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
5. stock potentiellement desynchronise dans les flux non encore couverts ;
6. facturation concurrente et doublons dans les futurs flux ;
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
### 2026-08-02 - LOT 6

- anciennes methodes generiques de modification et suppression physique des factures retirees ;
- devis acceptes proteges contre la regeneration et la modification indirecte depuis l atelier ;
- annulation transactionnelle ajoutee pour les factures non encaissees ;
- annulation directe interdite pour les factures payees ou partiellement payees ;
- echeances en attente annulees avec la facture, sans effacer l historique des echeances payees ;
- type documentaire `CREDIT_NOTE` ajoute aux constantes partagees ;
- relation reflexive ajoutee entre la facture d origine et ses avoirs ;
- migration `20260802065938_add_invoice_credit_note_relation` creee et appliquee ;
- creation transactionnelle d avoir avec reference `AV`, total negatif et lignes negatives ;
- facture d origine annulee apres creation de l avoir ;
- second avoir interdit sur une meme facture ;
- routes `POST /invoices/:id/cancel` et `POST /invoices/:id/credit-note` ajoutees ;
- traces `CANCEL_INVOICE` et `CREATE_CREDIT_NOTE` validees dans AuditLog ;
- test d annulation valide sur `FAC-2026-00009` ;
- test d avoir valide sur `FAC-2026-00010` avec creation de `AV-2026-0001` ;
- schema Prisma synchronise avec 27 migrations ;
- build backend valide ;
- build frontend valide sur 52 pages ;
- git diff --check valide ;
- commit pousse : `243c30c`.

### 2026-08-02 - LOT 7

- utilisateur authentifie et actif rendu obligatoire pour les consommations et retours atelier ;
- mouvements `OUT_WORKSHOP` relies a leur `InterventionPart` et a leur auteur ;
- mouvements `IN_RETURN` utilises pour les retours de pieces atelier ;
- suppression physique des pieces remplacee par un soft delete avec `deleted_at` ;
- double retour d une meme piece bloque par le filtre `deleted_at: null` ;
- pieces retournees exclues des listes actives, details dossier et calculs de proforma ;
- mouvements `IN_PURCHASE` relies a leur `PurchaseReceipt` et a leur auteur ;
- relations `StockMovement.intervention_part_id` et `StockMovement.purchase_receipt_id` ajoutees ;
- migration `20260802073713_add_stock_movement_sources` creee et appliquee ;
- migration `20260802074409_add_intervention_part_soft_delete` creee et appliquee ;
- seed atelier et fournisseur adapte aux nouvelles relations de tracabilite ;
- nettoyage du seed adapte aux avoirs lies par `original_invoice_id` ;
- seed garage valide avec 109 interventions, 20 commandes fournisseurs et 25 articles ;
- controle en base valide : 220 mouvements `OUT_WORKSHOP` tous relies aux pieces et auteurs ;
- controle en base valide : 20 mouvements `IN_PURCHASE` tous relies aux receptions et auteurs ;
- schema Prisma synchronise avec 29 migrations ;
- build backend valide ;
- depot Git propre apres push ;
- commit pousse : `713a0fc`.

### 2026-08-02 - LOT 8

- types de lignes de devis `PART`, `LABOR`, `SERVICE`, `PACKAGE` et `DISCOUNT` ajoutes aux constantes partagees ;
- DTO de creation et de modification des lignes ajoutes avec validation des quantites, prix, TVA et remises ;
- routes `POST`, `PATCH` et `DELETE` ajoutees pour gerer les lignes de devis ;
- calcul des totaux de lignes centralise cote serveur ;
- remises appliquees avant TVA ;
- lignes de remise gerees avec un total negatif ;
- total du devis recalcule automatiquement apres ajout, modification ou suppression d une ligne ;
- lignes de devis incluses dans les lectures liste et detail ;
- modification des lignes reservee aux devis en statut `DRAFT` ;
- acceptation d un devis sans ligne interdite ;
- total recalcule juste avant l acceptation ;
- conversion devis vers facture validee avec copie des 5 lignes ;
- test d ajout valide avec une ligne `SERVICE` ;
- test de modification valide avec quantite, remise et TVA ;
- test de suppression valide avec retour au total initial ;
- test de verrouillage valide apres passage du devis en `ACCEPTED` ;
- facture `FAC-2026-0011` creee depuis `DEV-2026-00016` avec 5 lignes et un total de 683,65 ;
- build backend valide ;
- git diff --check valide ;
- depot Git propre apres push ;
- commit pousse : `e58b415`.

### 2026-08-02 - LOT 9

- relation entre `Intervention` et le mecanicien ajoutee via `mechanic_id` ;
- mecanicien limite a un utilisateur actif du meme workspace avec le role `MECHANIC` ;
- priorites `LOW`, `NORMAL`, `HIGH` et `URGENT` ajoutees ;
- statuts de controle qualite `PENDING`, `PASSED`, `FAILED` et `NOT_REQUIRED` ajoutes ;
- champs diagnostic, temps prevu, temps reel et tarif horaire ajoutes aux interventions ;
- notes et date de controle qualite ajoutees ;
- date du controle qualite renseignee automatiquement pour `PASSED` et `FAILED` ;
- DTO de creation et de modification enrichis avec validations ;
- creation et modification des interventions adaptees aux nouveaux champs ;
- mecanicien inclus dans les lectures liste, detail et modification ;
- seed principal enrichi avec des donnees atelier realistes ;
- migration `20260802085014_add_intervention_workshop_fields2` creee et appliquee ;
- validation Prisma reussie ;
- client Prisma regenere apres arret du backend ;
- test fonctionnel valide sur l intervention `cmsbibo5s01rgufk38nbf6e2d` ;
- mecanicien `Arturo Cormier` affecte avec priorite `HIGH` ;
- temps prevu de 180 minutes et temps reel de 135 minutes enregistres ;
- tarif horaire de 75 enregistre ;
- diagnostic et controle qualite `PASSED` persistes ;
- affectation d un utilisateur sans role `MECHANIC` correctement refusee ;
- build backend valide ;
- git diff --check valide ;
- depot Git propre apres push ;
- commit pousse : `63b4689`.

### 2026-08-02 - LOT 10

- systeme de creneaux unifie autour d un creneau unique par workspace, debut et fin ;
- contrainte unique ajoutee sur `TimeSlot(workspace_id, start, end)` ;
- doublons existants fusionnes avant application de la contrainte ;
- occupations de tous les creneaux recalculees depuis les rendez-vous actifs ;
- capacite controlee depuis le nombre reel de rendez-vous `PENDING`, `CONFIRMED` et `IN_PROGRESS` ;
- increments et decrements manuels de `occupancy` remplaces par un recalcul transactionnel ;
- creation dynamique adaptee pour reutiliser un creneau existant au lieu de creer un doublon ;
- suppression, restauration, annulation et changement de creneau securises ;
- fermeture ou annulation d un creneau occupee interdite ;
- suppression d un creneau lie a des rendez-vous interdite ;
- routes de restauration et de changement de creneau ajoutees aux rendez-vous ;
- routes distinctes d annulation, suppression et restauration ajoutees aux creneaux ;
- fuseau horaire configurable ajoute a `BusinessSettings` avec valeur par defaut `UTC` ;
- generation des disponibilites et limites journalieres rendues compatibles avec les fuseaux IANA ;
- dependance `date-fns-tz` ajoutee sans convertir le lockfile pnpm existant ;
- migration `20260802123357_unify_time_slots_and_add_timezone` creee et appliquee ;
- controle en base valide : aucun groupe de creneaux en double ;
- controle en base valide : aucune occupation incoherente ;
- controle en base valide : aucun fuseau horaire vide ou invalide ;
- schema Prisma valide ;
- 31 migrations reconnues et base a jour ;
- build backend valide ;
- git diff --check valide, hors avertissements LF/CRLF Windows ;
- depot Git propre apres push ;
- commit pousse : `fbd8b6e`.

