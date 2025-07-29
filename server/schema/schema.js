const { z } = require("zod");

// Enhanced registration schema with better validation
const registrationSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces"),
  
  email: z.string()
    .email("Please enter a valid email address")
    .toLowerCase()
    .max(100, "Email must not exceed 100 characters"),
  
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must not exceed 128 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one lowercase letter, one uppercase letter, and one number"),
  
  age: z.number()
    .int("Age must be a whole number")
    .min(18, "You must be at least 18 years old")
    .max(100, "Please enter a valid age")
    .optional(),
  
  gender: z.enum(["male", "female", "other"], {
    errorMap: () => ({ message: "Please select a valid gender" })
  }).optional(),
  
  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City must not exceed 50 characters")
    .regex(/^[a-zA-Z\s,.-]+$/, "City contains invalid characters")
    .optional(),
});

// Enhanced login schema
const loginSchema = z.object({
  email: z.string()
    .email("Please enter a valid email address")
    .toLowerCase(),
  
  password: z.string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
});

// Profile update schema
const profileUpdateSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .regex(/^[a-zA-Z\s]+$/, "Name can only contain letters and spaces")
    .optional(),
  
  age: z.number()
    .int("Age must be a whole number")
    .min(18, "You must be at least 18 years old")
    .max(100, "Please enter a valid age")
    .optional(),
  
  gender: z.enum(["male", "female", "other"])
    .optional(),
  
  city: z.string()
    .min(2, "City must be at least 2 characters")
    .max(50, "City must not exceed 50 characters")
    .optional(),
  
  bio: z.string()
    .max(500, "Bio must not exceed 500 characters")
    .optional(),
  
  hobbies: z.string()
    .max(300, "Hobbies must not exceed 300 characters")
    .optional(),
  
  occupation: z.string()
    .max(100, "Occupation must not exceed 100 characters")
    .optional(),
  
  education: z.string()
    .max(100, "Education must not exceed 100 characters")
    .optional(),
  
  height: z.string()
    .max(20, "Height must not exceed 20 characters")
    .optional(),
  
  looking_for: z.string()
    .max(100, "Looking for must not exceed 100 characters")
    .optional(),
});

// Message validation schema
const messageSchema = z.object({
  conversationId: z.number()
    .int("Invalid conversation ID")
    .positive("Invalid conversation ID"),
  
  messageText: z.string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message too long")
    .trim(),
});

// Start conversation schema
const startConversationSchema = z.object({
  otherUserId: z.number()
    .int("Invalid user ID")
    .positive("Invalid user ID"),
});

module.exports = { 
  registrationSchema, 
  loginSchema, 
  profileUpdateSchema,
  messageSchema,
  startConversationSchema
};

