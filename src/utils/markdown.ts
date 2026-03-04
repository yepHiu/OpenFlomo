import { h, type VNode } from "vue";

/**
 * 解析加粗: **text**
 */
export function parseBold(text: string): (string | VNode)[] {
  const parts: (string | VNode)[] = [];
  const regex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(h("strong", {}, match[1]));
    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * 解析一行（加粗）
 */
export function parseLine(line: string): VNode[] {
  return parseBold(line);
}

/**
 * 单行渲染类型（带 key）
 */
export type LineNode = {
  key: string;
  node: VNode;
};

/**
 * 增量解析内容，返回渲染节点数组（带 key）
 * 支持: 有序列表、无序列表、加粗
 */
export function parseMarkdownIncremental(content: string): LineNode[] {
  if (!content) return [];

  const lines = content.split("\n");
  const nodes: LineNode[] = [];
  let currentUl: { key: string; text: string }[] = [];
  let currentOl: { key: string; num: number; text: string }[] = [];
  let ulIndex = 0;
  let olIndex = 0;
  let pIndex = 0;

  const flushLists = () => {
    if (currentUl.length > 0) {
      nodes.push({
        key: `ul-${ulIndex++}`,
        node: h("ul", { class: "md-ul" }, currentUl.map((item) => h("li", { class: "md-li", key: item.key }, parseLine(item.text))))
      });
      currentUl = [];
    }
    if (currentOl.length > 0) {
      nodes.push({
        key: `ol-${olIndex++}`,
        node: h("ol", { class: "md-ol" }, currentOl.map((item) => h("li", { class: "md-li", key: item.key }, parseLine(item.text))))
      });
      currentOl = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineKey = `line-${i}`;

    // 无序列表: - 或 * 开头
    if (/^[-*]\s/.test(line)) {
      if (currentOl.length > 0) flushLists();
      currentUl.push({ key: lineKey, text: line.slice(2).trim() });
    }
    // 有序列表: 数字. 开头
    else if (/^(\d+)\.\s/.test(line)) {
      if (currentUl.length > 0) flushLists();
      const match = line.match(/^(\d+)\.\s(.+)$/);
      if (match) {
        currentOl.push({ key: lineKey, num: parseInt(match[1]), text: match[2] });
      }
    }
    // 普通文本
    else {
      flushLists();
      if (line.trim()) {
        nodes.push({
          key: `p-${pIndex++}`,
          node: h("p", { class: "md-p", key: lineKey }, parseLine(line))
        });
      }
    }
  }

  flushLists();
  return nodes;
}

/**
 * 解析内容，返回渲染节点数组（兼容旧版）
 */
export function parseMarkdown(content: string): VNode[] {
  return parseMarkdownIncremental(content).map(item => item.node);
}

/**
 * 检测当前行是否为列表项，返回类型和编号
 */
export function detectListType(line: string): { type: "ul" | "ol" | "none"; num?: number } {
  if (/^[-*]\s/.test(line)) {
    return { type: "ul" };
  }
  const match = line.match(/^(\d+)\.\s/);
  if (match) {
    return { type: "ol", num: parseInt(match[1]) };
  }
  return { type: "none" };
}

/**
 * 获取列表续接符号
 * ul: "- "
 * ol: 下一编号 + ". "
 */
export function getListContinuation(currentType: "ul" | "ol" | "none", currentNum?: number): string {
  if (currentType === "ul") {
    return "- ";
  }
  if (currentType === "ol" && currentNum !== undefined) {
    return `${currentNum + 1}. `;
  }
  return "";
}
