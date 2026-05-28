/**
 * lang.js — 全局语言系统
 * 支持 EN / 简中 / 繁中 / 日 / 韩
 */
(function () {
  'use strict';

  var LANGS = {
    en:      'English',
    'zh-CN': '简体中文',
    'zh-TW': '繁體中文',
    ja:      '日本語',
    ko:      '한국어'
  };

  /* ═══ 词典 ═══ */
  var DICT = {
    // ── 主页 ──
    'Chat':           { 'zh-CN':'聊天','zh-TW':'聊天','ja':'チャット','ko':'채팅' },
    'Music':          { 'zh-CN':'音乐','zh-TW':'音樂','ja':'音楽','ko':'음악' },
    'Settings':       { 'zh-CN':'设置','zh-TW':'設定','ja':'設定','ko':'설정' },
    'Weverse':        { 'zh-CN':'Weverse','zh-TW':'Weverse','ja':'Weverse','ko':'위버스' },
    'Gallery':        { 'zh-CN':'相册','zh-TW':'相簿','ja':'アルバム','ko':'갤러리' },
    'Fortune':        { 'zh-CN':'占卜','zh-TW':'占卜','ja':'占い','ko':'점술' },
    'Weather':        { 'zh-CN':'情绪天气','zh-TW':'情緒天氣','ja':'感情天気','ko':'감정 날씨' },
    'Draw':           { 'zh-CN':'抽签','zh-TW':'抽籤','ja':'くじ引き','ko':'뽑기' },
    'World':          { 'zh-CN':'世界书','zh-TW':'世界書','ja':'ワールドブック','ko':'월드북' },
    'Memory':         { 'zh-CN':'记忆','zh-TW':'記憶','ja':'メモリー','ko':'기억' },
    'Bubble':         { 'zh-CN':'气泡','zh-TW':'氣泡','ja':'バブル','ko':'버블' },
    'Gallery':        { 'zh-CN':'相册','zh-TW':'相簿','ja':'アルバム','ko':'갤러리' },
    'Fortune':        { 'zh-CN':'占卜','zh-TW':'占卜','ja':'占い','ko':'점술' },

    // ── 聊天 ──
    'Chats':          { 'zh-CN':'聊天','zh-TW':'聊天','ja':'チャット','ko':'채팅' },
    'Contacts':       { 'zh-CN':'联系人','zh-TW':'聯絡人','ja':'連絡先','ko':'연락처' },
    'Moments':        { 'zh-CN':'朋友圈','zh-TW':'動態','ja':'モーメント','ko':'모먼트' },
    'Profile':        { 'zh-CN':'我的','zh-TW':'我的','ja':'プロフィール','ko':'프로필' },
    'Message...':     { 'zh-CN':'输入消息...','zh-TW':'輸入訊息...','ja':'メッセージ...','ko':'메시지...' },
    'Search...':      { 'zh-CN':'搜索...','zh-TW':'搜尋...','ja':'検索...','ko':'검색...' },
    'No conversations': { 'zh-CN':'暂无对话','zh-TW':'暫無對話','ja':'会話なし','ko':'대화 없음' },
    'No messages':    { 'zh-CN':'暂无消息','zh-TW':'暫無訊息','ja':'メッセージなし','ko':'메시지 없음' },
    'Today':          { 'zh-CN':'今天','zh-TW':'今天','ja':'今日','ko':'오늘' },
    'Yesterday':      { 'zh-CN':'昨天','zh-TW':'昨天','ja':'昨日','ko':'어제' },
    'typing':         { 'zh-CN':'正在输入','zh-TW':'正在輸入','ja':'入力中','ko':'입력 중' },
    'Cleared':        { 'zh-CN':'已清空','zh-TW':'已清空','ja':'クリア済み','ko':'삭제됨' },
    'Copied':         { 'zh-CN':'已复制','zh-TW':'已複製','ja':'コピー済み','ko':'복사됨' },
    'Deleted':        { 'zh-CN':'已删除','zh-TW':'已刪除','ja':'削除済み','ko':'삭제됨' },
    'Copy':           { 'zh-CN':'复制','zh-TW':'複製','ja':'コピー','ko':'복사' },
    'Reply':          { 'zh-CN':'回复','zh-TW':'回覆','ja':'返信','ko':'답장' },
    'Delete':         { 'zh-CN':'删除','zh-TW':'刪除','ja':'削除','ko':'삭제' },
    'Regenerate':     { 'zh-CN':'重新生成','zh-TW':'重新產生','ja':'再生成','ko':'재생성' },

    // ── 联系人 ──
    '+ Contact':      { 'zh-CN':'+ 添加','zh-TW':'+ 新增','ja':'+ 追加','ko':'+ 추가' },
    '+ Group':        { 'zh-CN':'+ 群组','zh-TW':'+ 群組','ja':'+ グループ','ko':'+ 그룹' },
    'Add Contact':    { 'zh-CN':'添加联系人','zh-TW':'新增聯絡人','ja':'連絡先を追加','ko':'연락처 추가' },
    'Edit':           { 'zh-CN':'编辑','zh-TW':'編輯','ja':'編集','ko':'편집' },
    'Save':           { 'zh-CN':'保存','zh-TW':'儲存','ja':'保存','ko':'저장' },
    'Saved':          { 'zh-CN':'已保存','zh-TW':'已儲存','ja':'保存済み','ko':'저장됨' },
    'Cancel':         { 'zh-CN':'取消','zh-TW':'取消','ja':'キャンセル','ko':'취소' },
    'Confirm':        { 'zh-CN':'确认','zh-TW':'確認','ja':'確認','ko':'확인' },
    'Nickname':       { 'zh-CN':'昵称','zh-TW':'暱稱','ja':'ニックネーム','ko':'닉네임' },
    'AI Name':        { 'zh-CN':'AI 名字','zh-TW':'AI 名稱','ja':'AI 名前','ko':'AI 이름' },
    'Prompt':         { 'zh-CN':'提示词','zh-TW':'提示詞','ja':'プロンプト','ko':'프롬프트' },

    // ── 卡片 ──
    'Transfer':       { 'zh-CN':'转账','zh-TW':'轉帳','ja':'送金','ko':'송금' },
    'Delivery':       { 'zh-CN':'外卖','zh-TW':'外送','ja':'デリバリー','ko':'배달' },
    'Gift':           { 'zh-CN':'礼物','zh-TW':'禮物','ja':'ギフト','ko':'선물' },
    'Accept':         { 'zh-CN':'接受','zh-TW':'接受','ja':'受け取る','ko':'수락' },
    'Decline':        { 'zh-CN':'拒绝','zh-TW':'拒絕','ja':'辞退する','ko':'거절' },
    'Accepted':       { 'zh-CN':'已接受','zh-TW':'已接受','ja':'受領済み','ko':'수락됨' },
    'Declined':       { 'zh-CN':'已拒绝','zh-TW':'已拒絕','ja':'辞退済み','ko':'거절됨' },
    'Tap to respond': { 'zh-CN':'点击回应','zh-TW':'點擊回應','ja':'タップして応答','ko':'탭하여 응답' },
    'Tap to open':    { 'zh-CN':'点击打开','zh-TW':'點擊開啟','ja':'タップして開く','ko':'탭하여 열기' },
    'Delivery arrived': { 'zh-CN':'外卖到了','zh-TW':'外送到了','ja':'配達到着','ko':'배달 도착' },
    'Gift received':  { 'zh-CN':'收到礼物','zh-TW':'收到禮物','ja':'ギフト到着','ko':'선물 도착' },

    // ── 操作面板 ──
    'Stickers':       { 'zh-CN':'表情','zh-TW':'貼圖','ja':'スタンプ','ko':'스티커' },
    'Photo':          { 'zh-CN':'照片','zh-TW':'照片','ja':'写真','ko':'사진' },
    'Voice':          { 'zh-CN':'语音','zh-TW':'語音','ja':'音声','ko':'음성' },
    'Phone':          { 'zh-CN':'手机','zh-TW':'手機','ja':'携帯','ko':'폰' },
    'Listen':         { 'zh-CN':'一起听','zh-TW':'一起聽','ja':'一緒に聴く','ko':'같이 듣기' },

    // ── 设置 ──
    'API':            { 'zh-CN':'接口','zh-TW':'介面','ja':'API','ko':'API' },
    'API Key':        { 'zh-CN':'API 密钥','zh-TW':'API 金鑰','ja':'APIキー','ko':'API 키' },
    'Base URL':       { 'zh-CN':'基础 URL','zh-TW':'基礎 URL','ja':'ベースURL','ko':'기본 URL' },
    'Model':          { 'zh-CN':'模型','zh-TW':'模型','ja':'モデル','ko':'모델' },
    'Temperature':    { 'zh-CN':'温度','zh-TW':'溫度','ja':'温度','ko':'온도' },
    'Test':           { 'zh-CN':'测试','zh-TW':'測試','ja':'テスト','ko':'테스트' },
    'Fetch':          { 'zh-CN':'获取','zh-TW':'取得','ja':'取得','ko':'가져오기' },
    'THEME':          { 'zh-CN':'主题','zh-TW':'主題','ja':'テーマ','ko':'테마' },
    'Language':       { 'zh-CN':'语言','zh-TW':'語言','ja':'言語','ko':'언어' },
    'Dark Mode':      { 'zh-CN':'深色模式','zh-TW':'深色模式','ja':'ダークモード','ko':'다크 모드' },
    'Font Family':    { 'zh-CN':'字体','zh-TW':'字型','ja':'フォント','ko':'폰트' },
    'Font Size':      { 'zh-CN':'字号','zh-TW':'字級','ja':'文字サイズ','ko':'글자 크기' },
    'Wallpaper':      { 'zh-CN':'壁纸','zh-TW':'桌布','ja':'壁紙','ko':'배경화면' },
    'APP ICONS':      { 'zh-CN':'应用图标','zh-TW':'應用圖示','ja':'アプリアイコン','ko':'앱 아이콘' },
    'Data':           { 'zh-CN':'数据','zh-TW':'資料','ja':'データ','ko':'데이터' },
    'Storage':        { 'zh-CN':'存储','zh-TW':'儲存空間','ja':'ストレージ','ko':'저장공간' },
    'Chats Today':    { 'zh-CN':'今日聊天','zh-TW':'今日聊天','ja':'今日のチャット','ko':'오늘 채팅' },
    'Notes':          { 'zh-CN':'笔记','zh-TW':'筆記','ja':'ノート','ko':'노트' },
    'Tokens':         { 'zh-CN':'令牌','zh-TW':'令牌','ja':'トークン','ko':'토큰' },
    'Export':         { 'zh-CN':'导出','zh-TW':'匯出','ja':'エクスポート','ko':'내보내기' },
    'Import':         { 'zh-CN':'导入','zh-TW':'匯入','ja':'インポート','ko':'가져오기' },
    'Clear All':      { 'zh-CN':'清除全部','zh-TW':'清除全部','ja':'すべて削除','ko':'모두 삭제' },
    'Reset All Icons': { 'zh-CN':'重置图标','zh-TW':'重置圖示','ja':'アイコンリセット','ko':'아이콘 초기화' },
    'System Default': { 'zh-CN':'系统默认','zh-TW':'系統預設','ja':'システム標準','ko':'시스템 기본' },
    'Pick':           { 'zh-CN':'选择','zh-TW':'選擇','ja':'選択','ko':'선택' },
    'Clear':          { 'zh-CN':'清除','zh-TW':'清除','ja':'クリア','ko':'지우기' },
    'Upload':         { 'zh-CN':'上传','zh-TW':'上傳','ja':'アップロード','ko':'업로드' },
    'No custom font': { 'zh-CN':'无自定义字体','zh-TW':'無自訂字型','ja':'カスタムフォントなし','ko':'커스텀 폰트 없음' },

    // ── 个人 ──
    'Appearance':     { 'zh-CN':'外观','zh-TW':'外觀','ja':'外観','ko':'외관' },
    'Accounts':       { 'zh-CN':'账号','zh-TW':'帳號','ja':'アカウント','ko':'계정' },
    '+ Account':      { 'zh-CN':'+ 账号','zh-TW':'+ 帳號','ja':'+ アカウント','ko':'+ 계정' },
    'Active':         { 'zh-CN':'当前','zh-TW':'目前','ja':'アクティブ','ko':'활성' },
    'Balance':        { 'zh-CN':'余额','zh-TW':'餘額','ja':'残高','ko':'잔액' },
    'Name':           { 'zh-CN':'名字','zh-TW':'名稱','ja':'名前','ko':'이름' },
    'Avatar':         { 'zh-CN':'头像','zh-TW':'頭像','ja':'アバター','ko':'아바타' },
    'Wallet':         { 'zh-CN':'钱包','zh-TW':'錢包','ja':'ウォレット','ko':'지갑' },

    // ── 朋友圈 ──
    'Post':           { 'zh-CN':'发布','zh-TW':'發布','ja':'投稿','ko':'게시' },
    'Auto Post':      { 'zh-CN':'自动发布','zh-TW':'自動發布','ja':'自動投稿','ko':'자동 게시' },
    'Banner':         { 'zh-CN':'封面','zh-TW':'封面','ja':'バナー','ko':'배너' },
    'Comment':        { 'zh-CN':'评论','zh-TW':'留言','ja':'コメント','ko':'댓글' },
    'New Post':       { 'zh-CN':'新动态','zh-TW':'新動態','ja':'新規投稿','ko':'새 게시물' },
    'No posts':       { 'zh-CN':'暂无动态','zh-TW':'暫無動態','ja':'投稿なし','ko':'게시물 없음' },

    // ── 通用 ──
    'Close':          { 'zh-CN':'关闭','zh-TW':'關閉','ja':'閉じる','ko':'닫기' },
    'Back':           { 'zh-CN':'返回','zh-TW':'返回','ja':'戻る','ko':'뒤로' },
    'Send':           { 'zh-CN':'发送','zh-TW':'傳送','ja':'送信','ko':'전송' },
    'Create':         { 'zh-CN':'创建','zh-TW':'建立','ja':'作成','ko':'생성' },
    'Add':            { 'zh-CN':'添加','zh-TW':'新增','ja':'追加','ko':'추가' },
    'Order':          { 'zh-CN':'下单','zh-TW':'下單','ja':'注文','ko':'주문' },
    'Amount':         { 'zh-CN':'金额','zh-TW':'金額','ja':'金額','ko':'금액' },
    'What?':          { 'zh-CN':'什么？','zh-TW':'什麼？','ja':'何？','ko':'뭐?' },
    'Translate':      { 'zh-CN':'翻译','zh-TW':'翻譯','ja':'翻訳','ko':'번역' },
    'Translated':     { 'zh-CN':'已翻译','zh-TW':'已翻譯','ja':'翻訳済み','ko':'번역됨' },
    'Error':          { 'zh-CN':'错误','zh-TW':'錯誤','ja':'エラー','ko':'오류' },
    'Failed':         { 'zh-CN':'失败','zh-TW':'失敗','ja':'失敗','ko':'실패' },
    'Loading...':     { 'zh-CN':'加载中...','zh-TW':'載入中...','ja':'読込中...','ko':'로딩...' },

    // ── 占卜 ──
    'I Ching':        { 'zh-CN':'六爻','zh-TW':'六爻','ja':'易経','ko':'주역' },
    'Tarot':          { 'zh-CN':'塔罗','zh-TW':'塔羅','ja':'タロット','ko':'타로' },
    'Your question':  { 'zh-CN':'你的问题','zh-TW':'你的問題','ja':'あなたの質問','ko':'당신의 질문' },
    'History':        { 'zh-CN':'历史','zh-TW':'歷史','ja':'履歴','ko':'기록' },

    // ── 情绪天气 ──
    'Emotion Weather':    { 'zh-CN':'情绪天气','zh-TW':'情緒天氣','ja':'感情天気','ko':'감정 날씨' },
    'Check My Weather':   { 'zh-CN':'查看我的天气','zh-TW':'查看我的天氣','ja':'天気を確認','ko':'내 날씨 확인' },
    'Refresh Reading':    { 'zh-CN':'重新分析','zh-TW':'重新分析','ja':'再分析','ko':'다시 분석' },
    'All Conversations':  { 'zh-CN':'所有对话','zh-TW':'所有對話','ja':'すべての会話','ko':'모든 대화' },
    'No reading yet today': { 'zh-CN':'今天还没有分析','zh-TW':'今天還沒有分析','ja':'今日はまだ分析なし','ko':'오늘은 아직 분석 없음' },

    // ── 随机抽签 ──
    'Random Draw':    { 'zh-CN':'随机抽签','zh-TW':'隨機抽籤','ja':'ランダム抽選','ko':'랜덤 뽑기' },
    'Let fate decide': { 'zh-CN':'让命运决定','zh-TW':'讓命運決定','ja':'運命に任せる','ko':'운명에 맡기기' },
    'Custom Draw':    { 'zh-CN':'自定义抽签','zh-TW':'自訂抽籤','ja':'カスタム抽選','ko':'커스텀 뽑기' },
    'Quick Picks':    { 'zh-CN':'快速选择','zh-TW':'快速選擇','ja':'クイック選択','ko':'빠른 선택' },
    'Draw!':          { 'zh-CN':'抽！','zh-TW':'抽！','ja':'引く！','ko':'뽑기!' },

    // ── 主页输入 ──
    "What's on your mind?": { 'zh-CN':'在想什么？','zh-TW':'在想什麼？','ja':'何を考えてる？','ko':'무슨 생각해?' },

    // ── Gallery ──
    'photos':             { 'zh-CN':'张照片','zh-TW':'張照片','ja':'枚の写真','ko':'장의 사진' },
    'AI Photo Album':     { 'zh-CN':'AI 相册','zh-TW':'AI 相簿','ja':'AIフォトアルバム','ko':'AI 사진첩' },
    'New Album':          { 'zh-CN':'新建相册','zh-TW':'新建相簿','ja':'新規アルバム','ko':'새 앨범' },
    'Sync Chat':          { 'zh-CN':'同步聊天','zh-TW':'同步聊天','ja':'チャット同期','ko':'채팅 동기화' },
    'Albums':             { 'zh-CN':'相册','zh-TW':'相簿','ja':'アルバム','ko':'앨범' },
    'Chat Photos':        { 'zh-CN':'聊天图片','zh-TW':'聊天圖片','ja':'チャット写真','ko':'채팅 사진' },
    'No photos yet':      { 'zh-CN':'还没有照片','zh-TW':'還沒有照片','ja':'写真はまだありません','ko':'사진이 없습니다' },
    'Create an album or send images in chat': { 'zh-CN':'创建相册或在聊天中发送图片','zh-TW':'建立相簿或在聊天中傳送圖片','ja':'アルバムを作成するかチャットで画像を送信','ko':'앨범을 만들거나 채팅에서 이미지 전송' },
    'No AI photos':       { 'zh-CN':'没有 AI 照片','zh-TW':'沒有 AI 照片','ja':'AI写真なし','ko':'AI 사진 없음' },
    'Add photos with descriptions for AI to use in chat': { 'zh-CN':'添加带描述的照片供 AI 在聊天中使用','zh-TW':'新增帶描述的照片供 AI 在聊天中使用','ja':'説明付きの写真を追加してAIがチャットで使用','ko':'설명과 함께 사진을 추가하여 AI가 채팅에서 사용' },
    'How it works':       { 'zh-CN':'使用方法','zh-TW':'使用方法','ja':'使い方','ko':'사용 방법' },
    'Add AI Photo':       { 'zh-CN':'添加 AI 照片','zh-TW':'新增 AI 照片','ja':'AI写真を追加','ko':'AI 사진 추가' },
    'Edit Photo':         { 'zh-CN':'编辑照片','zh-TW':'編輯照片','ja':'写真を編集','ko':'사진 편집' },
    'Local File':         { 'zh-CN':'本地文件','zh-TW':'本機檔案','ja':'ローカルファイル','ko':'로컬 파일' },
    'From URL':           { 'zh-CN':'从 URL','zh-TW':'從 URL','ja':'URLから','ko':'URL에서' },
    'Tap to select':      { 'zh-CN':'点击选择','zh-TW':'點擊選擇','ja':'タップして選択','ko':'탭하여 선택' },
    'Description (AI uses this to match)': { 'zh-CN':'描述（AI 用此匹配）','zh-TW':'描述（AI 用此配對）','ja':'説明（AIがマッチングに使用）','ko':'설명 (AI가 매칭에 사용)' },
    'Tags (comma separated)': { 'zh-CN':'标签（逗号分隔）','zh-TW':'標籤（逗號分隔）','ja':'タグ（カンマ区切り）','ko':'태그 (쉼표로 구분)' },
    'Add Photo':          { 'zh-CN':'添加照片','zh-TW':'新增照片','ja':'写真を追加','ko':'사진 추가' },
    'Photo added':        { 'zh-CN':'照片已添加','zh-TW':'照片已新增','ja':'写真を追加しました','ko':'사진 추가됨' },
    'Album created':      { 'zh-CN':'相册已创建','zh-TW':'相簿已建立','ja':'アルバム作成済み','ko':'앨범 생성됨' },
    'No description':     { 'zh-CN':'无描述','zh-TW':'無描述','ja':'説明なし','ko':'설명 없음' },
    'Album Name':         { 'zh-CN':'相册名称','zh-TW':'相簿名稱','ja':'アルバム名','ko':'앨범 이름' },
    'Empty album':        { 'zh-CN':'空相册','zh-TW':'空相簿','ja':'空のアルバム','ko':'빈 앨범' },
    'Tap + to add':       { 'zh-CN':'点击 + 添加','zh-TW':'點擊 + 新增','ja':'+ をタップして追加','ko':'+ 를 탭하여 추가' },
    'Rename':             { 'zh-CN':'重命名','zh-TW':'重新命名','ja':'名前変更','ko':'이름 변경' },
    'Renamed':            { 'zh-CN':'已重命名','zh-TW':'已重新命名','ja':'名前変更済み','ko':'이름 변경됨' },
    'Add Photos':         { 'zh-CN':'添加照片','zh-TW':'新增照片','ja':'写真を追加','ko':'사진 추가' },
    'Delete Album':       { 'zh-CN':'删除相册','zh-TW':'刪除相簿','ja':'アルバムを削除','ko':'앨범 삭제' },
    'Delete this photo?': { 'zh-CN':'删除这张照片？','zh-TW':'刪除這張照片？','ja':'この写真を削除？','ko':'이 사진을 삭제?' },
    'Clear all photos in this album?': { 'zh-CN':'清空此相册中的所有照片？','zh-TW':'清空此相簿中的所有照片？','ja':'このアルバムの全写真を削除？','ko':'이 앨범의 모든 사진을 삭제?' },
    'Delete this album?': { 'zh-CN':'删除此相册？','zh-TW':'刪除此相簿？','ja':'このアルバムを削除？','ko':'이 앨범을 삭제?' },
    'Select a photo':     { 'zh-CN':'请选择照片','zh-TW':'請選擇照片','ja':'写真を選択してください','ko':'사진을 선택하세요' },
    'Add a description':  { 'zh-CN':'请添加描述','zh-TW':'請新增描述','ja':'説明を追加してください','ko':'설명을 추가하세요' },
    'synced':             { 'zh-CN':'已同步','zh-TW':'已同步','ja':'同期済み','ko':'동기화됨' },
    'No chat photos':     { 'zh-CN':'没有聊天图片','zh-TW':'沒有聊天圖片','ja':'チャット写真なし','ko':'채팅 사진 없음' },
    'Description':        { 'zh-CN':'描述','zh-TW':'描述','ja':'説明','ko':'설명' },
    'Tags':               { 'zh-CN':'标签','zh-TW':'標籤','ja':'タグ','ko':'태그' },
    'Enter a name':       { 'zh-CN':'请输入名称','zh-TW':'請輸入名稱','ja':'名前を入力','ko':'이름을 입력하세요' },
    'Updated':            { 'zh-CN':'已更新','zh-TW':'已更新','ja':'更新済み','ko':'업데이트됨' },

    // ── Fortune (extended) ──
    'readings':           { 'zh-CN':'次占卜','zh-TW':'次占卜','ja':'回の占い','ko':'회 점술' },
    'Last reading':       { 'zh-CN':'上次占卜','zh-TW':'上次占卜','ja':'前回の占い','ko':'마지막 점술' },
    'Cast hexagram with three coins': { 'zh-CN':'三枚铜钱起卦','zh-TW':'三枚銅錢起卦','ja':'三枚のコインで卦を立てる','ko':'동전 세 개로 괘 세우기' },
    'Draw cards from 78-card deck': { 'zh-CN':'从78张牌中抽取','zh-TW':'從78張牌中抽取','ja':'78枚のデッキからカードを引く','ko':'78장 덱에서 카드 뽑기' },
    'Spread':             { 'zh-CN':'牌阵','zh-TW':'牌陣','ja':'スプレッド','ko':'스프레드' },
    'Single':             { 'zh-CN':'单张','zh-TW':'單張','ja':'1枚','ko':'싱글' },
    'Past \u00b7 Now \u00b7 Future': { 'zh-CN':'过去 · 现在 · 未来','zh-TW':'過去 · 現在 · 未來','ja':'過去 · 現在 · 未来','ko':'과거 · 현재 · 미래' },
    'Celtic Cross':       { 'zh-CN':'凯尔特十字','zh-TW':'凱爾特十字','ja':'ケルト十字','ko':'켈틱 크로스' },
    'Cast Coins':         { 'zh-CN':'掷铜钱','zh-TW':'擲銅錢','ja':'コインを投げる','ko':'동전 던지기' },
    'Draw Cards':         { 'zh-CN':'抽牌','zh-TW':'抽牌','ja':'カードを引く','ko':'카드 뽑기' },
    'Enter your question': { 'zh-CN':'请输入你的问题','zh-TW':'請輸入你的問題','ja':'質問を入力してください','ko':'질문을 입력하세요' },
    'Casting hexagram...': { 'zh-CN':'正在起卦...','zh-TW':'正在起卦...','ja':'卦を立てています...','ko':'괘 세우는 중...' },
    'Throwing coins...':  { 'zh-CN':'掷钱中...','zh-TW':'擲錢中...','ja':'コインを投げています...','ko':'동전 던지는 중...' },
    'Interpreting hexagram...': { 'zh-CN':'正在解卦...','zh-TW':'正在解卦...','ja':'卦を解釈中...','ko':'괘 해석 중...' },
    'Drawing cards...':   { 'zh-CN':'正在抽牌...','zh-TW':'正在抽牌...','ja':'カードを引いています...','ko':'카드 뽑는 중...' },
    'Shuffling deck...':  { 'zh-CN':'洗牌中...','zh-TW':'洗牌中...','ja':'シャッフル中...','ko':'셔플 중...' },
    'Reading the cards...': { 'zh-CN':'正在解读...','zh-TW':'正在解讀...','ja':'カードを読んでいます...','ko':'카드 읽는 중...' },
    'Again':              { 'zh-CN':'再来','zh-TW':'再來','ja':'もう一度','ko':'다시' },
    'No readings yet':    { 'zh-CN':'还没有占卜记录','zh-TW':'還沒有占卜記錄','ja':'まだ占い記録なし','ko':'아직 점술 기록 없음' },
    'Focus your mind, ask one question...': { 'zh-CN':'静心凝神，提出一个问题...','zh-TW':'靜心凝神，提出一個問題...','ja':'心を集中して、一つの質問を...','ko':'마음을 집중하고 질문을 하세요...' },
    'What guidance do you seek...': { 'zh-CN':'你在寻求什么指引...','zh-TW':'你在尋求什麼指引...','ja':'どんな導きを求めますか...','ko':'어떤 안내를 원하시나요...' },
    'Guidance':           { 'zh-CN':'指引','zh-TW':'指引','ja':'ガイダンス','ko':'안내' },
    'Past':               { 'zh-CN':'过去','zh-TW':'過去','ja':'過去','ko':'과거' },
    'Present':            { 'zh-CN':'现在','zh-TW':'現在','ja':'現在','ko':'현재' },
    'Future':             { 'zh-CN':'未来','zh-TW':'未來','ja':'未来','ko':'미래' },
    'Situation':          { 'zh-CN':'现状','zh-TW':'現狀','ja':'状況','ko':'상황' },
    'Challenge':          { 'zh-CN':'挑战','zh-TW':'挑戰','ja':'課題','ko':'도전' },
    'Foundation':         { 'zh-CN':'基础','zh-TW':'基礎','ja':'基盤','ko':'기반' },
    'Near Future':        { 'zh-CN':'近期','zh-TW':'近期','ja':'近い未来','ko':'가까운 미래' },
    'Outcome':            { 'zh-CN':'结果','zh-TW':'結果','ja':'結果','ko':'결과' },
    'Reversed':           { 'zh-CN':'逆位','zh-TW':'逆位','ja':'逆位置','ko':'역방향' },

    // ── Emotion Weather (extended) ──
    'Recent':             { 'zh-CN':'最近','zh-TW':'最近','ja':'最近','ko':'최근' },
    'Clear History':      { 'zh-CN':'清除历史','zh-TW':'清除歷史','ja':'履歴をクリア','ko':'기록 삭제' },
    'Tap below to check your emotional weather': { 'zh-CN':'点击下方查看你的情绪天气','zh-TW':'點擊下方查看你的情緒天氣','ja':'下のボタンで感情天気をチェック','ko':'아래를 탭하여 감정 날씨 확인' },
    'Reading your emotions...': { 'zh-CN':'正在分析你的情绪...','zh-TW':'正在分析你的情緒...','ja':'感情を分析中...','ko':'감정 분석 중...' },
    'Weather updated':    { 'zh-CN':'天气已更新','zh-TW':'天氣已更新','ja':'天気を更新しました','ko':'날씨 업데이트됨' },
    'No messages to analyze': { 'zh-CN':'没有可分析的消息','zh-TW':'沒有可分析的訊息','ja':'分析するメッセージなし','ko':'분석할 메시지 없음' },
    'Set API key first':  { 'zh-CN':'请先设置 API 密钥','zh-TW':'請先設定 API 金鑰','ja':'先にAPIキーを設定','ko':'먼저 API 키를 설정하세요' },

    // ── Random Draw (extended) ──
    'Last Draw':          { 'zh-CN':'上次抽签','zh-TW':'上次抽籤','ja':'前回の抽選','ko':'마지막 뽑기' },
    'draws':              { 'zh-CN':'次抽签','zh-TW':'次抽籤','ja':'回の抽選','ko':'회 뽑기' },
    'Shuffling...':       { 'zh-CN':'打乱中...','zh-TW':'打亂中...','ja':'シャッフル中...','ko':'섞는 중...' },
    'No draws yet':       { 'zh-CN':'还没有抽签记录','zh-TW':'還沒有抽籤記錄','ja':'まだ抽選記録なし','ko':'아직 뽑기 기록 없음' },
    'Enter some options': { 'zh-CN':'请输入选项','zh-TW':'請輸入選項','ja':'オプションを入力してください','ko':'옵션을 입력하세요' },
    'Need at least 2 options': { 'zh-CN':'至少需要2个选项','zh-TW':'至少需要2個選項','ja':'少なくとも2つのオプションが必要','ko':'최소 2개 옵션 필요' },
    'Tap to close':       { 'zh-CN':'点击关闭','zh-TW':'點擊關閉','ja':'タップして閉じる','ko':'탭하여 닫기' },
    'options':            { 'zh-CN':'个选项','zh-TW':'個選項','ja':'個のオプション','ko':'개 옵션' }
  };

  /* ═══ 核心翻译函数 ═══ */
  function T(key) {
    var lang = Storage.get('globalLang', '') || 'en';
    if (lang === 'en') return key;
    var entry = DICT[key];
    if (!entry) return key;
    return entry[lang] || key;
  }

  /* ═══ DOM 扫描翻译 ═══ */
  function translatePage() {
    var lang = Storage.get('globalLang', '') || 'en';

    // data-i18n 属性
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      var val = T(key);
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });

    // App 名称
    document.querySelectorAll('.app-name').forEach(function (el) {
      var text = el.textContent.trim();
      // 查找原始 key（可能已经被翻译过）
      var origKey = el.getAttribute('data-orig') || text;
      el.setAttribute('data-orig', origKey);
      var val = T(origKey);
      el.textContent = val;
    });

    // Dock 项
    document.querySelectorAll('.dock-item span').forEach(function (el) {
      var origKey = el.getAttribute('data-orig') || el.textContent.trim();
      el.setAttribute('data-orig', origKey);
      el.textContent = T(origKey);
    });

    // Hero input placeholder
    var heroInput = document.getElementById('main-input');
    if (heroInput) heroInput.placeholder = T("What's on your mind?");

    // Chat tab buttons
    document.querySelectorAll('.chat-tab-btn span').forEach(function (el) {
      var origKey = el.getAttribute('data-orig') || el.textContent.trim();
      el.setAttribute('data-orig', origKey);
      el.textContent = T(origKey);
    });

    // Settings section titles
    document.querySelectorAll('.settings-section-title').forEach(function (el) {
      var origKey = el.getAttribute('data-orig') || el.textContent.trim();
      el.setAttribute('data-orig', origKey);
      el.textContent = T(origKey);
    });

    // Settings labels
    document.querySelectorAll('.settings-label').forEach(function (el) {
      var text = el.textContent.trim();
      // 只翻译纯文本的 label（不含 strong 等子元素）
      if (el.children.length === 0) {
        var origKey = el.getAttribute('data-orig') || text;
        el.setAttribute('data-orig', origKey);
        el.textContent = T(origKey);
      }
    });

    // Modal titles
    document.querySelectorAll('.modal-title').forEach(function (el) {
      var origKey = el.getAttribute('data-orig') || el.textContent.trim();
      el.setAttribute('data-orig', origKey);
      el.textContent = T(origKey);
    });

    // 按钮文字
    document.querySelectorAll('.s-btn, .s-btn-sm, .s-btn-outline, .s-btn-danger, .btn-secondary').forEach(function (el) {
      if (el.children.length > 0) return;
      var origKey = el.getAttribute('data-orig') || el.textContent.trim();
      el.setAttribute('data-orig', origKey);
      var val = T(origKey);
      if (val !== origKey) el.textContent = val;
    });

    // 语言选择器显示
    var langDisplay = document.getElementById('lang-current');
    if (langDisplay) langDisplay.textContent = LANGS[lang] || 'English';
  }

  /* ═══ 初始化 ═══ */
  function initLangSelector() {
    var container = document.getElementById('theme-lang-area');
    if (!container) return;

    var current = Storage.get('globalLang', '') || 'en';

    container.innerHTML =
      '<div class="settings-item">' +
        '<label class="settings-label">' + T('Language') + '</label>' +
        '<select id="set-global-lang" class="s-select">' +
          Object.keys(LANGS).map(function (code) {
            return '<option value="' + code + '"' + (current === code ? ' selected' : '') + '>' + LANGS[code] + '</option>';
          }).join('') +
        '</select>' +
      '</div>';

    document.getElementById('set-global-lang').addEventListener('change', function () {
      Storage.set('globalLang', this.value);
      translatePage();
      Toast.success(LANGS[this.value]);
    });
  }

  /* ═══ 监听 ═══ */
  document.addEventListener('modalOpen', function (e) {
    if (e.detail && e.detail.name === 'settings') {
      setTimeout(initLangSelector, 60);
    }
    // 每次打开 modal 都翻译一次
    setTimeout(translatePage, 100);
  });

  // 页面加载后翻译
      function init() {
    var lang = Storage.get('globalLang', '') || 'en';
    if (lang !== 'en') {
      setTimeout(translatePage, 500);
    }
  }


  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // 全局暴露
  window.T = T;
  window.translatePage = translatePage;
})();
