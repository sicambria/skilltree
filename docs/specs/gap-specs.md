# Gap Specs & Prioritization

## Design Constraint

This product is **collaborative, regenerative, win-win-win**. Never competitive. Every feature must inspire people to help each other.

- **No leaderboards, rankings, or scores** that pit users against each other
- **No streaks** that incentivize solo grinding over community contribution
- **No benchmarking** that ranks people — replace with complementarity: "who completes me?"
- Every feature earns a regenerative check: *Does this make the system (person + community + planet) more capable over time?*

---

## Prioritization Matrix

| Priority | Gap | Impact (Purpose) | Effort | Regenerative Alignment |
|---|---|---|---|---|
| **P1** | Community feed / discussion | High — unlocks collaboration pillar | High | Core: helping each other is the mechanic |
| **P2** | Collaborative progress timeline & goals | High — unlocks motivation pillar | Medium | Strong: sharing progress inspires others; joint goals build reciprocity |
| **P3** | Personalized mentor & learning-path recommendations | Medium | Medium | Strong: connects who-needs-help with who-offers-it |
| **P4** | Skill complementarity ("who balances me?") | Medium | Medium | Direct replacement for competitive benchmarking |
| ~~P5~~ | Mobile-responsive frontend | Medium | High | Enables access but doesn't shift behavior |
| ~~P6~~ | Real-time notifications | Medium | High | Enables P1 but can start without push |
| ~~P7~~ | External learning platform integration | Low | High | Out of scope — no partner API access |

**Focus: P1–P4.** P5–P7 are deferred (lowest ROI on regenerative purpose).

---

## P1: Community Feed & Discussion

### What
A social feed where users share:
- Skills they're learning or just leveled up ("I just reached Advanced in Systems Thinking!")
- Training offers or requests ("Looking for 2 more people for a Permaculture study group")
- Questions and answers about skills
- Endorsements given (visible, celebratory)

### User Value
- Fills the **collaboration & knowledge sharing** pillar of the product purpose
- Turns skill tracking from a solo inventory into a shared practice
- Creates serendipitous connection: "Oh, you're learning that too?"

### Acceptance Criteria
- [ ] Feed page showing recent activity across the community
- [ ] Post types: skill-level-up, training-offer, training-request, Q&A
- [ ] Comments on posts
- [ ] Notifications (in-app banner, email optional)
- [ ] Feed is chronological, no algorithmic amplification
- [ ] No likes/karma/votes — no gamification of popularity
- [ ] Users can mute/unfollow without social penalty

### Anti-Patterns (blocked)
- No engagement metrics, no "top posts," no trending
- No "influencer" mechanics — every post has equal structural weight

---

## P2: Collaborative Progress Tracking

### What
A timeline showing my skill development over time, shareable with mentors or peers. Users can:
- Set **learning goals** with target dates ("Learn regenerative agriculture basics by Dec 2026")
- **Share** their timeline with a mentor or study buddy
- See **collaborative goals** ("If we both level up in Facilitation by March, we can co-host a workshop")
- Get **gentle check-ins** ("It's been a while since you logged — want to update your skills?")

### User Value
- Fills the **motivate self-development** pillar
- Progress visibility creates accountability without competition
- Joint goals create reciprocal commitment

### Acceptance Criteria
- [ ] User timeline page showing skill-level history
- [ ] Goal creation with target skill and date
- [ ] Invite collaborators to a goal
- [ ] Check-in nudges (opt-in, configurable frequency)
- [ ] Timeline export (PDF/PNG to share outside the app)
- [ ] No streak counters, no "days since last login"

### Anti-Patterns (blocked)
- No streaks, no "you're falling behind" messages
- No comparison to other users' progress

---

## P3: Personalized Mentor & Learning-Path Recommendations

### What
Given my current skills and goals, the system suggests:
- **People** who have the skills I'm targeting and are willing to teach
- **Learning paths** (existing trees or combinations) that fill my gaps
- **Training offers** from the community relevant to my level

### User Value
- Makes the skill ontology *actionable* — not just a map but a route
- Connects learners directly to teachers (peer-to-peer)

### Acceptance Criteria
- [ ] "What should I learn next?" view based on my skill gaps
- [ ] Mentor suggestions ranked by: skill match × willingness-to-teach × responsiveness
- [ ] Path suggestions pulled from existing trees
- [ ] Users can mark "I'm now taking this suggestion" to tell the mentor

### Anti-Patterns (blocked)
- No "better than" comparisons between mentors
- No optimization for engagement or time-on-site

---

## P4: Skill Complementarity ("Who balances me?")

### What
Instead of benchmarking against peers, show:
- "Your strengths in X are complemented by people strong in Y — here they are"
- "For your goal of Z, you'd pair well with someone who has [missing skill]"
- Team/group view: given a set of people, visualize collective skill coverage and gaps

### User Value
- Direct replacement for competitive benchmarking
- Frames skill gaps as an invitation to collaborate, not a deficiency
- Useful for forming study groups, project teams, or communities of practice

### Acceptance Criteria
- [ ] Complementarity view: "People who complete your skill profile"
- [ ] Group skill coverage heatmap
- [ ] Invitation to connect based on complementarity
- [ ] No ranking, no "most complementary" order — just a field of potential

### Anti-Patterns (blocked)
- No "skill score" or "completeness %" that could be gamed
- No comparison UI that implies deficiency

---

## Implementation Order

```
P1 ─────────────────────────────────────► (foundation: community)
  │
  ├── P2 ─────────► (adds motivation layer)
  │
  ├── P3 ─────────► (makes ontology actionable)
  │
  └── P4 ─────────► (completes collaboration loop)
```

P1 is the *new* foundation — everything collaborative builds on it. P2 adds the motivational layer. P3 routes people through the skill graph using community data. P4 closes the loop by showing how we complete each other.

---

## Deferred Gaps

| Gap | Rationale |
|---|---|
| Mobile-responsive frontend | High effort, does not shift behavior from solo -> collaborative |
| Real-time notifications | Can start with in-app polling; WebSockets added later without changing design |
| External learning platform integration | No partner API access; low regenerative ROI |
