---
description: Best practices for Node.js development
globs: *.js,*.ts
alwaysApply: false
---
- Use async/await for handling asynchronous operations
- Implement proper error handling and logging
- Use environment variables for configuration
- Implement proper security measures (e.g., input validation, authentication)
- Optimize performance by using streams for large data processing
- Use EventEmitter.once for one-time listeners.
- Replace deprecated new Buffer() with Buffer.from().
- Avoid TOCTOU: open files directly with fs.open('r') and handle ENOENT.
- Implement custom streams by subclassing Readable with construct/_read/_destroy; always close fd in destroy.
- Pipe spawned processes (spawn + stdout→stdin) instead of exec for large streaming data.
- Build paths with path.resolve relative to CWD.
- Prefer tls.TLSSocket over legacy createSecurePair.
- Import modules correctly: require('./local'), require('./file.json'), or built-ins.
- Guard sync code with try/catch to prevent crashes.
- In addons, create napi_threadsafe_function for cross-thread JS calls.
- Use node:crypto (pbkdf2Sync, scryptSync, etc.) for crypto needs.
- Stream HTTP with undici.Client.stream and test with MockAgent.