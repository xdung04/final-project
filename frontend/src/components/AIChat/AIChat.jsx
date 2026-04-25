import React, { useState } from "react";
import { Send, Bot, User, Camera } from "lucide-react";
import "./AIChat.scss";
import * as chatService from "~/services/chatService";
export default function AIChat({ onSwitchToLive }) {
  const [messages, setMessages] = useState([
    {
      id: "1",
      type: "ai",
      content:
        "💈 Xin chào! Tôi là AI Barbershop. Hãy nhập tin nhắn hoặc tải ảnh lên 👋",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLiveBtn, setShowLiveBtn] = useState(false);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async () => {
    if (loading) return;
    if (!inputMessage.trim() && !selectedImage) return;

    const newMsg = {
      id: Date.now().toString(),
      type: "user",
      content: inputMessage || "📷 Đã gửi ảnh",
      image: selectedImage,
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage("");
    setSelectedImage(null);
    setLoading(true);

    try {
      const res = await chatService.sendMessage({
        message: newMsg.content,
        image: newMsg.image,
      });

      // ✅ Format AI message đẹp hơn
      const formattedReply = formatMessage(
        res.reply || "AI không trả lời gì 😅",
      );

      setMessages((prev) => {
        const updated = [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content: formattedReply,
          },
        ];

        // 🔥 HIỆN NÚT SAU 2 LẦN AI TRẢ LỜI
        const aiCount = updated.filter((m) => m.type === "ai").length;
        if (aiCount >= 2) {
          setShowLiveBtn(true);
        }

        return updated;
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  // 🪄 Hàm format lại message AI
  const formatMessage = (text) => {
    return text
      .replace(/\n/g, "<br>")
      .replace(/(\d+\.)/g, "<br><strong>$1</strong>") // số thứ tự
      .replace(/([•\-–])/g, "<br>👉") // bullet point
      .replace(/(💈|✂️|🔥)/g, "<strong>$1</strong>"); // nhấn mạnh icon
  };

  return (
    <div className="chat-card">
      <div className="chat-header">
        <Bot size={20} />
        <h3>AI Chat</h3>
      </div>

      <div className="chat-body">
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.type}`}>
            {msg.type === "ai" && (
              <div className="avatar">
                <Bot size={16} />
              </div>
            )}
            <div className="bubble">
              {msg.image && (
                <img src={msg.image} alt="upload" className="bubble-img" />
              )}
              <div
                className="bubble-text"
                dangerouslySetInnerHTML={{ __html: msg.content }}
              />
            </div>
            {msg.type === "user" && (
              <div className="avatar">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-message ai typing">
            <div className="avatar">
              <Bot size={16} />
            </div>
            <div className="bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
      </div>

      {showLiveBtn && (
        <div className="suggestion">
          <button onClick={onSwitchToLive}>💬 Nói chuyện với lễ tân</button>
        </div>
      )}

      {selectedImage && (
        <div className="preview">
          <img src={selectedImage} alt="preview" />
          <button onClick={() => setSelectedImage(null)}>✕</button>
        </div>
      )}

      <div className="chat-input">
        <textarea
          placeholder="Nhập tin nhắn..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <div className="actions">
          <label htmlFor="imgUpload" className="upload-btn">
            <Camera size={20} />
          </label>
          <input
            id="imgUpload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            hidden
          />
          <button className="send-btn" onClick={handleSend}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
