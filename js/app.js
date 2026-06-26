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

function buildNewsUrl(title, source) {
    // AI can't generate real article URLs; link to a Google search instead
    const query = `${(title || '').trim()} ${(source || '').trim()}`.trim();
    if (!query) return null;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
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
- State the student's demonstrated interests, skills, and academic focus plainly and accurately.
- For each career path, describe what the role involves, why it aligns with the student's stated background, and one concrete next step.
- Each section must be 4-6 sentences. Be specific and grounded — no filler.
- Reference real UGA resources, programs, and deadlines by name.
- Write in third person (e.g., "This student's background in..." or "Students with this profile...").

Output ONLY raw JSON (no markdown fences):
{
  "overview": "<4-6 sentences objectively describing the student's academic background, demonstrated interests, and skill set. State what their coursework and experiences suggest about their career inclinations — no embellishment.>",
  "tier1": "<Full paragraph (5-7 sentences) identifying 3-4 PRIMARY career paths that align directly with the student's stated major, skills, and interests. For each: describe the role, explain the specific alignment with this student's profile, and name one concrete step or UGA resource.>",
  "tier2": "<Full paragraph (5-7 sentences) identifying 3-4 ADJACENT or EMERGING paths the student's background qualifies them for, including fields they may not have considered. Explain the connection to their existing skills and what additional preparation would help.>",
  "tier3": "<Full paragraph (4-5 sentences) identifying 2-3 LONGER-TERM or UNCONVENTIONAL paths — graduate study options, entrepreneurial directions, or niche fields — that are feasible but require additional development or commitment.>",
  "summary": "<Full paragraph (5-7 sentences) listing CONCRETE near-term actions: specific steps for this week, this month, and this semester. Name real UGA offices (Career Center, CURO, Handshake, specific departments) and realistic timelines.>",
  "careerMatches": ["<role1>", "<role2>", ... 10-15 distinct role titles from all tiers],
  "news": [
    {"title": "<real recent article headline related to student's interests>", "source": "<reputable outlet: NYT, WSJ, Forbes, HBR, Bloomberg, TechCrunch, Wired, The Atlantic, Fast Company, MIT Technology Review, NPR, Reuters, AP, Science, Nature, etc>", "date": "<within the last 6 months, e.g. 'June 2026' or 'March 2026'>"}
    ... provide 5-6 items. Use ONLY reputable major outlets. All dates must be within the last 6 months. Do NOT include a url field.
  ],
  "opportunities": [
    {"title": "<specific actionable step>", "type": "<category>"}
    ... provide 5-6 items
  ],
  "suggestedContacts": [
    {"name": "Dr. Full Name", "email": "email@uga.edu", "department": "Department Name", "expertise": "Specific research focus"}
    ... provide 3-4 faculty chosen from the VERIFIED FACULTY LIST appended to the end of this prompt. Pick those whose research best matches this student. Do NOT invent names not in that list. Do NOT include a profileUrl field.
  ],
  "suggestedClubs": [
    {"name": "Exact org name from the VERIFIED UGA STUDENT ORGANIZATIONS list", "description": "Why this org helps their specific career goals"}
    ... provide 3-4 orgs chosen ONLY from the VERIFIED UGA STUDENT ORGANIZATIONS list appended to this prompt. Do NOT invent org names. Do NOT include a slug field.
  ]
}`;

const SYSTEM_CHAT = `You are the Franklin Full Circle career assistant at UGA's Franklin College of Arts & Sciences.

${UGA_CONTEXT}

CURRENT CONVERSATION CONTEXT:
Student Profile:
{PROFILE}

Current Career Matches: {CAREERS}

Current Contacts: {CONTACTS}

Current Clubs: {CLUBS}

INSTRUCTIONS:
You are having an ongoing conversation with this student. Be conversational, helpful, and specific.

Your capabilities:
1. Answer career questions with specific, actionable advice
2. Suggest additional faculty contacts, clubs, news, or action items
3. Refine and rewrite the career dossier to be more accurate based on what the student tells you
4. Remove/exclude careers when asked

When you want to ADD or UPDATE items, include these tags in your response:
- [EXCLUDE: career name] — removes a career from recommendations
- [ADD_CONTACTS: [{"name":"Dr. X","email":"x@uga.edu","department":"Dept","expertise":"focus"}]]
- [ADD_CLUBS: [{"name":"Org","description":"why"}]]
- [ADD_NEWS: [{"title":"headline","source":"pub","date":"date"}]]
- [ADD_OPPS: [{"title":"action","type":"category"}]]
- [UPDATE_DOSSIER: {"overview":"...","tier1":"...","tier2":"...","tier3":"...","summary":"...","careerMatches":["role1","role2",...]}] — rewrites dossier sections in place. Include ONLY the fields you are changing. Write the same depth as the original (4-7 sentences per section).

DOSSIER UPDATE RULES — follow these precisely:
- Use [UPDATE_DOSSIER] IMMEDIATELY and WITHOUT BEING ASKED whenever the student:
  • Corrects something in the dossier ("that's not right", "actually I...", "I'm more interested in...")
  • Shares new information about themselves, their goals, or their background
  • Says the dossier doesn't reflect them accurately
  • Clarifies or refines their interests, skills, or career direction
  • Asks you to update, rewrite, refine, or fix the dossier
- When rewriting, prioritize EXACTLY what the student told you over any assumptions from the original profile
- The rewritten dossier must feel like it was written about THIS specific person based on what they've said — not a generic template
- If the student says something is inaccurate, fix it and explain what you changed

GENERAL RULES:
- Be conversational and natural, not robotic
- Give specific advice referencing real UGA resources
- Keep responses focused (3-6 sentences unless more detail requested)
- Actually help — don't just describe what you could do
- Reference the conversation history to maintain continuity`;

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
            refreshNews();
        }
    }

    if (!chatHistory.length) {
        chatHistory.push({ 
            role: 'assistant', 
            content: 'Welcome to Franklin Full Circle! I\'m your AI career advisor with deep knowledge of UGA\'s programs, faculty, and resources. Complete your profile and I\'ll generate personalized career pathways. Then we can refine them together — tell me what resonates, what to remove, or what you\'d like to explore further.' 
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
    localStorage.setItem('ffc_news', JSON.stringify(newsItems));
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
    newsItems = JSON.parse(localStorage.getItem('ffc_news') || '[]');
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

    const raw = await callAI(messages, 2500);
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
    const today = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const messages = [
        { role: 'system', content: `Generate 5-6 recent industry news articles relevant to this student's career interests.
RULES:
- Use ONLY reputable major outlets: NYT, Wall Street Journal, Forbes, Harvard Business Review, Bloomberg, TechCrunch, Wired, The Atlantic, Fast Company, MIT Technology Review, NPR, Reuters, AP, Science, Nature, Washington Post, Vox, TIME, etc.
- Every article date must be within the last 6 months (today is ${today})
- Headlines should sound like real, specific recent news — not generic
- Do NOT include URLs
Output raw JSON array only (no markdown): [{"title":"...","source":"...","date":"..."}]` },
        { role: 'user', content: profileBlurb() }
    ];
    const raw = await callAI(messages, 600);
    const fresh = tryParseJSON(raw);
    if (Array.isArray(fresh) && fresh.length) {
        newsItems = fresh;
        renderNews();
    }
}

// ── dossier rendering ────────────────────────────────────────
function renderDossier() {
    if (!generatedDossier) return;
    const d = generatedDossier;
    $('overviewText').textContent = d.overview || '';
    $('tier1Text').textContent = d.tier1 || '';
    $('tier2Text').textContent = d.tier2 || '';
    $('tier3Text').textContent = d.tier3 || '';
    $('summaryText').textContent = d.summary || '';

    const excluded = excludedPaths.length ? ` · Excluded: ${excludedPaths.join(', ')}` : '';
    $('dossierMeta').textContent = `${studentData.name} · ${studentData.year} · ${studentData.major}${excluded}`;
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
    el.innerHTML = contacts.map((c, i) => `
        <li class="contact-item">
            <button class="item-x" onclick="removeContact(${i})" aria-label="Remove">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2l6 6M8 2L2 8" stroke-linecap="round"/></svg>
            </button>
            <div class="contact-name">${esc(c.name)}</div>
            ${normalizeEmail(c.email) ? `<a href="mailto:${esc(normalizeEmail(c.email))}" class="contact-email">${esc(normalizeEmail(c.email))}</a>` : `<div class="contact-email">${esc(c.email || 'Email unavailable')}</div>`}
            <div class="contact-dept">${esc(c.department)}${c.expertise ? ' · ' + esc(c.expertise) : ''}</div>
            <a href="${esc(buildFacultyUrl(c.name, c.department))}" target="_blank" rel="noopener noreferrer" class="club-link">Find on directory →</a>
        </li>
    `).join('');
    el.innerHTML += `<button class="add-more-btn" onclick="fetchMoreContacts()">+ Add more faculty</button>`;
    $('ugaConnections').textContent = contacts.length;
}

function removeContact(idx) {
    contacts.splice(idx, 1);
    persist();
    renderContacts();
}

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
    el.innerHTML = clubs.map((c, i) => {
        return `
        <li class="club-item">
            <button class="item-x" onclick="removeClub(${i})" aria-label="Remove">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2l6 6M8 2L2 8" stroke-linecap="round"/></svg>
            </button>
            <div class="club-name">${esc(c.name)}</div>
            <div class="club-description">${esc(c.description)}</div>
        </li>`;
    }).join('');
    el.innerHTML += `<button class="add-more-btn" onclick="fetchMoreClubs()">+ Add more organizations</button>`;
}

async function fetchMoreClubs() {
    showToast('Finding more organizations…', 'info');
    const existingNames = clubs.map(c => c.name).join(', ');
    const filteredOrgs = relevantOrgs(30);
    const orgSource = filteredOrgs.length
        ? `SELECT ONLY from this verified UGA org list — do not invent names not on it:\n${JSON.stringify(filteredOrgs.map(o => ({ name: o.name, description: o.description })))}`
        : '';
    const messages = [
        { role: 'system', content: `Suggest 3 MORE UGA student organizations relevant to this student. Do NOT repeat any already listed. Output raw JSON array only (no markdown):\n[{"name":"Org Name","description":"why this org helps their goals"}]\n\n${orgSource}` },
        { role: 'user', content: `${profileBlurb()}\n\nAlready suggested (do not repeat): ${existingNames || 'none yet'}` }
    ];
    const raw = await callAI(messages, 400);
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

function removeClub(idx) {
    clubs.splice(idx, 1);
    persist();
    renderClubs();
}

// ── news rendering ───────────────────────────────────────────
function renderNews() {
    const el = $('newsFeed');
    el.innerHTML = newsItems.map((n, i) => {
        const searchUrl = buildNewsUrl(n.title, n.source);
        const inner = `
            <button class="item-x" onclick="removeNews(${i})" aria-label="Remove">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M2 2l6 6M8 2L2 8" stroke-linecap="round"/></svg>
            </button>
            <div class="news-title">${esc(n.title)}</div>
            <div class="news-source"><span>${esc(n.source)}</span><span class="news-date">· ${esc(n.date)}</span></div>`;
        return searchUrl
            ? `<a class="news-item news-link" href="${esc(searchUrl)}" target="_blank" rel="noopener noreferrer">${inner}</a>`
            : `<div class="news-item">${inner}</div>`;
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
    el.innerHTML += `<button class="add-more-btn" onclick="fetchMoreOpportunities()">+ Add more steps</button>`;
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
        node.textContent = m.content;
        container.appendChild(node);
    });
    container.scrollTop = container.scrollHeight;
}

// ── stats ────────────────────────────────────────────────────
function updateStats() {
    $('profileName').textContent = studentData.name || 'Not Set';
    const updated = localStorage.getItem('ffc_updated');
    if (updated) $('lastUpdated').textContent = new Date(updated).toLocaleDateString();
}

// ── drag & drop ──────────────────────────────────────────────
function setupDragAndDrop() {
    document.querySelectorAll('.grid-item').forEach(item => {
        item.addEventListener('dragstart', function(e) { draggedItem = this; this.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; });
        item.addEventListener('dragend', function() { this.classList.remove('dragging'); document.querySelectorAll('.grid-item').forEach(i => i.classList.remove('over')); draggedItem = null; });
        item.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
        item.addEventListener('dragenter', function(e) { e.preventDefault(); if (this !== draggedItem) this.classList.add('over'); });
        item.addEventListener('dragleave', function() { this.classList.remove('over'); });
        item.addEventListener('drop', function(e) {
            e.preventDefault(); this.classList.remove('over');
            if (!draggedItem || this === draggedItem) return;
            const grid = $('dashboardGrid');
            const items = [...grid.children];
            if (items.indexOf(draggedItem) < items.indexOf(this)) grid.insertBefore(draggedItem, this.nextSibling);
            else grid.insertBefore(draggedItem, this);
            saveGridPositions();
        });
    });
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
    const m = 50, w = 512;
    let y = 50;

    doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
    doc.setTextColor(186, 12, 47);
    const titleLines = doc.splitTextToSize('Franklin Full Circle — Career Dossier', w);
    doc.text(titleLines, m, y); y += titleLines.length * 20;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const metaLines = doc.splitTextToSize(`${studentData.name}  ·  ${studentData.year}  ·  ${studentData.major}`, w);
    doc.text(metaLines, m, y); y += metaLines.length * 13;
    doc.text(`Generated ${new Date().toLocaleDateString()}`, m, y); y += 24;

    const sections = [
        ['Overview', generatedDossier.overview],
        ['Primary Pathways', generatedDossier.tier1],
        ['Emerging Opportunities', generatedDossier.tier2],
        ['Exploratory Options', generatedDossier.tier3],
        ['Strategic Recommendations', generatedDossier.summary]
    ];

    sections.forEach(([title, text]) => {
        if (y > 700) { doc.addPage(); y = 50; }
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
        doc.setTextColor(33, 37, 41);
        doc.text(title, m, y); y += 14;
        doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5);
        doc.setTextColor(73, 80, 87);
        const lines = doc.splitTextToSize(text || '', w);
        doc.text(lines, m, y); y += lines.length * 12 + 18;
    });

    doc.save(`${studentData.name.replace(/\s+/g, '_')}_Dossier.pdf`);
    showToast('PDF downloaded.', 'success');
}

// ── fallbacks ────────────────────────────────────────────────
function buildFallbackDossier() {
    return {
        overview: `You operate at a distinctive intersection that few others occupy. Your combination of technical capability and humanistic perspective positions you for roles that require bridging divides — between data and decision-making, between innovation and impact, between systems and the people they serve. This kind of integrative thinking is increasingly rare and valuable in a world of narrow specialists.`,
        tier1: `Three primary pathways stand out for your profile. First, consider Product Strategy roles at mission-driven technology companies, where your ability to synthesize technical and human considerations directly drives value. Second, explore Policy Research positions at think tanks like Brookings, RAND, or the Aspen Institute, where interdisciplinary fluency is the core asset. Third, look into Management Consulting (particularly at firms with strong public sector practices like McKinsey's public sector group or Deloitte Government), where your cross-domain thinking translates into client value. For immediate action: attend a UGA Career Center employer session with any of these sectors this semester.`,
        tier2: `Beyond the obvious paths, several emerging opportunities deserve attention. Civic Technology roles (Code for America, US Digital Service, state-level digital services) are growing rapidly and explicitly value your profile type. University Innovation positions — program managers at places like UGA's Innovation District or academic entrepreneurship centers — reward people who can work across disciplines. Research operations roles at interdisciplinary institutes (think MIT Media Lab, Stanford's d.school, or Georgia Tech's IPAT) actively seek boundary-spanners. These paths may require building a specific portfolio piece: consider creating a case study or prototype that demonstrates your cross-domain capabilities.`,
        tier3: `For longer-term possibilities worth tracking: founding an initiative at the intersection of your interests (the UGA Entrepreneurship Program and Innovation Fellows certificate could support this), pursuing joint graduate degrees that formalize your interdisciplinary expertise (JD/MBA, MPP/MS programs), or joining early-stage ventures where versatility is the job description. These paths require more runway but match your trajectory.`,
        summary: `Your immediate roadmap: This week, email one UGA faculty member whose work intersects your interests — check the Computer Science or SPIA faculty directories for relevant researchers. Within 14 days, attend a student organization meeting in a space adjacent to your current focus. Use Handshake (uga.joinhandshake.com) to set up job alerts for your Tier 1 roles. Within 30 days, schedule an appointment at the UGA Career Center for a resume review oriented toward your target sectors. By end of semester, create one portfolio artifact — a brief, analysis, or prototype — that demonstrates your interdisciplinary lens. Bring this dossier to your academic advisor to align remaining coursework with these pathways.`,
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
window.removeNews = removeNews;
window.removeOpp = removeOpp;
window.toggleOpp = toggleOpp;
window.fetchMoreContacts = fetchMoreContacts;
window.fetchMoreClubs = fetchMoreClubs;
window.fetchMoreOpportunities = fetchMoreOpportunities;