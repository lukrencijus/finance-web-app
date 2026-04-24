import { z } from "zod"

// Matches 1 or 2 emojis (each emoji can be multi-codepoint)
const emojiRegex = /^\p{Emoji_Presentation}(\u200d\p{Emoji_Presentation})*(\uFE0F)?(\p{Emoji_Presentation}(\u200d\p{Emoji_Presentation})*(\uFE0F)?)?$/u

export const categorySchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(30, "Name must be at most 30 characters")
    .trim(),
  type: z.enum(["INCOME", "EXPENSE"]),
  icon: z.string()
    .refine(val => val === "" || emojiRegex.test(val), {
      message: "Icon must be 1 or 2 emojis"
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