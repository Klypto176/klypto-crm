import React, { useState, useEffect } from "react";
import { useLayout } from "../hooks/useLayout";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  TrendingUp,
  Users,
  IndianRupee,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Users2,
  CalendarCheck2,
  Clock3,
  Wallet2,
  Loader,
  PieChart,
} from "lucide-react";
import {
  DASHBOARD_MODULES,
  getAccessibleModules,
  hasModuleAccess,
} from "../utils/access";
import apiClient from "../api/apiClient";
import Skeleton from "../components/common/Skeleton";
import { formatCurrency } from "../utils/currency";

// Fixed, non-uniform heights so the loading bars look natural without calling
// Math.random() during render (React flags impure calls in render as a bug risk).
const SKELETON_BAR_HEIGHTS = [
  [72, 24], [88, 42], [55, 30], [95, 48], [62, 20], [78, 36],
];

const DashboardSkeleton = () => (
  <div style={{ animation: "fadeIn 0.5s ease" }}>
    <header style={{ marginBottom: "32px" }}>
      <Skeleton height="32px" width="300px" style={{ marginBottom: "12px" }} />
      <Skeleton height="20px" width="100%" maxWidth="500px" />
    </header>

    <div
      className="glass-card"
      style={{
        padding: "16px 20px",
        marginBottom: "24px",
        display: "flex",
        gap: "10px",
      }}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} height="30px" width="100px" borderRadius="999px" />
      ))}
    </div>

    <div style={{ marginBottom: "40px" }}>
      <Skeleton height="24px" width="200px" style={{ marginBottom: "20px" }} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="glass-card" style={{ padding: "24px", flex: 1, minWidth: "240px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
              <Skeleton circle height="48px" />
              <Skeleton height="20px" width="40px" />
            </div>
            <Skeleton height="14px" width="100px" style={{ marginBottom: "8px" }} />
            <Skeleton height="32px" width="60px" style={{ marginBottom: "8px" }} />
            <Skeleton height="12px" width="80px" />
          </div>
        ))}
      </div>
    </div>

    <div className="responsive-grid-2" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
      <div className="glass-card" style={{ padding: "24px", minHeight: "350px" }}>
        <Skeleton height="24px" width="150px" style={{ marginBottom: "20px" }} />
        <div style={{ display: "flex", alignItems: "flex-end", gap: "10px", height: "200px", paddingBottom: "20px" }}>
          {SKELETON_BAR_HEIGHTS.map(([tall, short], i) => (
            <div key={i} style={{ flex: 1, display: "flex", alignItems: "flex-end", gap: "4px", height: "100%" }}>
              <Skeleton height={`${tall}%`} style={{ opacity: 0.5 }} />
              <Skeleton height={`${short}%`} style={{ opacity: 0.3 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="glass-card" style={{ padding: "24px" }}>
        <Skeleton height="24px" width="180px" style={{ marginBottom: "20px" }} />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", paddingBottom: "16px", marginBottom: "16px", borderBottom: i < 4 ? "1px solid var(--border)" : "none" }}>
            <Skeleton circle height="40px" />
            <div style={{ flex: 1 }}>
              <Skeleton height="14px" width="120px" style={{ marginBottom: "6px" }} />
              <Skeleton height="12px" width="80px" />
            </div>
            <div style={{ textAlign: "right" }}>
              <Skeleton height="14px" width="60px" style={{ marginBottom: "6px" }} />
              <Skeleton height="10px" width="40px" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const StatCard = ({ title, value, change, icon, isPositive, trend }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="glass-card"
    style={{ padding: "24px", flex: 1, minWidth: "240px" }}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "16px",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          backgroundColor: "var(--icon-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--primary)",
        }}
      >
        {icon}
      </div>
      {change && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            color: isPositive ? "#10b981" : "#ef4444",
            fontSize: "14px",
            fontWeight: "600",
          }}
        >
          {isPositive ? (
            <ArrowUpRight size={16} />
          ) : (
            <ArrowDownRight size={16} />
          )}
          {change}
        </div>
      )}
    </div>
    <div
      style={{
        fontSize: "14px",
        color: "var(--text-muted)",
        marginBottom: "4px",
      }}
    >
      {title}
    </div>
    <div style={{ fontSize: "28px", fontWeight: "700", marginBottom: "4px" }}>
      {value}
    </div>
    {trend && (
      <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
        {trend}
      </div>
    )}
  </motion.div>
);

const Dashboard = () => {
  // Ensure layout shell loads instantly
  useLayout();
  const { user } = useSelector((state) => state.auth);
  const [hrmsStats, setHrmsStats] = useState(null);
  const [crmStats, setCrmStats] = useState(null);
  const [erpStats, setErpStats] = useState(null);
  const [recentLeads, setRecentLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const access = user?.access;
  const accessibleModules = getAccessibleModules(access);

  const toNumber = (value) => {
    const normalized = Number(value);
    return Number.isFinite(normalized) ? normalized : 0;
  };

  const revenueFlowData =
    erpStats?.performance?.length > 0
      ? erpStats.performance.map((item) => ({
          label: item.label || item.month || item.name || "-",
          sales: toNumber(item.sales ?? item.revenue ?? item.totalSales),
          cost: toNumber(item.cost ?? item.expense ?? item.totalCost),
        }))
      : [];

  const maxRevenueValue = Math.max(
    1,
    ...revenueFlowData.flatMap((item) => [item.sales, item.cost]),
  );

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [hrmsRes, crmRes, recentRes, erpRes] = await Promise.all([
          apiClient.get("/hrms-overview/stats"),
          apiClient.get("/crm-overview/stats"),
          apiClient.get("/crm-overview/recent"),
          apiClient.get("/erp-overview/stats"),
        ]);
        setHrmsStats(hrmsRes.data);
        setCrmStats(crmRes.data);
        setRecentLeads(recentRes.data);
        setErpStats(erpRes.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <header style={{ marginBottom: "32px" }}>
        <h1
          style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}
        >
          Executive Dashboard
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Welcome back, {user?.fullName || "there"}. Your organization is
          currently powered by live data sync.
        </p>
      </header>

      <div
        className="glass-card"
        style={{
          padding: "16px 20px",
          marginBottom: "24px",
          display: "flex",
          flexWrap: "wrap",
          gap: "10px",
          alignItems: "center",
        }}
      >
        <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>
          Modules Online:
        </span>
        {accessibleModules.map((moduleKey) => {
          const module = DASHBOARD_MODULES.find(
            (item) => item.key === moduleKey,
          );
          return (
            <Link
              key={moduleKey}
              to={module?.route || "/"}
              style={{
                padding: "6px 14px",
                borderRadius: "999px",
                backgroundColor: "var(--tag-bg)",
                color: "var(--text-main)",
                fontSize: "12px",
                textDecoration: "none",
                border: "1px solid var(--border)",
                fontWeight: "600",
              }}
            >
              {module?.label || moduleKey}
            </Link>
          );
        })}
      </div>

      {/* CRM Pipeline Stats */}
      {(hasModuleAccess(access, "leads") ||
        hasModuleAccess(access, "pipeline")) && (
        <div style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "16px",
            }}
          >
            Sales Pipeline Summary
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "24px" }}>
            <StatCard
              title="Total Leads"
              value={crmStats?.totalLeads || 0}
              trend="Total generated"
              icon={<Users size={24} />}
              isPositive={true}
            />
            <StatCard
              title="Active Deals"
              value={crmStats?.activeDeals || 0}
              trend="In mid-pipeline"
              icon={<Target size={24} />}
              isPositive={true}
            />
            <StatCard
              title="Pipeline Value"
              value={crmStats?.totalRevenue || formatCurrency(0)}
              trend="Estimated potential"
              icon={<IndianRupee size={24} />}
              isPositive={true}
            />
            <StatCard
              title="Conversion"
              value={crmStats?.conversionRate || "0%"}
              trend="Rate of Won deals"
              icon={<TrendingUp size={24} />}
              isPositive={true}
            />
          </div>
        </div>
      )}

      {/* HR Stats */}
      {(hasModuleAccess(access, "hrms") ||
        hasModuleAccess(access, "employees")) && (
        <div style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "16px",
            }}
          >
            HR People Operations
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            <StatCard
              title="Total Headcount"
              value={hrmsStats?.totalEmployees || 0}
              trend="Active staff roster"
              icon={<Users2 size={24} />}
              isPositive={true}
            />
            <StatCard
              title="Attendance Rate"
              value={hrmsStats?.attendanceRate || "0%"}
              trend="Staff present today"
              icon={<Clock3 size={24} />}
              isPositive={true}
            />
            <StatCard
              title="Pending Leaves"
              value={hrmsStats?.pendingLeaves || 0}
              trend="Urgent approvals needed"
              icon={<CalendarCheck2 size={24} />}
              isPositive={false}
            />
            <StatCard
              title="Payroll Readiness"
              value={hrmsStats?.payrollReady || "0%"}
              trend="Salary templates set"
              icon={<Wallet2 size={24} />}
              isPositive={true}
            />
          </div>
        </div>
      )}

      {/* ERP Financial Oversight */}
      {hasModuleAccess(access, "erp") && (
        <div style={{ marginBottom: "40px" }}>
          <h2
            style={{
              fontSize: "18px",
              fontWeight: "700",
              marginBottom: "16px",
            }}
          >
            Financial Oversight (ERP)
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "24px",
            }}
          >
            <StatCard
              title="Total Sales"
              value={formatCurrency(erpStats?.totalSales)}
              trend="Invoiced Revenue"
              icon={<IndianRupee size={24} />}
              isPositive={true}
            />
            <StatCard
              title="Operational Cost"
              value={formatCurrency(erpStats?.operationalCost)}
              trend="Purchases + Payroll"
              icon={<Wallet2 size={24} />}
              isPositive={false}
            />
            <StatCard
              title="Net Profit"
              value={formatCurrency(erpStats?.netProfit)}
              trend="Sales minus Costs"
              icon={<TrendingUp size={24} />}
              isPositive={erpStats?.netProfit >= 0}
            />
            <StatCard
              title="Asset Valuation"
              value={formatCurrency(erpStats?.assetValuation)}
              trend="Capital Equipment"
              icon={<PieChart size={24} />}
              isPositive={true}
            />
          </div>
        </div>
      )}

      {/* Dashboard Visuals */}
      <div
        className="responsive-grid-2"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "24px",
        }}
      >
        <div
          className="glass-card"
          style={{ padding: "24px", minHeight: "350px" }}
        >
          <h3
            style={{
              marginBottom: "20px",
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            Revenue Flow
          </h3>
          {revenueFlowData.length > 0 ? (
            <>
              <div
                style={{
                  height: "220px",
                  width: "100%",
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "10px",
                  paddingBottom: "20px",
                }}
              >
                {revenueFlowData.map((item, i) => {
                  const salesHeight =
                    item.sales > 0
                      ? Math.max((item.sales / maxRevenueValue) * 100, 8)
                      : 2;
                  const costHeight =
                    item.cost > 0
                      ? Math.max((item.cost / maxRevenueValue) * 100, 8)
                      : 2;
                  return (
                    <div
                      key={`${item.label}-${i}`}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "4px",
                        height: "100%",
                      }}
                    >
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${salesHeight}%` }}
                        transition={{ delay: i * 0.08, duration: 0.7 }}
                        title={`${item.label} Sales: ${formatCurrency(item.sales)}`}
                        style={{
                          flex: 1,
                          background:
                            "linear-gradient(to top, #0ea5e9, #38bdf8)",
                          borderRadius: "6px 6px 0 0",
                          opacity: 0.9,
                        }}
                      />
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: `${costHeight}%` }}
                        transition={{ delay: i * 0.08 + 0.04, duration: 0.7 }}
                        title={`${item.label} Cost: ${formatCurrency(item.cost)}`}
                        style={{
                          flex: 1,
                          background:
                            "linear-gradient(to top, #f43f5e, #fb7185)",
                          borderRadius: "6px 6px 0 0",
                          opacity: 0.85,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "18px",
                  marginBottom: "10px",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                }}
              >
                <span
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#38bdf8",
                    }}
                  />
                  Sales
                </span>
                <span
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      borderRadius: "2px",
                      background: "#fb7185",
                    }}
                  />
                  Cost
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                  paddingTop: "12px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                {revenueFlowData.map((item) => (
                  <span key={item.label}>{item.label}</span>
                ))}
              </div>
            </>
          ) : (
            <div
              style={{
                minHeight: "220px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                border: "1px dashed var(--border)",
                borderRadius: "12px",
              }}
            >
              No revenue trend data available yet.
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: "24px" }}>
          <h3
            style={{
              marginBottom: "20px",
              fontSize: "18px",
              fontWeight: "700",
            }}
          >
            Recent Lead Activity
          </h3>
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            {recentLeads.length === 0 ? (
              <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
                No recent activity to show.
              </div>
            ) : (
              recentLeads.map((lead, i) => (
                <div
                  key={lead.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    paddingBottom: "16px",
                    borderBottom:
                      i !== recentLeads.length - 1
                        ? "1px solid var(--border)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "10px",
                      backgroundColor: "var(--primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "bold",
                      color: "var(--text-main)",
                    }}
                  >
                    {lead.name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>
                      {lead.name}
                    </div>
                    <div
                      style={{ fontSize: "12px", color: "var(--text-muted)" }}
                    >
                      {lead.company || "Individual"}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "14px", fontWeight: "600" }}>
                      {formatCurrency(lead.value)}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#10b981",
                        fontWeight: "700",
                      }}
                    >
                      {lead.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
