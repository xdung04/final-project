import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Camera, Headphones, X, ShieldAlert } from "lucide-react";
import "./AIChat.scss";
import * as chatService from "~/services/chatService";
import { useAuth } from "~/context/AuthContext";
import socket from "~/utils/socket";

const INITIAL_MESSAGE = {
  id: "1",
  type: "ai",
  content: "Xin chào! Tôi là AI Barbershop. Tôi có thể giúp gì cho bạn? 👋",
};

const STORAGE_KEYS = {
  messages: "chatMessages",
  sessionId: "chatSessionId",
  sessionOwner: "chatSessionOwner",
  conversationId: "chatConversationId", 
  chatMode: "chatMode",                 
};

function createNewSession(userId = "guest") {
  const id = crypto.randomUUID();
  sessionStorage.setItem(STORAGE_KEYS.sessionId, id);
  sessionStorage.setItem(STORAGE_KEYS.sessionOwner, String(userId));
  return id;
}

function clearChatSession() {
  sessionStorage.removeItem(STORAGE_KEYS.messages);
  sessionStorage.removeItem(STORAGE_KEYS.sessionId);
  sessionStorage.removeItem(STORAGE_KEYS.sessionOwner);
  sessionStorage.removeItem(STORAGE_KEYS.conversationId);
  sessionStorage.removeItem(STORAGE_KEYS.chatMode);
}

export default function AIChat({ onSwitchToLive, onRequestLogin }) {
  const { isLogin, user } = useAuth();
  const isSendingRef = useRef(false);

  const [messages, setMessages] = useState(() => {
    try {
      const savedOwner = sessionStorage.getItem(STORAGE_KEYS.sessionOwner);
      const currentOwner = isLogin && user?.idUser ? String(user.idUser) : "guest";
      if (savedOwner && savedOwner !== currentOwner) {
        clearChatSession();
        return [INITIAL_MESSAGE];
      }
      const saved = sessionStorage.getItem(STORAGE_KEYS.messages);
      return saved ? JSON.parse(saved) : [INITIAL_MESSAGE];
    } catch {
      return [INITIAL_MESSAGE];
    }
  });

  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Trạng thái hiển thị banner: false | "login" | "receptionist"
  const [showLiveBtn, setShowLiveBtn] = useState(false);

  const [conversationId, setConversationId] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEYS.conversationId) || null;
  }); 
  
  const [chatMode, setChatMode] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEYS.chatMode) || "ai";
  });

  const [wantsLive, setWantsLive] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEYS.chatMode) === "human";
  });

  const bodyRef = useRef(null);
  const prevUserIdRef = useRef(isLogin && user?.idUser ? String(user.idUser) : "guest");
  const pendingConversationIdRef = useRef(null); 

  const activeConversationIdRef = useRef(conversationId);
  useEffect(() => {
    activeConversationIdRef.current = conversationId;
  }, [conversationId]);

  const sessionId = useRef(null);
  if (sessionId.current === null) {
    const savedOwner = sessionStorage.getItem(STORAGE_KEYS.sessionOwner);
    const currentOwner = isLogin && user?.idUser ? String(user.idUser) : "guest";
    const savedId = sessionStorage.getItem(STORAGE_KEYS.sessionId);
    if (savedId && savedOwner === currentOwner) {
      sessionId.current = savedId;
    } else {
      sessionId.current = createNewSession(currentOwner);
    }
  }

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    if (conversationId) {
      sessionStorage.setItem(STORAGE_KEYS.conversationId, String(conversationId));
    } else {
      sessionStorage.removeItem(STORAGE_KEYS.conversationId);
    }
  }, [conversationId]);

  useEffect(() => {
    if (chatMode) {
      sessionStorage.setItem(STORAGE_KEYS.chatMode, chatMode);
    }
  }, [chatMode]);

  useEffect(() => {
    const currentOwner = isLogin && user?.idUser ? String(user.idUser) : "guest";
    const prevOwner = prevUserIdRef.current;
    if (prevOwner !== currentOwner) {
      console.log(`[AIChat] User thay đổi: ${prevOwner} → ${currentOwner}. Reset session.`);
      clearChatSession();
      setMessages([INITIAL_MESSAGE]);
      setConversationId(null);
      setShowLiveBtn(false);
      setChatMode("ai");
      setInputMessage("");
      setSelectedImage(null);
      setWantsLive(false);
      pendingConversationIdRef.current = null;
      const newId = createNewSession(currentOwner);
      sessionId.current = newId;
      prevUserIdRef.current = currentOwner;
    }
  }, [isLogin, user?.idUser]);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, loading]);

  useEffect(() => {
    if (!conversationId) return;

    console.log(`🔌 [Socket] Khách hàng kết nối vào Room: ${conversationId}`);
    socket.emit("join_conversation", { conversationId: String(conversationId) });

    const handleReceptionistJoined = ({ conversationId: convId, receptionistName }) => {
      if (Number(convId) !== Number(activeConversationIdRef.current)) return;
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "ai",
          content: `💼 ${receptionistName || "Lễ tân"} đã tham gia! Đang chuyển bạn sang chat trực tiếp... 🎉`,
        },
      ]);
      setChatMode("human");
      setWantsLive(true);
    };

    const handleReceiveMessage = (msg) => {
       if (msg.senderType === "customer") return;
  if (Number(msg.conversationId) !== Number(activeConversationIdRef.current)) return;

  if (msg.senderType === "system" && msg.eventType === "leave") {
    console.log("🔄 [Socket] Lễ tân đã rời phòng. Đưa khách về trạng thái Chờ...");
    setChatMode("ai");     
    setWantsLive(true);    
  }
      let msgType = "receptionist";
      if (msg.senderType === "system") msgType = "system";
      else if (msg.senderType === "ai") msgType = "ai";


      setMessages((prev) => [
        ...prev,
        {
          id: msg.id || Date.now().toString(),
          type: msgType,
          content: msg.content,
        },
      ]);
    };

    const handleConversationClosed = ({ conversationId: closedId }) => {
      if (Number(closedId) !== Number(activeConversationIdRef.current)) return;
      
      console.log("🏁 [Socket Realtime] Lễ tân đã đóng phòng. Đang chuyển khách về với AI...");
      sessionStorage.removeItem(STORAGE_KEYS.conversationId);
      sessionStorage.removeItem(STORAGE_KEYS.chatMode);
      
      setChatMode("ai");
      setWantsLive(false);
      setConversationId(null);
      
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "ai",
          content: "🤖 Cuộc trò chuyện trực tiếp đã kết thúc. Trợ lý AI đã quay trở lại để hỗ trợ bạn!",
        },
      ]);
    };

    socket.on("receptionist_joined", handleReceptionistJoined);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("conversation_closed", handleConversationClosed);

    return () => {
      console.log(`❌ [Socket] Khách rời Room ngầm: ${activeConversationIdRef.current}`);
      socket.off("receptionist_joined", handleReceptionistJoined);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("conversation_closed", handleConversationClosed);
      
      if (activeConversationIdRef.current) {
        socket.emit("leave_conversation", { conversationId: String(activeConversationIdRef.current) });
      }
    };
  }, [conversationId]);
  
  useEffect(() => {
    // Nếu bỗng dưng login mà trạng thái cũ đang đòi gặp lễ tân, tự động dẫn luồng đi tiếp
    if (isLogin && showLiveBtn === "receptionist" && !conversationId && !wantsLive) {
      setWantsLive(true);
      handleSyncAndRedirect();
    }
  }, [isLogin]);

  const handleSyncAndRedirect = async () => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        type: "ai",
        content: "Đang tìm lễ tân hỗ trợ, vui lòng chờ trong giây lát... ⏳",
      },
    ]);
    setShowLiveBtn(false);

    try {
      const result = await chatService.requestHumanSupport();
      if (result && result.conversationId) {
        setConversationId(result.conversationId);
      }
    } catch (err) {
      console.error("Lỗi gửi yêu cầu kết nối lên hàng chờ lễ tân:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          type: "ai",
          content: "Gặp sự cố kết nối, vui lòng bấm thử lại sau ít phút! 😅",
        },
      ]);
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

  // ✅ FIX (bug format): hàm cũ KHÔNG hề convert markdown **đậm** → <strong>,
  // nên "**Combo Cắt + Gội**" hiển thị y nguyên dấu ** ra chat thay vì chữ đậm.
  // Đồng thời escape HTML trước khi chèn tag của mình, tránh vỡ layout nếu
  // text chứa ký tự <, >, & và tránh double-escape các tag <br>/<strong> tự chèn.
  const escapeHtml = (str) =>
    str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const formatMessage = (text) => {
    if (!text) return "";

    let html = escapeHtml(text);

    // **đậm** → <strong>đậm</strong> (PHẢI làm trước khi thay \n → <br>,
    // vì nội dung đậm có thể nằm giữa 1 dòng, không ảnh hưởng bởi <br>)
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

    // Xuống dòng
    html = html.replace(/\n/g, "<br>");

    // "1. " đầu dòng → in đậm cả số thứ tự
    html = html.replace(/(<br>|^)(\d+)\.\s/g, "$1<strong>$2.</strong> ");

    // Bullet "•", "–", "-", "*" đầu dòng → ▸ (đặt "-" cuối character class
    // để tránh bị hiểu nhầm thành range trong regex)
    html = html.replace(/(<br>|^)\s*[•–*-]\s+(?!\d)/g, "$1▸ ");

    // Icon nổi bật
    html = html.replace(/(💈|✂️|🔥)/g, "<strong>$1</strong>");

    return html;
  };

  // Click xử lý nút hành động trên Banner gợi ý
  const handleSwitchToLive = async () => {
    if (!isLogin) {
      setShowLiveBtn(false); // Ẩn banner đi để tránh dính đè UI khi mở modal
      onRequestLogin?.();    // Gọi modal Đăng nhập / Đăng ký của hệ thống web
      return;
    }

    setWantsLive(true);
    await handleSyncAndRedirect(); 
  };

  const handleDismissLiveBanner = () => {
    setShowLiveBtn(false);
    pendingConversationIdRef.current = null;
  };
const handleSend = async () => {
  if (isSendingRef.current) return;
  if (loading || (!inputMessage.trim() && !selectedImage)) return;

  isSendingRef.current = true; // ← lock ngay từ đầu, trước mọi nhánh

  const newMsg = {
    id: Date.now().toString(),
    type: "user",
    content: inputMessage || "📷 Đã gửi ảnh",
    image: selectedImage,
  };

  setMessages((prev) => [...prev, newMsg]);
  setInputMessage("");
  setSelectedImage(null);

  if (chatMode === "human" && conversationId) {
    console.log("🚀 [Socket] Khách gửi realtime:", newMsg.content);

    socket.emit("send_message", {
      conversationId: conversationId,
      senderType: "customer",
      senderId: user?.idUser || "guest",
      messageType: "text",
      content: newMsg.content,
      image: newMsg.image,
      createdAt: new Date(),
    });
    setTimeout(() => {
      isSendingRef.current = false;
    }, 100);
    return;
  }

  setLoading(true);
  try {
    const currentSessionId =
      sessionStorage.getItem(STORAGE_KEYS.sessionId) || sessionId.current;

    const res = await chatService.sendMessage({
      message: newMsg.content,
      image: newMsg.image,
      sessionId: currentSessionId,
    });

    if (res.conversationId) {
      pendingConversationIdRef.current = res.conversationId;
    }

    if (res.reply) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          type: "ai",
          content: formatMessage(res.reply),
        },
      ]);
    }

    if (res.needLogin) {
      setShowLiveBtn("login");
    } else if (res.needReceptionist) {
      setShowLiveBtn("receptionist");
    } else {
      setShowLiveBtn(false);
    }

    if (!res.needLogin && !res.needReceptionist && res.systemMessage) {
      setMessages((prev) => [
        ...prev,
        {
          id: res.systemMessage.id,
          type: "system",
          content: res.systemMessage.content || "Lễ tân đã tham gia cuộc hội thoại.",
        },
      ]);
      setChatMode("human");
    }
  } catch (err) {
    console.error("Lỗi gửi tin nhắn AI:", err);
    setMessages((prev) => [
      ...prev,
      {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "Kết nối máy chủ gián đoạn, vui lòng gửi lại sau ít phút. 😅",
      },
    ]);
  } finally {
    setLoading(false);
    isSendingRef.current = false; // ← unlock sau khi AI flow hoàn tất
  }
};

  return (
    <div className="chat-card">
      <div className={`chat-header ${chatMode === "human" ? "live-mode" : ""}`}>
        <div className="chat-header-logo">
          {chatMode === "ai" ? (
            <svg viewBox="0 0 24 24" fill="none" className="scissor-icon">
              <path d="M6 9C7.65685 9 9 7.65685 9 6C9 4.34315 7.65685 3 6 3C4.34315 3 3 4.34315 3 6C3 7.65685 4.34315 9 6 9Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 21C7.65685 21 9 19.6569 9 18C9 16.3431 7.65685 15 6 15C4.34315 15 3 16.3431 3 18C3 19.6569 4.34315 21 6 21Z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8.5 7.5L21 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8.5 16.5L21 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8.5 7.5L14 12L8.5 16.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <div className="human-avatar-icon">👨‍💼</div>
          )}
        </div>
        <div className="chat-header-text">
          <h3>{chatMode === "ai" ? "AI Barbershop" : "Lễ tân hỗ trợ"}</h3>
          <div className="chat-header-status">
            <span className="status-dot online" />
            <span>{chatMode === "ai" ? "Trực tuyến" : "Đang kết nối trực tiếp"}</span>
          </div>
        </div>
        <div className={`chat-header-badge ${chatMode === "human" ? "live" : ""}`}>
          {chatMode === "ai" ? "AI" : "LIVE"}
        </div>
      </div>

      <div className="chat-body" ref={bodyRef}>
        {messages.map((msg) => {
          if (msg.type === "system") {
            return (
              <div key={msg.id} className="chat-message-system">
                <div className="system-bubble">
                  <ShieldAlert size={14} className="system-icon" />
                  <span dangerouslySetInnerHTML={{ __html: msg.content }} />
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`chat-message ${msg.type}`}>
              {msg.type === "ai" && (
                <div className="avatar ai">
                  <Bot size={14} />
                </div>
              )}
              {msg.type === "receptionist" && (
                <div className="avatar receptionist">
                  <User size={14} />
                </div>
              )}
              <div className="bubble">
                {msg.type === "receptionist" && <span className="sender-name">Lễ Tân</span>}
                {msg.image && <img src={msg.image} alt="upload" className="bubble-img" />}
                <div className="bubble-text" dangerouslySetInnerHTML={{ __html: msg.content }} />
              </div>
              {msg.type === "user" && (
                <div className="avatar user">
                  <User size={14} />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="chat-message ai typing">
            <div className="avatar"><Bot size={14} /></div>
            <div className="bubble">
              <span className="typing-dot" />
              <span className="typing-dot" />
              <span className="typing-dot" />
            </div>
          </div>
        )}
      </div>

      {/* 🔥 HIỂN THỊ BANNER ĐÃ ĐƯỢC PHÂN TÁCH ĐÚNG NGỮ CẢNH HỘI THOẠI */}
      {showLiveBtn && chatMode === "ai" && (
        <div className={`suggestion ${showLiveBtn === "login" ? "suggestion-login" : "suggestion-live"}`}>
          <Headphones size={15} />
          <span>
            {showLiveBtn === "login" 
              ? "Anh vui lòng đăng nhập để hệ thống lưu giữ lịch hẹn chính thức nhé!" 
              : "Anh muốn kết nối nói chuyện trực tiếp với Lễ tân bên em không ạ?"}
          </span>
          <button onClick={handleSwitchToLive}>
            {showLiveBtn === "login" ? "Đăng nhập ngay" : "Kết nối ngay"}
          </button>
          <button className="dismiss" onClick={handleDismissLiveBanner}>
            <X size={13} />
          </button>
        </div>
      )}

      {chatMode === "ai" && wantsLive && conversationId && (
        <div className="suggestion waiting-reconnect" style={{ backgroundColor: "#fef3c7", borderColor: "#f59e0b", padding: "10px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px", margin: "10px 0" }}>
          <span className="typing-dot" style={{ backgroundColor: "#d97706", width: "8px", height: "8px", borderRadius: "50%", display: "inline-block" }} /> 
          <span style={{ color: "#b45309", fontWeight: 500, fontSize: "14px" }}>
            Hệ thống đang kết nối bạn với Lễ tân mới, vui lòng đợi trong giây lát...
          </span>
        </div>
      )}

      {selectedImage && (
        <div className="preview">
          <img src={selectedImage} alt="preview" />
          <button onClick={() => setSelectedImage(null)}><X size={14} /></button>
        </div>
      )}

      <div className="chat-input">
        <textarea
          placeholder={chatMode === "ai" ? "Hỏi Trợ lý AI..." : "Nhập tin nhắn gửi Lễ tân..."}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return; 
    }
            if (e.key === "Enter" && !e.shiftKey) {
              
              e.preventDefault();
              e.stopPropagation();
              handleSend();
            }
          }}
        />
        <div className="actions">
          <label htmlFor="imgUpload" className="upload-btn" title="Tải ảnh lên">
            <Camera size={18} />
          </label>
          <input id="imgUpload" type="file" accept="image/*" onChange={handleImageUpload} hidden />
          <button className={`send-btn ${loading ? "disabled" : ""}`} onClick={handleSend} disabled={loading}>
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}