"use strict";

export async function up(queryInterface, Sequelize) {
  const now = new Date();
  const oneYearLater = new Date();
  oneYearLater.setFullYear(now.getFullYear() + 1);
  const threeMonthsLater = new Date();
  threeMonthsLater.setMonth(now.getMonth() + 3);
  const expiredDate = new Date("2024-12-31");

  await queryInterface.bulkInsert("vouchers", [
    // 1. NEW_CUSTOMER (tự động phát khi đăng ký, valid_days = 30)
    {
      name: "Chào mừng thành viên mới",
      type: "NEW_CUSTOMER",
      description: "Giảm 10% cho lần đặt lịch đầu tiên",
      discount_percent: 10.0,
      max_discount_amount: 50000,
      min_invoice_amount: 100000,
      total_quantity: null,
      issued_count: 0,
      valid_days: 30,
      max_usage_per_customer: 1,
      is_active: true,
      start_date: null,
      end_date: null,
      points_required: null,
      created_at: now,
      updated_at: now,
    },
    // 2. POINTS_EXCHANGE (đổi điểm, valid_days = 90)
    {
      name: "Đổi điểm nhận ưu đãi 15%",
      type: "POINTS_EXCHANGE",
      description: "Giảm 15% tối đa 100k, áp dụng hóa đơn từ 200k",
      discount_percent: 15.0,
      max_discount_amount: 100000,
      min_invoice_amount: 200000,
      total_quantity: null,
      issued_count: 0,
      valid_days: 90,
      max_usage_per_customer: 3,
      is_active: true,
      start_date: null,
      end_date: null,
      points_required: 500,
      created_at: now,
      updated_at: now,
    },
    // 3. RETENTION (admin tặng, valid_days = 14)
    {
      name: "Quay lại nào! Giảm 20%",
      type: "RETENTION",
      description: "Dành cho khách thân thiết đã lâu chưa ghé",
      discount_percent: 20.0,
      max_discount_amount: 150000,
      min_invoice_amount: 150000,
      total_quantity: null,
      issued_count: 0,
      valid_days: 14,
      max_usage_per_customer: 1,
      is_active: true,
      start_date: null,
      end_date: null,
      points_required: null,
      created_at: now,
      updated_at: now,
    },
    // 4. CAMPAIGN - Summer Sale (tự thu thập, hạn 1 tháng, số lượng 200)
    {
      name: "Summer Sale 2025 - Giảm 12%",
      type: "CAMPAIGN",
      description: "Chương trình hè, giảm 12% tối đa 80k",
      discount_percent: 12.0,
      max_discount_amount: 80000,
      min_invoice_amount: 0,
      total_quantity: 200,
      issued_count: 0,
      valid_days: null,
      max_usage_per_customer: 1,
      is_active: true,
      start_date: now,
      end_date: threeMonthsLater,
      points_required: null,
      created_at: now,
      updated_at: now,
    },
    // 5. CAMPAIGN - Black Friday (auto push - không dùng code, push toàn bộ)
    {
      name: "Black Friday - Giảm 25%",
      type: "CAMPAIGN",
      description: "Siêu giảm giá 25% tối đa 200k",
      discount_percent: 25.0,
      max_discount_amount: 200000,
      min_invoice_amount: 300000,
      total_quantity: 500,
      issued_count: 0,
      valid_days: null,
      max_usage_per_customer: 1,
      is_active: true,
      start_date: new Date("2025-11-01"),
      end_date: new Date("2025-11-30"),
      points_required: null,
      created_at: now,
      updated_at: now,
    },
    // 6. POINTS_EXCHANGE (voucher expired - thử thách)
    {
      name: "Voucher cũ - 5%",
      type: "POINTS_EXCHANGE",
      description: "Đã hết hạn sử dụng",
      discount_percent: 5.0,
      max_discount_amount: 30000,
      min_invoice_amount: 0,
      total_quantity: 100,
      issued_count: 50,
      valid_days: 30,
      max_usage_per_customer: 1,
      is_active: false,
      start_date: null,
      end_date: null,
      points_required: 100,
      created_at: expiredDate,
      updated_at: expiredDate,
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("vouchers", null, {});
}