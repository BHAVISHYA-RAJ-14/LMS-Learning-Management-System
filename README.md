
# Dev Branch

This repository has been initialized on the `dev` branch.

## Purpose
This branch is intended for active development, testing, and integration work before changes are merged into the main branch.

## Current Status
- Branch: `dev`
- Repository initialized for development work
-  for feature development and testing

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
