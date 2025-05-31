# FDU
# Alyra Projet 2

Ce projet implémente et teste un smart contract de vote (Voting) en Solidity, permettant l’enregistrement de votants, la proposition d’idées, le vote, et la sélection automatique de la proposition gagnante à la fin du processus.

La suite de tests automatise la vérification des principales fonctionnalités du smart contract Voting à l’aide de Hardhat et Chai. Elle inclut notamment :

- Déploiement : Vérification de l’initialisation correcte du contrat, du propriétaire et des états initiaux.
- Gestion des votants : Tests sur l’ajout, la récupération, la non-duplication et la restriction d’accès à l’enregistrement des votants.
- Gestion du workflow : Validation du bon déroulement des étapes (enregistrement des votants, dépôt des propositions, sessions de vote, décompte des voix) et du respect des transitions d’état.
- Propositions : Vérification de l’ajout de propositions, du rejet des propositions invalides, et de la limitation à une proposition par votant.
- Votes : Contrôle du déroulement du vote, de l’unicité du vote par votant, du rejet des votes hors session, et de la comptabilisation correcte des voix.
- Résultats : Validation de l’identification de la proposition gagnante.
- Sécurité et accès : Tests des restrictions d’accès pour les fonctions sensibles, et vérification des messages d’erreur appropriés.
- Événements : Vérification de l’émission correcte des événements lors des principales actions (ajout de votant, proposition, vote, changement d’état).
- Test de charge : Simulation de scénario avec un grand nombre de propositions pour s’assurer de la robustesse du contrat.

Lancer la commande suivante pour exécuter les tests dans l'environnement Hardhat du projet :
npx hardhat test

Exemple de résultat des tests unitaires :
  Testing Voting
    Deployment
      ✔ Has an owner
      ✔ Has no winning proposal
      ✔ Workflow status is RegisteringVoters
    Registration of voters
      ✔ Should set and get voter 1
      ✔ Should set and get voter 1 and 2
      ✔ Cannot set voter 2 twice
      ✔ Should revert if non-owner tries to add voter
    Initial workflow management
      ✔ Should start proposals registration
      ✔ Should create GENESIS proposal when starting proposals registration
    Complete workflow
      ✔ Should follow all steps till the end (67ms)
    Security
      ✔ A non-voter cannot make a proposal
      ✔ Cannot vote when voting session is closed (48ms)
      ✔ Cannot add voters when registration session is closed (46ms)
    Proposals management
      ✔ Should reject empty proposals
      ✔ Same voter can make several proposals
    Results
      ✔ Should select the right proposal
    Events
      ✔ Should emit an event after voting
    Load testing
      ✔ Should handle Nb proposals with Nb=100 (405ms)
  18 passing (2s)
