import { Hono } from "hono"
import bcrypt from "bcryptjs"

const userRouter = new Hono<{ Bindings: CloudflareBindings }>();

userRouter.post('/', async (c) => {
 try {
  const body = await c.req.json()
  const created_at = new Date().toISOString();
  const { email, full_name, role = "user", password } = body
  if (!email || !full_name || !password) {
   return c.json({ error: "Thiếu thông tin bắt buộc" }, 400)
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
   return c.json({ error: "Email không hợp lệ" }, 400)
  }
  if (password.length < 6) {
   return c.json({ error: "Mật khẩu phải ít nhất 6 ký tự" }, 400)
  }
  const result = await c.env.db.prepare(`SELECT id FROM users WHERE email = ?`).bind(email).first()
  if (result) {
   return c.json({ error: 'Email đã tồn tại' }, 409)
  }
  const hashPassword = await bcrypt.hash(password, 10)
  const resultInsert = await c.env.db
   .prepare(`INSERT INTO users (full_name, email, role, password, created_at) VALUES (?, ?, ?, ?, ?)`)
   .bind(full_name, email, role, hashPassword, created_at)
   .run()
  return c.json(
   {
    message: 'User created successfully',
    data: {
     result: resultInsert
    }
   },
   201
  )
 } catch (error) {
  return c.json({ error: error }, 500)
 }
})

userRouter.put('/update/:id', async (c) => {
 try {
  const id = c.req.param("id");
  const check_id = await c.env.db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
  if (!check_id) return c.json({ error: 'User not found', status: 404 });
  const body = await c.req.json()
  const { email } = body
  if (email) {
   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: "Email không hợp lệ" }, 400);
   const check_email = await c.env.db.prepare("SELECT * FROM users WHERE email = ?").bind(email).first();
   if (check_email) return c.json({ error: 'Email đã tồn tại', status: 409 });
  }

  const fields = ["full_name", "email", "role", "password"];
  const updates = fields.filter(f => body[f] !== undefined);

  if (updates.length === 0) {
   return c.json({ message: 'No fields to update', status: 400 });
  }
  const created_at = new Date().toISOString();
  const setClause = updates.map(f => `${f} = ?`).join(", ");
  const values = updates.map(f => body[f]);
  values.push(created_at);
  values.push(id);

  const query = `UPDATE users SET ${setClause}, updated_at = ? WHERE id = ?`;

  await c.env.db.prepare(query).bind(...values).run();

  return c.json({ message: 'User updated successfully', status: 200 });
 } catch (error) {
  return c.json({ error: error }, 500);
 }
});


userRouter.delete('/:id', async (c) => {
 try {
  const id = c.req.param('id')
  await c.env.db.prepare("DELETE FROM users WHERE id = ?").bind(id).run()
  return c.json({ message: 'User deleted successfully', status: 200 })
 }
 catch (error) {
  return c.json({ error: error }, 500)
 }
})

userRouter.get('/', async (c) => {
 try {
  const stmt = await c.env.db.prepare("SELECT * FROM users");
  const { results } = await stmt.all();
  return c.json({ results }, 200)
 }
 catch (error) {
  return c.json({ error: error }, 500)
 }
})
userRouter.get('/:id', async (c) => {
 const stmt = await c.env.db.prepare("SELECT * FROM users WHERE id = ?");
})

export default userRouter;
