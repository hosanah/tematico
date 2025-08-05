/**
 * Rotas de autenticação
 * Inclui login, logout e validação de token
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const { getDatabase } = require('../config/database');
const { generateToken, authenticateToken, verifyToken } = require('../middleware/auth');

const router = express.Router();

/**
 * POST /auth/login
 * Autenticar usuário e retornar token JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar dados de entrada
    if (!username || !password) {
      return res.status(400).json({
        error: 'Username e password são obrigatórios',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Buscar usuário no banco de dados
    const db = getDatabase();
    
    db.get(
      'SELECT id, username, email, password, full_name, is_active FROM users WHERE (username = ? OR email = ?) AND is_active = 1',
      [username, username],
      async (err, user) => {
        if (err) {
          console.error('❌ Erro ao buscar usuário:', err.message);
          return res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
          });
        }

        if (!user) {
          console.log(`❌ Tentativa de login com usuário inexistente: ${username}`);
          return res.status(401).json({
            error: 'Credenciais inválidas',
            code: 'INVALID_CREDENTIALS'
          });
        }

        try {
          // Verificar senha
          const isPasswordValid = await bcrypt.compare(password, user.password);
          
          if (!isPasswordValid) {
            console.log(`❌ Tentativa de login com senha incorreta para: ${username}`);
            return res.status(401).json({
              error: 'Credenciais inválidas',
              code: 'INVALID_CREDENTIALS'
            });
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
          return res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
          });
        }
      }
    );

  } catch (error) {
    console.error('❌ Erro no login:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /auth/logout
 * Logout do usuário (invalidar token no frontend)
 */
router.post('/logout', authenticateToken, (req, res) => {
  try {
    console.log(`✅ Logout realizado: ${req.user.username} (ID: ${req.user.id})`);
    
    res.json({
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no logout:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * GET /auth/me
 * Obter informações do usuário autenticado
 */
router.get('/me', authenticateToken, (req, res) => {
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
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /auth/validate
 * Validar token JWT
 */
router.post('/validate', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        error: 'Token é obrigatório',
        code: 'TOKEN_REQUIRED'
      });
    }

    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: 'Token inválido ou expirado',
        code: 'TOKEN_INVALID'
      });
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
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

/**
 * POST /auth/register
 * Registrar novo usuário (opcional)
 */
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, fullName } = req.body;

    // Validar dados de entrada
    if (!username || !email || !password) {
      return res.status(400).json({
        error: 'Username, email e password são obrigatórios',
        code: 'MISSING_FIELDS'
      });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválido',
        code: 'INVALID_EMAIL'
      });
    }

    // Validar senha (mínimo 6 caracteres)
    if (password.length < 6) {
      return res.status(400).json({
        error: 'Senha deve ter pelo menos 6 caracteres',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    const db = getDatabase();

    // Verificar se usuário já existe
    db.get(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email],
      async (err, existingUser) => {
        if (err) {
          console.error('❌ Erro ao verificar usuário existente:', err.message);
          return res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
          });
        }

        if (existingUser) {
          return res.status(409).json({
            error: 'Usuário ou email já existe',
            code: 'USER_EXISTS'
          });
        }

        try {
          // Hash da senha
          const hashedPassword = await bcrypt.hash(password, 12);

          // Inserir novo usuário
          db.run(
            'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, fullName || username],
            function(err) {
              if (err) {
                console.error('❌ Erro ao criar usuário:', err.message);
                return res.status(500).json({
                  error: 'Erro ao criar usuário',
                  code: 'CREATE_USER_ERROR'
                });
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
          return res.status(500).json({
            error: 'Erro interno do servidor',
            code: 'INTERNAL_ERROR'
          });
        }
      }
    );

  } catch (error) {
    console.error('❌ Erro no registro:', error);
    res.status(500).json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router;

