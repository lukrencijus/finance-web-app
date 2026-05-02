import { z } from "zod"

// Matches a single emoji (can be multi-codepoint)
const singleEmojiRegex = /^\p{RGI_Emoji}$/v

export const categorySchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name must be at most 30 characters")
    .trim(),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string()
    .refine(val => val === "" || singleEmojiRegex.test(val), {
      message: "Icon must be a single emoji"
    })
    .optional(),
})

export const transactionSchema = z.object({
  amount: z.number()
    .positive("Amount must be greater than 0")
    .max(999_999_999, "Amount is too large"),
  description: z.string()
    .max(100, "Description must be at most 100 characters")
    .optional(),
  categoryId: z.string().min(1, "Please select a category"),
  monthlySheetId: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]),
  date: z.string().min(1, "Date is required"),
})

export const capitalSchema = z.object({
  name: z.string()
    .min(1, "Name is required")
    .max(40, "Name must be at most 40 characters")
    .trim(),
  amount: z.number()
    .nonnegative("Amount must be 0 or greater")
    .max(999_999_999, "Amount is too large"),
  monthlySheetId: z.string().min(1),
})
