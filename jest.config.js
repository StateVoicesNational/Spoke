module.exports = {
  testEnvironment: "node",
  globals: {
    DB_JSON: "{\"client\":\"pg\",\"connection\":{\"host\":\"127.0.0.1\",\"port\":\"5432\",\"database\":\"spoke_test\",\"password\":\"spoke_test\",\"user\":\"spoke_test\"}}",
    JOBS_SYNC: true
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
