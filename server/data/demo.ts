import type { StatusId, TicketComment, TicketDetail } from '../../shared/types'

// Seeded demo tickets. Always labelled as demo data in the UI.
// Timestamps are relative to server start so "today" stays today.
const ago = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString()

const STATUS_NAME: Record<StatusId, string> = {
  new: 'New',
  in_progress: 'In progress',
  resolved: 'Resolved'
}

const CUSTOMER = 'Alex Novak'
const SUPPORT = 'IT Support'

function comment(id: string, hoursAgo: number, fromCustomer: boolean, body: string): TicketComment {
  return { id, author: fromCustomer ? CUSTOMER : SUPPORT, body, createdAt: ago(hoursAgo), fromCustomer }
}

function ticket(
  key: string,
  status: StatusId,
  summary: string,
  description: string,
  ticketType: string,
  location: string,
  createdHoursAgo: number,
  comments: TicketComment[]
): TicketDetail {
  const last = comments.length ? comments[comments.length - 1]!.createdAt : ago(createdHoursAgo)
  return {
    key,
    summary,
    description,
    status,
    statusName: STATUS_NAME[status],
    ticketType,
    location,
    createdAt: ago(createdHoursAgo),
    updatedAt: last,
    reporter: CUSTOMER,
    assignee: status === 'new' ? 'Unassigned' : SUPPORT,
    comments
  }
}

export function buildDemoTickets(): TicketDetail[] {
  return [
    ticket(
      'MCDTE-42', 'in_progress',
      'Laptop shuts down randomly after update',
      'My laptop started shutting down without warning after yesterday\'s system update. It happened three times this morning and I cannot work properly.',
      'Incident', 'CZ_PHA_NUSLE', 72,
      [
        comment('c42-1', 71, false, 'Thanks for reporting this. Can you tell us the laptop model and whether it is plugged in when it shuts down?'),
        comment('c42-2', 70, true, 'It is a ThinkPad T14. It shuts down on battery and when plugged in.'),
        comment('c42-3', 60, false, 'We rolled back the update remotely. Please restart the laptop and tell us if it still happens.'),
        comment('c42-4', 48, true, 'It shut down again this morning, twice, even after the rollback.'),
        comment('c42-5', 47, false, 'Understood. We are running a hardware diagnostic. Please leave the laptop connected to the network today.'),
        comment('c42-6', 30, false, 'The diagnostic shows a failing battery controller. This is a hardware fault, not the update.'),
        comment('c42-7', 29, true, 'Can I get a replacement? I have a client demo on Friday.'),
        comment('c42-8', 20, false, 'Replacement approved by your manager. We are ordering a new laptop now.'),
        comment('c42-9', 6, false, 'Your new laptop has been ordered. Delivery is expected in 3 working days. We will contact you when it arrives.')
      ]
    ),
    ticket(
      'MCDTE-44', 'in_progress',
      'Cannot connect to store Wi-Fi',
      'Devices in the back of the store cannot connect to the Wi-Fi since Monday.',
      'Incident', 'CZ_BRN_CENTRUM', 30,
      [
        comment('c44-1', 29, false, 'We see the access point in the back area is offline. A technician is checking it remotely.'),
        comment('c44-2', 12, false, 'The remote reset did not work. Please send us the serial number printed on the access point so we can arrange a replacement.')
      ]
    ),
    ticket(
      'MCDTE-41', 'resolved',
      'Password reset email never arrives',
      'I requested a password reset three times but the email does not arrive.',
      'Incident', 'CZ_PHA_NUSLE', 120,
      [
        comment('c41-1', 119, false, 'Your mailbox was blocking our sender. We have whitelisted it.'),
        comment('c41-2', 118, true, 'Got the email now, thank you.'),
        comment('c41-3', 117, false, 'Great. Closing this ticket. Reopen it if it happens again.')
      ]
    ),
    ticket(
      'MCDTE-49', 'new',
      'Request a new kiosk account',
      'Access is required for the new employee starting Monday.',
      'Service request', 'CZ_BRN_CENTRUM', 3,
      []
    ),
    ticket(
      'MCDTE-48', 'in_progress',
      'Point of sale terminal is offline',
      'POS-01 is not accepting card payments.',
      'Incident', 'CZ_PHA_NUSLE', 26,
      [
        comment('c48-1', 25, false, 'We have escalated this to the payment provider. Card payments may be unavailable until this is fixed.'),
        comment('c48-2', 24, true, 'We are taking cash only for now.'),
        comment('c48-3', 5, false, 'The provider confirmed a fix is being deployed today. We will update you once the terminal is back online.')
      ]
    ),
    ticket(
      'MCDTE-45', 'new',
      'Order a second monitor',
      'Could you order a second monitor for my desk? I work with two documents side by side.',
      'Service request', 'CZ_PHA_NUSLE', 10,
      [
        comment('c45-1', 9, false, 'Your request was received and is waiting for manager approval.')
      ]
    ),
    ticket(
      'MCDTE-46', 'new',
      'Receipt printer prints blank pages',
      'The receipt printer at checkout 2 prints blank pages since this morning.',
      'Incident', 'CZ_BRN_CENTRUM', 2,
      []
    ),
    ticket(
      'MCDTE-43', 'resolved',
      'Access badge not working at side entrance',
      'My badge is not opening the side entrance door.',
      'Incident', 'CZ_PHA_NUSLE', 200,
      [
        comment('c43-1', 199, false, 'Your badge permissions were missing the side entrance. We added it.'),
        comment('c43-2', 198, true, 'Works now, thank you.'),
        comment('c43-3', 197, false, 'Happy to help. Closing this ticket.')
      ]
    )
  ]
}

export const DEMO_LOCATIONS = [
  { value: 'CZ_PHA_NUSLE', label: 'Prague Nusle' },
  { value: 'CZ_BRN_CENTRUM', label: 'Brno Centrum' }
]
