import { Hono } from "hono";
import { streamSSE } from 'hono/streaming'

const routerMessage = new Hono<{ Bindings: Env }>();
routerMessage.post('/ai', async (c) => {
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
    const systemPrompt = `You are a helpful Investment AI assistant.
    You can generate charts to visualize data. To generate a chart, use the following format:
    :::chart
    {
      "type": "pie" | "bar" | "line",
      "title": "Chart Title",
      "data": [
        { "name": "Label", "value": 100, "color": "#8884d8" }
      ]
    }
    :::
    Supported types:
    - pie: requires "name", "value", optional "color" in data
    - bar: requires "name", "value", optional "color" in data
    - line: requires "name", "value", optional "color" in data
    
    Always provide helpful analysis along with the chart.`;

    const aiMessages = [
      { role: 'system', content: systemPrompt },
      ...previousMessages.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    console.log(aiMessages)

    // Stream AI response using SSE
    return streamSSE(c, async (stream) => {
      let fullResponse = ""

      try {
        const aiStream = await c.env.AI.run("@cf/meta/llama-3.1-8b-instruct-fp8", {
          messages: aiMessages,
          stream: true
        })

        // Buffer to handle fragmented SSE lines
        let buffer = ""

        for await (const chunk of aiStream) {
          // Decode chunk to string
          let chunkText = ""
          if (chunk instanceof Uint8Array) {
            chunkText = new TextDecoder().decode(chunk)
          } else if (typeof chunk === "object" && chunk !== null) {
            const values = Object.values(chunk) as number[]
            chunkText = new TextDecoder().decode(new Uint8Array(values))
          } else if (typeof chunk === "string") {
            chunkText = chunk
          }

          // Append to buffer and split by newline
          buffer += chunkText
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed || !trimmed.startsWith("data:")) continue

            const raw = trimmed.slice(5).trim()
            let text = ""
            try {
              const parsed = JSON.parse(raw)
              text = parsed.response || parsed.text || ""
            } catch {
              text = raw
            }

            if (text) {
              fullResponse += text
              await stream.writeSSE({ data: JSON.stringify({ token: text }) })
            }
          }
        }

        // Process any remaining buffered data
        if (buffer.trim()) {
          const raw = buffer.trim().startsWith("data:") ? buffer.trim().slice(5).trim() : buffer.trim()
          let text = ""
          try {
            const parsed = JSON.parse(raw)
            text = parsed.response || parsed.text || ""
          } catch {
            text = raw
          }
          if (text) {
            fullResponse += text
            await stream.writeSSE({ data: JSON.stringify({ token: text }) })
          }
        }

        // Send completion signal
        await stream.writeSSE({
          data: JSON.stringify({ message: fullResponse, done: true })
        })

        // Save AI response to DB
        if (fullResponse && fullResponse.trim().length > 0) {
          const aiCreatedAt = new Date().toISOString()
          await c.env.db
            .prepare("INSERT INTO messages (content, role, chat_history_id, created_at) VALUES (?, ?, ?, ?)")
            .bind(fullResponse, "assistant", chat_history_id, aiCreatedAt)
            .run()
        }
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
