// Vars
var $selectRepository = $('#selectRepository');
var $selectParams = $('#selectParams');
var $selectUntilSince = $('#selectUntilSince');
var $buttonFetchData = $('#buttonFetchData');
var $fetchDataLoader = $('#fetchDataLoader');
var $chartContainer = $('#chartContainer');
var $tableContainer = $('#tableContainer');
var $inputDatepicker = $('#inputDatepicker');
var $containerDate = $('#containerDate');

var endpointBaseUrl = 'https://api.github.com/repos/';
var repository = $selectRepository.val();
var params = $selectParams.val();
var paramsDate = $selectUntilSince.val();
var chartData = [];
var selectedDate = dayjs(Date.now()).toISOString();

var percentage = 70;

var chartConfigs = {
  type: 'line',
  width: '100%',
  height: '400',
  dataFormat: 'json',
  dataSource: {
    chart: {
      caption: 'Weekly Commit Activity',
      subCaption: 'Selected Repo',
      xAxisName: 'Week',
      yAxisName: 'Total commits',
      theme: 'fusion'
    },
    data: chartData
  }
};

var endpointUrl = `${endpointBaseUrl}${repository}${params}?${paramsDate}=${selectedDate}`;

// Handlers
function handleSelectRepositoryChange() {
  var $this = $(this);
  var thisValue = $this.val();

  repository = thisValue;
  updateEndPoint();
  resetDataContainers();
}

function handleSelectParamsChange() {
  var $this = $(this);
  var thisValue = $this.val();

  $containerDate.toggleClass('d-none', thisValue == '/stats/commit_activity');

  params = thisValue;
  updateEndPoint();
  resetDataContainers();
}

function handleSelectUntilSinceChange() {
  var $this = $(this);
  var thisValue = $this.val();

  paramsDate = thisValue;
  updateEndPoint();
  resetDataContainers();
}

function updateEndPoint() {
  endpointUrl = `${endpointBaseUrl}${repository}${params}?${paramsDate}=${selectedDate}`;
}

function handleButtonFetchDataClick() {
  var $this = $(this);

  if ($this.attr('disabled')) return;

  $fetchDataLoader.removeClass('d-none');
  $this.attr('disabled', 'disabled');

  $.ajax({
    url: endpointUrl,
    success: function(response) {
      $fetchDataLoader.addClass('d-none');
      $this.removeAttr('disabled');

      typeHandler[params](response);
    }
  });
}

var typeHandler = {
  '/commits': function(response) {
    var groupedByDay = {};

    response.forEach(el => {
      var commitDate = dayjs(el.commit.author.date).format('DD-MM-YYYY');
      if (groupedByDay[commitDate]) {
        groupedByDay[commitDate] += 1;
      } else {
        groupedByDay[commitDate] = 1;
      }
    });

    chartConfigs.dataSource.data = Object.keys(groupedByDay)
      .map(key => ({
        label: key,
        value: groupedByDay[key]
      }))
      .reverse();

    chartConfigs.dataSource.chart.caption = 'Daily Commits Activity';
    chartConfigs.dataSource.chart.subCaption = repository;

    $chartContainer.insertFusionCharts(chartConfigs);

    var tableRows = response
      .map(
        el => `
    <tr>
      <td>${dayjs(el.commit.author.date).format('DD-MM-YYYY')}</td>
      <td>${el.commit.author.name}</td>
    </tr>
    `
      )
      .join('');

    var tableCommits = `<table class="table table-sm table-bordered"><tr><th>Date</th><th>Author</th></tr>${tableRows}</table>`;

    $tableContainer.html(tableCommits);
  },
  '/stats/contributors': function(response) {
    console.log('Handle contributors');
  },
  '/stats/commit_activity': function(response) {
    chartConfigs.dataSource.data = response.map(el => ({
      label: dayjs(new Date(el.week * 1000)).format('DD-MM-YYYY'),
      value: el.total
    }));

    chartConfigs.dataSource.chart.caption = 'Weekly Commits Activity';
    chartConfigs.dataSource.chart.subCaption = repository;

    $chartContainer.insertFusionCharts(chartConfigs);

    // Weekly table
    var tableRows = response
      .reverse()
      .map(
        (el, index) => `
    <tr>
      <td class="cell-numeric">${dayjs(el.week * 1000).format(
        'DD MMMM YYYY'
      )}</td>
      <td class="text-right cell-numeric">${el.days[0]}</td>
      <td class="text-right cell-numeric">${el.days[1]}</td>
      <td class="text-right cell-numeric">${el.days[2]}</td>
      <td class="text-right cell-numeric">${el.days[3]}</td>
      <td class="text-right cell-numeric">${el.days[4]}</td>
      <td class="text-right cell-numeric">${el.days[5]}</td>
      <td class="text-right cell-numeric">${el.days[6]}</td>
      <td class="text-right cell-numeric text-bold ${
        response[index + 1]
          ? el.total >
            response[index + 1].total * (percentage / 100) +
              response[index + 1].total
            ? 'text-success'
            : el.total <
              response[index + 1].total -
                response[index + 1].total * (percentage / 100)
            ? 'text-danger'
            : ''
          : ''
      }"><span ${
          response[index + 1]
            ? el.total >
              response[index + 1].total * (percentage / 100) +
                response[index + 1].total
              ? `data-toggle="tooltip" data-placement="top" title="More than ${percentage}% increase"`
              : el.total <
                response[index + 1].total -
                  response[index + 1].total * (percentage / 100)
              ? `data-toggle="tooltip" data-placement="top" title="More than ${percentage}% decrease"`
              : ''
            : ''
        }>${el.total}</span></td>
    </tr>
    `
      )
      .join('');

    var tableWeeklyCommits = `
    <table class="table table-sm table-bordered table-hover">
      <tr>
        <th>Week</th>
        <th class="text-right">Sunday</th>
        <th class="text-right">Monday</th>
        <th class="text-right">Tuesday</th>
        <th class="text-right">Wednesday</th>
        <th class="text-right">Thursday</th>
        <th class="text-right">Friday</th>
        <th class="text-right">Saturday</th>
        <th class="text-right">Total</th>
      </tr>
      ${tableRows}
    </table>`;

    $tableContainer.html(tableWeeklyCommits);
    $('[data-toggle="tooltip"]').tooltip();
  },
  '/stats/participation': function(response) {
    console.log('Handle participation');
  },
  '/stats/punch_card': function(response) {
    console.log('Handle commits per hour');
  }
};

function handleInputDatepickerSelect(formattedDate, date, inst) {
  selectedDate = dayjs(date).toISOString();

  updateEndPoint();
  resetDataContainers();
}

// Functions
function resetDataContainers() {
  $chartContainer.html('');
  $tableContainer.html('');
}

// Events
$(document).ready(function() {
  $inputDatepicker.datepicker({
    onSelect: handleInputDatepickerSelect,
    language: 'en'
  });

  $selectRepository.on('change', handleSelectRepositoryChange);
  $selectParams.on('change', handleSelectParamsChange);
  $selectUntilSince.on('change', handleSelectUntilSinceChange);
  $buttonFetchData.on('click', handleButtonFetchDataClick);
});
