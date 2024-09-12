/** @type {import('jest').Config} */
import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: 'ts-jest',
  verbose: true,
  transform: {
    "^.+\\.ts?$": "ts-jest"
  },
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: [
    "<rootDir>/dist/",
    "<rootDir>/public/",
  ]
};

export default config;