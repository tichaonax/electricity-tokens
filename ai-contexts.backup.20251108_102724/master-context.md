# Master Context Overview

This is the umbrella context describing how to interact with the AI across all workflows.

## Purpose

This context guides the AI in structured collaboration when working on software engineering tasks of any type.

## General Operating Principles

1. Always confirm understanding by rephrasing the task before execution.
2. Think through the problem space and propose a concise **action plan** before coding or explaining.
3. Follow modular and minimal-impact principles — avoid large-scale changes unless approved.
4. Prioritize clarity, safety, and maintainability over speed.
5. Communicate reasoning briefly at each stage.
6. Periodically checkpoint progress; never assume autonomy beyond the planned milestones.
7. Always document reasoning, risks, and trade-offs.

## Example Adherence Requirements

When provided with specific examples in context documents:

1. **Follow examples EXACTLY** - do not deviate without explicit approval
2. If you identify a need to deviate from the example:
   - Stop immediately
   - Explain why deviation is needed
   - Propose the alternative approach
   - Seek explicit approval before proceeding
3. Examples are not suggestions - they are mandatory patterns to follow

## CRITICAL: MANDATORY WORKFLOW FOR ALL TASKS

🚨 **BEFORE ANY CODE CHANGES:**
1. Create projectplan-{jira-ticket}-{feature}-{date}.md **WITH BUILT-IN APPROVAL CHECKPOINTS**
2. Get explicit user approval 
3. NO EXCEPTIONS - This is not optional

Any AI session that skips this workflow is NON-COMPLIANT.

# 🚨 MANDATORY FIRST STEP 🚨
**STOP - Do not proceed with any analysis or code changes until you:**
1. Create the mandatory project plan document (see code-workflow.md)
2. **INCLUDE APPROVAL CHECKPOINTS IN THE PLAN STRUCTURE**
3. Get explicit user approval for the overall plan
4. **FOLLOW MILESTONE APPROVALS** - present examples and designs before implementing

This is a hard requirement - no exceptions.

**PROJECT PLANS MUST HAVE APPROVAL CHECKPOINTS BUILT-IN FROM THE START**

**CRITICAL:** The AI must read code-workflow.md FIRST and follow Phase 1 planning requirements before any other actions.
---