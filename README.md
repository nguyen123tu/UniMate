# 📚 UniMate — Trợ Lý Học Tập Thông Minh Cho Sinh Viên

<div align="center">

![UniMate](https://img.shields.io/badge/UniMate-Study%20Assistant-4f46e5?style=for-the-badge&logo=bookstack&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4.3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

**UniMate** là ứng dụng web hỗ trợ sinh viên quản lý việc học tập hiệu quả — từ quản lý môn học, công việc, thời khóa biểu đến Pomodoro timer và trợ lý AI chia nhỏ task.

[Tính năng](#-tính-năng-chính) · [Cài đặt](#-cài-đặt) · [Cấu hình](#-biến-môi-trường) · [API Docs](#-api-endpoints) · [Cấu trúc dự án](#-cấu-trúc-dự-án)

</div>

---

## ✨ Tính Năng Chính

| Tính năng | Mô tả |
|-----------|-------|
| 🔐 **Xác thực người dùng** | Đăng ký / đăng nhập bằng email + mật khẩu, JWT token |
| 📊 **Dashboard** | Tổng quan trạng thái công việc, biểu đồ theo môn, việc cần làm hôm nay, quá hạn |
| 📘 **Quản lý Môn học** | Tạo, sửa, xóa môn học với mã màu tùy chỉnh |
| ✅ **Quản lý Công việc (Tasks)** | CRUD tasks với trạng thái, ưu tiên, deadline, lọc & sắp xếp |
| 📅 **Thời Khóa Biểu** | Lịch học theo tuần, hiển thị dạng bảng 7 ngày |
| 🍅 **Pomodoro Timer** | Đồng hồ đếm ngược 25 phút, lưu phiên học, liên kết task |
| 🤖 **AI Chia nhỏ Task** | Sử dụng Groq AI (LLaMA 3.1) tự động chia task lớn thành sub-tasks |
| 🔔 **Thông báo** | Cảnh báo task quá hạn, đến hạn hôm nay, ưu tiên cao |
| 📱 **PWA** | Hỗ trợ cài đặt trên điện thoại như app native |

---

## 🛠 Công Nghệ Sử Dụng

### Backend
- **Python 3.11+**
- **FastAPI** — REST API framework
- **SQLAlchemy** — ORM
- **Alembic** — Database migrations
- **SQLite** (mặc định) / PostgreSQL
- **Pydantic v2** — Data validation
- **python-jose** — JWT authentication
- **Groq SDK** — AI integration (LLaMA 3.1 8B)
- **Passlib + Bcrypt** — Password hashing

### Frontend
- **React 19** + **TypeScript 6**
- **Vite 8** — Build tool
- **TailwindCSS 4** — Styling
- **React Router v7** — Routing
- **Zustand** — State management
- **Axios** — HTTP client
- **React Hook Form + Zod** — Form validation
- **Recharts** — Charts & visualization
- **Lucide React** — Icons
- **React Hot Toast** — Notifications
- **Vite PWA Plugin** — Progressive Web App

---

## 📋 Yêu Cầu Hệ Thống

| Yêu cầu | Phiên bản tối thiểu |
|----------|---------------------|
| **Python** | 3.11+ |
| **Node.js** | 18+ |
| **npm** | 9+ |
| **Git** | 2.0+ |

---

## 🚀 Cài Đặt

### 1. Clone Repository

```bash
git clone https://github.com/nguyen123tu/UniMate.git
cd UniMate
```

### 2. Cài Đặt Backend

```bash
# Di chuyển vào thư mục backend
cd backend

# Tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường ảo
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Cài đặt dependencies
pip install fastapi uvicorn sqlalchemy alembic pydantic pydantic-settings python-jose[cryptography] passlib[bcrypt] python-multipart groq
```

### 3. Cấu Hình Biến Môi Trường Backend

Tạo file `.env` trong thư mục `backend/`:

```env
DATABASE_URL=sqlite:///./unimate.db
SECRET_KEY=your-super-secret-key-change-this
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GROQ_API_KEY=your-groq-api-key
```

> **📝 Lưu ý:**
> - `SECRET_KEY`: Đổi thành chuỗi ngẫu nhiên an toàn (dùng `python -c "import secrets; print(secrets.token_hex(32))"`)
> - `GROQ_API_KEY`: Lấy miễn phí tại [console.groq.com](https://console.groq.com) (cần cho tính năng AI)
> - `DATABASE_URL`: Có thể đổi sang PostgreSQL (`postgresql://user:pass@localhost/dbname`)

### 4. Khởi Tạo Database

```bash
# Chạy migrations
alembic upgrade head
```

### 5. Cài Đặt Frontend

```bash
# Di chuyển vào thư mục frontend
cd ../frontend

# Cài đặt dependencies
npm install
```

### 6. Cấu Hình Biến Môi Trường Frontend

Tạo file `.env` trong thư mục `frontend/`:

```env
VITE_API_URL=http://localhost:8000/api/v1
```

> **📝 Lưu ý:** Nếu deploy hoặc sử dụng ngrok, thay URL tương ứng. Ví dụ:
> ```env
> VITE_API_URL=https://abc123.ngrok-free.dev/api/v1
> ```

---

## ▶️ Chạy Ứng Dụng

### Chạy Backend (Terminal 1)

```bash
cd backend
# Kích hoạt môi trường ảo (nếu chưa)
venv\Scripts\activate  # Windows
# source venv/bin/activate  # macOS/Linux

# Chạy server
uvicorn app.main:app --reload --port 8000
```

Backend sẽ chạy tại: **http://localhost:8000**

### Chạy Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend sẽ chạy tại: **http://localhost:5173**

### Truy Cập API Docs

FastAPI tự động tạo tài liệu API tương tác:

| Tài liệu | URL |
|-----------|-----|
| **Swagger UI** | http://localhost:8000/docs |
| **ReDoc** | http://localhost:8000/redoc |

---

## 🔑 Biến Môi Trường

### Backend (`backend/.env`)

| Biến | Bắt buộc | Mô tả | Giá trị mẫu |
|------|----------|-------|-------------|
| `DATABASE_URL` | ✅ | URL kết nối database | `sqlite:///./unimate.db` |
| `SECRET_KEY` | ✅ | Khóa bí mật cho JWT | `your-secret-key-here` |
| `ALGORITHM` | ✅ | Thuật toán mã hóa JWT | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | ✅ | Thời gian sống token (phút) | `1440` (= 24 giờ) |
| `GROQ_API_KEY` | ✅ | API key từ Groq Cloud | `gsk_xxxxxxxxxxxx` |

### Frontend (`frontend/.env`)

| Biến | Bắt buộc | Mô tả | Giá trị mẫu |
|------|----------|-------|-------------|
| `VITE_API_URL` | ✅ | URL API backend | `http://localhost:8000/api/v1` |

---

## 📡 API Endpoints

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `POST` | `/register` | Đăng ký tài khoản mới | ❌ |
| `POST` | `/login` | Đăng nhập (nhận JWT token) | ❌ |

### 📘 Subjects (`/api/v1/subjects`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/` | Lấy danh sách môn học | ✅ |
| `POST` | `/` | Tạo môn học mới | ✅ |
| `PUT` | `/{id}` | Cập nhật môn học | ✅ |
| `DELETE` | `/{id}` | Xóa môn học | ✅ |

### ✅ Tasks (`/api/v1/tasks`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/` | Lấy danh sách tasks (hỗ trợ filter, sort) | ✅ |
| `GET` | `/{id}` | Lấy chi tiết 1 task | ✅ |
| `POST` | `/` | Tạo task mới | ✅ |
| `PUT` | `/{id}` | Cập nhật toàn bộ task | ✅ |
| `PATCH` | `/{id}` | Cập nhật một phần task | ✅ |
| `DELETE` | `/{id}` | Xóa task | ✅ |

### 📅 Timetable (`/api/v1/timetable`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/` | Lấy thời khóa biểu | ✅ |
| `POST` | `/` | Thêm lịch học | ✅ |
| `DELETE` | `/{id}` | Xóa lịch học | ✅ |

### 🍅 Pomodoro (`/api/v1/pomodoro`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/` | Lấy lịch sử phiên Pomodoro | ✅ |
| `POST` | `/` | Lưu phiên Pomodoro mới | ✅ |

### 📊 Dashboard (`/api/v1/dashboard`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/stats` | Lấy thống kê tổng quan | ✅ |

### 🤖 AI (`/api/v1/ai`)

| Method | Endpoint | Mô tả | Auth | Rate Limit |
|--------|----------|-------|------|------------|
| `POST` | `/breakdown-task` | AI chia nhỏ task thành sub-tasks | ✅ | 10 lần/ngày |

### 🔔 Notifications (`/api/v1/notifications`)

| Method | Endpoint | Mô tả | Auth |
|--------|----------|-------|------|
| `GET` | `/` | Lấy danh sách thông báo | ✅ |

> **📝 Auth:** Các endpoint có Auth = ✅ cần gửi header `Authorization: Bearer <token>`

---

## 📁 Cấu Trúc Dự Án

```
UniMate/
├── backend/
│   ├── app/
│   │   ├── api/                  # Route handlers
│   │   │   ├── auth.py           # Đăng ký, đăng nhập
│   │   │   ├── subject.py        # CRUD môn học
│   │   │   ├── task.py           # CRUD công việc
│   │   │   ├── timetable.py      # Thời khóa biểu
│   │   │   ├── pomodoro.py       # Pomodoro sessions
│   │   │   ├── dashboard.py      # Thống kê
│   │   │   ├── ai.py             # AI breakdown
│   │   │   ├── notification.py   # Thông báo
│   │   │   └── deps.py           # Dependencies (auth, db)
│   │   ├── core/
│   │   │   ├── config.py         # Cấu hình từ .env
│   │   │   └── security.py       # JWT, hashing
│   │   ├── crud/                 # Database operations
│   │   ├── db/                   # Database setup
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic schemas
│   │   └── main.py               # FastAPI app entry
│   ├── alembic/                  # Database migrations
│   ├── tests/                    # Unit tests
│   ├── .env                      # Biến môi trường (không commit)
│   └── alembic.ini               # Alembic config
│
├── frontend/
│   ├── public/                   # Static assets & PWA icons
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   │   ├── AIBreakdownModal.tsx
│   │   │   ├── ConfirmDialog.tsx
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── TaskFormModal.tsx
│   │   ├── pages/                # Page components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   ├── Subjects.tsx
│   │   │   ├── Tasks.tsx
│   │   │   ├── Timetable.tsx
│   │   │   └── Pomodoro.tsx
│   │   ├── services/             # API service layer
│   │   ├── store/                # Zustand state management
│   │   ├── hooks/                # Custom hooks
│   │   ├── types/                # TypeScript interfaces
│   │   ├── App.tsx               # Routes & layout
│   │   └── main.tsx              # Entry point
│   ├── .env                      # Biến môi trường (không commit)
│   ├── vite.config.ts            # Vite + PWA config
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 🧪 Chạy Tests

```bash
cd backend

# Kích hoạt môi trường ảo
venv\Scripts\activate

# Chạy tất cả tests
pytest

# Chạy tests với output chi tiết
pytest -v

# Chạy test của module cụ thể
pytest tests/test_tasks.py
pytest tests/test_subjects.py
pytest tests/test_ai.py
```

---

## 🔧 Lưu Ý Quan Trọng

### Bảo Mật
- ⚠️ **Không commit file `.env`** — chứa secret key và API key
- ⚠️ **Đổi `SECRET_KEY`** trước khi deploy lên production
- ⚠️ **CORS** hiện đang cho phép tất cả origins (`*`) — nên giới hạn khi deploy

### Database
- Mặc định sử dụng **SQLite** (file `unimate.db`) — phù hợp phát triển
- Khuyến khích sử dụng **PostgreSQL** cho production:
  ```env
  DATABASE_URL=postgresql://user:password@localhost:5432/unimate
  ```

### AI Feature
- Sử dụng **Groq Cloud** (miễn phí) với model **LLaMA 3.1 8B Instant**
- Rate limit: **10 lần/ngày** mỗi user
- Cần kết nối internet để sử dụng tính năng AI

### PWA
- Ứng dụng hỗ trợ cài đặt trên mobile như app native
- Trên Chrome: Menu → "Install App" hoặc "Add to Home Screen"

---

## 📄 License

Dự án này sử dụng giấy phép [MIT License](LICENSE).

---

## 👨‍💻 Tác Giả

- **Nguyễn Từ** — [GitHub](https://github.com/nguyen123tu)

---

<div align="center">

⭐ Nếu dự án hữu ích, hãy cho một Star trên GitHub! ⭐

</div>
