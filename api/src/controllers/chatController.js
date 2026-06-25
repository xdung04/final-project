// src/controllers/chatController.js
import { processChatFlow, syncPostLogin,requestHumanSupport,closeConversationOnLogout } from "../services/chatFlowService.js";

export async function handleChat(req, res) {
  try {
    const { sessionId, message } = req.body;
    
    // 💡 BỐC THẲNG TỪ TOKEN: Đăng nhập rồi thì có idUser, chưa thì là null
    const customerId = req.user?.idUser || null; 

    if (!sessionId || !message) {
      return res.status(400).json({ error: "Thiếu thông tin sessionId hoặc message gửi lên!" });
    }

    const result = await processChatFlow({ sessionId, message, customerId });
    return res.json(result);
  } catch (err) {
    console.error("❌ Chat controller error:", err.message);
    return res.status(500).json({ 
      reply: "Hệ thống AI gián đoạn, vui lòng gửi lại tin nhắn sau ít phút nhé! 😅", 
      needReceptionist: false 
    });
  }
}

export async function handlePostLoginSync(req, res) {
  try {
    const { sessionId } = req.body;
    
    // 💡 ĐỒNG BỘ BẢO MẬT: Bốc trực tiếp từ Token của tài khoản vừa mới đăng nhập thành công
    const customerId = req.user?.idUser || null;

    if (!sessionId) {
      return res.status(400).json({ error: "Thiếu sessionId bộ nhớ tạm!" });
    }

    if (!customerId) {
      return res.status(401).json({ error: "Không tìm thấy thông tin tài khoản hợp lệ để đồng bộ dữ liệu!" });
    }

    // Đẩy thông tin xuống service để bốc dữ liệu từ Redis ném xuống MySQL
    const result = await syncPostLogin({ sessionId, customerId });
    return res.json(result);
  } catch (err) {
    console.error("Post login sync error:", err.message);
    return res.status(500).json({ error: "Lỗi đồng bộ dữ liệu sau đăng nhập" });
  }
}
export async function handleRequestHuman(req, res) {
  try {
    // 🚀 THAY ĐỔI: Không ép buộc lấy conversationId từ body nữa, bốc customerId từ Token ra làm gốc
    const customerId = req.user?.idUser || null;

    if (!customerId) {
      return res.status(401).json({ error: "Bạn cần đăng nhập để thực hiện chức năng này!" });
    }

    // Truyền customerId xuống tầng Service để tự sinh phòng
    const result = await requestHumanSupport({ customerId });
    
    return res.json(result);
  } catch (err) {
    console.error("❌ Request human support controller error:", err.message);
    return res.status(500).json({ error: "Không thể kết nối với lễ tân lúc này, vui lòng thử lại sau!" });
  }
}
export async function handleCloseConversationOnLogout(req, res) {
  try {
    // 💡 BỐC TỪ TOKEN: Lấy idUser của khách hàng thông qua Middleware xác thực (authMiddleware)
    const customerId = req.user?.idUser || null;

    if (!customerId) {
      return res.status(401).json({ 
        error: "Không tìm thấy thông tin tài khoản hợp lệ để xử lý dọn dẹp chat!" 
      });
    }

    // Gọi xuống tầng Service để xử lý logic DB và Socket
    const result = await closeConversationOnLogout({ customerId });

    return res.status(200).json({
      success: true,
      message: "Đã dọn dẹp và đóng tất cả phòng chat dở dang thành công.",
      data: result
    });

  } catch (err) {
    console.error("❌ Controller Error [handleCloseConversationOnLogout]:", err.message);
    return res.status(500).json({ 
      error: "Hệ thống gặp sự cố trong quá trình dọn dẹp dữ liệu chat khi logout!" 
    });
  }
}