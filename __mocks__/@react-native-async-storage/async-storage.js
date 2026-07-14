/**
 * Manual mock for @react-native-async-storage/async-storage. The native module
 * is null under Jest, so any module that imports AsyncStorage (the offline
 * write queue, the query-cache persister) would throw at import time. This
 * re-exports the package's own in-memory Jest mock, auto-applied by Jest for
 * this node_module. Individual tests that need to observe/seed storage still
 * override this with a local `jest.mock(...)`.
 */
module.exports = require('@react-native-async-storage/async-storage/jest/async-storage-mock');
