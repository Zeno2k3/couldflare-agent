import { Hono } from "hono";
import bcrypt from "bcryptjs";

const userRouter = new Hono<{ Bindings: CloudflareBindings }>();

userRouter.post('/', async (c) => {
 try {
  const body = await c.req.json()

  const { email, full_name, role = "user", password } = body
  if (!email || !full_name || !password) return c.json({ error: "Thiếu thông tin bắt buộc" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return c.json({ error: "Email không hợp lệ" }, 400);
  if (password.length < 6) return c.json({ error: "Mật khẩu phải ít nhất 6 ký tự" }, 400);
  const result = await c.env.db
   .prepare(`SELECT id FROM users WHERE email = ?`)
   .bind(email)
   .first()
  console.log(result)
  if (result) return c.json({ error: 'Email đã tồn tại' }, 409)
  const hashPassword = await bcrypt.hash(password, 10)
  const user_created = await c.env.db
   .prepare(`INSERT INTO users (full_name, email, role, password, created_at) VALUES (?, ?, ?, ?, ?)`)
   .bind(full_name, email, role, hashPassword, Date.now())
   .run()
  return c.json(
   {
    message: 'User created successfully',
    data: user_created
   },
   201
  )
 } catch (error) {
  return c.json({ error: error }, 500)
 }
})

userRouter.put('/', async (c) => {
 return c.json({ message: "Cập nhật user" })
})

userRouter.delete('/', async (c) => {
 return c.json({ message: "Xóa user" })
})

userRouter.get('/', async (c) => {
 return c.json({ message: "Lấy danh sách user" })
 // try {
 //  const stmt = await c.env.db.prepare("SELECT * FROM users");
 //  const { results } = await stmt.all();
 //  return c.json({ results })
 // }
 // catch (error) {
 //  return c.json({ error: error, status: 500 })
 // }
})
userRouter.get('/:id', async (c) => {
 const stmt = await c.env.db.prepare("SELECT * FROM users WHERE id = ?");
})

export default userRouter;
