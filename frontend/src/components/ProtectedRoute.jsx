import { useAuth } from "~/context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Modal from "~/components/Modal";

export function ProtectedRoute({ children, requiredRole }) {
  const { isLogin, user, loading } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  console.log("ProtectedRoute", { isLogin, user, loading });

  useEffect(() => {
    console.log("useEffect ProtectedRoute", { isLogin, user });
    if (loading) return;

    if (!isLogin) {
      console.log("Chưa login → show modal");
      setShowModal(true);
      return;
    }

    if (requiredRole && user?.role !== requiredRole) {
      console.log("Không đủ quyền → redirect /");
      navigate("/");
    }
  }, [isLogin, user, requiredRole, loading, navigate]);

  if (loading) return null;

  if (isLogin && (!requiredRole || user?.role === requiredRole)) {
    return children;
  }

  console.log("Chưa login → render modal");
  return <Modal isOpen={showModal} />;
}
