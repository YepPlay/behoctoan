/* ============================================================
   Bé Học Toán — BẢNG CÂU ĐỌC cho bé Mẫu giáo (tiền tiểu học)
   Mỗi dòng = 1 file assets/voice/<key>.mp3, sinh bằng giọng
   Google tiếng Việt:  node tools/gen-voice.js
   → mọi thiết bị (Android, iPhone, máy tính) nghe GIỐNG NHAU
     và chơi được offline, không phụ thuộc giọng cài trong máy.
   Câu có số thì ghép nhiều file lại, vd:
     "ba cộng năm bằng bao nhiêu?" = n3 + cong + n5 + hoiCalc
   Đổi lời đọc = sửa ở đây rồi chạy lại tools/gen-voice.js
   ============================================================ */
const VOICE_LINES = {
  /* —— Số 0–10 —— */
  n0: "không",
  n1: "một",
  n2: "hai",
  n3: "ba",
  n4: "bốn",
  n5: "năm",
  n6: "sáu",
  n7: "bảy",
  n8: "tám",
  n9: "chín",
  n10: "mười",

  /* —— Phép tính —— */
  cong: "cộng",
  tru: "trừ",
  hoiCalc: "bằng bao nhiêu?",

  /* —— Nhận biết số / đếm —— */
  demHinh: "Bé đếm xem có bao nhiêu hình nào!",
  demCham: "Bé đếm xem có bao nhiêu chấm tròn?",
  soTiep: "Bé tìm số tiếp theo nhé!",
  after1: "Số nào đứng ngay sau số một?",
  after2: "Số nào đứng ngay sau số hai?",
  after3: "Số nào đứng ngay sau số ba?",
  after4: "Số nào đứng ngay sau số bốn?",
  after5: "Số nào đứng ngay sau số năm?",
  after6: "Số nào đứng ngay sau số sáu?",
  after7: "Số nào đứng ngay sau số bảy?",
  after8: "Số nào đứng ngay sau số tám?",
  after9: "Số nào đứng ngay sau số chín?",

  /* —— So sánh (chọn dấu < = >) —— */
  nhieuHon: "Bên nào nhiều hơn? Bé chọn dấu đúng nhé!",
  toHon: "Bên nào to hơn? Bé chọn dấu đúng nhé!",
  daiHon: "Bên nào dài hơn? Bé chọn dấu đúng nhé!",
  caoHon: "Bên nào cao hơn? Bé chọn dấu đúng nhé!",

  /* —— Tư duy & quy luật —— */
  quyLuat: "Hình nào tiếp theo trong dãy?",
  phanLoaiAn: "Đồ nào ăn được?",
  phanLoaiMac: "Đồ nào mặc được?",
  phanLoaiChoi: "Đồ nào là đồ chơi?",
  phanLoaiDi: "Đồ nào đi lại được?",

  /* —— Hình dạng (nghe tên hình → chọn hình vẽ) —— */
  hinhTron: "Bé hãy tìm hình tròn nào!",
  hinhVuong: "Bé hãy tìm hình vuông nào!",
  hinhChuNhat: "Bé hãy tìm hình chữ nhật nào!",
  hinhTamGiac: "Bé hãy tìm hình tam giác nào!",
  hinhNgoiSao: "Bé hãy tìm ngôi sao nào!",
  hinhNguGiac: "Bé hãy tìm hình ngũ giác nào!",
  hinhLucGiac: "Bé hãy tìm hình lục giác nào!",
  hinhBatGiac: "Bé hãy tìm hình bát giác nào!",
  hinhThang: "Bé hãy tìm hình thang nào!",
  hinhBauDu: "Bé hãy tìm hình bầu dục nào!",
  hinhThoi: "Bé hãy tìm hình thoi nào!",
  hinhBanNguyet: "Bé hãy tìm hình bán nguyệt nào!",
  hinhTraiTim: "Bé hãy tìm hình trái tim nào!",

  /* —— Khen / nhắc bé —— */
  gioiQua: "Giỏi quá!",
  thuLai: "Chưa đúng, bé thử lại nhé!",
};

if (typeof module !== "undefined" && module.exports) module.exports = { VOICE_LINES };
