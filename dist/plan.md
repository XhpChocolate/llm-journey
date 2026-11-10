# 14 周大模型应用开发学习计划

> 由 `build.py` 从 `weeks/*.yaml` 自动生成，请改 YAML 而不是改这里。
> 每天完成标准：① 有产出物 ② 有一条能讲给别人听的笔记 ③ 有一个明确疑点。

## 阶段 A · 打底（第1-2周）：Java 工程 + LLM 最小闭环

### 第 1 周 · 环境就位与第一个可运行服务（预估 13 小时）

**本周目标**：工具链跑通，能独立写出并调试一个 Spring Boot REST 接口。

**验收**：能用一句话说出「我的终点作品是什么」，仓库有 5 次以上提交。

#### W01D01 · 环境盘点与终点定义（120 分钟）

- 目标：工具链全部可用，并给自己写下一个可验收的终点。
- [ ] 装 JDK 21 + Maven，验证 java -version / mvn -v
- [ ] 建 Git 仓库 llm-journey，初始化 README
- [ ] 用三句话写终点作品（做什么/给谁用/怎么算成功）
- [ ] 写死每天固定学习时段（写进日历，不靠意志力）
- 产出物：仓库首次提交 + 一页《终点定义》
- 资源[辅]：Token 到底是什么？—— 揭秘大模型背后的“文字压缩术” · 11 分钟 · <https://www.bilibili.com/video/BV1S5miBvEsu>
- 资源[辅]：Maven 教程（菜鸟教程·中文） · 20 分钟 · <https://www.runoob.com/maven/maven-tutorial.html>
- 今日自问：我现在最不确定的是什么？把它变成第一个疑点。

#### W01D02 · 第一个 Spring Boot 服务（120 分钟）

- 目标：能从空白生成工程并跑通一个接口。
- [ ] 用 start.spring.io 生成工程（Web + Validation）
- [ ] 写 GET /hello 返回 JSON，改端口并验证
- [ ] 观察启动日志，找到内嵌 Tomcat 端口那一行
- 产出物：可运行的 /hello 接口 + 提交
- 资源[辅]：springboot教程，SpringBoot3干货拉满，从零开始轻松拿下面试&加薪 · 2570 分钟 · <https://www.bilibili.com/video/BV1Es4y1q7Bf>
- 资源[主]：Spring Initializr（生成工程） · 10 分钟 · <https://start.spring.io/>
- 资源[主]：Spring Boot 中文文档（3.5） · 40 分钟 · <https://springdoc.tech/spring-boot/3.5.10/reference/>
- 资源[辅]：Spring Boot 第一个应用（中文教程） · 25 分钟 · <https://springdoc.tech/spring-boot/3.5.10/tutorial/first-application/index>
- 今日自问：启动日志里哪些行以后排错会用到？

#### W01D03 · 配置与密钥管理（120 分钟）

- 目标：配置不写死在代码里，密钥不进 Git。
- [ ] application.yml 配置自定义项，用 @ConfigurationProperties 绑定
- [ ] 拆 dev/prod 两个 profile 并切换验证
- [ ] 用环境变量注入密钥，把 application-local.yml 加进 .gitignore
- 产出物：一份可切换环境的配置 + 提交
- 资源[主]：B站目前讲的最透彻的SpringBoot自动配置，大厂面试必备知识点#安员外很有码 · 11 分钟 · <https://www.bilibili.com/video/BV1NY411P7VX>
- 资源[主]：Spring Boot 外部化配置（中文） · 35 分钟 · <https://springdoc.tech/spring-boot/3.5.10/reference/features/external-config>
- 资源[辅]：Spring Boot 配置项清单（中文） · 15 分钟 · <https://springdoc.tech/spring-boot/3.5.10/appendix/application-properties/index>
- 今日自问：配置优先级顺序我能复述出来吗？

#### W01D04 · 用 WebClient 调外部 HTTP 接口（120 分钟）

- 目标：能可靠地调用第三方 API，并处理失败。
- [ ] 用 WebClient 调一个公开 API，打印响应
- [ ] 设置连接/读超时，构造 404 和超时两种失败场景
- [ ] 把失败转换成带错误码的统一响应
- 产出物：一个调外部 API 且不惧失败的接口
- 资源[辅]：springboot教程，SpringBoot3干货拉满，从零开始轻松拿下面试&加薪 · 2570 分钟 · <https://www.bilibili.com/video/BV1Es4y1q7Bf>
- 资源[主]：WebClient 中文文档 · 40 分钟 · <https://springdoc.tech/spring-framework/6.2.3/web-reactive/webflux-webclient/>
- 今日自问：超时设多少合理？依据是什么？

#### W01D05 · JSON 与 DTO 设计（100 分钟）

- 目标：请求/响应对象用 record 表达，序列化行为可控。
- [ ] 用 record 定义请求与响应 DTO
- [ ] 处理字段缺失、类型不符两种反序列化失败
- [ ] 了解全局 ObjectMapper 配置（命名策略、忽略未知字段）
- 产出物：3 个 DTO + 1 个失败用例验证
- 资源[辅]：Jackson Databind · 20 分钟 · <https://github.com/FasterXML/jackson-databind>
- 今日自问：为什么 DTO 不要直接复用数据库实体？

#### W01D06 · 统一异常与可追踪日志（130 分钟）

- 目标：任何异常都能返回统一结构，且能靠 traceId 定位。
- [ ] 写 @ControllerAdvice 统一错误响应（code/message/traceId）
- [ ] 用 SLF4J 打结构化日志，关键路径加 info
- [ ] 写一个 Filter 生成 traceId 放进 MDC，响应头回传
- 产出物：统一错误体 + traceId 贯穿的日志
- 资源[辅]：springboot教程，SpringBoot3干货拉满，从零开始轻松拿下面试&加薪 · 2570 分钟 · <https://www.bilibili.com/video/BV1Es4y1q7Bf>
- 资源[主]：Spring MVC 统一异常处理（中文） · 30 分钟 · <https://springdoc.tech/spring-framework/6.2.3/web/webmvc/mvc-controller/ann-exceptionhandler>
- 今日自问：线上报错时，我需要哪三行日志才能定位？

#### W01D07 · 周复盘 + 单测入门（120 分钟）

- 目标：会用 JUnit 5 + Mockito 给已有代码补测试。
- [ ] 给 D4 的接口写 3 个单测（正常/超时/异常）
- [ ] 用 Mockito mock 外部依赖
- [ ] 周复盘：完成率、卡点、下周要砍掉什么
- 产出物：3 个通过的测试 + 周复盘笔记
- 资源[主]：JUnit 5 用户指南 · 35 分钟 · <https://junit.org/junit5/docs/current/user-guide/>
- 资源[辅]：Mockito 官网 · 20 分钟 · <https://site.mockito.org/>
- 资源[辅]：Spring Boot 测试（中文） · 30 分钟 · <https://springdoc.tech/spring-boot/3.5.10/reference/testing/>
- 今日自问：哪件事我以为会很快、实际最慢？

### 第 2 周 · 接上大模型：从手写调用到 Spring AI（预估 16 小时）

**本周目标**：手写和框架两条路都走过一遍，理解每层在替你做什么。

**验收**：/chat 支持流式 + 超时重试 + 统一异常 + traceId + 单测，能演示。

#### W02D01 · 手写一次大模型调用（不套框架）（130 分钟）

- 目标：亲手发出第一个 chat/completions 请求。
- [ ] 用 WebClient POST /chat/completions，打印完整响应
- [ ] 记录一次请求的耗时与 usage.total_tokens
- [ ] 写笔记：messages 里每个 role 的作用
- 产出物：一个能对话的 /chat 接口（手写版）
- 资源[辅]：炸裂，Spring AI让Java再次伟大！还有人没用过吗？ · 13 分钟 · <https://www.bilibili.com/video/BV1xkJxzEEmD>
- 资源[主]：DeepSeek API 文档（总览） · 30 分钟 · <https://api-docs.deepseek.com/>
- 资源[主]：DeepSeek 创建对话补全 API · 30 分钟 · <https://api-docs.deepseek.com/api/create-chat-completion>
- 今日自问：响应里除了 content 还有什么字段值得关注？

#### W02D02 · 流式输出（SSE）（140 分钟）

- 目标：理解流式为什么是聊天体验的必需品。
- [ ] 开启 stream=true，用 curl 观察分块到达
- [ ] 后端用 SseEmitter 转发，处理客户端断开
- [ ] 记录首字延迟（TTFT）与总耗时
- 产出物：流式 /chat/stream 接口
- 资源[主]：尚硅谷SpringAI实战教程，springai轻松上手大模型应用开发 · 235 分钟 · <https://www.bilibili.com/video/BV1Cxj7zjEng>
- 资源[主]：DeepSeek 创建对话补全 API · 30 分钟 · <https://api-docs.deepseek.com/api/create-chat-completion>
- 今日自问：客户端断开了，后端还在生成，怎么办？

#### W02D03 · 换成 Spring AI，对照差异（150 分钟）

- 目标：用 ChatClient 重写同一功能，说清框架替你做了什么。
- [ ] 加 Spring AI 依赖，配置 model/api-key
- [ ] 用 ChatClient 实现 /chat 与流式版本
- [ ] 写对比表：手写 vs 框架，各 3 条优劣
- 产出物：框架版 /chat + 对比笔记
- 资源[主]：尚硅谷SpringAI实战教程，springai轻松上手大模型应用开发 · 235 分钟 · <https://www.bilibili.com/video/BV1Cxj7zjEng>
- 资源[主]：Spring AI 中文文档（1.1） · 40 分钟 · <https://springdoc.tech/spring-ai/1.1.0/>
- 资源[主]：Spring AI ChatClient（中文） · 45 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/chatclient/>
- 资源[辅]：Spring AI ChatModel（中文） · 30 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/chatmodel>
- 今日自问：如果框架出问题，我能退回手写版吗？

#### W02D04 · Prompt 基础与 A/B 实验（120 分钟）

- 目标：不靠玄学，用对照实验改 Prompt。
- [ ] 写 system + user 分工明确的 Prompt
- [ ] 做 5 组对照：加/不加 few-shot、temperature 0 vs 0.8
- [ ] 记录每组输出差异（存成表格）
- 产出物：一份 Prompt 对照实验记录
- 资源[主]：【吴恩达】2025年公认最好的【提示词工程】教程！大模型入门到进阶，一套全解决！Prompt Engineering-附带课件代码 · 94 分钟 · <https://www.bilibili.com/video/BV1173jzNELG>
- 资源[主]：Anthropic Prompt 工程总览 · 35 分钟 · <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview>
- 资源[辅]：提示工程指南（中文） · 30 分钟 · <https://www.promptingguide.ai/zh>
- 今日自问：哪些差异是随机性，哪些是 Prompt 造成的？

#### W02D05 · 结构化输出（130 分钟）

- 目标：让模型输出能直接被 Java 代码消费。
- [ ] 用 BeanOutputConverter 把输出映射成 record
- [ ] 故意让模型返回非法 JSON，看框架怎么报错
- [ ] 加一层校验与失败兜底（重试一次 / 返回默认）
- 产出物：一个稳定的结构化输出接口
- 资源[主]：SpringAI教程，全网最强springai Alibaba，springai实战（RAG、SAA、MCP） · 530 分钟 · <https://www.bilibili.com/video/BV1pvWGznEqh>
- 资源[主]：Spring AI 结构化输出（中文） · 40 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/structured-output-converter>
- 今日自问：解析失败时，日志里能看出模型原本输出了什么吗？

#### W02D06 · Function Calling 到底怎么运转（150 分钟）

- 目标：能画出一次工具调用的完整往返。
- [ ] 先手写：发 tools 定义 → 收到 tool_calls → 执行 → 回填结果
- [ ] 再用 @Tool 注解实现同样能力
- [ ] 写图：一次工具调用经过了几次模型请求
- 产出物：手写 + 注解两版工具调用
- 资源[辅]：从原理到代码，将清楚大模型的Tool Use和Function Calling · 17 分钟 · <https://www.bilibili.com/video/BV1wPEm6DEzS>
- 资源[主]：什么是Function Calling与MCP协议？它们为何要这样设计？ · 57 分钟 · <https://www.bilibili.com/video/BV1qTYizcEN3>
- 资源[主]：Function Calling 机制（DeepSeek 指南） · 40 分钟 · <https://api-docs.deepseek.com/guides/function_calling>
- 资源[主]：Spring AI 工具调用 @Tool（中文） · 45 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/tools>
- 今日自问：模型会不会自己执行工具？谁在为安全负责？

#### W02D07 · 里程碑 M1 验收（140 分钟）

- 目标：交付一个「小而完整」的对话服务。
- [ ] 补齐超时、重试（指数退避）、统一异常
- [ ] 自测清单逐项打勾（流式/失败/日志/单测）
- [ ] 写 M1 总结：做到什么、欠什么、下周改什么
- 产出物：M1 可演示服务 + 自测清单
- 资源[主]：Resilience4j 文档（重试/熔断/限流） · 40 分钟 · <https://resilience4j.readme.io/docs/getting-started>
- 今日自问：如果现在让我给同事演示，我敢吗？不敢的是哪部分？

## 阶段 B · RAG（第3-5周）：让模型「知道」你的知识

### 第 3 周 · RAG 全景与数据入口（预估 15 小时）

**本周目标**：走通 文档 → 切片 → 向量 → 检索 的数据链路。

**验收**：输入一个问题，能返回 top3 相关片段，且片段确实来自原文。

#### W03D01 · RAG 全景与我为什么需要它（120 分钟）

- 目标：先想清楚问题，再动手写代码。
- [ ] 读 RAG 文档，画出 ETL→检索→增强→生成 四段架构图
- [ ] 写「我的 RAG 要解决什么问题」：模型不知道什么？谁会用？
- [ ] 列出 3 个「不适合用 RAG」的场景
- 产出物：一张架构图 + 一页问题定义
- 资源[主]：RAG 工作机制详解——一个高质量知识库背后的技术全流程 · 17 分钟 · <https://www.bilibili.com/video/BV1JLN2z4EZQ>
- 资源[主]：Spring AI RAG（中文） · 50 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/retrieval-augmented-generation/>
- 今日自问：没有 RAG，我的 Agent 会怎么失败？

#### W03D02 · 文档解析（130 分钟）

- 目标：把 PDF/DOCX/MD 稳定转成纯文本 + 元数据。
- [ ] 用 Tika 解析 PDF 和 DOCX，输出文本长度与页数
- [ ] 抽取元数据（文件名、页码、章节标题）
- [ ] 处理解析失败的坏文件（扫描版 PDF 抽不出字）
- 产出物：一个能解析目录的 /parse 接口
- 资源[主]：【AI实战】AI企业知识库，基于SpringAI+Springboot+Vue+RAG+PGVector+Embedding的企业智能问答系统 · 34 分钟 · <https://www.bilibili.com/video/BV141Kn69EEq>
- 资源[主]：Apache Tika（文档解析） · 25 分钟 · <https://tika.apache.org/>
- 资源[辅]：Apache PDFBox · 20 分钟 · <https://pdfbox.apache.org/>
- 今日自问：表格和图片里的信息，我的解析丢掉了吗？

#### W03D03 · 切片策略（140 分钟）

- 目标：知道切片会怎样决定检索上限。
- [ ] 实现固定长度、按标题、递归三种切片
- [ ] 对同一份文档跑三种策略，对比片段数与平均长度
- [ ] 给每个片段加元数据（来源、章节、序号）
- 产出物：三份切片结果对比 + 选型理由
- 资源[主]：RAG 工作机制详解——一个高质量知识库背后的技术全流程 · 17 分钟 · <https://www.bilibili.com/video/BV1JLN2z4EZQ>
- 资源[主]：Spring AI RAG（中文） · 50 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/retrieval-augmented-generation/>
- 今日自问：一个片段被切断在句子中间，会带来什么后果？

#### W03D04 · Embedding 与相似度（120 分钟）

- 目标：向量是最容易被当成黑箱的部分，先拆开。
- [ ] 调 embeddings 接口，拿到一组向量
- [ ] 手算两句话的余弦相似度，验证「近义句更近」
- [ ] 记录维度、单次成本、批量上限
- 产出物：一段能算相似度的小程序
- 资源[辅]：AI Agent的RAG、Memory底层的语义检索原理是啥 | 向量数据库-索引篇 · 10 分钟 · <https://www.bilibili.com/video/BV1RCGR6yEEw>
- 资源[辅]：Spring AI Embedding（中文） · 25 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/embeddings/>
- 今日自问：为什么「字数差不多的句子」不一定更相似？

#### W03D05 · PGVector 上手（160 分钟）

- 目标：用自己的库存向量，能查、能过滤。
- [ ] docker 起 pgvector，建带 vector 列的表
- [ ] 插入 20 条片段向量，写一次近邻查询
- [ ] 建 HNSW 索引，对比建索引前后耗时
- 产出物：可查询的向量表 + 建表 SQL
- 资源[辅]：PostgreSQL技术分享：pgvector的应用和原理 · 44 分钟 · <https://www.bilibili.com/video/BV1Xw411S7sh>
- 资源[主]：pgvector 官方仓库 · 35 分钟 · <https://github.com/pgvector/pgvector>
- 资源[主]：pgvector 官方镜像与 docker 启动说明 · 10 分钟 · <https://github.com/pgvector/pgvector#docker>
- 今日自问：索引参数（m、ef_construction）影响什么？

#### W03D06 · 用 Spring AI 的 VectorStore（140 分钟）

- 目标：不写 SQL 也能存取，同时知道它在背后做了什么。
- [ ] 配置 PGVector VectorStore，写入切片
- [ ] 用 similaritySearch 检索，试元数据过滤
- [ ] 对照第 5 天手写 SQL 的结果，确认一致
- 产出物：VectorStore 版检索接口
- 资源[主]：SpringAI教程，全网最强springai Alibaba，springai实战（RAG、SAA、MCP） · 530 分钟 · <https://www.bilibili.com/video/BV1pvWGznEqh>
- 资源[主]：Spring AI 向量库抽象（中文） · 40 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/vectordbs/>
- 资源[主]：Spring AI 集成 PGVector（中文） · 35 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/vectordbs/pgvector>
- 今日自问：框架的默认 topK 和相似度阈值是多少？合理吗？

#### W03D07 · 周复盘 + 检索最小 Demo（120 分钟）

- 目标：把本周零件拼成一个能演示的东西。
- [ ] 做 /search?q= 返回 top3 片段（带来源）
- [ ] 用 5 个真实问题试，记录哪些查不准
- [ ] 周复盘：数据链路哪一步最脏？
- 产出物：可用的检索 Demo + 5 条 badcase
- 今日自问：查不准时，我第一反应是怪模型还是怪检索？

### 第 4 周 · 检索质量：从「能查到」到「查得准」（预估 14 小时）

**本周目标**：会诊断和改善召回质量，而不是调参碰运气。

**验收**：同一批问题，召回率比第3周有可量化提升。

#### W04D01 · 混合检索（130 分钟）

- 目标：理解向量检索的盲区，为什么还需要关键词。
- [ ] 用 PG 全文检索（tsvector）做 BM25 近似
- [ ] 同一问题分别用向量/关键词/混合三种方式检索
- [ ] 找出向量查不到但关键词能查到的例子
- 产出物：三路检索对比 + 1 个反例
- 资源[主]：【RAG优化四步通关】从原理到实战：rag工作原理 Query环节优化 多模态rag rag 评估体系！大模型rag实战  rag知识库搭建   大模型应用开发 · 41 分钟 · <https://www.bilibili.com/video/BV17eTvzaEWh>
- 资源[主]：Spring AI 向量库抽象（中文） · 40 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/vectordbs/>
- 资源[主]：pgvector 官方仓库 · 35 分钟 · <https://github.com/pgvector/pgvector>
- 今日自问：什么类型的问题最适合关键词检索？

#### W04D02 · 重排（Rerank）（130 分钟）

- 目标：知道什么时候值得多花一次模型调用。
- [ ] 了解交叉编码器与向量检索的区别
- [ ] 接一个 rerank 能力（API 或本地小模型）
- [ ] 对比 top5 在重排前后的排序变化
- 产出物：带重排的检索接口
- 资源[辅]：RAG优化：17种RAG方案，谁才是RAG最佳选择？全程干货！带你搞懂这17种RAG方案，少走99%的弯路！大模型|LLM|RAG · 26 分钟 · <https://www.bilibili.com/video/BV1DmzABsEty>
- 资源[主]：Spring AI RAG（中文） · 50 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/retrieval-augmented-generation/>
- 今日自问：重排的成本换来了多少准确率？值吗？

#### W04D03 · 查询改写（120 分钟）

- 目标：让用户那句随口的问题变成能检索的查询。
- [ ] 试多查询（一个问题生成 3 个变体）并合并结果
- [ ] 试 HyDE（先生成假答案再检索）
- [ ] 记录两种方法各自在什么问题上有效
- 产出物：查询改写模块 + 效果记录
- 资源[主]：【RAG优化四步通关】从原理到实战：rag工作原理 Query环节优化 多模态rag rag 评估体系！大模型rag实战  rag知识库搭建   大模型应用开发 · 41 分钟 · <https://www.bilibili.com/video/BV17eTvzaEWh>
- 资源[主]：Spring AI RAG（中文） · 50 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/retrieval-augmented-generation/>
- 今日自问：改写会不会把用户的真实意图改丢？

#### W04D04 · 上下文组装（120 分钟）

- 目标：检索到的片段怎么放进 Prompt，直接决定答案质量。
- [ ] 实现带编号的引用（[1][2]）与来源标注
- [ ] 做去重与 token 预算控制（超长截断策略）
- [ ] 对比「按相似度排」与「按文档顺序排」的效果
- 产出物：上下文组装器 + 两种顺序对比
- 资源[主]：RAG 工作机制详解——一个高质量知识库背后的技术全流程 · 17 分钟 · <https://www.bilibili.com/video/BV1JLN2z4EZQ>
- 资源[主]：Spring AI RAG（中文） · 50 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/retrieval-augmented-generation/>
- 资源[辅]：Spring AI Advisors（中文） · 35 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/advisors/>
- 今日自问：片段顺序为什么会影响模型回答？

#### W04D05 · 带引用的生成与拒答（130 分钟）

- 目标：答案必须能追溯到原文，没有依据时要敢说不知道。
- [ ] 写 Prompt：只用给定资料回答，并标注引用编号
- [ ] 加拒答逻辑：检索为空或相关度低时明确说不知道
- [ ] 构造 3 个「资料里没有」的问题验证拒答
- 产出物：带引用 + 拒答的问答接口
- 资源[辅]：RAG优化：17种RAG方案，谁才是RAG最佳选择？全程干货！带你搞懂这17种RAG方案，少走99%的弯路！大模型|LLM|RAG · 26 分钟 · <https://www.bilibili.com/video/BV1DmzABsEty>
- 资源[主]：Spring AI RAG（中文） · 50 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/retrieval-augmented-generation/>
- 今日自问：模型明明没资料却编了答案，我在哪一步能拦住？

#### W04D06 · 失败归因（130 分钟）

- 目标：建立分类习惯，而不是笼统地说「效果不好」。
- [ ] 收集 10 个失败案例
- [ ] 分三类：检索不到 / 检索到但没用 / 生成不忠实
- [ ] 每类各写一条可能的修复手段
- 产出物：10 条 badcase 归因表
- 资源[主]：RAGas 评测框架深度测评（中文） · 30 分钟 · <https://cloud.tencent.com/developer/article/2505892>
- 资源[主]：面试官问：如何评估RAG系统的效果？ · 12 分钟 · <https://www.bilibili.com/video/BV1b69gB5E3h>
- 资源[主]：Ragas 评测框架文档 · 40 分钟 · <https://docs.ragas.io/>
- 今日自问：三类失败里，哪一类占比最高？

#### W04D07 · 周复盘 + 缓冲（100 分钟）

- 目标：补欠账，避免滚雪球。
- [ ] 清空本周未完成项或明确放弃
- [ ] 更新疑点清单，把已解决的标注答案
- [ ] 写「下周我最想验证的一个假设」
- 产出物：周复盘 + 更新后的疑点清单
- 今日自问：这周我是在学，还是在收集教程？

### 第 5 周 · RAG 评测：没有度量就没有优化（预估 16 小时）

**本周目标**：建起一套能判断「改完是变好还是变坏」的评测。

**验收**：一条命令跑出评测报告，能对比两次改动。

#### W05D01 · 评测指标（130 分钟）

- 目标：知道每个指标在衡量什么，避免只看「感觉」。
- [ ] 读 Ragas 指标说明，写下 4 个指标的定义
- [ ] 区分「检索指标」与「生成指标」
- [ ] 挑出本项目最该看的 3 个指标并说明理由
- 产出物：指标定义卡
- 资源[主]：RAGas 评测框架深度测评（中文） · 30 分钟 · <https://cloud.tencent.com/developer/article/2505892>
- 资源[主]：面试官问：如何评估RAG系统的效果？ · 12 分钟 · <https://www.bilibili.com/video/BV1b69gB5E3h>
- 资源[主]：Ragas 评测框架文档 · 40 分钟 · <https://docs.ragas.io/>
- 今日自问：忠实度高但答案没用，算好吗？

#### W05D02 · 建 20 条评测集（140 分钟）

- 目标：评测集是资产，值得认真造。
- [ ] 写 20 条：问题 + 标准答案要点 + 出处
- [ ] 覆盖三类：事实查找、多跳推理、应当拒答
- [ ] 存成 YAML/JSON，纳入 Git
- 产出物：eval/dataset.yaml（20 条）
- 资源[主]：Ragas 评测框架文档 · 40 分钟 · <https://docs.ragas.io/>
- 今日自问：我的问题是不是都太「好问」了？真实用户会怎么问？

#### W05D03 · 跑通评测脚本（150 分钟）

- 目标：一键得到分数，而不是人工看 20 条。
- [ ] 写批量脚本：读评测集 → 调接口 → 收集答案
- [ ] 用 LLM 打分或规则匹配算分，输出 CSV
- [ ] 把单次结果存档（带时间戳与配置）
- 产出物：scripts/eval.py + 第一份报告
- 资源[主]：RAGas 评测框架深度测评（中文） · 30 分钟 · <https://cloud.tencent.com/developer/article/2505892>
- 资源[主]：【有手就行】20分钟教会你基于RAGas自动化评估RAG方案的优劣！从原理到代码实现，一个视频带你彻底搞懂RAG评估！全程干货无废话，草履虫都能学会~~~ · 24 分钟 · <https://www.bilibili.com/video/BV1d1DfBWErT>
- 资源[主]：Ragas 评测框架文档 · 40 分钟 · <https://docs.ragas.io/>
- 今日自问：LLM 当裁判会不会偏袒自己？

#### W05D04 · 调一轮，用数据说话（150 分钟）

- 目标：体验一次「改动 → 度量 → 结论」的闭环。
- [ ] 只改一个变量：topK 3→8，或切片 500→300
- [ ] 跑评测，对比两份报告
- [ ] 写结论：提升了多少、代价是什么
- 产出物：两组配置对比报告
- 资源[主]：【有手就行】20分钟教会你基于RAGas自动化评估RAG方案的优劣！从原理到代码实现，一个视频带你彻底搞懂RAG评估！全程干货无废话，草履虫都能学会~~~ · 24 分钟 · <https://www.bilibili.com/video/BV1d1DfBWErT>
- 资源[主]：Ragas 评测框架文档 · 40 分钟 · <https://docs.ragas.io/>
- 今日自问：如果分数没变，说明什么？

#### W05D05 · Agentic RAG（130 分钟）

- 目标：知道固定流水线的天花板在哪。
- [ ] 读 Agent 设计模式，理解「让模型决定检索时机」
- [ ] 实现一版：模型先判断要不要检索，再决定检索几次
- [ ] 对比固定 RAG 与 Agentic RAG 在 5 个问题上的表现
- 产出物：Agentic RAG 原型
- 资源[主]：《Building effective agents》中文译文 · 35 分钟 · <https://github.com/harrisliangsu/ai-agent-engineer-handbook/blob/main/translations/building-effective-agents.md>
- 资源[主]：Agent 的概念、原理与构建模式 —— 从零打造一个简化版的 Claude Code · 28 分钟 · <https://www.bilibili.com/video/BV1TSg7zuEqR>
- 资源[主]：Building effective agents（Agent 设计模式权威短文） · 45 分钟 · <https://www.anthropic.com/research/building-effective-agents>
- 今日自问：多一次模型决策，代价是什么？

#### W05D06 · 里程碑 M2：作品化（160 分钟）

- 目标：把 RAG 变成一个别人也能跑起来的项目。
- [ ] 整理成独立模块：上传 → 解析 → 入库 → 问答
- [ ] README 写清架构、启动方式、评测结果
- [ ] 录一段 3 分钟演示（手机录也行）
- 产出物：M2 作品 + README + 演示
- 资源[辅]：2026版Java+AI企业级RAG知识库项目实战全套教程，Spring AI实战RAG解决企业级知识库落地的10大痛点！让你少走99%的弯路！ · 254 分钟 · <https://www.bilibili.com/video/BV1GYkKBVEcW>
- 今日自问：别人照着 README 能跑起来吗？（找个同事试）

#### W05D07 · 周复盘 + 缓冲（100 分钟）

- 目标：收口，为 Agent 阶段腾出精力。
- [ ] 归档评测报告与配置快照
- [ ] 列出 RAG 阶段仍未解决的 3 个问题（允许不解决）
- [ ] 预习下周：Agent 与 RAG 的边界在哪
- 产出物：阶段小结
- 今日自问：如果只保留一个 RAG 上的改进，我保留哪个？

## 阶段 C · Agent（第6-8周）：从「能调工具」到「可靠地完成任务」

### 第 6 周 · Agent 循环与工具设计（预估 15 小时）

**本周目标**：让模型自己决定调哪个工具、调几次，并能跑通一次真实查询。

**验收**：一个能查业务数据的单工具 Agent，失败时有清晰错误返回。

#### W06D01 · Agent 循环的本质（130 分钟）

- 目标：分清楚 workflow 和 agent，别一上来就做复杂编排。
- [ ] 读 Agent 设计模式，画出 think→act→observe→think 循环
- [ ] 写笔记：什么任务该用固定 workflow，什么才需要 agent
- [ ] 列出 3 个「用 agent 反而更糟」的场景
- 产出物：循环图 + workflow/agent 判定清单
- 资源[主]：《Building effective agents》中文译文 · 35 分钟 · <https://github.com/harrisliangsu/ai-agent-engineer-handbook/blob/main/translations/building-effective-agents.md>
- 资源[主]：Agent 的概念、原理与构建模式 —— 从零打造一个简化版的 Claude Code · 28 分钟 · <https://www.bilibili.com/video/BV1TSg7zuEqR>
- 资源[主]：Building effective agents（Agent 设计模式权威短文） · 45 分钟 · <https://www.anthropic.com/research/building-effective-agents>
- 今日自问：我的场景真的需要 agent 吗？

#### W06D02 · 工具设计规范（120 分钟）

- 目标：工具的「描述」比「实现」更影响成功率。
- [ ] 为一个查询工具写清命名、描述、参数 schema、返回格式
- [ ] 对比「描述模糊」与「描述精确」两种版本的调用成功率
- [ ] 约定错误返回结构（模型能读懂的错误信息）
- 产出物：一份工具设计规范 + 两组对比
- 资源[辅]：从原理到代码，将清楚大模型的Tool Use和Function Calling · 17 分钟 · <https://www.bilibili.com/video/BV1wPEm6DEzS>
- 资源[主]：Spring AI 工具调用 @Tool（中文） · 45 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/tools>
- 今日自问：模型看不懂的错误信息会怎么处理？

#### W06D03 · 单工具 Agent 跑通（160 分钟）

- 目标：第一次让模型自己决定「去查一下」。
- [ ] 用本地 H2/SQLite 造 20 条订单数据
- [ ] 实现 queryOrder(orderId) 工具并注册
- [ ] 让 Agent 完成「订单 1001 到哪了」的完整闭环
- 产出物：可用的单工具 Agent
- 资源[辅]：黑马程序员SpringAI+DeepSeek大模型应用开发实战视频教程，传统Java项目AI化转型必学课程 · 512 分钟 · <https://www.bilibili.com/video/BV1MtZnYtEB3>
- 资源[主]：Spring AI 工具调用 @Tool（中文） · 45 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/tools>
- 今日自问：模型调错参数时，是参数设计问题还是描述问题？

#### W06D04 · 多工具与选择策略（140 分钟）

- 目标：观察工具变多后，准确率会发生什么。
- [ ] 增加到 4 个工具（查订单、查物流、查退款、算运费）
- [ ] 用 10 个问题测工具选择准确率
- [ ] 记录「工具越多越容易选错」的具体表现
- 产出物：10 条工具选择测试结果
- 资源[主]：什么是Function Calling与MCP协议？它们为何要这样设计？ · 57 分钟 · <https://www.bilibili.com/video/BV1qTYizcEN3>
- 资源[主]：Spring AI 工具调用 @Tool（中文） · 45 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/tools>
- 今日自问：工具数量上限大概在哪？靠什么缓解？

#### W06D05 · 上下文管理（140 分钟）

- 目标：亲手制造一次 token 爆炸，才知道为什么要裁剪。
- [ ] 跑 20 轮长对话，打印每轮 token 数，画出增长曲线
- [ ] 实现两种裁剪：滑动窗口、早期对话摘要
- [ ] 对比裁剪前后的回答质量与成本
- 产出物：token 增长曲线 + 裁剪实现
- 资源[主]：SpringAI教程，全网最强springai Alibaba，springai实战（RAG、SAA、MCP） · 530 分钟 · <https://www.bilibili.com/video/BV1pvWGznEqh>
- 资源[主]：Spring AI 对话记忆（中文） · 35 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/chat-memory>
- 今日自问：摘要丢掉了什么关键信息？

#### W06D06 · 重试、超时与幂等（130 分钟）

- 目标：Agent 失败是常态，要能安全重试。
- [ ] 给模型调用加指数退避重试（区分可重试与不可重试）
- [ ] 给工具调用加超时与兜底返回
- [ ] 检查写操作是否幂等（重复调用会不会重复下单）
- 产出物：带重试与幂等的 Agent
- 资源[辅]：黑马程序员SpringAI+DeepSeek大模型应用开发实战视频教程，传统Java项目AI化转型必学课程 · 512 分钟 · <https://www.bilibili.com/video/BV1MtZnYtEB3>
- 资源[主]：Resilience4j 文档（重试/熔断/限流） · 40 分钟 · <https://resilience4j.readme.io/docs/getting-started>
- 今日自问：哪个工具绝对不能自动重试？

#### W06D07 · 周复盘 + 缓冲（100 分钟）

- 目标：收口，别让欠账带进下一周。
- [ ] 补做未完成项或明确放弃
- [ ] 记录本周最意外的一个发现
- [ ] 更新疑点清单
- 产出物：周复盘
- 今日自问：这周哪个认知被推翻了？

### 第 7 周 · 记忆、规划与可靠性（预估 15 小时）

**本周目标**：Agent 能记住该记的、拆得开复杂任务、失败时能定位。

**验收**：一次失败请求，只看日志就能说出失败在哪一步。

#### W07D01 · 记忆分层（140 分钟）

- 目标：分清会话记忆、长期记忆、用户画像，别混成一坨。
- [ ] 用 ChatMemory 实现会话记忆，对比窗口大小影响
- [ ] 设计一个「用户偏好」的持久化存储（少量字段）
- [ ] 写笔记：哪些信息该记住、哪些必须忘
- 产出物：会话记忆 + 用户偏好存储
- 资源[主]：SpringAI教程，全网最强springai Alibaba，springai实战（RAG、SAA、MCP） · 530 分钟 · <https://www.bilibili.com/video/BV1pvWGznEqh>
- 资源[主]：Spring AI 对话记忆（中文） · 35 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/chat-memory>
- 今日自问：记错了比不记更糟，哪些内容不该进记忆？

#### W07D02 · 规划：ReAct vs Plan-and-Execute（140 分钟）

- 目标：知道两种范式的取舍，而不是背名词。
- [ ] 实现一个 ReAct 循环（思考-行动-观察，最多 N 步）
- [ ] 实现一版先出计划再执行（计划可修改）
- [ ] 用同一个多步任务对比两者步数与成功率
- 产出物：两版规划实现 + 对比数据
- 资源[主]：《Building effective agents》中文译文 · 35 分钟 · <https://github.com/harrisliangsu/ai-agent-engineer-handbook/blob/main/translations/building-effective-agents.md>
- 资源[主]：Agent 的概念、原理与构建模式 —— 从零打造一个简化版的 Claude Code · 28 分钟 · <https://www.bilibili.com/video/BV1TSg7zuEqR>
- 资源[主]：Building effective agents（Agent 设计模式权威短文） · 45 分钟 · <https://www.anthropic.com/research/building-effective-agents>
- 今日自问：计划一旦生成就不会变，会带来什么问题？

#### W07D03 · 工具权限与参数校验（140 分钟）

- 目标：把「模型能做什么」关进笼子。
- [ ] 给工具加入参校验（类型/范围/必填）与白名单
- [ ] 危险动作（退款、删除）要求二次确认
- [ ] 用 3 个越权/畸形参数攻击自己的 Agent
- 产出物：带权限控制与校验的 Agent
- 资源[主]：【AI大模型安全】攻击・防御・评估三位一体：大模型安全体系完整构建！提示注入怎么攻、怎么防、怎么评？ · 61 分钟 · <https://www.bilibili.com/video/BV1H6LB6WE9X>
- 资源[主]：OWASP LLM Top 10 · 50 分钟 · <https://genai.owasp.org/llm-top-10/>
- 今日自问：模型被诱导调用退款工具，我在哪一层能拦？

#### W07D04 · 用 Trace 定位失败（140 分钟）

- 目标：从「它答错了」进化到「第 3 步检索错了」。
- [ ] 为每次请求记录：输入、每步 span、工具入参与返回、耗时
- [ ] 人为制造一次失败（让工具抛错），只用日志定位
- [ ] 把定位过程写成 SOP（三步排查法）
- 产出物：可回放的调用记录 + 排查 SOP
- 资源[辅]：10分钟讲清楚 Prompt, Agent, MCP 是什么 · 12 分钟 · <https://www.bilibili.com/video/BV1aeLqzUE6L>
- 资源[主]：OTel GenAI 语义约定 · 40 分钟 · <https://opentelemetry.io/docs/specs/semconv/gen-ai/>
- 今日自问：现在的日志能还原模型的每一次决策吗？

#### W07D05 · 幻觉控制三件套（130 分钟）

- 目标：让 Agent 在不知道的时候说不知道。
- [ ] 工具优先：需要事实时先查再用
- [ ] 引用溯源：答案带来源
- [ ] 拒答阈值：低置信度直接说「查不到」
- 产出物：三件套落地 + 5 条验证
- 资源[主]：RAG 工作机制详解——一个高质量知识库背后的技术全流程 · 17 分钟 · <https://www.bilibili.com/video/BV1JLN2z4EZQ>
- 资源[主]：Spring AI RAG（中文） · 50 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/retrieval-augmented-generation/>
- 今日自问：用户不喜欢听「不知道」，怎么表达更好？

#### W07D06 · 成本与延迟控制（130 分钟）

- 目标：知道每次对话花了多少钱，以及怎么降。
- [ ] 统计每次请求的 token、成本、耗时并落库
- [ ] 试一次模型路由：简单问题走小模型，难问题走大模型
- [ ] 试缓存：相同问题命中率有多少
- 产出物：成本统计 + 路由实验
- 资源[辅]：什么是缓存命中？8分钟说清楚KVCache与Prompt Cache · 8 分钟 · <https://www.bilibili.com/video/BV1keLp6GERQ>
- 资源[主]：DeepSeek API 文档（总览） · 30 分钟 · <https://api-docs.deepseek.com/>
- 今日自问：成本降一半，质量会掉多少？能接受吗？

#### W07D07 · 周复盘 + 缓冲（100 分钟）

- 目标：收口。
- [ ] 更新疑点清单，清掉已解决项
- [ ] 写「可靠性自评表」（超时/重试/权限/日志/成本 各打 1-5 分）
- [ ] 标出最弱的一项，下周优先补
- 产出物：可靠性自评表
- 今日自问：哪一项分数低得让我意外？

### 第 8 周 · 生产化最小底座（预估 15 小时）

**本周目标**：把 Demo 变成「别人能启动、出错能查、改动能验」的项目。

**验收**：docker compose up 一键起，eval 一条命令跑。

#### W08D01 · 限流与并发（140 分钟）

- 目标：并发不是把线程开大，而是把压力控住。
- [ ] 用线程池/信号量限制同时在跑的模型请求数
- [ ] 压测 20 并发，记录 P95 延迟与错误率
- [ ] 加排队与拒绝策略（超限返回友好提示）
- 产出物：限流实现 + 压测数据
- 资源[辅]：面试官求放过，快被问烂的线程池，二十分钟给你讲的明明白白 · 18 分钟 · <https://www.bilibili.com/video/BV1dt4y1i7Gt>
- 资源[主]：Resilience4j 文档（重试/熔断/限流） · 40 分钟 · <https://resilience4j.readme.io/docs/getting-started>
- 今日自问：模型服务限流了，我的服务会怎么样？

#### W08D02 · 熔断与降级（130 分钟）

- 目标：下游挂了，我的服务不能跟着挂。
- [ ] 配熔断器（失败率阈值、半开探测）
- [ ] 实现降级：返回缓存答案或明确提示稍后再试
- [ ] 人为关掉模型服务，验证降级生效
- 产出物：熔断降级生效的验证记录
- 资源[主]：Resilience4j 文档（重试/熔断/限流） · 40 分钟 · <https://resilience4j.readme.io/docs/getting-started>
- 今日自问：降级时给用户的文案，应该说什么？

#### W08D03 · Prompt 版本管理（120 分钟）

- 目标：Prompt 是代码，得能回滚。
- [ ] 把 Prompt 抽到外部模板文件，加版本号
- [ ] 建变更记录（改了什么、为什么、指标变化）
- [ ] 支持按版本切换并 A/B 对比
- 产出物：版本化 Prompt 目录 + 变更记录
- 资源[主]：【吴恩达】2025年公认最好的【提示词工程】教程！大模型入门到进阶，一套全解决！Prompt Engineering-附带课件代码 · 94 分钟 · <https://www.bilibili.com/video/BV1173jzNELG>
- 资源[主]：Anthropic Prompt 工程总览 · 35 分钟 · <https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview>
- 今日自问：没有版本管理，我怎么知道是哪次改动让效果变差？

#### W08D04 · 把评测接进 CI（150 分钟）

- 目标：让「效果回归」像编译失败一样被拦住。
- [ ] 把第 5 周的 eval 脚本接到 GitHub Actions
- [ ] 设置阈值：低于基线就失败
- [ ] 故意改坏一个 Prompt，确认 CI 能拦住
- 产出物：CI 评测流水线
- 资源[主]：【有手就行】20分钟教会你基于RAGas自动化评估RAG方案的优劣！从原理到代码实现，一个视频带你彻底搞懂RAG评估！全程干货无废话，草履虫都能学会~~~ · 24 分钟 · <https://www.bilibili.com/video/BV1d1DfBWErT>
- 资源[主]：Ragas 评测框架文档 · 40 分钟 · <https://docs.ragas.io/>
- 今日自问：CI 跑一次评测要多少成本？值得每次提交都跑吗？

#### W08D05 · Docker Compose 一键启动（150 分钟）

- 目标：任何人 clone 之后一条命令能跑起来。
- [ ] 写 Dockerfile（多阶段构建，镜像尽量小）
- [ ] compose 起 app + pgvector，配置健康检查
- [ ] 在一台干净环境（或删掉本地数据）验证启动
- 产出物：Dockerfile + compose + 启动文档
- 资源[主]：40分钟的Docker实战攻略，一期视频精通Docker · 39 分钟 · <https://www.bilibili.com/video/BV1THKyzBER6>
- 资源[主]：Docker 教程（菜鸟教程·中文） · 30 分钟 · <https://www.runoob.com/docker/docker-tutorial.html>
- 资源[辅]：Docker Compose 中文教程 · 20 分钟 · <https://www.runoob.com/docker/docker-compose.html>
- 今日自问：换台电脑，我能 10 分钟内跑起来吗？

#### W08D06 · 里程碑 M3：Agent 可演示（150 分钟）

- 目标：拿得出手的第三个里程碑。
- [ ] 整理端到端演示路径（3 个场景：成功/失败/越权）
- [ ] 补 README 的「30 秒上手」部分
- [ ] 找一个人（同事/朋友）照文档跑一遍，记录卡点
- 产出物：M3 可演示 Agent + 他人验证记录
- 资源[辅]：黑马程序员大模型RAG与Agent智能体项目实战教程，基于主流的LangChain技术从大模型提示词到实战项目 · 932 分钟 · <https://www.bilibili.com/video/BV1yjz5BLEoY>
- 今日自问：别人卡住的第一处，就是我 README 的漏洞。

#### W08D07 · 周复盘 + 阶段复盘（110 分钟）

- 目标：Agent 阶段收口，准备进入工程深水区。
- [ ] 写阶段复盘：三个里程碑各做到什么程度
- [ ] 列出「不敢上线」的 5 个理由（这就是接下来要补的）
- [ ] 更新简历草稿里的项目描述
- 产出物：阶段复盘 + 不敢上线清单
- 今日自问：「不敢上线」的清单里，哪条最致命？

## 阶段 D · 可观测与安全（第9-10周）：让系统「看得见、拦得住」

### 第 9 周 · 可观测性：日志、指标、链路（预估 15 小时）

**本周目标**：任何一次回答都能被还原，成本能被看见。

**验收**：拿到一个「答错了」的反馈，能在 10 分钟内定位根因。

#### W09D01 · 日志规范化（130 分钟）

- 目标：日志是排障第一现场，格式比数量重要。
- [ ] 统一日志为结构化 JSON（时间/级别/traceId/事件/耗时）
- [ ] 约定三类事件名：llm.call / tool.call / rag.retrieve
- [ ] 做脱敏：手机号、身份证、密钥不得入日志
- 产出物：日志规范文档 + 改造后的日志样例
- 资源[主]：【IT老齐695】OpenTelemetry日志、指标、链路一站解决方案 · 23 分钟 · <https://www.bilibili.com/video/BV1NwNVemEyE>
- 资源[主]：Actuator REST API（中文） · 30 分钟 · <https://springdoc.tech/spring-boot/3.5.10/api/rest/actuator/>
- 今日自问：出了问题，我最想看到的第一行日志是什么？

#### W09D02 · 指标：Actuator + Micrometer（140 分钟）

- 目标：把「感觉慢」变成 P95 延迟。
- [ ] 暴露 /actuator/metrics 与 /actuator/health
- [ ] 自定义指标：token 用量、模型调用次数、失败率、工具耗时
- [ ] 做一个小面板（或用 Prometheus + Grafana 最简配置）
- 产出物：5 个自定义指标 + 查看方式
- 资源[主]：【IT老齐432】可观测性，优雅零侵入，Spring Boot接入OpenTelemetry · 18 分钟 · <https://www.bilibili.com/video/BV1GQ4y137V5>
- 资源[主]：Actuator REST API（中文） · 30 分钟 · <https://springdoc.tech/spring-boot/3.5.10/api/rest/actuator/>
- 资源[辅]：Micrometer 文档 · 30 分钟 · <https://micrometer.io/docs>
- 今日自问：哪个指标最能提前预警线上问题？

#### W09D03 · 链路追踪与 GenAI 语义约定（140 分钟）

- 目标：一次请求跨了 5 个步骤，要能看到全貌。
- [ ] 读 GenAI 语义约定，列出 LLM span 应带的属性
- [ ] 用 OpenTelemetry 接入，跑通一次带 span 的请求
- [ ] 在追踪里找到「检索→组装→生成」三段耗时
- 产出物：一条完整 trace + 属性清单
- 资源[主]：【IT老齐695】OpenTelemetry日志、指标、链路一站解决方案 · 23 分钟 · <https://www.bilibili.com/video/BV1NwNVemEyE>
- 资源[主]：OTel GenAI 语义约定 · 40 分钟 · <https://opentelemetry.io/docs/specs/semconv/gen-ai/>
- 资源[辅]：OpenTelemetry Java 中文文档 · 35 分钟 · <https://opentelemetry.io/zh/docs/languages/java/>
- 今日自问：span 属性里哪些涉及隐私？

#### W09D04 · Spring AI 可观测性接入（130 分钟）

- 目标：用框架自带的观测能力，少写重复代码。
- [ ] 开启 Spring AI observability，观察自动生成的 span
- [ ] 确认 token 用量与模型名是否被记录
- [ ] 对比自己手写的埋点，决定保留哪套
- 产出物：框架观测接入 + 取舍说明
- 资源[主]：【IT老齐432】可观测性，优雅零侵入，Spring Boot接入OpenTelemetry · 18 分钟 · <https://www.bilibili.com/video/BV1GQ4y137V5>
- 资源[主]：Spring AI 可观测性（中文） · 35 分钟 · <https://springdoc.tech/spring-ai/1.1.0/observability/index>
- 今日自问：自动埋点缺了什么我需要的字段？

#### W09D05 · 全链路排障演练（140 分钟）

- 目标：练一次真的定位，而不是读文档。
- [ ] 人为注入 3 种故障：检索返回空、工具超时、模型返回非法 JSON
- [ ] 只允许看日志/指标/trace，逐个定位并记录耗时
- [ ] 写《排障手册》：症状 → 查哪里 → 常见原因
- 产出物：排障手册 + 3 次演练记录
- 资源[主]：OTel GenAI 语义约定 · 40 分钟 · <https://opentelemetry.io/docs/specs/semconv/gen-ai/>
- 今日自问：哪一类故障最难定位？为什么？

#### W09D06 · 成本看板（120 分钟）

- 目标：让「这个月花了多少」随时可答。
- [ ] 按天/按功能统计 token 与费用
- [ ] 找出成本最高的 3 个请求类型
- [ ] 提 2 条降本方案并估算收益
- 产出物：成本统计表 + 降本提案
- 资源[辅]：什么是缓存命中？8分钟说清楚KVCache与Prompt Cache · 8 分钟 · <https://www.bilibili.com/video/BV1keLp6GERQ>
- 资源[主]：DeepSeek API 文档（总览） · 30 分钟 · <https://api-docs.deepseek.com/>
- 今日自问：成本结构和我的直觉一致吗？

#### W09D07 · 周复盘 + 缓冲（100 分钟）

- 目标：收口。
- [ ] 补做未完成项或明确放弃
- [ ] 把本周观测结论写进项目 README
- [ ] 更新疑点清单
- 产出物：周复盘
- 今日自问：观测能力里，哪一项是「有了就再也不想没有」的？

### 第 10 周 · 安全与护栏（预估 15 小时）

**本周目标**：知道 Agent 上生产前必须拦住什么，并真的拦住。

**验收**：一份自查表，20 项里能说清自己项目每项的状态。

#### W10D01 · OWASP LLM Top 10 通读（140 分钟）

- 目标：先建立风险地图，再谈具体防御。
- [ ] 通读 10 类风险，每类写一句「在我项目里长什么样」
- [ ] 标出 3 类最相关的，其余标为暂不适用
- [ ] 建风险登记表（风险/影响/现状/措施）
- 产出物：风险登记表
- 资源[主]：OWASP LLM Top 10 中文解读与防御 · 35 分钟 · <https://www.freebuf.com/articles/496787.html>
- 资源[主]：【AI大模型安全】攻击・防御・评估三位一体：大模型安全体系完整构建！提示注入怎么攻、怎么防、怎么评？ · 61 分钟 · <https://www.bilibili.com/video/BV1H6LB6WE9X>
- 资源[主]：OWASP LLM Top 10 · 50 分钟 · <https://genai.owasp.org/llm-top-10/>
- 今日自问：我的项目最可能死于哪一类？

#### W10D02 · Prompt Injection 攻防（150 分钟）

- 目标：亲手打一次自己的系统。
- [ ] 直接注入：让模型忽略指令、泄露系统提示词
- [ ] 间接注入：在检索文档里埋一句恶意指令
- [ ] 记录 5 个攻击用例与系统实际表现
- 产出物：5 条攻击用例 + 现状记录
- 资源[主]：【AI大模型安全】攻击・防御・评估三位一体：大模型安全体系完整构建！提示注入怎么攻、怎么防、怎么评？ · 61 分钟 · <https://www.bilibili.com/video/BV1H6LB6WE9X>
- 资源[主]：Simon Willison 的 Prompt Injection 系列 · 40 分钟 · <https://simonwillison.net/series/prompt-injection/>
- 今日自问：为什么间接注入更难防？

#### W10D03 · 输入输出护栏（140 分钟）

- 目标：在模型前后各设一道检查。
- [ ] 输入侧：长度限制、敏感内容、注入特征检测
- [ ] 输出侧：敏感信息过滤、格式校验、引用存在性校验
- [ ] 加一层「模型自审」作为兜底（成本换安全）
- 产出物：护栏实现 + 误杀率记录
- 资源[主]：OWASP LLM Top 10 中文解读与防御 · 35 分钟 · <https://www.freebuf.com/articles/496787.html>
- 资源[主]：OWASP LLM Top 10 · 50 分钟 · <https://genai.owasp.org/llm-top-10/>
- 今日自问：护栏太严会误杀正常请求，阈值怎么定？

#### W10D04 · 工具权限与审计（130 分钟）

- 目标：最小权限 + 可追溯。
- [ ] 按角色分配可用工具（最小权限）
- [ ] 危险操作走人工确认或审批流
- [ ] 记录审计日志：谁、何时、调了什么、参数、结果
- 产出物：权限矩阵 + 审计日志样例
- 资源[主]：什么是Function Calling与MCP协议？它们为何要这样设计？ · 57 分钟 · <https://www.bilibili.com/video/BV1qTYizcEN3>
- 资源[主]：OWASP LLM Top 10 · 50 分钟 · <https://genai.owasp.org/llm-top-10/>
- 今日自问：出了事故，审计日志能还原全过程吗？

#### W10D05 · 数据合规与密钥管理（120 分钟）

- 目标：别把不该发出去的数据发出去。
- [ ] 梳理「哪些数据绝对不能进 Prompt」
- [ ] 做日志与上下文的脱敏规则并验证
- [ ] 密钥用环境变量/密钥管理服务，检查 Git 历史无泄露
- 产出物：数据分级清单 + 脱敏验证
- 资源[主]：OWASP LLM Top 10 · 50 分钟 · <https://genai.owasp.org/llm-top-10/>
- 今日自问：用户把身份证号贴进对话框，我怎么处理？

#### W10D06 · 里程碑 M4：安全自查表（140 分钟）

- 目标：把安全从「知道」变成「可检查」。
- [ ] 写 20 项自查表（注入/权限/脱敏/日志/成本/依赖）
- [ ] 逐项标注：已做 / 部分 / 未做 / 不适用
- [ ] 未做的排优先级，挑 3 项本周补掉
- 产出物：安全自查表（20 项）
- 资源[主]：OWASP LLM Top 10 中文解读与防御 · 35 分钟 · <https://www.freebuf.com/articles/496787.html>
- 资源[主]：OWASP LLM Top 10 · 50 分钟 · <https://genai.owasp.org/llm-top-10/>
- 今日自问：哪一项「未做」会让我半夜睡不着？

#### W10D07 · 周复盘 + 缓冲（100 分钟）

- 目标：收口。
- [ ] 补完自查表里挑出的 3 项
- [ ] 更新疑点清单
- [ ] 预习 MCP：它和工具调用是什么关系
- 产出物：周复盘
- 今日自问：安全这块，我最大的认知变化是什么？

## 阶段 E · MCP 与作品（第11-12周）：接进真实系统，做出可展示成果

### 第 11 周 · MCP：把现有 Java 服务变成 AI 可调用的工具（预估 16 小时）

**本周目标**：理解并跑通 MCP 的 Server/Client 两端，把鉴权审计留在 Java 层。

**验收**：一个 AI 能通过 MCP 调用你封装的业务查询接口。

#### W11D01 · MCP 架构与它要解决的问题（130 分钟）

- 目标：先想清楚「为什么不是直接写 Function Calling」。
- [ ] 读官网与规范，画出 host / client / server 三者关系
- [ ] 列出 MCP 的三种能力：tools / resources / prompts
- [ ] 写笔记：MCP 带来的复用与治理价值是什么
- 产出物：架构图 + 价值说明
- 资源[主]：MCP 规范中文译文（2025-03-26 版） · 40 分钟 · <https://cloud.tencent.com/developer/article/2541726>
- 资源[主]：MCP终极指南 - 从原理到实战，带你深入掌握MCP（基础篇） · 27 分钟 · <https://www.bilibili.com/video/BV1uronYREWR>
- 资源[主]：Model Context Protocol 官网 · 35 分钟 · <https://modelcontextprotocol.io/>
- 资源[主]：MCP 规范 · 45 分钟 · <https://modelcontextprotocol.io/specification>
- 今日自问：没有 MCP，我们有 N 个应用要接 M 个系统，会怎样？

#### W11D02 · 用 Java SDK 写一个 MCP Server（160 分钟）

- 目标：亲手把一段 Java 逻辑暴露成工具。
- [ ] 引入 MCP Java SDK，起一个 stdio 或 SSE 模式的 Server
- [ ] 暴露一个 queryOrder 工具（复用第 6 周的数据）
- [ ] 用 Client 列出工具并调通一次
- 产出物：可运行的 MCP Server + 调用截图
- 资源[辅]：MCP 中文教程（GitHub 系列） · 40 分钟 · <https://github.com/chenmingyong0423/mcp-tutorials>
- 资源[主]：MCP实战指南，mcp视频教程，2小时学透mcp · 123 分钟 · <https://www.bilibili.com/video/BV1eK5DzHEWu>
- 资源[主]：MCP Java SDK · 40 分钟 · <https://github.com/modelcontextprotocol/java-sdk>
- 今日自问：Server 挂了，Client 会怎样？需要超时吗？

#### W11D03 · 用 Spring AI 集成 MCP Server（160 分钟）

- 目标：在熟悉的框架里做，而不是裸写。
- [ ] 用 Spring AI 的 MCP Server 支持声明工具
- [ ] 配置传输方式与工具暴露范围
- [ ] 用 MCP Client（或 IDE 客户端）连接验证
- 产出物：Spring AI 版 MCP Server
- 资源[主]：MCP实战指南，mcp视频教程，2小时学透mcp · 123 分钟 · <https://www.bilibili.com/video/BV1eK5DzHEWu>
- 资源[主]：Spring AI MCP（中文） · 45 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/mcp/mcp-overview/>
- 今日自问：注解式声明和手写 schema，哪个更好维护？

#### W11D04 · 让 Agent 作为 MCP Client（150 分钟）

- 目标：打通「Agent → MCP → 业务系统」这条链。
- [ ] 让第 8 周的 Agent 通过 MCP 发现并调用工具
- [ ] 验证工具描述来自 Server 而非硬编码
- [ ] 记录一次完整调用的耗时分布
- 产出物：Agent + MCP 联调成功
- 资源[主]：MCP实战指南，mcp视频教程，2小时学透mcp · 123 分钟 · <https://www.bilibili.com/video/BV1eK5DzHEWu>
- 资源[主]：Spring AI MCP（中文） · 45 分钟 · <https://springdoc.tech/spring-ai/1.1.0/api/mcp/mcp-overview/>
- 今日自问：工具名冲突时怎么办？

#### W11D05 · 鉴权、限流与审计放在 Java 层（140 分钟）

- 目标：这是 Java 后端最该发挥价值的地方。
- [ ] 给 MCP Server 加调用方鉴权（token/租户）
- [ ] 加限流与配额（按租户/按工具）
- [ ] 审计每次调用：谁调的、查了什么、返回多少行
- 产出物：带治理能力的 MCP Server
- 资源[主]：MCP 规范中文译文（2025-03-26 版） · 40 分钟 · <https://cloud.tencent.com/developer/article/2541726>
- 资源[主]：MCP终极指南 - 从原理到实战，带你深入掌握MCP（基础篇） · 27 分钟 · <https://www.bilibili.com/video/BV1uronYREWR>
- 资源[主]：MCP 规范 · 45 分钟 · <https://modelcontextprotocol.io/specification>
- 今日自问：如果工具能查全表，审计能发现异常吗？

#### W11D06 · 选型结论：Function Calling vs MCP（120 分钟）

- 目标：能对团队说清「什么时候用哪个」。
- [ ] 做对比表：开发成本、复用性、治理、部署、调试
- [ ] 给出你的结论与适用边界
- [ ] 写一段 200 字的选型建议（面试可直接讲）
- 产出物：选型对比表 + 结论
- 资源[辅]：MCP 与 Function Calling 到底什么关系，以及为什么我认为大部分人的观点都是错误的 · 27 分钟 · <https://www.bilibili.com/video/BV15YJTzkENC>
- 资源[主]：什么是Function Calling与MCP协议？它们为何要这样设计？ · 57 分钟 · <https://www.bilibili.com/video/BV1qTYizcEN3>
- 今日自问：小团队一开始就上 MCP 会不会过度设计？

#### W11D07 · 周复盘 + 缓冲（100 分钟）

- 目标：收口，准备作品打磨。
- [ ] 补做未完成项
- [ ] 把 MCP 部分并入主项目结构
- [ ] 更新疑点清单
- 产出物：周复盘
- 今日自问：MCP 是「协议」还是「产品」？我分清了吗？

### 第 12 周 · 作品打磨与表达（预估 16 小时）

**本周目标**：把 11 周的东西收成一个能讲、能跑、能被追问的项目。

**验收**：3 分钟讲清项目，20 个追问里至少答上 15 个。

#### W12D01 · 架构图与 README（150 分钟）

- 目标：让人 60 秒看懂你做了什么、为什么这么做。
- [ ] 画一张架构图（组件/数据流/外部依赖）
- [ ] README 写：背景、方案、关键取舍、指标结果、限制
- [ ] 补「为什么不选另一个方案」一节
- 产出物：架构图 + 完整 README
- 资源[辅]：黑马程序员大模型RAG与Agent智能体项目实战教程，基于主流的LangChain技术从大模型提示词到实战项目 · 932 分钟 · <https://www.bilibili.com/video/BV1yjz5BLEoY>
- 今日自问：图里哪一块最不好解释？那就是需要简化或补认知的地方。

#### W12D02 · 代码整理与分层（150 分钟）

- 目标：让代码配得上「可维护」三个字。
- [ ] 分包：api / application / domain / infrastructure，明确依赖方向
- [ ] 配置全部外置，禁止魔法值
- [ ] 统一异常与返回结构，去掉调试残留
- 产出物：重构后的代码结构
- 资源[主]：Spring Boot 中文文档（3.5） · 40 分钟 · <https://springdoc.tech/spring-boot/3.5.10/reference/>
- 今日自问：新人加一个工具，需要改几个文件？

#### W12D03 · 测试补齐（150 分钟）

- 目标：关键路径有测试护栏，改代码不心慌。
- [ ] 单测覆盖工具实现与参数校验
- [ ] 集成测试覆盖「检索→生成」主链路
- [ ] eval 全量回归一次，结果写进 README
- 产出物：测试通过 + 评测报告
- 资源[主]：RAGas 评测框架深度测评（中文） · 30 分钟 · <https://cloud.tencent.com/developer/article/2505892>
- 资源[主]：【有手就行】20分钟教会你基于RAGas自动化评估RAG方案的优劣！从原理到代码实现，一个视频带你彻底搞懂RAG评估！全程干货无废话，草履虫都能学会~~~ · 24 分钟 · <https://www.bilibili.com/video/BV1d1DfBWErT>
- 资源[辅]：Testcontainers for Java · 30 分钟 · <https://java.testcontainers.org/>
- 今日自问：哪一段代码我至今不敢改？为什么？

#### W12D04 · 演示与录屏（130 分钟）

- 目标：准备一段 3 分钟、能独立播放的演示。
- [ ] 设计三条演示线：正常问答、失败兜底、越权被拦
- [ ] 录制 3 分钟演示（含架构一句话介绍）
- [ ] 视频配字幕或文字稿
- 产出物：演示视频 + 演示脚本
- 今日自问：演示里最打动人的是哪 10 秒？

#### W12D05 · 简历项目描述（120 分钟）

- 目标：把技术工作翻译成招聘方看得懂的价值。
- [ ] 用 STAR 写一段项目描述（情境/任务/行动/结果）
- [ ] 量化 3 个指标（准确率、P95 延迟、单次成本）
- [ ] 列出 3 个技术难点及你的解法
- 产出物：简历项目段落（可直接粘贴）
- 今日自问：我的描述和「调 API 的 CRUD 工程师」有什么区别？

#### W12D06 · 面试自测 20 问（150 分钟）

- 目标：提前暴露知识空洞。
- [ ] 写 20 个可能的追问（RAG/Agent/评测/安全/成本）
- [ ] 逐个口述回答并录音，标出卡壳的
- [ ] 针对卡壳的 5 个问题补资料并写出答案
- 产出物：20 问 + 修订后的答案
- 资源[辅]：10分钟讲清楚 Prompt, Agent, MCP 是什么 · 12 分钟 · <https://www.bilibili.com/video/BV1aeLqzUE6L>
- 今日自问：哪个问题我答得最虚？

#### W12D07 · 总复盘（130 分钟）

- 目标：把 12 周变成可复用的经验，而不只是回忆。
- [ ] 写总复盘：12 周实际投入时长、完成率、最大收获
- [ ] 列出「如果重来一次会怎么改」的 3 条
- [ ] 定下下一个 4 周目标
- 产出物：总复盘文档
- 今日自问：如果只能带走一个能力，我带走什么？

## 阶段 F · 缓冲与拓展（第13-14周）：补欠账，决定下一步

### 第 13 周 · 补课周：按自己的缺口补，而不是按课程顺序补（预估 16 小时）

**本周目标**：把前 12 周半懂的部分补到「能讲清」，并做一次框架对照。

**验收**：结余清单里 80% 项已关闭或明确「不学了」。

#### W13D01 · 结余盘点（120 分钟）

- 目标：先把欠账列清楚，再决定补什么。
- [ ] 翻出全部疑点清单，合并同类项
- [ ] 按「影响作品」和「影响面试」两个维度排序
- [ ] 只选 5 项进本周补课，其余明确放弃
- 产出物：结余清单 + 本周 5 项补课计划
- 今日自问：哪些疑点其实不影响我做事，只是让我焦虑？

#### W13D02 · 补课一：最弱的那个概念（160 分钟）

- 目标：把最大的知识空洞填上。
- [ ] 用「费曼法」写一页解释：给不懂的人讲明白
- [ ] 找到官方文档依据并标注出处
- [ ] 写一个最小可运行验证
- 产出物：一页解释 + 验证代码
- 资源[辅]：OpenTelemetry入门｜一看就懂 · 102 分钟 · <https://www.bilibili.com/video/BV1bF411r71X>
- 今日自问：我能不用术语讲清它吗？

#### W13D03 · 补课二：代码质量欠账（160 分钟）

- 目标：把「能跑」的代码修成「敢给人看」的代码。
- [ ] 挑出最丑的一个类，重写并说明为什么
- [ ] 补日志、补校验、补边界处理
- [ ] 加一条注释解释「为什么这么写」
- 产出物：重构提交 + 说明
- 今日自问：三个月后我还能看懂这段吗？

#### W13D04 · 框架对照：LangChain4j（160 分钟）

- 目标：不做第二种框架的深学，只做概念对照。
- [ ] 用 LangChain4j 实现「工具调用 + RAG」最小版
- [ ] 列 API 对照表：AI Services vs ChatClient、Tool vs @Tool
- [ ] 写结论：什么场景我会选它
- 产出物：LangChain4j 最小实现 + 对照表
- 资源[主]：Java开发AI项目，太爽了！LangChain4j实战教程保姆级 | 代码开源 · 114 分钟 · <https://www.bilibili.com/video/BV1X4GGziEyr>
- 资源[辅]：小智医疗：Java大模型应用项目全流程实战，企业级java项目LangChain4J项目，LangChain+向量数据库+RAG · 357 分钟 · <https://www.bilibili.com/video/BV1cpLTz1EVp>
- 资源[辅]：LangChain4j 文档 · 40 分钟 · <https://docs.langchain4j.dev/>
- 资源[辅]：LangChain4j 工具调用 · 30 分钟 · <https://docs.langchain4j.dev/tutorials/tools>
- 资源[辅]：LangChain4j RAG · 30 分钟 · <https://docs.langchain4j.dev/tutorials/rag>
- 资源[辅]：LangChain4j 对话记忆 · 25 分钟 · <https://docs.langchain4j.dev/tutorials/chat-memory>
- 资源[辅]：Spring AI Alibaba（文档站） · 30 分钟 · <https://java2ai.com/>
- 资源[辅]：Spring AI Alibaba（GitHub） · 20 分钟 · <https://github.com/alibaba/spring-ai-alibaba>
- 今日自问：两个框架同时学，会分散我什么？

#### W13D05 · 补课三：按需自选（160 分钟）

- 目标：弹性日，补你觉得最值得的那一项。
- [ ] 从结余清单剩余项里挑 1 项
- [ ] 设定 90 分钟硬上限，到点就停
- [ ] 写「学到什么 + 还有什么没懂」
- 产出物：补课记录
- 资源[辅]：黑马程序员SpringAI+DeepSeek大模型应用开发实战视频教程，传统Java项目AI化转型必学课程 · 512 分钟 · <https://www.bilibili.com/video/BV1MtZnYtEB3>
- 资源[辅]：【2026版】B站唯一讲的最好的SpringAi Alibaba教程，AI Agent Framework+RAG+Graph+Claw+Skill一次讲完了！ · 588 分钟 · <https://www.bilibili.com/video/BV1aB5K6rE8K>
- 今日自问：时间到了，我是该继续还是该放弃？

#### W13D06 · 文档与演示补强（140 分钟）

- 目标：作品的可信度，一半来自文档。
- [ ] 补「架构决策记录」（3 条：选型/取舍/放弃的方案）
- [ ] 补「已知限制」一节（诚实比完美重要）
- [ ] 演示视频重录一版（比第 12 周更顺）
- 产出物：ADR + 限制说明 + 新演示
- 资源[辅]：黑马程序员LangChain4j从入门到实战项目全套视频课程，涵盖LangChain4j+ollama+RAG，Java传统项目AI智能化升级 · 332 分钟 · <https://www.bilibili.com/video/BV1sDMqzpEQ3>
- 今日自问：我最不想写的那条限制，恰恰是面试官最爱问的。

#### W13D07 · 周复盘（100 分钟）

- 目标：收口。
- [ ] 关闭结余清单里已完成的项
- [ ] 更新简历与项目描述
- [ ] 写下周（拓展周）计划
- 产出物：周复盘
- 今日自问：这周补的东西，哪些其实可以不学？

### 第 14 周 · 拓展与求职：把能力换成机会（预估 16 小时）

**本周目标**：试 3 个「用到再学」的能力，并把作品推到能公开的程度。

**验收**：简历可投、作品链接可发、能讲清下一步方向。

#### W14D01 · 虚拟线程实战（150 分钟）

- 目标：知道它在什么场景有用、什么场景没用。
- [ ] 把一版阻塞式模型调用改成虚拟线程执行
- [ ] 用同样的限流配置压测，对比吞吐与资源占用
- [ ] 写结论：什么条件下才值得切换
- 产出物：虚拟线程版本 + 压测对比
- 资源[主]：虚拟线程到底解决了什么问题（中文） · 25 分钟 · <https://bbs.huaweicloud.com/blogs/499564>
- 资源[主]：【尚硅谷】新版JDK21，深度详解java21虚拟线程新特性 · 33 分钟 · <https://www.bilibili.com/video/BV1Xg4y197DB>
- 资源[辅]：JEP 444 虚拟线程 · 35 分钟 · <https://openjdk.org/jeps/444>
- 今日自问：虚拟线程解决了 I/O 等待，解决不了什么？

#### W14D02 · 模型路由与成本实验（140 分钟）

- 目标：用最少的钱跑出可接受的效果。
- [ ] 设计路由规则：简单问题、长文档、需要推理各走哪个模型
- [ ] 用 eval 集跑三种路由策略，对比准确率与成本
- [ ] 绘制「成本-质量」曲线
- 产出物：路由策略 + 成本质量对比
- 资源[辅]：什么是缓存命中？8分钟说清楚KVCache与Prompt Cache · 8 分钟 · <https://www.bilibili.com/video/BV1keLp6GERQ>
- 资源[主]：DeepSeek API 文档（总览） · 30 分钟 · <https://api-docs.deepseek.com/>
- 今日自问：省下的钱，值得多写的复杂度吗？

#### W14D03 · 微调边界判断（120 分钟）

- 目标：建立「什么时候不该微调」的判断力，不动手训。
- [ ] 整理判断树：不知道 / 格式风格 / 推理能力 分别该怎么解
- [ ] 列出 3 个「该用微调」的场景与 3 个「别用」的场景
- [ ] 估算一次 LoRA 微调的成本与验证方式
- 产出物：判断树 + 成本估算
- 资源[主]：从 LLM 到 Agent Skill，一期视频带你打通底层逻辑！ · 33 分钟 · <https://www.bilibili.com/video/BV1E7wtzaEdq>
- 今日自问：效果不好时，我怎么排除是检索和 Prompt 的问题？

#### W14D04 · 线上 badcase 回流评测（140 分钟）

- 目标：让系统能随着使用变好。
- [ ] 设计反馈入口（赞/踩 + 一句话原因）
- [ ] 把 badcase 自动转成新的 eval 用例
- [ ] 跑一次「新增用例 → 修复 → 回归」闭环
- 产出物：反馈回流链路
- 资源[主]：面试官问：如何评估RAG系统的效果？ · 12 分钟 · <https://www.bilibili.com/video/BV1b69gB5E3h>
- 资源[主]：Ragas 评测框架文档 · 40 分钟 · <https://docs.ragas.io/>
- 今日自问：用户点了踩但不说原因，我能做什么？

#### W14D05 · 部署与公开（可选）（160 分钟）

- 目标：有一个别人能点开的链接，说服力完全不同。
- [ ] 部署到一台云主机或免费平台（注意密钥与额度）
- [ ] 配置基础防护：限流、额度上限、错误页
- [ ] 生成可分享的演示链接与二维码
- 产出物：公开演示地址（或本地一键启动包）
- 资源[辅]：Docker教程，3小时速通，docker部署到实战！ · 164 分钟 · <https://www.bilibili.com/video/BV1Zn4y1X7AZ>
- 资源[主]：Docker 教程（菜鸟教程·中文） · 30 分钟 · <https://www.runoob.com/docker/docker-tutorial.html>
- 今日自问：公开出去最怕什么？那个风险怎么兜？

#### W14D06 · 求职与转岗沟通（140 分钟）

- 目标：把作品换成一次真实的对话机会。
- [ ] 简历定稿，项目放最前，量化指标加粗
- [ ] 准备 3 个版本的项目介绍：30 秒 / 3 分钟 / 10 分钟
- [ ] 找 3 个目标岗位或内部转岗机会，投递或约聊
- 产出物：简历终版 + 三版介绍 + 投递记录
- 今日自问：我最怕被问的那个问题是什么？现在就写答案。

#### W14D07 · 总复盘与下一阶段（120 分钟）

- 目标：结束这一轮，开始下一轮。
- [ ] 统计 14 周：总投入、完成率、产出的可展示物
- [ ] 写「能力自评雷达」（Java 工程/LLM 应用/RAG/Agent/工程化/表达）
- [ ] 定下一个 8 周方向（深耕一域 or 拓宽）
- 产出物：总复盘 + 能力雷达 + 下阶段计划
- 今日自问：14 周后，我和刚开始的自己最大的区别是什么？
