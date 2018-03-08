const fs = require("fs");
const path = require("path");

const thisFileBasename = path.basename(module.filename);

exports.plugin = {
    name: "leo-api",
    register: (server, options) => {
        // autoload all files in this directory
        fs
            .readdirSync(__dirname)
            .filter(fileName => (fileName.indexOf('.') !== 0) && (fileName !== thisFileBasename) && (fileName.slice(-3) === '.js'))
            .forEach(fileName => {
                server.route(require(path.join(__dirname, fileName)));
            });
    }
};