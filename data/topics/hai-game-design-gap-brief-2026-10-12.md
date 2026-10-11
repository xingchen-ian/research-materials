# 专题简报：游戏制作/设计中的人与 AI 协作（空白摸底）

日期：2026-10-12  
范围：优先 2024–2026；空白判断以近两年为主。  
方法：以 Xingchen 总表/摘要中的种子文献为底图，补检索 CHI / CHI PLAY / FDG / DiGRA / ACM CSUR / arXiv，DOI 均经 doi.org Handle 核对。  
附录：同目录 `hai-game-design-corpus-2026-10-12.md`

---

## 1. 结论

近两年「人机协作做游戏」已经从零散工具 demo，长成三条并行线：**流水线工具与设计者控制权**、**故事/文本→可玩原型**、**教学场景里的共创与教师角色**。质性侧也有了第一部整合性综合（Ternar et al., CHI 2026），把「人在环 refinement 是常态」「效率有条件」「作者身份与风格扁平化有风险」写进了可引用的证据库。

工具论文多，**机制/规则层的双向共创**、**个人经验如何穿过 AI 而不丢意图**、**教学里可检查的评估与教师控制**这三块仍薄。对 Xingchen 来说，最高相关空白是：

> **「来自生活」的经验材料，如何在 GenAI 协作流水线里被保留、检查、改写——而不是在提示词和多代理生成里被冲淡。**

其次是：**教师对学生–AI 共创过程的可控映射与评分依据**；再次是：**关卡/资产之外的机制与系统设计共创**。

---

## 2. 版图地图

### A. 质性综合与行业感知（看清「大家在说什么」）

| 代表 | 一句话 |
|------|--------|
| Ternar, Denisova, Cunha, Kultima, Guckelsberger — *Generative AI in Game Development: A Qualitative Research Synthesis*，CHI 2026，[10.1145/3772318.3791206](https://doi.org/10.1145/3772318.3791206) | 对 2020–2025 共 10 项质性研究做 meta-ethnography，抽出 9 个主题；结论包括：人在环 refinement 是生产常态、价值主要在早期 ideation、效率有阶段/资产依赖、管治与作者身份是采用门槛。 |
| Alharthi — *Generative AI in Game Design: Enhancing Creativity or Constraining Innovation?*，*J. Intelligence* 2025，[10.3390/jintelligence13060060](https://doi.org/10.3390/jintelligence13060060) | 业界问卷 n=42 + 访谈 n=9：加速 ideation/原型，同时担心原创性、依赖、作者与伦理。 |
| Margarido, Roque, Machado, Martins — *Boosting Mixed-Initiative Co-Creativity in Game Design: A Tutorial*，ACM Computing Surveys，[10.1145/3759914](https://doi.org/10.1145/3759914) | 提出 MI-CCy Quantifier；明确指出 game systems 类共创工具稀缺、可解释性普遍偏低、评估标准未定型。 |

### B. 工具 / 流水线与设计者控制权

| 代表 | 一句话 |
|------|--------|
| Baars et al. — *Ctrl + Create*，FDG 2026，[10.1145/3815598.3815646](https://doi.org/10.1145/3815598.3815646) | Unity 插件把空间布局控制接回文生图；相对裸 Stable Diffusion，感知控制与视觉表达更好。 |
| Earle et al. — *DreamGarden*，CHI 2025，[10.1145/3706598.3714233](https://doi.org/10.1145/3706598.3714233) | 单条高层提示（梦/记忆/场景）→ 可编辑计划树 → Unreal 子模块实现；人可修剪、反馈。 |
| Li et al. — *AutoBG*，arXiv 2026，[10.48550/arXiv.2606.01976](https://doi.org/10.48550/arXiv.2606.01976) | 桌游端到端：对话 ideation → 规则书生成 → critic 闭环 → 玩家画像反馈。 |
| Anjum et al. — *The Ink Splotch Effect*，FDG 2024，[10.1145/3649921.3650010](https://doi.org/10.1145/3649921.3650010) | ChatGPT 当「墨迹灵感」；盲测里人类打磨的版本仍赢手感与主题一致，AI 更擅发散。 |

### C. 叙事 / 文本 → 可玩

| 代表 | 一句话 |
|------|--------|
| Zhang et al. — *RPGAgent*，CHI 2026，[10.1145/3772318.3790326](https://doi.org/10.1145/3772318.3790326) | 短故事 → 多代理生成叙事/场景/机制/代码的 2D RPG；人可干预；相对纯 GPT 基线体验更好。 |
| Hoffmann et al. — *Graphonauts*，DiGRA 2026，[10.26503/dl.v2026i3.2816](https://doi.org/10.26503/dl.v2026i3.2816) | 民族志文本 → 人守诠释的知识图谱 → 可玩 2D；刻意不全交给 LLM。 |

### D. 教育与教师角色

| 代表 | 一句话 |
|------|--------|
| Shi et al. — *Unpacking Co-Creation with AI*，LAK 2026，[10.1145/3785022.3785084](https://doi.org/10.1145/3785022.3785084) | 游戏设计课 1558 次 AI 交互：高分学生更会策略性改写、收敛 AI 输出。 |
| Yang, Kleinman, Harteveld — *Bridging Pedagogy and Play*，CHI EA 2026，[10.1145/3772363.3798862](https://doi.org/10.1145/3772363.3798862) | 教学意图句 ↔ 游戏设计句的可控映射界面，保教师对共创的检查权。 |
| Alharthi — *Generative AI as a More Knowledgeable Other*，*Applied Sciences* 2026，[10.3390/app16115689](https://doi.org/10.3390/app16115689) | 教师视角 autoethnography：AI 进游戏设计课的利弊。 |
| Tan et al. — *Synergized Game Design Teaching Framework*，ACM TOCE 2026，[10.1145/3813112](https://doi.org/10.1145/3813112) | SGDTF：人机协同工具进教学，报告参与度与反思设计有改善。 |

### E. 遗产 / 场地相关（与 HAI 交叉仍稀）

当前「场地/遗产 → 可玩」工作（如三林、natureculture RtD）大多**不**以 GenAI 共创为主轴。最接近的交叉点是 **Graphonauts**（民族志→图谱→可玩）和 **DreamGarden**（记忆/场景提示→原型）。「场所经验 × 人机共创」几乎还是空的。

---

## 3. 空白清单

### 空白 1｜个人经验 / 生活材料如何穿过 GenAI 而不丢意图（相关度：**高**）

- **缺口：** 大量工具从「短提示 / 故事大纲」生成可玩内容（DreamGarden、RPGAgent、AutoBG），但很少系统研究：自传、民族志、场所记忆等**厚材料**，在多轮 AI 协作后意图是否偏移、风格是否扁平、作者能否事后审计「哪一步丢了经验」。
- **已有对照：** Graphonauts 用知识图谱让人守诠释；Ink Splotch 显示 AI 擅发散、人擅主题一致；Ternar C9 指出审美扁平化风险；DreamGarden 允许「梦/记忆」提示但评估重点在原型可用性，不在经验保真。
- **为何重要：** 直接对应「来自生活的游戏设计」：经验→机制，而不是提示→内容。
- **可做切入：** 以一条经验日志 / 场所观察为输入，对比「裸 LLM → 可玩」vs「人标注意图节点 / 图谱 → 可玩」，测意图保留与可解释改写。

### 空白 2｜教师可控的共创过程评估（相关度：**高**）

- **缺口：** 已有学生侧分析（Shi）和映射界面（Yang），以及教师自传（Alharthi MKO），但缺少：**可评分的过程证据协议**（何时允许 AI、如何记录改写、如何区分「会用 AI」与「被 AI 带跑」），以及可在课堂里落地的教师仪表盘。
- **已有对照：** Ternar C1 建议评估 refinement 能力而非一次生成质量；Shi 证明高分学生更会改写；Yang 证明意图可映射；Tan 证明框架能抬参与度——但都未给出可复用的评分量表 + IRB 友好的数据采集规范。
- **为何重要：** Xingchen 教学与论文材料可互通；没有过程协议，课堂证据很难进投稿。
- **可做切入：** 在现有课程里加「意图句–设计句–改写记录」三列表，先做小样本协议设计（不碰未批 IRB 的学生隐私数据公开）。

### 空白 3｜机制 / 规则 / game systems 层的双向共创（相关度：**中高**）

- **缺口：** 关卡、视觉、叙事共创工具多；**规则与系统**层仍以生成或推荐为主，人机轮流改规则、互相否决、共同验收的工具很少。
- **已有对照：** Margarido 教程明确写 game systems 共创稀缺；AutoBG 覆盖桌游规则闭环，但偏规则书而非数字游戏运行时机制；Pitako 类推荐仍是「系统建议、人拍板」的弱共创。
- **为何重要：** 「来自生活」常要落到可测机制循环，而不是资产或关卡外观。
- **可做切入：** 针对单一机制（如 repair/care 循环）做「人写约束 ↔ AI 提案 ↔ 可玩测试」小工具，用 MI-CCy Quantifier 自检。

### 空白 4｜意图作为可携带、可检查的制品（跨工具持久化）（相关度：**高**）

- **缺口：** Ctrl+Create、Yang、DreamGarden、RPGAgent 各自解决局部控制，但**意图表示不互通**：换工具就丢；少有纵向研究「同一意图在 ideation→原型→打磨三阶段如何漂移」。
- **已有对照：** Yang 的语言映射是课堂内检查；DreamGarden 的计划树可编辑但绑定 Unreal 工作流；Ternar C8 强调管治与验收门槛，却缺轻量学术/indie 实现。
- **为何重要：** 控制权若不能跨步骤携带，课堂作业与研究原型无法对齐。
- **可做切入：** 定义最小意图 schema（目标、约束、不可妥协经验点、可让步点），挂到现有某一工具前端，做 2–3 轮迭代案例。

### 空白 5｜轻量作者身份 / 出处管治（相关度：**中**）

- **缺口：** Ternar C7–C9 与 Alharthi 2025 都指出作者、版权、劳动风险是采用门槛；面向小团队与课程的**轻量 provenance**（记录谁写了什么、AI 贡献边界）几乎没有可用范本。
- **已有对照：** 行业/质性讨论充分；工具论文几乎不实现 provenance UI。
- **为何重要：** 公开调研材料网站、课程作业、投稿都需要说清 AI 贡献边界。
- **可做切入：** 给 `data/notes/` 精读笔记加可选 frontmatter：`ai_assist` / `human_edits`；先规范自己的研究流程。

### 空白 6｜场所 / 遗产场景下的人机共创（相关度：**中**，对三林有用）

- **缺口：** 遗产 AR/RtD 与 GenAI 游戏共创两条线少交叉；社区利益相关方如何进 AI 协作环，几乎空白。
- **已有对照：** Graphonauts 用民族志文本；场地类论文多为非 GenAI。
- **为何重要：** 三林老街若引入 AI 辅助原型，需要防止「通用景区游戏」味盖过地方知识。
- **可做切入：** 等空白 1 的意图保留方法跑通后，再接到场所材料；现阶段不必单独开大项目。

---

## 4. 可跟进阅读（优先序）

1. **Ternar et al. CHI 2026** — 先读。质性综合 + 空白与方法建议，是后续引用骨架。  
2. **Hoffmann et al. Graphonauts DiGRA 2026** — 与「来自生活 / 人守诠释」最近。  
3. **Yang, Kleinman, Harteveld CHI EA 2026** — 教学控制权，短，可马上对照课程。  
4. **Baars et al. Ctrl+Create FDG 2026** — 控制权工具设计的对照基线。  
5. **Margarido et al. CSUR** — 用 MI-CCy Quantifier 自评自建工具；补「systems 空白」表述。

（RPGAgent、AutoBG、Shi、Alharthi 两篇作第二梯队即可。）

---

## 5. 建议的下一步

1. **值得立专项总表**：「人机协作」从总课题标签里拆出子表（或网站专题筛选），种子 9 篇 + 本附录补入篇先入库，状态默认「待读」。  
2. **不必立刻扩到 IEEE CoG / AIIDE 全库**；下一轮若做专项，优先补：CHI PLAY 全文、ICCC、以及 Ternar 综合里引用但未进工具线的业界质性篇。  
3. **研究落点建议（供负责人对齐，不改你现有投稿策略）：**  
   - 主线：空白 1 + 4（经验意图保留 + 可检查意图制品）→ 可喂 FDG / DiGRA / CHI 短文。  
   - 副线：空白 2（教学过程协议）→ 与课程材料同步积证据，IRB 后再用数据。  
4. **网站：** 可在「调研材料」加筛选标签「人机协作·空白」，本简报放进 `data/briefs/` 或单独 `data/notes/` 专题页——需你点头后再让云端 agent 提交。

---

## 附录索引

完整一行一条见：`/workspace/digests/hai-game-design-corpus-2026-10-12.md`
