# Product Inventory System with Stock Management

An online store inventory application to manage products, track variants/sub-variants, and handle stock transactions in real-time.

## Table of Contents


1. [Features](#features)
2. [Technologies Used](#technologies-used)
3. [Project Structure](#project-structure)
4. [Prerequisites](#prerequisites)
5. [Setup Instructions](#setup-instructions)
6. [Running the Application](#running-the-application)
7. [API Endpoints](#api-endpoints)
8. [Usage](#usage)
9. [Customization](#customization)
10. [Future Enhancements](#future-enhancements)
11. [License](#license)
---


## Features

- Product and variant management
- Real-time stock tracking
- Stock in/out transactions
- RESTful API (Django REST Framework)
- Modern React frontend (Vite)

## Technologies Used

- Backend: Python, Django, Django REST Framework
- Frontend: React, Vite, JavaScript
- Database: MySQL

### MySQL Database Configuration Example

To use MySQL instead of SQLite, update your `backend/backend/settings.py` as follows:

```
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'your_db_name',
        'USER': 'your_db_user',
        'PASSWORD': 'your_db_password',
        'HOST': 'localhost',  # Or your MySQL host
        'PORT': '3306',
    }
}
```

Make sure to install the MySQL client for Python:

```powershell
pip install mysqlclient
```

You may need to install MySQL development headers/libraries on your system if you encounter build errors.

---


## Project Structure

```
Product-Inventory-System/
├── backend/
│   ├── backend/           # Django project settings
│   ├── products/          # Product app
│   ├── stock/             # Stock management app
│   ├── media/             # Uploaded images
│   ├── manage.py
│   └── requirements.txt
├── frontend/              # React app (Vite)
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- npm or yarn

---

## Setup Instructions

### 1. Backend Setup

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # Follow prompts to create admin user
```

### 2. Frontend Setup

```powershell
cd ../frontend
npm install
```

---

## Running the Application

### 1. Start the Backend (API server)

```powershell
cd backend
venv\Scripts\activate
python manage.py runserver
```

### 2. Start the Frontend (React app)

```powershell
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` (default Vite port).
The backend API will be available at `http://localhost:8000`.

---

## API Endpoints

The backend provides RESTful API endpoints for managing products and stock. Below are some key endpoints:

### Products

- `GET    /api/products/` — List all products
- `POST   /api/products/` — Create a new product
- `GET    /api/products/{id}/` — Retrieve a product by ID
- `PUT    /api/products/{id}/` — Update a product
- `DELETE /api/products/{id}/` — Delete a product

### Stock

- `GET    /api/stock/` — List all stock entries
- `POST   /api/stock/` — Create a new stock transaction (in/out)
- `GET    /api/stock/{id}/` — Retrieve a stock entry by ID
- `PUT    /api/stock/{id}/` — Update a stock entry
- `DELETE /api/stock/{id}/` — Delete a stock entry

### Authentication & Admin

- `POST   /api/auth/login/` — Obtain authentication token (if enabled)
- `/admin/` — Django admin panel

> For more details, see the code in `products/serializers.py`, `stock/serializers.py`, and the respective `views.py` and `urls.py` files.

---


## Usage

- Access the React frontend to manage products and stock.
- Use the Django admin (`/admin`) for advanced management.
- Product images are stored in `backend/media/uploads/`.

---

## Customization

- To use a different database, update `backend/backend/settings.py`.
- To add new product fields, edit `products/models.py` and run migrations.
- For API endpoints, see `products/serializers.py` and `stock/serializers.py`.

---

## Future Enhancements

- User roles and permissions
- Inventory analytics and reporting
- Bulk import/export
- Improved UI/UX

---

## License
This project is for educational or personal use. If you plan to distribute or modify it, please include proper attribution. You may choose to add an open-source license if desired.