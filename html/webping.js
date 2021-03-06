// Credits: thanks to jfreder for its Javascript ping code and fnando for its lightweight sparkline library.

const intervalDuration = 1000;  // Refresh interval in ms
let intervalId = null;

/*
   Javascript ping code from ping.js (https://github.com/jdfreder/pingjs)
*/
function requestImage(url) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.onload = function() { resolve(img); };
    img.onerror = function() { reject(url); };
    url += url.endsWith("/") ? "" : "/"
    img.src = url + '?no-cache=' + Math.floor((1 + Math.random()) * 0x10000).toString(16);
  });
}

function webping(url) {
  return new Promise(function(resolve, reject) {
    var start = (new Date()).getTime();
    var response = function() {
      var delta = ((new Date()).getTime() - start);
      resolve(delta);
    };
    requestImage(url).then(response).catch(response);
    // Set a timeout for max-pings, 5s.
    setTimeout(function() { reject(Error('Timeout')); }, 5000);
  });
}

/*
   Ping all targets
*/
function pingAllTargets() {
  let td_best_lat, td_sparkline, svg, latency, best_lat, endpoint, latenciesArr, latenciesStr;
  // Iterate other each element with "target" class
  Array.from(document.getElementsByClassName("target")).forEach(async (element) => {
    // Retrieve endpoint URL from DOM attribute
    endpoint = element.getAttribute("endpoint");
    try {
      // Run web ping and wait for result
      latency = await webping(endpoint);
      // Update latency result
      element.innerHTML = latency;
      // Update best latency
      td_best_lat = element.nextElementSibling;
      if (td_best_lat !== null) {
        // Retrieve best latency within <td> element
        let str = td_best_lat.innerHTML;
        best_lat = parseInt(str, 10);
        // Make sure we have a valid number
        if (!Number.isNaN(best_lat)) {
          if (latency < best_lat) {
            td_best_lat.innerHTML = latency;
          }
        } else {
          // If no valid number in <td>, store the current latency
          td_best_lat.innerHTML = latency;
        }
      }
      // Draw sparkline (data is stored in a data-attribute comma-separated string with the latest 20 latencies)
      td_sparkline = td_best_lat.nextElementSibling;
      if (td_sparkline !== null) {
        // Lookup first child of <td>, it is our svg
        svg = td_sparkline.firstElementChild;
        if (svg !== null) {
          // Retrieve latencies as a comma-separated string
          latenciesStr = svg.dataset.latencies;
          if (latenciesStr == '') {
            // If latencies dataset is empty, initialiaze an array of 20 zero value
            latenciesArr = new Array(20).fill(0);
          } else {
            // Otherwise split the string into an array of Number
            latenciesArr = latenciesStr.split(',').map(Number);
          }
          // Add latest latency value to the array
          latenciesArr.unshift(latency);
          // If we have more than 20 latency measurements, drop ("pop") the oldest one
          if (latenciesArr.length > 20) {
            latenciesArr.pop();
          }
          // Save the latency array into the data-latencies attribute of the SVG element
          svg.dataset.latencies = latenciesArr.toString();
          // Draw sparkline
          sparkline.sparkline(svg, latenciesArr);
          // Sort table by lowest latency
          sortTable();
        }
      }
    } catch(e) {
      console.log(e);
      element.innerHTML = "Timeout";
    }
  });
}

// Modified version from https://www.w3schools.com/howto/howto_js_sort_table.asp
function sortTable() {
  let table, rows, switching, i, x, y, shouldSwitch;
  table = document.getElementById("latencyTable");
  switching = true;
  // Make a loop that will continue until no switching has been done
  while (switching) {
    // Start by saying: no switching is done:
    switching = false;
    rows = table.rows;
    // Loop through all table rows (except the first, which contains table headers):
    for (i = 1; i < (rows.length - 1); i++) {
      // Start by saying there should be no switching:
      shouldSwitch = false;
      // Get the two elements you want to compare, one from current row and one from the next
      x = parseInt(rows[i].getElementsByTagName("TD")[2].innerHTML);
      y = parseInt(rows[i + 1].getElementsByTagName("TD")[2].innerHTML);
      // check if the two rows should switch place:
      if (x > y) {
        // If so, mark as a switch and break the loop:
        shouldSwitch = true;
        break;
      }
    }
    if (shouldSwitch) {
      // If a switch has been marked, make the switch and mark that a switch has been done:
      rows[i].parentNode.insertBefore(rows[i + 1], rows[i]);
      switching = true;
    }
  }
}

// Execute on load
document.addEventListener("DOMContentLoaded", function () {
  "use strict";

  // Wire-up event on active switch change
  document.getElementById("switchActive").addEventListener("change", (event) => {
    if (!event.target.checked) {
      // If the switch is unchecked, stop pinging
      if (intervalId !== null) {
       clearInterval(intervalId);
      }
    } else {
      // If the switch is checked, start pinging
      intervalId = setInterval(pingAllTargets, intervalDuration);
    }
  });

  // Fetch client IP address and country / AS information
  // Many thanks to ipinfo.io for its free API
  fetch("https://ipinfo.io/json")
    .then((response) => response.json())
    .then((ipinfo) => {
      let ip = ipinfo.ip;
      let country = ipinfo.country;
      let org = ipinfo.org;
      document.getElementById("ip_addr").innerHTML = `<mark>${ip}</mark> (${org}) - ${country}`;
    })
    .catch(err => {
      console.log(err);
      document.getElementById("ip_addr").innerHTML ="Failed to retrieve IP address information";
    });

  // Ping all targets every 1 seconds
  intervalId = setInterval(pingAllTargets, intervalDuration);

  // For debug
  // Launch once
  //pingAllTargets();
  // or
  // Loop a finite number of times
  //for(let i=0; i < 20; i++) {
  //  pingAllTargets();
  //}

});
