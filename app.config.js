// Dynamic Expo configuration with environment variables
// This replaces the static app.json for dynamic configuration

export default ({ config }) => {
    // APP_ENV can be set via EAS build profiles or command line
    const env = process.env.APP_ENV || 'production';

    const apiUrls = {
        development: 'http://localhost:3000/api',
        preview: 'https://theinnercircle-9xye.onrender.com/api',
        production: 'https://theinnercircle-9xye.onrender.com/api'
    };

    console.log(`[Config] Building for environment: ${env}`);
    console.log(`[Config] API URL: ${apiUrls[env]}`);

    return {
        ...config,
        extra: {
            ...config.extra,
            apiUrl: apiUrls[env],
            appEnv: env
        }
    };
};
