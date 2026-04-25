// client/src/components/LiveChat.jsx
import React, { useEffect, useState, useRef } from "react";
import { Send, User, Camera } from "lucide-react";
import socket from "~/utils/socket";
import * as chatLiveService from "~/services/chatLiveService";

export default function LiveChat({ customerId, token }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const sentMessagesRef = useRef(new Set());

  // Khởi tạo conversation
  useEffect(() => {
    const initConversation = async () => {
      if (!customerId || !token) return;

      try {
        const result = await chatLiveService.getOrCreateConversation(
          customerId,
          token,
        );
        if (result.success) {
          setConversationId(result.data.id);
          setConversation(result.data);
        }
      } catch (error) {
        console.error("Lỗi tạo conversation:", error);
      } finally {
        setLoading(false);
      }
    };

    initConversation();
  }, [customerId, token]);

  // Load lịch sử chat
  useEffect(() => {
    const loadHistory = async () => {
      if (!conversationId || !token) return;

      try {
        const result = await chatLiveService.getChatHistory(
          conversationId,
          token,
        );
        if (result.success) {
          setMessages(result.data.messages);
        }
      } catch (error) {
        console.error("Lỗi load lịch sử:", error);
      }
    };

    loadHistory();
  }, [conversationId, token]);

  // Socket: Join room và lắng nghe message
  useEffect(() => {
    if (!conversationId) return;

    const joinRoom = () => {
      socket.emit("join_conversation", { conversationId });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    const handleReceiveMessage = (msg) => {
      // ✅ Kiểm tra clientId
      if (sentMessagesRef.current.has(msg.clientId)) {
        console.log("⏭️ Bỏ qua tin nhắn trùng (clientId)", msg.clientId);
        return;
      }
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.emit("leave_conversation", { conversationId });
    };
  }, [conversationId]);

  const handleSend = () => {
    if (!inputMessage.trim() && !selectedImage) return;
    const clientId = Date.now() + "_" + Math.random();

    const msgData = {
      conversationId,
      senderType: "customer",
      senderId: customerId,
      messageType: "text",
      content: inputMessage.trim(),
      image: selectedImage,
      createdAt: new Date(),
      clientId, // ✅ thêm clientId
    };

    // Lưu clientId để filter sau
    sentMessagesRef.current.add(clientId);
    setTimeout(() => {
      sentMessagesRef.current.delete(clientId);
    }, 2000);

    socket.emit("send_message", msgData);
    setMessages((prev) => [...prev, msgData]);
    setInputMessage("");
    setSelectedImage(null);
  };

  const handleCloseChat = async () => {
    if (!conversationId) return;

    if (window.confirm("Bạn có chắc muốn đóng cuộc trò chuyện?")) {
      try {
        await chatLiveService.closeCustomerConversation(conversationId, token);
        alert("Đã đóng cuộc trò chuyện");
      } catch (error) {
        console.error("Lỗi đóng chat:", error);
      }
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSelectedImage(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (loading) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div className="chat-card">
      <div className="chat-header">
        <h3>💬 Chat với lễ tân</h3>
      </div>

      <div className="chat-body">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`chat-message ${
              msg.senderType === "customer"
                ? "user"
                : msg.senderType === "system"
                  ? "system"
                  : "ai"
            }`}
          >
            {msg.senderType !== "customer" && msg.senderType !== "system" && (
              <div className="avatar">💼</div>
            )}
            {msg.senderType === "system" && <div className="avatar">📢</div>}

            <div className="bubble">
              {msg.image && <img src={msg.image} className="bubble-img" />}

              {msg.messageType === "system" ? (
                <div className="system-message">
                  {msg.eventType === "join" &&
                    `💼 ${msg.metadata?.name} đã tham gia`}
                  {msg.eventType === "leave" &&
                    `💼 ${msg.metadata?.name} đã rời`}
                  {msg.eventType === "transfer" &&
                    `🔄 Chuyển từ ${msg.metadata?.fromName} sang ${msg.metadata?.toName}`}
                  {msg.eventType === "reopen" &&
                    `🔄 Cuộc trò chuyện được mở lại`}
                </div>
              ) : (
                <div className="bubble-text">{msg.content}</div>
              )}
            </div>

            {msg.senderType === "customer" && (
              <div className="avatar">
                <User size={16} />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {selectedImage && (
        <div className="preview">
          <img src={selectedImage} alt="Preview" />
          <button onClick={() => setSelectedImage(null)}>✕</button>
        </div>
      )}

      <div className="chat-input">
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Nhập tin nhắn..."
        />

        <div className="actions">
          <label>
            <Camera size={20} />
            <input type="file" hidden onChange={handleImageUpload} />
          </label>

          <button onClick={handleSend}>
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}
