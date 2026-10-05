import React, { useState, useEffect } from "react";
import {
  Box,
  MapPin,
  IndianRupee,
  Info,
  Plus,
  Loader,
  X,
  Trash2,
  User as UserIcon,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";
import { formatCurrency } from "../../utils/currency";

const AssetTracker = () => {
  const [assets, setAssets] = useState([]);
  const [stats, setStats] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editingAssetId, setEditingAssetId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "IT Electronics",
    location: "",
    value: "",
    status: "In Storage",
    employeeId: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // ID of asset being updated

  const resetForm = () => {
    setFormData({
      name: "",
      category: "IT Electronics",
      location: "",
      value: "",
      status: "In Storage",
      employeeId: "",
    });
    setEditingAssetId(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const openEditModal = (asset) => {
    setEditingAssetId(asset.id);
    setFormData({
      name: asset.name || "",
      category: asset.category || "IT Electronics",
      location: asset.location || "",
      value: asset.value != null ? String(asset.value) : "",
      status: asset.status || "In Storage",
      employeeId: asset.employeeId || asset.employee?.id || "",
    });
    setShowModal(true);
  };

  const fetchData = async () => {
    try {
      const [assetRes, statsRes, empRes] = await Promise.all([
        apiClient.get("/assets"),
        apiClient.get("/assets/stats"),
        apiClient.get("/employees"),
      ]);
      setAssets(assetRes.data);
      setStats(statsRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const data = { ...formData, value: parseFloat(formData.value) || 0 };
      if (!data.employeeId) {
        if (editingAssetId) {
          data.employeeId = null;
        } else {
          delete data.employeeId;
        }
      }

      if (editingAssetId) {
        await apiClient.patch(`/assets/${editingAssetId}`, data);
      } else {
        await apiClient.post("/assets", data);
      }

      setShowModal(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error("Failed to save asset", err);
      alert(editingAssetId ? "Failed to update asset" : "Failed to add asset");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/assets/${id}`, { status });
      await fetchData();
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteAsset = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    setActionLoading(id);
    try {
      await apiClient.delete(`/assets/${id}`);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete asset", err);
      alert("Failed to delete asset");
    } finally {
      setActionLoading(null);
    }
  };

  const availableCategories = Array.from(
    new Set(assets.map((asset) => asset.category).filter(Boolean)),
  );

  const filteredAssets = assets.filter((asset) => {
    const statusMatch = statusFilter === "all" || asset.status === statusFilter;
    const categoryMatch =
      categoryFilter === "all" || asset.category === categoryFilter;
    return statusMatch && categoryMatch;
  });
  const hasActiveFilters = statusFilter !== "all" || categoryFilter !== "all";

  if (loading)
    return (
      <div
        style={{
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader className="spinner" size={32} />
      </div>
    );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "20px",
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
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
            Total Inventory Value
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: "800",
              color: "var(--primary)",
            }}
          >
            {formatCurrency(stats?.totalValuation)}
          </div>
        </div>
        <div
          className="glass-card"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
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
            Assets in Use
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800" }}>
            {stats?.inUse || 0}
          </div>
        </div>
        <div
          className="glass-card"
          style={{
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
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
            Maintenance
          </div>
          <div
            style={{ fontSize: "28px", fontWeight: "800", color: "#ef4444" }}
          >
            {stats?.maintenance || 0}
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="btn-primary"
          style={{
            height: "100%",
            borderRadius: "12px",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            padding: "20px",
          }}
        >
          <Plus size={20} /> Add New Asset
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <div
          style={{
            display: "flex",
            gap: "12px",
            flexWrap: "wrap",
            alignItems: "flex-end",
          }}
        >
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
                minWidth: "170px",
              }}
            >
              <option value="all">All Statuses</option>
              {["In Use", "In Storage", "Maintenance", "Disposed"].map(
                (status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ),
              )}
            </select>
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
              FILTER CATEGORY
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: "8px",
                backgroundColor: "var(--input-bg)",
                border: "1px solid var(--border)",
                color: "var(--text-main)",
                fontSize: "13px",
                minWidth: "200px",
              }}
            >
              <option value="all">All Categories</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
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
            {categoryFilter === "all" ? "All Categories" : categoryFilter}
          </strong>
        </div>
      </div>

      {/* Asset Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
        }}
      >
        {filteredAssets.map((asset) => (
          <motion.div
            layout
            key={asset.id}
            className="glass-card"
            style={{
              padding: "24px",
              display: "flex",
              gap: "20px",
              background:
                "linear-gradient(145deg, var(--bg-card), rgba(30, 41, 59, 0.4))",
              border: "1px solid var(--border)",
            }}
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                borderRadius: "14px",
                backgroundColor: "var(--icon-bg)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--primary)",
              }}
            >
              <Box size={28} />
            </div>

            <div style={{ flex: 1 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "8px",
                }}
              >
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700" }}>
                    {asset.name}
                  </h4>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "2px",
                    }}
                  >
                    {asset.category}
                  </p>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <button
                    onClick={() => openEditModal(asset)}
                    disabled={actionLoading === asset.id}
                    title="Edit Asset"
                    style={{ color: "var(--text-muted)", opacity: 0.6 }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "var(--primary)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "var(--text-muted)")
                    }
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => handleDeleteAsset(asset.id)}
                    disabled={actionLoading === asset.id}
                    title="Delete Asset"
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
                  <select
                    value={asset.status}
                    disabled={actionLoading === asset.id}
                    onChange={(e) =>
                      handleUpdateStatus(asset.id, e.target.value)
                    }
                    style={{
                      fontSize: "10px",
                      fontWeight: "900",
                      padding: "4px 8px",
                      borderRadius: "6px",
                      backgroundColor: "var(--input-bg)",
                      color:
                        asset.status === "In Use"
                          ? "#10b981"
                          : asset.status === "Maintenance"
                            ? "#ef4444"
                            : "#f59e0b",
                      border: "1px solid var(--border)",
                      cursor: "pointer",
                      outline: "none",
                      webkitAppearance: "none",
                    }}
                  >
                    {["In Use", "In Storage", "Maintenance", "Disposed"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s.toUpperCase()}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                  padding: "12px",
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderRadius: "10px",
                  marginTop: "4px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                  }}
                >
                  <MapPin size={14} className="text-primary" /> {asset.location}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "var(--text-main)",
                    fontWeight: "700",
                  }}
                >
                  <IndianRupee size={14} className="text-primary" />{" "}
                  {asset.value?.toLocaleString("en-IN")}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                  }}
                >
                  <UserIcon size={14} /> {asset.employee?.name || "Shared"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "var(--primary)",
                    cursor: "pointer",
                  }}
                >
                  {actionLoading === asset.id ? (
                    <Loader size={12} className="spinner" />
                  ) : (
                    <>
                      <Info size={14} /> Details
                    </>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {assets.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "60px",
              textAlign: "center",
              border: "2px dashed var(--border)",
              borderRadius: "24px",
              backgroundColor: "rgba(255,255,255,0.01)",
            }}
          >
            <Box
              size={48}
              style={{
                margin: "0 auto 16px",
                color: "var(--text-muted)",
                opacity: 0.3,
              }}
            />
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                marginBottom: "8px",
              }}
            >
              Asset Inventory Empty
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "14px",
                maxWidth: "300px",
                margin: "0 auto 20px",
              }}
            >
              Register your first asset to start tracking organizational
              resources and valuation.
            </p>
            <button
              onClick={openCreateModal}
              className="btn-info"
              style={{ borderRadius: "8px" }}
            >
              Initialize Inventory
            </button>
          </div>
        )}
        {assets.length > 0 && filteredAssets.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              padding: "60px",
              textAlign: "center",
              border: "2px dashed var(--border)",
              borderRadius: "24px",
              backgroundColor: "rgba(255,255,255,0.01)",
            }}
          >
            <Box
              size={48}
              style={{
                margin: "0 auto 16px",
                color: "var(--text-muted)",
                opacity: 0.3,
              }}
            />
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                marginBottom: "8px",
              }}
            >
              No Matching Assets
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "14px",
                maxWidth: "300px",
                margin: "0 auto",
              }}
            >
              Try changing status or category filters.
            </p>
          </div>
        )}
      </div>

      {/* Add Asset Modal */}
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
                  {editingAssetId ? "Edit Asset" : "Register New Asset"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                >
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
                    Asset Name
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
                      Category
                    </label>
                    <select
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
                    >
                      <option>IT Electronics</option>
                      <option>Furniture</option>
                      <option>Stationery</option>
                      <option>Software Licenses</option>
                    </select>
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
                      Value (₹)
                    </label>
                    <input
                      type="number"
                      value={formData.value}
                      onChange={(e) =>
                        setFormData({ ...formData, value: e.target.value })
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
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Location
                  </label>
                  <input
                    required
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
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
                    Asset Status
                  </label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
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
                    {["In Use", "In Storage", "Maintenance", "Disposed"].map(
                      (status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ),
                    )}
                  </select>
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
                    Assign to Employee (Optional)
                  </label>
                  <select
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
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
                    <option value="">Unassigned</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.department})
                      </option>
                    ))}
                  </select>
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
                  ) : editingAssetId ? (
                    "Save Asset Changes"
                  ) : (
                    "Register Asset"
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

export default AssetTracker;
