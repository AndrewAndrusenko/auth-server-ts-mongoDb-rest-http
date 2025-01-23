"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loggerPino = void 0;
const pino_1 = require("pino");
const environment_1 = require("../environment/environment");
exports.loggerPino = (0, pino_1.pino)(environment_1.ENVIRONMENT.LOGGING.OPTIONS, pino_1.pino.transport(environment_1.ENVIRONMENT.LOGGING.TRANSPORT));
