import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Filter,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  Plus,
  Loader,
  X,
  Trash2,
  ChevronRight,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";
import { formatCurrency } from "../../utils/currency";

const getErrorMessage = (error, fallback) => {
  const payload = error?.response?.data;
  if (Array.isArray(payload?.message)) return payload.message.join(", ");
  if (typeof payload?.message === "string") return payload.message;
  if (typeof payload?.error === "string") return payload.error;
  return fallback;
};

const getDefaultPartnerForm = () => ({
  name: "",
  contactPerson: "",
  email: "",
  phone: "",
  status: "Active",
  category: "General",
  creditLimit: 0,
});

const PartnerMaster = () => {
  const [activeSubTab, setActiveSubTab] = useState("customers");
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState(getDefaultPartnerForm());
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // ID of partner being updated
  const [editingPartner, setEditingPartner] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [formError, setFormError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const type = activeSubTab === "customers" ? "CUSTOMER" : "VENDOR";
      const res = await apiClient.get(`/partners?type=${type}`);
      setPartners(res.data);
    } catch (err) {
      console.error("Failed to fetch partners", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);

    const type = activeSubTab === "customers" ? "CUSTOMER" : "VENDOR";
    const payload = {
      ...formData,
      type: editingPartner?.type || type,
      creditLimit: parseFloat(formData.creditLimit) || 0,
    };

    try {
      if (editingPartner?.id) {
        await apiClient.patch(`/partners/${editingPartner.id}`, payload);
      } else {
        await apiClient.post("/partners", payload);
      }

      setShowModal(false);
      setEditingPartner(null);
      setFormData(getDefaultPartnerForm());
      await fetchData();
    } catch (err) {
      setFormError(
        getErrorMessage(
          err,
          editingPartner
            ? "Failed to update partner"
            : "Failed to create partner",
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/partners/${id}`, { status });
      await fetchData();
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeletePartner = async (id) => {
    setActionLoading(id);
    try {
      await apiClient.delete(`/partners/${id}`);
      await fetchData();
    } catch (err) {
      setFormError(getErrorMessage(err, "Failed to delete partner"));
    } finally {
      setActionLoading(null);
      setConfirmDelete(null);
    }
  };

  const openCreateModal = () => {
    setEditingPartner(null);
    setFormError("");
    setFormData(getDefaultPartnerForm());
    setShowModal(true);
  };

  const openEditModal = (partner) => {
    setEditingPartner(partner);
    setFormError("");
    setFormData({
      name: partner.name || "",
      contactPerson: partner.contactPerson || "",
      email: partner.email || "",
      phone: partner.phone || "",
      status: partner.status || "Active",
      category: partner.category || "General",
      creditLimit: partner.creditLimit ?? 0,
    });
    setShowModal(true);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredPartners = partners.filter((partner) => {
    const statusMatch =
      statusFilter === "all" || partner.status === statusFilter;
    const searchMatch =
      !normalizedSearch ||
      partner.name?.toLowerCase().includes(normalizedSearch) ||
      partner.contactPerson?.toLowerCase().includes(normalizedSearch) ||
      partner.email?.toLowerCase().includes(normalizedSearch);
    return statusMatch && searchMatch;
  });
  const hasActiveFilters = Boolean(normalizedSearch) || statusFilter !== "all";

  return (
    <div className="glass-card erp-partner-master" style={{ padding: "24px" }}>
      <div
        className="erp-partner-toolbar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", flexDir: "column", gap: "4px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "800" }}>
            Partner Ecosystem
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Centralized database for stakeholders.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <div
            className="erp-partner-tabs"
            style={{
              display: "flex",
              gap: "4px",
              backgroundColor: "var(--tag-bg)",
              padding: "4px",
              borderRadius: "10px",
            }}
          >
            {["customers", "vendors"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  fontWeight: "600",
                  backgroundColor:
                    activeSubTab === tab ? "var(--primary)" : "transparent",
                  color: activeSubTab === tab ? "white" : "var(--text-muted)",
                  transition: "all 0.2s",
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
          <button
            onClick={openCreateModal}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={18} /> Add{" "}
            {activeSubTab === "customers" ? "Customer" : "Vendor"}
          </button>
        </div>
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
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              minWidth: "220px",
              flex: "1 1 240px",
            }}
          >
            <label
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: "700",
                letterSpacing: "0.4px",
              }}
            >
              SEARCH {activeSubTab === "customers" ? "CUSTOMERS" : "VENDORS"}
            </label>
            <div style={{ position: "relative" }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                type="text"
                placeholder="Name, contact, email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 10px 10px 34px",
                  borderRadius: "8px",
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-main)",
                  fontSize: "13px",
                }}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
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
                minWidth: "160px",
              }}
            >
              <option value="all">All Statuses</option>
              {["Active", "Inactive", "Blocked"].map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
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
            {normalizedSearch ? `Search "${searchTerm}"` : "No Search"}
          </strong>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        {loading ? (
          <div
            style={{
              height: "300px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Loader className="spinner" size={32} />
          </div>
        ) : (
          <table
            style={{
              width: "100%",
              borderCollapse: "separate",
              borderSpacing: "0 8px",
            }}
          >
            <thead>
              <tr>
                {[
                  `Name (${filteredPartners.length})`,
                  "Contact Person",
                  "Identity",
                  "Status",
                  activeSubTab === "customers" ? "Credit Limit" : "Category",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "0 16px 8px",
                      color: "var(--text-muted)",
                      fontSize: "11px",
                      fontWeight: "700",
                      textAlign: "left",
                      textTransform: "uppercase",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredPartners.map((partner) => (
                <tr
                  key={partner.id}
                  className="table-row-hover"
                  style={{
                    backgroundColor: "var(--tag-bg)",
                    transition: "all 0.2s",
                  }}
                >
                  <td
                    style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}
                  >
                    <div
                      style={{
                        fontWeight: "700",
                        fontSize: "14px",
                        color: "var(--text-main)",
                      }}
                    >
                      {partner.name}
                    </div>
                    <div
                      style={{ fontSize: "11px", color: "var(--text-muted)" }}
                    >
                      ID: {partner.id.substring(0, 8)}
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div style={{ fontSize: "13px", fontWeight: "600" }}>
                      {partner.contactPerson}
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        gap: "10px",
                        color: "var(--text-muted)",
                      }}
                    >
                      <Mail size={14} title={partner.email} />{" "}
                      <Phone size={14} title={partner.phone} />
                    </div>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {actionLoading === partner.id && (
                        <Loader size={12} className="spinner" />
                      )}
                      <select
                        value={partner.status}
                        disabled={actionLoading === partner.id}
                        onChange={(e) =>
                          handleUpdateStatus(partner.id, e.target.value)
                        }
                        style={{
                          padding: "4px 8px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "800",
                          backgroundColor: "var(--input-bg)",
                          color:
                            partner.status === "Active" ? "#10b981" : "#ef4444",
                          border: "none",
                          cursor: "pointer",
                          outline: "none",
                        }}
                      >
                        {["Active", "Inactive", "Blocked"].map((s) => (
                          <option key={s} value={s}>
                            {s.toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      fontSize: "14px",
                      fontWeight: "700",
                    }}
                  >
                    {activeSubTab === "customers"
                      ? formatCurrency(partner.creditLimit)
                      : partner.category}
                  </td>
                  <td
                    style={{
                      padding: "16px",
                      borderRadius: "0 12px 12px 0",
                      textAlign: "right",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        justifyContent: "flex-end",
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={() => setConfirmDelete(partner)}
                        disabled={actionLoading === partner.id}
                        style={{ color: "var(--text-muted)", opacity: 0.6 }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.color = "#ef4444")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = "var(--text-muted)")
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                      <button
                        style={{ color: "var(--text-muted)" }}
                        onClick={() => openEditModal(partner)}
                        title="View / Edit Partner"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {partners.length > 0 && filteredPartners.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "24px",
                      textAlign: "center",
                      color: "var(--text-muted)",
                      fontStyle: "italic",
                    }}
                  >
                    No partners match the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Partner Modal */}
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
              style={{ width: "100%", maxWidth: "550px", padding: "32px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "24px",
                }}
              >
                <h2 style={{ fontSize: "20px", fontWeight: "800" }}>
                  {editingPartner
                    ? "View / Edit Partner"
                    : `Create New ${
                        activeSubTab === "customers" ? "Customer" : "Vendor"
                      }`}
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
                {formError && (
                  <div
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(239, 68, 68, 0.5)",
                      color: "#fda4af",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    {formError}
                  </div>
                )}

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Company / Partner Name
                  </label>
                  <input
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
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
                      Contact Person
                    </label>
                    <input
                      required
                      value={formData.contactPerson}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contactPerson: e.target.value,
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
                      Category
                    </label>
                    <input
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
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
                      Email
                    </label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
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
                      Phone
                    </label>
                    <input
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
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
                {activeSubTab === "customers" && (
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                      }}
                    >
                      Credit Limit (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.creditLimit}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          creditLimit: e.target.value,
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
                )}
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
                  ) : editingPartner ? (
                    "Update Partner"
                  ) : (
                    "Save Partner"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {confirmDelete && (
          <div
            className="modal-overlay"
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1100,
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card"
              style={{ width: "100%", maxWidth: "430px", padding: "24px" }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "800",
                  marginBottom: "10px",
                }}
              >
                Delete partner profile?
              </h3>
              <p
                style={{
                  color: "var(--text-muted)",
                  fontSize: "13px",
                  marginBottom: "18px",
                }}
              >
                Transactions under this partner may be affected.
              </p>
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  className="btn-secondary"
                  onClick={() => setConfirmDelete(null)}
                  disabled={actionLoading === confirmDelete.id}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={() => handleDeletePartner(confirmDelete.id)}
                  disabled={actionLoading === confirmDelete.id}
                >
                  {actionLoading === confirmDelete.id
                    ? "Deleting..."
                    : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PartnerMaster;
