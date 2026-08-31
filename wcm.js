dataLayer.length          // note it
window.dlWatch = [];
dataLayer.push = function(o){ dlWatch.push(o); Array.prototype.push.call(dataLayer,o); return dataLayer.length; }
