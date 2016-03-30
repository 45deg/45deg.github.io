var LayerEditor = {
  setData : function(layers){
    var table = $('#layereditor tbody');
    table.empty();
    layers.forEach(function(layer){
      var tr = $('<tr>');
      tr.data(layer);
      if(layer.type === 'fc') { // middle layers
        // Activation Type
        var typeCell = $('<td><select>');
        var select = typeCell.find('select');
        select.on('change',function(){
          layer.activation = $('option:selected',this).text();
          tr.data(layer);
          LayerEditor.applyToNetwork();
        });
        ['sigmoid','tanh','relu','maxout'].forEach(function(method){
          var option = $('<option>');
          option.html(method);
          if(method === layer.activation) {
            option.attr('selected', 'selected');
          }
          select.append(option);
        });
        tr.append(typeCell);
        // Num of Layers
        var numCell = $('<td><input type="number" min="1" max="100" step="1">');
        var input = numCell.find('input');
        input.val(layer.num_neurons);
        input.on('change', function(){
          layer.num_neurons = $(this).val() | 0;
          tr.data(layer);
          LayerEditor.applyToNetwork();
        });
        tr.append(numCell);
        
        tr.append('<td><span class="glyphicon glyphicon-remove del">');
        $('.del', tr).on('click', function(){
          tr.remove();
          LayerEditor.applyToNetwork();
        });
      } else if(layer.type === 'softmax' || layer.type === 'svm'){
        // Regression Type
        var typeCell = $('<td><select>');
        var select = typeCell.find('select');
        select.on('change',function(){
          layer.type = $('option:selected',this).text();
          tr.data(layer);
          LayerEditor.applyToNetwork();
        });
        ['softmax','svm'].forEach(function(method){
          var option = $('<option>');
          option.html(method);
          if(method === layer.type) {
            option.attr('selected', 'selected');
          }
          select.append(option);
        });
        tr.append(typeCell);
        tr.append('<td>' + layer.num_classes + '</td><td></td>');
      } else if(layer.type === 'input') {
        tr.append('<td>input</td><td>' + layer.out_depth + '</td><td></td>');
      } else if(layer.type === 'regression'){
        tr.append('<td>regression</td><td>' + layer.num_neurons + '</td><td></td>');
      }
      table.append(tr);
    });
  },
  getData : function(){
    return $('#layereditor tbody tr').map(function(){
      return $(this).data();
    }).toArray();
  },
  applyToNetwork : function(){
    var num = $('#demos option:selected').val() | 0;
    demo.deinit();
    demo = new Demos[num](LayerEditor.getData());
  }
};

$(document).ready(function() {

  function deepCopy(data){
    return JSON.parse(JSON.stringify(data));  
  }     
  
  $('#add').on('click', function(){
    var layers = LayerEditor.getData();
    if(layers.length > 2) {
      var last = layers.pop();
      if(layers[layers.length-1].type !== 'fc') throw 'ERROR! Invalid Layers';
      layers.push(deepCopy(layers[layers.length-1]));
      layers.push(last);
    } else {
      var last = layers.pop();
      layers.push({type:'fc', num_neurons:5, activation:'relu'});
      layers.push(last);
    }
    LayerEditor.setData(layers);
    LayerEditor.applyToNetwork();
  });
});