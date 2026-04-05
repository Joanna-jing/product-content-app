const express = require("express"); // 💡 確保這裡是小寫的 const
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.post("/api/generate", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY 未設定" });
  }

  const { system, messages } = req.body;
  const userMessage = messages?.[0]?.content || "";
  const prompt = `${system}\n\n${userMessage}\n\n重要：你的回答必須是純 JSON，不能有任何說明文字、不能有 markdown 的反引號，直接從 { 開始到 } 結束。`;

  try {
    // 💡 使用目前最穩定、額度充足的 1.5-flash-latest 模型
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    });

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data).slice(0, 300));

    if (!response.ok) {
      console.error("Gemini API Error details:", data);
      return res.status(response.status).json({ 
        error: `AI 服務發生錯誤: ${data.error?.message || "未知錯誤"}` 
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    if (!text) {
      return res.status(500).json({ error: "AI 回傳了空白內容，請重試" });
    }

    res.json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "伺服器內部錯誤或網路連線失敗" });
  }
});

app.use(express.static(path.join(__dirname, "client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

app.listen(PORT, () => console.log(`✅ 運行於 port ${PORT}`));
