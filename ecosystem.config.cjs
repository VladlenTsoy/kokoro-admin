module.exports = {
    apps: [
        {
            name: "kokoro-admin",
            cwd: __dirname,
            script: "npm",
            args: "run start",
            env_file: ".env",
            env: {
                NODE_ENV: "production",
                PORT: process.env.PORT || 4173
            }
        }
    ]
}
