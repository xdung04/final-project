"use strict";
import slugify from "slugify";

// ════════════════════════════════════════════════════════════════════════════
// FILE 28 — categories
// ════════════════════════════════════════════════════════════════════════════

export async function up(queryInterface, Sequelize) {
  const categories = [
    { idCategory: 1, name: "Modern", status: "Active" },
    { idCategory: 2, name: "Classic", status: "Active" },
    { idCategory: 3, name: "Korean", status: "Active" },
    { idCategory: 4, name: "Fade", status: "Active" },
  ];

  const finalCategories = categories.map(cat => ({
    ...cat,
    slug: slugify(cat.name, { lower: true, locale: "vi" }),
    createdAt: new Date(),
    updatedAt: new Date()
  }));

  await queryInterface.bulkInsert("categories", finalCategories);
  console.log(`✅ [28] Inserted ${finalCategories.length} categories`);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("categories", null, {});
}