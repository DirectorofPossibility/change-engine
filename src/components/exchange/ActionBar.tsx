'use client'

import Link from 'next/link'
import { Heart, Users, FileText, ClipboardList, Phone, Calendar, Pencil } from 'lucide-react'
import { useTranslation } from '@/lib/use-translation'

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
  const { t } = useTranslation()
  const actions: Action[] = []

  if (props.actionDonate) actions.push({ key: 'donate', label: t('action.donate'), icon: <Heart size={16} />, value: props.actionDonate })
  if (props.actionVolunteer) actions.push({ key: 'volunteer', label: t('action.volunteer'), icon: <Users size={16} />, value: props.actionVolunteer })
  if (props.actionSignup) actions.push({ key: 'signup', label: t('action.sign_up'), icon: <Pencil size={16} />, value: props.actionSignup })
  if (props.actionRegister) actions.push({ key: 'register', label: t('action.register'), icon: <ClipboardList size={16} />, value: props.actionRegister })
  if (props.actionApply) actions.push({ key: 'apply', label: t('action.apply'), icon: <FileText size={16} />, value: props.actionApply })
  if (props.actionCall) actions.push({ key: 'call', label: t('action.call'), icon: <Phone size={16} />, value: props.actionCall })
  if (props.actionAttend) actions.push({ key: 'attend', label: t('action.attend'), icon: <Calendar size={16} />, value: props.actionAttend })

  if (actions.length === 0) return null

  return (
    <div className="flex flex-wrap gap-3">
      {actions.map(function (action) {
        let href = action.value
        if (action.key === 'call' && !href.startsWith('tel:')) {
          href = 'tel:' + href.replace(/[^\d+]/g, '')
        }
        const isExternal = href.startsWith('http') || href.startsWith('tel:')
        return (
          <Link
            key={action.key}
            href={href}
            target={isExternal ? '_blank' : undefined}
            rel={isExternal ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-accent hover:opacity-90 transition-opacity"
          >
            {action.icon}
            {action.label}
          </Link>
        )
      })}
    </div>
  )
}
