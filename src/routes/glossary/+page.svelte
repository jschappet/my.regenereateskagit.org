<script>
 const terms = [
  [
    "Raft",
    "A small group of people who each follow an interest, try a small real-life experiment, and share what they learn. The point is doing it together."
  ],
  [
    "Culture-building laboratory",
    "What a Raft is for. People try things, notice what happens, and revise."
  ],
  [
    "The Interest",
    "The one thing you'd actually like to dig into. Gardening, herbalism, water testing, sourdough, anything that has your curiosity."
  ],
  [
    "Brain dump",
    "A private space to get your thoughts out before you decide what to try. Loose notes are fine. It's never shared."
  ],
  [
    "Experiment",
    "A small, real-life thing you try over two weeks. Week one you gather, week two you act."
  ],
  [
    "Embodied action",
    "Getting out of your head and into the world by doing the thing, not just thinking about it."
  ],
  [
    "Share meeting",
    "A short gathering at the end of week one. Each person gets up to 15 minutes to share, followed by Q&A."
  ],
  [
    "Celebration",
    "A closing gathering with your raft to tell the story of how it went."
  ],
  [
    "Cowork",
    "Working on your own projects alongside others, online or in person, with no one's idea outranking anyone else's."
  ],
  [
    "Inviter / invitee",
    "The inviter starts a Raft and can invite friends. Invitees do their own project from the beginning. They only stay within the inviter's topic if the inviter chose that."
  ],
  [
    "Story",
    "What you tried and learned. A story can belong to you or be one you're adding about someone else. It doesn't need to be great to count."
  ],
  [
    "Put it on the map",
    "Sharing a story of Skagit so others can see what's being tried here."
  ],
  [
    "Non-hierarchy",
    "No one leads or ranks. It works because the structure is clear and shared, so hidden hierarchy doesn't form."
  ],
  [
    "The Raft cycle",
    "Develop → Share → Map → Experiment → Learn → Revise."
  ]
];
</script>

<svelte:head><title>Raft glossary · Regenerate Skagit</title></svelte:head>

<div class="raft-guide">
 <div class="page-heading"><h1>Raft glossary</h1></div>
 <dl class="panel">
  {#each terms as [term, definition]}
   <div>
    <dt>{term}</dt>
    <dd>{definition}</dd>
   </div>
  {/each}
 </dl>
 <a class="text-link" href="/tutorial/">How to Raft</a>
</div>

<style>
 .raft-guide { max-width: 52rem; margin: 0 auto; padding: 1.5rem; }
 dl > div + div { border-top: 1px solid var(--line); margin-top: 1rem; padding-top: 1rem; }
 dt { font-weight: 700; margin-bottom: .25rem; }
 dd { margin: 0; }
</style>
