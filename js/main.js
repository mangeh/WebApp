var opts = {
  lines: 11, // The number of lines to draw
  length: 22, // The length of each line
  width: 8, // The line thickness
  radius: 19, // The radius of the inner circle
  corners: 0.6, // Corner roundness (0..1)
  rotate: 36, // The rotation offset
  direction: 1, // 1: clockwise, -1: counterclockwise
  color: '#000', // #rgb or #rrggbb or array of colors
  speed: 1.7, // Rounds per second
  trail: 32, // Afterglow percentage
  shadow: true, // Whether to render a shadow
  hwaccel: false, // Whether to use hardware acceleration
  className: 'spinner', // The CSS class to assign to the spinner
  zIndex: 2e9, // The z-index (defaults to 2000000000)
  top: 90, // Top position relative to parent in px
  left: 'auto' // Left position relative to parent in px
};

function loadJSONList() {
	var target = document.getElementById('myDiv');


	$.ajaxSetup( { "async": false } );
	spinner = new Spinner(opts).spin(target);

// $('#myDiv').after(new Spinner(opts).spin().el);
$.getJSON(
		// 'tempj/nyse'
		'http://mercury.dyndns.org:5984/mercury/_design/bi/_view/nyse?startkey=%221384142400000%22&endkey=%221384172149000%22'
		, function(url_data) {
			$.each(url_data, function (i,element) {
				if ($.isArray(element) === true) {
					sortArrayBySymbol(element);
					setStockData(element);

				} 
			});
		});
spinner.stop();
}

function loadSingleStockList() {
	try {getStockData()}
	catch (e) {
		loadJSONList();
	}
	var tableRef = document.getElementById('resultList');
	var otherLetter = null;
	while ( tableRef.rows.length > 0 )
	{
		tableRef.deleteRow(0);
	}
	var target = document.getElementById("letternavigator");
	document.getElementById("letternavigator").innerHTML = "";
	var firstInList = null;

	$.each(getStockData(), function (i,value) {
		setFirstLetter(value.value.symbol.substr(0,1));
		if(firstInList === null)  {
			firstInList = getFirstLetter();
		}
		if (getFirstLetter() !== otherLetter) {
			otherLetter = getFirstLetter();
			addSearchLetters(getFirstLetter());
		} 	
	});


	addPageNumbers(firstInList);
	


}      


function search() {
		try {getStockData()}
	catch (e) {
		loadJSONList();
	}
	var target = document.getElementById('myDiv');
	var spinner = new Spinner(opts).spin(target);
	var tableRef = document.getElementById('resultList');
	var searchterm = document.getElementById("sok").value.toLowerCase();
	hide('stock');
	spinner.spin();
	while ( tableRef.rows.length > 0 )
	{
		tableRef.deleteRow(0);
	}
	console.log("Searching for "+searchterm);

	$.each(getStockData(), function (i,value) {
		if (value.value.symbol.toLowerCase().indexOf(searchterm) != -1 || value.value.name.toLowerCase().indexOf(searchterm) != -1) {
			console.log("Found Match");
			addElement(value.value.symbol,value.value.name,value.value.change,value.value.latest);    
		}
		});

}    


function portfoliobuilder() {

	// console.log(getStockData());
	// spinner.spin();
	var tableRef = document.getElementById('resultList');
	while ( tableRef.rows.length > 0 )
	{
		tableRef.deleteRow(0);
	}
	try {getStockData()}
	catch (e) {
		loadJSONList();
	}

	$.each(getStockData(), function (i,value) {
		if (localStorage[value.value.symbol] !== undefined) {
			addElement(value.value.symbol,value.value.name,value.value.change,value.value.latest);    
		}
	});
	// spinner.stop();


}      

function addSearchLetters(letter) {

	var target = document.getElementById("letternavigator");
	var button = document.createElement('button');
	var tnode = document.createTextNode(letter);
	button.setAttribute('onClick', 'addPageNumbers("'+letter+'");');
	button.appendChild(tnode);
	target.appendChild(button);
}

function addPageNumbers(letter) {

	var target = document.getElementById("pagenavigator");
	document.getElementById("pagenavigator").innerHTML = "";
	var count = 0;
	var pcount =1;
	$.each(getStockData(), function (i,value) {
		if (letter === value.value.symbol.substr(0,1) && count === 0) {
			setFirstLetter(letter);

			var target = document.getElementById("pagenavigator");
			var button = document.createElement('button');
			var tnode = document.createTextNode(pcount);
			button.setAttribute('onClick', 'addElementsForPage("'+pcount+'");');
			button.appendChild(tnode);
			target.appendChild(button);
			pcount++;
			count++;
		} else if (letter === value.value.symbol.substr(0,1) && count === 20) {
			count = 0;

		} else if (letter === value.value.symbol.substr(0,1)) {
			count++;
		}

	});
	addElementsForPage(1);
}

function addElementsForPage(pcount) {
	var tableRef = document.getElementById('resultList');
	var otherLetter = null;
	while ( tableRef.rows.length > 0 )
	{
		tableRef.deleteRow(0);
	}

	var count = 0;
	var elementrange = pcount * 20;
	var startvalue = elementrange - 20;
	$.each(getStockData(), function (i,value) {
		if (getFirstLetter() === value.value.symbol.substr(0,1) && count < startvalue+20 && count >= startvalue) {
			count++;
			addElement(value.value.symbol,value.value.name,value.value.change,value.value.latest); 
		} else if(getFirstLetter() === value.value.symbol.substr(0,1)) {count++;}
	});
}

function addElement(Symbol,Name,Change,Value) {
	var cdata = [Symbol,Name,Change,Value];
	var ni = document.getElementsByTagName('tbody').item(0);
	var newrow = document.createElement('tr');
	newrow.className='clickableRow';
	newrow.onclick = function() {
		hide('stocklist');
		setSymbol(Symbol);
		setChartType("line");
		firstDataFill = true;
		getstockhistory(getSymbol(),'today');
		var cn = document.getElementById('companyname').innerHTML=Name;
		getNewsItems();
		portfolioController();
	}
	for (var i = 0; i<cdata.length;i++) {
		newrow.appendChild(makecells(cdata[i]));
	}
	ni.appendChild(newrow);
}

function makecells(cdata) {
	cell = document.createElement("td");
	textnode = document.createTextNode(cdata);
	cell.appendChild(textnode);
	return cell;
}


function getNewsItems() {
	var today = Date.now().valueOf();
	var timeframe = Date.now().add(-24).hours();
	var timeframe = timeframe.valueOf();
	var symbol = getSymbol();
	var nitem = 0;
	var tableRef = document.getElementById('newstable');
	while ( tableRef.rows.length > 0 )
	{
		tableRef.deleteRow(0);
	}
	console.log('http://mercury.dyndns.org:5984/mercury/_design/bi/_view/news?key=[%22'+symbol+'%22,%22'+getMarket()+'%22]');
	$.getJSON('http://mercury.dyndns.org:5984/mercury/_design/bi/_view/news?key=[%22'+symbol+'%22,%22'+getMarket()+'%22]', function(url_data) {
		// $.getJSON('tempj/abxnews.txt', function(url_data) {
		// $.getJSON('http://mercury.dyndns.org:5984/mercury/_design/bi/_view/news_list?startkey=%22'+timeframe+'%22&endkey=%22'+today+'%22', function(url_data) {
			$.each(url_data, function (i,element) {
				if ($.isArray(element) === true) {
					sortNewsArrayByTime(element);
					element.reverse();
					setNewsArray(element);
					$.each(getNewsArray(), function (i,value) {

						if (nitem < 10) {
							addNewsListItem({title: value.value.title,link: value.value.link,description: value.value.description,date: value.value.pubDate});
							nitem++;
						}
					});
				}
			});
		});
}

function getstockhistory(symbol,timeframe) {

	duration = timeframe;
	today = Date.now().valueOf();

	if (timeframe === "week") {
		timeframe = Date.today().add(-7).days();
		timeframe = timeframe.valueOf();

		console.log(timeframe);
	}
	if (timeframe === "month") {
		timeframe = Date.today().add(-31).days();
		timeframe = timeframe.valueOf();

		console.log(timeframe);
	} if (timeframe === "today") {
		timeframe = Date.today();
		timeframe = timeframe.valueOf();

		console.log(timeframe);
	}

	var tableRef = document.getElementById('resultList');
	var date1 = null;
	var date2 = null;
	dailyValues = [];
	datelist = [];
	openVallist = [];
	latestlist = [];
	changelist = [];
	percentlist = [];
	dayLow = [];
	dayHigh = [];
	var Dat;
	var OVal;
	var Chan;
	var Lat;
	var nextDay = new Boolean();
	diadata = [];
	console.log('http://mercury.dyndns.org:5984/mercury/_design/bi/_view/nyse_stock?startkey=[%22'+symbol+'%22,%22'+timeframe+'%22]&endkey=[%22'+symbol+'%22,%22'+today+'%22]');
	$.getJSON('http://mercury.dyndns.org:5984/mercury/_design/bi/_view/nyse_stock?startkey=[%22'+symbol+'%22,%22'+timeframe+'%22]&endkey=[%22'+symbol+'%22,%22'+today+'%22]', function(url_data) {
		// $.getJSON('http://mercury.dyndns.org:8080/JAXRS-BISystem/api/stocks/'+timeframe+'/'+symbol, function(url_data) {
			// $.getJSON('tempj/ABXday', function(url_data) {


				$.each(url_data, function (i,element) {
					if ($.isArray(element) === true) {
						sortArrayByTime(element);
						element.reverse();
						$.each(element, function (i,value) {
							dayLow = [];
							dayHigh = [];

						// console.log("value is " +value.value.updated);
						if (duration === "today") {
							console.log("Getting data for day");

							var date = new Date(parseInt(value.value.updated));
							date2=date.toString("HH:mm");

							// openVallist.push(value.value.openVal);

							// datelist.push(date2); 
							// latestlist.push(value.value.latest);

							// OVal = parseFloat(value.value.openVal);
							// Dat =date2; 
							// Chan = parseFloat(value.value.change);
							// Lat = parseFloat(value.value.latest);
							// Vol = value.value.volume;
							// Perc = value.value.percent;
							// Dhi = null;
							// Dlow = null;

							diadata.push({date: date2,c: parseFloat(value.value.latest),o: parseFloat(value.value.openVal),h: Dhi,l:Dlow,cl: parseFloat(value.value.change),vol: value.value.volume,percent: value.value.percent});
						// changelist.push(parseFloat(value.value.change));
					} 
					if (duration === "month" || duration === "week") {
						date2 = dateConvert(value.value.updated);
						if (date1 === null) {


						}
						if (date1 === date2) {
							dailyValues.push(parseFloat(value.value.latest));
							nextDay = true;
						} else {
							if (nextDay === true) {
								dailyValues.sort();

								Dlow = dailyValues[0];
								Dhi = dailyValues.pop();
								dailyValues = [];
								nextDay = false;
								diadata.push({date: Dat,c: Lat,o: OVal,h: Dhi,l:Dlow,cl:Chan});

							}

							date1 = date2;		
							OVal = parseFloat(value.value.openVal);
							Dat =date2; 
							Chan = parseFloat(value.value.change);
							Lat = parseFloat(value.value.latest);
							dailyValues.push(parseFloat(value.value.openVal));
							dailyValues.push(parseFloat(value.value.latest));



						}

					}


				});
}
});

setDiadata(diadata.reverse());
chartPaintSelector();
if (firstDataFill === true) {
	fillInDataTable();
	firstDataFill = false;
}
});

}    



function dateConvert(timeString) {
	var date = new Date(parseInt(timeString));
	date=date.toString("MMM dd");
	return date;
}


function addNewsListItem(newsitem) {

	var date2 = new Date(parseInt(newsitem.date));
	date2 = date2.toString("MMM dd HH:mm");
	var cdata = [newsitem.title,date2];
	var newstable = document.getElementById('newstable');
	var newrow = document.createElement('tr');
	newrow.className='clickableRow';
	newrow.onclick = function() {
		setNewsItem(newsitem);
		hide('news');
	};
	for (var i = 0; i<cdata.length;i++) {
		newrow.appendChild(makecells(cdata[i]));
	}
	newstable.appendChild(newrow);
}

function fillInDataTable() {

	$(document).ready(function() {
		$("#dailystats").find("tr:gt(0)").remove();
	});

	var ni = document.getElementById('dailystats');
	var newrow = document.createElement('tr');
	try  {
		var cdata =[getSymbol(),
		diadata[diadata.length-1].c,
		diadata[diadata.length-1].cl,
		diadata[diadata.length-1].percent,
		diadata[diadata.length-1].o,
		diadata[diadata.length-1].vol];
		var Change = diadata[diadata.length-1].cl;
		var Value = diadata[diadata.length-1].c;
		var Percent = diadata[diadata.length-1].percent;
		var Open = diadata[diadata.length-1].o;
		var Volume = diadata[diadata.length-1].vol

	} catch (te) {

		var cdata = [getSymbol(),"Market closed","Market closed","Market closed","Market closed"];
		Change = "Market closed";
		Value = "Market closed";
		Percent ="Market closed";
		Open = "Market closed";
		Volume ="Market closed";
	}

	for (var i = 0; i<cdata.length;i++) {
		newrow.appendChild(makecells(cdata[i]));
	}

	console.log(document.getElementById('latest'));
	ni.appendChild(newrow);
}



//Checks wether the stock is already saved or not upon loading a stock,
//also deletes and saves stocks upon pressing the save button.
function portfolioController() {
	var sb = document.getElementById('save');
	if (localStorage[getSymbol()] !== undefined) {
		document.getElementById('save').innerHTML = "Remove from portfolio";
	} else  {
		document.getElementById('save').innerHTML = "Add to portfolio";
	}
	sb.onclick = function() {
		if (localStorage[getSymbol()] !== undefined) {
			console.log("Already in portfolio");
			localStorage.removeItem(getSymbol());
			console.log("deleted ");
			document.getElementById('save').innerHTML = "Add to portfolio";

		} else {
			console.log("Not saved");
			localStorage[getSymbol()] = getSymbol();
			console.log("saved");
			document.getElementById('save').innerHTML = "Remove from portfolio";
		}
	}
}



//Hides irrelevant items,menus,etc
function hide(item) {
	var nitem = document.querySelector("#newsdisplay");
	var slist = document.querySelector("#listdisp");
	var chart = document.querySelector("#statView");
	var nlist = document.querySelector("#stocknews");
	var nitem = document.querySelector("#newsdisplay");
	if (item === 'stocklist') {
		slist.className = 'visuallyhidden';
		chart.className = 'visible';
		nlist.className = 'visible';
		radiobtn = document.getElementById("day");
		radiobtn.checked = true;
	} else if (item === 'news') {
		nlist.className = 'visuallyhidden';
		nitem.className = 'visible';
		var nheadline = document.getElementById('newsheadline').innerHTML = getNewsItem().title;
		var newsdisplay = document.getElementById('newstext').innerHTML = getNewsItem().description;
	} else if (item === 'newsitem') {
		nitem.className = 'visuallyhidden';
		nlist.className = 'visible';
	} else if (item === 'stock') {
		chart.className = 'visuallyhidden';
		slist.className = 'visible';
		// setStockData(loadJSONList());
		// loadSingleStockList();

	}
}


//Sorting functions for the JSON object
function sortArrayBy(data) {
	data.sort(function (a, b) {
		a = a.value.updated;
		b = b.value.updated;
		return a.localeCompare(b);
	});
}

function sortArrayByTime(data) {
	data.sort(function (a, b) {
		a = a.value.updated;
		b = b.value.updated;
		return a.localeCompare(b);
	});
}

function sortArrayBySymbol(data) {
	data.sort(function (a, b) {
		a = a.value.symbol;
		b = b.value.symbol;
		return a.localeCompare(b);
	});
}


function sortNewsArrayByTime(data) {
	data.sort(function (a, b) {
		a = a.value.pubDate;
		b = b.value.pubDate;
		return a.localeCompare(b);
	});
}

//Paints a line chart showing closing values
function paintlinechart() {
	{
		$("#canvas").dxChart({
			title: {
				text: 'Value'
				// placeholderSize: 20
			},
			legend: {
				verticalAlignment: "bottom",
				visible:false,
			},
			dataSource: getDiadata(),

			valueAxis: {
				title: { 
					text: "EUR"
				},

			},

			series: {
				argumentField: "date",
				valueField: "c",
				color: 'rgba(220,53,34,0.7)',
				type: "line",
				point: {
					color: 'rgba(220,53,34,1)'
				}
			},

			tooltip:{
				enabled: true
			}
		});
	}
}

//Paints a candlestick diagram
function paintCandlestick() {
	$("#canvas").dxChart({
		title: "Value",
		dataSource: getDiadata(),
		commonSeriesSettings: {
			argumentField: "date",
			type: "candlestick"
		},
		series: [
		{ 
			name: "STOCKS",
			openValueField: "o", 
			highValueField: "h", 
			lowValueField: "l", 
			closeValueField: "c", 
			reduction: {
				color: 'rgba(220,53,34,0.9)'
			}
		}
		],    
		valueAxis: {
			title: { 
				text: "EUR"
			},

		},
		tooltip:{
			enabled: true
		},
		argumentAxis: {
			label: {
				format: "shortDate"
			}
		}
	});
}

//Paints a bar chart showing the change over the selected time.
function paintbarchart() {
	var cl = getChangeList();
	diagramdata = [];
	for (var i = 0;i <= cl.length;i++) {
		diagramdata.push({day: getDateList()[i],value: getChangeList()[i]});
	}
	
	{
		$("#canvas").dxChart({
			title: {
				text: 'Change'
			},
			dataSource: getDiadata(),

			valueAxis: {
				title: { 
					text: "EUR"
				},

			},

			series: {
				argumentField: "date",
				valueField: "cl",
				name: "The daily change",
				type: "bar",
				color: 'rgba(220,53,34,0.9)',
			}
		});
	}
}


function chartPaintSelector() {
	console.log("chartPaintSelector "+getChartType());
	if(getChartType() === "bar") {
		paintbarchart();
	}
	if (getChartType() === "line") {
		paintlinechart();
	}
	if (getChartType() === "candle") {
		paintCandlestick();
	}
}