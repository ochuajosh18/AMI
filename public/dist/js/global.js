//resize events
$(window).resize(function(){
    $($.fn.dataTable.tables(true)).DataTable().columns.adjust();
});
  