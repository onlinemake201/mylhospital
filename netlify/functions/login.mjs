import { neon } from "@neondatabase/serverless";

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const databaseUrl = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    return new Response(JSON.stringify({
      success: false,
      error: 'Database not configured'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const sql = neon(databaseUrl);

  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({
        success: false,
        error: 'E-Mail und Passwort sind erforderlich'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const users = await sql`
      SELECT id, name, email, role, hospital_id, department_id, avatar, is_active, created_at, last_login
      FROM users 
      WHERE email = ${email}
    `;

    if (users.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Benutzer nicht gefunden'
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = users[0];

    if (!user.is_active) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Konto ist deaktiviert'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const passwordHash = `$2a$10$hashed_${password}`;
    const storedHash = await sql`
      SELECT password_hash FROM users WHERE email = ${email}
    `;

    if (storedHash[0].password_hash !== passwordHash) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ungültige Anmeldedaten'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    await sql`
      UPDATE users 
      SET last_login = CURRENT_TIMESTAMP 
      WHERE id = ${user.id}
    `;

    return new Response(JSON.stringify({
      success: true,
      user: {
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        hospitalId: user.hospital_id,
        departmentId: user.department_id,
        avatar: user.avatar,
        isActive: user.is_active,
        createdAt: user.created_at,
        lastLogin: new Date().toISOString(),
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Login error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Login fehlgeschlagen'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/login"
};
