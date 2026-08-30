import baseConfig from "../../../eslint.config.mjs";
import nxPlugin from "@nx/eslint-plugin";

export default [
    ...baseConfig,
    {
        files: [
            "**/*.json"
        ],
        plugins: {
            "@nx": nxPlugin
        },
        rules: {
            "@nx/dependency-checks": [
                "error",
                {
                    ignoredFiles: [
                        "{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}"
                    ],
                    // `reflect-metadata` is a NestJS side-effect import (a legit
                    // runtime dependency) that is not directly imported in source,
                    // so the rule would otherwise flag it as obsolete/unused.
                    ignoredDependencies: ["reflect-metadata"]
                }
            ]
        },
        languageOptions: {
            parser: await import("jsonc-eslint-parser")
        }
    }
];
