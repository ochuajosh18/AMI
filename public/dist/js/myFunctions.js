function isNotNull(data) {
    
  // array
  if (typeof data == 'object' && Array.isArray(data)) {
    return (data.length != 0) ? true : false; 
  } 

  // object
  else if (typeof data == 'object' && !Array.isArray(data)) {
    for(var key in data) {
      if(data.hasOwnProperty(key))
        return true;
    }
    return false;
  }

  else {
    // console.log('blank talaga');
    return false;
  }
}


function isNotBlank(variable) {
  return (variable != undefined) ? variable : '- - -';
}



function isNotBlank1key(array, key) {
  return (array != undefined) ? array[key] : '- - -';
}



function isNotBlank2key(array, key1, key2) {
  return (array != undefined) ? array[key1] + ' ' + array[key2] : '- - -';
}



function toCurrency(variable) {
  return parseFloat(variable).toFixed(2);
}



function numberWithCommas(x) {
  var parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}



function customArrayFilter(data, key, value) {
  var filteredArray = data.filter(function(item) {
    return item[key] == value;
  });

  return filteredArray;
}



function customArrayFind(data, key, value) {
  var filteredArray = data.find(function(item) {
    return item[key] == value;
  });

  return filteredArray;
}


function customArrayFilter_By2Keys(data, key1, value1, key2, value2) {
  var filteredArray = data.filter(function(item) {
    return item[key1] == value1 && item[key2] == value2;
  });

  return filteredArray;
}



function reverse_customArrayFilter(data, key, value) {
  var filteredArray = data.filter(function(item) {
    return item[key] != value;
  });

  return filteredArray;
}



function reverse_customArrayFilter_By2Keys(data, key1, value1, key2, value2) {
  var filteredArray = data.filter(function(item) {
    return item[key1] != value1 && item[key2] != value2;
  });

  return filteredArray;
}



function removeDuplicate(data, key) {
  var uniqueData = [], newData = [];

  for(i in data){    
    if(uniqueData.indexOf(data[i][key]) === -1){
      uniqueData.push(data[i][key]);
      newData.push(data[i]);
    }
  }

  return newData;
}



function removeDuplicate_By2Keys(data, key1, key2) {
  var uniqueData1 = [], uniqueData2 = [], newData = [];
  var count = 0;

  for(i in data){
    if(uniqueData1.indexOf(data[i][key1]) == -1 || uniqueData2.indexOf(data[i][key2]) == -1  ){
      uniqueData1.push(data[i][key1]);
      uniqueData2.push(data[i][key2]);
      newData.push(data[i]);
    }

    else {
      // console.log(data[i][key1]);
    }
  }

  return newData;
}



function deleteOnLocalArray(data, key, value) {
  // fin index
  var index = data.findIndex(function(item) {
    return item[key] == value;
  });

  if (index !== -1) {
    return data.splice(index, 1);
  }

  else {
    return data;
  }
}



function updateOnLocalArray(data, key, value, keyToUpdate, valueToUpdate) {
  // fin index
  var index = data.findIndex(function(item) {
    return item[key] == value;
  });

  console.log(data[index][keyToUpdate]);
  data[index][keyToUpdate] = valueToUpdate;
  console.log(data[index][keyToUpdate]);
}



function removeOnArray(array, element) {
  var index = array.indexOf(element);
  
  if (index !== -1) {
    array.splice(index, 1);
  }
}

function resultNotify(icon, title, message, type) {
  $.notify({
      title: '<span style="font-size: 20px;"><i class="fa '+ icon +'" aria-hidden="true"></i> <strong>' + title + '</strong></span><br>',
      message: message,
    }, 
    {
      offset: 10,
      allow_dismiss: false,
      delay: 2000,
      type: type,
      animate: {
        enter: 'animated fadeInRight',
        exit: 'animated fadeOutRight'
      }
    });
}



// added by Cedrix (from WOS)
function sortByKey(array, key) {
  return array.sort(function(a, b) {
    var x = a[key]; var y = b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}

// new ver
function removeduplicate_2(data, key1, key2) {
  let unqObj = {}, unqArr = [];

  for (let i in data) {
    if (!unqObj[`${data[i][key1]} - ${data[i][key2]}`]) {
      unqObj[`${data[i][key1]} - ${data[i][key2]}`] = data[i];
      unqArr.push(data[i]);
    }
  }

  return unqArr;
}

function removeduplicate_3(data, key1, key2, key3) {
  let unqObj = {}, unqArr = [];

  for (let i in data) {
    if (!unqObj[`${data[i][key1]} - ${data[i][key2]} - ${data[i][key3]}`]) {
      unqObj[`${data[i][key1]} - ${data[i][key2]} - ${data[i][key3]}`] = data[i];
      unqArr.push(data[i]);
    }
  }

  return unqArr;
}

function removeduplicate_1(data, key1) {
  let unqObj = {}, unqArr = [];

  for (let i in data) {
    if (!unqObj[`${data[i][key1]}`]) {
      unqObj[`${data[i][key1]}`] = data[i];
      unqArr.push(data[i]);
    }
  }

  return unqArr;
}