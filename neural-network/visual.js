var NetworkVisualizer = (function(config) {
    /*
     * Network Drawing Class
     */

    var NV = function(c, e) {
        this.canvas = c;
        this.elements = e;
        this.node = [];
        this.fibers = [];
        this.label = [];
        this.biasFibers = [];
    };

    NV.prototype.spawnNode = function(layer, index, color, text) {
        var layerNum = this.elements.length, elemsNum = this.elements[layer];
        var width = this.canvas.width, height = this.canvas.height;
        var margin = config.margin;
        var size = Math.min(20, (height - margin) / 2.5 / this.elements[layer]);
        var cx = margin + layer * (width - margin * 2) / (layerNum - 1);
        var cy = height / 2 + (index - (elemsNum - 1) / 2) * (size * 2.5);
        return [this.canvas.circle(cx, cy, size).attr({ 'stroke': color, 'stroke-width': '2' }),
            this.canvas.text(cx, cy, text).attr({ 'fill': color, 'font-size': size * 0.7 })];
    };

    NV.prototype.createNodes = function(elems) {
        for (var i = 0; i < this.elements.length; ++i) {
            this.node[i] = Array(this.elements[i]);
            this.label[i] = Array(this.elements[i]);
            for (var j = 0; j < this.elements[i]; ++j) {
                var color = (1 <= i && i <= this.elements.length - 2) ? '#666' : '#000';
                var retval = this.spawnNode(i, j, color, '###');
                this.node[i][j] = retval[0];
                this.label[i][j] = retval[1];
            }
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

    VC.prototype.applyWeight = function() {
        var node = this.visualizer.node;
        for (var l = 0; l < node.length - 1; ++l) {
            for (var i = 0; i < node[l].length; ++i) {
                for (var j = 0; j < node[l + 1].length; ++j) {
                    this.visualizer.fibers[l][i][j].attr(
                        this.getFiberAttr(this.network.weights[l][i][j])
                    );
                }
            }
        }
    };

    VC.prototype.applyActivation = function(weight) {
        var node = this.visualizer.node;
        for (var l = 0; l < node.length; ++l) {
            for (var i = 0; i < node[l].length; ++i) {
                this.visualizer.label[l][i].attr('text', this.network.activations[l][i].toFixed(2));
                if (l === node.length - 1 || l === 0) {
                    this.visualizer.node[l][i].attr(
                        'fill', Raphael.hsb2rgb(0, 0, 1 - this.network.activations[l][i])
                    );
                    this.visualizer.label[l][i].attr(
                        'fill', Raphael.hsb2rgb(0, 0, this.network.activations[l][i] > 0.5 ? 1: 0)
                    );
                }
            }
        }
    };

    VC.prototype.getFiberAttr = function(weight) {
        return {
            'stroke' : weight >= 0 ? '#FF7F7F' : '#7f7fFF',
            'stroke-dasharray' : weight >= 0 ? '' : '-',
            'stroke-width' : Math.sqrt(Math.abs(weight))
        };
    };

    return VC;
})();

