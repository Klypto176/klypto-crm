import React, { useEffect, useState } from "react";
import {
  Briefcase,
  Users,
  FileSearch,
  LayoutDashboard,
  GraduationCap,
  Plus,
  Search,
  Pencil,
  MapPin,
  IndianRupee,
  Calendar,
  Star,
  Clock,
  Loader,
  XCircle,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";

const RecruitmentAssessment = () => {
  const [activeSubView, setActiveSubView] = useState("jobs");
  const [isAddingJob, setIsAddingJob] = useState(false);
  const [isEditingJob, setIsEditingJob] = useState(false);
  const [editJobId, setEditJobId] = useState(null);
  const [editJobFormData, setEditJobFormData] = useState({
    title: "",
    department: "",
    description: "",
    ctcMin: "",
    ctcMax: "",
    jobType: "Full-time",
    location: "",
    status: "Active",
  });
  const openEditJob = (job) => {
    setEditJobId(job.id);
    setEditJobFormData({
      title: job.title,
      department: job.department,
      description: job.description,
      ctcMin: job.ctcMin,
      ctcMax: job.ctcMax,
      jobType: job.jobType,
      location: job.location,
      status: job.status,
    });
    setIsEditingJob(true);
  };

  const handleEditJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.patch(`/recruitment/jobs/${editJobId}`, editJobFormData);
      setIsEditingJob(false);
      setEditJobId(null);
      setEditJobFormData({
        title: "",
        department: "",
        description: "",
        ctcMin: "",
        ctcMax: "",
        jobType: "Full-time",
        location: "",
        status: "Active",
      });
      fetchJobs();
    } catch (err) {
      console.error("Failed to update job", err);
      alert("Failed to update job");
    } finally {
      setSubmitting(false);
    }
  };
  const [isAddingCandidate, setIsAddingCandidate] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [candidatesLoading, setCandidatesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // ID of candidate being updated
  const [draggedCandidateId, setDraggedCandidateId] = useState(null);
  const [dragOverPipelineStage, setDragOverPipelineStage] = useState(null);
  const [jobSearchTerm, setJobSearchTerm] = useState("");
  const [jobStatusFilter, setJobStatusFilter] = useState("all");
  const [pipelineJobFilter, setPipelineJobFilter] = useState("all");

  const [jobFormData, setJobFormData] = useState({
    title: "",
    department: "",
    description: "",
    ctcMin: "",
    ctcMax: "",
    jobType: "Full-time",
    location: "",
    status: "Active",
  });

  // Helper to format numbers with commas for display
  const formatNumberWithCommas = (value) => {
    if (value === null || value === undefined || value === "") return "";
    const num = value.toString().replace(/,/g, "");
    if (isNaN(num)) return value;
    return Number(num).toLocaleString("en-IN");
  };

  // Helper to remove commas for backend
  const parseNumber = (value) => {
    if (typeof value === "number") return value;
    if (!value) return 0;
    return Number(value.toString().replace(/,/g, ""));
  };
  const [candidateFormData, setCandidateFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    jobId: "",
    score: "",
  });

  const pipelineStages = [
    "Applied",
    "Screening",
    "Technical",
    "Interview",
    "Offered",
    "Hired",
    "Rejected",
  ];

  const subViews = [
    { id: "jobs", label: "Job Manager", icon: <Briefcase size={18} /> },
    {
      id: "pipeline",
      label: "Candidate Pipeline",
      icon: <LayoutDashboard size={18} />,
    },
    {
      id: "assessments",
      label: "Online Tests",
      icon: <GraduationCap size={18} />,
    },
  ];

  const fetchJobs = async () => {
    setJobsLoading(true);
    try {
      const jobRes = await apiClient.get("/recruitment/jobs");
      setJobs(jobRes.data);
    } catch (err) {
      console.error("Failed to fetch jobs", err);
    } finally {
      setJobsLoading(false);
    }
  };

  const fetchCandidates = async () => {
    setCandidatesLoading(true);
    try {
      const candRes = await apiClient.get("/recruitment/candidates");
      setCandidates(candRes.data);
    } catch (err) {
      console.error("Failed to fetch candidates", err);
    } finally {
      setCandidatesLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCandidates();
  }, []);

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...jobFormData,
        ctcMin: parseNumber(jobFormData.ctcMin),
        ctcMax: parseNumber(jobFormData.ctcMax),
      };
      await apiClient.post("/recruitment/jobs", payload);
      setIsAddingJob(false);
      setJobFormData({
        title: "",
        department: "",
        description: "",
        ctcMin: "",
        ctcMax: "",
        jobType: "Full-time",
        location: "",
        status: "Active",
      });
      fetchJobs();
    } catch (err) {
      console.error("Failed to create job", err);
      alert("Failed to create job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCandidate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/recruitment/candidates", {
        ...candidateFormData,
        score: Number(candidateFormData.score),
      });
      setIsAddingCandidate(false);
      setCandidateFormData({
        name: "",
        email: "",
        phone: "",
        role: "",
        jobId: "",
        score: 0,
      });
      fetchCandidates();
    } catch (err) {
      console.error("Failed to add candidate", err);
      alert("Failed to add candidate");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStage = async (id, stage) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/recruitment/candidates/${id}`, { stage });
      await fetchCandidates();
    } catch (err) {
      console.error("Failed to update candidate stage", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteJob = async (id) => {
    if (
      !window.confirm(
        "Delete this job posting and all associated candidate records?",
      )
    )
      return;
    setActionLoading(id);
    try {
      await apiClient.delete(`/recruitment/jobs/${id}`);
      await fetchJobs();
    } catch (err) {
      console.error("Failed to delete job", err);
      alert("Failed to delete job");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (!window.confirm("Remove this candidate from the pipeline?")) return;
    setActionLoading(id);
    try {
      await apiClient.delete(`/recruitment/candidates/${id}`);
      await fetchCandidates();
    } catch (err) {
      console.error("Failed to delete candidate", err);
      alert("Failed to delete candidate");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCandidateDragStart = (event, candidateId) => {
    setDraggedCandidateId(candidateId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", candidateId);
  };

  const handleCandidateDragEnd = () => {
    setDraggedCandidateId(null);
    setDragOverPipelineStage(null);
  };

  const handlePipelineDragOver = (event, stage) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverPipelineStage !== stage) {
      setDragOverPipelineStage(stage);
    }
  };

  const handlePipelineDrop = async (event, stage) => {
    event.preventDefault();
    const droppedCandidateId =
      draggedCandidateId || event.dataTransfer.getData("text/plain");
    if (!droppedCandidateId) return;

    const currentCandidate = candidates.find(
      (candidate) => candidate.id === droppedCandidateId,
    );
    if (!currentCandidate || currentCandidate.stage === stage) {
      setDraggedCandidateId(null);
      setDragOverPipelineStage(null);
      return;
    }

    const previousCandidates = candidates;
    const nextCandidates = candidates.map((candidate) =>
      candidate.id === droppedCandidateId ? { ...candidate, stage } : candidate,
    );

    setCandidates(nextCandidates);
    setActionLoading(droppedCandidateId);

    try {
      await apiClient.patch(`/recruitment/candidates/${droppedCandidateId}`, {
        stage,
      });
    } catch (err) {
      setCandidates(previousCandidates);
      console.error("Failed to update candidate stage", err);
      alert("Failed to update candidate stage");
    } finally {
      setActionLoading(null);
      setDraggedCandidateId(null);
      setDragOverPipelineStage(null);
    }
  };

  const normalizedJobSearch = jobSearchTerm.trim().toLowerCase();
  const filteredJobs = jobs.filter((job) => {
    const statusMatch =
      jobStatusFilter === "all" || job.status === jobStatusFilter;
    const searchMatch =
      !normalizedJobSearch ||
      job.title?.toLowerCase().includes(normalizedJobSearch) ||
      job.department?.toLowerCase().includes(normalizedJobSearch);
    return statusMatch && searchMatch;
  });

  const filteredPipelineCandidates = candidates.filter((candidate) => {
    if (pipelineJobFilter === "all") return true;
    return candidate.jobId === pipelineJobFilter;
  });
  const hasJobFilters =
    Boolean(normalizedJobSearch) || jobStatusFilter !== "all";
  const hasPipelineFilters = pipelineJobFilter !== "all";

  const renderSubView = () => {
    switch (activeSubView) {
      case "jobs":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  flex: 1,
                  minWidth: "260px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      width: "100%",
                      maxWidth: "300px",
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
                      SEARCH JOBS
                    </label>
                    <div style={{ position: "relative" }}>
                      <Search
                        size={18}
                        style={{
                          position: "absolute",
                          left: "12px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          color: "var(--text-muted)",
                        }}
                      />
                      <input
                        type="text"
                        placeholder="Title or department..."
                        value={jobSearchTerm}
                        onChange={(e) => setJobSearchTerm(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "10px 10px 10px 40px",
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
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
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
                      FILTER STATUS
                    </label>
                    <select
                      value={jobStatusFilter}
                      onChange={(e) => setJobStatusFilter(e.target.value)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: "8px",
                        backgroundColor: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text-main)",
                        fontSize: "13px",
                        minWidth: "150px",
                      }}
                    >
                      <option value="all">All Statuses</option>
                      {["Active", "Closed"].map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                  {hasJobFilters && (
                    <button
                      onClick={() => {
                        setJobSearchTerm("");
                        setJobStatusFilter("all");
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
                    {jobStatusFilter === "all"
                      ? "All Statuses"
                      : jobStatusFilter}
                  </strong>{" "}
                  ·{" "}
                  <strong>
                    {normalizedJobSearch
                      ? `Search "${jobSearchTerm}"`
                      : "No Search"}
                  </strong>
                </div>
              </div>
              <button
                className="btn-primary"
                onClick={() => setIsAddingJob(true)}
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Plus size={18} /> Create Job Posting
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "20px",
              }}
            >
              {jobsLoading ? (
                <div style={{ gridColumn: "1/-1", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "200px" }}>
                  <Loader className="spinner" size={32} />
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div key={job.id} className="glass-card" style={{ 
                    padding: "24px", display: "flex", flexDirection: "column", gap: "16px",
                    position: "relative", border: "1px solid var(--border)",
                    transition: "transform 0.2s, box-shadow 0.2s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px", color: "var(--text-main)" }}>{job.title}</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", color: "var(--text-muted)", fontSize: "13px", fontWeight: "500" }}>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Briefcase size={14} /> {job.department}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> {job.location}</span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> {job.jobType}</span>
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "8px" }}>
                        <span style={{ 
                          padding: "6px 12px", borderRadius: "100px", fontSize: "11px", fontWeight: "800", 
                          backgroundColor: job.status === "Active" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: job.status === "Active" ? "#10b981" : "#f59e0b",
                          letterSpacing: "0.5px"
                        }}>
                          {job.status.toUpperCase()}
                        </span>
                        <div style={{ display: "flex", gap: "12px" }}>
                          <button onClick={() => openEditJob(job)} style={{ color: "var(--text-muted)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "var(--primary)"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                            <Pencil size={18} />
                          </button>
                          <button onClick={() => handleDeleteJob(job.id)} disabled={actionLoading === job.id} style={{ color: "var(--text-muted)", transition: "color 0.2s" }} onMouseEnter={e => e.currentTarget.style.color = "#ef4444"} onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}>
                            {actionLoading === job.id ? <Loader size={18} className="spinner" /> : <Trash2 size={18} />}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div style={{ padding: "12px 16px", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                      <p style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: "1.5", marginBottom: "12px", display: "-webkit-box", WebkitLineClamp: "2", WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {job.description}
                      </p>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", fontSize: "14px", color: "var(--text-main)" }}>
                        <IndianRupee size={16} className="text-primary" /> 
                        <span>{formatNumberWithCommas(job.ctcMin)}</span>
                        <span style={{ color: "var(--text-muted)", fontWeight: "400" }}>—</span>
                        <span>{formatNumberWithCommas(job.ctcMax)}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto", paddingTop: "12px", borderTop: "1px solid var(--border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "12px", fontWeight: "600" }}>
                        <Users size={16} /> <span>{job._count?.candidates || 0} Applicants</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "12px" }}>
                        <Calendar size={14} /> {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              )}

              {/* Centralized Edit Modal */}
              <AnimatePresence>
                {isEditingJob && (
                  <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="glass-card" style={{ width: "100%", maxWidth: "550px", padding: "40px", position: "relative", border: "1px solid rgba(255,255,255,0.1)" }}>
                      <div style={{ position: "absolute", top: "24px", right: "24px" }}>
                        <button onClick={() => setIsEditingJob(false)} style={{ color: "var(--text-muted)" }}><XCircle size={24} /></button>
                      </div>
                      <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ padding: "10px", backgroundColor: "var(--icon-bg)", borderRadius: "12px", color: "var(--primary)" }}><Pencil size={24} /></div>
                        Edit Job Posting
                      </h2>
                      <form onSubmit={handleEditJob} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>JOB TITLE</label>
                            <input required value={editJobFormData.title} onChange={e => setEditJobFormData({...editJobFormData, title: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>DEPARTMENT</label>
                            <input required value={editJobFormData.department} onChange={e => setEditJobFormData({...editJobFormData, department: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }} />
                          </div>
                        </div>
                        <div>
                          <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>JOB DESCRIPTION</label>
                          <textarea rows={3} required value={editJobFormData.description} onChange={e => setEditJobFormData({...editJobFormData, description: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white", resize: "none" }} />
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>MIN CTC (₹)</label>
                            <input type="text" required value={formatNumberWithCommas(editJobFormData.ctcMin)} onChange={e => setEditJobFormData({...editJobFormData, ctcMin: e.target.value.replace(/[^\d,]/g, "")})} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }} />
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>MAX CTC (₹)</label>
                            <input type="text" required value={formatNumberWithCommas(editJobFormData.ctcMax)} onChange={e => setEditJobFormData({...editJobFormData, ctcMax: e.target.value.replace(/[^\d,]/g, "")})} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }} />
                          </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>JOB TYPE</label>
                            <select value={editJobFormData.jobType} onChange={e => setEditJobFormData({...editJobFormData, jobType: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }}>
                              <option value="Full-time">Full-time</option>
                              <option value="Intern">Intern</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>LOCATION</label>
                            <input required value={editJobFormData.location} onChange={e => setEditJobFormData({...editJobFormData, location: e.target.value})} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }} />
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
                          <button type="button" onClick={() => setIsEditingJob(false)} className="btn-secondary" style={{ flex: 1, padding: "14px" }}>Cancel</button>
                          <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 2, padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontWeight: "700" }}>
                            {submitting ? <Loader size={20} className="spinner" /> : "Update Details"}
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>

              {jobs.length > 0 && !jobsLoading && filteredJobs.length === 0 && (
                <div
                  className="glass-card"
                  style={{
                    padding: "24px",
                    color: "var(--text-muted)",
                    fontStyle: "italic",
                  }}
                >
                  No jobs match the selected filters.
                </div>
              )}
            </div>
          </div>
        );

      case "pipeline":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "16px" }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
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
                    FILTER PIPELINE BY JOB
                  </label>
                  <select
                    value={pipelineJobFilter}
                    onChange={(e) => setPipelineJobFilter(e.target.value)}
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
                    <option value="all">All Job Roles</option>
                    {jobs.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>
                {hasPipelineFilters && (
                  <button
                    onClick={() => setPipelineJobFilter("all")}
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
                    Clear Filter
                  </button>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Showing:{" "}
                <strong>
                  {pipelineJobFilter === "all"
                    ? "All Job Roles"
                    : jobs.find((job) => job.id === pipelineJobFilter)?.title ||
                      "Selected Job"}
                </strong>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                gap: "20px",
                overflowX: "auto",
                paddingBottom: "20px",
                minHeight: "500px",
              }}
            >
              {candidatesLoading ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: "300px",
                  }}
                >
                  <Loader className="spinner" size={32} />
                </div>
              ) : (
                pipelineStages.map((stage) => (
                  <div
                    key={stage}
                    style={{
                      minWidth: "260px",
                      flex: "1 1 260px",
                      backgroundColor:
                        dragOverPipelineStage === stage
                          ? "rgba(14, 165, 233, 0.08)"
                          : "var(--column-bg)",
                      borderRadius: "12px",
                      padding: "16px",
                      border:
                        dragOverPipelineStage === stage
                          ? "1px solid var(--primary)"
                          : "1px solid var(--border)",
                      transition:
                        "border-color 0.2s ease, background-color 0.2s ease",
                    }}
                    onDragOver={(event) => handlePipelineDragOver(event, stage)}
                    onDrop={(event) => handlePipelineDrop(event, stage)}
                    onDragLeave={() => {
                      if (dragOverPipelineStage === stage) {
                        setDragOverPipelineStage(null);
                      }
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "14px",
                          fontWeight: "700",
                          color: "var(--text-muted)",
                        }}
                      >
                        {stage.toUpperCase()}{" "}
                        <span
                          style={{
                            marginLeft: "8px",
                            padding: "2px 8px",
                            backgroundColor: "var(--tag-bg)",
                            borderRadius: "10px",
                          }}
                        >
                          {
                            filteredPipelineCandidates.filter(
                              (c) => c.stage === stage,
                            ).length
                          }
                        </span>
                      </h4>
                      <Plus
                        size={16}
                        style={{
                          color: "var(--text-muted)",
                          cursor: "pointer",
                        }}
                        onClick={() => {
                          setCandidateFormData({ ...candidateFormData, stage });
                          setIsAddingCandidate(true);
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      {candidates
                        .filter(
                          (c) =>
                            pipelineJobFilter === "all" ||
                            c.jobId === pipelineJobFilter,
                        )
                        .filter((c) => c.stage === stage)
                        .map((candidate) => (
                          <div
                            key={candidate.id}
                            className="glass-card"
                            style={{
                              padding: "16px",
                              cursor:
                                actionLoading === candidate.id
                                  ? "not-allowed"
                                  : "grab",
                              opacity:
                                draggedCandidateId === candidate.id ? 0.6 : 1,
                            }}
                            draggable={actionLoading !== candidate.id}
                            onDragStart={(event) =>
                              handleCandidateDragStart(event, candidate.id)
                            }
                            onDragEnd={handleCandidateDragEnd}
                          >
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "flex-start",
                                marginBottom: "12px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "12px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    borderRadius: "50%",
                                    backgroundColor: "var(--primary)",
                                    color: "var(--text-main)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "12px",
                                    fontWeight: "700",
                                  }}
                                >
                                  {candidate.name[0]}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: "14px",
                                      fontWeight: "600",
                                    }}
                                  >
                                    {candidate.name}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: "12px",
                                      color: "var(--text-muted)",
                                    }}
                                  >
                                    {candidate.role}
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  handleDeleteCandidate(candidate.id)
                                }
                                disabled={actionLoading === candidate.id}
                                style={{
                                  color: "var(--text-muted)",
                                  opacity: 0.5,
                                }}
                                onMouseEnter={(e) =>
                                  (e.currentTarget.style.color = "#ef4444")
                                }
                                onMouseLeave={(e) =>
                                  (e.currentTarget.style.color =
                                    "var(--text-muted)")
                                }
                              >
                                {actionLoading === candidate.id ? (
                                  <Loader size={12} className="spinner" />
                                ) : (
                                  <XCircle size={14} />
                                )}
                              </button>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  fontSize: "12px",
                                  color: "#10b981",
                                  fontWeight: "700",
                                }}
                              >
                                <Star size={12} fill="#10b981" />{" "}
                                {candidate.score}%
                              </div>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                {actionLoading === candidate.id && (
                                  <Loader size={12} className="spinner" />
                                )}
                                <select
                                  value={candidate.stage}
                                  disabled={actionLoading === candidate.id}
                                  onChange={(e) =>
                                    handleUpdateStage(
                                      candidate.id,
                                      e.target.value,
                                    )
                                  }
                                  style={{
                                    backgroundColor: "transparent",
                                    border: "none",
                                    color: "var(--text-muted)",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    outline: "none",
                                    cursor: "pointer",
                                  }}
                                >
                                  {pipelineStages.map((s) => (
                                    <option key={s} value={s}>
                                      {s}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        ))}
                      {filteredPipelineCandidates.filter(
                        (c) => c.stage === stage,
                      ).length === 0 && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            padding: "8px 4px",
                          }}
                        >
                          No candidates
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case "assessments":
        return (
          <div className="glass-card" style={{ padding: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                marginBottom: "16px",
              }}
            >
              Online Assessments
            </h3>
            <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              Live technical assessment integration is coming soon. Currently
              tracking candidate scores manually.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          padding: "4px",
        }}
      >
        {subViews.map((sv) => (
          <button
            key={sv.id}
            onClick={() => setActiveSubView(sv.id)}
            style={{
              padding: "10px 20px",
              borderRadius: "10px",
              backgroundColor:
                activeSubView === sv.id ? "var(--primary)" : "var(--column-bg)",
              color: activeSubView === sv.id ? "white" : "var(--text-muted)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
              border: "1px solid var(--border)",
              transition: "all 0.2s",
            }}
          >
            {sv.icon} {sv.label}
          </button>
        ))}
      </div>

      <main>{renderSubView()}</main>

      <AnimatePresence>
        {isAddingJob && (
          <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card" style={{ width: "100%", maxWidth: "550px", padding: "40px", position: "relative", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ position: "absolute", top: "24px", right: "24px" }}>
                <button onClick={() => setIsAddingJob(false)} style={{ color: "var(--text-muted)" }}><XCircle size={24} /></button>
              </div>
              <h2 style={{ fontSize: "24px", fontWeight: "800", marginBottom: "28px", display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ padding: "10px", backgroundColor: "var(--icon-bg)", borderRadius: "12px", color: "var(--primary)" }}><Plus size={24} /></div>
                Launch New Posting
              </h2>
              <form onSubmit={handleCreateJob} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>JOB TITLE</label>
                    <input required placeholder="e.g. Senior Frontend Dev" value={jobFormData.title} onChange={e => setJobFormData({ ...jobFormData, title: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>DEPARTMENT</label>
                    <input required placeholder="e.g. Engineering" value={jobFormData.department} onChange={e => setJobFormData({ ...jobFormData, department: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }} />
                  </div>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>JOB DESCRIPTION</label>
                  <textarea rows={3} required placeholder="Outline the core responsibilities and requirements..." value={jobFormData.description} onChange={e => setJobFormData({ ...jobFormData, description: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white", resize: "none" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>MIN CTC (₹)</label>
                    <input type="text" required placeholder="0" value={formatNumberWithCommas(jobFormData.ctcMin)} onChange={e => setJobFormData({ ...jobFormData, ctcMin: e.target.value.replace(/[^\d,]/g, "") })} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }} />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>MAX CTC (₹)</label>
                    <input type="text" required placeholder="0" value={formatNumberWithCommas(jobFormData.ctcMax)} onChange={e => setJobFormData({ ...jobFormData, ctcMax: e.target.value.replace(/[^\d,]/g, "") })} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }} />
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>JOB TYPE</label>
                    <select required value={jobFormData.jobType} onChange={e => setJobFormData({ ...jobFormData, jobType: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }}>
                      <option value="Full-time">Full-time</option>
                      <option value="Intern">Intern</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", marginBottom: "8px" }}>LOCATION</label>
                    <input required placeholder="Remote, Mohali, etc." value={jobFormData.location} onChange={e => setJobFormData({ ...jobFormData, location: e.target.value })} style={{ width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "var(--input-bg)", border: "1px solid var(--border)", color: "white" }} />
                  </div>
                </div>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ marginTop: "12px", padding: "14px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", fontWeight: "700" }}>
                  {submitting ? <Loader size={20} className="spinner" /> : <><Plus size={20} /> Publish Posting</>}
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {isAddingCandidate && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 110,
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="glass-card"
              style={{ width: "min(90vw, 500px)", padding: "24px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <h3 style={{ fontSize: "20px", fontWeight: "700" }}>
                  Add Candidate
                </h3>
                <button onClick={() => setIsAddingCandidate(false)}>
                  <XCircle size={20} style={{ color: "var(--text-main)" }} />
                </button>
              </div>
              <form
                onSubmit={handleCreateCandidate}
                style={{ display: "grid", gap: "12px" }}
              >
                <input
                  type="text"
                  required
                  placeholder="Candidate Name"
                  value={candidateFormData.name}
                  onChange={(e) =>
                    setCandidateFormData({
                      ...candidateFormData,
                      name: e.target.value,
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                  }}
                />
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <input
                    type="email"
                    placeholder="Email"
                    value={candidateFormData.email}
                    onChange={(e) =>
                      setCandidateFormData({
                        ...candidateFormData,
                        email: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Phone"
                    value={candidateFormData.phone}
                    onChange={(e) =>
                      setCandidateFormData({
                        ...candidateFormData,
                        phone: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
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
                    gap: "12px",
                  }}
                >
                  <select
                    required
                    value={candidateFormData.jobId}
                    onChange={(e) => {
                      const job = jobs.find((j) => j.id === e.target.value);
                      setCandidateFormData({
                        ...candidateFormData,
                        jobId: e.target.value,
                        role: job?.title || "",
                      });
                    }}
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                    }}
                  >
                    <option value="">Select Job</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.title}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Score (0-100)"
                    value={candidateFormData.score}
                    onChange={(e) =>
                      setCandidateFormData({
                        ...candidateFormData,
                        score: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      padding: "10px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{
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
                    "Add to Pipeline"
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

export default RecruitmentAssessment;
