import React, { useState, useEffect } from "react";
import {
  Building2,
  MapPin,
  Hash,
  Globe,
  Mail,
  Phone,
  Save,
  Loader,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";

const OrgSetup = () => {
  const editableKeys = [
    "name",
    "registrationNumber",
    "website",
    "primaryEmail",
    "phoneNumber",
    "taxId",
    "address",
  ];

  const [profile, setProfile] = useState({
    name: "",
    registrationNumber: "",
    website: "",
    primaryEmail: "",
    phoneNumber: "",
    taxId: "",
    address: "",
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, statsRes] = await Promise.all([
        apiClient.get("/organizations/profile"),
        apiClient.get("/organizations/stats"),
      ]);
      setProfile(profileRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch organization data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = editableKeys.reduce((acc, key) => {
        const value = profile?.[key];
        if (value === undefined || value === null) return acc;
        acc[key] = typeof value === "string" ? value.trim() : value;
        return acc;
      }, {});

      await apiClient.patch("/organizations/profile", payload);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      fetchData();
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader className="spinner" size={48} />
      </div>
    );
  }

  return (
    <div
      className="erp-org-setup"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Organization Details */}
      <div
        className="glass-card"
        style={{ padding: "32px", position: "relative" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: "32px",
          }}
        >
          <div>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: "800",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Building2 size={24} className="text-primary" /> Corporate
              Identity
            </h3>
            <p
              style={{
                fontSize: "12px",
                color: "var(--text-muted)",
                marginTop: "4px",
              }}
            >
              Manage your official business profile and registration details.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 24px",
            }}
          >
            {saving ? (
              <Loader size={18} className="spinner" />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>

        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                position: "absolute",
                top: "80px",
                right: "32px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                color: "#10b981",
                fontSize: "13px",
                fontWeight: "700",
              }}
            >
              <CheckCircle2 size={16} /> Profile updated successfully
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className="responsive-grid-2 erp-org-fields"
          style={{ display: "grid", gap: "24px" }}
        >
          {[
            {
              label: "Organization Name",
              icon: <Building2 size={16} />,
              key: "name",
            },
            {
              label: "Registration Number",
              icon: <Hash size={16} />,
              key: "registrationNumber",
            },
            {
              label: "Official Website",
              icon: <Globe size={16} />,
              key: "website",
            },
            {
              label: "Primary Contact Email",
              icon: <Mail size={16} />,
              key: "primaryEmail",
            },
            {
              label: "Corporate Phone",
              icon: <Phone size={16} />,
              key: "phoneNumber",
            },
            {
              label: "Tax ID / GST Number",
              icon: <Hash size={16} />,
              key: "taxId",
            },
          ].map((field) => (
            <div
              key={field.key}
              style={{ display: "flex", flexDirection: "column", gap: "10px" }}
            >
              <label
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {field.label}
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-muted)",
                    opacity: 0.7,
                  }}
                >
                  {field.icon}
                </span>
                <input
                  type="text"
                  value={profile[field.key] || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, [field.key]: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px 14px 12px 42px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: "10px",
                    color: "var(--text-main)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) =>
                    (e.target.style.borderColor = "var(--primary)")
                  }
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div
        className="responsive-grid-2 erp-org-bottom"
        style={{ display: "grid", gap: "24px" }}
      >
        <div className="glass-card" style={{ padding: "32px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <MapPin size={22} className="text-primary" /> Registered Address
          </h3>
          <textarea
            value={profile.address || ""}
            onChange={(e) =>
              setProfile({ ...profile, address: e.target.value })
            }
            style={{
              width: "100%",
              padding: "16px",
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border)",
              borderRadius: "10px",
              color: "var(--text-main)",
              fontSize: "14px",
              minHeight: "140px",
              outline: "none",
              resize: "none",
            }}
            placeholder="Enter full legal address of the organization headquarters..."
          />
        </div>

        <div className="glass-card" style={{ padding: "32px" }}>
          <h4
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "24px",
            }}
          >
            Organizational Footprint
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            {[
              {
                label: "Total Headcount",
                value: stats?.employees || 0,
                color: "var(--primary)",
              },
              {
                label: "Operating Branches",
                value: stats?.branches || 0,
                color: "var(--primary)",
              },
              {
                label: "Active Departments",
                value: stats?.departments || 0,
                color: "var(--primary)",
              },
              {
                label: "Tracked Assets",
                value: stats?.totalAssets || 0,
                color: "#10b981",
              },
              {
                label: "Active Projects",
                value: stats?.totalProjects || 0,
                color: "#8b5cf6",
              },
              {
                label: "System Health",
                value: stats?.systemHealth || "100%",
                color: "#0ea5e9",
              },
            ].map((s, i) => (
              <div
                key={i}
                style={{
                  padding: "16px",
                  backgroundColor: "var(--tag-bg)",
                  borderRadius: "12px",
                  border: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "11px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontWeight: "800",
                    fontSize: "24px",
                    color: s.color,
                  }}
                >
                  {s.value}
                </div>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: "24px",
              padding: "16px",
              backgroundColor: "rgba(16, 185, 129, 0.05)",
              borderRadius: "10px",
              border: "1px dashed #10b981",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                Data Security Index
              </span>
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: "800",
                  color: "#10b981",
                }}
              >
                {stats?.securityIndex || "98.5%"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrgSetup;
