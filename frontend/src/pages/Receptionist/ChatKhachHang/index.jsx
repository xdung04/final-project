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
  const { user } = useAuth(); 
  const { showToast } = useToast();
  const [conversations, setConversations] = useState({
    waiting: [],
    inProgress: [],
    closed: [],
  });
  const [activeTab, setActiveTab] = useState("waiting");
  
  // Giữ lại ID phòng chat đang active trong sessionStorage khi F5 trang
  const [activeConversationId, setActiveConversationId] = useState(() => {
    const savedId = sessionStorage.getItem("activeConversationId");
    return savedId ? Number(savedId) : null;
  });
  
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

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId
      ? Number(activeConversationId) : null;
  }, [activeConversationId]);

  // Tự động đồng bộ id phòng chat đang mở vào sessionStorage
  useEffect(() => {
    if (activeConversationId) {
      sessionStorage.setItem("activeConversationId", activeConversationId);
    } else {
      sessionStorage.removeItem("activeConversationId");
    }
  }, [activeConversationId]);

  // Tìm cuộc trò chuyện đang active
  const activeConversation = [
    ...conversations.waiting,
    ...conversations.inProgress,
    ...conversations.closed,
    ...searchResults
  ].find((c) => c.id === activeConversationId);

  const isClosedStatus = activeConversation?.status === "closed";

  // Hàm load danh sách phòng chat Chờ và Đang xử lý từ API
  const loadConversations = useCallback(async () => {
    if (!receptionistId) return;
    
    setLoading(true);
    try {
      const [waitingList, activeList] = await Promise.all([
        chatLiveService.getWaitingConversations(),
        chatLiveService.getActiveConversations(receptionistId),
      ]);
      const currentOpenId = activeConversationIdRef.current;
      
      setConversations((prev) => {
        // Tách biệt mảng Chờ (waiting) - Không clear số unreadCount về 0 khi trùng ID mở của tab Đang xử lý
        const patchWaiting = (newList, oldList = []) =>
          (newList || []).map((c) => {
            const oldConv = oldList.find((o) => o.id === c.id);
            return { ...c, unreadCount: oldConv ? oldConv.unreadCount : (c.unreadCount || 0) };
          });

        // Chỉ clear số unreadCount về 0 đối với phòng đang được click mở xử lý trực tiếp
        const patchActive = (newList, oldList = []) =>
          (newList || []).map((c) => {
            if (currentOpenId && Number(c.id) === currentOpenId) {
              return { ...c, unreadCount: 0 };
            }
            const oldConv = oldList.find((o) => o.id === c.id);
            return { ...c, unreadCount: oldConv ? oldConv.unreadCount : (c.unreadCount || 0) };
          });

        return {
          ...prev,
          waiting: patchWaiting(waitingList, prev.waiting),
          inProgress: patchActive(activeList, prev.inProgress),
        };
      });
    } catch (error) {
      console.error("Lỗi load conversations:", error);
      showToast({ text: "Không thể tải danh sách", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [receptionistId, showToast]);

  const loadClosedCount = useCallback(async () => {
  
    try {
      const data = await chatLiveService.searchConversations("", "closed");
      const closedList = (data || []).map(c => ({ ...c, status: c.status || "closed" }));
      setConversations((prev) => ({ ...prev, closed: closedList }));
    } catch (error) {
      console.error("Lỗi load closed count:", error);
    }
  }, []);

  const handleSearch = useCallback(
    async (keyword) => {
      if (!keyword.trim()) {
        setIsSearching(false);
        setSearchResults([]);
        return;
      }
      try {
        const results = await chatLiveService.searchConversations(keyword, null);
        setSearchResults(results || []);
        setIsSearching(true);
      } catch (error) {
        console.error("Lỗi search:", error);
        showToast({ text: "Tìm kiếm thất bại", type: "error" });
      }
    },
    [showToast],
  );

  const loadChatHistory = useCallback(
    async (conversationId) => {
      if (!conversationId) return;

      try {
        const result = await chatLiveService.getChatHistory(conversationId);
        if (result.success) {
          setMessagesMap((prev) => ({
            ...prev,
            [conversationId]: result.data.messages,
          }));
          socket.emit("reset_unread", { conversationId, receptionistId });
          
          const clearUnread = (list) =>
            list.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c));

          setConversations((prev) => ({
            waiting: clearUnread(prev.waiting),
            inProgress: clearUnread(prev.inProgress),
            closed: clearUnread(prev.closed),
          }));
          
          setSearchResults((prev) => clearUnread(prev));
        }
      } catch (error) {
        console.error("Lỗi load lịch sử:", error);
        showToast({ text: "Không thể tải lịch sử chat", type: "error" });
      }
    },
    [receptionistId, showToast],
  );

  // 🔥 FIX LỖI F5 MẤT TIN NHẮN 1: Đợi receptionistId sẵn sàng rồi mới tự động gọi API tải lịch sử chat dở
  useEffect(() => {
    if (receptionistId && activeConversationId && !messagesMap[activeConversationId]) {
      loadChatHistory(activeConversationId);
    }
  }, [receptionistId, activeConversationId, loadChatHistory, messagesMap]);

  const handleJoinConversation = useCallback(
    async (conversation) => {
      try {
        const result = await chatLiveService.receptionistJoin(
          conversation.id, receptionistId,
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
    [receptionistId, loadConversations, loadChatHistory, showToast],
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
          const currentId = activeConversationId;
          await chatLiveService.receptionistLeave(currentId, receptionistId);
          
          socket.emit("send_message", {
            conversationId: currentId,
            senderType: "system",
            messageType: "system",
            eventType: "leave",
            content: "💼 Lễ tân đã rời phòng. Hệ thống đang kết nối bạn với lễ tân khác, vui lòng chờ trong giây lát... ⏳",
            metadata: { name: user?.name || "Lễ tân" }
          });

          socket.emit("leave_conversation", { conversationId: String(currentId) });
          setActiveConversationId(null);
          
          setTimeout(async () => {
            await loadConversations();
            showToast({ text: "Đã rời cuộc trò chuyện", type: "info" });
          }, 300);

        } catch (error) {
          console.error("Lỗi khi rời phòng chat:", error);
          showToast({ text: "Rời thất bại", type: "error" });
        }
      },
    });
  }, [activeConversationId, receptionistId, loadConversations, showToast, user?.name]);

  const handleTransfer = useCallback(
    async (toReceptionistId) => {
      if (!activeConversationId) return;
    

      try {
        await chatLiveService.transferConversation(
          activeConversationId, receptionistId, toReceptionistId, 
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
    [activeConversationId, receptionistId, loadConversations, showToast],
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
          const currentId = activeConversationId;
          await chatLiveService.closeCustomerConversation(currentId);
          
          socket.emit("send_message", {
            conversationId: currentId,
            senderType: "system",
            messageType: "system",
            eventType: "close",
            content: "Cuộc trò chuyện trực tiếp đã kết thúc. Trợ lý AI đã quay trở lại! 🤖"
          });

          await loadConversations();
          setActiveConversationId(null);
          showToast({ text: "Đã đóng cuộc trò chuyện", type: "info" });
        } catch (error) {
          console.error("Lỗi khi đóng cuộc hội thoại:", error);
          showToast({ text: "Đóng thất bại", type: "error" });
        }
      },
    });
  }, [activeConversationId, loadConversations, showToast]);

  const handleBack = () => {
    setActiveConversationId(null);
    setShowTransfer(false);
  };

  useEffect(() => {
    const loadReceptionists = async () => {
      const res = await chatLiveService.getAllReceptionists();
      if (res.success) setReceptionists(res.data);
    };
    loadReceptionists();
  }, []); 

  useEffect(() => {
    const handleReceiveMessage = (msg) => {
      if (msg.clientId && sentMessagesRef.current.has(msg.clientId)) return;
      const convId = Number(msg.conversationId);
      setMessagesMap((prev) => {
        const currentList = prev[convId] || [];
        if (msg.id && currentList.some((m) => m.id === msg.id)) return prev;
        return { ...prev, [convId]: [...currentList, msg] };
      });
    };

    const handleConversationUpdated = () => {
      loadClosedCount();
    };

    const handleTransferNotify = ({ toId, fromName }) => {
      if (Number(toId) !== Number(receptionistId)) return;
      showToast({ text: `🔔 Bạn được chuyển cuộc trò chuyện từ ${fromName}`, type: "info" });
      setActiveTab("inProgress");
      loadConversations();
    };

    const handleNewMessage = ({ conversationId, lastMessage, senderType, clientId }) => {
      if (clientId && sentMessagesRef.current.has(clientId)) return;
      if (senderType === "receptionist") return;
      
      const convId = Number(conversationId);
      const isCurrentlyOpen = activeConversationIdRef.current === convId;
      
      if (isCurrentlyOpen) {
        socket.emit("reset_unread", { conversationId: convId, receptionistId });
      }
      
      const updateList = (list) =>
        list.map((conv) =>
          Number(conv.id) === convId
            ? { 
                ...conv, 
                lastMessage, 
                unreadCount: (conv.unreadCount || 0) + 1
              }
            : conv,
        );
        
      setConversations((prev) => ({
        waiting:    updateList(prev.waiting),
        inProgress: updateList(prev.inProgress),
        closed:     updateList(prev.closed),
      }));

      setSearchResults((prev) => updateList(prev));
    };

    socket.on("conversation_new_message",       handleNewMessage);
    socket.on("conversation_transfer_notify",   handleTransferNotify);
    socket.on("receive_message",                handleReceiveMessage);
    socket.on("conversation_updated",           handleConversationUpdated);
    
    socket.on("conversation_closed", ({ conversationId }) => {
      if (activeConversationIdRef.current === Number(conversationId)) {
        setActiveConversationId(null);
      }
      loadConversations();
      loadClosedCount();
    });

    return () => {
      socket.off("receive_message",               handleReceiveMessage);
      socket.off("conversation_updated",          handleConversationUpdated);
      socket.off("conversation_closed");
      socket.off("conversation_transfer_notify",   handleTransferNotify);
      socket.off("conversation_new_message",      handleNewMessage);
    };
  }, [receptionistId, loadConversations, loadClosedCount, showToast]);

  useEffect(() => {
    if (!activeConversationId) return;
    const joinRoom = () => {
      socket.emit("join_conversation", { conversationId: String(activeConversationId) });
    };
    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);
    return () => {
      socket.off("connect", joinRoom);
      socket.emit("leave_conversation", { conversationId: String(activeConversationId) });
    };
  }, [activeConversationId]);

  // 🔥 FIX LỖI F5 MẤT TIN NHẮN 2: Lắng nghe receptionistId đổi từ undefined sang có dữ liệu để load lại chính xác danh sách phòng
  useEffect(() => {
    if (receptionistId) {
      loadConversations(); 
    }
    loadClosedCount(); 
  }, [receptionistId, loadConversations, loadClosedCount]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => handleSearch(searchKeyword), 500);
    return () => clearTimeout(delayDebounce);
  }, [searchKeyword, handleSearch]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messagesMap, activeConversationId]);

  const handleSend = () => {
    if (isClosedStatus) return; 
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
    
    const targetId = Number(activeConversationId);
    setMessagesMap((prev) => ({
      ...prev,
      [targetId]: [...(prev[targetId] || []), messageData],
    }));
    setInputMessage("");
  };

  const formatTime = (dateStr) =>
    new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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
      {Number(conv.unreadCount) > 0 && (
        <span className={cx("unreadBadge")}>
          {conv.unreadCount}
        </span>
      )}
    </div>
  );

  if (loading && !activeConversationId)
    return <div className={cx("loading")}>Đang tải...</div>;

  return (
    <div className={cx("chatContainer")}>
      <div className={cx("chatSidebar")}>
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

      <div className={cx("chatWindow")}>
        {activeConversationId ? (
          <>
            <div className={cx("windowHeader")}>
              <button className={cx("backButton")} onClick={handleBack}>
                <ArrowLeft size={16} /> Quay lại
              </button>

              <strong>{activeConversation?.customerName || "..."}</strong>

              <div className={cx("headerActions")}>
                {!isClosedStatus && (
                  showTransfer ? (
                    <>
                      <select
                        className={cx("transferSelect")}
                        value={selectedReceptionist}
                        onChange={(e) => setSelectedReceptionist(e.target.value)}
                        style={{ minWidth: "240px", padding: "6px 10px", borderRadius: "6px" }}
                      >
                        <option value="">-- Chọn lễ tân --</option>
                        {receptionists
                          .filter((r) => r.id !== receptionistId) 
                          .map((r) => {
                            const branchName = r.branch?.name || "Chưa gán chi nhánh";
                            return (
                              <option key={r.id} value={r.id}>
                                {r.name} — [{branchName}]
                              </option>
                            );
                          })}
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
                  )
                )}
              </div>
            </div>

            <div className={cx("messageArea")}>
              {!messagesMap[activeConversationId] ? (
                <div className={cx("loading")}>Đang tải tin nhắn...</div>
              ) : (
                messagesMap[activeConversationId].map((msg, idx) => {
                  const isSystem = msg.senderType === "system" || msg.messageType === "system";
                  const isSent = msg.senderType === "receptionist";
                  const isReceived = msg.senderType === "customer";

                  return (
                    <div
                      key={idx}
                      className={cx("msgRow", {
                        sent:     isSent,
                        received: isReceived,
                        system:   isSystem,
                      })}
                    >
                      {isReceived && (
                        <div className={cx("msgAvatar")}>
                          <User size={14} />
                        </div>
                      )}

                      {isSystem ? (
                        <div className={cx("msgBubble", "systemSummary")}>
                          <div className={cx("systemEventText")}>
                            {msg.eventType === "join"     && `💼 ${msg.metadata?.name || "Lễ tân"} đã tham gia cuộc hội thoại.`}
                            {msg.eventType === "leave"    && `💼 ${msg.metadata?.name || "Lễ tân"} đã rời cuộc hội thoại.`}
                            {msg.eventType === "transfer" && `🔄 Chuyển từ ${msg.metadata?.fromName} sang ${msg.metadata?.toName}`}
                            {msg.eventType === "reopen"   && `🔄 Cuộc trò chuyện được mở lại`}
                            {msg.eventType === "close"    && `🏁 Cuộc trò chuyện trực tiếp này đã được đóng.`}
                          </div>
                          {msg.content && (
                            <div className={cx("aiSummaryBlock")}>
                              {msg.content}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className={cx("msgBubbleWrapper")}>
                          <span className={cx("senderName")}>
                            {isSent ? "Lễ tân" : "Khách hàng"}
                          </span>
                          <div className={cx("msgBubble")}>
                            {msg.content}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {isClosedStatus ? (
              <div 
                className={cx("inputArea")} 
                style={{ 
                  justifyContent: "center", 
                  backgroundColor: "#f5f5f5", 
                  color: "#888", 
                  fontSize: "14px",
                  fontWeight: "500",
                  fontStyle: "italic"
                }}
              >
                🔒 Cuộc trò chuyện này đã kết thúc. Bạn chỉ có quyền xem lịch sử.
              </div>
            ) : (
              <div className={cx("inputArea")}>
                <input
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.nativeEvent.isComposing || e.keyCode === 229) {
                      return;
                    }
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <label className={cx("attachBtn")}>
                  <Camera size={18} />
                  <input type="file" hidden accept="image/*" onChange={(e) => console.log(e)} />
                </label>
                <button className={cx("sendBtn")} onClick={handleSend}>
                  <Send size={16} />
                </button>
              </div>
            )}
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