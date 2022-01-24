import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import sourcemap from "rollup-plugin-sourcemaps";
import css from "rollup-plugin-import-css";
import copy from "rollup-plugin-copy";
import pkg from "../package.json";

export default [
    {
        input: ".bin/demo/demo/index.js",
        output: [
            {
                file: ".bin/aster-tootip.js",
                format: "esm",
                compact: true,
                sourcemap: true
            }
        ],
        plugins: [
            css(),
            commonjs(),
            resolve(),
            sourcemap(),
            copy({
                hook: "buildStart",
                targets: [
                    { src: "src/**/*.css", dest: ".bin/demo/src/" }
                ]
            })
        ],
        external: [
            ...Object.keys(pkg.devDependencies || {})
        ]
    }
];
