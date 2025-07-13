## Standard Workflow
1. First think through the problem, read the codebase for relevant files, and write a plan to projectplan.md.
2. The plan should have a list of todo items that you can check off as you complete them
3. Before you begin working, check in with me and I will verify the plan.
4. Then, begin working on the todo items, marking them as complete as you go.
5. Please every step of the way just give me a high level explanation of what changes you made.
6. Make every task and code change you do as simple as possible. We want to avoid making any massive or complex changes. Every change should impact as little code as possible. Everything is about simplicity.
7. Finally, add a review section to the projectplan.md file with a summary of the changes you made and any other relevant information.

## Windows Service Management
This project uses a **Hybrid Service Architecture** for reliable Windows service deployment:

### Service Commands (Always run as Administrator):
- `npm run service:validate` - Validate environment before installation
- `npm run service:install` - Install the hybrid service
- `npm run service:force-install` - Force install (handles EBUSY/locked file errors)
- `npm run service:start` - Start the service 
- `npm run service:stop` - Stop the service (guaranteed process cleanup)
- `npm run service:diagnose` - Comprehensive diagnostics and health check
- `npm run service:uninstall` - Remove the service

### Key Features:
- **Enhanced Process Management**: Direct Next.js execution without npm layer
- **Guaranteed Cleanup**: Eliminates orphaned processes on port 3000
- **Auto-Build**: Automatically runs production build when needed
- **Force Installation**: Handles installation errors gracefully
- **Native Integration**: Uses Windows taskkill and sc.exe commands

### Service Architecture Files:
- `hybrid-service-manager.js` - Core service management logic
- `service-wrapper-hybrid.js` - Service wrapper for Next.js execution
- `force-install-hybrid.js` - Handles problematic installations
- `start-service-hybrid.js` - Enhanced service starting
- `stop-service-hybrid.js` - Guaranteed service stopping
- `diagnose-hybrid.js` - Comprehensive diagnostics

### When Making Service Changes:
Always test on the deployment machine with Administrator privileges. The hybrid service solves the critical issue where `npm run service:stop` would report success but leave Node.js processes running on port 3000.