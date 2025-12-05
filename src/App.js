import React, { useState, useEffect } from "react";
import {
  Plus,
  Download,
  Trash2,
  Check,
  X,
  Search,
  Building,
  AlertCircle,
  User,
  Users,
  Edit3,
  Save,
  FileText,
  StickyNote,
  ExternalLink,
  Calendar,
  Cloud,
  RefreshCw,
  ShieldAlert,
  Globe,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

// --- SENİN FIREBASE AYARLARIN ---
const firebaseConfig = {
  apiKey: "AIzaSyDjTZYdwrbljATQVxYbCjzq4CmmtOTXWuk",
  authDomain: "kira-takip-paneli.firebaseapp.com",
  projectId: "kira-takip-paneli",
  storageBucket: "kira-takip-paneli.firebasestorage.app",
  messagingSenderId: "674278884470",
  appId: "1:674278884470:web:5410f743977af2a0d88b57",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function RentTracker() {
  const [user, setUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [errorInfo, setErrorInfo] = useState(null);

  // --- 1. AUTHENTICATION (HATA YAKALAMALI) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.warn("Auth Durumu:", error.code);
        let msg = "Giriş yapılamadı.";
        let fix = "Bilinmeyen hata.";

        if (
          error.code === "auth/operation-not-allowed" ||
          error.code === "auth/admin-restricted-operation"
        ) {
          msg = "Anonim Giriş (Anonymous Auth) Kapalı";
          fix =
            "Firebase Console -> Build -> Authentication -> Sign-in method sekmesinden 'Anonymous' seçeneğini AÇIK (Enable) yapın ve KAYDET (Save) butonuna basın.";
        } else if (error.code === "auth/unauthorized-domain") {
          msg = "Yetkisiz Alan Adı (Unauthorized Domain)";
          fix = `Bu uygulama şu an '${window.location.hostname}' adresinde çalışıyor. Bu adresi Firebase Console -> Authentication -> Settings -> Authorized Domains kısmına eklemesiniz.`;
        } else {
          msg = error.message;
          fix =
            "Firebase Config ayarlarınızı ve internet bağlantınızı kontrol edin.";
        }

        setErrorInfo({ title: "Kimlik Doğrulama Hatası", msg, fix });
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) setErrorInfo(null);
    });
    return () => unsubscribe();
  }, []);

  // --- 2. VERİTABANI BAĞLANTISI ---
  useEffect(() => {
    if (!user) return;

    const docRef = doc(db, "app_data", "main_data");

    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.clients) setClients(data.clients);
        } else {
          const initialData = [];
          setClients(initialData);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("DB Erişimi:", error.code);
        let msg = "Veritabanına erişilemedi.";
        let fix = "İnternet bağlantınızı kontrol edin.";

        if (error.code === "permission-denied") {
          msg = "Erişim Reddedildi (Permission Denied)";
          fix =
            "Firebase Console -> Firestore Database -> Rules sekmesine gidin. Kuralları şu şekilde değiştirin: allow read, write: if true;";
        }

        setErrorInfo({ title: "Veritabanı Hatası", msg, fix });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- 3. VERİ KAYDETME ---
  const saveToCloud = async (newClients) => {
    if (!user) return alert("Bağlantı yok, kaydedilemiyor.");
    setClients(newClients);
    setSyncStatus("syncing");

    try {
      const docRef = doc(db, "app_data", "main_data");
      await setDoc(docRef, { clients: newClients }, { merge: true });
      setSyncStatus("idle");
    } catch (error) {
      console.error("Kaydetme hatası:", error);
      setSyncStatus("error");
      alert(`Kaydetme Başarısız: ${error.message}`);
    }
  };

  // --- STATE VE UI ---
  const [activeClientId, setActiveClientId] = useState(null);

  useEffect(() => {
    if (clients.length > 0 && !clients.find((c) => c.id === activeClientId)) {
      setActiveClientId(clients[0].id);
    }
  }, [clients, activeClientId]);

  // Modallar
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false); // Yeni Modal State

  const [selectedTenantId, setSelectedTenantId] = useState(null);
  const [detailTab, setDetailTab] = useState("notes");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingClientId, setEditingClientId] = useState(null);
  const [tempClientName, setTempClientName] = useState("");

  const [newClientName, setNewClientName] = useState(""); // Yeni Müvekkil İsmi

  const [newTenant, setNewTenant] = useState({
    name: "",
    address: "",
    startDate: "",
    rentAmount: "",
    hasIncreaseClause: false,
  });
  const [newNote, setNewNote] = useState("");
  const [newDoc, setNewDoc] = useState({ title: "", link: "" });

  const activeClient = clients.find((c) => c.id === activeClientId) || null;
  const activeTenants = activeClient ? activeClient.tenants : [];
  const selectedTenant = activeTenants.find((t) => t.id === selectedTenantId);

  const months = [
    "Oca",
    "Şub",
    "Mar",
    "Nis",
    "May",
    "Haz",
    "Tem",
    "Ağu",
    "Eyl",
    "Eki",
    "Kas",
    "Ara",
  ];

  // --- İŞLEM FONKSİYONLARI ---

  // YENİ: Profesyonel Modal ile Ekleme
  const confirmAddClient = (e) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const newClient = {
      id: `c-${Date.now()}`,
      name: newClientName,
      tenants: [],
    };
    const updated = [...clients, newClient];
    saveToCloud(updated);
    setActiveClientId(newClient.id);
    setNewClientName("");
    setShowAddClientModal(false);
  };

  const handleDeleteClient = (clientId) => {
    if (
      window.confirm(
        "Bu dosyayı silmek istediğinize emin misiniz? (Buluttan da silinecek)"
      )
    ) {
      const updated = clients.filter((c) => c.id !== clientId);
      saveToCloud(updated);
      if (activeClientId === clientId && updated.length > 0)
        setActiveClientId(updated[0].id);
      if (updated.length === 0) setActiveClientId(null);
    }
  };

  const saveClientName = () => {
    const updated = clients.map((c) =>
      c.id === editingClientId ? { ...c, name: tempClientName } : c
    );
    saveToCloud(updated);
    setEditingClientId(null);
  };

  const handleAddTenant = (e) => {
    e.preventDefault();
    if (!newTenant.name || !newTenant.rentAmount) return;
    const updated = clients.map((c) => {
      if (c.id === activeClientId) {
        return {
          ...c,
          tenants: [
            ...c.tenants,
            {
              ...newTenant,
              id: Date.now(),
              payments: {},
              documents: [],
              notes: [],
            },
          ],
        };
      }
      return c;
    });
    saveToCloud(updated);
    setNewTenant({
      name: "",
      address: "",
      startDate: "",
      rentAmount: "",
      hasIncreaseClause: false,
    });
    setShowAddTenantModal(false);
  };

  const togglePayment = (tenantId, monthIndex) => {
    const updated = clients.map((c) => {
      if (c.id === activeClientId) {
        return {
          ...c,
          tenants: c.tenants.map((t) => {
            if (t.id === tenantId) {
              const newPayments = { ...t.payments };
              if (newPayments[monthIndex]) delete newPayments[monthIndex];
              else newPayments[monthIndex] = true;
              return { ...t, payments: newPayments };
            }
            return t;
          }),
        };
      }
      return c;
    });
    saveToCloud(updated);
  };

  const handleDeleteTenant = (id) => {
    if (window.confirm("Silmek istediğinize emin misiniz?")) {
      const updated = clients.map((c) => {
        if (c.id === activeClientId) {
          return { ...c, tenants: c.tenants.filter((t) => t.id !== id) };
        }
        return c;
      });
      saveToCloud(updated);
      if (selectedTenantId === id) setSelectedTenantId(null);
    }
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const updated = clients.map((c) => {
      if (c.id === activeClientId) {
        return {
          ...c,
          tenants: c.tenants.map((t) => {
            if (t.id === selectedTenantId) {
              return {
                ...t,
                notes: [
                  {
                    id: Date.now(),
                    text: newNote,
                    date: new Date().toLocaleDateString("tr-TR"),
                  },
                  ...(t.notes || []),
                ],
              };
            }
            return t;
          }),
        };
      }
      return c;
    });
    saveToCloud(updated);
    setNewNote("");
  };

  const handleDeleteNote = (noteId) => {
    const updated = clients.map((c) => {
      if (c.id === activeClientId) {
        return {
          ...c,
          tenants: c.tenants.map((t) => {
            if (t.id === selectedTenantId) {
              return { ...t, notes: t.notes.filter((n) => n.id !== noteId) };
            }
            return t;
          }),
        };
      }
      return c;
    });
    saveToCloud(updated);
  };

  const handleAddDocument = () => {
    if (!newDoc.title.trim()) return;
    const updated = clients.map((c) => {
      if (c.id === activeClientId) {
        return {
          ...c,
          tenants: c.tenants.map((t) => {
            if (t.id === selectedTenantId) {
              return {
                ...t,
                documents: [
                  {
                    id: Date.now(),
                    title: newDoc.title,
                    link: newDoc.link,
                    date: new Date().toLocaleDateString("tr-TR"),
                  },
                  ...(t.documents || []),
                ],
              };
            }
            return t;
          }),
        };
      }
      return c;
    });
    saveToCloud(updated);
    setNewDoc({ title: "", link: "" });
  };

  const handleDeleteDocument = (docId) => {
    const updated = clients.map((c) => {
      if (c.id === activeClientId) {
        return {
          ...c,
          tenants: c.tenants.map((t) => {
            if (t.id === selectedTenantId) {
              return {
                ...t,
                documents: t.documents.filter((d) => d.id !== docId),
              };
            }
            return t;
          }),
        };
      }
      return c;
    });
    saveToCloud(updated);
  };

  const downloadCSV = () => {
    if (!activeClient) return;
    const headers = [
      "Kiracı Adı",
      "Adres",
      "Başlangıç Tarihi",
      "Kira Bedeli",
      "Artış Maddesi",
      ...months,
    ];
    const rows = activeTenants.map((t) => {
      const paymentStatus = months.map((_, index) =>
        t.payments[index] ? "ÖDENDİ" : "ÖDENMEDİ"
      );
      return [
        `"${t.name}"`,
        `"${t.address}"`,
        t.startDate,
        t.rentAmount,
        t.hasIncreaseClause ? "EVET" : "HAYIR",
        ...paymentStatus,
      ].join(",");
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${activeClient.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}_kira_takip.csv`;
    link.click();
  };

  const filteredTenants = activeTenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalRentPotential = activeTenants.reduce(
    (sum, t) => sum + Number(t.rentAmount),
    0
  );

  // --- HATA GÖSTERİM EKRANI ---
  if (errorInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
        <div className="bg-white max-w-lg w-full p-8 rounded-xl shadow-2xl border-l-8 border-red-600">
          <div className="flex items-center gap-3 mb-4 text-red-600">
            <ShieldAlert className="w-10 h-10" />
            <h1 className="text-2xl font-bold">Bağlantı Hatası</h1>
          </div>

          <div className="bg-red-50 p-4 rounded-lg mb-6 border border-red-100">
            <h3 className="font-bold text-red-800 mb-1">{errorInfo.title}</h3>
            <p className="text-red-700 text-sm font-mono">{errorInfo.msg}</p>
          </div>

          <div className="mb-6">
            <h4 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Çözüm Yolu:
            </h4>
            <p className="text-gray-600 text-sm leading-relaxed border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 rounded-r">
              {errorInfo.fix}
            </p>
          </div>

          {errorInfo.msg.includes("Domain") && (
            <div className="bg-slate-100 p-3 rounded text-center">
              <p className="text-xs text-gray-500 mb-1">
                Şu anki Domain Adresi:
              </p>
              <code className="bg-white px-2 py-1 rounded border font-mono select-all text-blue-600 font-bold">
                {window.location.hostname}
              </code>
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (loading)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500 gap-4">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />{" "}
        <p>Bulut Sunucusuna Bağlanılıyor...</p>
        <p className="text-xs text-slate-400">
          Bu işlem 5 saniyeden uzun sürerse ayarlarınızı kontrol edin.
        </p>
      </div>
    );

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-700 flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Kısıtlı/Tereke (Canlı Veritabanı)
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-xs font-medium px-2 py-1 rounded bg-white border border-gray-200 flex items-center gap-1 text-gray-500">
              {syncStatus === "syncing" ? (
                <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
              ) : (
                <Cloud className="w-3 h-3 text-green-500" />
              )}
              {syncStatus === "syncing" ? "Kaydediliyor..." : "Senkronize"}
            </div>
            {/* Buton İsmi ve Fonksiyonu Değişti */}
            <button
              onClick={() => setShowAddClientModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Kısıtlı/Tereke Dosyası Ekle
            </button>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {clients.length === 0 ? (
            <div className="text-sm text-gray-500 p-2 italic">
              Henüz dosya eklenmedi.
            </div>
          ) : (
            clients.map((client) => (
              <div
                key={client.id}
                onClick={() => setActiveClientId(client.id)}
                className={`group relative flex items-center gap-2 px-5 py-3 rounded-t-lg border-b-2 cursor-pointer transition-all min-w-[180px] justify-between ${
                  activeClientId === client.id
                    ? "bg-white border-blue-600 text-blue-700 shadow-sm z-10"
                    : "bg-slate-200 border-transparent text-slate-500 hover:bg-slate-300 hover:text-slate-700"
                }`}
              >
                {editingClientId === client.id ? (
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      autoFocus
                      className="w-24 px-1 py-0.5 text-sm border rounded"
                      value={tempClientName}
                      onChange={(e) => setTempClientName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveClientName()}
                    />
                    <button
                      onClick={saveClientName}
                      className="text-green-600 hover:bg-green-100 rounded p-0.5"
                    >
                      <Save className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="font-medium truncate max-w-[140px]">
                    {client.name}
                  </span>
                )}
                {activeClientId === client.id &&
                  editingClientId !== client.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingClientId(client.id);
                          setTempClientName(client.name);
                        }}
                        className="p-1 hover:bg-blue-100 rounded text-blue-500"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClient(client.id);
                        }}
                        className="p-1 hover:bg-red-100 rounded text-red-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  )}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-b-xl rounded-tr-xl overflow-hidden -mt-2 relative z-0">
        <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Building className="w-6 h-6" />{" "}
              {activeClient ? activeClient.name : "Dosya Seçiniz"}
            </h1>
            {activeClient && (
              <p className="text-slate-400 text-sm mt-1 flex gap-4">
                <span>{activeTenants.length} Kiracı</span>
                <span className="text-slate-500">|</span>
                <span>
                  Aylık Potansiyel: ₺
                  {totalRentPotential.toLocaleString("tr-TR")}
                </span>
              </p>
            )}
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition text-sm font-medium"
            >
              <Download className="w-4 h-4" /> Excel İndir
            </button>
            <button
              onClick={() => setShowAddTenantModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
            >
              <Plus className="w-4 h-4" /> Yeni Kiracı
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder={`${
                activeClient?.name || "Müvekkil"
              } kiracılarında ara...`}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 text-gray-600 text-xs uppercase tracking-wider border-b border-gray-200">
                <th className="p-4 font-semibold w-48 sticky left-0 bg-gray-100 z-10 shadow-sm">
                  Kiracı Bilgisi
                </th>
                <th className="p-4 font-semibold w-64">Mülk Adresi</th>
                <th className="p-4 font-semibold w-32">Kira Bedeli</th>
                {months.map((m, i) => (
                  <th
                    key={i}
                    className="p-2 font-semibold text-center w-12 border-l border-gray-200"
                  >
                    {m}
                  </th>
                ))}
                <th className="p-4 font-semibold w-16 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={17} className="p-12 text-center text-gray-400">
                    {clients.length === 0
                      ? "Önce bir dosya oluşturun."
                      : "Bu dosya için kayıtlı kiracı yok."}
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="hover:bg-blue-50 transition group"
                  >
                    <td
                      className="p-4 sticky left-0 bg-white group-hover:bg-blue-50 z-10 border-r border-gray-100 cursor-pointer"
                      onClick={() => setSelectedTenantId(tenant.id)}
                    >
                      <div className="font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        {tenant.name}
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      <div className="text-xs text-gray-400 flex gap-1 mt-1">
                        {(tenant.documents || []).length > 0 && (
                          <span className="flex items-center">
                            <FileText className="w-3 h-3 mr-0.5" />
                            {tenant.documents.length}
                          </span>
                        )}
                        {(tenant.notes || []).length > 0 && (
                          <span className="flex items-center ml-1">
                            <StickyNote className="w-3 h-3 mr-0.5" />
                            {tenant.notes.length}
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="p-4 text-sm text-gray-600 truncate max-w-xs"
                      title={tenant.address}
                    >
                      {tenant.address}
                    </td>
                    <td className="p-4 font-mono font-medium text-slate-700">
                      ₺{Number(tenant.rentAmount).toLocaleString("tr-TR")}
                    </td>
                    {months.map((_, index) => (
                      <td
                        key={index}
                        className="p-2 text-center border-l border-gray-100"
                      >
                        <button
                          onClick={() => togglePayment(tenant.id, index)}
                          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                            tenant.payments[index]
                              ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600"
                              : "bg-gray-100 text-gray-300 hover:bg-gray-200"
                          }`}
                        >
                          {tenant.payments[index] ? (
                            <Check className="w-5 h-5" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                    ))}
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDeleteTenant(tenant.id)}
                        className="text-gray-400 hover:text-red-600 transition p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTenant && (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-400" />
                  {selectedTenant.name}
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  {selectedTenant.address}
                </p>
              </div>
              <button
                onClick={() => setSelectedTenantId(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex border-b border-gray-200 bg-gray-50 shrink-0">
              <button
                onClick={() => setDetailTab("notes")}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  detailTab === "notes"
                    ? "bg-white text-blue-600 border-t-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <StickyNote className="w-4 h-4" /> Notlar (
                {selectedTenant.notes?.length || 0})
              </button>
              <button
                onClick={() => setDetailTab("documents")}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 ${
                  detailTab === "documents"
                    ? "bg-white text-blue-600 border-t-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                <FileText className="w-4 h-4" /> Belgeler (
                {selectedTenant.documents?.length || 0})
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              {detailTab === "notes" && (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <textarea
                      placeholder="Görüşme notu, hatırlatma..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                      rows="2"
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                    />
                    <button
                      onClick={handleAddNote}
                      className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700 font-medium text-sm"
                    >
                      Ekle
                    </button>
                  </div>
                  <div className="space-y-3 mt-4">
                    {(selectedTenant.notes || []).map((note) => (
                      <div
                        key={note.id}
                        className="bg-white p-3 rounded-lg shadow-sm border border-gray-100 relative group"
                      >
                        <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {note.date}
                        </div>
                        <p className="text-gray-700 text-sm whitespace-pre-wrap">
                          {note.text}
                        </p>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detailTab === "documents" && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-xs text-blue-800 mb-3 font-medium flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Dosya linki veya
                      konumu kaydedilir.
                    </p>
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        placeholder="Belge Adı"
                        className="w-full p-2 text-sm border border-gray-300 rounded"
                        value={newDoc.title}
                        onChange={(e) =>
                          setNewDoc({ ...newDoc, title: e.target.value })
                        }
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Link veya Konum"
                          className="flex-1 p-2 text-sm border border-gray-300 rounded"
                          value={newDoc.link}
                          onChange={(e) =>
                            setNewDoc({ ...newDoc, link: e.target.value })
                          }
                        />
                        <button
                          onClick={handleAddDocument}
                          className="bg-blue-600 text-white px-4 rounded hover:bg-blue-700 text-sm font-medium"
                        >
                          Kaydet
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {(selectedTenant.documents || []).map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="font-medium text-gray-800 text-sm truncate">
                              {file.title}
                            </div>
                            <div className="text-xs text-gray-400 truncate max-w-[200px]">
                              {file.link}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {file.link &&
                            (file.link.startsWith("http") ? (
                              <a
                                href={file.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                title="Linki Aç"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <button
                                className="p-2 text-gray-400 hover:text-gray-600 cursor-help"
                                onClick={() =>
                                  alert(`Dosya Konumu:\n${file.link}`)
                                }
                              >
                                <AlertCircle className="w-4 h-4" />
                              </button>
                            ))}
                          <button
                            onClick={() => handleDeleteDocument(file.id)}
                            className="p-2 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* YENİ DOSYA EKLEME MODALI */}
      {showAddClientModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Yeni Dosya Ekle
            </h2>
            <form onSubmit={confirmAddClient}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Müvekkil/Kısıtlı Adı
                </label>
                <input
                  autoFocus
                  required
                  type="text"
                  className="w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Örn: Ahmet Yılmaz Terekesi"
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddClientModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTenantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-1 text-gray-800">
              Yeni Kiracı Ekle
            </h2>
            <form onSubmit={handleAddTenant} className="space-y-4 mt-4">
              <input
                required
                type="text"
                placeholder="Ad Soyad"
                className="w-full border border-gray-300 rounded-md p-2"
                value={newTenant.name}
                onChange={(e) =>
                  setNewTenant({ ...newTenant, name: e.target.value })
                }
              />
              <textarea
                placeholder="Adres"
                className="w-full border border-gray-300 rounded-md p-2"
                rows="2"
                value={newTenant.address}
                onChange={(e) =>
                  setNewTenant({ ...newTenant, address: e.target.value })
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={newTenant.startDate}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, startDate: e.target.value })
                  }
                />
                <input
                  required
                  type="number"
                  placeholder="Kira (₺)"
                  className="w-full border border-gray-300 rounded-md p-2"
                  value={newTenant.rentAmount}
                  onChange={(e) =>
                    setNewTenant({ ...newTenant, rentAmount: e.target.value })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="clause"
                  checked={newTenant.hasIncreaseClause}
                  onChange={(e) =>
                    setNewTenant({
                      ...newTenant,
                      hasIncreaseClause: e.target.checked,
                    })
                  }
                />
                <label htmlFor="clause" className="text-sm text-gray-700">
                  Artış maddesi var
                </label>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddTenantModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
