# Digital Gatepass & Late-Mark Monitoring System
### S. B. Jain Institute of Technology, Management and Research (SBJITMR), Nagpur

---

## 💡 About The Project

In our college, gate passes and late arrivals were traditionally managed using physical paper registers. This caused several everyday problems:
1. **Time-consuming manual approvals:** Students had to walk around finding mentors and HODs to get physical signatures.
2. **Long queues at the college gate:** Security guards had to manually write down details in paper logs during peak hours.
3. **Parent communication gap:** Parents had no real-time update when their ward left the college campus.
4. **Scattered records:** Tracking repeated latecomers or previous gate passes across semesters was difficult.

To solve this, we built a **centralized digital web platform** that connects students, faculty mentors, HODs, and gate security guards in one place.

---

## 🚀 How It Works (Real-World Flow)

1. **Student Request:** A student logs into the portal and submits a digital gatepass request with their reason and destination.
2. **Teacher / HOD Approval:** The mentor receives the request on their dashboard and can approve or reject it with a single click.
3. **QR Pass Generation:** Once approved, the student gets a time-bound QR code on their screen.
4. **Gate Verification:** The security guard scans the student's QR code using the gate terminal scanner. The pass is validated instantly and marked as "Checked Out".
5. **WhatsApp Notification to Parent:** The moment checkout happens, an automated WhatsApp message is triggered to the parent's phone with departure time and reason.
6. **Late-Mark Entry:** Guards can quickly mark latecomers at the main gate, which updates the mentor and HOD dashboards in real time.

---

## 👥 Portals & Features

- **👨‍🎓 Student Portal**
  - Apply for gatepass with reason & destination.
  - View live status (Pending, Approved, Rejected).
  - Display digital QR pass for gate scanning.
  - View personal late-mark count and history.

- **👨‍🏫 Teacher / Mentor Portal**
  - Review and approve pending student gatepass requests.
  - Mark late entries for assigned department/batch.
  - Search student history by roll number or name.

- **🏛️ Head of Department (HOD) Portal**
  - Overall department oversight.
  - Approve escalated passes.
  - Monitor daily movement and late-mark analytics.

- **👮 Security Guard Portal**
  - Fast QR code scanner for instant checkout.
  - Manual entry lookup for visitors and students without phones.
  - Instant gate log updates.

- **⚙️ Admin Dashboard**
  - User management (Add/manage students, faculty, and guards).
  - Monitor system logs, Brevo email status, and WhatsApp gateway health.

---

## 🛠️ Tech Stack & Key Choices

- **Frontend:** React.js, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js, JWT Authentication
- **Database:** MongoDB Atlas (Cloud database)
- **Email Gateway:** **Brevo (Sendinblue) REST API**  
  *(We used Brevo's HTTPS API for 2-step verification and password reset OTPs because traditional SMTP ports 25/587 are blocked on cloud hosting platforms like Render and Vercel).*
- **WhatsApp Gateway:** **Green-API** *(For real-time parent departure alerts & 2FA OTP delivery).*

---

## ⚙️ Environment Variables (.env)

Create a `.env` file in the root folder with the following variables (reference in `.env.example`):

```env
# JWT Secret Key
JWT_SECRET="college_gatepass_super_secret_key_2026"

# Brevo Email API (for 2-Step Login Verification & Password Reset)
BREVO_API_KEY="your_brevo_api_key_here"
BREVO_SENDER_EMAIL="your_verified_sender_email@gmail.com"
BREVO_SENDER_NAME="SBJIT,NAGPUR"

# Green-API WhatsApp (for Parent Alerts & 2FA)
GREEN_API_URL="https://7107.api.greenapi.com"
GREEN_API_INSTANCE_ID="your_instance_id"
GREEN_API_TOKEN="your_token"

# MongoDB Database Connection
MONGODB_URI="your_mongodb_connection_string"
```

---

## 💻 Running the Project Locally

### 1. Clone the repository
```bash
git clone https://github.com/Samir-111/Digital_gatepass_and_latemark_Motior_system.git
cd Digital_gatepass_and_latemark_Motior_system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
Copy `.env.example` to `.env` and add your database and API keys:
```bash
cp .env.example .env
```

### 4. Start the development server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 5. Build for production
```bash
npm run build
```

---

## 🔒 Security & Reliability Features
- **2-Step Verification (2FA):** Login requires a 6-digit OTP delivered via Email (Brevo) and WhatsApp to prevent unauthorized account access.
- **JWT Session Security:** Role-based protected routes ensure students cannot access teacher/admin actions.
- **HTTPS REST Email Integration:** Prevents deployment failures caused by cloud SMTP port restrictions.
- **Persistent Cloud Storage:** MongoDB Atlas ensures no data is lost when servers restart.

---

## 📌 Project Credits
Developed as an engineering project for **S. B. Jain Institute of Technology, Management and Research (SBJITMR)**.
