import config from "~/config";
import Home from "~/pages/home";
import Profile from "~/pages/profile";
import MyVouchers from "~/pages/MyVouchers";
import About from "~/pages/about";
import Admin from "~/pages/Admin";
import ThoCatToc from "~/pages/ThoCatToc";
import Receptionist from "~/pages/Receptionist"; // Giả định bạn có trang này
import BookingPage from "~/pages/booking";
import BookingHistory from "~/pages/bookingHistory";
import Reel from "~/pages/reels";
import BarberPage from "~/pages/team";
import BarberProfile from "~/pages/BarberProfile";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { DefaultLayout } from "~/layouts"; 
import HairConsult from "~/pages/HairConsult";
import CustomerKiosk from "~/pages/CustomerKiosk";
import NewsPage from "~/pages/News";
import NewsDetail from "~/pages/NewsDetail";

// ==========================================
// 1. TẠO CÁC COMPONENT BẢO VỆ (PROTECTED)
// ==========================================

const AdminProtected = () => (
  <ProtectedRoute requiredRole="admin">
    <Admin />
  </ProtectedRoute>
);

const BarberProtected = () => (
  <ProtectedRoute requiredRole="barber">
    <ThoCatToc />
  </ProtectedRoute>
);

// MỚI: Thêm bảo vệ cho Lễ tân
const ReceptionistProtected = () => (
  <ProtectedRoute requiredRole="receptionist">
    <Receptionist />
  </ProtectedRoute>
);

const BookingProtected = () => (
  <ProtectedRoute>
    <BookingPage />
  </ProtectedRoute>
);

const BookingHistoryProtected = () => (
  <ProtectedRoute>
    <BookingHistory />
  </ProtectedRoute>
);

// ==========================================
// 2. GÁN VÀO MẢNG ROUTER
// ==========================================
export const publicRouter = [
  { path: config.routes.home, component: Home },
  { path: config.routes.profile, component: Profile },
  { path: config.routes.myVouchers, component: MyVouchers },
  { path: config.routes.about, component: About },
  { path: config.routes.reels, component: Reel },
  { path: config.routes.team, component: BarberPage },
  { path: config.routes.barberProfile, component: BarberProfile },
  { path: config.routes.hairConsult, component: HairConsult },
  { path: config.routes.news, component: NewsPage },
  { path: config.routes.newsDetail, component: NewsDetail },
  {
    path: config.routes.kiosk, // (Hoặc ghi thẳng chuỗi "/kiosk" nếu lười vào file config sửa)
    component: CustomerKiosk,
    layout: null, // TUYỆT ĐỐI QUAN TRỌNG: Để null để nó không hiện Header/Footer của web
  },
  
  {
    path: config.routes.admin, 
    component: AdminProtected, 
    layout: null,
  },
  {
    path: config.routes.thoCatToc,
    component: BarberProtected,
    layout: null,
  },
  {
    path: config.routes.receptionist, // Đảm bảo đã thêm trong config/routes.js
    component: ReceptionistProtected,
    layout: null, // Thường các trang quản lý sẽ tự có Sidebar riêng
  },
  {
    path: config.routes.booking,
    component: BookingProtected,
    layout: DefaultLayout,
    hideFooter: true,
  },
  {
    path: config.routes.bookingHistory,
    component: BookingHistoryProtected,
    layout: DefaultLayout,
    hideFooter: true,
  },
];

export const privateRoutes = [];