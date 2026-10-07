# 调研材料

给自己看的文献摘要站。页面在浏览器里直接读 `data/` 下的 Markdown，没有构建步骤。

线上地址会是 <https://xingchen-ian.github.io/research-materials/>。

## 以后怎么更新

只动数据，不用改 HTML。

1. 改 `data/digest-index.md`。一篇一行，新文献加在表的最后。已有的行可以改「状态」和「备注」，其他列尽量别重排。
2. 状态只写这四个：待读、精读、已入库、不用。
3. 课题有多个时，用中文分号「；」隔开。现在用到的是：来自生活、人机协作、三林老街、AR·MR、教学。写了新的词，筛选项里会自己出现。
4. DOI 这一格写成 Markdown 链接，例如 `[10.1145/1.2](https://doi.org/10.1145/1.2)`。页面靠 DOI 把总表和各期笔记对上。
5. 新的一期：把全文存成 `data/briefs/2026-10-08.md`（文件名用日期）。在 `data/briefs/index.json` 里加一行：

```json
{ "date": "2026-10-08", "file": "2026-10-08.md" }
```

`date` 用 `YYYY-MM-DD`。`file` 只写文件名，不要写路径。

每一篇笔记里要能找到 DOI（`10.xxxx/...` 或 `https://doi.org/...`），以及「做了什么」。关系那一栏写成「跟你的关系」「相关性」或「相关」都可以，页面上统一显示成「跟你的关系」。

改完推到 `main`。GitHub Pages 会自己更新。浏览器如果还是旧的，刷新一次即可。

## 本地打开

在仓库根目录：

```bash
python3 -m http.server 8000
```

浏览器打开 <http://127.0.0.1:8000/>。

不要双击 `index.html`。浏览器不允许一个本地文件再去读旁边的 Markdown。

## 打开 GitHub Pages

仓库需要是公开的。到 Settings → Pages → Build and deployment：

- Source 选 **Deploy from a branch**
- Branch 选 `main`，文件夹选 **/ (root)**
- 保存

等一两分钟，打开 <https://xingchen-ian.github.io/research-materials/>。

每个页面都有 `<meta name="robots" content="noindex, nofollow">`。根目录还有 `robots.txt`，写的是禁止抓取。

注意：项目站的地址在 `用户名.github.io` 的子路径下。搜索引擎只认主机根上的 `robots.txt`（也就是 `https://xingchen-ian.github.io/robots.txt`，那是另一个仓库）。所以这个文件在项目站里多半不会被读到。真正起作用的是每个页面上的 noindex。别人拿到链接仍然打得开。

## 文件

- `index.html`：文献列表，以及各期全文
- `data/digest-index.md`：总表
- `data/briefs/`：每一期的原文，加上 `index.json` 清单
- `js/vendor/marked.umd.js`：Markdown 解析，放在仓库里，不走 CDN
- `.nojekyll`：让 GitHub Pages 不要用 Jekyll 处理
