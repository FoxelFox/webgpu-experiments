const path = require('path');

module.exports = {
    entry: './src/blub/main.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.(png|jpe?g|gif|webm)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'static/[path][name].[hash][ext]'
                }
            },
            {
                test: /\.wgsl$/i,
                use: 'raw-loader',
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
};
