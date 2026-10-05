import React, { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Wallet2,
  PieChart,
  BarChart,
  Loader,
  AlertTriangle,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { formatCurrency as fmt } from "../../utils/currency";

const ERPAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/erp-overview/stats");
      setData(res.data);
    } catch (err) {
      console.error("Failed to fetch ERP stats", err);
      setError("Failed to load real-time analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading) return <div style={{ height: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader className="spinner" size={40} /></div>;

  if (error) return (
    <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "#ef4444", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <AlertTriangle size={40} />
      <p style={{ fontWeight: "700" }}>{error}</p>
      <button onClick={fetchStats} className="btn-secondary" style={{ padding: "8px 24px" }}>Retry</button>
    </div>
  );

  const stats = [
    {
      label: "Total Sales",
      value: fmt(data.totalSales),
      icon: <IndianRupee size={20} />,
      color: "#10b981",
      trend: "Actual",
      up: true,
    },
    {
      label: "Operational Cost",
      value: fmt(data.operationalCost),
      icon: <Wallet2 size={20} />,
      color: "#ef4444",
      trend: "Calculated",
      up: false,
    },
    {
      label: "Net Profit",
      value: fmt(data.netProfit),
      icon: <TrendingUp size={20} />,
      color: "#0ea5e9",
      trend: "Net",
      up: data.netProfit >= 0,
    },
    {
      label: "Asset Valuation",
      value: fmt(data.assetValuation),
      icon: <PieChart size={20} />,
      color: "#8b5cf6",
      trend: "Inventory",
      up: true,
    },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Financial Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
        }}
      >
        {stats.map((stat, i) => (
          <div key={i} className="glass-card" style={{ padding: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  padding: "10px",
                  backgroundColor: `${stat.color}15`,
                  color: stat.color,
                  borderRadius: "10px",
                }}
              >
                {stat.icon}
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "12px",
                  fontWeight: "700",
                  color: stat.up ? "#10b981" : "#ef4444",
                }}
              >
                {stat.up ? (
                  <TrendingUp size={14} />
                ) : (
                  <TrendingDown size={14} />
                )}{" "}
                {stat.trend}
              </div>
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "14px",
                marginBottom: "4px",
              }}
            >
              {stat.label}
            </p>
            <h3 style={{ fontSize: "28px", fontWeight: "800" }}>
              {stat.value}
            </h3>
          </div>
        ))}
      </div>

      <div
        className="erp-analytics-main"
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}
      >
        {/* Real Performance Chart */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <div
            className="erp-analytics-header"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            <div>
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>
                Monthly Financial Performance
              </h3>
              <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sales vs Costs (Last 6 Months)</p>
            </div>
          </div>

          <div
            style={{
              height: "300px",
              display: "flex",
              alignItems: "flex-end",
              gap: "20px",
              padding: "0 20px",
            }}
          >
            {data.performance.map((m, i) => {
               // Calculate bar heights relative to max value
               const max = Math.max(...data.performance.map(p => Math.abs(p.sales), ...data.performance.map(p => Math.abs(p.cost)), 1));
               const salesH = (Math.abs(m.sales) / max) * 100;
               const costH = (Math.abs(m.cost) / max) * 100;

               return (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    height: "100%",
                    justifyContent: "flex-end"
                  }}
                >
                  <div style={{ display: "flex", gap: "4px", width: "100%", height: "100%", alignItems: "flex-end" }}>
                    <div
                      title={`Sales: ${fmt(m.sales)}`}
                      style={{
                        flex: 1,
                        height: `${salesH}%`,
                        background: "linear-gradient(to top, #10b981, #34d399)",
                        borderRadius: "4px 4px 0 0",
                        minHeight: m.sales > 0 ? "4px" : "0"
                      }}
                    />
                    <div
                      title={`Cost: ${fmt(m.cost)}`}
                      style={{
                        flex: 1,
                        height: `${costH}%`,
                        background: "linear-gradient(to top, #ef4444, #f87171)",
                        borderRadius: "4px 4px 0 0",
                        minHeight: m.cost > 0 ? "4px" : "0"
                      }}
                    />
                  </div>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--text-muted)" }}>
                    {m.label}
                  </span>
                </div>
               );
            })}
          </div>
          
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginTop: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#10b981" }} /> Sales
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-muted)" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: "#ef4444" }} /> Costs
            </div>
          </div>
        </div>

        {/* Operational Breakdown Card */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "24px",
            }}
          >
            Activity Breakdown
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {data.breakdown.map((item, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                >
                  <span style={{ color: "var(--text-muted)", fontWeight: "600" }}>
                    {item.label}
                  </span>
                  <span style={{ fontWeight: "800", color: "var(--primary)" }}>{item.count}</span>
                </div>
                <div
                  style={{
                    width: "100%",
                    height: "8px",
                    backgroundColor: "var(--tag-bg)",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${item.val}%`,
                      height: "100%",
                      backgroundColor: "var(--primary)",
                      background: "linear-gradient(to right, var(--primary), #8b5cf6)",
                      borderRadius: "4px",
                    }}
                  ></div>
                </div>
              </div>
            ))}
            
            <div style={{ marginTop: "12px", padding: "16px", backgroundColor: "rgba(var(--primary-rgb), 0.05)", borderRadius: "10px", border: "1px dashed var(--border)" }}>
              <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", lineHeight: "1.5" }}>
                This breakdown tracks the volume of operational records across procurement, payroll, assets, and sales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ERPAnalytics;
