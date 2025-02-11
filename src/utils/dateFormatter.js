export default function formatDateTime(inputDate, option = 2) {
  // 先將日期字符串轉換為 Date 物件，並確保它是 UTC 時間
  const date = new Date(inputDate);
  
  // 確保這個時間是 UTC 時間，並將它轉換為台北時區 (UTC +8)
  const taipeiOffset = 8 * 60; // 台北時區的偏移量，單位是分鐘

  // 取得 UTC 時間的時間戳（以毫秒為單位），並加上 8 小時
  const utcTime = date.getTime() + taipeiOffset * 60 * 1000;

  // 轉換回新的日期物件，這個日期就是台北時間 (UTC+8)
  const taipeiDate = new Date(utcTime);

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
    if (period === "上午" && formattedHours === 12) {
      formattedHours = 12;
    }
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
    // 僅顯示時間，上午/下午 hh:mm
    return formatTime(taipeiDate);
  }

  if (option === 2) {
    // 根據日期顯示邏輯
    if (isToday(taipeiDate, now)) {
      return formatTime(taipeiDate); // 如果是今天，顯示時間
    } else if (isYesterday(taipeiDate, now)) {
      return "昨天"; // 如果是昨天，顯示昨天
    } else if (!isSameYear) {
      return `${taipeiDate.getFullYear()}-${formatDate(taipeiDate)}`; // 如果不是同一年，顯示年份和日期
    } else {
      return formatDate(taipeiDate); // 其他情況，僅顯示日期
    }
  }

  if (option === 3) {
    // 根據日期顯示邏輯
    if (isToday(taipeiDate, now)) {
      return "今天"; // 如果是今天，顯示今天
    } else if (isYesterday(taipeiDate, now)) {
      return "昨天"; // 如果是昨天，顯示昨天
    } else if (!isSameYear) {
      return `${taipeiDate.getFullYear()}-${formatDate(taipeiDate)}`; // 如果不是同一年，顯示年份和日期
    } else {
      return formatDate(taipeiDate); // 其他情況，僅顯示日期
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
