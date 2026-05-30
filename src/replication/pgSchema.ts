import pgPool from '../config/pgDatabase.js';

/**
 * Crea todas las tablas en la base de datos PostgreSQL de réplica
 * si aún no existen. Se ejecuta una sola vez al iniciar el servidor.
 */
export async function initPgSchema(): Promise<void> {
  const ddl = `
    CREATE TABLE IF NOT EXISTS branches (
      id_branch   INTEGER     PRIMARY KEY,
      name        VARCHAR(150) NOT NULL,
      address     VARCHAR(255),
      phone       VARCHAR(20),
      status      BOOLEAN     NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS roles (
      id_role     INTEGER      PRIMARY KEY,
      name        VARCHAR(100) NOT NULL,
      description VARCHAR(255),
      status      BOOLEAN      NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS role_access (
      id_access   SERIAL       PRIMARY KEY,
      id_role     INTEGER      NOT NULL REFERENCES roles(id_role) ON DELETE CASCADE,
      module_name VARCHAR(100) NOT NULL,
      can_view    BOOLEAN      NOT NULL DEFAULT TRUE,
      can_add     BOOLEAN      NOT NULL DEFAULT FALSE,
      can_edit    BOOLEAN      NOT NULL DEFAULT FALSE,
      can_delete  BOOLEAN      NOT NULL DEFAULT FALSE,
      UNIQUE (id_role, module_name)
    );

    CREATE TABLE IF NOT EXISTS users (
      id_user   INTEGER      PRIMARY KEY,
      username  VARCHAR(50)  NOT NULL UNIQUE,
      password  VARCHAR(255) NOT NULL,
      email     VARCHAR(255),
      name      VARCHAR(150) NOT NULL,
      id_role   INTEGER      REFERENCES roles(id_role),
      status    BOOLEAN      NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS user_branches (
      id_user   INTEGER NOT NULL REFERENCES users(id_user)    ON DELETE CASCADE,
      id_branch INTEGER NOT NULL REFERENCES branches(id_branch) ON DELETE CASCADE,
      PRIMARY KEY (id_user, id_branch)
    );

    CREATE TABLE IF NOT EXISTS brands (
      id_brand INTEGER      PRIMARY KEY,
      name     VARCHAR(120) NOT NULL,
      status   BOOLEAN      NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id_category INTEGER      PRIMARY KEY,
      name        VARCHAR(120) NOT NULL,
      description VARCHAR(255),
      status      BOOLEAN      NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS measures (
      id_measure   INTEGER     PRIMARY KEY,
      name         VARCHAR(100) NOT NULL,
      abbreviation VARCHAR(20)  NOT NULL,
      status       BOOLEAN      NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS providers (
      id_provider INTEGER      PRIMARY KEY,
      name        VARCHAR(150) NOT NULL,
      nit         VARCHAR(30),
      contact     VARCHAR(150),
      phone       VARCHAR(20),
      email       VARCHAR(255),
      address     VARCHAR(255),
      status      BOOLEAN      NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS products (
      id_product  INTEGER      PRIMARY KEY,
      barcode     VARCHAR(50),
      name        VARCHAR(200) NOT NULL,
      description TEXT,
      id_category INTEGER REFERENCES categories(id_category),
      id_brand    INTEGER REFERENCES brands(id_brand),
      id_measure  INTEGER REFERENCES measures(id_measure),
      id_provider INTEGER REFERENCES providers(id_provider),
      status      BOOLEAN NOT NULL DEFAULT TRUE
    );

    CREATE TABLE IF NOT EXISTS product_branch (
      id_product INTEGER        NOT NULL REFERENCES products(id_product) ON DELETE CASCADE,
      id_branch  INTEGER        NOT NULL REFERENCES branches(id_branch)  ON DELETE CASCADE,
      stock      NUMERIC(18,2)  NOT NULL DEFAULT 0,
      price      NUMERIC(18,2)  NOT NULL DEFAULT 0,
      cost       NUMERIC(18,2)  NOT NULL DEFAULT 0,
      PRIMARY KEY (id_product, id_branch)
    );

    CREATE TABLE IF NOT EXISTS clients (
      id_client       INTEGER      PRIMARY KEY,
      document_number VARCHAR(30),
      name            VARCHAR(100) NOT NULL,
      last_name       VARCHAR(100),
      email           VARCHAR(255),
      phone           VARCHAR(20),
      address         VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS sales (
      id_sale          INTEGER       PRIMARY KEY,
      id_client        INTEGER       REFERENCES clients(id_client),
      id_user          INTEGER       REFERENCES users(id_user),
      id_branch        INTEGER       REFERENCES branches(id_branch),
      sale_date        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
      total_amount     NUMERIC(18,2) NOT NULL DEFAULT 0,
      discount_applied NUMERIC(18,2) NOT NULL DEFAULT 0,
      payment_method   VARCHAR(50),
      status           VARCHAR(20)   NOT NULL DEFAULT 'COMPLETED'
    );

    CREATE TABLE IF NOT EXISTS sale_details (
      id_sale_detail SERIAL        PRIMARY KEY,
      id_sale        INTEGER       NOT NULL REFERENCES sales(id_sale) ON DELETE CASCADE,
      id_product     INTEGER       REFERENCES products(id_product),
      quantity       NUMERIC(18,2) NOT NULL,
      unit_price     NUMERIC(18,2) NOT NULL,
      purchase_price NUMERIC(18,2) NOT NULL DEFAULT 0,
      sale_price     NUMERIC(18,2) NOT NULL DEFAULT 0,
      discount       NUMERIC(18,2) NOT NULL DEFAULT 0,
      subtotal       NUMERIC(18,2) NOT NULL
    );
  `;

  try {
    await pgPool.query(ddl);
    console.log('[PG Replica] Esquema inicializado correctamente.');
  } catch (err: any) {
    console.error('[PG Replica] Error al inicializar el esquema:', err.message);
    throw err;
  }
}
