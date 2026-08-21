# 🤖 ERS Hive - Inventory Management Application

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive inventory management application designed specifically for the ERS Robotics Club to track, organize, and manage microcontrollers, sensors, mechanical components, and tools across various projects.

## 📖 Overview

**ERS Hive** is a full-stack web application built with a React/Vite frontend and a Node.js/Express backend, featuring MongoDB for data storage and Cloudinary for image storage. The application provides role-based access control for different user types (members, inventory managers, coordinators) to efficiently manage inventory items, track borrowing/returning transactions, and maintain inventory policies.

---

## ✨ Features

### Core Functionality
*   **Inventory Management:** Add, edit, delete, and add images and detailed descriptions.
*   **Item Borrowing System:** Request to borrow items with expected return dates.
*   **Approval Workflow:** Inventory managers and coordinators can approve or reject requests.
*   **Inventory Policies:** Set borrowing limits and duration limits per item.
*   **Storage Management:** Organize items in storage locations.
*   **Transaction History:** Track all borrowing/returning activities.
*   **Overdue Tracking:** Automatic identification of overdue items.
*   **Role-Based Access:** Different permissions for members, managers, and coordinators.

### Technical Stack
*   **Frontend:** React 19, Vite, React Router DOM, TailwindCSS, Lucide React icons, Recharts
*   **Backend:** Node.js, Express, MongoDB (with Mongoose)
*   **Authentication:** Google OAuth via Better-Auth
*   **File Storage:** Cloudinary integration for image storage
*   **Development:** ESLint for code quality, Nodemon for development

---
## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+ recommended)
*   MongoDB Atlas account (or local MongoDB instance)
*   Cloudinary account (for image storage)
*   Google Cloud Console project (for OAuth)
*   npm or yarn

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/yourusername/ERS-Hive-Inventory-Management-App.git
cd hive
```

**2. Backend Setup**
```bash
cd backend
npm install

# Create .env file based on the example below
cp .env.example .env  # If example exists, otherwise create manually

# Start development server
npm run dev
```

**3. Frontend Setup**
```bash
cd frontend
npm install

# Create .env file based on the example below
cp .env.example .env  # If example exists, otherwise create manually

# Start development server
npm run dev
```
## ⚙️ Environment Variables

### Backend ( `backend/.env` )

```env
PORT=3030
MONGODB_URI="your_mongodb_connection_string"
CORS_ORIGIN=http://localhost:3001
BETTER_AUTH_SECRET="your_strong_secret_here"
BETTER_AUTH_URL=http://localhost:3030
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```
### Frontend ( `frontend/.env` )

```env
VITE_API_URL=http://localhost:3030
```

## 🔌 API Endpoints

**Authentication**

*   `POST /api/auth/sign-in` - Sign in with email/password
*   `POST /api/auth/sign-out` - Sign out
*   `GET /api/auth/session` - Get current session

**Members**

*   `GET /api/members` - Get all members (admin only)
*   `GET /api/members/:id` - Get member by ID
*   `PUT /api/members/:id` - Update member
*   `DELETE /api/members/:id` - Delete member

**Inventory**

*   `GET /api/inventory` - Get all items (with filtering)
*   `GET /api/inventory/:id` - Get item by ID
*   `POST /api/inventory` - Create new item
*   `PUT /api/inventory/:id` - Update item
*   `DELETE /api/inventory/:id` - Delete item
*   `POST /api/inventory/:id/policy` - Set item policy

**Transactions**

*   `GET /api/transactions` - Get transactions (with filtering)
*   `GET /api/transactions/my` - Get current user's transactions
*   `POST /api/transactions/request` - Request to borrow items
*   `PUT /api/transactions/:id/approve` - Approve request
*   `PUT /api/transactions/:id/reject` - Reject request
*   `PUT /api/transactions/:id/return` - Mark item as returned

**Storage**

*   `GET /api/storage` - Get all storage locations
*   `GET /api/storage/:id` - Get storage by ID
*   `POST /api/storage` - Create new storage
*   `PUT /api/storage/:id` - Update storage
*   `DELETE /api/storage/:id` - Delete storage

## 👥 Usage Guide

### For Members (Regular Users)
1. Sign in with your Google account.
2. Browse available inventory items.
3. Select items to borrow and specify expected return dates.
4. Submit request for approval.
5. View your active and pending requests in the dashboard.
6. Return borrowed items when finished.

### For Inventory Managers
1. *All member permissions plus:*
2. Add new inventory items.
3. Edit existing item details.
4. Approve or reject borrowing requests.
5. Set borrowing policies for items.
6. Mark items as returned.

### For Coordinators (Admins)
1. *All manager permissions plus:*
2. Manage storage locations/boxes.
3. View all transactions across all members.
4. Manage user roles and permissions.

## 🗄️ Database Models

### Member
```javascript
{
  _id: ObjectId,
  email: String, // (unique)
  name: String,
  role: Enum['member', 'inventory_manager', 'coordinator'],
  avatar: String, // (URL)
  createdAt: Date,
  updatedAt: Date
}
```

### Inventory Item
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  category: String,
  image: String, // (URL)
  totalQuantity: Number,
  availableQuantity: Number,
  damagedQuantity: Number,
  storageId: ObjectId, // (ref: Storage)
  policy: {
    allowedToTake: Boolean,
    maxQuantityPerMember: Number,
    maxDurationDays: Number
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Transaction
```javascript
{
  _id: ObjectId,
  requestedBy: ObjectId, // (ref: Member)
  approvedBy: ObjectId, // (ref: Member, nullable)
  items: [{
    item: ObjectId, // (ref: Inventory)
    quantity: Number,
    damagedQuantity: Number,
    remarks: String
  }],
  expectedReturnDate: Date,
  issuedOn: Date, // (nullable)
  returnDate: Date, // (nullable)
  status: Enum['pending', 'approved', 'rejected', 'returned', 'overdue'],
  createdAt: Date,
  updatedAt: Date
}
```

### Storage
```javascript
{
  _id: ObjectId,
  storageNumber: Number,
  name: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🔍 Features in Detail

*   **Inventory Management:** Add items with name, description, category, quantity, and image. Track available vs total quantity, mark damaged items separately, assign items to storage locations, and set borrowing policies per item.
*   **Borrowing System:** Users can request to borrow items with expected return dates. Quantity limits are enforced per item and per member. Automatic status updates (pending → approved → returned/overdue) and email notifications for request status changes.
*   **Policy Management:** Enable/disable borrowing for individual items, set maximum quantity per member, and set maximum borrowing duration. Policies are enforced automatically by the system.
*   **Storage Organization:** Create storage boxes/containers, assign items to specific storage locations, and track which items are in which containers.

*   **Reporting & Tracking:** Dashboard overview of inventory status, active borrows, pending requests, and overdue items. Full transaction history with filtering, plus personal borrowing history for each user.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

*Please make sure to update tests as appropriate and adhere to the project code style.*

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

*   **ERS Robotics Club** for providing the use case and inspiration.
*   The open-source community for the various libraries and frameworks used.
*   Contributors who have helped improve this project.

