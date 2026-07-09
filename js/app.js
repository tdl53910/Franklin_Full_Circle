// ============================================================
//  Franklin Full Circle — app.js
//  OpenAI-powered career navigation for Franklin College @ UGA
// ============================================================

const API_URL = '/api/chat';
const ENGAGE_BASE = 'https://uga.campuslabs.com/engage/organizations';
const ENGAGE_SEARCH = 'https://uga.campuslabs.com/engage/search?query=';

// ── UGA Academic Programs Reference ──────────────────────────
const UGA_PROGRAMS = {
    majors: [
        // Franklin College of Arts & Sciences
        "Africana Studies", "Anthropology", "Arabic", "Art", "Art History", "Astronomy", "Biochemistry and Molecular Biology",
        "Biology", "Chemistry", "Chinese", "Classics", "Cognitive Science", "Communication Sciences and Disorders",
        "Communication Studies", "Comparative Literature", "Computer Science", "Criminal Justice", "Dance", "Drama",
        "Ecology", "Economics", "English", "Entertainment and Media Studies", "Environmental Chemistry",
        "Environmental Economics and Management", "Film Studies", "French", "Genetics", "Geography", "Geology",
        "German", "Greek", "Health Promotion", "History", "International Affairs", "Italian", "Japanese", "Journalism",
        "Korean", "Latin", "Linguistics", "Marine Sciences", "Mathematics", "Microbiology", "Music", "Philosophy",
        "Physics", "Plant Biology", "Political Science", "Portuguese", "Psychology", "Religion", "Romance Languages",
        "Russian", "Sociology", "Spanish", "Statistics", "Theatre", "Women's Studies",
        // Terry College of Business
        "Accounting", "Economics (Terry)", "Finance", "Management", "Management Information Systems", "Marketing",
        "Real Estate", "Risk Management and Insurance",
        // Other Colleges
        "Agricultural and Applied Economics", "Agricultural Communication", "Animal Science", "Biological Engineering",
        "Civil Engineering", "Computer Systems Engineering", "Electrical Engineering", "Environmental Engineering",
        "Mechanical Engineering", "Landscape Architecture", "Environmental Health Science", "Exercise and Sport Science",
        "Nutritional Sciences", "Pharmaceutical Sciences", "Social Work"
    ],
    minors: [
        "Africana Studies", "Anthropology", "Applied Biotechnology", "Arabic", "Art History", "Astronomy", "Biological Sciences",
        "Business", "Chemistry", "Chinese", "Classics", "Cognitive Science", "Communication Studies", "Comparative Literature",
        "Computer Science", "Criminal Justice", "Dance", "Drama", "Economics", "English", "Entomology", "Environmental Economics",
        "Environmental Ethics", "Film Studies", "Food Science", "French", "Geography", "Geology", "German", "Global Health",
        "Greek", "Health Promotion", "History", "Human Development", "Informatics", "International Affairs", "Italian", "Japanese",
        "Jewish Studies", "Korean", "Latin", "Latin American and Caribbean Studies", "Linguistics", "Marine Sciences",
        "Mathematics", "Medieval Studies", "Microbiology", "Music", "Native American Studies", "Philosophy", "Physics",
        "Plant Biology", "Political Science", "Portuguese", "Psychology", "Public Health", "Religion", "Russian", "Sociology",
        "Spanish", "Speech Communication", "Sport Management", "Statistics", "Sustainability", "Theatre", "Toxicology",
        "Women's Studies", "Writing"
    ],
    certificates: [
        "Applied Biotechnology", "Artificial Intelligence", "Business", "Climate Change", "Cognitive Science",
        "Creative Writing", "Data Science", "Entrepreneurship", "Environmental Ethics", "Environmental Law",
        "FinTech", "Food Studies", "Gerontology", "Global Health", "Human Rights", "Informatics", "Innovation Fellows",
        "International Affairs", "Latin American Studies", "Law, Jurisprudence and the State", "Leadership",
        "LGBTQ+ Studies", "Marine Sciences", "Medieval Studies", "Music Business", "Native American Studies",
        "New Media", "Nonprofit Management", "Personal and Organizational Leadership", "Philosophy, Politics and Economics",
        "Public Health", "Public Relations", "Religion", "Science Education", "Social Innovation and Philanthropy",
        "Sport Business", "Sustainability", "Teaching English to Speakers of Other Languages", "Technology",
        "Urban and Metropolitan Studies", "Water Resources", "Women's Studies", "Workforce Development and Management"
    ],
    departments_and_faculty_pages: {
        "Computer Science": "https://www.cs.uga.edu/directory/people",
        "Political Science": "https://spia.uga.edu/faculty-and-staff/",
        "Philosophy": "https://philosophy.uga.edu/people/faculty",
        "Economics": "https://www.terry.uga.edu/directory/department/economics",
        "Psychology": "https://psychology.uga.edu/people",
        "Linguistics": "https://linguistics.uga.edu/people",
        "English": "https://english.uga.edu/faculty-staff",
        "History": "https://history.uga.edu/faculty",
        "Sociology": "https://sociology.uga.edu/people",
        "Mathematics": "https://math.uga.edu/directory/faculty",
        "Biology": "https://www.biology.uga.edu/directory/faculty",
        "Physics": "https://www.physast.uga.edu/people/faculty",
        "Chemistry": "https://chem.uga.edu/people/faculty",
        "Terry College of Business": "https://www.terry.uga.edu/directory",
        "School of Law": "https://www.law.uga.edu/faculty",
        "School of Public and International Affairs": "https://spia.uga.edu/faculty-and-staff/",
        "Franklin College (General)": "https://franklin.uga.edu/about/leadership"
    },
    resources: {
        career_center: "https://career.uga.edu/",
        experiential_learning: "https://el.uga.edu/",
        undergraduate_research: "https://curo.uga.edu/",
        honors_program: "https://honors.uga.edu/",
        study_abroad: "https://globalengagement.uga.edu/",
        graduate_school: "https://grad.uga.edu/",
        involvement_network: "https://uga.campuslabs.com/engage/",
        handshake: "https://uga.joinhandshake.com/",
        academic_advising: "https://advising.uga.edu/"
    }
};

// ── state ────────────────────────────────────────────────────
const emptyStudent = {
    name: '', year: '', major: '',
    skills: [], desiredSkills: [],
    experiences: [], interests: []
};

let studentData = { ...emptyStudent };
let currentQuestion = 0;
let chatHistory = [];
let excludedPaths = [];
let generatedDossier = null;
let contacts = [];
let clubs = [];
let newsItems = [];
let opportunities = [];
let draggedItem = null;
let searchDisplayList = [];
let chatBusy = false;
let facultyData = [];
let orgData = [];

// ── helpers ──────────────────────────────────────────────────
const $ = (sel) => document.getElementById(sel);
const parseList = (v) => (v || '').split(',').map(s => s.trim()).filter(Boolean);

function normalizeHttpUrl(url) {
    if (!url) return null;
    try {
        const parsed = new URL(String(url).trim());
        return (parsed.protocol === 'http:' || parsed.protocol === 'https:') ? parsed.href : null;
    } catch {
        return null;
    }
}

function normalizeEmail(email) {
    const value = String(email || '').trim();
    if (!value) return null;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null;
}

function buildEngageUrl(slug, name) {
    // If the slug is already a full URL and it works, use it
    const absolute = normalizeHttpUrl(slug);
    if (absolute) return absolute;

    // Otherwise search by org name — this always works
    const query = (name || slug || '').trim();
    if (!query) return ENGAGE_BASE;
    return `${ENGAGE_SEARCH}${encodeURIComponent(query)}`;
}


function buildFacultyUrl(name, department) {
    // AI-generated profile URLs are unreliable; link to department directory
    const deptUrls = UGA_PROGRAMS.departments_and_faculty_pages || {};
    if (department && deptUrls[department]) return deptUrls[department];
    // Try partial match
    for (const [key, url] of Object.entries(deptUrls)) {
        if (department && (department.includes(key) || key.includes(department))) return url;
    }
    // Fallback: Google the professor's name + UGA
    const query = `${(name || '').trim()} UGA faculty`;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

// ── faculty data ─────────────────────────────────────────────
async function loadFacultyData() {
    try {
        const res = await fetch('/data/faculty.json');
        if (res.ok) {
            const json = await res.json();
            facultyData = json.faculty || [];
        }
    } catch (e) {
        console.warn('Could not load faculty data:', e);
    }
}

function relevantFaculty(maxResults = 20) {
    if (!facultyData.length) return [];
    const keywords = [
        ...studentData.interests,
        ...studentData.desiredSkills,
        ...(studentData.major || '').split(/[,\/]+/)
    ].map(k => k.toLowerCase().trim()).filter(k => k.length > 2);

    const scored = facultyData.map(f => {
        let score = 0;
        const haystack = `${f.department} ${f.expertise} ${f.college}`.toLowerCase();
        keywords.forEach(kw => {
            if (haystack.includes(kw)) score += 3;
            kw.split(/\s+/).forEach(word => {
                if (word.length > 3 && haystack.includes(word)) score += 1;
            });
        });
        return { ...f, _score: score };
    });
    scored.sort((a, b) => b._score - a._score || Math.random() - 0.5);
    return scored.slice(0, maxResults).map(({ _score, ...f }) => f);
}

// ── org data ─────────────────────────────────────────────────
async function loadOrgData() {
    try {
        const res = await fetch('/data/orgs.json');
        if (res.ok) {
            const json = await res.json();
            orgData = json.orgs || [];
        }
    } catch (e) {
        console.warn('Could not load org data:', e);
    }
}

function relevantOrgs(maxResults = 20) {
    if (!orgData.length) return [];
    const keywords = [
        ...studentData.interests,
        ...studentData.desiredSkills,
        ...(studentData.major || '').split(/[,\/;]+/)
    ].map(k => k.toLowerCase().trim()).filter(k => k.length > 2);

    const scored = orgData.map(o => {
        let score = 0;
        const haystack = `${o.name} ${o.category} ${o.description} ${(o.keywords || []).join(' ')}`.toLowerCase();
        keywords.forEach(kw => {
            if (haystack.includes(kw)) score += 3;
            kw.split(/\s+/).forEach(word => {
                if (word.length > 3 && haystack.includes(word)) score += 1;
            });
        });
        return { ...o, _score: score };
    });
    scored.sort((a, b) => b._score - a._score || Math.random() - 0.5);
    return scored.slice(0, maxResults).map(({ _score, ...o }) => o);
}

// ── OpenAI proxy ─────────────────────────────────────────────
async function callAI(messages, maxTokens = 1200, endpoint = API_URL) {
    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages, max_tokens: maxTokens, temperature: 0.7 })
        });
        if (!res.ok) {
            let errText = '';
            try { errText = await res.text(); } catch (_) {}
            console.error('API Error:', res.status, errText);
            showToast(`AI request failed (${res.status}). Check console for details.`, 'error');
            throw new Error(`API ${res.status}: ${errText}`);
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content?.trim() || '';
    } catch (err) {
        console.error('OpenAI call failed:', err);
        showToast('Could not reach AI service. Please try again.', 'error');
        return null;
    }
}

function stripFences(raw) {
    if (!raw) return raw;
    return raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function tryParseJSON(raw) {
    if (!raw) return null;
    const cleaned = stripFences(raw);
    try { return JSON.parse(cleaned); } catch (e) { console.warn('JSON parse failed:', e, cleaned); return null; }
}

// ── profile summary for AI ───────────────────────────────────
function profileBlurb() {
    return `Student Profile:
- Name: ${studentData.name}
- Year: ${studentData.year}
- Academic Program: ${studentData.major}
- Current Skills: ${studentData.skills.join(', ') || 'Not specified'}
- Skills to Develop: ${studentData.desiredSkills.join(', ') || 'Not specified'}
- Current Involvements: ${studentData.experiences.join(', ') || 'Not specified'}
- Career Interests: ${studentData.interests.join(', ') || 'Not specified'}
${excludedPaths.length ? `- Excluded Career Paths: ${excludedPaths.join(', ')}` : ''}`;
}

// ── system prompts ───────────────────────────────────────────
const UGA_CONTEXT = `
UGA ACADEMIC PROGRAMS REFERENCE:
- Franklin College Majors include: Computer Science, Political Science, Psychology, Economics, English, History, Philosophy, Linguistics, Mathematics, Biology, Chemistry, Physics, Sociology, International Affairs, and many more.
- Available Certificates include: Artificial Intelligence, Data Science, Law Jurisprudence and the State, Entrepreneurship, FinTech, Public Health, Workforce Development and Management, New Media, and others.
- Minors include: Business, Informatics, Computer Science, Philosophy, Economics, and 60+ others.

KEY UGA RESOURCES:
- Career Center: career.uga.edu - resume reviews, career fairs, employer connections
- CURO (Undergraduate Research): curo.uga.edu - research opportunities with faculty
- Experiential Learning: el.uga.edu - internships, service-learning
- Handshake: uga.joinhandshake.com - job/internship postings
- UGA Involvement Network: uga.campuslabs.com/engage - 800+ student organizations

FACULTY DIRECTORIES:
- Computer Science: cs.uga.edu/directory/people
- SPIA (Political Science, International Affairs): spia.uga.edu/faculty-and-staff/
- Terry College of Business: terry.uga.edu/directory
- School of Law: law.uga.edu/faculty
- Philosophy: philosophy.uga.edu/people/faculty
- All other departments accessible via franklin.uga.edu

When mentioning faculty, use REAL UGA professors. Check department directories mentally. Use real research areas.
When mentioning student organizations, use REAL UGA organizations from the Involvement Network.
When recommending resources, use the actual UGA resource names and URLs above.
`;

const SYSTEM_DOSSIER = `You are a career analyst producing an objective, factual career assessment for a UGA student.

${UGA_CONTEXT}

TONE AND WRITING RULES:
- Write analytically and objectively — this is an assessment, not a sales pitch or motivational letter.
- Do NOT use flattering or hype language ("uniquely positioned," "superpower," "rare and valuable," etc.).
- STRICT THIRD PERSON throughout every section — never use "you," "your," "you should," "consider," or any second-person address. Write as "This student," "Their background," "Students with this profile," "The candidate," etc.
- State the student's demonstrated interests, skills, and academic focus plainly and accurately.
- For each career path, describe what the role involves, why it aligns with the student's stated background, and one concrete next step.
- Each tier paragraph must be 7-9 sentences. Be specific and grounded — no filler.
- Reference real UGA resources, programs, and deadlines by name.

Output ONLY raw JSON (no markdown fences):
{
  "overview": "<4-6 sentences objectively describing the student's academic background, demonstrated interests, and skill set. State what their coursework and experiences suggest about their career inclinations — no embellishment. Third person only.>",
  "tier1": "<Full paragraph (7-9 sentences). THE VERY FIRST SENTENCE must explicitly name the 3-4 primary career paths (e.g., 'Primary pathways for this student include [Role A], [Role B], and [Role C].'). Then for each path: describe what the role involves, explain how this student's specific background aligns with it, and name one concrete next step or UGA resource. Third person throughout — never 'you' or 'your.'>",
  "tier2": "<Full paragraph (7-9 sentences). THE VERY FIRST SENTENCE must explicitly name the 3-4 adjacent/emerging paths (e.g., 'Adjacent opportunities include [Role A], [Role B], and [Role C].'). For each: explain the connection to the student's existing skills and what additional preparation would strengthen their candidacy. Third person throughout.>",
  "tier3": "<Full paragraph (5-7 sentences). THE VERY FIRST SENTENCE must name the 2-3 longer-term paths (e.g., 'Longer-term options worth tracking include [Path A] and [Path B].'). Explain feasibility given the student's trajectory and what additional development each path requires. Third person throughout.>",
  "summary": "<Full paragraph (5-7 sentences) listing CONCRETE near-term actions: specific steps for this week, this month, and this semester. Name real UGA offices (Career Center, CURO, Handshake, specific departments) and realistic timelines. Do NOT suggest meeting or emailing any specific faculty member by name — faculty names belong only in the suggestedContacts list. Third person throughout.>",
  "careerMatches": ["<role1>", "<role2>", ... 10-15 distinct role titles from all tiers],
  "news": [
    {"title": "<real recent article headline related to student's interests>", "source": "<reputable outlet: NYT, WSJ, Forbes, HBR, Bloomberg, TechCrunch, Wired, The Atlantic, Fast Company, MIT Technology Review, NPR, Reuters, AP, Science, Nature, etc>", "date": "<within the last 6 months, e.g. 'June 2026' or 'March 2026'>"}
    ... provide 7-8 items. Use ONLY reputable major outlets. All dates must be within the last 6 months. Do NOT include a url field.
  ],
  "opportunities": [
    {"title": "<specific actionable step — no faculty name-drops; reference UGA offices and programs instead>", "type": "<category>"}
    ... provide exactly 5 items
  ],
  "suggestedContacts": [
    {"name": "Dr. Full Name", "email": "email@uga.edu", "department": "Department Name", "expertise": "Specific research focus"}
    ... provide exactly 5 faculty chosen from the VERIFIED FACULTY LIST appended to the end of this prompt. Pick those whose research best matches this student. Do NOT invent names not in that list. Do NOT include a profileUrl field.
  ],
  "suggestedClubs": [
    {"name": "Exact org name from the VERIFIED UGA STUDENT ORGANIZATIONS list", "description": "Why this org helps their specific career goals"}
    ... provide exactly 5 orgs chosen ONLY from the VERIFIED UGA STUDENT ORGANIZATIONS list appended to this prompt. Do NOT invent org names. Do NOT include a slug field.
  ]
}`;

const SYSTEM_CHAT = `You are the Franklin Full Circle career advisor at UGA's Franklin College of Arts & Sciences. You function like a knowledgeable, frank career counselor — someone with deep expertise in career paths, law school, graduate programs, industry trends, and UGA's specific resources.

${UGA_CONTEXT}

STUDENT CONTEXT:
{PROFILE}

Current Dossier:
{DOSSIER}

Career Matches Currently Shown: {CAREERS}
Faculty Contacts Currently Shown: {CONTACTS}
Organizations Currently Shown: {CLUBS}

─── ACTION TAGS ───────────────────────────────────────────────
When you need to update the dashboard, embed these tags in your response (they are stripped before display):

[EXCLUDE: career name] — removes a career match bubble

[ADD_CONTACTS: [{"name":"Dr. Full Name","email":"x@uga.edu","department":"Department","expertise":"specific research focus"}]]

[ADD_CLUBS: [{"name":"Exact org name from verified list","description":"why this org serves their specific goals"}]]

[ADD_NEWS: [{"title":"headline","source":"outlet","date":"Month YYYY"}]]

[ADD_OPPS: [{"title":"specific concrete action","type":"category"}]]

[UPDATE_DOSSIER: {"overview":"...","tier1":"...","tier2":"...","tier3":"...","summary":"...","careerMatches":["role1","role2",...]}]
  — Rewrites dossier sections silently. Include ONLY the fields you are changing.
  — Each tier section must be 7-9 sentences (overview 4-6, summary 5-7).
  — Each tier's FIRST SENTENCE must explicitly name the career paths covered in that tier.
  — STRICT THIRD PERSON throughout — never "you" or "your." Use "this student," "their background," etc.
  — careerMatches should be 10-15 role titles reflecting the updated direction.

─── WHEN TO UPDATE THE DOSSIER ────────────────────────────────
Trigger [UPDATE_DOSSIER] immediately — WITHOUT being asked — whenever the student:
  • Mentions a new career interest, field, or goal ("I'm thinking about law school", "I want to go into policy")
  • Corrects or contradicts anything in their dossier
  • Shares new background, experiences, or skills you didn't know about
  • Asks you to redirect, refocus, or update their plan
  • Explicitly says the dossier is wrong or doesn't fit them

The update should happen in the same response as your reply. Do not ask permission first.
Write it as if this student came to you describing themselves freshly — not as a template update.

─── LANGUAGE RULES ────────────────────────────────────────────
NEVER use assumptive language. The student has not done anything you suggest yet.
  ✗ WRONG: "You connected with Dr. Smith..." / "You joined the Pre-Law Society..."
  ✓ RIGHT: "Consider reaching out to Dr. Smith..." / "The Pre-Law Society would be worth looking into..."

NEVER recommend specific faculty by name unless they appear in the VERIFIED FACULTY list provided.
NEVER recommend specific clubs by name unless they appear in the VERIFIED ORGS list provided or are already in the student's clubs list.

─── DOSSIER UPDATES ───────────────────────────────────────────
Silently emit [UPDATE_DOSSIER: {...}] whenever the student shares ANY new information about their interests, goals, or direction — every substantive chat should update the dossier to reflect the latest understanding. Do not wait to be asked. Do not mention you are updating it.

─── FACULTY REFERENCES ────────────────────────────────────────
NEVER suggest meeting with or emailing specific faculty members in the main chat response, in dossier text, or in actionable steps. Faculty names belong ONLY in the Faculty & Staff panel. Actionable steps should reference UGA offices and programs (Career Center, CURO, Handshake, etc.) — not individual people.

─── FOLLOW-UP QUESTIONS ───────────────────────────────────────
Close with exactly 1 follow-up question when the student shares a new direction or goal. Make it specific and useful — not filler. Put it on its own line in bold: **Question?**

Good: "Are you drawn to a particular area of law — litigation, policy, or legal tech?"
Bad: "What are your hobbies?" / "Tell me more about yourself."

─── QUALITY OF ADVICE ──────────────────────────────────────────
Be a real advisor: name real programs, tradeoffs, and realistic timelines. If a plan has a gap, say so.

─── CASUAL / GENERAL QUESTIONS ─────────────────────────────────
When the student asks a simple practical question that is NOT about changing their career direction (e.g., "How do I get involved with consulting?", "What GPA do I need for law school?", "How do I write a cold email?"):
- Give 1 sentence of direct practical advice. No lists.
- End with exactly: "Want on-campus or UGA-specific recommendations for that?"
- Do NOT emit [UPDATE_DOSSIER] — these questions don't signal a directional change.
- Do NOT overwhelm with multiple options or named programs unless asked.
Example: "Consulting entry points are case competitions, internships, and joining relevant clubs. Want on-campus or UGA-specific recommendations for that?"

RESPONSE FORMAT — STRICT:
- MAXIMUM 2 sentences in the main body. Hard limit — no exceptions.
- NO bullet points, numbered lists, or multi-part breakdowns unless explicitly asked.
- NO preamble ("Here are three steps…" / "Great question!" / "I'll update your dossier…").
- Bold (**like this**) only on the follow-up question line. Never in the body.
- Total response including question: 3 sentences max.`;

// Helper to build current dossier summary for chat context
function dossierBlurb() {
    if (!generatedDossier) return 'No dossier generated yet.';
    return [
        generatedDossier.overview ? `Overview: ${generatedDossier.overview}` : '',
        generatedDossier.tier1   ? `Tier 1 (Primary): ${generatedDossier.tier1}` : '',
        generatedDossier.tier2   ? `Tier 2 (Emerging): ${generatedDossier.tier2}` : '',
        generatedDossier.tier3   ? `Tier 3 (Exploratory): ${generatedDossier.tier3}` : '',
        generatedDossier.summary ? `Strategic Summary: ${generatedDossier.summary}` : '',
    ].filter(Boolean).join('\n\n');
}

// ── init ─────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', initializeApp);

async function initializeApp() {
    await Promise.all([loadFacultyData(), loadOrgData()]);
    loadSavedData();
    setupEventListeners();
    setupDragAndDrop();
    loadGridPositions();
    
    if (!studentData.name) {
        showQuestionnaire();
    } else {
        hydrateQuestionInputs();
        renderAll();
        if (!generatedDossier) {
            updateDashboard();
        } else {
            // Always fetch fresh news on load — no stale cache
            refreshNews();
        }
    }

    // Refresh news every 3 minutes while the page is open
    setInterval(() => { if (studentData.name && generatedDossier) refreshNews(); }, 3 * 60 * 1000);

    if (!chatHistory.length) {
        chatHistory.push({
            role: 'assistant',
            content: 'Welcome to Franklin Full Circle. Complete your profile above and I\'ll generate personalized career pathways. Once your dossier is ready, use this chat to refine your direction, explore options, or ask anything about UGA resources, graduate programs, or career paths.'
        });
    }
    renderChatHistory();
}

function setupEventListeners() {
    $('resetBtn').addEventListener('click', resetData);
    $('downloadPdf').addEventListener('click', downloadPDF);
    $('regenerateDossier').addEventListener('click', () => { 
        generatedDossier = null; 
        contacts = [];
        clubs = [];
        newsItems = [];
        opportunities = [];
        persist();
        updateDashboard(); 
    });
    $('chatSend').addEventListener('click', sendChatMessage);
    $('chatInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChatMessage(); }
    });
    $('prevBtn').addEventListener('click', prevQuestion);
    $('nextBtn').addEventListener('click', nextQuestion);

    document.querySelectorAll('.question-input').forEach(input => {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && input.tagName !== 'TEXTAREA') {
                e.preventDefault();
                nextQuestion();
            }
            if (e.key === 'Enter' && input.tagName === 'TEXTAREA' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                nextQuestion();
            }
        });
    });

    document.querySelectorAll('.quick-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            $('chatInput').value = chip.dataset.prompt || '';
            sendChatMessage();
        });
    });
}

// ── questionnaire ────────────────────────────────────────────
function showQuestionnaire() {
    $('questionnaireModal').classList.add('active');
    currentQuestion = 0;
    showQuestion(0);
    updateProgress();
    hydrateQuestionInputs();
    setTimeout(() => {
        const firstInput = document.querySelector('#q0 .question-input');
        if (firstInput) firstInput.focus();
    }, 350);
}

function showQuestion(idx) {
    document.querySelectorAll('.question-slide').forEach(s => s.classList.remove('active'));
    $(`q${idx}`).classList.add('active');
    $('prevBtn').disabled = idx === 0;
    $('nextBtn').innerHTML = idx === 6
        ? 'Finish <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8l3 3 5-6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
        : 'Continue <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 12l4-4-4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    setTimeout(() => {
        const input = document.querySelector(`#q${idx} .question-input`);
        if (input) input.focus();
    }, 100);
}

function nextQuestion() {
    if (!validateCurrentQuestion()) { showToast('Please answer before continuing.', 'error'); return; }
    saveCurrentQuestion();
    if (currentQuestion < 6) { currentQuestion++; showQuestion(currentQuestion); updateProgress(); }
    else completeQuestionnaire();
}

function prevQuestion() {
    if (currentQuestion > 0) { saveCurrentQuestion(); currentQuestion--; showQuestion(currentQuestion); updateProgress(); }
}

function validateCurrentQuestion() {
    const vals = [$('nameInput').value, $('yearSelect').value, $('majorInput').value, $('skillsInput').value, $('desiredSkillsInput').value, $('experiencesInput').value, $('interestsInput').value];
    return vals[currentQuestion]?.trim() !== '';
}

function saveCurrentQuestion() {
    studentData = {
        ...studentData,
        name: $('nameInput').value.trim(),
        year: $('yearSelect').value,
        major: $('majorInput').value.trim(),
        skills: parseList($('skillsInput').value),
        desiredSkills: parseList($('desiredSkillsInput').value),
        experiences: parseList($('experiencesInput').value),
        interests: parseList($('interestsInput').value)
    };
}

function updateProgress() {
    const pct = ((currentQuestion + 1) / 7) * 100;
    $('progressFill').style.width = `${pct}%`;
    $('progressText').textContent = `${currentQuestion + 1} / 7`;
}

async function completeQuestionnaire() {
    saveCurrentQuestion();
    $('questionnaireModal').classList.remove('active');
    showToast('Profile saved — generating your dossier…', 'success');

    const normalized = await normalizeAcademicProgram(studentData.major);
    if (normalized && normalized !== studentData.major) {
        studentData.major = normalized;
        hydrateQuestionInputs();
    }

    persist();
    updateDashboard();
}

async function normalizeAcademicProgram(raw) {
    if (!raw || raw.trim().length < 2) return raw;
    const messages = [
        { role: 'system', content: `Convert a student's free-form academic program description into proper notation. Use standard degree abbreviations and full UGA program names.

Examples:
"bach in comp sci / minor in business" → "B.S. Computer Science; Minor in Business"
"computer science major, math minor" → "B.S. Computer Science; Minor in Mathematics"
"ba english minor poli sci" → "B.A. English; Minor in Political Science"
"double major cs and econ" → "B.S. Computer Science; B.S. Economics"
"journalism" → "B.S. Journalism"
"pre-law political science" → "B.A. Political Science"
"psychology bs, certificate in data science" → "B.S. Psychology; Certificate in Data Science"
"masters data science" → "M.S. Data Science"

Rules:
- Use B.S. for sciences/engineering/business, B.A. for humanities/social sciences (when ambiguous, prefer B.S.)
- Write out full program names (no abbreviations in the name itself)
- Separate multiple programs with semicolons
- Capitalize properly
- If already properly formatted, return it unchanged
Respond with ONLY the formatted string, nothing else.` },
        { role: 'user', content: raw }
    ];
    const result = await callAI(messages, 80);
    return (result && result.length > 0 && result.length < 200) ? result.trim() : raw;
}

function hydrateQuestionInputs() {
    $('nameInput').value = studentData.name || '';
    $('yearSelect').value = studentData.year || '';
    $('majorInput').value = studentData.major || '';
    $('skillsInput').value = (studentData.skills || []).join(', ');
    $('desiredSkillsInput').value = (studentData.desiredSkills || []).join(', ');
    $('experiencesInput').value = (studentData.experiences || []).join(', ');
    $('interestsInput').value = (studentData.interests || []).join(', ');
}

// ── persistence ──────────────────────────────────────────────
function persist() {
    localStorage.setItem('ffc_student', JSON.stringify(studentData));
    localStorage.setItem('ffc_excluded', JSON.stringify(excludedPaths));
    localStorage.setItem('ffc_chat', JSON.stringify(chatHistory.slice(-100)));
    localStorage.setItem('ffc_dossier', JSON.stringify(generatedDossier));
    localStorage.setItem('ffc_contacts', JSON.stringify(contacts));
    localStorage.setItem('ffc_clubs', JSON.stringify(clubs));
    localStorage.setItem('ffc_news', JSON.stringify(newsItems.slice(0, 10)));
    localStorage.setItem('ffc_opps', JSON.stringify(opportunities));
    localStorage.setItem('ffc_updated', new Date().toISOString());
}

function loadSavedData() {
    studentData = JSON.parse(localStorage.getItem('ffc_student') || 'null') || { ...emptyStudent };
    excludedPaths = JSON.parse(localStorage.getItem('ffc_excluded') || '[]');
    chatHistory = JSON.parse(localStorage.getItem('ffc_chat') || '[]');
    generatedDossier = JSON.parse(localStorage.getItem('ffc_dossier') || 'null');
    contacts = JSON.parse(localStorage.getItem('ffc_contacts') || '[]');
    clubs = JSON.parse(localStorage.getItem('ffc_clubs') || '[]');
    const rawNews = JSON.parse(localStorage.getItem('ffc_news') || '[]');
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 6);
    newsItems = rawNews.filter(item => {
        // Drop AI-generated items (no real URL) and items older than 6 months
        if (!item.url) return false;
        const d = new Date(item.date); return !isNaN(d) && d >= cutoff;
    });
    opportunities = JSON.parse(localStorage.getItem('ffc_opps') || '[]');
}

function resetData() {
    if (!confirm('Reset your entire profile, dossier, and chat history? This cannot be undone.')) return;
    // Clear all localStorage keys
    const keysToRemove = [
        'ffc_student', 'ffc_excluded', 'ffc_chat', 'ffc_dossier', 
        'ffc_contacts', 'ffc_clubs', 'ffc_news', 'ffc_opps', 
        'ffc_updated', 'gridPositions'
    ];
    keysToRemove.forEach(k => localStorage.removeItem(k));
    
    // Clear all state
    studentData = { ...emptyStudent };
    excludedPaths = [];
    chatHistory = [];
    generatedDossier = null;
    contacts = [];
    clubs = [];
    newsItems = [];
    opportunities = [];
    
    // Clear UI
    $('chatMessages').innerHTML = '';
    $('contactList').innerHTML = '';
    $('clubList').innerHTML = '';
    $('newsFeed').innerHTML = '';
    $('opportunityList').innerHTML = '';
    const bubblesEl = $('careerBubbles');
    if (bubblesEl) bubblesEl.innerHTML = '';
    const bubblesSection = $('careerBubblesSection');
    if (bubblesSection) bubblesSection.style.display = 'none';
    
    // Reset stats
    $('careerMatches').textContent = '—';
    $('ugaConnections').textContent = '—';
    $('opportunities').textContent = '—';
    $('lastUpdated').textContent = '—';
    $('profileName').textContent = 'Not Set';
    
    // Reset dossier content
    $('dossierMeta').textContent = 'Complete your profile to unlock personalized recommendations.';
    $('overviewText').textContent = 'Complete your profile to generate a personalized career analysis.';
    $('tier1Text').textContent = 'Your multidisciplinary profile will reveal unique career intersections.';
    $('tier2Text').textContent = 'Secondary paths that complement your core interests.';
    $('tier3Text').textContent = 'Related fields to consider as you develop expertise.';
    $('summaryText').textContent = 'Your personalized roadmap will appear here.';
    
    showToast('Profile cleared completely.', 'info');
    showQuestionnaire();
}

// ── render all panels ────────────────────────────────────────
function renderAll() {
    renderDossier();
    renderContacts();
    renderClubs();
    renderNews();
    renderOpportunities();
    renderCareerBubbles();
    updateStats();
    updateQuickChips();
}

// ── dashboard orchestration ──────────────────────────────────
async function updateDashboard() {
    if (!studentData.name) return;
    $('dossierLoading').style.display = 'block';
    $('dossierMeta').textContent = 'Generating your personalized dossier…';

    const filtered = relevantFaculty(20);
    const facultyBlock = filtered.length
        ? `\n\nVERIFIED UGA FACULTY — you MUST pick suggestedContacts only from this list. Do not invent names:\n${JSON.stringify(filtered)}`
        : '';
    const filteredOrgs = relevantOrgs(25);
    const orgBlock = filteredOrgs.length
        ? `\n\nVERIFIED UGA STUDENT ORGANIZATIONS — you MUST pick suggestedClubs only from this list. Do not invent org names:\n${JSON.stringify(filteredOrgs.map(o => ({ name: o.name, description: o.description })))}`
        : '';
    const messages = [
        { role: 'system', content: SYSTEM_DOSSIER + facultyBlock + orgBlock },
        { role: 'user', content: profileBlurb() }
    ];

    const raw = await callAI(messages, 3500);
    $('dossierLoading').style.display = 'none';

    const parsed = tryParseJSON(raw);
    if (parsed && parsed.overview) {
        generatedDossier = parsed;
        if (parsed.suggestedContacts?.length) contacts = [...contacts, ...parsed.suggestedContacts];
        if (parsed.suggestedClubs?.length) clubs = [...clubs, ...parsed.suggestedClubs];
        if (parsed.news?.length) newsItems = parsed.news;
        if (parsed.opportunities?.length) opportunities = parsed.opportunities;
    } else {
        console.warn('Dossier generation failed, using fallback');
        generatedDossier = buildFallbackDossier();
        if (!contacts.length) contacts = fallbackContacts();
        if (!clubs.length) clubs = fallbackClubs();
        newsItems = generatedDossier.news;
        opportunities = generatedDossier.opportunities;
    }

    persist();
    renderAll();
    showToast('Dossier generated!', 'success');
}

async function refreshNews() {
    if (!studentData.name) return;
    const spinnerEl = $('newsLoading');
    if (spinnerEl) spinnerEl.style.display = 'block';

    // Build a search query from student interests + major (top 3 terms, OR-joined)
    const terms = [...(studentData.interests || []), studentData.major]
        .filter(Boolean)
        .flatMap(s => s.split(/[,;]+/).map(t => t.trim()))
        .filter(t => t.length > 2)
        .slice(0, 3);
    const query = terms.length
        ? terms.map(t => `"${t}"`).join(' OR ')
        : 'career industry news';

    try {
        const resp = await fetch('/api/news', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query }),
        });
        const data = await resp.json();
        if (data.articles?.length) {
            newsItems = data.articles;
            persist();
        }
    } catch (err) {
        console.warn('News fetch failed:', err);
    }

    const spinner = $('newsLoading');
    if (spinner) spinner.style.display = 'none';
    renderNews();
}

// ── dossier rendering ────────────────────────────────────────
function updateQuickChips() {
    const careers = generatedDossier?.careerMatches || [];
    const chips = document.querySelectorAll('.quick-chip');
    if (careers.length >= 1 && chips[0]) {
        chips[0].textContent = `Focus on ${careers[0]}`;
        chips[0].dataset.prompt = `Shift my dossier and recommendations to focus more on ${careers[0]} roles.`;
    }
    if (careers.length >= 2 && chips[1]) {
        chips[1].textContent = `Skills for ${careers[1]}`;
        chips[1].dataset.prompt = `What specific skills, experiences, and steps do I need to break into ${careers[1]}?`;
    }
}

function renderDossier() {
    if (!generatedDossier) return;
    const d = generatedDossier;

    const sections = [
        ['overviewSection', 'overviewText', d.overview],
        ['tier1Section',    'tier1Text',    d.tier1],
        ['tier2Section',    'tier2Text',    d.tier2],
        ['tier3Section',    'tier3Text',    d.tier3],
        ['summarySection',  'summaryText',  d.summary],
    ];
    sections.forEach(([sId, pId, text]) => {
        const s = $(sId); const p = $(pId);
        if (!s || !p) return;
        if (text) { p.textContent = text; s.style.display = ''; }
        else        { s.style.display = 'none'; }
    });

    const excluded = excludedPaths.length ? ` · Excluded: ${excludedPaths.join(', ')}` : '';
    $('dossierMeta').textContent = `${studentData.name} · ${studentData.year} · ${studentData.major}${excluded}`;

    const dc = $('dossierContent');
    if (dc) dc.scrollTop = 0;
}

function renderCareerBubbles() {
    const container = $('careerBubbles');
    const section = $('careerBubblesSection');
    if (!container) return;
    
    const careers = generatedDossier?.careerMatches || [];
    const filtered = careers.filter(c => !excludedPaths.includes(c));
    
    if (section) section.style.display = filtered.length ? '' : 'none';
    
    container.innerHTML = filtered.map((c) => {
        const encodedCareer = encodeURIComponent(c);
        return `
        <div class="career-bubble" data-career="${esc(c)}">
            <span>${esc(c)}</span>
            <button class="bubble-x" onclick="removeCareer(decodeURIComponent('${encodedCareer}'))" aria-label="Remove">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2l6 6M8 2L2 8" stroke-linecap="round"/></svg>
            </button>
        </div>`;
    }).join('');
    
    $('careerMatches').textContent = filtered.length;
}

function removeCareer(career) {
    if (career && !excludedPaths.includes(career)) {
        excludedPaths.push(career);
        persist();
        renderCareerBubbles();
        showToast(`Removed "${career}"`, 'info');
    }
}

// ── contacts rendering ───────────────────────────────────────
function renderContacts() {
    const el = $('contactList');
    const query = ($('facultySearch')?.value || '').toLowerCase().trim();

    // If there's a search query, search the full faculty database; otherwise show AI-suggested contacts
    let displayList;
    if (query.length >= 2) {
        displayList = facultyData.filter(f => {
            const haystack = `${f.name} ${f.department} ${f.expertise} ${f.college}`.toLowerCase();
            return query.split(/\s+/).every(word => haystack.includes(word));
        }).slice(0, 20);
    } else {
        displayList = contacts;
    }

    if (query) searchDisplayList = displayList;

    el.innerHTML = displayList.map((c, i) => {
        const isAdded = query && contacts.some(p => p.name === c.name);
        const extraClass = query ? (isAdded ? 'contact-item--added' : 'contact-item--add') : '';
        return `<li class="contact-item ${extraClass}">
            ${!query ? `<button class="item-x" onclick="removeContact(${i})" aria-label="Remove">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2l6 6M8 2L2 8" stroke-linecap="round"/></svg>
            </button>` : ''}
            ${(query && !isAdded) ? `<button class="item-add" onclick="addSearchContact(${i})" aria-label="Add to profile">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 1v10M1 6h10" stroke-linecap="round"/></svg>
            </button>` : ''}
            <div class="contact-name">${esc(c.name)}</div>
            ${normalizeEmail(c.email) ? `<a href="mailto:${esc(normalizeEmail(c.email))}" class="contact-email">${esc(normalizeEmail(c.email))}</a>` : `<div class="contact-email">${esc(c.email || 'Email unavailable')}</div>`}
            <div class="contact-dept">${esc(c.department)}${c.expertise ? ' · ' + esc(c.expertise) : ''}</div>
        </li>`;
    }).join('');

    if (!query) {
        el.innerHTML += `<button class="add-more-btn" onclick="fetchMoreContacts()">+ Add suggestions</button>`;
    } else if (displayList.length === 0) {
        el.innerHTML = `<li class="contact-item" style="color:var(--g-400);font-size:0.8rem;padding:0.5rem">No faculty found for "${esc(query)}"</li>`;
    }

    $('ugaConnections').textContent = contacts.length;
}

function removeContact(idx) {
    contacts.splice(idx, 1);
    persist();
    renderContacts();
}

function addSearchContact(idx) {
    const c = searchDisplayList[idx];
    if (!c) return;
    if (contacts.some(p => p.name === c.name)) {
        showToast(`${c.name} already in your list`, 'info');
        return;
    }
    contacts.unshift(c);
    persist();
    renderContacts();
    showToast(`Added ${c.name}`, 'success');
}
window.addSearchContact = addSearchContact;

async function fetchMoreContacts() {
    const existingNames = contacts.map(c => c.name).join(', ');
    const filtered = relevantFaculty(25);
    const facultySource = filtered.length
        ? `SELECT ONLY from this verified UGA faculty list — do not invent names not on it:\n${JSON.stringify(filtered)}`
        : `${UGA_CONTEXT}\n\nUse REAL professors from UGA department directories.`;
    const messages = [
        { role: 'system', content: `Suggest 3 MORE UGA faculty relevant to this student. Do NOT repeat anyone already listed. Output raw JSON array only (no markdown):\n[{"name":"Full Name","email":"email@uga.edu","department":"Department","expertise":"research focus"}]\n\n${facultySource}` },
        { role: 'user', content: `${profileBlurb()}\n\nAlready suggested (do not repeat): ${existingNames || 'none yet'}` }
    ];
    const raw = await callAI(messages, 600);
    const newContacts = tryParseJSON(raw);
    if (Array.isArray(newContacts) && newContacts.length) {
        contacts = [...newContacts, ...contacts];
        persist();
        renderContacts();
        showToast(`Added ${newContacts.length} faculty contacts`, 'success');
    } else {
        showToast('Could not find additional faculty', 'error');
    }
}

// ── clubs rendering ──────────────────────────────────────────
function renderClubs() {
    const el = $('clubList');
    const query = ($('orgSearch')?.value || '').toLowerCase().trim();
    const savedNames = new Set(clubs.map(c => c.name));

    if (query.length >= 2) {
        // Search mode — hover gradient + animation, same pattern as faculty
        const words = query.split(/\s+/).filter(w => w.length > 1);
        const results = orgData.filter(o => {
            const haystack = `${o.name} ${o.category} ${o.description} ${(o.keywords || []).join(' ')}`.toLowerCase();
            return words.every(w => haystack.includes(w));
        }).slice(0, 20);

        if (results.length === 0) {
            el.innerHTML = `<li class="club-item" style="color:var(--g-400);font-size:0.8rem;padding:0.5rem">No organizations found for "${esc(query)}"</li>`;
            return;
        }

        el.innerHTML = results.map(o => {
            const saved = savedNames.has(o.name);
            const encoded = encodeURIComponent(o.name);
            return `<li class="club-item ${saved ? 'club-item--added' : 'club-item--add'}">
                ${!saved ? `<button class="item-add" onclick="addOrgToProfile(decodeURIComponent('${encoded}'))" aria-label="Add to profile">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 1v10M1 6h10" stroke-linecap="round"/></svg>
                </button>` : ''}
                <div class="club-name">${esc(o.name)}</div>
                <div class="club-description">${esc(o.category || '')}</div>
            </li>`;
        }).join('');
    } else {
        // Default mode — saved clubs with red × to remove + Add suggestions button
        el.innerHTML = clubs.map((c, i) => `
            <li class="club-item">
                <button class="item-x" onclick="removeClub(${i})" aria-label="Remove">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2l6 6M8 2L2 8" stroke-linecap="round"/></svg>
                </button>
                <div class="club-name">${esc(c.name)}</div>
                <div class="club-description">${esc(c.description || c.category || '')}</div>
            </li>`).join('');
        el.innerHTML += `<button class="add-more-btn" onclick="fetchMoreClubs()">+ Add suggestions</button>`;
    }
}

function addOrgToProfile(name) {
    if (clubs.some(c => c.name === name)) {
        showToast(`Already in your profile`, 'info');
        return;
    }
    const org = orgData.find(o => o.name === name);
    if (!org) return;
    clubs.unshift({ name: org.name, description: org.description || org.category || '' });
    persist();
    renderClubs(); // re-render so checkmark shows immediately
    showToast(`Added "${name}"`, 'success');
}

function removeClub(idx) {
    clubs.splice(idx, 1);
    persist();
    renderClubs();
}

async function fetchMoreClubs() {
    const existingNames = clubs.map(c => c.name).join(', ');
    const filteredOrgs = relevantOrgs(30);
    const orgSource = filteredOrgs.length
        ? `SELECT ONLY from this verified org list — do not invent names not on it:\n${JSON.stringify(filteredOrgs.map(o => ({ name: o.name, description: o.description })))}`
        : '';
    const messages = [
        { role: 'system', content: `Suggest 3 MORE student organizations relevant to this student. Do NOT repeat anyone already listed. Output raw JSON array only (no markdown):\n[{"name":"Exact org name","description":"why this org fits their goals"}]\n\n${orgSource}` },
        { role: 'user', content: `${profileBlurb()}\n\nAlready suggested (do not repeat): ${existingNames || 'none yet'}` }
    ];
    const raw = await callAI(messages, 500);
    const newClubs = tryParseJSON(raw);
    if (Array.isArray(newClubs) && newClubs.length) {
        clubs = [...newClubs, ...clubs];
        persist();
        renderClubs();
        showToast(`Added ${newClubs.length} organizations`, 'success');
    } else {
        showToast('Could not find additional organizations', 'error');
    }
}
window.fetchMoreClubs = fetchMoreClubs;

// ── news rendering ───────────────────────────────────────────
function renderNews() {
    const el = $('newsFeed');
    // Always re-inject the spinner so it's never destroyed by innerHTML replacement
    const spinnerHTML = '<div class="loading-spinner" id="newsLoading" style="display:none;"></div>';
    if (!newsItems.length) {
        el.innerHTML = spinnerHTML + `<div class="news-empty">No recent news loaded — generating now…</div>`;
        return;
    }
    el.innerHTML = spinnerHTML + newsItems.map((n, i) => {
        const textBlock = n.url
            ? `<a class="news-link" href="${esc(n.url)}" target="_blank" rel="noopener noreferrer">
                <div class="news-title">${esc(n.title)}</div>
                <div class="news-source"><span>${esc(n.source)}</span><span class="news-date">· ${esc(n.date)}</span></div>
               </a>`
            : `<div class="news-title">${esc(n.title)}</div>
               <div class="news-source"><span>${esc(n.source)}</span><span class="news-date">· ${esc(n.date)}</span></div>`;
        return `<div class="news-item">
            <button class="item-x" onclick="removeNews(${i})" aria-label="Remove">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2l6 6M8 2L2 8" stroke-linecap="round"/></svg>
            </button>
            ${textBlock}
        </div>`;
    }).join('');
}

function removeNews(idx) {
    newsItems.splice(idx, 1);
    persist();
    renderNews();
}

// ── opportunities rendering ──────────────────────────────────
function renderOpportunities() {
    const el = $('opportunityList');
    el.innerHTML = opportunities.map((o, i) => `
        <div class="opp-item${o.done ? ' opp-done' : ''}">
            <label class="opp-check-label">
                <input type="checkbox" class="opp-checkbox" ${o.done ? 'checked' : ''} onchange="toggleOpp(${i}, this.checked)" aria-label="Mark complete">
            </label>
            <div class="opp-body">
                <div class="opp-title">${esc(o.title)}</div>
                <div class="opp-meta"><span>${esc(o.type)}</span></div>
            </div>
            <button class="item-x" onclick="removeOpp(${i})" aria-label="Remove">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2l6 6M8 2L2 8" stroke-linecap="round"/></svg>
            </button>
        </div>
    `).join('');
    el.innerHTML += `<button class="add-more-btn" onclick="fetchMoreOpportunities()">+ Add more suggestions</button>`;
    $('opportunities').textContent = opportunities.filter(o => !o.done).length;
}

function toggleOpp(idx, done) {
    opportunities[idx] = { ...opportunities[idx], done };
    persist();
    renderOpportunities();
}

function removeOpp(idx) {
    opportunities.splice(idx, 1);
    persist();
    renderOpportunities();
}

async function fetchMoreOpportunities() {
    showToast('Finding more action steps…', 'info');
    const existing = opportunities.map(o => o.title).join('; ');
    const messages = [
        { role: 'system', content: `Generate 3 NEW actionable career steps for this student. Do NOT repeat anything already listed. Be specific — name real UGA programs or offices where possible. Output raw JSON array only:\n[{"title":"...","type":"..."}]` },
        { role: 'user', content: `${profileBlurb()}\n\nAlready listed (do not repeat): ${existing}` }
    ];
    const raw = await callAI(messages, 400);
    const newOpps = tryParseJSON(raw);
    if (Array.isArray(newOpps) && newOpps.length) {
        opportunities = [...newOpps, ...opportunities];
        persist();
        renderOpportunities();
        showToast(`Added ${newOpps.length} steps`, 'success');
    } else {
        showToast('Could not generate more steps', 'error');
    }
}

// ── chat ─────────────────────────────────────────────────────
async function sendChatMessage() {
    if (chatBusy) return;
    const input = $('chatInput');
    const msg = input.value.trim();
    if (!msg) return;

    chatBusy = true;
    input.value = '';
    $('chatSend').disabled = true;
    
    // Add user message to history and render immediately
    chatHistory.push({ role: 'user', content: msg });
    renderChatHistory();

    // Build context for API
    const careers = generatedDossier?.careerMatches?.filter(c => !excludedPaths.includes(c)).join(', ') || 'none generated yet';
    const contactNames = contacts.map(c => c.name).join(', ') || 'none yet';
    const clubNames = clubs.map(c => c.name).join(', ') || 'none yet';
    
    const filtered = relevantFaculty(15);
    const facultyBlock = filtered.length
        ? `\n\nVERIFIED UGA FACULTY — when suggesting contacts via [ADD_CONTACTS], use ONLY names from this list:\n${JSON.stringify(filtered)}`
        : '';
    const filteredOrgs = relevantOrgs(20);
    const orgBlock = filteredOrgs.length
        ? `\n\nVERIFIED UGA STUDENT ORGANIZATIONS — when suggesting clubs via [ADD_CLUBS], use ONLY org names from this list:\n${JSON.stringify(filteredOrgs.map(o => ({ name: o.name, description: o.description })))}`
        : '';
    let sysPrompt = (SYSTEM_CHAT + facultyBlock + orgBlock)
        .replace('{PROFILE}', profileBlurb())
        .replace('{DOSSIER}', dossierBlurb())
        .replace('{CAREERS}', careers)
        .replace('{CONTACTS}', contactNames)
        .replace('{CLUBS}', clubNames);
    
    // Build messages array with full history
    const apiMessages = [{ role: 'system', content: sysPrompt }];
    
    // Include full chat history (last 40 messages)
    const historyForAPI = chatHistory.slice(-40);
    historyForAPI.forEach(m => {
        apiMessages.push({ 
            role: m.role === 'user' ? 'user' : 'assistant', 
            content: m.content 
        });
    });

    // Show typing indicator
    const typingNode = document.createElement('div');
    typingNode.className = 'message assistant loading';
    typingNode.textContent = 'Thinking…';
    $('chatMessages').appendChild(typingNode);
    $('chatMessages').scrollTop = $('chatMessages').scrollHeight;

    // Make API call
    const response = await callAI(apiMessages, 1000);
    
    // Remove typing indicator
    if (typingNode.parentNode) typingNode.remove();
    
    $('chatSend').disabled = false;
    chatBusy = false;

    if (!response) {
        chatHistory.push({ role: 'assistant', content: 'I\'m having trouble connecting right now. Please try again in a moment.' });
        persist();
        renderChatHistory();
        return;
    }

    let text = response;

    // Process action directives
    const excludeMatches = text.matchAll(/\[EXCLUDE:\s*([^\]]+)\]/gi);
    for (const match of excludeMatches) {
        const career = match[1].trim();
        if (career && !excludedPaths.includes(career)) {
            excludedPaths.push(career);
            showToast(`Removed "${career}" from careers`, 'info');
        }
    }
    renderCareerBubbles();

    // Process ADD directives
    const contactsMatch = text.match(/\[ADD_CONTACTS:\s*(\[[\s\S]*?\])\s*\]/i);
    if (contactsMatch) {
        const newContacts = tryParseJSON(contactsMatch[1]);
        if (Array.isArray(newContacts) && newContacts.length) {
            contacts = [...newContacts, ...contacts];
            renderContacts();
            showToast(`Added ${newContacts.length} contacts`, 'success');
        }
    }

    const clubsMatch = text.match(/\[ADD_CLUBS:\s*(\[[\s\S]*?\])\s*\]/i);
    if (clubsMatch) {
        const newClubs = tryParseJSON(clubsMatch[1]);
        if (Array.isArray(newClubs) && newClubs.length) {
            clubs = [...newClubs, ...clubs];
            renderClubs();
            showToast(`Added ${newClubs.length} organizations`, 'success');
        }
    }

    const newsMatch = text.match(/\[ADD_NEWS:\s*(\[[\s\S]*?\])\s*\]/i);
    if (newsMatch) {
        const newNews = tryParseJSON(newsMatch[1]);
        if (Array.isArray(newNews) && newNews.length) {
            newsItems = [...newsItems, ...newNews];
            renderNews();
        }
    }

    const oppsMatch = text.match(/\[ADD_OPPS:\s*(\[[\s\S]*?\])\s*\]/i);
    if (oppsMatch) {
        const newOpps = tryParseJSON(oppsMatch[1]);
        if (Array.isArray(newOpps) && newOpps.length) {
            opportunities = [...opportunities, ...newOpps];
            renderOpportunities();
        }
    }

    const dossierUpdateMatch = text.match(/\[UPDATE_DOSSIER:\s*(\{[\s\S]*?\})\s*\]/i);
    if (dossierUpdateMatch && generatedDossier) {
        const updates = tryParseJSON(dossierUpdateMatch[1]);
        if (updates && typeof updates === 'object') {
            if (updates.overview) generatedDossier.overview = updates.overview;
            if (updates.tier1) generatedDossier.tier1 = updates.tier1;
            if (updates.tier2) generatedDossier.tier2 = updates.tier2;
            if (updates.tier3) generatedDossier.tier3 = updates.tier3;
            if (updates.summary) generatedDossier.summary = updates.summary;
            if (Array.isArray(updates.careerMatches) && updates.careerMatches.length) {
                generatedDossier.careerMatches = updates.careerMatches;
                excludedPaths = excludedPaths.filter(p => !updates.careerMatches.includes(p));
            }
            renderDossier();
            renderCareerBubbles();
            updateQuickChips();
            showToast('Dossier updated!', 'success');
        }
    }

    // Clean directives from display text
    text = text
        .replace(/\[EXCLUDE:[^\]]*\]/gi, '')
        .replace(/\[ADD_CONTACTS:\s*\[[\s\S]*?\]\s*\]/gi, '')
        .replace(/\[ADD_CLUBS:\s*\[[\s\S]*?\]\s*\]/gi, '')
        .replace(/\[ADD_NEWS:\s*\[[\s\S]*?\]\s*\]/gi, '')
        .replace(/\[ADD_OPPS:\s*\[[\s\S]*?\]\s*\]/gi, '')
        .replace(/\[UPDATE_DOSSIER:\s*\{[\s\S]*?\}\s*\]/gi, '')
        .trim();

    if (text) {
        chatHistory.push({ role: 'assistant', content: text });
    }
    
    persist();
    renderChatHistory();
}

function renderChatHistory() {
    const container = $('chatMessages');
    container.innerHTML = '';
    chatHistory.slice(-50).forEach(m => {
        const node = document.createElement('div');
        node.className = `message ${m.role}`;
        node.innerHTML = esc(m.content)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
        container.appendChild(node);
    });
    container.scrollTop = container.scrollHeight;
}

function clearChatView() {
    chatHistory = [{
        role: 'assistant',
        content: 'Hi! Ask me anything about your career paths, UGA resources, or how to refine your dossier.'
    }];
    persist();
    renderChatHistory();
}

// ── stats ────────────────────────────────────────────────────
function updateStats() {
    $('profileName').textContent = studentData.name || 'Not Set';
    const updated = localStorage.getItem('ffc_updated');
    if (updated) $('lastUpdated').textContent = new Date(updated).toLocaleDateString();
}

// ── drag & drop ──────────────────────────────────────────────
function setupDragAndDrop() {
    const grid = $('dashboardGrid');
    let lastSwapAt = 0;
    const SWAP_COOLDOWN = 180; // ms — prevents rapid oscillation at card borders

    // ── auto-scroll ──────────────────────────────────────────
    let scrollVel = 0;
    let scrollRaf = null;
    const SCROLL_ZONE = 120; // px from viewport edge
    const SCROLL_MAX  = 14;  // px per frame at full speed

    function scrollTick() {
        if (Math.abs(scrollVel) > 0.1) {
            window.scrollBy(0, scrollVel);
            scrollRaf = requestAnimationFrame(scrollTick);
        } else {
            scrollRaf = null;
        }
    }

    function setScrollVel(clientY) {
        const vh = window.innerHeight;
        if (clientY < SCROLL_ZONE) {
            scrollVel = -SCROLL_MAX * (1 - clientY / SCROLL_ZONE);
        } else if (clientY > vh - SCROLL_ZONE) {
            scrollVel = SCROLL_MAX * (1 - (vh - clientY) / SCROLL_ZONE);
        } else {
            scrollVel = 0;
        }
        if (scrollVel && !scrollRaf) scrollRaf = requestAnimationFrame(scrollTick);
    }

    // ── card listeners ───────────────────────────────────────
    document.querySelectorAll('.grid-item').forEach(item => {
        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            lastSwapAt  = Date.now();
            e.dataTransfer.effectAllowed = 'move';

            // Clone off-screen so the browser snapshot only captures this card
            const clone = this.cloneNode(true);
            const rect  = this.getBoundingClientRect();
            Object.assign(clone.style, {
                position: 'fixed', top: '-9999px', left: '-9999px',
                width:  rect.width  + 'px',
                height: rect.height + 'px',
                overflow: 'hidden', pointerEvents: 'none', opacity: '1',
            });
            document.body.appendChild(clone);
            e.dataTransfer.setDragImage(clone, e.clientX - rect.left, e.clientY - rect.top);
            requestAnimationFrame(() => {
                document.body.removeChild(clone);
                this.classList.add('dragging');
            });
        });

        item.addEventListener('dragend', function() {
            scrollVel = 0;
            this.classList.remove('dragging');
            draggedItem = null;
            saveGridPositions();
        });
    });

    // ── dragover: single handler does everything ─────────────
    // Using dragover (not dragenter) avoids duplicate fires from child elements.
    // Throttle + midpoint-crossing guard prevents rapid oscillation.
    grid.addEventListener('dragover', function(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setScrollVel(e.clientY);

        if (!draggedItem) return;

        const target = e.target.closest('.grid-item');
        if (!target || target === draggedItem) return;

        // Throttle: don't swap more than once per SWAP_COOLDOWN ms
        const now = Date.now();
        if (now - lastSwapAt < SWAP_COOLDOWN) return;

        // Midpoint guard: only commit the swap once the cursor has crossed
        // the center of the target card.  Prevents cards from bouncing back
        // and forth when the cursor lingers near a card border.
        const rect   = target.getBoundingClientRect();
        const midX   = rect.left + rect.width  / 2;
        const midY   = rect.top  + rect.height / 2;
        const cards  = [...grid.children];
        const dIdx   = cards.indexOf(draggedItem);
        const tIdx   = cards.indexOf(target);

        // Decide axis: same row → horizontal check; different row → vertical
        const dragRect  = draggedItem.getBoundingClientRect();
        const sameRow   = Math.abs(rect.top - dragRect.top) < rect.height * 0.5;
        if (sameRow) {
            if (dIdx < tIdx && e.clientX < midX) return; // moving right, not past mid
            if (dIdx > tIdx && e.clientX > midX) return; // moving left, not past mid
        } else {
            if (dIdx < tIdx && e.clientY < midY) return; // moving down, not past mid
            if (dIdx > tIdx && e.clientY > midY) return; // moving up, not past mid
        }

        lastSwapAt = now;
        if (dIdx < tIdx) grid.insertBefore(draggedItem, target.nextSibling);
        else             grid.insertBefore(draggedItem, target);
    });

    grid.addEventListener('dragleave', function(e) {
        // Stop scrolling when the cursor leaves the grid entirely
        if (!grid.contains(e.relatedTarget)) scrollVel = 0;
    });

    grid.addEventListener('drop', e => e.preventDefault());
}

function saveGridPositions() {
    const pos = {};
    [...$('dashboardGrid').children].forEach((item, i) => { pos[item.dataset.grid] = i; });
    localStorage.setItem('gridPositions', JSON.stringify(pos));
}

function loadGridPositions() {
    const saved = JSON.parse(localStorage.getItem('gridPositions') || 'null');
    if (!saved) return;
    const grid = $('dashboardGrid');
    [...grid.children].sort((a, b) => (saved[a.dataset.grid] ?? 99) - (saved[b.dataset.grid] ?? 99)).forEach(item => grid.appendChild(item));
}

// ── PDF ──────────────────────────────────────────────────────
function downloadPDF() {
    if (!studentData.name || !generatedDossier) { showToast('Complete your profile first.', 'error'); return; }
    const jsPDF = window.jspdf?.jsPDF;
    if (!jsPDF) { showToast('PDF library loading…', 'error'); return; }

    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const PW = 612, PH = 792;
    const ML = 58,  MR = 58;
    const TW = PW - ML - MR;   // 496pt body text width

    // Left column stops here so right column (label + date) never overlaps
    const LEFT_W  = TW - 150;  // 346pt
    const RIGHT_X = PW - MR;   // 554pt, right-aligned anchor

    const RED   = [186, 12, 47];
    const DARK  = [20,  23, 28];
    const MID   = [60,  70, 90];
    const MUTED = [138, 146, 164];
    const WHITE = [255, 255, 255];
    const W85   = [220, 225, 235];  // white 85%
    const W65   = [180, 188, 205];  // white 65%
    const W50   = [155, 163, 182];  // white 50%

    // Pre-measure program line at 10.5pt Times so we can size the header correctly
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    const prog = [studentData.major, studentData.year].filter(Boolean).join('  ·  ');
    const progLines = prog ? doc.splitTextToSize(prog, LEFT_W) : [];

    // Header grows to fit wrapped program text
    // Base: name(38) + first prog line(16) + institution(14) + bottom padding(20) + stripe(3)
    const HEADER_H = 91 + Math.max(0, progLines.length - 1) * 14;

    let y = 0, pageNum = 1;

    function drawFooter() {
        doc.setFont('times', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.setDrawColor(...MUTED);
        doc.setLineWidth(0.3);
        doc.line(ML, PH - 40, PW - MR, PH - 40);
        doc.text('Franklin Full Circle  ·  University of Georgia', ML, PH - 27);
        doc.text(String(pageNum), PW / 2, PH - 27, { align: 'center' });
        doc.text(studentData.name || '', RIGHT_X, PH - 27, { align: 'right' });
    }

    function checkPage(need) {
        if (y + need > PH - 58) {
            drawFooter();
            doc.addPage();
            pageNum++;
            y = 50;
        }
    }

    // ── HEADER BAND (UGA RED) ────────────────────────────────────
    doc.setFillColor(...RED);
    doc.rect(0, 0, PW, HEADER_H, 'F');

    // Darker stripe at base of header
    doc.setFillColor(130, 8, 32);
    doc.rect(0, HEADER_H - 3, PW, 3, 'F');

    // Student name
    doc.setFont('times', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...WHITE);
    doc.text(studentData.name || 'Student', ML, 38);

    // Program line(s) — wrapped to LEFT_W so they never reach the right column
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...W85);
    let progY = 54;
    progLines.forEach(line => { doc.text(line, ML, progY); progY += 14; });

    // Institution — sits below the last program line
    doc.setFont('times', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(...W65);
    doc.text('Franklin College of Arts & Sciences  ·  University of Georgia', ML, progY + 1);

    // Right column: label + date (anchored at top of header, right-aligned)
    doc.setFont('times', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...W50);
    doc.text('CAREER DOSSIER', RIGHT_X, 38, { align: 'right' });

    doc.setFont('times', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...W65);
    doc.text(
        new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        RIGHT_X, 52, { align: 'right' }
    );

    y = HEADER_H + 26;
    drawFooter();

    // ── BODY SECTIONS ───────────────────────────────────────────
    const sections = [
        ['Overview & Proclivities',    generatedDossier.overview],
        ['Tier One — Primary Pathways',        generatedDossier.tier1],
        ['Tier Two — Emerging Opportunities',  generatedDossier.tier2],
        ['Tier Three — Exploratory Options',   generatedDossier.tier3],
        ['Strategic Recommendations',          generatedDossier.summary]
    ];

    sections.forEach(([title, text]) => {
        if (!text) return;
        checkPage(64);

        // Red left-bar accent — mirrors the web dossier sections
        doc.setFillColor(...RED);
        doc.rect(ML, y - 12, 3, 16, 'F');

        doc.setFont('times', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(...DARK);
        doc.text(title, ML + 10, y);
        y += 17;

        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...MID);
        doc.splitTextToSize(text, TW).forEach(line => {
            checkPage(13);
            doc.text(line, ML, y);
            y += 13;
        });

        y += 12;
    });

    doc.save((studentData.name || 'Student').replace(/\s+/g, '_') + '_Career_Dossier.pdf');
    showToast('PDF downloaded.', 'success');
}

// ── fallbacks ────────────────────────────────────────────────
function buildFallbackDossier() {
    return {
        overview: `This student's profile reflects a combination of technical capability and humanistic perspective that positions them well for roles bridging data and decision-making, innovation and impact. Their coursework and stated experiences suggest a leaning toward analytical and cross-disciplinary work rather than narrow specialization. The breadth of their background is the defining characteristic — one that translates into a specific set of career pathways where generalist depth is an asset.`,
        tier1: `Primary pathways for this student include Product Strategy, Policy Research, and Management Consulting. Product Strategy roles at mission-driven technology companies draw directly on the ability to synthesize technical and human considerations; the UGA Career Center hosts employer panels with tech firms each semester where this pipeline is accessible. Policy Research positions at institutions like Brookings, RAND, or the Aspen Institute reward precisely the kind of interdisciplinary fluency this student's profile suggests; a relevant research methods course or CURO project would strengthen candidacy. Management Consulting — particularly at firms with established public sector practices such as McKinsey Public Sector or Deloitte Government — values cross-domain thinking as a core input; case interview preparation through the UGA Terry College Business Career Center is a concrete first step even for non-business majors. Each of these paths is accessible from a Franklin College background with deliberate positioning.`,
        tier2: `Adjacent opportunities include Civic Technology, University Innovation roles, and Research Operations. Civic Technology organizations — Code for America, the U.S. Digital Service, and state-level digital services teams — are expanding and explicitly recruit candidates with interdisciplinary backgrounds; attending a civic tech hackathon or virtual info session is a low-barrier entry point. University Innovation positions, such as program managers at UGA's Innovation District or academic entrepreneurship centers, reward the ability to work across disciplines and departments — these roles often arise through internal postings and referrals rather than traditional job boards. Research Operations at interdisciplinary institutes (MIT Media Lab, Stanford's d.school, Georgia Tech's IPAT) actively seek generalists who can support cross-functional projects; a strong writing sample and demonstrated project management experience are the primary credentials needed. Building one concrete portfolio piece — a brief, case study, or initiative proposal — would materially strengthen candidacy across all of these paths.`,
        tier3: `Longer-term options worth tracking include joint graduate degrees, entrepreneurial ventures, and independent research initiatives. Joint degree programs such as JD/MBA, MPP/MS, or MPA/MS combinations formally credential the kind of interdisciplinary expertise this student is developing and open doors that single-discipline credentials may not. Early-stage ventures — particularly those at the intersection of technology and public interest — are another avenue, as small teams at this stage value versatility over narrow specialization. The UGA Entrepreneurship Program and Innovation Fellows certificate provide structured support for students considering this direction. These paths require more runway than traditional employment but are well-matched to this student's profile trajectory.`,
        summary: `Near-term priorities for this student begin with outreach: emailing one relevant UGA faculty member for an informational conversation this week — the Computer Science or SPIA faculty directories are useful starting points. Setting up targeted job alerts on Handshake (uga.joinhandshake.com) for Tier 1 role categories should follow within the same week. Within 14 days, attending a student organization meeting in an adjacent field will build both network and context. A scheduled appointment at the UGA Career Center for a resume review oriented toward target sectors is a productive 30-day goal. By end of semester, producing one portfolio artifact — an analysis, brief, or prototype — will give this student something tangible to reference in applications and conversations. Aligning remaining coursework with these pathways through an academic advisor meeting rounds out the near-term roadmap.`,
        careerMatches: ['Product Strategist', 'Policy Analyst', 'Management Consultant', 'Civic Technologist', 'Research Analyst', 'Innovation Program Manager', 'UX Researcher', 'Strategy Associate', 'Venture Analyst', 'Program Coordinator', 'Data Analyst', 'Business Analyst'],
        news: [
            { title: 'The rise of interdisciplinary careers in tech policy', source: 'Harvard Business Review', date: 'This week' },
            { title: 'Why companies are hiring liberal arts majors for technical roles', source: 'Forbes', date: '3 days ago' },
            { title: 'UGA expands experiential learning and career pathways', source: 'UGA Today', date: 'This week' },
            { title: 'Policy expertise is increasingly in demand at technology companies', source: 'Brookings Institution', date: '1 week ago' },
            { title: 'Graduate programs for cross-disciplinary thinkers are booming', source: 'Inside Higher Ed', date: '2 weeks ago' }
        ],
        opportunities: [
            { title: 'Email one UGA faculty member for an informational conversation', type: 'Networking', timeline: 'This week' },
            { title: 'Set up job alerts on Handshake for target roles', type: 'Job Search', timeline: 'This week' },
            { title: 'Attend a career-adjacent student organization meeting', type: 'Exploration', timeline: '14 days' },
            { title: 'Schedule a UGA Career Center resume review', type: 'Career Prep', timeline: '21 days' },
            { title: 'Create a cross-disciplinary portfolio piece', type: 'Portfolio', timeline: '30 days' },
            { title: 'Research 3 graduate programs aligned with your interests', type: 'Planning', timeline: '30 days' }
        ]
    };
}

function fallbackContacts() {
    return [
        { name: 'Dr. Thiab Taha', email: 'thiab@uga.edu', department: 'Computer Science', expertise: 'Scientific Computing, Applied Mathematics' },
        { name: 'Dr. Shannon Dobranski', email: 'sld@uga.edu', department: 'Franklin College (General)', expertise: 'Associate Dean for Academic Programs' },
        { name: 'Dr. Audrey Haynes', email: 'ahaynes@uga.edu', department: 'School of Public and International Affairs', expertise: 'Political Science, American Politics' }
    ];
}

function fallbackClubs() {
    return [
        { name: 'Association for Computing Machinery at UGA', description: 'Technical workshops, hackathons, and industry networking for computing careers' },
        { name: 'UGA Mock Trial', description: 'Develops argumentation, public speaking, and analytical reasoning skills' },
        { name: 'Entrepreneurship Club', description: 'Startup skills, venture thinking, and innovation mindset development' }
    ];
}

// ── utilities ────────────────────────────────────────────────
function esc(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
}

function showToast(message, type = 'info') {
    const toast = $('toast');
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => toast.classList.remove('show'), 2800);
}

// Global exports for onclick handlers
window.removeCareer = removeCareer;
window.removeContact = removeContact;
window.removeClub = removeClub;
window.addOrgToProfile = addOrgToProfile;
window.removeNews = removeNews;
window.removeOpp = removeOpp;
window.toggleOpp = toggleOpp;
window.fetchMoreContacts = fetchMoreContacts;
window.fetchMoreOpportunities = fetchMoreOpportunities;
window.clearChatView = clearChatView;
window.refreshNews = refreshNews;