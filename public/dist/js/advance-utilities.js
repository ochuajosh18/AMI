function loadOrderMaterialRelation(callback) {
	$.ajax({
	    url: '/load/advanceUtility/loadOrderMaterialRelation',
	    type: 'GET',
	    async: false,
	    success: function(data){
	      callback(null, data);
	    }
	 });
}

function loadAllOrders(callback) {
  $.ajax({
      url: '/load/advanceUtility/loadAllOrders',
      type: 'GET',
      async: false,
      success: function(data){
        callback(null, data);
      }
   });
}


/*function loadAll(viewType, viewName, callback) {
  sessionId = JSON.parse(localStorage.getItem("userData")).sessionID;
  
  $.ajax({
    url: '/load/document/' + viewType + '/' + viewName + '/' + sessionId,
    type: 'GET',
    async: false,
    success: function(data){
      callback(null, data);
    }
  });
}*/