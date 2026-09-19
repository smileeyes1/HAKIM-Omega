export function computeImpactPlan(input={}){
  const direct=[...new Set(input.direct_changes||[])];
  const edges=input.edges||{};
  const catalog=input.test_catalog||{};
  const impacted=new Set(direct);
  const q=[...direct];
  while(q.length){
    const cur=q.shift();
    for(const next of (edges[cur]||[])){
      if(!impacted.has(next)){impacted.add(next);q.push(next);}
    }
  }
  const required=new Map();
  const uncovered=[];
  for(const inv of impacted){
    const tests=catalog[inv]||[];
    if(!tests.length){uncovered.push(inv);continue;}
    for(const id of tests){
      if(!required.has(id)) required.set(id,new Set());
      required.get(id).add(inv);
    }
  }
  return {
    directly_changed_invariants:direct,
    impacted_invariants:[...impacted],
    required_tests:[...required].map(([id,covers])=>({id,covers:[...covers]})),
    uncovered_impacted_invariants:uncovered,
    unknown_impact_remaining:uncovered.length>0
  };
}
