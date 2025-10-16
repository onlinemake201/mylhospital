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
    const { name, email, password, role, hospitalId, departmentId } = body;

    if (!name || !email || !password || !role || !hospitalId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Alle erforderlichen Felder müssen ausgefüllt werden'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const existingUser = await sql`
      SELECT id FROM users WHERE email = ${email}
    `;

    if (existingUser.length > 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Ein Benutzer mit dieser E-Mail-Adresse existiert bereits'
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const passwordHash = `$2a$10$hashed_${password}`;

    const result = await sql`
      INSERT INTO users (name, email, password_hash, role, hospital_id, department_id, is_active, created_at)
      VALUES (${name}, ${email}, ${passwordHash}, ${role}, ${hospitalId}, ${departmentId || null}, true, CURRENT_TIMESTAMP)
      RETURNING id, name, email, role, hospital_id, department_id, avatar, is_active, created_at
    `;

    const user = result[0];

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
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Registrierung fehlgeschlagen'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const config = {
  path: "/api/register"
};
