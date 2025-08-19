# Universal S3 Client - Complete Feature Documentation

## Overview
Universal S3 Client is a React Native application that allows managing S3-compatible storage buckets from different cloud providers. The application offers a unified interface to access, manage, and manipulate objects stored in S3-compatible storage services.

## Main Features

### 1. Storage Security

- **Encryption at Rest**: Credentials (access key, secret key) are stored with Expo SecureStore (Keychain/Keystore)
- **Local Storage Only**: No sensitive data is transmitted to remote servers

### 2. Multi-provider S3 Support

#### 14 Supported Providers
1. **AWS S3** - 33 global regions
2. **Hetzner Storage Box** - 3 locations (Falkenstein, Helsinki, Ashburn)
3. **Cloudflare R2** - Automatic region + location hints
4. **DigitalOcean Spaces** - 5 regions
5. **Wasabi** - 6 regions
6. **Backblaze B2** - 3 regions
7. **Scaleway Object Storage** - 3 regions
8. **Vultr Object Storage** - 6 regions
9. **Linode Object Storage** - 3 regions
10. **Oracle Cloud Infrastructure** - 11 regions
11. **IBM Cloud Object Storage** - 9 regions
12. **Google Cloud Storage** - Global regions
13. **Azure Blob Storage** - Azure regions
14. **MinIO** - Custom endpoints

#### Provider-specific Configuration
- **Account ID** (Cloudflare R2)
- **Namespace** (Oracle OCI)
- **Location Hints** (Cloudflare R2)
- **Cluster ID** (Linode)
- **Custom Endpoints** (MinIO)

### 3. Provider Management

#### Adding Providers
- **Dynamic Form**: Interface adapted according to selected provider
- **Real-time Validation**: Verification of required fields
- **Endpoint Preview**: Automatic generation of endpoint URL
- **Connection Test**: Credential validation before saving

#### Provider List
- **Organized Display**: List view with essential information
- **Automatic Extraction**: Bucket name extracted from provider name
- **Error Handling**: Display of connection errors
- **Quick Actions**: Direct deletion from list

#### Provider Modification
- **Complete Editing**: Modification of all parameters
- **Secure Pre-filling**: Masking of existing passwords
- **Validation**: Verification of new credentials

### 4. Bucket Navigation and Exploration

#### Navigation Interface
- **Hierarchical Navigation**: Support for folders and subfolders
- **Breadcrumb Navigation**: Navigation history with level-by-level return
- **Visual Indicators**: Clear distinction between folders and files
- **Path Management**: Support for complex paths with special characters

#### Object Display
- **Detailed List**: Name, size, modification date
- **Distinctive Icons**: Visual differentiation of folders/files
- **Smart Sorting**: Folders first, then files by name
- **Refresh**: Pull-to-refresh to synchronize data

### 5. File and Folder Management

#### File Upload
- **Multi-sources**: Documents, images from gallery or camera
- **Progress Bar**: Real-time upload tracking
- **Large File Support**: Use of multipart upload for large files
- **Error Handling**: Automatic retry and detailed error messages

#### Folder Creation
- **Modal Interface**: Quick creation with name validation
- **Validation**: Verification of allowed characters
- **Immediate Creation**: Instant addition to list

#### Object Operations
- **Deletion**: Individual files or complete folders with recursion
- **Folder Copy**: Complete duplication with structure preservation
- **Renaming**: Name modification with validation
- **Multiple Selection**: Multi-selection mode for batch operations

### 6. Object Details

#### Complete Information
- **Metadata**: Size, modification date, full path
- **Signed URL**: Generation of temporary sharing links
- **Quick Actions**: Path copy, sharing, deletion

#### Sharing and Links
- **Signed URLs**: Generation of URLs with expiration for secure sharing
- **Clipboard Copy**: Quick copy actions
- **Native Sharing**: Integration with OS sharing system

### 7. User Interface

#### Modern Design
- **Material Design**: Interface based on React Native Paper
- **Consistent Theme**: Harmonious colors and typography
- **Smooth Animations**: Transitions and visual feedback
- **Responsive**: Adaptation to different screen sizes

#### Intuitive Navigation
- **FAB (Floating Action Button)**: Main actions quickly accessible
- **Contextual Menu**: Context-specific options
- **Action Buttons**: Logical and accessible placement

### 8. Error Handling and States

#### Connectivity Detection
- **Offline State**: Automatic detection and notification
- **Smart Retry**: Automatic attempts when connection returns
- **Contextual Messages**: Specific errors according to problem

#### S3 Error Handling
- **Authentication Errors**: Clear messages for invalid credentials
- **Permission Errors**: Information about insufficient rights
- **Timeouts**: Network timeout handling

### 9. Configuration and Settings

#### Settings Screen
- **Application Information**: Version, credits, links
- **Complete Reset**: Reset with confirmation
- **External Links**: GitHub, social networks, stores

#### Data Management
- **Local Storage**: User data persistence
- **Secure Backup**: Configuration export/import
- **Cleanup**: Selective data deletion

### 10. Advanced Features

#### AWS SDK Compatibility
- **Fixed Version**: AWS SDK v3.188.0 for Hetzner compatibility
- **Path-style URLs**: Support for non-AWS providers
- **Multipart Upload**: Optimized handling of large files

#### Performance Optimizations
- **Asynchronous Loading**: Automatic pagination of object lists
- **Smart Cache**: Caching of frequently used metadata
- **Lazy Loading**: On-demand resource loading

## Technical Architecture

### Code Structure
```
src/
├── components/          # React Native components
├── services/           # Business services (S3, storage, etc.)
├── config/            # Provider configuration
├── types/             # TypeScript types
└── utils/             # Utilities
```

### Technologies Used
- **React Native** 0.76.9 - Mobile framework
- **TypeScript** - Static typing
- **React Native Paper** - Material Design components
- **AWS SDK v3** - S3 client
- **Expo** - Development platform
- **Expo Secure Store** - Secure storage

## Roadmap and Future Improvements

### Planned Features
- **Synchronization**: Bidirectional sync with local storage
- **Advanced Search**: Global search across all buckets
- **Preview**: Preview of images and documents
- **Notifications**: Alerts for completed uploads/downloads
- **Collaborative Sharing**: Sharing links with permissions

### Technical Optimizations
- **Compression**: Automatic compression before upload
- **Parallelization**: Simultaneous uploads/downloads
- **Delta Sync**: Differential synchronization
- **Offline Mode**: Offline mode with action queue

## Security and Compliance

### Security Measures
- **Encryption at Rest**: Sensitive data protected via Expo SecureStore
- **No Remote Storage**: Credentials stored locally only
- **Secure Sessions**: Temporary tokens for API
- **Strict Validation**: Sanitization of all inputs

### Compliance
- **GDPR**: Privacy respect, no data collection
- **Local Storage**: Complete user control of data
- **Open Source**: Source code available for audit

## Support and Maintenance

### Supported Versions
- **iOS**: 13.0+
- **Android**: API 21+ (Android 5.0)
- **Expo SDK**: 52.x

### Compatibility Matrix
| Provider | Upload | Download | Delete | Rename | Copy |
|----------|--------|----------|--------|--------|------|
| AWS S3 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Hetzner | ✅* | ✅ | ✅ | ✅ | ✅ |
| Cloudflare R2 | ✅ | ✅ | ✅ | ✅ | ✅ |
| DigitalOcean | ✅ | ✅ | ✅ | ✅ | ✅ |
| Others | ✅ | ✅ | ✅ | ✅ | ✅ |

*Requires AWS SDK v3.188.0 or lower for Hetzner compatibility

## Conclusion

Universal S3 Client represents a complete and secure solution for multi-provider S3 storage management. The application combines ease of use with advanced features while maintaining solid security standards through encryption at rest via native keystores.