import { z } from "zod";

import type { ActionState } from "./action-state";

export function toActionError(error: unknown): ActionState {
  if (error instanceof z.ZodError) {
    return {
      status: "error",
      message: "Vui lòng kiểm tra lại thông tin.",
      fieldErrors: z.flattenError(error).fieldErrors,
    };
  }

  if (error instanceof Error) {
    if (error.message.includes("unique") || error.message.includes("duplicate")) {
      return {
        status: "error",
        message: "Tên này đã tồn tại. Hãy chọn tên khác.",
      };
    }

    const safeMessages = new Set([
      "DATABASE_URL chưa được cấu hình.",
      "Không tìm thấy nhóm đội.",
      "Danh sách đội chứa đội không tồn tại.",
    ]);

    if (safeMessages.has(error.message)) {
      return { status: "error", message: error.message };
    }

    console.error("Server Action thất bại.", error);
  }

  return { status: "error", message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}
