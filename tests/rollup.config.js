import commonjs from "@rollup/plugin-commonjs";
import multiEntry from "@rollup/plugin-multi-entry";
import resolve from "@rollup/plugin-node-resolve";
import sourcemap from "rollup-plugin-sourcemaps";
import css from "rollup-plugin-import-css";
import copy from "rollup-plugin-copy";
import pkg from "../package.json";

export default [
    {
        input: "../.bin/tests/*.test.js",
        output: [
            {
                file: "../.bin/tests.js",
                format: "iife",
                compact: true,
                sourcemap: true,
                globals: {
                    chai: "chai",
                    sinon: "sinon"
                }
            }
        ],
        plugins: [
            css(),
            commonjs(),
            resolve(),
            multiEntry(),
            sourcemap(),
            copy({
                hook: "buildStart",
                targets: [
                    { src: "../src/**/*.css", dest: "../.bin/src/" }
                ]
            })
        ],
        external: [
            ...Object.keys(pkg.devDependencies || {})
        ]
    }
];
