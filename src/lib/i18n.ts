import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "common": {
        "logout": "Logout",
        "actions": "Actions",
        "view": "View",
        "edit": "Edit",
        "delete": "Delete",
        "all": "All",
        "status": "Status",
        "noResults": "No results.",
        "cancel": "Cancel",
        "save": "Save",
        "saving": "Saving...",
        "back": "Back",
        "loading": "Loading...",
        "error": "Error",
        "deleteConfirmTitle": "Are you sure?",
        "notProvided": "Not provided",
        "createdAt": "Created At",
        "updatedAt": "Updated At",
        "add": "Add",
        "adding": "Adding...",
        "update": "Update",
        "updating": "Updating...",
        "send": "Send",
        "close": "Close",
        "deleting": "Deleting..."
      },
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
      },
      "clients": {
        "stats": {
          "total": "Total Clients",
          "active": "Active Clients",
          "new": "New This Month",
          "inactive": "Inactive"
        },
        "searchPlaceholder": "Search clients...",
        "create": "Add Client",
        "table": {
          "name": "Name",
          "email": "Email",
          "phone": "Phone",
          "status": "Status"
        },
        "createTitle": "Create Client",
        "createSubtitle": "Add a new client to the system",
        "createSuccess": "Client created successfully",
        "createError": "Failed to create client",
        "updateSuccess": "Client updated successfully",
        "updateError": "Failed to update client",
        "editTitle": "Edit Client",
        "notFound": "Client not found",
        "deleteConfirmDescription": "Are you sure you want to delete this client? This action cannot be undone.",
        "contactInfo": "Contact Information",
        "systemInfo": "System Information",
        "tabs": {
          "overview": "Overview",
          "users": "Users",
          "payments": "Payment History",
          "gsm": "GSM Devices"
        },
        "subscription": {
          "title": "Subscription Information",
          "plan": "Plan",
          "expiry": "Expiry Date",
          "daysRemaining": "days remaining",
          "expired": "Expired",
          "active": "Active"
        },
        "payments": {
          "title": "Payment History",
          "amount": "Amount",
          "date": "Date",
          "method": "Method",
          "period": "Period",
          "noPayments": "No payment history found"
        },
        "users": {
          "title": "Users",
          "name": "Name",
          "email": "Email",
          "role": "Role",
          "supervisor": "Supervisor",
          "addUser": "Add User",
          "searchPlaceholder": "Search users...",
          "noUsers": "No users found"
        },
        "gsm": {
          "title": "GSM Devices",
          "deviceName": "Device Name",
          "imei": "IMEI",
          "status": "Status",
          "noDevices": "No GSM devices assigned"
        },
        "form": {
          "name": "Name",
          "email": "Email",
          "phone": "Phone",
          "status": "Status",
          "address": "Address",
          "placeholders": {
            "name": "Acme Corp",
            "email": "contact@acme.com",
            "phone": "+1 234 567 890",
            "address": "123 Main St, City, Country"
          }
        }
      },
      "gsmDevices": {
        "title": "GSM Devices",
        "details": {
          "summary": "Device Summary",
          "ports": "Device Ports"
        },
        "status": "Status",
        "remoteUrl": "Remote URL",
        "username": "Username",
        "password": "Password",
        "totalPorts": "Total Ports",
        "model": "Model",
        "firmware": "Firmware",
        "deleteSuccess": "GSM Device deleted successfully",
        "deleteError": "Failed to delete GSM device",
        "deleteConfirmDescription": "This action cannot be undone. This will permanently delete the GSM device and all associated data.",
        "ports": {
          "add": "Add Port",
          "edit": "Edit Port",
          "number": "Port #",
          "phoneNumber": "Phone Number",
          "status": "Status",
          "gsmSim": "GSM SIM",
          "gsmStatus": "GSM Status",
          "gsmSignal": "Signal",
          "gsmOperator": "Operator",
          "updatedAt": "Last Updated",
          "sendUssd": "Send USSD",
          "empty": "No ports found",
          "addDescription": "Add a new port to this GSM device",
          "editDescription": "Update the port details",
          "deleteSuccess": "Port deleted successfully",
          "deleteError": "Failed to delete port",
          "deleteConfirmDescription": "This action cannot be undone. This will permanently delete this port."
        },
        "ussd": {
          "title": "Send USSD",
          "description": "Send USSD code to Port {{port}}",
          "code": "USSD Code",
          "result": "Result",
          "disconnect": "Disconnect",
          "waitingForResult": "Waiting for response...",
          "sendSuccess": "USSD code sent",
          "sendError": "Failed to send USSD code",
          "disconnectSuccess": "USSD session disconnected",
          "disconnectError": "Failed to disconnect USSD"
        }
      }
    }
  },
  id: {
    translation: {
      "common": {
        "logout": "Keluar",
        "actions": "Aksi",
        "view": "Lihat",
        "edit": "Ubah",
        "delete": "Hapus",
        "all": "Semua",
        "status": "Status",
        "noResults": "Tidak ada hasil.",
        "cancel": "Batal",
        "save": "Simpan",
        "saving": "Menyimpan...",
        "back": "Kembali",
        "loading": "Memuat...",
        "error": "Kesalahan",
        "deleteConfirmTitle": "Apakah Anda yakin?",
        "notProvided": "Tidak disediakan",
        "createdAt": "Dibuat Pada",
        "updatedAt": "Diperbarui Pada",
        "add": "Tambah",
        "adding": "Menambahkan...",
        "update": "Perbarui",
        "updating": "Memperbarui...",
        "send": "Kirim",
        "close": "Tutup",
        "deleting": "Menghapus..."
      },
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
      },
      "clients": {
        "stats": {
          "total": "Total Klien",
          "active": "Klien Aktif",
          "new": "Baru Bulan Ini",
          "inactive": "Tidak Aktif"
        },
        "searchPlaceholder": "Cari klien...",
        "create": "Tambah Klien",
        "table": {
          "name": "Nama",
          "email": "Email",
          "phone": "Telepon",
          "status": "Status"
        },
        "createTitle": "Buat Klien",
        "createSubtitle": "Tambahkan klien baru ke sistem",
        "createSuccess": "Klien berhasil dibuat",
        "createError": "Gagal membuat klien",
        "updateSuccess": "Klien berhasil diperbarui",
        "updateError": "Gagal memperbarui klien",
        "editTitle": "Ubah Klien",
        "notFound": "Klien tidak ditemukan",
        "deleteConfirmDescription": "Apakah Anda yakin ingin menghapus klien ini? Tindakan ini tidak dapat dibatalkan.",
        "contactInfo": "Informasi Kontak",
        "systemInfo": "Informasi Sistem",
        "tabs": {
          "overview": "Ringkasan",
          "users": "Pengguna",
          "payments": "Riwayat Pembayaran",
          "gsm": "Perangkat GSM"
        },
        "subscription": {
          "title": "Informasi Langganan",
          "plan": "Paket",
          "expiry": "Tanggal Berakhir",
          "daysRemaining": "hari tersisa",
          "expired": "Kedaluwarsa",
          "active": "Aktif"
        },
        "payments": {
          "title": "Riwayat Pembayaran",
          "amount": "Jumlah",
          "date": "Tanggal",
          "method": "Metode",
          "period": "Periode",
          "noPayments": "Tidak ada riwayat pembayaran"
        },
        "users": {
          "title": "Pengguna",
          "name": "Nama",
          "email": "Email",
          "role": "Peran",
          "supervisor": "Supervisor",
          "addUser": "Tambah Pengguna",
          "searchPlaceholder": "Cari pengguna...",
          "noUsers": "Tidak ada pengguna ditemukan"
        },
        "gsm": {
          "title": "Perangkat GSM",
          "deviceName": "Nama Perangkat",
          "imei": "IMEI",
          "status": "Status",
          "noDevices": "Tidak ada perangkat GSM yang ditugaskan"
        },
        "form": {
          "name": "Nama",
          "email": "Email",
          "phone": "Telepon",
          "status": "Status",
          "address": "Alamat",
          "placeholders": {
            "name": "Perusahaan Acme",
            "email": "kontak@acme.com",
            "phone": "+62 812 3456 7890",
            "address": "Jl. Jend. Sudirman No. 1, Jakarta"
          }
        }
      },
      "gsmDevices": {
        "title": "Perangkat GSM",
        "details": {
          "summary": "Ringkasan Perangkat",
          "ports": "Port Perangkat"
        },
        "status": "Status",
        "remoteUrl": "URL Jarak Jauh",
        "username": "Nama Pengguna",
        "password": "Kata Sandi",
        "totalPorts": "Total Port",
        "model": "Model",
        "firmware": "Firmware",
        "deleteSuccess": "Perangkat GSM berhasil dihapus",
        "deleteError": "Gagal menghapus perangkat GSM",
        "deleteConfirmDescription": "Tindakan ini tidak dapat dibatalkan. Ini akan menghapus perangkat GSM dan semua data terkait secara permanen.",
        "ports": {
          "add": "Tambah Port",
          "edit": "Ubah Port",
          "number": "Port #",
          "phoneNumber": "Nomor Telepon",
          "status": "Status",
          "gsmSim": "SIM GSM",
          "gsmStatus": "Status GSM",
          "gsmSignal": "Sinyal",
          "gsmOperator": "Operator",
          "updatedAt": "Terakhir Diperbarui",
          "sendUssd": "Kirim USSD",
          "empty": "Tidak ada port ditemukan",
          "addDescription": "Tambahkan port baru ke perangkat GSM ini",
          "editDescription": "Perbarui detail port",
          "deleteSuccess": "Port berhasil dihapus",
          "deleteError": "Gagal menghapus port",
          "deleteConfirmDescription": "Tindakan ini tidak dapat dibatalkan. Ini akan menghapus port ini secara permanen."
        },
        "ussd": {
          "title": "Kirim USSD",
          "description": "Kirim kode USSD ke Port {{port}}",
          "code": "Kode USSD",
          "result": "Hasil",
          "disconnect": "Putuskan",
          "waitingForResult": "Menunggu respons...",
          "sendSuccess": "Kode USSD terkirim",
          "sendError": "Gagal mengirim kode USSD",
          "disconnectSuccess": "Sesi USSD diputus",
          "disconnectError": "Gagal memutus USSD"
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
