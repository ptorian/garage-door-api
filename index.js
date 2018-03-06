const path = require("path");
const Hapi = require("hapi");
const jwt = require("jsonwebtoken");
const winston = require("winston");
const socketIO = require("socket.io");
require("winston-daily-rotate-file");

const routes = require("./routes");
const config = require("./config");


const appRawFileTransport = new winston.transports.DailyRotateFile({
    name: "appRawFile",
    filename: path.resolve(__dirname, config.logDir, "app.raw.log"),
    datePattern: 'yyyy-MM-dd.',
    prepend: true,
    level: config.logLevel,
    humanReadableUnhandledException: true,
    handleExceptions: true,
    json: false
});

const traceRawFileTransport = new winston.transports.DailyRotateFile({
    name: "traceRawFile",
    filename: path.resolve(__dirname, config.logDir, "trace.raw.log"),
    datePattern: 'yyyy-MM-dd.',
    prepend: true,
    level: config.logLevel,
    humanReadableUnhandledException: true,
    handleExceptions: true,
    json: false
});

const consoleTransport = new winston.transports.Console({
    prepend: true,
    level: config.logLevel,
    humanReadableUnhandledException: true,
    handleExceptions: true,
    json: false,
    colorize: true
});

const appLogger = new winston.Logger({
    transports: [
        appRawFileTransport,
        consoleTransport
    ]
});

const traceLogger = new winston.Logger({
    transports: [
        traceRawFileTransport,
        consoleTransport
    ]
});

async function registerJwt(server) {
    await server.register(require('hapi-auth-jwt2'));

    server.auth.strategy('jwt', 'jwt',
        {
            key: server.app.jwtKey,
            validate: () => ({isValid: true}),
            verifyOptions: { algorithms: [ 'HS256' ] }
        });

    server.auth.default('jwt');
}

async function registerRoutes(server) {
    await server.register(routes, {
        routes: {
            prefix: "/api"
        }
    });
}

function addExtensions(server) {
    const piProvider = null;
    server.ext({
        type: "onRequest",
        method: (request, h) => {
            request.app.getPiProvider = () => {
                return piProvider;
            };

            return h.continue;
        }
    });

    server.ext({
        type: "onPreResponse",
        method: async (request, h) => {
            if (request.response.isBoom) {
                request.server.app.logger.error(request.response);
            }
            request.server.app.traceLogger.info({
                id: request.id,
                path: request.route.path,
                method: request.route.method,
                fingerprint: request.route.fingerprint,
                code: request.response.statusCode
            });

            if (request.app.isAuthenticated && request.response.header != null) {
                const tokenPayload = {};

                const token = jwt.sign(tokenPayload, request.server.app.jwtKey, {expiresIn: config.jwtValidTimespan});
                request.response.header("Authorization", `Bearer ${token}`);
            }

            return h.continue;
        }
    });
}

function setupSocketIO(server) {
    server.app.logger.info("setting up socket.io");
    server.io = socketIO(server.listener);
    server.io.on("connection", (socket) => {
        server.app.logger.info("socket.io connected");
    });
}

async function startServer() {
    try {
        const server = new Hapi.Server({
            host: "0.0.0.0",
            port: 8000,
            routes: {
                cors: {
                    origin: ["*"],
                    additionalExposedHeaders: ["Authorization"]
                }
            }
        });

        server.app.logger = appLogger;
        server.app.traceLogger = traceLogger;
        server.app.jwtKey = config.jwtKey;

        await registerJwt(server);
        await registerRoutes(server);
        addExtensions(server);
        setupSocketIO(server);

        server.events.on('log', (event, tags) => {
            if (tags.error) {
                server.app.logger.error(`Server error: ${event.error}`);
            }
        });


        server.route({
            method: 'OPTIONS',
            path: '/{p*}',
            config: {
                auth: false,
                cors: true,
                handler: (request, h) => {
                    const response = h.response(null);
                    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
                    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
                    return response;
                }
            }
        });

        await server.start();
        appLogger.info('Server running at:', server.info.uri);
    } catch (e) {
        appLogger.error(e);
    }
}

startServer().then(null, err => appLogger.error(err));