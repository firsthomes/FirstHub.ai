# FHS Marketing Manager in Claude: setup and test guide for Jerome

The Marketing Manager (MM) is the agent that runs the Meta ad account with Callum. While Callum is away (12 Sep to 12 Oct) you can use it from your own Claude to read the account, get analysis, and make guarded changes. Every change you make is emailed to Callum automatically.

## Part A: Callum does this first (about 3 minutes)

1. In claude.ai, as the Team owner, open Settings, then Connectors.
2. Click Add custom connector.
3. Name: FHS Marketing Manager. Remote MCP server URL: the link Callum gives you separately. Leave the OAuth Client ID and Client Secret fields blank. Save.

## Part B: Jerome sets it up (about 2 minutes)

1. Open claude.ai (your FHS Team login), Settings, Connectors.
2. Find FHS Marketing Manager and click Connect.
3. Start a new chat. Click the plus / "Search and tools" button under the message box and check FHS Marketing Manager is switched on. Do this in any chat where you want to use it.

Treat the connector URL like a password. Do not forward it or paste it into chats. Anyone who has it can act as you on the ad account.

## Part C: Tests, in order (about 15 minutes)

Run these in a fresh chat with the connector switched on. Each line in quotes is what you type. Underneath is what should happen.

1. "What tools do you have from FHS Marketing Manager?"
   Expect nine tools: meta_read, meta_write, hubspot_get, hubspot_search, hubspot_pipeline, mm_memory_index, mm_memory_file, ask_marketing_manager, mm_answer.

2. "How much did we spend on Meta yesterday, and how many leads did we get?"
   Expect a real number within a few seconds, pulled live from the ad account (not a guess).

3. "What are the rules about MSG ads on Saturdays?"
   Expect it to read the MM's memory and tell you Saturday delivery is off and a cron re-checks it every weekend.

4. "How is the sales team keeping up with lead flow this week?"
   Expect a table per rep from HubSpot: open deals, follow-up breaches, uncalled leads, calls and connects.

5. "Ask the marketing manager which campaign had the worst cost per lead last week and what it would do about it."
   This hands the question to the full agent with all of Callum's history loaded. It takes one to three minutes. If Claude says it is still working, reply "check on that" and it will fetch the answer.

6. Guardrail test: "Put a 6am to 9pm delivery schedule on ad set 120254243090730054."
   Expect a refusal with an explanation. This is deliberate: that write silently killed delivery on six ad sets last week. If it goes through instead of refusing, stop and tell Callum.

7. Write test: "Rename ad set 120254243090730054 to 'WestBris - Interest (old) JEROME TEST'."
   Expect it to make the change and report it. That ad set is paused, so nothing is affected. Within a minute Callum receives an email titled "[MM] changes made for Jerome (via Claude connector)" showing what changed. Tell Callum when you have run this so he can confirm the email arrived.

8. Wait a minute (Meta allows one write every 30 seconds), then: "Rename that ad set back to 'WestBris - Interest'."
   Expect the rename and a second email to Callum.

If all eight behave as described, you are set.

## Part D: Using it day to day

Ask in plain English. Examples:

- "How did we go yesterday versus the same day last week, QLD and VIC separately?"
- "Which WestBris ads have the worst cost per lead over the last 7 days?"
- "Pause the two worst-performing ads in South Bris Broad."
- "Trim MSG-ALL VIC lifetime budget by 10%."
- "Extend campaign X to 15 November."
- "Ask the marketing manager whether we should shift budget from VIC to QLD this week." (use "ask the marketing manager" for anything that needs judgement or history)

What it can change: pause and activate ads and ad sets, budgets, schedules, targeting, end dates, names.

What it will not do:
- Create new ads or ad sets. That still needs Callum.
- Push budgets past the approved fleet pace ($154,218 a month across all campaigns). It will tell you the ceiling if you hit it.
- Archive or delete anything unless you explicitly confirm. Do not archive anything while Callum is away without checking with him.
- Touch schedule or attribution settings on the older MSG ad sets beyond pause or rename. This is protected in code because of last week's outage.
- Reassign leads between reps in HubSpot. HubSpot access is read only. Routing changes go through Sam.

Every change lands in Callum's inbox with what you asked and exactly what changed.

## Part E: If something is not working

- If the connector shows as disconnected, go to Settings, Connectors, and reconnect it.
- If a tool errors, try once more. Meta rate limits writes to one every 30 seconds.
- Backup channel: email callum@firsthome.com.au with [MM] in the subject and your question or instruction. The same agent replies in the thread and you have the same write access there.
- Anything odd, message Callum.
