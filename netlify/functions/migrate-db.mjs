import { neon } from "@neondatabase/serverless";

export default async (req, context) => {
  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Database not configured. Please set NETLIFY_DATABASE_URL environment variable.'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sql = neon(databaseUrl);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        hospital_id VARCHAR(100) NOT NULL,
        department_id VARCHAR(100),
        avatar VARCHAR(500),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_users_hospital_id ON users(hospital_id)
    `;

    const existingUsers = await sql`SELECT COUNT(*) as count FROM users`;
    
    if (existingUsers[0].count === 0) {
      await sql`
        INSERT INTO users (name, email, password_hash, role, hospital_id, department_id, avatar, is_active)
        VALUES 
        ('Admin User', 'admin@hospital.com', '$2a$10$hashed_Admin123', 'superadmin', 'hosp-001', NULL, 'https://i.pravatar.cc/150?img=1', true),
        ('Dr. Sarah Johnson', 'doctor@hospital.com', '$2a$10$hashed_doctor123', 'doctor', 'hosp-001', 'dept-cardiology', 'https://i.pravatar.cc/150?img=2', true),
        ('Maria Schmidt', 'nurse@hospital.com', '$2a$10$hashed_nurse123', 'nurse', 'hosp-001', 'dept-cardiology', 'https://i.pravatar.cc/150?img=3', true)
      `;
    } else {
      await sql`
        UPDATE users 
        SET password_hash = '$2a$10$hashed_Admin123'
        WHERE email = 'admin@hospital.com' AND role = 'superadmin'
      `;
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Database migration completed successfully'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Migration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/migrate-db"
};
