import React, { useEffect, useState, useRef, useCallback } from "react";
import { Search, ArrowLeft, Send, User, Camera } from "lucide-react";
import socket from "~/utils/socket";
import * as chatLiveService from "~/services/chatLiveService";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import styles from "./ChatKhachHang.module.scss";
import ConfirmModal from "../../../components/ComfirmModal/index";

const ChatKhachHang = () => {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState({
    waiting: [],
    inProgress: [],
    closed: [],
  });
  const [activeTab, setActiveTab] = useState("waiting");
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messagesMap, setMessagesMap] = useState({});
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [receptionists, setReceptionists] = useState([]);
  const [selectedReceptionist, setSelectedReceptionist] = useState("");
  const [showTransfer, setShowTransfer] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const sentMessagesRef = useRef(new Set());
  const messagesEndRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const receptionistId = user?.idUser;
  const token = accessToken;

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Xác nhận",
    confirmType: "danger",
    onConfirm: null,
  });

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDateLabel = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Hôm nay";
    if (date.toDateString() === yesterday.toDateString()) return "Hôm qua";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;

    messages.forEach((msg) => {
      const msgDate = new Date(msg.createdAt).toDateString();
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({
          type: "date",
          label: formatDateLabel(msg.createdAt),
          key: msgDate,
        });
      }
      groups.push({ type: "message", data: msg });
    });

    return groups;
  };

  const closeConfirmModal = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  // Load conversations (waiting & inProgress)
  const loadConversations = useCallback(async () => {
    if (!receptionistId || !token) return;
    setLoading(true);
    try {
      const [waitingList, activeList] = await Promise.all([
        chatLiveService.getWaitingConversations(token),
        chatLiveService.getActiveConversations(receptionistId, token),
      ]);

      // 🔥 Patch unreadCount = 0 cho conversation đang mở
      const currentOpenId = activeConversationIdRef.current;
      const patchUnread = (list) =>
        (list || []).map((c) =>
          currentOpenId && Number(c.id) === currentOpenId
            ? { ...c, unreadCount: 0 }
            : c,
        );

      setConversations((prev) => ({
        ...prev,
        waiting: patchUnread(waitingList),
        inProgress: patchUnread(activeList),
      }));
    } catch (error) {
      console.error("Lỗi load conversations:", error);
      showToast({ text: "Không thể tải danh sách", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [receptionistId, token, showToast]);

  // Load closed conversations count (for badge)
  const loadClosedCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await chatLiveService.searchConversations(
        token,
        "",
        "closed",
      );
      setConversations((prev) => ({ ...prev, closed: data || [] }));
    } catch (error) {
      console.error("Lỗi load closed count:", error);
    }
  }, [token]);

  // Global search (all status)
  const handleSearch = useCallback(
    async (keyword) => {
      if (!token) return;
      if (!keyword.trim()) {
        setIsSearching(false);
        setSearchResults([]);
        return;
      }
      try {
        const results = await chatLiveService.searchConversations(
          token,
          keyword,
          null,
        );
        setSearchResults(results || []);
        setIsSearching(true);
      } catch (error) {
        console.error("Lỗi search:", error);
        showToast({ text: "Tìm kiếm thất bại", type: "error" });
      }
    },
    [token, showToast],
  );

  // Load chat history + reset unread
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
          socket.emit("reset_unread", { conversationId, receptionistId });
          // Reset unreadCount in UI
          setConversations((prev) => ({
            ...prev,
            inProgress: prev.inProgress.map((c) =>
              c.id === conversationId ? { ...c, unreadCount: 0 } : c,
            ),
            waiting: prev.waiting.map((c) =>
              c.id === conversationId ? { ...c, unreadCount: 0 } : c,
            ),
            closed: prev.closed.map((c) =>
              c.id === conversationId ? { ...c, unreadCount: 0 } : c,
            ),
          }));
          if (isSearching) {
            setSearchResults((prev) =>
              prev.map((c) =>
                c.id === conversationId ? { ...c, unreadCount: 0 } : c,
              ),
            );
          }
        }
      } catch (error) {
        console.error("Lỗi load lịch sử:", error);
        showToast({ text: "Không thể tải lịch sử chat", type: "error" });
      }
    },
    [token, receptionistId, isSearching, showToast],
  );

  // Join conversation from waiting list
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
          setActiveTab("inProgress");
          setActiveConversationId(conversation.id);
          await loadChatHistory(conversation.id);
          showToast({ text: "Đã tham gia cuộc trò chuyện", type: "success" });
        }
      } catch (error) {
        showToast({
          text: error.response?.data?.error || "Không thể join",
          type: "error",
        });
      }
    },
    [receptionistId, token, loadConversations, loadChatHistory, showToast],
  );

  // Leave conversation
  const handleLeaveConversation = useCallback(() => {
    if (!activeConversationId) return;
    setConfirmModal({
      isOpen: true,
      title: "Rời cuộc trò chuyện?",
      message:
        "Cuộc trò chuyện sẽ trở về hàng chờ và chưa có lễ tân tiếp nhận.",
      confirmText: "Rời",
      confirmType: "warning",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          await chatLiveService.receptionistLeave(
            activeConversationId,
            receptionistId,
            token,
          );
          socket.emit("leave_conversation", {
            conversationId: activeConversationId,
          });
          await loadConversations();
          setActiveConversationId(null);
          showToast({ text: "Đã rời cuộc trò chuyện", type: "info" });
        } catch {
          showToast({ text: "Rời thất bại", type: "error" });
        }
      },
    });
  }, [
    activeConversationId,
    receptionistId,
    token,
    loadConversations,
    showToast,
  ]);

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
        socket.emit("leave_conversation", {
          conversationId: activeConversationId,
        }); // 🔥
        await loadConversations();
        setActiveConversationId(null);
        setShowTransfer(false);
        setSelectedReceptionist("");
        showToast({ text: "Chuyển thành công", type: "success" });
      } catch (error) {
        showToast({
          text: error.response?.data?.error || "Chuyển thất bại",
          type: "error",
        });
      }
    },
    [activeConversationId, receptionistId, token, loadConversations, showToast],
  );

  // Close conversation
  const handleCloseConversation = useCallback(() => {
    if (!activeConversationId) return;
    setConfirmModal({
      isOpen: true,
      title: "Đóng cuộc trò chuyện?",
      message: "Cuộc trò chuyện sẽ kết thúc và được chuyển vào mục Đã đóng.",
      confirmText: "Đóng",
      confirmType: "danger",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          await chatLiveService.closeCustomerConversation(
            activeConversationId,
            token,
          );
          await loadConversations();
          setActiveConversationId(null);
          showToast({ text: "Đã đóng cuộc trò chuyện", type: "info" });
        } catch {
          showToast({ text: "Đóng thất bại", type: "error" });
        }
      },
    });
  }, [activeConversationId, token, loadConversations, showToast]);

  // Back button: reset active conversation
  const handleBack = () => {
    setActiveConversationId(null);
  };

  // Load receptionists list for transfer
  useEffect(() => {
    const loadReceptionists = async () => {
      const res = await chatLiveService.getAllReceptionists(token);
      if (res.success) setReceptionists(res.data);
    };
    if (token) loadReceptionists();
  }, [token]);

  // Socket events
  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      if (msg.senderType === "receptionist" && msg.senderId === receptionistId)
        return;

      setMessagesMap((prev) => {
        const existing = prev[msg.conversationId] || [];
        if (existing.some((m) => m.clientId === msg.clientId && msg.clientId))
          return prev;
        return { ...prev, [msg.conversationId]: [...existing, msg] };
      });
    };

    const handleConversationUpdated = () => {
      // Luôn reload cả 3 danh sách để đồng bộ
      loadConversations(); // waiting + inProgress
      loadClosedCount(); // closed list (số lượng và dữ liệu)
      if (isSearching && searchKeyword) {
        handleSearch(searchKeyword);
      }
    };

    const handleTransferNotify = ({ toId, fromName, conversationId }) => {
      if (Number(toId) !== Number(receptionistId)) return;
      showToast({
        text: `🔔 Bạn được chuyển cuộc trò chuyện từ ${fromName}`,
        type: "info",
      });
      setActiveTab("inProgress");
      loadConversations();
    };

    // 🔥 Handler mới: update sidebar lastMessage + unreadCount
    const handleNewMessage = ({
      conversationId,
      lastMessage,
      senderType,
      clientId,
    }) => {
      if (sentMessagesRef.current.has(clientId)) return;
      if (senderType === "receptionist") return;

      // 🔥 Ép kiểu để so sánh đúng
      const convId = Number(conversationId);
      const isCurrentlyOpen = activeConversationIdRef.current === convId;

      // 🔥 Nếu đang mở conversation này → reset unread ngay trên server
      if (isCurrentlyOpen) {
        socket.emit("reset_unread", {
          conversationId: convId,
          receptionistId,
        });
      }

      const updateList = (list) =>
        list.map((conv) =>
          Number(conv.id) === convId
            ? {
                ...conv,
                lastMessage,
                unreadCount: isCurrentlyOpen ? 0 : (conv.unreadCount || 0) + 1,
              }
            : conv,
        );

      setConversations((prev) => ({
        waiting: updateList(prev.waiting),
        inProgress: updateList(prev.inProgress),
        closed: updateList(prev.closed),
      }));

      if (isSearching) {
        setSearchResults((prev) => updateList(prev));
      }
    };

    socket.on("conversation_new_message", handleNewMessage);
    socket.on("conversation_transfer_notify", handleTransferNotify);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("conversation_updated", handleConversationUpdated);
    socket.on("conversation_closed", ({ conversationId }) => {
      if (activeConversationId === conversationId)
        setActiveConversationId(null);
      handleConversationUpdated();
    });

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("conversation_updated", handleConversationUpdated);
      socket.off("conversation_closed");
      socket.off("conversation_transfer_notify", handleTransferNotify);
      socket.off("conversation_new_message", handleNewMessage);
    };
  }, [
    activeConversationId,
    receptionistId,
    activeTab,
    loadConversations,
    loadClosedCount,
    isSearching,
    searchKeyword,
    handleSearch,
    showToast,
  ]);

  // Sync ref — ép về Number để đồng nhất
  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
      ? Number(activeConversationId)
      : null;
  }, [activeConversationId]);

  // Join room when conversation selected
  useEffect(() => {
    if (!activeConversationId) return;
    const joinRoom = () =>
      socket.emit("join_conversation", {
        conversationId: activeConversationId,
      });
    if (socket.connected) joinRoom();
    else socket.once("connect", joinRoom);
    return () =>
      socket.emit("leave_conversation", {
        conversationId: activeConversationId,
      });
  }, [activeConversationId]);

  // Initial loads
  useEffect(() => {
    loadConversations();
    loadClosedCount();
  }, [loadConversations, loadClosedCount]);

  // Debounced search
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      handleSearch(searchKeyword);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchKeyword, handleSearch]);

  // Auto-scroll
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
      clientId,
    };
    sentMessagesRef.current.add(clientId);
    setTimeout(() => sentMessagesRef.current.delete(clientId), 2000);
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

  const renderConversationItem = (conv, isWaiting = false) => (
    <div
      key={conv.id}
      className={`${styles.conversationItem} ${activeConversationId === conv.id ? styles.active : ""}`}
      onClick={() => {
        if (isWaiting) {
          handleJoinConversation(conv);
        } else {
          if (activeConversationId !== conv.id) {
            setActiveConversationId(conv.id);
            loadChatHistory(conv.id); // loadChatHistory đã có reset_unread emit

            setConversations((prev) => ({
              ...prev,
              waiting: prev.waiting.map((c) =>
                c.id === conv.id ? { ...c, unreadCount: 0 } : c,
              ),
              inProgress: prev.inProgress.map((c) =>
                c.id === conv.id ? { ...c, unreadCount: 0 } : c,
              ),
              closed: prev.closed.map((c) =>
                c.id === conv.id ? { ...c, unreadCount: 0 } : c,
              ),
            }));

            if (isSearching) {
              setSearchResults((prev) =>
                prev.map((c) =>
                  c.id === conv.id ? { ...c, unreadCount: 0 } : c,
                ),
              );
            }
          }
        }
      }}
    >
      <div className={styles.avatar}>
        <User size={20} />
      </div>
      <div className={styles.convInfo}>
        <div className={styles.convHeader}>
          <span className={styles.name}>{conv.customerName}</span>
          <span className={styles.time}>
            {formatTime(conv.lastUpdated || conv.createdAt)}
          </span>
        </div>
        <div className={styles.lastMsg}>
          {conv.lastMessage?.substring(0, 50) || "Chưa có tin nhắn"}
        </div>
      </div>
      {conv.unreadCount > 0 && (
        <div className={styles.unreadBadge}>{conv.unreadCount}</div>
      )}
    </div>
  );

  if (loading && !activeConversationId)
    return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.chatContainer}>
      {/* Sidebar */}
      <div className={styles.chatSidebar}>
        <div className={styles.chatSearch}>
          <Search size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>
        <div className={styles.conversationList}>
          {isSearching ? (
            <>
              <div
                style={{
                  padding: "10px 20px",
                  background: "#f9f9f9",
                  fontWeight: 500,
                }}
              >
                Kết quả tìm kiếm ({searchResults.length})
              </div>
              {searchResults.map((conv) =>
                renderConversationItem(conv, conv.status === "waiting"),
              )}
            </>
          ) : (
            <>
              <div style={{ display: "flex", borderBottom: "1px solid #eee" }}>
                <button
                  onClick={() => setActiveTab("waiting")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background:
                      activeTab === "waiting" ? "#b8966a" : "transparent",
                    color: activeTab === "waiting" ? "white" : "#333",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Chờ ({conversations.waiting.length})
                </button>
                <button
                  onClick={() => setActiveTab("inProgress")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background:
                      activeTab === "inProgress" ? "#b8966a" : "transparent",
                    color: activeTab === "inProgress" ? "white" : "#333",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Đang xử lý ({conversations.inProgress.length})
                </button>
                <button
                  onClick={() => setActiveTab("closed")}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background:
                      activeTab === "closed" ? "#b8966a" : "transparent",
                    color: activeTab === "closed" ? "white" : "#333",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                >
                  Đã đóng ({conversations.closed.length})
                </button>
              </div>
              {activeTab === "waiting" &&
                conversations.waiting.map((conv) =>
                  renderConversationItem(conv, true),
                )}
              {activeTab === "inProgress" &&
                conversations.inProgress.map((conv) =>
                  renderConversationItem(conv, false),
                )}
              {activeTab === "closed" &&
                conversations.closed.map((conv) =>
                  renderConversationItem(conv, false),
                )}
            </>
          )}
        </div>
      </div>

      {/* Chat Window */}
      <div className={styles.chatWindow}>
        {activeConversationId ? (
          <>
            <div className={styles.windowHeader}>
              <button className={styles.backButton} onClick={handleBack}>
                <ArrowLeft size={18} /> Quay lại
              </button>
              <strong>
                {[
                  ...conversations.waiting,
                  ...conversations.inProgress,
                  ...conversations.closed,
                ].find((c) => c.id === activeConversationId)?.customerName ||
                  "..."}
              </strong>
              <div>
                {showTransfer ? (
                  <>
                    <select
                      value={selectedReceptionist}
                      onChange={(e) => setSelectedReceptionist(e.target.value)}
                      style={{ marginRight: 8 }}
                    >
                      <option value="">-- Chọn lễ tân --</option>
                      {receptionists
                        .filter((r) => r.id !== receptionistId)
                        .map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                    </select>
                    <button
                      onClick={() => {
                        if (selectedReceptionist)
                          handleTransfer(Number(selectedReceptionist));
                        else
                          showToast({ text: "Chọn lễ tân", type: "warning" });
                      }}
                    >
                      Xác nhận
                    </button>
                    <button onClick={() => setShowTransfer(false)}>Huỷ</button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleLeaveConversation}
                      style={{ marginRight: 8 }}
                    >
                      Rời
                    </button>
                    <button
                      onClick={handleCloseConversation}
                      style={{ marginRight: 8 }}
                    >
                      Đóng
                    </button>
                    <button onClick={() => setShowTransfer(true)}>
                      Chuyển
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className={styles.messageArea}>
              {!messagesMap[activeConversationId] ? (
                <div className={styles.loading}>Đang tải tin nhắn...</div>
              ) : (
                groupMessagesByDate(messagesMap[activeConversationId]).map(
                  (item, idx) => {
                    if (item.type === "date") {
                      return (
                        <div key={item.key} className={styles.dateSeparator}>
                          <span>{item.label}</span>
                        </div>
                      );
                    }

                    const msg = item.data;
                    let msgClass = styles.msgRow;
                    if (msg.senderType === "receptionist")
                      msgClass += ` ${styles.sent}`;
                    else if (msg.senderType === "customer")
                      msgClass += ` ${styles.received}`;
                    else if (msg.senderType === "system")
                      msgClass += ` ${styles.system}`;

                    return (
                      <div key={idx} className={msgClass}>
                        <div className={styles.msgBubble}>
                          {msg.messageType === "system" ? (
                            <>
                              {msg.eventType === "join" &&
                                `💼 ${msg.metadata?.name} đã tham gia`}
                              {msg.eventType === "leave" &&
                                `💼 ${msg.metadata?.name} đã rời`}
                              {msg.eventType === "transfer" &&
                                `🔄 Chuyển từ ${msg.metadata?.fromName} sang ${msg.metadata?.toName}`}
                              {msg.eventType === "reopen" &&
                                `🔄 Cuộc trò chuyện được mở lại`}
                            </>
                          ) : (
                            msg.content
                          )}
                        </div>
                        {msg.messageType !== "system" && (
                          <div className={styles.msgTime}>
                            {formatTime(msg.createdAt)}
                          </div>
                        )}
                      </div>
                    );
                  },
                )
              )}
              <div ref={messagesEndRef} />
            </div>
            <div className={styles.inputArea}>
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <label className={styles.attachBtn}>
                <Camera size={20} />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => console.log(e)}
                />
              </label>
              <button className={styles.sendBtn} onClick={handleSend}>
                <Send size={18} />
              </button>
            </div>
          </>
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#aaa",
            }}
          >
            Chọn một cuộc trò chuyện để bắt đầu chat
          </div>
        )}
      </div>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmType={confirmModal.confirmType}
        onConfirm={confirmModal.onConfirm}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};

export default ChatKhachHang;
