import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
    globalIgnores(["coverage/", "dist/", "generated/"]),
    {
        files: ["**/*.{js,cjs,mjs,ts}"],
        extends: [js.configs.recommended],
        languageOptions: { globals: globals.node },
        rules: {
            curly: ["error", "all"],
        },
    },
    {
        files: ["**/*.ts"],
        extends: [tseslint.configs.recommended],
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", ignoreRestSiblings: true },
            ],
        },
    },
    {
        files: ["test/integration/**/*.ts"],
        rules: {
            "@typescript-eslint/no-require-imports": [
                "error",
                { allow: ["\\.cjs$"] },
            ],
        },
    },
]);
