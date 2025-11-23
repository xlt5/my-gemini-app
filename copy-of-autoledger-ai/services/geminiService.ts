import { GoogleGenAI, Type } from "@google/genai";
import { ExpenseAnalysisResult, TransactionType } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url part (e.g., "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeTransactionSource = async (
  textInput: string,
  imageBase64?: string,
  mimeType: string = 'image/jpeg'
): Promise<ExpenseAnalysisResult> => {
  
  const prompt = `
    你是一个专业的智能记账助手。请分析提供的图片（支付截图、收款截图、小票）或文本。
    
    请提取以下关键信息并生成 JSON：
    1. type: 判断是 'expense' (支出/消费/付款) 还是 'income' (收入/收款/工资/转账收入)。
       - 如果是支付成功、消费、付款，则是 'expense'。
       - 如果是收款成功、收到转账、工资入账，则是 'income'。
    2. amount: 金额（数字）。
    3. merchant: 交易对象。
       - 支出：商户名称（如"星巴克"）。
       - 收入：来源名称（如"公司转账"、"张三"）。
    4. category: 从列表中选择最合适的分类：
       - 支出类: '餐饮美食', '购物消费', '交通出行', '生活缴费', '休闲娱乐', '医疗健康', '学习教育', '其他支出'
       - 收入类: '工资薪金', '投资理财', '奖金补贴', '其他入账'
    5. date: 日期 YYYY-MM-DD。如果不明确，默认为当天。
    
    请直接返回 JSON 对象。
  `;

  const parts: any[] = [{ text: prompt }];

  if (textInput) {
    parts.push({ text: `附加文本信息: ${textInput}` });
  }

  if (imageBase64) {
    parts.push({
      inlineData: {
        data: imageBase64,
        mimeType: mimeType
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: { parts: parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING, enum: ['expense', 'income'], description: "交易类型" },
            amount: { type: Type.NUMBER, description: "金额" },
            merchant: { type: Type.STRING, description: "商户或来源" },
            category: { type: Type.STRING, description: "分类" },
            date: { type: Type.STRING, description: "日期 YYYY-MM-DD" },
          },
          required: ["type", "amount", "merchant", "category"]
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("Gemini 未返回响应");
    }

    return JSON.parse(textResponse) as ExpenseAnalysisResult;

  } catch (error) {
    console.error("Gemini 分析错误:", error);
    throw error;
  }
};