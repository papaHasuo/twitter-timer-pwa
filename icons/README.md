# PWA用アイコンファイル

このフォルダには以下のサイズのアイコンファイルが必要です：

## 必要なアイコンサイズ
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

## アイコン作成方法

### 1. オンラインツール
- **Favicon.io**: https://favicon.io/
- **PWA Builder**: https://www.pwabuilder.com/
- **Real Favicon Generator**: https://realfavicongenerator.net/

### 2. デザインツール
- Canva, Figma, Adobe Illustrator等でSVGを作成
- SVGを各サイズのPNGに変換

### 3. 推奨デザイン
- シンプルで認識しやすい
- 背景は透明または単色
- ⏰や📱のような時計・スマホアイコンがおすすめ

### 4. 自動生成スクリプト例
```bash
# ImageMagickを使用してサイズ変換
convert source.png -resize 72x72 icon-72x72.png
convert source.png -resize 96x96 icon-96x96.png
convert source.png -resize 128x128 icon-128x128.png
convert source.png -resize 144x144 icon-144x144.png
convert source.png -resize 152x152 icon-152x152.png
convert source.png -resize 192x192 icon-192x192.png
convert source.png -resize 384x384 icon-384x384.png
convert source.png -resize 512x512 icon-512x512.png
```

現在は仮のファイルパスを使用していますが、実際のアイコンファイルに置き換えてください。
