const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const webpack = require('webpack');

const fs = require('fs-extra');
// fs.removeSync(`./dist`);

const extractSass = new ExtractTextPlugin({
    filename: (getPath) => {
        return getPath('[name].css');
    }
});

function generatorHtml() {
    const dir = `./src/views/`;
    const dirs = (fs.readdirSync(dir)).filter(filename => fs.statSync(`${dir}/${filename}`).isDirectory());
    const results = [];
    dirs.forEach((name) => {
        results.push(new HtmlWebpackPlugin({
            alwaysWriteToDisk: true,
            filename: `${name}/${name}.html`,
            template: `ejs-render-loader!./src/views/${name}/index.ejs`,
            inject: 'body',
            // title: '首页',
            chunks: [name],
            favicon: resolve(__dirname, 'public', 'favicon.ico'),
            hash: true
        }))
    });
    return results;
}


async function generatorEntry() {
    const dir = resolve(__dirname, 'src', 'views');
    const dirs = (await fs.readdir(dir)).filter(filename => fs.statSync(`${dir}/${filename}`).isDirectory());
    const d = dirs.reduce(($dirs, $dir) => {
        $dirs = {
            ...$dirs,
            [$dir]: resolve(dir, $dir, 'index.ts') //`${dir}${$dir}/index.js`
        };
        return $dirs;
    }, {});
    return d;
}

async function generator() {
    return {
        entry: await generatorEntry(),
        output: {
            filename: '[name]/index.js',
            path: resolve(__dirname, 'dist')
        },
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            "presets": [
                                ["env", {
                                    "targets": {
                                        "browsers": ["last 2 versions", "safari >= 7"]
                                    }
                                }]
                            ]
                        }
                    }
                },
                { test: /\.tsx?$/, loader: 'ts-loader' },
                {
                    test: /\.css$/,
                    use: [{
                        loader: 'style-loader',
                    },
                    {
                        loader: 'css-loader',
                        options: {
                            importLoaders: 1,
                        }
                    },
                    {
                        loader: 'postcss-loader'
                    }]
                    // use: ExtractTextPlugin.extract({
                    //     fallback: 'style-loader',
                    //     use: [
                    //       { loader: 'css-loader', options: { importLoaders: 1 } },
                    //       'postcss-loader'
                    //     ]
                    //   })
                }]
        },
        devServer: {
            contentBase: __dirname + '/dist',
            hot: true,
            inline: true
        },
        resolve: {
            // Add `.ts` and `.tsx` as a resolvable extension.
            extensions: ['.ts', '.tsx', '.js']
        },
        devtool: 'inline-source-map',
        plugins: [
            ...generatorHtml(),
            // 强制重新生成html文件
            new HtmlWebpackHarddiskPlugin(),
            // 提取css 文件
            // extractSass,
            new webpack.HotModuleReplacementPlugin()
        ]
    }
}

module.exports = generator();