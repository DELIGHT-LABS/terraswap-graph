const { DefaultNamingStrategy } = require('typeorm')
const { values, snakeCase } = require('lodash')
const entities = require('orm/entities')

class CamelToSnakeNamingStrategy extends DefaultNamingStrategy {
  tableName(targetName, userSpecifiedName) {
    return userSpecifiedName ? userSpecifiedName : snakeCase(targetName)
  }
  columnName(propertyName, customName, embeddedPrefixes) {
    return snakeCase(embeddedPrefixes.concat(customName ? customName : propertyName).join('_'))
  }
  columnNameCustomized(customName) {
    return customName
  }
  relationName(propertyName) {
    return snakeCase(propertyName)
  }
}

const connectionOptions = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || "terraswap_graph_user",
  password: process.env.DB_PASSWORD || "terraswap_graph_password",
  database: process.env.DB_NAME || "terraswap_graph",
  logging: process.env.NODE_ENV !== 'prod'
}

module.exports = [
  {
    name: 'default',
    type: 'postgres',
    synchronize: false,
    migrationsRun: false,
    logging: true,
    logger: 'file',
    migrations: ['src/orm/migrations/*.ts'],
    ...connectionOptions,
  },
  {
    name: 'migration',
    type: 'postgres',
    synchronize: false,
    migrationsRun: true,
    logging: true,
    logger: 'file',
    supportBigNumbers: true,
    bigNumberStrings: true,
    entities: values(entities),
    migrations: ['src/orm/migrations/*.ts'],
    namingStrategy: new CamelToSnakeNamingStrategy(),
    ...connectionOptions,
  },
]
