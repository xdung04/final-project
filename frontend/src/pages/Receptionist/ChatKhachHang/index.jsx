import React, { useEffect, useState, useRef, useCallback } from "react";
import { Search, ArrowLeft, Send, User, Camera } from "lucide-react";
import classNames from "classnames/bind";
import socket from "~/utils/socket";
import * as chatLiveService from "~/services/chatLiveService";
import { useAuth } from "~/context/AuthContext";
import { useToast } from "~/context/ToastContext";
import styles from "./ChatKhachHang.module.scss";
import ConfirmModal from "../../../components/ComfirmModal/index";

const cx = classNames.bind(styles);

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

  const closeConfirmModal = () =>
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));

  const loadConversations = useCallback(async () => {
    if (!receptionistId || !token) return;
    setLoading(true);
    try {
      const [waitingList, activeList] = await Promise.all([
        chatLiveService.getWaitingConversations(token),
        chatLiveService.getActiveConversations(receptionistId, token),
      ]);
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

  const loadClosedCount = useCallback(async () => {
    if (!token) return;
    try {
      const data = await chatLiveService.searchConversations(token, "", "closed");
      setConversations((prev) => ({ ...prev, closed: data || [] }));
    } catch (error) {
      console.error("Lỗi load closed count:", error);
    }
  }, [token]);

  const handleSearch = useCallback(
    async (keyword) => {
      if (!token) return;
      if (!keyword.trim()) {
        setIsSearching(false);
        setSearchResults([]);
        return;
      }
      try {
        const results = await chatLiveService.searchConversations(token, keyword, null);
        setSearchResults(results || []);
        setIsSearching(true);
      } catch (error) {
        console.error("Lỗi search:", error);
        showToast({ text: "Tìm kiếm thất bại", type: "error" });
      }
    },
    [token, showToast],
  );

  const loadChatHistory = useCallback(
    async (conversationId) => {
      if (!conversationId || !token) return;
      try {
        const result = await chatLiveService.getChatHistory(conversationId, token);
        if (result.success) {
          setMessagesMap((prev) => ({
            ...prev,
            [conversationId]: result.data.messages,
          }));
          socket.emit("reset_unread", { conversationId, receptionistId });
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

  const handleJoinConversation = useCallback(
    async (conversation) => {
      try {
        const result = await chatLiveService.receptionistJoin(
          conversation.id, receptionistId, token,
        );
        if (result.success) {
          await loadConversations();
          setActiveTab("inProgress");
          setActiveConversationId(conversation.id);
          await loadChatHistory(conversation.id);
          showToast({ text: "Đã tham gia cuộc trò chuyện", type: "success" });
        }
      } catch (error) {
        showToast({ text: error.response?.data?.error || "Không thể join", type: "error" });
      }
    },
    [receptionistId, token, loadConversations, loadChatHistory, showToast],
  );

  const handleLeaveConversation = useCallback(() => {
    if (!activeConversationId) return;
    setConfirmModal({
      isOpen: true,
      title: "Rời cuộc trò chuyện?",
      message: "Cuộc trò chuyện sẽ trở về hàng chờ và chưa có lễ tân tiếp nhận.",
      confirmText: "Rời",
      confirmType: "warning",
      onConfirm: async () => {
        closeConfirmModal();
        try {
          await chatLiveService.receptionistLeave(activeConversationId, receptionistId, token);
          socket.emit("leave_conversation", { conversationId: activeConversationId });
          await loadConversations();
          setActiveConversationId(null);
          showToast({ text: "Đã rời cuộc trò chuyện", type: "info" });
        } catch {
          showToast({ text: "Rời thất bại", type: "error" });
        }
      },
    });
  }, [activeConversationId, receptionistId, token, loadConversations, showToast]);

  const handleTransfer = useCallback(
    async (toReceptionistId) => {
      if (!activeConversationId) return;
      try {
        await chatLiveService.transferConversation(
          activeConversationId, receptionistId, toReceptionistId, token,
        );
        socket.emit("leave_conversation", { conversationId: activeConversationId });
        await loadConversations();
        setActiveConversationId(null);
        setShowTransfer(false);
        setSelectedReceptionist("");
        showToast({ text: "Chuyển thành công", type: "success" });
      } catch (error) {
        showToast({ text: error.response?.data?.error || "Chuyển thất bại", type: "error" });
      }
    },
    [activeConversationId, receptionistId, token, loadConversations, showToast],
  );

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
          await chatLiveService.closeCustomerConversation(activeConversationId, token);
          await loadConversations();
          setActiveConversationId(null);
          showToast({ text: "Đã đóng cuộc trò chuyện", type: "info" });
        } catch {
          showToast({ text: "Đóng thất bại", type: "error" });
        }
      },
    });
  }, [activeConversationId, token, loadConversations, showToast]);

  const handleBack = () => setActiveConversationId(null);

  useEffect(() => {
    const loadReceptionists = async () => {
      const res = await chatLiveService.getAllReceptionists(token);
      if (res.success) setReceptionists(res.data);
    };
    if (token) loadReceptionists();
  }, [token]);

  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      if (sentMessagesRef.current.has(msg.clientId)) return;
      setMessagesMap((prev) => ({
        ...prev,
        [msg.conversationId]: [...(prev[msg.conversationId] || []), msg],
      }));
    };

    const handleConversationUpdated = () => {
      loadConversations();
      loadClosedCount();
      if (isSearching && searchKeyword) handleSearch(searchKeyword);
    };

    const handleTransferNotify = ({ toId, fromName }) => {
      if (Number(toId) !== Number(receptionistId)) return;
      showToast({ text: `🔔 Bạn được chuyển cuộc trò chuyện từ ${fromName}`, type: "info" });
      setActiveTab("inProgress");
      loadConversations();
    };

    const handleNewMessage = ({ conversationId, lastMessage, senderType, clientId }) => {
      if (sentMessagesRef.current.has(clientId)) return;
      if (senderType === "receptionist") return;
      const convId = Number(conversationId);
      const isCurrentlyOpen = activeConversationIdRef.current === convId;
      if (isCurrentlyOpen) {
        socket.emit("reset_unread", { conversationId: convId, receptionistId });
      }
      const updateList = (list) =>
        list.map((conv) =>
          Number(conv.id) === convId
            ? { ...conv, lastMessage, unreadCount: isCurrentlyOpen ? 0 : (conv.unreadCount || 0) + 1 }
            : conv,
        );
      setConversations((prev) => ({
        waiting:    updateList(prev.waiting),
        inProgress: updateList(prev.inProgress),
        closed:     updateList(prev.closed),
      }));
      if (isSearching) setSearchResults((prev) => updateList(prev));
    };

    socket.on("conversation_new_message",   handleNewMessage);
    socket.on("conversation_transfer_notify", handleTransferNotify);
    socket.on("receive_message",            handleReceiveMessage);
    socket.on("conversation_updated",       handleConversationUpdated);
    socket.on("conversation_closed", ({ conversationId }) => {
      if (activeConversationId === conversationId) setActiveConversationId(null);
      handleConversationUpdated();
    });

    return () => {
      socket.off("receive_message",             handleReceiveMessage);
      socket.off("conversation_updated",        handleConversationUpdated);
      socket.off("conversation_closed");
      socket.off("conversation_transfer_notify", handleTransferNotify);
      socket.off("conversation_new_message",    handleNewMessage);
    };
  }, [
    activeConversationId, receptionistId, activeTab,
    loadConversations, loadClosedCount,
    isSearching, searchKeyword, handleSearch, showToast,
  ]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
      ? Number(activeConversationId) : null;
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) return;
    const joinRoom = () =>
      socket.emit("join_conversation", { conversationId: activeConversationId });
    if (socket.connected) joinRoom();
    else socket.once("connect", joinRoom);
    return () =>
      socket.emit("leave_conversation", { conversationId: activeConversationId });
  }, [activeConversationId]);

  useEffect(() => { loadConversations(); loadClosedCount(); }, [loadConversations, loadClosedCount]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => handleSearch(searchKeyword), 500);
    return () => clearTimeout(delayDebounce);
  }, [searchKeyword, handleSearch]);

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
      [activeConversationId]: [...(prev[activeConversationId] || []), messageData],
    }));
    setInputMessage("");
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // ── Conversation Item ────────────────────────────────────────────────────
  const renderConversationItem = (conv, isWaiting = false) => (
    <div
      key={conv.id}
      className={cx("conversationItem", { active: activeConversationId === conv.id })}
      onClick={() => {
        if (isWaiting) {
          handleJoinConversation(conv);
        } else {
          if (activeConversationId !== conv.id) {
            setActiveConversationId(conv.id);
            loadChatHistory(conv.id);
            setConversations((prev) => ({
              ...prev,
              waiting:    prev.waiting.map((c)    => c.id === conv.id ? { ...c, unreadCount: 0 } : c),
              inProgress: prev.inProgress.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c),
              closed:     prev.closed.map((c)     => c.id === conv.id ? { ...c, unreadCount: 0 } : c),
            }));
            if (isSearching) {
              setSearchResults((prev) =>
                prev.map((c) => c.id === conv.id ? { ...c, unreadCount: 0 } : c),
              );
            }
          }
        }
      }}
    >
      <div className={cx("avatar")}><User size={18} /></div>
      <div className={cx("convInfo")}>
        <div className={cx("convHeader")}>
          <span className={cx("name")}>{conv.customerName}</span>
          <span className={cx("time")}>{formatTime(conv.lastUpdated || conv.createdAt)}</span>
        </div>
        <div className={cx("lastMsg")}>
          {conv.lastMessage?.substring(0, 50) || "Chưa có tin nhắn"}
        </div>
      </div>
      {conv.unreadCount > 0 && (
        <div className={cx("unreadBadge")}>{conv.unreadCount}</div>
      )}
    </div>
  );

  if (loading && !activeConversationId)
    return <div className={cx("loading")}>Đang tải...</div>;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={cx("chatContainer")}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <div className={cx("chatSidebar")}>

        {/* Search */}
        <div className={cx("chatSearch")}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc số điện thoại..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
        </div>

        <div className={cx("conversationList")}>
          {isSearching ? (
            <>
              <div className={cx("searchResultsHeader")}>
                Kết quả tìm kiếm ({searchResults.length})
              </div>
              {searchResults.map((conv) =>
                renderConversationItem(conv, conv.status === "waiting"),
              )}
            </>
          ) : (
            <>
              {/* Tab bar */}
              <div className={cx("sidebarTabs")}>
                {[
                  { id: "waiting",    label: "Chờ",         count: conversations.waiting.length },
                  { id: "inProgress", label: "Đang xử lý",  count: conversations.inProgress.length },
                  { id: "closed",     label: "Đã đóng",      count: conversations.closed.length },
                ].map((t) => (
                  <button
                    key={t.id}
                    className={cx("sidebarTab", { active: activeTab === t.id })}
                    onClick={() => setActiveTab(t.id)}
                  >
                    {t.label} ({t.count})
                  </button>
                ))}
              </div>

              {activeTab === "waiting"    && conversations.waiting.map((conv)    => renderConversationItem(conv, true))}
              {activeTab === "inProgress" && conversations.inProgress.map((conv) => renderConversationItem(conv, false))}
              {activeTab === "closed"     && conversations.closed.map((conv)     => renderConversationItem(conv, false))}
            </>
          )}
        </div>
      </div>

      {/* ── CHAT WINDOW ─────────────────────────────────────────────────── */}
      <div className={cx("chatWindow")}>
        {activeConversationId ? (
          <>
            {/* Window Header */}
            <div className={cx("windowHeader")}>
              <button className={cx("backButton")} onClick={handleBack}>
                <ArrowLeft size={16} /> Quay lại
              </button>

              <strong>
                {[
                  ...conversations.waiting,
                  ...conversations.inProgress,
                  ...conversations.closed,
                ].find((c) => c.id === activeConversationId)?.customerName || "..."}
              </strong>

              <div className={cx("headerActions")}>
                {showTransfer ? (
                  <>
                    <select
                      className={cx("transferSelect")}
                      value={selectedReceptionist}
                      onChange={(e) => setSelectedReceptionist(e.target.value)}
                    >
                      <option value="">-- Chọn lễ tân --</option>
                      {receptionists
                        .filter((r) => r.id !== receptionistId)
                        .map((r) => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                    </select>
                    <button
                      className={cx("headerBtn")}
                      onClick={() => {
                        if (selectedReceptionist) handleTransfer(Number(selectedReceptionist));
                        else showToast({ text: "Chọn lễ tân", type: "warning" });
                      }}
                    >
                      Xác nhận
                    </button>
                    <button className={cx("headerBtn")} onClick={() => setShowTransfer(false)}>
                      Huỷ
                    </button>
                  </>
                ) : (
                  <>
                    <button className={cx("headerBtn")} onClick={handleLeaveConversation}>
                      Rời
                    </button>
                    <button className={cx("headerBtn", "danger")} onClick={handleCloseConversation}>
                      Đóng
                    </button>
                    <button className={cx("headerBtn")} onClick={() => setShowTransfer(true)}>
                      Chuyển
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className={cx("messageArea")}>
              {!messagesMap[activeConversationId] ? (
                <div className={cx("loading")}>Đang tải tin nhắn...</div>
              ) : (
                messagesMap[activeConversationId].map((msg, idx) => (
                  <div
                    key={idx}
                    className={cx("msgRow", {
                      sent:     msg.senderType === "receptionist",
                      received: msg.senderType === "customer",
                      system:   msg.senderType === "system",
                    })}
                  >
                    <div className={cx("msgBubble")}>
                      {msg.messageType === "system" ? (
                        <>
                          {msg.eventType === "join"     && `💼 ${msg.metadata?.name} đã tham gia`}
                          {msg.eventType === "leave"    && `💼 ${msg.metadata?.name} đã rời`}
                          {msg.eventType === "transfer" && `🔄 Chuyển từ ${msg.metadata?.fromName} sang ${msg.metadata?.toName}`}
                          {msg.eventType === "reopen"   && `🔄 Cuộc trò chuyện được mở lại`}
                        </>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={cx("inputArea")}>
              <input
                type="text"
                placeholder="Nhập tin nhắn..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSend()}
              />
              <label className={cx("attachBtn")}>
                <Camera size={18} />
                <input type="file" hidden accept="image/*" onChange={(e) => console.log(e)} />
              </label>
              <button className={cx("sendBtn")} onClick={handleSend}>
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className={cx("emptyWindow")}>
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