import { useAuth } from "~/context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "~/components/Modal";

const LoadingSpinner = () => (
  <div style={{
    display: "flex", justifyContent: "center", alignItems: "center",
    height: "100vh", color: "#888", fontFamily: "sans-serif", fontSize: 14
  }}>
    Đang tải...
  </div>
);

export function ProtectedRoute({ children, requiredRole }) {
  const { isLogin, user, loading } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (loading) return;

    // Chưa đăng nhập → hiển thị modal login
    if (!isLogin) {
      setShowModal(true);
      return;
    }

    // Sai role → redirect về trang chủ
    if (requiredRole && user?.role !== requiredRole) {
      navigate("/", { replace: true });
    }
  }, [isLogin, user, requiredRole, loading, navigate]);

  // Đang kiểm tra auth → loading
  if (loading) return <LoadingSpinner />;

  // Đã login và đúng role → render nội dung
  if (isLogin && (!requiredRole || user?.role === requiredRole)) {
    return children;
  }

  // Chưa login → render modal
  return <Modal isOpen={showModal} />;
}
