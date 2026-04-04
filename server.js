const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 8080;

app.post("/api/generate", async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GEMINI_API_KEY 未設定" });
  }

  const { system, messages } = req.body;
  const userMessage = messages?.[0]?.content || "";
  const prompt = `${system}\n\n${userMessage}\n\n重要：你的回答必須是純 JSON，不能有任何說明文字、不能有 markdown 的反引號，直接從 { 開始到 } 結束。`;

  try {
    // 💡 修正 1：確保 URL 是連續的一行，不要有斷行
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
          responseMimeType: "application/json", // 這行設定非常好，能強制 Gemini 輸出 JSON 格式
        },
      }),
    });

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data).slice(0, 300));

    // 💡 修正 2：檢查 fetch 的 HTTP 狀態碼，如果不是 200~299 就攔截錯誤
    if (!response.ok) {
      console.error("Gemini API Error details:", data);
      return res.status(response.status).json({ 
        error: `AI 服務發生錯誤: ${data.error?.message || "未知錯誤"}` 
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // 💡 確保有拿到文字才回傳
    if (!text) {
      return res.status(500).json({ error: "AI 回傳了空白內容，請重試" });
    }

    res.json({ content: [{ type: "text", text }] });
    
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "伺服器內部錯誤或網路連線失敗" });
  }
});
    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data).slice(0, 300));
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    res.json({ content: [{ type: "text", text }] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "API 呼叫失敗" });
  }
});

app.use(express.static(path.join(__dirname, "client/build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client/build", "index.html"));
});

app.listen(PORT, () => console.log(`✅ 運行於 port ${PORT}`));
