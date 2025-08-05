/**
 * Configuração do banco de dados SQLite
 * Inclui inicialização e operações básicas
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

// Caminho do banco de dados
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../database/users.db');

let db = null;

/**
 * Conectar ao banco de dados SQLite
 */
function connectDatabase() {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('❌ Erro ao conectar com o banco de dados:', err.message);
        reject(err);
      } else {
        console.log('✅ Conectado ao banco de dados SQLite');
        resolve(db);
      }
    });
  });
}

/**
 * Criar tabelas necessárias
 */
function createTables() {
  return new Promise((resolve, reject) => {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        full_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT 1
      )
    `;

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token_hash TEXT NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `;

    db.serialize(() => {
      db.run(createUsersTable, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela users:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Tabela users criada/verificada');
      });

      db.run(createSessionsTable, (err) => {
        if (err) {
          console.error('❌ Erro ao criar tabela sessions:', err.message);
          reject(err);
          return;
        }
        console.log('✅ Tabela sessions criada/verificada');
        resolve();
      });
    });
  });
}

/**
 * Criar usuário padrão para testes
 */
async function createDefaultUser() {
  return new Promise(async (resolve, reject) => {
    try {
      // Verificar se já existe usuário admin
      db.get('SELECT id FROM users WHERE username = ?', ['admin'], async (err, row) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          console.log('✅ Usuário admin já existe');
          resolve();
          return;
        }

        // Criar usuário admin padrão
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        const insertUser = `
          INSERT INTO users (username, email, password, full_name)
          VALUES (?, ?, ?, ?)
        `;

        db.run(insertUser, [
          'admin',
          'admin@example.com',
          hashedPassword,
          'Administrador'
        ], function(err) {
          if (err) {
            console.error('❌ Erro ao criar usuário padrão:', err.message);
            reject(err);
            return;
          }
          
          console.log('✅ Usuário admin criado com sucesso');
          console.log('📧 Email: admin@example.com');
          console.log('🔑 Senha: admin123');
          resolve();
        });
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Inicializar banco de dados
 */
async function initDatabase() {
  try {
    await connectDatabase();
    await createTables();
    await createDefaultUser();
    console.log('🎉 Banco de dados inicializado completamente');
  } catch (error) {
    console.error('❌ Erro na inicialização do banco:', error);
    throw error;
  }
}

/**
 * Obter instância do banco de dados
 */
function getDatabase() {
  if (!db) {
    throw new Error('Banco de dados não inicializado');
  }
  return db;
}

/**
 * Fechar conexão com banco de dados
 */
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log('✅ Conexão com banco de dados fechada');
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initDatabase,
  getDatabase,
  closeDatabase,
  connectDatabase,
  createTables,
  createDefaultUser
};

