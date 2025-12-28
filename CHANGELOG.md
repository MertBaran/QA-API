# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.6.0] - 2025-01-XX

### Extraordinary Searching Structure v1

#### Added

- **Advanced Elasticsearch Search Infrastructure**: Comprehensive search system with multiple search modes and intelligent query building
  - `ElasticsearchIndexService` with advanced query construction supporting phrase, all_words, any_word search modes
  - Dynamic typo tolerance system (low, medium, high) with automatic fuzziness calculation
  - Smart search integration with linguistic (synonym) and semantic (ELSER) search capabilities
  - Support for exact and fuzzy matching with configurable prefix_length and fuzziness
  - Ngram-based partial matching for single-word queries
  - Minimum score threshold calculation based on match type, typo tolerance, and word count
  - Comprehensive filter support: category, user, date range, numeric range, exclude IDs
  - Multiple sort options: relevance, date, popularity with ascending/descending order
  - Pagination support with page, limit, and totalPages calculation
- **Semantic Search Service**: ELSER model integration for semantic search
  - `ISemanticSearchService` interface for semantic search abstraction
  - `ElserSemanticSearchService` implementation with ELSER model deployment
  - Model deployment status checking
  - Query embedding generation for semantic search
  - Semantic query construction with text expansion
- **Synonym Service**: Linguistic search enhancement
  - `ISynonymService` interface for synonym management
  - `SynonymService` implementation with synonym expansion
  - Support for language-specific synonyms
  - Synonym-based query enhancement for better search results
- **Elasticsearch Ingest Pipeline**: Automatic semantic field population
  - `ElasticsearchIngestPipeline` for ELSER semantic field generation
  - Automatic pipeline creation and management
  - Support for multiple search fields with semantic indexing
- **Search Options Type System**: Type-safe search configuration
  - `SearchOptions` type with comprehensive search parameters
  - Support for searchMode, matchType, typoTolerance, smartSearch, smartOptions
  - Language detection and filtering support
  - Exclude IDs functionality for search result filtering
- **Comprehensive Unit Test Suite**: Full test coverage for search functionality
  - `ElasticsearchIndexService.test.ts` with 100+ test cases covering all search scenarios
  - `QuestionManager.search.test.ts` for question search integration tests
  - `AnswerManager.search.test.ts` for answer search integration tests
  - Mock implementations: `FakeElasticsearchClient`, `FakeSynonymService`, `FakeSemanticSearchService`
  - Isolated Jest configurations for unit tests without MongoDB dependencies
- **Enhanced Search Client Interface**: Extended search capabilities
  - `ISearchClient` interface with advanced search options
  - Support for semantic and linguistic search integration
  - Language-specific search support
  - Exclude IDs functionality in search queries

#### Changed

- **ElasticsearchIndexService**: Complete rewrite with advanced search capabilities
  - Refactored query building logic with support for multiple search modes
  - Enhanced filter system with date and numeric range support
  - Improved synonym and semantic search integration
  - Better error handling and logging
  - Optimized query construction for performance
- **QuestionManager**: Enhanced search functionality
  - Integrated advanced Elasticsearch search with all search options
  - Support for semantic and linguistic search
  - Improved fallback to MongoDB when Elasticsearch fails
  - Better result transformation and pagination
- **AnswerManager**: Enhanced search functionality
  - Integrated advanced Elasticsearch search with all search options
  - Support for semantic and linguistic search
  - Question information enrichment in search results
  - Improved fallback to MongoDB when Elasticsearch fails
- **ElasticsearchSyncService**: Improved document synchronization
  - Better ELSER pipeline integration
  - Enhanced error handling for document operations
  - Improved model deployment status checking
- **Reindex Script**: Enhanced reindexing capabilities
  - Support for advanced search field configuration
  - Better error handling and progress reporting
  - Improved index management

#### Fixed

- Elasticsearch query construction for exclude IDs functionality
- Document update operations in mock Elasticsearch client
- Question repository `findByIds` method for answer enrichment
- Test isolation issues with MongoDB connection attempts
- Log file accessibility by moving logs to project directory

#### Technical Improvements

- Removed unnecessary debug and info logs from Elasticsearch services
- Improved code organization with better separation of concerns
- Enhanced type safety with comprehensive TypeScript interfaces
- Better error handling and logging throughout search infrastructure
- Optimized query performance with intelligent query building
- Improved test coverage and test isolation

## [1.5.0] - 2025-12-27

### Added

- **Question Thumbnail Support**: Complete thumbnail management system for questions
  - Thumbnail upload via presigned URLs (Cloudflare R2 compatible)
  - Thumbnail display on question cards and detail pages
  - Thumbnail update and removal functionality
  - Automatic thumbnail URL generation from storage keys
- **Object Storage Infrastructure**: Cloudflare R2 integration
  - `IObjectStorageProvider` interface for storage abstraction
  - `CloudflareR2StorageProvider` implementation with presigned URL support
  - Support for both global and account-specific R2 endpoints
  - Public URL generation for public assets
- **Content Asset Service**: Centralized asset management
  - `ContentAssetService` for managing content assets
  - Support for multiple asset types (question-thumbnail, attachments, user avatars, etc.)
  - Public/private asset visibility control
  - Asset path building with proper organization
- **Content Asset API Endpoints**: RESTful API for asset operations
  - `POST /api/content-assets/presigned-upload` - Generate presigned upload URLs
  - `POST /api/content-assets/resolve-url` - Resolve asset URLs from keys
  - `DELETE /api/content-assets` - Delete assets
- **Elasticsearch Thumbnail Indexing**: Thumbnail URLs indexed for search
  - `thumbnailUrl` field added to `QuestionSearchDoc`
  - Thumbnail URLs included in search results

### Changed

- **Question Model**: Enhanced with thumbnail support
  - Added `thumbnail` field with `key` and optional `url` properties
  - Thumbnail data properly mapped in MongoDB data source
- **Question DTOs**: Updated to support thumbnail operations
  - `CreateQuestionDTO` now accepts `thumbnailKey`
  - `UpdateQuestionDTO` supports `thumbnailKey` and `removeThumbnail`
- **Question Manager**: Enhanced with thumbnail management
  - Automatic thumbnail URL generation during create/update
  - Safe asset deletion with error handling
  - Thumbnail cleanup on question deletion
- **Application Configuration**: Added object storage configuration
  - Environment variables for R2 configuration
  - Object storage config in application setup
  - Monitoring integration for storage health

### Fixed

- Thumbnail field mapping in `QuestionMongooseDataSource.toEntity()` method
- Thumbnail URL generation when key exists but URL is missing
- Frontend thumbnail loading with automatic retry on failure

### Technical Improvements

- Improved application shutdown with graceful database disconnection
- Enhanced database connection handling with retry logic
- Better TypeScript type safety in Elasticsearch service
- Improved error handling in storage operations
- Updated dependencies for AWS SDK v3 support

## [1.4.0] - 2025-11-02

### Added

- **Content Relationship System**: New system for linking questions and answers
  - `parentContentId` field to establish parent-child relationships between content
  - `relatedContents` array to track all content related to a parent
  - Question relationships: Questions can now be asked about other questions or answers
  - Answer relationships: Answers can now have related questions
  - `ContentRelation` model for advanced relationship management
- **Dislike Feature**: Users can now dislike questions and answers
  - `dislikes` array added to Question and Answer models
  - Separate dislike/unlike endpoints (distinct from like/unlike)
  - Dislike and like are mutually exclusive
- **Public User Profiles**: New endpoint for accessing public user information
  - `GET /api/public/users/:id` endpoint (no authentication required)
  - Returns safe, public user profile data
- **Elasticsearch Reindexing**: Tools for maintaining search index consistency
  - Reindexing script (`scripts/reindex-elasticsearch.ts`)
  - Migration script for field name changes (`scripts/migrate-field-names.ts`)
  - npm commands: `npm run reindex`, `npm run migrate:field-names`
- **Postman Collection**: Complete API documentation
  - All endpoints documented with examples
  - Automatic token management
  - Request/response examples for all operations
  - Organized by feature area (Auth, Questions, Answers, etc.)

### Changed

- **Data Models**: Enhanced Question and Answer models
  - Added `parentContentId` and `relatedContents` to both models
  - Added `contentType` field to explicitly identify content type
  - Improved data consistency between MongoDB and Elasticsearch
- **User Profile Access**: Improved profile access control
  - Public profiles accessible via `/api/public/users/:id`
  - Admin-only access to full user data via `/api/users/:id`
- **README**: Updated documentation
  - Added Postman collection reference
  - Updated all endpoint listings with latest routes
  - Added authentication requirements per endpoint
  - Improved API documentation structure

### Fixed

- Profile image display on homepage header
- Question and answer sorting by creation date (newest first)
- Elasticsearch mapping for `likes` and `dislikes` fields (keyword type)
- Data population in Mongoose data sources
- Missing field mappings in Elasticsearch indexes

### Technical Improvements

- Refactored Content Form model to IContent for better semantic clarity
- Added field migration tools for database schema updates
- Improved Elasticsearch sync mechanism
- Enhanced repository layer with relationship queries
- Better type safety with TypeScript interfaces

## [1.3.4] - 2025-11-01

### Added

- GET /api/answers/user/:userId endpoint to fetch answers by user ID
- Standalone answer router for user-specific answer operations
- Question enrichment for answers in AnswerManager

### Fixed

- Bookmark date handling to ensure proper Date object conversion
- Answer creation to properly return enriched data

### Changed

- AnswerManager now enriches answers with question information
- Improved answer search fallback to MongoDB

## [1.3.3] - 2024-10-30

### Added

- Elasticsearch integration for full-text search and log aggregation
- SearchDocument pattern with Projector interfaces for entity-to-document mapping
- ISearchClient and IIndexClient abstractions for search operations
- Turkish analyzer for Elasticsearch with ngram support for partial matching
- Elasticsearch log shipper for centralized log management

### Fixed

- User-friendly repository error messages (NOT_FOUND instead of generic database errors)
- QuestionNotFound import issue in AnswerManager
- isAccepted field added to IAnswerModel and AnswerMongoModel
- Optional createdAt handling in AnswerProjector
- Elasticsearch likes field mapping (keyword instead of integer)
- Log shipper initialization order

### Changed

- Repository error messages now include entity-specific NOT_FOUND messages
- QuestionManager and AnswerManager use Elasticsearch for search operations
- Search results return directly from Elasticsearch without MongoDB fallback (when search succeeds)
- Updated README with Elasticsearch setup instructions

## [1.2.0] - 2024-12-19

### Added

- Enhanced changelog documentation system
- Improved release workflow with tag-based versioning
- Better branch management strategy

### Changed

- Updated project structure for better maintainability
- Enhanced documentation formatting

### Technical Improvements

- Streamlined release process
- Improved version management
- Better commit history organization

## [1.1.0] - 2024-12-19

### Added

- Professional logging system for all notification channels
- Structured logging with metadata for better debugging
- Error handling with detailed logging in notification services
- Improved traceability of notification operations

### Changed

- Replaced console.log with ILoggerProvider in WebhookChannel
- Replaced console.log with ILoggerProvider in PushChannel
- Replaced console.log with ILoggerProvider in SMSChannel
- Replaced console.log with ILoggerProvider in EmailChannel
- Enhanced error handling in notification channels

### Technical Improvements

- Added dependency injection for ILoggerProvider in notification channels
- Improved error context and metadata in logs
- Better performance monitoring with duration tracking
- Enhanced debugging capabilities for notification operations

## [1.0.0] - 2024-12-19

### Initial Release

- Core QA API functionality
- User authentication and authorization
- Question and answer management
- Notification system with multiple channels
- Comprehensive test coverage
- Performance testing infrastructure
- Multi-database support (MongoDB, PostgreSQL)
- WebSocket monitoring
- Audit logging system
- Internationalization support
