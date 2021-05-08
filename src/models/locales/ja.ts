export const jaTranslate = {
  aboutBM: '位置に応じて声が届く2Dマップ付きビデオチャットです。'
  + '会場内に複数の会話が並立し、会話間を歩き回ることができます。'
  + '画面、カメラ、テキスト、画像、YouTube、Googleドライブの文書を共有できます。マップにURL等をドロップ/ペーストできます。',
  BMmoreInfo: '詳細',
  YourName: 'お名前',
  Venue: '会場名',
  EnterTheVenue: '入場',
  Contents: '共有',
  'Create and Share': '共有 (c)',
  'Share Text':'テキストの共有',
  'Share iframe':'Webページの共有',
  'Share image':'画像の共有',
  'Select video camera to share':'共有するカメラの選択',
  shareImport: 'ファイルからインポート (_i)',
  shareDownload: 'ファイルにダウンロード (_d)',
  shareIframe: 'Webページ (_f)',
  shareText: 'テキスト (_t / 直接ペースト可)',
  shareImage: '画像 (_g / 直接ペースト可)',
  shareCamera: 'ビデオカメラ (_c)',
  shareScreenBackground:'背景に画面共有 (_b)',
  stopScreenBackground:'背景の画面共有を停止 (_b)',
  shareScreenContent:'ウィンドウに画面共有 (_s)',
  stopScreen:'画面共有ウィンドウをすべて閉じる (_w)',
  shareMouse:'マウスカーソル (_m)',
  stopMouse: 'マウスカーソルの共有停止 (_m)',
  ttCreateAndshare: '作成と共有 (_c)',
  ttMicMute: 'マイクのミュート (_m)',
  headphoneL1Chrome: 'ヘッドフォン (ステレオ / 注意:エコキャンなし)',
  headphoneL1: 'ヘッドフォン (ステレオ)',
  headphoneL2: 'スピーカー (モノラル)',
  etConnection: 'インターネット接続なし',
  emConnection: 'インターネット接続を確認してください。Binaural Meetは https を使います。インターネット接続の問題でなければ、サーバの問題かもしれません。',
  etMicPermission: 'マイク利用不可',
  emMicPermission: 'ブラウザがマイクの利用を許可しませんでした。ブラウザのURLの左の鍵のアイコンから許可し、ブラウザをリロードしてください。',
  etNoMic: 'マイクがありません',
  emNoMic: 'Binaural Meetにはマイクが必要です。パソコンにマイクがついていることを確認してください。',
  etNoChannel: 'データ通信ができません',
  emNoChannel: 'ファイアウォールの設定を確認してください。Binaural Meet は https(443番)と10000-10010番のポートに接続します。',
  imageDropzoneText:'画像をドラッグ＆ドロップするか、クリックしてください',
  lsTitle:'アバターの設定',
  lsColor:'色',
  lsColorAvatar:'アバター色',
  lsColorText:'文字色',
  lsAutoColor:'自動',
  lsName: 'お名前',
  lsImage: 'アバターの画像',
  lsEmail: 'Gravatarの画像を使う場合はEmailを入力',
  lsImageFile: '画像ファイルの場合はファイルをアップロード',
  lsSave: '保存して閉じる',
  lsCancel: ' もとに戻す ',
  lsNotification: '通知の設定',
  lsNotifyCall: '呼出',
  lsNotifyTouch: '接触',
  lsNotifyNear: '接近',
  rsCall: '呼び出す',
  rsConnectYarnPhone: '糸電話をつなぐ',
  rsCutYarnPhone: '糸電話を切る',
  rsChatTo: '{{name}}だけにチャットを送る',
  upload: 'アップロード',
  Save: '保存',
  Clear: 'クリア',
  Cancel: 'キャンセル',
  broadcastMyVoice: '声を全員に届ける',
  soundLocalizationBasedOn: '音像定位の向きの基準',
  slAvatar: 'アバターの向き',
  slUser: 'ユーザーの向き(上が前)',
  usage: '使い方',
  cmJoined: '{{name}}が参加。',
  cmLeft: '{{name}}が退出。',
  cmNameChanged: '{{old}} が {{new}} に名前を変更。',
  cmCall: '{{name}}が呼びました。',
  cmToAll: '全員へ',
  cmToName: '{{name}}へ',
  cmSend: '送信 (CTRL+Enter)',
  cmPrivate: '{{name}}から個人宛',
  noCalled: '{{name}}が呼びました。',
  noTouched: '{{name}}が触れました。',
  noNear: '{{name}}が近づきました。',
}
export type JaKeyList = keyof typeof jaTranslate
