Deprecate and remove frontEndComponents folder from catdotcom
Description:
Context
The investigation story (AB#2964435 / Investigation_Document_v2) confirmed that frontEndComponents is a legacy FED-oriented component catalog with strong internal coupling but low explicit external build-time coupling into catdotcom. No build, deployment, or integration pipeline was found to explicitly depend on the folder.
Objective
Execute the phased removal recommended by the investigation: strip frontEndComponents from the repository, clean up any residual references in content package filters and clientlib embed/base chains, and validate that build, deployment, and runtime behaviour are unaffected.
In scope
Deletion of the frontEndComponents source tree
Removal of related entries from filter.xml / package definitions
Cleanup of clientlib embed, dependencies, and categories references pointing to the folder
Maven module / pom.xml cleanup if the folder is wired as a module or resource
Full build + local AEM deployment validation
Out of scope
Rewrite or re-platforming of any component previously housed in the folder
Changes to authored content or existing page structures
Dispatcher / CDN cache configuration changes
Acceptance Criteria:
frontEndComponents folder no longer exists in the development branch.
Repo-wide search for frontEndComponents returns zero path, category, or embed references (excluding docs/changelog).
mvn clean install completes successfully with no unresolved clientlib or module errors.
Content packages install cleanly on a local AEM instance with no errors in error.log.
Key page templates render correctly on local/dev — no missing CSS/JS, no 404s in browser console.
All required GitHub Actions checks pass on the PR.
Peer code review approved.
Tasks (child items):
Remove folder and commit
Clean filter.xml and package config
Clean clientlib category/embed/dependency references
Local build validation
Local AEM deploy + smoke test on representative pages
Raise PR and address review comments
Dev environment post-deployment verification
