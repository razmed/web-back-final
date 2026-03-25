const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Charger les variables d'environnement de test
require('dotenv').config({ path: '.env.test' });

const app = require('../server');

// Configuration des logs détaillés
const logTest = (testName, step, data) => {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TEST: ${testName}`);
  console.log(`STEP: ${step}`);
  console.log(`TIME: ${new Date().toISOString()}`);
  console.log(`DATA:`, JSON.stringify(data, null, 2));
  console.log('='.repeat(80));
};

const logError = (testName, error) => {
  console.error(`\n${'!'.repeat(80)}`);
  console.error(`ERROR IN TEST: ${testName}`);
  console.error(`TIME: ${new Date().toISOString()}`);
  console.error(`MESSAGE: ${error.message}`);
  console.error(`STACK:`, error.stack);
  console.error('!'.repeat(80));
};

const logResponse = (testName, response) => {
  console.log(`\n${'-'.repeat(80)}`);
  console.log(`RESPONSE FOR: ${testName}`);
  console.log(`STATUS: ${response.status}`);
  console.log(`HEADERS:`, JSON.stringify(response.headers, null, 2));
  console.log(`BODY:`, JSON.stringify(response.body, null, 2));
  console.log('-'.repeat(80));
};

describe('Authentication Tests - Login Route', () => {
  let server;

  // Variables pour les tests
  const validCredentials = {
    email: process.env.ADMIN_EMAIL || 'admin@sntp.dz',
    password: 'admin123' // Le mot de passe utilisé pour générer le hash
  };

  beforeAll(async () => {
    logTest('SETUP', 'beforeAll', {
      message: 'Initialisation des tests d\'authentification',
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        JWT_SECRET: process.env.JWT_SECRET ? 'DÉFINI' : 'NON DÉFINI',
        ADMIN_EMAIL: process.env.ADMIN_EMAIL,
        ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH ? 'DÉFINI (' + process.env.ADMIN_PASSWORD_HASH.substring(0, 10) + '...)' : 'NON DÉFINI'
      }
    });

    // Vérifier que toutes les variables nécessaires sont définies
    if (!process.env.ADMIN_PASSWORD_HASH) {
      throw new Error('ADMIN_PASSWORD_HASH non défini dans .env.test. Exécutez: node generateAdminPassword.js');
    }

    // Démarrer le serveur pour les tests
    server = app.listen(0); // Port 0 = port aléatoire disponible
  });

  afterAll(async () => {
    logTest('TEARDOWN', 'afterAll', {
      message: 'Nettoyage après tous les tests'
    });

    // Fermer le serveur
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
      });
    }
  });

  beforeEach(() => {
    logTest('SETUP', 'beforeEach', {
      message: 'Préparation avant chaque test'
    });
  });

  afterEach(() => {
    logTest('TEARDOWN', 'afterEach', {
      message: 'Nettoyage après chaque test'
    });
  });



  // TEST 1: Login réussi avec des credentials valides
  describe('POST /api/auth/login - Success Cases', () => {
    test('Should login successfully with valid credentials', async () => {
      const testName = 'Login Success - Valid Credentials';
      
      try {
        logTest(testName, 'START', {
          endpoint: '/api/auth/login',
          method: 'POST',
          credentials: { email: validCredentials.email, password: '***' }
        });

        logTest(testName, 'SENDING REQUEST', {
          url: '/api/auth/login',
          body: validCredentials
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(validCredentials)
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        // Vérifications
        logTest(testName, 'CHECKING STATUS CODE', {
          expected: 200,
          received: response.status
        });
        expect(response.status).toBe(200);

        logTest(testName, 'CHECKING RESPONSE STRUCTURE', {
          hasSuccess: 'success' in response.body,
          hasToken: 'token' in response.body,
          hasUser: 'user' in response.body
        });
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('user');

        // Vérifier le token JWT
        logTest(testName, 'VALIDATING JWT TOKEN', {
          token: response.body.token.substring(0, 20) + '...',
          tokenLength: response.body.token.length
        });
        
        const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
        logTest(testName, 'JWT DECODED', {
          email: decoded.email,
          role: decoded.role,
          exp: new Date(decoded.exp * 1000).toISOString()
        });
        
        expect(decoded).toHaveProperty('email', validCredentials.email);
        expect(decoded).toHaveProperty('role', 'admin');

        // Vérifier les infos utilisateur
        logTest(testName, 'CHECKING USER INFO', response.body.user);
        expect(response.body.user).toHaveProperty('email', validCredentials.email);
        expect(response.body.user).toHaveProperty('role', 'admin');

        logTest(testName, 'SUCCESS', {
          message: 'Test passed successfully',
          duration: `${Date.now()} ms`
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should return token that expires in 7 days', async () => {
      const testName = 'Login Success - Token Expiration';
      
      try {
        logTest(testName, 'START', {
          message: 'Vérification de l\'expiration du token'
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(validCredentials);

        logResponse(testName, response);

        const decoded = jwt.verify(response.body.token, process.env.JWT_SECRET);
        const expirationDate = new Date(decoded.exp * 1000);
        const now = new Date();
        const daysUntilExpiration = (expirationDate - now) / (1000 * 60 * 60 * 24);

        logTest(testName, 'TOKEN EXPIRATION ANALYSIS', {
          now: now.toISOString(),
          expirationDate: expirationDate.toISOString(),
          daysUntilExpiration: daysUntilExpiration.toFixed(2),
          hoursUntilExpiration: ((expirationDate - now) / (1000 * 60 * 60)).toFixed(2)
        });

        expect(daysUntilExpiration).toBeGreaterThan(6.9);
        expect(daysUntilExpiration).toBeLessThan(7.1);

        logTest(testName, 'SUCCESS', {
          message: 'Token expiration is correct'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });
  });

  // TEST 2: Échec de login - Email invalide
  describe('POST /api/auth/login - Failure Cases - Invalid Email', () => {
    test('Should fail with non-existent email', async () => {
      const testName = 'Login Failure - Non-existent Email';
      
      try {
        const invalidEmail = {
          email: 'nonexistent@example.com',
          password: 'anypassword'
        };

        logTest(testName, 'START', {
          credentials: invalidEmail
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(invalidEmail)
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        logTest(testName, 'CHECKING STATUS CODE', {
          expected: 401,
          received: response.status
        });
        expect(response.status).toBe(401);

        logTest(testName, 'CHECKING ERROR MESSAGE', {
          expected: 'Email ou mot de passe incorrect',
          received: response.body.message
        });
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.message).toContain('Email ou mot de passe incorrect');

        logTest(testName, 'SUCCESS', {
          message: 'Test passed - Unauthorized as expected'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should fail with malformed email', async () => {
      const testName = 'Login Failure - Malformed Email';
      
      try {
        const malformedEmail = {
          email: 'not-an-email',
          password: 'password123'
        };

        logTest(testName, 'START', {
          credentials: malformedEmail
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(malformedEmail)
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        logTest(testName, 'CHECKING VALIDATION ERRORS', {
          status: response.status,
          errors: response.body.errors
        });

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('errors');
        
        const emailError = response.body.errors.find(e => e.path === 'email');
        logTest(testName, 'EMAIL VALIDATION ERROR', emailError);
        expect(emailError).toBeDefined();
        expect(emailError.msg).toContain('Email invalide');

        logTest(testName, 'SUCCESS', {
          message: 'Validation error caught as expected'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should fail with empty email', async () => {
      const testName = 'Login Failure - Empty Email';
      
      try {
        const emptyEmail = {
          email: '',
          password: 'password123'
        };

        logTest(testName, 'START', {
          credentials: emptyEmail
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(emptyEmail)
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('errors');

        logTest(testName, 'SUCCESS', {
          message: 'Empty email validation works'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });
  });

  // TEST 3: Échec de login - Mot de passe invalide
  describe('POST /api/auth/login - Failure Cases - Invalid Password', () => {
    test('Should fail with wrong password', async () => {
      const testName = 'Login Failure - Wrong Password';
      
      try {
        const wrongPassword = {
          email: validCredentials.email,
          password: 'wrongpassword123'
        };

        logTest(testName, 'START', {
          email: wrongPassword.email,
          passwordProvided: 'wrong password (hidden)'
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(wrongPassword)
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        logTest(testName, 'CHECKING RESPONSE', {
          expectedStatus: 401,
          receivedStatus: response.status,
          expectedMessage: 'Email ou mot de passe incorrect',
          receivedMessage: response.body.message
        });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.message).toContain('Email ou mot de passe incorrect');

        // Vérifier qu'aucun token n'est retourné
        logTest(testName, 'CHECKING NO TOKEN', {
          hasToken: 'token' in response.body
        });
        expect(response.body).not.toHaveProperty('token');

        logTest(testName, 'SUCCESS', {
          message: 'Wrong password rejected as expected'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should fail with empty password', async () => {
      const testName = 'Login Failure - Empty Password';
      
      try {
        const emptyPassword = {
          email: validCredentials.email,
          password: ''
        };

        logTest(testName, 'START', {
          credentials: emptyPassword
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(emptyPassword)
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('errors');

        const passwordError = response.body.errors.find(e => e.path === 'password');
        logTest(testName, 'PASSWORD VALIDATION ERROR', passwordError);
        expect(passwordError).toBeDefined();

        logTest(testName, 'SUCCESS', {
          message: 'Empty password validation works'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should fail with missing password field', async () => {
      const testName = 'Login Failure - Missing Password';
      
      try {
        const missingPassword = {
          email: validCredentials.email
        };

        logTest(testName, 'START', {
          requestBody: missingPassword
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(missingPassword)
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        expect(response.status).toBe(400);
        expect(response.body).toHaveProperty('success', false);

        logTest(testName, 'SUCCESS', {
          message: 'Missing password field caught'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });
  });

  // TEST 4: Test de la route de vérification du token
  describe('GET /api/auth/verify - Token Verification', () => {
    let validToken;

    beforeAll(async () => {
      logTest('SETUP', 'Getting valid token', {
        message: 'Obtaining a valid token for verification tests'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send(validCredentials);

      validToken = response.body.token;

      logTest('SETUP', 'Token obtained', {
        token: validToken.substring(0, 20) + '...',
        tokenLength: validToken.length
      });
    });

    test('Should verify valid token successfully', async () => {
      const testName = 'Token Verification - Valid Token';
      
      try {
        logTest(testName, 'START', {
          hasToken: !!validToken
        });

        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', `Bearer ${validToken}`)
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('success', true);
        expect(response.body).toHaveProperty('user');
        expect(response.body.user).toHaveProperty('email', validCredentials.email);

        logTest(testName, 'SUCCESS', {
          message: 'Token verified successfully'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should fail with missing token', async () => {
      const testName = 'Token Verification - Missing Token';
      
      try {
        logTest(testName, 'START', {
          message: 'Testing without Authorization header'
        });

        const response = await request(app)
          .get('/api/auth/verify')
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.message).toContain('Token manquant');

        logTest(testName, 'SUCCESS', {
          message: 'Missing token rejected as expected'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should fail with invalid token format', async () => {
      const testName = 'Token Verification - Invalid Format';
      
      try {
        const invalidToken = 'invalid-token-format';

        logTest(testName, 'START', {
          token: invalidToken
        });

        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', `Bearer ${invalidToken}`)
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.message).toContain('Token invalide');

        logTest(testName, 'SUCCESS', {
          message: 'Invalid token format rejected'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should fail with expired token', async () => {
      const testName = 'Token Verification - Expired Token';
      
      try {
        // Créer un token expiré
        const expiredToken = jwt.sign(
          { 
            email: validCredentials.email,
            role: 'admin'
          },
          process.env.JWT_SECRET,
          { expiresIn: '-1h' } // Token expiré il y a 1 heure
        );

        logTest(testName, 'START', {
          expiredToken: expiredToken.substring(0, 20) + '...'
        });

        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', `Bearer ${expiredToken}`)
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);
        expect(response.body.message).toContain('Token invalide');

        logTest(testName, 'SUCCESS', {
          message: 'Expired token rejected as expected'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should fail without Bearer prefix', async () => {
      const testName = 'Token Verification - Missing Bearer Prefix';
      
      try {
        logTest(testName, 'START', {
          message: 'Testing token without Bearer prefix'
        });

        const response = await request(app)
          .get('/api/auth/verify')
          .set('Authorization', validToken) // Sans "Bearer "
          .expect('Content-Type', /json/);

        logResponse(testName, response);

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('success', false);

        logTest(testName, 'SUCCESS', {
          message: 'Token without Bearer prefix rejected'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });
  });

  // TEST 5: Tests de sécurité
  describe('Security Tests', () => {
    test('Should not leak sensitive information on error', async () => {
      const testName = 'Security - No Info Leakage';
      
      try {
        logTest(testName, 'START', {
          message: 'Testing error message information leakage'
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@sntp.com',
            password: 'wrongpassword'
          });

        logResponse(testName, response);

        // Vérifier que le message d'erreur ne révèle pas si l'email existe
        logTest(testName, 'CHECKING ERROR MESSAGE', {
          message: response.body.message,
          shouldNotContain: ['n\'existe pas', 'introuvable', 'not found']
        });

        expect(response.body.message).toBe('Email ou mot de passe incorrect');
        expect(response.body.message).not.toContain('n\'existe pas');
        expect(response.body.message).not.toContain('password');
        expect(response.body.message).not.toContain('hash');

        logTest(testName, 'SUCCESS', {
          message: 'No sensitive information leaked'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should handle SQL injection attempts', async () => {
      const testName = 'Security - SQL Injection';
      
      try {
        const sqlInjection = {
          email: "admin@sntp.com' OR '1'='1",
          password: "' OR '1'='1"
        };

        logTest(testName, 'START', {
          injectionAttempt: sqlInjection
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(sqlInjection);

        logResponse(testName, response);

        // Devrait échouer (pas de succès avec injection)
        expect(response.status).not.toBe(200);
        expect(response.body.success).not.toBe(true);

        logTest(testName, 'SUCCESS', {
          message: 'SQL injection attempt blocked'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });

    test('Should handle XSS attempts in email field', async () => {
      const testName = 'Security - XSS Attempt';
      
      try {
        const xssAttempt = {
          email: '<script>alert("XSS")</script>@test.com',
          password: 'password123'
        };

        logTest(testName, 'START', {
          xssAttempt: xssAttempt
        });

        const response = await request(app)
          .post('/api/auth/login')
          .send(xssAttempt);

        logResponse(testName, response);

        // Devrait échouer la validation d'email
        expect(response.status).toBe(400);

        logTest(testName, 'SUCCESS', {
          message: 'XSS attempt blocked by validation'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });
 });

  // TEST 6: Tests de performance et limites
  describe('Performance and Rate Limiting Tests', () => {
    test('Should handle multiple simultaneous login requests', async () => {
      const testName = 'Performance - Concurrent Requests';
      
      try {
        logTest(testName, 'START', {
          numberOfRequests: 5
        });

        const promises = Array(5).fill(null).map(() => 
          request(app)
            .post('/api/auth/login')
            .send(validCredentials)
        );

        const startTime = Date.now();
        const responses = await Promise.all(promises);
        const endTime = Date.now();

        logTest(testName, 'RESPONSES RECEIVED', {
          totalTime: `${endTime - startTime}ms`,
          averageTime: `${(endTime - startTime) / 5}ms`,
          allSuccessful: responses.every(r => r.status === 200)
        });

        responses.forEach((response, index) => {
          logTest(testName, `RESPONSE ${index + 1}`, {
            status: response.status,
            hasToken: !!response.body.token
          });
          expect(response.status).toBe(200);
          expect(response.body).toHaveProperty('token');
        });

        logTest(testName, 'SUCCESS', {
          message: 'All concurrent requests handled successfully'
        });

      } catch (error) {
        logError(testName, error);
        throw error;
      }
    });
  });
});

