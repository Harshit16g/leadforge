import { StatusVariant } from "@/components/common/StatusBadge";

/**
 * [AUDIT] Unified Session Lifecycle
 * The source of truth for all session-related statuses and UI treatments.
 */

export const SESSION_LIFECYCLE = {
  CONFIRMED: 'confirmed',
  ARRIVED: 'arrived',
  IN_SERVICE: 'in_service',
  PAID: 'paid',
  COMPLETED: 'completed',
  NO_SHOW: 'no_show',
  CANCELLED: 'cancelled',
} as const;

export type SessionStatus = typeof SESSION_LIFECYCLE[keyof typeof SESSION_LIFECYCLE];

export interface StatusConfig {
  label: string;
  variant: StatusVariant;
  description: string;
}

export const SESSION_STATUS_CONFIG: Record<SessionStatus, StatusConfig> = {
  [SESSION_LIFECYCLE.CONFIRMED]: {
    label: 'Confirmed',
    variant: 'confirmed',
    description: 'Booking is confirmed and awaiting arrival.',
  },
  [SESSION_LIFECYCLE.ARRIVED]: {
    label: 'Arrived',
    variant: 'arrived',
    description: 'Customer has checked in at the location.',
  },
  [SESSION_LIFECYCLE.IN_SERVICE]: {
    label: 'In-Service',
    variant: 'in_service',
    description: 'The service is currently being performed.',
  },
  [SESSION_LIFECYCLE.PAID]: {
    label: 'Paid',
    variant: 'paid',
    description: 'Payment has been processed, but session not yet finalized.',
  },
  [SESSION_LIFECYCLE.COMPLETED]: {
    label: 'Completed',
    variant: 'completed',
    description: 'Session is finished and successfully closed.',
  },
  [SESSION_LIFECYCLE.NO_SHOW]: {
    label: 'No Show',
    variant: 'danger',
    description: 'Customer did not arrive for the scheduled session.',
  },
  [SESSION_LIFECYCLE.CANCELLED]: {
    label: 'Cancelled',
    variant: 'cancelled',
    description: 'Booking was terminated by either party.',
  },
};

/**
 * Helpful groupings for filtering and dashboard widgets
 */
export const STATUS_GROUPS = {
  ACTIVE: [SESSION_LIFECYCLE.ARRIVED, SESSION_LIFECYCLE.IN_SERVICE, SESSION_LIFECYCLE.PAID],
  UPCOMING: [SESSION_LIFECYCLE.CONFIRMED],
  TERMINAL: [SESSION_LIFECYCLE.COMPLETED, SESSION_LIFECYCLE.NO_SHOW, SESSION_LIFECYCLE.CANCELLED],
};
