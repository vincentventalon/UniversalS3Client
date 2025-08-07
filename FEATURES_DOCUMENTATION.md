# Universal S3 Client - Documentation complète des fonctionnalités

## Vue d'ensemble
Universal S3 Client est une application React Native qui permet de gérer des buckets de stockage compatibles S3 de différents fournisseurs cloud. L'application offre une interface unifiée pour accéder, gérer et manipuler des objets stockés dans des services de stockage S3-compatibles.

## Fonctionnalités principales

### 1. Sécurité du stockage

- **Chiffrement au repos** : Les credentials (access key, secret key) sont stockées avec Expo SecureStore (Keychain/Keystore)
- **Stockage local uniquement** : Aucune donnée sensible n'est transmise à des serveurs distants

### 2. Support multi-providers S3

#### 14 providers supportés
1. **AWS S3** - 33 régions mondiales
2. **Hetzner Storage Box** - 3 locations (Falkenstein, Helsinki, Ashburn)
3. **Cloudflare R2** - Région automatique + hints de localisation
4. **DigitalOcean Spaces** - 5 régions
5. **Wasabi** - 6 régions
6. **Backblaze B2** - 3 régions
7. **Scaleway Object Storage** - 3 régions
8. **Vultr Object Storage** - 6 régions
9. **Linode Object Storage** - 3 régions
10. **Oracle Cloud Infrastructure** - 11 régions
11. **IBM Cloud Object Storage** - 9 régions
12. **Google Cloud Storage** - Regions globales
13. **Azure Blob Storage** - Régions Azure
14. **MinIO** - Endpoints personnalisés

#### Configuration spécifique par provider
- **Account ID** (Cloudflare R2)
- **Namespace** (Oracle OCI)
- **Location Hints** (Cloudflare R2)
- **Cluster ID** (Linode)
- **Custom Endpoints** (MinIO)

### 3. Gestion des providers

#### Ajout de providers
- **Formulaire dynamique** : Interface adaptée selon le provider sélectionné
- **Validation en temps réel** : Vérification des champs obligatoires
- **Aperçu endpoint** : Génération automatique de l'URL d'endpoint
- **Test de connexion** : Validation des credentials avant sauvegarde

#### Liste des providers
- **Affichage organisé** : Vue en liste avec informations essentielles
- **Extraction automatique** : Nom du bucket extrait du nom du provider
- **Gestion des erreurs** : Affichage des erreurs de connexion
- **Actions rapides** : Suppression directe depuis la liste

#### Modification des providers
- **Édition complète** : Modification de tous les paramètres
- **Pré-remplissage sécurisé** : Masquage des mots de passe existants
- **Validation** : Vérification des nouvelles credentials

### 4. Navigation et exploration des buckets

#### Interface de navigation
- **Navigation hiérarchique** : Support des dossiers et sous-dossiers
- **Breadcrumb navigation** : Historique de navigation avec retour niveau par niveau
- **Indicateurs visuels** : Distinction claire entre dossiers et fichiers
- **Gestion des chemins** : Support des chemins complexes avec caractères spéciaux

#### Affichage des objets
- **Liste détaillée** : Nom, taille, date de modification
- **Icônes distinctives** : Différenciation visuelle dossiers/fichiers
- **Tri intelligent** : Dossiers en premier, puis fichiers par nom
- **Actualisation** : Pull-to-refresh pour synchroniser les données

### 5. Gestion des fichiers et dossiers

#### Upload de fichiers
- **Multi-sources** : Documents, images depuis la galerie ou appareil photo
- **Barre de progression** : Suivi en temps réel de l'upload
- **Support de gros fichiers** : Utilisation d'Upload multipart pour les gros fichiers
- **Gestion d'erreurs** : Retry automatique et messages d'erreur détaillés

#### Création de dossiers
- **Interface modale** : Création rapide avec validation du nom
- **Validation** : Vérification des caractères autorisés
- **Création immédiate** : Ajout instantané à la liste

#### Opérations sur les objets
- **Suppression** : Fichiers individuels ou dossiers complets avec récursion
- **Copie de dossiers** : Duplication complète avec préservation de la structure
- **Renommage** : Modification du nom avec validation
- **Sélection multiple** : Mode multi-sélection pour opérations en lot

### 6. Détails des objets

#### Informations complètes
- **Métadonnées** : Taille, date de modification, chemin complet
- **URL signée** : Génération de liens de partage temporaires
- **Actions rapides** : Copie du chemin, partage, suppression

#### Partage et liens
- **URL signées** : Génération d'URLs avec expiration pour partage sécurisé
- **Copie vers presse-papier** : Actions de copie rapide
- **Partage natif** : Intégration avec le système de partage de l'OS

### 7. Interface utilisateur

#### Design moderne
- **Material Design** : Interface basée sur React Native Paper
- **Thème cohérent** : Couleurs et typographie harmonieuses
- **Animations fluides** : Transitions et feedback visuels
- **Responsive** : Adaptation aux différentes tailles d'écran

#### Navigation intuitive
- **FAB (Floating Action Button)** : Actions principales accessibles rapidement
- **Menu contextuel** : Options spécifiques par contexte
- **Boutons d'action** : Placement logique et accessible

### 8. Gestion des erreurs et états

#### Détection de connectivité
- **État hors ligne** : Détection automatique et notification
- **Retry intelligent** : Tentatives automatiques lors du retour de connexion
- **Messages contextuels** : Erreurs spécifiques selon le problème

#### Gestion des erreurs S3
- **Erreurs d'authentification** : Messages clairs pour les credentials invalides
- **Erreurs de permissions** : Information sur les droits insuffisants
- **Timeouts** : Gestion des délais d'attente réseau

### 9. Configuration et paramètres

#### Écran de paramètres
- **Informations application** : Version, credits, liens
- **Reset complet** : Remise à zéro avec confirmation
- **Liens externes** : GitHub, réseaux sociaux, stores

#### Gestion des données
- **Stockage local** : Persistence des données utilisateur
- **Sauvegarde sécurisée** : Export/import des configurations
- **Nettoyage** : Suppression sélective des données

### 10. Fonctionnalités avancées

#### Compatibilité AWS SDK
- **Version fixe** : AWS SDK v3.188.0 pour compatibilité Hetzner
- **Path-style URLs** : Support des providers non-AWS
- **Multipart upload** : Gestion optimisée des gros fichiers

#### Optimisations performance
- **Chargement asynchrone** : Pagination automatique des listes d'objets
- **Cache intelligent** : Mise en cache des métadonnées fréquemment utilisées
- **Lazy loading** : Chargement à la demande des ressources

## Architecture technique

### Structure du code
```
src/
├── components/          # Composants React Native
├── services/           # Services métier (S3, stockage, etc.)
├── config/            # Configuration providers
├── types/             # Types TypeScript
└── utils/             # Utilitaires
```

### Technologies utilisées
- **React Native** 0.76.9 - Framework mobile
- **TypeScript** - Typage statique
- **React Native Paper** - Composants Material Design
- **AWS SDK v3** - Client S3
- **Expo** - Plateforme de développement
- **Expo Secure Store** - Stockage sécurisé

## Roadmap et améliorations futures

### Fonctionnalités prévues
- **Synchronisation** : Sync bidirectionnelle avec stockage local
- **Recherche avancée** : Recherche globale dans tous les buckets
- **Prévisualisation** : Aperçu des images et documents
- **Notifications** : Alerts pour uploads/downloads terminés
- **Partage collaboratif** : Liens de partage avec permissions

### Optimisations techniques
- **Compression** : Compression automatique avant upload
- **Parallélisation** : Uploads/downloads simultanés
- **Delta sync** : Synchronisation différentielle
- **Offline mode** : Mode hors ligne avec queue d'actions

## Sécurité et conformité

### Mesures de sécurité
- **Chiffrement au repos** : Données sensibles protégées via Expo SecureStore
- **Aucun stockage distant** : Credentials stockées uniquement localement
- **Sessions sécurisées** : Tokens temporaires pour API
- **Validation stricte** : Sanitisation de tous les inputs

### Conformité
- **RGPD** : Respect de la vie privée, aucune collecte de données
- **Stockage local** : Contrôle total des données par l'utilisateur
- **Open source** : Code source disponible pour audit

## Support et maintenance

### Versions supportées
- **iOS** : 13.0+
- **Android** : API 21+ (Android 5.0)
- **Expo SDK** : 52.x

### Compatibility matrix
| Provider | Upload | Download | Delete | Rename | Copy |
|----------|--------|----------|--------|--------|------|
| AWS S3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hetzner | ✅* | ✅ | ✅ | ✅ | ✅ |
| Cloudflare R2 | ✅ | ✅ | ✅ | ✅ | ✅ |
| DigitalOcean | ✅ | ✅ | ✅ | ✅ | ✅ |
| Autres | ✅ | ✅ | ✅ | ✅ | ✅ |

*Requires AWS SDK v3.188.0 or lower for Hetzner compatibility

## Conclusion

Universal S3 Client représente une solution complète et sécurisée pour la gestion de stockage S3 multi-providers. L'application combine simplicité d'utilisation et fonctionnalités avancées, tout en maintenant des standards de sécurité solides grâce à l'encryption au repos via les keystores natifs.