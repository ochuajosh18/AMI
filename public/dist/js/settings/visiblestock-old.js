checkSession();
setUserData();

$(document).ready(function() {
  var localDb_Material, localDb_Stock, localDb_StoringReport, localDb_Other,
      datatable_Material;

  loadInterval(loadStoringReport);
  loadInterval(loadStock);
  loadInterval(loadOther);
  loadIntervalFinish(loadMaterialTable);


  function loadMaterialTable() { 
    loadMaterial();
    localDb_Material = addExtraFields_Material(localDb_Material);
    localDb_Material = removeDuplicate_By2Keys(localDb_Material, 'size', 'sizePattern');


    datatable_Material = $('#material-table').DataTable({
      destroy   : true,
      data      : localDb_Material,
      autoWidth : false,

      columns : [
        {'data': 'usedMaterialCode'},
        {'data': 'materialGroup'},
        {'data': 'storageLocation'},
        {'data': 'totalStock'},
        {'data': 'visibleStock'}
      ],

      columnDefs: 
      [
        { 
          className : 'dt-center',
          targets   : [3, 4]
        }
      ],

      rowCallback : function (row, data, iDataIndex) {
        $(row).attr('id', data['id']);

        var text = $(row).find("td:eq(3)").text();
        $(row).find("td:eq(3)").html('<span class="badge">' +  text  + ' </span>');

        text = $(row).find("td:eq(4)").text();
        $(row).find("td:eq(4)").html('<span class="badge">' +  text  + ' </span>');
      }
    });


    $('.loading-state').fadeOut('slow');
  }



  function loadMaterial() {
    var data = [];

    loadAll('AMI2_MATERIAL', 'all', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
        }
      } else {
        console.log(res);
      }
    });

    localDb_Material = data;
  }



  function loadStock() {
    var data = [];

    loadAll('AMI2_STOCK', 'all', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
        }
      } else {
        console.log(res);
      }
    });

    localDb_Stock = data;
  }



  function loadStoringReport() {
    var data = [];

    loadAll('AMI2_STORING_REPORT', 'all', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
        }
      } else {
        console.log(res);
      }
    });

    localDb_StoringReport = data;
  }



  function loadOther() {
    var data = [];

    loadAll('AMI2_OTHER', 'all', function(err, res) {
      if (res.statusCode <= 299) {
        for (var i = 0; i < res.body.total_rows; i++) {
          data.push(res.body.rows[i].value);
          data[i].id = res.body.rows[i].id;
          data[i].key = res.body.rows[i].key;
        }
      } else {
        console.log(res);
      }
    });

    localDb_Other = customArrayFilter(data, 'key', 'VISIBLE::STOCK')[0];
  }



  function addExtraFields_Material(data) {
    for (var i in data) {
      var stockDoc = customArrayFilter_By2Keys(localDb_Stock, 'size', data[i].size, 'sizePattern', data[i].sizePattern),
          storingReportDoc = customArrayFilter(localDb_StoringReport, 'materialCode', data[i].materialCode);
      

      var stocks = [], totalStock = 0, visibleStock;
      for (var j in stockDoc) {
        var storingReportDoc_perStock = customArrayFilter(localDb_StoringReport, 'materialCode', stockDoc[j].materialCode);


        if (isNotNull(storingReportDoc_perStock) && stockDoc[j].totalStock != 0) {
          stocks.push({
            'id'           : stockDoc[j].id,
            'deliveryDate' : storingReportDoc_perStock[0].deliveryDate,
            'totalStock'   : stockDoc[j].totalStock
          });


          totalStock += parseInt(stockDoc[j].totalStock);
        }
      }


      // sort stock by earliest delivery date
      stocks.sort(function(a, b){
        return new Date(a.deliveryDate) - new Date(b.deliveryDate);
      });


      data[i].usedMaterialCode = generateNewMaterialCode(data[i].materialCode, data[i].size, data[i].source);

      
      // insert new fields
      data[i].stocks = stocks;
      data[i].totalStock = totalStock;
      data[i].deliveryDate = (isNotNull(storingReportDoc)) ? storingReportDoc.deliveryDate : '- - -';
      data[i].blank = '';
      data[i].visibleStock = (isNotNull(localDb_Other)) ? localDb_Other.stock : '- - -';
    }


    // for duplicates, remove 2nd item occurence
    data.sort(function(a, b){
      return new Date(a.deliveryDate) - new Date(b.deliveryDate);
    });


    return data;
  }
  



  function generateNewMaterialCode(materialCode, size, source) {
    var part1 = materialCode.slice(0, 3);

    var lastIndex = size.lastIndexOf(" ");
    
    var form1 = size.substring(0, lastIndex).trim();
    var form2 = form1.replace(/-/g, "");
    var part2 = form2.replace(/\s+/g, '-');

    var part3 = source.substr(2, source.length);


    return part1 + '-' + part2 + '-' + part3;
  }




  $('#save-visible-stock-all-btn').click(function(){
    $('.loading-state').fadeIn('slow');

    var visibleStockAll = $('#visible-stock-all').val();
        visibleStockDoc = localDb_Other,
        doc = { stock : visibleStockAll };
        

    updateDocument(visibleStockDoc.id, doc, function(err, res){
      if (res.statusCode <= 299) {
        resultNotify('fa-check-circle', 'SUCCESS', 'Stock/s successfully updated', 'success');
        setTimeout(function(){
          loadInterval(loadOther);
          loadIntervalFinish(loadMaterialTable);
        }, 2000);
      }
      
      else if (res.statusCode >= 300) {
        resultNotify('fa fa-times', 'ERROR', 'Stock/s not updated.<br>Something went wrong. Please try again later', 'danger');
      }
    });
  });

});