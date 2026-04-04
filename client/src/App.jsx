import { useState } from "react";

const TABS = ["腳本", "台詞", "社群貼文"];
const PLATFORMS = ["Instagram", "Facebook", "LinkedIn", "小紅書", "Threads"];

const systemPrompt = `你是一位專業的行銷文案師與內容創作者，擅長為各種商品創作吸引人的行銷內容。
請根據用戶提供的商品名稱與特點，生成三類內容，並以 JSON 格式回傳（不含 markdown 反引號）：

{
  "script": "完整的影片/廣告腳本（包含場景描述、旁白、動作指示，約 300-400 字）",
  "dialogue": "品牌代言人或主持人的口播台詞（簡潔有力，適合 30-60 秒廣告，約 150-200 字）",
  "posts": {
    "Instagram": "Instagram 貼文（含 emoji、hashtag，輕鬆活潑風格）",
    "Facebook": "Facebook 貼文（較長、有故事性，適合分享）",
    "LinkedIn": "LinkedIn 貼文（專業、數據導向、強調價值）",
    "小紅書": "小紅書風格（種草感、生活化、emoji 豐富）",
    "Threads": "Threads 貼文（簡短、有觀點、引發討論）"
  }
}

請確保每個內容都：
1. 突出商品的核心賣點
2. 符合各平台的語氣與風格
3. 有明確的行動呼籲 (CTA)
4. 語言生動、吸引目標受眾`;

export default function App() {
  const [productName, setProductName] = useState("");
  const [features, setFeatures] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [tone, setTone] = useState("活潑有趣");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("腳本");
  const [activePlatform, setActivePlatform] = useState("Instagram");
  const [copied, setCopied] = useState(false);

  const toneOptions = ["活潑有趣", "專業權威", "溫暖親切", "時尚潮流", "簡約俐落"];

  const handleGenerate = async () => {
    if (!productName.trim() || !features.trim()) {
      setError("請填寫商品名稱與特點");
      return;
    }
    setError("");
    setLoading(true);
    setResult(null);

    const userMessage = `商品名稱：${productName}
商品特點：${features}
目標受眾：${targetAudience || "一般大眾"}
風格語氣：${tone}
請為以上商品生成行銷內容。`;

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
        }),
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      const text = data.content?.map((i) => i.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (err) {
      setError(`生成失敗：${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getActiveContent = () => {
    if (!result) return "";
    if (activeTab === "腳本") return result.script;
    if (activeTab === "台詞") return result.dialogue;
    if (activeTab === "社群貼文") return result.posts?.[activePlatform] || "";
    return "";
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0f", fontFamily: "'Noto Serif TC', Georgia, serif", color: "#f0ede8" }}>
      <header style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1a2e 50%, #001a1a 100%)", borderBottom: "1px solid rgba(255,180,60,0.2)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "22px", fontWeight: "700", background: "linear-gradient(90deg, #ffb43c, #ff6b9d, #a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ✦ 商品文案生成器
          </div>
          <div style={{ fontSize: "11px", color: "rgba(240,237,232,0.4)", marginTop: "2px", letterSpacing: "2px" }}>PRODUCT CONTENT AI STUDIO</div>
        </div>
        <div style={{ background: "rgba(255,180,60,0.1)", border: "1px solid rgba(255,180,60,0.3)", borderRadius: "20px", padding: "5px 14px", fontSize: "11px", color: "#ffb43c" }}>AI 驅動</div>
      </header>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "24px 16px", display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "24px" }}>
          <h2 style={{ fontSize: "13px", letterSpacing: "3px", color: "#a78bfa", marginBottom: "24px", fontWeight: "400" }}>商品資訊輸入</h2>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>商品名稱 *</label>
            <input value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="例如：玻尿酸精華液..." style={inputStyle} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>商品特點 *</label>
            <textarea value={features} onChange={(e) => setFeatures(e.target.value)} placeholder={"列出核心賣點，例如：\n• 24 小時保濕鎖水\n• 通過皮膚科測試"} rows={5} style={{ ...inputStyle, resize: "none", lineHeight: "1.7" }} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={labelStyle}>目標受眾（選填）</label>
            <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="例如：25-35 歲都會女性..." style={inputStyle} />
          </div>
          <div style={{ marginBottom: "24px" }}>
            <label style={labelStyle}>內容風格</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "8px" }}>
              {toneOptions.map((t) => (
                <button key={t} onClick={() => setTone(t)} style={{ padding: "6px 14px", borderRadius: "20px", border: tone === t ? "1px solid #a78bfa" : "1px solid rgba(255,255,255,0.12)", background: tone === t ? "rgba(167,139,250,0.2)" : "transparent", color: tone === t ? "#a78bfa" : "rgba(240,237,232,0.5)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit" }}>{t}</button>
              ))}
            </div>
          </div>
          {error && <div style={{ background: "rgba(255,80,80,0.1)", border: "1px solid rgba(255,80,80,0.3)", borderRadius: "10px", padding: "12px 16px", fontSize: "13px", color: "#ff8080", marginBottom: "16px" }}>⚠ {error}</div>}
          <button onClick={handleGenerate} disabled={loading} style={{ width: "100%", padding: "16px", background: loading ? "rgba(167,139,250,0.2)" : "linear-gradient(135deg, #7c3aed, #db2777)", border: "none", borderRadius: "12px", color: "#fff", fontSize: "16px", fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer", letterSpacing: "2px", fontWeight: "500" }}>
            {loading ? "⟳  AI 生成中..." : "✦ 一鍵生成內容"}
          </button>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "24px", minHeight: "400px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", gap: "4px", marginBottom: "20px", background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "4px" }}>
            {TABS.map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: "10px", borderRadius: "9px", border: "none", background: activeTab === tab ? "rgba(167,139,250,0.3)" : "transparent", color: activeTab === tab ? "#a78bfa" : "rgba(240,237,232,0.45)", fontSize: "14px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "1px" }}>{tab}</button>
            ))}
          </div>
          {activeTab === "社群貼文" && result && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
              {PLATFORMS.map((p) => (
                <button key={p} onClick={() => setActivePlatform(p)} style={{ padding: "5px 12px", borderRadius: "14px", border: activePlatform === p ? "1px solid #ff6b9d" : "1px solid rgba(255,255,255,0.1)", background: activePlatform === p ? "rgba(255,107,157,0.2)" : "transparent", color: activePlatform === p ? "#ff6b9d" : "rgba(240,237,232,0.4)", fontSize: "12px", cursor: "pointer", fontFamily: "inherit" }}>{p}</button>
              ))}
            </div>
          )}
          <div style={{ flex: 1 }}>
            {!result && !loading && (
              <div style={{ minHeight: "250px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "rgba(240,237,232,0.2)", textAlign: "center", gap: "12px" }}>
                <div style={{ fontSize: "40px" }}>✦</div>
                <div style={{ fontSize: "13px", letterSpacing: "2px" }}>填寫上方資訊後<br />點擊生成按鈕</div>
              </div>
            )}
            {loading && (
              <div style={{ minHeight: "250px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "20px" }}>
                <div style={{ width: "50px", height: "50px", borderRadius: "50%", border: "2px solid rgba(167,139,250,0.2)", borderTop: "2px solid #a78bfa", animation: "spin 1s linear infinite" }} />
                <div style={{ color: "rgba(240,237,232,0.5)", fontSize: "13px", letterSpacing: "2px" }}>AI 正在創作中...</div>
              </div>
            )}
            {result && !loading && (
              <div>
                <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: "12px", padding: "16px", fontSize: "14px", lineHeight: "1.9", color: "rgba(240,237,232,0.85)", whiteSpace: "pre-wrap", maxHeight: "400px", overflowY: "auto" }}>
                  {getActiveContent()}
                </div>
                <button onClick={handleCopy} style={{ marginTop: "12px", width: "100%", padding: "10px", background: "transparent", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", color: copied ? "#4ade80" : "rgba(240,237,232,0.5)", fontSize: "13px", cursor: "pointer", fontFamily: "inherit", letterSpacing: "1px" }}>
                  {copied ? "✓ 已複製" : "複製內容"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Noto+Serif+TC:wght@400;500&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        input::placeholder, textarea::placeholder { color: rgba(240,237,232,0.2); }
      `}</style>
    </div>
  );
}

const labelStyle = { display: "block", fontSize: "12px", letterSpacing: "2px", color: "rgba(240,237,232,0.45)", marginBottom: "8px" };
const inputStyle = { width: "100%", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "10px", padding: "12px 16px", color: "#f0ede8", fontSize: "14px", fontFamily: "'Noto Serif TC', Georgia, serif", outline: "none" };
