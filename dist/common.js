"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.port = exports.options = exports.schemas = exports.database = void 0;
const postgraphile_1 = require("postgraphile");
const pg_pubsub_1 = __importDefault(require("@graphile/pg-pubsub"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// @ts-ignore `@graphile/pg-pubsub` pulls types from npm `postgraphile` module rather than local version.
const pluginHook = postgraphile_1.makePluginHook([pg_pubsub_1.default]);
const MySubscriptionPlugin = postgraphile_1.makeExtendSchemaPlugin(build => {
    return {
        typeDefs: postgraphile_1.gql `
      type TimePayload {
        currentTimestamp: String
        query: Query
      }
      extend type Subscription {
        time: TimePayload @pgSubscription(topic: "time")
      }
    `,
        resolvers: {
            Subscription: {
                time(event) {
                    return event;
                },
            },
            TimePayload: {
                query() {
                    return build.$$isQuery;
                },
            },
        },
    };
});
// Connection string (or pg.Pool) for PostGraphile to use
exports.database = process.env.DATABASE_URL || 'postgraphile';
// Database schemas to use
exports.schemas = ['dbo'];
// PostGraphile options; see https://www.graphile.org/postgraphile/usage-library/#api-postgraphilepgconfig-schemaname-options
exports.options = {
    pluginHook,
    appendPlugins: [MySubscriptionPlugin],
    pgSettings(req) {
        var _a;
        // Adding this to ensure that all servers pass through the request in a
        // good enough way that we can extract headers.
        // CREATE FUNCTION current_user_id() RETURNS text AS $$ SELECT current_setting('graphile.test.x-user-id', TRUE); $$ LANGUAGE sql STABLE;
        return {
            'graphile.test.x-user-id': req.headers['x-user-id'] || ((_a = 
            // `normalizedConnectionParams` comes from websocket connections, where
            // the headers often cannot be customized by the client.
            req.normalizedConnectionParams) === null || _a === void 0 ? void 0 : _a['x-user-id']),
        };
    },
    watchPg: true,
    graphiql: true,
    enhanceGraphiql: true,
    subscriptions: true,
    dynamicJson: true,
    setofFunctionsContainNulls: false,
    ignoreRBAC: false,
    showErrorStack: 'json',
    extendedErrors: ['hint', 'detail', 'errcode'],
    allowExplain: true,
    legacyRelations: 'omit',
    exportGqlSchemaPath: `${__dirname}/schema.graphql`,
    sortExport: true,
};
exports.port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
//# sourceMappingURL=common.js.map