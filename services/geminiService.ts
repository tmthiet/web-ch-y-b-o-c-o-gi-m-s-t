
import { GoogleGenAI } from "@google/genai";
import { ReportData } from "../types";
import { AREAS } from "../constants";

const getAreaDescription = (area: string): string => {
  const found = AREAS.find(a => a.id === area);
  return found ? `${found.label} (${found.description})` : area;
};

export const generateProfessionalReport = async (data: ReportData): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key is missing. Returning raw data.");
    return "API Key missing. Cannot generate AI report.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const areaDesc = getAreaDescription(data.area);

  const prompt = `
    Bạn là thư ký hội đồng thi chuyên nghiệp. Hãy soạn thảo "Báo Cáo Nhanh Giám Sát Thi" theo phong cách hành chính nhà nước.
    
    Thông tin đầu vào:
    - Cán bộ giám sát: ${data.supervisorName || 'Không có tên'}
    - Ngày thi: ${data.examDate}
    - Ca thi: ${data.shift}
    - Khu vực: ${areaDesc}
    - Môn thi: ${data.subject || 'Chưa nhập'}
    
    Chi tiết tình hình (Nếu ô trống hoặc "Không" nghĩa là bình thường):
    - CB coi thi trễ: ${data.lateProctors} (Lưu ý: Xác định rõ tên và phòng nếu có)
    - CB vắng: ${data.absentProctors} (Lưu ý: Xác định rõ tên và phòng nếu có)
    - CB coi thi THẾ (Cán bộ trong lịch/bị thay): ${data.substituteProctors}
    - CB coi thi THAY (Cán bộ mới/người thay): ${data.changedProctors}
    - Sai sót đề thi: ${data.examPaperErrors}
    - SV/HV vi phạm: ${data.studentViolations}
    - Ghi chú thêm: ${data.notes}

    Quy trình suy nghĩ (Thinking Process):
    1. Phân tích dữ liệu: Lọc bỏ các mục rỗng, chỉ chứa khoảng trắng hoặc ký tự đặc biệt vô nghĩa.
    2. Đánh giá tổng quan: Nếu không có sự cố nào -> Kết luận "Nghiêm túc, an toàn".
    3. Xử lý "Cán bộ coi thi thế/thay": 
       - Dữ liệu đầu vào thường có dạng ngắn gọn: "Nguyễn Văn A (P.101)" (cho cả cột Thế và Thay).
       - Hãy cố gắng ghép cặp nếu cùng phòng thi để viết thành câu.
       - Ví dụ: "Thế: A (P.101), Thay: B (P.101)" -> "Phòng 101: Đ/c B coi thi thay cho Đ/c A".
       - Nếu không ghép cặp được, hãy liệt kê riêng: "Phòng 101: Đ/c A vắng (được thế chỗ), Đ/c B coi thi thay".
    4. Soạn thảo: Dùng ngôn ngữ hành chính, ngắn gọn.

    Yêu cầu định dạng (Markdown):
    **BÁO CÁO NHANH GIÁM SÁT THI**
    --------------------------------
    📅 **Thời gian:** [Ngày] | [Ca]
    📍 **Địa điểm:** [Tên khu vực]
    📚 **Môn thi:** [Tên môn]
    👤 **Cán bộ trực:** [Tên CB]

    **TÌNH HÌNH CỤ THỂ:**
    [Nếu bình thường: Ghi "Tình hình thi diễn ra nghiêm túc, an toàn, đúng quy chế. Không ghi nhận sự cố bất thường."]
    [Nếu có vấn đề, dùng gạch đầu dòng chi tiết:]
    *   **Về Cán bộ coi thi:**
        *   [Liệt kê trễ/vắng nếu có]
        *   [Liệt kê thay/thế chi tiết]
    *   **Về Đề thi:** [Chi tiết nếu có]
    *   **Về Sinh viên:** [Chi tiết nếu có]
    *   **Ghi chú khác:** [Nếu có]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingBudget: 1024,
        },
      },
    });
    return response.text || "Không thể tạo nội dung.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi khi kết nối với AI. Vui lòng kiểm tra lại.";
  }
};
