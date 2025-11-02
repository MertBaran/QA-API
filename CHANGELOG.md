# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
