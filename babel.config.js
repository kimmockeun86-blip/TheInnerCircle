module.exports = function (api) {
    api.cache(true);

    const isProduction = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';

    return {
        presets: ['babel-preset-expo'],
        plugins: [
            // 프로덕션 빌드에서 console.log, console.warn, console.error 제거
            isProduction && ['transform-remove-console', { exclude: ['error'] }]
        ].filter(Boolean),
    };
};