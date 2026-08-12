import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  ClipboardList,
  Loader,
  CheckCircle2,
  AlertCircle,
  Plus,
  X,
  CalendarDays,
  ChevronDown,
  Layout,
  Briefcase,
  Flag,
  Calendar,
  MoreHorizontal,
  ArrowRight,
  Pencil,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import apiClient from "../api/apiClient";

const EmployeeProjects = () => {
  const { user } = useSelector((state) => state.auth);

  const inputStyle = {
    width: "100%",
    padding: "10px 12px",
    backgroundColor: "var(--input-bg)",
    border: "1px solid var(--border)",
    color: "var(--text-main)",
    fontSize: "13px",
    transition: "all 0.2s",
    outline: "none",
  };

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [employeeId, setEmployeeId] = useState(null);
  const [taskStatusFilter, setTaskStatusFilter] = useState("All");
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [myProjects, setMyProjects] = useState([]);
  const [showCreateTaskModal, setShowCreateTaskModal] = useState(false);
  const [taskSubmitting, setTaskSubmitting] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "Medium",
    dueDate: "",
    projectId: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [pendingTitles, setPendingTitles] = useState([]);
  const [currentTitle, setCurrentTitle] = useState("");

  const fetchProjectsData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const myEmployeeRes = await apiClient.get("/leaves/my-employee-id");
      const myEmployeeId = myEmployeeRes.data?.employeeId || null;
      setEmployeeId(myEmployeeId);

      if (!myEmployeeId) {
        setAssignedTasks([]);
        setMyProjects([]);
        return;
      }

      const [tasksRes, projectsRes] = await Promise.all([
        apiClient.get("/projects/tasks"),
        apiClient.get("/projects"),
      ]);

      const tasks = (tasksRes.data || []).filter(
        (task) =>
          String(task.assigneeId || task.assignee?.id || "") ===
          String(user?.id || ""),
      );

      const projectIdSet = new Set(
        tasks
          .map((task) => String(task.projectId || task.project?.id || ""))
          .filter(Boolean),
      );

      const projects = (projectsRes.data || []).filter((project) =>
        projectIdSet.has(String(project.id)),
      );

      setAssignedTasks(tasks);
      setMyProjects(projects);
    } catch (fetchError) {
      const message =
        fetchError.response?.data?.message ||
        "Failed to load employee projects data";
      setError(message);
      toast.error(
        Array.isArray(message) ? message.join(", ") : String(message),
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProjectsData();
  }, [fetchProjectsData]);

  const projectProgress = useMemo(() => {
    return myProjects.map((project) => {
      const projectTasks = assignedTasks.filter(
        (task) =>
          String(task.projectId || task.project?.id || "") ===
          String(project.id),
      );
      const completed = projectTasks.filter(
        (task) => task.status === "done",
      ).length;
      return {
        ...project,
        assignedCount: projectTasks.length,
        completedCount: completed,
      };
    });
  }, [myProjects, assignedTasks]);

  const handleTaskStatusUpdate = async (taskId, status) => {
    setActionLoading(`task-${taskId}`);
    setError("");
    setSuccessMessage("");

    try {
      await apiClient.patch(`/projects/tasks/${taskId}`, { status });
      setSuccessMessage("Task status updated.");
      toast.success("Task status updated");
      await fetchProjectsData();
    } catch (taskError) {
      const message =
        taskError.response?.data?.message || "Failed to update task status";
      setError(message);
      toast.error(
        Array.isArray(message) ? message.join(", ") : String(message),
      );
    } finally {
      setActionLoading("");
    }
  };

  const resetTaskForm = () => {
    setTaskForm({
      title: "",
      description: "",
      priority: "Medium",
      dueDate: "",
      projectId: "",
    });
    setPendingTitles([]);
    setCurrentTitle("");
    setIsEditing(false);
    setEditingTaskId(null);
  };

  // Removed auto-select first project useEffect to allow Independent Task as default

  const handleEditTask = (task) => {
    setTaskForm({
      title: task.title,
      description: task.description || "",
      priority: task.priority || "Medium",
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      projectId: task.projectId || "",
    });
    setCurrentTitle(task.title);
    setIsEditing(true);
    setEditingTaskId(task.id);
    setShowCreateTaskModal(true);
  };

  const addPendingTitle = (e) => {
    if (e.key === "Enter" || e.key === "Tab") {
      if (currentTitle.trim()) {
        e.preventDefault();
        if (!isEditing) {
          setPendingTitles(prev => [...prev, currentTitle.trim()]);
          setCurrentTitle("");
        }
      }
    }
  };

  const removePendingTitle = (index) => {
    setPendingTitles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateTask = async (event) => {
    event.preventDefault();
    
    const titlesToCreate = isEditing 
      ? [currentTitle.trim()] 
      : pendingTitles.length > 0 
        ? pendingTitles 
        : currentTitle.trim() ? [currentTitle.trim()] : [];

    if (titlesToCreate.length === 0) {
      setError("Task title is required.");
      toast.error("At least one task title is required");
      return;
    }

    setTaskSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (isEditing) {
        await apiClient.patch(`/projects/tasks/${editingTaskId}`, {
          title: currentTitle.trim(),
          description: taskForm.description.trim() || undefined,
          priority: taskForm.priority,
          dueDate: taskForm.dueDate
            ? new Date(taskForm.dueDate).toISOString()
            : undefined,
          projectId: taskForm.projectId || undefined,
        });
        setSuccessMessage("Task updated successfully.");
        toast.success("Task updated successfully");
      } else {
        // Sequential creation for batch
        for (const title of titlesToCreate) {
          await apiClient.post("/projects/tasks", {
            title: title,
            description: taskForm.description.trim() || undefined,
            priority: taskForm.priority,
            dueDate: taskForm.dueDate
              ? new Date(taskForm.dueDate).toISOString()
              : undefined,
            projectId: taskForm.projectId || undefined,
          });
        }
        setSuccessMessage(titlesToCreate.length > 1 ? `Success! ${titlesToCreate.length} tasks created.` : "Task created successfully.");
        toast.success(titlesToCreate.length > 1 ? `${titlesToCreate.length} tasks created` : "Task created successfully");
      }
      setShowCreateTaskModal(false);
      resetTaskForm();
      await fetchProjectsData();
    } catch (createError) {
      const message =
        createError.response?.data?.message || "Failed to create task";
      setError(message);
      toast.error(
        Array.isArray(message) ? message.join(", ") : String(message),
      );
    } finally {
      setTaskSubmitting(false);
    }
  };

  const columns = [
    { id: "todo", title: "To Do" },
    { id: "inprogress", title: "In Progress" },
    { id: "review", title: "Review" },
    { id: "done", title: "Done" },
  ];

  const kanbanTasks =
    taskStatusFilter === "All"
      ? assignedTasks
      : assignedTasks.filter((task) => task.status === taskStatusFilter);

  if (loading) {
    return (
      <div
        style={{
          height: "320px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader className="spinner" size={30} />
      </div>
    );
  }

  return (
    <div
      className="employee-portal"
      style={{
        width: "100%",
        maxWidth: "1600px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "20px",
      }}
    >
      <div className="glass-card" style={{ padding: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{ fontSize: "28px", fontWeight: "800", marginBottom: "6px" }}
          >
            My Projects/Tasks
          </h1>
          <button
            className="btn-primary"
            onClick={() => {
              resetTaskForm();
              setShowCreateTaskModal(true);
            }}
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={16} /> New Task
          </button>
        </div>
        <p style={{ color: "var(--text-muted)" }}>
          Track assigned projects, update task statuses, and monitor completion
          progress.
        </p>
      </div>

      {error && (
        <div
          className="glass-card"
          style={{
            padding: "14px 16px",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} />
          {Array.isArray(error) ? error.join(", ") : String(error)}
        </div>
      )}

      {successMessage && (
        <div
          className="glass-card"
          style={{
            padding: "14px 16px",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      )}

      {!employeeId ? (
        <div
          className="glass-card"
          style={{ padding: "20px", color: "var(--text-muted)" }}
        >
          Your account is not linked to an employee profile yet. Contact
          HR/Admin.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "14px",
            }}
          >
            {projectProgress.map((project) => (
              <div
                key={project.id}
                className="glass-card"
                style={{ padding: "14px" }}
              >
                <div
                  style={{
                    fontWeight: "700",
                    fontSize: "14px",
                    marginBottom: "4px",
                  }}
                >
                  {project.name}
                </div>
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "12px",
                    marginBottom: "8px",
                  }}
                >
                  {project.assignedCount} assigned task(s) ·{" "}
                  {project.completedCount} completed
                </div>
                <div
                  style={{
                    height: "8px",
                    borderRadius: "999px",
                    backgroundColor: "var(--input-bg)",
                  }}
                >
                  <div
                    style={{
                      height: "8px",
                      borderRadius: "999px",
                      backgroundColor: "var(--primary)",
                      width:
                        project.assignedCount > 0
                          ? `${Math.round((project.completedCount / project.assignedCount) * 100)}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            ))}
            {projectProgress.length === 0 && (
              <div
                className="glass-card"
                style={{ padding: "14px", color: "var(--text-muted)" }}
              >
                No project assignments found.
              </div>
            )}
          </div>

          <div className="glass-card" style={{ padding: "18px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "10px",
                marginBottom: "14px",
                flexWrap: "wrap",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <ClipboardList size={18} />
                <h3 style={{ fontWeight: "700" }}>My Tasks Kanban</h3>
              </div>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "700",
                    letterSpacing: "0.4px",
                  }}
                >
                  FILTER TASK STATUS
                </span>
                <select
                  value={taskStatusFilter}
                  onChange={(event) => setTaskStatusFilter(event.target.value)}
                  style={{
                    padding: "6px 8px",
                    borderRadius: "8px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                    fontSize: "12px",
                  }}
                >
                  <option value="All">All Statuses</option>
                  <option value="todo">Todo</option>
                  <option value="inprogress">In Progress</option>
                  <option value="review">Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
                gap: "12px",
              }}
            >
              {columns.map((column) => {
                const columnTasks = kanbanTasks.filter(
                  (task) => task.status === column.id,
                );

                return (
                  <div
                    key={column.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      backgroundColor: "rgba(30, 41, 59, 0.4)",
                      padding: "12px",
                      minHeight: "400px",
                      display: "grid",
                      gap: "12px",
                      alignContent: "start",
                      backdropFilter: "blur(10px)",
                      boxShadow: "inset 0 0 20px rgba(0,0,0,0.2)"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "8px",
                        padding: "0 4px"
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-main)" }}>
                        {column.title}
                      </span>
                      <span
                        style={{
                          padding: "2px 10px",
                          borderRadius: "100px",
                          fontSize: "11px",
                          fontWeight: "700",
                          backgroundColor: "rgba(14, 165, 233, 0.1)",
                          color: "var(--primary)",
                          border: "1px solid rgba(14, 165, 233, 0.2)"
                        }}
                      >
                        {columnTasks.length}
                      </span>
                    </div>

                    {columnTasks.length === 0 ? (
                      <div
                        style={{
                          padding: "20px",
                          textAlign: "center",
                          fontSize: "12px",
                          color: "var(--text-muted)",
                          border: "1px dashed var(--border)",
                          borderRadius: "10px",
                          backgroundColor: "rgba(255,255,255,0.02)"
                        }}
                      >
                        No tasks in queue
                      </div>
                    ) : (
                      columnTasks.map((task) => (
                        <div
                          key={task.id}
                          className="glass-card task-card-premium"
                          style={{
                            border: "1px solid var(--border)",
                            borderRadius: "12px",
                            padding: "14px",
                            display: "grid",
                            gap: "10px",
                            background: "rgba(255,255,255,0.03)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            cursor: "default"
                          }}
                        >
                          <div style={{ fontSize: "14px", fontWeight: "700", lineHeight: "1.4" }}>
                            {task.title}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {task.project?.name || "Project"} · {task.priority}
                          </div>
                          {task.dueDate ? (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <CalendarDays size={12} />
                              Due {new Date(task.dueDate).toLocaleDateString()}
                            </div>
                          ) : null}
                          <div 
                            style={{ 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "space-between",
                              marginTop: "4px"
                            }}
                          >
                            <div className="premium-badge-group">
                              {task.projectId ? (
                                <div className="premium-badge premium-badge-blue" style={{ fontSize: "10px" }}>
                                  {task.project?.name || "Project"}
                                </div>
                              ) : (
                                <div className="premium-badge" style={{ fontSize: "10px", background: "rgba(255,255,255,0.05)" }}>
                                  Independent Task
                                </div>
                              )}
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <button
                                onClick={() => handleEditTask(task)}
                                style={{
                                  padding: "6px",
                                  borderRadius: "6px",
                                  backgroundColor: "rgba(255,255,255,0.05)",
                                  color: "var(--text-muted)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  transition: "all 0.2s"
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)"}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                              >
                                <Pencil size={12} strokeWidth={2.5} />
                              </button>

                              <div style={{ position: "relative" }}>
                              <select
                                value={task.status}
                                onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value)}
                                disabled={actionLoading === `task-${task.id}`}
                                className="glass-card"
                                style={{
                                  padding: "4px 28px 4px 8px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  backgroundColor: "rgba(14, 165, 233, 0.05)",
                                  border: "1px solid var(--border)",
                                  borderRadius: "6px",
                                  color: "var(--text-main)",
                                  cursor: "pointer",
                                  appearance: "none",
                                  WebkitAppearance: "none",
                                }}
                              >
                                {columns.map(col => (
                                  <option key={col.id} value={col.id}>{col.title}</option>
                                ))}
                              </select>
                              <ChevronDown 
                                size={12} 
                                style={{ 
                                  position: "absolute", 
                                  right: "8px", 
                                  top: "50%", 
                                  transform: "translateY(-50%)",
                                  pointerEvents: "none",
                                  opacity: 0.6
                                }} 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
      <AnimatePresence>
        {showCreateTaskModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-card"
              style={{ 
                width: "100%", 
                maxWidth: "600px", 
                padding: "0",
                overflow: "hidden",
                border: "1px solid var(--border)",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
            >
              {/* Modal Header */}
              <div 
                style={{ 
                  padding: "24px", 
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(255,255,255,0.02)"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ padding: "8px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.1)", color: "var(--primary)" }}>
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: "18px", fontWeight: "800" }}>{isEditing ? "Edit Task" : "Create New Task"}</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{isEditing ? "Update your assignment details" : "Fill in the details for your assignment"}</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowCreateTaskModal(false);
                    resetTaskForm();
                  }}
                  style={{ 
                    padding: "8px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                    color: "var(--text-muted)",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCreateTask} style={{ padding: "24px", display: "grid", gap: "20px" }}>
                <div className="form-group-modern">
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Layout size={14} /> Task Title
                  </label>
                  <input
                    required={!isEditing && pendingTitles.length === 0}
                    placeholder={isEditing ? "Edit task title..." : "Type title and press Enter to add multiple..."}
                    value={currentTitle}
                    onChange={(event) => setCurrentTitle(event.target.value)}
                    onKeyDown={addPendingTitle}
                    className="glass-card"
                    style={{ 
                      ...inputStyle, 
                      borderRadius: "10px",
                      fontSize: "14px",
                      padding: "12px 14px"
                    }}
                  />
                  {pendingTitles.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "10px" }}>
                      {pendingTitles.map((title, idx) => (
                        <div 
                          key={idx}
                          style={{ 
                            background: "rgba(14, 165, 233, 0.15)",
                            color: "var(--primary)",
                            padding: "4px 10px",
                            borderRadius: "100px",
                            fontSize: "11px",
                            fontWeight: "700",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            border: "1px solid rgba(14, 165, 233, 0.3)"
                          }}
                        >
                          {title}
                          <button 
                            type="button" 
                            onClick={() => removePendingTitle(idx)}
                            style={{ color: "var(--primary)", opacity: 0.7, padding: "2px" }}
                          >
                            <X size={10} strokeWidth={3} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-group-modern">
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <MoreHorizontal size={14} /> Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide additional context or instructions..."
                    value={taskForm.description}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    className="glass-card"
                    style={{ 
                      ...inputStyle, 
                      resize: "vertical", 
                      borderRadius: "10px",
                      minHeight: "80px"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group-modern">
                    <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Briefcase size={14} /> Associated Project
                    </label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={taskForm.projectId}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            projectId: event.target.value,
                          }))
                        }
                        className="glass-card"
                        style={{ 
                          ...inputStyle, 
                          borderRadius: "10px", 
                          appearance: "none",
                          paddingRight: "40px"
                        }}
                      >
                        <option value="">Independent Task (No Project)</option>
                        {myProjects.map((project) => (
                          <option key={project.id} value={String(project.id)}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5 }} />
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Flag size={14} /> Priority Level
                    </label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={taskForm.priority}
                        onChange={(event) =>
                          setTaskForm((prev) => ({
                            ...prev,
                            priority: event.target.value,
                          }))
                        }
                        className="glass-card"
                        style={{ 
                          ...inputStyle, 
                          borderRadius: "10px", 
                          appearance: "none",
                          paddingRight: "40px"
                        }}
                      >
                        {["Low", "Medium", "High", "Critical"].map((priority) => (
                          <option key={priority} value={priority}>
                            {priority}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none", opacity: 0.5 }} />
                    </div>
                  </div>
                </div>

                <div className="form-group-modern">
                  <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <Calendar size={14} /> Completion Deadline
                  </label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(event) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        dueDate: event.target.value,
                      }))
                    }
                    className="glass-card"
                    style={{ ...inputStyle, borderRadius: "10px" }}
                  />
                </div>

                {/* Footer Actions */}
                <div 
                  style={{ 
                    marginTop: "8px",
                    paddingTop: "20px", 
                    borderTop: "1px solid var(--border)", 
                    display: "flex", 
                    gap: "12px" 
                  }}
                >
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setShowCreateTaskModal(false);
                      resetTaskForm();
                    }}
                    style={{ flex: 1, padding: "12px", borderRadius: "100px", fontWeight: "600" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={taskSubmitting}
                    style={{ 
                      flex: 2, 
                      padding: "12px", 
                      borderRadius: "100px", 
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px"
                    }}
                  >
                    {taskSubmitting ? <Loader className="spinner" size={18} /> : (
                      <>
                        <ArrowRight size={18} />
                        {isEditing ? "Update Assignment" : "Create Assignment"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmployeeProjects;
