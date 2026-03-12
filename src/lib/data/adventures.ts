/** Community Adventures — branching urban story data */

export type AdventureChoice = {
  text: string
  next: string
  /** Optional stat change: +civic, +community, +knowledge */
  stat?: string
}

export type AdventureNode = {
  id: string
  title: string
  text: string
  /** Scene illustration key — maps to SVG in AdventureScene */
  scene: string
  /** Accent color for the scene */
  color: string
  choices: AdventureChoice[]
  /** If true, this is an ending node */
  ending?: boolean
  /** Ending type: 'great' | 'good' | 'okay' */
  endingType?: 'great' | 'good' | 'okay'
  /** Fact or resource link shown after the scene */
  factoid?: string
  /** Link to a real page on the site */
  learnMore?: { label: string; href: string }
}

export type Adventure = {
  slug: string
  title: string
  subtitle: string
  description: string
  color: string
  icon: string
  estimatedMinutes: number
  nodeCount: number
  themes: string[]
  nodes: Record<string, AdventureNode>
  startNode: string
}

// ─── Adventure 1: Your First Town Hall ───────────────────────────────

const townHall: Adventure = {
  slug: 'first-town-hall',
  title: 'Your First Town Hall',
  subtitle: 'Navigate city council like a pro',
  description: 'You just found out the city is planning to build a new highway through your neighborhood park. Tonight is the city council meeting. What do you do?',
  color: '#6a4e10',
  icon: 'landmark',
  estimatedMinutes: 5,
  nodeCount: 12,
  themes: ['THEME_04', 'THEME_03'],
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      title: 'The News Breaks',
      text: 'Your neighbor just texted you a link to a local news article: "City Council to Vote on Highway Expansion Through Riverside Park." The vote is TONIGHT at 6pm. It\'s 4:30pm now. Your park. The one where your kids play.',
      scene: 'neighborhood_evening',
      color: '#6a4e10',
      choices: [
        { text: 'Rush to City Hall right now', next: 'rush_unprepared' },
        { text: 'Spend 30 minutes researching first', next: 'research' },
        { text: 'Post about it on social media', next: 'social_media' },
      ],
    },
    rush_unprepared: {
      id: 'rush_unprepared',
      title: 'Arriving at City Hall',
      text: 'You arrive at City Hall at 5:15pm. The building is massive — marble floors, high ceilings. You have no idea where to go. A security guard asks if you need help. "Council chambers, second floor," she says. You take the elevator up and find a room already filling with people. There\'s a sign-up sheet for public comment near the door.',
      scene: 'city_hall_interior',
      color: '#6a4e10',
      factoid: 'Houston City Council meetings are open to the public. Anyone can attend — you don\'t need an appointment or invitation.',
      choices: [
        { text: 'Sign up to speak', next: 'sign_up_speak', stat: '+civic' },
        { text: 'Find a seat and observe first', next: 'observe' },
      ],
    },
    research: {
      id: 'research',
      title: 'Doing Your Homework',
      text: 'You pull up the city council agenda online. The highway item is #14 on tonight\'s agenda. You find the council member for your district — District H. You look up the proposal details: it would remove 12 acres of parkland, displace a community garden, and reroute traffic through two residential streets. You also find that three community organizations have already written letters opposing it.',
      scene: 'person_at_laptop',
      color: '#6a4e10',
      factoid: 'City council agendas are posted online at least 72 hours before meetings. You can always find them on the city\'s website.',
      learnMore: { label: 'Find Your Council Member', href: '/officials/lookup' },
      choices: [
        { text: 'Call your council member\'s office before heading out', next: 'call_office', stat: '+civic' },
        { text: 'Head to City Hall with your notes', next: 'arrive_prepared', stat: '+knowledge' },
        { text: 'Contact one of those community organizations', next: 'contact_org', stat: '+community' },
      ],
    },
    social_media: {
      id: 'social_media',
      title: 'The Post Goes Viral',
      text: 'You write a passionate post about the park. It gets 200 shares in an hour. People are angry. But the meeting is in 90 minutes and nobody in the comments seems to know how city council works. Someone asks: "Can we even do anything?" Another says: "Just show up and yell." A friend DMs you: "I used to work at the city. Want me to explain how public comment works?"',
      scene: 'phone_notifications',
      color: '#6a4e10',
      choices: [
        { text: 'Take your friend up on the offer', next: 'friend_explains', stat: '+knowledge' },
        { text: 'Rally everyone to show up at City Hall', next: 'rally_crowd' },
      ],
    },
    call_office: {
      id: 'call_office',
      title: 'The Phone Call',
      text: 'You call District H\'s office. A staffer answers. "Thanks for calling — you\'re the 15th call we\'ve gotten today about this." She explains that your council member hasn\'t taken a public position yet but will listen to public comment tonight. She suggests: "If you speak, keep it under 3 minutes. Focus on how this affects your daily life, not just that you\'re against it."',
      scene: 'phone_call',
      color: '#6a4e10',
      factoid: 'Council members track how many calls they receive on each issue. Every call counts — even if you just leave a message.',
      choices: [
        { text: 'Head to City Hall, feeling prepared', next: 'arrive_prepared', stat: '+civic' },
        { text: 'Ask if there\'s a way to submit written testimony too', next: 'written_testimony', stat: '+knowledge' },
      ],
    },
    contact_org: {
      id: 'contact_org',
      title: 'Finding Allies',
      text: 'You email the Houston Parks Alliance. Surprisingly, someone responds within 20 minutes: "We\'re organizing speakers for tonight. Can you share a 2-minute personal story about what the park means to your family? We\'ll handle the policy arguments." They send you talking points and tell you to arrive by 5:30 to sit together.',
      scene: 'community_group',
      color: '#7a2018',
      factoid: 'Community organizations often coordinate testimony at public hearings. They can help you be more effective.',
      learnMore: { label: 'Find Organizations', href: '/organizations' },
      choices: [
        { text: 'Accept and prepare your personal story', next: 'personal_story', stat: '+community' },
        { text: 'Ask what else you can do beyond tonight', next: 'long_game', stat: '+community' },
      ],
    },
    friend_explains: {
      id: 'friend_explains',
      title: 'How Public Comment Works',
      text: 'Your friend explains: "Public comment isn\'t a debate. You get 3 minutes. The council listens but doesn\'t respond. Here\'s what actually works: be specific, be personal, and be brief. Say who you are, where you live, and ONE thing about how this affects you. Don\'t read a speech — just talk to them like people." She adds: "And bring neighbors. Numbers matter."',
      scene: 'two_people_talking',
      color: '#6a4e10',
      choices: [
        { text: 'Text your neighbors and head to City Hall together', next: 'arrive_with_group', stat: '+community' },
        { text: 'Go alone but follow her advice', next: 'arrive_prepared', stat: '+knowledge' },
      ],
    },
    rally_crowd: {
      id: 'rally_crowd',
      title: 'The Crowd Shows Up',
      text: 'You and 30 people arrive at City Hall. The energy is high — people have signs, they\'re chanting. But inside, the security guard says signs aren\'t allowed in the chambers. A few people get frustrated and start arguing with security. Others are confused about the process. The meeting starts, and your group is scattered throughout the room.',
      scene: 'crowd_outside',
      color: '#1a6b56',
      choices: [
        { text: 'Try to organize your group quietly', next: 'organize_inside', stat: '+community' },
        { text: 'Sign up to speak on behalf of everyone', next: 'sign_up_speak', stat: '+civic' },
      ],
    },
    arrive_prepared: {
      id: 'arrive_prepared',
      title: 'Ready for This',
      text: 'You walk into council chambers at 5:45pm. You know the agenda item number. You know your council member\'s name. You have your talking points. You sign up for public comment, take a seat, and wait. Around you, other residents are filing in — some look nervous, some look like regulars. The city secretary calls the meeting to order.',
      scene: 'council_chambers',
      color: '#6a4e10',
      choices: [
        { text: 'When your name is called, walk to the podium', next: 'give_testimony', stat: '+civic' },
      ],
    },
    arrive_with_group: {
      id: 'arrive_with_group',
      title: 'Strength in Numbers',
      text: 'You arrive with 8 neighbors. You help everyone sign up for public comment. You coordinate: each person will make ONE point — the garden, the kids, the flooding risk, the noise, the property values, the senior exercise group, the dog park, the wildlife habitat. Eight voices, eight angles, no repetition.',
      scene: 'group_entering',
      color: '#7a2018',
      factoid: 'Coordinated testimony is one of the most effective advocacy techniques. When multiple speakers each make a different point, council members notice.',
      choices: [
        { text: 'Lead your group through public comment', next: 'group_testimony', stat: '+community' },
      ],
    },
    observe: {
      id: 'observe',
      title: 'Watching Democracy Work',
      text: 'You sit in the back and watch. The meeting covers a dozen items before reaching yours. You see how it works: the city staff presents, council members ask questions, then public comment opens. Some speakers are excellent — calm, specific, personal. Others ramble or get angry and are cut off at 3 minutes. You notice the council members pay more attention to the calm, specific speakers.',
      scene: 'council_chambers',
      color: '#6a4e10',
      choices: [
        { text: 'You feel ready — sign up for the next public comment period', next: 'sign_up_late', stat: '+knowledge' },
        { text: 'Decide to come back next time, better prepared', next: 'ending_learn' },
      ],
    },
    sign_up_speak: {
      id: 'sign_up_speak',
      title: 'Your Name on the List',
      text: 'You write your name on the public comment sign-up sheet. You\'re #23. The wait feels eternal. You use the time to jot a few notes on your phone: your name, your street, how your kids use the park every weekend, how the community garden grows food for the neighborhood food bank.',
      scene: 'person_writing',
      color: '#6a4e10',
      choices: [
        { text: 'Walk to the podium when called', next: 'give_testimony', stat: '+civic' },
      ],
    },
    sign_up_late: {
      id: 'sign_up_late',
      title: 'Better Late Than Never',
      text: 'You sign up just before public comment closes. When your turn comes, you stand and say simply: "My name is [You], I live on Oak Street, and Riverside Park is where my family gathers every Sunday. I\'m asking you to consider what we lose if this park becomes a highway." It\'s only 30 seconds, but two council members nod.',
      scene: 'podium_speaking',
      color: '#6a4e10',
      choices: [
        { text: 'Continue', next: 'ending_first_step' },
      ],
    },
    give_testimony: {
      id: 'give_testimony',
      title: 'At the Podium',
      text: '"Good evening. My name is [You], and I live on Oak Street — three blocks from Riverside Park. My daughter learned to ride her bike there. Our community garden feeds 40 families through the neighborhood food bank. This park isn\'t just green space — it\'s where our neighborhood becomes a community. I\'m asking you to find another route for this highway and protect what makes our neighborhood worth living in." The room applauds. Two council members lean forward to take notes.',
      scene: 'podium_speaking',
      color: '#7a2018',
      choices: [
        { text: 'Continue', next: 'ending_great' },
      ],
    },
    group_testimony: {
      id: 'group_testimony',
      title: 'Eight Voices, One Message',
      text: 'One by one, your neighbors speak. Maria talks about the community garden. James talks about the flooding risk — "this area is already in a floodplain." Auntie Rose talks about the senior tai chi group that meets there every morning. By the fourth speaker, the council member for your district is whispering to a colleague. By the eighth, she raises her hand: "I\'d like to motion to table this item for further community input." The motion passes 5-2.',
      scene: 'crowd_cheering',
      color: '#7a2018',
      choices: [
        { text: 'Continue', next: 'ending_best' },
      ],
    },
    organize_inside: {
      id: 'organize_inside',
      title: 'Finding Order in Chaos',
      text: 'You gather your group in the hallway. "OK — no signs inside. That\'s fine. Here\'s what matters: when they call for public comment on item 14, as many of us as possible need to sign up to speak. Keep it short. Just say who you are and why the park matters to you." People calm down. They go in and sit together. When item 14 comes up, 12 people sign up to speak.',
      scene: 'hallway_meeting',
      color: '#4a2870',
      choices: [
        { text: 'Watch your neighbors speak one by one', next: 'group_testimony', stat: '+community' },
      ],
    },
    personal_story: {
      id: 'personal_story',
      title: 'Your Two Minutes',
      text: 'Sitting with the Houston Parks Alliance group, you feel supported. When your turn comes, you share how you moved to this neighborhood specifically because of the park. How your daughter made her first friend at the playground. How you volunteer at the community garden on Saturdays. The policy experts handle the flooding data and environmental impact. You handle the heart. Together, it\'s compelling.',
      scene: 'podium_speaking',
      color: '#7a2018',
      choices: [
        { text: 'Continue', next: 'ending_great' },
      ],
    },
    written_testimony: {
      id: 'written_testimony',
      title: 'Belt and Suspenders',
      text: 'The staffer tells you: "Absolutely — you can email written testimony to the city secretary before midnight tonight. It becomes part of the official record. Some council members actually prefer reading testimony because they can review it during deliberation." You draft a one-page letter and email it before heading to City Hall. Now your voice is on record either way.',
      scene: 'person_at_laptop',
      color: '#6a4e10',
      factoid: 'Written testimony submitted to the city secretary becomes part of the official public record and can be referenced in future proceedings.',
      choices: [
        { text: 'Head to City Hall to speak in person too', next: 'arrive_prepared', stat: '+civic' },
      ],
    },
    long_game: {
      id: 'long_game',
      title: 'Playing the Long Game',
      text: 'The organizer says: "Tonight matters, but this fight won\'t be decided in one meeting. We need people who\'ll show up to the planning commission meetings, write op-eds, and talk to their neighbors. Most civic wins happen because someone kept showing up after everyone else went home." She invites you to join their volunteer committee.',
      scene: 'community_group',
      color: '#7a2018',
      learnMore: { label: 'Find Opportunities', href: '/opportunities' },
      choices: [
        { text: 'Sign up and head to tonight\'s meeting', next: 'arrive_with_group', stat: '+community' },
      ],
    },
    ending_great: {
      id: 'ending_great',
      title: 'Your Voice Was Heard',
      text: 'The council votes to delay the highway decision for 90 days of additional community input. It\'s not a win yet — but it\'s not a loss either. And something shifted tonight: you learned that showing up, being prepared, and speaking from the heart actually works. The council member for your district approaches you after the meeting. "Thank you for coming. Most people don\'t."',
      scene: 'handshake',
      color: '#7a2018',
      ending: true,
      endingType: 'great',
      factoid: 'In Houston, fewer than 1% of residents have ever attended a city council meeting. Those who show up have outsized influence.',
      learnMore: { label: 'Find Your Representatives', href: '/officials/lookup' },
      choices: [],
    },
    ending_best: {
      id: 'ending_best',
      title: 'The Power of Community',
      text: 'The item is tabled. Your group exchanges numbers in the parking lot. Maria suggests a neighborhood meeting next Saturday. James volunteers to track the planning commission agenda. Auntie Rose says she\'ll bring the food. You walked in tonight as individuals. You\'re leaving as a coalition. The highway fight isn\'t over — but for the first time, your neighborhood has a voice. And that voice has eight parts.',
      scene: 'group_celebration',
      color: '#7a2018',
      ending: true,
      endingType: 'great',
      factoid: 'Research shows that organized groups of residents are 4x more likely to influence policy outcomes than individual speakers.',
      learnMore: { label: 'Explore Your Neighborhood', href: '/neighborhoods' },
      choices: [],
    },
    ending_first_step: {
      id: 'ending_first_step',
      title: 'A First Step',
      text: 'Your comment was short, but it was real. You showed up. You put your name on the record. On the drive home, you realize something: this wasn\'t as intimidating as you thought. Next time — and there will be a next time — you\'ll come earlier, bring notes, and maybe bring a neighbor. Democracy is a practice, not a performance. And tonight, you practiced.',
      scene: 'walking_home',
      color: '#6a4e10',
      ending: true,
      endingType: 'good',
      factoid: 'The most effective civic participants started exactly where you are — by showing up once and learning the process.',
      learnMore: { label: 'Browse Civic Pathways', href: '/pathways' },
      choices: [],
    },
    ending_learn: {
      id: 'ending_learn',
      title: 'Knowledge Is Power',
      text: 'You didn\'t speak tonight, but you learned how it all works. You saw the process. You know where to sit, when to sign up, and what makes an effective speaker. You took notes. Next time an issue affects your neighborhood, you won\'t be starting from scratch. Sometimes the most important step is the one where you watch, listen, and understand.',
      scene: 'person_thinking',
      color: '#4a2870',
      ending: true,
      endingType: 'okay',
      factoid: 'Observing a public meeting before participating is a smart strategy. Many effective advocates attended several meetings before speaking for the first time.',
      learnMore: { label: 'Learn About Government', href: '/pathways/voice' },
      choices: [],
    },
  },
}

// ─── Adventure 2: The Neighborhood Detective ─────────────────────────

const neighborhoodDetective: Adventure = {
  slug: 'neighborhood-detective',
  title: 'The Neighborhood Detective',
  subtitle: 'Discover the hidden assets in your community',
  description: 'Your neighborhood feels invisible — no resources, no attention, no voice. But what if you\'re not looking in the right places? Time to investigate what your community actually has.',
  color: '#4a2870',
  icon: 'search',
  estimatedMinutes: 5,
  nodeCount: 11,
  themes: ['THEME_03', 'THEME_07'],
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      title: 'The Complaint',
      text: 'You\'re at a neighborhood cookout when someone says: "Nothing ever happens here. The city doesn\'t care about us. We don\'t have any resources." Everyone nods. But something bugs you — is that really true? You decide to spend one Saturday finding out what your neighborhood actually has.',
      scene: 'neighborhood_cookout',
      color: '#4a2870',
      choices: [
        { text: 'Start with a walk around the neighborhood', next: 'walk', stat: '+community' },
        { text: 'Look it up online first', next: 'online_research', stat: '+knowledge' },
        { text: 'Ask the oldest resident on the block', next: 'ask_elder', stat: '+community' },
      ],
    },
    walk: {
      id: 'walk',
      title: 'Eyes Wide Open',
      text: 'You walk 10 blocks in every direction. Here\'s what you find that you never noticed: a small church with a food pantry sign in the window. A community health clinic tucked behind a strip mall. A rec center with a basketball court AND a computer lab. A Little Free Library on someone\'s lawn. A hand-painted mural honoring the neighborhood\'s history. A flyer for free ESL classes at the library branch.',
      scene: 'neighborhood_walk',
      color: '#4a2870',
      factoid: 'Asset mapping — systematically cataloging community resources — is a practice used by urban planners and community organizers worldwide.',
      choices: [
        { text: 'Start making a list of everything you find', next: 'asset_map', stat: '+knowledge' },
        { text: 'Walk into the community health clinic', next: 'health_clinic', stat: '+community' },
      ],
    },
    online_research: {
      id: 'online_research',
      title: 'The Data Picture',
      text: 'You search for your ZIP code on The Change Engine. You find 12 organizations, 3 elected officials, 8 active services, and 4 upcoming events — all within your area. You also discover your neighborhood is in Super Neighborhood 48, which has a council that meets monthly. You had no idea any of this existed.',
      scene: 'person_at_laptop',
      color: '#6a4e10',
      learnMore: { label: 'Look Up Your ZIP Code', href: '/officials/lookup' },
      choices: [
        { text: 'Go visit one of the organizations in person', next: 'visit_org', stat: '+community' },
        { text: 'Find the next Super Neighborhood meeting', next: 'sn_meeting', stat: '+civic' },
      ],
    },
    ask_elder: {
      id: 'ask_elder',
      title: 'Living History',
      text: 'You knock on Miss Dorothy\'s door. She\'s lived here 47 years. Over sweet tea on her porch, she tells you: "This neighborhood used to have a civic club that met every month. We got the city to fix the drainage, add a stop sign, and build that park. When we stopped meeting, we stopped getting things done." She pauses. "The resources didn\'t disappear. We just stopped organizing."',
      scene: 'porch_conversation',
      color: '#4a2870',
      factoid: 'Houston\'s Super Neighborhood system was created to give communities an organized voice in city government. There are 88 Super Neighborhoods across the city.',
      choices: [
        { text: 'Ask Miss Dorothy to help you restart the civic club', next: 'restart_club', stat: '+community' },
        { text: 'Ask what resources are still around from those days', next: 'old_resources', stat: '+knowledge' },
      ],
    },
    asset_map: {
      id: 'asset_map',
      title: 'Building the Map',
      text: 'By noon, your list has 23 items: 4 churches with community programs, 1 clinic, 1 rec center, 2 parks, 3 small businesses that sponsor youth sports, 1 community garden, the library branch, a VFW hall that hosts free tax prep, and 8 organizations you found online. You put it all in a Google Doc. This is more than "nothing." This is a neighborhood with assets nobody was tracking.',
      scene: 'map_with_pins',
      color: '#7a2018',
      learnMore: { label: 'Explore Neighborhoods', href: '/neighborhoods' },
      choices: [
        { text: 'Share the map at the next cookout', next: 'ending_share', stat: '+community' },
        { text: 'Send it to your council member', next: 'ending_civic', stat: '+civic' },
      ],
    },
    health_clinic: {
      id: 'health_clinic',
      title: 'Hidden in Plain Sight',
      text: 'The clinic offers free blood pressure checks, diabetes screening, mental health counseling, and children\'s immunizations — all on a sliding scale. The receptionist says: "We\'ve been here 8 years. Most people in the neighborhood don\'t know we exist." She hands you a stack of flyers. "If you know anyone who needs us, send them our way."',
      scene: 'clinic_interior',
      color: '#1a6b56',
      learnMore: { label: 'Find Services', href: '/services' },
      choices: [
        { text: 'Take the flyers and keep exploring', next: 'asset_map', stat: '+community' },
      ],
    },
    visit_org: {
      id: 'visit_org',
      title: 'Meeting the Organizers',
      text: 'You visit a small nonprofit that runs after-school programs. The director, Mr. Rodriguez, is surprised to see a walk-in. "Most of our families find us through word of mouth," he says. "We serve 60 kids but we have capacity for 100. We just can\'t reach enough families." He shows you the tutoring room, the art studio, and the tiny garden where kids grow vegetables.',
      scene: 'community_center',
      color: '#1e4d7a',
      choices: [
        { text: 'Offer to help spread the word', next: 'ending_connector', stat: '+community' },
        { text: 'Ask how the organization is funded', next: 'funding_story', stat: '+knowledge' },
      ],
    },
    sn_meeting: {
      id: 'sn_meeting',
      title: 'The Super Neighborhood Meeting',
      text: 'You show up to the Super Neighborhood council meeting at the library. There are 11 people there — mostly older homeowners. They\'re discussing drainage problems, a request for speed bumps, and a vacant lot the city might turn into a pocket park. The president says: "We need younger voices. We need renters. We need people who look like the neighborhood actually looks."',
      scene: 'meeting_room',
      color: '#1a3460',
      factoid: 'Super Neighborhood councils are official advisory bodies to the City of Houston. Their recommendations are sent directly to city departments.',
      choices: [
        { text: 'Volunteer to help recruit new members', next: 'ending_bridge', stat: '+community' },
        { text: 'Ask about the pocket park proposal', next: 'ending_park', stat: '+civic' },
      ],
    },
    restart_club: {
      id: 'restart_club',
      title: 'The Comeback',
      text: 'Miss Dorothy\'s eyes light up. "I still have the old bylaws somewhere." She goes inside and comes back with a faded folder. "We need 10 people and a meeting place. The church on the corner used to let us use their fellowship hall." She already has names: "Call James at the barbershop. Talk to Maria at the taqueria. And that young teacher who moved in on Elm Street — she\'s been looking for ways to get involved."',
      scene: 'porch_conversation',
      color: '#7a2018',
      choices: [
        { text: 'Start making calls', next: 'ending_revival', stat: '+community' },
      ],
    },
    old_resources: {
      id: 'old_resources',
      title: 'Still Standing',
      text: 'Miss Dorothy walks you through the neighborhood, pointing things out: "That rec center? We fought for that in 1994. That drainage ditch? We got the city to widen it after Tropical Storm Allison. That park? Used to be a dumping ground until we cleaned it up ourselves." Everything you thought was just "there" was actually the result of organized neighbors demanding change.',
      scene: 'neighborhood_walk',
      color: '#4a2870',
      choices: [
        { text: 'Ask Miss Dorothy to speak at the next cookout', next: 'ending_history', stat: '+community' },
      ],
    },
    funding_story: {
      id: 'funding_story',
      title: 'Following the Money',
      text: 'Mr. Rodriguez explains: "We get a small city grant, some United Way funding, and donations from three local churches. But honestly, what keeps us open is two foundation grants. If either one doesn\'t renew, we\'re in trouble." He pauses. "The neighborhood has resources. What we don\'t have is visibility. If more people knew we existed, more people would support us."',
      scene: 'community_center',
      color: '#1e4d7a',
      learnMore: { label: 'Explore Foundations', href: '/foundations' },
      choices: [
        { text: 'Help connect the nonprofit to more visibility', next: 'ending_connector', stat: '+community' },
      ],
    },
    ending_share: {
      id: 'ending_share',
      title: 'The Map Changes Everything',
      text: 'At the next cookout, you project the asset map on a bedsheet hung from the fence. People crowd around. "Wait — there\'s a free clinic?" "I didn\'t know about the computer lab at the rec center." "My mom needs that food pantry." The conversation shifts from "we have nothing" to "we didn\'t know what we had." Miss Dorothy, standing in the back, is smiling. Someone says: "We should do this every month." And just like that, a neighborhood meeting is born.',
      scene: 'group_celebration',
      color: '#7a2018',
      ending: true,
      endingType: 'great',
      factoid: 'Research shows that communities aware of their existing assets are more effective at attracting new resources and investment.',
      choices: [],
    },
    ending_civic: {
      id: 'ending_civic',
      title: 'Getting Official Attention',
      text: 'You email the asset map to your council member\'s office with a note: "Our neighborhood has 23 community assets and zero representation in the city\'s resource directory. Can we meet?" The staffer responds the next day: "The council member would like to visit. Can you organize a walking tour?" You can. And you will. Because now you know your neighborhood isn\'t invisible — it was just undocumented.',
      scene: 'handshake',
      color: '#6a4e10',
      ending: true,
      endingType: 'great',
      learnMore: { label: 'Contact Your Officials', href: '/officials' },
      choices: [],
    },
    ending_connector: {
      id: 'ending_connector',
      title: 'The Connector',
      text: 'You become the person who connects people to resources. When someone at church mentions needing help, you know the right organization. When the after-school program needs volunteers, you know who to ask. You didn\'t create anything new — you just made the invisible visible. And that turns out to be one of the most valuable things anyone can do for a neighborhood.',
      scene: 'community_group',
      color: '#1e4d7a',
      ending: true,
      endingType: 'great',
      factoid: 'Community connectors — people who link residents to resources — are one of the most important (and unpaid) roles in neighborhood health.',
      choices: [],
    },
    ending_bridge: {
      id: 'ending_bridge',
      title: 'Building the Bridge',
      text: 'Over the next month, you recruit 6 new members to the Super Neighborhood council — two renters, a small business owner, a college student, and two parents from the apartment complex. The meetings get livelier. The agenda gets broader. When the city announces a new bus route proposal, your council actually represents the people who ride the bus. That\'s how democracy is supposed to work.',
      scene: 'meeting_room',
      color: '#1a3460',
      ending: true,
      endingType: 'great',
      learnMore: { label: 'Find Your Super Neighborhood', href: '/neighborhoods' },
      choices: [],
    },
    ending_park: {
      id: 'ending_park',
      title: 'From Vacant Lot to Gathering Place',
      text: 'You get involved in the pocket park proposal. Over six months, you help with the design survey, attend two planning meetings, and organize a neighborhood cleanup of the lot. When the park opens — just a small green space with benches, shade trees, and a walking path — it feels like it was always supposed to be there. Because it was. It just needed someone to show up and say: "This matters."',
      scene: 'park_scene',
      color: '#7a2018',
      ending: true,
      endingType: 'great',
      choices: [],
    },
    ending_revival: {
      id: 'ending_revival',
      title: 'The Revival',
      text: 'Three weeks later, 14 people show up to the first meeting of the revived Oak Street Civic Club. Miss Dorothy brings the old bylaws and a pound cake. James from the barbershop offers to host future meetings in his back room. Maria posts about it at the taqueria. The teacher, Ms. Chen, volunteers to set up a group chat. It\'s not a revolution. It\'s something better — a neighborhood remembering that it knows how to organize.',
      scene: 'community_group',
      color: '#7a2018',
      ending: true,
      endingType: 'great',
      choices: [],
    },
    ending_history: {
      id: 'ending_history',
      title: 'Remembering Forward',
      text: 'At the next cookout, Miss Dorothy tells the story of how the neighborhood fought for the rec center in 1994. The younger residents are amazed. "Y\'all did that?" "We did that," she says. "And you can too." The conversation that follows is different from the usual complaints. It sounds like planning. Someone says: "What if we documented all this history?" Someone else says: "What if we made a plan for what\'s next?"',
      scene: 'neighborhood_cookout',
      color: '#4a2870',
      ending: true,
      endingType: 'great',
      choices: [],
    },
  },
}

// ─── Adventure 3: Hurricane Season ───────────────────────────────────

const hurricaneSeason: Adventure = {
  slug: 'hurricane-season',
  title: 'Hurricane Season',
  subtitle: 'Prepare your community before the storm',
  description: 'It\'s June 1st. Hurricane season just started. The weather service says this year could be bad. Your neighborhood flooded in the last big storm. What do you do with the 90 days before peak season?',
  color: '#1a6b56',
  icon: 'cloud-rain',
  estimatedMinutes: 5,
  nodeCount: 10,
  themes: ['THEME_03', 'THEME_01'],
  startNode: 'start',
  nodes: {
    start: {
      id: 'start',
      title: 'June 1st',
      text: 'Hurricane season just started. The National Weather Service is predicting an above-average year. Your neighborhood flooded knee-deep in the last big storm. Last time, you were caught off guard — no supplies, no plan, no idea who to call. You have 90 days before peak season in September. What\'s your first move?',
      scene: 'weather_alert',
      color: '#1a6b56',
      choices: [
        { text: 'Focus on your own family\'s emergency plan', next: 'family_plan' },
        { text: 'Check what the city\'s doing to prevent flooding', next: 'city_infrastructure', stat: '+civic' },
        { text: 'Talk to your neighbors about preparing together', next: 'neighbor_prep', stat: '+community' },
      ],
    },
    family_plan: {
      id: 'family_plan',
      title: 'Getting Your House in Order',
      text: 'You make a list: water (1 gallon per person per day for 3 days), non-perishable food, flashlights, batteries, medications, important documents in a waterproof bag, phone chargers, cash. You check your insurance — and discover your homeowner\'s policy does NOT cover flooding. Flood insurance takes 30 days to activate. You file immediately.',
      scene: 'emergency_supplies',
      color: '#1a6b56',
      factoid: 'Standard homeowner\'s insurance does NOT cover flood damage. Flood insurance through FEMA\'s NFIP takes 30 days to activate after purchase.',
      choices: [
        { text: 'Now check on your neighbors', next: 'neighbor_check', stat: '+community' },
        { text: 'Research evacuation routes', next: 'evacuation', stat: '+knowledge' },
      ],
    },
    city_infrastructure: {
      id: 'city_infrastructure',
      title: 'Following the Water',
      text: 'You attend a Harris County Flood Control District meeting. You learn: your neighborhood is in a 100-year floodplain that\'s flooded 3 times in 5 years. A $2.5 billion bond program is funding channel improvements, but your bayou isn\'t scheduled for work until 2028. A resident asks: "What do we do until then?" The engineer says: "Community preparedness is your best protection."',
      scene: 'meeting_room',
      color: '#6a4e10',
      factoid: 'After Hurricane Harvey, Harris County passed a $2.5 billion flood bond — the largest in county history. Projects are being completed neighborhood by neighborhood.',
      learnMore: { label: 'Track Local Policies', href: '/policies' },
      choices: [
        { text: 'Organize your block to prepare together', next: 'neighbor_prep', stat: '+community' },
        { text: 'Find out about your flood risk specifically', next: 'flood_risk', stat: '+knowledge' },
      ],
    },
    neighbor_prep: {
      id: 'neighbor_prep',
      title: 'The Block Meeting',
      text: 'You knock on doors. Twelve neighbors show up for a Saturday morning meeting in your carport. You learn: Mr. Kim has a generator. The Garcias have a boat. Mrs. Williams is a retired nurse. The couple in 4C don\'t speak English well — they missed every warning last time because alerts were only in English. The college student in 2B has no car. Suddenly, "being prepared" isn\'t just about supplies — it\'s about knowing who needs help and who can give it.',
      scene: 'community_group',
      color: '#4a2870',
      choices: [
        { text: 'Create a block emergency contact list', next: 'contact_list', stat: '+community' },
        { text: 'Assign roles based on what people can offer', next: 'assign_roles', stat: '+community' },
      ],
    },
    neighbor_check: {
      id: 'neighbor_check',
      title: 'Checking In',
      text: 'You knock on your elderly neighbor\'s door. Mrs. Johnson lives alone. "Oh, I\'ll be fine — I survived Alicia in \'83," she says. But you notice: she\'s on oxygen. She doesn\'t drive. Her phone is a flip phone that won\'t get emergency alerts. She has no family in town. "Fine" is not the word you\'d use.',
      scene: 'door_knock',
      color: '#1e4d7a',
      choices: [
        { text: 'Add her to your family\'s evacuation plan', next: 'include_neighbor', stat: '+community' },
        { text: 'Help her sign up for the city\'s special needs registry', next: 'special_needs', stat: '+knowledge' },
      ],
    },
    evacuation: {
      id: 'evacuation',
      title: 'The Routes',
      text: 'You map evacuation routes. There are two ways out of your neighborhood — both cross low-water crossings that flood fast. The official evacuation route goes north on Highway 59, but during Hurricane Rita, that highway became a 20-hour parking lot. You identify a back route through Waller County that avoids highways. You also find a shelter list — but learn that most shelters don\'t accept pets.',
      scene: 'map_with_pins',
      color: '#1a6b56',
      factoid: 'During Hurricane Rita (2005), 3.7 million Texans evacuated simultaneously, causing the worst gridlock in US history. Planning alternate routes is essential.',
      choices: [
        { text: 'Find a pet-friendly shelter option', next: 'ending_prepared', stat: '+knowledge' },
        { text: 'Share the routes with your neighbors', next: 'contact_list', stat: '+community' },
      ],
    },
    flood_risk: {
      id: 'flood_risk',
      title: 'Knowing Your Risk',
      text: 'You look up your address on FEMA\'s flood map. Your house is in Zone AE — the highest-risk zone. You also discover something most people don\'t know: Harris County has a free property-level flood risk tool that shows exactly how deep water reached your street in past storms. Your street had 18 inches during Harvey and 14 inches during Imelda. That changes how you prepare.',
      scene: 'person_at_laptop',
      color: '#1a6b56',
      choices: [
        { text: 'Share this tool with your neighbors', next: 'contact_list', stat: '+community' },
      ],
    },
    contact_list: {
      id: 'contact_list',
      title: 'The Network',
      text: 'You create a shared contact list: everyone\'s name, phone, any medical needs, whether they have transportation, pets, and one out-of-state emergency contact. You set up a group chat. You print paper copies for people without smartphones. It takes two hours. It might save a life.',
      scene: 'person_writing',
      color: '#7a2018',
      choices: [
        { text: 'Do a practice run before storm season', next: 'ending_community', stat: '+community' },
      ],
    },
    assign_roles: {
      id: 'assign_roles',
      title: 'Everyone Has Something',
      text: 'You assign roles: Mr. Kim runs the generator and charges phones. The Garcias will check on the low-lying houses with their boat. Mrs. Williams is the medical lead. You\'ll translate alerts for the non-English speakers using Google Translate. The college student will monitor social media for real-time road conditions. Everyone has a job. Nobody is alone.',
      scene: 'community_group',
      color: '#7a2018',
      choices: [
        { text: 'Continue', next: 'ending_community' },
      ],
    },
    include_neighbor: {
      id: 'include_neighbor',
      title: 'No One Left Behind',
      text: 'You tell Mrs. Johnson: "If a storm comes, we\'re coming to get you first. Pack a bag with your meds, your oxygen supplies, and your important papers. We\'ll handle the rest." She tears up. "Nobody\'s checked on me like this since Robert passed." You exchange numbers. You tell your family: if it\'s time to go, Mrs. Johnson comes with us. No discussion.',
      scene: 'door_knock',
      color: '#1e4d7a',
      choices: [
        { text: 'Continue', next: 'ending_prepared' },
      ],
    },
    special_needs: {
      id: 'special_needs',
      title: 'The Registry',
      text: 'You help Mrs. Johnson register with the city\'s Emergency Special Needs registry. If an evacuation is ordered, emergency services will prioritize people on this list — especially those with mobility issues or medical equipment needs. You also sign her up for emergency text alerts (her flip phone can receive texts) and write the emergency numbers on a card she tapes to her refrigerator.',
      scene: 'person_at_laptop',
      color: '#6a4e10',
      factoid: 'Most cities maintain a Special Needs Registry for residents who require assistance during evacuations. Registration is free and can be done online or by phone.',
      choices: [
        { text: 'Continue', next: 'ending_prepared' },
      ],
    },
    ending_prepared: {
      id: 'ending_prepared',
      title: 'Ready Before the Rain',
      text: 'September comes. A tropical system forms in the Gulf. This time, you\'re ready: supplies packed, routes mapped, insurance active, neighbors connected, Mrs. Johnson accounted for. The storm weakens and veers east. You don\'t need any of it this time. But you will. And when you do, you won\'t be caught off guard. Preparedness isn\'t about fear — it\'s about making sure your community can take care of itself when the systems we depend on are overwhelmed.',
      scene: 'sunrise',
      color: '#7a2018',
      ending: true,
      endingType: 'great',
      factoid: 'FEMA data shows that households with an emergency plan recover 40% faster after natural disasters than those without one.',
      learnMore: { label: 'Find Emergency Services', href: '/services' },
      choices: [],
    },
    ending_community: {
      id: 'ending_community',
      title: 'Stronger Together',
      text: 'When the first tropical storm warning of the season hits in August, your group chat lights up: "Generator is fueled." "I\'ve got extra water." "Checking on Mrs. Johnson." "Roads clear on the north route." The storm passes without major damage. But something bigger happened: your block went from a collection of strangers to a community that looks out for each other. Hurricane season didn\'t just make you prepared — it made you neighbors.',
      scene: 'group_celebration',
      color: '#7a2018',
      ending: true,
      endingType: 'great',
      factoid: 'Studies after Hurricane Harvey found that neighborhoods with pre-existing social connections recovered faster and experienced fewer casualties.',
      learnMore: { label: 'Explore Your Neighborhood', href: '/neighborhoods' },
      choices: [],
    },
  },
}

// ─── Exports ─────────────────────────────────────────────────────────

export const ALL_ADVENTURES: Adventure[] = [townHall, neighborhoodDetective, hurricaneSeason]

export function getAdventure(slug: string): Adventure | undefined {
  return ALL_ADVENTURES.find(a => a.slug === slug)
}
