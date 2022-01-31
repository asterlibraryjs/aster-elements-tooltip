import commonjs from "@rollup/plugin-commonjs";
import sourcemap from "rollup-plugin-sourcemaps";
import css from "rollup-plugin-import-css";
import copy from "rollup-plugin-copy";

export default [
    {
        input: "lib/src/index.js",
        output: [
            {
                file: "lib/aster-tooltip.js",
                format: "esm",
                compact: true,
                sourcemap: true
            }
        ],
        plugins: [
            css(),
            commonjs(),
            sourcemap(),
            copy({
                hook: "buildStart",
                targets: [
                    { src: "src/**/*.css", dest: "lib/src/" }
                ]
            })
        ]
    }
];
