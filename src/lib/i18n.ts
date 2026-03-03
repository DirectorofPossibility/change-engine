/**
 * @fileoverview UI string internationalization for The Change Engine.
 *
 * Provides ~90 translatable UI chrome strings (nav labels, headings, buttons,
 * card labels) in English, Spanish, and Vietnamese. Database-translated content
 * (titles, summaries) is handled separately by LanguageContext.
 *
 * Usage:
 *   - Client components: `const { t } = useTranslation()` hook
 *   - Server components: `const t = getUIStrings('es')` plain function
 *
 * Keys use dot notation grouped by feature area (e.g. `'nav.pathways'`,
 * `'card.read_more'`). Add new keys to all three dictionaries to maintain
 * parity.
 */

'use client'

import { useLanguage } from '@/lib/contexts/LanguageContext'
import type { SupportedLanguage } from '@/lib/types/exchange'

// ── Dictionaries ──

const en: Record<string, string> = {
  // Navigation
  'nav.pathways': 'Pathways',
  'nav.explore': 'Explore',
  'nav.help': 'Available Resources',
  'nav.services': 'Services',
  'nav.elections': 'Elections',
  'nav.search_placeholder': 'Search...',
  'nav.zip_prompt': 'Start with your ZIP code',

  // Footer
  'footer.explore': 'Explore',
  'footer.about': 'About',
  'footer.pathways': 'Pathways',
  'footer.help': 'Available Resources',
  'footer.officials': 'Officials',
  'footer.services': 'Services',
  'footer.elections': 'Elections',
  'footer.explore_link': 'Explore',
  'footer.polling_places': 'Polling Places',
  'footer.policies': 'Policies',
  'footer.search': 'Search',
  'footer.accessibility': 'Accessibility',
  'footer.tagline': 'A civic platform connecting Houston residents with resources, services, and civic participation opportunities.',
  'footer.built_in': 'Built with care in Houston, TX',

  // Homepage
  'home.location': 'Houston, Texas',
  'home.subtitle': 'Every Houstonian should know their community matters.',
  'home.cta_pathways': 'Explore Pathways',
  'home.cta_help': 'Available Resources',
  'home.cta_officials': 'Find Your Reps',
  'home.four_centers': 'Four Centers of Community Life',
  'home.centers_subtitle': 'Find what you need, organized by intent',
  'home.seven_pathways': 'Seven Pathways',
  'home.pathways_subtitle': 'Explore community life through these lenses',
  'home.available_resources': 'Available Resources',
  'home.help_subtitle': 'Explore resources for any life situation',
  'home.view_all': 'View all',
  'home.latest_resources': 'Latest Resources',
  'home.latest_subtitle': 'Recently published content for the community',
  'home.community_glance': 'Community at a Glance',
  'home.stats_resources': 'Resources',
  'home.stats_officials': 'Officials',
  'home.stats_organizations': 'Organizations',
  'home.stats_policies': 'Policies',

  // Help page
  'help.title': 'Available Resources',
  'help.subtitle': 'Browse community resources for any life situation, organized by priority.',
  'help.emergency': 'In an emergency?',
  'help.crisis_911': '911 for emergencies',
  'help.crisis_988': '988 for mental health crisis',
  'help.crisis_dv': '1-800-799-7233 for domestic violence',
  'help.urgency_critical': 'Time-Sensitive Resources',
  'help.urgency_high': 'Priority Resources',
  'help.urgency_medium': 'Community Resources',
  'help.urgency_low': 'Ongoing Resources',

  // Services page
  'services.title': 'Services',
  'services.subtitle': 'Find community services and support organizations in the Houston area.',

  // Officials page
  'officials.title': 'Elected Officials',
  'officials.subtitle': 'Find and contact your elected representatives at every level of government.',

  // Elections page
  'elections.title': 'Elections & Voting',
  'elections.subtitle': "Know what's on your ballot and where to vote.",
  'elections.upcoming': 'Upcoming Elections',
  'elections.past': 'Past Elections',
  'elections.turnout': 'Turnout:',
  'elections.results_certified': 'Results certified',

  // Explore page
  'explore.title': 'Explore Topics',
  'explore.subtitle_prefix': 'Browse',
  'explore.subtitle_middle': 'focus areas across',
  'explore.subtitle_suffix': 'pathways. Filter by Sustainable Development Goal or Social Determinant of Health.',

  // Pathways page
  'pathways.title': 'Seven Pathways',
  'pathways.subtitle': 'Explore community life through seven interconnected themes.',

  // Search page
  'search.title': 'Search Results',
  'search.result': 'result',
  'search.results': 'results',
  'search.for': 'for',
  'search.empty': 'Enter a search term to find content, services, officials, and more.',
  'search.no_results': 'No results found for',
  'search.try_different': 'Try different keywords or browse our categories:',
  'search.tab_content': 'Content',
  'search.tab_services': 'Services',
  'search.tab_officials': 'Officials',
  'search.tab_organizations': 'Organizations',
  'search.tab_policies': 'Policies',
  'search.tab_help': 'Help',
  'search.tab_resources': 'Resources',
  'search.tab_learning': 'Learning',
  'search.find_services': 'Find Services',
  'search.browse_pathways': 'Browse Pathways',
  'search.find_reps': 'Find My Reps',
  'search.view_resource': 'View resource',

  // Polling places page
  'polling.title': 'Find Your Polling Place',
  'polling.subtitle': 'Enter your ZIP code to find nearby voting locations.',

  // Card components
  'card.read_more': 'Read more',
  'card.website': 'Website',
  'card.email': 'Email',
  'card.call': 'Call',
  'card.view_source': 'View source',
  'card.virtual': 'Virtual',
  'card.spots_available': 'spots available',
  'card.register': 'Register',
  'card.resources': 'resources',
  'card.loading_translations': 'Loading translations...',

  // Action bar
  'action.donate': 'Donate',
  'action.volunteer': 'Volunteer',
  'action.sign_up': 'Sign Up',
  'action.register': 'Register',
  'action.apply': 'Apply',
  'action.call': 'Call',
  'action.attend': 'Attend',

  // Neighborhood banner
  'neighborhood.council_district': 'Council District',

  // Map
  'map.houston_glance': 'Houston at a Glance',

  // ZIP input
  'zip.enter': 'Enter ZIP',
  'zip.clear': 'Clear ZIP',

  // Election banner
  'election.today': 'TODAY — POLLS ARE OPEN',
  'election.tomorrow': 'TOMORROW',
  'election.in_days_prefix': 'IN',
  'election.in_days_suffix': 'DAYS',
  'election.polls_open_prefix': 'Polls open',
  'election.polls_open_suffix': 'Vote at any polling location in your county.',
  'election.find_polling': 'Find Your Polling Place',
  'election.info': 'Election Info',

  // Election countdown
  'countdown.date_tbd': 'Date TBD',
  'countdown.vote_today': 'ELECTION DAY — VOTE TODAY',
  'countdown.complete': 'Election complete',
  'countdown.early_voting_now': 'EARLY VOTING NOW',
  'countdown.register_by': 'Register by',
  'countdown.early_voting_starts': 'Early voting starts',
  'countdown.upcoming': 'Upcoming',
  'countdown.days_until': 'days until election',
  'countdown.election_day': 'Election Day',
  'countdown.early_voting': 'Early Voting',
  'countdown.registration_deadline': 'Registration Deadline',
}

const es: Record<string, string> = {
  // Navigation
  'nav.pathways': 'Caminos',
  'nav.explore': 'Explorar',
  'nav.help': 'Recursos Disponibles',
  'nav.services': 'Servicios',
  'nav.elections': 'Elecciones',
  'nav.search_placeholder': 'Buscar...',
  'nav.zip_prompt': 'Comience con su código postal',

  // Footer
  'footer.explore': 'Explorar',
  'footer.about': 'Acerca de',
  'footer.pathways': 'Caminos',
  'footer.help': 'Recursos Disponibles',
  'footer.officials': 'Funcionarios',
  'footer.services': 'Servicios',
  'footer.elections': 'Elecciones',
  'footer.explore_link': 'Explorar',
  'footer.polling_places': 'Lugares de Votación',
  'footer.policies': 'Políticas',
  'footer.search': 'Buscar',
  'footer.accessibility': 'Accesibilidad',
  'footer.tagline': 'Una plataforma cívica que conecta a los residentes de Houston con recursos, servicios y oportunidades de participación cívica.',
  'footer.built_in': 'Hecho con cariño en Houston, TX',

  // Homepage
  'home.location': 'Houston, Texas',
  'home.subtitle': 'Cada houstoniano debe saber que su comunidad importa.',
  'home.cta_pathways': 'Explorar Caminos',
  'home.cta_help': 'Recursos Disponibles',
  'home.cta_officials': 'Encuentre a Sus Representantes',
  'home.four_centers': 'Cuatro Centros de Vida Comunitaria',
  'home.centers_subtitle': 'Encuentre lo que necesita, organizado por intención',
  'home.seven_pathways': 'Siete Caminos',
  'home.pathways_subtitle': 'Explore la vida comunitaria a través de estos lentes',
  'home.available_resources': 'Recursos Disponibles',
  'home.help_subtitle': 'Descubra recursos disponibles para cualquier situación de vida',
  'home.view_all': 'Ver todos',
  'home.latest_resources': 'Últimos Recursos',
  'home.latest_subtitle': 'Contenido publicado recientemente para la comunidad',
  'home.community_glance': 'La Comunidad de un Vistazo',
  'home.stats_resources': 'Recursos',
  'home.stats_officials': 'Funcionarios',
  'home.stats_organizations': 'Organizaciones',
  'home.stats_policies': 'Políticas',

  // Help page
  'help.title': 'Recursos Disponibles',
  'help.subtitle': 'Descubra recursos comunitarios para cualquier situación de vida, organizados por prioridad.',
  'help.emergency': '¿Es una emergencia?',
  'help.crisis_911': '911 para emergencias',
  'help.crisis_988': '988 para crisis de salud mental',
  'help.crisis_dv': '1-800-799-7233 para violencia doméstica',
  'help.urgency_critical': 'Recursos Urgentes',
  'help.urgency_high': 'Recursos Prioritarios',
  'help.urgency_medium': 'Recursos Comunitarios',
  'help.urgency_low': 'Recursos Continuos',

  // Services page
  'services.title': 'Servicios',
  'services.subtitle': 'Encuentre servicios comunitarios y organizaciones de apoyo en el área de Houston.',

  // Officials page
  'officials.title': 'Funcionarios Electos',
  'officials.subtitle': 'Encuentre y contacte a sus representantes electos en todos los niveles de gobierno.',

  // Elections page
  'elections.title': 'Elecciones y Votación',
  'elections.subtitle': 'Conozca qué hay en su boleta y dónde votar.',
  'elections.upcoming': 'Próximas Elecciones',
  'elections.past': 'Elecciones Anteriores',
  'elections.turnout': 'Participación:',
  'elections.results_certified': 'Resultados certificados',

  // Explore page
  'explore.title': 'Explorar Temas',
  'explore.subtitle_prefix': 'Explore',
  'explore.subtitle_middle': 'áreas de enfoque en',
  'explore.subtitle_suffix': 'caminos. Filtre por Objetivo de Desarrollo Sostenible o Determinante Social de la Salud.',

  // Pathways page
  'pathways.title': 'Siete Caminos',
  'pathways.subtitle': 'Explore la vida comunitaria a través de siete temas interconectados.',

  // Search page
  'search.title': 'Resultados de Búsqueda',
  'search.result': 'resultado',
  'search.results': 'resultados',
  'search.for': 'para',
  'search.empty': 'Ingrese un término de búsqueda para encontrar contenido, servicios, funcionarios y más.',
  'search.no_results': 'No se encontraron resultados para',
  'search.try_different': 'Pruebe con diferentes palabras clave o explore nuestras categorías:',
  'search.tab_content': 'Contenido',
  'search.tab_services': 'Servicios',
  'search.tab_officials': 'Funcionarios',
  'search.tab_organizations': 'Organizaciones',
  'search.tab_policies': 'Políticas',
  'search.tab_help': 'Ayuda',
  'search.tab_resources': 'Recursos',
  'search.tab_learning': 'Aprendizaje',
  'search.find_services': 'Buscar Servicios',
  'search.browse_pathways': 'Explorar Caminos',
  'search.find_reps': 'Encuentre a Sus Representantes',
  'search.view_resource': 'Ver recurso',

  // Polling places page
  'polling.title': 'Encuentre Su Lugar de Votación',
  'polling.subtitle': 'Ingrese su código postal para encontrar lugares de votación cercanos.',

  // Card components
  'card.read_more': 'Leer más',
  'card.website': 'Sitio web',
  'card.email': 'Correo',
  'card.call': 'Llamar',
  'card.view_source': 'Ver fuente',
  'card.virtual': 'Virtual',
  'card.spots_available': 'lugares disponibles',
  'card.register': 'Registrarse',
  'card.resources': 'recursos',
  'card.loading_translations': 'Cargando traducciones...',

  // Action bar
  'action.donate': 'Donar',
  'action.volunteer': 'Voluntariado',
  'action.sign_up': 'Inscribirse',
  'action.register': 'Registrarse',
  'action.apply': 'Aplicar',
  'action.call': 'Llamar',
  'action.attend': 'Asistir',

  // Neighborhood banner
  'neighborhood.council_district': 'Distrito del Concejo',

  // Map
  'map.houston_glance': 'Houston de un Vistazo',

  // ZIP input
  'zip.enter': 'Código postal',
  'zip.clear': 'Borrar código postal',

  // Election banner
  'election.today': 'HOY — LAS URNAS ESTÁN ABIERTAS',
  'election.tomorrow': 'MAÑANA',
  'election.in_days_prefix': 'EN',
  'election.in_days_suffix': 'DÍAS',
  'election.polls_open_prefix': 'Urnas abiertas',
  'election.polls_open_suffix': 'Vote en cualquier lugar de votación en su condado.',
  'election.find_polling': 'Encuentre Su Lugar de Votación',
  'election.info': 'Info Electoral',

  // Election countdown
  'countdown.date_tbd': 'Fecha por confirmar',
  'countdown.vote_today': 'DÍA DE ELECCIONES — VOTE HOY',
  'countdown.complete': 'Elección completada',
  'countdown.early_voting_now': 'VOTACIÓN ANTICIPADA AHORA',
  'countdown.register_by': 'Regístrese antes del',
  'countdown.early_voting_starts': 'Votación anticipada comienza',
  'countdown.upcoming': 'Próximamente',
  'countdown.days_until': 'días hasta la elección',
  'countdown.election_day': 'Día de Elecciones',
  'countdown.early_voting': 'Votación Anticipada',
  'countdown.registration_deadline': 'Fecha Límite de Registro',
}

const vi: Record<string, string> = {
  // Navigation
  'nav.pathways': 'Lộ Trình',
  'nav.explore': 'Khám Phá',
  'nav.help': 'Tài Nguyên Có Sẵn',
  'nav.services': 'Dịch Vụ',
  'nav.elections': 'Bầu Cử',
  'nav.search_placeholder': 'Tìm kiếm...',
  'nav.zip_prompt': 'Bắt đầu với mã bưu điện',

  // Footer
  'footer.explore': 'Khám Phá',
  'footer.about': 'Giới Thiệu',
  'footer.pathways': 'Lộ Trình',
  'footer.help': 'Tài Nguyên Có Sẵn',
  'footer.officials': 'Quan Chức',
  'footer.services': 'Dịch Vụ',
  'footer.elections': 'Bầu Cử',
  'footer.explore_link': 'Khám Phá',
  'footer.polling_places': 'Địa Điểm Bỏ Phiếu',
  'footer.policies': 'Chính Sách',
  'footer.search': 'Tìm Kiếm',
  'footer.accessibility': 'Trợ Năng',
  'footer.tagline': 'Nền tảng dân sự kết nối cư dân Houston với tài nguyên, dịch vụ và cơ hội tham gia cộng đồng.',
  'footer.built_in': 'Được xây dựng tận tâm tại Houston, TX',

  // Homepage
  'home.location': 'Houston, Texas',
  'home.subtitle': 'Mỗi cư dân Houston nên biết cộng đồng của mình quan trọng.',
  'home.cta_pathways': 'Khám Phá Lộ Trình',
  'home.cta_help': 'Tài Nguyên Có Sẵn',
  'home.cta_officials': 'Tìm Đại Diện',
  'home.four_centers': 'Bốn Trung Tâm Đời Sống Cộng Đồng',
  'home.centers_subtitle': 'Tìm những gì bạn cần, sắp xếp theo mục đích',
  'home.seven_pathways': 'Bảy Lộ Trình',
  'home.pathways_subtitle': 'Khám phá đời sống cộng đồng qua các góc nhìn này',
  'home.available_resources': 'Tài Nguyên Có Sẵn',
  'home.help_subtitle': 'Khám phá tài nguyên có sẵn cho bất kỳ tình huống cuộc sống nào',
  'home.view_all': 'Xem tất cả',
  'home.latest_resources': 'Tài Nguyên Mới Nhất',
  'home.latest_subtitle': 'Nội dung mới xuất bản cho cộng đồng',
  'home.community_glance': 'Cộng Đồng Một Cái Nhìn',
  'home.stats_resources': 'Tài Nguyên',
  'home.stats_officials': 'Quan Chức',
  'home.stats_organizations': 'Tổ Chức',
  'home.stats_policies': 'Chính Sách',

  // Help page
  'help.title': 'Tài Nguyên Có Sẵn',
  'help.subtitle': 'Khám phá tài nguyên cộng đồng cho bất kỳ tình huống cuộc sống nào, sắp xếp theo mức độ ưu tiên.',
  'help.emergency': 'Trường hợp khẩn cấp?',
  'help.crisis_911': '911 cho trường hợp khẩn cấp',
  'help.crisis_988': '988 cho khủng hoảng sức khỏe tâm thần',
  'help.crisis_dv': '1-800-799-7233 cho bạo lực gia đình',
  'help.urgency_critical': 'Tài Nguyên Khẩn Cấp',
  'help.urgency_high': 'Tài Nguyên Ưu Tiên',
  'help.urgency_medium': 'Tài Nguyên Cộng Đồng',
  'help.urgency_low': 'Tài Nguyên Liên Tục',

  // Services page
  'services.title': 'Dịch Vụ',
  'services.subtitle': 'Tìm dịch vụ cộng đồng và tổ chức hỗ trợ trong khu vực Houston.',

  // Officials page
  'officials.title': 'Quan Chức Dân Cử',
  'officials.subtitle': 'Tìm và liên hệ đại diện dân cử của bạn ở mọi cấp chính quyền.',

  // Elections page
  'elections.title': 'Bầu Cử & Bỏ Phiếu',
  'elections.subtitle': 'Biết những gì trên lá phiếu và nơi bỏ phiếu.',
  'elections.upcoming': 'Bầu Cử Sắp Tới',
  'elections.past': 'Bầu Cử Trước Đây',
  'elections.turnout': 'Tỷ lệ tham gia:',
  'elections.results_certified': 'Kết quả đã chứng nhận',

  // Explore page
  'explore.title': 'Khám Phá Chủ Đề',
  'explore.subtitle_prefix': 'Duyệt qua',
  'explore.subtitle_middle': 'lĩnh vực trọng tâm trong',
  'explore.subtitle_suffix': 'lộ trình. Lọc theo Mục Tiêu Phát Triển Bền Vững hoặc Yếu Tố Xã Hội Quyết Định Sức Khỏe.',

  // Pathways page
  'pathways.title': 'Bảy Lộ Trình',
  'pathways.subtitle': 'Khám phá đời sống cộng đồng qua bảy chủ đề kết nối.',

  // Search page
  'search.title': 'Kết Quả Tìm Kiếm',
  'search.result': 'kết quả',
  'search.results': 'kết quả',
  'search.for': 'cho',
  'search.empty': 'Nhập từ khóa để tìm nội dung, dịch vụ, quan chức và nhiều hơn nữa.',
  'search.no_results': 'Không tìm thấy kết quả cho',
  'search.try_different': 'Thử từ khóa khác hoặc duyệt danh mục:',
  'search.tab_content': 'Nội Dung',
  'search.tab_services': 'Dịch Vụ',
  'search.tab_officials': 'Quan Chức',
  'search.tab_organizations': 'Tổ Chức',
  'search.tab_policies': 'Chính Sách',
  'search.tab_help': 'Trợ Giúp',
  'search.tab_resources': 'Tài Nguyên',
  'search.tab_learning': 'Học Tập',
  'search.find_services': 'Tìm Dịch Vụ',
  'search.browse_pathways': 'Duyệt Lộ Trình',
  'search.find_reps': 'Tìm Đại Diện',
  'search.view_resource': 'Xem tài nguyên',

  // Polling places page
  'polling.title': 'Tìm Địa Điểm Bỏ Phiếu',
  'polling.subtitle': 'Nhập mã bưu điện để tìm địa điểm bỏ phiếu gần bạn.',

  // Card components
  'card.read_more': 'Đọc thêm',
  'card.website': 'Trang web',
  'card.email': 'Email',
  'card.call': 'Gọi',
  'card.view_source': 'Xem nguồn',
  'card.virtual': 'Trực tuyến',
  'card.spots_available': 'chỗ còn trống',
  'card.register': 'Đăng ký',
  'card.resources': 'tài nguyên',
  'card.loading_translations': 'Đang tải bản dịch...',

  // Action bar
  'action.donate': 'Quyên Góp',
  'action.volunteer': 'Tình Nguyện',
  'action.sign_up': 'Đăng Ký',
  'action.register': 'Ghi Danh',
  'action.apply': 'Nộp Đơn',
  'action.call': 'Gọi',
  'action.attend': 'Tham Dự',

  // Neighborhood banner
  'neighborhood.council_district': 'Quận Hội Đồng',

  // Map
  'map.houston_glance': 'Houston Một Cái Nhìn',

  // ZIP input
  'zip.enter': 'Mã bưu điện',
  'zip.clear': 'Xóa mã bưu điện',

  // Election banner
  'election.today': 'HÔM NAY — ĐIỂM BỎ PHIẾU ĐANG MỞ',
  'election.tomorrow': 'NGÀY MAI',
  'election.in_days_prefix': 'TRONG',
  'election.in_days_suffix': 'NGÀY',
  'election.polls_open_prefix': 'Điểm bỏ phiếu mở',
  'election.polls_open_suffix': 'Bỏ phiếu tại bất kỳ địa điểm nào trong quận của bạn.',
  'election.find_polling': 'Tìm Địa Điểm Bỏ Phiếu',
  'election.info': 'Thông Tin Bầu Cử',

  // Election countdown
  'countdown.date_tbd': 'Ngày chưa xác định',
  'countdown.vote_today': 'NGÀY BẦU CỬ — BỎ PHIẾU HÔM NAY',
  'countdown.complete': 'Bầu cử hoàn tất',
  'countdown.early_voting_now': 'BỎ PHIẾU SỚM NGAY BÂY GIỜ',
  'countdown.register_by': 'Đăng ký trước',
  'countdown.early_voting_starts': 'Bỏ phiếu sớm bắt đầu',
  'countdown.upcoming': 'Sắp tới',
  'countdown.days_until': 'ngày đến bầu cử',
  'countdown.election_day': 'Ngày Bầu Cử',
  'countdown.early_voting': 'Bỏ Phiếu Sớm',
  'countdown.registration_deadline': 'Hạn Đăng Ký',
}

const dictionaries: Record<SupportedLanguage, Record<string, string>> = { en, es, vi }

// ── Client hook ──

/**
 * React hook returning a `t()` function that resolves UI string keys
 * against the current language from {@link LanguageContext}.
 *
 * @returns `{ t }` where `t(key)` returns the translated string or the key itself as fallback.
 *
 * @example
 * ```tsx
 * const { t } = useTranslation()
 * return <h1>{t('services.title')}</h1>
 * ```
 */
export function useTranslation() {
  const { language } = useLanguage()
  function t(key: string): string {
    return dictionaries[language]?.[key] ?? dictionaries.en[key] ?? key
  }
  return { t }
}

// ── Server helper ──

/**
 * Plain function for server components — returns a `t()` translator for
 * the given language code.
 *
 * @param lang - Language code (`'en'`, `'es'`, or `'vi'`).
 * @returns A function `t(key)` that resolves the key in the given language.
 */
export function getUIStrings(lang: string): (key: string) => string {
  const dict = dictionaries[lang as SupportedLanguage] ?? dictionaries.en
  return function t(key: string): string {
    return dict[key] ?? dictionaries.en[key] ?? key
  }
}
