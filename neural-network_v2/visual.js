var NetworkVisualizer = (function(config) {
    /*
     * Network Drawing Class
     */

    var NV = function(c, e) {
        this.canvas = c;
        this.layers = e;
        this.node = [];
        this.fibers = [];
        this.label = [];
        this.biasFibers = [];
    };
   
    
    NV.prototype.addLayerLabel = function(text, layerIndex, neuronNum){
        var layerNum = this.layers.length;
        var width = this.canvas.width, height = this.canvas.height;
        var margin = config.margin;
        var size = Math.min(20, (height - margin) / 2.5 / neuronNum);
        var cx = margin + layerIndex * (width - margin * 2) / (layerNum - 1);
        var cy = height / 2 + (-2/3 - (neuronNum - 1) / 2) * (size * 2.5);
        
        return this.canvas.text(cx, cy, text);
    };

    NV.prototype.spawnNode = function(layerIndex, index, color, text, neuronNum) {
        var layerNum = this.layers.length;
        var width = this.canvas.width, height = this.canvas.height;
        var margin = config.margin;
        var size = Math.min(20, (height - margin) / 2.5 / neuronNum);
        var cx = margin + layerIndex * (width - margin * 2) / (layerNum - 1);
        var cy = height / 2 + (index - (neuronNum - 1) / 2) * (size * 2.5);
        return [this.canvas.circle(cx, cy, size).attr({ 'stroke': color, 'stroke-width': '2' }),
            this.canvas.text(cx, cy, text).attr({ 'fill': color, 'font-size': size * 0.7 })];
    };

    NV.prototype.createNodes = function() {
        for (var i = 0; i < this.layers.length; ++i) {
            var neuronNum = this.layers[i].num_neurons || this.layers[i].num_classes || this.layers[i].out_depth;
            if(i < this.layers.length - 1) { // Insert bias neuron excluding the last layer
              neuronNum++;
            }
            this.node[i] = Array(neuronNum);
            this.label[i] = Array(neuronNum);
            for (var j = 0; j < neuronNum; ++j) {
                var color = (1 <= i && i <= this.layers.length - 2) ? '#666' : '#000';
                var retval;
                if(j < neuronNum - 1 || i === this.layers.length - 1) { // not a bias
                  retval = this.spawnNode(i, j, color, '###', neuronNum);
                } else { // bias
                  retval = this.spawnNode(i, j, '#FFF', '1', neuronNum);
                  retval[0].attr({'fill' : '#000'});
                  retval[1].attr({'fill' : '#FFF'});
                }
                this.node[i][j] = retval[0];
                this.label[i][j] = retval[1];
            }
            var type = this.layers[i].type === 'fc' ? this.layers[i].activation : this.layers[i].type;
            this.addLayerLabel(type, i, neuronNum);
        }
    };

    NV.prototype.connect = function(from, to) {
        return this.canvas.path(
            Raphael.format('M{0},{1}L{2},{3}',
                from.attr('cx') + from.attr('r') + 2,
                from.attr('cy'),
                to.attr('cx') - to.attr('r') - 2,
                to.attr('cy')
            )
        ).attr('stroke', '#AAA');
    };

    NV.prototype.connectAll = function() {
        var node = this.node, fibers = this.fibers;
        for (var w = 0; w < node.length - 1; ++w) {
            fibers[w] = Array(node[w]);
            for (var i = 0; i < node[w].length; ++i) {
                fibers[w][i] = Array(node[w + 1]);
                for (var j = 0; j < node[w + 1].length; ++j) {
                  if(j < node[w + 1].length - 1 || w === node.length - 2) // not a bias neuron
                    fibers[w][i][j] = this.connect(node[w][i], node[w + 1][j]);
                }
            }
        }
    };

    NV.prototype.clearAll = function() {
        this.canvas.clear();
    };

    return NV;
})({
    margin: 70
});


var VisualizerController = (function() {
    /*
     * Glues NeuralNetwork to NetworkVisualizer
     */

    function VC(nn, visualizer) {
        this.network = nn;
        this.visualizer = visualizer;
    }

    VC.prototype.applyWeight = function(index, weightObj) {
      var fibers = this.visualizer.fibers[index];
      var biases = weightObj.biases, filters = weightObj.filters;
      
      // filtering neuron
      for(var from = 0; from < weightObj.num_inputs; from++){
        for(var to = 0; to < weightObj.out_depth; to++){
          fibers[from][to].attr(
            this.getFiberAttr(filters[to].w[from])
          );
        }
      }
      // bias neuron
      for(var to = 0; to < weightObj.out_depth; to++){
        fibers[weightObj.num_inputs][to].attr(
          this.getFiberAttr(biases.w[to])
        );
      }
    };

    VC.prototype.applyActivation = function(index, weightObj) {
      var nodes = this.visualizer.node[index];
      var labels = this.visualizer.label[index];
      for (var i = 0; i < weightObj.out_act.depth; ++i) {
          var act = weightObj.out_act.w[i];
          labels[i].attr('text', act.toFixed(2));
          nodes[i].attr(
            'fill', Raphael.hsb2rgb(0, 0, Math.max(Math.min(1 - act,1),0))
          );
          labels[i].attr(
            'fill', Raphael.hsb2rgb(0, 0, act > 0.5 ? 1 : 0)
          );
      }
    };

    VC.prototype.getFiberAttr = function(weight) {
        return {
            'stroke' : weight >= 0 ? '#FF7F7F' : '#7f7fFF',
            'stroke-dasharray' : weight >= 0 ? '' : '-',
            'stroke-width' : Math.sqrt(Math.abs(weight))
        };
    };
    
    VC.prototype.applyNetwork = function(net){
      net = net || this.network;
      var layers = net.layers;
      var layerCount = 0; connectCount = 0;
      for(var layerIndex = 0; layerIndex < layers.length; layerIndex++){
        var layer = layers[layerIndex];
        if(layer.layer_type === "fc") {
          this.applyWeight(connectCount, layer);
          connectCount++;
        } else {
          this.applyActivation(layerCount, layer);
          layerCount++;
        }
      }
    };

    return VC;
})();