import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "login": {
        "title": "Welcome back",
        "subtitle": "Enter your credentials to access your account",
        "email": "Email",
        "password": "Password",
        "rememberMe": "Remember me",
        "forgotPassword": "Forgot password?",
        "signIn": "Sign in",
        "signingIn": "Signing in...",
        "error": {
          "invalid": "Invalid email or password"
        }
      },
      "dashboard": {
        "title": "Dashboard",
        "overview": "Overview",
        "analytics": "Analytics",
        "settings": "Settings",
        "logout": "Logout",
        "search": "Search...",
        "menu": {
          "dashboard": "Dashboard",
          "clients": "Clients",
          "leads": "Leads",
          "appointments": "Appointments",
          "reports": "Reports",
          "recordings": "Recordings",
          "settings": "Settings"
        },
        "kpi": {
          "totalCalls": "Total Calls",
          "activeAgents": "Active Agents",
          "queueVolume": "Queue Volume",
          "avgHandleTime": "Avg Handle Time",
          "fromLastMonth": "from last month"
        },
        "charts": {
          "callVolume": "Call Volume (Today)",
          "topAgents": "Top Agents Performance"
        },
        "recentActivity": "Recent Activity",
        "table": {
          "id": "ID",
          "agent": "Agent",
          "status": "Status",
          "duration": "Duration",
          "time": "Time",
          "statuses": {
            "completed": "Completed",
            "inProgress": "In Progress",
            "missed": "Missed"
          },
          "timestamps": {
            "now": "Now",
            "minsAgo": "{{count}} mins ago"
          }
        },
        "user": {
          "admin": "Admin"
        }
      }
    }
  },
  id: {
    translation: {
      "login": {
        "title": "Selamat datang kembali",
        "subtitle": "Masukkan kredensial Anda untuk mengakses akun",
        "email": "Email",
        "password": "Kata Sandi",
        "rememberMe": "Ingat saya",
        "forgotPassword": "Lupa kata sandi?",
        "signIn": "Masuk",
        "signingIn": "Sedang masuk...",
        "error": {
          "invalid": "Email atau kata sandi salah"
        }
      },
      "dashboard": {
        "title": "Dasbor",
        "overview": "Ringkasan",
        "analytics": "Analitik",
        "settings": "Pengaturan",
        "logout": "Keluar",
        "search": "Cari...",
        "menu": {
          "dashboard": "Dasbor",
          "clients": "Klien",
          "leads": "Prospek",
          "appointments": "Janji Temu",
          "reports": "Laporan",
          "recordings": "Rekaman",
          "settings": "Pengaturan"
        },
        "kpi": {
          "totalCalls": "Total Panggilan",
          "activeAgents": "Agen Aktif",
          "queueVolume": "Volume Antrian",
          "avgHandleTime": "Rata-rata Waktu Penanganan",
          "fromLastMonth": "dari bulan lalu"
        },
        "charts": {
          "callVolume": "Volume Panggilan (Hari Ini)",
          "topAgents": "Performa Agen Terbaik"
        },
        "recentActivity": "Aktivitas Terbaru",
        "table": {
          "id": "ID",
          "agent": "Agen",
          "status": "Status",
          "duration": "Durasi",
          "time": "Waktu",
          "statuses": {
            "completed": "Selesai",
            "inProgress": "Sedang Berlangsung",
            "missed": "Terlewat"
          },
          "timestamps": {
            "now": "Baru saja",
            "minsAgo": "{{count}} menit yang lalu"
          }
        },
        "user": {
          "admin": "Admin"
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    fallbackLng: "en",
    interpolation: {
      escapeValue: false // react already safes from xss
    }
  });

export default i18n;
