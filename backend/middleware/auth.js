/**
 * Middleware de autenticação JWT
 * Verifica e valida tokens JWT nas requisições
 */

const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

/**
 * Middleware para verificar token JWT
 */
function authenticateToken(req, res, next) {
  // Obter token do header Authorization
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  // Verificar se token existe
  if (!token) {
    return res.status(401).json({
      error: 'Token de acesso requerido',
      code: 'TOKEN_REQUIRED'
    });
  }

  // Verificar e decodificar token
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.log('❌ Erro na verificação do token:', err.message);
      
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          error: 'Token expirado',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
          error: 'Token inválido',
          code: 'TOKEN_INVALID'
        });
      }
      
      return res.status(401).json({
        error: 'Falha na autenticação',
        code: 'AUTH_FAILED'
      });
    }

    try {
      // Verificar se usuário ainda existe no banco
      const db = getDatabase();
      
      db.get(
        'SELECT id, username, email, full_name, is_active FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId],
        (err, user) => {
          if (err) {
            console.error('❌ Erro ao buscar usuário:', err.message);
            return res.status(500).json({
              error: 'Erro interno do servidor',
              code: 'INTERNAL_ERROR'
            });
          }

          if (!user) {
            return res.status(401).json({
              error: 'Usuário não encontrado ou inativo',
              code: 'USER_NOT_FOUND'
            });
          }

          // Adicionar informações do usuário à requisição
          req.user = {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.full_name
          };

          // Adicionar token decodificado
          req.token = decoded;

          console.log(`✅ Usuário autenticado: ${user.username} (ID: ${user.id})`);
          next();
        }
      );
    } catch (error) {
      console.error('❌ Erro no middleware de autenticação:', error);
      return res.status(500).json({
        error: 'Erro interno do servidor',
        code: 'INTERNAL_ERROR'
      });
    }
  });
}

/**
 * Middleware opcional - não falha se token não existir
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      req.user = null;
      return next();
    }

    try {
      const db = getDatabase();
      
      db.get(
        'SELECT id, username, email, full_name FROM users WHERE id = ? AND is_active = 1',
        [decoded.userId],
        (err, user) => {
          if (err || !user) {
            req.user = null;
          } else {
            req.user = {
              id: user.id,
              username: user.username,
              email: user.email,
              fullName: user.full_name
            };
          }
          next();
        }
      );
    } catch (error) {
      req.user = null;
      next();
    }
  });
}

/**
 * Gerar token JWT
 */
function generateToken(userId, username) {
  const payload = {
    userId: userId,
    username: username,
    iat: Math.floor(Date.now() / 1000), // Issued at
  };

  const options = {
    expiresIn: '24h', // Token expira em 24 horas
    issuer: 'fullstack-app',
    audience: 'fullstack-users'
  };

  return jwt.sign(payload, process.env.JWT_SECRET, options);
}

/**
 * Verificar se token é válido (sem middleware)
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Decodificar token sem verificar (para debug)
 */
function decodeToken(token) {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  generateToken,
  verifyToken,
  decodeToken
};

