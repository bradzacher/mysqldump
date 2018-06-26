import pluginTypescript from 'rollup-plugin-typescript2'
import typescript from 'typescript'

import packageJson from './package.json'

export default {
    input: './src/main.ts',
    name: 'mysqldump',
    output: [
        {
            file: packageJson.main,
            format: 'cjs',
        },
        {
            file: packageJson.module,
            format: 'es',
        },
    ],

    plugins: [
        pluginTypescript({
            typescript,
            clean: true,
            useTsconfigDeclarationDir: true,
            tsconfig: './tsconfig.build.json',
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
