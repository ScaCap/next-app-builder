// eslint-disable-next-line
module.exports = api => {
    api.cache(true);
    return {
        presets: ['@babel/env', '@babel/preset-react', '@babel/typescript'],
        plugins: [
            '@babel/proposal-object-rest-spread',
            '@babel/plugin-proposal-nullish-coalescing-operator',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-optional-chaining',
            '@babel/plugin-transform-runtime'
        ]
    };
};
