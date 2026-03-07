'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Phone, Clock, FileText, Check, X, MapPin, Info,
  ExternalLink, Share2, Copy, ChevronRight, AlertCircle,
  Users, PenLine
} from 'lucide-react'
import { SpiralTracker } from '@/components/exchange/SpiralTracker'

// ── Campaign Data ──

interface Campaign {
  title: string
  status: string
  urgent: boolean
  passesLabel: string
  failsLabel: string
  summary: string
  passes: string[]
  fails: string[]
  faq: { q: string; a: string }[]
  callout: string
  script: {
    intro: string
    options: { id: string; label: string; text: string }[]
    outro: string
  }
  link: string
}

const CAMPAIGNS: Record<string, Campaign> = {
  'dhs-funding': {
    title: 'DHS Funding \u2014 Still Unresolved',
    status: 'Ongoing',
    urgent: true,
    passesLabel: 'If a deal passes',
    failsLabel: 'If deadlock continues',
    summary: 'The Department of Homeland Security funding deadline passed February 13th without a deal. DHS is technically in a partial shutdown but continuing operations on funds from last year\u2019s reconciliation bill \u2014 a temporary fix that won\u2019t last. The sticking point: Democrats want accountability measures like body cameras and ID badges for immigration enforcement agents before signing off on new funding. A standalone DHS bill is urgently needed.',
    passes: [
      'TSA, Border Patrol, Coast Guard, and FEMA receive clear, stable funding',
      'Accountability measures added for immigration enforcement agents',
      'Federal workers get paycheck certainty \u2014 no more legal limbo',
      'Airport operations and border services stabilized with oversight',
    ],
    fails: [
      'DHS continues operating in legal limbo on borrowed funds',
      'No accountability requirements for enforcement agents',
      'Federal workers face ongoing pay and job uncertainty',
      'Next funding crisis likely by late March without action',
    ],
    faq: [
      { q: 'I\u2019m flying soon \u2014 should I worry?', a: 'TSA agents are currently working. But without stable funding, any escalation could lead to staffing strain and longer security lines. The situation is fragile.' },
      { q: 'I live near the border \u2014 what does this mean for me?', a: 'Border Patrol is operational, but accountability questions remain unresolved. Some versions of a deal add body cameras and ID badge requirements for agents.' },
      { q: 'I work for DHS \u2014 am I at risk?', a: 'Right now DHS is funded through reconciliation bill carryover, but that has limits. Without a proper appropriations bill, your funding situation remains uncertain.' },
    ],
    callout: 'DHS is technically open but without legitimate funding authority. Every week without a deal increases risk of real disruption.',
    script: {
      intro: 'Hi, my name is [YOUR NAME] and I\u2019m calling from [ZIP].\n\nI\u2019m calling about the DHS funding impasse \u2014 the February 13th deadline passed without a deal.',
      options: [
        { id: 'deal', label: 'I want a deal that passes DHS funding...', text: 'with accountability measures included. Body cameras and ID badges for enforcement agents are reasonable transparency measures.' },
        { id: 'cleanfund', label: 'I want a clean DHS funding bill...', text: 'passed without conditions. These workers need certainty and the country needs functioning border and homeland security agencies.' },
        { id: 'oversight', label: 'I support funding with strong oversight...', text: 'Congress should pass DHS appropriations and use the regular oversight process to address accountability \u2014 not hold workers hostage.' },
      ],
      outro: 'When does the Senator expect a resolution on DHS funding?\n\nThank you for your time.',
    },
    link: 'https://www.govtrack.us',
  },
  'aca-premiums': {
    title: 'ACA Premium Spikes \u2014 20M People Affected',
    status: 'Urgent',
    urgent: true,
    passesLabel: 'If credits restored',
    failsLabel: 'If nothing changes',
    summary: 'Enhanced premium tax credits that helped 20 million people afford health insurance expired January 1, 2026. The One Big Beautiful Bill Act did not extend them. Average marketplace premiums have jumped hundreds of dollars per month overnight. Gig workers, small business owners, early retirees, and people between jobs are hardest hit.',
    passes: [
      '20 million people see premiums return to affordable levels',
      '3\u20134 million people who dropped coverage can re-enroll',
      'Small business owners and self-employed keep access to coverage',
      'Rural areas, where marketplace is often the only option, stabilized',
    ],
    fails: [
      'Premiums stay elevated \u2014 hundreds more per month for millions',
      'An estimated 3\u20134 million people go uninsured in 2026',
      'Younger, healthier people exit the market, driving premiums higher for everyone',
      'Emergency rooms absorb uncompensated care as uninsured seek care',
    ],
    faq: [
      { q: 'My monthly premium jumped \u2014 what happened?', a: 'Enhanced premium tax credits that reduced your monthly cost expired January 1, 2026. The reconciliation bill didn\u2019t extend them. Your insurer is now charging the unsubsidized rate.' },
      { q: 'I\u2019m self-employed \u2014 how does this affect me?', a: 'Self-employed people rely on the ACA marketplace heavily. Your premium increase is real and likely significant. A restoration bill would help immediately.' },
      { q: 'Can I still enroll in coverage?', a: 'The special enrollment period may be available in your state if you had a qualifying life event. Check healthcare.gov or your state\u2019s marketplace for options.' },
    ],
    callout: 'Enhanced credits lapsed on January 1, 2026. 20 million people saw premium increases the next billing cycle \u2014 many without warning.',
    script: {
      intro: 'Hi, my name is [YOUR NAME] and I\u2019m calling from [ZIP].\n\nI\u2019m calling about ACA marketplace premium spikes since the enhanced tax credits expired on January 1st.',
      options: [
        { id: 'restore', label: 'I want the enhanced premium credits restored...', text: '20 million people lost affordable coverage overnight. Congress should pass a standalone bill to fix this.' },
        { id: 'longterm', label: 'I want a permanent solution...', text: 'Stop the annual uncertainty. Make the enhanced credits permanent so people can plan.' },
        { id: 'support', label: 'I know someone personally affected...', text: 'My constituent in [STATE] is facing a [hundreds of dollars] monthly increase they cannot afford. This is a real crisis for real families.' },
      ],
      outro: 'Is the Senator working on restoring ACA premium tax credits?\n\nThank you.',
    },
    link: 'https://www.healthcare.gov',
  },
  'medicaid-rollout': {
    title: 'Medicaid Work Requirements \u2014 Taking Effect Now',
    status: 'Active',
    urgent: false,
    passesLabel: 'With protective rules',
    failsLabel: 'With strict implementation',
    summary: 'The One Big Beautiful Bill, signed July 4, 2025, requires adults 19\u201364 on Medicaid to prove 80 hours of work per month to keep coverage. CMS and states are writing the rules right now. The CBO estimates 11.8 million people are at risk \u2014 but most losses will be due to paperwork failures, not because people stopped working.',
    passes: [
      'Exemptions for caregivers, people with health conditions, and rural workers honored fully',
      'Simple documentation process \u2014 phone or online, no barriers',
      'People who miss a report get a grace period, not immediate termination',
      'Work requirement waivers available in high-unemployment counties',
    ],
    fails: [
      '11.8 million people lose coverage \u2014 CBO\u2019s central estimate',
      'Most losses from paperwork gaps, not actual ineligibility',
      'Rural hospitals already struggling lose more uninsured patients',
      'People cycle on and off coverage, losing continuity of care',
    ],
    faq: [
      { q: 'I\u2019m on Medicaid and I work \u2014 do I need to do anything?', a: 'Yes. Starting this year, you\u2019ll need to document 80 hours of work, job training, or community service per month. The documentation process varies by state.' },
      { q: 'I work irregular hours \u2014 could I lose coverage in a slow month?', a: 'Yes, under strict implementation. Senators can push CMS to require states to average work hours over a quarter rather than monthly.' },
      { q: 'My relative is a stay-at-home caregiver \u2014 are they exempt?', a: 'Caregiving should count as a qualifying activity under the law, but the rules on what counts are being written now.' },
    ],
    callout: 'The difference between 3 million people losing coverage and 11.8 million depends largely on how CMS implements these requirements.',
    script: {
      intro: 'Hi, my name is [YOUR NAME] and I\u2019m calling from [ZIP].\n\nI\u2019m calling about Medicaid work requirement implementation \u2014 CMS is writing the rules right now.',
      options: [
        { id: 'protect', label: 'I want the Senator to push for protective implementation...', text: 'Broad caregiver exemptions, quarterly averaging of work hours, and simple documentation \u2014 these rules could prevent millions of people from losing coverage on a technicality.' },
        { id: 'oversight', label: 'I want Congress to oversee CMS implementation closely...', text: 'Congress passed this law. Senators should hold oversight hearings and ensure CMS isn\u2019t implementing it in a way that harms working families.' },
        { id: 'repeal', label: 'I want the work requirements reconsidered entirely...', text: 'Most people on Medicaid who can work already do. These requirements create bureaucratic harm without improving employment outcomes.' },
      ],
      outro: 'What is the Senator doing to ensure Medicaid work requirements are implemented fairly?\n\nThank you.',
    },
    link: 'https://www.medicaid.gov',
  },
  'snap-changes': {
    title: 'SNAP Changes \u2014 New Rules Rolling Out',
    status: 'Active',
    urgent: false,
    passesLabel: 'With waivers & protections',
    failsLabel: 'With strict rollout',
    summary: 'New SNAP rules from the One Big Beautiful Bill are rolling out in 2026. Adults 55\u201364 now face work documentation requirements. The formula used to set benefit levels has been rewritten, effectively lowering amounts for millions of families. States must implement by October 1, 2026.',
    passes: [
      'High-unemployment area waivers protect workers in tough labor markets',
      'Documentation process simplified \u2014 no in-person trips required',
      'Benefits protected for seniors with irregular or seasonal work',
      'Food banks get relief as emergency assistance demand stabilizes',
    ],
    fails: [
      '4 million+ adults 55\u201364 face new monthly documentation burdens',
      'Benefit formula changes reduce food budgets for millions of families',
      'Food banks \u2014 already reporting 60\u201370% higher demand \u2014 face even more pressure',
      'Low-income rural households in areas with few jobs lose benefits',
    ],
    faq: [
      { q: 'I\u2019m 58 and on SNAP \u2014 what changes for me?', a: 'You\u2019ll now need to document 80 hours of work, job training, or community service per month. If you\u2019re in a high-unemployment county, a waiver may exempt you.' },
      { q: 'My benefits seem lower \u2014 is that the new formula?', a: 'Possibly. The law redefined the Thrifty Food Plan reference family, which is used to calculate all benefit levels.' },
      { q: 'I donate to a food bank \u2014 should I expect more need?', a: 'Yes. Food banks are already stretched thin. The combination of higher food prices and reduced SNAP benefits is hitting communities hard.' },
    ],
    callout: 'States must implement these changes by October 2026. The USDA is still issuing guidance. Senators can shape how protective that guidance is.',
    script: {
      intro: 'Hi, my name is [YOUR NAME] and I\u2019m calling from [ZIP].\n\nI\u2019m calling about SNAP changes rolling out under the reconciliation bill \u2014 specifically rules affecting adults 55\u201364.',
      options: [
        { id: 'waivers', label: 'I want the Senator to push USDA for work requirement waivers...', text: 'Adults 55\u201364 in high-unemployment areas should get automatic waivers.' },
        { id: 'simplify', label: 'I want simplified documentation requirements...', text: 'People who have unpredictable work schedules shouldn\u2019t have to choose between a job and keeping food assistance.' },
        { id: 'protect', label: 'I want the Senator to protect SNAP overall...', text: 'Food costs are 29% higher than 2020. We shouldn\u2019t be cutting food assistance when families already can\u2019t afford groceries.' },
      ],
      outro: 'What is the Senator doing to ensure SNAP changes don\u2019t leave working families hungry?\n\nThank you.',
    },
    link: 'https://www.fns.usda.gov/snap',
  },
  'ssa-cuts': {
    title: 'Social Security Administration \u2014 Staffing Crisis',
    status: 'Ongoing',
    urgent: true,
    passesLabel: 'If Congress restores funding',
    failsLabel: 'If cuts continue',
    summary: 'DOGE eliminated over 7,000 SSA employees in 2025, reducing the workforce to its lowest level since the 1960s \u2014 even as the population of Social Security recipients has doubled. The SSA is projecting processing delays of six months or more for disability claims and new retirement enrollments.',
    passes: [
      'Processing times return to normal \u2014 weeks, not months',
      'Field offices stay open in rural and lower-income communities',
      '70 million beneficiaries get accurate, timely service',
      'Disability and survivor claim backlogs cleared',
    ],
    fails: [
      'Disability claim decisions take 12+ months \u2014 people go without income',
      'Retirees face months-long delays for first benefit checks',
      'Rural field offices close, leaving seniors with no local support',
      'Error rates rise as remaining staff are overwhelmed',
    ],
    faq: [
      { q: 'I\u2019m applying for Social Security this year \u2014 will there be delays?', a: 'Yes. The SSA is warning of multi-month delays for new enrollments. Apply as early as possible and document everything.' },
      { q: 'My disability claim has been waiting for months \u2014 is that normal now?', a: 'Unfortunately yes, and it\u2019s getting worse. Senators have constituent services offices that can sometimes help expedite federal agency responses.' },
      { q: 'My local SSA office closed \u2014 what do I do?', a: 'You can access many services at SSA.gov or call 1-800-772-1213. For complex issues, contact your Senator\u2019s office.' },
    ],
    callout: '70 million Americans depend on Social Security. Cutting the staff who run it \u2014 without reducing the workload \u2014 is a choice with real consequences for real people.',
    script: {
      intro: 'Hi, my name is [YOUR NAME] and I\u2019m calling from [ZIP].\n\nI\u2019m calling about staffing cuts at the Social Security Administration and the impact on benefits processing.',
      options: [
        { id: 'restore', label: 'I want the Senator to restore SSA staffing funding...', text: '70 million people depend on Social Security. Cutting the staff who run it creates real delays for retirees, disabled people, and survivors.' },
        { id: 'oversight', label: 'I want the Senator to hold oversight hearings on SSA...', text: 'Congress should demand answers from SSA leadership about projected delays and office closures.' },
        { id: 'constituent', label: 'I know someone personally struggling with SSA delays...', text: 'A constituent in [STATE] has been waiting [X months] for a disability determination. These are not statistics \u2014 these are people without income.' },
      ],
      outro: 'What is the Senator doing to restore Social Security Administration staffing and reduce delays?\n\nThank you.',
    },
    link: 'https://www.ssa.gov',
  },
}

// ── Senator Data ──

const SENATORS: Record<string, { n: string; ph: string }[]> = {"AL":[{n:"Katie Britt",ph:"2022245744"},{n:"Tommy Tuberville",ph:"2022244124"}],"AK":[{n:"Lisa Murkowski",ph:"2022246665"},{n:"Dan Sullivan",ph:"2022243004"}],"AZ":[{n:"Ruben Gallego",ph:"2022242235"},{n:"Mark Kelly",ph:"2022242235"}],"AR":[{n:"John Boozman",ph:"2022244843"},{n:"Tom Cotton",ph:"2022242353"}],"CA":[{n:"Adam Schiff",ph:"2022243553"},{n:"Alex Padilla",ph:"2022243553"}],"CO":[{n:"Michael Bennet",ph:"2022245852"},{n:"John Hickenlooper",ph:"2022245941"}],"CT":[{n:"Richard Blumenthal",ph:"2022242823"},{n:"Chris Murphy",ph:"2022244041"}],"DE":[{n:"Tom Carper",ph:"2022242441"},{n:"Chris Coons",ph:"2022245042"}],"FL":[{n:"Rick Scott",ph:"2022245274"},{n:"Ashley Moody",ph:"2022243041"}],"GA":[{n:"Jon Ossoff",ph:"2022243521"},{n:"Raphael Warnock",ph:"2022243643"}],"HI":[{n:"Mazie Hirono",ph:"2022246361"},{n:"Brian Schatz",ph:"2022243934"}],"ID":[{n:"Mike Crapo",ph:"2022246142"},{n:"Jim Risch",ph:"2022242752"}],"IL":[{n:"Tammy Duckworth",ph:"2022242854"},{n:"Dick Durbin",ph:"2022242152"}],"IN":[{n:"Jim Banks",ph:"2022245623"},{n:"Todd Young",ph:"2022245623"}],"IA":[{n:"Joni Ernst",ph:"2022243254"},{n:"Chuck Grassley",ph:"2022243744"}],"KS":[{n:"Jerry Moran",ph:"2022246521"},{n:"Roger Marshall",ph:"2022244774"}],"KY":[{n:"Mitch McConnell",ph:"2022242541"},{n:"Rand Paul",ph:"2022244343"}],"LA":[{n:"Bill Cassidy",ph:"2022245824"},{n:"John Kennedy",ph:"2022244623"}],"ME":[{n:"Susan Collins",ph:"2022242523"},{n:"Angus King",ph:"2022245344"}],"MD":[{n:"Angela Alsobrooks",ph:"2022244654"},{n:"Chris Van Hollen",ph:"2022244654"}],"MA":[{n:"Ed Markey",ph:"2022242742"},{n:"Elizabeth Warren",ph:"2022244543"}],"MI":[{n:"Elissa Slotkin",ph:"2022246221"},{n:"Gary Peters",ph:"2022246221"}],"MN":[{n:"Amy Klobuchar",ph:"2022243244"},{n:"Tina Smith",ph:"2022245641"}],"MS":[{n:"Roger Wicker",ph:"2022246253"},{n:"Cindy Hyde-Smith",ph:"2022245054"}],"MO":[{n:"Josh Hawley",ph:"2022246154"},{n:"Eric Schmitt",ph:"2022245721"}],"MT":[{n:"Steve Daines",ph:"2022242651"},{n:"Tim Sheehy",ph:"2022242644"}],"NE":[{n:"Deb Fischer",ph:"2022246551"},{n:"Pete Ricketts",ph:"2022244224"}],"NV":[{n:"Catherine Cortez Masto",ph:"2022243542"},{n:"Jacky Rosen",ph:"2022246244"}],"NH":[{n:"Maggie Hassan",ph:"2022243324"},{n:"Jeanne Shaheen",ph:"2022242841"}],"NJ":[{n:"Andy Kim",ph:"2022243224"},{n:"Cory Booker",ph:"2022243224"}],"NM":[{n:"Martin Heinrich",ph:"2022245521"},{n:"Ben Ray Lujan",ph:"2022246621"}],"NY":[{n:"Kirsten Gillibrand",ph:"2022244451"},{n:"Chuck Schumer",ph:"2022246542"}],"NC":[{n:"Ted Budd",ph:"2022243154"},{n:"Thom Tillis",ph:"2022246342"}],"ND":[{n:"Kevin Cramer",ph:"2022242043"},{n:"John Hoeven",ph:"2022242551"}],"OH":[{n:"Bernie Moreno",ph:"2022242315"},{n:"JD Vance",ph:"2022243353"}],"OK":[{n:"James Lankford",ph:"2022245754"},{n:"Markwayne Mullin",ph:"2022244721"}],"OR":[{n:"Jeff Merkley",ph:"2022243753"},{n:"Ron Wyden",ph:"2022245244"}],"PA":[{n:"John Fetterman",ph:"2022244254"},{n:"Dave McCormick",ph:"2022246324"}],"RI":[{n:"Sheldon Whitehouse",ph:"2022242921"},{n:"Jack Reed",ph:"2022244642"}],"SC":[{n:"Lindsey Graham",ph:"2022245972"},{n:"Tim Scott",ph:"2022246121"}],"SD":[{n:"Mike Rounds",ph:"2022245842"},{n:"John Thune",ph:"2022242321"}],"TN":[{n:"Marsha Blackburn",ph:"2022243344"},{n:"Bill Hagerty",ph:"2022244944"}],"TX":[{n:"John Cornyn",ph:"2022242934"},{n:"Ted Cruz",ph:"2022245922"}],"UT":[{n:"Mike Lee",ph:"2022245444"},{n:"John Curtis",ph:"2022245251"}],"VT":[{n:"Peter Welch",ph:"2022244242"},{n:"Bernie Sanders",ph:"2022245141"}],"VA":[{n:"Tim Kaine",ph:"2022244024"},{n:"Mark Warner",ph:"2022242023"}],"WA":[{n:"Maria Cantwell",ph:"2022243441"},{n:"Patty Murray",ph:"2022242621"}],"WV":[{n:"Shelley Moore Capito",ph:"2022246472"},{n:"Jim Justice",ph:"2022243954"}],"WI":[{n:"Tammy Baldwin",ph:"2022245653"},{n:"Ron Johnson",ph:"2022245323"}],"WY":[{n:"Cynthia Lummis",ph:"2022243424"},{n:"John Barrasso",ph:"2022246441"}]}

const ZIP_TO_STATE: Record<string, string> = {'00':'NJ','01':'NJ','02':'NJ','03':'NJ','04':'NJ','05':'NY','06':'PR','07':'NJ','08':'NJ','09':'NJ','10':'NY','11':'NY','12':'NY','13':'NY','14':'NY','15':'PA','16':'PA','17':'PA','18':'PA','19':'PA','20':'DC','21':'VA','22':'VA','23':'VA','24':'VA','25':'WV','26':'WV','27':'NC','28':'NC','29':'SC','30':'GA','31':'GA','32':'FL','33':'FL','34':'FL','35':'AL','36':'AL','37':'TN','38':'TN','39':'MS','40':'KY','41':'KY','42':'KY','43':'OH','44':'OH','45':'OH','46':'IN','47':'IN','48':'MI','49':'MI','50':'IA','51':'IA','52':'IA','53':'WI','54':'WI','55':'MN','56':'MN','57':'SD','58':'ND','59':'MT','60':'IL','61':'IL','62':'IL','63':'MO','64':'MO','65':'MO','66':'KS','67':'KS','68':'NE','69':'NE','70':'LA','71':'LA','72':'AR','73':'OK','74':'OK','75':'TX','76':'TX','77':'TX','78':'TX','79':'TX','80':'CO','81':'CO','82':'WY','83':'ID','84':'UT','85':'AZ','86':'AZ','87':'NM','88':'NM','89':'NV','90':'CA','91':'CA','92':'CA','93':'CA','94':'CA','95':'CA','96':'CA','97':'OR','98':'WA','99':'AK'}

const STATE_NAMES: Record<string, string> = {AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'}

function formatPhone(ph: string) {
  return '(' + ph.slice(0, 3) + ') ' + ph.slice(3, 6) + '-' + ph.slice(6)
}

// ── Component ──

export function SenatorToolClient() {
  const [campaignId, setCampaignId] = useState('dhs-funding')
  const [zip, setZip] = useState('')
  const [stateCode, setStateCode] = useState('')
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [calledSenators, setCalledSenators] = useState<string[]>([])
  const [logSenator, setLogSenator] = useState('')
  const [logOutcome, setLogOutcome] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [callCount, setCallCount] = useState(1204)
  const [copied, setCopied] = useState(false)
  const [step, setStep] = useState(1)

  const campaign = CAMPAIGNS[campaignId]
  const senators = stateCode && SENATORS[stateCode] ? SENATORS[stateCode] : []
  const uncalledSenators = senators.filter(function (s) { return !calledSenators.includes(s.n) })

  // Fetch live call count
  useEffect(function () {
    fetch('https://script.google.com/macros/s/AKfycby-t9c7sA2kne0bzFlJ_UfTmS53WABZ1y_KsFxoX-woMyyFEnl-etTeoIdjO4n_O0iZ/exec')
      .then(function (r) { return r.json() })
      .then(function (d) { if (d.count) setCallCount(d.count + 1198) })
      .catch(function () {})
  }, [])

  // Auto-detect state from ZIP
  useEffect(function () {
    if (zip.length >= 2) {
      const detected = ZIP_TO_STATE[zip.substring(0, 2)]
      if (detected && SENATORS[detected]) {
        setStateCode(detected)
        setStep(2)
      }
    }
  }, [zip])

  const handleStateChange = useCallback(function (val: string) {
    setStateCode(val)
    if (val && SENATORS[val]) setStep(2)
  }, [])

  function handleLogCall() {
    if (!logSenator) return
    setCalledSenators(function (prev) { return [...prev, logSenator] })
    setShowSuccess(true)
    setCallCount(function (c) { return c + 1 })
    setStep(3)
  }

  function handleCallNext() {
    setShowSuccess(false)
    setLogSenator('')
    setLogOutcome('')
    setStep(2)
  }

  function handleShare() {
    const text = 'I just called my senators about ' + campaign.title + '. You can too: changeengine.us/call-your-senators'
    if (navigator.share) {
      navigator.share({ text: text })
    } else {
      navigator.clipboard.writeText(text)
      alert('Copied to clipboard!')
    }
  }

  function getScript() {
    let intro = campaign.script.intro
    if (zip) intro = intro.replace('[ZIP]', zip)
    let text = intro + '\n\n'
    if (selectedOption) {
      const opt = campaign.script.options.find(function (o) { return o.id === selectedOption })
      if (opt) text += '"' + opt.label + '" ' + opt.text + '\n\n'
    } else {
      text += '[Pick one:]\n'
      campaign.script.options.forEach(function (o) { text += '\u2022 "' + o.label + '" ' + o.text + '\n' })
      text += '\n'
    }
    text += campaign.script.outro
    return text
  }

  function handleCopyScript() {
    navigator.clipboard.writeText(getScript().replace('[YOUR NAME]', '___'))
    setCopied(true)
    setTimeout(function () { setCopied(false) }, 2000)
  }

  const campaignKeys = useMemo(function () { return Object.keys(CAMPAIGNS) }, [])

  return (
    <div className="bg-white">
      <SpiralTracker action="call_senator" />
      {/* ── Urgent Banner ── */}
      <div className="flex items-center justify-center gap-3 w-full py-4 px-6 bg-brand-bg-alt border-b border-brand-border text-brand-text text-sm font-medium text-center">
        <AlertCircle size={16} className="text-brand-accent flex-shrink-0" />
        <span>
          <strong className="text-brand-accent">{campaign.status}</strong> &mdash; {campaign.title}
        </span>
      </div>

      {/* ── Hero ── */}
      <section className="max-w-[800px] mx-auto px-8 pt-16 pb-12 text-center border-b-2 border-brand-border">
        <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-5">Most people think their voice doesn&apos;t matter. Most people are wrong.</p>
        <h1 className="font-serif text-[clamp(2.5rem,5vw,3.5rem)] leading-[1.1] text-brand-text mb-5">
          Call your senators. <span className="text-brand-accent">It works.</span>
        </h1>
        <p className="text-lg leading-relaxed text-brand-muted max-w-[560px] mx-auto mb-8">
          Two minutes. One call. Your senators have staff whose only job is to count opinions like yours.
        </p>
        <p className="text-base leading-relaxed text-brand-muted max-w-[560px] mx-auto mb-8">
          You don&apos;t need a speech. You don&apos;t need to be an expert. You just need to say what you think and where you live.
          <br /><br />
          That&apos;s it. That&apos;s the whole thing.
        </p>
        <div className="flex justify-center flex-wrap gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-text bg-brand-bg px-5 py-3 border-2 border-brand-border rounded-lg">
            <Clock size={14} className="text-brand-muted" /> 90 seconds average
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-text bg-brand-bg px-5 py-3 border-2 border-brand-border rounded-lg">
            <FileText size={14} className="text-brand-muted" /> Script provided
          </span>
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-text bg-brand-bg px-5 py-3 border-2 border-brand-border rounded-lg">
            <Check size={14} className="text-brand-muted" /> No experience needed
          </span>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="flex justify-center items-center gap-16 sm:gap-24 py-12 px-8 bg-brand-bg border-b-2 border-brand-border">
        <div className="text-center">
          <span className="block text-5xl sm:text-6xl font-black text-brand-text leading-none tracking-tight">{callCount.toLocaleString()}</span>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-widest text-brand-muted-light mt-3">Calls Made</span>
        </div>
        <div className="text-center">
          <span className="block text-5xl sm:text-6xl font-black text-brand-accent leading-none tracking-tight">{campaignKeys.length}</span>
          <span className="block font-mono text-[11px] font-bold uppercase tracking-widest text-brand-muted-light mt-3">Issues Active</span>
        </div>
      </section>

      {/* ── Progress Steps ── */}
      <div className="flex justify-center items-center gap-0 py-5 px-8 border-b-2 border-brand-border">
        {[{ num: 1, label: 'Find Senators' }, { num: 2, label: 'Make Call' }, { num: 3, label: 'Log It' }].map(function (s, i) {
          const isActive = step === s.num
          const isDone = step > s.num
          return (
            <div key={s.num} className="flex items-center gap-0">
              {i > 0 && <div className="w-10 sm:w-16 h-[3px] rounded-sm bg-brand-border mx-1" />}
              <div className="flex items-center gap-2 px-3">
                <span className={'w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ' + (isActive || isDone ? 'bg-brand-text text-white' : 'bg-brand-border text-brand-muted')}>
                  {isDone ? <Check size={16} /> : s.num}
                </span>
                <span className={'text-sm font-semibold hidden sm:block ' + (isActive ? 'text-brand-text' : isDone ? 'text-brand-muted' : 'text-brand-muted-light')}>
                  {s.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Main 2-Column Layout ── */}
      <main className="grid grid-cols-1 lg:grid-cols-[1fr_440px]">
        {/* Left: Content */}
        <article className="p-8 sm:p-12 lg:border-r-2 border-brand-border">
          <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-accent mb-3">What Congress Is Deciding</p>
          <h2 className="font-serif text-2xl sm:text-3xl text-brand-text mb-5">{campaign.title}</h2>
          <p className="text-base leading-relaxed text-brand-muted mb-5">{campaign.summary}</p>
          <a href={campaign.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-brand-text hover:underline">
            Follow this vote <ExternalLink size={14} />
          </a>

          {/* Impact Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 my-10">
            <div className="border-2 border-brand-border rounded-lg overflow-hidden" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
              <div className="h-1.5 bg-brand-text" />
              <div className="p-6">
                <h3 className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-brand-text mb-5">
                  <Check size={14} /> {campaign.passesLabel}
                </h3>
                <ul className="space-y-0">
                  {campaign.passes.map(function (item, i) {
                    return (
                      <li key={i} className="flex items-start gap-3 py-3 border-b border-brand-border last:border-b-0 text-sm leading-relaxed text-brand-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-text flex-shrink-0 mt-2" />
                        {item}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
            <div className="border-2 border-brand-border rounded-lg overflow-hidden" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
              <div className="h-1.5 bg-brand-muted-light" />
              <div className="p-6">
                <h3 className="flex items-center gap-2 font-mono text-[11px] font-bold uppercase tracking-wider text-brand-muted mb-5">
                  <X size={14} /> {campaign.failsLabel}
                </h3>
                <ul className="space-y-0">
                  {campaign.fails.map(function (item, i) {
                    return (
                      <li key={i} className="flex items-start gap-3 py-3 border-b border-brand-border last:border-b-0 text-sm leading-relaxed text-brand-muted">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-muted-light flex-shrink-0 mt-2" />
                        {item}
                      </li>
                    )
                  })}
                </ul>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="border-2 border-brand-border rounded-lg p-7 mb-8" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
            <h3 className="flex items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-wider text-brand-text mb-6">
              <Users size={18} /> Who&apos;s Affected &amp; How
            </h3>
            {campaign.faq.map(function (item, i) {
              return (
                <div key={i} className="py-5 border-b border-brand-border last:border-b-0">
                  <p className="font-serif text-base font-bold text-brand-text mb-2">{item.q}</p>
                  <p className="text-sm leading-relaxed text-brand-muted">{item.a}</p>
                </div>
              )
            })}
          </div>

          {/* Callout */}
          <div className="border-l-4 border-brand-text bg-brand-bg rounded-r-lg px-6 py-5 mb-8">
            <p className="text-sm leading-relaxed text-brand-muted">
              <strong className="text-brand-text">Bottom line:</strong> {campaign.callout}
            </p>
          </div>

          {/* Other Issues */}
          <div className="border-2 border-brand-border rounded-lg p-7" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest text-brand-muted-light mb-5">Other Issues You Can Call About</h3>
            <div className="space-y-3">
              {campaignKeys.map(function (key) {
                const c = CAMPAIGNS[key]
                const isActive = key === campaignId
                return (
                  <button
                    key={key}
                    onClick={function () { setCampaignId(key); setSelectedOption(null) }}
                    className={'flex items-center gap-4 w-full text-left px-4 py-4 border-2 rounded-lg transition-colors ' + (isActive ? 'border-brand-text bg-white' : 'border-brand-border bg-white hover:border-brand-muted') + (c.urgent ? ' border-l-[5px] border-l-brand-accent' : '')}
                  >
                    <span className={'font-mono text-[11px] font-bold min-w-[60px] ' + (c.urgent ? 'text-brand-accent' : 'text-brand-muted-light')}>{c.status}</span>
                    <span className="flex-1 text-sm font-semibold text-brand-text">{c.title}</span>
                    <ChevronRight size={14} className={isActive ? 'text-brand-text' : 'text-brand-muted-light'} />
                  </button>
                )
              })}
            </div>
          </div>
        </article>

        {/* Right: Action Panel */}
        <aside className="p-8 sm:p-10 bg-brand-bg">
          {/* Find Your Senators */}
          <div className="bg-white border-2 border-brand-border rounded-xl p-7 mb-6" style={{ boxShadow: '3px 3px 0 #D5D0C8' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-brand-bg flex items-center justify-center">
                <MapPin size={22} className="text-brand-text" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-brand-text">Find My Senators</h3>
                <p className="text-sm text-brand-muted">Enter your zip to get started</p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">Your Zip Code</label>
              <input
                type="text"
                value={zip}
                onChange={function (e) { setZip(e.target.value.replace(/\D/g, '').slice(0, 5)) }}
                placeholder="e.g. 77001"
                maxLength={5}
                className="w-full px-4 py-3.5 border-2 border-brand-border rounded-lg text-base text-brand-text focus:border-brand-text focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">State</label>
              <select
                value={stateCode}
                onChange={function (e) { handleStateChange(e.target.value) }}
                className="w-full px-4 py-3.5 border-2 border-brand-border rounded-lg text-base text-brand-text focus:border-brand-text focus:outline-none bg-white appearance-none"
              >
                <option value="">Select your state...</option>
                {Object.keys(SENATORS).sort().map(function (s) {
                  return <option key={s} value={s}>{STATE_NAMES[s] || s}</option>
                })}
              </select>
            </div>

            {/* Senator Cards */}
            {senators.map(function (s) {
              const called = calledSenators.includes(s.n)
              return (
                <div key={s.n} className={'flex items-center justify-between flex-wrap gap-3 rounded-lg px-5 py-4 mt-3 border-2 ' + (called ? 'bg-brand-bg border-brand-border' : 'bg-white border-brand-border')}>
                  <div>
                    <p className="text-base font-bold text-brand-text">{s.n}</p>
                    <p className="text-sm text-brand-muted tabular-nums">{formatPhone(s.ph)}</p>
                  </div>
                  {called ? (
                    <span className="inline-flex items-center gap-2 bg-brand-border text-brand-muted text-sm font-semibold px-5 py-3 rounded-lg">
                      <Check size={16} /> Called
                    </span>
                  ) : (
                    <a
                      href={'tel:' + s.ph}
                      className="inline-flex items-center gap-2 bg-brand-accent text-white text-sm font-bold px-6 py-3 rounded-lg hover:-translate-y-0.5 transition-transform"
                      style={{ boxShadow: '0 4px 12px rgba(199,91,42,0.3)' }}
                    >
                      <Phone size={16} /> Call Now
                    </a>
                  )}
                </div>
              )
            })}
          </div>

          {/* What to Expect */}
          {senators.length > 0 && (
            <div className="bg-white border-2 border-brand-border rounded-xl p-7 mb-6" style={{ boxShadow: '2px 2px 0 #D1D5E0' }}>
              <div className="bg-brand-bg rounded-lg p-5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-brand-text mb-2">
                  <Info size={14} className="text-brand-muted" /> What to Expect
                </h4>
                <p className="text-sm leading-relaxed text-brand-muted">
                  A staffer answers (not the Senator). They&apos;re used to calls like this. Just read the script &mdash; takes about 90 seconds. If voicemail, leave the same message.
                </p>
              </div>
            </div>
          )}

          {/* Call Script */}
          <div className="bg-brand-bg-alt border-2 border-brand-border rounded-xl p-7 mb-6" style={{ boxShadow: '3px 3px 0 #E2DDD5' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-brand-accent/10 flex items-center justify-center">
                <Phone size={22} className="text-brand-accent" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-brand-text">Your Call Script</h3>
                <p className="text-sm text-brand-muted">Tap to select your position</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-5 text-brand-text text-sm leading-relaxed whitespace-pre-line mb-4 border-2 border-brand-border">
              {campaign.script.intro.replace('[ZIP]', zip || '[ZIP]')}

              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted-light mt-5 mb-3">Pick the one closest to your view:</p>

              {campaign.script.options.map(function (opt) {
                const isSelected = selectedOption === opt.id
                return (
                  <button
                    key={opt.id}
                    onClick={function () { setSelectedOption(opt.id) }}
                    className={'block w-full text-left rounded-lg px-5 py-4 mb-3 border-2 transition-colors ' + (isSelected ? 'border-brand-accent bg-brand-accent/10' : 'border-brand-border bg-white hover:bg-brand-bg')}
                  >
                    <strong className="block text-brand-text text-sm font-bold mb-1">&ldquo;{opt.label}&rdquo;</strong>
                    <span className="text-brand-muted text-sm">{opt.text}</span>
                  </button>
                )
              })}

              <p className="mt-4">{campaign.script.outro}</p>
            </div>

            <button
              onClick={handleCopyScript}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-brand-accent hover:bg-brand-accent-hover text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <Copy size={16} /> {copied ? 'Copied!' : 'Copy Script'}
            </button>
          </div>

          {/* Log Your Call */}
          <div className="bg-white border-2 border-brand-border rounded-xl p-7" style={{ boxShadow: '3px 3px 0 #E2DDD5' }}>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-lg bg-brand-bg flex items-center justify-center">
                <PenLine size={22} className="text-brand-text" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-brand-text">Log Your Call</h3>
                <p className="text-sm text-brand-muted">Help us track momentum</p>
              </div>
            </div>

            {showSuccess ? (
              <div className="text-center py-6">
                <div className="w-14 h-14 rounded-full bg-brand-bg flex items-center justify-center mx-auto mb-4">
                  <Check size={28} className="text-brand-text" />
                </div>
                <h4 className="font-serif text-xl text-brand-text mb-2">Call Logged</h4>
                <p className="text-sm text-brand-muted mb-6">
                  {uncalledSenators.length > 0 ? 'You have ' + uncalledSenators.length + ' more senator to call.' : 'Thank you for making your voice heard.'}
                </p>
                <div className="flex gap-3 justify-center flex-wrap">
                  {uncalledSenators.length > 0 && (
                    <button onClick={handleCallNext} className="inline-flex items-center gap-2 bg-brand-text text-white text-sm font-bold px-6 py-3 rounded-lg">
                      <Phone size={14} /> Call Other Senator
                    </button>
                  )}
                  <button onClick={handleShare} className="inline-flex items-center gap-2 bg-brand-border text-brand-text text-sm font-semibold px-6 py-3 rounded-lg">
                    <Share2 size={14} /> Share
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">Who did you call?</label>
                  <select
                    value={logSenator}
                    onChange={function (e) { setLogSenator(e.target.value) }}
                    className="w-full px-4 py-3.5 border-2 border-brand-border rounded-lg text-base text-brand-text focus:border-brand-text focus:outline-none bg-white appearance-none"
                  >
                    <option value="">Select senator...</option>
                    {uncalledSenators.map(function (s) {
                      return <option key={s.n} value={s.n}>{s.n}</option>
                    })}
                  </select>
                </div>
                <div className="mb-5">
                  <label className="block font-mono text-[10px] font-bold uppercase tracking-wider text-brand-muted mb-2">What happened?</label>
                  <select
                    value={logOutcome}
                    onChange={function (e) { setLogOutcome(e.target.value) }}
                    className="w-full px-4 py-3.5 border-2 border-brand-border rounded-lg text-base text-brand-text focus:border-brand-text focus:outline-none bg-white appearance-none"
                  >
                    <option value="">Select outcome...</option>
                    <option value="spoke">Talked to a staffer</option>
                    <option value="vm">Left a voicemail</option>
                    <option value="busy">Couldn&apos;t get through</option>
                  </select>
                </div>
                <button
                  onClick={handleLogCall}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-brand-text text-white text-base font-bold rounded-lg hover:bg-brand-accent transition-colors"
                >
                  <Check size={16} /> Log My Call
                </button>
              </>
            )}
          </div>
        </aside>
      </main>

      {/* ── Closing ── */}
      <section className="max-w-[800px] mx-auto px-8 py-12 text-center border-t-2 border-brand-border">
        <p className="font-serif text-xl text-brand-muted italic">
          Democracy doesn&apos;t run on autopilot. It runs on people like you picking up the phone.
        </p>
      </section>

      {/* ── Mobile CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-brand-border p-4 lg:hidden z-50" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}>
        <a
          href={senators.length > 0 ? 'tel:' + senators[0].ph : '#'}
          onClick={function (e) {
            if (senators.length === 0) {
              e.preventDefault()
              const el = document.getElementById('senator-find')
              if (el) el.scrollIntoView({ behavior: 'smooth' })
            }
          }}
          className="flex items-center justify-center gap-3 w-full py-4 bg-brand-accent text-white text-base font-bold rounded-lg"
          style={{ boxShadow: '0 4px 12px rgba(199,91,42,0.3)' }}
        >
          <Phone size={18} /> {senators.length > 0 ? 'Call ' + senators[0].n : 'Find My Senators'}
        </a>
      </div>

      {/* Bottom padding for mobile CTA */}
      <div className="h-20 lg:hidden" />
    </div>
  )
}
