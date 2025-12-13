¡Excelente elección\! Ver el contraste es la mejor forma de valorar el orden.

Cuando no usamos Clean Architecture, tendemos a escribir lo que llamamos **Código Espagueti** 🍝: todo mezclado, enredado y difícil de separar.

Imagina que en lugar de todas esas carpetas y archivos (`Controller`, `Service`, `Repository`, `Mapper`), tuviéramos **un solo archivo** (por ejemplo, una ruta de Express) que hace TODO.

Aquí tienes cómo se vería ese "monstruo" para el caso de **Registrar Usuario**:

### 🍝 El Código "Espagueti" (Sin Arquitectura)

```typescript
// Archivo: routes/users.ts
import express from 'express';
import { createConnection } from 'mysql2/promise'; // ❌ Driver directo
import nodemailer from 'nodemailer'; // ❌ Librería externa directa

const router = express.Router();

router.post('/register', async (req, res) => {
  // 1. Validación de Entrada (Mezclada con lógica HTTP)
  const { email, password } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: "Email inválido" });
  }

  // 2. Conexión a Base de Datos (¡Aquí mismo!)
  // Si quieres cambiar a Mongo, tienes que borrar todo este archivo.
  const connection = await createConnection({ host: 'localhost', user: 'root', database: 'mi_app' });

  try {
    // 3. Regla de Negocio (¡Perdida entre SQL!)
    const [rows]: any = await connection.execute('SELECT * FROM users WHERE email_address = ?', [email]);
    if (rows.length > 0) {
      return res.status(400).json({ error: "El usuario ya existe" });
    }

    if (email.endsWith('@evil.com')) {
      return res.status(400).json({ error: "No se permiten usuarios evil" });
    }

    // 4. Inserción (SQL Hardcodeado)
    // El código sabe nombres de tablas y columnas.
    await connection.execute(
      'INSERT INTO users (email_address, password_hash, is_active) VALUES (?, ?, ?)',
      [email, `hashed_${password}`, 1]
    );

    // 5. Envío de Email (¡Acoplado a SMTP!)
    // No puedes probar esto sin enviar un email real.
    const transporter = nodemailer.createTransport({ service: 'gmail' });
    await transporter.sendMail({ from: 'admin@app.com', to: email, subject: 'Bienvenido' });

    // 6. Respuesta (Mezclada con lógica)
    res.json({ status: 'success', email: email });

  } catch (error) {
    res.status(500).json({ error: "Error interno" });
  } finally {
    await connection.end();
  }
});
```

-----

### Análisis de la "Catástrofe" 💥

A primera vista, este código es más corto y "fácil" de leer porque está todo junto. Pero, analicemos los problemas graves:

1.  **Acoplamiento Total:** Este archivo conoce a **Express**, a **MySQL** y a **Nodemailer**. Si cambias *cualquiera* de los tres, rompes este archivo.
2.  **Sin Reusabilidad:** Si quieres crear un usuario desde un comando de consola (CLI) en lugar de una petición Web, ¡no puedes\! La lógica está "secuestrada" dentro de `req` y `res` de Express.
3.  **Imposible de Testear:** Para probar si la regla de `@evil.com` funciona, estás obligado a levantar una base de datos MySQL real y tener conexión a internet para el email. No puedes hacer pruebas unitarias rápidas.

Ahora, el reto final para cerrar este tema:

Imagina que llega el jefe y dice: *"El equipo de seguridad prohíbe usar `nodemailer` directo, ahora hay que usar un servicio interno de la empresa"*.

En la versión **Clean Architecture** (la que estudiamos antes), ¿qué archivo específico tendríamos que cambiar y qué pasaría con el `UserController`?