# TODO List

## Backend Issues

**🔥 PRIORITY 1:** ✅ Question workflow try-catch cleanup completed. Apply same cleanup to other workflows (Answer, Auth, Admin, Bookmark, User, etc.)

**🔥 PRIORITY 2:** ✅ Centralized error management system completed. All layers cleaned up, nullable patterns removed, ApplicationError implemented.

**📋 NEXT:** Test files refactoring - Convert fake repositories to Jest mocks for better maintainability

cdn kur fotolar oraya yüklensin

## Test Refactoring Tasks

- [ ] Convert fake repositories to Jest mocks
- [ ] Fix nullable patterns in FakeUserRepository
- [ ] Fix nullable patterns in FakeUserRoleRepository
- [ ] Fix nullable patterns in FakeQuestionRepository
- [ ] Fix nullable patterns in FakeBookmarkRepository
- [ ] Fix nullable patterns in fake services
- [ ] Refactor test files to use Jest mocks instead of fake implementations

## Completed Tasks

✅ **Question Workflow Try-Catch Cleanup** - Removed unnecessary try-catch blocks from QuestionManager, BaseRepository, and QuestionMongooseDataSource. Code reduced by ~40%, error handling delegated to global appErrorHandler.

✅ **Centralized Error Management System** - Implemented ApplicationError, removed CustomError, cleaned up all layers (controllers, managers, repositories, data sources), removed nullable patterns, standardized error handling across the entire application.
