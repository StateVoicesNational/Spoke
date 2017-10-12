module.exports = {
  testEnvironment: "node",
  globals: {
    DB_JSON: "{\"client\":\"sqlite3\",\"connection\":{\"filename\":\"./test.sqlite\"},\"defaultsUnsupported\":true}",
    JOBS_SYNC: true,
    JOBS_SAME_PROCESS: true
  },
  moduleFileExtensions: [
    "js",
    "jsx"
  ],
  transform: {
    ".*.js": "<rootDir>/node_modules/babel-jest"
  },
  moduleDirectories: [
    "node_modules"
  ],
  moduleNameMapper: {
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
    "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js"
  }
};
