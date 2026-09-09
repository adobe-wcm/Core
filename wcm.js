// every event that fired
dataLayer.filter(o => o.event).map(o => o.event)

// count by name — catches duplicates
dataLayer.filter(o => o.event)
  .reduce((a,o) => (a[o.event]=(a[o.event]||0)+1, a), {})

// full objects, inspectable
console.table(dataLayer.filter(o => o.event))
