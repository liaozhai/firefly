import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import babel from '@rollup/plugin-babel';
import json from '@rollup/plugin-json';
import css from 'rollup-plugin-css-porter';
// import cpy from 'rollup-plugin-cpy';

const extensions = [
  '.js', '.jsx', '.ts', '.tsx', '.css'
];

const name = 'GMX';

export default [
    {
        input: './src/index.ts',
        output: {
            file: 'public/main.js',
            format: 'iife',
            name,
            sourcemap: true,            
            globals: {
                'leaflet': 'L',
                'pixi.js': 'PIXI'
            },
        },        
        plugins: [    
            resolve({                 
                extensions,
                preferBuiltins: false,
            }),
            commonjs(),            
            json(),
            css({dest: 'public/main.css', minified: false}),        
            // cpy([                
            //     {files: 'schema.graphql', dest: 'dist'},
            // ]),            
            babel({
                extensions,
                babelHelpers: 'bundled',
                include: ['src/**/*'],
            }),
        ],    
    }
];