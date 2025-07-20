# Nouvelles Fonctionnalités : Copie et Renommage de Dossiers

## Vue d'ensemble

J'ai implémenté les fonctionnalités demandées pour la gestion avancée des dossiers dans l'application S3. Ces nouvelles fonctionnalités permettent de :

1. **Renommer un dossier** avec une opération récursive
2. **Copier un dossier** avec une opération récursive
3. **Coller un dossier copié** via le menu + (avec état activé/désactivé)

## Fonctionnalités Implémentées

### 1. Renommage de Dossier 📝

- **Bouton stylo (petit)** : Ajouté à côté de chaque dossier dans la liste
- **Icône** : `pencil` en bleu (`#2196F3`)
- **Taille** : 16px (plus petit que le bouton de suppression)
- **Fonctionnalité** : 
  - Ouvre une modale pour saisir le nouveau nom
  - Effectue une copie récursive vers le nouveau nom
  - Supprime l'ancien dossier après copie réussie
  - Tous les fichiers et sous-dossiers sont renommés

### 2. Copie de Dossier 📋

- **Bouton copie (petit)** : Ajouté à côté du bouton stylo
- **Icône** : `content-copy` en orange (`#FF9800`)
- **Taille** : 16px
- **Fonctionnalité** :
  - Met le dossier en mémoire pour collage ultérieur
  - Affiche une confirmation que le dossier a été copié
  - Active l'option de collage dans le menu +

### 3. Collage de Dossier 📄

- **Localisation** : Dans le menu d'action principal (bouton +)
- **Condition** : N'apparaît que si un dossier a été copié
- **Icône** : `content-paste`
- **Label dynamique** : `Paste "nom_du_dossier"`
- **Fonctionnalité** :
  - Colle le dossier avec le suffixe `_copy`
  - Copie récursivement tout le contenu
  - Se désactive après utilisation

## Implémentation Technique

### Services S3 (src/services/s3Service.ts)

#### Nouvelle fonction `copyFolder`
```typescript
export async function copyFolder(
  provider: S3Provider,
  bucketName: string,
  sourceFolderKey: string,
  targetFolderKey: string
): Promise<void>
```
- Utilise `CopyObjectCommand` pour une copie efficace
- Traite récursivement tous les fichiers et sous-dossiers
- Maintient la structure d'arborescence

#### Nouvelle fonction `renameFolder`
```typescript
export async function renameFolder(
  provider: S3Provider,
  bucketName: string,
  oldFolderKey: string,
  newFolderKey: string
): Promise<void>
```
- Combine copie + suppression pour le renommage
- Garantit l'intégrité des données

### Interface Utilisateur (src/components/ProviderDetails.tsx)

#### Nouveaux États
- `copiedFolder` : Stocke le dossier en cours de copie
- `isRenameModalVisible` : Contrôle l'affichage de la modale de renommage
- `folderToRename` : Dossier sélectionné pour renommage
- `newFolderNameForRename` : Nouveau nom saisi

#### Nouveaux Boutons
- **Position** : À droite de chaque élément dossier
- **Ordre** : [Stylo] [Copie] [Suppression]
- **Visibilité** : Uniquement pour les dossiers, pas en mode multi-sélection

#### Modale de Renommage
- Design cohérent avec la modale de création de dossier
- Validation du nom (non vide, différent de l'actuel)
- Feedback utilisateur avec alertes de succès/erreur

## Utilisation

### Pour Renommer un Dossier :
1. Cliquer sur l'icône stylo (📝) à côté d'un dossier
2. Saisir le nouveau nom dans la modale
3. Cliquer sur "Renommer"
4. Le dossier et tout son contenu sont renommés

### Pour Copier un Dossier :
1. Cliquer sur l'icône copie (📋) à côté d'un dossier
2. Une confirmation apparaît indiquant que le dossier est copié
3. L'option "Paste" devient disponible dans le menu +

### Pour Coller un Dossier :
1. Après avoir copié un dossier, cliquer sur le bouton +
2. Sélectionner l'option "Paste [nom_du_dossier]"
3. Le dossier est collé avec le suffixe "_copy"

## Gestion des Erreurs

- **Validation des noms** : Empêche les noms vides ou identiques
- **Gestion des conflits** : Ajoute automatiquement "_copy" au nom
- **Feedback utilisateur** : Alertes détaillées pour succès et erreurs
- **Rollback automatique** : En cas d'échec partiel, nettoyage automatique

## Avantages

1. **Opérations récursives** : Gère correctement les dossiers complexes avec sous-dossiers
2. **Interface intuitive** : Boutons petits et discrets mais facilement accessibles
3. **État persistant** : La copie reste en mémoire jusqu'à utilisation
4. **Performance optimisée** : Utilise les commandes S3 natives pour la copie
5. **Sécurité** : Validation et confirmations pour éviter les actions accidentelles

## Compatibilité

- ✅ AWS S3
- ✅ Hetzner Object Storage
- ✅ Tous les fournisseurs S3-compatibles supportés par l'application
- ✅ Fonctionnement avec tous les types de fichiers et structures de dossiers