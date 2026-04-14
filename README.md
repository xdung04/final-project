# 🚀 Barber Shop Management System

Dự án: **Barber Shop Management System**  
Repo: [vghun/final-project](https://github.com/vghun/final-project.git)

---
## 👥 Thành viên nhóm thực hiện

| STT | Họ và Tên        | Vai trò             |
|-----|------------------|---------------------|
| 1   | Nguyễn Văn An    | Fullstack Developer |
| 2   | Nguyễn Văn Hưng  | Fullstack Developer |
| 3   | Lưu Xuân Dũng    | Fullstack Developer |

## 🧱 Công nghệ chính

| Phần      | Công nghệ                               |
|-----------|-----------------------------------------|
| Frontend  | ReactJS, SCSS, Axios                     |
| Backend   | NodeJS, ExpressJS, Sequelize, JWT, Bcrypt |
| Database  | MySQL & Sequelize CLI (Migration/Seed)   |

---

## ⚙️ Yêu cầu

- NodeJS ≥ 18  
- MySQL ≥ 8  
- NPM ≥ 9  

---

## 📥 1. Clone dự án

```bash
git clone https://github.com/vghun/final-project.git
cd final-project
```

---

## 🛠 2. Cài đặt Backend

```bash
cd backend
npm install
```

### 🔧 Cấu hình Database

**File `config/config.json`:**

```json
{
  "development": {
    "username": "<your_username>",
    "password": "<your_password>",
    "database": "<your_db>",
    "host": "localhost",
    "port": 3306,
    "dialect": "mysql"
  }
}
```

**File `configdb.js`:**

```js
import { Sequelize } from "sequelize";

const sequelize = new Sequelize("<your_db>", "<your_username>", "<your_password>", {
  host: "localhost",
  port: 3306,
  dialect: "mysql",
});


### 🧱 Migration

```bash
npx sequelize db:create
npx sequelize db:migrate
npx sequelize db:seed:all
```

### ▶️ Chạy Backend

```bash
npm run dev
```

> Mặc định: http://localhost:8088

---

## 💻 3. Cài đặt Frontend

```bash
cd frontend
npm install
npm start
```

> Mặc định: http://localhost:3000

---

## 🧪 Checklist chạy dự án

- ✅ MySQL đã bật  
- ✅ Đã migrate DB  
- ✅ Backend chạy thành công  
- ✅ Frontend truy cập được  
- ✅ Đăng nhập / gọi API OK  

---

## 🚧 Lệnh hữu ích

| Lệnh                    | Tác dụng                     |
|-------------------------|------------------------------|
| `npm run dev`           | Chạy backend                 |
| `npm start`             | Chạy frontend                |
| `npx sequelize db:migrate`      | Migration                |
| `npx sequelize db:migrate:undo` | Undo migration           |
| `npx sequelize db:seed:all`     | Seed dữ liệu             |

---

## 🤝 Đóng góp

1. Fork repo  
2. Tạo branch: `feature/your-feature`  
3. Commit & Push  
4. Tạo Pull Request  

---

## 📜 License

MIT © 2025  

