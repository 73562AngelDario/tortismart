require('dotenv').config();

const express = require('express');
const path = require('path');
const crypto = require('crypto');
const db = require('./database');

const app = express();
app.use(express.json({ limit: '4mb' }));
app.use(express.static(path.join(__dirname, 'public')));

/* ============================================================
   Tablas (prefijo ts_ para no mezclarse con otros proyectos)
   ============================================================ */
let listo = null;

function inicializar() {
  if (!listo) {
    listo = (async () => {
      await db.query(`CREATE TABLE IF NOT EXISTS ts_usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario VARCHAR(50) NOT NULL UNIQUE,
        pass_hash VARCHAR(200) NOT NULL,
        rol VARCHAR(20) NOT NULL,
        nombre VARCHAR(80) NOT NULL,
        activo TINYINT(1) NOT NULL DEFAULT 1,
        fallos INT NOT NULL DEFAULT 0,
        bloqueado_hasta BIGINT NOT NULL DEFAULT 0
      )`);
      await db.query(`CREATE TABLE IF NOT EXISTS ts_estado (
        id INT PRIMARY KEY,
        version INT NOT NULL,
        datos LONGTEXT NOT NULL,
        actualizado TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`);
      await db.query(`CREATE TABLE IF NOT EXISTS ts_ventas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(60) NOT NULL UNIQUE,
        ts_ms BIGINT NOT NULL,
        total DECIMAL(10,2) NOT NULL,
        pago VARCHAR(20) NOT NULL,
        usuario VARCHAR(50) NOT NULL,
        items LONGTEXT NOT NULL,
        INDEX idx_ts (ts_ms)
      )`);

      const [r] = await db.query('SELECT COUNT(*) AS n FROM ts_usuarios');
      if (r[0].n === 0) {
        await db.query(
          'INSERT INTO ts_usuarios (usuario, pass_hash, rol, nombre) VALUES (?,?,?,?),(?,?,?,?)',
          [
            'admin', hashPass(process.env.ADMIN_PASS || 'admin123'), 'admin', 'Administrador',
            'empleado', hashPass(process.env.EMPLEADO_PASS || 'empleado123'), 'trabajador', 'Empleado'
          ]
        );
      }
    })().catch(e => { listo = null; throw e; });
  }
  return listo;
}

/* ============================================================
   Contraseñas y sesiones (sin librerías extra)
   ============================================================ */
function hashPass(p) {
  const s = crypto.randomBytes(16).toString('hex');
  return s + ':' + crypto.scryptSync(p, s, 32).toString('hex');
}
function checkPass(p, h) {
  const [s, k] = String(h).split(':');
  if (!s || !k) return false;
  const x = crypto.scryptSync(p, s, 32);
  const y = Buffer.from(k, 'hex');
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

const SECRETO = process.env.TS_SECRETO ||
  crypto.createHash('sha256').update('tortismart:' + (process.env.DATABASE_URL || '')).digest('hex');

function firmar(payload) {
  const c = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const f = crypto.createHmac('sha256', SECRETO).update(c).digest('base64url');
  return c + '.' + f;
}
function verificar(token) {
  const [c, f] = String(token || '').split('.');
  if (!c || !f) return null;
  const esperado = crypto.createHmac('sha256', SECRETO).update(c).digest('base64url');
  const a = Buffer.from(f), b = Buffer.from(esperado);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(c, 'base64url').toString());
    return p.exp > Date.now() ? p : null;
  } catch { return null; }
}
function auth(req, res, next) {
  const t = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const p = verificar(t);
  if (!p) return res.status(401).json({ error: 'Sesión expirada. Inicia sesión de nuevo.' });
  req.u = p;
  next();
}

/* ============================================================
   API
   ============================================================ */
app.use('/api', async (req, res, next) => {
  try {
    await inicializar();
    next();
  } catch (e) {
    console.error('Error de base de datos:', e);
    res.status(500).json({ error: 'No se pudo conectar a la base de datos: ' + e.message });
  }
});

const fallo = (res, e) => {
  console.error(e);
  res.status(500).json({ error: e.message || 'Error del servidor' });
};

// Verificación rápida: abre /api/salud en el navegador
app.get('/api/salud', (req, res) => res.json({ ok: true, hora: new Date().toISOString() }));

// Login
app.post('/api/login', async (req, res) => {
  try {
    const user = String(req.body.user || '').trim();
    const pass = String(req.body.pass || '');
    if (!user || !pass) return res.status(400).json({ error: 'Completa usuario y contraseña' });

    const [rows] = await db.query('SELECT * FROM ts_usuarios WHERE usuario=? AND activo=1', [user]);
    const u = rows[0];

    if (u && Number(u.bloqueado_hasta) > Date.now()) {
      const seg = Math.ceil((Number(u.bloqueado_hasta) - Date.now()) / 1000);
      return res.status(429).json({ error: `Acceso bloqueado. Intenta en ${seg} s` });
    }

    if (!u || !checkPass(pass, u.pass_hash)) {
      if (u) {
        const f = u.fallos + 1;
        if (f >= 3) {
          await db.query('UPDATE ts_usuarios SET fallos=0, bloqueado_hasta=? WHERE id=?', [Date.now() + 60000, u.id]);
          return res.status(429).json({ error: '3 intentos fallidos. Acceso bloqueado 1 minuto' });
        }
        await db.query('UPDATE ts_usuarios SET fallos=? WHERE id=?', [f, u.id]);
      }
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    await db.query('UPDATE ts_usuarios SET fallos=0, bloqueado_hasta=0 WHERE id=?', [u.id]);
    const usuario = { user: u.usuario, rol: u.rol, nombre: u.nombre };
    res.json({ token: firmar({ ...usuario, exp: Date.now() + 12 * 3600 * 1000 }), usuario });
  } catch (e) { fallo(res, e); }
});

// Cargar todo el estado (+ ventas desde "desde", en milisegundos)
app.get('/api/estado', auth, async (req, res) => {
  try {
    const desde = Number(req.query.desde) || 0;
    const [e] = await db.query('SELECT version, datos FROM ts_estado WHERE id=1');
    const [v] = await db.query(
      'SELECT uid, ts_ms, total, pago, usuario, items FROM ts_ventas WHERE ts_ms>=? ORDER BY ts_ms',
      [desde]
    );
    res.json({
      version: e[0] ? e[0].version : 0,
      data: e[0] ? JSON.parse(e[0].datos) : null,
      ventas: v.map(x => ({
        uid: x.uid,
        ts: new Date(Number(x.ts_ms)).toISOString(),
        total: Number(x.total),
        pago: x.pago,
        usuario: x.usuario,
        items: JSON.parse(x.items)
      }))
    });
  } catch (e) { fallo(res, e); }
});

// Guardar estado (con control de versión) + ventas nuevas
app.put('/api/estado', auth, async (req, res) => {
  const { version, data, ventas } = req.body || {};
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'Datos inválidos' });

  const conflicto = () => res.status(409).json({
    error: 'Los datos cambiaron en otro dispositivo. Recarga la página.'
  });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query('SELECT version FROM ts_estado WHERE id=1 FOR UPDATE');
    let nueva;

    if (!r[0]) {
      if (Number(version) !== 0) { await conn.rollback(); return conflicto(); }
      await conn.query('INSERT INTO ts_estado (id, version, datos) VALUES (1, 1, ?)', [JSON.stringify(data)]);
      nueva = 1;
    } else {
      if (r[0].version !== Number(version)) { await conn.rollback(); return conflicto(); }
      nueva = r[0].version + 1;
      await conn.query('UPDATE ts_estado SET version=?, datos=? WHERE id=1', [nueva, JSON.stringify(data)]);
    }

    const filas = [];
    for (const x of Array.isArray(ventas) ? ventas : []) {
      const ms = new Date(x.ts).getTime();
      if (!x.uid || !Number.isFinite(ms) || !(Number(x.total) >= 0)) continue;
      filas.push([String(x.uid).slice(0, 60), ms, Number(x.total), String(x.pago || '').slice(0, 20),
        String(x.usuario || '').slice(0, 50), JSON.stringify(x.items || [])]);
    }
    for (let i = 0; i < filas.length; i += 200) {
      await conn.query(
        'INSERT IGNORE INTO ts_ventas (uid, ts_ms, total, pago, usuario, items) VALUES ?',
        [filas.slice(i, i + 200)]
      );
    }

    await conn.commit();
    res.json({ version: nueva });
  } catch (e) {
    try { await conn.rollback(); } catch {}
    fallo(res, e);
  } finally {
    conn.release();
  }
});

// Reporte de ventas por rango (milisegundos), calculado en la base de datos
app.get('/api/reporte', auth, async (req, res) => {
  try {
    const desde = Number(req.query.desde), hasta = Number(req.query.hasta);
    if (!Number.isFinite(desde) || !Number.isFinite(hasta)) return res.status(400).json({ error: 'Rango inválido' });
    const [r] = await db.query(
      'SELECT pago, COUNT(*) AS n, SUM(total) AS t FROM ts_ventas WHERE ts_ms BETWEEN ? AND ? GROUP BY pago',
      [desde, hasta]
    );
    const porPago = {}; let n = 0, total = 0;
    for (const x of r) { porPago[x.pago] = Number(x.t); n += Number(x.n); total += Number(x.t); }
    res.json({ n, total, porPago });
  } catch (e) { fallo(res, e); }
});

// Cambiar la contraseña del empleado (solo administrador, confirmando su propia contraseña)
app.post('/api/empleado/pass', auth, async (req, res) => {
  try {
    const [a] = await db.query('SELECT * FROM ts_usuarios WHERE usuario=? AND activo=1', [req.u.user]);
    if (!a[0] || a[0].rol !== 'admin') return res.status(403).json({ error: 'Solo el administrador puede hacer esto' });

    const miPass = String(req.body.miPass || '');
    const nueva = String(req.body.nueva || '');
    if (!checkPass(miPass, a[0].pass_hash)) return res.status(401).json({ error: 'Tu contraseña de administrador es incorrecta' });
    if (nueva.length < 6) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
    if (nueva.length > 100) return res.status(400).json({ error: 'La contraseña es demasiado larga' });

    const [r] = await db.query(
      "UPDATE ts_usuarios SET pass_hash=?, fallos=0, bloqueado_hasta=0 WHERE rol='trabajador'",
      [hashPass(nueva)]
    );
    if (!r.affectedRows) return res.status(404).json({ error: 'No se encontró al empleado' });
    res.json({ ok: true });
  } catch (e) { fallo(res, e); }
});

// Enviar alerta por WhatsApp sin abrir WhatsApp (servicio CallMeBot, solo administrador)
app.post('/api/whatsapp', auth, async (req, res) => {
  try {
    if (req.u.rol !== 'admin') return res.status(403).json({ error: 'Solo el administrador puede enviar alertas' });
    const key = process.env.CALLMEBOT_APIKEY;
    if (!key) return res.status(503).json({ error: 'Falta configurar CALLMEBOT_APIKEY en Vercel' });
    const phone = String(req.body.phone || '').replace(/\D/g, '');
    const texto = String(req.body.texto || '').slice(0, 500);
    if (!phone || !texto) return res.status(400).json({ error: 'Falta el número o el mensaje' });

    const url = 'https://api.callmebot.com/whatsapp.php?phone=' + encodeURIComponent('+' + phone) +
      '&text=' + encodeURIComponent(texto) + '&apikey=' + encodeURIComponent(key);
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 15000);
    let r, cuerpo = '';
    try { r = await fetch(url, { signal: ctl.signal }); cuerpo = await r.text(); }
    finally { clearTimeout(t); }
    if (!r.ok || /error|invalid|not\s+activated/i.test(cuerpo.slice(0, 400)) && !/queued|sent/i.test(cuerpo)) {
      console.error('CallMeBot:', r.status, cuerpo.slice(0, 300));
      return res.status(502).json({ error: 'WhatsApp no aceptó el mensaje. Revisa el número y la clave de CallMeBot.' });
    }
    res.json({ ok: true });
  } catch (e) { fallo(res, e); }
});

// Borrar las ventas de ejemplo (las que empiezan con "ej-"), solo administrador
app.delete('/api/ventas-ejemplo', auth, async (req, res) => {
  try {
    if (req.u.rol !== 'admin') return res.status(403).json({ error: 'Solo el administrador puede hacer esto' });
    const [r] = await db.query("DELETE FROM ts_ventas WHERE uid LIKE 'ej-%'");
    res.json({ borradas: r.affectedRows });
  } catch (e) { fallo(res, e); }
});

app.use('/api', (req, res) => res.status(404).json({ error: 'Ruta no encontrada' }));

/* ============================================================
   Arranque (local) / exportación (Vercel)
   ============================================================ */
const PORT = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(PORT, () => console.log(`TortiSmart en http://localhost:${PORT}`));
}
module.exports = app;
