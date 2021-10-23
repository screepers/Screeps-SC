module.exports.init = function () {
  var userid = JSON.parse(localStorage.getItem("users.code.activeWorld"))[0]._id;
  module.exports.userId = userid;

  module.ajaxGet("https://screeps.com/api/user/rooms?id=" + userid, function (data, error) {
    module.exports.data = {};
    module.exports.shards = {};
    if (data && data.shards) {
      for (const [shard, rooms] of Object.entries(data.shards)) {
        module.exports.shards[shard] = { rooms };
      }
    } else {
      console.error(data || error);
    }

    for (const [shardName, shard] of Object.entries(module.exports.shards)) {
      // return self.req('GET', 'https://screeps.com/api/game/world-size', { shard })
      console.log(`Fetching world size for ${shardName}`);
      module.ajaxGet("https://screeps.com/api/game/world-size?shard=" + shardName, function (worldSize, error) {
        console.log(`${JSON.stringify(worldSize)}`);
        shard.width = worldSize.width;
        shard.height = worldSize.height;
      });
    }

    // module.exports.update();
    // var element = document.getElementById(id);
    module.exports.page = 0;
    module.exports.fetchMarketHistoryPage(module.exports.page);
  });

  var style = document.createElement("style");
  style.innerHTML = ".mat-row:nth-of-type(2n+1) { background-color: rgba(255, 255, 255, 0.02); }";
  style.innerHTML +=
    ".loadButton {place-items: center;margin: 0 20px;border: none;background: transparent;color: #4A5FD2;font-size: 12px;font-weight: 600;line-height: 26px;text-transform: uppercase;}";
  style.innerHTML += "._success {color: #80D47B;}";
  style.innerHTML += "._fail {color: #D2554A;}";
  style.innerHTML += "._number {text-align:right;}";
  style.innerHTML +=
    ".type {display:inline-block; vertical-align: middle; width: 25px;min-height: 37px;text-align: center;background-repeat: no-repeat;}";

  document.head.appendChild(style);

  module.exports.players = {};

  var appHistory = document.getElementsByTagName("app-history")[0];
  // appHistory.innerHTML = ''
  module.exports.container = document.createElement("div");
  module.exports.container.style = "width: 100%; max-width:1100px; margin:auto;text-align:center;";
  // const todo = document.createElement("div");
  // todo.style = "text-align:left;color:white";
  // todo.innerHTML =
  // "<h1>TODO:</h1><ul><li>Fetch player names</li><li>Fetch player icon</li><li>date formatting</li><li>indicate if you are dealing on your own orders</li></ul>";
  // module.exports.container.appendChild(todo);
  var script_tag = document.createElement("script");
  // script_tag.setAttribute("src", chrome.extension.getURL("assets/js/chart.min.js"));
  script_tag.setAttribute("src", "https://cdn.jsdelivr.net/npm/chart.js@3.5.1/dist/chart.min.js");

  document.head.appendChild(script_tag);

  module.exports.chartCanvas = document.createElement("canvas");
  console.log("add chart to container");
  module.exports.container.appendChild(module.exports.chartCanvas);

  module.exports.chartCanvas.width = 400;
  module.exports.chartCanvas.height = 100;
  // the timeout is to wait for chartjs to be injected
  setTimeout(function () {
    module.exports.chart = new Chart(module.exports.chartCanvas, {
      type: "line",
      data: {
        // labels: ["Red", "Blue", "Yellow", "Green", "Purple", "Orange"],
        // datasets: [
        //   {
        //     label: "# of Votes",
        //     data: [12, 19, 3, 5, 2, 3],
        //     backgroundColor: [
        //       "rgba(255, 99, 132, 0.2)",
        //       "rgba(54, 162, 235, 0.2)",
        //       "rgba(255, 206, 86, 0.2)",
        //       "rgba(75, 192, 192, 0.2)",
        //       "rgba(153, 102, 255, 0.2)",
        //       "rgba(255, 159, 64, 0.2)"
        //     ],
        //     borderColor: [
        //       "rgba(255, 99, 132, 1)",
        //       "rgba(54, 162, 235, 1)",
        //       "rgba(255, 206, 86, 1)",
        //       "rgba(75, 192, 192, 1)",
        //       "rgba(153, 102, 255, 1)",
        //       "rgba(255, 159, 64, 1)"
        //     ],
        //     borderWidth: 1
        //   }
        // ]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }, 100);

  module.exports.marketHistory = document.createElement("table");
  module.exports.marketHistory.style = "width: 100%;";

  module.exports.marketHistory.className = "app-market-table mat-table";

  const header = document.createElement("tr");
  module.exports.marketHistory.appendChild(header);
  header.className = "mat-header-row ng-star-inserted";
  header.style = "position:stricky;";
  const dateHeaderCell = document.createElement("td");
  dateHeaderCell.innerHTML = "Date";
  dateHeaderCell.className = "mat-header-cell cdk-column-date mat-column-date ng-star-inserted";
  header.appendChild(dateHeaderCell);

  const shardHeaderCell = document.createElement("td");
  shardHeaderCell.innerHTML = "Shard";
  shardHeaderCell.className = "mat-header-cell cdk-column-shard mat-column-shard ng-star-inserted";
  header.appendChild(shardHeaderCell);

  const tickHeaderCell = document.createElement("td");
  tickHeaderCell.innerHTML = "Tick";
  tickHeaderCell.className = "_number mat-header-cell cdk-column-tick mat-column-tick ng-star-inserted";
  header.appendChild(tickHeaderCell);

  const changeHeaderCell = document.createElement("td");
  changeHeaderCell.innerHTML = "Credit Change";
  changeHeaderCell.className = "_number mat-header-cell cdk-column-change mat-column-change";
  header.appendChild(changeHeaderCell);

  const resourceHeaderCell = document.createElement("td");
  resourceHeaderCell.innerHTML = "Resource Change";
  resourceHeaderCell.className = "_number mat-header-cell cdk-column-change";
  header.appendChild(resourceHeaderCell);

  const descriptionHeaderCell = document.createElement("td");
  descriptionHeaderCell.innerHTML = "Description";
  descriptionHeaderCell.className = "mat-header-cell cdk-column-description mat-column-description ng-star-inserted";
  header.appendChild(descriptionHeaderCell);

  appHistory.parentNode.replaceChild(module.exports.container, appHistory);

  module.exports.loadNewerButton = document.createElement("button");
  module.exports.loadNewerButton.className = "loadButton";
  module.exports.loadNewerButton.textContent = "Load new orders";
  module.exports.loadNewerButton.onclick = () => {
    // TODO: handle an issue where you wait for so long that page 0..N actually contains new orders
    module.exports.fetchMarketHistoryPage(0, true);
  };
  module.exports.container.appendChild(module.exports.loadNewerButton);

  module.exports.container.appendChild(module.exports.marketHistory);

  module.exports.loadMoreButton = document.createElement("button");
  module.exports.loadMoreButton.className = "loadButton";
  module.exports.loadMoreButton.textContent = "Load more orders";
  module.exports.loadMoreButton.onclick = () => {
    // TODO: move focus to new orders
    module.exports.fetchMarketHistoryPage(++module.exports.page);
  };
  module.exports.container.appendChild(module.exports.loadMoreButton);

  // https://stackoverflow.com/questions/8939467/chrome-extension-to-read-http-response

  // https://stackoverflow.com/questions/18534771/chrome-extension-how-to-get-http-response-body
  // chrome.devtools.network.onRequestFinished.addListener(request => {
  //     request.getContent((body) => {
  //       if (request.request && request.request.url) {
  //         if (request.request.url.includes('api/user/money-history')) {

  //            //continue with custom code
  //            var bodyObj = JSON.parse(body);//etc.
  //            console.log(body);
  //         }
  // }
  // });
  // });
};

module.exports.fetchMarketHistoryPage = function (page, prepend = false) {
  console.log(`Fetching page ${page}`);
  module.ajaxGet("https://screeps.com/api/user/money-history?page=" + page, function (data, error) {
    /**
     * data
     *  ok: number // 1 for success
     *  hasMore: bool // has more pages
     *  list: [
     *      balance: number
     *      change: number
     *      date: date // "2021-07-18T06:13:50.016Z"
     *      market: {
     *      'market.sell' = {amount, dealer, npc, owner, price, resourceType, roomName, targetRoomName }
     *           'market.fee' = {order: {price, resourceType,roomName,totalAmoount,type}}
     *      }
     *      shard: string
     *      tick: number
     *      type: string | 'market.fee' | 'market.sell'
     *      user: string // userId
     *      _id: string // id of transaction
     *  ]
     *
     */
    // console.log(data)
    if (!data.hasMore) {
      module.exports.loadMoreButton.disabled = true;
    }

    for (const history of data.list) {
      if (document.getElementById(history._id)) {
        console.log(history._id, "found skipping");
        continue;
      }

      module.exports.data[history._id] = history;

      if (history.dealer && !module.exports.players[history.dealer]) {
        // https://screeps.com/api/user/find?id=5a44e109ac5a5f1d0146916e
        // TODO: render player icon
      }

      const row = module.exports.generateHistoryHtmlRow(history);
      if (prepend) {
        module.exports.marketHistory.prepend(row);
      } else {
        module.exports.marketHistory.appendChild(row);
      }
    }

    setTimeout(() => {
      // refresh / regroup / redraw graph
      console.log("doing chart");
      //data: [{x:'2016-12-25', y:20}, {x:'2016-12-26', y:10}]
      const datasets = {};
      const chartData = {
        datasets: []
      };
      for (const [_id, history] of Object.entries(module.exports.data)) {
        if (/*history.type == "market.buy" ||*/ history.type == "market.sell") {
          const key = `${history.market.resourceType} ${history.type}`;
          let dataset = datasets[key];
          if (!dataset) {
            dataset = {
              label: key,
              data: [],
              backgroundColor: module.exports.getResourceColor(history.market.resourceType),
              borderColor: module.exports.getResourceColor(history.market.resourceType)
            };
            console.log(`dataset`, dataset);
            datasets[key] = dataset;
            chartData.datasets.push(dataset);
          }
          const date = new Date(history.date).toLocaleDateString();
          const dateEntry = dataset.data.find((d) => d.x === date);
          if (dateEntry) {
            dateEntry.y += history.change;
          } else {
            dataset.data.unshift({ x: date, y: history.change });
          }
        }
      }
      // console.log("setting chart data", module.exports.chart);
      module.exports.chart.data = chartData;

      module.exports.chart.update();
    }, 100);
  });
};
module.exports.getResourceColor = function (resourceType) {
  console.log(resourceType);
  switch (resourceType) {
    case "battery":
      return "rgba(217,213,0,255)";
    case "energy":
      return "rgba(118, 93, 0, 255)";
    case "power":
      return "rgba(255, 0, 0, 255)";
  }
};

module.exports.generateHistoryHtmlRow = function (history) {
  // console.log(history);
  const row = document.createElement("tr");
  row.id = history._id;
  row.className = "mat-row ng-star-inserted";
  row.style = "height:auto";

  const dateCell = document.createElement("td");
  dateCell.className = "mat-cell cdk-column-date mat-column-date ng-star-inserted";
  // childs with _date and _time classes
  row.appendChild(dateCell);

  const shardCell = document.createElement("td");
  shardCell.className = "mat-cell cdk-column-shard mat-column-shard ng-star-inserted";
  row.appendChild(shardCell);

  const tickCell = document.createElement("td");
  tickCell.className = "_number mat-cell cdk-column-tick mat-column-tick ng-star-inserted";
  row.appendChild(tickCell);

  const changeCell = document.createElement("td");
  changeCell.className = `_number mat-cell cdk-column-change mat-column-change ${
    history.change > 0 ? "_success" : "_fail"
  }`;
  row.appendChild(changeCell);
  changeCell.innerHTML =
    module.exports.nFormatter(history.change) +
    '<div style="margin-right:0px !important" class="type resource-credits"></div>';

  const resourceCell = document.createElement("td");
  resourceCell.className = `_number mat-cell cdk-column-change mat-column-change ${
    history.type == "market.buy" ? "_success" : "_fail"
  }`;
  row.appendChild(resourceCell);

  const descriptionCell = document.createElement("td");
  descriptionCell.className = "mat-cell cdk-column-description mat-column-description ng-star-inserted";
  descriptionCell.style = "text-align:right;";
  row.appendChild(descriptionCell);

  const date = new Date(history.date);
  dateCell.innerHTML = `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getFullYear() + 1} ${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
  shardCell.innerHTML = history.shard;
  tickCell.innerHTML = history.tick;

  var shard = history.shard || "shard0";

  try {
    if (history.type == "market.fee") {
      /*
       "market": {
          "changeOrderPrice": {
            "orderId": "6172d9cc8a185129c593b3af",
            "oldPrice": 34.751,
            "newPrice": 34.801
          }
        },
       */
      if (history.market.extendOrder) {
        var market = history.market.extendOrder;
        var infoCircle = '<div class="fa fa-question-circle" title=\'' + JSON.stringify(market) + "'></div>";

        descriptionCell.innerHTML = `Extend ${module.exports.nFormatter(market.addAmount)} ${infoCircle}`;
      } else if (history.market.changeOrderPrice) {
        var market = history.market.changeOrderPrice;
        var infoCircle = '<div class="fa fa-question-circle" title=\'' + JSON.stringify(market) + "'></div>";

        descriptionCell.innerHTML = `Change Price ${module.exports.nFormatter(
          market.oldPrice
        )} -> ${module.exports.nFormatter(market.newPrice)} ${infoCircle}`;
      } else {
        var market = history.market.order;
        var type = market.resourceType;
        var roomName = market.roomName;
        var roomLink = `<a href="#!/room/${shard}/${roomName}">${roomName}</a>`;
        var infoCircle = '<div class="fa fa-question-circle" title=\'' + JSON.stringify(market) + "'></div>";
        var resourceIcon = module.exports.resourceImageLink(shard, type);
        resourceCell.innerHTML = resourceIcon;

        const amount = market.remainingAmount
          ? `${module.exports.nFormatter(market.remainingAmount)} remaining`
          : `${module.exports.nFormatter(market.totalAmount)} total`;

        descriptionCell.innerHTML = `${roomLink} Market fee (${
          market.type
        }) ${amount} ${resourceIcon} (${module.exports.nFormatter(market.price)}) ${infoCircle}`;
      }
    } else if (history.type == "market.buy" || history.type == "market.sell") {
      var market = history.market;
      var type = market.resourceType;
      var roomName = market.roomName;
      var targetRoomName = market.targetRoomName;
      var accountResource = !roomName || !targetRoomName;
      var transactionCost = accountResource
        ? ""
        : module.exports.calcTransactionCost(shard, market.amount, roomName, targetRoomName);

      var ownerIsMe = market.owner == module.exports.userId;
      var dealerIsMe = market.dealer == module.exports.userId;

      var targetRoomIsMine = false;

      // market-resource--battery has -10px important margin, we need to override that
      var resourceIcon = module.exports.resourceImageLink(shard, type);

      var resourceEnergy = module.exports.resourceImageLink(shard, "energy");

      if (module.exports.shards[shard] && module.exports.shards[shard].rooms.includes(targetRoomName)) {
        let temp = roomName;
        roomName = targetRoomName;
        targetRoomName = temp;
        targetRoomIsMine = true;
      }

      var roomLink = `<a href="#!/room/${shard}/${roomName}">${roomName}</a>`;
      var targetRoomLink = `<a href="#!/room/${shard}/${targetRoomName}">${targetRoomName}</a>`;
      var infoCircle = '<div class="fa fa-question-circle" title=\'' + JSON.stringify(market) + "'></div>";
      var transactionCostHtml = `(<span style="color:#ff8f8f;margin-right:-12px">-${module.exports.nFormatter(
        transactionCost
      )} ${resourceEnergy}</span>)`;

      const amount = module.exports.nFormatter(market.amount);
      const price = module.exports.nFormatter(market.price);
      resourceCell.innerHTML = (history.type == "market.sell" ? "-" : "") + amount + resourceIcon;

      const soldOrBought = history.type == "market.buy" ? "bought" : "sold";
      const fromOrTo = history.type == "market.buy" ? "from" : "to";
      if (accountResource) {
        // TODO: acquire player, don't think we have that info
        descriptionCell.innerHTML = `Account: ${soldOrBought} ${amount}${resourceIcon} (${price}) ${infoCircle}`;
      } else if (dealerIsMe) {
        descriptionCell.innerHTML = `${roomLink} ${soldOrBought} ${amount}${resourceIcon} (${price}) ${fromOrTo} ${targetRoomLink} ${transactionCostHtml} ${infoCircle}`;
      } else {
        descriptionCell.innerHTML = `${roomLink} ${soldOrBought} ${amount}${resourceIcon} (${price}) ${fromOrTo} ${targetRoomLink} ${infoCircle}`;
      }
    }
  } catch (error) {
    var infoCircle = '<div class="fa fa-question-circle" title=\'' + JSON.stringify(history) + "'></div>";
    console.error(error);
    descriptionCell.innerHTML = `Error: ${error.message} ${infoCircle}`;
  }
  return row;
};
module.exports.resourceImageLink = function (shard, type) {
  // market-resource--battery has -10px important margin, we need to override that
  return type
    ? `<a href="#!/market/all/${shard}/${type}">
                    <div style=\"margin-right:0px !important\" class=\"type market-resource--${type}\"></div>
                  </a>`
    : "";
};
module.exports.update = function () {
  console.log("update getting called");
};

module.exports.nFormatter = function (num, digits = 2) {
  let convertFromNegative = 1;
  if (num < 0) {
    convertFromNegative = -1;
    num *= convertFromNegative;
  }
  let si = [
    { value: 1, symbol: "" },
    { value: 1e3, symbol: "k" },
    { value: 1e6, symbol: "M" },
    { value: 1e9, symbol: "G" },
    { value: 1e12, symbol: "T" },
    { value: 1e15, symbol: "P" },
    { value: 1e18, symbol: "E" }
  ];
  let rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  let i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  const formatted = (num / si[i].value).toFixed(digits).replace(rx, "$1") * convertFromNegative;
  return formatted + si[i].symbol;
};

/* taken from @screeps market */
module.exports.calcTransactionCost = function (shard, amount, roomName1, roomName2) {
  var distance = module.exports.calcRoomsDistance(shard, roomName1, roomName2, true);

  // TODO: export distance to render in table
  console.log(`${shard} amount: ${amount} roomName1: ${roomName1} roomName2: ${roomName2} distance: ${distance}`);
  return Math.ceil(amount * (1 - Math.exp(-distance / 30)));
};

/* taken from @screeps utils */
module.exports.calcRoomsDistance = function (shard, room1, room2, continuous) {
  var _exports$roomNameToXY = module.exports.roomNameToXY(room1);

  var _exports$roomNameToXY2 = module.exports._slicedToArray(_exports$roomNameToXY, 2);

  var x1 = _exports$roomNameToXY2[0];
  var y1 = _exports$roomNameToXY2[1];

  var _exports$roomNameToXY3 = module.exports.roomNameToXY(room2);

  var _exports$roomNameToXY4 = module.exports._slicedToArray(_exports$roomNameToXY3, 2);

  var x2 = _exports$roomNameToXY4[0];
  var y2 = _exports$roomNameToXY4[1];

  var dx = Math.abs(x2 - x1);
  var dy = Math.abs(y2 - y1);
  if (continuous) {
    // WORLD_WIDTH and WORLD_HEIGHT constants are deprecated, please use Game.map.getWorldSize() instead
    // const WORLD_WIDTH = 202;
    // const WORLD_HEIGHT = 202;
    // var width = WORLD_WIDTH;
    // var height = WORLD_HEIGHT;
    var { width, height } = module.exports.shards[shard];

    dx = Math.min(width - dx, dx);
    dy = Math.min(height - dy, dy);
  }
  return Math.max(dx, dy);
};

/* taken from @screeps utils */
module.exports.roomNameToXY = function (name) {
  name = name.toUpperCase();

  var match = name.match(/^(\w)(\d+)(\w)(\d+)$/);
  if (!match) {
    return [undefined, undefined];
  }

  var _match = module.exports._slicedToArray(match, 5);

  var hor = _match[1];
  var x = _match[2];
  var ver = _match[3];
  var y = _match[4];

  if (hor == "W") {
    x = -x - 1;
  } else {
    x = +x;
  }
  if (ver == "N") {
    y = -y - 1;
  } else {
    y = +y;
  }
  return [x, y];
};

/* taken from @screeps utils */
module.exports._slicedToArray = (function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;
    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);
        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }
    return _arr;
  }
  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
})();
