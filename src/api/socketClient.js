import { io } from "socket.io-client";
import { API_BASE_URL } from "./apiClient";

const SOCKET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

let socket = null;

/**
 * Lazily creates a single shared Socket.IO connection authenticated with the
 * current access token, reusing it across callers instead of opening one
 * connection per component.
 */
export const getAttendanceSocket = () => {
  const accessToken = localStorage.getItem("accessToken");
  if (!accessToken) return null;

  if (socket && socket.auth?.token === accessToken) {
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(`${SOCKET_BASE_URL}/ws/attendance`, {
    auth: { token: accessToken },
    transports: ["websocket", "polling"],
    reconnection: true,
  });

  return socket;
};

export const closeAttendanceSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
