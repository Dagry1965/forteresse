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

Statut : TERMINE

Commit : `6020c3a` - feat(customers): normalize clients and vehicles

Objectifs :

- normaliser emails, telephones, immatriculations et VIN ;
- empecher les doublons ;
- securiser archivage et restauration ;
- conserver l historique.

### LOT 12 - Paiements et caisse

Statut : TERMINE

Commit : `bccbb34` - feat(finance): add payment refunds and cash register

Objectifs :

- normaliser les moyens de paiement ;
- ajouter annulation et remboursement ;
- creer ouverture, cloture et ecart de caisse.

### LOT 13 - Roles et permissions

Statut : termine.

Realise :

- ajout des roles ADMIN, MEMBER, RECEPTION, WORKSHOP, MECHANIC, STOCK, CASHIER, ACCOUNTING et READ_ONLY ;
- validation stricte des roles dans les DTO utilisateurs ;
- correction du contexte JWT avec id, userId, workspaceId, email et role ;
- verification en base du membership actif par WorkspaceGuard ;
- injection du role reel du workspace dans la requete ;
- securisation de RolesGuard avec refus explicite en 403 ;
- ajout et export de RolesGuard dans AuthModule ;
- prise en charge de la mise a jour du role dans UsersService ;
- protection des routes clients, vehicules, rendez-vous, creneaux, atelier, stock, fournisseurs, proformas, factures, paiements, caisse et rapports ;
- integration durable des roles WORKSHOP et STOCK dans le seed ;
- build backend valide ;
- tests fonctionnels valides :
  - WORKSHOP : atelier 200, caisse 403 ;
  - STOCK : inventaire 200, atelier 403 ;
  - MECHANIC : atelier 200, caisse 403 ;
  - ADMIN : atelier 200, caisse 200.

Commit :

- 994004a feat(auth): add workspace roles and permissions

Matrice des roles et permissions :

| Domaine / Action | ADMIN | RECEPTION | WORKSHOP | MECHANIC | STOCK | CASHIER | ACCOUNTING | READ_ONLY | MEMBER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Gestion des utilisateurs | Oui | Non | Non | Non | Non | Non | Non | Non | Non |
| Consulter les clients | Oui | Oui | Lecture | Lecture | Non | Non | Lecture | Lecture | Non |
| Modifier les clients et contacts | Oui | Oui | Non | Non | Non | Non | Non | Non | Non |
| Consulter les vehicules | Oui | Oui | Lecture | Lecture | Non | Non | Non | Lecture | Non |
| Modifier les vehicules | Oui | Oui | Non | Non | Non | Non | Non | Non | Non |
| Consulter les rendez-vous | Oui | Oui | Lecture | Lecture | Non | Non | Non | Lecture | Non |
| Gerer les rendez-vous | Oui | Oui | Non | Non | Non | Non | Non | Non | Non |
| Demarrer le travail atelier | Oui | Oui | Oui | Non | Non | Non | Non | Non | Non |
| Consulter les creneaux | Oui | Oui | Lecture | Lecture | Non | Non | Non | Lecture | Non |
| Gerer les creneaux | Oui | Oui | Non | Non | Non | Non | Non | Non | Non |
| Consulter les interventions | Oui | Oui | Oui | Oui | Non | Non | Non | Lecture | Non |
| Creer ou modifier une intervention | Oui | Non | Oui | Oui | Non | Non | Non | Non | Non |
| Supprimer une intervention | Oui | Non | Oui | Non | Non | Non | Non | Non | Non |
| Changer le statut atelier | Oui | Non | Oui | Oui | Non | Non | Non | Non | Non |
| Ajouter ou retirer des pieces | Oui | Non | Oui | Oui | Oui | Non | Non | Non | Non |
| Creer une phase atelier | Oui | Non | Oui | Non | Non | Non | Non | Non | Non |
| Generer un proforma depuis l'atelier | Oui | Oui | Oui | Non | Non | Non | Non | Non | Non |
| Consulter les proformas | Oui | Oui | Non | Non | Non | Non | Oui | Lecture | Non |
| Modifier ou accepter un proforma | Oui | Oui | Non | Non | Non | Non | Oui | Non | Non |
| Transformer un proforma en facture | Oui | Oui | Non | Non | Non | Non | Oui | Non | Non |
| Consulter les factures | Oui | Oui | Non | Non | Non | Oui | Oui | Lecture | Non |
| Creer une facture groupee | Oui | Oui | Non | Non | Non | Non | Oui | Non | Non |
| Annuler une facture ou creer un avoir | Oui | Non | Non | Non | Non | Non | Oui | Non | Non |
| Enregistrer, annuler ou rembourser un paiement | Oui | Non | Non | Non | Non | Oui | Oui | Non | Non |
| Gerer les echeanciers | Oui | Non | Non | Non | Non | Oui | Oui | Non | Non |
| Gerer la caisse | Oui | Non | Non | Non | Non | Oui | Oui | Non | Non |
| Consulter les rapports financiers | Oui | Non | Non | Non | Non | Non | Oui | Lecture | Non |
| Consulter les produits et receptions | Oui | Non | Lecture | Lecture | Oui | Non | Non | Lecture | Non |
| Generer une commande automatique | Oui | Non | Non | Non | Oui | Non | Non | Non | Non |
| Enregistrer une reception fournisseur | Oui | Non | Non | Non | Oui | Non | Non | Non | Non |
| Consulter les commandes fournisseurs | Oui | Non | Non | Non | Oui | Non | Lecture | Lecture | Non |
| Gerer les commandes fournisseurs | Oui | Non | Non | Non | Oui | Non | Non | Non | Non |
| Consulter les mouvements de stock | Oui | Non | Lecture | Lecture | Oui | Non | Lecture | Lecture | Non |
| Consulter les alertes et la valeur du stock | Oui | Non | Non | Non | Oui | Non | Lecture | Lecture | Non |
| Consulter les fournisseurs | Oui | Non | Non | Non | Oui | Non | Lecture | Lecture | Non |
| Gerer les fournisseurs | Oui | Non | Non | Non | Oui | Non | Non | Non | Non |

Resume des roles :

| Role | Fonction principale |
|---|---|
| ADMIN | Administration complete du garage et gestion des utilisateurs |
| RECEPTION | Clients, vehicules, rendez-vous, proformas et facturation |
| WORKSHOP | Supervision et gestion des interventions atelier |
| MECHANIC | Execution des interventions et utilisation des pieces |
| STOCK | Produits, fournisseurs, commandes, receptions et mouvements de stock |
| CASHIER | Encaissements, remboursements et gestion de la caisse |
| ACCOUNTING | Factures, paiements, avoirs, caisse et rapports financiers |
| READ_ONLY | Consultation des domaines explicitement autorises |
| MEMBER | Ancien role conserve pour compatibilite, sans permission metier dediee |

### LOT 14 - Securite technique

Statut : termine.

Realise :

- CORS limite aux origines configurees via `CORS_ORIGINS` ;
- secret JWT obligatoire et durees des jetons configurables ;
- jetons d'acces courts et refresh tokens rotatifs ;
- refresh tokens stockes uniquement sous forme de hash Argon2 ;
- routes publiques `login`, `refresh` et `logout` ;
- revocation du refresh token lors de la deconnexion ;
- controle de l'appartenance active au workspace lors du refresh ;
- enrichissement de `AuditLog` avec workspace, utilisateur, succes, erreur, IP et user-agent ;
- journalisation des connexions reussies et echouees ;
- journalisation des refresh et deconnexions ;
- journalisation des creations, modifications de role, suppressions et restaurations d'utilisateurs ;
- journalisation des encaissements, annulations et remboursements ;
- journalisation des ouvertures, fermetures et mouvements manuels de caisse ;
- migration Prisma `20260802165738_enrich_audit_log_security` appliquee ;
- build backend valide ;
- tests fonctionnels valides pour login, rotation refresh, logout, audit utilisateurs, caisse, encaissement et remboursement.

Commit technique :

- `6eb4b0c feat(security): add refresh tokens and audit sensitive actions`

Reste reporte :

- separation entre administrateur garage et administrateur systeme, a traiter dans un lot d'architecture dedie.

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

### 2026-08-02 - LOT 11

- service partage `NormalizationService` ajoute pour centraliser les normalisations ;
- emails clients normalises en minuscules et sans espaces exterieurs ;
- telephones clients normalises en chiffres avec conservation du prefixe `+` ;
- immatriculations normalisees en majuscules sans separateurs ;
- VIN normalises en majuscules sans separateurs ;
- champs `email_normalized` et `phone_normalized` ajoutes aux clients ;
- champs `registration_normalized` et `vin_normalized` ajoutes aux vehicules ;
- contraintes uniques ajoutees par workspace sur les emails et telephones normalises ;
- contraintes uniques ajoutees par workspace sur les immatriculations et VIN normalises ;
- controles de doublons appliques aux donnees actives et archivees ;
- collisions de doublons bloquees lors de la creation, modification et restauration ;
- restauration des clients et vehicules corrigee pour rechercher les enregistrements archives ;
- restauration d un vehicule refusee si son client est archive ;
- archivage client limite aux vehicules actifs et factures ouvertes ;
- archivage vehicule refuse en presence de rendez-vous actifs ;
- suppressions definitives clients et vehicules desactivees pour conserver l historique ;
- routes HTTP de suppression definitive retirees des controleurs ;
- identifiant `clientId` du DTO vehicule corrige pour accepter les identifiants Prisma `cuid` ;
- contacts clients normalises lors de la creation et de la modification ;
- migrations `20260802131919_add_client_vehicle_normalized_fields` et `20260802132124_require_vehicle_registration_normalized` creees ;
- backfill des donnees existantes integre directement aux migrations ;
- migrations retestees depuis la sauvegarde precedant le LOT 11 ;
- 40 clients et 109 vehicules existants normalises ;
- controle en base valide : aucune valeur normalisee manquante ;
- controle en base valide : aucun doublon email, telephone, immatriculation ou VIN ;
- test fonctionnel valide pour creation, normalisation et detection des doublons ;
- test fonctionnel valide pour archivage et restauration des clients et vehicules ;
- test fonctionnel valide pour le blocage des suppressions definitives ;
- schema Prisma valide ;
- 33 migrations reconnues et base a jour ;
- build backend valide ;
- git diff --check valide, hors avertissements LF/CRLF Windows ;
- commit pousse : `6020c3a`.

### 2026-08-02 - LOT 12

- moyens de paiement normalises avec les valeurs `CASH`, `CARD`, `BANK_TRANSFER`, `CHECK`, `MOBILE_MONEY` et `OTHER` ;
- statuts de paiement `COMPLETED`, `CANCELLED`, `PARTIALLY_REFUNDED` et `REFUNDED` ajoutes ;
- statut et montant rembourse ajoutes au modele `Payment` ;
- dates d annulation et de remboursement ajoutees ;
- rattachement optionnel des paiements aux sessions de caisse ajoute ;
- modeles `CashRegister` et `CashMovement` ajoutes ;
- ouverture et cloture de caisse ajoutees ;
- calcul du montant attendu et de l ecart de caisse ajoute ;
- mouvements `OPENING`, `PAYMENT`, `REFUND`, `CASH_IN`, `CASH_OUT` et `CLOSING` ajoutes ;
- contrainte SQL garantissant une seule caisse ouverte par workspace ajoutee ;
- paiements en especes bloques lorsqu aucune caisse n est ouverte ;
- remboursements en especes rattaches a la caisse ouverte ;
- mouvements manuels d entree et de sortie de caisse ajoutes ;
- annulation complete d un paiement ajoutee ;
- remboursements partiels et complets ajoutes ;
- recalcul transactionnel du montant net paye et du statut de facture ajoute ;
- paiements annules exclus des montants encaisses ;
- remboursements deduits des montants encaisses ;
- echeanciers recalcules apres annulation ou remboursement ;
- DTO de paiement normalises sur les constantes partagees ;
- validations UUID incompatibles avec les identifiants Prisma `cuid` retirees ;
- routes HTTP d annulation et de remboursement ajoutees ;
- routes HTTP d ouverture, consultation, mouvement et cloture de caisse ajoutees ;
- rapport journalier adapte au fuseau horaire du workspace ;
- rapport journalier adapte aux paiements annules et rembourses ;
- migration `20260802140142_add_payment_cash_register` creee et appliquee ;
- migration retestee depuis la sauvegarde precedant le LOT 12 ;
- 5 paiements historiques conserves et initialises avec `COMPLETED` et remboursement nul ;
- test fonctionnel valide pour ouverture de caisse avec fond initial de 200 ;
- test fonctionnel valide pour paiement CASH de 100 rattache a la caisse ;
- test fonctionnel valide pour remboursement partiel de 40 ;
- test fonctionnel valide pour sortie manuelle de caisse de 10 ;
- test fonctionnel valide pour cloture avec montant attendu de 250, montant compte de 248 et ecart de -2 ;
- test fonctionnel valide pour annulation d un paiement `BANK_TRANSFER` de 50 ;
- test fonctionnel valide pour rapport journalier avec montant net de 60 ;
- donnees fonctionnelles de test nettoyees apres validation ;
- schema Prisma valide ;
- 34 migrations reconnues et base a jour ;
- build backend valide ;
- git diff --check valide, hors avertissements LF/CRLF Windows ;
- depot Git propre apres push ;
- commit pousse : `bccbb34`.
