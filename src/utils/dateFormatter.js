export default function formatDateTime(inputDate, option = 2) {
  // 先解析成 Date 物件 (JS 內部會自動處理 UTC 時間)
  const date = new Date(inputDate);

  // 正確轉換為台北時間 (Asia/Taipei)
  const taipeiDate = new Date(date.toLocaleString("en-US", { timeZone: "Asia/Taipei" }));

  const now = new Date();
  const isToday = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const isYesterday = (d1, d2) => {
    const yesterday = new Date(d2);
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      d1.getFullYear() === yesterday.getFullYear() &&
      d1.getMonth() === yesterday.getMonth() &&
      d1.getDate() === yesterday.getDate()
    );
  };

  const formatTime = (date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const period = hours < 12 ? "上午" : "下午";
    let formattedHours = hours % 12 || 12; // 12 小時制
    return `${period} ${formattedHours}:${minutes}`;
  };

  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const isSameYear = taipeiDate.getFullYear() === now.getFullYear();

  if (option === 1) {
    return formatTime(taipeiDate);
  }

  if (option === 2) {
    if (isToday(taipeiDate, now)) {
      return formatTime(taipeiDate);
    } else if (isYesterday(taipeiDate, now)) {
      return "昨天";
    } else if (!isSameYear) {
      return `${taipeiDate.getFullYear()}-${formatDate(taipeiDate)}`;
    } else {
      return formatDate(taipeiDate);
    }
  }

  if (option === 3) {
    if (isToday(taipeiDate, now)) {
      return "今天";
    } else if (isYesterday(taipeiDate, now)) {
      return "昨天";
    } else if (!isSameYear) {
      return `${taipeiDate.getFullYear()}-${formatDate(taipeiDate)}`;
    } else {
      return formatDate(taipeiDate);
    }
  }

  throw new Error("Invalid option. Use 1 for time-only, 2 for date logic.");
}


// // 測試範例
// const testDate1 = "2025-01-25T00:44:02"; // 今天
// const testDate2 = "2025-01-24T15:30:00"; // 昨天
// const testDate3 = "2024-12-31T10:00:00"; // 去年

// // 僅顯示時間
// console.log(formatDateTime(testDate1, 1)); // "上午 12:44"

// // 根據日期顯示邏輯
// console.log(formatDateTime(testDate1, 2)); // "上午 12:44"（今天）
// console.log(formatDateTime(testDate2, 2)); // "昨天"
// console.log(formatDateTime(testDate3, 2)); // "2024-12-31"
