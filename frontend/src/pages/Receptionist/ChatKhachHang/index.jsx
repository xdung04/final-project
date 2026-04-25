// client/src/components/ChatKhachHang.jsx
import React, { useEffect, useState, useRef, useCallback } from "react";
import socket from "~/utils/socket";
import * as chatLiveService from "~/services/chatLiveService";
import { useAuth } from "~/context/AuthContext";

const ChatKhachHang = () => {
  const { isLogin, user, accessToken } = useAuth();
  const [conversations, setConversations] = useState({
    waiting: [],
    inProgress: [],
  });
  const [activeTab, setActiveTab] = useState("waiting");
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [receptionists, setReceptionists] = useState([]);
  const [selectedReceptionist, setSelectedReceptionist] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const sentMessagesRef = useRef(new Set());
  const messagesEndRef = useRef(null);

  const receptionistId = user?.idUser;
  const token = accessToken;

  // Load conversations
  const loadConversations = useCallback(async () => {
    if (!receptionistId || !token) return;

    setLoading(true);
    try {
      const [waitingList, activeList] = await Promise.all([
        chatLiveService.getWaitingConversations(token),
        chatLiveService.getActiveConversations(receptionistId, token),
      ]);

      setConversations({
        waiting: waitingList || [],
        inProgress: activeList || [],
      });
    } catch (error) {
      console.error("Lỗi load conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [receptionistId, token]);

  // Load chat history
  const loadChatHistory = useCallback(
    async (conversationId) => {
      if (!conversationId || !token) return;

      try {
        const result = await chatLiveService.getChatHistory(
          conversationId,
          token,
        );
        if (result.success) {
          setMessagesMap((prev) => ({
            ...prev,
            [conversationId]: result.data.messages,
          }));
        }
      } catch (error) {
        console.error("Lỗi load lịch sử:", error);
      }
    },
    [token],
  );

  // Join conversation
  const handleJoinConversation = useCallback(
    async (conversation) => {
      try {
        const result = await chatLiveService.receptionistJoin(
          conversation.id,
          receptionistId,
          token,
        );

        if (result.success) {
          await loadConversations();
          setActiveConversationId(conversation.id);
          await loadChatHistory(conversation.id);
        }
      } catch (error) {
        console.error("Lỗi join:", error);
        alert(error.response?.data?.error || "Không thể join cuộc trò chuyện");
      }
    },
    [receptionistId, token, loadConversations, loadChatHistory],
  );

  // Leave conversation
  const handleLeaveConversation = useCallback(async () => {
    if (!activeConversationId) return;

    if (window.confirm("Bạn có chắc muốn rời cuộc trò chuyện?")) {
      try {
        await chatLiveService.receptionistLeave(
          activeConversationId,
          receptionistId,
          token,
        );
        await loadConversations();
        setActiveConversationId(null);
      } catch (error) {
        console.error("Lỗi leave:", error);
      }
    }
  }, [activeConversationId, receptionistId, token, loadConversations]);

  // Transfer conversation
  const handleTransfer = useCallback(
    async (toReceptionistId) => {
      if (!activeConversationId) return;

      try {
        await chatLiveService.transferConversation(
          activeConversationId,
          receptionistId,
          toReceptionistId,
          token,
        );
        await loadConversations();
        setSelectedReceptionist("");
        alert("Chuyển thành công");
      } catch (error) {
        console.error("Lỗi transfer:", error);
        alert(error.response?.data?.error || "Chuyển thất bại");
      }
    },
    [activeConversationId, receptionistId, token, loadConversations],
  );

  // Close conversation
  const handleCloseConversation = useCallback(async () => {
    if (!activeConversationId) return;

    if (window.confirm("Đóng cuộc trò chuyện này?")) {
      try {
        await chatLiveService.closeCustomerConversation(
          activeConversationId,
          token,
        );
        await loadConversations();
        setActiveConversationId(null);
      } catch (error) {
        console.error("Lỗi close:", error);
      }
    }
  }, [activeConversationId, token, loadConversations]);

  useEffect(() => {
    const loadReceptionists = async () => {
      try {
        const res = await chatLiveService.getAllReceptionists(token);
        if (res.success) {
          setReceptionists(res.data);
        }
      } catch (err) {
        console.error("Lỗi load lễ tân:", err);
      }
    };

    if (token) loadReceptionists();
  }, [token]);

  // Socket receive message
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      if (sentMessagesRef.current.has(msg.clientId)) {
        console.log("⏭️ Bỏ qua tin nhắn trùng (clientId)", msg.clientId);
        return;
      }

      setMessagesMap((prev) => ({
        ...prev,
        [msg.conversationId]: [...(prev[msg.conversationId] || []), msg],
      }));
    };

    socket.on("receive_message", handleReceiveMessage);
    return () => {
      socket.off("receive_message", handleReceiveMessage);
    };
  }, []);

  // Join room when select conversation
  useEffect(() => {
    if (!activeConversationId) return;

    const joinRoom = () => {
      socket.emit("join_conversation", {
        conversationId: activeConversationId,
      });
    };

    if (socket.connected) {
      joinRoom();
    } else {
      socket.once("connect", joinRoom);
    }

    return () => {
      socket.emit("leave_conversation", {
        conversationId: activeConversationId,
      });
    };
  }, [activeConversationId]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, activeConversationId]);

  const handleSend = () => {
    if (!inputMessage.trim() || !activeConversationId) return;

    const clientId = Date.now() + "_" + Math.random();

    const messageData = {
      conversationId: activeConversationId,
      senderType: "receptionist",
      senderId: receptionistId,
      messageType: "text",
      content: inputMessage,
      createdAt: new Date(),
      clientId, // ✅ thêm clientId
    };

    sentMessagesRef.current.add(clientId);
    setTimeout(() => {
      sentMessagesRef.current.delete(clientId);
    }, 2000);

    socket.emit("send_message", messageData);

    setMessagesMap((prev) => ({
      ...prev,
      [activeConversationId]: [
        ...(prev[activeConversationId] || []),
        messageData,
      ],
    }));

    setInputMessage("");
  };

  const currentMessages = messagesMap[activeConversationId] || [];

  if (loading && !activeConversationId) {
    return <div className="loading">Đang tải...</div>;
  }

  return (
    <div style={{ display: "flex", height: "500px" }}>
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          borderRight: "1px solid #ccc",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", borderBottom: "1px solid #ccc" }}>
          <button
            onClick={() => setActiveTab("waiting")}
            style={{
              flex: 1,
              padding: "10px",
              background: activeTab === "waiting" ? "#007bff" : "#f0f0f0",
              color: activeTab === "waiting" ? "white" : "black",
              border: "none",
              cursor: "pointer",
            }}
          >
            Chờ ({conversations.waiting.length})
          </button>
          <button
            onClick={() => setActiveTab("inProgress")}
            style={{
              flex: 1,
              padding: "10px",
              background: activeTab === "inProgress" ? "#007bff" : "#f0f0f0",
              color: activeTab === "inProgress" ? "white" : "black",
              border: "none",
              cursor: "pointer",
            }}
          >
            Đang xử lý ({conversations.inProgress.length})
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto" }}>
          {activeTab === "waiting" &&
            conversations.waiting.map((conv) => (
              <div
                key={conv.id}
                onClick={() => handleJoinConversation(conv)}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  background:
                    activeConversationId === conv.id ? "#e3f2fd" : "white",
                }}
              >
                <strong>{conv.customerName}</strong>
                <div style={{ fontSize: "12px", color: "#666" }}>
                  {conv.customerPhone && `📞 ${conv.customerPhone}`}
                </div>
                <div style={{ fontSize: "11px", color: "#999" }}>
                  {new Date(conv.createdAt).toLocaleString()}
                </div>
              </div>
            ))}

          {activeTab === "inProgress" &&
            conversations.inProgress.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setActiveConversationId(conv.id);
                  loadChatHistory(conv.id);
                }}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  background:
                    activeConversationId === conv.id ? "#e3f2fd" : "white",
                }}
              >
                <strong>{conv.customerName}</strong>
                {conv.assignedReceptionist?.id === receptionistId && (
                  <span
                    style={{
                      fontSize: "10px",
                      color: "green",
                      marginLeft: "5px",
                    }}
                  >
                    (Tôi)
                  </span>
                )}
                <div style={{ fontSize: "11px", color: "#999" }}>
                  {new Date(conv.lastUpdated).toLocaleString()}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Chat Window */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            padding: "10px",
            borderBottom: "1px solid #ccc",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <div>
            {activeConversationId && (
              <span>
                Đang chat với:{" "}
                {conversations.inProgress.find(
                  (c) => c.id === activeConversationId,
                )?.customerName ||
                  conversations.waiting.find(
                    (c) => c.id === activeConversationId,
                  )?.customerName}
              </span>
            )}
          </div>
          <div>
            {activeConversationId && (
              <>
                <button onClick={handleLeaveConversation}>Rời</button>
                <button onClick={handleCloseConversation}>Đóng</button>

                {!showTransfer ? (
                  <button onClick={() => setShowTransfer(true)}>Chuyển</button>
                ) : (
                  <>
                    <select
                      value={selectedReceptionist}
                      onChange={(e) => setSelectedReceptionist(e.target.value)}
                    >
                      <option value="">-- Chọn lễ tân --</option>
                      {receptionists
                        .filter((r) => r.id !== receptionistId)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name} {r.branch ? `(${r.branch})` : ""}
                          </option>
                        ))}
                    </select>

                    <button
                      onClick={() => {
                        if (!selectedReceptionist) {
                          alert("Chọn lễ tân trước!");
                          return;
                        }
                        handleTransfer(Number(selectedReceptionist));
                        setShowTransfer(false);
                      }}
                    >
                      Xác nhận
                    </button>

                    <button onClick={() => setShowTransfer(false)}>Huỷ</button>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "10px" }}>
          {currentMessages.map((msg, i) => (
            <div
              key={i}
              style={{
                textAlign: msg.senderType === "receptionist" ? "right" : "left",
                marginBottom: "8px",
              }}
            >
              {msg.senderType === "system" ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "4px",
                    backgroundColor: "#f0f0f0",
                    borderRadius: "4px",
                    fontSize: "12px",
                    color: "#666",
                  }}
                >
                  {msg.eventType === "join" &&
                    `💼 ${msg.metadata?.name} đã tham gia`}
                  {msg.eventType === "leave" &&
                    `💼 ${msg.metadata?.name} đã rời`}
                  {msg.eventType === "transfer" &&
                    `🔄 Chuyển từ ${msg.metadata?.fromName} sang ${msg.metadata?.toName}`}
                </div>
              ) : (
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 10px",
                    background:
                      msg.senderType === "receptionist" ? "#d1e7ff" : "#eee",
                    borderRadius: "10px",
                  }}
                >
                  {msg.content}
                </span>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div style={{ display: "flex", padding: "10px" }}>
          <input
            style={{ flex: 1, padding: "8px" }}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Nhập tin nhắn..."
            disabled={!activeConversationId}
          />
          <button onClick={handleSend} disabled={!activeConversationId}>
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatKhachHang;
