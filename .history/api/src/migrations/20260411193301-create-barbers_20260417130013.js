"use strict";

// Migration thêm các field profile cho bảng barbers

export async function up(queryInterface, Sequelize) {
  const table = await queryInterface.describeTable("barbers");

  if (!table.experienceYears) {
    await queryInterface.addColumn("barbers", "experienceYears", {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Số năm kinh nghiệm",
      after: "profileDescription",
    });
  }

  if (!table.specialty) {
    await queryInterface.addColumn("barbers", "specialty", {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: "Chuyên môn chính",
      after: "experienceYears",
    });
  }

  if (!table.style) {
    await queryInterface.addColumn("barbers", "style", {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: "Phong cách làm việc",
      after: "specialty",
    });
  }

  if (!table.certificates) {
    await queryInterface.addColumn("barbers", "certificates", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Chứng chỉ",
      after: "style",
    });
  }

  if (!table.philosophy) {
    await queryInterface.addColumn("barbers", "philosophy", {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Triết lý làm nghề",
      after: "certificates",
    });
  }
}

export async function down(queryInterface) {
  const table = await queryInterface.describeTable("barbers");

  if (table.philosophy) {
    await queryInterface.removeColumn("barbers", "philosophy");
  }

  if (table.certificates) {
    await queryInterface.removeColumn("barbers", "certificates");
  }

  if (table.style) {
    await queryInterface.removeColumn("barbers", "style");
  }

  if (table.specialty) {
    await queryInterface.removeColumn("barbers", "specialty");
  }

  if (table.experienceYears) {
    await queryInterface.removeColumn("barbers", "experienceYears");
  }
}
