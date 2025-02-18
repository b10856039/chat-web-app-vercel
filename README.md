# Side Project 多人聊天應用 - 前端展示網頁
此專案為透過Vue3.js建置前端網頁伺服器供使用者進行多人與朋友的聊天應用。
目前已在Vercel進行上線，可透過以下網址前往前端網頁進行使用。

[多人聊天應用](https://chat-web-app-vercel.vercel.app/ "link")

[後端伺服器Github](https://github.com/b10856039/chat-web-app-backend-render/ link)

## 開發規格與環境說明

### 開發環境
 * 作業系統 Window 11
 * 開發工具 Visual Studio Code 1.97.2
 * 環境框架 Node.js 20.12.2

### 系統語言
 * Javascript ES6

### 系統套件

* 上線環境
   * vue 3.5.13
   * vue-router 4.5.0
   * sass 1.83.4
   * sass-loader 16.0.4
   * element-plus 2.9.3
   * element-plus/icons-vue 2.3.1
   * microsoft/signalr 8.0.7

* 開發環境
   * vitejs/plugin-vue 5.2.1
   * vite 6.0.5
   * vite-plugin-vue-devtools 7.6.8

### 雲端部署
 * 部署環境 Vercel

## 建置流程
1. 使用 git clone 或是 直接下載github的檔案。
2. 在有package.json的路徑使用template輸入並執行
   ``` XML
   npm install
   ```
   下載所需套件。
4. 找到.env檔案，將內部的config進行設定。
5. 在有main.js的路徑使用template輸入並執行
   ``` XML
   npm run dev
   ```
   即可啟動測試伺服器。

## 網頁功能說明

### 多人群組功能
可從"管理"介面進行群組功能管理，並於包含群組的選項內選取聊天室進行聊天
  * 具有群組功能管理
  * 具有即時聊天功能

### 朋友私聊功能
可從"管理"介面進行朋友管理，並於包含朋友的選項內選取好友進行聊天
  * 具有朋友功能管理
  * 具有即時聊天功能

### 個人設定
可對個人帳號資訊進行設定
  * 設定使用者資訊、大頭貼等內容
  * 設定密碼


 
