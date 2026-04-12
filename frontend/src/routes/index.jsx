import config from "~/config";
import Home from "~/pages/home";
import Profile from "~/pages/profile";
import About from "~/pages/about";
import Admin from "~/pages/Admin";
import ThoCatToc from "~/pages/ThoCatToc";
import BookingPage from "~/pages/booking";
import BookingHistory from "~/pages/bookingHistory";
import Reel from "~/pages/reels";
import BarberPage from "~/pages/team";
import BarberProfile from "~/pages/BarberProfile";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { DefaultLayout } from "~/layouts"; 
import HairConsult from "~/pages/HairConsult";

// ==========================================
// 1. TẠO CÁC COMPONENT CỐ ĐỊNH Ở NGOÀI MẢNG
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
  { path: config.routes.about, component: About },
  { path: config.routes.reels, component: Reel },
  { path: config.routes.team, component: BarberPage },
  { path: config.routes.barberProfile, component: BarberProfile },
  { path: config.routes.hairConsult, component: HairConsult },
  
  {
    path: config.routes.admin, // Đảm bảo trong config/routes.js bạn đã sửa thành "/admin/*" nhé
    component: AdminProtected, 
    layout: null,
  },
  {
    path: config.routes.thoCatToc,
    component: BarberProtected,
    layout: null,
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