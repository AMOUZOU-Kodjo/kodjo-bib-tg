import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

async function seedAdmin() {
  try {
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const displayName = String(process.env.ADMIN_NAME || 'Administrateur').replace(/[\r\n\t]+/g, ' ').trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      console.error('ADMIN_EMAIL est requis et doit être une adresse e-mail valide.');
      process.exit(1);
    }

    if (displayName.length < 2 || displayName.length > 60) {
      console.error('ADMIN_NAME doit contenir entre 2 et 60 caractères.');
      process.exit(1);
    }

    if (!password) {
      console.error('ADMIN_PASSWORD est requis pour lancer ce script.');
      process.exit(1);
    }

    if (password.length < 12) {
      console.error('ADMIN_PASSWORD doit contenir au moins 12 caractères.');
      process.exit(1);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const exists = await query("SELECT id, role FROM users WHERE email = $1", [email]);
    
    if (exists.rows.length > 0) {
      await query("UPDATE users SET role = 'admin', email_verified = true, password_hash = $1 WHERE email = $2", [passwordHash, email]);
      console.log('Compte admin mis à jour');
    } else {
      const res = await query(
        "INSERT INTO users (email, display_name, password_hash, email_verified, role, credits) VALUES ($1,$2,$3,true,'admin',1000) RETURNING id",
        [email, displayName, passwordHash]
      );
      await query("INSERT INTO credit_transactions (user_id, delta, reason) VALUES ($1,1000,'initial')", [res.rows[0].id]);
      console.log('Compte admin créé');
    }

    console.log('Email:', email);
    process.exit(0);
  } catch (err) {
    console.error('Erreur:', err.message);
    process.exit(1);
  }
}

seedAdmin();
