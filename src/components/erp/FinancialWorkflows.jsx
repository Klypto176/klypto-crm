import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  FileText,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Loader,
  X,
  Target,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";
import { formatCurrency } from "../../utils/currency";

const FinancialWorkflows = () => {
  const [view, setView] = useState("purchases"); // 'purchases' (PURCHASE_ORDER) or 'invoices' (INVOICE)
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [partnerFilter, setPartnerFilter] = useState("all");
  const [formData, setFormData] = useState({
    referenceNumber: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    status: "Pending",
    partnerId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // ID of transaction being updated

  const fetchData = async () => {
    setLoading(true);
    try {
      const type = view === "purchases" ? "PURCHASE_ORDER" : "INVOICE";
      const partnerType = view === "purchases" ? "VENDOR" : "CUSTOMER";

      const [transRes, statsRes, partnerRes] = await Promise.all([
        apiClient.get(`/finance?type=${type}`),
        apiClient.get("/finance/stats"),
        apiClient.get(`/partners?type=${partnerType}`),
      ]);

      setTransactions(transRes.data);
      setStats(statsRes.data);
      setPartners(partnerRes.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [view]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const type = view === "purchases" ? "PURCHASE_ORDER" : "INVOICE";
      await apiClient.post("/finance", {
        ...formData,
        type,
        amount: parseFloat(formData.amount) || 0,
      });
      setShowModal(false);
      setFormData({
        referenceNumber: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        status: "Pending",
        partnerId: "",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to create transaction", err);
      alert("Failed to create transaction");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/finance/${id}`, { status });
      await fetchData();
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteTransaction = async (id) => {
    if (
      !window.confirm(
        "Delete this financial record? This may affect your analytics and cash flow reports.",
      )
    )
      return;
    setActionLoading(id);
    try {
      await apiClient.delete(`/finance/${id}`);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete record", err);
      alert("Failed to delete record");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
      case "Paid":
      case "Fulfilled":
        return "#10b981";
      case "Pending":
      case "Draft":
        return "#f59e0b";
      case "Overdue":
      case "Rejected":
        return "#ef4444";
      default:
        return "var(--text-muted)";
    }
  };

  const availablePartners = Array.from(
    new Set(transactions.map((item) => item.partner).filter(Boolean)),
  );

  const filteredTransactions = transactions.filter((item) => {
    const statusMatch = statusFilter === "all" || item.status === statusFilter;
    const partnerMatch =
      partnerFilter === "all" || item.partner?.id === partnerFilter;
    return statusMatch && partnerMatch;
  });
  const hasActiveFilters = statusFilter !== "all" || partnerFilter !== "all";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Stats Summary */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "20px",
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background:
              "linear-gradient(135deg, var(--bg-card), rgba(139, 92, 246, 0.1))",
            border: "1px solid rgba(139, 92, 246, 0.2)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "8px",
                textTransform: "uppercase",
                fontWeight: "700",
                letterSpacing: "0.05em",
              }}
            >
              Outstanding Receivables
            </div>
            <div
              style={{ fontSize: "28px", fontWeight: "800", color: "#8b5cf6" }}
            >
              {formatCurrency(stats?.totalReceivables)}
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              backgroundColor: "rgba(139, 92, 246, 0.1)",
              borderRadius: "12px",
              color: "#8b5cf6",
            }}
          >
            <FileText size={32} />
          </div>
        </div>
        <div
          className="glass-card"
          style={{
            padding: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background:
              "linear-gradient(135deg, var(--bg-card), rgba(14, 165, 233, 0.1))",
            border: "1px solid rgba(14, 165, 233, 0.2)",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginBottom: "8px",
                textTransform: "uppercase",
                fontWeight: "700",
                letterSpacing: "0.05em",
              }}
            >
              Pending Payables
            </div>
            <div
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "var(--primary)",
              }}
            >
              {formatCurrency(stats?.totalPayables)}
            </div>
          </div>
          <div
            style={{
              padding: "12px",
              backgroundColor: "rgba(14, 165, 233, 0.1)",
              borderRadius: "12px",
              color: "var(--primary)",
            }}
          >
            <ShoppingCart size={32} />
          </div>
        </div>
      </div>

      <div
        className="erp-finance-switch"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "1px",
          backgroundColor: "var(--border)",
          borderRadius: "16px",
          overflow: "hidden",
          border: "1px solid var(--border)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <button
          onClick={() => setView("purchases")}
          style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            backgroundColor:
              view === "purchases"
                ? "rgba(14, 165, 233, 0.15)"
                : "var(--bg-card)",
            color:
              view === "purchases" ? "var(--primary)" : "var(--text-muted)",
            transition: "all 0.3s ease",
            cursor: "pointer",
            border: "none",
          }}
        >
          <ShoppingCart size={20} />
          <span style={{ fontWeight: "800", fontSize: "15px" }}>
            PURCHASE ORDERS
          </span>
          {view === "purchases" && (
            <motion.div
              layoutId="active-view"
              style={{
                position: "absolute",
                bottom: "4px",
                width: "40px",
                height: "3px",
                backgroundColor: "var(--primary)",
                borderRadius: "2px",
              }}
            />
          )}
        </button>

        <button
          onClick={() => setView("invoices")}
          style={{
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "12px",
            backgroundColor:
              view === "invoices"
                ? "rgba(139, 92, 246, 0.15)"
                : "var(--bg-card)",
            color: view === "invoices" ? "#8b5cf6" : "var(--text-muted)",
            transition: "all 0.3s ease",
            cursor: "pointer",
            border: "none",
          }}
        >
          <FileText size={20} />
          <span style={{ fontWeight: "800", fontSize: "15px" }}>
            SALES INVOICES
          </span>
          {view === "invoices" && (
            <motion.div
              layoutId="active-view"
              style={{
                position: "absolute",
                bottom: "4px",
                width: "40px",
                height: "3px",
                backgroundColor: "#8b5cf6",
                borderRadius: "2px",
              }}
            />
          )}
        </button>
      </div>

      <div
        className="glass-card"
        style={{ padding: "24px", minHeight: "600px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "32px",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "800",
                color: "var(--text-main)",
              }}
            >
              {view === "purchases" ? "Procurement Ledger" : "Revenue Ledger"}
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              Tracking {filteredTransactions.length} active financial
              instruments
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "12px 24px",
            }}
          >
            <Plus size={20} /> New {view === "purchases" ? "PO" : "Invoice"}
          </button>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontWeight: "700",
                  letterSpacing: "0.4px",
                }}
              >
                FILTER STATUS
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-main)",
                  fontSize: "13px",
                  minWidth: "170px",
                }}
              >
                <option value="all">All Statuses</option>
                {[
                  "Draft",
                  "Pending",
                  "Approved",
                  "Paid",
                  "Overdue",
                  "Fulfilled",
                ].map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "4px" }}
            >
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontWeight: "700",
                  letterSpacing: "0.4px",
                }}
              >
                FILTER PARTNER
              </label>
              <select
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-main)",
                  fontSize: "13px",
                  minWidth: "220px",
                }}
              >
                <option value="all">All Partners</option>
                {availablePartners.map((partner) => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setStatusFilter("all");
                  setPartnerFilter("all");
                }}
                style={{
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--border)",
                  backgroundColor: "transparent",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  fontWeight: "700",
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            Showing:{" "}
            <strong>
              {statusFilter === "all" ? "All Statuses" : statusFilter}
            </strong>{" "}
            ·{" "}
            <strong>
              {partnerFilter === "all"
                ? "All Partners"
                : availablePartners.find(
                    (partner) => partner.id === partnerFilter,
                  )?.name || "Selected Partner"}
            </strong>
          </div>
        </div>

        {loading ? (
          <div
            style={{
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Loader className="spinner" size={40} />
          </div>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {filteredTransactions.map((item) => (
              <motion.div
                layout
                key={item.id}
                className="erp-finance-row"
                style={{
                  padding: "18px 24px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "24px",
                  border: "1px solid var(--border)",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.04)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.backgroundColor =
                    "rgba(255,255,255,0.02)")
                }
              >
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "12px",
                    backgroundColor: "var(--input-bg)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: view === "purchases" ? "var(--primary)" : "#8b5cf6",
                    border: "1px solid var(--border)",
                  }}
                >
                  {view === "purchases" ? (
                    <ArrowUpRight size={22} />
                  ) : (
                    <ArrowDownLeft size={22} />
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: "800",
                        fontSize: "16px",
                        color: "var(--text-main)",
                      }}
                    >
                      {item.referenceNumber}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "var(--text-muted)",
                        backgroundColor: "var(--tag-bg)",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {new Date(item.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      fontWeight: "500",
                    }}
                  >
                    {item.partner?.name || "Independent Transaction"}
                  </div>
                </div>

                <div style={{ textAlign: "right", minWidth: "160px" }}>
                  <div
                    style={{
                      fontWeight: "900",
                      fontSize: "18px",
                      marginBottom: "6px",
                      color: "var(--text-main)",
                    }}
                  >
                    {formatCurrency(item.amount, { paise: true })}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      justifyContent: "flex-end",
                    }}
                  >
                    {actionLoading === item.id && (
                      <Loader size={14} className="spinner" />
                    )}
                    <button
                      onClick={() => handleDeleteTransaction(item.id)}
                      disabled={actionLoading === item.id}
                      title="Archived Record"
                      style={{ color: "var(--text-muted)", opacity: 0.5 }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#ef4444")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "var(--text-muted)")
                      }
                    >
                      <Trash2 size={16} />
                    </button>
                    <select
                      value={item.status}
                      disabled={actionLoading === item.id}
                      onChange={(e) =>
                        handleUpdateStatus(item.id, e.target.value)
                      }
                      style={{
                        fontSize: "10px",
                        fontWeight: "900",
                        padding: "4px 8px",
                        borderRadius: "6px",
                        backgroundColor: "var(--input-bg)",
                        color: getStatusColor(item.status),
                        border: "1px solid var(--border)",
                        cursor: "pointer",
                        outline: "none",
                        textAlign: "center",
                      }}
                    >
                      {[
                        "Draft",
                        "Pending",
                        "Approved",
                        "Paid",
                        "Overdue",
                        "Fulfilled",
                      ].map((s) => (
                        <option key={s} value={s}>
                          {s.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </motion.div>
            ))}
            {transactions.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 40px",
                  color: "var(--text-muted)",
                  border: "1px dashed var(--border)",
                  borderRadius: "20px",
                }}
              >
                <AlertCircle
                  size={48}
                  style={{ margin: "0 auto 16px", opacity: 0.2 }}
                />
                <h4 style={{ fontWeight: "700", marginBottom: "8px" }}>
                  No Transactions Found
                </h4>
                <p style={{ fontSize: "13px" }}>
                  Start by creating your first{" "}
                  {view === "purchases" ? "purchase order" : "sales invoice"}.
                </p>
              </div>
            )}
            {transactions.length > 0 && filteredTransactions.length === 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "80px 40px",
                  color: "var(--text-muted)",
                  border: "1px dashed var(--border)",
                  borderRadius: "20px",
                }}
              >
                <AlertCircle
                  size={48}
                  style={{ margin: "0 auto 16px", opacity: 0.2 }}
                />
                <h4 style={{ fontWeight: "700", marginBottom: "8px" }}>
                  No Matching Transactions
                </h4>
                <p style={{ fontSize: "13px" }}>
                  Try changing status or partner filters.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showModal && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card"
              style={{ width: "100%", maxWidth: "500px", padding: "32px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                }}
              >
                <h2 style={{ fontSize: "20px", fontWeight: "800" }}>
                  Create New{" "}
                  {view === "purchases" ? "Purchase Order" : "Invoice"}
                </h2>
                <button onClick={() => setShowModal(false)}>
                  <X size={20} style={{ color: "var(--text-main)" }} />
                </button>
              </div>
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Reference Number
                  </label>
                  <input
                    required
                    placeholder={
                      view === "purchases" ? "PO-2024-001" : "INV-2024-001"
                    }
                    value={formData.referenceNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        referenceNumber: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Select {view === "purchases" ? "Vendor" : "Customer"}
                  </label>
                  <select
                    required
                    value={formData.partnerId}
                    onChange={(e) =>
                      setFormData({ ...formData, partnerId: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                    }}
                  >
                    <option value="">Select Partner</option>
                    {partners.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                      }}
                    >
                      Amount (₹)
                    </label>
                    <input
                      required
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                      }}
                    >
                      Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        backgroundColor: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text-main)",
                      }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    marginTop: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {submitting ? (
                    <Loader size={18} className="spinner" />
                  ) : (
                    "Create Record"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinancialWorkflows;
