import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default [{
    ignores: [
        "**/.git",
        "**/.github",
        "**/.husky",
        "**/cover",
        "**/docs",
        "**/js-coverage",
        "kbase-extension/static/ext_components",
        "kbase-extension/static/ext_modules",
        "kbase-extension/static/ext_packages",
        "**/node_modules",
        "**/python-coverage",
        "**/venv",
    ],
}, ...compat.extends("eslint:recommended", "prettier"), {
    languageOptions: {
        globals: {
            ...globals.amd,
            ...globals.browser,
            ...globals.node,
            ...globals.jasmine,
            ...globals.mocha,
        },

        ecmaVersion: 2018,
    },

    rules: {
        "no-console": ["error", {
            allow: ["warn", "error"],
        }],

        "require-await": ["error"],
        "no-confusing-arrow": ["error"],
        "no-const-assign": ["error"],
        "no-duplicate-imports": ["error"],
        "no-useless-computed-key": ["error"],
        "no-useless-rename": ["error"],
        "no-var": ["error"],
        "prefer-arrow-callback": ["warn"],
        "prefer-const": ["error"],
        "prefer-rest-params": ["warn"],
        "prefer-spread": ["warn"],

        indent: ["error", 4, {
            SwitchCase: 1,
        }],
    },
}];
