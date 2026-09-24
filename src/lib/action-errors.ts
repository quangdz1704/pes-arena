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
      "Không đủ lựa chọn để random.",
      "Cần đúng 4 người chơi khác nhau để ghép cặp.",
      "Chỉ có thể chọn người chơi đang hoạt động.",
      "Nhóm đội không tồn tại hoặc đang bị ẩn.",
      "Hai bên phải dùng hai đội bóng khác nhau.",
      "Đội bóng phải thuộc nhóm đội đã chọn.",
      "Hai đội cân bằng cần cùng tier hoặc có rating gần nhau.",
      "Trận đấu không tồn tại hoặc đã được lưu kết quả.",
      "Không thể huỷ giải khi vẫn còn trận đang diễn ra.",
      "Giải đấu không tồn tại hoặc không còn diễn ra.",
      "Giải đấu này không còn diễn ra.",
    ]);

    if (safeMessages.has(error.message)) {
      return { status: "error", message: error.message };
    }

    console.error("Server Action thất bại.", error);
  }

  return { status: "error", message: "Đã có lỗi xảy ra. Vui lòng thử lại." };
}
