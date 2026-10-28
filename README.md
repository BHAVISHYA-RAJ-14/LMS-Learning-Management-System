# GLA LMS

Learning Management System prototype for the Department of Computer Engineering, GLA University.

Plain HTML, CSS and JavaScript. Data is read from local JSON files, so run it through a local server (VS Code Live Server works fine).

## Folder layout

    index.html, dashboard.html, courses.html, assignments.html, profile.html
    css/    stylesheet
    js/     auth, dashboard, courses, assignments
    data/   users, courses, assignments, announcements

## Branches

- main: stable release
- dev: integration branch, all features merge here first
- feature/frontend: pages and styling
- feature/auth-routing: login, session, route guards, dashboard
- feature/course-logic: course catalog and search
- feature/assessments: assignments and submissions
