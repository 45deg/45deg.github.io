# 辞書データの出典と利用条件

`public/wordkin.bundle`、`data/trees/`、およびそれらに含まれるWiktionary由来の本文・加工データには [Creative Commons Attribution-ShareAlike 4.0 International（CC BY-SA 4.0）](https://creativecommons.org/licenses/by-sa/4.0/) を適用します。[ライセンス全文](https://creativecommons.org/licenses/by-sa/4.0/legalcode.en)を参照してください。コードに適用するMITライセンスは、これらのデータには適用しません。

## 出典と帰属

- 原文の執筆者：英語版Wiktionaryの各項目の投稿者。アプリの語義表示に原文リンクを設けており、投稿者は各項目の編集履歴で確認できます。
- 抽出：[Wiktextract](https://github.com/tatuylonen/wiktextract)。
- 配布：[Kaikkiのrawデータ](https://kaikki.org/dictionary/rawdata.html)。
- 加工：Wordkinの開発者。各補正ツリーの出典・リビジョン・確認情報は `data/trees/` の各ファイルに記録しています。

同梱バンドルの原本SHA-256は `504d55e7053c742ffe24b49a6ebd0c8261a1cd4b352702a1940547088829f5e1` です。配布バンドルのSHA-256と件数は `data/build-report.json` に記録しています。静的配布版では同じ記録を `build-report.json`、バンドルを `wordkin.bundle` として配置します。補正ツリーはソースリポジトリに含め、原本ダンプは同梱しません。

## 加工内容

英語項目と接続する語源参照、対応する語義・品詞を抽出しています。音声・翻訳・用例などは省き、言語・綴り・語源の区別を保持して参照先を照合しています。一意に解決できない参照は未確定ノードとし、確認済みの経路を補正ツリーで追加しています。検索・グラフ・語義を圧縮した独自バンドルに変換しています。

## 再配布

データを共有・改変して配布する際は、出典とライセンスへのリンク、加工したことの表示を保持してください。改変物の配布にはCC BY-SA 4.0の継承条件が適用されます。この文書は利用条件の説明であり、ライセンス全文に代わるものではありません。

項目固有の引用などには別の条件がある場合があります。[Wiktionaryの著作権情報](https://en.wiktionary.org/wiki/Wiktionary:Copyrights)も参照してください。WordkinはKaikki、Wiktionary、Wikimediaによる公式サービスではありません。
