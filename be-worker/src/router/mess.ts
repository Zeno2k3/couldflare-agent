import { Hono } from "hono";
import { streamSSE } from 'hono/streaming'

const routerMessage = new Hono<{ Bindings: CloudflareBindings }>();
routerMessage.post('/message', async (c) => {
 try {
  const { content, chat_history_id } = await c.req.json()

  // Validate input
  if (!content || !chat_history_id) {
   return c.json({ error: "Missing required fields: content, chat_history_id" }, 400)
  }

  // Check if chat_history exists
  const chatHistory = await c.env.db
   .prepare("SELECT id FROM chat_histories WHERE id = ?")
   .bind(chat_history_id)
   .first()

  if (!chatHistory) {
   return c.json({ error: "Chat history not found" }, 404)
  }

  // Save user message to database
  const userCreatedAt = new Date().toISOString()
  await c.env.db
   .prepare("INSERT INTO messages (content, role, chat_history_id, created_at) VALUES (?, ?, ?, ?)")
   .bind(content, "user", chat_history_id, userCreatedAt)
   .run()

  // Get all messages in this chat history for context
  const { results: previousMessages } = await c.env.db
   .prepare("SELECT role, content FROM messages WHERE chat_history_id = ? ORDER BY created_at ASC")
   .bind(chat_history_id)
   .all()

  // Prepare messages for AI (convert to proper format)
  const aiMessages = previousMessages.map((msg: any) => ({
   role: msg.role,
   content: msg.content
  }))

  // Stream AI response using SSE
  return streamSSE(c, async (stream) => {
   let fullResponse = ""

   try {
    const aiStream = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
     messages: aiMessages,
     stream: true
    })

    // Stream each chunk to client
    for await (const chunk of aiStream) {
     if (chunk.response) {
      fullResponse += chunk.response
      await stream.writeSSE({
       data: JSON.stringify({ token: chunk.response })
      })
     }
    }

    // Send completion signal
    await stream.writeSSE({
     data: JSON.stringify({ done: true })
    })

    // Save AI response to database
    const aiCreatedAt = new Date().toISOString()
    await c.env.db
     .prepare("INSERT INTO messages (content, role, chat_history_id, created_at) VALUES (?, ?, ?, ?)")
     .bind(fullResponse, "assistant", chat_history_id, aiCreatedAt)
     .run()

   } catch (aiError) {
    await stream.writeSSE({
     data: JSON.stringify({ error: "AI processing failed", details: String(aiError) })
    })
   }
  })

 } catch (error) {
  return c.json({ error: String(error) }, 500)
 }
})

// Get all messages for a specific chat history
routerMessage.get('/history/:chat_history_id', async (c) => {
 try {
  const chat_history_id = c.req.param('chat_history_id')

  // Check if chat_history exists
  const chatHistory = await c.env.db
   .prepare("SELECT id FROM chat_histories WHERE id = ?")
   .bind(chat_history_id)
   .first()

  if (!chatHistory) {
   return c.json({ error: "Chat history not found" }, 404)
  }

  // Get all messages for this chat history
  const { results } = await c.env.db
   .prepare("SELECT id, role, content, created_at FROM messages WHERE chat_history_id = ? ORDER BY created_at ASC")
   .bind(chat_history_id)
   .all()

  return c.json({ messages: results }, 200)
 } catch (error) {
  return c.json({ error: String(error) }, 500)
 }
})


export default routerMessage;
