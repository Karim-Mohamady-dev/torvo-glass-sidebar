import { useEffect, useMemo, useState } from 'react'
import {
  CalendarBlank,
  CaretLeft,
  CaretRight,
  Check,
  CheckSquare,
  Clock,
  FolderSimple,
  MagnifyingGlass,
  Plus,
  Pulse,
  SquaresFour,
  Trash,
  Users,
} from '@phosphor-icons/react'
import { detectLang, useDict, type Lang } from './i18n'

type View = 'dashboard' | 'tasks' | 'activities' | 'teams' | 'projects' | 'calendar'
type TaskItem = { id: string; key: string | null; text: string; done: boolean }
type ActivityKind = 'comment' | 'update'
type ActivityEntry = { actor: string; kind: ActivityKind; target: string; time: string }

const STATE_KEY = 'torvo-state-v1'
const LANG_KEY = 'torvo-lang'

const DEFAULT_TASKS: TaskItem[] = [
  { id: 't1', key: 'tasks.d1', text: '', done: false },
  { id: 't2', key: 'tasks.d2', text: '', done: false },
  { id: 't3', key: 'tasks.d3', text: '', done: true },
  { id: 't4', key: 'tasks.d4', text: '', done: false },
  { id: 't5', key: 'tasks.d5', text: '', done: false },
  { id: 't6', key: 'tasks.d6', text: '', done: true },
]

const ACTORS = ['Ava Chen', 'Liam Ortiz', 'Sofia Rossi', 'Noah Kim', 'Maya Patel', 'Omar Haddad', 'Elena Petrova', 'Jonas Weber']
const TARGETS = ['targetBank', 'targetBrand', 'targetDesign', 'targetSprint', 'targetOnboarding', 'targetRelease', 'targetRoadmap']
const TIMES = ['ago2h', 'ago5h', 'yesterday', 'ago2d', 'ago3d']

const ACTIVITIES: ActivityEntry[] = Array.from({ length: 23 }, (_, i) => ({
  actor: ACTORS[i % ACTORS.length],
  kind: (i % 3 === 0 ? 'comment' : 'update') as ActivityKind,
  target: TARGETS[i % TARGETS.length],
  time: TIMES[i % TIMES.length],
}))

const TEAM = [
  { name: 'Ava Chen', role: 'roleDesigner', online: true, color: '#8B5CF6' },
  { name: 'Liam Ortiz', role: 'roleDeveloper', online: true, color: '#22D3EE' },
  { name: 'Sofia Rossi', role: 'roleResearcher', online: true, color: '#F59E0B' },
  { name: 'Noah Kim', role: 'roleEngineer', online: false, color: '#34D399' },
  { name: 'Maya Patel', role: 'roleManager', online: true, color: '#F472B6' },
  { name: 'Omar Haddad', role: 'roleMarketing', online: false, color: '#A78BFA' },
]

const PROJECTS = [
  { nameKey: 'projects.nameBank', descKey: 'projects.descBank', dueKey: 'projects.dueBank', statusKey: 'projects.statusActive', progress: 68, done: 14, total: 20, color: '#8B5CF6' },
  { nameKey: 'projects.nameBrand', descKey: 'projects.descBrand', dueKey: 'projects.dueBrand', statusKey: 'projects.statusReview', progress: 42, done: 8, total: 19, color: '#22D3EE' },
  { nameKey: 'projects.nameDesign', descKey: 'projects.descDesign', dueKey: 'projects.dueDesign', statusKey: 'projects.statusActive', progress: 85, done: 17, total: 20, color: '#F59E0B' },
  { nameKey: 'projects.nameSite', descKey: 'projects.descSite', dueKey: 'projects.dueSite', statusKey: 'projects.statusPlanning', progress: 25, done: 5, total: 20, color: '#34D399' },
]

const CALENDAR_EVENTS: Record<number, string[]> = {
  2: ['events.ev2'],
  4: ['events.ev3'],
  9: ['events.ev1'],
  16: ['events.ev6'],
  18: ['events.ev4'],
  24: ['events.ev5'],
}

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

type SavedState = { collapsed: boolean; view: View; tasks: TaskItem[]; selectedDay: number }

function loadState(): SavedState {
  const fallback: SavedState = { collapsed: false, view: 'dashboard', tasks: DEFAULT_TASKS, selectedDay: 9 }
  try {
    const raw = localStorage.getItem(STATE_KEY)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as Partial<SavedState>
    return {
      collapsed: typeof parsed.collapsed === 'boolean' ? parsed.collapsed : false,
      view: parsed.view ?? 'dashboard',
      tasks: Array.isArray(parsed.tasks) && parsed.tasks.length > 0 ? parsed.tasks : DEFAULT_TASKS,
      selectedDay: typeof parsed.selectedDay === 'number' ? parsed.selectedDay : 9,
    }
  } catch {
    return fallback
  }
}

function initials(name: string) {
  return name.split(' ').map((p) => p[0]).join('').toUpperCase()
}

export default function App() {
  const [lang, setLang] = useState<Lang>(() => detectLang())
  const { t } = useDict(lang)
  const [saved, setSaved] = useState<SavedState>(() => loadState())
  const { collapsed, view, tasks, selectedDay } = saved
  const [search, setSearch] = useState('')
  const [newTask, setNewTask] = useState('')
  const [activityFilter, setActivityFilter] = useState<'all' | ActivityKind>('all')

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr'
    try {
      localStorage.setItem(LANG_KEY, lang)
    } catch {
      // storage unavailable
    }
  }, [lang])

  useEffect(() => {
    try {
      localStorage.setItem(STATE_KEY, JSON.stringify(saved))
    } catch {
      // storage unavailable
    }
  }, [saved])

  const patch = (p: Partial<SavedState>) => setSaved((s) => ({ ...s, ...p }))
  const setView = (v: View) => patch({ view: v })
  const taskText = (task: TaskItem) => (task.key ? t(task.key) : task.text)
  const remaining = tasks.filter((task) => !task.done).length
  const doneCount = tasks.length - remaining

  const q = search.trim().toLowerCase()
  const filteredTasks = tasks.filter((task) => !q || taskText(task).toLowerCase().includes(q))
  const filteredActivities = ACTIVITIES.filter((a) => {
    if (activityFilter !== 'all' && a.kind !== activityFilter) return false
    if (!q) return true
    return (a.actor + ' ' + t(`activities.${a.target}`)).toLowerCase().includes(q)
  })
  const filteredTeam = TEAM.filter((m) => !q || (m.name + ' ' + t(`teams.${m.role}`)).toLowerCase().includes(q))
  const filteredProjects = PROJECTS.filter((p) => !q || t(p.nameKey).toLowerCase().includes(q))

  const navItems: { id: View; icon: typeof SquaresFour; labelKey: string; badge?: number }[] = [
    { id: 'dashboard', icon: SquaresFour, labelKey: 'nav.dashboard' },
    { id: 'tasks', icon: CheckSquare, labelKey: 'nav.tasks' },
    { id: 'activities', icon: Pulse, labelKey: 'nav.activities', badge: 23 },
    { id: 'teams', icon: Users, labelKey: 'nav.teams' },
    { id: 'projects', icon: FolderSimple, labelKey: 'nav.projects' },
    { id: 'calendar', icon: CalendarBlank, labelKey: 'nav.calendar' },
  ]

  const addTask = () => {
    const text = newTask.trim()
    if (!text) return
    patch({ tasks: [...tasks, { id: `t-${Date.now()}`, key: null, text, done: false }] })
    setNewTask('')
  }

  const toggleTask = (id: string) =>
    patch({ tasks: tasks.map((task) => (task.id === id ? { ...task, done: !task.done } : task)) })

  const viewTitleKey: Record<View, string> = {
    dashboard: 'dashboard.title',
    tasks: 'tasks.title',
    activities: 'activities.title',
    teams: 'teams.title',
    projects: 'projects.title',
    calendar: 'calendar.title',
  }

  const glass = 'bg-white/[0.05] backdrop-blur-xl border border-white/10'
  const ease = 'cubic-bezier(0.22, 1, 0.36, 1)'

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white font-sans relative overflow-hidden">
      {/* ambient glows */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -left-32 w-96 h-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 right-0 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />

      <div className="relative flex min-h-screen">
        {/* ============ Glass sidebar ============ */}
        <aside
          className={`${glass} m-3 me-0 rounded-3xl flex flex-col shrink-0 overflow-hidden`}
          style={{ width: collapsed ? 76 : 264, transition: `width 300ms ${ease}` }}
        >
          {/* logo */}
          <div className={`flex items-center gap-3 px-4 pt-5 pb-4 ${collapsed ? 'justify-center px-0' : ''}`}>
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center font-extrabold text-lg shadow-lg shadow-violet-500/30">
              T
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="font-extrabold text-lg leading-tight tracking-tight">{t('app.name')}</p>
                <p className="text-[11px] text-white/50 truncate">{t('app.tagline')}</p>
              </div>
            )}
          </div>

          {/* nav */}
          <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = view === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setView(item.id)}
                  title={t(item.labelKey)}
                  className={`relative w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    collapsed ? 'justify-center px-0' : ''
                  } ${
                    active
                      ? 'bg-violet-500/20 text-white shadow-inner shadow-violet-500/10 ring-1 ring-violet-400/30'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon size={20} weight={active ? 'fill' : 'regular'} className="shrink-0" />
                  {!collapsed && <span className="flex-1 text-start truncate">{t(item.labelKey)}</span>}
                  {!collapsed && item.badge !== undefined && (
                    <span className="text-[11px] font-bold bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                  {collapsed && item.badge !== undefined && (
                    <span className="absolute -mt-5 ms-5 text-[10px] font-bold bg-cyan-400 text-[#0B0F14] rounded-full w-4 h-4 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}

            {/* projects section */}
            {!collapsed && (
              <p className="pt-5 pb-2 px-3 text-[11px] font-bold uppercase tracking-widest text-white/40">
                {t('nav.projectsSection')}
              </p>
            )}
            {collapsed && <div className="my-4 mx-2 h-px bg-white/10" />}
            {[
              { nameKey: 'projects.nameBank', color: '#8B5CF6' },
              { nameKey: 'projects.nameBrand', color: '#22D3EE' },
            ].map((p) => (
              <button
                key={p.nameKey}
                onClick={() => setView('projects')}
                title={t(p.nameKey)}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors ${
                  collapsed ? 'justify-center px-0' : ''
                }`}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                {!collapsed && <span className="truncate text-start">{t(p.nameKey)}</span>}
              </button>
            ))}
          </nav>

          {/* user card + collapse toggle */}
          <div className="p-3 space-y-2">
            <div
              className={`flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-2.5 ${
                collapsed ? 'justify-center p-2' : ''
              }`}
            >
              <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xs font-extrabold">
                AC
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold truncate">{t('user.name')}</p>
                  <p className="text-[11px] text-white/50 truncate">{t('user.role')}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => patch({ collapsed: !collapsed })}
              title={collapsed ? t('nav.expand') : t('nav.collapse')}
              aria-label={collapsed ? t('nav.expand') : t('nav.collapse')}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 py-2 text-xs font-bold text-white/70 hover:text-white transition-colors"
            >
              {collapsed ? <CaretRight size={16} /> : <CaretLeft size={16} />}
              {!collapsed && <span>{t('nav.collapse')}</span>}
            </button>
          </div>
        </aside>

        {/* ============ Main content ============ */}
        <main className="flex-1 min-w-0 flex flex-col">
          <header className="sticky top-0 z-10 px-4 sm:px-8 pt-4 pb-3 bg-[#0B0F14]/80 backdrop-blur-xl">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-40">
                <h1 className="text-2xl font-extrabold tracking-tight">{t(viewTitleKey[view])}</h1>
                <p className="text-sm text-white/50">{t('header.subtitle')}</p>
              </div>
              <span className="text-[11px] font-bold bg-white/5 border border-white/10 text-white/60 rounded-full px-3 py-1.5">
                {t('app.demo')}
              </span>
              <label className="flex items-center gap-2 rounded-full bg-white/5 border border-white/10 px-3 py-2 w-56 max-w-full focus-within:ring-2 focus-within:ring-violet-400/50">
                <MagnifyingGlass size={16} className="text-white/40 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('header.searchPlaceholder')}
                  className="bg-transparent outline-none text-sm w-full placeholder:text-white/35"
                />
              </label>
              <button
                onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                className="rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-200 text-sm font-bold px-4 py-2 hover:bg-violet-500/30 transition-colors"
              >
                {lang === 'en' ? 'العربية' : 'English'}
              </button>
            </div>
          </header>

          <div className="flex-1 px-4 sm:px-8 pb-8 pt-2 overflow-y-auto">
            {/* ---------- Dashboard ---------- */}
            {view === 'dashboard' && (
              <div className="space-y-6">
                <div className={`${glass} rounded-3xl p-6 bg-gradient-to-br from-violet-500/15 via-transparent to-cyan-400/10`}>
                  <h2 className="text-xl font-extrabold">{t('header.greeting')}</h2>
                  <p className="text-sm text-white/60 mt-1">{t('dashboard.subtitle')}</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: 'dashboard.statProjects', value: '12', note: 'dashboard.statProjectsNote', color: '#8B5CF6' },
                    { label: 'dashboard.statDue', value: '8', note: 'dashboard.statDueNote', color: '#F59E0B' },
                    { label: 'dashboard.statOnline', value: '6', note: 'dashboard.statOnlineNote', color: '#22D3EE' },
                    { label: 'dashboard.statHours', value: '34.5', note: 'dashboard.statHoursNote', color: '#34D399' },
                  ].map((s) => (
                    <div key={s.label} className={`${glass} rounded-3xl p-5`}>
                      <p className="text-xs font-bold uppercase tracking-wide text-white/50">{t(s.label)}</p>
                      <p className="text-3xl font-extrabold mt-2" style={{ color: s.color }}>{s.value}</p>
                      <p className="text-xs text-white/50 mt-1">{t(s.note)}</p>
                    </div>
                  ))}
                </div>
                <div className={`${glass} rounded-3xl p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">{t('dashboard.feedTitle')}</h3>
                    <button onClick={() => setView('activities')} className="text-sm font-bold text-violet-300 hover:text-violet-200">
                      {t('dashboard.viewAll')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {ACTIVITIES.slice(0, 6).map((a, i) => (
                      <ActivityRow key={i} entry={a} t={t} />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ---------- Tasks ---------- */}
            {view === 'tasks' && (
              <div className="space-y-5 max-w-3xl">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <p className="text-sm text-white/60">
                    {remaining} {t('tasks.remaining')} · {doneCount} {t('tasks.done')}
                  </p>
                  {doneCount > 0 && (
                    <button
                      onClick={() => patch({ tasks: tasks.filter((task) => !task.done) })}
                      className="flex items-center gap-1.5 text-xs font-bold text-white/60 hover:text-red-300 bg-white/5 border border-white/10 rounded-full px-3 py-1.5"
                    >
                      <Trash size={14} /> {t('tasks.clearDone')}
                    </button>
                  )}
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    addTask()
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    placeholder={t('tasks.addPlaceholder')}
                    className="flex-1 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm outline-none placeholder:text-white/35 focus:ring-2 focus:ring-violet-400/50"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-2xl bg-violet-500 hover:bg-violet-400 px-4 py-3 text-sm font-bold transition-colors"
                  >
                    <Plus size={16} weight="bold" /> {t('tasks.addButton')}
                  </button>
                </form>
                <div className="space-y-2">
                  {filteredTasks.length === 0 && (
                    <p className={`${glass} rounded-2xl p-5 text-sm text-white/50`}>{t('tasks.empty')}</p>
                  )}
                  {filteredTasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => toggleTask(task.id)}
                      className={`${glass} w-full flex items-center gap-3 rounded-2xl p-4 text-start hover:bg-white/[0.08] transition-colors`}
                    >
                      <span
                        className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center transition-colors ${
                          task.done ? 'bg-violet-500 border-violet-500' : 'border-white/30'
                        }`}
                      >
                        {task.done && <Check size={14} weight="bold" />}
                      </span>
                      <span className={`text-sm font-medium ${task.done ? 'line-through text-white/40' : ''}`}>
                        {taskText(task)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ---------- Activities ---------- */}
            {view === 'activities' && (
              <div className="space-y-5 max-w-3xl">
                <p className="text-sm text-white/60">
                  {ACTIVITIES.length} {t('activities.entries')} · {t('activities.subtitle')}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {(
                    [
                      ['all', 'activities.filterAll'],
                      ['comment', 'activities.filterComments'],
                      ['update', 'activities.filterUpdates'],
                    ] as const
                  ).map(([key, labelKey]) => (
                    <button
                      key={key}
                      onClick={() => setActivityFilter(key)}
                      className={`rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
                        activityFilter === key
                          ? 'bg-violet-500 border-violet-500 text-white'
                          : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                      }`}
                    >
                      {t(labelKey)}
                      {key === 'all' ? ` (${ACTIVITIES.length})` : ''}
                    </button>
                  ))}
                </div>
                <div className={`${glass} rounded-3xl p-5 space-y-4`}>
                  {filteredActivities.map((a, i) => (
                    <ActivityRow key={i} entry={a} t={t} />
                  ))}
                  {filteredActivities.length === 0 && (
                    <p className="text-sm text-white/50">{t('tasks.empty')}</p>
                  )}
                </div>
              </div>
            )}

            {/* ---------- Teams ---------- */}
            {view === 'teams' && (
              <div className="space-y-5">
                <p className="text-sm text-white/60">{t('teams.subtitle')}</p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTeam.map((m) => (
                    <div key={m.name} className={`${glass} rounded-3xl p-5`}>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center font-extrabold"
                            style={{ backgroundColor: m.color + '33', color: m.color }}
                          >
                            {initials(m.name)}
                          </div>
                          <span
                            className={`absolute bottom-0 end-0 w-3.5 h-3.5 rounded-full border-2 border-[#0B0F14] ${
                              m.online ? 'bg-emerald-400' : 'bg-white/30'
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate">{m.name}</p>
                          <p className="text-xs text-white/50 truncate">{t(`teams.${m.role}`)}</p>
                        </div>
                      </div>
                      <p className="mt-4 text-xs font-bold">
                        <span className={m.online ? 'text-emerald-300' : 'text-white/40'}>
                          ● {m.online ? t('teams.online') : t('teams.offline')}
                        </span>
                      </p>
                    </div>
                  ))}
                </div>
                {filteredTeam.length === 0 && (
                  <p className={`${glass} rounded-2xl p-5 text-sm text-white/50`}>{t('tasks.empty')}</p>
                )}
              </div>
            )}

            {/* ---------- Projects ---------- */}
            {view === 'projects' && (
              <div className="space-y-5">
                <p className="text-sm text-white/60">{t('projects.subtitle')}</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  {filteredProjects.map((p) => (
                    <div key={p.nameKey} className={`${glass} rounded-3xl p-5`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                          <h3 className="font-bold truncate">{t(p.nameKey)}</h3>
                        </div>
                        <span
                          className="text-[11px] font-bold rounded-full px-2.5 py-1 shrink-0"
                          style={{ backgroundColor: p.color + '22', color: p.color }}
                        >
                          {t(p.statusKey)}
                        </span>
                      </div>
                      <p className="text-sm text-white/55 mt-3">{t(p.descKey)}</p>
                      <div className="mt-4">
                        <div className="flex justify-between text-xs font-bold text-white/50 mb-1.5">
                          <span>{t('projects.progress')}</span>
                          <span>{p.progress}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${p.progress}%`, backgroundColor: p.color }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-white/50 mt-4">
                        <span>
                          {p.done}/{p.total} {t('projects.tasksDone')}
                        </span>
                        <span>{t(p.dueKey)}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {filteredProjects.length === 0 && (
                  <p className={`${glass} rounded-2xl p-5 text-sm text-white/50`}>{t('tasks.empty')}</p>
                )}
              </div>
            )}

            {/* ---------- Calendar ---------- */}
            {view === 'calendar' && (
              <div className="space-y-5 max-w-3xl">
                <p className="text-sm text-white/60">{t('calendar.subtitle')}</p>
                <div className={`${glass} rounded-3xl p-5`}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">{t('calendar.month')}</h3>
                    <span className="flex items-center gap-1.5 text-xs font-bold text-white/50">
                      <Clock size={14} /> {t('calendar.eventsFor')} {selectedDay} Nov
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5 text-center">
                    {WEEKDAY_KEYS.map((d) => (
                      <p key={d} className="text-[11px] font-bold uppercase tracking-wide text-white/40 py-1">
                        {t(`weekdays.${d}`)}
                      </p>
                    ))}
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => {
                      const hasEvents = (CALENDAR_EVENTS[day] ?? []).length > 0
                      const selected = day === selectedDay
                      return (
                        <button
                          key={day}
                          onClick={() => patch({ selectedDay: day })}
                          className={`relative aspect-square rounded-xl text-sm font-bold transition-colors ${
                            selected
                              ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/40'
                              : 'bg-white/[0.04] hover:bg-white/10 text-white/75'
                          }`}
                        >
                          {day}
                          {hasEvents && (
                            <span
                              className={`absolute bottom-1.5 start-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                                selected ? 'bg-white' : 'bg-cyan-400'
                              }`}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div className={`${glass} rounded-3xl p-5`}>
                  <h3 className="font-bold mb-3">
                    {t('calendar.eventsFor')} {selectedDay} Nov 2026
                  </h3>
                  {(CALENDAR_EVENTS[selectedDay] ?? []).length === 0 ? (
                    <p className="text-sm text-white/50">{t('calendar.noEvents')}</p>
                  ) : (
                    <ul className="space-y-2">
                      {(CALENDAR_EVENTS[selectedDay] ?? []).map((ev) => (
                        <li key={ev} className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-sm font-medium">
                          <CalendarBlank size={18} className="text-cyan-300 shrink-0" />
                          {t(ev)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function ActivityRow({ entry, t }: { entry: ActivityEntry; t: (path: string) => string }) {
  const verb = entry.kind === 'comment' ? t('activities.commentedOn') : t('activities.updated')
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-violet-500/60 to-cyan-400/60 flex items-center justify-center text-[11px] font-extrabold">
        {initials(entry.actor)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <span className="font-bold">{entry.actor}</span>{' '}
          <span className="text-white/60">{verb}</span>{' '}
          <span className="font-semibold text-violet-200">{t(`activities.${entry.target}`)}</span>
        </p>
        <p className="text-xs text-white/40 mt-0.5">{t(`activities.${entry.time}`)}</p>
      </div>
      <span
        className={`text-[10px] font-bold rounded-full px-2 py-1 shrink-0 ${
          entry.kind === 'comment' ? 'bg-cyan-400/15 text-cyan-300' : 'bg-violet-500/15 text-violet-300'
        }`}
      >
        {entry.kind === 'comment' ? t('activities.filterComments') : t('activities.filterUpdates')}
      </span>
    </div>
  )
}
