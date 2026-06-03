import AuditLog from "../models/AuditLog";

export const logAudit = async (userId: string | null, userName: string | null, role: string, action: string) => {
  try {
    await AuditLog.create({
      userId: userId || undefined,
      userName: userName || "System / Guest",
      role: role || "guest",
      action: action,
      timestamp: new Date(),
    });
    console.log(`[AUDIT LOG] ${action} by user ${userName || 'System'} (${role})`);
  } catch (error) {
    console.error("Failed to write audit log:", error);
  }
};
