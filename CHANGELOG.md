# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
