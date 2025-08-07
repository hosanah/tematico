/**
 * Rotas de autenticação
 * Inclui login, logout e validação de token
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/database');
const { generateToken, authenticateToken, verifyToken } = require('../middleware/auth');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /auth/login
 * Autenticar usuário e retornar token JWT
 */
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Validar dados de entrada
    if (!username || !password) {
      return next(new ApiError(400, 'Username e password são obrigatórios', 'MISSING_CREDENTIALS'));
    }

    // Buscar usuário no banco de dados
    const db = getDatabase();
    
    db.get(
      'SELECT id, username, email, password, full_name, is_active FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
      [username, username],
      async (err, user) => {
        if (err) {
          console.error('❌ Erro ao buscar usuário:', err.message);
          return next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', err.message));
        }

        if (!user) {
          console.log(`❌ Tentativa de login com usuário inexistente: ${username}`);
          return next(new ApiError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS'));
        }

        try {
          // Verificar senha
          const isPasswordValid = await bcrypt.compare(password, user.password);
          
          if (!isPasswordValid) {
            console.log(`❌ Tentativa de login com senha incorreta para: ${username}`);
            return next(new ApiError(401, 'Credenciais inválidas', 'INVALID_CREDENTIALS'));
          }

          // Gerar token JWT
          const token = generateToken(user.id, user.username);

          // Log de sucesso
          console.log(`✅ Login bem-sucedido: ${user.username} (ID: ${user.id})`);

          // Retornar dados do usuário e token
          res.json({
            message: 'Login realizado com sucesso',
            token: token,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              fullName: user.full_name
            },
            expiresIn: '24h'
          });

        } catch (bcryptError) {
          console.error('❌ Erro ao verificar senha:', bcryptError);
          return next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', bcryptError.message));
        }
      }
    );

  } catch (error) {
    console.error('❌ Erro no login:', error);
    next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', error.message));
  }
});

/**
 * POST /auth/logout
 * Logout do usuário (invalidar token no frontend)
 */
router.post('/logout', authenticateToken, (req, res, next) => {
  try {
    console.log(`✅ Logout realizado: ${req.user.username} (ID: ${req.user.id})`);
    
    res.json({
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', error.message));
  }
});

/**
 * GET /auth/me
 * Obter informações do usuário autenticado
 */
router.get('/me', authenticateToken, (req, res, next) => {
  try {
    res.json({
      user: req.user,
      token: {
        issuedAt: req.token.iat,
        expiresAt: req.token.exp
      }
    });
  } catch (error) {
    console.error('❌ Erro ao obter dados do usuário:', error);
    next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', error.message));
  }
});

/**
 * POST /auth/validate
 * Validar token JWT
 */
router.post('/validate', (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return next(new ApiError(400, 'Token é obrigatório', 'TOKEN_REQUIRED'));
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return next(new ApiError(401, 'Token inválido ou expirado', 'TOKEN_INVALID'));
    }

    res.json({
      valid: true,
      decoded: {
        userId: decoded.userId,
        username: decoded.username,
        issuedAt: decoded.iat,
        expiresAt: decoded.exp
      }
    });

  } catch (error) {
    console.error('❌ Erro na validação do token:', error);
    next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', error.message));
  }
});

/**
 * POST /auth/register
 * Registrar novo usuário (opcional)
 */
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validar dados de entrada
    if (!username || !email || !password) {
      return next(new ApiError(400, 'Username, email e password são obrigatórios', 'MISSING_FIELDS'));
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return next(new ApiError(400, 'Formato de email inválido', 'INVALID_EMAIL'));
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return next(new ApiError(400, 'Senha deve ter pelo menos 6 caracteres', 'PASSWORD_TOO_SHORT'));
    }

    const db = getDatabase();

    // Verificar se usuário já existe
    db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email],
      async (err, existingUser) => {
        if (err) {
          console.error('❌ Erro ao verificar usuário existente:', err.message);
          return next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', err.message));
        }

        if (existingUser) {
          return next(new ApiError(409, 'Usuário ou email já existe', 'USER_EXISTS'));
        }

        try {
          // Hash da senha
          const hashedPassword = await bcrypt.hash(password, 12);

          // Inserir novo usuário
          db.run(
            'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?) RETURNING id',
            [username, email, hashedPassword, fullName || username],
            function(err) {
            if (err) {
              console.error('❌ Erro ao criar usuário:', err.message);
              return next(new ApiError(500, 'Erro ao criar usuário', 'CREATE_USER_ERROR', err.message));
            }

              console.log(`✅ Usuário criado: ${username} (ID: ${this.lastID})`);

              res.status(201).json({
                message: 'Usuário criado com sucesso',
                user: {
                  id: this.lastID,
                  username: username,
                  email: email,
                  fullName: fullName || username
                }
              });
            }
          );

        } catch (hashError) {
          console.error('❌ Erro ao hash da senha:', hashError);
          return next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', hashError.message));
        }
      }
    );

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', error.message));
  }
});

/**
 * POST /auth/reset-password
 * Resetar senha do usuário através do email
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new ApiError(400, 'Email e nova senha são obrigatórios', 'MISSING_FIELDS'));
    }

    if (password.length < 6) {
      return next(new ApiError(400, 'Senha deve ter pelo menos 6 caracteres', 'PASSWORD_TOO_SHORT'));
    }

    const db = getDatabase();
    db.get('SELECT id FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) {
        console.error('❌ Erro ao buscar usuário para reset de senha:', err.message);
        return next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', err.message));
      }

      if (!user) {
        return next(new ApiError(404, 'Usuário não encontrado', 'USER_NOT_FOUND'));
      }

      try {
        const hashed = await bcrypt.hash(password, 12);
        db.run('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashed, user.id], function(err) {
          if (err) {
            console.error('❌ Erro ao atualizar senha:', err.message);
            return next(new ApiError(500, 'Erro ao atualizar senha', 'UPDATE_PASSWORD_ERROR', err.message));
          }

          console.log(`🔄 Senha redefinida para usuário ID ${user.id}`);
          res.json({ message: 'Senha atualizada com sucesso' });
        });
      } catch (hashError) {
        console.error('❌ Erro ao hash da nova senha:', hashError);
        return next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', hashError.message));
      }
    });
  } catch (error) {
    console.error('❌ Erro no reset de senha:', error);
    next(new ApiError(500, 'Erro interno do servidor', 'INTERNAL_ERROR', error.message));
  }
});

module.exports = router;

