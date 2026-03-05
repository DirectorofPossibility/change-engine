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
  'nav.services': 'Local Resources',
  'nav.officials': 'Officials',
  'nav.policies': 'Policy',
  'nav.elections': 'Elections',
  'nav.library': 'Library',
  'nav.search_placeholder': 'Search...',
  'nav.zip_prompt': 'Start with your ZIP code',

  // Footer
  'footer.explore': 'Explore',
  'footer.about': 'About',
  'footer.pathways': 'Pathways',
  'footer.help': 'Available Resources',
  'footer.officials': 'Officials',
  'footer.services': 'Services',
  'footer.elections': 'Civic Hub',
  'footer.explore_link': 'Explore',
  'footer.polling_places': 'Polling Places',
  'footer.policies': 'Policies',
  'footer.search': 'Search',
  'footer.privacy': 'Privacy Policy',
  'footer.terms': 'Terms of Use',
  'footer.accessibility': 'Accessibility',
  'footer.tagline': 'A civic platform connecting Houston residents with resources, services, and civic participation opportunities.',
  'footer.built_in': 'Built with care in Houston, TX',
  'support.button': 'Support This Project',

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
  'home.choose_path': 'Choose Your Path',
  'home.choose_subtitle': 'Every journey through community life starts with a question',
  'home.begin_here': 'Begin here',
  'home.see_all': 'See all',
  'hero.title_line1': 'Your Community,',
  'hero.title_line2': 'Your Choice',
  'hero.scroll_prompt': 'Where would you like to begin?',

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
  'help.intro': 'No matter what you are facing, Houston has resources ready for you. Browse by urgency or life situation to find support, services, and next steps.',

  // Services page
  'services.title': 'Services',
  'services.subtitle': 'Find community services and support organizations in the Houston area.',
  'services.intro': 'Houston has a deep network of services and organizations dedicated to your well-being. Browse by category, search by need, or explore the map to find what is near you.',

  // Officials page
  'officials.title': 'Elected Officials',
  'officials.subtitle': 'Find and contact your elected representatives at every level of government.',

  // Lookup page
  'lookup.address_or_zip': 'Enter your address or ZIP code',
  'lookup.showing_results': 'Showing results for',
  'lookup.essential_services': 'Essential Services',
  'lookup.emergency': 'Emergency',
  'lookup.police': 'Police & Law Enforcement',
  'lookup.fire': 'Fire & EMS',
  'lookup.medical': 'Medical & Health',
  'lookup.parks': 'Parks & Recreation',
  'lookup.library': 'Libraries',
  'lookup.utilities': 'Utilities',
  'lookup.your_representatives': 'Your Representatives',
  'lookup.call': 'Call',

  // Elections page
  'elections.title': 'Elections & Voting',
  'elections.subtitle': "Know what's on your ballot and where to vote.",
  'elections.intro': 'Your vote is your voice. Find upcoming elections, learn about candidates, check registration deadlines, and locate your polling place.',
  'elections.upcoming': 'Upcoming Elections',
  'elections.past': 'Past Elections',
  'elections.turnout': 'Turnout:',
  'elections.results_certified': 'Results certified',

  // Civic Hub
  'civicHub.title': 'Your Civic Hub',
  'civicHub.subtitle': 'Explore your elected officials, policies, and elections at every level of government.',
  'civicHub.representatives': 'Your Representatives',
  'civicHub.policies': 'Policies & Legislation',
  'civicHub.elections': 'Elections & Voting',
  'civicHub.no_officials': 'No officials listed at this level yet.',
  'civicHub.no_policies': 'No policies tracked at this level yet.',
  'civicHub.no_elections': 'No elections scheduled at this level.',
  'civicHub.search_officials': 'Search officials...',
  'civicHub.view_all_officials': 'View all officials',
  'civicHub.view_all_policies': 'View all policies',

  // Geography / Map View page
  'geo.title': 'Map View',
  'geo.subtitle': 'Explore Your Community',
  'geo.select_super': 'Select a super neighborhood',
  'geo.select_neighborhood': 'Select a neighborhood',
  'geo.map_layers': 'Map Layers',
  'geo.services_nearby': 'Services Nearby',
  'geo.officials_here': 'Officials Representing This Area',
  'geo.organizations_here': 'Organizations in This Area',
  'geo.policies_impacting': 'Policies Impacting This Area',
  'geo.census_info': 'Census & Demographics',
  'geo.no_selection': 'Enter a ZIP code or select a neighborhood to explore your community.',
  'geo.explore_prompt': 'Start exploring by entering your ZIP code or choosing a super neighborhood above.',
  'geo.filter_markers': 'Filter Markers',
  'geo.show_all_layers': 'Show All',
  'geo.hide_all_layers': 'Hide All',
  'geo.click_to_explore': 'Toggle a boundary layer, then click any area to explore',
  'geo.loading_content': 'Loading nearby content...',
  'geo.exploring': 'Exploring',
  'geo.all_pathways': 'All',
  'geo.filter_by_pathway': 'Filter by pathway',

  // Explore page
  'explore.title': 'Explore Topics',
  'explore.subtitle_prefix': 'Browse',
  'explore.subtitle_middle': 'focus areas across',
  'explore.subtitle_suffix': 'pathways. Filter by Sustainable Development Goal or Social Determinant of Health.',
  'explore.intro': 'Every topic connects to something bigger. Browse focus areas across all seven pathways, filter by global goals, and discover how community issues interrelate.',

  // Pathways page
  'pathways.title': 'Seven Pathways',
  'pathways.subtitle': 'Explore community life through seven interconnected themes.',
  'pathway.centers_title': 'Four Ways to Engage',
  'pathway.focus_areas_title': 'Explore Topics',
  'pathway.content_title': 'Resources & Content',

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
  'search.intro': 'Explore everything The Change Engine has gathered for Houston — from articles and services to elected officials and community organizations.',

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

  // Wayfinder homepage
  'wayfinder.the': 'The',
  'wayfinder.community': 'Community',
  'wayfinder.exchange': 'Exchange',
  'wayfinder.hero_subtitle': 'Everything connects. Explore 7 pathways of civic life.',
  'wayfinder.tap_hint': 'Tap any circle to explore a pathway',
  'wayfinder.start_journey': 'Start Your Journey',
  'wayfinder.explore': 'Explore',
  'wayfinder.browse_all': 'Browse all pathways',
  'wayfinder.explore_houston': 'Explore Houston',
  'wayfinder.whats_new': "What's New",
  'wayfinder.this_week': 'this week',
  'wayfinder.connected_to': 'Connected to',
  'wayfinder.pathway_desc': 'resources across involvement, services, policies & civic life',
  'wayfinder.footer': 'The Community Exchange — a product of The Change Engine',

  // Life situations
  'life.food_access': 'Food Access',
  'life.housing_shelter': 'Housing & Shelter',
  'life.career_employment': 'Career & Employment',
  'life.health_wellness': 'Health & Wellness',
  'life.safety_protection': 'Safety & Protection',
  'life.financial_stability': 'Financial Stability',

  // Sidebar
  'sidebar.home': 'Home',
  'sidebar.edition': 'Edition',
  'sidebar.change': 'change',
  'sidebar.go': 'Go',
  'sidebar.explore_houston': 'Explore Houston',
  'sidebar.your_guide': 'Your Guide',
  'sidebar.elections': 'Elections & Voting',
  'sidebar.library': 'Library',
  'sidebar.chat': 'Chat with Chance',
  'sidebar.topics': 'Topics',
  'sidebar.no_topics': 'No topics available',

  // Chat with Chance
  'chat.title': 'Chat with Chance',
  'chat.subtitle': 'Your neighborhood guide',
  'chat.welcome_title': 'Meet Chance',
  'chat.placeholder': 'Ask Chance anything about Houston...',

  // Your Guide links
  'discover.guide': 'The Community Guide',
  'discover.local_resources': 'Local Resources',
  'discover.officials': 'Elected Officials',
  'discover.policy': 'Policy & Legislation',
  'discover.guides': 'Guides & Articles',
  'discover.available_resources': 'Available Resources',
  'discover.topics': 'Explore Topics',
  'discover.learning': 'Learning Paths',
  'discover.geography': 'Geography',
  'discover.map_view': 'Map View',
  'discover.foundations': 'Foundations',

  // Guide page
  'guide.masthead': 'The Community Exchange',
  'guide.tagline': 'Community Life, Organized',
  'guide.volume': 'Vol. I',
  'guide.spotlight': 'In the Spotlight',
  'guide.spotlight_subtitle': 'The latest stories from across the community',
  'guide.civic_desk': 'Civic Desk',
  'guide.civic_subtitle': 'Elections, officials, and policy updates',
  'guide.your_neighborhood': 'Your Neighborhood',
  'guide.neighborhood_subtitle': 'Services and resources near you',
  'guide.neighborhood_prompt': 'Enter your ZIP code to see local resources',
  'guide.learn_grow': 'Learn & Grow',
  'guide.learn_subtitle': 'Learning paths and guides to build your knowledge',
  'guide.life_houston': 'Life in Houston',
  'guide.life_subtitle': 'Resources for every situation',
  'guide.bigger_picture': 'The Bigger Picture',
  'guide.sdg_heading': 'Sustainable Development Goals',
  'guide.sdoh_heading': 'Social Determinants of Health',
  'guide.seven_pathways': 'Seven Pathways',
  'guide.pathways_subtitle': 'Your guide to community topics',
  'guide.featured': 'Featured',
  'guide.new_this_week': 'New This Week',
  'guide.search_placeholder': 'Search the guide...',
  'guide.quick_links': 'Quick Links',
  'guide.all_pathways': 'All Pathways',
  'guide.days_until_election': 'days until election',
  'guide.view_all': 'View All',

  // Feed filters
  'feed.all': 'All',
  'feed.learning': 'Learning',
  'feed.action': 'Action',
  'feed.resource': 'Resource',
  'feed.accountability': 'Accountability',
  'feed.no_items': 'No items match the current filter',
  'feed.try_different': 'Try selecting a different category above',

  // Card labels
  'card.explore': 'Explore',
  'card.open': 'Open',
  'card.civic_leader': 'Civic Leader',
  'card.policy': 'Policy',
  'card.level': 'Level:',
  'card.untitled': 'Untitled',

  // Theme names
  'theme.our_health': 'Our Health',
  'theme.our_families': 'Our Families',
  'theme.our_neighborhood': 'Our Neighborhood',
  'theme.our_voice': 'Our Voice',
  'theme.our_money': 'Our Money',
  'theme.our_planet': 'Our Planet',
  'theme.the_bigger_we': 'The Bigger We',

  // Center names
  'center.learning': 'Learning',
  'center.action': 'Action',
  'center.resource': 'Resource',
  'center.accountability': 'Accountability',

  // Super neighborhoods
  'superNeighborhoods.title': 'Explore Your Neighborhood',
  'superNeighborhoods.subtitle': 'Houston is divided into 88 super neighborhoods — community areas for civic engagement and resource planning.',
  'superNeighborhoods.intro': 'Click a boundary on the map or a card below to explore demographics, resources, and community information for each super neighborhood.',
  'superNeighborhoods.all_heading': 'All Super Neighborhoods',
  'superNeighborhoods.population': 'Population',
  'superNeighborhoods.median_income': 'Median Income',
  'superNeighborhoods.neighborhoods': 'Neighborhoods',
  'superNeighborhoods.services': 'Services',
  'superNeighborhoods.map': 'Map',
  'superNeighborhoods.services_area': 'Services in This Area',
  'superNeighborhoods.find_reps': 'Find your representatives',
  'superNeighborhoods.breadcrumb': 'Super Neighborhoods',

  // Guides
  'guides.title': 'Guides',
  'guides.subtitle': 'Step-by-step guides for civic engagement, voting, community organizing, and connecting with resources.',
  'guides.coming_soon': 'Guides coming soon.',
  'guides.focus_areas': 'Focus Areas',
  'guides.global_goals': 'Global Goals (SDGs)',
  'guides.social_determinants': 'Social Determinants',
  'guides.related_orgs': 'Related Organizations',
  'guides.opportunities': 'Opportunities',
  'guides.related_policies': 'Related Policies',
  'guides.related_articles': 'Related Articles',
  'guides.knowledge_map': 'Knowledge Map',
  'guides.source': 'Source',
  'guides.original_source': 'Original source',
  'guides.learn_more': 'Learn more',
  'guides.view_source': 'View on The Change Lab',

  // Learning paths
  'learn.title': 'Learning Paths',
  'learn.subtitle': 'Free self-guided journeys to deepen your understanding of community issues, civic engagement, and the systems that shape our lives.',
  'learn.paths': 'paths',
  'learn.modules': 'modules',
  'learn.min_content': 'min of content',
  'learn.coming_soon': 'Learning paths coming soon.',
  'learn.modules_heading': 'Modules',
  'learn.badge_earned': 'Badge Earned',
  'learn.previous_path': 'Previous path',
  'learn.next_path': 'Next path',
  'learn.related_focus': 'Related Focus Areas',
  'learn.sdg': 'Sustainable Development Goals',
  'learn.sdoh': 'Social Determinants of Health',
  'learn.related_opportunities': 'Related Opportunities',
  'learn.related_policies': 'Related Policies',
  'learn.related_guides': 'Related Guides',
  'learn.browse_guides': 'Browse all guides',
  'learn.more_paths': 'More Learning Paths',
  'learn.view_all': 'View all paths',
  'learn.prerequisite': 'Before starting this path, complete:',
  'learn.signup_cta': 'to track your progress and earn badges as you learn.',
  'learn.create_account': 'Create a free account',

  // Neighborhoods
  'neighborhoods.find_reps': 'Find your representatives',
  'neighborhoods.services_area': 'Services in Your Area',
  'neighborhoods.population': 'Population',
  'neighborhoods.median_income': 'Median Income',

  // Pathway detail extras
  'pathway.news_heading': 'News',
  'pathway.foundations_heading': 'Foundations',
  'pathway.foundations_subtitle': 'foundations supporting this pathway',

  // Library
  'library.title': 'Community Research Library',
  'library.subtitle': 'Explore research, reports, and community documents',
  'library.pages': 'pages',
  'library.search_placeholder': 'Search documents...',
  'library.searching': 'Searching...',
  'library.no_documents': 'No documents found',
  'library.chat_title': 'Ask the Library',
  'library.ask_about_doc': 'Ask About This Document',
  'library.chat_welcome': 'Ask a question about any topic in our community research library.',
  'library.chat_placeholder': 'Ask a question...',
  'library.new_conversation': 'New conversation',
  'library.sources': 'Sources',
  'library.drop_pdf': 'Drop a PDF here or click to browse',
  'library.max_size': 'PDF files up to 35MB',
  'library.doc_title': 'Document Title',
  'library.title_placeholder': 'Enter a title for this document',
  'library.doc_tags': 'Tags (comma separated)',
  'library.tags_placeholder': 'e.g. housing, health, education',
  'library.upload_success': 'Document uploaded successfully! It will be reviewed before publishing.',
  'library.uploading': 'Uploading...',
  'library.upload_btn': 'Upload Document',
  'library.nav': 'Research Library',

  // Voting Dashboard
  'voting.zip_placeholder': 'Enter your ZIP code',
  'voting.zip_button': 'Go',
  'voting.what_happened': 'What Just Happened',
  'voting.whats_coming': "What's Coming Up",
  'voting.whats_on_ballot': "What's on the Ballot",
  'voting.who_represents': 'Who Represents You',
  'voting.where_to_vote': 'Where to Vote',
  'voting.your_voice': 'Your Voice Matters',
  'voting.recent_results': 'Recent Results',
  'voting.register_cta': 'Register to Vote',
  'voting.mail_ballot': 'Request Mail Ballot',
  'voting.get_involved': 'Get Involved',
  'voting.enter_zip_officials': 'Enter your ZIP code above to see your representatives.',
  'voting.enter_zip_locations': 'Enter your ZIP code above to find voting locations near you.',
  'voting.no_upcoming_ballot': 'Ballot items for upcoming elections will appear here.',
  'voting.view_details': 'View full details',
  'voting.civic_timeline': 'Key Dates',
  'voting.days_until': 'days away',
  'voting.registration_open': 'Registration is open',
  'voting.runoff_heading': 'Races heading to runoff',

  // Compass
  'compass.title': 'The Compass',
  'compass.subtitle': 'Where am I, and what\'s around me?',
  'compass.tagline': 'Born in Houston. Built for Everyone.',
  'compass.show_all': 'Show me everything',
  'compass.understand': 'I want to understand something',
  'compass.help': 'I want to help',
  'compass.available': 'I want to find what\'s available',
  'compass.decides': 'I want to know who decides',
  'compass.made_with': 'Made with thoughtfulness',
  'compass.items': 'items',

  // Library nuggets
  'library.from_the': 'From the library',
  'library.read_more': 'Read more',
  'library.go_deeper': 'Go deeper',
  'library.understanding': 'Understanding this resource',

  // Wayfinder
  'wayfinder.title': 'Connected Through the Community',
  'wayfinder.understand': 'Understand',
  'wayfinder.get_involved': 'Get Involved',
  'wayfinder.go_deeper': 'Go Deeper',
  'wayfinder.donate': 'Donate',
  'wayfinder.volunteer': 'Volunteer',
  'wayfinder.subscribe': 'Subscribe',
  'wayfinder.call': 'Call',
  'wayfinder.visit': 'Visit',
  'wayfinder.register': 'Register',
  'wayfinder.time': 'Time',

  // Brand
  'brand.name': 'The Change Engine',
  'brand.subtitle': 'Community Exchange',
}

const es: Record<string, string> = {
  // Navigation
  'nav.pathways': 'Caminos',
  'nav.explore': 'Explorar',
  'nav.help': 'Recursos Disponibles',
  'nav.services': 'Recursos Locales',
  'nav.officials': 'Funcionarios',
  'nav.policies': 'Políticas',
  'nav.elections': 'Elecciones',
  'nav.library': 'Biblioteca',
  'nav.search_placeholder': 'Buscar...',
  'nav.zip_prompt': 'Comience con su código postal',

  // Footer
  'footer.explore': 'Explorar',
  'footer.about': 'Acerca de',
  'footer.pathways': 'Caminos',
  'footer.help': 'Recursos Disponibles',
  'footer.officials': 'Funcionarios',
  'footer.services': 'Servicios',
  'footer.elections': 'Centro Cívico',
  'footer.explore_link': 'Explorar',
  'footer.polling_places': 'Lugares de Votación',
  'footer.policies': 'Políticas',
  'footer.search': 'Buscar',
  'footer.privacy': 'Política de Privacidad',
  'footer.terms': 'Términos de Uso',
  'footer.accessibility': 'Accesibilidad',
  'footer.tagline': 'Una plataforma cívica que conecta a los residentes de Houston con recursos, servicios y oportunidades de participación cívica.',
  'footer.built_in': 'Hecho con cariño en Houston, TX',
  'support.button': 'Apoya Este Proyecto',

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
  'home.choose_path': 'Elige Tu Camino',
  'home.choose_subtitle': 'Cada viaje por la vida comunitaria comienza con una pregunta',
  'home.begin_here': 'Comience aquí',
  'home.see_all': 'Ver todos',
  'hero.title_line1': 'Tu Comunidad,',
  'hero.title_line2': 'Tu Elección',
  'hero.scroll_prompt': '¿Por dónde le gustaría comenzar?',

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
  'help.intro': 'Sin importar lo que enfrente, Houston tiene recursos listos para usted. Busque por urgencia o situación de vida para encontrar apoyo, servicios y próximos pasos.',

  // Services page
  'services.title': 'Servicios',
  'services.subtitle': 'Encuentre servicios comunitarios y organizaciones de apoyo en el área de Houston.',
  'services.intro': 'Houston cuenta con una amplia red de servicios y organizaciones dedicadas a su bienestar. Busque por categoría, por necesidad o explore el mapa para encontrar lo que está cerca de usted.',

  // Officials page
  'officials.title': 'Funcionarios Electos',
  'officials.subtitle': 'Encuentre y contacte a sus representantes electos en todos los niveles de gobierno.',

  // Lookup page
  'lookup.address_or_zip': 'Ingrese su dirección o código postal',
  'lookup.showing_results': 'Mostrando resultados para',
  'lookup.essential_services': 'Servicios Esenciales',
  'lookup.emergency': 'Emergencia',
  'lookup.police': 'Policía y Orden Público',
  'lookup.fire': 'Bomberos y Servicios de Emergencia',
  'lookup.medical': 'Salud y Servicios Médicos',
  'lookup.parks': 'Parques y Recreación',
  'lookup.library': 'Bibliotecas',
  'lookup.utilities': 'Servicios Públicos',
  'lookup.your_representatives': 'Sus Representantes',
  'lookup.call': 'Llamar',

  // Elections page
  'elections.title': 'Elecciones y Votación',
  'elections.subtitle': 'Conozca qué hay en su boleta y dónde votar.',
  'elections.intro': 'Su voto es su voz. Encuentre próximas elecciones, conozca a los candidatos, verifique las fechas límite de registro y localice su lugar de votación.',
  'elections.upcoming': 'Próximas Elecciones',
  'elections.past': 'Elecciones Anteriores',
  'elections.turnout': 'Participación:',
  'elections.results_certified': 'Resultados certificados',

  // Civic Hub
  'civicHub.title': 'Su Centro Cívico',
  'civicHub.subtitle': 'Explore sus funcionarios electos, políticas y elecciones en todos los niveles de gobierno.',
  'civicHub.representatives': 'Sus Representantes',
  'civicHub.policies': 'Políticas y Legislación',
  'civicHub.elections': 'Elecciones y Votación',
  'civicHub.no_officials': 'Aún no hay funcionarios listados en este nivel.',
  'civicHub.no_policies': 'Aún no se rastrean políticas en este nivel.',
  'civicHub.no_elections': 'No hay elecciones programadas en este nivel.',
  'civicHub.search_officials': 'Buscar funcionarios...',
  'civicHub.view_all_officials': 'Ver todos los funcionarios',
  'civicHub.view_all_policies': 'Ver todas las políticas',

  // Geography / Map View page
  'geo.title': 'Vista del Mapa',
  'geo.subtitle': 'Explore Su Comunidad',
  'geo.select_super': 'Seleccione un super vecindario',
  'geo.select_neighborhood': 'Seleccione un vecindario',
  'geo.map_layers': 'Capas del Mapa',
  'geo.services_nearby': 'Servicios Cercanos',
  'geo.officials_here': 'Funcionarios que Representan Esta Área',
  'geo.organizations_here': 'Organizaciones en Esta Área',
  'geo.policies_impacting': 'Políticas que Impactan Esta Área',
  'geo.census_info': 'Censo y Demografía',
  'geo.no_selection': 'Ingrese un código postal o seleccione un vecindario para explorar su comunidad.',
  'geo.explore_prompt': 'Comience explorando ingresando su código postal o eligiendo un super vecindario arriba.',
  'geo.filter_markers': 'Filtrar Marcadores',
  'geo.show_all_layers': 'Mostrar Todo',
  'geo.hide_all_layers': 'Ocultar Todo',
  'geo.click_to_explore': 'Active una capa de límites, luego haga clic en cualquier área para explorar',
  'geo.loading_content': 'Cargando contenido cercano...',
  'geo.exploring': 'Explorando',
  'geo.all_pathways': 'Todos',
  'geo.filter_by_pathway': 'Filtrar por camino',

  // Explore page
  'explore.title': 'Explorar Temas',
  'explore.subtitle_prefix': 'Explore',
  'explore.subtitle_middle': 'áreas de enfoque en',
  'explore.subtitle_suffix': 'caminos. Filtre por Objetivo de Desarrollo Sostenible o Determinante Social de la Salud.',
  'explore.intro': 'Cada tema se conecta con algo más grande. Explore áreas de enfoque en los siete caminos, filtre por metas globales y descubra cómo los problemas comunitarios se interrelacionan.',

  // Pathways page
  'pathways.title': 'Siete Caminos',
  'pathways.subtitle': 'Explore la vida comunitaria a través de siete temas interconectados.',
  'pathway.centers_title': 'Cuatro Formas de Participar',
  'pathway.focus_areas_title': 'Explorar Temas',
  'pathway.content_title': 'Recursos y Contenido',

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
  'search.intro': 'Explore todo lo que The Change Engine ha reunido para Houston — desde artículos y servicios hasta funcionarios electos y organizaciones comunitarias.',

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

  // Wayfinder homepage
  'wayfinder.the': 'El',
  'wayfinder.community': 'Intercambio',
  'wayfinder.exchange': 'Comunitario',
  'wayfinder.hero_subtitle': 'Todo está conectado. Explora 7 caminos de vida cívica.',
  'wayfinder.tap_hint': 'Toca cualquier círculo para explorar un camino',
  'wayfinder.start_journey': 'Comienza Tu Camino',
  'wayfinder.explore': 'Explorar',
  'wayfinder.browse_all': 'Ver todos los caminos',
  'wayfinder.explore_houston': 'Explorar Houston',
  'wayfinder.whats_new': 'Novedades',
  'wayfinder.this_week': 'esta semana',
  'wayfinder.connected_to': 'Conectado a',
  'wayfinder.pathway_desc': 'recursos de participación, servicios, políticas y vida cívica',
  'wayfinder.footer': 'El Intercambio Comunitario — un producto de The Change Engine',

  // Life situations
  'life.food_access': 'Acceso a Alimentos',
  'life.housing_shelter': 'Vivienda y Refugio',
  'life.career_employment': 'Carrera y Empleo',
  'life.health_wellness': 'Salud y Bienestar',
  'life.safety_protection': 'Seguridad y Protección',
  'life.financial_stability': 'Estabilidad Financiera',

  // Sidebar
  'sidebar.home': 'Inicio',
  'sidebar.edition': 'Edición',
  'sidebar.change': 'cambiar',
  'sidebar.go': 'Ir',
  'sidebar.explore_houston': 'Explorar Houston',
  'sidebar.your_guide': 'Tu Guía',
  'sidebar.elections': 'Elecciones y Votación',
  'sidebar.library': 'Biblioteca',
  'sidebar.chat': 'Habla con Chance',
  'sidebar.topics': 'Temas',
  'sidebar.no_topics': 'No hay temas disponibles',

  // Chat with Chance
  'chat.title': 'Habla con Chance',
  'chat.subtitle': 'Tu guía del vecindario',
  'chat.welcome_title': 'Conoce a Chance',
  'chat.placeholder': 'Pregúntale a Chance sobre Houston...',

  // Your Guide links
  'discover.guide': 'La Guía Comunitaria',
  'discover.local_resources': 'Recursos Locales',
  'discover.officials': 'Funcionarios Electos',
  'discover.policy': 'Políticas y Legislación',
  'discover.guides': 'Guías y Artículos',
  'discover.available_resources': 'Recursos Disponibles',
  'discover.topics': 'Explorar Temas',
  'discover.learning': 'Rutas de Aprendizaje',
  'discover.geography': 'Geografía',
  'discover.map_view': 'Vista del Mapa',
  'discover.foundations': 'Fundaciones',

  // Guide page
  'guide.masthead': 'El Intercambio Comunitario',
  'guide.tagline': 'Vida Comunitaria, Organizada',
  'guide.volume': 'Vol. I',
  'guide.spotlight': 'En el Centro de Atención',
  'guide.spotlight_subtitle': 'Las últimas historias de toda la comunidad',
  'guide.civic_desk': 'Mesa Cívica',
  'guide.civic_subtitle': 'Elecciones, funcionarios y actualizaciones de políticas',
  'guide.your_neighborhood': 'Tu Vecindario',
  'guide.neighborhood_subtitle': 'Servicios y recursos cerca de ti',
  'guide.neighborhood_prompt': 'Ingresa tu código postal para ver recursos locales',
  'guide.learn_grow': 'Aprende y Crece',
  'guide.learn_subtitle': 'Rutas de aprendizaje y guías para ampliar tu conocimiento',
  'guide.life_houston': 'La Vida en Houston',
  'guide.life_subtitle': 'Recursos para cada situación',
  'guide.bigger_picture': 'El Panorama General',
  'guide.sdg_heading': 'Objetivos de Desarrollo Sostenible',
  'guide.sdoh_heading': 'Determinantes Sociales de la Salud',
  'guide.seven_pathways': 'Siete Caminos',
  'guide.pathways_subtitle': 'Tu guía de temas comunitarios',
  'guide.featured': 'Destacado',
  'guide.new_this_week': 'Nuevo Esta Semana',
  'guide.search_placeholder': 'Buscar en la guía...',
  'guide.quick_links': 'Enlaces Rápidos',
  'guide.all_pathways': 'Todos los Caminos',
  'guide.days_until_election': 'días hasta las elecciones',
  'guide.view_all': 'Ver Todo',

  // Feed filters
  'feed.all': 'Todos',
  'feed.learning': 'Aprendizaje',
  'feed.action': 'Acción',
  'feed.resource': 'Recurso',
  'feed.accountability': 'Responsabilidad',
  'feed.no_items': 'Ningún elemento coincide con el filtro actual',
  'feed.try_different': 'Intente seleccionar una categoría diferente',

  // Card labels
  'card.explore': 'Explorar',
  'card.open': 'Abrir',
  'card.civic_leader': 'Líder Cívico',
  'card.policy': 'Política',
  'card.level': 'Nivel:',
  'card.untitled': 'Sin título',

  // Theme names
  'theme.our_health': 'Nuestra Salud',
  'theme.our_families': 'Nuestras Familias',
  'theme.our_neighborhood': 'Nuestro Vecindario',
  'theme.our_voice': 'Nuestra Voz',
  'theme.our_money': 'Nuestro Dinero',
  'theme.our_planet': 'Nuestro Planeta',
  'theme.the_bigger_we': 'El Nosotros Mayor',

  // Center names
  'center.learning': 'Aprendizaje',
  'center.action': 'Acción',
  'center.resource': 'Recurso',
  'center.accountability': 'Responsabilidad',

  // Super neighborhoods
  'superNeighborhoods.title': 'Explore Su Vecindario',
  'superNeighborhoods.subtitle': 'Houston está dividido en 88 súper vecindarios — áreas comunitarias para participación cívica y planificación de recursos.',
  'superNeighborhoods.intro': 'Haga clic en un límite del mapa o en una tarjeta para explorar datos demográficos, recursos e información comunitaria de cada súper vecindario.',
  'superNeighborhoods.all_heading': 'Todos los Súper Vecindarios',
  'superNeighborhoods.population': 'Población',
  'superNeighborhoods.median_income': 'Ingreso Medio',
  'superNeighborhoods.neighborhoods': 'Vecindarios',
  'superNeighborhoods.services': 'Servicios',
  'superNeighborhoods.map': 'Mapa',
  'superNeighborhoods.services_area': 'Servicios en Esta Área',
  'superNeighborhoods.find_reps': 'Encuentre a sus representantes',
  'superNeighborhoods.breadcrumb': 'Súper Vecindarios',

  // Guides
  'guides.title': 'Guías',
  'guides.subtitle': 'Guías paso a paso para participación cívica, votación, organización comunitaria y conexión con recursos.',
  'guides.coming_soon': 'Guías próximamente.',
  'guides.focus_areas': 'Áreas de Enfoque',
  'guides.global_goals': 'Metas Globales (ODS)',
  'guides.social_determinants': 'Determinantes Sociales',
  'guides.related_orgs': 'Organizaciones Relacionadas',
  'guides.opportunities': 'Oportunidades',
  'guides.related_policies': 'Políticas Relacionadas',
  'guides.related_articles': 'Artículos Relacionados',
  'guides.knowledge_map': 'Mapa de Conocimiento',
  'guides.source': 'Fuente',
  'guides.original_source': 'Fuente original',
  'guides.learn_more': 'Más información',
  'guides.view_source': 'Ver en The Change Lab',

  // Learning paths
  'learn.title': 'Rutas de Aprendizaje',
  'learn.subtitle': 'Recorridos autoguiados gratuitos para profundizar su comprensión de los problemas comunitarios, la participación cívica y los sistemas que dan forma a nuestras vidas.',
  'learn.paths': 'rutas',
  'learn.modules': 'módulos',
  'learn.min_content': 'min de contenido',
  'learn.coming_soon': 'Rutas de aprendizaje próximamente.',
  'learn.modules_heading': 'Módulos',
  'learn.badge_earned': 'Insignia Obtenida',
  'learn.previous_path': 'Ruta anterior',
  'learn.next_path': 'Siguiente ruta',
  'learn.related_focus': 'Áreas de Enfoque Relacionadas',
  'learn.sdg': 'Objetivos de Desarrollo Sostenible',
  'learn.sdoh': 'Determinantes Sociales de la Salud',
  'learn.related_opportunities': 'Oportunidades Relacionadas',
  'learn.related_policies': 'Políticas Relacionadas',
  'learn.related_guides': 'Guías Relacionadas',
  'learn.browse_guides': 'Ver todas las guías',
  'learn.more_paths': 'Más Rutas de Aprendizaje',
  'learn.view_all': 'Ver todas las rutas',
  'learn.prerequisite': 'Antes de comenzar esta ruta, complete:',
  'learn.signup_cta': 'para seguir su progreso y obtener insignias mientras aprende.',
  'learn.create_account': 'Cree una cuenta gratuita',

  // Neighborhoods
  'neighborhoods.find_reps': 'Encuentre a sus representantes',
  'neighborhoods.services_area': 'Servicios en Su Área',
  'neighborhoods.population': 'Población',
  'neighborhoods.median_income': 'Ingreso Medio',

  // Pathway detail extras
  'pathway.news_heading': 'Noticias',
  'pathway.foundations_heading': 'Fundaciones',
  'pathway.foundations_subtitle': 'fundaciones que apoyan este camino',

  // Library
  'library.title': 'Biblioteca de Investigación Comunitaria',
  'library.subtitle': 'Explore investigaciones, informes y documentos comunitarios',
  'library.pages': 'páginas',
  'library.search_placeholder': 'Buscar documentos...',
  'library.searching': 'Buscando...',
  'library.no_documents': 'No se encontraron documentos',
  'library.chat_title': 'Pregunte a la Biblioteca',
  'library.ask_about_doc': 'Preguntar Sobre Este Documento',
  'library.chat_welcome': 'Haga una pregunta sobre cualquier tema en nuestra biblioteca de investigación comunitaria.',
  'library.chat_placeholder': 'Haga una pregunta...',
  'library.new_conversation': 'Nueva conversación',
  'library.sources': 'Fuentes',
  'library.drop_pdf': 'Suelte un PDF aquí o haga clic para buscar',
  'library.max_size': 'Archivos PDF hasta 35MB',
  'library.doc_title': 'Título del Documento',
  'library.title_placeholder': 'Ingrese un título para este documento',
  'library.doc_tags': 'Etiquetas (separadas por comas)',
  'library.tags_placeholder': 'ej. vivienda, salud, educación',
  'library.upload_success': '¡Documento subido exitosamente! Será revisado antes de publicar.',
  'library.uploading': 'Subiendo...',
  'library.upload_btn': 'Subir Documento',
  'library.nav': 'Biblioteca de Investigación',

  // Voting Dashboard
  'voting.zip_placeholder': 'Ingrese su código postal',
  'voting.zip_button': 'Ir',
  'voting.what_happened': 'Lo Que Acaba de Pasar',
  'voting.whats_coming': 'Lo Que Viene',
  'voting.whats_on_ballot': 'Qué Hay en la Boleta',
  'voting.who_represents': 'Quién Te Representa',
  'voting.where_to_vote': 'Dónde Votar',
  'voting.your_voice': 'Tu Voz Importa',
  'voting.recent_results': 'Resultados Recientes',
  'voting.register_cta': 'Regístrese para Votar',
  'voting.mail_ballot': 'Solicitar Boleta por Correo',
  'voting.get_involved': 'Participe',
  'voting.enter_zip_officials': 'Ingrese su código postal arriba para ver sus representantes.',
  'voting.enter_zip_locations': 'Ingrese su código postal arriba para encontrar lugares de votación cercanos.',
  'voting.no_upcoming_ballot': 'Los artículos en la boleta para próximas elecciones aparecerán aquí.',
  'voting.view_details': 'Ver detalles completos',
  'voting.civic_timeline': 'Fechas Clave',
  'voting.days_until': 'días restantes',
  'voting.registration_open': 'El registro está abierto',
  'voting.runoff_heading': 'Carreras que van a segunda vuelta',

  // Compass
  'compass.title': 'La Brújula',
  'compass.subtitle': '¿Dónde estoy y qué hay a mi alrededor?',
  'compass.tagline': 'Nacido en Houston. Hecho para todos.',
  'compass.show_all': 'Mostrar todo',
  'compass.understand': 'Quiero entender algo',
  'compass.help': 'Quiero ayudar',
  'compass.available': 'Quiero encontrar lo que hay disponible',
  'compass.decides': 'Quiero saber quién decide',
  'compass.made_with': 'Hecho con consideración',
  'compass.items': 'elementos',

  // Library nuggets
  'library.from_the': 'De la biblioteca',
  'library.read_more': 'Leer más',
  'library.go_deeper': 'Profundizar',
  'library.understanding': 'Entendiendo este recurso',

  // Wayfinder
  'wayfinder.title': 'Conectados a Través de la Comunidad',
  'wayfinder.understand': 'Comprender',
  'wayfinder.get_involved': 'Participar',
  'wayfinder.go_deeper': 'Profundizar',
  'wayfinder.donate': 'Donar',
  'wayfinder.volunteer': 'Voluntariado',
  'wayfinder.subscribe': 'Suscribirse',
  'wayfinder.call': 'Llamar',
  'wayfinder.visit': 'Visitar',
  'wayfinder.register': 'Registrarse',
  'wayfinder.time': 'Tiempo',

  // Brand
  'brand.name': 'The Change Engine',
  'brand.subtitle': 'Intercambio Comunitario',
}

const vi: Record<string, string> = {
  // Navigation
  'nav.pathways': 'Lộ Trình',
  'nav.explore': 'Khám Phá',
  'nav.help': 'Tài Nguyên Có Sẵn',
  'nav.services': 'Tài Nguyên Địa Phương',
  'nav.officials': 'Quan Chức',
  'nav.policies': 'Chính Sách',
  'nav.elections': 'Bầu Cử',
  'nav.library': 'Thư Viện',
  'nav.search_placeholder': 'Tìm kiếm...',
  'nav.zip_prompt': 'Bắt đầu với mã bưu điện',

  // Footer
  'footer.explore': 'Khám Phá',
  'footer.about': 'Giới Thiệu',
  'footer.pathways': 'Lộ Trình',
  'footer.help': 'Tài Nguyên Có Sẵn',
  'footer.officials': 'Quan Chức',
  'footer.services': 'Dịch Vụ',
  'footer.elections': 'Trung Tâm Dân Sự',
  'footer.explore_link': 'Khám Phá',
  'footer.polling_places': 'Địa Điểm Bỏ Phiếu',
  'footer.policies': 'Chính Sách',
  'footer.search': 'Tìm Kiếm',
  'footer.privacy': 'Chính Sách Bảo Mật',
  'footer.terms': 'Điều Khoản Sử Dụng',
  'footer.accessibility': 'Trợ Năng',
  'footer.tagline': 'Nền tảng dân sự kết nối cư dân Houston với tài nguyên, dịch vụ và cơ hội tham gia cộng đồng.',
  'footer.built_in': 'Được xây dựng tận tâm tại Houston, TX',
  'support.button': 'Ủng Hộ Dự Án',

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
  'home.choose_path': 'Chọn Con Đường Của Bạn',
  'home.choose_subtitle': 'Mỗi hành trình qua đời sống cộng đồng bắt đầu bằng một câu hỏi',
  'home.begin_here': 'Bắt đầu tại đây',
  'home.see_all': 'Xem tất cả',
  'hero.title_line1': 'Cộng Đồng Của Bạn,',
  'hero.title_line2': 'Sự Lựa Chọn Của Bạn',
  'hero.scroll_prompt': 'Bạn muốn bắt đầu từ đâu?',

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
  'help.intro': 'Dù bạn đang đối mặt với điều gì, Houston có tài nguyên sẵn sàng cho bạn. Duyệt theo mức độ khẩn cấp hoặc tình huống cuộc sống để tìm hỗ trợ, dịch vụ và bước tiếp theo.',

  // Services page
  'services.title': 'Dịch Vụ',
  'services.subtitle': 'Tìm dịch vụ cộng đồng và tổ chức hỗ trợ trong khu vực Houston.',
  'services.intro': 'Houston có mạng lưới dịch vụ và tổ chức sâu rộng dành cho sức khỏe của bạn. Duyệt theo danh mục, tìm theo nhu cầu, hoặc khám phá bản đồ để tìm những gì gần bạn.',

  // Officials page
  'officials.title': 'Quan Chức Dân Cử',
  'officials.subtitle': 'Tìm và liên hệ đại diện dân cử của bạn ở mọi cấp chính quyền.',

  // Lookup page
  'lookup.address_or_zip': 'Nhập địa chỉ hoặc mã bưu điện của bạn',
  'lookup.showing_results': 'Hiển thị kết quả cho',
  'lookup.essential_services': 'Dịch Vụ Thiết Yếu',
  'lookup.emergency': 'Khẩn Cấp',
  'lookup.police': 'Cảnh Sát và Thực Thi Pháp Luật',
  'lookup.fire': 'Cứu Hỏa và Cấp Cứu',
  'lookup.medical': 'Y Tế và Sức Khỏe',
  'lookup.parks': 'Công Viên và Giải Trí',
  'lookup.library': 'Thư Viện',
  'lookup.utilities': 'Tiện Ích Công Cộng',
  'lookup.your_representatives': 'Đại Diện Của Bạn',
  'lookup.call': 'Gọi',

  // Elections page
  'elections.title': 'Bầu Cử & Bỏ Phiếu',
  'elections.subtitle': 'Biết những gì trên lá phiếu và nơi bỏ phiếu.',
  'elections.intro': 'Lá phiếu của bạn là tiếng nói của bạn. Tìm các cuộc bầu cử sắp tới, tìm hiểu về ứng cử viên, kiểm tra hạn đăng ký và tìm địa điểm bỏ phiếu của bạn.',
  'elections.upcoming': 'Bầu Cử Sắp Tới',
  'elections.past': 'Bầu Cử Trước Đây',
  'elections.turnout': 'Tỷ lệ tham gia:',
  'elections.results_certified': 'Kết quả đã chứng nhận',

  // Civic Hub
  'civicHub.title': 'Trung Tâm Dân Sự',
  'civicHub.subtitle': 'Khám phá quan chức dân cử, chính sách và bầu cử ở mọi cấp chính quyền.',
  'civicHub.representatives': 'Đại Diện Của Bạn',
  'civicHub.policies': 'Chính Sách & Luật Pháp',
  'civicHub.elections': 'Bầu Cử & Bỏ Phiếu',
  'civicHub.no_officials': 'Chưa có quan chức nào được liệt kê ở cấp này.',
  'civicHub.no_policies': 'Chưa có chính sách nào được theo dõi ở cấp này.',
  'civicHub.no_elections': 'Chưa có bầu cử nào được lên lịch ở cấp này.',
  'civicHub.search_officials': 'Tìm quan chức...',
  'civicHub.view_all_officials': 'Xem tất cả quan chức',
  'civicHub.view_all_policies': 'Xem tất cả chính sách',

  // Geography / Map View page
  'geo.title': 'Chế Độ Xem Bản Đồ',
  'geo.subtitle': 'Khám Phá Cộng Đồng Của Bạn',
  'geo.select_super': 'Chọn một siêu khu phố',
  'geo.select_neighborhood': 'Chọn một khu phố',
  'geo.map_layers': 'Lớp Bản Đồ',
  'geo.services_nearby': 'Dịch Vụ Gần Đây',
  'geo.officials_here': 'Quan Chức Đại Diện Khu Vực Này',
  'geo.organizations_here': 'Tổ Chức Trong Khu Vực Này',
  'geo.policies_impacting': 'Chính Sách Ảnh Hưởng Khu Vực Này',
  'geo.census_info': 'Điều Tra Dân Số & Nhân Khẩu Học',
  'geo.no_selection': 'Nhập mã bưu điện hoặc chọn một khu phố để khám phá cộng đồng của bạn.',
  'geo.explore_prompt': 'Bắt đầu khám phá bằng cách nhập mã bưu điện hoặc chọn một siêu khu phố ở trên.',
  'geo.filter_markers': 'Lọc Điểm Đánh Dấu',
  'geo.show_all_layers': 'Hiện Tất Cả',
  'geo.hide_all_layers': 'Ẩn Tất Cả',
  'geo.click_to_explore': 'Bật một lớp ranh giới, sau đó nhấp vào bất kỳ khu vực nào để khám phá',
  'geo.loading_content': 'Đang tải nội dung gần đây...',
  'geo.exploring': 'Đang khám phá',
  'geo.all_pathways': 'Tất cả',
  'geo.filter_by_pathway': 'Lọc theo lộ trình',

  // Explore page
  'explore.title': 'Khám Phá Chủ Đề',
  'explore.subtitle_prefix': 'Duyệt qua',
  'explore.subtitle_middle': 'lĩnh vực trọng tâm trong',
  'explore.subtitle_suffix': 'lộ trình. Lọc theo Mục Tiêu Phát Triển Bền Vững hoặc Yếu Tố Xã Hội Quyết Định Sức Khỏe.',
  'explore.intro': 'Mỗi chủ đề kết nối với điều lớn hơn. Duyệt các lĩnh vực trọng tâm trong cả bảy lộ trình, lọc theo mục tiêu toàn cầu và khám phá cách các vấn đề cộng đồng liên quan với nhau.',

  // Pathways page
  'pathways.title': 'Bảy Lộ Trình',
  'pathways.subtitle': 'Khám phá đời sống cộng đồng qua bảy chủ đề kết nối.',
  'pathway.centers_title': 'Bốn Cách Tham Gia',
  'pathway.focus_areas_title': 'Khám Phá Chủ Đề',
  'pathway.content_title': 'Tài Nguyên & Nội Dung',

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
  'search.intro': 'Khám phá mọi thứ The Change Engine đã thu thập cho Houston — từ bài viết và dịch vụ đến quan chức dân cử và tổ chức cộng đồng.',

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

  // Wayfinder homepage
  'wayfinder.the': 'The',
  'wayfinder.community': 'Trao Đổi',
  'wayfinder.exchange': 'Cộng Đồng',
  'wayfinder.hero_subtitle': 'Mọi thứ kết nối. Khám phá 7 lộ trình đời sống dân sự.',
  'wayfinder.tap_hint': 'Chạm vào vòng tròn để khám phá lộ trình',
  'wayfinder.start_journey': 'Bắt Đầu Hành Trình',
  'wayfinder.explore': 'Khám Phá',
  'wayfinder.browse_all': 'Xem tất cả lộ trình',
  'wayfinder.explore_houston': 'Khám Phá Houston',
  'wayfinder.whats_new': 'Tin Mới',
  'wayfinder.this_week': 'tuần này',
  'wayfinder.connected_to': 'Kết nối với',
  'wayfinder.pathway_desc': 'tài nguyên về tham gia, dịch vụ, chính sách & đời sống dân sự',
  'wayfinder.footer': 'Trao Đổi Cộng Đồng — sản phẩm của The Change Engine',

  // Life situations
  'life.food_access': 'Tiếp Cận Thực Phẩm',
  'life.housing_shelter': 'Nhà Ở & Nơi Trú Ẩn',
  'life.career_employment': 'Nghề Nghiệp & Việc Làm',
  'life.health_wellness': 'Sức Khỏe & Thể Chất',
  'life.safety_protection': 'An Toàn & Bảo Vệ',
  'life.financial_stability': 'Ổn Định Tài Chính',

  // Sidebar
  'sidebar.home': 'Trang Chủ',
  'sidebar.edition': 'Phiên Bản',
  'sidebar.change': 'đổi',
  'sidebar.go': 'Đi',
  'sidebar.explore_houston': 'Khám Phá Houston',
  'sidebar.your_guide': 'Hướng Dẫn',
  'sidebar.elections': 'Bầu Cử & Bỏ Phiếu',
  'sidebar.library': 'Thư Viện',
  'sidebar.chat': 'Trò Chuyện với Chance',
  'sidebar.topics': 'Chủ Đề',
  'sidebar.no_topics': 'Không có chủ đề',

  // Chat with Chance
  'chat.title': 'Trò Chuyện với Chance',
  'chat.subtitle': 'Hướng dẫn viên khu phố',
  'chat.welcome_title': 'Gặp Chance',
  'chat.placeholder': 'Hỏi Chance về Houston...',

  // Your Guide links
  'discover.guide': 'Hướng Dẫn Cộng Đồng',
  'discover.local_resources': 'Tài Nguyên Địa Phương',
  'discover.officials': 'Quan Chức Dân Cử',
  'discover.policy': 'Chính Sách & Luật Pháp',
  'discover.guides': 'Hướng Dẫn & Bài Viết',
  'discover.available_resources': 'Tài Nguyên Có Sẵn',
  'discover.topics': 'Khám Phá Chủ Đề',
  'discover.learning': 'Lộ Trình Học Tập',
  'discover.geography': 'Địa Lý',
  'discover.map_view': 'Chế Độ Xem Bản Đồ',
  'discover.foundations': 'Tổ Chức Từ Thiện',

  // Guide page
  'guide.masthead': 'Sàn Giao Dịch Cộng Đồng',
  'guide.tagline': 'Đời Sống Cộng Đồng, Có Tổ Chức',
  'guide.volume': 'Tập I',
  'guide.spotlight': 'Tiêu Điểm',
  'guide.spotlight_subtitle': 'Những câu chuyện mới nhất từ cộng đồng',
  'guide.civic_desk': 'Bàn Công Dân',
  'guide.civic_subtitle': 'Bầu cử, quan chức và cập nhật chính sách',
  'guide.your_neighborhood': 'Khu Phố Của Bạn',
  'guide.neighborhood_subtitle': 'Dịch vụ và tài nguyên gần bạn',
  'guide.neighborhood_prompt': 'Nhập mã ZIP để xem tài nguyên địa phương',
  'guide.learn_grow': 'Học Hỏi & Phát Triển',
  'guide.learn_subtitle': 'Lộ trình học tập và hướng dẫn để mở rộng kiến thức',
  'guide.life_houston': 'Cuộc Sống Ở Houston',
  'guide.life_subtitle': 'Tài nguyên cho mọi tình huống',
  'guide.bigger_picture': 'Bức Tranh Lớn',
  'guide.sdg_heading': 'Mục Tiêu Phát Triển Bền Vững',
  'guide.sdoh_heading': 'Yếu Tố Xã Hội Quyết Định Sức Khỏe',
  'guide.seven_pathways': 'Bảy Con Đường',
  'guide.pathways_subtitle': 'Hướng dẫn về các chủ đề cộng đồng',
  'guide.featured': 'Nổi Bật',
  'guide.new_this_week': 'Mới Tuần Này',
  'guide.search_placeholder': 'Tìm kiếm trong hướng dẫn...',
  'guide.quick_links': 'Liên Kết Nhanh',
  'guide.all_pathways': 'Tất Cả Con Đường',
  'guide.days_until_election': 'ngày đến bầu cử',
  'guide.view_all': 'Xem Tất Cả',

  // Feed filters
  'feed.all': 'Tất Cả',
  'feed.learning': 'Học Tập',
  'feed.action': 'Hành Động',
  'feed.resource': 'Tài Nguyên',
  'feed.accountability': 'Trách Nhiệm',
  'feed.no_items': 'Không có mục nào phù hợp với bộ lọc',
  'feed.try_different': 'Thử chọn danh mục khác ở trên',

  // Card labels
  'card.explore': 'Khám Phá',
  'card.open': 'Mở',
  'card.civic_leader': 'Lãnh Đạo Dân Sự',
  'card.policy': 'Chính Sách',
  'card.level': 'Cấp:',
  'card.untitled': 'Không có tiêu đề',

  // Theme names
  'theme.our_health': 'Sức Khỏe',
  'theme.our_families': 'Gia Đình',
  'theme.our_neighborhood': 'Khu Phố',
  'theme.our_voice': 'Tiếng Nói',
  'theme.our_money': 'Tài Chính',
  'theme.our_planet': 'Hành Tinh',
  'theme.the_bigger_we': 'Cộng Đồng Lớn',

  // Center names
  'center.learning': 'Học Tập',
  'center.action': 'Hành Động',
  'center.resource': 'Tài Nguyên',
  'center.accountability': 'Trách Nhiệm',

  // Super neighborhoods
  'superNeighborhoods.title': 'Khám Phá Khu Phố Của Bạn',
  'superNeighborhoods.subtitle': 'Houston được chia thành 88 siêu khu phố — khu vực cộng đồng cho tham gia dân sự và lập kế hoạch tài nguyên.',
  'superNeighborhoods.intro': 'Nhấp vào ranh giới trên bản đồ hoặc thẻ bên dưới để khám phá nhân khẩu học, tài nguyên và thông tin cộng đồng cho mỗi siêu khu phố.',
  'superNeighborhoods.all_heading': 'Tất Cả Siêu Khu Phố',
  'superNeighborhoods.population': 'Dân Số',
  'superNeighborhoods.median_income': 'Thu Nhập Trung Bình',
  'superNeighborhoods.neighborhoods': 'Khu Phố',
  'superNeighborhoods.services': 'Dịch Vụ',
  'superNeighborhoods.map': 'Bản Đồ',
  'superNeighborhoods.services_area': 'Dịch Vụ Trong Khu Vực',
  'superNeighborhoods.find_reps': 'Tìm đại diện của bạn',
  'superNeighborhoods.breadcrumb': 'Siêu Khu Phố',

  // Guides
  'guides.title': 'Hướng Dẫn',
  'guides.subtitle': 'Hướng dẫn từng bước cho tham gia dân sự, bỏ phiếu, tổ chức cộng đồng và kết nối với tài nguyên.',
  'guides.coming_soon': 'Hướng dẫn sắp có.',
  'guides.focus_areas': 'Lĩnh Vực Trọng Tâm',
  'guides.global_goals': 'Mục Tiêu Toàn Cầu (SDGs)',
  'guides.social_determinants': 'Yếu Tố Xã Hội',
  'guides.related_orgs': 'Tổ Chức Liên Quan',
  'guides.opportunities': 'Cơ Hội',
  'guides.related_policies': 'Chính Sách Liên Quan',
  'guides.related_articles': 'Bài Viết Liên Quan',
  'guides.knowledge_map': 'Bản Đồ Kiến Thức',
  'guides.source': 'Nguồn',
  'guides.original_source': 'Nguồn gốc',
  'guides.learn_more': 'Tìm hiểu thêm',
  'guides.view_source': 'Xem trên The Change Lab',

  // Learning paths
  'learn.title': 'Lộ Trình Học Tập',
  'learn.subtitle': 'Hành trình tự hướng dẫn miễn phí để hiểu sâu hơn về các vấn đề cộng đồng, tham gia dân sự và hệ thống định hình cuộc sống.',
  'learn.paths': 'lộ trình',
  'learn.modules': 'mô-đun',
  'learn.min_content': 'phút nội dung',
  'learn.coming_soon': 'Lộ trình học tập sắp có.',
  'learn.modules_heading': 'Mô-đun',
  'learn.badge_earned': 'Huy Hiệu Đạt Được',
  'learn.previous_path': 'Lộ trình trước',
  'learn.next_path': 'Lộ trình tiếp',
  'learn.related_focus': 'Lĩnh Vực Trọng Tâm Liên Quan',
  'learn.sdg': 'Mục Tiêu Phát Triển Bền Vững',
  'learn.sdoh': 'Yếu Tố Xã Hội Quyết Định Sức Khỏe',
  'learn.related_opportunities': 'Cơ Hội Liên Quan',
  'learn.related_policies': 'Chính Sách Liên Quan',
  'learn.related_guides': 'Hướng Dẫn Liên Quan',
  'learn.browse_guides': 'Xem tất cả hướng dẫn',
  'learn.more_paths': 'Thêm Lộ Trình Học Tập',
  'learn.view_all': 'Xem tất cả lộ trình',
  'learn.prerequisite': 'Trước khi bắt đầu lộ trình này, hãy hoàn thành:',
  'learn.signup_cta': 'để theo dõi tiến trình và nhận huy hiệu khi học.',
  'learn.create_account': 'Tạo tài khoản miễn phí',

  // Neighborhoods
  'neighborhoods.find_reps': 'Tìm đại diện của bạn',
  'neighborhoods.services_area': 'Dịch Vụ Trong Khu Vực',
  'neighborhoods.population': 'Dân Số',
  'neighborhoods.median_income': 'Thu Nhập Trung Bình',

  // Pathway detail extras
  'pathway.news_heading': 'Tin Tức',
  'pathway.foundations_heading': 'Tổ Chức Từ Thiện',
  'pathway.foundations_subtitle': 'tổ chức từ thiện hỗ trợ lộ trình này',

  // Library
  'library.title': 'Thư Viện Nghiên Cứu Cộng Đồng',
  'library.subtitle': 'Khám phá nghiên cứu, báo cáo và tài liệu cộng đồng',
  'library.pages': 'trang',
  'library.search_placeholder': 'Tìm kiếm tài liệu...',
  'library.searching': 'Đang tìm kiếm...',
  'library.no_documents': 'Không tìm thấy tài liệu',
  'library.chat_title': 'Hỏi Thư Viện',
  'library.ask_about_doc': 'Hỏi Về Tài Liệu Này',
  'library.chat_welcome': 'Đặt câu hỏi về bất kỳ chủ đề nào trong thư viện nghiên cứu cộng đồng.',
  'library.chat_placeholder': 'Đặt câu hỏi...',
  'library.new_conversation': 'Cuộc trò chuyện mới',
  'library.sources': 'Nguồn',
  'library.drop_pdf': 'Thả tệp PDF vào đây hoặc nhấp để duyệt',
  'library.max_size': 'Tệp PDF tối đa 35MB',
  'library.doc_title': 'Tiêu Đề Tài Liệu',
  'library.title_placeholder': 'Nhập tiêu đề cho tài liệu này',
  'library.doc_tags': 'Thẻ (phân cách bằng dấu phẩy)',
  'library.tags_placeholder': 'vd. nhà ở, sức khỏe, giáo dục',
  'library.upload_success': 'Tài liệu đã tải lên thành công! Sẽ được xem xét trước khi xuất bản.',
  'library.uploading': 'Đang tải lên...',
  'library.upload_btn': 'Tải Lên Tài Liệu',
  'library.nav': 'Thư Viện Nghiên Cứu',

  // Voting Dashboard
  'voting.zip_placeholder': 'Nhập mã bưu điện',
  'voting.zip_button': 'Đi',
  'voting.what_happened': 'Vừa Xảy Ra Gì',
  'voting.whats_coming': 'Sắp Tới',
  'voting.whats_on_ballot': 'Trên Lá Phiếu',
  'voting.who_represents': 'Ai Đại Diện Cho Bạn',
  'voting.where_to_vote': 'Bỏ Phiếu Ở Đâu',
  'voting.your_voice': 'Tiếng Nói Của Bạn Quan Trọng',
  'voting.recent_results': 'Kết Quả Gần Đây',
  'voting.register_cta': 'Đăng Ký Bỏ Phiếu',
  'voting.mail_ballot': 'Yêu Cầu Phiếu Bầu Qua Thư',
  'voting.get_involved': 'Tham Gia',
  'voting.enter_zip_officials': 'Nhập mã bưu điện ở trên để xem đại diện của bạn.',
  'voting.enter_zip_locations': 'Nhập mã bưu điện ở trên để tìm địa điểm bỏ phiếu gần bạn.',
  'voting.no_upcoming_ballot': 'Các hạng mục trên lá phiếu cho cuộc bầu cử sắp tới sẽ xuất hiện ở đây.',
  'voting.view_details': 'Xem chi tiết đầy đủ',
  'voting.civic_timeline': 'Các Ngày Quan Trọng',
  'voting.days_until': 'ngày nữa',
  'voting.registration_open': 'Đăng ký đang mở',
  'voting.runoff_heading': 'Cuộc đua đi vào vòng hai',

  // Compass
  'compass.title': 'La Bàn',
  'compass.subtitle': 'Tôi đang ở đâu và xung quanh có gì?',
  'compass.tagline': 'Sinh ra ở Houston. Xây dựng cho mọi người.',
  'compass.show_all': 'Hiển thị tất cả',
  'compass.understand': 'Tôi muốn hiểu điều gì đó',
  'compass.help': 'Tôi muốn giúp đỡ',
  'compass.available': 'Tôi muốn tìm những gì có sẵn',
  'compass.decides': 'Tôi muốn biết ai quyết định',
  'compass.made_with': 'Được tạo với sự chu đáo',
  'compass.items': 'mục',

  // Library nuggets
  'library.from_the': 'Từ thư viện',
  'library.read_more': 'Đọc thêm',
  'library.go_deeper': 'Tìm hiểu sâu hơn',
  'library.understanding': 'Hiểu về tài nguyên này',

  // Wayfinder
  'wayfinder.title': 'Kết Nối Qua Cộng Đồng',
  'wayfinder.understand': 'Tìm Hiểu',
  'wayfinder.get_involved': 'Tham Gia',
  'wayfinder.go_deeper': 'Đi Sâu Hơn',
  'wayfinder.donate': 'Quyên Góp',
  'wayfinder.volunteer': 'Tình Nguyện',
  'wayfinder.subscribe': 'Đăng Ký',
  'wayfinder.call': 'Gọi',
  'wayfinder.visit': 'Truy Cập',
  'wayfinder.register': 'Đăng Ký',
  'wayfinder.time': 'Thời Gian',

  // Brand
  'brand.name': 'The Change Engine',
  'brand.subtitle': 'Trao Đổi Cộng Đồng',
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
