/*
 * ⚠️ 外部 LLM 出力 — UI デザイン素材としてのみ流用
 *
 * 出自:    2026-04-30 オーナーが別の人 (実体は AI / 外部 LLM の出力) と相談した結果のプロトタイプ
 * 採否:    notes/2026-04-30-decisions.md 決定 2 で 1st 部分採用を確定
 *
 * ✅ 採用 (素材として):
 *   - detectUserType() 4 タイプ判定 (L62-68)
 *   - 3-4 往復遅延サービスカード UX (L122-131)
 *   - UI デザイン (ダーク + #4ECDC4 ティール、Noto Sans JP)
 *
 * ❌ 不採用 (重大リスク):
 *   - L70-86 の Anthropic API フロント直叩き = API キー漏洩リスク
 *   - L75 の "claude-sonnet-4-20250514" = 廃止世代モデル ID
 *   - フル SPA 化 (Next.js 再導入、Phase B-pre v2.0 リアーキを巻き戻す)
 *   - エージェント 2/3/4 (学習・申請書・旅行)
 *   - コミュニティ掲示板、申請書ガイド買い切り
 *
 * 採用要素の実装先: spec-v1-draft.md §6-BIS (3 層モダンキャッシュ ミニチャット入口)
 *   - Layer 1: Upstash Redis Exact Match
 *   - Layer 2: Supabase pgvector Semantic Cache (類似度 0.90)
 *   - Layer 3: Anthropic API + Prompt Caching (Haiku 4.5 = claude-haiku-4-5-20251001、サーバ側 api/chat-intro.js で API キー保持)
 *
 * 不採用理由詳細:
 *   knowledge/external-intake/rejected/2026-04-30-nihongohub-llm-fullspa-proposal.md
 */

import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `You are Hana (はな), a warm and friendly AI assistant for a Japanese learning platform called "NihongoHub". 

Your personality:
- Warm, encouraging, and naturally curious about the user
- You switch languages fluidly based on what the user writes (English, Japanese, Chinese, Korean, etc.)
- You NEVER push services aggressively — you guide naturally through conversation

Your primary goal is to have genuine, helpful conversation. As you chat, you subtly identify which of these 4 user types they are:

1. LEARNER: Struggling with Japanese, wants to improve, mentions studying, kanji, grammar, JLPT
2. TRAVELER: Planning to visit Japan, asking about places, culture, food, travel tips
3. RESIDENT: Living in Japan, asking about paperwork, visa, city hall, residence card, taxes
4. EXPLORER: Just curious about Japan, anime, culture, language in general

Based on context, you naturally weave in ONE suggestion per conversation (not immediately — wait for the right moment):
- LEARNER → "By the way, we have a JLPT quiz feature — want me to show you your level?"
- TRAVELER → "I can help you plan your trip with personalized recommendations!"
- RESIDENT → "We have step-by-step guides for city hall paperwork in your language — super helpful!"
- EXPLORER → "Want to try a quick Japanese level check? It's fun and takes 2 minutes!"

Rules:
- Start with a warm, open greeting in Japanese AND English (since you don't know their language yet)
- Keep responses concise (2-4 sentences usually) — this is chat, not an essay
- Use occasional Japanese words/phrases naturally to create immersion
- NEVER mention you're detecting their user type
- Suggest services only when it feels genuinely helpful, not salesy
- If they write in Japanese, respond mostly in Japanese with light English support
- Be genuinely helpful first, commercial second`;

const USER_TYPES = {
  LEARNER: { label: "学習者", color: "#4ECDC4", icon: "📚", service: "JLPT対策サブスク" },
  TRAVELER: { label: "旅行者", color: "#FF6B6B", icon: "✈️", service: "旅行プランナー" },
  RESIDENT: { label: "在住者", color: "#45B7D1", icon: "🏢", service: "申請書ガイド" },
  EXPLORER: { label: "探索者", color: "#96CEB4", icon: "🌸", service: "レベル判定" },
};

const QUICK_STARTS = [
  { text: "I want to pass JLPT N3 🎯", lang: "en" },
  { text: "日本語が難しいです…", lang: "ja" },
  { text: "Planning a trip to Tokyo! 🗼", lang: "en" },
  { text: "市役所の手続きがわからない", lang: "ja" },
  { text: "我想学日语 🌸", lang: "zh" },
  { text: "일본 여행 가고 싶어요 ✈️", lang: "ko" },
];

export default function NihongoChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [detectedType, setDetectedType] = useState(null);
  const [showServiceCard, setShowServiceCard] = useState(false);
  const [started, setStarted] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const detectUserType = (text) => {
    const lower = text.toLowerCase();
    if (/jlpt|n[1-5]|kanji|grammar|勉強|文法|漢字|試験|learn japanese/i.test(lower)) return "LEARNER";
    if (/travel|trip|visit|tokyo|osaka|kyoto|旅行|観光|行きたい|여행/i.test(lower)) return "TRAVELER";
    if (/visa|residence|city hall|市役所|在留|申請|手続き|住民票/i.test(lower)) return "RESIDENT";
    return null;
  };

  const callClaude = async (userMessage, history) => {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: "user", content: userMessage },
        ],
      }),
    });
    const data = await response.json();
    return data.content?.[0]?.text || "申し訳ありません、エラーが発生しました。";
  };

  const startChat = async (initialMessage) => {
    setStarted(true);
    setLoading(true);

    const userMsg = { role: "user", content: initialMessage, id: Date.now() };
    setMessages([userMsg]);

    const detected = detectUserType(initialMessage);
    if (detected) setDetectedType(detected);

    try {
      const reply = await callClaude(initialMessage, []);
      const assistantMsg = { role: "assistant", content: reply, id: Date.now() + 1 };
      setMessages([userMsg, assistantMsg]);
    } catch (e) {
      setMessages([userMsg, { role: "assistant", content: "接続エラーが発生しました。もう一度お試しください。", id: Date.now() + 1 }]);
    }
    setLoading(false);
    inputRef.current?.focus();
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setInput("");

    const userMsg = { role: "user", content: userText, id: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const detected = detectUserType(userText);
    if (detected && !detectedType) {
      setDetectedType(detected);
      setTimeout(() => setShowServiceCard(true), 3000);
    }

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    try {
      const reply = await callClaude(userText, history);
      setMessages([...newMessages, { role: "assistant", content: reply, id: Date.now() + 1 }]);
      if (newMessages.length > 4 && detectedType) {
        setShowServiceCard(true);
      }
    } catch (e) {
      setMessages([...newMessages, { role: "assistant", content: "エラーが発生しました。", id: Date.now() + 1 }]);
    }
    setLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!started) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.landingContainer}>
          {/* Header */}
          <div style={styles.logoArea}>
            <div style={styles.logoIcon}>は</div>
            <div>
              <div style={styles.logoTitle}>NihongoHub</div>
              <div style={styles.logoSub}>日本語学習プラットフォーム</div>
            </div>
          </div>

          <h1 style={styles.headline}>
            話してみよう<br />
            <span style={styles.headlineSub}>Start a conversation in any language</span>
          </h1>

          <p style={styles.desc}>
            AIと自由に話すだけ。あなたに合ったサービスへご案内します。
            <br />
            <span style={{ opacity: 0.6, fontSize: "13px" }}>Just chat — we'll guide you to what you need.</span>
          </p>

          {/* Quick start buttons */}
          <div style={styles.quickGrid}>
            {QUICK_STARTS.map((q, i) => (
              <button
                key={i}
                style={styles.quickBtn}
                onClick={() => startChat(q.text)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                }}
              >
                {q.text}
              </button>
            ))}
          </div>

          {/* Or type freely */}
          <div style={styles.orDivider}>
            <div style={styles.orLine} />
            <span style={styles.orText}>or type anything</span>
            <div style={styles.orLine} />
          </div>

          <div style={styles.landingInputRow}>
            <input
              style={styles.landingInput}
              placeholder="何でも話しかけてください / Say anything..."
              onKeyDown={(e) => {
                if (e.key === "Enter" && e.target.value.trim()) {
                  startChat(e.target.value.trim());
                }
              }}
              autoFocus
            />
            <button
              style={styles.landingSend}
              onClick={(e) => {
                const inp = e.currentTarget.previousSibling;
                if (inp.value.trim()) startChat(inp.value.trim());
              }}
            >
              →
            </button>
          </div>

          {/* Features hint */}
          <div style={styles.featureHints}>
            {Object.entries(USER_TYPES).map(([key, val]) => (
              <div key={key} style={styles.featureHint}>
                <span style={{ fontSize: "20px" }}>{val.icon}</span>
                <span style={{ fontSize: "11px", opacity: 0.6, marginTop: "4px" }}>{val.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.wrapper}>
      <div style={styles.chatContainer}>
        {/* Top bar */}
        <div style={styles.topBar}>
          <div style={styles.topBarLeft}>
            <div style={styles.logoIconSm}>は</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: "#fff" }}>Hana · はな</div>
              <div style={{ fontSize: "11px", color: "#4ECDC4" }}>NihongoHub AI · オンライン</div>
            </div>
          </div>
          {detectedType && (
            <div style={{ ...styles.typeTag, background: USER_TYPES[detectedType].color + "22", border: `1px solid ${USER_TYPES[detectedType].color}44` }}>
              <span>{USER_TYPES[detectedType].icon}</span>
              <span style={{ color: USER_TYPES[detectedType].color, fontSize: "12px" }}>
                {USER_TYPES[detectedType].label}
              </span>
            </div>
          )}
        </div>

        {/* Messages */}
        <div style={styles.messagesArea}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                ...styles.messageRow,
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role === "assistant" && (
                <div style={styles.avatarSm}>は</div>
              )}
              <div
                style={{
                  ...styles.bubble,
                  ...(msg.role === "user" ? styles.bubbleUser : styles.bubbleAssistant),
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ ...styles.messageRow, justifyContent: "flex-start" }}>
              <div style={styles.avatarSm}>は</div>
              <div style={{ ...styles.bubble, ...styles.bubbleAssistant }}>
                <div style={styles.typingDots}>
                  <span style={{ ...styles.dot, animationDelay: "0s" }} />
                  <span style={{ ...styles.dot, animationDelay: "0.2s" }} />
                  <span style={{ ...styles.dot, animationDelay: "0.4s" }} />
                </div>
              </div>
            </div>
          )}

          {/* Service card */}
          {showServiceCard && detectedType && (
            <div style={styles.serviceCard}>
              <div style={styles.serviceCardHeader}>
                <span style={{ fontSize: "24px" }}>{USER_TYPES[detectedType].icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: "14px" }}>
                    おすすめサービス
                  </div>
                  <div style={{ color: USER_TYPES[detectedType].color, fontSize: "13px" }}>
                    {USER_TYPES[detectedType].service}
                  </div>
                </div>
              </div>
              <p style={styles.serviceCardDesc}>
                {detectedType === "LEARNER" && "あなたのレベルに合わせたJLPT対策問題を毎日配信。AIが弱点を自動分析します。"}
                {detectedType === "TRAVELER" && "日本各地の旅行プランをAIが個別提案。あなたの日本語レベルに合わせた旅を。"}
                {detectedType === "RESIDENT" && "市役所の申請書類を多言語でやさしく解説。ステップごとに案内します。"}
                {detectedType === "EXPLORER" && "2分間の会話でJLPTレベルを自動判定。今すぐ試してみませんか？"}
              </p>
              <div style={styles.serviceCardButtons}>
                <button
                  style={styles.serviceCardPrimary}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "0.85"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "1"}
                >
                  詳しく見る →
                </button>
                <button
                  style={styles.serviceCardSecondary}
                  onClick={() => setShowServiceCard(false)}
                >
                  後で
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={styles.inputArea}>
          <textarea
            ref={inputRef}
            style={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="メッセージを入力 / Type in any language..."
            rows={1}
          />
          <button
            style={{
              ...styles.sendBtn,
              opacity: input.trim() && !loading ? 1 : 0.4,
            }}
            onClick={sendMessage}
            disabled={!input.trim() || loading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div style={styles.inputHint}>
          Enter で送信 · Shift+Enter で改行 · 何語でもOK
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=DM+Sans:wght@400;500;700&display=swap');
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
      `}</style>
    </div>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0f 0%, #0d1117 50%, #0a0f1a 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', 'Noto Sans JP', sans-serif",
    padding: "16px",
  },

  // Landing
  landingContainer: {
    width: "100%",
    maxWidth: "560px",
    animation: "fadeSlideUp 0.6s ease",
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "40px",
  },
  logoIcon: {
    width: "44px",
    height: "44px",
    background: "linear-gradient(135deg, #4ECDC4, #44A89A)",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    fontWeight: 700,
    color: "#0a0a0f",
  },
  logoTitle: {
    fontSize: "18px",
    fontWeight: 700,
    color: "#fff",
    letterSpacing: "-0.02em",
  },
  logoSub: {
    fontSize: "11px",
    color: "rgba(255,255,255,0.4)",
  },
  headline: {
    fontSize: "42px",
    fontWeight: 700,
    color: "#fff",
    lineHeight: 1.1,
    letterSpacing: "-0.03em",
    marginBottom: "16px",
  },
  headlineSub: {
    fontSize: "22px",
    fontWeight: 400,
    color: "rgba(255,255,255,0.35)",
    letterSpacing: "-0.01em",
  },
  desc: {
    fontSize: "15px",
    color: "rgba(255,255,255,0.55)",
    lineHeight: 1.6,
    marginBottom: "32px",
  },
  quickGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "8px",
    marginBottom: "28px",
  },
  quickBtn: {
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "10px",
    padding: "12px 14px",
    color: "rgba(255,255,255,0.8)",
    fontSize: "13px",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.15s ease",
    lineHeight: 1.4,
  },
  orDivider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "16px",
  },
  orLine: {
    flex: 1,
    height: "1px",
    background: "rgba(255,255,255,0.1)",
  },
  orText: {
    fontSize: "12px",
    color: "rgba(255,255,255,0.3)",
  },
  landingInputRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "32px",
  },
  landingInput: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderRadius: "12px",
    padding: "14px 16px",
    color: "#fff",
    fontSize: "15px",
    outline: "none",
    fontFamily: "inherit",
  },
  landingSend: {
    background: "#4ECDC4",
    border: "none",
    borderRadius: "12px",
    width: "50px",
    color: "#0a0a0f",
    fontSize: "20px",
    cursor: "pointer",
    fontWeight: 700,
  },
  featureHints: {
    display: "flex",
    justifyContent: "center",
    gap: "32px",
  },
  featureHint: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "4px",
  },

  // Chat
  chatContainer: {
    width: "100%",
    maxWidth: "600px",
    height: "90vh",
    maxHeight: "800px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: "20px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    animation: "fadeSlideUp 0.4s ease",
  },
  topBar: {
    padding: "16px 20px",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(255,255,255,0.02)",
  },
  topBarLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  logoIconSm: {
    width: "36px",
    height: "36px",
    background: "linear-gradient(135deg, #4ECDC4, #44A89A)",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "18px",
    fontWeight: 700,
    color: "#0a0a0f",
  },
  typeTag: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "5px 10px",
    borderRadius: "20px",
    fontSize: "12px",
  },
  messagesArea: {
    flex: 1,
    overflowY: "auto",
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  messageRow: {
    display: "flex",
    alignItems: "flex-end",
    gap: "8px",
    animation: "fadeSlideUp 0.3s ease",
  },
  avatarSm: {
    width: "28px",
    height: "28px",
    background: "linear-gradient(135deg, #4ECDC4, #44A89A)",
    borderRadius: "8px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 700,
    color: "#0a0a0f",
    flexShrink: 0,
  },
  bubble: {
    maxWidth: "80%",
    padding: "12px 16px",
    borderRadius: "16px",
    fontSize: "14px",
    lineHeight: 1.6,
    whiteSpace: "pre-wrap",
  },
  bubbleUser: {
    background: "#4ECDC4",
    color: "#0a0a0f",
    borderBottomRightRadius: "4px",
    fontWeight: 500,
  },
  bubbleAssistant: {
    background: "rgba(255,255,255,0.07)",
    color: "rgba(255,255,255,0.9)",
    borderBottomLeftRadius: "4px",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  typingDots: {
    display: "flex",
    gap: "4px",
    padding: "2px 0",
  },
  dot: {
    width: "7px",
    height: "7px",
    background: "rgba(255,255,255,0.4)",
    borderRadius: "50%",
    display: "inline-block",
    animation: "bounce 1.2s infinite",
  },

  // Service card
  serviceCard: {
    background: "rgba(78,205,196,0.06)",
    border: "1px solid rgba(78,205,196,0.2)",
    borderRadius: "16px",
    padding: "16px",
    animation: "fadeSlideUp 0.4s ease",
    marginTop: "8px",
  },
  serviceCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    marginBottom: "10px",
  },
  serviceCardDesc: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.6)",
    lineHeight: 1.6,
    marginBottom: "14px",
  },
  serviceCardButtons: {
    display: "flex",
    gap: "8px",
  },
  serviceCardPrimary: {
    background: "#4ECDC4",
    color: "#0a0a0f",
    border: "none",
    borderRadius: "8px",
    padding: "8px 16px",
    fontSize: "13px",
    fontWeight: 700,
    cursor: "pointer",
    transition: "opacity 0.15s",
  },
  serviceCardSecondary: {
    background: "transparent",
    color: "rgba(255,255,255,0.4)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "8px",
    padding: "8px 14px",
    fontSize: "13px",
    cursor: "pointer",
  },

  // Input
  inputArea: {
    padding: "12px 16px",
    borderTop: "1px solid rgba(255,255,255,0.07)",
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
    background: "rgba(255,255,255,0.02)",
  },
  textarea: {
    flex: 1,
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "12px 14px",
    color: "#fff",
    fontSize: "14px",
    resize: "none",
    outline: "none",
    fontFamily: "inherit",
    lineHeight: 1.5,
    maxHeight: "120px",
    overflow: "auto",
  },
  sendBtn: {
    width: "42px",
    height: "42px",
    background: "#4ECDC4",
    border: "none",
    borderRadius: "12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    color: "#0a0a0f",
    flexShrink: 0,
    transition: "opacity 0.15s",
  },
  inputHint: {
    textAlign: "center",
    fontSize: "10px",
    color: "rgba(255,255,255,0.2)",
    paddingBottom: "10px",
  },
};
