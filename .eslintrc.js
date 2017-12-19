// the global list airbnb uses - we remove the name one because of the typescript parser's interactions...
const restrictedGlobals = require('eslint-restricted-globals').filter(g => g !== 'name')

module.exports = {
    'globals': {},
    'env': {
        'commonjs': true,
        'es6': true,
        'node': true,
    },
    'extends': [
        'airbnb-base',
    ],
    'plugins': [
        'typescript',
        'import',
    ],
    'parser': 'typescript-eslint-parser',
    'parserOptions': {
        'ecmaVersion': 6,
        'ecmaFeatures': {
            'experimentalObjectRestSpread': true,
        },
        'sourceType': 'module',
    },
    'settings': {
        'import/extensions': [
            'js',
            'ts',
        ],
    },
    'rules': {
        // when they enable configurability, we will enable this
        'typescript/type-annotation-spacing': 'off',
        'typescript/explicit-member-accessibility': 'error',
        'typescript/no-angle-bracket-type-assertion': 'error',

        // currently broken (27/11/2017)
        'no-shadow-restricted-names': 'off',

        'import/extensions': [
            'error',
            {
                'js': 'never',
                'ts': 'never',
                'json': 'always'
            }
        ],
        'import/no-extraneous-dependencies': [
            'error',
            {
                'devDependencies': true,
                'peerDependencies': true,
                'optionalDependencies': true
            }
        ],
        'import/no-unresolved': 'off',
        'class-methods-use-this': [
            'off'
        ],
        'comma-dangle': [
            'error',
            {
                'arrays': 'always-multiline',
                'objects': 'always-multiline',
                'imports': 'always-multiline',
                'exports': 'always-multiline',
                'functions': 'never'
            }
        ],
        'complexity': [
            'error',
            8
        ],
        'function-paren-newline': [
            'error',
            'consistent',
        ],
        // TODO - remove when fixed: https://github.com/eslint/typescript-eslint-parser/issues/344
        'indent-legacy': [
            'error',
            4,
            {
                'SwitchCase': 1
            }
        ],
        'indent': 0,
        'linebreak-style': [
            'error',
            'unix'
        ],
        'max-depth': [
            'error',
            4
        ],
        'max-len': [
            'warn',
            {
                'code': 120,
                'tabWidth': 4,
                'ignoreComments': false,
                'ignoreUrls': true
            }
        ],
        'max-nested-callbacks': [
            'error',
            5
        ],
        'newline-before-return': [
            'error'
        ],
        'no-await-in-loop': 'off',
        'no-console': [
            'error',
            {
                'allow': [
                    'info',
                    'error',
                    'warn',
                    'time',
                    'timeEnd',
                    // custom console fns
                    'debug',
                    'infoPad',
                    'debugPad',
                ]
            }
        ],
        'no-continue': 'off',
        'no-extra-semi': [
            'error'
        ],
        'no-multi-spaces': [
            'warn',
            {
                'exceptions': {
                    'VariableDeclarator': true
                }
            }
        ],
        'no-param-reassign': [
            'warn',
            {
                'props': false
            }
        ],
        'no-plusplus': [
            'error',
            {
                'allowForLoopAfterthoughts': true
            }
        ],
        'no-prototype-builtins': [
            'off'
        ],
        'no-restricted-globals': [
            'error',
            'isFinite',
        ].concat(restrictedGlobals),
        'no-tabs': 'error',
        'no-unexpected-multiline': 'error',
        'no-unreachable': 'error',
        'no-unused-expressions': [
            'error',
            {
                'allowShortCircuit': true
            }
        ],
        'object-curly-newline': [
            'error',
            {
                'consistent': true
            },
        ],
        'quotes': [
            'error',
            'single'
        ],
        'semi': [
            'error',
            'never'
        ],
        'spaced-comment': [
            'warn',
            'always',
            {
                'exceptions': [
                    '*'
                ]
            }
        ],

        // disabled because typescript linter will get them for us
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'strict': 'off',

        // disabled because broken
        'space-infix-ops': 'off',

        // disabled because it doesn't work properly...
        'prefer-destructuring': 'off',
    }
}
