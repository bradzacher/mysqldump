module.exports = {
    extends: [
        'brad',
    ],
    parserOptions: {
        'project': './tsconfig.json'
    },
    settings: {
        'import/resolver': {
            'typescript': {},
        },
    },
}
