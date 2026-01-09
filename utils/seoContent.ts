
export interface SeoPageContent {
  h1: string;
  description: string;
  features: string[];
  useCases: string[];
  faq: { q: string; a: string }[];
}

export const seoContent: Record<string, Record<string, SeoPageContent>> = {
  en: {
    tree: {
      h1: "Professional JSON Formatter & Visual Explorer Online",
      description: "JSON Morph is a high-performance JSON formatter and visual tree explorer designed for architects and developers. Navigate massive JSON files (up to GB level) with ease using our streaming parser and instant search capabilities.",
      features: [
        "Streaming Parser: Handle GB-level JSON without crashing your browser",
        "Visual Tree: Interactive hierarchy exploration with node pinning",
        "Deep Search: Regex-supported structural search across complex objects",
        "Privacy First: 100% local processing, no data ever leaves your machine"
      ],
      useCases: [
        "Debugging complex API responses from microservices",
        "Inspecting large log files or database exports in JSON format",
        "Teaching JSON structure to junior developers with visual aids"
      ],
      faq: [
        { q: "Is my JSON data safe?", a: "Yes. All processing happens locally in your browser. We do not upload your data to any server, nor do we track your inputs." },
        { q: "Can it handle 1GB+ JSON files?", a: "Absolutely. We use Web Workers and a streaming state-machine parser to process large files efficiently without freezing the UI." },
        { q: "Is there a limit to nesting depth?", a: "No practical limit. Our tree renderer is optimized for deep hierarchies using lazy rendering techniques." }
      ]
    },
    builder: {
      h1: "Visual JSON Builder & Schema Architect",
      description: "Create complex JSON structures visually with our intuitive builder. No more syntax errors or missing commas. Perfect for designing API schemas and configuration files.",
      features: [
        "Visual Interface: Add, remove, and move nodes with a few clicks",
        "Type Safety: Ensure nodes are correctly typed (string, number, boolean, array, object)",
        "Real-time Export: See your raw JSON update instantly as you build",
        "Template Support: Start from common JSON patterns"
      ],
      useCases: [
        "Designing mock API data for frontend development",
        "Generating configuration files (e.g., package.json, tsconfig.json) visually",
        "Prototyping data structures before implementation"
      ],
      faq: [
        { q: "Can I import existing JSON?", a: "Yes, you can paste raw JSON and it will be converted into a visual editable structure immediately." },
        { q: "Does it support deep nesting?", a: "Yes, you can create infinitely nested objects and arrays." }
      ]
    },
    table: {
      h1: "JSON to Table Converter - Bulk Data Inspector",
      description: "Convert repetitive JSON arrays into a searchable tabular view. Ideal for inspecting bulk data, CSV-like exports, and identifying patterns in large datasets.",
      features: [
        "Pattern Recognition: Automatically detects arrays and flattens them for table display",
        "Search & Filter: Quickly find specific entries in thousands of rows",
        "Multi-format Export: Convert your table directly to CSV, TSV, or Excel-ready formats",
        "Dynamic Columns: Automatically adjusts columns based on JSON keys"
      ],
      useCases: [
        "Inspecting product catalogs or user lists from API exports",
        "Converting JSON datasets for use in spreadsheet software",
        "Validating data consistency across large collections"
      ],
      faq: [
        { q: "How does the pattern recognition work?", a: "Our engine scans the JSON structure for repetitive object shapes within arrays and maps them to table columns." },
        { q: "Can I export the table back to JSON?", a: "The table view is a projection of your JSON. You can always switch back to the tree or raw view." }
      ]
    },
    analysis: {
      h1: "Advanced JSON Analytics & Structural Intelligence",
      description: "Get deep insights into your JSON data. Analyze value distributions, key frequencies, and structural health with our built-in analytics engine.",
      features: [
        "Value Aggregation: See common values and outliers in your data",
        "Key Frequency: Identify missing fields or inconsistent naming conventions",
        "Type Distribution: Audit the data types used across your entire document",
        "Performance Stats: Measure parsing and rendering times for large files"
      ],
      useCases: [
        "Auditing large datasets for data quality and consistency",
        "Optimizing JSON structure for performance and size",
        "Discovering hidden patterns in complex nested data"
      ],
      faq: [
        { q: "What metrics are provided?", a: "We provide key counts, nesting depth, size analysis, type distribution charts, and value frequency rankings." },
        { q: "Is the analysis performed in real-time?", a: "Yes, the analysis updates as you modify your JSON in the builder or raw editor." }
      ]
    },
    export: {
      h1: "JSON Converter - Export to CSV, YAML, XML & More",
      description: "Transform your JSON into any format you need. Our professional conversion engine supports YAML, XML, CSV, TSV, Markdown, TOML, and even code snippet images.",
      features: [
        "Universal Compatibility: Export to 10+ different formats",
        "Live Preview: See the converted output instantly before downloading",
        "One-Click Copy/Download: Fast workflow for developers",
        "Code Snippet Images: Generate beautiful PNG/SVG snippets for documentation"
      ],
      useCases: [
        "Converting JSON config to YAML for Kubernetes or CI/CD",
        "Exporting API data to CSV for business reporting",
        "Generating XML for legacy system integrations"
      ],
      faq: [
        { q: "Does the conversion preserve data types?", a: "Yes, our engine maps JSON types to the target format's closest equivalents (e.g., JSON arrays to YAML lists)." },
        { q: "Is there a file size limit for conversion?", a: "Most formats support files up to several megabytes. For extremely large files, we recommend using the streaming formatter." }
      ]
    }
  },
  zh: {
    tree: {
      h1: "专业级在线 JSON 格式化与视觉探索工具",
      description: "JSON Morph 是一款专为架构师和开发者设计的高性能 JSON 格式化工具。利用我们的流式解析技术和即时搜索功能，轻松处理 GB 级的大型 JSON 文件。",
      features: [
        "流式解析：稳定处理 GB 级 JSON，绝不崩溃浏览器",
        "视觉树状图：交互式层级探索，支持节点固定功能",
        "深度搜索：支持正则的结构化搜索，快速定位复杂对象",
        "隐私保护：100% 本地处理，数据绝不离开您的设备"
      ],
      useCases: [
        "调试微服务中复杂的 API 响应数据",
        "检查 JSON 格式的大型日志文件或数据库导出文件",
        "通过视觉辅助向初级开发者演示 JSON 结构"
      ],
      faq: [
        { q: "我的 JSON 数据安全吗？", a: "是的。所有处理均在您的浏览器本地完成。我们不会上传数据到任何服务器，也不会记录您的输入内容。" },
        { q: "它能处理 1GB 以上的文件吗？", a: "没问题。我们使用 Web Workers 和流式状态机解析器，高效处理大文件且不卡顿 UI。" },
        { q: "嵌套深度有限制吗？", a: "实际上没有限制。我们的树状渲染器采用延迟加载技术，专为深层嵌套结构进行了优化。" }
      ]
    },
    builder: {
      h1: "可视化 JSON 构建器与模式架构师",
      description: "通过直观的构建器可视化创建复杂的 JSON 结构。不再有语法错误或遗漏逗号。非常适合设计 API 模式和配置文件。",
      features: [
        "可视化界面：点击几下即可添加、删除或移动节点",
        "类型安全：确保节点类型（字符串、数字、布尔、数组、对象）正确无误",
        "实时导出：构建时即时查看原始 JSON 更新",
        "模板支持：从常用的 JSON 模式快速开始"
      ],
      useCases: [
        "为前端开发设计模拟 API 数据",
        "可视化生成配置文件（如 package.json, tsconfig.json）",
        "在实现前进行数据结构原型设计"
      ],
      faq: [
        { q: "我可以导入现有的 JSON 吗？", a: "可以，您可以粘贴原始 JSON，它会立即转换为可视化的可编辑结构。" },
        { q: "支持深度嵌套吗？", a: "支持，您可以创建无限嵌套的对象和数组。" }
      ]
    },
    table: {
      h1: "JSON 转表格转换器 - 批量数据检查工具",
      description: "将重复的 JSON 数组转换为可搜索的表格视图。非常适合检查批量数据、CSV 类导出以及识别大型数据集中的模式。",
      features: [
        "模式识别：自动检测数组并将其扁平化以进行表格显示",
        "搜索与过滤：在数千行中快速查找特定条目",
        "多格式导出：将表格直接转换为 CSV、TSV 或 Excel 格式",
        "动态列：根据 JSON 键名自动调整列显示"
      ],
      useCases: [
        "从 API 导出中检查产品目录或用户列表",
        "转换 JSON 数据集以便在电子表格软件中使用",
        "验证大型集合中的数据一致性"
      ],
      faq: [
        { q: "模式识别是如何工作的？", a: "我们的引擎会扫描 JSON 结构，寻找数组中重复的对象形状，并将其映射到表格列。" },
        { q: "我可以将表格转回 JSON 吗？", a: "表格视图是 JSON 的一种投影。您可以随时切换回树状视图或原始视图。" }
      ]
    },
    analysis: {
      h1: "高级 JSON 分析与结构化智能工具",
      description: "深入了解您的 JSON 数据。利用内置的分析引擎分析数值分布、键名频率和结构健康状况。",
      features: [
        "数值聚合：查看数据中的常见值和异常值",
        "键名频率：识别缺失字段或不一致的命名规范",
        "类型分布：审计整个文档中使用的所有数据类型",
        "性能统计：测量大文件的解析和渲染时间"
      ],
      useCases: [
        "审计大型数据集的数据质量和一致性",
        "针对性能和体积优化 JSON 结构",
        "在复杂的嵌套数据中发现隐藏模式"
      ],
      faq: [
        { q: "提供哪些指标？", a: "我们提供键总数、嵌套深度、体积分析、类型分布图表和数值频率排名。" },
        { q: "分析是实时的吗？", a: "是的，当您在设计器或源码编辑器中修改 JSON 时，分析会同步更新。" }
      ]
    },
    export: {
      h1: "JSON 转换器 - 导出为 CSV, YAML, XML 等格式",
      description: "将您的 JSON 转换为任何您需要的格式。我们的专业转换引擎支持 YAML, XML, CSV, TSV, Markdown, TOML 甚至代码片段图片。",
      features: [
        "通用兼容性：支持导出到 10 多种不同格式",
        "实时预览：在下载前即时查看转换后的输出",
        "一键复制/下载：为开发者设计的快速工作流",
        "代码片段图：生成美观的 PNG/SVG 代码图用于文档说明"
      ],
      useCases: [
        "将 JSON 配置转换为用于 Kubernetes 或 CI/CD 的 YAML",
        "导出 API 数据到 CSV 以进行业务报表",
        "为遗留系统集成生成 XML 数据"
      ],
      faq: [
        { q: "转换会保留数据类型吗？", a: "是的，我们的引擎会将 JSON 类型映射到目标格式中最接近的等效项。" },
        { q: "转换有文件大小限制吗？", a: "大多数格式支持几兆字节的文件。对于极大文件，建议使用流式格式化工具。" }
      ]
    }
  }
};
