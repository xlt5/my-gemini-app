export type TransactionType = 'expense' | 'income';

export enum Category {
  // 支出分类
  FOOD = '餐饮美食',
  SHOPPING = '购物消费',
  TRANSPORT = '交通出行',
  BILLS = '生活缴费',
  ENTERTAINMENT = '休闲娱乐',
  HEALTH = '医疗健康',
  EDUCATION = '学习教育',
  EXPENSE_OTHER = '其他支出',
  
  // 收入分类
  SALARY = '工资薪金',
  INVESTMENT = '投资理财',
  BONUS = '奖金补贴',
  INCOME_OTHER = '其他入账'
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  merchant: string;
  category: Category;
  date: string; // ISO string YYYY-MM-DD
  note?: string;
}

export interface ExpenseAnalysisResult {
  amount: number;
  merchant: string;
  category: string;
  type: TransactionType;
  date?: string;
  confidence?: number;
}