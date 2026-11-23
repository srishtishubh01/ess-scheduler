import { checkEligibility } from './rules'
import { fmtDate } from '../utils'

export function approveSwap(s, sw) {
  const shift = s.db.shifts.find((x) => x.id === sw.shiftId)
  if (!shift) return s.notify('Shift no longer exists', 'err')
  const issues = checkEligibility(s.db, shift, sw.toId)
  if (issues.length) return s.notify(`Cannot approve: ${issues[0]}`, 'err')
  s.patch('shifts', shift.id, { assignedTo: sw.toId, accepted: false })
  s.patch('swaps', sw.id, { status: 'approved' })
  s.alert(sw.fromId, 'Swap approved', `Your swap for ${fmtDate(shift.date)} was approved.`, 'shift')
  s.alert(sw.toId, 'New shift from swap', `${shift.title} on ${fmtDate(shift.date)} is now yours.`, 'shift')
  s.audit('Approved swap request')
  s.notify('Swap approved and schedule updated')
}
