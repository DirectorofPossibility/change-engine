import Link from 'next/link'
import { Heart, Users, FileText, ClipboardList, Phone, Calendar, Pencil } from 'lucide-react'

interface Action {
  key: string
  label: string
  icon: React.ReactNode
  value: string
}

interface ActionBarProps {
  actionDonate: string | null
  actionVolunteer: string | null
  actionSignup: string | null
  actionRegister: string | null
  actionApply: string | null
  actionCall: string | null
  actionAttend: string | null
}

export function ActionBar(props: ActionBarProps) {
  var actions: Action[] = []

  if (props.actionDonate) actions.push({ key: 'donate', label: 'Donate', icon: <Heart size={16} />, value: props.actionDonate })
  if (props.actionVolunteer) actions.push({ key: 'volunteer', label: 'Volunteer', icon: <Users size={16} />, value: props.actionVolunteer })
  if (props.actionSignup) actions.push({ key: 'signup', label: 'Sign Up', icon: <Pencil size={16} />, value: props.actionSignup })
  if (props.actionRegister) actions.push({ key: 'register', label: 'Register', icon: <ClipboardList size={16} />, value: props.actionRegister })
  if (props.actionApply) actions.push({ key: 'apply', label: 'Apply', icon: <FileText size={16} />, value: props.actionApply })
  if (props.actionCall) actions.push({ key: 'call', label: 'Call', icon: <Phone size={16} />, value: props.actionCall })
  if (props.actionAttend) actions.push({ key: 'attend', label: 'Attend', icon: <Calendar size={16} />, value: props.actionAttend })

  if (actions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map(function (action) {
        var href = action.value
        if (action.key === 'call' && !href.startsWith('tel:')) {
          href = 'tel:' + href.replace(/[^\d+]/g, '')
        }
        var isExternal = href.startsWith('http') || href.startsWith('tel:')
        return (
          <Link
            key={action.key}
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-brand-accent hover:opacity-90 transition-opacity"
          >
            {action.icon}
            {action.label}
          </Link>
        )
      })}
    </div>
  )
}
