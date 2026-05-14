// File: src/config/routes.js

import { m } from "framer-motion";

const routes = {
  home: "/",
  profile: "/profile",
  myVouchers: "/my-vouchers",
  reels: "/reels",
  productDetails: "/products/:id",
  about: "/about",
  admin: "/admin/*", 
  receptionist: "/receptionist/*",
  thoCatToc: "/tho-cat-toc/*",
  booking: "/booking",
  barberProfile: "/barber/:id",
  team: "/team",
  bookingHistory: "/booking-history",
  hairConsult: "/hair-consult",
  kiosk: '/kiosk',
};

export default routes;