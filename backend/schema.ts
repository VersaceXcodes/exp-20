import { z } from 'zod';

// Users table schemas
export const userSchema = z.object({
  user_id: z.string(),
  email: z.string().email(),
  name: z.string(),
  password_hash: z.string(),
  created_at: z.coerce.date()
});

export const createUserInputSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  password_hash: z.string().min(8).max(255)
});

export const updateUserInputSchema = z.object({
  user_id: z.string(),
  email: z.string().email().optional(),
  name: z.string().min(1).max(255).optional(),
  password_hash: z.string().min(8).max(255).optional()
});

export const searchUserInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['name', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Expos table schemas
export const expoSchema = z.object({
  expo_id: z.string(),
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  category: z.string(),
  location: z.string(),
  featured: z.boolean()
});

export const createExpoInputSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().min(1),
  date: z.coerce.date(),
  category: z.string().min(1).max(255),
  location: z.string().min(1).max(255),
  featured: z.boolean().default(false)
});

export const updateExpoInputSchema = z.object({
  expo_id: z.string(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  date: z.coerce.date().optional(),
  category: z.string().min(1).max(255).optional(),
  location: z.string().min(1).max(255).optional(),
  featured: z.boolean().optional()
});

export const searchExpoInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['title', 'date', 'category']).default('date'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Expo Registrations table schemas
export const expoRegistrationSchema = z.object({
  registration_id: z.string(),
  user_id: z.string(),
  expo_id: z.string(),
  registered_at: z.coerce.date()
});

export const createExpoRegistrationInputSchema = z.object({
  user_id: z.string(),
  expo_id: z.string()
  // registered_at will be auto-generated
});

export const updateExpoRegistrationInputSchema = z.object({
  registration_id: z.string(),
  user_id: z.string().optional(),
  expo_id: z.string().optional()
});

export const searchExpoRegistrationInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['registered_at']).default('registered_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Exhibitors table schemas
export const exhibitorSchema = z.object({
  exhibitor_id: z.string(),
  user_id: z.string(),
  name: z.string(),
  email: z.string().email(),
  company: z.string().nullable(),
  created_at: z.coerce.date()
});

export const createExhibitorInputSchema = z.object({
  user_id: z.string(),
  name: z.string().min(1).max(255),
  email: z.string().email(),
  company: z.string().nullable()
  // created_at will be auto-generated
});

export const updateExhibitorInputSchema = z.object({
  exhibitor_id: z.string(),
  user_id: z.string().optional(),
  name: z.string().min(1).max(255).optional(),
  email: z.string().email().optional(),
  company: z.string().nullable().optional()
});

export const searchExhibitorInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['name', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Virtual Booths table schemas
export const virtualBoothSchema = z.object({
  booth_id: z.string(),
  exhibitor_id: z.string(),
  description: z.string().nullable(),
  media_urls: z.string().nullable(),
  product_catalog: z.string().nullable()
});

export const createVirtualBoothInputSchema = z.object({
  exhibitor_id: z.string(),
  description: z.string().nullable(),
  media_urls: z.string().nullable(),
  product_catalog: z.string().nullable()
});

export const updateVirtualBoothInputSchema = z.object({
  booth_id: z.string(),
  exhibitor_id: z.string().optional(),
  description: z.string().nullable().optional(),
  media_urls: z.string().nullable().optional(),
  product_catalog: z.string().nullable().optional()
});

export const searchVirtualBoothInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['description']).default('description'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// User Interactions table schemas
export const userInteractionSchema = z.object({
  interaction_id: z.string(),
  user_id: z.string(),
  exhibitor_id: z.string(),
  interaction_type: z.string(),
  created_at: z.coerce.date()
});

export const createUserInteractionInputSchema = z.object({
  user_id: z.string(),
  exhibitor_id: z.string(),
  interaction_type: z.string().min(1)
  // created_at will be auto-generated
});

export const updateUserInteractionInputSchema = z.object({
  interaction_id: z.string(),
  user_id: z.string().optional(),
  exhibitor_id: z.string().optional(),
  interaction_type: z.string().min(1).optional()
});

export const searchUserInteractionInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['interaction_type', 'created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Notifications table schemas
export const notificationSchema = z.object({
  notification_id: z.string(),
  user_id: z.string(),
  message: z.string(),
  type: z.string(),
  created_at: z.coerce.date()
});

export const createNotificationInputSchema = z.object({
  user_id: z.string(),
  message: z.string().min(1),
  type: z.string().min(1)
  // created_at will be auto-generated
});

export const updateNotificationInputSchema = z.object({
  notification_id: z.string(),
  user_id: z.string().optional(),
  message: z.string().min(1).optional(),
  type: z.string().min(1).optional()
});

export const searchNotificationInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['created_at']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Admin Activity Logs table schemas
export const adminActivityLogSchema = z.object({
  log_id: z.string(),
  admin_id: z.string(),
  activity_description: z.string(),
  timestamp: z.coerce.date()
});

export const createAdminActivityLogInputSchema = z.object({
  admin_id: z.string(),
  activity_description: z.string().min(1)
  // timestamp will be auto-generated
});

export const updateAdminActivityLogInputSchema = z.object({
  log_id: z.string(),
  admin_id: z.string().optional(),
  activity_description: z.string().min(1).optional()
});

export const searchAdminActivityLogInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['timestamp']).default('timestamp'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Event Schedules table schemas
export const eventScheduleSchema = z.object({
  schedule_id: z.string(),
  expo_id: z.string(),
  event_name: z.string(),
  event_time: z.coerce.date(),
  speaker_info: z.string().nullable()
});

export const createEventScheduleInputSchema = z.object({
  expo_id: z.string(),
  event_name: z.string().min(1),
  event_time: z.coerce.date(),
  speaker_info: z.string().nullable()
});

export const updateEventScheduleInputSchema = z.object({
  schedule_id: z.string(),
  expo_id: z.string().optional(),
  event_name: z.string().min(1).optional(),
  event_time: z.coerce.date().optional(),
  speaker_info: z.string().nullable().optional()
});

export const searchEventScheduleInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['event_time']).default('event_time'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// Feedbacks table schemas
export const feedbackSchema = z.object({
  feedback_id: z.string(),
  user_id: z.string(),
  feedback_content: z.string(),
  submitted_at: z.coerce.date()
});

export const createFeedbackInputSchema = z.object({
  user_id: z.string(),
  feedback_content: z.string().min(1)
  // submitted_at will be auto-generated
});

export const updateFeedbackInputSchema = z.object({
  feedback_id: z.string(),
  user_id: z.string().optional(),
  feedback_content: z.string().min(1).optional()
});

export const searchFeedbackInputSchema = z.object({
  query: z.string().optional(),
  limit: z.number().int().positive().default(10),
  offset: z.number().int().nonnegative().default(0),
  sort_by: z.enum(['submitted_at']).default('submitted_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc')
});

// inferred types:
export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserInputSchema>;
export type UpdateUserInput = z.infer<typeof updateUserInputSchema>;
export type SearchUserInput = z.infer<typeof searchUserInputSchema>;

export type Expo = z.infer<typeof expoSchema>;
export type CreateExpoInput = z.infer<typeof createExpoInputSchema>;
export type UpdateExpoInput = z.infer<typeof updateExpoInputSchema>;
export type SearchExpoInput = z.infer<typeof searchExpoInputSchema>;

export type ExpoRegistration = z.infer<typeof expoRegistrationSchema>;
export type CreateExpoRegistrationInput = z.infer<typeof createExpoRegistrationInputSchema>;
export type UpdateExpoRegistrationInput = z.infer<typeof updateExpoRegistrationInputSchema>;
export type SearchExpoRegistrationInput = z.infer<typeof searchExpoRegistrationInputSchema>;

export type Exhibitor = z.infer<typeof exhibitorSchema>;
export type CreateExhibitorInput = z.infer<typeof createExhibitorInputSchema>;
export type UpdateExhibitorInput = z.infer<typeof updateExhibitorInputSchema>;
export type SearchExhibitorInput = z.infer<typeof searchExhibitorInputSchema>;

export type VirtualBooth = z.infer<typeof virtualBoothSchema>;
export type CreateVirtualBoothInput = z.infer<typeof createVirtualBoothInputSchema>;
export type UpdateVirtualBoothInput = z.infer<typeof updateVirtualBoothInputSchema>;
export type SearchVirtualBoothInput = z.infer<typeof searchVirtualBoothInputSchema>;

export type UserInteraction = z.infer<typeof userInteractionSchema>;
export type CreateUserInteractionInput = z.infer<typeof createUserInteractionInputSchema>;
export type UpdateUserInteractionInput = z.infer<typeof updateUserInteractionInputSchema>;
export type SearchUserInteractionInput = z.infer<typeof searchUserInteractionInputSchema>;

export type Notification = z.infer<typeof notificationSchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationInputSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationInputSchema>;
export type SearchNotificationInput = z.infer<typeof searchNotificationInputSchema>;

export type AdminActivityLog = z.infer<typeof adminActivityLogSchema>;
export type CreateAdminActivityLogInput = z.infer<typeof createAdminActivityLogInputSchema>;
export type UpdateAdminActivityLogInput = z.infer<typeof updateAdminActivityLogInputSchema>;
export type SearchAdminActivityLogInput = z.infer<typeof searchAdminActivityLogInputSchema>;

export type EventSchedule = z.infer<typeof eventScheduleSchema>;
export type CreateEventScheduleInput = z.infer<typeof createEventScheduleInputSchema>;
export type UpdateEventScheduleInput = z.infer<typeof updateEventScheduleInputSchema>;
export type SearchEventScheduleInput = z.infer<typeof searchEventScheduleInputSchema>;

export type Feedback = z.infer<typeof feedbackSchema>;
export type CreateFeedbackInput = z.infer<typeof createFeedbackInputSchema>;
export type UpdateFeedbackInput = z.infer<typeof updateFeedbackInputSchema>;
export type SearchFeedbackInput = z.infer<typeof searchFeedbackInputSchema>;
