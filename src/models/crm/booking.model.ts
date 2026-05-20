import { z } from 'zod'

export const BookingStatusSchema = z.enum([
    'confirmed', 'pending', 'notify_pending', 'in_progress', 'completed', 'cancelled', 'no_show',
    'arrived', 'in_service', 'service_start_pending', 'service_complete_pending', 'payment_pending', 'payment'
])
export type BookingStatus = z.infer<typeof BookingStatusSchema>

export const BOOKING_SOURCES = ['walkin', 'online', 'qr', 'whatsapp', 'instagram', 'phone'] as const;
export const BookingSourceSchema = z.enum(BOOKING_SOURCES)
export type BookingSource = z.infer<typeof BookingSourceSchema>

export function isOnline(source: string): boolean {
  return source !== 'walkin' && source !== 'phone';
}

export const SchedulingMethodSchema = z.enum(['manual', 'auto_assigned', 'ai_optimized'])
export type SchedulingMethod = z.infer<typeof SchedulingMethodSchema>

export const PaymentMethodSchema = z.enum([
    'cash', 'card', 'upi', 'razorpay', 'wallet', 'pending',
])
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>

export const BookingPaymentStatusSchema = z.enum([
    'paid', 'pending', 'partial', 'refunded', 'waived',
])
export type BookingPaymentStatus = z.infer<typeof BookingPaymentStatusSchema>

export const BookingServiceSchema = z.object({
    service_id: z.uuid().optional(),
    service_name: z.string(),
    staff_id: z.uuid().optional(),
    price: z.number().min(0),
    duration_minutes: z.number().int().min(1).optional(),
    gst_rate: z.number().min(0).default(0),
})
export type BookingService = z.infer<typeof BookingServiceSchema>

export const BookingRowSchema = z.object({
    id: z.uuid(),
    org_id: z.uuid(),
    branch_id: z.uuid().nullable(),
    customer_id: z.uuid().nullable(),
    staff_id: z.uuid().nullable(),
    source: BookingSourceSchema.default('walkin'),
    status: BookingStatusSchema.default('pending'),
    scheduling_method: SchedulingMethodSchema.nullable(),
    services: z.array(BookingServiceSchema).default([]),
    total_amount: z.number().default(0),
    discount_amount: z.number().default(0),
    gst_amount: z.number().default(0),
    final_amount: z.number().default(0),
    payment_method: PaymentMethodSchema.nullable(),
    payment_status: BookingPaymentStatusSchema.default('pending'),
    scheduled_at: z.string().datetime().nullable(),
    completed_at: z.string().datetime().nullable(),
    assigned_at: z.string().datetime().nullable(),
    assigned_by: z.uuid().nullable(),
    buffer_before: z.number().int().default(0),
    buffer_after: z.number().int().default(10),
    wa_notification_id: z.string().nullable(),
    wa_reminder_sent: z.boolean().default(false),
    waitlist_id: z.uuid().nullable(),
    notes: z.string().nullable(),
    created_by: z.uuid().nullable(),
    deleted_at: z.string().datetime().nullable(),
    created_at: z.string().datetime(),
    updated_at: z.string().datetime(),
})
export type BookingRow = z.infer<typeof BookingRowSchema>

export const BookingInsertSchema = BookingRowSchema.omit({
    id: true, created_at: true, updated_at: true, deleted_at: true,
    assigned_at: true, wa_notification_id: true, wa_reminder_sent: true,
})
export type BookingInsert = z.infer<typeof BookingInsertSchema>

export const BookingUpdateSchema = BookingInsertSchema.omit({ org_id: true }).partial()
export type BookingUpdate = z.infer<typeof BookingUpdateSchema>

export const CreateBookingRequestSchema = z.object({
    org_id: z.uuid(),
    branch_id: z.uuid().optional(),
    customer_id: z.uuid().optional(),
    staff_id: z.uuid().optional(),
    scheduled_at: z.string().datetime().optional(),
    source: BookingSourceSchema.optional().default('walkin'),
    services: z.array(z.object({
        service_id: z.uuid(),
        staff_id: z.uuid().optional(),
    })).min(1),
    payment_method: PaymentMethodSchema.optional(),
    notes: z.string().optional(),
    auto_assign: z.boolean().default(false),
})
export type CreateBookingRequest = z.infer<typeof CreateBookingRequestSchema>


// Enriched type for dashboard/feed views
export const BookingWithNamesSchema = BookingRowSchema.extend({
    customers: z.object({
        name: z.string(),
    }).nullable().optional(),
    employees: z.object({
        name: z.string(),
    }).nullable().optional(),
})
export type BookingWithNames = z.infer<typeof BookingWithNamesSchema>
export type BookingWithName = BookingWithNames // Alias for user compatibility

