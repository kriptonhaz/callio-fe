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
        "kpi": {
          "totalCalls": "Total Calls",
          "activeAgents": "Active Agents",
          "queueVolume": "Queue Volume",
          "avgHandleTime": "Avg Handle Time"
        },
        "recentActivity": "Recent Activity"
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
        "kpi": {
          "totalCalls": "Total Panggilan",
          "activeAgents": "Agen Aktif",
          "queueVolume": "Volume Antrian",
          "avgHandleTime": "Rata-rata Waktu Penanganan"
        },
        "recentActivity": "Aktivitas Terbaru"
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
