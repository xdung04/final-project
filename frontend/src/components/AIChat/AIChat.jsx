import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Camera, Headphones, X } from "lucide-react";
import "./AIChat.scss";
import * as chatService from "~/services/chatService";
import { useAuth } from "~/context/AuthContext";

export default function AIChat({ onSwitchToLive, onRequestLogin }) {
  const { isLogin } = useAuth();

  const [messages, setMessages] = useState([
    {
      id: "1",
      type: "ai",
      content: "Xin chào! Tôi là AI Barbershop. Tôi có thể giúp gì cho bạn? 👋",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLiveBtn, setShowLiveBtn] = useState(false);
  const bodyRef = useRef(null);

  // Session ID — tạo 1 lần per tab, mất khi đóng tab
  const sessionId = useRef(
    sessionStorage.getItem("chatSessionId") || (() => {
      const id = crypto.randomUUID();
      sessionStorage.setItem("chatSessionId", id);
      return id;
    })()
  );

  // Auto scroll xuống cuối
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const formatMessage = (text) => {
    return text
      .replace(/\n/g, "<br>")
      .replace(/(\d+\.)/g, "<br><strong>$1</strong>")
      .replace(/([•\-–])/g, "<br>▸ ")
      .replace(/(💈|✂️|🔥)/g, "<strong>$1</strong>");
  };

  // Xử lý click "Kết nối lễ tân"
  const handleSwitchToLive = () => {
    if (!isLogin) {
      // Chưa login → yêu cầu login trước
      onRequestLogin?.();
      return;
    }
    // Đã login → chuyển sang live chat
    onSwitchToLive?.();
  };

  const handleSend = async () => {
    if (loading || (!inputMessage.trim() && !selectedImage)) return;

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
        sessionId: sessionId.current,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: formatMessage(res.reply || "AI không trả lời gì 😅"),
        },
      ]);

      console.log("res trong AIChat:", res);
      console.log("needReceptionist:", res.needReceptionist);

      if (res.needReceptionist) {
        setShowLiveBtn(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-card">

      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-logo">
          <svg viewBox="0 0 24 24" fill="none" className="scissor-icon">
            <path d="M6 9C7.65685 9 9 7.65685 9 6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M8.5 7.5L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M8.5 7.5L14 12L8.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div className="chat-header-text">
          <h3>AI Barbershop</h3>
          <div className="chat-header-status">
            <span className="status-dot" />
            <span>Trực tuyến</span>
          </div>
        </div>
        <div className="chat-header-badge">AI</div>
      </div>

      {/* Messages */}
      <div className="chat-body" ref={bodyRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={`chat-message ${msg.type}`}>
            {msg.type === "ai" && (
              <div className="avatar">
                <Bot size={14} />
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
                <User size={14} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="chat-message ai typing">
            <div className="avatar">
              <Bot size={14} />
            </div>
            <div className="bubble">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* Nút chuyển lễ tân */}
      {showLiveBtn && (
        <div className="suggestion">
          <Headphones size={15} />
          <span>
            {isLogin
              ? "Bạn muốn nói chuyện trực tiếp với lễ tân?"
              : "Vui lòng đăng nhập để kết nối với lễ tân."}
          </span>
          <button onClick={handleSwitchToLive}>
            {isLogin ? "Kết nối" : "Đăng nhập"}
          </button>
          <button className="dismiss" onClick={() => setShowLiveBtn(false)}>
            <X size={13} />
          </button>
        </div>
      )}

      {/* Preview ảnh */}
      {selectedImage && (
        <div className="preview">
          <img src={selectedImage} alt="preview" />
          <button onClick={() => setSelectedImage(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Input */}
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
          <label htmlFor="imgUpload" className="upload-btn" title="Tải ảnh lên">
            <Camera size={18} />
          </label>
          <input
            id="imgUpload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            hidden
          />
          <button
            className={`send-btn ${loading ? "disabled" : ""}`}
            onClick={handleSend}
            disabled={loading}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
