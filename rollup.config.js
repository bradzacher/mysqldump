import pluginTypescript from 'rollup-plugin-typescript'
import typescript from 'typescript'

import packageJson from './package.json'

export default {
    input: './src/main.ts',
    name: 'mysqldump',
    output: [
        {
            file: packageJson.main,
            format: 'umd',
        },
        {
            file: packageJson.module,
            format: 'es',
        },
    ],

    plugins: [
        pluginTypescript({
            typescript,
        }),
    ],

    external: [
        'assert',
        'deepmerge',
        'fs',
        'mysql2',
        'mysql2/promise',
        'sql-formatter',
        'sqlstring',
    ],
}
