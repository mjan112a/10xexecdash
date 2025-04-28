/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  transpilePackages: ['ag-grid-react', 'ag-grid-community'],
  webpack: (config, { isServer }) => {
    // Add a rule for handling Handlebars files
    config.module.rules.push({
      test: /\.handlebars$|\.hbs$/,
      loader: 'handlebars-loader'
    });

    // Handle Handlebars runtime issues
    config.resolve.alias = {
      ...config.resolve.alias,
      handlebars: 'handlebars/dist/handlebars.min.js'
    };

    return config;
  }
};

module.exports = nextConfig