const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

const { typeDefs, resolvers } = require('./schema');
const { sequelize } = require('./database');
const config = require('./config');

async function startServer() {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: false, // Disable for GraphQL Playground
  }));
  
  // CORS configuration
  app.use(cors({
    origin: config.cors.origin,
    credentials: true,
  }));

  // Body parsing middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Static file serving
  app.use('/static', express.static(path.join(__dirname, '../data')));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Create Apollo Server
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      req,
      user: req.user, // Add user context if authentication is implemented
    }),
    introspection: config.graphql.introspection,
    playground: config.graphql.playground,
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  // Initialize database
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    if (config.database.sync) {
      await sequelize.sync({ force: config.database.forceSync });
      console.log('Database synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }

  // Start server
  const PORT = config.server.port;
  const HOST = config.server.host;

  app.listen(PORT, HOST, () => {
    console.log(`🚀 Server ready at http://${HOST}:${PORT}`);
    console.log(`📊 GraphQL endpoint: http://${HOST}:${PORT}${server.graphqlPath}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await sequelize.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully');
    await sequelize.close();
    process.exit(0);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

startServer().catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
}); 