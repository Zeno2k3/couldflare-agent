import { Hono } from "hono";

const routerChatHistory = new Hono<{ Bindings: CloudflareBindings }>();

interface ChatHistory {
 user_id: number;
 title: string;
}

routerChatHistory.post('/', async (c) => {
 try {
  const created_at = new Date().toISOString();
  const body: ChatHistory = await c.req.json()
  const check_id = await c.env.db.prepare("SELECT * FROM users WHERE id = ?").bind(body.user_id).first()

  if (!check_id) {
   return c.json({ error: 'User not found' }, 404)
  }
  if (body.title == "") {
   body.title = "Chat history " + created_at
  }
  const stmt = await c.env.db.prepare("INSERT INTO chat_histories (user_id, title, created_at) VALUES (?, ?, ?)").bind(body.user_id, body.title, created_at)
  const result = await stmt.run()
  return c.json({
   message: 'Chat history created successfully',
   data: {
    result: result
   }
  }, 201)
 }
 catch (error) {
  return c.json({ error: error }, 500)
 }
})

routerChatHistory.get('/all/:user_id', async (c) => {
 try {
  const user_id = c.req.param('user_id')
  const stmt = await c.env.db.prepare("SELECT * FROM chat_histories WHERE user_id = ?").bind(user_id)
  const { results } = await stmt.all();

  if (!results) {
   return c.json({ error: 'User not found' }, 404)
  }
  return c.json({ data: results }, 200)
 }
 catch (error) {
  return c.json({ error: error }, 500)
 }
})

routerChatHistory.put('/:id', async (c) => {
 try {
  const id = c.req.param('id')
  const body = await c.req.json()
  const { title } = body
  const check_id = await c.env.db.prepare("SELECT * FROM chat_histories WHERE id = ?").bind(id).first()
  if (!check_id) {
   return c.json({ error: 'Chat history not found' }, 404)
  }
  const stmt = await c.env.db.prepare("UPDATE chat_histories SET title = ? WHERE id = ?").bind(title)
  const { results } = await stmt.run()
  return c.json({ results }, 200)
 }
 catch (error) {
  return c.json({ error: error }, 500)
 }
})

routerChatHistory.delete('/all/:user_id', async (c) => {
 try {
  const user_id = c.req.param('user_id')
  await c.env.db.prepare("DELETE FROM chat_histories WHERE user_id = ?").bind(user_id).run()
  return c.json({
   message: 'Chat history deleted successfully',
  }, 200)
 }
 catch (error) {
  return c.json({ error: error }, 500)
 }
})

routerChatHistory.delete('/:user_id/:id', async (c) => {
 try {
  const user_id = c.req.param('user_id')
  const id = c.req.param('id')
  const check_id = await c.env.db.prepare("SELECT * FROM chat_histories WHERE user_id = ? AND id = ?").bind(user_id, id).first()
  if (!check_id) {
   return c.json({ error: 'Chat history not found' }, 404)
  }
  await c.env.db.prepare("DELETE FROM chat_histories WHERE user_id = ? AND id = ?").bind(user_id, id).run()
  return c.json({ message: 'Chat history deleted successfully' }, 200)
 }
 catch (error) {
  return c.json({ error: error }, 500)
 }
})

export default routerChatHistory