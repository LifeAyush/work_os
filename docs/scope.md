# work_os — product scope (fill in)

Fill each section below. When done, share this file to generate phased implementation subplans.

---

## 1. Product snapshot

- **Working name: work os**
- **One sentence goal:** track my tasks and give me better understanding of what needs to be get done when and my bandwidth
- **Success:** able to create tasks and subtasks and track weekly output based on resolved tasks, also able to prioritize tasks so that i know what needs to be done when and how much free time i have in a week,

---

## 2. People and access

- **Who uses it:** just me
- **Accounts:** google login
- **Multi-tenant:** just for me but need google login since i will deoploy this and i dont want others to access my tasks

---

## 3. Task model (data)

For each row: Y/N and notes.


| Field                        | Include? (Y/N) | Notes                                                           |
| ---------------------------- | -------------- | --------------------------------------------------------------- |
| Title                        | y              | normal text field                                               |
| Status                       | y              | Allowed values: todo / in progress / done / blocked / archieved |
| Priority                     | y              | low / med / high                                                |
| Due date                     | y              | date and time field, time will be optional                      |
| Description / notes          | y              | plain text                                                      |
| Tags / labels                | y              | freelance/breathe/general these 3 for now                       |
| Project or list              | n              | (single list / many lists?)                                     |
| Subtasks                     | n              |                                                                 |
| Attachments                  | y              | links                                                           |
| Created / updated timestamps | y              | normal timestamps                                               |


- **Ordering:** sort by due date first then sort by priority within dates
- **Archiving / delete:** hard delete

---

## 4. Core flows (user stories)

Label each **P0** (must ship v1), **P1**, **P2**.

Examples to extend or replace:

P0: 

- able to add tasks 
- able to add priority and due date for tasks
- able to change status of task
- able to view work done using a dashboard based on tasks for the week, this will be a weekly once re-compute

---

## 5. Screens / navigation

- **Pages or views:** directly land on a view of tasks sidebar has option for tasks and tracker, tasks will show the tasks and will ahve columns for status similar to jira/linear, tracker tab will be the dashboard | graphs for dashboard we can decide on later
- **Layout:** sidebar system
- **Empty states:** blank tasks tab with option to create a task + blank tracker tab with no stats yet

---

## 6. Behavior and rules

- **Validation:** all filed marked as y are manadatory apart from description, subtaks and attachemtns, 
- **Defaults:** new task status todo
- **Concurrency:** single browser only sometimes on phone

---

## 7. Non-functional

- **Performance:**
- **Mobile:** (desktop + must work on phone)
- **Offline:** not needed
- **Accessibility:** not needed

---

## 8. Tech constraints (optional)

Stack is **Next.js + Supabase + Tailwind** unless you note changes.

- **Data/API style preference:** normal rest apis
- **Integrations (later is fine):**

---

## 9. Explicitly out of scope (v1)

What you are **not** building in the first release:  
only the things listed above are required nothing else to be built

---

## 10. Milestones

Rough phases (edit to match your P0 list):

- **M1:** Basic Ui and structure for sidebar and the 2 tabs tracker and tasks
- **M2:** abikity to CRUD tasks and cahnge status and all + status wise view
- **M3:** tracker dashboard for analysing a weeks work, but can make this dynamic based on time like can track week or day or month etc

---

## 11. Open questions

Undecided items to resolve later:
tracker Ui and filtering and different graphs to get better understanding of my bandwodth and hrs of work i take to complete a weeks work

---

## How to use this

1. Complete at least **sections 1–6** and **9**.
2. Share `docs/scope.md` when asking for **subplans** (e.g. “plan M1 only” or “execute M1”).
3. Subplans can be broken down by milestone or by feature area from section 4.

